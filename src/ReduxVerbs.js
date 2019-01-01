/* ReduxVerbs.js - Defines supported Redux verbs */

// TODO: Determine how this aligns to configura

const verbs = {
  HYDRATE:          'HYDRATE',          // Reload state during client refresh
  LOGIN:            'LOGIN',            // Authenticate user
  LOGOUT:           'LOGOUT',           // Clear authentication
  READ:             'READ',             // Read object
  DELETE:           'DELETE',           // Execute delete
  SAVE_NEW:         'SAVE_NEW',         // Create new object
  SAVE_UPDATE:      'SAVE_UPDATE',      // Update existing object
  SEARCH:           'SEARCH'            // Search for objects
}

export default verbs
