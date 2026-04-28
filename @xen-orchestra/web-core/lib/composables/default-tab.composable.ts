import { watch } from 'vue'
import { type RouteLocationRaw, type RouteRecordName, useRoute, useRouter } from 'vue-router'

const TAB_MEMORY_DISPATCHER = 'tab-memory.dispatcher'
const TAB_MEMORY_LAST = 'tab-memory.last'

export function useDefaultTab(dispatcherRouteName: RouteRecordName & string, defaultTab: string) {
  const router = useRouter()
  const route = useRoute()

  // TODO: Delete after 2 to 3 months (once all users have cleared their local storage)
  localStorage.removeItem('default-tabs')

  watch(
    () => route.name as string,
    name => {
      if (name === dispatcherRouteName) {
        const isSameDispatcher = localStorage.getItem(TAB_MEMORY_DISPATCHER) === dispatcherRouteName
        const tabName = (isSameDispatcher ? localStorage.getItem(TAB_MEMORY_LAST) : null) ?? defaultTab
        void router.replace({ name: `${dispatcherRouteName}/${tabName}` } as RouteLocationRaw)
      } else if (!name.startsWith(dispatcherRouteName)) {
        return
      }

      const tab = name.slice(dispatcherRouteName.length).split('/')[1] ?? defaultTab

      localStorage.setItem(TAB_MEMORY_DISPATCHER, dispatcherRouteName)
      localStorage.setItem(TAB_MEMORY_LAST, tab)
    },
    { immediate: true }
  )
}
