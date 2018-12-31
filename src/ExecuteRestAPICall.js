/* ExecuteRestAPICall.js - Handles API call execution */

import fetch from 'isomorphic-fetch'
import status from './ReduxAsyncStatus'
import config from './Configuration'

export default function execute (rimObj, method, verb) {
  // If the object needs validation and validation fails, then
  // throw an exception
  if (rimObj.validateAction && !rimObj.validateAction(verb)) {
    throw new Error(VALIDATION_FAILED)
  }
  return (dispatch) => {
    // We're only going to do a fetch if there isn't one in flight
    if (!rimObj.fetching) {
      let payload = {
        apiUrl: rimObj.constructor._ApiBasePath,
        method,
        verb,
        rimObj
      }
      payload['sendData'] = rimObj.getFetchPayload(action.verb)
      return dispatch(fetchRIMObject(payload))
    } else {
      console.log('execute for ' + rimObj.constructor.name + 
                  ' called with action ' +  action.verb + ' while fetching')
      return Promise.resolve()
    }
  }
}

// TODO: Ensure that pre-processing options can be used for Flask-JWT-Extended
//       - I expect it can, because I should be able to get cookies in response
//         post-processing, and set the CSRF header in header processing
// TODO: Ensure that post-processing can handle react-intl error customization
//       - I expect it can, because I should be able to do it in pre-process
//         response, with thrown errors if necessary
// TODO: Ensure that next path for react-router can work
//       - I expect this can be part of the standard payload, but I'm honestly
//         not entirely sure how this will need to work

// This function is assumed to be called as a Redux action
function fetchRIMObject (payload) {
  return (dispatch) => {
    // If function to customize headers exists, call it on the standard headers 
    const requestHeaders = config.applyHeaders
      ? config.applyHeaders(getApiHeaders(payload))
      : getApiHeaders(payload)

    // Update state indicating fetch has started
    dispatch(fetchStart(payload))

    // Start the fetch action
    return fetch(config.getFetchURL(), requestHeaders)
      .then(response => {

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
  return { status: status.START, verb: payload.verb, payload }
}

/* Redux action for all fetch errors */
function fetchError (payload, error) {
  return {
    status: status.ERROR,
    verb: payload.verb,
    payload,
    error
  }
}

/* Redux action for all fetch successes */
function fetchSuccess (payload, receivedData) {
  return {
    status: status.SUCCESS,
    verb: payload.verb,
    payload,
    receivedData
  }
}

