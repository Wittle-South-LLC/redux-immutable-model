/* SimpleServiceReducers.js - Reducers for Simple object service */

import { fromJS, List } from 'immutable'    // We will be directly creating immutable objects in search results
import status from "./ReduxAsyncStatus"     // Defines the possible status values for async calls
import { getBaseReducers, sharedDefaultHandler,
         sharedErrorHandler, sharedStartHandler } from './BaseServiceReducers'

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
      service.delete(action.rimObj)
      service.setState(service.setEditing(undefined))
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
      newState = service.setEditing(undefined)
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

export default function getSimpleReducers(verbs) {
  const result = getBaseReducers(verbs)
  result[verbs.DELETE] = reduceCommitDelete
  result[verbs.SAVE_NEW] = reduceSaveNew
  result[verbs.SAVE_UPDATE] = reduceSaveUpdate
  result[verbs.SEARCH] = reduceSearch
  return result
}
