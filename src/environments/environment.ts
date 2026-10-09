/**
 * Development environment: the SPA talks to the local JSON Server mock API.
 * Replaces the VITE_* variables of the Vue version (`.env.example`).
 */
export const environment = {
  production: false,
  hosteraApiUrl: 'http://localhost:3000',
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
  /** Nager.Date, the third-party public holidays API, and the properties' country. */
  publicHolidaysApiUrl: 'https://date.nager.at/api/v3',
  publicHolidaysCountryCode: 'PE',
};
