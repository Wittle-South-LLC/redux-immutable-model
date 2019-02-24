import BaseRIMObject from './BaseRIMObject'
import BaseRIMService from './BaseRIMService'
import Configuration from './Configuration'
import callAPI from './ExecuteRestAPICall'
import defaultVerbs from './ReduxVerbs'
import status from './ReduxAsyncStatus'

module.exports = {
  BaseRIMObject: BaseRIMObject,
  BaseRIMService: BaseRIMService,
  Configuration: Configuration,
  defaultVerbs: defaultVerbs,
  callAPI: callAPI, 
  status: status
}