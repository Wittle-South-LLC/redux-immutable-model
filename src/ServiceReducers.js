/* ServiceReducers.js - Reducer for BaseRIMService */

import { fromJS, List } from 'immutable'    // We will be directly creating immutable objects in search results
import status from "./ReduxAsyncStatus"     // Defines the possible status values for async calls

const reduceCancelDelete = (state, service, action) => {
  return service.setDeletingId(undefined)
}

const reduceCancelEdit = (state, service, action) => {
  const newState = service.setById(state.get(service.constructor._RevertTo))
                          .set(service.constructor._EditingId, undefined)
                          .set(service.constructor._RevertTo, undefined)
  return service.setState(newState)
}

const reduceCancelNew = (state, service, action) => {
  service.setEditingId(undefined)
  return service.deleteId(service.getObjectClass()._NewID)
}

const reduceCommitDelete = (state, service, action) => {
  switch(action.status) {
    case status.START: return sharedStartHandler(service, action)
    /* istanbul ignore next - same code is covered by hydrate testing */
    case status.ERROR: return sharedErrorHandler(service, action)
    case status.SUCCESS:
      // Now if search results contain the same entity, delete it from there as well
      let delSearchIndex = state.get(service.constructor._SearchResults)
                                .findIndex((o) => o.get(service.getObjectClass()._IdentityKey) === action.rimObj.getId())
      let delState = state
      if (delSearchIndex >= 0) {
        delState = delState.deleteIn([service.constructor._SearchResults, delSearchIndex])
      }
      // If we can delete the object from data, then do so. If not, make sure it is not
      // marked as fetching, since the delete is done.
      if (service.getObjectClass().canDeleteFromData()) {
        delState = delState.deleteIn([service.constructor._ObjectMap, action.rimObj.getId()])
      } else {
        delState = delState.setIn([service.constructor._ObjectMap, action.rimObj.getId()],action.rimObj.setFetching(false))
      }
    return delState.set(service.constructor._DeletingId, undefined)
    /* istanbul ignore next */
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceCreateNew = (state, service, action) => {
  const objClass = service.getObjectClass()
  // If class has static initializer for new objects, use it
  let newObj = objClass.afterNewSuccess
    ? objClass.afterNewSuccess(new objClass({}, false, false, true), action)
    : new objClass({}, false, false, true)
  return service.setEditing(newObj)
}

const reduceEdit = (state, service, action) => {
  return service.setById(action.rimObj.updateField(action.fieldName, action.fieldValue))
}

const reduceHydrate = (state, service, action) => {
  switch(action.status) {
    case status.START: return sharedStartHandler(service, action)
    case status.ERROR: return sharedErrorHandler(service, action)
    case status.SUCCESS: return sharedHydrateSuccess(service, action)
    /* istanbul ignore next */
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceLogin = (state, service, action) => {
  switch(action.status) {
    case status.START: return sharedStartHandler(service, action)
    /* istanbul ignore next - same code is covered by hydrate testing */
    case status.ERROR: return sharedErrorHandler(service, action)
    case status.SUCCESS: return sharedHydrateSuccess(service, action)
    /* istanbul ignore next */
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceLogout = (state, service, action) => {
  switch(action.status) {
    case status.START: return sharedStartHandler(service, action)
    /* istanbul ignore next - same code is covered by hydrate testing */
    case status.ERROR: return sharedErrorHandler(service, action)
    case status.SUCCESS:
      // Object class can override default behavior of logout state, in case
      // application requires some content (e.g. domain objects in a new state)
      let logoutState = service.getInitialState()
      /* istanbul ignore else */
      if (service.afterLogoutSuccess) {
        logoutState = service.afterLogoutSuccess(logoutState)
      }
      return service.setState(logoutState)
    /* istanbul ignore next */
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceRead = (state, service, action) => {
  switch(action.status) {
    case status.START: return sharedStartHandler(service, action)
    /* istanbul ignore next - same code is covered by hydrate testing */
    case status.ERROR: return sharedErrorHandler(service, action)
    case status.SUCCESS:
      const myClass = service.getObjectClass()
      return service.setById(new myClass(action.receivedData))
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceSaveNew = (state, service, action) => {
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_LEVEL >= 2) {
    console.log('ServiceReducers.reduceSaveNew: received action =', action)
  }
  switch(action.status) {
    case status.START: return sharedStartHandler(service, action)
    /* istanbul ignore next - same code is covered by hydrate testing */
    case status.ERROR: return sharedErrorHandler(service, action)
    case status.SUCCESS:
      // Assumption here is that object IDs are assigned server-side, and
      // the assigned ID is returned in response to a create
      let idKey = service.getObjectClass()._IdentityKey
      let newObj = action.rimObj.setFetching(false).setDirty(false).setNew(false)
                                .updateField(idKey, action.receivedData[idKey])
      // Allows for post-processing of the object after creation
      /* istanbul ignore else */
      if (newObj.afterCreateSuccess) {
        newObj = newObj.afterCreateSuccess(action.receivedData)
      }
      // When creating an object, the ID changes fron an initial ID
      // defined in the RIMObject child class to an ID assigned
      // by the server, so we need to delete the object at the old ID
      // and set the current object to the new ID
      service.deleteId(action.rimObj.getId())
      service.setEditingId(undefined)
      return service.setById(newObj)
    /* istanbul ignore next */
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceSaveUpdate = (state, service, action) => {
  switch(action.status) {
    case status.START: return sharedStartHandler(service, action)
    /* istanbul ignore next - same code is covered by hydrate testing */
    case status.ERROR: return sharedErrorHandler(service, action)
    case status.SUCCESS:
      // First update the object in the domain structure
      let updObj = action.rimObj.afterUpdateSuccess
        ? action.rimObj.setFetching(false).setDirty(false).afterUpdateSuccess(action.receivedData)
        : action.rimObj.setFetching(false).setDirty(false)
      let newState = service.setById(updObj)
      newState = service.setEditingId(undefined)
      // Now if this class allows editing of search results, update the
      // search result object that has the same identity
      /* istanbul ignore else */
      if (service.updateSearchObject) {
        let editIndex = state.get(service.constructor._SearchResults)
                             .findIndex((o) => o.get(service.getObjectClass()._IdentityKey) === action.rimObj.getId())
        if (editIndex >= 0) {
          newState = newState.setIn([service.constructor._SearchResults, editIndex],
                                    service.updateSearchObject(newState.getIn([service.constructor._SearchResults, editIndex]), action.rimObj))
          }
        }
        return newState
    /* istanbul ignore next */
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceSearch = (state, service, action) => {
  switch(action.status) {
    case status.START:
      let newState = service.clearError()
      return newState.set(service.constructor._SearchResults, List([])).setIn([service.constructor._SearchData, 'fetching'], true)
    case status.ERROR:
      newState = service.setError(action.errorMessage)
      return newState.deleteIn([service.constructor._SearchData, 'fetching'])
    case status.SUCCESS:
      let res = List([])
      for (let u of action.receivedData) {
        res = res.push(fromJS(u))
      }
      return state.set(service.constructor._SearchResults, res).deleteIn([service.constructor._SearchData, 'fetching'])
    /* istanbul ignore next */
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceStartEdit = (state, service, action) => {
  const newState = service.setEditingId(action.id)
                          .set(service.constructor._RevertTo, service.getById(action.id))
  return service.setState(newState) 
}

const reduceStartDelete = (state, service, action) => {
  return service.setDeletingId(action.id)
}

// This implementation of start reducing is shared across many verbs
// All it is going to do is set the fetching indicator on the
// action.rimObj
const sharedStartHandler = (service, action) => {
  /* istanbul ignore next */
  if (process.env.NODE_ENV !== 'production') {
    if (!action.rimObj) { throw Error('sharedStart: No rimObj in action') }
    if (!service.getById(action.rimObj.getId())) { throw Error('sharedStart: rimObj not in service') }
  }
  service.clearError()
  return service.setById(action.rimObj.setFetching(true))
}

// This implementation of error reducing is shared across many verbs
// All it is going to do is clear the fetching indicator on the
// action.rimObj; actual error reporting is handled separately
const sharedErrorHandler = (service, action) => {
  console.log('sharedErrorHandler: action is ', action)
  /* istanbul ignore next */
  if (process.env.NODE_ENV !== 'production') {
    if (!action.rimObj) {
      throw Error(`sharedError for ${action.verb}: No rimObj in action`) }
    if (!service.getById(action.rimObj.getId())) { 
      throw Error(`sharedError for ${action.verb}: rimObj with id ${action.rimObj.getId()} not in service`) 
    }
  }
  service.setError(action.errorMessage)
  return service.setById(action.rimObj.setFetching(false))
}

// We should not see reducers called with action verbs and invalid
// or missing status values, if we do then except
const sharedDefaultHandler = (state, action) => {
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    throw Error(`Invalid status ${action.status} for verb ${action.verb}`)
  }
  /* istanbul ignore next */
  return state
}

const sharedHydrateSuccess = (service, action) => {
  let newState = service.getInitialState()
  const myClass = service.getObjectClass()
  const items = action.receivedData[service.getApiCollectionPath()]
  /* istanbul ignore else */
  if (items) {
    for (var i = 0, iLen = items.length; i < iLen; i++) {
      newState = service.setById(new myClass(items[i]))
    }
  }
  return newState
}

function getDefaultReducers(verbs) {
  return {
    [verbs.CREATE_NEW]: reduceCreateNew,
    [verbs.CANCEL_DELETE]: reduceCancelDelete,
    [verbs.CANCEL_NEW]: reduceCancelNew,
    [verbs.CANCEL_EDIT]: reduceCancelEdit,
    [verbs.DELETE]: reduceCommitDelete,
    [verbs.EDIT]: reduceEdit,
    [verbs.HYDRATE]: reduceHydrate,
    [verbs.LOGIN]: reduceLogin,
    [verbs.LOGOUT]: reduceLogout,
    [verbs.READ]: reduceRead,
    [verbs.SAVE_NEW]: reduceSaveNew,
    [verbs.SAVE_UPDATE]: reduceSaveUpdate,
    [verbs.SEARCH]: reduceSearch,
    [verbs.START_DELETE]: reduceStartDelete,
    [verbs.START_EDIT]: reduceStartEdit
  }
}

export default getDefaultReducers
