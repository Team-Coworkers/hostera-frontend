/** Attributes of a public holiday. */
export interface PublicHolidayAttributes {
  /** ISO calendar day, such as `2026-07-28`. */
  date: string;
  /** Name in the country's language, such as "Fiestas Patrias". */
  localName: string;
  /** English name, such as "Independence Day". */
  name: string;
}

/**
 * National public holiday of the property's country. Holidays raise or shift hotel
 * demand, so the availability view flags them next to the room days.
 */
export class PublicHoliday {
  readonly date: string;
  readonly localName: string;
  readonly name: string;

  constructor({ date, localName, name }: PublicHolidayAttributes) {
    this.date = date;
    this.localName = localName;
    this.name = name;
  }

  /**
   * @param locale - Active interface locale.
   * @returns The local name for Spanish interfaces and the English name otherwise.
   */
  displayName(locale: string): string {
    return locale.startsWith('es') ? this.localName : this.name;
  }
}
