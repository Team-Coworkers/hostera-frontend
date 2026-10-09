import { PublicHoliday } from '../domain/model/public-holiday.entity';

/** Public holiday as returned by the Nager.Date API. */
export interface PublicHolidayResource {
  date: string;
  localName: string;
  name: string;
  countryCode?: string;
  /** Whether the holiday applies to the whole country. */
  global?: boolean;
  types?: string[];
}

/**
 * Maps Nager.Date public holidays into Rooms domain entities.
 */
export class PublicHolidayAssembler {
  /**
   * Keeps the nationwide holidays, which apply to every property of the country.
   * @param resources - Holidays returned by the API.
   * @returns Public holiday entities.
   */
  static toEntities(
    resources: PublicHolidayResource[] | null | undefined,
  ): PublicHoliday[] {
    return (resources ?? [])
      .filter((resource) => resource.global !== false && !!resource.date)
      .map(
        ({ date, localName, name }) =>
          new PublicHoliday({ date, localName, name }),
      );
  }
}
