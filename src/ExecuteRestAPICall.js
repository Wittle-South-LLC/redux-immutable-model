/* ExecuteRestAPICall.js - Handles API call execution */

import fetch from 'isomorphic-fetch'
import status from './ReduxAsyncStatus'
import config from './Configuration'

// TODO: Ensure that pre-processing options can be used for Flask-JWT-Extended
//       - I expect it can, because I should be able to get cookies in response
//         post-processing, and set the CSRF header in header processing
// TODO: Ensure that post-processing can handle react-intl error customization
//       - I expect it can, because I should be able to do it in pre-process
//         response, with thrown errors if necessary
// TODO: Ensure that next path for react-router can work
//       - I expect this can be part of the standard payload, but I'm honestly
//         not entirely sure how this will need to work

export default function execute (service, verb, method, rimObj, nextPath = undefined) {
  // If the object needs validation and validation fails, then
  // throw an exception
  /* istanbul ignore if - this is development debugging code */
  if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_LEVEL >= 1) {
    console.log(`execute: ${verb} with ${method} on ${rimObj.constructor.name}`)
  }
  // if item is a RIMObject and has a validateAction method, call it
  // for this verb to see if the object is in a state to proceed
  if (rimObj.validateAction && !rimObj.validateAction(verb)) {
    throw new Error(VALIDATION_FAILED)
  }
  return (dispatch) => {
    // We're only going to do a fetch if there isn't one in flight
    /* istanbul ignore else - Code is unreachable by design */
    if (!service.isFetching(rimObj)) {
      let payload = {
        apiUrl: config.getFetchURL() + service.getApiPath(verb, rimObj),
        method,
        verb,
        nextPath,
        rimObj
      }
      if (method !== 'GET') {
        payload['sendData'] = rimObj.getFetchPayload(verb)
      }
      /* istanbul ignore if - development only functionality */
      if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_LEVEL >= 2) {
        console.log('execute: dispatching fetchRIMObject with payload:', payload)
      }

      // If function to customize headers exists, call it on the standard headers 
      const requestHeaders = config.applyHeaders
        ? config.applyHeaders(getApiHeaders(payload))
        : getApiHeaders(payload)

      // Update state indicating fetch has started
      /* istanbul ignore if - development only functionality */
      if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_LEVEL >= 2) {
        console.log('fetchRIMObject: dispatching fetchStart with payload:', payload)
      }
      dispatch(fetchStart(payload))

      // Start the fetch action
      return fetch(payload.apiUrl, requestHeaders)
        .then(response => {

            /* istanbul ignore if - development only functionality */
            if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_LEVEL >= 2) {
              console.log('fetchRIMObject: response recieved:', response)
            }
            // If function to pre-process responses exists, call it
            if (config.preProcessResponse) {
              response = config.preProcessResponse(response)
            }

            // Call function that will get the response JSON or
            // throw an exception if the response is not OK
            return getResponseJSON(payload.method, response)
        })
        .then(json => dispatch(fetchSuccess(payload, json)))
        .catch(error => dispatch(fetchError(payload, error)))
    } else {
      console.log('execute for ' + rimObj.constructor.name + 
                  ' called with action ' +  action.verb + ' while fetching')
      return Promise.resolve()
    }
  }
}


/* Creates API headers for a fetch request based on payload information */
export function getApiHeaders (payload) {
  const result = {
    'method': payload.method,
    'headers': {
      'Content-Type': 'application/json',
    }
  }
  if ('sendData' in payload && payload.sendData !== undefined) {
    // Note that fetch will refuse to process a GET request that has a body
    // for standards compliance reasons
    if (payload.method === 'GET') {
      throw new Error('Application Error: GET method with a body in sendData')
    }
    result['body'] = JSON.stringify(payload.sendData)
  }
  return result
}

// Check the response code and return json if appropriate
function getResponseJSON (httpVerb, response) {
  if (response.ok) {
    // NOTE: The HTTP protocol doesn't allow payload for DELETE verb, so no JSON
    if (httpVerb !== 'DELETE') {
      return response.json()
    } else {
      return undefined
    }
  } else {
    throw new Error(response.text)
  }
}

/* Redux action for all fetch starts */
function fetchStart (payload) {
  return { type: 'async', status: status.START, verb: payload.verb, rimObj: payload.rimObj }
}

/* Redux action for all fetch errors */
function fetchError (payload, error) {
  return {
    type: 'async',
    status: status.ERROR,
    verb: payload.verb,
    rimObj: payload.rimObj,
    nextPath: payload.nextPath,
    error
  }
}

/* Redux action for all fetch successes */
function fetchSuccess (payload, receivedData) {
  return {
    type: 'async',
    status: status.SUCCESS,
    verb: payload.verb,
    rimObj: payload.rimObj,
    nextPath: payload.nextPath,
    receivedData
  }
}

