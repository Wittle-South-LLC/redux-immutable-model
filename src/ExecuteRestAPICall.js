/* ExecuteRestAPICall.js - Handles API call execution */

import fetch from 'isomorphic-fetch'
import actionTypes from './ActionTypes'
import status from './ReduxAsyncStatus'

// TODO: Ensure that pre-processing options can be used for Flask-JWT-Extended
//       - I expect it can, because I should be able to get cookies in response
//         post-processing, and set the CSRF header in header processing
// TODO: Ensure that post-processing can handle react-intl error customization
//       - I expect it can, because I should be able to do it in pre-process
//         response, with thrown errors if necessary
// TODO: Ensure that next path for react-router can work
//       - I expect this can be part of the standard payload, but I'm honestly
//         not entirely sure how this will need to work

export default function callAPI (service, verb, method, rimObj, nextPath = undefined) {
  // If the object needs validation and validation fails, then
  // throw an exception
  /* istanbul ignore if - this is development debugging code */
  if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_LEVEL >= 1) {
    console.log(`callAPI: ${verb} with ${method} on ${rimObj.constructor.name}`)
  }
  // if item is a RIMObject and has a validateAction method, call it
  // for this verb to see if the object is in a state to proceed
  if (!service.config.validOperation(verb, rimObj)) {
    throw new Error('VALIDATION_FAILED')
  }
  return (dispatch) => {
    // We're only going to do a fetch if there isn't one in flight
    /* istanbul ignore else - Code is unreachable by design */
    if (!service.isFetching(rimObj)) {
      let payload = {
        apiUrl: service.config.getFetchURL() + service.getApiPath(verb, rimObj),
        method,
        verb,
        serviceName: service.name,
        nextPath,
        rimObj
      }
      if (method !== 'GET') {
        payload['sendData'] = rimObj.getFetchPayload(verb)
      }

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_LEVEL >= 2) {
        console.log('callAPI: dispatching fetchRIMObject with payload:', payload)
      }

      // If function to customize headers exists, call it on the standard headers 
      const requestHeaders = service.config.applyHeaders(verb, getApiHeaders(payload))

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
            response = service.config.preProcessResponse(response)

            // Call function that will get the response JSON or
            // throw an exception if the response is not OK
            return getResponseJSON(payload.method, response)
        })
        .then(json => dispatch(fetchSuccess(payload, json)))
        .catch(error => {
          console.log('redux-immutable-model.callAPI: Caught error: ', error)
          if (error.text && typeof error.text === "function") {
            error.text().then( errorMessage => {
              dispatch(fetchError(payload, errorMessage))
            })
          } else {
            dispatch(fetchError(payload, error))
          }
        })
    } else {
      console.log('callAPI for ' + rimObj.constructor.name + 
                  ' called with action ' +  action.verb + ' while fetching')
      return Promise.resolve()
    }
  }
}


/* Creates API headers for a fetch request based on payload information */
function getApiHeaders (payload) {
  const result = {
    'method': payload.method,
    'headers': {
      'Content-Type': 'application/json',
    }
  }
  if ('sendData' in payload && payload.sendData !== undefined) {
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
    throw(response)
  }
}

/* Redux action for all fetch starts */
function fetchStart (payload) {
  return {
    type: actionTypes.ASYNC,
    status: status.START,
    verb: payload.verb,
    serviceName: payload.serviceName,
    rimObj: payload.rimObj
  }
}

/* Redux action for all fetch errors */
function fetchError (payload, errorMessage) {
  return {
    type: actionTypes.ASYNC,
    status: status.ERROR,
    verb: payload.verb,
    rimObj: payload.rimObj,
    nextPath: payload.nextPath,
    serviceName: payload.serviceName,
    errorMessage
  }
}

/* Redux action for all fetch successes */
function fetchSuccess (payload, receivedData) {
  return {
    type: actionTypes.ASYNC,
    status: status.SUCCESS,
    verb: payload.verb,
    rimObj: payload.rimObj,
    nextPath: payload.nextPath,
    serviceName: payload.serviceName,
    receivedData
  }
}

