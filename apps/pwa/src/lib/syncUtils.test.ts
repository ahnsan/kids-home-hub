/**
 * Test suite for sync utilities
 */

import { describe, it, expect } from 'vitest';
import {
  resolveConflict,
  mergeById,
  calculateDiff,
  applyDiff,
  generateChecksum,
  isEqual,
  calculateBackoff,
  batchItems
} from './syncUtils';

describe('syncUtils', () => {
  describe('resolveConflict', () => {
    it('should prefer remote when remote is newer', () => {
      const local = { id: '1', name: 'Alice', updatedAt: 1000 };
      const remote = { id: '1', name: 'Alice Updated', updatedAt: 2000 };

      const result = resolveConflict(local, remote);

      expect(result).toEqual(remote);
    });

    it('should prefer local when local is newer', () => {
      const local = { id: '1', name: 'Alice Updated', updatedAt: 2000 };
      const remote = { id: '1', name: 'Alice', updatedAt: 1000 };

      const result = resolveConflict(local, remote);

      expect(result).toEqual(local);
    });

    it('should prefer remote when timestamps are equal', () => {
      const local = { id: '1', name: 'Alice', updatedAt: 1000 };
      const remote = { id: '1', name: 'Bob', updatedAt: 1000 };

      const result = resolveConflict(local, remote);

      // When timestamps are equal, remote wins (server is source of truth)
      expect(result).toEqual(remote);
    });
  });

  describe('mergeById', () => {
    it('should merge local and remote arrays', () => {
      const local = [
        { id: '1', name: 'Alice', updatedAt: 1000 },
        { id: '2', name: 'Bob', updatedAt: 1000 }
      ];

      const remote = [
        { id: '1', name: 'Alice Updated', updatedAt: 2000 },
        { id: '3', name: 'Charlie', updatedAt: 1000 }
      ];

      const result = mergeById(local, remote);

      expect(result).toHaveLength(3);
      expect(result.find(item => item.id === '1')?.name).toBe('Alice Updated');
      expect(result.find(item => item.id === '2')?.name).toBe('Bob');
      expect(result.find(item => item.id === '3')?.name).toBe('Charlie');
    });

    it('should use custom conflict resolver', () => {
      const local = [{ id: '1', name: 'Alice', updatedAt: 1000 }];
      const remote = [{ id: '1', name: 'Bob', updatedAt: 2000 }];

      // Custom resolver that always prefers local
      const resolver = (l: any) => l;

      const result = mergeById(local, remote, resolver);

      expect(result[0]?.name).toBe('Alice');
    });

    it('should handle empty arrays', () => {
      const local: Array<{ id: string }> = [];
      const remote = [{ id: '1', name: 'Alice' }];

      const result = mergeById(local, remote);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('1');
    });
  });

  describe('calculateDiff', () => {
    it('should identify added items', () => {
      const local = [
        { id: '1', name: 'Alice', updatedAt: 1000 }
      ];

      const remote = [
        { id: '1', name: 'Alice', updatedAt: 1000 },
        { id: '2', name: 'Bob', updatedAt: 1000 }
      ];

      const diff = calculateDiff(local, remote);

      expect(diff.added).toHaveLength(1);
      expect(diff.added[0]?.id).toBe('2');
      expect(diff.updated).toHaveLength(0);
      expect(diff.deleted).toHaveLength(0);
    });

    it('should identify updated items', () => {
      const local = [
        { id: '1', name: 'Alice', updatedAt: 1000 }
      ];

      const remote = [
        { id: '1', name: 'Alice Updated', updatedAt: 2000 }
      ];

      const diff = calculateDiff(local, remote);

      expect(diff.added).toHaveLength(0);
      expect(diff.updated).toHaveLength(1);
      expect(diff.updated[0]?.name).toBe('Alice Updated');
      expect(diff.deleted).toHaveLength(0);
    });

    it('should identify deleted items', () => {
      const local = [
        { id: '1', name: 'Alice', updatedAt: 1000 },
        { id: '2', name: 'Bob', updatedAt: 1000 }
      ];

      const remote = [
        { id: '1', name: 'Alice', updatedAt: 1000 }
      ];

      const diff = calculateDiff(local, remote);

      expect(diff.added).toHaveLength(0);
      expect(diff.updated).toHaveLength(0);
      expect(diff.deleted).toHaveLength(1);
      expect(diff.deleted[0]).toBe('2');
    });

    it('should handle complex scenarios', () => {
      const local = [
        { id: '1', name: 'Alice', updatedAt: 1000 },
        { id: '2', name: 'Bob', updatedAt: 1000 },
        { id: '3', name: 'Charlie', updatedAt: 1000 }
      ];

      const remote = [
        { id: '1', name: 'Alice Updated', updatedAt: 2000 }, // Updated
        { id: '2', name: 'Bob', updatedAt: 1000 }, // Same
        { id: '4', name: 'David', updatedAt: 1000 } // Added
        // 3 is deleted
      ];

      const diff = calculateDiff(local, remote);

      expect(diff.added).toHaveLength(1);
      expect(diff.added[0]?.id).toBe('4');
      expect(diff.updated).toHaveLength(1);
      expect(diff.updated[0]?.id).toBe('1');
      expect(diff.deleted).toHaveLength(1);
      expect(diff.deleted[0]).toBe('3');
    });
  });

  describe('applyDiff', () => {
    it('should apply diff to local data', () => {
      const local = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Charlie' }
      ];

      const diff = {
        added: [{ id: '4', name: 'David' }],
        updated: [{ id: '1', name: 'Alice Updated' }],
        deleted: ['3']
      };

      const result = applyDiff(local, diff);

      expect(result).toHaveLength(3);
      expect(result.find(item => item.id === '1')?.name).toBe('Alice Updated');
      expect(result.find(item => item.id === '2')?.name).toBe('Bob');
      expect(result.find(item => item.id === '3')).toBeUndefined();
      expect(result.find(item => item.id === '4')?.name).toBe('David');
    });
  });

  describe('generateChecksum', () => {
    it('should generate consistent checksum for same data', () => {
      const data = { name: 'Alice', age: 30 };

      const checksum1 = generateChecksum(data);
      const checksum2 = generateChecksum(data);

      expect(checksum1).toBe(checksum2);
    });

    it('should generate different checksums for different data', () => {
      const data1 = { name: 'Alice', age: 30 };
      const data2 = { name: 'Bob', age: 25 };

      const checksum1 = generateChecksum(data1);
      const checksum2 = generateChecksum(data2);

      expect(checksum1).not.toBe(checksum2);
    });

    it('should handle arrays', () => {
      const data = [1, 2, 3, 4, 5];

      const checksum = generateChecksum(data);

      expect(checksum).toBeDefined();
      expect(typeof checksum).toBe('string');
    });
  });

  describe('isEqual', () => {
    it('should return true for equal objects', () => {
      const obj1 = { name: 'Alice', age: 30 };
      const obj2 = { name: 'Alice', age: 30 };

      expect(isEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for different objects', () => {
      const obj1 = { name: 'Alice', age: 30 };
      const obj2 = { name: 'Bob', age: 25 };

      expect(isEqual(obj1, obj2)).toBe(false);
    });

    it('should handle nested objects', () => {
      const obj1 = { user: { name: 'Alice', age: 30 } };
      const obj2 = { user: { name: 'Alice', age: 30 } };

      expect(isEqual(obj1, obj2)).toBe(true);
    });

    it('should handle arrays', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 3];

      expect(isEqual(arr1, arr2)).toBe(true);
    });
  });

  describe('calculateBackoff', () => {
    it('should calculate exponential backoff', () => {
      const backoff0 = calculateBackoff(0, 1000);
      const backoff1 = calculateBackoff(1, 1000);
      const backoff2 = calculateBackoff(2, 1000);

      expect(backoff0).toBeGreaterThanOrEqual(1000);
      expect(backoff0).toBeLessThanOrEqual(1250);

      expect(backoff1).toBeGreaterThanOrEqual(2000);
      expect(backoff1).toBeLessThanOrEqual(2500);

      expect(backoff2).toBeGreaterThanOrEqual(4000);
      expect(backoff2).toBeLessThanOrEqual(5000);
    });

    it('should respect max delay', () => {
      const backoff = calculateBackoff(100, 1000, 10000);

      expect(backoff).toBeLessThanOrEqual(12500); // Max + jitter
    });

    it('should add jitter', () => {
      const backoffs = Array.from({ length: 10 }, () => calculateBackoff(1, 1000));

      // Not all values should be the same (jitter makes them different)
      const uniqueValues = new Set(backoffs);
      expect(uniqueValues.size).toBeGreaterThan(1);
    });
  });

  describe('batchItems', () => {
    it('should batch items into chunks', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const batches = batchItems(items, 3);

      expect(batches).toHaveLength(4);
      expect(batches[0]).toEqual([1, 2, 3]);
      expect(batches[1]).toEqual([4, 5, 6]);
      expect(batches[2]).toEqual([7, 8, 9]);
      expect(batches[3]).toEqual([10]);
    });

    it('should handle exact divisions', () => {
      const items = [1, 2, 3, 4, 5, 6];

      const batches = batchItems(items, 2);

      expect(batches).toHaveLength(3);
      expect(batches[0]).toEqual([1, 2]);
      expect(batches[1]).toEqual([3, 4]);
      expect(batches[2]).toEqual([5, 6]);
    });

    it('should handle empty arrays', () => {
      const items: number[] = [];

      const batches = batchItems(items, 5);

      expect(batches).toHaveLength(0);
    });

    it('should handle batch size larger than array', () => {
      const items = [1, 2, 3];

      const batches = batchItems(items, 10);

      expect(batches).toHaveLength(1);
      expect(batches[0]).toEqual([1, 2, 3]);
    });
  });
});
