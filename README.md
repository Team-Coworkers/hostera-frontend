# Hostera

Hostera is a hotel operations web application for front desk and operations teams. It brings bookings, rooms and rates, supplies inventory, and RFID access control together for each property, with an overview of how the property is doing today.

This repository holds the Angular single-page application (SPA) and a development-only mock API. The SPA is organized by bounded context, following a domain-driven design (DDD) structure. The interface is available in English and Spanish from the sidebar language selector.

## Tech stack

- Angular 19 with standalone components, signals, and the built-in control flow
- Angular Router with lazy-loaded routes per bounded context
- Angular Material 3 and the Angular CDK, with a Hostera theme
- ngx-translate, reading the per-context locale JSON files
- PrimeFlex, kept as a CSS utility library
- Chart.js
- `HttpClient` through the shared `BaseApiService` and `BaseEndpoint`
- JSON Server `^0.17.4` for the local mock API

## Getting started

### Prerequisites

- Node.js `^18.19.1`, `^20.11.1`, or `^22.0.0`, as required by Angular 19, and npm.

### Install and run

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Start the mock API at `http://localhost:3000`:

   ```bash
   npm run server:start
   ```

3. In another terminal, start the SPA:

   ```bash
   npm start
   ```

Open the URL that the Angular CLI prints, normally `http://localhost:4200`.

## Scripts

| Command                | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| `npm start`            | Start the Angular development server.                |
| `npm run build`        | Build the SPA for production into `dist/browser/`.   |
| `npm run watch`        | Rebuild the SPA in development mode on every change. |
| `npm test`             | Run the unit tests with Karma.                       |
| `npm run build:pages`  | Build the SPA for GitHub Pages under `/hostera-frontend/`. |
| `npm run format`       | Format `src/` and `server/` with Prettier.           |
| `npm run format:check` | Verify formatting without modifying files.           |
| `npm run server:start` | Rebuild the mock database and start JSON Server.     |
| `npm run server:build` | Rebuild the mock database without starting it.       |

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
  environments/      API URL and resource paths per build configuration
  app.routes.ts      Application routes composed from each context
  app.config.ts      Providers: router, HttpClient, Material defaults, i18n
  main.ts            Application bootstrap
  styles.scss        Angular Material theme and Hostera design tokens
server/              Development-only mock API
```

Each bounded context uses the same layers:

```text
src/<context>/
  domain/            Entities, commands, and business rules
  application/       Signal-based store that orchestrates use cases
  infrastructure/    API client and assemblers
  presentation/      Views, components, and context routes
```

- **Domain:** plain TypeScript classes for business concepts and invariants, independent of Angular and HTTP.
- **Application:** injectable stores (`providedIn: 'root'`) coordinate domain objects and infrastructure, and expose state to the views as signals.
- **Infrastructure:** API services built on the shared `BaseApiService` and `BaseEndpoint` over `HttpClient`, and assemblers that map API payloads to domain entities.
- **Presentation:** standalone components and lazy routes that call store actions and render signal state.

## Workspaces

### Overview

The start page (`/`) summarizes the active property: room revenue and occupancy for the last 7 or 30 days or the next 30 days, compared with the previous period; the occupancy, rooms available tonight, and rooms needing attention of every property; today's arrivals with their status and actions; and today's rooms by day status. Search bookings by guest or code from the header (Ctrl+K or ⌘K). Each panel shows its own error and retry when its data cannot be loaded. Charts are drawn with Chart.js.

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

The SPA connects directly to the API configured in `src/environments/`. `environment.ts` is used by `npm start` and points `hosteraApiUrl` to the local mock at `http://localhost:3000`; `environment.production.ts` replaces it in production builds and turns on `demoApiEnabled`, so the deployed SPA answers its API requests in the browser (see below). Both define the resource paths (`propertiesEndpointPath`, `roomsEndpointPath`, `bookingsEndpointPath`, and the others). When the Spring Boot RESTful API is deployed, `environment.production.ts` sets `demoApiEnabled` to false and points `hosteraApiUrl` to the API.

## Deployment

The SPA is published on GitHub Pages at <https://team-coworkers.github.io/hostera-frontend/>.

The workflow in `.github/workflows/deploy-pages.yml` runs on every push to `main`, and can also be started by hand from the **Actions** tab. It installs the dependencies, runs `npm run build:pages` so the SPA is served from the `/hostera-frontend/` path, copies `index.html` to `404.html` so the Angular router resolves deep links such as `/bookings` after a reload, and publishes `dist/browser/`.

Following Git Flow, a deployment happens when a release is merged into `main`.

### Demonstration mock API

The deployed SPA reads its data from the same fixtures as the local mock API. The build copies `server/data/*.json` to `demo-data/`, and `src/shared/infrastructure/demo-api.interceptor.ts` answers the requests to `hosteraApiUrl` from them inside the browser, with the JSON Server filters (`propertyId=1`, `_sort`, `_order`, `_limit`) and `GET`, `POST`, `PUT`, `PATCH` and `DELETE` by id. Changes last until the page is reloaded.

The mock API can also be published on Render as `team-coworkers-hostera-api` from `render.yaml`; see [server/README.md](server/README.md#demonstration-deployment-on-render). To use it, set `demoApiEnabled` to false in `environment.production.ts`.

## Code quality

Run `npm run build` and `npm run format:check` before committing. The production build type-checks every component template. Prettier uses single quotes and semicolons for TypeScript and the Angular parser for templates.

## Local mock API

The mock API is for local development and runs separately from the SPA. It is not deployed with the frontend. See [server/README.md](server/README.md) for fixture structure, database generation, and reset commands.

## Documentation

- [Architecture decision records](docs/adrs.md): the main architectural decisions, with their context and consequences.
- [Class diagram](docs/class-diagram.puml): the classes of each bounded context and layer, in PlantUML.
- [User stories](docs/user-stories.md): the user stories implemented by the application, with their acceptance criteria and traceability to the code.

## License

Hostera is released under the [MIT License](LICENSE.md).
