BaseRIMObject
=============

This class extends ImmutableInherit, adding a core understanding of
client object state relative to server persistent storage, as well 
as support for constructing HTTP request payloads suitable for
RESTful APIs.

Assumptions
-----------
1) When creating a new instance of a data model object, the application will
   need a client-side representation of an instance that can be manipulated to
   achieve a minimum level of completeness before persistence to the server.
   Such an object instance is *new*, and will have a temporary client-generated
   ID. When sufficiently complete, it will be saved / persisted, and the server
   will respond with a permanent ID for the instance.
2) When editing an instance of an existing data model object, there may be
   multiple interactions between the application and the user before changes
   are complete and ready to be persisted. Once the first change is made to
   an instance, the instance should be marked *dirty*, indicating the instance
   in the client is no longer consistent with the persisted instance. Once
   changes are complete, the instance will be saved / persisted, and the
   instance becomes no longer dirty. Instances that are not dirty cannot
   have a save / persist action executed on them, as there is no need.
3) Any RESTful API call is asynchronous, and during the execution of a
   RESTful API call that involves an instance, no additional RESTful API
   calls involving the instance should be initiated. When a RESTful API call
   is initiated on an instance, it should be marked *fetching*, and once the
   API call completes, the *fetching* state should be cleared.

The intent of this class is to provide a base object that facilitates 
implementation of the above assumptions; if these assumptions are not true for
your application, this class may be unsuitable, or may need customization.

Client State Attributes
-----------------------

* isNew() / setNew() - Identifies whether this object is new, meaning it 
  exists in the client but has no presence on the server
* isDirty() / setDirty() - Identifies whether this object has changes in
  the client that have not yet been persisted.
* isFetching / setFetching() - Identifies whether an asynchronous operation
  is in progress for this object

Immutable Support Methods
-------------------------

* updateField(key, value, isDirty) - Updates a data field and returns a
  new instance of the object with the updated value. Defaults to the
  new object being dirty, but that can be overridden by providing a 
  false value for the isDirty argument

Asynchrounous Support Methods
-----------------------------

These methods support shared-code implementations of basic CRUD operations
via RESTful APIs with "application/json" type payloads. They will depend on
class-static data structures that will need to be overridden by subclasses
to work effectively. See examples for details.

* getFetchPayload(action) - Intended to return a JSON object suitable for
      RESTful API payload for the specific action
* afterCreateSuccess() - Method that allows customization of the object once
      the permanent ID has been received in response to a create RESTful API
      call
* afterUpdateSuccess() - Method that allows customization of the object once
      a successful update RESTful API call

Shared Model Attributes
-----------------------

These are convenience methods that are likely to be shared across most
data model implementations. (Yes, like many other frameworks, this one
is a bit opinionated in a few spots.)

* getCreated() - Returns the creation date for this object
* getUpdated() - Returns the last updated date for this object
