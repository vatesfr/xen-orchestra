/**
 * Builds a `File` to be used as a stub in stories.
 *
 * `File.size` is derived from the blob content, so it is overridden here: it lets stories display
 * realistic sizes without allocating that many bytes.
 *
 * The blob is empty and carries no MIME type, so such a stub can never satisfy a `file.type` based
 * `accept` filter: it is meant for display only, never to be fed back into an uploader.
 */
export function createStoryFile(name: string, size: number): File {
  const file = new File([], name)

  Object.defineProperty(file, 'size', { value: size })

  return file
}
