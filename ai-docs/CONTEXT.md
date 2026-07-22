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
_Note_: Being Restricted is deliberately *not* discoverable up front the way Excluded is — the list of visa types offered to a nationality is never filtered or annotated by restriction status. A client only learns a (VisaType, Nationality) pair will land in Pending by checking the visa type's restricted groups and exceptions itself, or by submitting and reading the resulting status. Don't assume the two concepts share a discovery mechanism just because they share a "list of NationalityGroups" shape.

**Exception** (`VisaTypeNationalityException` / `VisaProcessingNationalityException`):
A specific (VisaType, Nationality) or (VisaProcessing, Nationality) pair that fully lifts a group restriction or exclusion for that pair only — the applicant is treated as if the restriction/exclusion never applied (no Pending flag for VisaType, fully selectable again for VisaProcessing). An exception does not carry over to other visa types or processing options, and it doesn't need to correspond to an actual restriction/exclusion — an exception for a nationality that was never restricted or excluded is allowed and simply has no effect.
_Avoid_: Waiver, override, exemption (see Visa Exemption — a different concept)

**Pending** (`ApplicationStatus.PendingReview`):
The status assigned to a `VisaApplication` at submission time when at least one applicant's nationality is in a Restricted Group for the selected visa type, with no Exception covering that pair. Distinct from `UnderReview`.

**Excluded Group** (`VisaProcessingGroupExclusion`):
A `NationalityGroup` that a given `VisaProcessing` option has flagged as unavailable to it by default. An applicant whose nationality belongs to one of a processing option's excluded groups cannot select it — the option is removed from the choices offered rather than flagged — unless an Exception covers that (VisaProcessing, Nationality) pair, in which case the option is fully available again, same as if it had never been excluded. Submitting an excluded (NationalityGroup, VisaProcessing) pair with no covering Exception is rejected outright, not routed to Pending.
_Avoid_: Restricted (see Restricted Group — an active Restricted Group always produces Pending, never a hard block; an active Excluded Group always produces a hard block, never Pending. The two converge only once an Exception lifts them.)

**Nationality Price Override** (`VisaProcessingNationalityPrice`):
A per-(VisaProcessing, Nationality) price that replaces the processing option's default `Price` for applicants of that nationality. Independent of Exception and Excluded Group — a nationality can have a price override regardless of whether it is excluded, exception-listed, or neither; the override only takes effect once the option is actually selectable for that nationality. At most one override exists per (VisaProcessing, Nationality) pair; adding one for a pair that already has one replaces the price rather than creating a second row.
_Avoid_: Exception (a different, pre-existing concept — Exception is a boolean that lifts a restriction/exclusion and carries no price; it does not imply a price override, and a price override does not imply an Exception)

**Requires Extra Details** (`VisaNationality.RequiresExtraDetails`):
A flag on a nationality, independent of Eligible, Restricted Group, and Excluded Group, that marks applicants of that nationality as needing to supply the Extra Details fields (see below) at submission and on update. Whether an application needs them is decided once, from the first applicant's `NationalityId` only — since a `VisaApplication` enforces a single shared nationality across all its applicants, there is no per-applicant divergence to resolve.
_Avoid_: Restricted Group / Pending (a different, unrelated mechanism — Requires Extra Details is a standalone per-nationality boolean and has no connection to a `VisaType`'s restricted groups or to `ApplicationStatus.PendingReview`, despite both being loosely about "this nationality needs more scrutiny." A frontend planning doc once described Extra Details as gated by Pending status; that description does not match the implementation and should not be treated as authoritative.)

**Extra Details fields**:
The set of fields collected only when Requires Extra Details applies to the application's shared nationality. Split into two shapes:
- Per-applicant (`Applicant.Religion`, `PhoneInCountry`, `UsedOtherPassport`, `OtherPassportNumber`, `ViolatedLaws`, `ViolationDetails`) — collected once per traveler on the application.
- Shared/application-level (`VisaApplication.EmergencyContact*`, `OccupationCompanyName`/`OccupationJobTitle`/`OccupationCompanyPhone`/`OccupationCompanyAddress`, `VnStayAddress`/`VnStayPhone`, `VnVisitedLastYear`/`VnVisitDetails`/`VnHasRelatives`/`VnRelativeDetails`) — collected once for the whole application, not per traveler.
All are nullable/optional at the storage level; enforcement of "required when Requires Extra Details is set" is application logic (`ApplicationService.ValidateApplicantExtraDetails` / `ValidateSharedExtraDetails`), not a database constraint.

**Company in Vietnam** (`VisaApplication.CompanyName`, `CompanyPhone`, `CompanyAddress`):
Details of the sponsoring/host company in Vietnam for an applicant traveling for Business or Working purposes. Optional server-side (nullable, no backend validation) — required-ness when Purpose of Travel is `"Business"` or `"Working"` is enforced client-side only. Unrelated to Requires Extra Details or Restricted Group; gated purely on `PurposeOfTravel`.
