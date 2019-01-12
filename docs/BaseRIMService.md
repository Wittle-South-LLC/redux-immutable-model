BaseRIMService
==============

This class implements state / collection management for a data model object.
It is intended to manage all instances of the data model object within an
application, and handle all state changes associated with the collection of
instances as part of Redux operations.

Assumptions
-----------
1) All instances can be uniquely identified by an ID.
2) Current implmenetation manages the collection of instances as an Immutable
   Map; if you have use cases for other Immutable collection types, please
   submit an issue.
3) Application is constructed to populate the client data model for an
   authenticated user in response to a login or rehydrate (refresh) request
4) Assumes that applications are interested in triggering route changes on
   successful asynchronous call results, and that error results will be handled
   from the route where the asynchronous calls were initiated.
5) Assumes that when an application searches for data model objects, the
   search results are transient, and should be managed as a separate
   collection.

Collection Management Actions
-----------------------------

* deleteId(id) - Deletes the instance with the given ID from the collection.
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

Persistence Actions
-------------------

Each of these actions will trigger an asynchronous RESTful API call. Each takes
a nextPath argument that can be used to trigger application path transitions
in response to successful asynchronous call results.

* read(obj, nextPath) - Reloads the object from the persistent store.
* saveNew(obj, nextPath) - Executes RESTful API call to persist a new instance
* saveUpdate(obj, nextPath) - Executes RESTful API call to persist changes to
  an existing instance
* commitDelete(obj, nextPath) - Executes RESTful API call to delete the instance
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
* getCurrentId() - Gets the ID of the instance marked as "current" by the
  application
* getEditingId() - Returns the ID of the instance marked as "editing" by the
  application
* isCreating() - Returns true if there are any *new* instances contained
  within the service instance
* isFetching(obj) - Returns true if there is a RESTful API call in flight
  on the object.
* setCurrent(obj) - Sets the "current" instance to the provided instance
* setCurrentId(id) - Sets the "current" instance to the instance with the
  provided ID
* setEditingId(id) - Sets the "editing" instance to the instance with the
  provided ID

Internal Methods
----------------

These methods are internal to this module, and as such are not designed to
be overridden or called directly.

* applyHeaders(headers) - Calls the application header customization method
  defined in the Configuration object supplied to the service constructor.
* clearError - Called at the start of a new asynchronous call, clears any
  error information from prior asynchronous calls.
* getApiCollectionPath() - Calls the application collection path method from
  the Configuration object supplied to the service constructor.
* getApiPath() - Calls the API path method from the Configuration object
  supplied to the service constructor.
* getFetchURL() - Gets the base URL for the RESTful APIs for persistence
  operations for this data model object provided in the Configuraiton object
  passed to the service instance.
* getObjectClass() - Returns the JavaScript class to be used for all instances
  managed by this service. Assumed to be a subclass of BaseRIMObject.
* preProcessResponse() - Calls the preProcessResponse method defined in the
  Configuration object provided to the service constructor
* setError(message) - Called when an asynchronous API call returns an error,
  sets an error field in the service that contains the message, and is cleared
  at the start of the next asyncronous API call for the service.
* updateSearchObject() - During handling of successful saveUpdate asynchronous
  actions, synchronizes the state of an instance in search results with the
  values just persisted in the saveUpdate transaction.
