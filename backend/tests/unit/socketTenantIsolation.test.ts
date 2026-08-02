import { socketService } from '../../src/services/socketService';

describe('Socket tenant isolation', () => {
  afterEach(() => {
    (socketService as any).io = null;
    (socketService as any).userSockets.clear();
  });

  it('targets realtime events to the requested tenant room', () => {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    (socketService as any).io = { to };

    socketService.emitToTenant('tenant-a', 'new_post', { postId: 'post-a' });

    expect(to).toHaveBeenCalledWith('tenant:tenant-a');
    expect(emit).toHaveBeenCalledWith('new_post', { postId: 'post-a' });
    expect(to).not.toHaveBeenCalledWith('tenant:tenant-b');
  });

  it('keeps online-user lookup tenant scoped', () => {
    (socketService as any).userSockets.set('tenant-a:employee-1', new Set(['socket-a']));

    expect(socketService.isUserOnline('tenant-a', 'employee-1')).toBe(true);
    expect(socketService.isUserOnline('tenant-b', 'employee-1')).toBe(false);
    expect(socketService.getOnlineUsers('tenant-a')).toEqual(['employee-1']);
    expect(socketService.getOnlineUsers('tenant-b')).toEqual([]);
  });
});
