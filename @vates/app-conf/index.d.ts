export interface Serializer {
  test(path: string): boolean
  parse(content: string): unknown
}

export interface Options {
  /** Directory where vendor config (`config.*`) is looked up. Required for the vendor entry to be loaded. */
  appDir?: string
  /** Default config values, merged before any loaded config. */
  defaults?: Record<string, unknown>
  /** Which config sources to load. Defaults to all: vendor, system, global, local, env. */
  entries?: Array<'vendor' | 'system' | 'global' | 'local' | 'env'>
  /** Env var prefix. Defaults to the app name uppercased with non-alphanumeric chars replaced by underscores. Set to false to disable. */
  envPrefix?: string | false
  /** Silently skip files with unrecognized formats instead of throwing. */
  ignoreUnknownFormats?: boolean
  /** Custom serializers, checked before built-ins. First match wins. */
  serializers?: Serializer[]
}

export interface LoadOptions extends Options {
  /** Application name. Used to derive config file names and the default env var prefix. */
  appName: string
}

export interface WatchOptions extends LoadOptions {
  /** If true, invoke the callback with the initial config before watching for changes. */
  initialLoad?: boolean
}

export type WatchCallback = (error: Error | undefined, config: Record<string, unknown>) => void

/**
 * Load and merge configuration for `appName` from all configured sources.
 */
export function load(opts: LoadOptions): Promise<Record<string, unknown>>
/** @deprecated Pass `appName` inside the options object instead. */
export function load(appName: string, opts?: Options): Promise<Record<string, unknown>>

/**
 * Watch config sources for changes and reload on each change.
 * Returns a function to stop watching.
 */
export function watch(opts: WatchOptions, cb: WatchCallback): Promise<() => Promise<void>>

/**
 * Parse a single config file, resolving relative and home-relative paths.
 */
export function parse(path: string, opts?: Pick<Options, 'serializers'>): Promise<Record<string, unknown>>

export class UnknownFormatError extends Error {}
