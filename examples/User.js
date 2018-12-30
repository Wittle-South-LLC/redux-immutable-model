/* User.js - Example subclass of BaseRIMObject */
import BaseRIMObject from '../src/BaseRimObject'

// Simple example of a User domain object. For example purposes,
// assume password is only provided to the server during user creation,
// and user preferences (AppData) are provided only on update
export default class User extends BaseRIMObject {
  // Overriding key static elements from BaseRIMObject
  static _IdentityKey = 'user_id'

  // Keys for User fields. First four are simple types, last holds an object
  static _UsernameKey = 'username'
  static _FirstNameKey = 'first_name'
  static _LastNameKey = 'last_name'
  static _PasswordKey = 'password'
  static _PreferencesKey = 'preferences'

  constructor(createFrom) {
    super(createFrom)
  }

  // Instance methods to get domain object values
  getFirstName () { return this._data.get(User._FirstNameKey) }
  getLastName () { return this._data.get(User._LastNameKey) }
  getPassword () { return this._data.get(User._PasswordKey) }
  getPreferences () { return this._data.get(User._PreferencesKey) }
  getUsername () { return this._data.get(User._UsernameKey) }

  getFetchPayload(action) {
    return super.getFetchPayload()
  }
}