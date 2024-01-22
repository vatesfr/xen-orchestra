import { useTitle } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, type MaybeRefOrGetter, onBeforeUnmount, reactive, toRef, watch } from 'vue'

const PAGE_TITLE_SUFFIX = 'XO Lite'

interface PageTitleConfig {
  object: { name_label: string } | undefined
  title: string | undefined
  count: number | undefined
}

export const usePageTitleStore = defineStore('page-title', () => {
  const pageTitleConfig = reactive<PageTitleConfig>({
    count: undefined,
    title: undefined,
    object: undefined,
  })

  const generatedPageTitle = computed(() => {
    const { object, title, count } = pageTitleConfig
    const parts = []

    if (count !== undefined && count > 0) {
      parts.push(`(${count})`)
    }

    if (title !== undefined && object !== undefined) {
      parts.push(`${title} - ${object.name_label}`)
    } else if (title !== undefined) {
      parts.push(title)
    } else if (object !== undefined) {
      parts.push(object.name_label)
    }

    if (parts.length === 0) {
      return undefined
    }

    return parts.join(' ')
  })

  useTitle(generatedPageTitle, {
    titleTemplate: computed(() =>
      generatedPageTitle.value === undefined ? PAGE_TITLE_SUFFIX : `%s - ${PAGE_TITLE_SUFFIX}`
    ),
  })

  const setPageTitleConfig = <T extends keyof PageTitleConfig>(
    configKey: T,
    value: MaybeRefOrGetter<PageTitleConfig[T]>
  ) => {
    const stop = watch(toRef(value), newValue => (pageTitleConfig[configKey] = newValue as PageTitleConfig[T]), {
      immediate: true,
    })

    onBeforeUnmount(() => {
      stop()
      pageTitleConfig[configKey] = undefined
    })
  }

  const setObject = (object: MaybeRefOrGetter<{ name_label: string } | undefined>) =>
    setPageTitleConfig('object', object)

  const setTitle = (title: MaybeRefOrGetter<string | undefined>) => setPageTitleConfig('title', title)

  const setCount = (count: MaybeRefOrGetter<number | undefined>) => setPageTitleConfig('count', count)

  return {
    setObject,
    setTitle,
    setCount,
  }
})
