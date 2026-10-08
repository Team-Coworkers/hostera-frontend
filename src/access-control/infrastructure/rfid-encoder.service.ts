import { Injectable } from '@angular/core';

/** States the encoder reports while it writes a card. */
export type EncodingState = 'encoding' | 'verifying';

/**
 * Front desk RFID encoder that writes a credential to a blank key card.
 * This implementation simulates the vendor encoder bridge: it waits like a real write and returns a new card ID.
 */
@Injectable({ providedIn: 'root' })
export class RfidEncoderService {
  /**
   * Waits for a number of milliseconds.
   * @param milliseconds - Waiting time.
   */
  private static wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  /**
   * Writes a credential to the card on the encoder and verifies it.
   * @param onState - Receives each encoding state.
   * @returns Four-character hexadecimal ID of the written card.
   */
  async encode(onState: (state: EncodingState) => void): Promise<string> {
    onState('encoding');
    await RfidEncoderService.wait(900);
    onState('verifying');
    await RfidEncoderService.wait(600);
    return Math.floor(Math.random() * 0x10000)
      .toString(16)
      .toUpperCase()
      .padStart(4, '0');
  }
}
