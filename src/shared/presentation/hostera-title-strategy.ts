import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/**
 * Sets the document title to "Hostera - <route title>", as the global guard of the Vue router did.
 */
@Injectable()
export class HosteraTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const baseTitle = 'Hostera';
    const routeTitle = this.buildTitle(snapshot);
    this.title.setTitle(
      routeTitle ? `${baseTitle} - ${routeTitle}` : baseTitle,
    );
  }
}
