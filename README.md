redux-immutable-model
=====================

This module contains the infrastructure necessary to dramatically simplify
the use of Redux for complex data models and application state changes. It
leverages immutable-inherit as the base of entity objects that are immutable
yet support inheritance, creating the opportunity to share logic across
models.

In addition, this library standardizes asynchronous access across model 
objects, and provides a base implementation of most synchronous and
asynchronous tasks that can also be shared across different model objects.

Finally, this library is the baseline for OpenAPI 3.0 automated code 
generation that can generate a complete Redux capable model from an
OpenAPI 3.0 set of schemas.

Based on ImmutableInherit
-------------------------

This project goes beyond what is available in ImmutableInherit by adding 
a core understanding of asynchronous object state, as well as support
for constructing HTTP request payloads suitable for XXX APIs.

Client State Attributes
-----------------------

* isNew() / setNew() - Identifies whether this object is new, meaning
  it exists in the client but has no presence on the server
* isDirty() / setDirty() - Identifies whether this object has been changed 
  on the client side.
* isFetching / setFetching() - Identifies whether an asynchronous operation
  is in progress for this object

Asynchrounous Support Methods
-----------------------------

These methods support shared-code implementations of basic CRUD operations.
They will depend on class-static data structures that will need to be
overridden by subclasses to work effectively. See examples for details.

* getCreatePayload() - Intended to return a JSON object suitable for RESTful
  create actions
* getUpdatePayload() - Intended to return a JSON object suitable for RESTful
  update actions

Shared Model Attributes
-----------------------

These are convenience methods that are likely to be shared across most
data model implementations. (Yes, like many other frameworks, this one
is a bit opinionated in a few spots.)

* getId() - Returns the unique identifier for this object
* getCreated() - Returns the creation date for this object
* getUpdated() - Returns the last updated date for this object
