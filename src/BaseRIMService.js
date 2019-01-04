/* Base RIM Service - Basic service for managing RIM object collections */
import { List, Map, fromJS } from 'immutable'
import config from './Configuration'
import verbs from './ReduxVerbs'
import status from './ReduxAsyncStatus'
import serviceReducers from './ServiceReducer'
import execute from './ExecuteRestAPICall'

const CURRENT_ID = 'CURRENT_ID'
const EDITING_ID = 'EDITING_ID'
const ERROR = 'ERROR'
const OBJECT_MAP = 'OBJECT_MAP'
const REVERT_TO = 'REVERT_TO'
const SEARCH_DATA = 'SEARCH_DATA'
const SEARCH_RESULTS = 'SEARCH_RESULTS'

const globalVerbs = {
  [verbs.LOGIN]: true,
  [verbs.LOGOUT]: true,
  [verbs.HYDRATE]: true
}

export default class BaseRIMService {
  constructor(rimClass) {
    this._state = this.getInitialState()
    this._objectClass = rimClass
    this._defaultCollectionPath = rimClass.name + 's'
    this._defaultApiPath = rimClass.name + 's'
    this.reducer = this.reducer.bind(this)
  }

  static _ObjectMap = OBJECT_MAP
  static _CurrentId = CURRENT_ID
  static _EditingId = EDITING_ID
  static _RevertTo = REVERT_TO
  static _SearchData = SEARCH_DATA
  static _SearchResults = SEARCH_RESULTS
  static _Error = ERROR

  // Override to customize behavior after logout
  afterLogoutSuccess (state) {
    return state
  }

  clearError() {
    return this._state.has(ERROR)
      ? this.setState(this._state.delete(ERROR))
      : this._state
  }

  deleteId (id) {
    return this._state.get(CURRENT_ID) === id
      ? this.setState(this._state.deleteIn([OBJECT_MAP, id]).set(CURRENT_ID, undefined))
      : this.setState(this._state.deleteIn([OBJECT_MAP, id]))
  }

  emptyState () {
    return this.setState(this.getInitialState())
  }

  getApiCollectionPath () {
    return config.getCollectionApiPath
      ? config.getCollectionApiPath(this._objectClass.name)
      : this._defaultCollectionPath
  }

  getApiPath (verb, obj) {
    let result = undefined
    // If the application configuration supplied a method for customizing
    // the API url, try it with this verb & object
    if (config.getApiPath) {
      result = config.getApiPath(verb, obj)
    }
    // If the customization yielded a URL, we're done, so return it
    if (result) { return result }
    result = '/' + this._defaultApiPath
    switch (verb) {
      case verbs.READ:
      case verbs.DELETE:
      case verbs.UPDATE:
        result += '/' + obj.getId()
        break
      case verbs.SEARCH:
        // In this case, obj is the text to search
        result += '?search_text=' + obj
    }
    /* istanbul ignore if - This is debug code only and should be stripped in production */
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_LEVEL >= 1) {
      console.log(`BaseRIMService: getApiPath() returning ${result} for ${verb} on ${obj.getId ? obj.getId() : obj}`)
    }
    return result
  }

  getById (id) {
    return this._state.getIn([OBJECT_MAP, id])
  }

  getCurrent () {
    return this._state.get(CURRENT_ID)
      ? this.getById(this._state.get(CURRENT_ID))
      : undefined
  }

  getCurrentId () {
    return this._state.get(CURRENT_ID)
  }

  getEditingId () {
    return this._state.get(EDITING_ID)
  }

  getInitialState () {
    return new Map({
      [BaseRIMService._ObjectMap]: Map({}),
      [BaseRIMService._CurrentId]: undefined,
      [BaseRIMService._EditingId]: undefined,
      [BaseRIMService._RevertTo]: undefined,
      [BaseRIMService._SearchData]: Map({}),
      [BaseRIMService._SearchResults]: List([])
    })
  }

  getObjectClass () {
    return this._objectClass
  }

  getObjectMap () {
    return this._state.get(OBJECT_MAP)
  }

  getObjectArray () {
    return this._state.get(OBJECT_MAP).toList().toArray()
  }

  getSearchResults () {
    return this._state.get(SEARCH_RESULTS).toArray()
  }

  // Get the current state
  getState () {
    return this._state
  }

  reducer (state = this._objectClass.getInitialState
      ? this._objectClass.getInitialState()
      : this.getInitialState(), action) {

    /* istanbul ignore if - development only debug functionality */
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_LEVEL >= 2) {
      console.log('BaseRIMService.reducer action is', action)
    }

    // First step, determine if any reducing actions are required
    // - If the action.rimObj class matches the service object
    //   class, we probably have work too
    // - If the status is FETCH_SUCCESS and verb is Login, 
    //   Logout, or Hydrate then we likely have work
    if (!action.rimObj || 
        (action.rimObj.constructor !== this.getObjectClass() &&
         typeof action.rimObj !== 'string' &&
        action.status !== status.SUCCESS &&
        !(action.verb in globalVerbs))) {
      return state
    }

    // If the verb for this action is not in serviceReducers,
    // we also have no work, so return state
    if (!(action.verb in serviceReducers)) {
      return state
    }

    // OK, there is a serviceReducer for this action, and the
    // action affects this service, so let's reduce it
    return this.setState(serviceReducers[action.verb](state, this, action))
  }

  isCreating () {
    return this._state.hasIn([OBJECT_MAP, this._objectClass._NewID])
  }

  isFetching (obj) {
    if (typeof obj === "string") {
      // This use case is for the search action, which does not require a RIMObject
      // If a search is in flight from this service, the SEARCH_DATA map will have
      // a fetching property
      return this._state.hasIn([SEARCH_DATA, 'fetching'])
    }
    else if (obj.isFetching) { return obj.isFetching() }
    /* istanbul ignore next - This is debug code only and should be stripped in production */
    else if (process.env.NODE_ENV !== 'production') {
      throw new Error(`BaseRIMService: ${this._objectClass.name} isFetching(): invalid argument: `, obj)
    }
  }

  read (rimObj, nextPath = undefined) {
    return execute(this, verbs.READ, 'GET', rimObj, nextPath)
  }

  saveNew (rimObj, nextPath = undefined) {
    return execute(this, verbs.SAVE_NEW, 'POST', rimObj, nextPath)
  }

  saveUpdate (rimObj, nextPath = undefined) {
    return execute(this, verbs.SAVE_UPDATE, 'PUT', rimObj, nextPath)
  }

  commitDelete (rimObj, nextPath = undefined) {
    return execute(this, verbs.DELETE, 'DELETE', rimObj, nextPath)
  }

  search (searchText, nextPath = undefined) {
    return execute(this, verbs.SEARCH, 'GET', searchText, nextPath)
  }

  setById (rimObj) {
    return this.setState(this._state.setIn([OBJECT_MAP, rimObj.getId()], rimObj))
  }

  // Set the given object as current
  setCurrent (rimObj) {
    return this.setState(this._state.set(CURRENT_ID, rimObj.getId())
                                    .setIn([OBJECT_MAP, rimObj.getId()], rimObj))
  }

  // Set the current ID for the service
  setCurrentId (id) {
    return this.setState(this._state.set(CURRENT_ID, id))
  }

  setEditing (rimObj) {
    return this.setState(this._state.set(EDITING_ID, rimObj.getId())
                                    .setIn([OBJECT_MAP, rimObj.getId()], rimObj))
  }

  // Set the editing ID for the service
  setEditingId (id) {
    return this.setState(this._state.set(EDITING_ID, id))
  }

  setError(name, message) {
    return this.setState(this._state.set(ERROR, Map({name, message}) ) )
  }

  setState (state) {
    this._state = state
    return state
  }

  // The object here is to update any properties in the searchObject
  // that were changed in the rimObject during an update to rimObject
  updateSearchObject(searchObject, rimObject) {
    const jsSearchObject = searchObject.toJS()
    const jsRIMObject = rimObject.getData().toJS()
    for (var prop in jsSearchObject) {
      if (jsSearchObject.hasOwnProperty(prop) && prop in jsRIMObject) {
        jsSearchObject[prop] = jsRIMObject[prop]
      }
    }
    return fromJS(jsRIMObject)
  }
}