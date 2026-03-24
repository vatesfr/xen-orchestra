// Returns whether `path` points to a VM backup metadata JSON file.
export default (path: string): RegExpMatchArray | null => path.match(/xo-vm-backups\/[^/]+\/[^/]+\.json$/)
