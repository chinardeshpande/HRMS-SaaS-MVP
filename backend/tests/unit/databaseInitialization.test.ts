import {
  initializeDatabaseWithRetry,
  isTransientDatabaseError,
} from '../../src/config/database';

describe('database initialization resilience', () => {
  it('retries a transient startup timeout and then succeeds', async () => {
    const initialize = jest
      .fn<Promise<void>, []>()
      .mockRejectedValueOnce(Object.assign(new Error('connect timeout'), { code: 'ETIMEDOUT' }))
      .mockResolvedValue(undefined);
    const wait = jest.fn<Promise<void>, [number]>().mockResolvedValue(undefined);

    await initializeDatabaseWithRetry(initialize, wait);

    expect(initialize).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledWith(1000);
  });

  it('does not retry a non-transient authentication failure', async () => {
    const error = Object.assign(new Error('password authentication failed'), { code: '28P01' });
    const initialize = jest.fn<Promise<void>, []>().mockRejectedValue(error);
    const wait = jest.fn<Promise<void>, [number]>().mockResolvedValue(undefined);

    await expect(initializeDatabaseWithRetry(initialize, wait)).rejects.toBe(error);

    expect(initialize).toHaveBeenCalledTimes(1);
    expect(wait).not.toHaveBeenCalled();
  });

  it.each(['ECONNRESET', 'ETIMEDOUT', '57P03', '08006'])(
    'classifies %s as transient',
    (code) => {
      expect(isTransientDatabaseError({ code })).toBe(true);
    }
  );
});
