import type { VdfMonitorEntry } from '@/modules/vdf/types.ts'
import { markExpected, monitorFlowKey } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'

// Would-be drops marked "Expected" in the Monitor report (vdf#13): wanted
// drops, hidden from the report and its suggestions. Kept per pool in this
// browser's storage only, like the drafts: XO's store has no place for the
// report's state, and the published document goes to the agents. Without
// storage (private window, blocked site data) they last until the page is
// reloaded.

const STORAGE_KEY = 'vdf.monitor.expected'

type ExpectedByPool = Record<string, Record<string, number>>

function load(): ExpectedByPool {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')

    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as ExpectedByPool) : {}
  } catch {
    return {}
  }
}

function save(value: ExpectedByPool) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // not kept past this page: see above
  }
}

const expectedByPool = ref<ExpectedByPool>(load())

// marked in another tab
try {
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) {
      expectedByPool.value = load()
    }
  })
} catch {
  // no window: nothing to follow
}

export function useVdfMonitorExpected(rawPoolId: MaybeRefOrGetter<string>) {
  const expected = computed(() => expectedByPool.value[toValue(rawPoolId)] ?? {})

  const isExpected = (entry: VdfMonitorEntry) => monitorFlowKey(entry) in expected.value

  function setExpected(entry: VdfMonitorEntry, value: boolean) {
    const poolId = toValue(rawPoolId)
    const next = { ...expectedByPool.value, [poolId]: markExpected(expected.value, monitorFlowKey(entry), value) }

    if (Object.keys(next[poolId]).length === 0) {
      delete next[poolId]
    }

    expectedByPool.value = next
    save(next)
  }

  return { isExpected, setExpected }
}
