import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  IsActiveMatchOptions,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LayoutService } from '../../services/layout.service';
import { AppFooterComponent } from '../app-footer/app-footer.component';
import { BrandLogoComponent } from '../brand-logo/brand-logo.component';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

/** Entry of the main navigation. */
interface NavigationItem {
  label: string;
  icon: string;
  link: string;
  /** Whether only the exact path is the current section, as for the overview. */
  exact?: boolean;
}

/**
 * Application shell: a Material sidenav with the main navigation, the language switcher,
 * and the signed-in operator, around the routed workspace and the site footer.
 *
 * On desktop the sidenav rests as an icon rail and expands over the content on hover;
 * below 992px it becomes an off-canvas overlay opened from each workspace header.
 */
@Component({
  selector: 'app-layout',
  imports: [
    MatSidenavModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
    AppFooterComponent,
    BrandLogoComponent,
    LanguageSwitcherComponent,
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.css',
})
export class AppLayoutComponent {
  protected readonly layout = inject(LayoutService);

  /** Whether the desktop sidenav shows only icons. */
  protected readonly collapsed = computed(
    () => !this.layout.compact() && !this.layout.sidebarOpen(),
  );

  /** Signed-in operator placeholder until the IAM context is implemented. */
  protected readonly currentOperator = { name: 'Lucía Martín', initials: 'LM' };

  protected readonly navigationItems: NavigationItem[] = [
    {
      label: 'shared.app-layout.overview',
      icon: 'dashboard',
      link: '/',
      exact: true,
    },
    {
      label: 'shared.app-layout.bookings',
      icon: 'calendar_month',
      link: '/bookings',
    },
    { label: 'shared.app-layout.rooms', icon: 'key', link: '/rooms' },
    {
      label: 'shared.app-layout.inventory',
      icon: 'inventory_2',
      link: '/inventory',
    },
    {
      label: 'shared.app-layout.access-control',
      icon: 'lock',
      link: '/access-control',
    },
  ];

  protected readonly exactMatch: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
  };
  protected readonly sectionMatch: IsActiveMatchOptions = {
    ...this.exactMatch,
    paths: 'subset',
  };

  /** Expands the desktop sidenav while the pointer is over it. */
  protected hover(open: boolean): void {
    if (!this.layout.compact()) this.layout.sidebarOpen.set(open);
  }
}
