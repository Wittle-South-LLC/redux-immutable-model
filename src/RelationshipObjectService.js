/* Relationship Object Service - Collection service for RelationshipRIMObjects */
import { Map } from 'immutable'
import BaseRIMService from './BaseRIMService'

const LEFT_OBJECT_MAP = 'LEFT_OBJECT_MAP'
const RIGHT_OBJECT_MAP = 'RIGHT_OBJECT_MAP'

export default class RelationshipObjectService extends BaseRIMService {
  static _LeftObjectMap = LEFT_OBJECT_MAP
  static _RightObjectMap = RIGHT_OBJECT_MAP

  constructor(rimClass, config) {
    super(rimClass, config)
  }

  delete (relObj) {
    return this.setState(super.delete(relObj)
               .deleteIn([LEFT_OBJECT_MAP, relObj.getLeftId(), relObj.getRightId()])
               .deleteIn([RIGHT_OBJECT_MAP, relObj.getRightId(), relObj.getLeftId()])
    )
  }

  getById (id) {
    const ids = id.split('/')
    return this._state.getIn([LEFT_OBJECT_MAP, ids[0], ids[1]])
  }

  getByIds (id1, id2) {
    return this._state.hasIn([LEFT_OBJECT_MAP, id1, id2])
      ? this._state.getIn([LEFT_OBJECT_MAP, id1, id2])
      : this._state.getIn([RIGHT_OBJECT_MAP, id1, id2])
  }

  getCreating () {
    return this._state.getIn([LEFT_OBJECT_MAP,
                              this._objectClass._NewLeftID,
                              this._objectClass._NewRightID])
  }

  getInitialState () {
    const result = super.getInitialState()
    return result.set(RelationshipObjectService._LeftObjectMap, Map({}))
                 .set(RelationshipObjectService._RightObjectMap, Map({}))
  }

  getObjectMap (simpleObj) {
    if (simpleObj.constructor._IdentityKey === this._objectClass._LeftIdentityKey) {
      return this._state.getIn([LEFT_OBJECT_MAP, simpleObj.getId()])
    } else if (simpleObj.constructor._IdentityKey === this._objectClass._RightIdentityKey) {
      return this._state.getIn([RIGHT_OBJECT_MAP, simpleObj.getId()])
    } else return undefined
  }

  getObjectArray (simpleObj) {
    return this.getObjectMap(simpleObj).toList().toArray()
  }

  getReducer (verb) {
    return this.config.getRelationshipReducer(verb)
  }

  isCreating() {
    return this._state.hasIn([LEFT_OBJECT_MAP,
                              this._objectClass._NewLeftID,
                              this._objectClass._NewRightID])
  }

  setById (relObj) {
    var newState = this._state
    if (!newState.hasIn([LEFT_OBJECT_MAP, relObj.getLeftId()])) {
      newState = newState.setIn([LEFT_OBJECT_MAP, relObj.getLeftId()], Map({}))
    }
    if (!newState.hasIn([RIGHT_OBJECT_MAP, relObj.getRightId()])) {
      newState = newState.setIn([RIGHT_OBJECT_MAP, relObj.getRightId()], Map({}))
    }
    return this.setState(newState.setIn([LEFT_OBJECT_MAP, relObj.getLeftId(), relObj.getRightId()], relObj)
                                 .setIn([RIGHT_OBJECT_MAP, relObj.getRightId(), relObj.getLeftId()], relObj)
    )
  }

  setCurrent (relObj) {
    this._state = super.setCurrent(relObj)
    return this.setById(relObj)
  }

  setEditing (relObj) {
    this._state = super.setEditing(relObj)
    return relObj ? this.setById(relObj) : this._state
  }
}
