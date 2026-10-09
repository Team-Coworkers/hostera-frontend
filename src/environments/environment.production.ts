/**
 * Production environment: the SPA deployed on GitHub Pages talks to the Team Coworkers
 * demonstration mock API, published on Render from `render.yaml` (see server/README.md).
 * Replace `hosteraApiUrl` with the Spring Boot RESTful API once it is deployed.
 */
export const environment = {
  production: true,
  hosteraApiUrl: 'https://team-coworkers-hostera-api.onrender.com',
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
