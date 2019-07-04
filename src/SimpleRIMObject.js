/* SimpleRIMObject.js - Extends BaseRIMObject for single-key tables */
import BaseRIMObject from './BaseRIMObject'

export default class SimpleRIMObject extends BaseRIMObject {

  // Most likely overridden by subclasses
  static className = 'SimpleRIMObject'
  static _IdentityKey = "ID"
  static _NewID = 'newRIMObject'

  constructor(createFrom, dirtyVal = false, fetchingVal = false, newVal = false) {
    super(createFrom, dirtyVal, fetchingVal, newVal)

    if (this.getId() === undefined) {
      this._data = this._data.set(this.constructor._IdentityKey, this.constructor._NewID)
    }
  }

  // _data member
  getId () {
    if (this.constructor._IdentityKey) {
      return this._data.get(this.constructor._IdentityKey)
    } else {
      return undefined
    }
  }
}
