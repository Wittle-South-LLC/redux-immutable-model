/* test-BaseRIMObject.js - Unit tests for core BaseRIMObject functions */

import { describe, it } from 'mocha'
import chai from 'chai'
import nock from 'nock'
import thunkMiddleware from 'redux-thunk'
import { createStore, applyMiddleware } from 'redux'
import { testAsync } from './TestUtils'
import Configuration from '../src/Configuration'
import BaseRIMService from '../src/BaseRIMService'
import User from '../examples/User'

const testData = {
  [User._IdentityKey]: 'UserID_1',
  [User._UsernameKey]: 'testuser',
  [User._FirstNameKey]: 'John',
  [User._LastNameKey]: 'Doe',
  [User._PreferencesKey]: { view: "wide" }
}
const testObj = new User(testData)
const config = new Configuration()
const userService = new BaseRIMService(User, config)

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
    chai.expect(testObj.validateAction(config.verbs.SAVE_NEW)).to.be.true
  })
  it('getFetchPayload(verb.SAVE_UPDATE) returns correct data', () => {
    var expectedResult = testObj.getData().toJS()
    delete expectedResult[User._IdentityKey]
    chai.expect(testObj.getFetchPayload(config.verbs.SAVE_UPDATE)).to.eql(expectedResult)
  })
})

describe('Example: User async methods', () => {
  it('Fails saveNew for user with an invalid name', () => {
    const badUser = testObj.updateField(User._FirstNameKey, 'X')
    chai.expect(() => userService.saveNew(badUser)).to.throw(Error)
  })
  it('saveNew(obj) correctly handles server error', (done) => {
    // We need an object that is new to save
    let startObj = new User({
      [User._FirstNameKey]: 'Testing',
      [User._PreferencesKey]: {color: 'blue'}
    }, false, false, true)
    chai.expect(startObj.getId()).to.equal(User._NewID)
    chai.expect(startObj.isNew()).to.be.true
    // We need the new object to be stored in the service
    const startState = userService.setById(startObj)
    // We need a store to fully test the dispatch features
    let store = createStore(userService.reducer, startState, applyMiddleware(thunkMiddleware))
    chai.expect(userService.getById(User._NewID)).to.equal(startObj)
    // Result state should have the object with the server assigned ID
    const resultState = userService.setError("Server Error")
    // Now reset the service state to start conditions
    userService.setState(startState)
    // Expected API response for a successful SaveNew is a status 200
    // with a JSON object holding the server-assigned ID
    nock(config.getFetchURL()).post(userService.getApiPath(userService.config.verbs.SAVE_NEW, startObj)).reply(400, "Server Error")
    // Now execute the async call, validating that the start
    // and end states match what we expect
    testAsync(store, startState, resultState, done)
    store.dispatch(userService.saveNew(startObj))
  })
})
