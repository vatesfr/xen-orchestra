export const SECTOR_SIZE = 512;
export const compressionDeflate = 'COMPRESSION_DEFLATE';
export const compressionNone = 'COMPRESSION_NONE';
export const MARKER_EOS = 0;
export const MARKER_GT = 1;
export const MARKER_GD = 2;
export const MARKER_FOOTER = 3;

const compressionMap = [compressionNone, compressionDeflate];

export interface VMDKFlags {
    newLineTest: boolean;
    useSecondaryGrain: boolean;
    useZeroedGrainTable: boolean;
    compressedGrains: boolean;
    hasMarkers: boolean;
}

export interface VMDKHeader {
    magicString: string;
    version: number;
    flags: VMDKFlags;
    compressionMethod: typeof compressionNone | typeof compressionDeflate;
    grainSizeSectors: number;
    overheadSectors: number;
    capacitySectors: number;
    descriptorOffsetSectors: number;
    descriptorSizeSectors: number;
    grainDirectoryOffsetSectors: number;
    rGrainDirectoryOffsetSectors: number;
    l1EntrySectors: number;
    numGTEsPerGT: number;
}

export interface StreamOptimizedHeaderResult {
    buffer: Buffer;
    grainDirectorySizeSectors: number;
    grainTableSizeSectors: number;
    grainDirectoryEntries: number;
    grainTableEntries: number;
}

function parseFlags(flagBuffer: Buffer): VMDKFlags {
    const number = flagBuffer.readUInt32LE(0);
    return {
        newLineTest: !!(number & 1 << 0),
        useSecondaryGrain: !!(number & 1 << 1),
        useZeroedGrainTable: !!(number & 1 << 2),
        compressedGrains: !!(number & 1 << 16),
        hasMarkers: !!(number & 1 << 17)
    };
}

// actually reads 47 bits
function parseS64b(buffer: Buffer, offset: number, valueName: string): number {
    const extraBits = buffer.readIntLE(offset + 6, 2);
    const value = buffer.readIntLE(offset, 6);
    const hadValueInHighBytes = !(extraBits === 0 || extraBits === -1);
    const readWrongSign = Math.sign(value) * Math.sign(extraBits) < 0;
    if (hadValueInHighBytes || readWrongSign) {
        throw new Error('Unsupported VMDK, ' + valueName + ' is too big');
    }
    return value;
}

// reads 48bits
function parseU64b(buffer: Buffer, offset: number, valueName: string): number {
    const extraBits = buffer.readUIntLE(offset + 6, 2);
    const value = buffer.readUIntLE(offset, 6);
    if (extraBits > 0) {
        throw new Error('Unsupported VMDK, ' + valueName + ' is too big');
    }
    return value;
}

export function unpackVmdkHeader(buffer: Buffer): VMDKHeader {
    const magicString = buffer.slice(0, 4).toString('ascii');
    if (magicString !== 'KDMV') {
        throw new Error('not a VMDK file');
    }
    const version = buffer.readUInt32LE(4);
    if (version !== 1 && version !== 3) {
        throw new Error('unsupported VMDK version ' + version + ', only version 1 and 3 are supported');
    }
    const flags = parseFlags(buffer.slice(8, 12));
    const capacitySectors = parseU64b(buffer, 12, 'capacitySectors');
    const grainSizeSectors = parseU64b(buffer, 20, 'grainSizeSectors');
    const descriptorOffsetSectors = parseU64b(buffer, 28, 'descriptorOffsetSectors');
    const descriptorSizeSectors = parseU64b(buffer, 36, 'descriptorSizeSectors');
    const numGTEsPerGT = buffer.readUInt32LE(44);
    const rGrainDirectoryOffsetSectors = parseS64b(buffer, 48, 'rGrainDirectoryOffsetSectors');
    const grainDirectoryOffsetSectors = parseS64b(buffer, 56, 'grainDirectoryOffsetSectors');
    const overheadSectors = parseS64b(buffer, 64, 'overheadSectors');
    const compressionMethod = compressionMap[buffer.readUInt16LE(77)] as typeof compressionNone | typeof compressionDeflate;
    const l1EntrySectors = numGTEsPerGT * grainSizeSectors;
    return {
        magicString,
        version,
        flags,
        compressionMethod,
        grainSizeSectors,
        overheadSectors,
        capacitySectors,
        descriptorOffsetSectors,
        descriptorSizeSectors,
        grainDirectoryOffsetSectors,
        rGrainDirectoryOffsetSectors,
        l1EntrySectors,
        numGTEsPerGT
    };
}

export function createStreamOptimizedHeader(
    capacitySectors: number,
    descriptorSizeSectors: number,
    grainDirectoryOffsetSectors: number = -1,
    rGrainDirectoryOffsetSectors: number = 0
): StreamOptimizedHeaderResult {
    const headerBuffer = Buffer.alloc(SECTOR_SIZE);
    Buffer.from('KDMV', 'ascii').copy(headerBuffer, 0);
    // version
    headerBuffer.writeUInt32LE(3, 4);
    // newline, secondary grain directory , compression, markers
    const flags = 1 | 1 << 1 | 1 << 16 | 1 << 17;
    headerBuffer.writeUInt32LE(flags, 8);

    // number of sectors of the full disk
    headerBuffer.writeBigUInt64LE(BigInt(capacitySectors), 12);

    // number of sectors in the data of a grain (uncompressed)
    const grainSizeSectors = 128;
    headerBuffer.writeBigUInt64LE(BigInt(grainSizeSectors), 20);

    // offset of the descriptor(should be directly after header which is 1 sector long)
    const descriptorOffsetSectors = 1;
    headerBuffer.writeBigUInt64LE(BigInt(descriptorOffsetSectors), 28);
    // size of the descriptor in sectors
    headerBuffer.writeBigUInt64LE(BigInt(descriptorSizeSectors), 36);
    const numGTEsPerGT = 512;
    // number of entries in a grain table
    headerBuffer.writeUInt32LE(numGTEsPerGT, 44);

    // redundant grain directory offset
    headerBuffer.writeBigInt64LE(BigInt(rGrainDirectoryOffsetSectors), 48);

    // grain directory offset in sector
    headerBuffer.writeBigInt64LE(BigInt(grainDirectoryOffsetSectors), 56);
    const grainDirectoryEntries = Math.ceil(Math.ceil(capacitySectors / grainSizeSectors) / numGTEsPerGT);
    const grainTableEntries = grainDirectoryEntries * numGTEsPerGT;
    const grainDirectorySizeSectors = Math.ceil(grainDirectoryEntries * 4 / SECTOR_SIZE);
    const grainTableSizeSectors = Math.ceil(grainTableEntries * 4 / SECTOR_SIZE);
    let overheadSectors = 1 + descriptorSizeSectors;
    // only grow the header if there really is a grain directory
    if (grainDirectoryOffsetSectors > 0) {
        overheadSectors += grainDirectorySizeSectors + grainTableSizeSectors;
    }

    // first offset available for data
    headerBuffer.writeBigInt64LE(BigInt(overheadSectors), 64);

    // newline mangling detector
    headerBuffer.write('\n \r\n', 73, 4, 'ascii');

    // use DEFLATE compression algorithm
    headerBuffer.writeUInt16LE(1, 77);
    return {
        buffer: headerBuffer,
        grainDirectorySizeSectors,
        grainTableSizeSectors,
        grainDirectoryEntries,
        grainTableEntries
    };
}