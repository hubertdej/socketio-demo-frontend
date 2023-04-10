import { Storage } from './interfaces';

export class LruStorage implements Storage {
  private readonly storage: Storage;

  private readonly maxBytes: number;

  private bytesUsed = 0;

  private readonly sizeMap = new Map<string, number>();

  private readonly lruKeys = new Array<string>();

  constructor(storage: Storage, maxBytes: number) {
    this.storage = storage;
    this.maxBytes = maxBytes;
  }

  getItem(key: string): string | null {
    const value = this.storage.getItem(key);
    if (value) {
      this.lruKeys.splice(this.lruKeys.indexOf(key), 1);
      this.lruKeys.push(key);
    }
    return value;
  }

  setItem(key: string, value: string): void {
    this.removeItem(key);

    const newItemSize = key.length + value.length;
    this.bytesUsed += newItemSize;
    this.lruKeys.push(key);

    console.log(`[LruStorage] Inserted '${key}', new size: ${this.bytesUsed}`);

    while (this.bytesUsed > this.maxBytes) {
      const lruKey = this.lruKeys.shift()!;
      const lruItemSize = this.sizeMap.get(lruKey) || newItemSize;
      this.sizeMap.delete(lruKey);
      this.bytesUsed -= lruItemSize;
      this.storage.removeItem(lruKey);
      console.log(`[LruStorage] Freed '${lruKey}', new size: ${this.bytesUsed}`);
    }

    if (newItemSize <= this.maxBytes) {
      this.sizeMap.set(key, newItemSize);
      this.storage.setItem(key, value);
    }
  }

  removeItem(key: string): void {
    const itemSize = this.sizeMap.get(key);
    if (itemSize) {
      this.bytesUsed -= itemSize;
      this.lruKeys.splice(this.lruKeys.indexOf(key), 1);
    }
  }
}
