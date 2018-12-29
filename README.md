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

Stay tuned for more details...
