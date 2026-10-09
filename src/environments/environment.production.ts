/**
 * Production environment: the SPA deployed on GitHub Pages reads the Team Coworkers
 * demonstration mock API, published on Render from `render.yaml` (see server/README.md).
 * Point `hosteraApiUrl` to the Spring Boot RESTful API once it is deployed. Setting
 * `demoApiEnabled` to true answers the requests in the browser instead (demo-api.interceptor.ts).
 */
export const environment = {
  production: true,
  hosteraApiUrl: 'https://team-coworkers-hostera-api.onrender.com',
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
