// @ts-check

import { dirname } from 'node:path'

/**
 * Returns whether `path` refers to a file directly inside a `.vhd` directory
 * (i.e. `bat`, `header` or `footer`).
 * @param {string} path
 * @returns {boolean}
 */
export default path => dirname(path).endsWith('.vhd')
