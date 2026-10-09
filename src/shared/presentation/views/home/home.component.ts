import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Welcome page. */
@Component({
  selector: 'app-home',
  imports: [TranslatePipe],
  template: `<h1>{{ 'shared.home.title' | translate }}</h1>`,
})
export class HomeComponent {}
