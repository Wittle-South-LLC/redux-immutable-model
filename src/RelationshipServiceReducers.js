/* RelationshipServiceReducers.js - Reducers for Relationship object service */
// Note that we're assuming there is never a reason to search for relationship
// objects, so the relationship service and reducers have no search mechanism

import status from "./ReduxAsyncStatus"     // Defines the possible status values for async calls
import { getBaseReducers, sharedDefaultHandler,
         sharedErrorHandler, sharedStartHandler } from './BaseServiceReducers'

const reduceCommitDelete = (state, service, action) => {
  switch(action.status) {
    case status.START: return sharedStartHandler(service, action)
    /* istanbul ignore next - same code is covered by hydrate testing */
    case status.ERROR: return sharedErrorHandler(service, action)
    case status.SUCCESS:
      // If we can delete the object from data, then do so. If not, make sure it is not
      // marked as fetching, since the delete is done.
      var delState = state
      if (service.getObjectClass().canDeleteFromData()) {
        delState = delState.deleteIn([service.constructor._LeftObjectMap,
                                      action.rimObj.getLeftId(),
                                      action.rimObj.getRightId()])
        delState = delState.deleteIn([service.constructor._RightObjectMap,
                                      action.rimObj.getRightId(),
                                      action.rimObj.getLeftId()])
      } else {
        const newObj = action.rimObj.setFetching(false)
        delState = delState.setIn([service.constructor._LeftObjectMap,
                                   action.rimObj.getLeftId(),
                                   action.rimObj.getRightId()], newObj)
        delState = delState.setIn([service.constructor._RightObjectMap,
                                   action.rimObj.getRightId(),
                                   action.rimObj.getLeftId()], newObj)
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
      // A relationship object will not be assigned keys when being saved, so 
      // we only need to clear new, fetching, and dirty
      let newObj = action.rimObj.setFetching(false).setDirty(false).setNew(false)
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
      service.setEditing(undefined)
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
      return newState
    /* istanbul ignore next */
    default: return sharedDefaultHandler(state, action)
  }
}

export default function getRelationshipReducers(verbs) {
  const result = getBaseReducers(verbs)
  result[verbs.DELETE] = reduceCommitDelete
  result[verbs.SAVE_NEW] = reduceSaveNew
  result[verbs.SAVE_UPDATE] = reduceSaveUpdate
  return result
}
