/* test-BaseRIMObject.js - Unit tests for core BaseRIMObject functions */

import { describe, it } from 'mocha'
import chai from 'chai'
import User from '../examples/User'

const testObj = new User({
  [User._IdentityKey]: 'UserID_1',
  [User._UsernameKey]: 'testuser',
  [User._FirstNameKey]: 'John',
  [User._LastNameKey]: 'Doe',
  [User._PreferencesKey]: { view: "wide" }
})

describe('Example: User core methods', () => {
  it('getID() returns ID', () => {
    chai.expect(testObj.getId()).to.equal('UserID_1')
  })
  it('getUsername() returns Username', () => {
    chai.expect(testObj.getUsername()).to.equal('testuser')
  })
  it('getFirstName() returns First Name', () => {
    chai.expect(testObj.getFirstName()).to.equal('John')
  })
  it('getLastName() returns Last Name', () => {
    chai.expect(testObj.getLastName()).to.equal('Doe')
  })
  it('getPreferences() returns preferences Map with correct value', () => {
    chai.expect(testObj.getPreferences().get('view')).to.equal('wide')
  })
  it('getPassword works after being set via UpdateField', () => {
    const testWithPwd = testObj.updateField(User._PasswordKey, "password")
    chai.expect(testWithPwd.getPassword()).to.equal("password")
  })
})
