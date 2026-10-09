import { Component, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TranslatePipe } from '@ngx-translate/core';
import { AppLocale, availableLocales, I18nService } from '../../i18n.service';

/** Segmented control that switches the interface language. */
@Component({
  selector: 'app-language-switcher',
  imports: [MatButtonToggleModule, TranslatePipe],
  template: `
    <mat-button-toggle-group
      class="w-full"
      hideSingleSelectionIndicator
      [value]="i18n.locale()"
      [attr.aria-label]="'shared.language-switcher.label' | translate"
      (change)="use($event.value)"
    >
      @for (locale of locales; track locale) {
        <mat-button-toggle class="flex-1" [value]="locale">{{
          locale.toUpperCase()
        }}</mat-button-toggle>
      }
    </mat-button-toggle-group>
  `,
  styles: `
    mat-button-toggle-group {
      --mat-standard-button-toggle-height: 2rem;
      --mat-standard-button-toggle-selected-state-background-color: var(
        --p-primary-color
      );
      --mat-standard-button-toggle-selected-state-text-color: #fff;
    }
  `,
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly locales = availableLocales;

  /** @param locale - Selected language. */
  protected use(locale: AppLocale): void {
    this.i18n.use(locale);
  }
}
