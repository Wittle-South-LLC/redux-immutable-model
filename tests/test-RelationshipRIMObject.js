/* test-RelationshipRIMObject.js - Unit tests for RelationshipRIMObject functions */

import { describe, it } from 'mocha'
import chai from 'chai'
import { Map } from 'immutable'
import RelationshipRIMObject from '../src/RelationshipRIMObject'

const LEFT_TEST_ID = "LeftObject1"
const RIGHT_TEST_ID = "RightObject1"
const TEST_CREATED = "DateCreated"
const TEST_UPDATED = "DateUpdated"

const testObj = new RelationshipRIMObject({
  left_id: LEFT_TEST_ID,
  right_id: RIGHT_TEST_ID,
  record_created: TEST_CREATED,
  record_updated: TEST_UPDATED
})

describe('RelationshipRIMObject Core Functions', () => {
  it('Gets ID if present, newID if not', () => {
    chai.expect(testObj.getLeftId()).to.equal(LEFT_TEST_ID)
    chai.expect(testObj.getRightId()).to.equal(RIGHT_TEST_ID)
    const noIdObject = new RelationshipRIMObject()
    chai.expect(noIdObject.getId()).to.equal(RelationshipRIMObject._NewLeftID + '/' +
                                             RelationshipRIMObject._NewRightID)
  })
  it('Convenience getters return undefined if subclass clears keys', () => {
    class CoverageTest extends RelationshipRIMObject {
      static _LeftIdentityKey = undefined
      static _RightIdentityKey = undefined
      static _CreatedKey = undefined
      static _UpdatedKey = undefined
      constructor(startFrom) {
        super(startFrom)
      }
    }
    const testObj = new CoverageTest({key: "value"})
    chai.expect(testObj.getLeftId()).to.equal(undefined)
    chai.expect(testObj.getRightId()).to.equal(undefined)
    chai.expect(testObj.getId()).to.equal(undefined)
    chai.expect(testObj.getCreated()).to.equal(undefined)
    chai.expect(testObj.getUpdated()).to.equal(undefined)
  })
})
