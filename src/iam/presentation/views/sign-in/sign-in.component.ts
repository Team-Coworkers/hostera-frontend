import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';

/**
 * Sign-in view, opened by the "Sign in" link of the landing page.
 *
 * Authentication arrives with the IAM endpoints of the Spring Boot RESTful API; until
 * then the view checks the form and opens the workspace with the demonstration data.
 */
@Component({
  selector: 'app-sign-in',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RouterLink,
    AuthLayoutComponent,
    MessageComponent,
  ],
  templateUrl: './sign-in.component.html',
})
export class SignInComponent {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected email = '';
  protected password = '';
  protected readonly passwordVisible = signal(false);
  protected readonly submitted = signal(false);

  /** @returns Whether both fields hold a value. */
  protected get complete(): boolean {
    return this.email.trim() !== '' && this.password !== '';
  }

  /** Opens the workspace once both fields are filled in. */
  protected signIn(): void {
    this.submitted.set(true);
    if (!this.complete) return;
    this.toast.add({
      severity: 'info',
      summary: this.i18n.t('iam.sign-in.demo-summary'),
      detail: this.i18n.t('iam.sign-in.demo-detail'),
      life: 5000,
    });
    void this.router.navigateByUrl('/');
  }
}
