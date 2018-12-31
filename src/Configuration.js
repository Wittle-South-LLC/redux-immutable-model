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

  }
}

const RIMConfiguration = new Configuration()

export default RIMConfiguration
