import { useTimeoutPoll } from '@vueuse/core'
import type { MaybeRefOrGetter } from '@vueuse/shared'
// eslint-disable-next-line import/namespace,import/default,import/no-named-as-default,import/no-named-as-default-member -- https://github.com/pamelafox/ndjson-readablestream/pull/13
import readNDJSONStream from 'ndjson-readablestream'
import { computed, isRef, toValue, watch } from 'vue'

export function defineRequest<TState>(options: {
  url: string
  state: () => TState
  onDataReceived: (state: TState, data: unknown) => void
}): () => TState

export function defineRequest<TArgs extends any[], TState>(options: {
  url: (...args: TArgs) => string
  state: () => TState
  onDataReceived: (state: TState, data: unknown) => void
  onUrlChange: (state: TState) => void
}): (...args: { [K in keyof TArgs]: MaybeRefOrGetter<TArgs[K]> }) => TState

export function defineRequest<TArgs extends any[], TState>(options: {
  url: string | ((...args: TArgs) => string)
  state: () => TState
  onDataReceived: (state: TState, data: unknown) => void
  onUrlChange?: (state: TState) => void
}) {
  return function useRequest(...args: { [K in keyof TArgs]: MaybeRefOrGetter<TArgs[K]> }) {
    const urlOption = options.url

    const url = typeof urlOption === 'function' ? computed(() => urlOption(...(args.map(toValue) as TArgs))) : urlOption

    const state = options.state()

    async function execute() {
      const response = await fetch(toValue(url))

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('Response body is empty')
      }

      for await (const event of readNDJSONStream(response.body)) {
        options.onDataReceived(state, event)
      }
    }

    const { resume, pause } = useTimeoutPoll(execute, 10000, {
      immediate: true,
      immediateCallback: true,
    })

    if (isRef(url)) {
      watch(url, () => {
        pause()
        options.onUrlChange?.(state)
        resume()
      })
    }

    return state
  }
}
