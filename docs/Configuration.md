Configuration
=============

The Configuration class is intended to provide application-specific
customization behavior for redux-immutable-model services. Specifically, it
supports:

* API operation customization - This framework supports a core set of CRUD
  API operations by default, and the Configuration object allows the
  application to extend the set of RESTful API actions for a data model 
  object
* Security framework integration - Most RESTful APIs require special values
  in cookies, HTTP headers, or request bodies to authenticate transactions.
  The Configuration class allows applications to provide methods to
  pre-process API responses to extract security information (tokens or
  cookies), and request header customization methods to provide cookies or
  HTTP headers as needed for the security framework.
* Internationalization - The Configuration object provides methods intended
  to support i18n; applications can pre-process API responses to generate
  i18n compatible error messages as needed.
* State structure - The Configuration object provides methods to allow the
  application to customize where data model objects are stored within the
  overall Redux state
* Multi-object response customization - The Configuration object allows the
  application to customize the path where instances of each object class
  are provided in API calls that return instancess of multiple object classes
  (e.g. Login, Rehydrate)

API Operation Customization Methods
-----------------------------------

* addVerb(verb, reducer) - Adds a verb with an associated reducer function to
  the default collection. The verb should be a text value corresponding to the
  action, and the reducer should handle successful asynchronous API calls to 
  for that verb.
* setGetFetchURL(func) - Allows the application to override the default method
  for getting the base fetch URL for the application. The fetch URL provides
  the base URL, getApiURL provides the API path relative to the fetchURL.
* setGetCollectionApiPath(func) - Allows the application to override the
  default path within an API response for data model objects.
* setGetApiPath(func) - Allows the application to override the default path
  for API operations on a given data model object.

Security Framework Integration Methods
--------------------------------------

* setApplyHeaders(func) - Allows the application to provide a function to
  process the default headers and extend/modify them as needed to meet
  meet application security requirements. The provided function is called 
  with the default headers for a fetch call, and needs to return an updated
  set of headers.
* setPreProcessResponse(func) - Dual purpose method, supports security
  framework integration as well as internationalization. In the security case,
  allows the application to collect cookies or other information provided by
  the API server in an API response, to potentially be used in future requests.
  For example, in some CSRF protection schemes, the application must provide
  a cookie received during initial session authentication as a header in
  future requests. The funciton provided here can collect the required cookie
  value, and use it in future applyHeaders calls.

Internationalization Support Methods
------------------------------------
* setPreProcessResponse(func) - Dual purpose method, supports security
  framework integration as well as internationalization. In the i18n case,
  this method can be used to detect errors in asynchronous operations, and
  generate i18n application behavior.

Internal Methods
----------------

These methods should not be overridden or called externally.

* getReducer(verb) - Gets the reducer function for a given verb.