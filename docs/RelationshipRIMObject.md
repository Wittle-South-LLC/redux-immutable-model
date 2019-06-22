RelationshipRIMObject
=====================

This class extends BaseRIMObject, adding the expectation of two UUIDs as the
primary key for an instance, where each UUID links to a SimpleRIMObject.

See [here](BaseRIMObject.md) for shared methods inherited from BaseRIMObject.

Assumptions
-----------
1) Every instance of every RelationshipRIMObject has a left ID and a right ID,
   the combination of which uniquely identifies an instance
2) The left ID and right ID uniquely identify specifici SimpleRIMObject
   instances.
3) For every relationship, there will be a subclass of RelationshipRIMObject
   specific to the relationship

Inherits the assumptions of BaseRIMObject

Model Attributes
-----------------------

These are convenience methods that are specific to SimpleRIMObject.

* getId() - Returns a composite unique identifier for an instance,
    which is constructed as a string in the form "left_id/right_id"
* getLeftId() - Returns the left ID for the instance
* getRightId() - Returns the right ID for the instance
