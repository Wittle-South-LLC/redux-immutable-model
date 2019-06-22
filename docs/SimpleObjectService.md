SimpleObjectService
===================

This class implements a container for SimpleRIMObjects. Currently uses an
Immutable.js Map object as the container, and provides a set of methods to
add / remove / update SimpleRIMObjects within that container.

See [here](BaseRIMService.md) for shared methods inherited from BaseRIMService.

Collection Access Methods
-------------------------
* getObjectMap () - returns the object map in raw form
* getObjectArray () - Gets the contained objects in a list
* getById (id) - Returns the instance with the given ID
* getSearchResults () - Gets search result objects as an array

Collection Update Methods
-------------------------
* setById(obj) - Adds the object into the collection
* setEditing (obj) - Sets the object into editing state

Service state tests
-------------------
* isCreating () - Returns true if there is a new object in the object array
* isFetching (obj) - Returns true if the given object is being fetched

Internal methods used by reducers
---------------------------------
* delete (obj) - Deletes the object from the continer
* getInitialState () - Returns initialized state for this service
* getReducer (verb) - Gets the simpleReducer for the given verb
* updateSearchObject(searchObject, rimObject) - Updates the search result
  object with the current values from the rimObject