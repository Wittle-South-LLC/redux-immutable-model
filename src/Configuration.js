/* Configuration.js - Configuration object for redux-immutable-model */

class Configuration {
  constructor(options) {

    // Function that will return the API URL to use for fetches
    this.getFetchURL = options && options.apiURL
      ? options.apiURL
      : () => process.env.API_URL

    // Function that will modify headers as needed, intended to
    // allow for applying any API authentication required, needs
    // to return headers
    this.applyHeaders = options && options.applyHeaders
      ? options.applyHeaders
      : undefined

    // Function that will preprocess responses, intended to allo
    // application to collect any response information required
    // for security; needs to return response
    this.preProcessResponse = options && options.preProcessResponse
      ? options.preProcessResponse
      : undefined

    // When API calls return multiple domain objects, this library
    // assumes there will be a path within the results to find a
    // list of objects for each type. The default is the domain object
    // class name with an "s" appended. You can override this default
    // by supplying a getCollectionApiPath method in options that takes
    // a class name and response with a string representing the path
    this.getCollectionApiPath = options && options.getCollectionApiPath
      ? options.getCollectionApiPath
      : undefined

    // API URLs may vary by application, and need to be customized
    // This method allows the application to provide a specific API URL
    // for a given verb and object
    this.getApiPath = options && options.getApiPath
      ? options.getApiPath
      : undefined
  }
}

const RIMConfiguration = new Configuration()

export default RIMConfiguration
