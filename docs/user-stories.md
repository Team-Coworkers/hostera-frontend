# User Stories

## Overview

This document contains the user stories implemented by the Hostera frontend and their requirement traceability. The stories come from the Hostera project report; their identifiers and epics match the report's Product Backlog. Landing Page stories, technical stories for the RESTful API, and the account access and reporting stories planned for later releases are not part of this application.

## Requirement Traceability Matrix (RTM)

| User Story                                                  | Epic  | Bounded Context | Implemented Elements                                                                                                                                                                                                         |
| :---------------------------------------------------------- | :---- | :-------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **US011: Monitor operations across properties**             | EP002 | Overview        | `OverviewView`, `RevenueOccupancyCard`, `PropertyOverviewCard`, `TodaysArrivalsCard`, `RoomStatusCard`, `BookingSearch`, `OverviewStore`, `OverviewApi`, `PropertyOverviewAssembler`, `DailyPerformance`, `PropertyOverview` |
| **US012: Find and review bookings**                         | EP003 | Bookings        | `BookingList`, `BookingsStore`, `BookingsApi`, `BookingAssembler`, `PaymentAssembler`, `Booking`, `Payment`                                                                                                                  |
| **US013: Create a booking**                                 | EP003 | Bookings        | `BookingForm`, `BookingsStore`, `BookingsApi`, `BookingAssembler`, `RoomsStore`, `Booking`                                                                                                                                   |
| **US014: Review and update a booking**                      | EP003 | Bookings        | `BookingDetail`, `BookingForm`, `BookingsStore`, `BookingsApi`, `RoomsStore`, `Booking`                                                                                                                                      |
| **US015: Manage the booking lifecycle**                     | EP003 | Bookings        | `BookingDetail`, `BookingStatusDialog`, `BookingCancelDialog`, `BookingsStore`, `CancelBookingCommand`, `Booking`                                                                                                            |
| **US016: Record a booking payment**                         | EP003 | Bookings        | `BookingPaymentSummary`, `PaymentForm`, `BookingsStore`, `BookingsApi`, `PaymentAssembler`, `Payment`, `Booking`                                                                                                             |
| **US017: Complete guest check-in**                          | EP003 | Bookings        | `BookingCheckIn`, `BookingPaymentSummary`, `RfidEncoderPanel`, `BookingsStore`, `AccessControlStore`, `CheckInBookingCommand`, `IssueGuestKeyCardsCommand`, `Booking`, `Credential`                                          |
| **US018: Complete guest check-out**                         | EP003 | Bookings        | `BookingCheckOut`, `BookingPaymentSummary`, `BookingsStore`, `AccessControlStore`, `CheckOutBookingCommand`, `Booking`, `Credential`                                                                                         |
| **US019: Review room availability for a selected date**     | EP004 | Rooms           | `RoomAvailability`, `DayStatusTag`, `RoomsStore`, `RoomsApi`, `RoomAssignmentAssembler`, `Room`, `RoomAssignment`, `StatusPeriod`                                                                                            |
| **US020: Create a room**                                    | EP004 | Rooms           | `RoomAvailability`, `RoomForm`, `RoomsStore`, `RoomsApi`, `RoomAssembler`, `Room`                                                                                                                                            |
| **US021: Maintain room information and operational status** | EP004 | Rooms           | `RoomDetail`, `RoomMonthCalendar`, `RoomForm`, `RoomStatusForm`, `BookingControlledDialog`, `RoomsStore`, `SetRoomStatusCommand`, `Room`, `StatusPeriod`                                                                     |
| **US022: Manage room types**                                | EP004 | Rooms           | `RoomTypeList`, `RoomTypeForm`, `RoomsStore`, `RoomsApi`, `RoomTypeAssembler`, `RoomType`                                                                                                                                    |
| **US023: Manage rate plans and daily rates**                | EP004 | Rooms           | `RoomRates`, `RatePlanForm`, `DailyRateForm`, `RoomsStore`, `RoomsApi`, `RatePlanAssembler`, `DailyRateAssembler`, `SetDailyRatesCommand`, `RatePlan`, `DailyRate`, `RoomType`                                               |
| **US024: Monitor property inventory**                       | EP005 | Inventory       | `InventoryItemList`, `StockConditionTag`, `InventoryStore`, `InventoryApi`, `InventoryItemAssembler`, `InventoryItem`                                                                                                        |
| **US025: Manage inventory item records**                    | EP005 | Inventory       | `InventoryItemList`, `InventoryItemDetail`, `InventoryItemForm`, `InventoryStore`, `InventoryApi`, `InventoryItemAssembler`, `StockAdjustmentAssembler`, `InventoryItem`, `StockAdjustment`                                  |
| **US026: Adjust inventory stock**                           | EP005 | Inventory       | `StockAdjustmentForm`, `InventoryStore`, `InventoryApi`, `AdjustStockCommand`, `InventoryItem`, `StockAdjustment`                                                                                                            |
| **US027: Manage storage locations**                         | EP005 | Inventory       | `StorageLocationList`, `StorageLocationDetail`, `StorageLocationForm`, `InventoryStore`, `InventoryApi`, `StorageLocationAssembler`, `StorageLocation`                                                                       |
| **US028: Review and manage RFID credentials**               | EP006 | Access Control  | `CredentialList`, `CredentialDetail`, `RevokeCredentialDialog`, `AccessControlStore`, `AccessControlApi`, `CredentialAssembler`, `RevokeCredentialCommand`, `Credential`                                                     |
| **US029: Encode or replace an RFID key card**               | EP006 | Access Control  | `StaffCredentialForm`, `ReplaceCredentialDrawer`, `RfidEncoderPanel`, `AccessControlStore`, `RfidEncoder`, `IssueStaffCredentialCommand`, `IssueGuestKeyCardsCommand`, `Credential`, `StaffMember`                           |
| **US030: Review RFID access events**                        | EP006 | Access Control  | `AccessEventList`, `AccessEventDrawer`, `AccessControlStore`, `AccessControlApi`, `AccessEventAssembler`, `AccessEvent`                                                                                                      |
| **US033: Navigate between operational areas**               | EP002 | Shared          | `AppLayout`, `SidebarToggle`, `router`, `RoomsStore`                                                                                                                                                                         |

## US011: Monitor operations across properties

**Description:** As a hotel administrator or operations manager, I want to monitor room revenue, occupancy, arrivals, and room conditions across properties and change the active property so that I can identify operational conditions that require attention.

**Epic:** EP002

### Acceptance Criteria

#### Scenario 1: Review the active property's performance

Given the active property has room and booking records  
When the operator requests the last 7 days, last 30 days, or next 30 days  
Then the system provides room revenue and occupancy for each day, period totals, and variation against the preceding period of equal duration, counting confirmed, checked-in, and checked-out bookings as room revenue.

#### Scenario 2: Compare properties tonight

Given properties have room and booking records  
When the operator requests tonight's property comparison  
Then the system provides occupancy, available rooms, and rooms requiring attention because they are needs cleaning, blocked, or out of service for each property tonight.

#### Scenario 3: Review today's arrivals

Given pending, confirmed, or checked-in bookings have a check-in date of today  
When the operator requests today's arrivals  
Then the system provides the active property's qualifying bookings and indicates whether each guest has arrived, the booking awaits confirmation, an outstanding balance remains, or the booking is ready for check-in.

#### Scenario 4: Review today's room statuses

Given rooms exist for the active property  
When the operator requests today's room conditions  
Then the system provides the number of rooms that are available, booked, occupied, needs cleaning, blocked, or out of service today.

#### Scenario 5: Change the active property

Given more than one property exists  
When the operator chooses another property  
Then the system updates the operational information for that property without combining records from other properties.

#### Scenario 6: Find a booking

Given bookings exist for the active property  
When the operator searches by guest name or booking code  
Then the system returns matching bookings from the active property.

#### Scenario 7: Report unavailable information

Given one or more operational data sources do not respond  
When the operator requests operational information  
Then the system identifies the affected information, preserves the available information, and accepts a renewed request for the affected information.

## US012: Find and review bookings

**Description:** As a front-desk operator or hotel administrator, I want to find bookings by guest name or booking code, stay period, and status so that I can review the correct booking before taking an operational action.

**Epic:** EP003

### Acceptance Criteria

#### Scenario 1: Review bookings for a property

Given bookings exist for the active property  
When the operator requests the booking collection  
Then the system provides each booking's guest, code, stay period, assigned room, lifecycle status, and payment status of unpaid, partially paid, or paid.

#### Scenario 2: Find bookings by operational criteria

Given bookings have different guests, codes, stay periods, and statuses  
When the operator searches by guest name or booking code and applies a current, upcoming, or past stay-period criterion and a lifecycle-status criterion  
Then the system returns only bookings that satisfy all active criteria.

#### Scenario 3: Find no matching bookings

Given no booking satisfies the active criteria  
When the operator performs the search  
Then the system returns an empty result without changing existing bookings.

## US013: Create a booking

**Description:** As a front-desk operator, I want to create a booking for a guest and an available room, including from a cancelled or no-show booking, so that the requested stay is recorded with its applicable rate.

**Epic:** EP003

### Acceptance Criteria

#### Scenario 1: Create a valid booking

Given the room is available for every requested night, the guest count is within room-type capacity, and the active rate plan sells that room type  
When the operator provides the guest's name, email, phone, preferred language, check-in and check-out dates, guest count, room type, room, and rate plan  
Then the system creates a pending booking with an unpaid payment status, a code unique within the property, and a total equal to the sum of the rate plan's nightly prices for the room type across the stay.

#### Scenario 2: Reject an unavailable room

Given another booking holds the room or the room is blocked or out of service for at least one requested night  
When the operator attempts to create the booking  
Then the system rejects the request and preserves existing room assignments.

#### Scenario 3: Reject an invalid stay period

Given the check-out date does not occur after the check-in date  
When the operator attempts to create the booking  
Then the system rejects the request and identifies the invalid stay period.

#### Scenario 4: Reject a guest count above capacity

Given the guest count exceeds the room-type capacity  
When the operator attempts to create the booking  
Then the system rejects the request without creating a booking.

#### Scenario 5: Reject an inapplicable rate plan

Given the rate plan is inactive or does not sell the requested room type  
When the operator attempts to create the booking  
Then the system rejects the request without creating a booking.

#### Scenario 6: Create a booking from a cancelled or no-show booking

Given a cancelled or no-show booking exists and its copied stay satisfies booking-creation rules  
When the operator requests a new booking based on that booking  
Then the system copies the guest and stay information into a new pending booking with a new code and unpaid payment status, calculates its applicable total, and preserves the original booking.

## US014: Review and update a booking

**Description:** As a front-desk operator, I want to review booking details and update pending or confirmed bookings so that guest and stay changes remain consistent with room availability and applicable rates.

**Epic:** EP003

### Acceptance Criteria

#### Scenario 1: Review complete booking information

Given the booking exists in the active property  
When the operator requests its details  
Then the system provides the guest, stay, room, rate, request, payment, and lifecycle information associated with the booking.

#### Scenario 2: Update information without changing the agreed total

Given the booking is pending or confirmed and the proposed room and dates are available  
When the operator updates guest information or the assigned room without changing dates, room type, or rate plan  
Then the system saves the changes, updates affected availability, and preserves the agreed total.

#### Scenario 3: Recalculate the total for a stay or pricing change

Given the booking is pending or confirmed and the proposed stay, room type, and rate plan satisfy booking-creation rules  
When the operator changes dates, room type, or rate plan  
Then the system saves the changes, recalculates the total from the applicable nightly rates, and updates affected availability.

#### Scenario 4: Reject a conflicting update

Given the proposed update conflicts with another room assignment  
When the operator attempts to save the change  
Then the system rejects the update and preserves the previous booking information.

#### Scenario 5: Reject an update outside editable statuses

Given the booking is neither pending nor confirmed  
When the operator attempts to update the booking  
Then the system rejects the update and preserves its information.

## US015: Manage the booking lifecycle

**Description:** As a front-desk operator, I want to confirm, cancel, restore, or mark a booking as a no-show so that its status and room assignment reflect the pre-arrival outcome.

**Epic:** EP003

### Acceptance Criteria

#### Scenario 1: Confirm a pending booking

Given the booking is pending  
When the operator confirms the booking  
Then the system changes its status to confirmed and retains the assigned stay information.

#### Scenario 2: Cancel a pending or confirmed booking

Given the booking is pending or confirmed  
When the operator records a cancellation reason and a note when the reason is other  
Then the system changes the booking to cancelled, records the reason and note when provided, and releases its room assignment.

#### Scenario 3: Reject an incomplete cancellation reason

Given the cancellation reason is missing or the reason is other without a note  
When the operator attempts to cancel the booking  
Then the system rejects the cancellation and preserves the booking and its room assignment.

#### Scenario 4: Mark a confirmed booking as a no-show

Given the booking is confirmed and today is on or after its check-in date  
When the operator records the guest as a no-show  
Then the system changes its status to no-show and releases its remaining room assignment.

#### Scenario 5: Restore a cancelled booking

Given the booking is cancelled, its stay has not started, and its room remains available for every booked night  
When the operator restores the booking  
Then the system changes its status to pending and reinstates its room assignment.

#### Scenario 6: Reject an invalid lifecycle transition

Given the requested transition is not allowed from the current status, a no-show precedes the check-in date, or a restoration fails the stay or availability conditions  
When the operator attempts the transition  
Then the system rejects the request and preserves the current status and room assignments.

## US016: Record a booking payment

**Description:** As a front-desk operator, I want to record a payment received for a pending, confirmed, or checked-in booking so that the amount paid and remaining balance are accurate.

**Epic:** EP003

### Acceptance Criteria

#### Scenario 1: Record a valid payment

Given the booking is pending, confirmed, or checked-in and has an outstanding balance  
When the operator records an amount greater than zero and no greater than the balance, a method of cash, card terminal, bank transfer, or other, a receipt date, and an optional reference  
Then the system adds the payment record and recalculates the paid amount, balance, and payment status.

#### Scenario 2: Complete the booking balance

Given the booking accepts payments and the received amount equals the outstanding balance  
When the operator records the payment  
Then the system reduces the balance to zero and changes the payment status to paid.

#### Scenario 3: Reject an invalid payment amount

Given the amount is zero, negative, or greater than the outstanding balance  
When the operator attempts to record the payment  
Then the system rejects the request and preserves the previous balance.

#### Scenario 4: Reject a payment outside supported statuses

Given the booking is neither pending, confirmed, nor checked-in  
When the operator attempts to record a payment  
Then the system rejects the request and preserves existing payment records.

## US017: Complete guest check-in

**Description:** As a front-desk operator, I want to verify the guest identity, record any arrival payments, and encode room access when completing check-in for a confirmed booking so that the guest can begin the stay with a verified identity and valid key cards.

**Epic:** EP003

### Acceptance Criteria

#### Scenario 1: Verify the arriving guest

Given the booking is confirmed and today is one of its booked nights  
When the operator records the guest's document type of DNI, passport, or foreign resident card and its number and confirms verification of the original document  
Then the system records the document information and identity verification for the booking.

#### Scenario 2: Record an arrival payment

Given the confirmed booking has an outstanding balance and today is one of its booked nights  
When the operator records a payment that satisfies booking-payment rules  
Then the system records the payment and updates the balance without requiring full settlement for check-in.

#### Scenario 3: Encode room access

Given the booking is confirmed, today is one of its booked nights, and a compatible RFID encoder and at least one blank key card are available  
When the operator encodes the guest key cards  
Then the system associates at least one encoded RFID key card with the booking and room, valid until 11:00 on the check-out date.

#### Scenario 4: Complete check-in with or without an outstanding balance

Given the booking is confirmed, today is one of its booked nights, identity is verified, and at least one associated key card is encoded  
When the operator completes check-in  
Then the system changes the booking to checked-in and records the room as occupied for the remaining booked nights, retaining any balance for settlement before check-out.

#### Scenario 5: Reject check-in when a required condition fails

Given identity is not verified, no key card is encoded, the booking is not confirmed, or today is outside its booked nights  
When the operator attempts to complete check-in  
Then the system rejects check-in, preserves the booking status, and identifies the unmet condition.

## US018: Complete guest check-out

**Description:** As a front-desk operator, I want to complete check-out for a checked-in booking with a settled balance and record the room condition so that the stay closes, key cards end, and unused nights become available.

**Epic:** EP003

### Acceptance Criteria

#### Scenario 1: Review departure conditions

Given the booking is checked-in  
When the operator requests departure information  
Then the system provides the booking's stay, balance, assigned room, and key cards.

#### Scenario 2: Complete check-out with a settled balance

Given the booking is checked-in and its balance is zero  
When the operator completes check-out with a room condition of no issues or needs attention and an optional note  
Then the system changes the booking to checked-out, records the room condition and note when provided, ends its key cards, and releases remaining booked nights if the guest departs early.

#### Scenario 3: Prevent check-out with an outstanding balance

Given the checked-in booking has an outstanding balance  
When the operator attempts to complete check-out  
Then the system rejects check-out, preserves the active stay, and identifies the outstanding balance.

## US019: Review room availability for a selected date

**Description:** As a front-desk operator or hotel administrator, I want to review daily room availability from a chosen date and find rooms by number, room type, or status so that I can plan assignments and operational work.

**Epic:** EP004

### Acceptance Criteria

#### Scenario 1: Review the default planning period

Given rooms exist for the active property  
When the operator requests room availability without requesting another date  
Then the system provides the current date and the following six days with each room's daily status.

#### Scenario 2: Review a specific future period

Given the operator chooses a valid date  
When availability is requested  
Then the system provides the selected date and the following six days.

#### Scenario 3: Filter by the selected day's room status

Given rooms have different statuses on the selected date  
When the operator applies a room-status criterion  
Then the system returns rooms whose status matches on that selected date.

#### Scenario 4: Find rooms by number and room type

Given rooms with different numbers and room types exist for the active property  
When the operator searches by room number or filters by room type  
Then the system returns only rooms that satisfy the active criteria with their daily statuses for the requested period.

## US020: Create a room

**Description:** As a hotel administrator, I want to create a room within a property so that it can participate in availability planning and booking assignment.

**Epic:** EP004

### Acceptance Criteria

#### Scenario 1: Create a valid room

Given the room number is unique within the property and the room type is active  
When the administrator provides the room number, an integer floor, and the room type  
Then the system creates the room with the capacity and configuration associated with its room type.

#### Scenario 2: Reject a duplicate room number

Given another room in the property already uses the provided number  
When the administrator attempts to create the room  
Then the system rejects the request without changing the existing room.

#### Scenario 3: Reject an inactive room type

Given the requested room type is inactive  
When the administrator attempts to create the room  
Then the system rejects the request without creating a room.

#### Scenario 4: Reject an invalid floor

Given the provided floor is not an integer  
When the administrator attempts to create the room  
Then the system rejects the request and identifies the invalid floor.

## US021: Maintain room information and operational status

**Description:** As a hotel administrator or authorized staff member, I want to review and update room information and operational status for a period so that room conditions remain accurate without overriding booking-controlled days.

**Epic:** EP004

### Acceptance Criteria

#### Scenario 1: Review room information and daily statuses

Given the room exists in the active property  
When the operator requests its details for a chosen month  
Then the system provides its number, floor, room type, capacity, and status for each day of that month, including days controlled by bookings.

#### Scenario 2: Update room information

Given the proposed room number remains unique, the floor is an integer, and the room type is active  
When the operator changes the room number, floor, or room type  
Then the system saves valid room information without changing historical bookings.

#### Scenario 3: Change a controllable room status

Given no booking or stay controls the room during the requested period  
When the operator requests blocked or out of service with a reason, needs cleaning, or a return to available for that period  
Then the system records the requested status for those days and retains the required reason for blocked or out of service.

#### Scenario 4: Reject a missing operational reason

Given the requested status is blocked or out of service and no reason is provided  
When the operator attempts to change the status  
Then the system rejects the change and preserves the prior daily statuses.

#### Scenario 5: Protect booking-controlled statuses

Given a booking or stay controls at least one day in the requested period  
When the operator attempts to replace the status directly  
Then the system rejects the change and preserves the booking-controlled days.

## US022: Manage room types

**Description:** As a hotel administrator, I want to manage room types with unique names, valid capacities, bed configurations, and positive base rates so that rooms share consistent accommodation information and room types in use remain protected.

**Epic:** EP004

### Acceptance Criteria

#### Scenario 1: Create a room type

Given the room-type name is unique within the property  
When the administrator provides its name, capacity, bed configuration, base nightly rate, and status  
Then the system creates the room type for future room assignments and rate configuration.

#### Scenario 2: Update a room type

Given the room type exists  
When the administrator changes supported configuration values  
Then the system applies the new values to future operations without rewriting completed-stay records.

#### Scenario 3: Protect a room type that remains in use

Given one or more rooms use the room type  
When the administrator attempts to remove it  
Then the system prevents destructive removal and allows the room type to be made inactive.

#### Scenario 4: Reject invalid room-type information

Given the proposed name duplicates another room type in the property, capacity is not an integer from 1 to 12, or the base nightly rate is not greater than zero  
When the administrator attempts to create or update the room type  
Then the system rejects the request and preserves existing room-type information.

## US023: Manage rate plans and daily rates

**Description:** As a hotel administrator or operations manager, I want to define rate plans and daily room-type prices so that booking totals reflect the applicable commercial conditions.

**Epic:** EP004

### Acceptance Criteria

#### Scenario 1: Create a rate plan

Given supported room types and a property currency exist  
When the operator provides a unique plan name, included services, cancellation conditions, refundability, and applicable room types  
Then the system creates the rate plan with its commercial conditions.

#### Scenario 2: Set daily rates

Given a rate plan and room type are active  
When the operator sets valid nightly prices for a date range  
Then the system records the prices for booking calculations in that period.

#### Scenario 3: Preserve a booking's agreed rate

Given a booking already records an agreed price  
When a future room-type price or rate-plan condition changes  
Then the system preserves the existing booking total unless a valid booking update changes dates, room type, or rate plan.

#### Scenario 4: Reject a refundable plan without a cancellation policy

Given the rate plan is refundable and no cancellation policy is provided  
When the operator attempts to create or update the rate plan  
Then the system rejects the request without saving an incomplete refundable plan.

#### Scenario 5: Make a rate plan inactive

Given a rate plan exists  
When the operator stops offering that plan  
Then the system makes it inactive instead of deleting it and preserves existing booking totals.

#### Scenario 6: Return nights to the room-type base rate

Given daily rates exist for a room type and rate plan within a date range  
When the operator requests removal of those daily-rate overrides  
Then the system uses the room-type base nightly rate for those nights in future booking calculations and preserves existing agreed booking totals.

## US024: Monitor property inventory

**Description:** As a hotel administrator or inventory operator, I want to monitor item quantities and stock conditions by storage location so that I can identify supplies that require attention.

**Epic:** EP005

### Acceptance Criteria

#### Scenario 1: Review inventory status

Given inventory items exist for the active property  
When the operator requests the inventory collection  
Then the system provides each item's category, storage location, on-hand quantity, and stock condition.

#### Scenario 2: Find items by operational criteria

Given items belong to different categories, storage locations, and stock conditions  
When the operator searches or filters the inventory  
Then the system returns only items that satisfy the active criteria.

#### Scenario 3: Identify stock requiring attention

Given an item's quantity reaches or falls below its configured threshold  
When inventory status is calculated  
Then the system identifies the item as low stock or out of stock as applicable.

## US025: Manage inventory item records

**Description:** As an inventory operator, I want to create and update inventory items while preserving their units after stock movements so that tracked supplies and their movement history remain consistent.

**Epic:** EP005

### Acceptance Criteria

#### Scenario 1: Create an inventory item

Given the item code is unique within the property and the storage location exists  
When the operator provides the item name, code, category, unit, storage location, and stock threshold  
Then the system creates the inventory item with its initial tracked quantity.

#### Scenario 2: Update inventory item information

Given the inventory item exists  
When the operator changes supported descriptive or control information  
Then the system saves the changes without rewriting prior stock movements.

#### Scenario 3: Review item history

Given stock adjustments exist for the item  
When the operator requests its details  
Then the system provides current stock information and an ordered history of recorded movements.

#### Scenario 4: Protect the unit after stock movements

Given the item already has recorded stock movements  
When the operator attempts to change its unit  
Then the system rejects the unit change and preserves the movement history.

## US026: Adjust inventory stock

**Description:** As an inventory operator, I want to record stock entering, leaving, or transferring between storage locations so that on-hand quantities and their audit history remain accurate.

**Epic:** EP005

### Acceptance Criteria

#### Scenario 1: Record stock entering a location

Given the inventory item and storage location exist  
When the operator records a positive stock-in quantity with a supported reason  
Then the system increases the on-hand quantity and records the operator, date, location, reason, and optional note.

#### Scenario 2: Record stock leaving a location

Given the requested quantity does not exceed available stock  
When the operator records a stock-out quantity with a supported reason  
Then the system decreases the on-hand quantity and records the corresponding audit entry.

#### Scenario 3: Prevent negative stock

Given the requested stock-out quantity exceeds available stock  
When the operator submits the adjustment  
Then the system rejects the request and preserves the current quantity.

#### Scenario 4: Transfer stock between storage locations

Given the source and destination locations exist, are different, and the positive transfer quantity does not exceed available source stock  
When the operator requests a stock transfer  
Then the system decreases source stock, increases destination stock by the same quantity, and records linked stock-out and stock-in audit entries.

#### Scenario 5: Reject an invalid stock transfer

Given the destination equals the source or the transfer quantity is not positive or exceeds available source stock  
When the operator attempts the transfer  
Then the system rejects the request and preserves both quantities.

#### Scenario 6: Require a note for the other reason

Given the adjustment or transfer reason is other and no note is provided  
When the operator attempts to record the movement  
Then the system rejects the request and preserves stock quantities.

## US027: Manage storage locations

**Description:** As a hotel administrator or inventory operator, I want to manage storage locations while preserving existing codes and locations with assigned items so that stock remains associated with the correct physical area and responsible team.

**Epic:** EP005

### Acceptance Criteria

#### Scenario 1: Create a storage location

Given the location name or code is unique within the property  
When the operator provides its name, type, floor or area, responsible team, and description  
Then the system creates the storage location for item assignment and stock adjustments.

#### Scenario 2: Update a storage location

Given the storage location exists  
When the operator changes supported location information  
Then the system saves the changes while preserving prior stock-adjustment history.

#### Scenario 3: Protect a location with assigned items

Given items remain assigned to the storage location  
When the operator attempts to remove it  
Then the system prevents removal while items remain assigned.

#### Scenario 4: Preserve an existing location code

Given the storage location already exists  
When the operator attempts to change its code  
Then the system rejects the code change and preserves the existing code.

## US028: Review and manage RFID credentials

**Description:** As a hotel administrator or authorized front-desk operator, I want to find RFID credentials by card, person, room, status, or holder type and review or revoke them with a recorded reason so that access remains valid only for the intended person and period.

**Epic:** EP006

### Acceptance Criteria

#### Scenario 1: Find a credential

Given credentials exist for guests and staff in the active property  
When the operator searches by card, person, or room and filters by status or holder type  
Then the system returns matching credentials and their assignment, scope, validity, and current status.

#### Scenario 2: Review credential details

Given a credential exists  
When the operator requests its details  
Then the system provides its assignee, type, room or access scope, validity period, status, and recent access events.

#### Scenario 3: Revoke a credential

Given an active or scheduled credential exists  
When the operator revokes it with a reason of lost card, damaged card, security risk, staff left, or other and a note when the reason is other  
Then the system prevents subsequent access with that credential and records the revocation.

#### Scenario 4: End guest access at check-out

Given a guest credential is associated with a stay  
When the stay is checked out or reaches the end of its validity period  
Then the system ends the credential's room access.

#### Scenario 5: Require a note for the other revocation reason

Given the revocation reason is other and no note is provided  
When the operator attempts to revoke the credential  
Then the system rejects the request and preserves its current status.

## US029: Encode or replace an RFID key card

**Description:** As an authorized front-desk operator, I want to encode RFID key cards with valid access periods or replace them with the same end of validity, limiting each staff member to one usable credential, so that guests and staff receive access appropriate to their role or stay.

**Epic:** EP006

### Acceptance Criteria

#### Scenario 1: Encode a guest key card

Given a booking, assigned room, access period, compatible encoder, and blank card are available  
When the operator encodes the guest credential  
Then the system associates the card with the guest's room and stay validity period.

#### Scenario 2: Encode a staff credential

Given the staff member has no usable credential and the property access scope, valid period, compatible encoder, and blank card are available  
When the operator encodes the staff credential  
Then the system associates the card with the authorized areas and validity period.

#### Scenario 3: Replace a credential

Given a credential eligible for replacement, a compatible encoder, and a blank card are available  
When the operator encodes a replacement card  
Then the system revokes the previous card with reason replaced and issues a new credential with the same end of validity.

#### Scenario 4: Report an encoding failure

Given the encoder or card cannot complete the encoding operation  
When the operator attempts to encode the credential  
Then the system reports the failure and does not mark the credential as active.

#### Scenario 5: Prevent multiple usable staff credentials

Given the staff member already has a usable credential  
When the operator attempts to issue an additional staff credential  
Then the system rejects the request and preserves the existing credential.

#### Scenario 6: Reject an invalid temporary validity period

Given the proposed temporary credential end is missing or does not occur after its start  
When the operator attempts to issue the temporary credential  
Then the system rejects the request without issuing a credential.

## US030: Review RFID access events

**Description:** As a hotel administrator or security-authorized operator, I want to find granted and denied RFID access events by date, result, access point, person, or card so that I can investigate activity at rooms and access points.

**Epic:** EP006

### Acceptance Criteria

#### Scenario 1: Review recent access events

Given access events exist for the active property  
When the operator requests the event collection  
Then the system provides each event's timestamp, result, access point, credential, and associated person when available.

#### Scenario 2: Filter access events

Given events differ by date, result, person, credential, and access point  
When the operator filters by date, result, or access point and searches by person or card  
Then the system returns only events that satisfy all active criteria.

#### Scenario 3: Review a denied event

Given an access attempt was denied  
When the operator requests the event details  
Then the system provides the recorded denial reason and credential condition without changing the event.

## US033: Navigate between operational areas

**Description:** As an authorized hotel operator, I want to work across the operational overview, bookings, rooms, inventory, and access control so that I can perform hotel-management tasks without losing the active property context.

**Epic:** EP002

### Acceptance Criteria

#### Scenario 1: Work in an operational area

Given an active property exists  
When the operator requests the operational overview, bookings, rooms, inventory, or access control  
Then the system provides the information and operations for the requested area within the active property.

#### Scenario 2: Preserve the active property context

Given the operator has chosen an active property  
When the operator begins work in another operational area  
Then the system preserves the active property and scopes the requested information to it.

#### Scenario 3: Continue working from a mobile device

Given the operator works with Hostera from a mobile phone or tablet  
When the operator begins work in another operational area  
Then the system provides the requested information and operations while preserving the active property context.
