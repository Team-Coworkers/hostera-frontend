/**
 * Command used by the Rooms application layer to price a room type's nights under a rate plan over a date range.
 * Using the base rate removes the range's daily rates instead of setting a price.
 */
export class SetDailyRatesCommand {
  /** Identifier of the rate plan. */
  readonly ratePlanId: number;
  /** Identifier of the room type. */
  readonly roomTypeId: number;
  /** First ISO night of the range. */
  readonly startDate: string;
  /** Last ISO night of the range. */
  readonly endDate: string;
  /** Whether the nights return to the base nightly rate. */
  readonly useBaseRate: boolean;
  /** Price of each night, required unless using the base rate. */
  readonly amount: number | null;

  /**
   * @param params - Command attributes.
   */
  constructor({
    ratePlanId,
    roomTypeId,
    startDate,
    endDate,
    useBaseRate = false,
    amount = null,
  }: {
    ratePlanId: number;
    roomTypeId: number;
    startDate: string;
    endDate: string;
    useBaseRate?: boolean;
    amount?: number | null;
  }) {
    this.ratePlanId = ratePlanId;
    this.roomTypeId = roomTypeId;
    this.startDate = startDate;
    this.endDate = endDate;
    this.useBaseRate = useBaseRate;
    this.amount = amount;
  }
}
