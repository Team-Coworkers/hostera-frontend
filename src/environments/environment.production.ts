/**
 * Production environment: the deployed SPA reads the Hostera Platform RESTful API (Spring Boot),
 * published on Render, and signs in with its JWT (`authenticationEnabled`). Setting
 * `demoApiEnabled` to true answers the requests in the browser instead (demo-api.interceptor.ts).
 */
export const environment = {
  production: true,
  hosteraApiUrl: 'https://hostera-platform-api.onrender.com/api/v1',
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
  authenticationEnabled: true,
  /** Nager.Date, the third-party public holidays API, and the properties' country. */
  publicHolidaysApiUrl: 'https://date.nager.at/api/v3',
  publicHolidaysCountryCode: 'PE',
};
