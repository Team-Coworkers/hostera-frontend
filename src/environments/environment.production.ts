/**
 * Production environment: the SPA talks to the demonstration mock API on Render.
 * Set `hosteraApiUrl` to the Render service URL before deploying (see server/README.md).
 */
export const environment = {
  production: true,
  hosteraApiUrl: 'https://hostera-api.onrender.com',
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
