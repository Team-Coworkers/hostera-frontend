import { Routes } from '@angular/router';

/**
 * Application routes. Each bounded context lazy-loads its own routes, and each view
 * is a lazy standalone component; `title` replaces the `meta.title` of the Vue router.
 */
export const routes: Routes = [{ path: '**', redirectTo: '' }];
