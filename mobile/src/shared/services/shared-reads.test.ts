import { createSharedReads } from './shared-reads';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

describe('shared active reads', () => {
  it('shares concurrent reads, releases results and does not cache settled data', async () => {
    const reads = createSharedReads();
    const load = jest.fn(async () => 42);
    const first = reads.read('habits', load);
    expect(reads.read('habits', load)).toBe(first);
    expect(await first).toBe(42);
    expect(load).toHaveBeenCalledTimes(1);
    await reads.read('habits', load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not share unrelated resources and recovers rejected operations', async () => {
    const reads = createSharedReads();
    const load = jest.fn(async () => 1).mockRejectedValueOnce(new Error('database busy'));
    await expect(reads.read('today', load)).rejects.toThrow('database busy');
    await expect(reads.read('today', load)).resolves.toBe(1);
    expect(reads.read('month', load)).not.toBe(reads.read('today', load));
  });

  it('invalidation detaches old snapshots without letting their cleanup remove a newer read', async () => {
    const reads = createSharedReads();
    const old = deferred<number>();
    const next = deferred<number>();
    const first = reads.read('habits', () => old.promise);
    reads.invalidate();
    const second = reads.read('habits', () => next.promise);
    old.resolve(1);
    await first;
    expect(reads.read('habits', async () => 3)).toBe(second);
    next.resolve(2);
    expect(await second).toBe(2);
  });
});
