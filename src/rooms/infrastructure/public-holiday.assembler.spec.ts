import { PublicHolidayAssembler } from './public-holiday.assembler';

describe('PublicHolidayAssembler', () => {
  it('maps the nationwide holidays returned by Nager.Date', () => {
    const holidays = PublicHolidayAssembler.toEntities([
      {
        date: '2026-07-28',
        localName: 'Fiestas Patrias',
        name: 'Independence Day',
        countryCode: 'PE',
        global: true,
        types: ['Public'],
      },
      {
        date: '2026-06-07',
        localName: 'Batalla de Arica',
        name: 'Battle of Arica',
        global: false,
      },
    ]);

    expect(holidays.length).toBe(1);
    expect(holidays[0].date).toBe('2026-07-28');
    expect(holidays[0].displayName('en')).toBe('Independence Day');
    expect(holidays[0].displayName('es-419')).toBe('Fiestas Patrias');
  });

  it('returns no holidays for an empty response', () => {
    expect(PublicHolidayAssembler.toEntities(null)).toEqual([]);
  });
});
