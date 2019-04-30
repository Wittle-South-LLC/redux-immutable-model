/* ReduxVerbs.js - Defines supported Redux verbs */

// TODO: Determine how this aligns to configura

const defaultVerbs = {
  CANCEL_NEW:       'CANCEL_NEW',       // Cancel a new empty object
  CANCEL_DELETE:    'CANCEL_DELETE',    // Cancels a two-phase delete that was started
  CANCEL_EDIT:      'CANCEL_EDIT',      // Cancel an edit operation (and revert)
  CREATE_NEW:       'CREATE_NEW',       // Create a new empty object
  DELETE:           'DELETE',           // Execute delete
  EDIT:             'EDIT',             // Change an object
  HYDRATE:          'HYDRATE',          // Reload state during client refresh
  LOGIN:            'LOGIN',            // Authenticate user
  LOGOUT:           'LOGOUT',           // Clear authentication
  READ:             'READ',             // Read object
  SAVE_NEW:         'SAVE_NEW',         // Create new object
  SAVE_UPDATE:      'SAVE_UPDATE',      // Update existing object
  SEARCH:           'SEARCH',           // Search for objects
  START_DELETE:     'START_DELETE',     // Starts a two-phase delete
  START_EDIT:       'START_EDIT'        // Start an editing operation
}

export default defaultVerbs
