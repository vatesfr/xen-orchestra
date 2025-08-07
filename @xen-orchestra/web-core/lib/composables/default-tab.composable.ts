import { useLocalStorage } from '@vueuse/core'
import { watch } from 'vue'
import { type RouteLocationRaw, type RouteRecordName, useRoute, useRouter } from 'vue-router'

export function useDefaultTab(dispatcherRouteName: RouteRecordName & string, defaultTab: string) {
  const storage = useLocalStorage('default-tabs', new Map<string, string>())
  const router = useRouter()
  const route = useRoute()

  watch(
    () => route.name as string,
    name => {
      if (name === dispatcherRouteName) {
        const tabName = storage.value.get(dispatcherRouteName) ?? defaultTab
        void router.replace({ name: `${dispatcherRouteName}/${tabName}` } as RouteLocationRaw)
      } else if (!name.startsWith(dispatcherRouteName)) {
        return
      }

      const tab = name.slice(dispatcherRouteName.length).split('/')[1] ?? defaultTab

      storage.value.set(dispatcherRouteName, tab)
    },
    { immediate: true }
  )
}
