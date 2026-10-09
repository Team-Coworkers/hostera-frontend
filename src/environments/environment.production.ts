/**
 * Production environment: the SPA deployed on GitHub Pages answers its API requests in
 * the browser from the `server/data` fixtures (`demoApiEnabled`, see demo-api.interceptor.ts).
 * To use the mock API published on Render from `render.yaml`, or the Spring Boot RESTful
 * API once it is deployed, set `demoApiEnabled` to false and point `hosteraApiUrl` to it.
 */
export const environment = {
  production: true,
  hosteraApiUrl: 'https://team-coworkers-hostera-api.onrender.com',
  demoApiEnabled: true,
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
};
