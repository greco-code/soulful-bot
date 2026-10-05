import { PlayerService } from '../src/services/playerService';
import { AdminService } from '../src/services/adminService';
import { database } from './setup';

// Real services and queries with only the database connection mocked.
const { query, release } = database;
beforeEach(() => query.mockReset());

it('does not insert a duplicate Telegram registration', async () => {
  query.mockResolvedValueOnce({ rows: [{ user_id: 123 }] });
  expect(await PlayerService.addFullPlayerToEvent(7, 123, 'Test Player')).toBe(false);
  expect(query).toHaveBeenCalledTimes(1);
  expect(release).toHaveBeenCalledTimes(1);
});

it('adds a manually named player without a Telegram account', async () => {
  query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });
  expect(await PlayerService.addPlayerToEvent(7, 'Guest name')).toBe(true);
  expect(query).toHaveBeenLastCalledWith(expect.stringContaining('INSERT INTO attendees'), [7, 'Guest name']);
});

it('does not remove a manually named player who is absent', async () => {
  query.mockResolvedValueOnce({ rows: [] });
  expect(await PlayerService.removePlayerFromEvent(7, 'Absent')).toBe(false);
  expect(query).toHaveBeenCalledTimes(1);
});

it('removes a player and their guests only from the requested event', async () => {
  query.mockResolvedValueOnce({ rows: [{ user_id: 123 }] }).mockResolvedValueOnce({ rowCount: 2 });
  expect(await PlayerService.removePlayerFromEventById(7, 123)).toBe(true);
  expect(query).toHaveBeenLastCalledWith(
    expect.stringContaining('event_id = $1 AND (user_id = $2 OR guest_of_user_id = $2)'), [7, 123]);
});

it('requires a registered host before adding a guest', async () => {
  query.mockResolvedValueOnce({ rows: [] });
  expect(await PlayerService.addGuestToEvent(7, 123, 'Test Player')).toBe(false);
  expect(query).toHaveBeenCalledTimes(1);
});

it.each([11, 12])('checks guest capacity with %i of 12 places used', async count => {
  query.mockResolvedValueOnce({ rows: [{ user_id: 123 }] })
    .mockResolvedValueOnce({ rows: [{ id: 7, max_attendees: 12 }] })
    .mockResolvedValueOnce({ rows: [{ count: String(count) }] })
    .mockResolvedValueOnce({ rows: [] });
  expect(await PlayerService.addGuestToEvent(7, 123, 'Test Player')).toBe(count < 12);
  expect(query).toHaveBeenCalledTimes(count < 12 ? 4 : 3);
  if (count < 12) {
    expect(query).toHaveBeenLastCalledWith(expect.stringContaining('INSERT INTO attendees'),
      [7, "Test Player's +1", 123]);
  }
});

it.each([0, 1])('reports whether one guest was removed (affected rows=%i)', async rowCount => {
  query.mockResolvedValueOnce({ rowCount });
  expect(await PlayerService.removeGuestFromEvent(7, 123)).toBe(rowCount === 1);
  expect(query).toHaveBeenCalledWith(expect.stringContaining('LIMIT 1'), [7, 123]);
});

it('protects the last admin', async () => {
  query.mockResolvedValueOnce({ rows: [{ user_id: 123 }] })
    .mockResolvedValueOnce({ rows: [{ count: '1' }] });
  expect(await AdminService.removeAdmin(123)).toBe(false);
  expect(query).toHaveBeenCalledTimes(2);
});

it('removes an admin when another admin remains', async () => {
  query.mockResolvedValueOnce({ rows: [{ user_id: 123 }] })
    .mockResolvedValueOnce({ rows: [{ count: '2' }] })
    .mockResolvedValueOnce({ rowCount: 1 });
  expect(await AdminService.removeAdmin(123)).toBe(true);
  expect(query).toHaveBeenLastCalledWith(expect.stringContaining('DELETE FROM admins'), [123]);
});

it('denies admin status on a failed database lookup', async () => {
  query.mockRejectedValueOnce(new Error('Database unavailable'));
  expect(await AdminService.checkAdminStatus(123)).toBe(false);
  expect(release).toHaveBeenCalledTimes(1);
});
