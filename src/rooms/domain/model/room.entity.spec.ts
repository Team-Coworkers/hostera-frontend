import { Room } from './room.entity';

describe('Room', () => {
  it('starts available when the API sends no status', () => {
    const room = new Room({ number: 201, roomTypeId: 1 });
    expect(room.number).toBe('201');
    expect(room.status).toBe('available');
    expect(room.canReceiveGuests).toBeTrue();
  });

  it('keeps the housekeeping status of the API', () => {
    expect(new Room({ status: 'ready' }).canReceiveGuests).toBeTrue();
    expect(new Room({ status: 'needs-cleaning' }).canReceiveGuests).toBeFalse();
    expect(new Room({ status: 'occupied' }).canReceiveGuests).toBeFalse();
    expect(new Room({ status: 'blocked' }).canReceiveGuests).toBeFalse();
  });

  it('lists ready as a status different from available', () => {
    expect(Room.statuses).toContain('ready');
    expect(Room.statuses).toContain('available');
  });
});
