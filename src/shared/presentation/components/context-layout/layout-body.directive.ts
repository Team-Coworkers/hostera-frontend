import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Marks the body of a workspace view: `<ng-template layoutBody>…</ng-template>`.
 * The context layout renders it only once the workspace data has loaded, as the
 * default slot of the Vue layouts did with `v-else`.
 */
@Directive({ selector: 'ng-template[layoutBody]' })
export class LayoutBodyDirective {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}
