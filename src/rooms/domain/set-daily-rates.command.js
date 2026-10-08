/**
 * Command used by the Rooms application layer to price a room type's nights under a rate plan over a date range.
 * Using the base rate removes the range's daily rates instead of setting a price.
 *
 * @class SetDailyRatesCommand
 */
export class SetDailyRatesCommand {
  /**
   * @param {Object} params - Command attributes.
   * @param {number} params.ratePlanId - Identifier of the rate plan.
   * @param {number} params.roomTypeId - Identifier of the room type.
   * @param {string} params.startDate - First ISO night of the range.
   * @param {string} params.endDate - Last ISO night of the range.
   * @param {boolean} [params.useBaseRate=false] - Whether the nights return to the base nightly rate.
   * @param {?number} [params.amount=null] - Price of each night, required unless using the base rate.
   */
  constructor({
    ratePlanId,
    roomTypeId,
    startDate,
    endDate,
    useBaseRate = false,
    amount = null,
  }) {
    this.ratePlanId = ratePlanId;
    this.roomTypeId = roomTypeId;
    this.startDate = startDate;
    this.endDate = endDate;
    this.useBaseRate = useBaseRate;
    this.amount = amount;
  }
}
