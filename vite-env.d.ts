/**
 * Custom type definitions for the Vite environment variables.
 *
 * @remarks
 * This allows for better type checking and autocompletion when using the environment variables in the code.
 */

/// <reference types="vite/client" />
interface ImportMetaEnv {
  /**
   * # VITE_HOSTERA_API_URL is the base URL of the Hostera API.
   */
  readonly VITE_HOSTERA_API_URL: string;
  /**
   * # VITE_PROPERTIES_ENDPOINT_PATH is the path to the properties' endpoint.
   */
  readonly VITE_PROPERTIES_ENDPOINT_PATH: string;
  /**
   * # VITE_INVENTORY_ITEMS_ENDPOINT_PATH is the path to the inventory items' endpoint.
   */
  readonly VITE_INVENTORY_ITEMS_ENDPOINT_PATH: string;
  /**
   * # VITE_STORAGE_LOCATIONS_ENDPOINT_PATH is the path to the storage locations' endpoint.
   */
  readonly VITE_STORAGE_LOCATIONS_ENDPOINT_PATH: string;
  /**
   * # VITE_ROOM_TYPES_ENDPOINT_PATH is the path to the room types' endpoint.
   */
  readonly VITE_ROOM_TYPES_ENDPOINT_PATH: string;
  /**
   * # VITE_ROOMS_ENDPOINT_PATH is the path to the rooms' endpoint.
   */
  readonly VITE_ROOMS_ENDPOINT_PATH: string;
  /**
   * # VITE_STATUS_PERIODS_ENDPOINT_PATH is the path to the status periods' endpoint.
   */
  readonly VITE_STATUS_PERIODS_ENDPOINT_PATH: string;
  /**
   * # VITE_BOOKINGS_ENDPOINT_PATH is the path to the bookings' endpoint.
   */
  readonly VITE_BOOKINGS_ENDPOINT_PATH: string;
  /**
   * # VITE_PAYMENTS_ENDPOINT_PATH is the path to the payments' endpoint.
   */
  readonly VITE_PAYMENTS_ENDPOINT_PATH: string;
  /**
   * # VITE_CREDENTIALS_ENDPOINT_PATH is the path to the credentials' endpoint.
   */
  readonly VITE_CREDENTIALS_ENDPOINT_PATH: string;
  /**
   * # VITE_STAFF_MEMBERS_ENDPOINT_PATH is the path to the staff members' endpoint.
   */
  readonly VITE_STAFF_MEMBERS_ENDPOINT_PATH: string;
  /**
   * # VITE_ACCESS_EVENTS_ENDPOINT_PATH is the path to the access events' endpoint.
   */
  readonly VITE_ACCESS_EVENTS_ENDPOINT_PATH: string;
  /**
   * # VITE_RATE_PLANS_ENDPOINT_PATH is the path to the rate plans' endpoint.
   */
  readonly VITE_RATE_PLANS_ENDPOINT_PATH: string;
  /**
   * # VITE_DAILY_RATES_ENDPOINT_PATH is the path to the daily rates' endpoint.
   */
  readonly VITE_DAILY_RATES_ENDPOINT_PATH: string;
  /**
   * # VITE_PRIMEVUE_LICENSE_KEY is the license key for the PrimeVue library.
   */
  readonly VITE_PRIMEVUE_LICENSE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
