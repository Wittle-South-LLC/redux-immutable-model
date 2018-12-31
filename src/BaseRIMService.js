/* Base RIM Service - Basic service for managing RIM object collections */
import { List, Map } from 'immutable'
import verbs from './ReduxVerbs'
import status from './ReduxAsyncStatus'
import serviceReducers from './ServiceReducer'
import execute from './ExecuteRestAPICall'

const OBJECT_MAP = 'OBJECT_MAP'
const CURRENT_ID = 'CURRENT_ID'
const EDITING_ID = 'EDITING_ID'
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
    this.reducer = this.reducer.bind(this)
  }

  static _ObjectMap = OBJECT_MAP
  static _CurrentId = CURRENT_ID
  static _EditingId = EDITING_ID
  static _RevertTo = REVERT_TO
  static _SearchData = SEARCH_DATA
  static _SearchResults = SEARCH_RESULTS

  deleteId (id) {
    return this._state.get(CURRENT_ID) === id
      ? this.setState(this._state.deleteIn([OBJECT_MAP, id]).set(CURRENT_ID, undefined))
      : this.setState(this._state.deleteIn([OBJECT_MAP, id]))
  }

  emptyState () {
    return this.setState(this.getInitialState())
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
      [BaseRIMService._SearchResult]: List([])
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

    // First step, determine if any reducing actions are required
    // - If the action.rimObj class matches the service object
    //   class, we probably have work too
    // - If the status is FETCH_SUCCESS and verb is Login, 
    //   Logout, or Hydrate then we likely have work
    if (!action.rimObj || 
        (action.rimObj.constructor !== this.getObjectClass() &&
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

  read (rimObj, nextPath = undefined) {
    return execute(rimObj, 'GET', verbs.READ, nextPath)
  }

  saveNew (rimObj, nextPath = undefined) {
    return execute(rimObj, 'POST', verbs.SAVE_NEW, nextPath)
  }

  saveUpdate (rimObj, nextPath = undefined) {
    return execute(rimObj, 'PUT', verbs.SAVE_UPDATE, nextPath)
  }

  commitDelete (rimObj, nextPath = undefined) {
    return execute(rimObj, 'DELETE', verbs.COMMIT_DELETE, nextPath)
  }

  search (nextPath = undefined) {
    // NEEDS FIXING
    return execute(this._state.get(this._searchData), nextPath)
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

  setState (state) {
    this._state = state
    return state
  }
}