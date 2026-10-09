import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PublicHoliday } from '../domain/model/public-holiday.entity';
import {
  PublicHolidayAssembler,
  PublicHolidayResource,
} from './public-holiday.assembler';

/**
 * Gateway to Nager.Date, a free third-party API of public holidays that needs no key.
 * It is the solution's external service: `GET /PublicHolidays/{year}/{countryCode}`.
 */
@Injectable({ providedIn: 'root' })
export class PublicHolidaysApiService {
  private readonly http = inject(HttpClient);

  /**
   * @param year - Calendar year.
   * @param countryCode - ISO 3166-1 alpha-2 country code, such as `PE`.
   * @returns The country's nationwide public holidays of the year.
   */
  getPublicHolidays(
    year: number,
    countryCode = environment.publicHolidaysCountryCode,
  ): Observable<PublicHoliday[]> {
    return this.http
      .get<PublicHolidayResource[]>(
        `${environment.publicHolidaysApiUrl}/PublicHolidays/${year}/${countryCode}`,
      )
      .pipe(map((resources) => PublicHolidayAssembler.toEntities(resources)));
  }
}
