import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { LayoutService } from '../../services/layout.service';

/** Header button that expands or collapses the application sidebar. */
@Component({
  selector: 'app-sidebar-toggle',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe],
  template: `
    <button
      mat-icon-button
      type="button"
      class="flex-shrink-0"
      aria-controls="app-sidebar"
      [attr.aria-expanded]="layout.sidebarOpen()"
      [attr.aria-label]="'shared.sidebar-toggle.label' | translate"
      [matTooltip]="'shared.sidebar-toggle.label' | translate"
      matTooltipPosition="below"
      (click)="layout.toggleSidebar()"
    >
      <mat-icon aria-hidden="true">dock_to_right</mat-icon>
    </button>
  `,
})
export class SidebarToggleComponent {
  protected readonly layout = inject(LayoutService);
}
