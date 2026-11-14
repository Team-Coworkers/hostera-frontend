/**
 * Development environment: the SPA talks to the Hostera Platform RESTful API running locally
 * with its `dev` profile, which needs no sign-in. To use the JSON Server mock API instead,
 * set `hosteraApiUrl` to `http://localhost:3000`.
 * Replaces the VITE_* variables of the Vue version (`.env.example`).
 */
export const environment = {
  production: false,
  hosteraApiUrl: 'http://localhost:8080/api/v1',
  /** Answer API requests in the browser from `server/data` instead of JSON Server. */
  demoApiEnabled: false,
  propertiesEndpointPath: '/properties',
  inventoryItemsEndpointPath: '/inventory-items',
  storageLocationsEndpointPath: '/storage-locations',
  roomTypesEndpointPath: '/room-types',
  roomsEndpointPath: '/rooms',
  statusPeriodsEndpointPath: '/status-periods',
  bookingsEndpointPath: '/bookings',
  paymentsEndpointPath: '/payments',
  credentialsEndpointPath: '/credentials',
  staffMembersEndpointPath: '/staff-members',
  accessEventsEndpointPath: '/access-events',
  ratePlansEndpointPath: '/rate-plans',
  dailyRatesEndpointPath: '/daily-rates',
  /** IAM endpoints of the Spring Boot RESTful API (sign-up and sign-in with JWT). */
  usersEndpointPath: '/users',
  tokensEndpointPath: '/tokens',
  /** True once hosteraApiUrl points to the RESTful API: the workspace then requires signing in. */
  authenticationEnabled: false,
  /** Nager.Date, the third-party public holidays API, and the properties' country. */
  publicHolidaysApiUrl: 'https://date.nager.at/api/v3',
  publicHolidaysCountryCode: 'PE',
};
