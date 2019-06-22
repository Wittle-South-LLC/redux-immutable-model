/* test-SimpleRIMObject.js - Unit tests for SimpleRIMObject functions */

import { describe, it } from 'mocha'
import chai from 'chai'
import { Map } from 'immutable'
import SimpleRIMObject from '../src/SimpleRIMObject'

const TEST_ID = "BaseRIMObject1"
const TEST_CREATED = "DateCreated"
const TEST_UPDATED = "DateUpdated"

const testObj = new SimpleRIMObject({
  ID: TEST_ID,
  record_created: TEST_CREATED,
  record_updated: TEST_UPDATED
})

describe('SimpleRIMObject Core Functions', () => {
  it('Gets ID if present, newID if not', () => {
    chai.expect(testObj.getId()).to.equal(TEST_ID)
    const noIdObject = new SimpleRIMObject()
    chai.expect(noIdObject.getId()).to.equal(SimpleRIMObject._NewID)
  })
  it('Convenience getters return undefined if subclass clears keys', () => {
    class CoverageTest extends SimpleRIMObject {
      static _IdentityKey = undefined
      static _CreatedKey = undefined
      static _UpdatedKey = undefined
      constructor(startFrom) {
        super(startFrom)
      }
    }
    const testObj = new CoverageTest({key: "value"})
    chai.expect(testObj.getId()).to.equal(undefined)
    chai.expect(testObj.getCreated()).to.equal(undefined)
    chai.expect(testObj.getUpdated()).to.equal(undefined)
  })
})
