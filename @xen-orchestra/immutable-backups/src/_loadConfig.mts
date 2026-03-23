import { load } from 'app-conf'
import ms, { StringValue } from 'ms'

// Configuration for a single watched remote.
// All duration fields are stored as milliseconds after config loading.
export interface RemoteConfig {
  /** Absolute path to the root of the backup repository */
  root: string
  /** Minimum duration in milliseconds that files must stay immutable */
  immutabilityDuration: number
  /** Milliseconds to wait between consecutive size checks when polling for write completion (default: 100) */
  delayBetweenSizeCheck: number
}
export interface AppConfigInput {
  liftEvery: StringValue
  /** Map of remote ID to its resolved configuration */
  remotes: Record<
    string,
    Partial<{ root: string; immutabilityDuration: StringValue; delayBetweenSizeCheck: StringValue }>
  >
}
export interface AppConfig {
  /** Interval in milliseconds between immutability-lifting runs */
  liftEvery: number
  /** Map of remote ID to its resolved configuration */
  remotes: Record<string, RemoteConfig>
}

const APP_NAME = 'xo-immutable-backups'
const APP_DIR = new URL('.', import.meta.url).pathname

// Validate and transform a raw config object (as returned by app-conf) into a
// typed AppConfig.  Duration strings are resolved to milliseconds.
// Exported so it can be unit-tested without touching the filesystem.
export function parseConfig(config: AppConfigInput): AppConfig {
  const outputConfig: AppConfig = {
    liftEvery: 0,
    remotes: {},
  }
  if (config.remotes === undefined || Object.keys(config.remotes).length < 1) {
    throw new Error(
      'No remotes are configured in the config file, please add at least one [remotes.<remoteid>]  with a root property pointing to the absolute path of the remote to watch'
    )
  }
  if (config.liftEvery) {
    outputConfig.liftEvery = ms(config.liftEvery)
  }
  for (const [remoteId, { immutabilityDuration, root }] of Object.entries(config.remotes)) {
    if (!root) {
      throw new Error(
        `Remote ${remoteId} don't have a root property,containing the absolute path to the root of a backup repository `
      )
    }
    if (!immutabilityDuration) {
      throw new Error(
        `Remote ${remoteId} don't have a immutabilityDuration property to indicate the minimal duration the backups should be  protected by immutability `
      )
    }
    if (ms(immutabilityDuration) < ms('1d')) {
      throw new Error(
        `Remote ${remoteId} immutability duration is smaller than the minimum allowed (1d), current : ${immutabilityDuration}`
      )
    }
    outputConfig.remotes[remoteId].immutabilityDuration = ms(immutabilityDuration)
    const { delayBetweenSizeCheck } = config.remotes[remoteId]
    outputConfig.remotes[remoteId].delayBetweenSizeCheck =
      delayBetweenSizeCheck !== undefined ? ms(delayBetweenSizeCheck) : 100
  }
  return outputConfig
}

// Load the raw configuration from disk via app-conf.
export async function loadRawConfig(): Promise<AppConfigInput> {
  return load(APP_NAME, {
    appDir: APP_DIR,
    ignoreUnknownFormats: true,
  }) as unknown as AppConfigInput
}

// Convenience default export: load from disk and parse in one call.
export default async function loadConfig(): Promise<AppConfig> {
  return parseConfig(await loadRawConfig())
}
