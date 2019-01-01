/* test-BaseRIMService.js - Unit tests for BaseRIMService */

import { before, beforeEach, describe, it } from 'mocha'
import chai from 'chai'
import { Map } from 'immutable'
import nock from 'nock'
import thunkMiddleware from 'redux-thunk'
import { createStore, applyMiddleware } from 'redux'
import { testAsync } from './TestUtils'
import verbs from '../src/ReduxVerbs'
import status from '../src/ReduxAsyncStatus'
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

describe('BaseRIMService action methods', () => {
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
    nock(process.env.API_URL).get('/test/' + startObj.getId()).reply(200, {
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
    const resultObj = startObj.updateField(BaseRIMObject._IdentityKey, objId)
    // Result state should not have the 'new' object
    testService.deleteId(startObj.getId())
    // Result state should have the object with the server assigned ID
    const resultState = testService.setById(resultObj)
    // Now reset the service state to start conditions
    testService.setState(startState)
    // Expected API response for a successful SaveNew is a status 200
    // with a JSON object holding the server-assigned ID
    nock(process.env.API_URL).post('/test').reply(200, { ID: objId })
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
    const startState = testService.setById(startObj)
    // We need a store to fully test the dispatch features
    let store = createStore(testService.reducer, startState, applyMiddleware(thunkMiddleware))
    // Result object is simply the start object, not dirty
    const resultState = testService.setById(startObj.setDirty(false))
    // Reset state of service to start
    testService.setState(startState)
    // Expected API response for a successful SaveUpdate is a status 200
    nock(process.env.API_URL).put('/test/' + startObj.getId()).reply(200, { result: "OK" } )
    // Now execute the async call, validating that the start
    // and end states match what we expect
    testAsync(store, startState, resultState, done)
    store.dispatch(testService.saveNew(startObj))
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
    const startState = testService.setById(startObj)
    // We need a store to fully test the dispatch features
    let store = createStore(testService.reducer, startState, applyMiddleware(thunkMiddleware))
    // Result object is the start state without the object to be deleted
    const resultState = testService.deleteId(startObj.setDirty(false))
    // Reset state of service to start
    testService.setState(startState)
    // Expected API response for a successful commitDelete is a status 204
    nock(process.env.API_URL).delete('/test/' + startObj.getId()).reply(204)
    // Now execute the async call, validating that the start
    // and end states match what we expect
    testAsync(store, startState, resultState, done)
    store.dispatch(testService.commitDelete(startObj))
  })
})

