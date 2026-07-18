# EVisa Application

Domain model for nationality eligibility, visa types, and the application workflow that connects them.

## Language

**Visa Exemption** (`VisaNationality.ExemptionDays`):
A number of days a nationality's citizens may stay in Vietnam without any visa at all. Distinct from an e-visa application — a nationality with a visa exemption can still choose to apply for an e-visa for a longer stay.
_Avoid_: Exception (see below — a different concept, despite the similar name)

**Eligible** (`VisaNationality.IsEligible`):
Whether a nationality is permitted to apply for an e-visa at all, independent of visa type.

**Nationality Group** (`NationalityGroup`):
A named cohort of nationalities that visa types can restrict as a unit, rather than restricting individual nationalities one by one. A nationality belongs to at most one group.

**Restricted Group** (`VisaTypeGroupRestriction`):
A `NationalityGroup` that a given `VisaType` has flagged as requiring mandatory review. An applicant whose nationality belongs to one of the visa type's restricted groups is Pending for that visa type, unless an Exception applies.
_Note_: Being Restricted is deliberately _not_ discoverable up front the way Excluded is — the list of visa types offered to a nationality is never filtered or annotated by restriction status. A client only learns a (VisaType, Nationality) pair will land in Pending by checking the visa type's restricted groups and exceptions itself, or by submitting and reading the resulting status. Don't assume the two concepts share a discovery mechanism just because they share a "list of NationalityGroups" shape.

**Exception** (`VisaTypeNationalityException`):
A specific (VisaType, Nationality) pair that lifts a group restriction for that pair only. An exception does not carry over to other visa types, and it doesn't need to correspond to an actual restriction — an exception for a nationality that was never in a restricted group is allowed and simply has no effect.
_Avoid_: Waiver, override, exemption (see Visa Exemption — a different concept)

**Pending** (`ApplicationStatus.PendingReview`):
The status assigned to a `VisaApplication` at submission time when at least one applicant's nationality is in a Restricted Group for the selected visa type, with no Exception covering that pair. Distinct from `UnderReview`.

**Excluded Group** (`VisaProcessingGroupExclusion`):
A `NationalityGroup` that a given `VisaProcessing` option has flagged as unavailable to it. Unlike a Restricted Group, exclusion is hard: an applicant whose nationality belongs to one of a processing option's excluded groups cannot select it at all — the option is removed from the choices offered rather than flagged, and there is no Exception mechanism to lift it. Submitting an excluded (NationalityGroup, VisaProcessing) pair anyway is rejected outright, not routed to Pending.
_Avoid_: Restricted (see Restricted Group — that concept is deliberately softer: selectable, just flagged Pending)
