# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-10-09

### Added

- Render static site `team-coworkers-hostera-web` in `render.yaml`, built with `npm run build` and served from the root path with a rewrite of every route to `index.html`, so the SPA and its mock API are published together on Render.

## [0.4.1] - 2026-10-08

### Changed

- The deployed SPA reads its data from the demonstration mock API on Render, `https://team-coworkers-hostera-api.onrender.com`, created from the `render.yaml` Blueprint; `demoApiEnabled` is off in production and the in-browser data remains as a fallback.

## [0.4.0] - 2026-10-08

### Added

- IAM context with the public `/sign-in` and `/sign-up` views. Sign-up reads the plan from the `plan` query parameter (`starter` or `professional`), so each segment's call-to-action on the landing page opens its own plan, and estimates the monthly price as the landing page calculator does. Both views run on the demonstration data until the IAM endpoints of the RESTful API exist.
- `SubscriptionPlan` and `AccountRegistration` domain model: Starter at S/39 per property for one hotel with up to 10 rooms, Professional at S/8 per room for chains with 2 to 5 properties.
- Site footer with the copyright notice and links to the terms and conditions and the home page of the landing page.
- Public holidays of Peru from Nager.Date, the solution's third-party service, flagged in the room availability view.
- In-browser demonstration API (`demo-api.interceptor.ts`) that answers the deployed SPA's requests from the `server/data` fixtures, copied to `demo-data/` at build time.
- Description, keywords, author, robots and theme-color meta tags in `index.html`.
- First unit tests (28 specs) and the `.github/workflows/test.yml` workflow that runs them on every push and pull request to `main` and `develop`.

### Changed

- Latin American Spanish uses the `es-419` locale code; its messages moved to `src/locales/es-419/`, and switching languages updates the `lang` attribute of the page.
- The workspace routes are children of the application shell, so the IAM views render on their own page.
- Production turns on `demoApiEnabled`; the Render Blueprint stays as an alternative.

## [0.3.0] - 2026-10-08

### Added

- GitHub Pages deployment through `.github/workflows/deploy-pages.yml`, run on every push to `main`, with a `404.html` fallback so the Angular router resolves deep links after a reload.
- `npm run build:pages` builds the SPA for the `/hostera-frontend/` path.
- `render.yaml` Blueprint to publish the demonstration mock API on Render as `team-coworkers-hostera-api`.

### Changed

- The repository is published as `hostera-frontend`.
- The production API URL points to the Team Coworkers demonstration mock API, replacing a placeholder that resolved to an unrelated service.
- The README and the mock API guide describe the GitHub Pages and Render deployment.

### Removed

- The Firebase Hosting configuration (`firebase.json`, `.firebaserc`), the `deploy` script and the Firebase ignore rules inherited from the Vue version.

## [0.2.0] - 2026-10-08

### Changed

- Ported the SPA from Vue 3, Pinia, and PrimeVue to Angular 19, TypeScript, and Angular Material 3, keeping the bounded contexts, their DDD layers, the routes, and the English and Spanish locale files unchanged.
- Replaced Pinia stores with injectable signal-based stores, Axios with `HttpClient` through `BaseApiService` and `BaseEndpoint`, Vue I18n with ngx-translate and a parser for the existing message syntax, and PrimeVue Chart with Chart.js.
- Moved API settings from `.env` files to `src/environments/`; a PrimeUI license is no longer needed.
- The production build is published from `dist/browser/`.

## [0.1.0] - 2026-10-06

### Added

- Vue 3 single-page application organized by bounded context, with Pinia, Vue Router, Vue I18n, PrimeVue 5 with a Hostera Material theme, PrimeFlex, and PrimeIcons.
- Responsive application layout with a collapsible sidebar, Hostera logo and favicon, and English and Spanish translations, including PrimeVue texts and date and currency formats.
- Overview start page with room revenue and occupancy for the last 7 or 30 days or the next 30 days compared with the previous period, tonight's occupancy, available rooms, and rooms needing attention of every property, today's arrivals with their actions, today's room statuses, and booking search by guest or code.
- Bookings workspace to search and filter bookings, create, edit, and duplicate them with nightly pricing and room availability, confirm, cancel, mark as no-show, and restore them, record payments up to the balance due, check guests in with identity verification and RFID key cards, and check them out with the room condition.
- Rooms workspace with a weekly availability view, monthly room calendars, room types, rooms, operational statuses (Blocked, Out of service, Needs cleaning), rate plans, and daily rates with a fallback to each room type's base rate.
- Inventory workspace for inventory items, storage locations, stock adjustments, and transfers between locations, with stock conditions and movement history.
- Access Control workspace to issue staff credentials, revoke and replace cards with a simulated RFID encoder, and review granted and denied access events.
- Development and demonstration mock API with JSON Server, modular fixtures for two properties, and a database build script.
- Firebase Hosting configuration and `npm run deploy` script, and instructions for publishing the demonstration API on Render.
- Project documentation: README, architecture decision records, class diagram, user stories, and the MIT license.
