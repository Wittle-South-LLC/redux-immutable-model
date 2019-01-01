/* test-BaseRIMService.js - Unit tests for BaseRIMService */

import { before, beforeEach, describe, it } from 'mocha'
import chai from 'chai'
import { fromJS, Map } from 'immutable'
import nock from 'nock'
import thunkMiddleware from 'redux-thunk'
import { createStore, applyMiddleware } from 'redux'
import { testAsync } from './TestUtils'
import config from '../src/Configuration'
import verbs from '../src/ReduxVerbs'
import status from '../src/ReduxAsyncStatus'
import serviceReducers from '../src/ServiceReducer'
import BaseRIMObject from '../src/BaseRIMObject'
import BaseRIMService from '../src/BaseRIMService'

// To reduce the size of the actual tests, create a single test object
const TEST_ID = "BaseRIMObject1"
const TEST_CREATED = "DateCreated"
const TEST_UPDATED = "DateUpdated"
const testObj = new BaseRIMObject({
  ID: TEST_ID,
  record_created: TEST_CREATED,
  record_updated: TEST_UPDATED
})
// Create a service that should contain the test object
const testService = new BaseRIMService(BaseRIMObject)

// Create a test class different than the default for tests that need it
class testClass extends BaseRIMObject {
  constructor(createFrom) { super (createFrom) }
  static getInitialState() { return "Test" }
}
// Create a new object of the class
const tcObject = new testClass({})

describe('BaseRIMService collection management functions', () => {
  before(() => {
    chai.expect(testService).to.exist
  })
  it('getObjectMap() - New instance returns empty object list', () => {
    chai.expect(testService.getObjectMap().equals(Map({}))).to.be.true
  })
  it('getSearchResults() gets search results', () => {
    chai.expect(testService.getSearchResults()).to.eql([])
  })
  it('Sets an object by ID and retrieves it by ID', () => {
    testService.setById(testObj)
    chai.expect(testService.getById(testObj.getId())).to.equal(testObj)
  })
  it('getObjectClass() returns the ObjectClass when asked', () => {
    chai.expect(testService.getObjectClass() === BaseRIMObject)
  })
  it('getObjectArray() returns an array of available objects', () => {
    chai.expect(testService.getObjectArray()).to.eql([testObj])
  })
  it('deleteId() removes object from array', () => {
    testService.deleteId(testObj.getId())
    chai.expect(testService.getById(testObj.getId())).to.equal(undefined)
  })
  it('emptyState() results in an initialized state', () => {
    testService.setById(testObj)
    testService.emptyState()
    chai.expect(testService.getObjectMap().equals(Map({}))).to.be.true
  })
})

describe('BaseRIMService UI workflow support methods', () => {
  before(() => {
    testService.emptyState()
  })
  it('getCurrent() returns undefined when no ID is current', () => {
    chai.expect(testService.getCurrent()).to.be.undefined
  })
  it('setCurrentId() sets the current ID', () => {
    testService.setCurrentId('Testing123')
    chai.expect(testService.getCurrentId()).to.equal('Testing123')
  })
  it('setCurrent() sets the object to current', () => {
    testService.setCurrent(testObj)
    chai.expect(testService.getCurrentId()).to.equal(testObj.getId())
    chai.expect(testService.getCurrent()).to.equal(testObj)
  })
  it('setEditing() sets the object to editing', () => {
    testService.setEditing(testObj)
    chai.expect(testService.getEditingId()).to.equal(testObj.getId())
  })
  it('setEditingId() sets the editing ID', () => {
    testService.setEditingId('Testing123')
    chai.expect(testService.getEditingId()).to.equal('Testing123')
  })
  it('isCreating() is true if container holds a new object, and false otherwise', () => {
    chai.expect(testService.isCreating()).to.be.false
    const newObj = new BaseRIMObject({}, false, false, true)
    chai.expect(newObj.isNew()).to.be.true
    chai.expect(newObj.getId()).to.exist
    testService.setById(newObj)
    chai.expect(testService.isCreating()).to.be.true
  })
  it('deleteId() clears the current ID when deleting the current object', () => {
    chai.expect(testService.getCurrentId()).to.exist
    testService.deleteId(testObj.getId())
    chai.expect(testService.getCurrentId()).to.be.undefined
  })
  it('emptyState() removes all objects and clears editing and current', () => {
    testService.emptyState()
    chai.expect(testService.getObjectMap()).to.eql(Map({}))
    chai.expect(testService.getCurrentId()).to.be.undefined
    chai.expect(testService.getEditingId()).to.be.undefined
  })
})

describe('BaseRIMService reducer support functions', () => {
  before(() => {
    testService.emptyState()
  })
  it('getState() returns empty state', () => {
    const expectedState = testService.getInitialState()
    chai.expect(testService.getState()).to.eql(expectedState)
  })
  it('reducer() generates calls object class getInitialState static method if it exists', () =>{
    const initialStateService = new BaseRIMService(testClass)
    const testState = initialStateService.reducer(undefined, { payload: { rimObj: testObj}})
    chai.expect(testState).to.equal("Test")
  })
  it('Generates default initial state from initialized class if getInitialState static method exists', () => {
    chai.expect(testService.reducer(undefined, {})).to.eql(testService.getInitialState())
  })
  it('Returns existing state for actions for other classes', () => {
    const testAction = {
      verb: verbs.SAVE_NEW,
      status: status.FETCH_START,
      rimObj: tcObject
    }
    chai.expect(testService.reducer(undefined, testAction)).to.eql(testService.getInitialState())
  })
  it('Retuns existing state for unrecognized verbs', () => {
    const testAction = {
      verb: "JUNK",
      status: status.FETCH_START,
      rimObj: testObj
    }
    chai.expect(testService.reducer(undefined, testAction)).to.eql(testService.getInitialState())
  })
})

describe('BaseRIMService code coverage tests', () => {
  beforeEach(() => {
    testService.emptyState()
    testService.setById(testObj)
  })
  it('Invalid status to reducer throws exception', () => {
    const reduceRead = serviceReducers[verbs.READ]
    chai.expect(() => reduceRead(testService.getState(), testService, {status: 'Junk', verb: verbs.READ, rimObj: testObj})).to.throw(Error)
  })
  it('reduceHydrate clears fetching if result is error', () => {
    const reduceHydrate = serviceReducers[verbs.HYDRATE]
    testService.setById(testObj.setFetching(true))
    chai.expect(testService.getById(testObj.getId()).isFetching()).to.be.true
    const errorEvent = { verb: verbs.HYDRATE, status: status.ERROR, rimObj: testObj, error: new Error("Test") }
    reduceHydrate(testService.getState(), testService, errorEvent)
    chai.expect(testService.getById(testObj.getId()).isFetching()).to.be.false
  })
  it('Returns custom collection API path if config override is set', () => {
    const configGetCollectionApiPath = config.getCollectionApiPath
    config.getCollectionApiPath = () => { return "test"}
    chai.expect(testService.getApiCollectionPath()).to.equal("test")
    config.getCollectionApiPath = configGetCollectionApiPath
  })
  it('Returns custom API path if config override is set', () => {
    const configGetApiPath = config.getApiPath
    config.getApiPath = (verb, obj) => { return "test"}
    chai.expect(testService.getApiPath(verbs.READ, testObj)).to.equal("test")
    config.getApiPath = configGetApiPath
  })
})

describe('Direct reducer tests', () => {
  beforeEach(() => {
    testService.emptyState()
    testService.setById(testObj)
  })
  it('reduceHydrate() updates state correctly', () => {
    const reduceHydrate = serviceReducers[verbs.HYDRATE]
    const startEvent = { verb: verbs.HYDRATE, status: status.START, rimObj: testObj }
    reduceHydrate(testService.getState(), testService, startEvent)
    chai.expect(testService.getById(testObj.getId()).isFetching()).to.be.true
    const receivedData = {
      BaseRIMObjects: [
        { ID: 'Object1', record_created: 'Date1'},
        { ID: 'Object2', record_created: 'Date2'},
        { ID: 'Object3', record_created: 'Date3'}
      ]
    }
    const successEvent = { verb: verbs.HYDRATE, status: status.SUCCESS, rimObj: testObj, receivedData }
    reduceHydrate(testService.getState(), testService, successEvent)
    chai.expect(testService.getById('Object1').getCreated()).to.equal('Date1')
  })
  it('reduceLogin() updates state correctly', () => {
    const reduceLogin = serviceReducers[verbs.LOGIN]
    const startEvent = { verb: verbs.LOGIN, status: status.START, rimObj: testObj }
    reduceLogin(testService.getState(), testService, startEvent)
    chai.expect(testService.getById(testObj.getId()).isFetching()).to.be.true
    const receivedData = {
      BaseRIMObjects: [
        { ID: 'Object1', record_created: 'Date1'},
        { ID: 'Object2', record_created: 'Date2'},
        { ID: 'Object3', record_created: 'Date3'}
      ]
    }
    const successEvent = { verb: verbs.LOGIN, status: status.SUCCESS, rimObj: testObj, receivedData }
    reduceLogin(testService.getState(), testService, successEvent)
    chai.expect(testService.getById('Object1').getCreated()).to.equal('Date1')
  })
  it('reduceLogout() updates state correctly', () => {
    const reduceLogout = serviceReducers[verbs.LOGOUT]
    const startEvent = { verb: verbs.LOGOUT, status: status.START, rimObj: testObj }
    reduceLogout(testService.getState(), testService, startEvent)
    chai.expect(testService.getById(testObj.getId()).isFetching()).to.be.true
    const receivedData = {}
    const successEvent = { verb: verbs.LOGOUT, status: status.SUCCESS, rimObj: testObj, receivedData }
    reduceLogout(testService.getState(), testService, successEvent)
    chai.expect(testService.getObjectMap().equals(Map({}))).to.be.true
  })
  it('search() error correctly updates state', () => {
    // We need a start state
    const reduceSearch = serviceReducers[verbs.SEARCH]
    const startState = testService.getState().setIn([BaseRIMService._SearchData, 'fetching'], true)
    const errorEvent = { verb: verbs.SEARCH, status: status.ERROR, rimObj: "Nothing" }
    const finishState = reduceSearch(startState, testService, errorEvent)
    chai.expect(finishState.hasIn([BaseRIMService._SearchData, 'fetching'])).to.be.false
  })
})

describe('BaseRIMService action methods - true async tests', () => {
  beforeEach(() => {
    testService.emptyState()
  })
  it('Successful read(obj) correctly updates state', (done) => {
    // We need an object in the service to start the read
    let startObj = new BaseRIMObject({ ID: 'TestID1' })
    testService.setById(startObj)
    let startState = testService.getState()
    // The result will be an object with the same ID but updated values
    let resultObj = new BaseRIMObject({
      ID: 'TestID1',
      record_created: '2019-01-01T00:00:00.000Z'
    })
    let resultState = testService.setById(resultObj)
    // Set the testService state back to start
    testService.setState(startState)
    // Create the store so we test the entire dispatch chain
    let store = createStore(testService.reducer, startState, applyMiddleware(thunkMiddleware))
    nock(config.getFetchURL()).get(testService.getApiPath(verbs.READ, startObj)).reply(200, {
      ID: 'TestID1',
      record_created: '2019-01-01T00:00:00.000Z'
    })
    // Monitor results for both the start fetch state update and the end state
    testAsync(store, startState, resultState, done)
    // Dispatch the action to be tested
    store.dispatch(testService.read(startObj))
  })
  it('Successful saveNew(obj) correctly updates state', (done) => {
    // We need an object that is new to save
    let startObj = new BaseRIMObject({
      record_created: 'Value1',
      record_updated: 'Value2'
    }, false, false, true)
    chai.expect(startObj.getId()).to.equal(BaseRIMObject._NewID)
    chai.expect(startObj.isNew()).to.be.true
    // We need the new object to be stored in the service
    const startState = testService.setById(startObj)
    // We need a store to fully test the dispatch features
    let store = createStore(testService.reducer, startState, applyMiddleware(thunkMiddleware))
    chai.expect(testService.getById(BaseRIMObject._NewID)).to.equal(startObj)
    // Our expected result is an updated object with a server-assigned ID
    const objId = 'RimObjectSaveNew1'
    const resultObj = startObj.updateField(BaseRIMObject._IdentityKey, objId).setNew(false)
    chai.expect(resultObj.getId()).to.equal(objId)
    chai.expect(resultObj.isNew()).to.be.false
    // Result state should not have the 'new' object
    testService.deleteId(startObj.getId())
    chai.expect(testService.getById(startObj.getId())).to.be.undefined
    // Result state should have the object with the server assigned ID
    const resultState = testService.setById(resultObj)
    chai.expect(testService.getById(resultObj.getId())).to.eql(resultObj)
    // Now reset the service state to start conditions
    testService.setState(startState)
    // Expected API response for a successful SaveNew is a status 200
    // with a JSON object holding the server-assigned ID
    nock(config.getFetchURL()).post(testService.getApiPath(verbs.SAVE_NEW, startObj)).reply(200, { ID: objId })
    // Now execute the async call, validating that the start
    // and end states match what we expect
    testAsync(store, startState, resultState, done)
    store.dispatch(testService.saveNew(startObj))
  })
  it('Successful saveUpdate(obj) correctly updates state', (done) => {
    // We need an object that is dirty to save
    let startObj = new BaseRIMObject({
      ID: 'ExistingID3',
      record_created: 'Value3',
      record_updated: 'Value4'
    }, true, false, false)
    chai.expect(startObj.getId()).to.equal('ExistingID3')
    chai.expect(startObj.isDirty()).to.be.true
    // Put the dirty object in the store
    let startState = testService.setById(startObj)
    // Ensure the same ID is in SEARCH_RESULTS for code coverage
    const searchResults = [
      {ID: 'ExistingID3', record_created: 'Value5', record_updated: 'Value6'},
      {ID: 'SearchItem2', record_created: 'Created1', record_updated: 'Updated1'},
      {ID: 'SearchItem3', record_created: 'Created1', record_updated: 'Updated1'}
    ]
    startState = startState.set(BaseRIMService._SearchResults, fromJS(searchResults))
    // Reset state of service to start
    testService.setState(startState)
    // We need a store to fully test the dispatch features
    let store = createStore(testService.reducer, startState, applyMiddleware(thunkMiddleware))
    // Result object is simply the start object, not dirty
    let resultState = testService.setById(startObj.setDirty(false))
    resultState = resultState.setIn([BaseRIMService._SearchResults, 0, 'record_created'], 'Value3')
                             .setIn([BaseRIMService._SearchResults, 0, 'record_updated'], 'Value4')
    // Reset state of service to start
    testService.setState(startState)
    // Expected API response for a successful SaveUpdate is a status 200
    nock(config.getFetchURL()).put(testService.getApiPath(verbs.SAVE_UPDATE, startObj)).reply(200, { result: "OK" } )
    // Now execute the async call, validating that the start
    // and end states match what we expect
    testAsync(store, startState, resultState, done)
    store.dispatch(testService.saveUpdate(startObj))
  })
  it('Successful commitDelete(obj) correctly updates state', (done) => {
    // We need an object that is to delete
    let startObj = new BaseRIMObject({
      ID: 'DeleteMe',
      record_created: 'Value5',
      record_updated: 'Value6'
    }, false, false, false)
    chai.expect(startObj.getId()).to.equal('DeleteMe')
    // Put the object in the store
    let startState = testService.setById(startObj)
    // Ensure the same ID is in SEARCH_RESULTS for code coverage
    const searchResults = [
      {ID: 'DeleteMe', record_created: 'Value5', record_updated: 'Value6'},
      {ID: 'SearchItem2', record_created: 'Created1', record_updated: 'Updated1'},
      {ID: 'SearchItem3', record_created: 'Created1', record_updated: 'Updated1'}
    ]
    startState = startState.set(BaseRIMService._SearchResults, fromJS(searchResults))
    // Reset state of service to start
    testService.setState(startState)
    // We need a store to fully test the dispatch features
    let store = createStore(testService.reducer, startState, applyMiddleware(thunkMiddleware))
    // Result object is the start state without the object to be deleted
    const resultState = testService.deleteId(startObj.getId()).deleteIn([BaseRIMService._SearchResults, 0])
    // Reset state of service to start
    testService.setState(startState)
    // Expected API response for a successful commitDelete is a status 204
    nock(config.getFetchURL()).delete(testService.getApiPath(verbs.DELETE, startObj)).reply(204)
    // Now execute the async call, validating that the start
    // and end states match what we expect
    testAsync(store, startState, resultState, done)
    store.dispatch(testService.commitDelete(startObj))
  })
  it('Successful search() correctly updates state', (done) => {
    // We need a start state
    let startState = testService.setById(testObj)
    startState = startState.setIn([BaseRIMService._SearchData, 'fetching'], true)
    // We need a store to fully test the dispatch features
    let store = createStore(testService.reducer, startState, applyMiddleware(thunkMiddleware))
    // We need to define what search data will return
    const searchResponse = [
      {ID: 'SearchItem1', record_created: 'Created1', record_updated: 'Updated1'},
      {ID: 'SearchItem2', record_created: 'Created1', record_updated: 'Updated1'},
      {ID: 'SearchItem3', record_created: 'Created1', record_updated: 'Updated1'}
    ]
    // Need a result state with these objects where they are supposed to be
    let resultState = startState.set(BaseRIMService._SearchResults, fromJS(searchResponse))
    resultState = resultState.deleteIn([BaseRIMService._SearchData, 'fetching'])
    nock(config.getFetchURL()).get(testService.getApiPath(verbs.SEARCH, "Nothing")).reply(200,searchResponse)
    testAsync(store, startState, resultState, done)
    store.dispatch(testService.search("Nothing"))
  })
})

