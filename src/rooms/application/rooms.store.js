/**
 * Application service store for the Rooms bounded context.
 * It coordinates room type, room, availability, and rate use cases and keeps UI-facing state.
 *
 * @module useRoomsStore
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { RoomsApi } from '../infrastructure/rooms-api.js';
import { PropertyAssembler } from '../infrastructure/property.assembler.js';
import { RoomTypeAssembler } from '../infrastructure/room-type.assembler.js';
import { RoomAssembler } from '../infrastructure/room.assembler.js';
import { StatusPeriodAssembler } from '../infrastructure/status-period.assembler.js';
import { RoomAssignmentAssembler } from '../infrastructure/room-assignment.assembler.js';
import { RatePlanAssembler } from '../infrastructure/rate-plan.assembler.js';
import { DailyRateAssembler } from '../infrastructure/daily-rate.assembler.js';
import { RoomsError } from '../domain/model/rooms.error.js';
import { StatusPeriod } from '../domain/model/status-period.entity.js';
import { DailyRate } from '../domain/model/daily-rate.entity.js';
import { SetRoomStatusCommand } from '../domain/set-room-status.command.js';

const roomsApi = new RoomsApi();

/**
 * Reactive store that exposes Rooms commands and queries.
 *
 * @returns {Object} Store state and actions.
 */
const useRoomsStore = defineStore('rooms', () => {
  /**
   * List of property references whose rooms can be managed.
   * @type {import('vue').Ref<Property[]>}
   */
  const properties = ref([]);
  /**
   * List of room type entities of the current property.
   * @type {import('vue').Ref<RoomType[]>}
   */
  const roomTypes = ref([]);
  /**
   * List of room entities of the current property.
   * @type {import('vue').Ref<Room[]>}
   */
  const rooms = ref([]);
  /**
   * List of status period entities of the current property's rooms.
   * @type {import('vue').Ref<StatusPeriod[]>}
   */
  const statusPeriods = ref([]);
  /**
   * List of room assignment entities of the current property's rooms.
   * @type {import('vue').Ref<RoomAssignment[]>}
   */
  const roomAssignments = ref([]);
  /**
   * List of rate plan entities of the current property.
   * @type {import('vue').Ref<RatePlan[]>}
   */
  const ratePlans = ref([]);
  /**
   * List of daily rate entities of the current property's rate plans.
   * @type {import('vue').Ref<DailyRate[]>}
   */
  const dailyRates = ref([]);
  /**
   * List of errors encountered during API operations.
   * @type {import('vue').Ref<Error[]>}
   */
  const errors = ref([]);
  /**
   * Whether properties have been loaded from the API.
   * @type {import('vue').Ref<boolean>}
   */
  const propertiesLoaded = ref(false);
  /**
   * Whether room types have been loaded from the API.
   * @type {import('vue').Ref<boolean>}
   */
  const roomTypesLoaded = ref(false);
  /**
   * Whether rooms have been loaded from the API.
   * @type {import('vue').Ref<boolean>}
   */
  const roomsLoaded = ref(false);
  /**
   * Whether status periods have been loaded from the API.
   * @type {import('vue').Ref<boolean>}
   */
  const statusPeriodsLoaded = ref(false);
  /**
   * Whether room assignments have been loaded from the API.
   * @type {import('vue').Ref<boolean>}
   */
  const roomAssignmentsLoaded = ref(false);
  /**
   * Whether rate plans have been loaded from the API.
   * @type {import('vue').Ref<boolean>}
   */
  const ratePlansLoaded = ref(false);
  /**
   * Whether daily rates have been loaded from the API.
   * @type {import('vue').Ref<boolean>}
   */
  const dailyRatesLoaded = ref(false);
  /**
   * Whether a create, update, or delete operation is in progress.
   * @type {import('vue').Ref<boolean>}
   */
  const saving = ref(false);
  /**
   * Identifier of the property whose rooms are being managed.
   * @type {import('vue').Ref<?number>}
   */
  const currentPropertyId = ref(null);
  /**
   * Property whose rooms are being managed.
   * @type {import('vue').ComputedRef<Property|undefined>}
   */
  const currentProperty = computed(() =>
    properties.value.find(
      (property) => property['id'] === currentPropertyId.value,
    ),
  );
  /**
   * Number of loaded room types.
   * @type {import('vue').ComputedRef<number>}
   */
  const roomTypesCount = computed(() => {
    return roomTypesLoaded.value ? roomTypes.value.length : 0;
  });
  /**
   * Number of loaded rooms.
   * @type {import('vue').ComputedRef<number>}
   */
  const roomsCount = computed(() => {
    return roomsLoaded.value ? rooms.value.length : 0;
  });

  /**
   * Loads properties and selects the current or first available property.
   * @returns {void}
   */
  function fetchProperties() {
    errors.value = [];
    roomsApi
      .getProperties()
      .then((response) => {
        properties.value = PropertyAssembler.toEntitiesFromResponse(response);
        propertiesLoaded.value = true;
        const propertyId = currentPropertyId.value ?? properties.value[0]?.id;
        if (propertyId) selectProperty(propertyId);
      })
      .catch((error) => {
        errors.value.push(error);
      });
  }

  /**
   * Selects the property whose rooms are managed and loads its rooms, availability, and rates.
   * @param {number} propertyId - Property identifier.
   * @returns {void}
   */
  function selectProperty(propertyId) {
    currentPropertyId.value = propertyId;
    errors.value = [];
    fetchRoomTypes();
    fetchRooms();
    fetchStatusPeriods();
    fetchRoomAssignments();
    fetchRatePlans();
    fetchDailyRates();
  }

  /**
   * Loads one property-scoped collection and ignores responses for a previously selected property.
   * @param {(propertyId: ?number) => Promise<import('axios').AxiosResponse>} request - Infrastructure request.
   * @param {{toEntitiesFromResponse: Function}} assembler - Assembler for the collection.
   * @param {import('vue').Ref<Array>} collection - Collection state.
   * @param {import('vue').Ref<boolean>} loaded - Loaded flag of the collection.
   * @returns {Promise<void>}
   */
  function fetchCollection(request, assembler, collection, loaded) {
    const propertyId = currentPropertyId.value;
    collection.value = [];
    loaded.value = false;
    return request(propertyId)
      .then((response) => {
        if (propertyId !== currentPropertyId.value) return;
        collection.value = assembler.toEntitiesFromResponse(response);
        loaded.value = true;
      })
      .catch((error) => {
        if (propertyId === currentPropertyId.value) errors.value.push(error);
      });
  }

  /**
   * Loads the current property's room types and updates the application state.
   * @returns {Promise<void>}
   */
  function fetchRoomTypes() {
    return fetchCollection(
      (propertyId) => roomsApi.getRoomTypes(propertyId),
      RoomTypeAssembler,
      roomTypes,
      roomTypesLoaded,
    );
  }

  /**
   * Loads the current property's rooms and updates the application state.
   * @returns {Promise<void>}
   */
  function fetchRooms() {
    return fetchCollection(
      (propertyId) => roomsApi.getRooms(propertyId),
      RoomAssembler,
      rooms,
      roomsLoaded,
    );
  }

  /**
   * Loads the status periods of the current property's rooms and updates the application state.
   * @returns {Promise<void>}
   */
  function fetchStatusPeriods() {
    return fetchCollection(
      (propertyId) => roomsApi.getStatusPeriods(propertyId),
      StatusPeriodAssembler,
      statusPeriods,
      statusPeriodsLoaded,
    );
  }

  /**
   * Loads the room assignments of the current property's rooms and updates the application state.
   * @returns {Promise<void>}
   */
  function fetchRoomAssignments() {
    return fetchCollection(
      (propertyId) => roomsApi.getRoomAssignments(propertyId),
      RoomAssignmentAssembler,
      roomAssignments,
      roomAssignmentsLoaded,
    );
  }

  /**
   * Loads the current property's rate plans and updates the application state.
   * @returns {Promise<void>}
   */
  function fetchRatePlans() {
    return fetchCollection(
      (propertyId) => roomsApi.getRatePlans(propertyId),
      RatePlanAssembler,
      ratePlans,
      ratePlansLoaded,
    );
  }

  /**
   * Loads the daily rates of the current property's rate plans and updates the application state.
   * @returns {Promise<void>}
   */
  function fetchDailyRates() {
    return fetchCollection(
      (propertyId) => roomsApi.getDailyRates(propertyId),
      DailyRateAssembler,
      dailyRates,
      dailyRatesLoaded,
    );
  }

  /**
   * Finds a room type entity by identifier.
   * @param {number|string} id - Room type identifier.
   * @returns {RoomType|undefined} Matching room type, if available.
   */
  function getRoomTypeById(id) {
    let idNum = parseInt(id);
    return roomTypes.value.find((roomType) => roomType['id'] === idNum);
  }

  /**
   * Finds a room entity by identifier.
   * @param {number|string} id - Room identifier.
   * @returns {Room|undefined} Matching room, if available.
   */
  function getRoomById(id) {
    let idNum = parseInt(id);
    return rooms.value.find((room) => room['id'] === idNum);
  }

  /**
   * Finds the room assignment that controls a room on a day.
   * @param {number} roomId - Room identifier.
   * @param {string} date - ISO calendar day.
   * @returns {RoomAssignment|undefined} Matching room assignment, if any.
   */
  function getRoomAssignmentOn(roomId, date) {
    return roomAssignments.value.find(
      (roomAssignment) =>
        roomAssignment.roomId === roomId && roomAssignment.covers(date),
    );
  }

  /**
   * Finds the status period that covers a room on a day.
   * @param {number} roomId - Room identifier.
   * @param {string} date - ISO calendar day.
   * @returns {StatusPeriod|undefined} Matching status period, if any.
   */
  function getStatusPeriodOn(roomId, date) {
    return statusPeriods.value.find(
      (statusPeriod) =>
        statusPeriod.roomId === roomId && statusPeriod.covers(date),
    );
  }

  /**
   * Derives a room's day status from its room assignments and status periods.
   * @param {number} roomId - Room identifier.
   * @param {string} date - ISO calendar day.
   * @returns {string} Day status, or Available when the room is unknown.
   */
  function getDayStatus(roomId, date) {
    return (
      getRoomById(roomId)?.dayStatusOn(
        date,
        roomAssignments.value,
        statusPeriods.value,
      ) ?? 'available'
    );
  }

  /**
   * Whether a room can be booked over a range of nights, ignoring its bookings.
   * Blocked and Out of service periods prevent booking; Needs cleaning does not.
   * @param {number} roomId - Room identifier.
   * @param {string} startDate - First ISO night.
   * @param {string} endDate - Last ISO night.
   * @returns {boolean}
   */
  function isRoomBookable(roomId, startDate, endDate) {
    return !statusPeriods.value.some(
      (statusPeriod) =>
        statusPeriod.roomId === roomId &&
        statusPeriod.preventsBooking &&
        statusPeriod.overlaps(startDate, endDate),
    );
  }

  /**
   * Lists the rooms classified by a room type.
   * @param {number} roomTypeId - Room type identifier.
   * @returns {Room[]} Rooms of the room type.
   */
  function getRoomsByRoomType(roomTypeId) {
    return rooms.value.filter((room) => room.roomTypeId === roomTypeId);
  }

  /**
   * Finds a rate plan entity by identifier.
   * @param {number|string} id - Rate plan identifier.
   * @returns {RatePlan|undefined} Matching rate plan, if available.
   */
  function getRatePlanById(id) {
    let idNum = parseInt(id);
    return ratePlans.value.find((ratePlan) => ratePlan['id'] === idNum);
  }

  /**
   * Finds the daily rate that prices a room type's night under a rate plan.
   * @param {number} roomTypeId - Room type identifier.
   * @param {number} ratePlanId - Rate plan identifier.
   * @param {string} date - ISO calendar day.
   * @returns {DailyRate|undefined} Matching daily rate, if any.
   */
  function getDailyRate(roomTypeId, ratePlanId, date) {
    return dailyRates.value.find((dailyRate) =>
      dailyRate.prices(roomTypeId, ratePlanId, date),
    );
  }

  /**
   * Derives a room type's nightly rate under a rate plan from its daily rates.
   * @param {number} roomTypeId - Room type identifier.
   * @param {number} ratePlanId - Rate plan identifier.
   * @param {string} date - ISO calendar day.
   * @returns {number|undefined} Nightly rate, or undefined when the room type is unknown.
   */
  function getNightlyRate(roomTypeId, ratePlanId, date) {
    return getRoomTypeById(roomTypeId)?.nightlyRateOn(
      date,
      ratePlanId,
      dailyRates.value,
    );
  }

  /**
   * Rejects a room type whose name is already used in the property.
   * @param {RoomType} roomType - Room type to check.
   * @throws {RoomsError} When the name is duplicated.
   */
  function ensureUniqueRoomTypeName(roomType) {
    const name = roomType.name.toLowerCase();
    if (
      roomTypes.value.some(
        (entry) =>
          entry['id'] !== roomType.id && entry.name.toLowerCase() === name,
      )
    )
      throw new RoomsError('duplicate-room-type-name');
  }

  /**
   * Rejects a room whose number is already used in the property.
   * @param {Room} room - Room to check.
   * @throws {RoomsError} When the room number is duplicated.
   */
  function ensureUniqueRoomNumber(room) {
    const number = room.number.toLowerCase();
    if (
      rooms.value.some(
        (entry) =>
          entry['id'] !== room.id && entry.number.toLowerCase() === number,
      )
    )
      throw new RoomsError('duplicate-room-number');
  }

  /**
   * Rejects a rate plan whose name is already used in the property.
   * @param {RatePlan} ratePlan - Rate plan to check.
   * @throws {RoomsError} When the name is duplicated.
   */
  function ensureUniqueRatePlanName(ratePlan) {
    const name = ratePlan.name.toLowerCase();
    if (
      ratePlans.value.some(
        (entry) =>
          entry['id'] !== ratePlan.id && entry.name.toLowerCase() === name,
      )
    )
      throw new RoomsError('duplicate-rate-plan-name');
  }

  /**
   * Rejects a rate plan that refers to room types outside the property.
   * @param {RatePlan} ratePlan - Rate plan to check.
   * @throws {RoomsError} When a room type is unknown.
   */
  function ensureKnownRoomTypes(ratePlan) {
    if (
      !ratePlan.roomTypeIds.every((roomTypeId) => getRoomTypeById(roomTypeId))
    )
      throw new RoomsError('room-type-required');
  }

  /**
   * Tracks a create, update, or delete request and records its errors.
   * @template T
   * @param {Promise<T>} request - Pending infrastructure request.
   * @returns {Promise<T>} The same request result.
   */
  function trackSaving(request) {
    saving.value = true;
    return request
      .catch((error) => {
        errors.value.push(error);
        throw error;
      })
      .finally(() => {
        saving.value = false;
      });
  }

  /**
   * Replaces an entity in a collection with its persisted version.
   * @param {import('vue').Ref<Array>} collection - Collection state.
   * @param {Object} entity - Persisted entity.
   * @returns {Object} The persisted entity.
   */
  function replaceEntity(collection, entity) {
    const index = collection.value.findIndex(
      (entry) => entry['id'] === entity.id,
    );
    if (index !== -1) collection.value[index] = entity;
    return entity;
  }

  /**
   * Creates a room type through infrastructure and appends it to local state.
   * @param {RoomType} roomType - Room type entity to persist.
   * @returns {Promise<RoomType>} Created room type.
   * @throws {RoomsError} When a business rule is violated.
   */
  function addRoomType(roomType) {
    roomType.validate();
    ensureUniqueRoomTypeName(roomType);
    return trackSaving(
      roomsApi.createRoomType(roomType).then((response) => {
        const newRoomType = RoomTypeAssembler.toEntityFromResource(
          response.data,
        );
        roomTypes.value.push(newRoomType);
        return newRoomType;
      }),
    );
  }

  /**
   * Updates an existing room type, including its activation, and synchronizes local state.
   * @param {RoomType} roomType - Room type entity with updated data.
   * @returns {Promise<RoomType>} Updated room type.
   * @throws {RoomsError} When a business rule is violated.
   */
  function updateRoomType(roomType) {
    if (!getRoomTypeById(roomType.id)) throw new RoomsError('not-found');
    roomType.validate();
    ensureUniqueRoomTypeName(roomType);
    return trackSaving(
      roomsApi
        .updateRoomType(roomType)
        .then((response) =>
          replaceEntity(
            roomTypes,
            RoomTypeAssembler.toEntityFromResource(response.data),
          ),
        ),
    );
  }

  /**
   * Deletes a room type that no room uses and removes it from local state.
   * @param {RoomType} roomType - Room type entity to remove.
   * @returns {Promise<void>}
   * @throws {RoomsError} When the room type is in use.
   */
  function deleteRoomType(roomType) {
    if (!getRoomTypeById(roomType.id)) throw new RoomsError('not-found');
    if (getRoomsByRoomType(roomType.id).length)
      throw new RoomsError('room-type-in-use');
    return trackSaving(
      roomsApi.deleteRoomType(roomType.id).then(() => {
        const index = roomTypes.value.findIndex(
          (entry) => entry['id'] === roomType.id,
        );
        if (index !== -1) roomTypes.value.splice(index, 1);
      }),
    );
  }

  /**
   * Rejects a room type that is missing or cannot be newly assigned to a room.
   * @param {Room} room - Room whose room type is checked.
   * @param {?Room} [currentRoom=null] - Persisted room, when updating.
   * @throws {RoomsError} When the room type is not available.
   */
  function ensureAssignableRoomType(room, currentRoom = null) {
    const roomType = getRoomTypeById(room.roomTypeId);
    if (!roomType) throw new RoomsError('room-type-required');
    if (!roomType.isActive && currentRoom?.roomTypeId !== roomType.id)
      throw new RoomsError('inactive-room-type');
  }

  /**
   * Creates a room through infrastructure and appends it to local state.
   * @param {Room} room - Room entity to persist.
   * @returns {Promise<Room>} Created room.
   * @throws {RoomsError} When a business rule is violated.
   */
  function addRoom(room) {
    room.validate();
    ensureAssignableRoomType(room);
    ensureUniqueRoomNumber(room);
    return trackSaving(
      roomsApi.createRoom(room).then((response) => {
        const newRoom = RoomAssembler.toEntityFromResource(response.data);
        rooms.value.push(newRoom);
        return newRoom;
      }),
    );
  }

  /**
   * Updates an existing room and synchronizes local state.
   * @param {Room} room - Room entity with updated data.
   * @returns {Promise<Room>} Updated room.
   * @throws {RoomsError} When a business rule is violated.
   */
  function updateRoom(room) {
    const currentRoom = getRoomById(room.id);
    if (!currentRoom) throw new RoomsError('not-found');
    room.validate();
    ensureAssignableRoomType(room, currentRoom);
    ensureUniqueRoomNumber(room);
    return trackSaving(
      roomsApi
        .updateRoom(room)
        .then((response) =>
          replaceEntity(
            rooms,
            RoomAssembler.toEntityFromResource(response.data),
          ),
        ),
    );
  }

  /**
   * Creates a rate plan through infrastructure and appends it to local state.
   * @param {RatePlan} ratePlan - Rate plan entity to persist.
   * @returns {Promise<RatePlan>} Created rate plan.
   * @throws {RoomsError} When a business rule is violated.
   */
  function addRatePlan(ratePlan) {
    ratePlan.validate();
    ensureKnownRoomTypes(ratePlan);
    ensureUniqueRatePlanName(ratePlan);
    return trackSaving(
      roomsApi.createRatePlan(ratePlan).then((response) => {
        const newRatePlan = RatePlanAssembler.toEntityFromResource(
          response.data,
        );
        ratePlans.value.push(newRatePlan);
        return newRatePlan;
      }),
    );
  }

  /**
   * Updates an existing rate plan, including its activation, and synchronizes local state.
   * @param {RatePlan} ratePlan - Rate plan entity with updated data.
   * @returns {Promise<RatePlan>} Updated rate plan.
   * @throws {RoomsError} When a business rule is violated.
   */
  function updateRatePlan(ratePlan) {
    if (!getRatePlanById(ratePlan.id)) throw new RoomsError('not-found');
    ratePlan.validate();
    ensureKnownRoomTypes(ratePlan);
    ensureUniqueRatePlanName(ratePlan);
    return trackSaving(
      roomsApi
        .updateRatePlan(ratePlan)
        .then((response) =>
          replaceEntity(
            ratePlans,
            RatePlanAssembler.toEntityFromResource(response.data),
          ),
        ),
    );
  }

  /**
   * Sets the nightly rate of a room type under a rate plan over a date range, or returns those nights to the base nightly rate.
   * Each night keeps at most one daily rate per room type and rate plan.
   * @param {import('../domain/set-daily-rates.command.js').SetDailyRatesCommand} setDailyRatesCommand - Set-daily-rates command.
   * @returns {Promise<void>}
   * @throws {RoomsError} When a business rule is violated.
   */
  function setDailyRates(setDailyRatesCommand) {
    const { ratePlanId, roomTypeId, startDate, endDate, useBaseRate, amount } =
      setDailyRatesCommand;
    const ratePlan = getRatePlanById(ratePlanId);
    if (!ratePlan || !getRoomTypeById(roomTypeId))
      throw new RoomsError('not-found');
    if (!ratePlan.appliesTo(roomTypeId))
      throw new RoomsError('room-type-not-in-plan');
    const nights = DailyRate.nightsBetween(startDate, endDate);

    const created = [];
    const updated = [];
    const deleted = [];
    for (const date of nights) {
      const dailyRate = getDailyRate(roomTypeId, ratePlanId, date);
      if (useBaseRate) {
        if (dailyRate) deleted.push(dailyRate);
        continue;
      }
      const newDailyRate = new DailyRate({
        id: dailyRate?.id ?? null,
        propertyId: currentPropertyId.value,
        ratePlanId,
        roomTypeId,
        date,
        amount,
      });
      newDailyRate.validate();
      if (dailyRate) updated.push(newDailyRate);
      else created.push(newDailyRate);
    }
    const request = Promise.all([
      ...deleted.map((dailyRate) => roomsApi.deleteDailyRate(dailyRate.id)),
      ...updated.map((dailyRate) => roomsApi.updateDailyRate(dailyRate)),
      ...created.map((dailyRate) => roomsApi.createDailyRate(dailyRate)),
    ])
      .then((responses) => {
        const deletedIds = deleted.map((dailyRate) => dailyRate.id);
        dailyRates.value = [
          ...dailyRates.value
            .filter((dailyRate) => !deletedIds.includes(dailyRate.id))
            .map(
              (dailyRate) =>
                updated.find((entry) => entry.id === dailyRate.id) ?? dailyRate,
            ),
          ...responses
            .slice(deleted.length + updated.length)
            .map((response) =>
              DailyRateAssembler.toEntityFromResource(response.data),
            ),
        ];
      })
      .catch((error) => {
        // Partial writes may have succeeded; reload the persisted daily rates.
        fetchDailyRates();
        throw error;
      });
    return trackSaving(request);
  }

  /**
   * Sets or releases a room's operational status over a date range.
   * Existing periods inside the range are removed, trimmed, or split so that periods never overlap.
   * @param {SetRoomStatusCommand} setRoomStatusCommand - Set-room-status command.
   * @returns {Promise<void>}
   * @throws {RoomsError} When a business rule is violated.
   */
  function setRoomStatus(setRoomStatusCommand) {
    const { roomId, status, startDate, endDate, reason } = setRoomStatusCommand;
    if (!getRoomById(roomId)) throw new RoomsError('not-found');
    if (!SetRoomStatusCommand.statuses.includes(status))
      throw new RoomsError('invalid-status');
    const newStatusPeriod =
      status === 'available'
        ? null
        : new StatusPeriod({
            propertyId: currentPropertyId.value,
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
      roomAssignments.value.some(
        (roomAssignment) =>
          roomAssignment.roomId === roomId &&
          roomAssignment.overlaps(startDate, endDate),
      )
    )
      throw new RoomsError('booking-controlled');

    const created = [];
    const updated = [];
    const deleted = [];
    for (const statusPeriod of statusPeriods.value) {
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
        roomsApi.deleteStatusPeriod(statusPeriod.id),
      ),
      ...updated.map((statusPeriod) =>
        roomsApi.updateStatusPeriod(statusPeriod),
      ),
    ])
      .then(() =>
        Promise.all(
          created.map((statusPeriod) =>
            roomsApi.createStatusPeriod(statusPeriod),
          ),
        ),
      )
      .then((responses) => {
        const deletedIds = deleted.map((statusPeriod) => statusPeriod.id);
        statusPeriods.value = [
          ...statusPeriods.value
            .filter((statusPeriod) => !deletedIds.includes(statusPeriod.id))
            .map(
              (statusPeriod) =>
                updated.find((entry) => entry.id === statusPeriod.id) ??
                statusPeriod,
            ),
          ...responses.map((response) =>
            StatusPeriodAssembler.toEntityFromResource(response.data),
          ),
        ];
      })
      .catch((error) => {
        // Partial writes may have succeeded; reload the persisted periods.
        fetchStatusPeriods();
        throw error;
      });
    return trackSaving(request);
  }

  return {
    properties,
    roomTypes,
    rooms,
    statusPeriods,
    roomAssignments,
    ratePlans,
    dailyRates,
    errors,
    propertiesLoaded,
    roomTypesLoaded,
    roomsLoaded,
    statusPeriodsLoaded,
    roomAssignmentsLoaded,
    ratePlansLoaded,
    dailyRatesLoaded,
    saving,
    currentPropertyId,
    currentProperty,
    roomTypesCount,
    roomsCount,
    fetchProperties,
    selectProperty,
    fetchRoomTypes,
    fetchRooms,
    fetchStatusPeriods,
    fetchRoomAssignments,
    fetchRatePlans,
    fetchDailyRates,
    getRoomTypeById,
    getRoomById,
    getRoomAssignmentOn,
    getStatusPeriodOn,
    getDayStatus,
    getRoomsByRoomType,
    isRoomBookable,
    getRatePlanById,
    getDailyRate,
    getNightlyRate,
    addRoomType,
    updateRoomType,
    deleteRoomType,
    addRoom,
    updateRoom,
    setRoomStatus,
    addRatePlan,
    updateRatePlan,
    setDailyRates,
  };
});

export default useRoomsStore;
