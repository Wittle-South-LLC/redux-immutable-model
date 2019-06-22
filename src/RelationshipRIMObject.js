/* RelationshipRIMObject.js - Extends BaseRIMObject for relationship (2-key) tables */
import BaseRIMObject from './BaseRIMObject'

export default class RelationshipRIMObject extends BaseRIMObject {

  // Most likely overridden by subclasses
  static _IdentityKey = "left_id/right_id"
  static _NewID = "new_left_id/new_right_id"
  static _NewLeftID = "new_left_id"
  static _NewRightID = "new_right_id"
  static _LeftIdentityKey = "left_id"
  static _RightIdentityKey = "right_id"

  constructor(createFrom, dirtyVal = false, fetchingVal = false, newVal = false) {
    super(createFrom, dirtyVal, fetchingVal, newVal)

    if (this.constructor._LeftIdentityKey && this.getLeftId() === undefined) {
      this._data = this._data.set(this.constructor._LeftIdentityKey, this.constructor._NewLeftID)
    }
    if (this.constructor._RightIdentityKey && this.getRightId() === undefined) {
      this._data = this._data.set(this.constructor._RightIdentityKey, this.constructor._NewRightID)
    }
  }

  // We're going to assume for the moment that this strategy for a composite
  // ID will work; it seems to have functioned acceptably for early MUAM
  getId () {
    if (this.constructor._LeftIdentityKey && this.constructor._RightIdentityKey) {
      return this._data.get(this.constructor._LeftIdentityKey) + '/' + 
             this._data.get(this.constructor._RightIdentityKey)
    } else {
      return undefined
    }
  }

  getLeftId () {
    return this._data.get(this.constructor._LeftIdentityKey)
  }

  getRightId() {
    return this._data.get(this.constructor._RightIdentityKey)
  }
}
