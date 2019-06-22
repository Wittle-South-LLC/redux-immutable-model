/* test-Examples.js - Unit tests for example redux-immutable-object features */

import { describe, it } from 'mocha'
import chai from 'chai'
import nock from 'nock'
import thunkMiddleware from 'redux-thunk'
import { createStore, applyMiddleware } from 'redux'
import { testAsync } from './TestUtils'
import Configuration from '../src/Configuration'
import SimpleObjectService from '../src/SimpleObjectService'
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
const userService = new SimpleObjectService(User, config)
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
  it('isValid() returns true for valid object', () => {
    chai.expect(testObj.isValid()).to.be.true
  })
  it('getFetchPayload(verb.SAVE_UPDATE) returns correct data', () => {
    var expectedResult = testObj.getData().toJS()
    delete expectedResult[User._IdentityKey]
    chai.expect(testObj.getFetchPayload(config.verbs.SAVE_UPDATE)).to.eql(expectedResult)
  })
})

describe('Example: Reducer tests', () => {
  it('Reducing startEdit works', () => {
    const startState = userService.setById(testObj)
    const endState= userService.reducer(startState, userService.startEdit(testObj))
    chai.expect(userService.getEditing()).to.equal(testObj)
  })
})

describe('Example: Code coverage tests', () => {
  it('Retuns a custom API path if getApiPath function provided in configuration', () => {
    const testConfig = new Configuration()
    testConfig.setGetApiPath(() => "Testing")
    const testService = new SimpleObjectService(User, testConfig)
    chai.expect(testService.getApiPath(config.verbs.SAVE_NEW, testObj)).to.equal("Testing")
  })
  it('Configuration setters work correctly', () => {
    const testConfig = new Configuration()
    testConfig.setGetCollectionApiPath(() => "GetCollectionApiPath")
    chai.expect(testConfig.getCollectionApiPath()).to.equal("GetCollectionApiPath")
    testConfig.setPreProcessResponse(() => "preProcessResponse")
    chai.expect(testConfig.preProcessResponse()).to.equal("preProcessResponse")
    testConfig.setApplyHeaders(() => "applyHeaders")
    chai.expect(testConfig.applyHeaders()).to.equal("applyHeaders")
    testConfig.setGetFetchURL(() => "getFetchURL")
    chai.expect(testConfig.getFetchURL()).to.equal("getFetchURL")
  })
  it('Adds verbs correctly', () => {
    const testConfig = new Configuration()
    testConfig.addVerb('VERB_TEST', () => "Testing", 'simple')
    chai.expect(testConfig.simpleReducers['VERB_TEST']()).to.equal("Testing")
  })
})

describe('Example: User async methods', () => {
  beforeEach(() => {
    userService.emptyState()
  })
  it('Fails saveNew for user with an invalid name', () => {
    const badUser = testObj.updateField(User._FirstNameKey, 'X')
    chai.expect(() => userService.saveNew(badUser)).to.throw(Error)
  })
  it('saveNew(User) correctly handles server error', (done) => {
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
  it('saveUpdate(User) correctly updates state', (done) => {
    // We need an object that is dirty to save
    let startObj = new User({
      [User._IdentityKey]: 'UserId1',
      [User._FirstNameKey]: 'Testing',
      [User._PreferencesKey]: {color: 'blue'},
      record_created: 'Value3',
      record_updated: 'Value4'
    }, true, false, false)
    chai.expect(startObj.getId()).to.equal('UserId1')
    chai.expect(startObj.isDirty()).to.be.true
    // Put the dirty object in the store
    let startState = userService.setById(startObj)
    // We need a store to fully test the dispatch features
    let store = createStore(userService.reducer, startState, applyMiddleware(thunkMiddleware))
    // Result object is simply the start object, not dirty
    let resultState = userService.setById(startObj.setDirty(false))
    // Reset state of service to start
    userService.setState(startState)
    // Expected API response for a successful SaveUpdate is a status 200
    nock(config.getFetchURL()).put(userService.getApiPath(userService.config.verbs.SAVE_UPDATE, startObj)).reply(200, { result: "OK" } )
    // Now execute the async call, validating that the start
    // and end states match what we expect
    testAsync(store, startState, resultState, done)
    store.dispatch(userService.saveUpdate(startObj))
  })
  it('commitDelete(User) correctly updates state (code coverage)', (done) => {
    // We need an object that is to delete
    let startObj = new User({
      [User._IdentityKey]: 'DeleteMe',
      [User._FirstNameKey]: 'Testing',
      [User._PreferencesKey]: {color: 'blue'},
      record_created: 'Value5',
      record_updated: 'Value6'
    }, false, false, false)
    chai.expect(startObj.getId()).to.equal('DeleteMe')
    // Put the object in the store
    let startState = userService.setById(startObj)
    // We need a store to fully test the dispatch features
    let store = createStore(userService.reducer, startState, applyMiddleware(thunkMiddleware))
    // Expected API response for a successful commitDelete is a status 204
    nock(config.getFetchURL()).delete(userService.getApiPath(userService.config.verbs.DELETE, startObj)).reply(204)
    // Now execute the async call, validating that the start
    // and end states match what we expect
    testAsync(store, startState, startState, done)
    store.dispatch(userService.commitDelete(startObj))
  })
})
