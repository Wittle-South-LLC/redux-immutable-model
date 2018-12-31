/* test-BaseRIMObject.js - Unit tests for core BaseRIMObject functions */

import { describe, it } from 'mocha'
import chai from 'chai'
import User from '../examples/User'
import verbs from '../src/ReduxVerbs'

const testData = {
  [User._IdentityKey]: 'UserID_1',
  [User._UsernameKey]: 'testuser',
  [User._FirstNameKey]: 'John',
  [User._LastNameKey]: 'Doe',
  [User._PreferencesKey]: { view: "wide" }
}
const testObj = new User(testData)

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
  it('isFirstNameValid() returns true for valid first name', () => {
    chai.expect(testObj.isFirstNameValid()).to.be.true
  })
  it('isFirstNameValid() returns false for invalid first name', () =>{
    const invalidFirstName = testObj.updateField(User._FirstNameKey, "X")
    chai.expect(invalidFirstName.isFirstNameValid()).to.be.false
  })
  it('validateAction(verb.SAVE_NEW) returns true for valid object', () => {
    chai.expect(testObj.validateAction(verbs.SAVE_NEW)).to.be.true
  })
  it('getFetchPayload(verb.SAVE_UPDATE) returns correct data', () => {
    var expectedResult = testObj.getData().toJS()
    delete expectedResult[User._IdentityKey]
    chai.expect(testObj.getFetchPayload(verbs.SAVE_UPDATE)).to.eql(expectedResult)
  })
})
