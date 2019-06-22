/* Simple Object Service - Collection service for SimpleRIMObjects */
import { fromJS, List, Map } from 'immutable'
import BaseRIMService from './BaseRIMService'
// import status from './ReduxAsyncStatus'

const OBJECT_MAP = 'OBJECT_MAP'
const SEARCH_DATA = 'SEARCH_DATA'
const SEARCH_RESULTS = 'SEARCH_RESULTS'

export default class SimpleObjectService extends BaseRIMService {

  static _ObjectMap = OBJECT_MAP
  static _SearchData = SEARCH_DATA
  static _SearchResults = SEARCH_RESULTS

  constructor(rimClass, config) {
    super(rimClass, config)
    this._state = this._state.set(SimpleObjectService._ObjectMap, Map({}))
                             .set(SimpleObjectService._SearchData, Map({}))
                             .set(SimpleObjectService._SearchResults, List([]))
  }

  delete (simpleObj) {
    const newState = super.delete(simpleObj)
    return this.setState(newState.deleteIn([OBJECT_MAP, simpleObj.getId()]))
  }

  getById (id) {
    return this._state.getIn([OBJECT_MAP, id])
  }

  getCreating () {
    return this._state.getIn([OBJECT_MAP, this._objectClass._NewID])
  }

  getInitialState () {
    const result = super.getInitialState()
    return result.set(SimpleObjectService._ObjectMap, Map({}))
                 .set(SimpleObjectService._SearchData, Map({}))
                 .set(SimpleObjectService._SearchResults, List([]))
  }

  getObjectMap () {
    return this._state.get(OBJECT_MAP)
  }

  getObjectArray () {
    return this._state.get(OBJECT_MAP).toList().toArray()
  }

  getReducer (verb) {
    return this.config.getSimpleReducer(verb)
  }

  getSearchResults () {
    return this._state.get(SEARCH_RESULTS).toArray()
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
    return super.isFetching(obj)
  }

  setById (simpleObj) {
    return this.setState(this._state.setIn([OBJECT_MAP, simpleObj.getId()], simpleObj))
  }

  setCurrent (simpleObj) {
    return this.setState(super.setCurrent(simpleObj).setIn([OBJECT_MAP, simpleObj.getId()], simpleObj))
  }

  setEditing (simpleObj) {
    return simpleObj
      ? this.setState(super.setEditing(simpleObj).setIn([OBJECT_MAP, simpleObj.getId()], simpleObj))
      : super.setEditing(simpleObj)
  }

  // The object here is to update any properties in the searchObject
  // that were changed in the rimObject during an update to rimObject
  updateSearchObject(searchObject, rimObject) {
    const jsSearchObject = searchObject.toJS()
    const jsRIMObject = rimObject.getData().toJS()
    for (var prop in jsSearchObject) {
      // istanbul ignore else
      if (jsSearchObject.hasOwnProperty(prop) && prop in jsRIMObject) {
        jsSearchObject[prop] = jsRIMObject[prop]
      }
    }
    return fromJS(jsRIMObject)
  }
}
