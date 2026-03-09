import { dirname } from 'node:path'

// Returns whether `path` refers to a file directly inside a `.vhd` directory
// (i.e. `bat`, `header` or `footer`).
export default (path: string): boolean => dirname(path).endsWith('.vhd')
