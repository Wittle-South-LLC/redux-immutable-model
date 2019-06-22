BaseRIMService
==============

This class is the base class for services that manage collections of
redux-immutable-model (RIM) Objects. It implements shared methods that are
independent of the storage collection. There are multiple sub-classes that
add in storage collections and methods that depend on them.

Assumptions
-----------
1) Service provides a set of methods to do synchronous operations affecting
   collection state, and asynchronous operations affecting collection state.
2) Application is constructed to populate the client data model for an
   authenticated user in response to a login or rehydrate (refresh) request
3) Assumes that applications are interested in triggering route changes on
   successful asynchronous call results, and that error results will be handled
   from the route where the asynchronous calls were initiated.
4) Assumes that when an application searches for data model objects, the
   search results are transient, and should be managed as a separate
   collection.

Collection Management Actions
-----------------------------

* delete(obj) - Deletes instance whos ID matches the provided object
  This does not trigger a persistent delete, see commitDelete() for that.
* emptyState() - Clears all state for this data model object 
* getById(id) - Returns the instance specified by the given ID from the
  collection.
* getObjectMap() - Returns a Map object of all instances managed by this
  service.
* getObjectArray() - Returns an Array of all instances managed by this 
  service.
* getSearchResults() - Returns an array of Map() objects, one for each
  search result

Synchronous Redux Actions
-------------------------

Each of these returns a Redux action that updates the collection state

* cancelDelete () - Cancels a delete before commit
* cancelEdit () - Cancels an edit and reverts the object to its
pre-edit state
* cancelNew () - Deletes a new object without committing
* createNew () - Creates a new object instance and stores it in state
* editField - Updates a value in a field on an object instance
* startDelete(obj) - Sets the given object into a confirm delete state, which can either be committed or canceled.
* startEdit (obj) - Sets the object into editing state, and saves
a copy of the original pre-edit state.
* toggleSelected - Adds/removes to set of selected IDs

Persistence Actions
-------------------

Each of these actions will trigger an asynchronous RESTful API call. Each takes
a nextPath argument that can be used to trigger application path transitions
in response to successful asynchronous call results.

* commitDelete(obj, nextPath) - Executes RESTful API call to delete the instance
* hydrate (obj, nextPath) - Starts a hydrate call to collect initial state for a session
* read(obj, nextPath) - Reloads the object from the persistent store.
* saveNew(obj, nextPath) - Executes RESTful API call to persist a new instance
* saveUpdate(obj, nextPath) - Executes RESTful API call to persist changes to
  an existing instance
* search(searchtext, nextPath) - Executes a search for objects with the specified
  searchText

Redux Actions
-------------
These should be considered internal methods, and not overridden in subclasses.

* getState() - Returns the Redux state for this collection.
* reducer(state, action) - The reducer method handling all Redux state
  transitions for the collection of data model objects
* setState() - Sets the state for the service to the provided value

Application State Actions
-------------------------

Most of these are here for compatibility with legacy applications; these
methods are likely to be moved to a separate package in the future.

* afterLogoutSuccess() - Override this method to set the collection to an
  initialized state for unauthorized users. By default provides an empty
  collection for the data model object.
* getCurrent() - Returns the instance marked as "current" by the application
* getDeleting () - Gets the instance in deleting state if any or undefined
* getEditing() - Returns the ID of the instance marked as "editing" by the
  application
* isCreating() - Returns true if there are any *new* instances contained
  within the service instance
* isDeleting() - Returns true if there is an object in a deleting state
* isEditing() - Returns true if there is an object in editing state
* isFetching(obj) - Returns true if there is a RESTful API call in flight
  on the object.
* isSelected(obj) - Returns true if the provided object is in the set
  of selected objects
* setCurrent(obj) - Sets the "current" instance to the provided instance
* setDeleting(obj) - Sets the provided object into deleting state
* setEditing(obj) - Sets the provide object into editing state
* setEditing(obj) - Sets the "editing" instance to the provided instance
* setSelected(obj) - Adds the ID of the provided object into the set of
  selected IDs


Internal Methods
----------------

These methods are internal to this module, and as such are not designed to
be overridden or called directly.

* applyHeaders(headers) - Calls the application header customization method
  defined in the Configuration object supplied to the service constructor.
* clearError - Called at the start of a new asynchronous call, clears any
  error information from prior asynchronous calls.
* clearSelected - Removes an object from the set of selected objects
* getApiCollectionPath() - Calls the application collection path method from
  the Configuration object supplied to the service constructor.
* getApiPath() - Calls the API path method from the Configuration object
  supplied to the service constructor.
* getFetchURL() - Gets the base URL for the RESTful APIs for persistence
  operations for this data model object provided in the Configuraiton object
  passed to the service instance.
* getInitialState() - Returns blank state instance for this service
* getObjectClass() - Returns the JavaScript class to be used for all instances
  managed by this service. Assumed to be a subclass of BaseRIMObject.
* getStatePath() - Returns the services path in the overall Redux state model
* preProcessResponse() - Calls the preProcessResponse method defined in the
  Configuration object provided to the service constructor
* setError(message) - Called when an asynchronous API call returns an error,
  sets an error field in the service that contains the message, and is cleared
  at the start of the next asyncronous API call for the service.
* updateSearchObject() - During handling of successful saveUpdate asynchronous
  actions, synchronizes the state of an instance in search results with the
  values just persisted in the saveUpdate transaction.
