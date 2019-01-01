/* TestUtils.js - Utilities to make testing less of a pain in the ass */
import { is } from 'immutable'
var diff = require('deep-diff').diff

// Goal here is to check to see if two given immutable objects are identical
// using stock is function, and if not automatically log the differences
const filterDiff = (path, key) => key === '_hashCode'
export function isd (from, to, msg = undefined) {
  let result = is(from, to)
  if (!result) {
    try {
      let d = diff(from.toJS(), to.toJS(), filterDiff)
      if (d) {
        if (msg) { console.log(msg) }
        console.log(d)
//        console.log('from: ', JSON.stringify(from.toJS(), null, 2))
//        console.log('to:   ', JSON.stringify(to.toJS(), null, 2))
      } else {
        console.log('is says objects are different, diff feels otherwise')
        console.log('from: ', from.toJS())
        console.log('to:   ', to.toJS())
      }
    } catch (e) {
      console.log('TestUtils NOTE: Caught exception in diff', e, result)
      console.log('from = ', from.toJS())
      console.log('to   = ', to.toJS())
    }
  }
  return result
}

// Deep log an object
export function logDeep (obj) {
  return JSON.stringify(obj, null, 2)
}

// This function combines the fetch start and fetch end testing for
// a given async call. The first state is the expected state of the
// store once fetch starts, and the second is the expected state when
// the fetch ends. This utility function dramatically reduces the
// size of files for testing state.
export function testAsync (store, firstState, secondState, done) {
  let firstUpdate = true
  let unsubscribe = store.subscribe(() => {
    if (firstUpdate) {
      if (firstState && !isd(store.getState(), firstState, 'In FETCH_START:')) {
//        console.log('First store.getState() = ', JSON.stringify(store.getState().toJS(), null, 2))
//        console.log('firstState = ', JSON.stringify(firstState.toJS(), null, 2))
        done(new Error('Difference in FETCH_START - check inline'))
      }
      firstUpdate = false
    } else {
      unsubscribe()
      if (!isd(store.getState(), secondState, 'In fetch result: ')) {
//        console.log('store.getState() = ', JSON.stringify(store.getState().toJS(), null, 2))
//        console.log('secondState = ', JSON.stringify(secondState.toJS(), null, 2))
        done(new Error('Difference in completed fetch - check inline'))
      } else {
        done()
      }
    }
  })
}
