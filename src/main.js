import { createApp } from 'vue';
import './style.css';
import App from './app.vue';
import i18n from './i18n.js';
import PrimeVue from 'primevue/config';
import Material from '@primeuix/themes/material';
import { definePreset } from '@primeuix/themes';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import Tooltip from 'primevue/tooltip';
import Chart from 'primevue/chart';
import {
  AutoComplete,
  Avatar,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Column,
  ConfirmationService,
  ConfirmDialog,
  DataTable,
  DatePicker,
  Dialog,
  DialogService,
  Divider,
  Drawer,
  FileUpload,
  FloatLabel,
  IconField,
  InputGroup,
  InputGroupAddon,
  InputIcon,
  InputNumber,
  InputText,
  Menu,
  Message,
  MultiSelect,
  Popover,
  ProgressSpinner,
  Rating,
  Row,
  Select,
  SelectButton,
  Sidebar,
  SidebarAside,
  SidebarBackdrop,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarLayout,
  SidebarMain,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarPanel,
  SidebarSpacer,
  SidebarTrigger,
  Step,
  StepList,
  StepPanel,
  StepPanels,
  Stepper,
  Tab,
  TabList,
  Tabs,
  Tag,
  Toast,
  Textarea,
  ToastService,
  ToggleSwitch,
  Toolbar,
} from 'primevue';
import router from './router.js';
import pinia from './pinia.js';

const primeVueLicenseKey = import.meta.env.VITE_PRIMEVUE_LICENSE_KEY;

// Hostera design tokens from the Paper design system.
const hosteraTheme = definePreset(Material, {
  semantic: {
    typography: { fontSize: '1rem' },
    primary: {
      50: '#eef7f2',
      100: '#d5ebe0',
      200: '#aed8c4',
      300: '#82c2a5',
      400: '#4f9e7f',
      500: '#2d7a5d',
      600: '#1e6a4f',
      700: '#14523e',
      800: '#0e4030',
      900: '#0a3024',
      950: '#051a14',
      color: '{primary.700}',
      contrastColor: '#ffffff',
      hoverColor: '{primary.800}',
      activeColor: '{primary.900}',
    },
    surface: {
      0: '#ffffff',
      50: '#f9fbfa',
      100: '#f3f6f4',
      200: '#e7ece9',
      300: '#c6cfca',
      400: '#9aa6a0',
      500: '#6e7b75',
      600: '#5b6862',
      700: '#3f4a45',
      800: '#2a302e',
      900: '#18201d',
      950: '#0d1613',
    },
    text: {
      color: '{surface.950}',
      hoverColor: '{surface.950}',
      mutedColor: '{surface.600}',
      hoverMutedColor: '{surface.700}',
    },
    navigation: {
      item: {
        borderRadius: '{border.radius.lg}',
        focusBackground: '{surface.100}',
        activeBackground: '{primary.50}',
        activeColor: '{primary.700}',
        icon: {
          color: '{surface.600}',
          focusColor: '{surface.700}',
          activeColor: '{primary.700}',
        },
      },
    },
  },
  components: {
    sidebar: {
      main: { borderRadius: '{border.radius.xl}' },
      menu: { gap: '0.375rem' },
      menuButton: {
        padding: '0 0.75rem',
        gap: '0.75rem',
        height: '2.75rem',
        fontWeight: '500',
        iconOnlyWidth: '2.75rem',
      },
      // The current section carries a primary accent on its leading edge.
      css: `
        .p-sidebar-menu-button[data-active="true"] {
          box-shadow: inset 3px 0 0 dt('primary.color');
        }
      `,
    },
    // Soft status chips: tinted background with a darker same-hue label (AA contrast).
    tag: {
      root: {
        fontSize: '0.875rem',
        fontWeight: '600',
        padding: '0.25rem 0.625rem',
        borderRadius: '{border.radius.lg}',
      },
      primary: { background: '{primary.100}', color: '{primary.800}' },
      success: { background: '#dcf5e3', color: '#1b6e37' },
      warn: { background: '#fdebd3', color: '#a8430d' },
      danger: { background: '#fbe1e1', color: '#b0261c' },
      info: { background: '#e1eefa', color: '#1d5a91' },
    },
    tabs: {
      tablist: { background: 'transparent' },
      tab: { color: '{text.muted.color}' },
    },
    togglebutton: {
      root: {
        checkedBackground: '{primary.color}',
        checkedBorderColor: '{primary.color}',
        checkedColor: '{primary.contrast.color}',
      },
      icon: { checkedColor: '{primary.contrast.color}' },
      // Keyboard focus shows a ring instead of repainting the checked segment.
      css: `
        .p-togglebutton:not(.p-togglebutton-checked):focus-visible {
          background: dt('togglebutton.hover.background');
        }
        .p-togglebutton:focus-visible {
          outline: 2px solid dt('primary.color');
          outline-offset: 2px;
          z-index: 1;
        }
      `,
    },
  },
});

// noinspection JSCheckFunctionSignatures
createApp(App)
  .use(i18n)
  .use(PrimeVue, {
    theme: { preset: hosteraTheme, options: { darkModeSelector: false } },
    ripple: true,
    license: primeVueLicenseKey,
  })
  .use(ConfirmationService)
  .use(DialogService)
  .use(ToastService)
  .component('pv-auto-complete', AutoComplete)
  .component('pv-avatar', Avatar)
  .component('pv-breadcrumb', Breadcrumb)
  .component('pv-button', Button)
  .component('pv-card', Card)
  .component('pv-chart', Chart)
  .component('pv-checkbox', Checkbox)
  .component('pv-column', Column)
  .component('pv-confirm-dialog', ConfirmDialog)
  .component('pv-data-table', DataTable)
  .component('pv-date-picker', DatePicker)
  .component('pv-dialog', Dialog)
  .component('pv-divider', Divider)
  .component('pv-drawer', Drawer)
  .component('pv-file-upload', FileUpload)
  .component('pv-float-label', FloatLabel)
  .component('pv-icon-field', IconField)
  .component('pv-input-group', InputGroup)
  .component('pv-input-group-addon', InputGroupAddon)
  .component('pv-input-icon', InputIcon)
  .component('pv-input-number', InputNumber)
  .component('pv-input-text', InputText)
  .component('pv-menu', Menu)
  .component('pv-message', Message)
  .component('pv-multi-select', MultiSelect)
  .component('pv-popover', Popover)
  .component('pv-progress-spinner', ProgressSpinner)
  .component('pv-rating', Rating)
  .component('pv-row', Row)
  .component('pv-select', Select)
  .component('pv-select-button', SelectButton)
  .component('pv-sidebar', Sidebar)
  .component('pv-sidebar-aside', SidebarAside)
  .component('pv-sidebar-backdrop', SidebarBackdrop)
  .component('pv-sidebar-content', SidebarContent)
  .component('pv-sidebar-footer', SidebarFooter)
  .component('pv-sidebar-group', SidebarGroup)
  .component('pv-sidebar-group-label', SidebarGroupLabel)
  .component('pv-sidebar-header', SidebarHeader)
  .component('pv-sidebar-layout', SidebarLayout)
  .component('pv-sidebar-main', SidebarMain)
  .component('pv-sidebar-menu', SidebarMenu)
  .component('pv-sidebar-menu-button', SidebarMenuButton)
  .component('pv-sidebar-menu-item', SidebarMenuItem)
  .component('pv-sidebar-panel', SidebarPanel)
  .component('pv-sidebar-spacer', SidebarSpacer)
  .component('pv-sidebar-trigger', SidebarTrigger)
  .component('pv-step', Step)
  .component('pv-step-list', StepList)
  .component('pv-step-panel', StepPanel)
  .component('pv-step-panels', StepPanels)
  .component('pv-stepper', Stepper)
  .component('pv-tab', Tab)
  .component('pv-tab-list', TabList)
  .component('pv-tabs', Tabs)
  .component('pv-tag', Tag)
  .component('pv-textarea', Textarea)
  .component('pv-toast', Toast)
  .component('pv-toggle-switch', ToggleSwitch)
  .component('pv-toolbar', Toolbar)
  .directive('tooltip', Tooltip)
  .use(pinia)
  .use(router)
  .mount('#app');
