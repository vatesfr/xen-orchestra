# RandomAccessVhdx Implementation

A TypeScript implementation for reading Microsoft VHDX (Virtual Hard Disk v2) files.

## Features

✅ **Read-only VHDX access** - Safely read virtual disk data  
✅ **Random block access** - Read any block in any order  
✅ **Differencing disk support** - Handle parent-child disk relationships  
✅ **Metadata extraction** - Get virtual disk UUID, parent path, disk parameters  
✅ **Efficient iteration** - Stream blocks using async generators  
✅ **Parent fallback** - Automatically read from parent when blocks are missing  

## Quick Start

```typescript
import { RandomAccessVhdx } from './RandomAccessVhdx.mjs'
import { open } from 'fs/promises'

const fd = await open('disk.vhdx', 'r')
const vhdx = new RandomAccessVhdx(fd)
await vhdx.init()

// Get disk info
console.log('Size:', vhdx.getVirtualSize())
console.log('UUID:', vhdx.getVirtualDiskId())

// Read a specific block
const block = await vhdx.readBlock(0)
console.log('Block 0 data:', block.data)

// Iterate all blocks
for await (const block of vhdx.diskBlocks()) {
  // Process each block
}

await fd.close()
```

## API Reference

### Constructor

```typescript
new RandomAccessVhdx(fd: FileHandle)
```

- **fd**: File handle opened in read mode (`'r'`)

### Methods

#### `async init(): Promise<void>`
Initialize the VHDX reader. Must be called before using other methods.
- Reads file identifier, headers, region table
- Parses metadata (block size, virtual size, UUIDs)
- Loads the Block Allocation Table (BAT)

#### `getVirtualSize(): number`
Returns the virtual disk size in bytes.

#### `getBlockSize(): number`
Returns the block size in bytes (typically 2MB or 32MB).

#### `isDifferencing(): boolean`
Returns true if this is a differencing disk (has a parent).

#### `getVirtualDiskId(): string | undefined`
Returns the virtual disk UUID as a hex string.

#### `getParentPath(): string | undefined`
Returns the parent disk path if this is a differencing disk.

#### `getBlockIndexes(): Array<number>`
Returns array of block indexes that are present in this disk.

#### `hasBlock(index: number): boolean`
Check if a specific block is present in this disk (without checking parent).

#### `async readBlock(index: number): Promise<DiskBlock>`
Read a specific block by index.
- Returns block data from this disk if present
- Falls back to parent disk if this is a differencing disk
- Returns zeroed block if not present anywhere

#### `async *diskBlocks(): AsyncGenerator<DiskBlock>`
Async generator that yields all blocks in the disk.

### Properties

#### `parent: RandomAccessDisk | undefined`
Reference to the parent disk (if opened).

## VHDX File Format

The implementation handles the following VHDX structures:

### File Layout
```
Offset       Size    Content
0x00000000   64KB    File Identifier
0x00010000   64KB    Header 1
0x00020000   64KB    Header 2
0x00030000   64KB    Region Table 1
0x00040000   64KB    Region Table 2
Variable     Var     Log Entries
Variable     Var     BAT (Block Allocation Table)
Variable     Var     Metadata Region
Variable     Var     Data Blocks
```

### Key Structures

**File Identifier** (64KB)
- Signature: "vhdxfile"
- Creator application
- VHDX format version

**Headers** (2 copies, 64KB each)
- Sequence number (used to determine current header)
- File/Data write GUIDs
- Log information

**Region Table**
- Locates BAT and Metadata regions
- Uses GUIDs to identify regions

**Metadata Region**
- File Parameters (block size, parent flag)
- Virtual Disk Size
- Virtual Disk ID
- Logical/Physical Sector Size
- Parent Locator (for differencing disks)

**BAT (Block Allocation Table)**
- Array of 64-bit entries
- Each entry contains:
  - State (3 bits): Block allocation state
  - File offset (44 bits): Location in file
- States:
  - `0`: NOT_PRESENT
  - `2`: ZERO
  - `3`: UNMAPPED
  - `6`: PAYLOAD_BLOCK_FULLY_PRESENT (the only state with actual data)

### Block States

| State | Name                         | Meaning                           |
|-------|------------------------------|-----------------------------------|
| 0     | NOT_PRESENT                  | Block not allocated               |
| 2     | ZERO                         | Block is all zeros                |
| 3     | UNMAPPED                     | Block not mapped                  |
| 6     | PAYLOAD_BLOCK_FULLY_PRESENT  | Block contains data               |
| 7     | PAYLOAD_BLOCK_PARTIALLY_PRESENT | Block partially allocated      |

## Differencing Disks

VHDX supports differencing (child) disks that reference a parent disk:

```typescript
const childFd = await open('child.vhdx', 'r')
const child = new RandomAccessVhdx(childFd)
await child.init()

if (child.isDifferencing()) {
  console.log('Parent path:', child.getParentPath())
  
  // Open parent (requires implementing instantiateParent)
  const parent = await child.openParent()
  
  // Reading blocks automatically falls back to parent
  const block = await child.readBlock(10)
  // Returns data from child if present, otherwise from parent
}
```

### Parent Locator

The parent locator metadata contains:
- `relative_path`: Path relative to child disk
- `absolute_win32_path`: Absolute Windows path
- `volume_path`: Volume-relative path

## Implementation Notes

### What's Implemented
- ✅ File identifier validation
- ✅ Dual header support (uses header with highest sequence number)
- ✅ Region table parsing
- ✅ Metadata parsing (all standard metadata items)
- ✅ BAT reading and caching
- ✅ Block reading with proper offset calculation
- ✅ Parent disk reference extraction
- ✅ Differencing disk support (parent fallback)

### What's Not Implemented
- ❌ Write operations (read-only by design)
- ❌ Log replay (assumes clean disk state)
- ❌ Checksum validation
- ❌ Parent disk auto-instantiation (requires external implementation)
- ❌ Sector bitmap blocks (assumes full blocks)
- ❌ Encryption support

### Performance Considerations

1. **BAT Caching**: The entire BAT is loaded into memory on init
   - For large disks (1TB+), this uses significant memory (~100MB per 1TB)
   - Trade-off for fast block lookups

2. **Block Reading**: Each block is read synchronously
   - Consider implementing block prefetching for sequential access
   - Use the async generator for streaming large disks

3. **Parent Fallback**: Reading from parent requires opening parent file
   - Keep parent handles open for better performance
   - Close properly to avoid resource leaks

## Error Handling

The implementation throws errors for:
- Invalid file signature
- Corrupted headers
- Missing required regions (BAT, Metadata)
- Out of range block indexes
- Unopened parent disks

Always wrap in try-catch:

```typescript
try {
  const vhdx = new RandomAccessVhdx(fd)
  await vhdx.init()
  // ... use vhdx
} catch (error) {
  console.error('VHDX error:', error)
} finally {
  await fd.close()
}
```

## Testing

To test the implementation:

```typescript
// Test basic reading
const vhdx = new RandomAccessVhdx(fd)
await vhdx.init()
assert(vhdx.getVirtualSize() > 0)
assert(vhdx.getBlockSize() > 0)

// Test block reading
const blocks = vhdx.getBlockIndexes()
for (const index of blocks) {
  const block = await vhdx.readBlock(index)
  assert(block.data.length === vhdx.getBlockSize())
}

// Test differencing disk
if (vhdx.isDifferencing()) {
  assert(vhdx.getParentPath() !== undefined)
}
```

## References

- [VHDX Format Specification (MS-VHDX)](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-vhdx/)
- [Virtual Hard Disk v2 Overview](https://docs.microsoft.com/en-us/previous-versions/windows/desktop/legacy/hh850033(v=vs.85))

## License

This implementation is based on the public VHDX specification from Microsoft.