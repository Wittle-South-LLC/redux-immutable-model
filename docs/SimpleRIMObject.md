SimpleRIMObject
=============

This class extends BaseRIMObject, adding the expectation of a single UUID
as the identifier.

See [here](BaseRIMObject.md) for shared methods inherited from BaseRIMObject.

Assumptions
-----------
1) Every instance of every data model object has an ID that is unique
2) Relationships between SimpleRIMObjects can be represented by
   RelationshipRIMObjects

Inherits the assumptions of BaseRIMObject

Model Attributes
-----------------------

These are convenience methods that are specific to SimpleRIMObject.

* getId() - Returns the unique identifier for this object
