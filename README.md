# Hostera

Hostera is a hotel operations web application for front desk and operations teams. It brings bookings, rooms and rates, supplies inventory, and RFID access control together for each property, with an overview of how the property is doing today.

This repository holds the Vue single-page application (SPA) and a development-only mock API. The SPA is organized by bounded context, following a domain-driven design (DDD) structure. The interface is available in English and Spanish from the sidebar language selector.

## Tech stack

- Vue 3 with `<script setup>` single-file components
- Vite
- Pinia
- Vue Router
- Vue I18n
- PrimeVue 5, PrimeFlex, and PrimeIcons
- Chart.js, through PrimeVue Chart
- Axios
- JSON Server `^0.17.4` for the local mock API

## Getting started

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`, as required by Vite, and npm.
- A PrimeUI license key for PrimeVue 5.

### Install and run

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Create the environment files from the example, then replace the PrimeVue license key placeholder:

   ```bash
   cp .env.example .env.development
   cp .env.example .env.production
   ```

3. Start the mock API at `http://localhost:3000`:

   ```bash
   npm run server:start
   ```

4. In another terminal, start the SPA:

   ```bash
   npm run dev
   ```

Open the URL that Vite prints, normally `http://localhost:5173`.

## Scripts

| Command                | Description                                                     |
| ---------------------- | --------------------------------------------------------------- |
| `npm run dev`          | Start the Vite development server.                              |
| `npm run build`        | Build the SPA for production into `dist/`.                      |
| `npm run preview`      | Serve the production build locally.                             |
| `npm run deploy`       | Build the SPA and deploy it to Firebase Hosting.                |
| `npm run lint`         | Validate JavaScript and Vue files; fails on errors or warnings. |
| `npm run lint:fix`     | Apply automatic lint fixes.                                     |
| `npm run format`       | Format `src/`, `server/`, and `index.html` with Prettier.       |
| `npm run format:check` | Verify formatting without modifying files.                      |
| `npm run server:start` | Rebuild the mock database and start JSON Server.                |
| `npm run server:build` | Rebuild the mock database without starting it.                  |

## Project structure

```text
src/
  overview/          Overview bounded context (start page)
  bookings/          Bookings bounded context
  rooms/             Rooms bounded context, including rates
  inventory/         Inventory bounded context
  access-control/    Access Control bounded context
  shared/            Cross-context infrastructure and presentation
  locales/           Translations by language and context
  router.js          Application routes composed from each context
  i18n.js            Vue I18n setup and locale registration
  main.js            Application setup and PrimeVue theme
server/              Development-only mock API
```

Each bounded context uses the same layers:

```text
src/<context>/
  domain/            Entities, commands, and business rules
  application/       Pinia store that orchestrates use cases
  infrastructure/    API client and assemblers
  presentation/      Views, components, and context routes
```

- **Domain:** plain JavaScript classes for business concepts and invariants, independent of Vue, Pinia, and HTTP.
- **Application:** Pinia stores coordinate domain objects and infrastructure, and expose state to the views.
- **Infrastructure:** Axios clients built on the shared `BaseApi` and `BaseEndpoint`, and assemblers that map API payloads to domain entities.
- **Presentation:** Vue views and components that call store actions and render reactive state.

## Workspaces

### Overview

The start page (`/`) summarizes the active property: room revenue and occupancy for the last 7 or 30 days or the next 30 days, compared with the previous period; the occupancy, rooms available tonight, and rooms needing attention of every property; today's arrivals with their status and actions; and today's rooms by day status. Search bookings by guest or code from the header (Ctrl+K or ⌘K). Each panel shows its own error and retry when its data cannot be loaded. Charts use PrimeVue Chart, which renders with the `chart.js` dependency.

### Bookings

Open `/bookings` to list a property's bookings, filter them by guest, booking code, stay period, or status, and open a booking's detail. Create bookings with the guest's contact details, stay dates, guests, room type, room, and rate plan; rooms already booked or Blocked or Out of service for those nights cannot be chosen, and the estimated total adds each night's rate. New bookings start as Pending, and only pending or confirmed bookings can be edited. From a booking's detail, confirm a pending booking, cancel a pending or confirmed one with a reason, mark a confirmed booking as no-show from its check-in day, restore a cancelled booking as Pending before its stay starts while the room is free, or duplicate a cancelled or no-show booking into a new one. Cancelled and no-show bookings release their room. Record payments received outside Hostera up to the balance due, check in a confirmed booking on one of its nights after verifying the guest's identity document (a balance due does not block it), and check out a stay in progress once nothing is owed, reporting the room condition; leaving early releases the remaining nights. Check-in also encodes at least one RFID key card for the guest, and check-out ends the booking's key cards. The property selection is shared with the Rooms workspace.

### Rooms

Open `/rooms` to review each room's day status across a week, manage room types and rooms, and set or release operational statuses (Blocked, Out of service, Needs cleaning) from the weekly grid or a room's monthly calendar. On small screens the weekly grid becomes a one-day room list. Booked and Occupied days come from the property's bookings and open them from the grid.

The Rates tab shows a rate plan's nightly rates for its active room types across a week. Create or edit rate plans (room types, included services, refundability, and cancellation policy), and set daily rates for a room type over a date range or return those nights to the room type's base nightly rate. Rate plans use the property's currency and are made inactive instead of deleted.

### Inventory

Open `/inventory` to manage property-scoped storage locations, supplies, stock adjustments, and internal transfers.

### Access control

Open `/access-control` to review a property's RFID credentials (guest key cards and staff credentials) with their status, holder, access, and access period. Issue a staff credential for a staff member without another usable credential, revoke an active or scheduled credential with a reason, or replace a card with a newly encoded one. The front desk RFID encoder is simulated in the browser. The access events page lists the day's granted and denied events, which are read-only demonstration data until door readers are connected.

## Environment

The SPA connects directly to the API configured by `VITE_HOSTERA_API_URL`. `.env.example` points it to the local mock at `http://localhost:3000` and defines the resource paths in `VITE_PROPERTIES_ENDPOINT_PATH`, `VITE_INVENTORY_ITEMS_ENDPOINT_PATH`, `VITE_STORAGE_LOCATIONS_ENDPOINT_PATH`, `VITE_ROOM_TYPES_ENDPOINT_PATH`, `VITE_ROOMS_ENDPOINT_PATH`, `VITE_STATUS_PERIODS_ENDPOINT_PATH`, `VITE_RATE_PLANS_ENDPOINT_PATH`, `VITE_DAILY_RATES_ENDPOINT_PATH`, `VITE_BOOKINGS_ENDPOINT_PATH`, `VITE_PAYMENTS_ENDPOINT_PATH`, `VITE_CREDENTIALS_ENDPOINT_PATH`, `VITE_STAFF_MEMBERS_ENDPOINT_PATH`, and `VITE_ACCESS_EVENTS_ENDPOINT_PATH`. `vite-env.d.ts` declares these variables for editor type information and autocompletion; it does not assign or validate their runtime values.

Vite loads `.env.development` for `npm run dev` and `.env.production` for `npm run build`. These files are ignored by Git; create them from `.env.example`. Use the ignored `.env.development.local` or `.env.production.local` files to override API settings for a specific mode. Restart Vite after changing environment files. Before deployment, set `VITE_HOSTERA_API_URL` to the deployed backend URL; the mock API is not deployed with the SPA. See [Vite environment variables and modes](https://vite.dev/guide/env-and-mode).

PrimeVue 5 requires a valid PrimeUI license. Replace the `VITE_PRIMEVUE_LICENSE_KEY` placeholder in `.env.development` and `.env.production`, or set it in their `.local` overrides, and restart Vite. A key in `.env.local` does not take effect while a mode file still defines the placeholder, because mode files take priority. For deployed builds, configure the variable in the build environment.

## Deployment

The SPA is deployed to Firebase Hosting in the `hostera-f4116` project, configured in `.firebaserc`. `firebase.json` publishes `dist/`, rewrites every route to `index.html` so that Vue Router handles client-side routes, caches the hashed files in `dist/assets/` for a year, and revalidates every other file on each request.

1. Install the [Firebase CLI](https://firebase.google.com/docs/cli) and sign in with an account that has access to the project:

   ```bash
   firebase login
   ```

2. In `.env.production`, set `VITE_HOSTERA_API_URL` to the deployed API and `VITE_PRIMEVUE_LICENSE_KEY` to a valid PrimeUI license key. The mock API is not deployed with the SPA; a demonstration copy can run on Render, as described in [server/README.md](server/README.md#demonstration-deployment-on-render).

3. Build and deploy:

   ```bash
   npm run deploy
   ```

   The script runs `npm run build` and then `firebase deploy --only hosting`, which prints the Hosting URL when it finishes. The build is not a Firebase `predeploy` hook because the standalone Firebase CLI cannot run npm scripts.

Earlier releases remain available in the Hosting release history of the Firebase console, where they can be rolled back.

## Code quality

Run `npm run lint` and `npm run format:check` before committing. Prettier uses single quotes and semicolons for JavaScript, and ESLint disables the formatting rules that conflict with Prettier.

## Local mock API

The mock API is for local development and runs separately from the SPA. It is not deployed with the frontend. See [server/README.md](server/README.md) for fixture structure, database generation, and reset commands.

## Documentation

- [Architecture decision records](docs/adrs.md): the main architectural decisions, with their context and consequences.
- [Class diagram](docs/class-diagram.puml): the classes of each bounded context and layer, in PlantUML.
- [User stories](docs/user-stories.md): the user stories implemented by the application, with their acceptance criteria and traceability to the code.

## License

Hostera is released under the [MIT License](LICENSE.md).
