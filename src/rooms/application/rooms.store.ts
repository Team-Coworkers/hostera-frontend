import { HttpResponse } from '@angular/common/http';
import {
  computed,
  inject,
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { DailyRate } from '../domain/model/daily-rate.entity';
import { Property } from '../domain/model/property.entity';
import { RatePlan } from '../domain/model/rate-plan.entity';
import { RoomAssignment } from '../domain/model/room-assignment.entity';
import { RoomType } from '../domain/model/room-type.entity';
import { DayStatus, Room } from '../domain/model/room.entity';
import { RoomsError } from '../domain/model/rooms.error';
import { StatusPeriod } from '../domain/model/status-period.entity';
import { SetDailyRatesCommand } from '../domain/set-daily-rates.command';
import { SetRoomStatusCommand } from '../domain/set-room-status.command';
import { DailyRateAssembler } from '../infrastructure/daily-rate.assembler';
import { PropertyAssembler } from '../infrastructure/property.assembler';
import { RatePlanAssembler } from '../infrastructure/rate-plan.assembler';
import { RoomAssignmentAssembler } from '../infrastructure/room-assignment.assembler';
import { RoomTypeAssembler } from '../infrastructure/room-type.assembler';
import { RoomAssembler } from '../infrastructure/room.assembler';
import { RoomsApiService } from '../infrastructure/rooms-api.service';
import { StatusPeriodAssembler } from '../infrastructure/status-period.assembler';

/** Assembler of a property-scoped collection. */
interface CollectionAssembler<T> {
  toEntitiesFromResponse(response: HttpResponse<unknown>): T[];
}

/** Entity with an identifier. */
interface Identified {
  id: number | null;
}

/**
 * Application service store for the Rooms bounded context, replacing the `rooms` Pinia store.
 * It coordinates room type, room, availability, and rate use cases and keeps UI-facing state
 * in signals. It also owns the selected property, which the other contexts follow.
 */
@Injectable({ providedIn: 'root' })
export class RoomsStore {
  private readonly roomsApi = inject(RoomsApiService);

  /** Property references whose rooms can be managed. */
  readonly properties = signal<Property[]>([]);
  /** Room types of the current property. */
  readonly roomTypes = signal<RoomType[]>([]);
  /** Rooms of the current property. */
  readonly rooms = signal<Room[]>([]);
  /** Status periods of the current property's rooms. */
  readonly statusPeriods = signal<StatusPeriod[]>([]);
  /** Room assignments of the current property's rooms. */
  readonly roomAssignments = signal<RoomAssignment[]>([]);
  /** Rate plans of the current property. */
  readonly ratePlans = signal<RatePlan[]>([]);
  /** Daily rates of the current property's rate plans. */
  readonly dailyRates = signal<DailyRate[]>([]);
  /** Errors encountered during API operations. */
  readonly errors = signal<unknown[]>([]);
  /** Whether properties have been loaded from the API. */
  readonly propertiesLoaded = signal(false);
  /** Whether room types have been loaded from the API. */
  readonly roomTypesLoaded = signal(false);
  /** Whether rooms have been loaded from the API. */
  readonly roomsLoaded = signal(false);
  /** Whether status periods have been loaded from the API. */
  readonly statusPeriodsLoaded = signal(false);
  /** Whether room assignments have been loaded from the API. */
  readonly roomAssignmentsLoaded = signal(false);
  /** Whether rate plans have been loaded from the API. */
  readonly ratePlansLoaded = signal(false);
  /** Whether daily rates have been loaded from the API. */
  readonly dailyRatesLoaded = signal(false);
  /** Whether a create, update, or delete operation is in progress. */
  readonly saving = signal(false);
  /** Identifier of the property whose rooms are being managed. */
  readonly currentPropertyId = signal<number | null>(null);

  /** Property whose rooms are being managed. */
  readonly currentProperty = computed(() =>
    this.properties().find(
      (property) => property.id === this.currentPropertyId(),
    ),
  );
  /** Number of loaded room types. */
  readonly roomTypesCount = computed(() =>
    this.roomTypesLoaded() ? this.roomTypes().length : 0,
  );
  /** Number of loaded rooms. */
  readonly roomsCount = computed(() =>
    this.roomsLoaded() ? this.rooms().length : 0,
  );

  /** Loads properties and selects the current or first available property. */
  fetchProperties(): void {
    this.errors.set([]);
    firstValueFrom(this.roomsApi.getProperties())
      .then((response) => {
        this.properties.set(PropertyAssembler.toEntitiesFromResponse(response));
        this.propertiesLoaded.set(true);
        const propertyId = this.currentPropertyId() ?? this.properties()[0]?.id;
        if (propertyId) this.selectProperty(propertyId);
      })
      .catch((error) => this.recordError(error));
  }

  /**
   * Selects the property whose rooms are managed and loads its rooms, availability, and rates.
   * @param propertyId - Property identifier.
   */
  selectProperty(propertyId: number | null): void {
    this.currentPropertyId.set(propertyId);
    this.errors.set([]);
    this.fetchRoomTypes();
    this.fetchRooms();
    this.fetchStatusPeriods();
    this.fetchRoomAssignments();
    this.fetchRatePlans();
    this.fetchDailyRates();
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
    if (propertyId === null) return Promise.resolve();
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

  /** Loads the current property's room types. */
  fetchRoomTypes(): Promise<void> {
    return this.fetchCollection(
      (propertyId) => this.roomsApi.getRoomTypes(propertyId),
      RoomTypeAssembler,
      this.roomTypes,
      this.roomTypesLoaded,
    );
  }

  /** Loads the current property's rooms. */
  fetchRooms(): Promise<void> {
    return this.fetchCollection(
      (propertyId) => this.roomsApi.getRooms(propertyId),
      RoomAssembler,
      this.rooms,
      this.roomsLoaded,
    );
  }

  /** Loads the status periods of the current property's rooms. */
  fetchStatusPeriods(): Promise<void> {
    return this.fetchCollection(
      (propertyId) => this.roomsApi.getStatusPeriods(propertyId),
      StatusPeriodAssembler,
      this.statusPeriods,
      this.statusPeriodsLoaded,
    );
  }

  /** Loads the room assignments of the current property's rooms. */
  fetchRoomAssignments(): Promise<void> {
    return this.fetchCollection(
      (propertyId) => this.roomsApi.getRoomAssignments(propertyId),
      RoomAssignmentAssembler,
      this.roomAssignments,
      this.roomAssignmentsLoaded,
    );
  }

  /** Loads the current property's rate plans. */
  fetchRatePlans(): Promise<void> {
    return this.fetchCollection(
      (propertyId) => this.roomsApi.getRatePlans(propertyId),
      RatePlanAssembler,
      this.ratePlans,
      this.ratePlansLoaded,
    );
  }

  /** Loads the daily rates of the current property's rate plans. */
  fetchDailyRates(): Promise<void> {
    return this.fetchCollection(
      (propertyId) => this.roomsApi.getDailyRates(propertyId),
      DailyRateAssembler,
      this.dailyRates,
      this.dailyRatesLoaded,
    );
  }

  /**
   * Finds a room type entity by identifier.
   * @param id - Room type identifier.
   */
  getRoomTypeById(id: number | string | null): RoomType | undefined {
    const idNum = Number(id);
    return this.roomTypes().find((roomType) => roomType.id === idNum);
  }

  /**
   * Finds a room entity by identifier.
   * @param id - Room identifier.
   */
  getRoomById(id: number | string | null): Room | undefined {
    const idNum = Number(id);
    return this.rooms().find((room) => room.id === idNum);
  }

  /**
   * Finds the room assignment that controls a room on a day.
   * @param roomId - Room identifier.
   * @param date - ISO calendar day.
   */
  getRoomAssignmentOn(
    roomId: number | null,
    date: string,
  ): RoomAssignment | undefined {
    return this.roomAssignments().find(
      (roomAssignment) =>
        roomAssignment.roomId === roomId && roomAssignment.covers(date),
    );
  }

  /**
   * Finds the status period that covers a room on a day.
   * @param roomId - Room identifier.
   * @param date - ISO calendar day.
   */
  getStatusPeriodOn(
    roomId: number | null,
    date: string,
  ): StatusPeriod | undefined {
    return this.statusPeriods().find(
      (statusPeriod) =>
        statusPeriod.roomId === roomId && statusPeriod.covers(date),
    );
  }

  /**
   * Derives a room's day status from its room assignments and status periods.
   * @param roomId - Room identifier.
   * @param date - ISO calendar day.
   * @returns Day status, or Available when the room is unknown.
   */
  getDayStatus(roomId: number | null, date: string): DayStatus {
    return (
      this.getRoomById(roomId)?.dayStatusOn(
        date,
        this.roomAssignments(),
        this.statusPeriods(),
      ) ?? 'available'
    );
  }

  /**
   * Whether a room can be booked over a range of nights, ignoring its bookings.
   * Blocked and Out of service periods prevent booking; Needs cleaning does not.
   * @param roomId - Room identifier.
   * @param startDate - First ISO night.
   * @param endDate - Last ISO night.
   */
  isRoomBookable(
    roomId: number | null,
    startDate: string,
    endDate: string,
  ): boolean {
    return !this.statusPeriods().some(
      (statusPeriod) =>
        statusPeriod.roomId === roomId &&
        statusPeriod.preventsBooking &&
        statusPeriod.overlaps(startDate, endDate),
    );
  }

  /**
   * Lists the rooms classified by a room type.
   * @param roomTypeId - Room type identifier.
   */
  getRoomsByRoomType(roomTypeId: number | null): Room[] {
    return this.rooms().filter((room) => room.roomTypeId === roomTypeId);
  }

  /**
   * Finds a rate plan entity by identifier.
   * @param id - Rate plan identifier.
   */
  getRatePlanById(id: number | string | null): RatePlan | undefined {
    const idNum = Number(id);
    return this.ratePlans().find((ratePlan) => ratePlan.id === idNum);
  }

  /**
   * Finds the daily rate that prices a room type's night under a rate plan.
   * @param roomTypeId - Room type identifier.
   * @param ratePlanId - Rate plan identifier.
   * @param date - ISO calendar day.
   */
  getDailyRate(
    roomTypeId: number | null,
    ratePlanId: number | null,
    date: string,
  ): DailyRate | undefined {
    return this.dailyRates().find((dailyRate) =>
      dailyRate.prices(roomTypeId, ratePlanId, date),
    );
  }

  /**
   * Derives a room type's nightly rate under a rate plan from its daily rates.
   * @param roomTypeId - Room type identifier.
   * @param ratePlanId - Rate plan identifier.
   * @param date - ISO calendar day.
   * @returns Nightly rate, or undefined when the room type is unknown.
   */
  getNightlyRate(
    roomTypeId: number | null,
    ratePlanId: number | null,
    date: string,
  ): number | undefined {
    return this.getRoomTypeById(roomTypeId)?.nightlyRateOn(
      date,
      ratePlanId,
      this.dailyRates(),
    );
  }

  /**
   * Rejects a room type whose name is already used in the property.
   * @param roomType - Room type to check.
   */
  private ensureUniqueRoomTypeName(roomType: RoomType): void {
    const name = roomType.name.toLowerCase();
    if (
      this.roomTypes().some(
        (entry) =>
          entry.id !== roomType.id && entry.name.toLowerCase() === name,
      )
    )
      throw new RoomsError('duplicate-room-type-name');
  }

  /**
   * Rejects a room whose number is already used in the property.
   * @param room - Room to check.
   */
  private ensureUniqueRoomNumber(room: Room): void {
    const number = room.number.toLowerCase();
    if (
      this.rooms().some(
        (entry) =>
          entry.id !== room.id && entry.number.toLowerCase() === number,
      )
    )
      throw new RoomsError('duplicate-room-number');
  }

  /**
   * Rejects a rate plan whose name is already used in the property.
   * @param ratePlan - Rate plan to check.
   */
  private ensureUniqueRatePlanName(ratePlan: RatePlan): void {
    const name = ratePlan.name.toLowerCase();
    if (
      this.ratePlans().some(
        (entry) =>
          entry.id !== ratePlan.id && entry.name.toLowerCase() === name,
      )
    )
      throw new RoomsError('duplicate-rate-plan-name');
  }

  /**
   * Rejects a rate plan that refers to room types outside the property.
   * @param ratePlan - Rate plan to check.
   */
  private ensureKnownRoomTypes(ratePlan: RatePlan): void {
    if (
      !ratePlan.roomTypeIds.every((roomTypeId) =>
        this.getRoomTypeById(roomTypeId),
      )
    )
      throw new RoomsError('room-type-required');
  }

  /** @param error - Error to record. */
  private recordError(error: unknown): void {
    this.errors.update((errors) => [...errors, error]);
  }

  /**
   * Tracks a create, update, or delete request and records its errors.
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
   * Replaces an entity in a collection with its persisted version.
   * @param collection - Collection state.
   * @param entity - Persisted entity.
   * @returns The persisted entity.
   */
  private replaceEntity<T extends Identified>(
    collection: WritableSignal<T[]>,
    entity: T,
  ): T {
    collection.update((entries) =>
      entries.map((entry) => (entry.id === entity.id ? entity : entry)),
    );
    return entity;
  }

  /**
   * Creates a room type and appends it to local state.
   * @param roomType - Room type entity to persist.
   * @throws RoomsError When a business rule is violated.
   */
  addRoomType(roomType: RoomType): Promise<RoomType> {
    roomType.validate();
    this.ensureUniqueRoomTypeName(roomType);
    return this.trackSaving(
      firstValueFrom(this.roomsApi.createRoomType(roomType)).then(
        (response) => {
          const newRoomType = RoomTypeAssembler.toEntityFromResource(
            response.body!,
          );
          this.roomTypes.update((entries) => [...entries, newRoomType]);
          return newRoomType;
        },
      ),
    );
  }

  /**
   * Updates an existing room type, including its activation, and synchronizes local state.
   * @param roomType - Room type entity with updated data.
   * @throws RoomsError When a business rule is violated.
   */
  updateRoomType(roomType: RoomType): Promise<RoomType> {
    if (!this.getRoomTypeById(roomType.id)) throw new RoomsError('not-found');
    roomType.validate();
    this.ensureUniqueRoomTypeName(roomType);
    return this.trackSaving(
      firstValueFrom(this.roomsApi.updateRoomType(roomType)).then((response) =>
        this.replaceEntity(
          this.roomTypes,
          RoomTypeAssembler.toEntityFromResource(response.body!),
        ),
      ),
    );
  }

  /**
   * Deletes a room type that no room uses and removes it from local state.
   * @param roomType - Room type entity to remove.
   * @throws RoomsError When the room type is in use.
   */
  deleteRoomType(roomType: RoomType): Promise<void> {
    if (!this.getRoomTypeById(roomType.id)) throw new RoomsError('not-found');
    if (this.getRoomsByRoomType(roomType.id).length)
      throw new RoomsError('room-type-in-use');
    return this.trackSaving(
      firstValueFrom(this.roomsApi.deleteRoomType(roomType.id!)).then(() =>
        this.roomTypes.update((entries) =>
          entries.filter((entry) => entry.id !== roomType.id),
        ),
      ),
    );
  }

  /**
   * Rejects a room type that is missing or cannot be newly assigned to a room.
   * @param room - Room whose room type is checked.
   * @param currentRoom - Persisted room, when updating.
   */
  private ensureAssignableRoomType(
    room: Room,
    currentRoom: Room | null = null,
  ): void {
    const roomType = this.getRoomTypeById(room.roomTypeId);
    if (!roomType) throw new RoomsError('room-type-required');
    if (!roomType.isActive && currentRoom?.roomTypeId !== roomType.id)
      throw new RoomsError('inactive-room-type');
  }

  /**
   * Creates a room and appends it to local state.
   * @param room - Room entity to persist.
   * @throws RoomsError When a business rule is violated.
   */
  addRoom(room: Room): Promise<Room> {
    room.validate();
    this.ensureAssignableRoomType(room);
    this.ensureUniqueRoomNumber(room);
    return this.trackSaving(
      firstValueFrom(this.roomsApi.createRoom(room)).then((response) => {
        const newRoom = RoomAssembler.toEntityFromResource(response.body!);
        this.rooms.update((entries) => [...entries, newRoom]);
        return newRoom;
      }),
    );
  }

  /**
   * Updates an existing room and synchronizes local state.
   * @param room - Room entity with updated data.
   * @throws RoomsError When a business rule is violated.
   */
  updateRoom(room: Room): Promise<Room> {
    const currentRoom = this.getRoomById(room.id);
    if (!currentRoom) throw new RoomsError('not-found');
    room.validate();
    this.ensureAssignableRoomType(room, currentRoom);
    this.ensureUniqueRoomNumber(room);
    return this.trackSaving(
      firstValueFrom(this.roomsApi.updateRoom(room)).then((response) =>
        this.replaceEntity(
          this.rooms,
          RoomAssembler.toEntityFromResource(response.body!),
        ),
      ),
    );
  }

  /**
   * Creates a rate plan and appends it to local state.
   * @param ratePlan - Rate plan entity to persist.
   * @throws RoomsError When a business rule is violated.
   */
  addRatePlan(ratePlan: RatePlan): Promise<RatePlan> {
    ratePlan.validate();
    this.ensureKnownRoomTypes(ratePlan);
    this.ensureUniqueRatePlanName(ratePlan);
    return this.trackSaving(
      firstValueFrom(this.roomsApi.createRatePlan(ratePlan)).then(
        (response) => {
          const newRatePlan = RatePlanAssembler.toEntityFromResource(
            response.body!,
          );
          this.ratePlans.update((entries) => [...entries, newRatePlan]);
          return newRatePlan;
        },
      ),
    );
  }

  /**
   * Updates an existing rate plan, including its activation, and synchronizes local state.
   * @param ratePlan - Rate plan entity with updated data.
   * @throws RoomsError When a business rule is violated.
   */
  updateRatePlan(ratePlan: RatePlan): Promise<RatePlan> {
    if (!this.getRatePlanById(ratePlan.id)) throw new RoomsError('not-found');
    ratePlan.validate();
    this.ensureKnownRoomTypes(ratePlan);
    this.ensureUniqueRatePlanName(ratePlan);
    return this.trackSaving(
      firstValueFrom(this.roomsApi.updateRatePlan(ratePlan)).then((response) =>
        this.replaceEntity(
          this.ratePlans,
          RatePlanAssembler.toEntityFromResource(response.body!),
        ),
      ),
    );
  }

  /**
   * Sets the nightly rate of a room type under a rate plan over a date range, or returns those nights to the base nightly rate.
   * Each night keeps at most one daily rate per room type and rate plan.
   * @param command - Set-daily-rates command.
   * @throws RoomsError When a business rule is violated.
   */
  setDailyRates(command: SetDailyRatesCommand): Promise<void> {
    const { ratePlanId, roomTypeId, startDate, endDate, useBaseRate, amount } =
      command;
    const ratePlan = this.getRatePlanById(ratePlanId);
    if (!ratePlan || !this.getRoomTypeById(roomTypeId))
      throw new RoomsError('not-found');
    if (!ratePlan.appliesTo(roomTypeId))
      throw new RoomsError('room-type-not-in-plan');
    const nights = DailyRate.nightsBetween(startDate, endDate);

    const created: DailyRate[] = [];
    const updated: DailyRate[] = [];
    const deleted: DailyRate[] = [];
    for (const date of nights) {
      const dailyRate = this.getDailyRate(roomTypeId, ratePlanId, date);
      if (useBaseRate) {
        if (dailyRate) deleted.push(dailyRate);
        continue;
      }
      const newDailyRate = new DailyRate({
        id: dailyRate?.id ?? null,
        propertyId: this.currentPropertyId(),
        ratePlanId,
        roomTypeId,
        date,
        amount: amount ?? 0,
      });
      newDailyRate.validate();
      if (dailyRate) updated.push(newDailyRate);
      else created.push(newDailyRate);
    }
    const request = Promise.all([
      ...deleted.map((dailyRate) =>
        firstValueFrom(this.roomsApi.deleteDailyRate(dailyRate.id!)),
      ),
      ...updated.map((dailyRate) =>
        firstValueFrom(this.roomsApi.updateDailyRate(dailyRate)),
      ),
      ...created.map((dailyRate) =>
        firstValueFrom(this.roomsApi.createDailyRate(dailyRate)),
      ),
    ])
      .then((responses) => {
        const deletedIds = deleted.map((dailyRate) => dailyRate.id);
        this.dailyRates.update((dailyRates) => [
          ...dailyRates
            .filter((dailyRate) => !deletedIds.includes(dailyRate.id))
            .map(
              (dailyRate) =>
                updated.find((entry) => entry.id === dailyRate.id) ?? dailyRate,
            ),
          ...responses
            .slice(deleted.length + updated.length)
            .map((response) =>
              DailyRateAssembler.toEntityFromResource(
                (response as HttpResponse<object>).body!,
              ),
            ),
        ]);
      })
      .catch((error) => {
        // Partial writes may have succeeded; reload the persisted daily rates.
        this.fetchDailyRates();
        throw error;
      });
    return this.trackSaving(request);
  }

  /**
   * Sets or releases a room's operational status over a date range.
   * Existing periods inside the range are removed, trimmed, or split so that periods never overlap.
   * @param command - Set-room-status command.
   * @throws RoomsError When a business rule is violated.
   */
  setRoomStatus(command: SetRoomStatusCommand): Promise<void> {
    const { roomId, status, startDate, endDate, reason } = command;
    if (!this.getRoomById(roomId)) throw new RoomsError('not-found');
    if (!SetRoomStatusCommand.statuses.includes(status))
      throw new RoomsError('invalid-status');
    const newStatusPeriod =
      status === 'available'
        ? null
        : new StatusPeriod({
            propertyId: this.currentPropertyId(),
            roomId,
            status,
            startDate,
            endDate,
            reason,
          });
    if (newStatusPeriod) newStatusPeriod.validate();
    else StatusPeriod.validateDateRange(startDate, endDate);
    if (
      newStatusPeriod &&
      this.roomAssignments().some(
        (roomAssignment) =>
          roomAssignment.roomId === roomId &&
          roomAssignment.overlaps(startDate, endDate),
      )
    )
      throw new RoomsError('booking-controlled');

    const created: StatusPeriod[] = [];
    const updated: StatusPeriod[] = [];
    const deleted: StatusPeriod[] = [];
    for (const statusPeriod of this.statusPeriods()) {
      if (
        statusPeriod.roomId !== roomId ||
        !statusPeriod.overlaps(startDate, endDate)
      )
        continue;
      const remaining = statusPeriod.withoutDays(startDate, endDate);
      const kept = remaining.find((entry) => entry.id === statusPeriod.id);
      if (kept) updated.push(kept);
      else deleted.push(statusPeriod);
      created.push(...remaining.filter((entry) => entry.id === null));
    }
    if (newStatusPeriod) created.push(newStatusPeriod);
    const request = Promise.all([
      ...deleted.map((statusPeriod) =>
        firstValueFrom(this.roomsApi.deleteStatusPeriod(statusPeriod.id!)),
      ),
      ...updated.map((statusPeriod) =>
        firstValueFrom(this.roomsApi.updateStatusPeriod(statusPeriod)),
      ),
    ])
      .then(() =>
        Promise.all(
          created.map((statusPeriod) =>
            firstValueFrom(this.roomsApi.createStatusPeriod(statusPeriod)),
          ),
        ),
      )
      .then((responses) => {
        const deletedIds = deleted.map((statusPeriod) => statusPeriod.id);
        this.statusPeriods.update((statusPeriods) => [
          ...statusPeriods
            .filter((statusPeriod) => !deletedIds.includes(statusPeriod.id))
            .map(
              (statusPeriod) =>
                updated.find((entry) => entry.id === statusPeriod.id) ??
                statusPeriod,
            ),
          ...responses.map((response) =>
            StatusPeriodAssembler.toEntityFromResource(response.body!),
          ),
        ]);
      })
      .catch((error) => {
        // Partial writes may have succeeded; reload the persisted periods.
        this.fetchStatusPeriods();
        throw error;
      });
    return this.trackSaving(request);
  }
}
