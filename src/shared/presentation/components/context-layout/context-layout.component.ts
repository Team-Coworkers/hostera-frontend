import { NgTemplateOutlet } from '@angular/common';
import { Component, input, output, TemplateRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { MessageComponent } from '../message/message.component';
import { SidebarToggleComponent } from '../sidebar-toggle/sidebar-toggle.component';

/** Property offered by the property selector. */
export interface PropertyOption {
  id: number | null;
  name: string;
}

/**
 * Shared chrome of every workspace: a sticky header with the sidebar toggle, the title,
 * the property selector, and the view's actions, above a body that shows the
 * no-properties warning, the connection error with retry, the loading state, or the view.
 *
 * Each bounded context wraps it in its own layout, which decides when its data is loaded.
 */
@Component({
  selector: 'app-context-layout',
  imports: [
    NgTemplateOutlet,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    RouterLink,
    SidebarToggleComponent,
    MessageComponent,
  ],
  templateUrl: './context-layout.component.html',
  styleUrl: './context-layout.component.css',
})
export class ContextLayoutComponent {
  /** Workspace title. */
  readonly title = input.required<string>();
  /** Route of the back button shown before the title, if any. */
  readonly backLink = input<string | null>(null);
  /** Accessible name of the back button. */
  readonly backLabel = input('');
  /** Properties of the organization. */
  readonly properties = input<PropertyOption[]>([]);
  /** Identifier of the selected property. */
  readonly currentPropertyId = input<number | null>(null);
  /** Accessible name of the property selector. */
  readonly propertyLabel = input('');
  /** Whether the property cannot change, such as while saving. */
  readonly propertyDisabled = input(false);
  /** Whether the properties loaded and there are none. */
  readonly noProperties = input(false);
  /** Warning shown when there are no properties. */
  readonly noPropertiesMessage = input('');
  /** Whether loading failed before the workspace data arrived. */
  readonly failed = input(false);
  /** Error shown when loading failed. */
  readonly connectionMessage = input('');
  /** Label of the retry button. */
  readonly retryLabel = input('');
  /** Whether the workspace data has loaded. */
  readonly loaded = input(false);
  /** Text of the loading state. */
  readonly loadingLabel = input('');
  /** Body of the view, rendered once loaded. */
  readonly body = input<TemplateRef<unknown> | undefined>(undefined);

  /** Emits the identifier of a newly selected property. */
  readonly propertyChange = output<number>();
  /** Emits when the operator asks to load again. */
  readonly retry = output<void>();

  /** @returns Name of the selected property. */
  protected currentPropertyName(): string {
    return (
      this.properties().find(
        (property) => property.id === this.currentPropertyId(),
      )?.name ?? '—'
    );
  }
}
