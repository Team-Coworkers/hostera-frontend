import { Component, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { I18nService } from './shared/presentation/i18n.service';

/** Root component: the public IAM views or the application shell, chosen by the route. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {
  constructor() {
    // Starts ngx-translate with the default language and localizes Angular Material.
    inject(I18nService);
    inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
  }
}
