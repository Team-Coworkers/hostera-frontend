# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
