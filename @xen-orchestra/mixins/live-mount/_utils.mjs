// the LUN serves the *content* of the source disk, not its container format, so
// a label must not keep a `.vhd`/`.alias.vhd` suffix: it would suggest a format
// the storage layer would then read differently
export const cacheLabel = diskPath =>
  diskPath
    .split('/')
    .pop()
    .replace(/(\.alias)?\.vhd$/, '')
