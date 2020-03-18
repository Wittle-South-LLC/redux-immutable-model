/* Base RIM Service - Basic service for managing RIM object collections */
import { Map, List } from 'immutable'
import actionTypes from './ActionTypes'
import status from './ReduxAsyncStatus'
import callAPI from './ExecuteRestAPICall'

const CURRENT_ID = 'CURRENT_ID'
const DELETING_ID = 'DELETING_ID'
const EDITING_ID = 'EDITING_ID'
const SELECTED_IDS = 'SELECTED_IDS'
const ERROR = 'ERROR'
const REVERT_TO = 'REVERT_TO'

export default class BaseRIMService {

  static _CurrentId = CURRENT_ID
  static _DeletingId = DELETING_ID
  static _EditingId = EDITING_ID
  static _SelectedIds = SELECTED_IDS
  static _RevertTo = REVERT_TO
  static _Error = ERROR

  constructor(rimClass, config) {
    this._state = this.getInitialState()
    this._objectClass = rimClass
    this._defaultCollectionPath = rimClass.className + 's'
    this.name = rimClass.className + 'Service'
    this._defaultApiPath = rimClass.className.toLowerCase() + 's'
    if (rimClass._apiPrefix) {
      this._defaultApiPath = rimClass._apiPrefix + '/' + this._defaultApiPath
    }
    this._apiPrefix = rimClass._apiPrefix
    this._defaultStatePath = rimClass.className + 's'
    this.reducer = this.reducer.bind(this)
    this.config = config
  }

  // Override to customize behavior after logout
  afterLogoutSuccess (state) {
    return state
  }

  cancelDelete (nextPath = undefined) {
    const rimObj = this.getDeleting()
    if (!rimObj) {
      console.log(`ERROR: unable to find delete objet for BaseRIMService object class ${this._objectClass.className}`)
    }
    return { type: actionTypes.SYNC, verb: this.config.verbs.CANCEL_DELETE, serviceName: this.name, rimObj, nextPath }
  }

  cancelEdit (nextPath = undefined) {
    const rimObj = this.getEditing()
    if (!rimObj) {
      console.log(`ERROR: unable to find edit object for BaseRIMService object class ${this._objectClass.className}`)
    }
    return { type: actionTypes.SYNC, verb: this.config.verbs.CANCEL_EDIT, serviceName: this.name, rimObj, nextPath }
  }

  cancelNew (rimObj, nextPath = undefined) {
    return { type: actionTypes.SYNC, verb: this.config.verbs.CANCEL_NEW, serviceName: this.name, rimObj, nextPath }
  }

  clearError() {
    return this._state.has(ERROR)
      ? this.setState(this._state.delete(ERROR))
      : this._state
  }

  clearSelected (rimObj) {
    return this.setState(this._state.deleteIn([SELECTED_IDS, rimObj.getId()]))
  }

  createNew (newPath = undefined) {
    return { type: actionTypes.SYNC, verb: this.config.verbs.CREATE_NEW, serviceName: this.name, newPath }
  }

  // This method must be overridden in child classes because it is not returning
  // the results as 'this.setState()'
  delete (rimObj) {
    return this._state.get(CURRENT_ID) === rimObj.getId()
      ? this._state.set(CURRENT_ID, undefined)
      : this._state
  }

  editField (fieldName, fieldValue, rimObj) {
    return { type: actionTypes.SYNC, verb: this.config.verbs.EDIT, fieldName, fieldValue, rimObj }
  }

  emptyState () {
    return this.setState(this.getInitialState())
  }

  getApiCollectionPath () {
    return this.config.getCollectionApiPath(this._objectClass.className)
  }

  getApiPath (verb, obj) {
    let result = undefined
    // If the application configuration supplied a method for customizing
    // the API url, try it with this verb & object
    if (this.config.getApiPath) {
      result = this.config.getApiPath(verb, this._apiPrefix)
    }
    // If the customization yielded a URL, we're done, so return it
    if (result) { return result }
    result = '/' + this._defaultApiPath
    switch (verb) {
      case this.config.verbs.READ:
      case this.config.verbs.DELETE:
      case this.config.verbs.SAVE_UPDATE:
        result += '/' + obj.getId()
        break
      case this.config.verbs.SEARCH:
        // In this case, obj is the text to search
        result += '?search_text=' + obj
    }
    /* istanbul ignore if - This is debug code only and should be stripped in production */
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_LEVEL >= 1) {
      console.log(`BaseRIMService: getApiPath() returning ${result} for ${verb} on ${obj.getId ? obj.getId() : obj}`)
    }
    return result
  }

  getCurrent () {
    return this._state.get(CURRENT_ID)
      ? this.getById(this._state.get(CURRENT_ID))
      : undefined
  }

  getDeleting () {
    return this._state.get(DELETING_ID)
      ? this.getById(this._state.get(DELETING_ID))
      : undefined
  }

  getEditing () {
    return this._state.get(EDITING_ID)
      ? this.getById(this._state.get(EDITING_ID))
      : undefined
  }

  getInitialState () {
    return new Map({
      [BaseRIMService._CurrentId]: undefined,
      [BaseRIMService._DeletingId]: undefined,
      [BaseRIMService._EditingId]: undefined,
      [BaseRIMService._RevertTo]: undefined,
      [BaseRIMService._SelectedIds]: Map([])
    })
  }

  getObjectClass () {
    return this._objectClass
  }

  // Get the current state
  getState () {
    return this._state
  }

  getStatePath () {
    return this._defaultStatePath
  }

  hydrate (rimObj, nextPath = undefined) {
    return callAPI(this, this.config.verbs.HYDRATE, 'GET', rimObj, nextPath)
  }

  isDeleting () {
    return this._state.get(DELETING_ID) !== undefined
  }

  isEditing () {
    return this._state.get(EDITING_ID) !== undefined
  }

  isFetching (obj) {
    if (obj.isFetching) { return obj.isFetching() }
    else /* istanbul ignore next */ if (process.env.NODE_ENV !== 'production') {
      throw new Error(`BaseRIMService: ${this._objectClass.className} isFetching(): invalid argument: `, obj)
    }
  }

  isSelected (obj) {
    return this._state.hasIn([BaseRIMService._SelectedIds, obj.getId()])
  }

  read (rimObj, nextPath = undefined) {
    return callAPI(this, this.config.verbs.READ, 'GET', rimObj, nextPath)
  }

  reducer (state = this._objectClass.getInitialState
      ? this._objectClass.getInitialState()
      : this.getInitialState(), action) {

    /* istanbul ignore if - development only debug functionality */
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_LEVEL >= 2) {
      console.log('BaseRIMService.reducer action is', action)
    }

    // If the action is a SYNC action for a specific service, confirm it is for this one
    if (action.type === actionTypes.SYNC && action.serviceName && action.serviceName !== this.name) {
      return state
    }

    // First step, determine if any reducing actions are required
    // - If the action.rimObj class matches the service object
    //   class, we probably have work too
    // - If the status is FETCH_SUCCESS and verb is Login, 
    //   Logout, or Hydrate then we likely have work
    if ((action.rimObj && 
        (action.rimObj.constructor !== this.getObjectClass() &&
         typeof action.rimObj !== 'string')) &&
        (action.status !== status.SUCCESS ||
        !(action.verb in this.config.globalVerbs))) {
      return state
    }

    // If the verb for this action is not in serviceReducers,
    // we also have no work, so return state
    if (!this.getReducer(action.verb)) {
      return state
    }

    // OK, there is a serviceReducers for this action, and the
    // action affects this service, so let's reduce it
    return this.setState(this.getReducer(action.verb)(state, this, action))
  }

  saveNew (rimObj, nextPath = undefined) {
    return callAPI(this, this.config.verbs.SAVE_NEW, 'POST', rimObj, nextPath)
  }

  saveUpdate (rimObj, nextPath = undefined) {
    return callAPI(this, this.config.verbs.SAVE_UPDATE, 'PUT', rimObj, nextPath)
  }

  commitDelete (rimObj, nextPath = undefined) {
    return callAPI(this, this.config.verbs.DELETE, 'DELETE', rimObj, nextPath)
  }

  search (searchText, nextPath = undefined) {
    return callAPI(this, this.config.verbs.SEARCH, 'GET', searchText, nextPath)
  }

  // Set the given object as current - must be overridden by child classes
  // to update the object in the collection as well as the current ID indicator
  setCurrent (rimObj) {
    return this._state.set(CURRENT_ID, rimObj.getId())
  }

  // Set the given object as editing - must be overridden by child classes
  // to update the object in the collection as well as the editing ID indicator
  setEditing (rimObj) {
    return rimObj
      ? this._state.set(EDITING_ID, rimObj.getId())
      : this._state.set(EDITING_ID, undefined)
  }

  setDeleting (rimObj) {
    return rimObj
      ? this.setState(this._state.set(DELETING_ID, rimObj.getId()))
      : this.setState(this._state.set(DELETING_ID, undefined))
  }

  setError(message) {
    return this.setState(this._state.set(ERROR, message))
  }

  setSelected (rimObj) {
    return this.setState(this._state.setIn([SELECTED_IDS, rimObj.getId()], rimObj))
  }

  setState (state) {
    this._state = state
    return state
  }

  startDelete (rimObj) {
    return { type: actionTypes.SYNC, verb: this.config.verbs.START_DELETE, serviceName: this.name, rimObj }
  }

  startEdit (rimObj, nextPath = undefined) {
    return { type: actionTypes.SYNC, verb: this.config.verbs.START_EDIT, serviceName: this.name, rimObj, nextPath }
  }

  toggleSelected (rimObj) {
    return { type: actionTypes.SYNC, verb: this.config.verbs.TOGGLE_SELECTED, serviceName: this.name, rimObj }
  }
}