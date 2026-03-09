import { load } from 'app-conf'
import { homedir } from 'os'
import { join } from 'node:path'
import ms from 'ms'

// Configuration for a single watched remote.
// All duration fields are stored as milliseconds after config loading.
export interface RemoteConfig {
  /** Absolute path to the root of the backup repository */
  root: string
  /** Absolute path to the immutability index directory */
  indexPath: string
  /** Minimum duration in milliseconds that files must stay immutable */
  immutabilityDuration: number
  /** Whether to re-index already-immutable files on startup */
  rebuildIndexOnStart?: boolean
}

export interface AppConfig {
  /** Interval in milliseconds between immutability-lifting runs (0 = run once) */
  liftEvery?: number
  /** Map of remote ID to its resolved configuration */
  remotes: Record<string, RemoteConfig>
}

const APP_NAME = 'xo-immutable-backups'
const APP_DIR = new URL('.', import.meta.url).pathname

// Load and validate the application configuration, resolving all duration
// strings (e.g. `"30d"`) to milliseconds and deriving `indexPath` when absent.
export default async function loadConfig(): Promise<AppConfig> {
  const config = await load(APP_NAME, {
    appDir: APP_DIR,
    ignoreUnknownFormats: true,
  })
  if (config.remotes === undefined || config.remotes?.length < 1) {
    throw new Error(
      'No remotes are configured in the config file, please add at least one [remotes.<remoteid>]  with a root property pointing to the absolute path of the remote to watch'
    )
  }
  if (config.liftEvery) {
    config.liftEvery = ms(config.liftEvery)
  }
  for (const [remoteId, { indexPath, immutabilityDuration, root }] of Object.entries<any>(config.remotes)) {
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
    if ((ms(immutabilityDuration) as unknown as number) < ms('1d')) {
      throw new Error(
        `Remote ${remoteId} immutability duration is smaller than the minimum allowed (1d), current : ${immutabilityDuration}`
      )
    }
    if (!indexPath) {
      const basePath = indexPath ?? process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share')
      const immutabilityIndexPath = join(basePath, APP_NAME, remoteId)
      config.remotes[remoteId].indexPath = immutabilityIndexPath
    }
    config.remotes[remoteId].immutabilityDuration = ms(immutabilityDuration)
  }
  return config as AppConfig
}
