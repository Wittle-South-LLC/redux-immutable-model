/* test-BaseRIMService.js - Unit tests for BaseRIMService */

import { before, describe, it } from 'mocha'
import chai from 'chai'
import { Map } from 'immutable'
import verbs from '../src/ReduxVerbs'
import status from '../src/ReduxAsyncStatus'
import BaseRIMObject from '../src/BaseRIMObject'
import BaseRIMService from '../src/BaseRIMService'

const TEST_ID = "BaseRIMObject1"
const TEST_CREATED = "DateCreated"
const TEST_UPDATED = "DateUpdated"

const testObj = new BaseRIMObject({
  ID: TEST_ID,
  record_created: TEST_CREATED,
  record_updated: TEST_UPDATED
})

class testClass extends BaseRIMObject {
  constructor(createFrom) { super (createFrom) }
  static getInitialState() { return "Test" }
}
const tcObject = new testClass({})

const testService = new BaseRIMService(BaseRIMObject)

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
    const testState = initialStateService.reducer(undefined, {})
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

