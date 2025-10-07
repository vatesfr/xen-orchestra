import  { describe, it } from 'node:test'
import assert from 'node:assert'

import { DiscreteStreamAccessor } from './DiskConsumerRaw.mjs';

describe('DiscreteStreamAccessor', () => {
    // Basic functionality tests
    
    it('should read from single interval', async () => {
        const accessor = new DiscreteStreamAccessor([
            {
                length: 10,
                getBuffer: async (pos, len) => Buffer.from([0,1,2,3,4,5,6,7,8,9])
            }
        ]);
        const buffer = Buffer.alloc(4);
        const bytesRead = await accessor.read(2, buffer);
        assert.strictEqual(bytesRead, 4);
        assert.deepStrictEqual(buffer, Buffer.from([2,3,4,5]));
    });

    // Alignment and boundary tests
    it('should handle exact interval boundary reads', async () => {
        const accessor = new DiscreteStreamAccessor([
            { length: 5, getBuffer: async (p, l) => Buffer.from([0,1,2,3,4]) },
            { length: 5, getBuffer: async (p, l) => Buffer.from([5,6,7,8,9])}
        ]);
        const buffer = Buffer.alloc(4);
        const bytesRead = await accessor.read(4, buffer);
        assert.strictEqual(bytesRead, 4);
        assert.deepStrictEqual(buffer, Buffer.from([4,5,6,7]));
    });

    // Off-by-one tests
    it('should handle single byte reads at boundaries', async () => {
        const accessor = new DiscreteStreamAccessor([
            { length: 5, getBuffer: async (p, l) => Buffer.from([0,1,2,3,4]) },
            { length: 5, getBuffer: async (p, l) => Buffer.from([5,6,7,8,9]) }
        ]);
        
        // Last byte of first interval
        const buffer1 = Buffer.alloc(1);
        assert.strictEqual(await accessor.read(4, buffer1), 1);
        assert.deepStrictEqual(buffer1, Buffer.from([4]));
        
        // First byte of second interval
        const buffer2 = Buffer.alloc(1);
        assert.strictEqual(await accessor.read(5, buffer2), 1);
        assert.deepStrictEqual(buffer2, Buffer.from([5]));
    });

    // Error case tests
    it('should throw when reading beyond available data', async () => {
        const accessor = new DiscreteStreamAccessor([
            { length: 5, getBuffer: async (p, l) => Buffer.alloc(l) }
        ]);
        const buffer = Buffer.alloc(10);
        await assert.rejects(
            () => accessor.read(0, buffer),
            /Reached end of available data/
        );
    });

    // Complex multi-interval tests
    it('should handle complex multi-interval reads', async () => {
        const accessor = new DiscreteStreamAccessor([
            { length: 3, getBuffer: async (p, l) => Buffer.from([0,1,2]) },
            { length: 4, getBuffer: async (p, l) => Buffer.from([3,4,5,6]) },
            { length: 3, getBuffer: async (p, l) => Buffer.from([7,8,9]) }
        ]);
        
        // Read across all three intervals
        const buffer = Buffer.alloc(8);
        assert.strictEqual(await accessor.read(1, buffer), 8);
        assert.deepStrictEqual(buffer, Buffer.from([1,2,3,4,5,6,7,8]));
    });

    // Empty buffer test
    it('should handle empty buffer reads', async () => {
        const accessor = new DiscreteStreamAccessor([
            { length: 10, getBuffer: async () => Buffer.alloc(10) }
        ]);
        const buffer = Buffer.alloc(0);
        assert.strictEqual(await accessor.read(5, buffer), 0);
    });
});