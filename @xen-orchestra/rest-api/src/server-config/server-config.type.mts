export type ConfigSource = {
  layer: 'vendor' | 'system' | 'global' | 'local'
  path: string
}

// The parsed content of either the merged config or a single source file.
// Values are either the original value or the string "**REDACTED**".
export type ConfigContent = Record<string, unknown>
