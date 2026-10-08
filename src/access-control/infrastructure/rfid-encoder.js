/**
 * Front desk RFID encoder that writes a credential to a blank key card.
 * This implementation simulates the vendor encoder bridge: it waits like a real write and returns a new card ID.
 *
 * @class RfidEncoder
 */
export class RfidEncoder {
  /**
   * Waits for a number of milliseconds.
   * @param {number} milliseconds - Waiting time.
   * @private
   * @returns {Promise<void>}
   */
  static #wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  /**
   * Writes a credential to the card on the encoder and verifies it.
   * @param {(state: 'encoding'|'verifying') => void} onState - Receives each encoding state.
   * @returns {Promise<string>} Four-character hexadecimal ID of the written card.
   */
  async encode(onState) {
    onState('encoding');
    await RfidEncoder.#wait(900);
    onState('verifying');
    await RfidEncoder.#wait(600);
    return Math.floor(Math.random() * 0x10000)
      .toString(16)
      .toUpperCase()
      .padStart(4, '0');
  }
}
