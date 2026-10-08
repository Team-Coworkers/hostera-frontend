import { createI18n } from 'vue-i18n';
import enSharedHome from './locales/en/shared/home.json';
import enSharedAppLayout from './locales/en/shared/app-layout.json';
import enSharedLanguageSwitcher from './locales/en/shared/language-switcher.json';
import enSharedSidebarToggle from './locales/en/shared/sidebar-toggle.json';
import enSharedPrimevueLocale from './locales/en/shared/primevue-locale.json';
import enInventoryInventoryTerms from './locales/en/inventory/inventory-terms.json';
import enInventoryInventoryLayout from './locales/en/inventory/inventory-layout.json';
import enInventoryInventoryItemList from './locales/en/inventory/inventory-item-list.json';
import enInventoryInventoryItemDetail from './locales/en/inventory/inventory-item-detail.json';
import enInventoryInventoryItemForm from './locales/en/inventory/inventory-item-form.json';
import enInventoryStorageLocationList from './locales/en/inventory/storage-location-list.json';
import enInventoryStorageLocationDetail from './locales/en/inventory/storage-location-detail.json';
import enInventoryStorageLocationForm from './locales/en/inventory/storage-location-form.json';
import enInventoryStockAdjustmentForm from './locales/en/inventory/stock-adjustment-form.json';
import enBookingsBookingsTerms from './locales/en/bookings/bookings-terms.json';
import enBookingsBookingsLayout from './locales/en/bookings/bookings-layout.json';
import enBookingsBookingList from './locales/en/bookings/booking-list.json';
import enBookingsBookingDetail from './locales/en/bookings/booking-detail.json';
import enBookingsBookingForm from './locales/en/bookings/booking-form.json';
import enBookingsBookingStatusDialog from './locales/en/bookings/booking-status-dialog.json';
import enBookingsBookingCancelDialog from './locales/en/bookings/booking-cancel-dialog.json';
import enBookingsBookingPaymentSummary from './locales/en/bookings/booking-payment-summary.json';
import enBookingsPaymentForm from './locales/en/bookings/payment-form.json';
import enBookingsBookingCheckIn from './locales/en/bookings/booking-check-in.json';
import enBookingsBookingCheckOut from './locales/en/bookings/booking-check-out.json';
import enAccessControlAccessControlTerms from './locales/en/access-control/access-control-terms.json';
import enAccessControlAccessControlLayout from './locales/en/access-control/access-control-layout.json';
import enAccessControlCredentialList from './locales/en/access-control/credential-list.json';
import enAccessControlCredentialDetail from './locales/en/access-control/credential-detail.json';
import enAccessControlStaffCredentialForm from './locales/en/access-control/staff-credential-form.json';
import enAccessControlRfidEncoderPanel from './locales/en/access-control/rfid-encoder-panel.json';
import enAccessControlRevokeCredentialDialog from './locales/en/access-control/revoke-credential-dialog.json';
import enAccessControlReplaceCredentialDrawer from './locales/en/access-control/replace-credential-drawer.json';
import enAccessControlAccessEventList from './locales/en/access-control/access-event-list.json';
import enAccessControlAccessEventDrawer from './locales/en/access-control/access-event-drawer.json';
import enOverviewOverviewView from './locales/en/overview/overview-view.json';
import enOverviewOverviewPanel from './locales/en/overview/overview-panel.json';
import enOverviewRevenueOccupancyCard from './locales/en/overview/revenue-occupancy-card.json';
import enOverviewPropertyOverviewCard from './locales/en/overview/property-overview-card.json';
import enOverviewTodaysArrivalsCard from './locales/en/overview/todays-arrivals-card.json';
import enOverviewRoomStatusCard from './locales/en/overview/room-status-card.json';
import enOverviewBookingSearch from './locales/en/overview/booking-search.json';
import enRoomsRoomsTerms from './locales/en/rooms/rooms-terms.json';
import enRoomsRoomsLayout from './locales/en/rooms/rooms-layout.json';
import enRoomsRoomAvailability from './locales/en/rooms/room-availability.json';
import enRoomsRoomTypeList from './locales/en/rooms/room-type-list.json';
import enRoomsRoomTypeForm from './locales/en/rooms/room-type-form.json';
import enRoomsRoomForm from './locales/en/rooms/room-form.json';
import enRoomsRoomStatusForm from './locales/en/rooms/room-status-form.json';
import enRoomsBookingControlledDialog from './locales/en/rooms/booking-controlled-dialog.json';
import enRoomsRoomMonthCalendar from './locales/en/rooms/room-month-calendar.json';
import enRoomsRoomDetail from './locales/en/rooms/room-detail.json';
import enRoomsRoomRates from './locales/en/rooms/room-rates.json';
import enRoomsRatePlanForm from './locales/en/rooms/rate-plan-form.json';
import enRoomsDailyRateForm from './locales/en/rooms/daily-rate-form.json';
import esSharedHome from './locales/es/shared/home.json';
import esSharedAppLayout from './locales/es/shared/app-layout.json';
import esSharedLanguageSwitcher from './locales/es/shared/language-switcher.json';
import esSharedSidebarToggle from './locales/es/shared/sidebar-toggle.json';
import esSharedPrimevueLocale from './locales/es/shared/primevue-locale.json';
import esInventoryInventoryTerms from './locales/es/inventory/inventory-terms.json';
import esInventoryInventoryLayout from './locales/es/inventory/inventory-layout.json';
import esInventoryInventoryItemList from './locales/es/inventory/inventory-item-list.json';
import esInventoryInventoryItemDetail from './locales/es/inventory/inventory-item-detail.json';
import esInventoryInventoryItemForm from './locales/es/inventory/inventory-item-form.json';
import esInventoryStorageLocationList from './locales/es/inventory/storage-location-list.json';
import esInventoryStorageLocationDetail from './locales/es/inventory/storage-location-detail.json';
import esInventoryStorageLocationForm from './locales/es/inventory/storage-location-form.json';
import esInventoryStockAdjustmentForm from './locales/es/inventory/stock-adjustment-form.json';
import esBookingsBookingsTerms from './locales/es/bookings/bookings-terms.json';
import esBookingsBookingsLayout from './locales/es/bookings/bookings-layout.json';
import esBookingsBookingList from './locales/es/bookings/booking-list.json';
import esBookingsBookingDetail from './locales/es/bookings/booking-detail.json';
import esBookingsBookingForm from './locales/es/bookings/booking-form.json';
import esBookingsBookingStatusDialog from './locales/es/bookings/booking-status-dialog.json';
import esBookingsBookingCancelDialog from './locales/es/bookings/booking-cancel-dialog.json';
import esBookingsBookingPaymentSummary from './locales/es/bookings/booking-payment-summary.json';
import esBookingsPaymentForm from './locales/es/bookings/payment-form.json';
import esBookingsBookingCheckIn from './locales/es/bookings/booking-check-in.json';
import esBookingsBookingCheckOut from './locales/es/bookings/booking-check-out.json';
import esAccessControlAccessControlTerms from './locales/es/access-control/access-control-terms.json';
import esAccessControlAccessControlLayout from './locales/es/access-control/access-control-layout.json';
import esAccessControlCredentialList from './locales/es/access-control/credential-list.json';
import esAccessControlCredentialDetail from './locales/es/access-control/credential-detail.json';
import esAccessControlStaffCredentialForm from './locales/es/access-control/staff-credential-form.json';
import esAccessControlRfidEncoderPanel from './locales/es/access-control/rfid-encoder-panel.json';
import esAccessControlRevokeCredentialDialog from './locales/es/access-control/revoke-credential-dialog.json';
import esAccessControlReplaceCredentialDrawer from './locales/es/access-control/replace-credential-drawer.json';
import esAccessControlAccessEventList from './locales/es/access-control/access-event-list.json';
import esAccessControlAccessEventDrawer from './locales/es/access-control/access-event-drawer.json';
import esOverviewOverviewView from './locales/es/overview/overview-view.json';
import esOverviewOverviewPanel from './locales/es/overview/overview-panel.json';
import esOverviewRevenueOccupancyCard from './locales/es/overview/revenue-occupancy-card.json';
import esOverviewPropertyOverviewCard from './locales/es/overview/property-overview-card.json';
import esOverviewTodaysArrivalsCard from './locales/es/overview/todays-arrivals-card.json';
import esOverviewRoomStatusCard from './locales/es/overview/room-status-card.json';
import esOverviewBookingSearch from './locales/es/overview/booking-search.json';
import esRoomsRoomsTerms from './locales/es/rooms/rooms-terms.json';
import esRoomsRoomsLayout from './locales/es/rooms/rooms-layout.json';
import esRoomsRoomAvailability from './locales/es/rooms/room-availability.json';
import esRoomsRoomTypeList from './locales/es/rooms/room-type-list.json';
import esRoomsRoomTypeForm from './locales/es/rooms/room-type-form.json';
import esRoomsRoomForm from './locales/es/rooms/room-form.json';
import esRoomsRoomStatusForm from './locales/es/rooms/room-status-form.json';
import esRoomsBookingControlledDialog from './locales/es/rooms/booking-controlled-dialog.json';
import esRoomsRoomMonthCalendar from './locales/es/rooms/room-month-calendar.json';
import esRoomsRoomDetail from './locales/es/rooms/room-detail.json';
import esRoomsRoomRates from './locales/es/rooms/room-rates.json';
import esRoomsRatePlanForm from './locales/es/rooms/rate-plan-form.json';
import esRoomsDailyRateForm from './locales/es/rooms/daily-rate-form.json';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      shared: {
        home: enSharedHome,
        'app-layout': enSharedAppLayout,
        'language-switcher': enSharedLanguageSwitcher,
        'sidebar-toggle': enSharedSidebarToggle,
        'primevue-locale': enSharedPrimevueLocale,
      },
      inventory: {
        'inventory-terms': enInventoryInventoryTerms,
        'inventory-layout': enInventoryInventoryLayout,
        'inventory-item-list': enInventoryInventoryItemList,
        'inventory-item-detail': enInventoryInventoryItemDetail,
        'inventory-item-form': enInventoryInventoryItemForm,
        'storage-location-list': enInventoryStorageLocationList,
        'storage-location-detail': enInventoryStorageLocationDetail,
        'storage-location-form': enInventoryStorageLocationForm,
        'stock-adjustment-form': enInventoryStockAdjustmentForm,
      },
      bookings: {
        'bookings-terms': enBookingsBookingsTerms,
        'bookings-layout': enBookingsBookingsLayout,
        'booking-list': enBookingsBookingList,
        'booking-detail': enBookingsBookingDetail,
        'booking-form': enBookingsBookingForm,
        'booking-status-dialog': enBookingsBookingStatusDialog,
        'booking-cancel-dialog': enBookingsBookingCancelDialog,
        'booking-payment-summary': enBookingsBookingPaymentSummary,
        'payment-form': enBookingsPaymentForm,
        'booking-check-in': enBookingsBookingCheckIn,
        'booking-check-out': enBookingsBookingCheckOut,
      },
      'access-control': {
        'access-control-terms': enAccessControlAccessControlTerms,
        'access-control-layout': enAccessControlAccessControlLayout,
        'credential-list': enAccessControlCredentialList,
        'credential-detail': enAccessControlCredentialDetail,
        'staff-credential-form': enAccessControlStaffCredentialForm,
        'rfid-encoder-panel': enAccessControlRfidEncoderPanel,
        'revoke-credential-dialog': enAccessControlRevokeCredentialDialog,
        'replace-credential-drawer': enAccessControlReplaceCredentialDrawer,
        'access-event-list': enAccessControlAccessEventList,
        'access-event-drawer': enAccessControlAccessEventDrawer,
      },
      overview: {
        'overview-view': enOverviewOverviewView,
        'overview-panel': enOverviewOverviewPanel,
        'revenue-occupancy-card': enOverviewRevenueOccupancyCard,
        'property-overview-card': enOverviewPropertyOverviewCard,
        'todays-arrivals-card': enOverviewTodaysArrivalsCard,
        'room-status-card': enOverviewRoomStatusCard,
        'booking-search': enOverviewBookingSearch,
      },
      rooms: {
        'rooms-terms': enRoomsRoomsTerms,
        'rooms-layout': enRoomsRoomsLayout,
        'room-availability': enRoomsRoomAvailability,
        'room-type-list': enRoomsRoomTypeList,
        'room-type-form': enRoomsRoomTypeForm,
        'room-form': enRoomsRoomForm,
        'room-status-form': enRoomsRoomStatusForm,
        'booking-controlled-dialog': enRoomsBookingControlledDialog,
        'room-month-calendar': enRoomsRoomMonthCalendar,
        'room-detail': enRoomsRoomDetail,
        'room-rates': enRoomsRoomRates,
        'rate-plan-form': enRoomsRatePlanForm,
        'daily-rate-form': enRoomsDailyRateForm,
      },
    },
    es: {
      shared: {
        home: esSharedHome,
        'app-layout': esSharedAppLayout,
        'language-switcher': esSharedLanguageSwitcher,
        'sidebar-toggle': esSharedSidebarToggle,
        'primevue-locale': esSharedPrimevueLocale,
      },
      inventory: {
        'inventory-terms': esInventoryInventoryTerms,
        'inventory-layout': esInventoryInventoryLayout,
        'inventory-item-list': esInventoryInventoryItemList,
        'inventory-item-detail': esInventoryInventoryItemDetail,
        'inventory-item-form': esInventoryInventoryItemForm,
        'storage-location-list': esInventoryStorageLocationList,
        'storage-location-detail': esInventoryStorageLocationDetail,
        'storage-location-form': esInventoryStorageLocationForm,
        'stock-adjustment-form': esInventoryStockAdjustmentForm,
      },
      bookings: {
        'bookings-terms': esBookingsBookingsTerms,
        'bookings-layout': esBookingsBookingsLayout,
        'booking-list': esBookingsBookingList,
        'booking-detail': esBookingsBookingDetail,
        'booking-form': esBookingsBookingForm,
        'booking-status-dialog': esBookingsBookingStatusDialog,
        'booking-cancel-dialog': esBookingsBookingCancelDialog,
        'booking-payment-summary': esBookingsBookingPaymentSummary,
        'payment-form': esBookingsPaymentForm,
        'booking-check-in': esBookingsBookingCheckIn,
        'booking-check-out': esBookingsBookingCheckOut,
      },
      'access-control': {
        'access-control-terms': esAccessControlAccessControlTerms,
        'access-control-layout': esAccessControlAccessControlLayout,
        'credential-list': esAccessControlCredentialList,
        'credential-detail': esAccessControlCredentialDetail,
        'staff-credential-form': esAccessControlStaffCredentialForm,
        'rfid-encoder-panel': esAccessControlRfidEncoderPanel,
        'revoke-credential-dialog': esAccessControlRevokeCredentialDialog,
        'replace-credential-drawer': esAccessControlReplaceCredentialDrawer,
        'access-event-list': esAccessControlAccessEventList,
        'access-event-drawer': esAccessControlAccessEventDrawer,
      },
      overview: {
        'overview-view': esOverviewOverviewView,
        'overview-panel': esOverviewOverviewPanel,
        'revenue-occupancy-card': esOverviewRevenueOccupancyCard,
        'property-overview-card': esOverviewPropertyOverviewCard,
        'todays-arrivals-card': esOverviewTodaysArrivalsCard,
        'room-status-card': esOverviewRoomStatusCard,
        'booking-search': esOverviewBookingSearch,
      },
      rooms: {
        'rooms-terms': esRoomsRoomsTerms,
        'rooms-layout': esRoomsRoomsLayout,
        'room-availability': esRoomsRoomAvailability,
        'room-type-list': esRoomsRoomTypeList,
        'room-type-form': esRoomsRoomTypeForm,
        'room-form': esRoomsRoomForm,
        'room-status-form': esRoomsRoomStatusForm,
        'booking-controlled-dialog': esRoomsBookingControlledDialog,
        'room-month-calendar': esRoomsRoomMonthCalendar,
        'room-detail': esRoomsRoomDetail,
        'room-rates': esRoomsRoomRates,
        'rate-plan-form': esRoomsRatePlanForm,
        'daily-rate-form': esRoomsDailyRateForm,
      },
    },
  },
});

export default i18n;
