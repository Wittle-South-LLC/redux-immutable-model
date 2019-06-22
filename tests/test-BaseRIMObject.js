/* test-BaseRIMObject.js - Unit tests for core BaseRIMObject functions */

// NOTE: Extended BaseRIMObject functions that work best when involving
//       subclasses are covered in tests/test-Examples.js

import { describe, it } from 'mocha'
import chai from 'chai'
import { Map } from 'immutable'
import BaseRIMObject from '../src/BaseRIMObject'

const TEST_ID = "BaseRIMObject1"
const TEST_CREATED = "DateCreated"
const TEST_UPDATED = "DateUpdated"

const testObj = new BaseRIMObject({
  ID: TEST_ID,
  record_created: TEST_CREATED,
  record_updated: TEST_UPDATED
})

describe('BaseRIMObject Core Functions', () => {
  it('Sets and reads dirty', () => {
    chai.expect(testObj.isDirty()).to.be.false
    const dirtyObj = testObj.setDirty(true)
    chai.expect(dirtyObj.isDirty()).to.be.true
    const dirtyAtCreate = new BaseRIMObject({}, true, false, false)
    chai.expect(dirtyAtCreate.isDirty()).to.be.true
  })
  it('Sets and reads fetching', () => {
    chai.expect(testObj.isFetching()).to.be.false
    const fetchingObj = testObj.setFetching(true)
    chai.expect(fetchingObj.isFetching()).to.be.true
    const fetchingAtCreate = new BaseRIMObject({}, false, true, false)
    chai.expect(fetchingAtCreate.isFetching()).to.be.true
  })
  it('Sets and reads new', () => {
    chai.expect(testObj.isNew()).to.be.false
    const newObj = testObj.setNew(true)
    chai.expect(newObj.isNew()).to.be.true
    const newAtCreate = new BaseRIMObject({}, false, false, true)
    chai.expect(newAtCreate.isNew()).to.be.true
  })
  it('returns toJS() value as expected', () => {
    const expectedResult = {
      ID: TEST_ID,
      record_created: TEST_CREATED,
      record_updated: TEST_UPDATED,
      _dirty: false,
      _fetching: false,
      _new: false
    }
    chai.expect(testObj.toJS()).to.eql(expectedResult)
  })
  it('Returns identical object if set<stateField> called with existing value', () => {
    const testDirty = testObj.setDirty(testObj.isDirty())
    chai.expect(testDirty.hashCode()).to.equal(testObj.hashCode())
    const testFetching = testObj.setFetching(testObj.isFetching())
    chai.expect(testFetching.hashCode()).to.equal(testObj.hashCode())
    const testNew = testObj.setNew(testObj.isNew())
    chai.expect(testNew.hashCode()).to.equal(testObj.hashCode())
  })
  it('Gets created if present, undefined if not', () => {
    chai.expect(testObj.getCreated()).to.equal(TEST_CREATED)
    const noCreatedObject = new BaseRIMObject()
    chai.expect(noCreatedObject.getCreated()).to.equal(undefined)
  })
  it('Gets updated if present, undefined if not', () => {
    chai.expect(testObj.getUpdated()).to.equal(TEST_UPDATED)
    const noUpdatedObject = new BaseRIMObject()
    chai.expect(noUpdatedObject.getUpdated()).to.equal(undefined)
  })
  it('Gets empty payload for an action', () => {
    chai.expect(testObj.getFetchPayload()).to.eql({})
  })
  it('Updates a field with a new object and a object is dirty', () => {
    const updatedTest = testObj.updateField(BaseRIMObject._UpdatedKey, "NewUpdated")
    chai.expect(updatedTest.hashCode()).to.not.equal(testObj.hashCode())
    chai.expect(updatedTest.isDirty()).to.be.true
    chai.expect(updatedTest.getUpdated()).to.equal("NewUpdated")
  })
  it('Returns the same object if updated value is not different', () => {
    const updatedTest = testObj.updateField(BaseRIMObject._UpdatedKey, testObj.getUpdated())
    chai.expect(updatedTest.hashCode()).to.equal(testObj.hashCode())
  })
  it('Returns the same object if immutable values are not different', () => {
    const firstObj = new BaseRIMObject({key: Map({color: "blue"})})
    const updatedObj = firstObj.updateField("key", Map({color: "blue"}))
    chai.expect(firstObj.hashCode()).to.equal(updatedObj.hashCode())
  })
  it('Updates a nested field with a new value', () => {
    const startObj = new BaseRIMObject({preferences: {key: "value"}})
    const updatedObj = startObj.updateField(['preferences', 'key'], "value2")
    chai.expect(updatedObj.getData().getIn(['preferences', 'key'])).to.equal("value2")
  })
})
