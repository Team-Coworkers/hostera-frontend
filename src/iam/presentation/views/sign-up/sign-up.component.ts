import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { MessageComponent } from '../../../../shared/presentation/components/message/message.component';
import { formatMoney } from '../../../../shared/presentation/calendar-format';
import { I18nService } from '../../../../shared/presentation/i18n.service';
import { ToastService } from '../../../../shared/presentation/services/toast.service';
import {
  AccountRegistration,
  RegistrationError,
} from '../../../domain/model/account-registration.entity';
import {
  PlanId,
  SubscriptionPlan,
} from '../../../domain/model/subscription-plan.entity';
import { AuthLayoutComponent } from '../../components/auth-layout/auth-layout.component';

/**
 * Account creation with an initial subscription plan.
 *
 * The plan comes from the `plan` query parameter, so each segment's call-to-action on
 * the landing page opens its own plan: `?plan=starter` for independent hotels and
 * `?plan=professional` for small chains. The Professional estimate follows the landing
 * page calculator. Accounts are stored by the IAM endpoints of the Spring Boot RESTful
 * API; until then the view validates the request and opens the demonstration workspace.
 */
@Component({
  selector: 'app-sign-up',
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RouterLink,
    AuthLayoutComponent,
    MessageComponent,
  ],
  templateUrl: './sign-up.component.html',
  styles: `
    .plan-summary {
      background: var(--p-primary-50);
    }
  `,
})
export class SignUpComponent {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** `plan` query parameter. */
  readonly plan = input<string>();

  protected readonly plans = SubscriptionPlan.all;
  protected readonly selectedPlan = linkedSignal(() =>
    SubscriptionPlan.fromId(this.plan()),
  );

  protected fullName = '';
  protected email = '';
  protected organizationName = '';
  protected readonly propertyCount = linkedSignal(
    () => this.selectedPlan().minProperties,
  );
  protected readonly roomCount = linkedSignal(() =>
    this.selectedPlan().pricingUnit === 'room' ? 25 : 10,
  );
  protected readonly error = signal<RegistrationError | null>(null);

  protected readonly monthlyPrice = computed(() =>
    this.selectedPlan().monthlyPrice(this.propertyCount(), this.roomCount()),
  );

  /** @returns The estimate formatted in soles for the active language. */
  protected readonly formattedPrice = computed(() =>
    formatMoney(
      this.monthlyPrice(),
      SubscriptionPlan.currency,
      this.i18n.locale(),
    ),
  );

  /** @param id - Plan chosen in the plan selector. */
  protected choosePlan(id: PlanId): void {
    this.selectedPlan.set(SubscriptionPlan.fromId(id));
    this.error.set(null);
  }

  /** Validates the registration and opens the workspace. */
  protected register(): void {
    const registration = new AccountRegistration(
      this.fullName,
      this.email,
      this.organizationName,
      this.selectedPlan(),
      Number(this.propertyCount()),
      Number(this.roomCount()),
    );
    const error = registration.validate();
    this.error.set(error);
    if (error) return;
    this.toast.add({
      severity: 'success',
      summary: this.i18n.t('iam.sign-up.created-summary'),
      detail: this.i18n.t('iam.sign-up.created-detail', {
        plan: this.i18n.t(`iam.plans.${registration.plan.id}.name`),
      }),
      life: 5000,
    });
    void this.router.navigateByUrl('/');
  }
}
