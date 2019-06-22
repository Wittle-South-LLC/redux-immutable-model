/* BaseServiceReducers.js - Shared reducers */

import status from "./ReduxAsyncStatus"     // Defines the possible status values for async calls

const reduceCancelDelete = (state, service, action) => {
  return service.setDeleting(undefined)
}

const reduceCancelEdit = (state, service, action) => {
  const newState = service.setById(state.get(service.constructor._RevertTo))
                          .set(service.constructor._EditingId, undefined)
                          .set(service.constructor._RevertTo, undefined)
  return service.setState(newState)
}

const reduceCancelNew = (state, service, action) => {
  service.setEditing(undefined)
  return service.delete(action.rimObj)
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
    case status.SUCCESS: return sharedHydrateSuccess(state, service, action)
    /* istanbul ignore next */
    default: return sharedDefaultHandler(state, action)
  }
}

const reduceLogin = (state, service, action) => {
  switch(action.status) {
    case status.START: return sharedStartHandler(service, action)
    /* istanbul ignore next - same code is covered by hydrate testing */
    case status.ERROR: return sharedErrorHandler(service, action)
    case status.SUCCESS: return sharedHydrateSuccess(state, service, action)
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

const reduceStartDelete = (state, service, action) => {
  return service.setDeleting(action.rimObj)
}

const reduceStartEdit = (state, service, action) => {
  const newState = service.setEditing(action.rimObj)
                          .set(service.constructor._RevertTo, action.rimObj)
  return service.setState(newState) 
}

const reduceToggleSelected = (state, service, action) => {
  return service.isSelected(action.rimObj)
    ? service.clearSelected(action.rimObj)
    : service.setSelected(action.rimObj)
}

// This implementation of start reducing is shared across many verbs
// All it is going to do is set the fetching indicator on the
// action.rimObj
export const sharedStartHandler = (service, action) => {
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
export const sharedErrorHandler = (service, action) => {
  console.log('redux-immutable-model.sharedErrorHandler: action is ', action)
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
export const sharedDefaultHandler = (state, action) => {
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    throw Error(`Invalid status ${action.status} for verb ${action.verb}`)
  }
  /* istanbul ignore next */
  return state
}

const sharedHydrateSuccess = (state, service, action) => {
  const myClass = service.getObjectClass()
  const items = action.receivedData[service.getApiCollectionPath()]
  /* istanbul ignore else */
  if (items) {
    // We only initialize state if we got relevant data. If more than
    // one service is present, hydrate will be called for each service,
    // and we want to preserve state during events for other services
    let newState = service.getInitialState()
    for (var i = 0, iLen = items.length; i < iLen; i++) {
      newState = service.setById(new myClass(items[i]))
    }
    return newState
  }
  return state
}

export function getBaseReducers(verbs) {
  return {
    [verbs.CANCEL_DELETE]: reduceCancelDelete,
    [verbs.CANCEL_EDIT]: reduceCancelEdit,
    [verbs.CANCEL_NEW]: reduceCancelNew,
    [verbs.CREATE_NEW]: reduceCreateNew,
    [verbs.EDIT]: reduceEdit,
    [verbs.HYDRATE]: reduceHydrate,
    [verbs.LOGIN]: reduceLogin,
    [verbs.LOGOUT]: reduceLogout,
    [verbs.READ]: reduceRead,
    [verbs.START_DELETE]: reduceStartDelete,
    [verbs.START_EDIT]: reduceStartEdit,
    [verbs.TOGGLE_SELECTED]: reduceToggleSelected
  }
}
