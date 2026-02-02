import { load } from 'app-conf'
import { homedir } from 'os'
import { join } from 'node:path'
import ms from 'ms'

const APP_NAME = 'xo-immutable-backups'
const APP_DIR = new URL('.', import.meta.url).pathname

export default async function loadConfig() {
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
  for (const [remoteId, { indexPath, immutabilityDuration, root }] of Object.entries(config.remotes)) {
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
    if (!indexPath) {
      const basePath = indexPath ?? process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share')
      const immutabilityIndexPath = join(basePath, APP_NAME, remoteId)
      config.remotes[remoteId].indexPath = immutabilityIndexPath
    }
    config.remotes[remoteId].immutabilityDuration = ms(immutabilityDuration)
  }
  return config
}
