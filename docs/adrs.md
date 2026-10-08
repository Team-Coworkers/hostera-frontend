# Architecture Decision Records (ADRs)

## Overview

This document records the key architectural decisions of the Hostera frontend. Each record follows the usual Architecture Decision Record format (Michael Nygard and MADR conventions): the context that led to the decision, the decision itself, and its consequences.

---

## Table of Contents

- [ADR-001: Domain-Driven Design Layered Architecture with Bounded Contexts](#adr-001-domain-driven-design-layered-architecture-with-bounded-contexts)
- [ADR-002: Vue 3 with the Composition API and Vite](#adr-002-vue-3-with-the-composition-api-and-vite)
- [ADR-003: Pinia Setup Stores as the Application Layer](#adr-003-pinia-setup-stores-as-the-application-layer)
- [ADR-004: Cross-Context Collaboration through Application Stores](#adr-004-cross-context-collaboration-through-application-stores)
- [ADR-005: Overview as a Read-Only Bounded Context](#adr-005-overview-as-a-read-only-bounded-context)
- [ADR-006: Commands for Intentions and Entities for Forms](#adr-006-commands-for-intentions-and-entities-for-forms)
- [ADR-007: Business Rule Violations as Coded Domain Errors](#adr-007-business-rule-violations-as-coded-domain-errors)
- [ADR-008: Shared HTTP Client, Context APIs, and Assemblers](#adr-008-shared-http-client-context-apis-and-assemblers)
- [ADR-009: PrimeVue 5 with a Hostera Material Preset, PrimeFlex, and PrimeIcons](#adr-009-primevue-5-with-a-hostera-material-preset-primeflex-and-primeicons)
- [ADR-010: Internationalization by Language, Bounded Context, and View](#adr-010-internationalization-by-language-bounded-context-and-view)
- [ADR-011: Calendar Days and Date-Times as ISO Strings](#adr-011-calendar-days-and-date-times-as-iso-strings)
- [ADR-012: Simulated RFID Encoder behind an Infrastructure Adapter](#adr-012-simulated-rfid-encoder-behind-an-infrastructure-adapter)
- [ADR-013: Development-Only JSON Server Mock API](#adr-013-development-only-json-server-mock-api)

---

## ADR-001: Domain-Driven Design Layered Architecture with Bounded Contexts

### Status

Accepted

### Context

Hostera supports several areas of hotel operations: bookings and stays, rooms and rates, supplies inventory, RFID access control, and a daily overview of each property. Each area has its own language and rules. For example, a booking that is confirmed, paid, and checked in is, for the overview, revenue and occupancy for a night. A structure organized by technical type (`/components`, `/views`, `/services`) would mix these rules in the views and couple unrelated features.

### Decision

Organize `src/` by bounded context, and give every context the same four layers:

- **Bounded contexts:** `overview`, `bookings`, `rooms` (including rates), `inventory`, and `access-control`. `shared` holds cross-context infrastructure and presentation code.
- **Domain:** plain JavaScript classes for entities (`Booking`, `Room`, `Credential`, `InventoryItem`), commands (`CancelBookingCommand`, `SetRoomStatusCommand`), and errors. They have no Vue, Pinia, or HTTP dependencies.
- **Application:** one Pinia store per context that orchestrates its use cases (`useBookingsStore`, `useRoomsStore`).
- **Infrastructure:** context API clients (`BookingsApi`, `RoomsApi`), assemblers, and adapters such as `RfidEncoder`.
- **Presentation:** views, components, and the context's route module (`bookings-routes.js`).

### Consequences

- **Positive:**
  - Business rules live in the domain and can be tested without a browser or a server.
  - Each context can change its model and screens without touching unrelated features.
  - The folder structure mirrors the business language used with the team.
- **Negative:**
  - More files per feature (entities, commands, assemblers, store actions) than binding API payloads directly to templates.
  - Developers must keep the layer boundaries; nothing in the tooling enforces them.

---

## ADR-002: Vue 3 with the Composition API and Vite

### Status

Accepted

### Context

The front desk and operations teams need a responsive single-page application that loads quickly and reacts immediately to status changes. The team also needs fast feedback while developing.

### Decision

Build the SPA with **Vue 3** single-file components using the Composition API (`<script setup>`), and use **Vite** for the development server and production builds. Routes are composed in `src/router.js` from each context's route module, and the views are lazy-loaded.

### Consequences

- **Positive:**
  - Fast hot module replacement and builds.
  - The Composition API fits Pinia setup stores and plain domain classes.
  - Lazy-loaded views keep the initial bundle small.
- **Negative:**
  - Vite requires Node.js `^20.19.0` or `>=22.12.0` on every development and build machine.

---

## ADR-003: Pinia Setup Stores as the Application Layer

### Status

Accepted

### Context

Views need shared reactive state (the selected property, its bookings, rooms, and credentials), loading and saving flags, and a single place to run use cases such as checking in a booking.

### Decision

Use **Pinia** setup stores (`defineStore` with a setup function) as the application layer. Each bounded context has one store named after it (`useOverviewStore`, `useBookingsStore`, `useRoomsStore`, `useInventoryStore`, `useAccessControlStore`) that:

- loads the context's collections through its API client and assemblers;
- exposes loaded flags, a `saving` flag, and the request `errors`;
- runs use cases with domain objects and commands, and rejects with a domain error when a rule is violated.

### Consequences

- **Positive:**
  - Views stay thin: they call store actions and render reactive state.
  - Loading, saving, and error state are tracked the same way in every context.
- **Negative:**
  - Stores grow with each use case; Rooms, which also manages rates, holds the most actions.

---

## ADR-004: Cross-Context Collaboration through Application Stores

### Status

Accepted

### Context

The contexts depend on each other at runtime:

- A booking needs a bookable room and its nightly rate.
- Check-in must issue RFID key cards, and check-out must end them.
- The Rooms calendar must show booked and occupied days.
- Every property-scoped workspace must work on the same selected property.

### Decision

- Contexts collaborate through their **application stores**, never through another context's infrastructure:
  - Bookings uses the Rooms store for rooms, rates, and availability.
  - Bookings uses the Access Control store to issue key cards at check-in and end them at check-out, passing an `IssueGuestKeyCardsCommand`.
  - Access Control and Overview read from the Rooms and Bookings stores.
- The **Rooms store owns the selected property** (`currentPropertyId`). Bookings, Access Control, and Overview derive their current property from it and reload when it changes.
- Rooms keeps its own read model of bookings: `RoomAssignmentAssembler` turns the property's bookings that hold a room (pending, confirmed, or checked in) into `RoomAssignment` entities.
- Inventory keeps its own property selection, because it has no runtime dependency on the other contexts.

### Consequences

- **Positive:**
  - One property selection is shared by Bookings, Rooms, Access Control, and Overview.
  - Each context keeps its own model of what it reads from another, such as `RoomAssignment` instead of `Booking` in Rooms.
- **Negative:**
  - Stores are coupled at the application layer: changing a store's public actions can affect other contexts.
  - Inventory's property selection is independent of the other workspaces.

---

## ADR-005: Overview as a Read-Only Bounded Context

### Status

Accepted

### Context

The start page summarizes how each property is doing: room revenue and occupancy over a period, the occupancy and rooms needing attention of every property, today's arrivals, and today's rooms by status. These summaries have their own concepts and rules, such as which booking statuses count as revenue, but they do not own any data.

### Decision

Model the start page as the **Overview** bounded context (`src/overview/`, route `/`) instead of placing it in `shared`:

- Its domain has `DailyPerformance` (revenue, sold rooms, and occupancy for a day, counting confirmed, checked-in, and checked-out bookings) and `PropertyOverview` (occupancy, available rooms, and alerts of a property).
- Its store reads the Bookings and Rooms stores for the selected property.
- `OverviewApi.getPortfolio` reads rooms, bookings, and status periods of every property for the property overview.
- Overview never creates or changes data; its actions link to the owning workspace.

### Consequences

- **Positive:**
  - `shared` keeps only cross-context technical code, without business rules.
  - The summary rules are explicit, named, and testable in the domain.
- **Negative:**
  - Overview is downstream of Bookings and Rooms, so changes to their stores or resources can affect it.

---

## ADR-006: Commands for Intentions and Entities for Forms

### Status

Accepted

### Context

Some forms fill in an entity (a room type, a rate plan, a booking). Others express an operation on existing data that is not an entity itself, such as cancelling a booking with a reason or adjusting stock between storage locations.

### Decision

- When a form fills in an entity, the view builds the **entity** and the store validates and saves it (`RoomType`, `RatePlan`, `Booking`, `StorageLocation`).
- When a form expresses an intention, the view builds a **command** that carries only the data of that intention (`CancelBookingCommand`, `CheckInBookingCommand`, `CheckOutBookingCommand`, `SetRoomStatusCommand`, `SetDailyRatesCommand`, `AdjustStockCommand`, `IssueStaffCredentialCommand`, `RevokeCredentialCommand`). The store applies it through the entity's behavior, such as `Booking.cancel` or `Credential.revoke`.
- Domain helpers that are not part of a class's public behavior are private static methods (`static #addDays`) instead of module-level functions.

### Consequences

- **Positive:**
  - Use cases read in business language and keep their rules in the entity.
  - Commands make the required input of each operation explicit.
- **Negative:**
  - Each new operation needs a command class in addition to the store action.

---

## ADR-007: Business Rule Violations as Coded Domain Errors

### Status

Accepted

### Context

Business rules can fail for many reasons, such as an unavailable room, a payment above the balance due, or a card already in use. The interface must show a specific, translated message for each rule and tell rule violations apart from connection failures.

### Decision

Each context defines an error class in its domain (`BookingsError`, `RoomsError`, `InventoryError`, `AccessControlError`) that extends `Error` with a `code` naming the violated rule. Entities and stores throw or reject with these errors. Views check `instanceof`, translate the code with a key such as `bookings.bookings-terms.errors.<code>`, and treat any other error as a connection problem.

### Consequences

- **Positive:**
  - The domain stays free of display text, and every message is translated.
  - Rule violations and connection failures are handled differently.
- **Negative:**
  - Every code must have a translation in each language.

---

## ADR-008: Shared HTTP Client, Context APIs, and Assemblers

### Status

Accepted

### Context

API payloads (resources) can differ from the domain model and change independently of it. Calling Axios from views or stores would duplicate configuration and couple the application to those payloads.

### Decision

- `BaseApi` creates the Axios client with the base URL from `VITE_HOSTERA_API_URL`.
- `BaseEndpoint` provides REST operations (`getAll`, `getById`, `create`, `update`, `delete`) for one resource path.
- Each context has an API client that extends `BaseApi` (`OverviewApi`, `BookingsApi`, `RoomsApi`, `InventoryApi`, `AccessControlApi`), with endpoint paths from `VITE_*_ENDPOINT_PATH` variables and property-scoped queries.
- Assemblers translate resources into domain entities (`toEntityFromResource`, `toEntitiesFromResponse`) and act as the anti-corruption layer between the API and the domain.

### Consequences

- **Positive:**
  - One place configures HTTP, and API changes are absorbed by assemblers.
  - Resource paths can change per environment without code changes.
- **Negative:**
  - Every resource needs an assembler, an endpoint, and its environment variable.

---

## ADR-009: PrimeVue 5 with a Hostera Material Preset, PrimeFlex, and PrimeIcons

### Status

Accepted

### Context

Operational screens need accessible tables, forms, dialogs, drawers, steppers, charts, and a responsive sidebar, styled with Hostera's colors and typography.

### Decision

- Use **PrimeVue 5** components, registered with the `pv-` prefix (`<pv-data-table>`, `<pv-sidebar>`, `<pv-stepper>`, `<pv-chart>`).
- Theme them with a preset defined with `definePreset` on the **Material** theme, carrying Hostera's primary and surface colors and component tokens.
- Use **PrimeFlex** utility classes for layout and spacing, and **PrimeIcons** for icons.
- Write custom CSS in `src/style.css` or a preset `css` token only for what the components and utilities cannot express, such as font families.
- Render charts with PrimeVue Chart, which uses `chart.js`.

### Consequences

- **Positive:**
  - Consistent, accessible components with little custom styling.
  - Theme changes are made in one preset instead of in every screen.
- **Negative:**
  - PrimeVue 5 requires a PrimeUI license key (`VITE_PRIMEVUE_LICENSE_KEY`) in every environment.
  - Screens depend on PrimeVue's component API and design tokens.

---

## ADR-010: Internationalization by Language, Bounded Context, and View

### Status

Accepted

### Context

Hostera is used in English and Spanish, and staff switch languages at runtime. A single translation file per language would grow large and mix the terms of unrelated contexts.

### Decision

- Use **Vue I18n** in Composition API mode (`legacy: false`).
- Store translations in `src/locales/<language>/<context>/<view-or-component>.json`, with a `<context>-terms.json` file for terms shared within a context.
- Import and register every file explicitly in `src/i18n.js` under the `<context>.<file>` namespace.
- Translate PrimeVue's own texts (`shared/primevue-locale.json`) and apply them to PrimeVue when the language changes.
- Switch the language with the shared `LanguageSwitcher` in the sidebar.

### Consequences

- **Positive:**
  - Each view's texts are easy to find and review, and each context owns its terms.
  - PrimeVue's built-in texts follow the selected language.
- **Negative:**
  - Every new translation file must be imported and registered by hand, in both languages.

---

## ADR-011: Calendar Days and Date-Times as ISO Strings

### Status

Accepted

### Context

Stays, rates, and room statuses are defined by calendar nights, while operations such as check-in, payments, and credential validity happen at specific times. JavaScript `Date` objects mix both and shift days across time zones.

### Decision

- Represent calendar days as ISO `YYYY-MM-DD` strings, and date-times as ISO strings.
- Domain classes compare and add days with private helpers on these strings.
- Format values for display in `src/shared/presentation/calendar-format.js` (`formatDay`, `formatDayRange`, `formatDateTime`, `formatMoney`), using the selected language and the property's currency.

### Consequences

- **Positive:**
  - Nights and periods do not shift with the user's time zone.
  - Values are stored and compared exactly as the API exchanges them.
- **Negative:**
  - Day arithmetic must go through the domain helpers instead of `Date` methods.

---

## ADR-012: Simulated RFID Encoder behind an Infrastructure Adapter

### Status

Accepted

### Context

Guest key cards and staff credentials are written by a front desk RFID encoder. The hardware and its vendor bridge are not available during development.

### Decision

Encapsulate the encoder in the Access Control infrastructure as `RfidEncoder.encode(onState)`, which reports the `encoding` and `verifying` states and returns the written card ID. The current implementation simulates the write in the browser. The Access Control store exposes it through `encodeKeyCard` and `encoderState`, and the shared `RfidEncoderPanel` component is used by staff credential issuing, card replacement, and check-in. Access events are read-only demonstration data until door readers are connected.

### Consequences

- **Positive:**
  - Check-in and credential flows can be developed and demonstrated end to end without hardware.
  - Connecting the real encoder only replaces the adapter.
- **Negative:**
  - The simulation does not reproduce hardware failures, such as a missing or unreadable card.

---

## ADR-013: Development-Only JSON Server Mock API

### Status

Accepted

### Context

The SPA must be developed and demonstrated before the backend exists, with realistic data for several properties.

### Decision

Provide a **JSON Server `^0.17.4`** mock in `server/`, separate from the SPA deployment:

- one fixture file per resource in `server/data/`;
- `build-db.js` combines the fixtures into the ignored `db.json`;
- `start.sh` rebuilds the database and starts the server.

Resource names and routes follow REST conventions, so that the infrastructure layer can later point to the real backend through environment variables.

### Consequences

- **Positive:**
  - The full application runs locally with one command, and its data can be reset.
- **Negative:**
  - JSON Server does not enforce business rules, so they must also be implemented by the real backend.
  - The mock data drifts from production data over time.
