import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

/**
 * Native date adapter whose weeks start on Sunday in every language,
 * as `firstDayOfWeek` in the PrimeVue locale texts of the Vue version.
 */
@Injectable()
export class HosteraDateAdapter extends NativeDateAdapter {
  override getFirstDayOfWeek(): number {
    return 0;
  }
}
