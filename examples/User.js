/* User.js - Example subclass of BaseRIMObject */
import SimpleRIMObject from '../src/SimpleRIMObject'
import defaultVerbs from '../src/ReduxVerbs'

// Simple example of a User domain object. For example purposes,
// assume password is only provided to the server during user creation,
// and user preferences (AppData) are provided only on update
export default class User extends SimpleRIMObject {
  // Overriding key static elements from BaseRIMObject
  static _IdentityKey = 'user_id'

  // Keys for User fields. First four are simple types, last holds an object
  static _UsernameKey = 'username'
  static _FirstNameKey = 'first_name'
  static _LastNameKey = 'last_name'
  static _PasswordKey = 'password'
  static _PreferencesKey = 'preferences'

  // Base API path for this set of objects
  static _ApiBasePath = '/users'

  constructor(createFrom, dirtyVal = false, fetchingVal = false, newVal = false) {
    super(createFrom, dirtyVal, fetchingVal, newVal)
  }

  // Override to customize object after successfully updating
  afterUpdateSuccess(receivedData) {
    return this
  }

  // Instance methods to get domain object values
  getFirstName () { return this._data.get(User._FirstNameKey) }
  getLastName () { return this._data.get(User._LastNameKey) }
  getPassword () { return this._data.get(User._PasswordKey) }
  getPreferences () { return this._data.get(User._PreferencesKey) }
  getUsername () { return this._data.get(User._UsernameKey) }

  // One sample attribute validation method, a real object would have validators
  // for any user-entered data
  isFirstNameValid () { return this.getFirstName() &&
    this.getFirstName().length > 2 &&
    this.getFirstName().length < 30 }

  isValid() {
    let result = true
    if (!this.isFirstNameValid()) { result = false }
    return result
  }

  getFetchPayload(verb) {
    let result = {}
    switch (verb) {
      case defaultVerbs.SAVE_NEW:
        result[User._PasswordKey] = this.getPassword()
        // We're falling through here on purpose
      case defaultVerbs.SAVE_UPDATE:
        result[User._FirstNameKey] = this.getFirstName()
        result[User._LastNameKey] = this.getLastName()
        result[User._PreferencesKey] = this.getPreferences().toJS()
        result[User._UsernameKey] = this.getUsername()
        break;
      case defaultVerbs.DELETE:
      case defaultVerbs.READ:
        result = undefined
        break;
      default: return super.getFetchPayload(verb)
    }
    return result
  }
  static canDeleteFromData() {
    return false
  }
}