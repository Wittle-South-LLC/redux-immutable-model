/* BaseRIMObject.js - Extends ImmutableInherit with async status */

import ImmutableInherit from 'immutable-inherit'
import { isImmutable, fromJS, Map } from 'immutable'

// TODO: Determine if we can have named parameters with default values
//       in the constructor like with Python; will likely simplify some
//       use cases

export default class BaseRIMObject extends ImmutableInherit {

  // These should be populated by subclasses
  // Default keys int
  static className = 'BaseRIMObject'
  static _CreatedKey = "record_created"
  static _UpdatedKey = "record_updated"

  constructor(createFrom, dirtyVal = false, fetchingVal = false, newVal = false) {
    super(createFrom)
    this._dirty = dirtyVal
    this._fetching = fetchingVal
    this._new = newVal
    if (createFrom) {
      this._data = createFrom instanceof Map ? createFrom : fromJS(createFrom)
    }
  }

  // Override to customize object after receiving ID
  afterCreateSuccess(receivedData) {
    return this
  }

  // Convenience methods assuming relevant values are at the root of the
  // _data member
  getCreated () {
    if (this.constructor._CreatedKey) {
      return this._data.get(this.constructor._CreatedKey)
    } else {
      return undefined
    }
  }
  getUpdated () {
    if (this.constructor._UpdatedKey) {
      return this._data.get(this.constructor._UpdatedKey)
    } else {
      return undefined
    }
  }

  // RESTful API helper methods, intended to be overridden
  getFetchPayload (verb) {
    return {}
  }

  // Tests for client object states
  isDirty () { return this._dirty }
  isFetching () { return this._fetching}
  isNew () { return this._new }
  isValid () { return true }

  // Set whether this object is dirty
  setDirty(val) {
    // Return new object with updated value for new if new is
    // different than current, otherwise return current
    return this._dirty !== val
      ? Object.assign(new this.constructor(this._data), {
        _dirty: val
        })
      : this
  }

  // Set whether this is currently being fetched
  setFetching(val) {
    return this._fetching !== val
      ? Object.assign(new this.constructor(this._data), {
        _fetching: val
        })
      : this
  }

  // Set whether this object is new
  setNew(val) {
    return this._new !== val
      ? Object.assign(new this.constructor(this._data), {
        _new: val
        })
      : this
  }

  toJS() {
    const result = this._data.toJS()
    result['_dirty'] = this._dirty
    result['_fetching'] = this._fetching
    result['_new'] = this._new
    return result
  }

  // Need to include UpdateField here that does SetDirty
  // Note - we really would benefit from Python style optional arguments with defaults
  updateField(key, value, isDirty = true) {
    const currentValue = key instanceof Array ? this._data.getIn(key) : this._data.get(key)
    if (currentValue === value) { return this }
    else if (isImmutable(currentValue) && currentValue.equals(value)) {
      return this
    }
    const newData = key instanceof Array ? this._data.setIn(key, value) : this._data.set(key, value)
    return Object.assign(new this.constructor(newData), {
      _new: this._new,
      _fetching: this._fetching,
      _dirty: isDirty
    })
  }
  static canDeleteFromData() {
    return true
  }
}
