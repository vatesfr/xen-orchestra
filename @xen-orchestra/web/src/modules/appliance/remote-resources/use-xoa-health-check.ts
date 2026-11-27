import type {
  ApplianceHealthCheckItem,
  ApplianceHealthCheckStatus,
} from '@/modules/appliance/types/appliance-health-check.type.ts'
import type { XoaHealthCheck } from '@/modules/appliance/types/xoa-health-check.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { computed } from 'vue'

// la sortie de `xoa check` est colorée pour un terminal
const ANSI_ESCAPE_REGEX = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')

// symboles de `log-symbols` utilisés par `xoa check`, avec leur repli pour les terminaux sans unicode
const STATUS_BY_SYMBOL: Record<string, ApplianceHealthCheckStatus> = {
  '✔': 'success',
  '√': 'success',
  '⚠': 'warning',
  '‼': 'warning',
  '✖': 'danger',
  '×': 'danger',
}

// une ligne par contrôle : `<symbole> NN/total - <titre>[: <message>]`
const CHECK_LINE_REGEX = /^(\S+)\s+\d+\/\d+\s+-\s+(.+)$/

const DETAIL_SEPARATOR = ': '

const STATUS_RANKS: Record<ApplianceHealthCheckStatus, number> = {
  danger: 0,
  warning: 1,
  success: 2,
}

function parseHealthCheckLine(line: string): ApplianceHealthCheckItem | undefined {
  const match = CHECK_LINE_REGEX.exec(line.trim())

  if (match === null) {
    return undefined
  }

  const [, symbol, content] = match

  const status = STATUS_BY_SYMBOL[symbol]

  if (status === undefined) {
    return undefined
  }

  const separatorIndex = content.indexOf(DETAIL_SEPARATOR)

  if (separatorIndex === -1) {
    return { name: content, status }
  }

  return {
    name: content.slice(0, separatorIndex),
    status,
    detail: content.slice(separatorIndex + DETAIL_SEPARATOR.length),
  }
}

// les lignes qui ne sont pas des contrôles (stack d'une erreur levée par un contrôle) sont ignorées
function parseHealthCheckOutput(report: string): ApplianceHealthCheckItem[] {
  const items: ApplianceHealthCheckItem[] = []

  for (const line of report.split('\n')) {
    const item = parseHealthCheckLine(line)

    if (item !== undefined) {
      items.push(item)
    }
  }

  return items
}

export const useXoaHealthCheck = defineRemoteResource({
  url: `${BASE_URL}/plugins/xoa/health-check`,
  cacheExpirationMs: false,
  pollingIntervalMs: false,
  initialData: () => undefined as XoaHealthCheck | undefined,
  state: (data, context) => {
    const healthCheckReport = computed(() => {
      if (data.value?.output === undefined) {
        return undefined
      }

      return data.value.output.replace(ANSI_ESCAPE_REGEX, '')
    })

    // les erreurs, puis les warnings, puis les succès
    const healthCheckItems = computed(() => {
      if (healthCheckReport.value === undefined) {
        return []
      }

      return parseHealthCheckOutput(healthCheckReport.value).sort(
        (item1, item2) => STATUS_RANKS[item1.status] - STATUS_RANKS[item2.status]
      )
    })

    const healthCheckProblemCount = computed(
      () => healthCheckItems.value.filter(item => item.status !== 'success').length
    )

    const hasHealthCheckFailure = computed(() => healthCheckItems.value.some(item => item.status === 'danger'))

    return {
      healthCheckReport,
      healthCheckItems,
      healthCheckProblemCount,
      hasHealthCheckFailure,
      isHealthCheckReady: context.isReady,
      hasHealthCheckError: context.hasError,
      reloadHealthCheck: context.forceReload,
    }
  },
})
