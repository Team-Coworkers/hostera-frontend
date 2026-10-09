import { Routes } from '@angular/router';

/** Public routes of the IAM context, shown outside the workspace shell. */
export const iamRoutes: Routes = [
  {
    path: 'sign-in',
    title: 'Sign In',
    loadComponent: () =>
      import('./views/sign-in/sign-in.component').then(
        (m) => m.SignInComponent,
      ),
  },
  {
    path: 'sign-up',
    title: 'Create Account',
    loadComponent: () =>
      import('./views/sign-up/sign-up.component').then(
        (m) => m.SignUpComponent,
      ),
  },
];
