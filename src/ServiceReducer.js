/* ServiceReducer.js - Reducer for BaseRIMService */

import verbs from "./ReduxVerbs"            // Defines the verb which can be reduced
import status from "./ReduxAsyncStatus"     // Defines the possible status values for async calls

// Primary export, a method lookup object
const serviceReducers = {
  [verbs.COMMIT_DELETE]: reduceCommitDelete,
  [verbs.HYDRATE]: reduceHydrate,
  [verbs.LOGIN]: reduceLogin,
  [verbs.LOGOUT]: reduceLogout,
  [verbs.READ]: reduceRead,
  [verbs.SAVE_NEW]: reduceSaveNew,
  [verbs.SAVE_UPDATE]: reduceSaveUpdate,
  [verbs.SEARCH]: reduceSearch
}

const reduceCommitDelete = (service, action) => {
  switch(action.status) {
    case status.START: return sharedStartHandler(service, action)
    case status.ERROR: return sharedErrorHandler(service, action)
    case status.SUCCESS:
      // Now if search results contain the same entity, delete it from there as well
      let delSearchIndex = state.get(service._SearchResults)
                                .findIndex((o) => o.get(Service.getObjectClass()._IdentityKey) === action.rimObj.getId())
      let delState = state
      if (delSearchIndex >= 0) {
        delState = delState.deleteIn([service._SearchResults, delSearchIndex])
      }
      // If we can delete the object from data, then do so. If not, make sure it is not
      // marked as fetching, since the delete is done.
      if (service.getObjectClass().canDeleteFromData()) {
        delState = service.delete(action.rimObj)
      } else {
        delState = service.setById(action.rimObj.setFetching(false))
      }
    return delState
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceHydrate = (state, service, action) => {
  switch(action.status) {
    case status.START: return sharedStartHandler(service, action)
    case status.ERROR: return sharedErrorHandler(service, action)
    case status.SUCCESS: return sharedHydrate(service, action)
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceLogin = (state, service, action) => {
  switch(action.status) {
    case status.START: return sharedStart(service, action)
    case status.ERROR: return sharedError(service, action)
    case status.SUCCESS: return sharedHydrate(service, action)
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceLogout = (state, service, action) => {
  switch(action.status) {
    case status.START: return sharedStart(service, action)
    case status.ERROR: return sharedError(service, action)
    case status.SUCCESS:
      // Object class can override default behavior of logout state, in case
      // application requires some content (e.g. domain objects in a new state)
      let logoutState = service.getInitialState()
      if (service.getObjectClass().afterLogoutSuccess) {
        logoutState = service.getObjectClass().afterLogoutSuccess(logoutState)
      }
      return logoutState
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceRead = (state, service, action) => {
  switch(action.status) {
    case status.START: return sharedStartHandler(service, action)
    case status.ERROR: return sharedErrorHandler(service, action)
    case status.SUCCESS:
      const myClass = service.getObjectClass()
      return service.setById(new myClass(action.receivedData))
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceSaveNew = (state, service, action) => {
  switch(action.status) {
    case status.START: return sharedStartHandler(service, action)
    case status.ERROR: return sharedErrorHandler(service, action)
    case status.SUCCESS:
      // Assumption here is that object IDs are assigned server-side, and
      // the assigned ID is returned in response to a create
      let idKey = service.getObjectClass()._IdentityKey
      let newObj = action.rimObj.setFetching(false).setDirty(false).setNew(false)
                                .updateField(idKey, action.receivedData[idKey])
      // Allows for post-processing of the object after creation
      if (newObj.afterCreateSuccess) {
        newObj = newObj.afterCreateSuccess(action.receivedData)
      }
      // When creating an object, the ID changes fron an initial ID
      // defined in the RIMObject child class to an ID assigned
      // by the server, so we need to delete the object at the old ID
      // and set the current object to the new ID
      service.delete(action.rimObj)
      service.setEditingId(undefined)
      return service.setById(newObj)
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceSaveUpdate = (state, service, action) => {
  switch(action.status) {
    case status.START: return sharedStartHandler(service, action)
    case status.ERROR: return sharedErrorHandler(service, action)
    case status.SUCCESS:
      // First update the object in the domain structure
      let updObj = action.rimObj.afterUpdateSuccess
        ? action.rimObj.setFetching(false).setDirty(false).afterUpdateSuccess(action.receivedData)
        : action.rimObj.setFetching(false).setDirty(false)
      let newState = service.setById(updObj).setEditingId(undefined)
      // Now if this class allows editing of search results, update the
      // search result object that has the same identity
      if (service.updateSearchEdit) {
        let editIndex = state.get(service._SearchResults)
                             .findIndex((o) => o.get(Service.getObjectClass()._IdentityKey) === action.rimObj.getId())
        if (editIndex >= 0) {
          newState = newState.setIn([service._SearchResults, editIndex],
                                    service.updateSearchEdit(newState.getIn([service._SearchResults, editIndex]), action.rimObj))
          }
        }
        return newState
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceSearch = (state, service, action) => {
  switch(action.status) {
    case status.START:
      return state.set(service._SearchResults, List([])).setIn([service._SearchData, 'fetching'], true)
    case status.ERROR:
      return state.deleteIn([service._SearchData, 'fetching'])
    case status.SUCCESS:
      let res = List([])
      for (let u of action.receivedData) {
        res = res.push(fromJS(u))
      }
      return state.set(service._SearchResults, res).deleteIn([service._SearchData, 'fetching'])
    default: return sharedDefault(state, action)
  }
}

// This implementation of start reducing is shared across many verbs
// All it is going to do is set the fetching indicator on the
// action.rimObj
const sharedStartHandler = (service, action) => {
  if (process.env.NODE_ENV !== 'production') {
    if (!action.rimObj) { throw Error('sharedStart: No rimObj in action') }
    if (!service.getById(action.rimObj.getId())) { throw Error('sharedStart: rimObj not in service') }
  }
  return service.setById(action.rimObj.setFetching(true))
}

// This implementation of error reducing is shared across many verbs
// All it is going to do is clear the fetching indicator on the
// action.rimObj; actual error reporting is handled separately
const sharedErrorHandler = (service, action) => {
  if (process.env.NODE_ENV !== 'production') {
    if (!action.rimObj) {
      throw Error(`sharedError for ${action.verb}: No rimObj in action`) }
    if (!service.getById(action.rimObj.getId())) { 
      throw Error(`sharedError for ${action.verb}: rimObj with id ${action.rimObj.getId()} not in service`) 
    }
  }
  return service.setById(action.rimObj.setFetching(false))
}

// We should not see reducers called with action verbs and invalid
// or missing status values, if we do then except
const sharedDefaultHandler = (state, action) => {
  if (process.env.NODE_ENV !== 'production') {
    throw Error(`Invalid status ${action.status} for verb ${action.verb}`)
  }
  return state
}

const sharedHydrate = (service, action) => {
  let newState = service.getInitialState()
  const myClass = service.getObjectClass()
  const items = action.receivedData[myClass.getHydratePath()]
  if (items) {
    for (var i = 0, iLen = items.length; i < iLen; i++) {
      newState = this.setById(new myClass(items[i]))
    }
  }
  return newState
}

export default serviceReducers
