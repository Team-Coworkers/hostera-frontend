import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18nService } from './shared/presentation/i18n.service';

/** Root component: hosts the routed workspaces. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {
  constructor() {
    // Starts ngx-translate with the default language and localizes Angular Material.
    inject(I18nService);
  }
}
