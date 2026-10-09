import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Public site of Hostera, where the terms and conditions are published. */
export const landingPageUrl =
  'https://team-coworkers.github.io/landing-page-main/';

/**
 * Site footer with the copyright notice and the link to the terms and conditions,
 * which the landing page publishes for both products.
 */
@Component({
  selector: 'app-footer',
  imports: [TranslatePipe],
  template: `
    <footer
      class="app-footer flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3 text-sm text-color-secondary"
      [attr.aria-label]="'shared.app-footer.label' | translate"
    >
      <span>{{ 'shared.app-footer.rights' | translate: { year } }}</span>
      <nav
        class="flex flex-wrap gap-3"
        [attr.aria-label]="'shared.app-footer.links' | translate"
      >
        <a
          [href]="landingPageUrl"
          target="_blank"
          rel="noopener"
          [attr.aria-label]="'shared.app-footer.about-label' | translate"
          >{{ 'shared.app-footer.about' | translate }}</a
        >
        <a
          [href]="termsUrl"
          target="_blank"
          rel="noopener"
          [attr.aria-label]="'shared.app-footer.terms-label' | translate"
          >{{ 'shared.app-footer.terms' | translate }}</a
        >
      </nav>
    </footer>
  `,
  styles: `
    .app-footer {
      border-top: 1px solid var(--p-surface-200);
    }

    a {
      color: var(--p-primary-color);
      text-decoration: underline;
      text-underline-offset: 2px;
    }
  `,
})
export class AppFooterComponent {
  protected readonly year = new Date().getFullYear();
  protected readonly landingPageUrl = landingPageUrl;
  protected readonly termsUrl = `${landingPageUrl}terms.html`;
}
