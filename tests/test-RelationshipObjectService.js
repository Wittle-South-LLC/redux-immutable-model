/* test-RelationshipObjectService.js - Unit tests for RelationshipObjectService */

import { before, beforeEach, describe, it } from 'mocha'
import chai from 'chai'
import { fromJS, Map } from 'immutable'
import nock from 'nock'
import thunkMiddleware from 'redux-thunk'
import { createStore, applyMiddleware } from 'redux'
import { testAsync } from './TestUtils'
import Configuration from '../src/Configuration'
import defaultVerbs from '../src/ReduxVerbs'
import status from '../src/ReduxAsyncStatus'
import RelationshipRIMObject from '../src/RelationshipRIMObject'
import SimpleRIMObject from '../src/SimpleRIMObject'
import RelationshipObjectService from '../src/RelationshipObjectService'

// To reduce the size of the actual tests, create a single test object
const LEFT_TEST_ID = "LeftSimpleRIMObject1"
const RIGHT_TEST_ID = "RightSimpleRIMObject1"
const TEST_CREATED = "DateCreated"
const TEST_UPDATED = "DateUpdated"
const testObj = new RelationshipRIMObject({
  left_id: LEFT_TEST_ID,
  right_id: RIGHT_TEST_ID,
  record_created: TEST_CREATED,
  record_updated: TEST_UPDATED
})
const config = new Configuration()
// Create a service that should contain the test object
const testService = new RelationshipObjectService(RelationshipRIMObject, config)

// Create a test class different than the default for tests that need it
class testClass extends RelationshipRIMObject {
  static _apiPrefix = 'tsc'
  constructor(createFrom) { super (createFrom) }
  static getInitialState() { return "Test" }
}
// This line is for code coverage
const tcService = new RelationshipObjectService(testClass, config)
// Create a new object of the class
const tcObject = new testClass()
class testSClass extends SimpleRIMObject {
  static _IdentityKey = 'left_id'
  constructor(createFrom) { super (createFrom) }
}
class testRClass extends SimpleRIMObject {
  static _IdentityKey = 'right_id'
  constructor(createFrom) { super (createFrom) }
}
class testTClass extends SimpleRIMObject {
  static _IdentityKey = 'coverage_id'
  constructor(createFrom) { super (createFrom) }
}
const tcSObject = new testSClass({left_id: "LeftSimpleRIMObject1"})
const tcRObject = new testRClass({right_id: "RightSimpleRIMObject1"})
const tcTObject = new testTClass({coverage_id: 'Cover1'})

describe('RelationshipObjectService collection management functions', () => {
  before(() => {
    chai.expect(testService).to.exist
  })
  it('Sets an object by ID and retrieves it by ID', () => {
    testService.setById(testObj)
    chai.expect(testService.getById(testObj.getId())).to.equal(testObj)
    chai.expect(testService.getByIds(testObj.getLeftId(), testObj.getRightId())).to.equal(testObj)
    chai.expect(testService.getByIds(testObj.getRightId(), testObj.getLeftId())).to.equal(testObj)
  })
  it('delete() removes object from array', () => {
    testService.delete(testObj)
    chai.expect(testService.getById(testObj.getId())).to.equal(undefined)
  })
  it('getObjectMap() - New instance returns empty object list', () => {
    chai.expect(testService.getObjectMap(tcSObject).equals(Map({}))).to.be.true
  })
  it('getObjectMap(item) returns expected map containing object', () => {
    testService.setById(testObj)
    chai.expect(testService.getObjectMap(tcSObject).equals(Map({[testObj.getRightId()]: testObj}))).to.be.true
    chai.expect(testService.getObjectMap(tcRObject).equals(Map({[testObj.getLeftId()]: testObj}))).to.be.true
    chai.expect(testService.getObjectMap(tcTObject)).to.be.undefined
  })
  it('getObjectArray() returns an array of available objects', () => {
    chai.expect(testService.getObjectArray(tcSObject)).to.eql([testObj])
  })
  it('emptyState() results in an initialized state', () => {
    testService.setById(testObj)
    testService.emptyState()
    chai.expect(testService.getObjectMap(tcSObject)).to.be.undefined
  })
})

describe('RelationshipObjectService UI workflow support methods', () => {
  before(() => {
    testService.emptyState()
  })
  it('setCurrent() sets the object to current', () => {
    testService.setCurrent(testObj)
    chai.expect(testService.getCurrent()).to.equal(testObj)
  })
  it('setEditing() sets the object to editing', () => {
    testService.setEditing(testObj)
    chai.expect(testService.getEditing()).to.equal(testObj)
  })
  it('isCreating() is true if container holds a new object, and false otherwise', () => {
    chai.expect(testService.isCreating()).to.be.false
    const newObj = new RelationshipRIMObject({}, false, false, true)
    chai.expect(newObj.isNew()).to.be.true
    chai.expect(newObj.getId()).to.exist
    testService.setById(newObj)
    chai.expect(testService.isCreating()).to.be.true
  })
  it('delete() clears the current ID when deleting the current object', () => {
    chai.expect(testService.getCurrent()).to.exist
    testService.delete(testObj)
    chai.expect(testService.getCurrent()).to.be.undefined
    chai.expect(testService.getById(testObj.getId())).to.be.undefined
  })
  it('emptyState() removes all objects and clears editing and current', () => {
    testService.emptyState()
    chai.expect(testService.getObjectMap(tcSObject)).to.be.undefined
    chai.expect(testService.getCurrent()).to.be.undefined
    chai.expect(testService.getEditing()).to.be.undefined
  })
})

describe('RelationshipObjectService reducer support functions', () => {
  before(() => {
    testService.emptyState()
  })
  it('getState() returns empty state', () => {
    const expectedState = testService.getInitialState()
    chai.expect(testService.getState()).to.eql(expectedState)
  })
  it('reducer() generates calls object class getInitialState static method if it exists', () =>{
    const initialStateService = new RelationshipObjectService(testClass, config)
    const testState = initialStateService.reducer(undefined, { payload: { rimObj: testObj}})
    chai.expect(testState).to.equal("Test")
  })
  it('Generates default initial state from initialized class if getInitialState static method exists', () => {
    chai.expect(testService.reducer(undefined, {})).to.eql(testService.getInitialState())
  })
  it('Returns existing state for actions for other classes', () => {
    const testAction = {
      verb: defaultVerbs.SAVE_NEW,
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

describe('RelationshipObjectService code coverage tests', () => {
  beforeEach(() => {
    testService.emptyState()
    testService.setById(testObj)
  })
  it('Invalid status to reducer throws exception', () => {
    const reduceRead = config.getRelationshipReducer(defaultVerbs.READ)
    chai.expect(() => reduceRead(testService.getState(), testService, {status: 'Junk', verb: defaultVerbs.READ, rimObj: testObj})).to.throw(Error)
  })
  it('reduceHydrate clears fetching if result is error', () => {
    const reduceHydrate = config.getRelationshipReducer(defaultVerbs.HYDRATE)
    testService.setById(testObj.setFetching(true))
    chai.expect(testService.getById(testObj.getId()).isFetching()).to.be.true
    const errorEvent = { verb: defaultVerbs.HYDRATE, status: status.ERROR, rimObj: testObj, error: new Error("Test") }
    reduceHydrate(testService.getState(), testService, errorEvent)
    chai.expect(testService.getById(testObj.getId()).isFetching()).to.be.false
  })
})

describe('RelationshipObjectService: Direct reducer tests', () => {
  beforeEach(() => {
    testService.emptyState()
    testService.setById(testObj)
  })
  it('reduceStartEdit() updates state correctly', () => {
    const reduceStartEdit = config.getRelationshipReducer(defaultVerbs.START_EDIT)
    const seEvent = testService.startEdit(testObj)
    reduceStartEdit(testService.getState(), testService, seEvent)
    chai.expect(testService.getEditing()).to.equal(testObj)
    chai.expect(testService.getState().get(RelationshipObjectService._RevertTo)).to.equal(testObj)
  })
  it('reduceEdit() updates state correctly', () => {
    const reduceEdit = config.getRelationshipReducer(defaultVerbs.EDIT)
    const eEvent = testService.editField('record_created', 'testValue', testObj)
    reduceEdit(testService.getState(), testService, eEvent)
    chai.expect(testService.getById(testObj.getId()).getCreated()).to.equal('testValue')
    chai.expect(testService.getById(testObj.getId()).isDirty()).to.be.true
  })
  it('reduceCancelEdit() updates state correctly', () => {
    // Set start state to what it would be during an edit
    testService.setEditing(testObj)
    testService.setState(testService.getState().set(RelationshipObjectService._RevertTo, testObj))
    const reduceCancelEdit = config.getRelationshipReducer(defaultVerbs.CANCEL_EDIT)
    const ceEvent = testService.cancelEdit()
    reduceCancelEdit(testService.getState(), testService, ceEvent)
    chai.expect(testService.getEditing()).to.equal(undefined)
    chai.expect(testService.getState().get(RelationshipObjectService._RevertTo)).to.equal(undefined)
  })
  it('reduceCreateNew() updates state correctly', () => {
    const reduceCreateNew = config.getRelationshipReducer(defaultVerbs.CREATE_NEW)
    const cnEvent = testService.createNew()
    reduceCreateNew(testService.getState(), testService, cnEvent)
    chai.expect(testService.getEditing().getId()).to.equal(RelationshipRIMObject._NewLeftID + '/' + RelationshipRIMObject._NewRightID)
  })
  it('reduceCancelNew() updates state correctly', () => {
    // Set start state to what it would be during an edit
    const newObj = new RelationshipRIMObject()
    testService.setById(newObj)
    testService.setEditing(newObj)
    const reduceCancelNew = config.getRelationshipReducer(defaultVerbs.CANCEL_NEW)
    const cnEvent = testService.cancelNew(newObj)
    reduceCancelNew(testService.getState(), testService, cnEvent)
    chai.expect(testService.getEditing()).to.equal(undefined)
  })
  it('reduceHydrate() updates state correctly', () => {
    const reduceHydrate = config.getRelationshipReducer(defaultVerbs.HYDRATE)
    const startEvent = { verb: defaultVerbs.HYDRATE, status: status.START, serviceName: testService.name, rimObj: testObj }
    reduceHydrate(testService.getState(), testService, startEvent)
    chai.expect(testService.getById(testObj.getId()).isFetching()).to.be.true
    const receivedData = {
      RelationshipRIMObjects: [
        { left_id: 'LObject1', right_id: 'RObject1', record_created: 'Date1'},
        { left_id: 'LObject2', right_id: 'RObject2', record_created: 'Date2'},
        { left_id: 'LObject3', right_id: 'RObject3', record_created: 'Date3'}
      ]
    }
    const successEvent = { verb: defaultVerbs.HYDRATE, status: status.SUCCESS, serviceName: testService.name, rimObj: testObj, receivedData }
    reduceHydrate(testService.getState(), testService, successEvent)
    chai.expect(testService.getById('LObject1/RObject1').getCreated()).to.equal('Date1')
  })
  it('reduceLogin() updates state correctly', () => {
    const reduceLogin = config.getRelationshipReducer(defaultVerbs.LOGIN)
    const startEvent = { verb: defaultVerbs.LOGIN, status: status.START, serviceName: testService.name, rimObj: testObj }
    reduceLogin(testService.getState(), testService, startEvent)
    chai.expect(testService.getById(testObj.getId()).isFetching()).to.be.true
    const receivedData = {
      RelationshipRIMObjects: [
        { left_id: 'LObject1', right_id: 'RObject1', record_created: 'Date1'},
        { left_id: 'LObject2', right_id: 'RObject2', record_created: 'Date2'},
        { left_id: 'LObject3', right_id: 'RObject3', record_created: 'Date3'}
      ]
    }
    const successEvent = { verb: defaultVerbs.LOGIN, status: status.SUCCESS, serviceName: testService.name, rimObj: testObj, receivedData }
    reduceLogin(testService.getState(), testService, successEvent)
    chai.expect(testService.getById('LObject1/RObject1').getCreated()).to.equal('Date1')
  })
  it('reduceLogout() updates state correctly', () => {
    const reduceLogout = config.getSimpleReducer(defaultVerbs.LOGOUT)
    const startEvent = { verb: defaultVerbs.LOGOUT, status: status.START, rimObj: testObj }
    reduceLogout(testService.getState(), testService, startEvent)
    chai.expect(testService.getById(testObj.getId()).isFetching()).to.be.true
    const receivedData = {}
    const successEvent = { verb: defaultVerbs.LOGOUT, status: status.SUCCESS, rimObj: testObj, receivedData }
    reduceLogout(testService.getState(), testService, successEvent)
    chai.expect(testService.getObjectMap(tcSObject)).to.be.undefined
  })
})

describe('RelationshipObjectService action methods - true async tests', () => {
  beforeEach(() => {
    testService.emptyState()
  })
  it('Successful read(obj) correctly updates state', (done) => {
    // We need an object in the service to start the read
    let startObj = new RelationshipRIMObject({ left_id: 'LTestID1', right_id: 'RTestID1' })
    testService.setById(startObj)
    let startState = testService.getState()
    // The result will be an object with the same ID but updated values
    let resultObj = new RelationshipRIMObject({
      left_id: 'LTestID1',
      right_id: 'RTestID1',
      record_created: '2019-01-01T00:00:00.000Z'
    })
    let resultState = testService.setById(resultObj)
    // Set the testService state back to start
    testService.setState(startState)
    // Create the store so we test the entire dispatch chain
    let store = createStore(testService.reducer, startState, applyMiddleware(thunkMiddleware))
    nock(config.getFetchURL()).get(testService.getApiPath(defaultVerbs.READ, startObj)).reply(200, {
      left_id: 'LTestID1',
      right_id: 'RTestID1',
      record_created: '2019-01-01T00:00:00.000Z'
    })
    // Monitor results for both the start fetch state update and the end state
    testAsync(store, startState, resultState, done)
    // Dispatch the action to be tested
    store.dispatch(testService.read(startObj))
  })
  it('Successful saveNew(obj) correctly updates state', (done) => {
    // SaveNew for relationship objects is different, all new objects in 
    // most real-world cases should have real left and right IDs. The exception
    // is when we're saving new relationships between an existing object and
    // a new object; in that case one side could have a "New ID" from the type
    // of object on that side. Correctly handling that case would require the
    // reducer for the relationship type to handle the SAVE_NEW success event
    // for that object, and update the relevant relationship objects.
    // TODO: Need to figure out how to handle use case where we are saving relationshisp
    const objLId = 'LRelationshipObjectSaveNew1'
    const objRId = 'RRelationshipObjectSaveNew1'
    // We need an object that is new to save
    let startObj = new RelationshipRIMObject({
      left_id: objLId,
      right_id: objRId,
      record_created: 'Value1',
      record_updated: 'Value2'
    }, false, false, true)
    chai.expect(startObj.isNew()).to.be.true
    // We need the new object to be stored in the service
    const startState = testService.setById(startObj)
    // We need a store to fully test the dispatch features
    let store = createStore(testService.reducer, startState, applyMiddleware(thunkMiddleware))
    const resultObj = startObj.setNew(false)
    chai.expect(resultObj.getLeftId()).to.equal(objLId)
    chai.expect(resultObj.getRightId()).to.equal(objRId)
    chai.expect(resultObj.isNew()).to.be.false
    // Result state should have the object with the server assigned ID
    const resultState = testService.setById(resultObj)
    chai.expect(testService.getById(resultObj.getId())).to.eql(resultObj)
    // Now reset the service state to start conditions
    testService.setState(startState)
    // Expected API response for a successful SaveNew is a status 200
    // with a JSON object holding the server-assigned ID
    nock(config.getFetchURL()).post(testService.getApiPath(defaultVerbs.SAVE_NEW, startObj)).reply(200, { 
      left_id: objLId,
      right_id: objRId }
    )
    // Now execute the async call, validating that the start
    // and end states match what we expect
    testAsync(store, startState, resultState, done)
    store.dispatch(testService.saveNew(startObj))
  })
  it('Successful saveUpdate(obj) correctly updates state', (done) => {
    // We need an object that is dirty to save
    let startObj = new RelationshipRIMObject({
      left_id: 'LExistingID3',
      right_id: 'RExistingID3',
      record_created: 'Value3',
      record_updated: 'Value4'
    }, true, false, false)
    chai.expect(startObj.getId()).to.equal('LExistingID3/RExistingID3')
    chai.expect(startObj.isDirty()).to.be.true
    // Put the dirty object in the store
    let startState = testService.setById(startObj)
    // Reset state of service to start
    testService.setState(startState)
    // We need a store to fully test the dispatch features
    let store = createStore(testService.reducer, startState, applyMiddleware(thunkMiddleware))
    // Result object is simply the start object, not dirty
    let resultState = testService.setById(startObj.setDirty(false))
    // Reset state of service to start
    testService.setState(startState)
    // Expected API response for a successful SaveUpdate is a status 200
    nock(config.getFetchURL()).put(testService.getApiPath(defaultVerbs.SAVE_UPDATE, startObj)).reply(200, { result: "OK" } )
    // Now execute the async call, validating that the start
    // and end states match what we expect
    testAsync(store, startState, resultState, done)
    store.dispatch(testService.saveUpdate(startObj))
  })
  it('Successful commitDelete(obj) correctly updates state', (done) => {
    // We need an object that is to delete
    let startObj = new RelationshipRIMObject({
      left_id: 'LDeleteMe',
      right_id: 'RDeleteMe',
      record_created: 'Value5',
      record_updated: 'Value6'
    }, false, false, false)
    chai.expect(startObj.getId()).to.equal('LDeleteMe/RDeleteMe')
    // Put the object in the store
    let startState = testService.setById(startObj)
    // Reset state of service to start
    testService.setState(startState)
    // We need a store to fully test the dispatch features
    let store = createStore(testService.reducer, startState, applyMiddleware(thunkMiddleware))
    // Result object is the start state without the object to be deleted
    const resultState = testService.delete(startObj)
    // Reset state of service to start
    testService.setState(startState)
    // Expected API response for a successful commitDelete is a status 204
    nock(config.getFetchURL()).delete(testService.getApiPath(defaultVerbs.DELETE, startObj)).reply(204)
    // Now execute the async call, validating that the start
    // and end states match what we expect
    testAsync(store, startState, resultState, done)
    store.dispatch(testService.commitDelete(startObj))
  })
})

