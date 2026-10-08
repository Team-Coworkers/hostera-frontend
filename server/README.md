# Local Mock API

This is a mock API for development and demonstrations. It runs separately from the SPA and is not included in SPA deployments; a demonstration copy can be published on Render (see [Demonstration deployment on Render](#demonstration-deployment-on-render)).

JSON Server `^0.17.4` serves the generated database at `http://localhost:3000`.

```text
server/
  data/          Seed fixtures, one JSON file per resource
  build-db.js    Combine fixtures into db.json
  start.sh       Build the database and start JSON Server
  db.json        Generated runtime data, excluded from Git
  routes.json    Route rewrites, initially empty
  README.md
```

## Commands

- `npm run server:start`: rebuild the database and start the API.
- `npm run server:build`: rebuild the database without starting the API.
- `npm run server:start -- --port 3001`: start on a different port.

Each build or startup replaces runtime changes with the seed fixtures. API writes affect `db.json`; edit files in `data/` for lasting changes. Startup stops if the build fails. Press Ctrl+C to stop the server.

`start.sh` requires a POSIX shell such as the one provided by Linux, macOS, WSL, or Git Bash. It runs the project's installed JSON Server. Both scripts resolve their paths from their own location.

## Fixtures

Place JSON files directly in `data/`. Each filename uses a plural kebab-case resource name and contains one matching array. For example, `example-resources.json`:

```json
{
  "example-resources": [{ "id": 1, "name": "Example" }]
}
```

Use unique, stable IDs and camelCase fields. Mock data values may be in Spanish. `.gitkeep` keeps the initially empty directory in Git and can be removed after adding the first fixture; the generator reads only `.json` files.

JSON Server provides native CRUD routes for each collection. Send write bodies as JSON with `Content-Type: application/json`. The mock does not implement authentication or business validation.

## Inventory resources

- `GET /properties`: demonstration establishments in one organization.
- `GET /storage-locations?propertyId=1` and `GET /inventory-items?propertyId=1`: property-scoped collections.
- `POST /storage-locations` and `POST /inventory-items`: create records with their `propertyId`.
- `PUT /storage-locations/:id` and `PUT /inventory-items/:id`: save an existing record.
- `DELETE /storage-locations/:id`: remove an unused location.

Each inventory item contains `stocks` (quantities by location) and an `adjustments` history. An adjustment updates both in one item write; a transfer appends linked outgoing and incoming records in the same write. A positive initial quantity also records an opening adjustment. There is no separate adjustment endpoint in this mock.

The frontend enforces unique codes, sufficient stock, fixed units after history exists, and location-removal restrictions. Audit entries use a demonstration operator until account access is implemented. Direct API requests can bypass these rules, and simultaneous clients can overwrite each other's changes; the production API must enforce authorization, validation, history preservation, and concurrency controls.

## Rooms resources

- `GET /room-types?propertyId=1`, `GET /rooms?propertyId=1`, and `GET /status-periods?propertyId=1`: property-scoped collections. Properties include the `currency` used for room rates.
- `POST`, `PUT /:id`, and `DELETE /:id` on `/room-types`: manage room types; the frontend removes only types that no room uses.
- `POST` and `PUT /:id` on `/rooms`: create and edit rooms. A room takes its capacity and beds from its room type.
- `POST`, `PUT /:id`, and `DELETE /:id` on `/status-periods`: setting or releasing a status may delete, trim, or split existing periods and create a new one, sent as separate requests.

- `GET /rate-plans?propertyId=1` and `GET /daily-rates?propertyId=1`: property-scoped rate plans and their daily rates. An empty `roomTypeIds` list means the plan sells every room type.
- `POST` and `PUT /:id` on `/rate-plans`: create and edit rate plans; plans are made inactive instead of deleted.
- `POST`, `PUT /:id`, and `DELETE /:id` on `/daily-rates`: setting rates sends one request per night; returning nights to the base nightly rate deletes their daily rates.

Status periods cover inclusive ISO date ranges (`startDate` to `endDate`); their seed dates, like the daily rates and bookings, fall around October 2026. Rooms derives its read-only room assignments from `/bookings`. The frontend keeps a room's status periods from overlapping each other or its bookings; direct API requests can bypass these rules, and a failed request in a multi-request status change can leave partial updates, which the SPA reloads. The same applies to the daily rates of a multi-night rate change.

## Bookings resources

- `GET /bookings?propertyId=1`: a property's bookings, with the guest's contact details, stay dates, room type, room, rate plan, and saved total. `checkInDate` is the first night and `checkOutDate` the departure day, so a stay covers each night before check-out.
- `GET /bookings?propertyId=1&_sort=code&_order=desc&_limit=1`: the property's booking with the highest code, used to number its next booking (`BKG-1071`, …). Each property numbers bookings in its own thousand.
- `POST` and `PUT /:id` on `/bookings`: create pending bookings, edit pending or confirmed ones, and change their status. Status changes record when and by whom a booking was confirmed, cancelled (with `cancellationReason` and `cancellationNote`), or marked as no-show; the operator is a demonstration value until account access exists. The frontend prices each night with the room type's nightly rate under the rate plan and saves the total with the booking.

- `GET /payments?propertyId=1` and `POST /payments`: payments received for a property's bookings, with `bookingId`, `amount`, `method`, `paidAt`, `reference`, and the recording operator. The frontend derives each booking's balance due from its payments and rejects amounts above it.
- Check-in and check-out are `PUT /bookings/:id` updates that record the verified identity document, the check-in and check-out moments, the room condition, and a departure note.

Pending, confirmed, and checked-in bookings hold their room: the frontend rejects stays that share a night with them or with a Blocked or Out of service period, while Needs cleaning does not prevent booking. Cancelled, no-show, and checked-out bookings no longer hold their room. Direct API requests can bypass these rules, and booking codes are numbered without concurrency control.

## Overview reads

The overview compares properties with `GET /rooms`, `GET /bookings`, and `GET /status-periods` without a `propertyId` filter; it does not write any resource.

## Access control resources

- `GET /credentials?propertyId=1`, `POST /credentials`, and `PUT /credentials/:id`: RFID credentials with `cardId`, `type` (`guest-key-card` or `staff-credential`), holder, booking and room or staff member and `scope`, `validFrom`, `validUntil` (`null` for permanent staff access), and revocation details. Check-in creates the guest key cards and check-out shortens their `validUntil`; the status is derived from these dates and `revokedAt`.
- `GET /staff-members?propertyId=1`: read-only staff members who can hold a staff credential.
- `GET /access-events?propertyId=1`: read-only access events (granted or denied) standing in for door readers; their seed dates fall on October 5–6, 2026.

The frontend generates card IDs with a simulated encoder and keeps at most one usable staff credential per staff member; direct API requests can bypass these rules.

## Demonstration deployment on Render

The mock API can be published as a Render Web Service from this repository, so that the SPA deployed on Firebase Hosting has data to read. Create a **Web Service** connected to the repository and its `main` branch, with these settings:

| Setting           | Value                                                 |
| ----------------- | ----------------------------------------------------- |
| Language          | Node                                                  |
| Root Directory    | Empty (the repository root)                           |
| Build Command     | `npm ci`                                              |
| Start Command     | `npm run server:start -- --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/properties`                                         |

Render provides `PORT`, and `--host 0.0.0.0` makes JSON Server accept external connections. JSON Server allows cross-origin requests, so the SPA can call it from its Firebase Hosting domain. Set the service URL, such as `https://hostera-api.onrender.com`, as `VITE_HOSTERA_API_URL` in `.env.production` and deploy the SPA again.

Every deploy and restart rebuilds `db.json` from `data/`, so writes made through the demonstration API are temporary. On Render's free plan the service also stops after a period without requests, and the next request waits while it starts again.
