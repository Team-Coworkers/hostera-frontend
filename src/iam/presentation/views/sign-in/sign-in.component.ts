import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { SessionStore } from '../../../application/session.store';
import { AuthenticationApiService } from '../../../infrastructure/authentication-api.service';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';

/**
 * Sign-in view, opened by the "Sign in" link of the landing page.
 *
 * With the RESTful API (authenticationEnabled) it signs in at POST /tokens and keeps the
 * JWT in the session; with the demonstration API it opens the workspace with sample data.
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
  private readonly authentication = inject(AuthenticationApiService);
  private readonly session = inject(SessionStore);

  protected readonly authenticationEnabled = environment.authenticationEnabled;
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);

  protected email = '';
  protected password = '';
  protected readonly passwordVisible = signal(false);
  protected readonly submitted = signal(false);

  /** @returns Whether both fields hold a value. */
  protected get complete(): boolean {
    return this.email.trim() !== '' && this.password !== '';
  }

  /** Signs in with the RESTful API, or opens the demonstration workspace. */
  protected signIn(): void {
    this.submitted.set(true);
    this.failed.set(false);
    if (!this.complete) return;
    if (this.authenticationEnabled) {
      this.loading.set(true);
      this.authentication
        .signIn({ username: this.email.trim(), password: this.password })
        .subscribe({
          next: (user) => {
            this.session.start({
              userId: user.id,
              username: user.username,
              token: user.token,
            });
            this.loading.set(false);
            void this.router.navigateByUrl('/');
          },
          error: () => {
            this.loading.set(false);
            this.failed.set(true);
          },
        });
      return;
    }
    this.toast.add({
      severity: 'info',
      summary: this.i18n.t('iam.sign-in.demo-summary'),
      detail: this.i18n.t('iam.sign-in.demo-detail'),
      life: 5000,
    });
    void this.router.navigateByUrl('/');
  }
}
