import humanFormat from 'human-format'

const ICON_FAILURE = '🚨'
const ICON_INTERRUPTED = '⚠️'
const ICON_SKIPPED = '⏩'
const ICON_SUCCESS = '✔'
export const STATUS_ICON = {
  failure: ICON_FAILURE,
  interrupted: ICON_INTERRUPTED,
  skipped: ICON_SKIPPED,
  success: ICON_SUCCESS,
}

export const INDENT = '  '
export const UNHEALTHY_VDI_CHAIN_ERROR = 'unhealthy VDI chain'
export const UNHEALTHY_VDI_CHAIN_MESSAGE =
  '[(unhealthy VDI chain) Job canceled to protect the VDI chain](https://xen-orchestra.com/docs/backup_troubleshooting.html#vdi-chain-protection)'

export const formatSize = bytes =>
  humanFormat(bytes, {
    scale: 'binary',
    unit: 'B',
  })

export const formatSpeed = (bytes, milliseconds) =>
  milliseconds > 0
    ? humanFormat((bytes * 1e3) / milliseconds, {
        scale: 'binary',
        unit: 'B/s',
      })
    : 'N/A'
