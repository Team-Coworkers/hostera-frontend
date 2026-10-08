import { Component } from '@angular/core';

/** Hostera logo mark. */
@Component({
  selector: 'app-brand-logo',
  template: `<img
    src="hostera-logo.svg"
    alt="Hostera"
    class="w-2rem flex-shrink-0"
  />`,
})
export class BrandLogoComponent {}
