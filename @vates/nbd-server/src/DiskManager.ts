import { RandomAccessDisk } from '@xen-orchestra/disk-transform';

export class DiskManager {
  private diskStates = new Map<RandomAccessDisk, {
    refCount: number;
    timeout: NodeJS.Timeout | null;
    isOpen: boolean;
  }>();
  private timeoutMs: number;

  constructor(timeoutMs: number = 10 * 60 * 1000) {
    this.timeoutMs = timeoutMs;
  }

  async acquire(disk: RandomAccessDisk): Promise<void> {
    let state = this.diskStates.get(disk);
    
    if (!state) {
      state = { refCount: 0, timeout: null, isOpen: false };
      this.diskStates.set(disk, state);
    }

    // Clear any existing timeout
    if (state.timeout) {
      clearTimeout(state.timeout);
      state.timeout = null;
    }

    // Open disk if not already open
    if (!state.isOpen) {
      await disk.init();
      state.isOpen = true;
      //console.log('Disk opened');
    }

    state.refCount++;
   // console.log(`Disk acquired, refCount: ${state.refCount}`);
  }

  release(disk: RandomAccessDisk): void {
    const state = this.diskStates.get(disk);
    if (!state) return;

    state.refCount--;
  //  console.log(`Disk released, refCount: ${state.refCount}`);

    if (state.refCount <= 0) {
      // Start timeout to close disk
      state.timeout = setTimeout(() => {
        this.closeDisk(disk);
      }, this.timeoutMs);
     // console.log(`Disk timeout started (${this.timeoutMs}ms)`);
    }
  }

  private async closeDisk(disk: RandomAccessDisk): Promise<void> {
    const state = this.diskStates.get(disk);
    if (!state || state.refCount > 0) return;
    await disk.close()
    console.log('Closing disk due to timeout');
    state.isOpen = false;
    state.timeout = null;
    
    // Note: The Disk interface doesn't have a close() method
    // If your Disk class has one, call it here:
    // if (typeof (disk as any).close === 'function') {
    //   (disk as any).close();
    // }
  }

  getState(disk: RandomAccessDisk) {
    return this.diskStates.get(disk);
  }
}
