import { Component, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { AppLayoutComponent } from './shared/presentation/components/app-layout/app-layout.component';
import { I18nService } from './shared/presentation/i18n.service';

/** Root component: the application layout around the routed workspaces. */
@Component({
  selector: 'app-root',
  imports: [AppLayoutComponent],
  template: `<app-layout />`,
})
export class AppComponent {
  constructor() {
    // Starts ngx-translate with the default language and localizes Angular Material.
    inject(I18nService);
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
  }
}
