// Probe a disk for the DiskLargerBlock corruption signature (block 0 valid,
// following allocated blocks all zero). Uses an export (not NBD): block flow is guaranteed
// to be in index order, so block 0 comes first and inspecting the first few blocks is enough.

// Returns false only when no allocated non-zero block is found among the first ones.
export async function diskHasData(source) {
  const empty = Buffer.alloc(source.getBlockSize(), 0)
  const MAX_EMPTY = 10
  let nbEmpty = 0
  // diskBlocks() closes the source when the iteration ends or is broken out of
  for await (const { index, data } of source.diskBlocks()) {
    if (index === 0) {
      // block 0 stays valid even in the corruption signature — skip it
      continue
    }
    if (!data.equals(empty)) {
      // an allocated block holds real data → not corrupt
      return true
    }
    if (++nbEmpty >= MAX_EMPTY) {
      break
    }
  }
  // no allocated non-zero block among the first ones → looks corrupt (or empty; a full is cheap then)
  return false
}
