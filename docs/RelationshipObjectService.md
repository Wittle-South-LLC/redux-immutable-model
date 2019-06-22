RelationshipObjectService
===================

This class implements a container for RelationshipRIMObjects. Currently uses
two Immutable.js nested Map objects as containers, and provides a set of methods to
add / remove / update SimpleRIMObjects within that container.

See [here](BaseRIMService.md) for shared methods inherited from BaseRIMService.

Collection Access Methods
-------------------------
* getObjectMap (obj) - returns a map of instances where either the left or
  right ID of the relationship object matches the identity key of the simple
  object
* getObjectArray (obj) - - returns an array of instances where either the left or
  right ID of the relationship object matches the identity key of the simple
  object
* getById (id) - Returns the instance with the given (composite) ID
* getByIds (id1, id2) - Accepts left / right IDs to look up an instance

Collection Update Methods
-------------------------
* setById(obj) - Adds the object into the collection
* setCurrent (obj) - Sets the current object 
* setEditing (obj) - Sets the object into editing state

Service state tests
-------------------
* isCreating () - Returns true if there is a new object in the object array

Internal methods used by reducers
---------------------------------
* delete (obj) - Deletes the object from the continer
* getInitialState () - Returns initialized state for this service
* getReducer (verb) - Gets the relationshipReducer for the given verb
