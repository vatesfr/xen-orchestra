// @ts-check

/**
 * Returns whether `path` points to a VM backup metadata JSON file.
 * @param {string} path
 * @returns {RegExpMatchArray | null}
 */
export default path => path.match(/xo-vm-backups\/[^/]+\/[^/]+\.json$/)
