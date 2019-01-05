/* Configuration.js - Configuration object for redux-immutable-model */

class Configuration {
  constructor() {
    this.getFetchURL = () => process.env.API_URL
    this.applyHeaders = (headers) => headers
    this.preProcessResponse = (response) => response
    this.getCollectionApiPath = (classname) => classname + 's'
    this.getApiPath = undefined
  }

  // Override default getFetchURL function that returns the value of
  // process.env.API_URL
  setGetFetchURL(myFunc) {
    this.getFetchUrl = myFunc
  }

  // Function that will modify headers as needed, intended to
  // allow for applying any API authentication required, needs
  // to return headers
  setApplyHeaders(myFunc) {
    this.applyHeaders = myFunc
  }

  // Function that will preprocess responses, intended to allo
  // application to collect any response information required
  // for security; needs to return response. Also useful for
  // providing internationalized error messages.
  setPreProcessResponse(myFunc) {
    this.preProcessResponse = myFunc
  }

  // When API calls return multiple domain objects, this library
  // assumes there will be a path within the results to find a
  // list of objects for each type. The default is the domain object
  // class name with an "s" appended. You can override this default
  // by supplying a getCollectionApiPath method in options that takes
  // a class name and response with a string representing the path
  setGetCollectionApiPath(myFunc) {
    this.getCollectionApiPath = myFunc
  }

  // API URLs may vary by application, and need to be customized
  // This method allows the application to provide a specific API URL
  // for a given verb and object
  setGetApiPath(myFunc) {
    this._getApiPath = myFunc
  }
}

const RIMConfiguration = new Configuration()

export default RIMConfiguration
