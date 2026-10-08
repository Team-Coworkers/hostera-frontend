import { HttpResponse } from '@angular/common/http';
import {
  computed,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { RoomsStore } from '../../rooms/application/rooms.store';
import { IssueGuestKeyCardsCommand } from '../domain/issue-guest-key-cards.command';
import { IssueStaffCredentialCommand } from '../domain/issue-staff-credential.command';
import { AccessControlError } from '../domain/model/access-control.error';
import { AccessEvent } from '../domain/model/access-event.entity';
import {
  Credential,
  CredentialStatus,
} from '../domain/model/credential.entity';
import { StaffMember } from '../domain/model/staff-member.entity';
import { RevokeCredentialCommand } from '../domain/revoke-credential.command';
import { AccessControlApiService } from '../infrastructure/access-control-api.service';
import { AccessEventAssembler } from '../infrastructure/access-event.assembler';
import { CredentialAssembler } from '../infrastructure/credential.assembler';
import { RfidEncoderService } from '../infrastructure/rfid-encoder.service';
import { StaffMemberAssembler } from '../infrastructure/staff-member.assembler';

/** Operator recorded in credential changes until IAM is implemented. */
const demoOperator = 'Demo operator';

/** Local hour at which guest key cards stop opening doors on the check-out day. */
const checkOutHour = 11;

/** State of the front desk RFID encoder. */
export type EncoderState =
  'ready' | 'encoding' | 'verifying' | 'encoded' | 'failed';

/** Assembler of a property-scoped collection. */
interface CollectionAssembler<T> {
  toEntitiesFromResponse(response: HttpResponse<unknown>): T[];
}

/**
 * Application service store for the Access Control bounded context, replacing the
 * `access-control` Pinia store. It coordinates credential use cases with the RFID encoder
 * and keeps UI-facing state in signals.
 */
@Injectable({ providedIn: 'root' })
export class AccessControlStore {
  private readonly accessControlApi = inject(AccessControlApiService);
  private readonly rfidEncoder = inject(RfidEncoderService);
  private readonly roomsStore = inject(RoomsStore);

  /** Credentials of the current property. */
  readonly credentials = signal<Credential[]>([]);
  /** Staff members of the current property. */
  readonly staffMembers = signal<StaffMember[]>([]);
  /** Access events of the current property. */
  readonly accessEvents = signal<AccessEvent[]>([]);
  /** Errors encountered during API operations. */
  readonly errors = signal<unknown[]>([]);
  /** Whether credentials have been loaded from the API. */
  readonly credentialsLoaded = signal(false);
  /** Whether staff members have been loaded from the API. */
  readonly staffMembersLoaded = signal(false);
  /** Whether access events have been loaded from the API. */
  readonly accessEventsLoaded = signal(false);
  /** Whether a create or update operation is in progress. */
  readonly saving = signal(false);
  /** State of the front desk RFID encoder. */
  readonly encoderState = signal<EncoderState>('ready');
  /** Identifier of the property whose access is managed, shared with the Rooms context. */
  readonly currentPropertyId = computed(() =>
    this.roomsStore.currentPropertyId(),
  );

  constructor() {
    // Access follows the property selected in any context.
    effect(() => {
      this.currentPropertyId();
      untracked(() => this.fetchAccessControl());
    });
  }

  /**
   * Loads one property-scoped collection and ignores responses for a previously selected property.
   * @param request - Infrastructure request.
   * @param assembler - Assembler for the collection.
   * @param collection - Collection state.
   * @param loaded - Loaded flag of the collection.
   */
  private fetchCollection<T>(
    request: (propertyId: number) => Observable<HttpResponse<unknown>>,
    assembler: CollectionAssembler<T>,
    collection: WritableSignal<T[]>,
    loaded: WritableSignal<boolean>,
  ): Promise<void> {
    const propertyId = this.currentPropertyId();
    collection.set([]);
    loaded.set(false);
    if (!propertyId) return Promise.resolve();
    return firstValueFrom(request(propertyId))
      .then((response) => {
        if (propertyId !== this.currentPropertyId()) return;
        collection.set(assembler.toEntitiesFromResponse(response));
        loaded.set(true);
      })
      .catch((error) => {
        if (propertyId === this.currentPropertyId()) this.recordError(error);
      });
  }

  /** Loads the current property's credentials, staff members, and access events. */
  fetchAccessControl(): Promise<void> {
    this.errors.set([]);
    return Promise.all([
      this.fetchCollection(
        (propertyId) => this.accessControlApi.getCredentials(propertyId),
        CredentialAssembler,
        this.credentials,
        this.credentialsLoaded,
      ),
      this.fetchCollection(
        (propertyId) => this.accessControlApi.getStaffMembers(propertyId),
        StaffMemberAssembler,
        this.staffMembers,
        this.staffMembersLoaded,
      ),
      this.fetchCollection(
        (propertyId) => this.accessControlApi.getAccessEvents(propertyId),
        AccessEventAssembler,
        this.accessEvents,
        this.accessEventsLoaded,
      ),
    ]).then(() => undefined);
  }

  /** Returns the current moment as an ISO date-time. */
  private now(): string {
    return new Date().toISOString();
  }

  /**
   * Finds a credential entity by identifier.
   * @param id - Credential identifier.
   */
  getCredentialById(id: number | string | null): Credential | undefined {
    const idNum = Number(id);
    return this.credentials().find((credential) => credential.id === idNum);
  }

  /**
   * Finds a staff member entity by identifier.
   * @param id - Staff member identifier.
   */
  getStaffMemberById(id: number | string | null): StaffMember | undefined {
    const idNum = Number(id);
    return this.staffMembers().find((member) => member.id === idNum);
  }

  /**
   * Derives a credential's status now.
   * @param credential - Credential to check.
   */
  getCredentialStatus(credential: Credential): CredentialStatus {
    return credential.statusAt(this.now());
  }

  /**
   * Lists the key cards of a booking, newest first.
   * @param bookingId - Booking identifier.
   */
  getKeyCardsOfBooking(bookingId: number | null): Credential[] {
    return this.credentials()
      .filter((credential) => credential.bookingId === bookingId)
      .toSorted((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }

  /**
   * Lists the access events of a credential, newest first.
   * @param credentialId - Credential identifier.
   */
  getEventsOfCredential(credentialId: number | null): AccessEvent[] {
    return this.accessEvents()
      .filter((accessEvent) => accessEvent.credentialId === credentialId)
      .toSorted((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }

  /** @param error - Error to record. */
  private recordError(error: unknown): void {
    this.errors.update((errors) => [...errors, error]);
  }

  /**
   * Tracks a create or update request and records its errors.
   * @param request - Pending infrastructure request.
   * @returns The same request result.
   */
  private trackSaving<T>(request: Promise<T>): Promise<T> {
    this.saving.set(true);
    return request
      .catch((error) => {
        this.recordError(error);
        throw error;
      })
      .finally(() => this.saving.set(false));
  }

  /**
   * Writes a new key card on the front desk encoder, retrying until its card ID is unique in the property.
   * @returns Card ID of the encoded card.
   * @throws Error When the encoder fails.
   */
  async encodeKeyCard(): Promise<string> {
    try {
      let cardId: string;
      do {
        cardId = await this.rfidEncoder.encode((state) =>
          this.encoderState.set(state),
        );
      } while (this.credentials().some((entry) => entry.cardId === cardId));
      this.encoderState.set('encoded');
      return cardId;
    } catch (error) {
      this.encoderState.set('failed');
      throw error;
    }
  }

  /** Returns the encoder to its ready state, such as when a new card is placed. */
  resetEncoder(): void {
    this.encoderState.set('ready');
  }

  /**
   * Persists new credentials and appends them to local state.
   * @param newCredentials - Credentials to persist.
   * @returns Persisted credentials.
   */
  private saveNewCredentials(
    newCredentials: Credential[],
  ): Promise<Credential[]> {
    newCredentials.forEach((credential) => credential.validate());
    return this.trackSaving(
      Promise.all(
        newCredentials.map((credential) =>
          firstValueFrom(this.accessControlApi.createCredential(credential)),
        ),
      ).then((responses) => {
        const saved = responses.map((response) =>
          CredentialAssembler.toEntityFromResource(response.body!),
        );
        this.credentials.update((credentials) => [...credentials, ...saved]);
        return saved;
      }),
    );
  }

  /**
   * Persists changed credentials and replaces them in local state.
   * @param changedCredentials - Credentials to persist.
   * @returns Persisted credentials.
   */
  private saveChangedCredentials(
    changedCredentials: Credential[],
  ): Promise<Credential[]> {
    return this.trackSaving(
      Promise.all(
        changedCredentials.map((credential) =>
          firstValueFrom(this.accessControlApi.updateCredential(credential)),
        ),
      ).then((responses) => {
        const saved = responses.map((response) =>
          CredentialAssembler.toEntityFromResource(response.body!),
        );
        this.credentials.update((credentials) =>
          credentials.map(
            (entry) =>
              saved.find((credential) => credential.id === entry.id) ?? entry,
          ),
        );
        return saved;
      }),
    );
  }

  /**
   * Issues a staff credential on a new key card; a staff member holds at most one usable credential.
   * @param command - Issue command.
   * @returns Issued credential.
   * @throws AccessControlError When a business rule is violated.
   */
  async issueStaffCredential(
    command: IssueStaffCredentialCommand,
  ): Promise<Credential> {
    const { staffMemberId, scope, validUntil } = command;
    const staffMember = this.getStaffMemberById(staffMemberId);
    if (!staffMember) throw new AccessControlError('staff-member-required');
    const issuedAt = this.now();
    if (
      this.credentials().some(
        (credential) =>
          credential.staffMemberId === staffMemberId &&
          credential.isUsableAt(issuedAt),
      )
    )
      throw new AccessControlError('staff-credential-exists');
    const draft = new Credential({
      propertyId: this.currentPropertyId(),
      cardId: '0000',
      type: 'staff-credential',
      holderName: staffMember.name,
      staffMemberId,
      scope,
      validFrom: issuedAt,
      validUntil,
      issuedAt,
      issuedBy: demoOperator,
    });
    draft.validate();
    const cardId = await this.encodeKeyCard();
    const [credential] = await this.saveNewCredentials([
      new Credential({ ...draft, cardId }),
    ]);
    return credential!;
  }

  /**
   * Builds the moment guest key cards stop opening doors: the check-out time on the check-out day.
   * @param checkOutDate - ISO check-out day.
   * @returns ISO date-time.
   */
  guestAccessEnd(checkOutDate: string): string {
    const [year, month, day] = checkOutDate.split('-').map(Number);
    return new Date(year!, month! - 1, day!, checkOutHour).toISOString();
  }

  /**
   * Registers the key cards encoded for a guest during check-in, valid from now until the check-out time.
   * @param command - Issue command.
   * @returns Issued key cards.
   * @throws AccessControlError When a business rule is violated.
   */
  issueGuestKeyCards(
    command: IssueGuestKeyCardsCommand,
  ): Promise<Credential[]> {
    const {
      bookingId,
      bookingCode,
      roomId,
      holderName,
      checkOutDate,
      cardIds,
    } = command;
    if (!cardIds.length) throw new AccessControlError('key-card-required');
    const issuedAt = this.now();
    return this.saveNewCredentials(
      cardIds.map(
        (cardId) =>
          new Credential({
            propertyId: this.currentPropertyId(),
            cardId,
            type: 'guest-key-card',
            holderName,
            bookingId,
            bookingCode,
            roomId,
            validFrom: issuedAt,
            validUntil: this.guestAccessEnd(checkOutDate),
            issuedAt,
            issuedBy: demoOperator,
          }),
      ),
    );
  }

  /**
   * Ends the usable key cards of a booking now, as at the guest's check-out.
   * @param bookingId - Booking identifier.
   * @returns Ended key cards.
   */
  endGuestKeyCards(bookingId: number | null): Promise<Credential[]> {
    const endedAt = this.now();
    const usable = this.getKeyCardsOfBooking(bookingId).filter((credential) =>
      credential.isUsableAt(endedAt),
    );
    if (!usable.length) return Promise.resolve([]);
    return this.saveChangedCredentials(
      usable.map((credential) => credential.endAt(endedAt)),
    );
  }

  /**
   * Revokes an active or scheduled credential immediately.
   * @param command - Revoke command.
   * @returns Revoked credential.
   * @throws AccessControlError When the credential cannot be revoked.
   */
  async revokeCredential(
    command: RevokeCredentialCommand,
  ): Promise<Credential> {
    const { credentialId, reason, note } = command;
    const credential = this.getCredentialById(credentialId);
    if (!credential) throw new AccessControlError('not-found');
    const [revoked] = await this.saveChangedCredentials([
      credential.revoke({ reason, note, at: this.now(), by: demoOperator }),
    ]);
    return revoked!;
  }

  /**
   * Revokes a credential and encodes a new card with the same holder, scope, and access period.
   * @param credentialId - Identifier of the credential to replace.
   * @returns Replacement credential.
   * @throws AccessControlError When the credential cannot be replaced.
   */
  async replaceCredential(credentialId: number): Promise<Credential> {
    const credential = this.getCredentialById(credentialId);
    if (!credential) throw new AccessControlError('not-found');
    const replacedAt = this.now();
    const revoked = credential.revoke({
      reason: 'replaced',
      at: replacedAt,
      by: demoOperator,
    });
    const cardId = await this.encodeKeyCard();
    await this.saveChangedCredentials([revoked]);
    const [replacement] = await this.saveNewCredentials([
      new Credential({
        ...credential,
        id: null,
        cardId,
        validFrom:
          credential.validFrom > replacedAt ? credential.validFrom : replacedAt,
        issuedAt: replacedAt,
        issuedBy: demoOperator,
      }),
    ]);
    return replacement!;
  }
}
