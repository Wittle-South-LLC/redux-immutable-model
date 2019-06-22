/* test-BaseRIMService.js - Unit tests for BaseRIMService */

import { before, describe, it } from 'mocha'
import chai from 'chai'
import Configuration from '../src/Configuration'
import BaseRIMObject from '../src/BaseRIMObject'
import BaseRIMService from '../src/BaseRIMService'

const config = new Configuration()
// Create a service that should contain the test object
const testService = new BaseRIMService(BaseRIMObject, config)

// Create a test class different than the default for tests that need it
class testClass extends BaseRIMObject {
  constructor(createFrom) { super (createFrom) }
  getInitialState() { return "Test" }
}
// Create a new object of the class
const tcObject = new testClass({})

describe('BaseRIMService collection management functions', () => {
  before(() => {
    chai.expect(testService).to.exist
  })
  it('getObjectClass() returns the ObjectClass when asked', () => {
    chai.expect(testService.getObjectClass() === BaseRIMObject)
  })
  it('getStatePath() returns default state path', () => {
    chai.expect(testService.getStatePath()).to.equal('BaseRIMObjects')
  })
})

describe('BaseRIMService UI workflow support methods', () => {
  before(() => {
    testService.emptyState()
  })
  it('getCurrent() returns undefined when no ID is current', () => {
    chai.expect(testService.getCurrent()).to.be.undefined
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
})
