import { type MaybeRef, ref, unref } from 'vue'

export function useAction<THandler extends (...args: any[]) => any>(config: {
  handler: MaybeRef<THandler>
  onSuccess?: MaybeRef<undefined | ((result: ReturnType<THandler>) => void)>
  onError?: MaybeRef<undefined | ((error: any) => void)>
}) {
  const isBusy = ref(false)

  async function run(...args: Parameters<THandler>) {
    isBusy.value = true

    try {
      const result = await unref(config.handler)(...args)

      unref(config.onSuccess)?.(result)
    } catch (error) {
      if (config.onError) {
        unref(config.onError)?.(error)
      } else {
        throw error
      }
    } finally {
      isBusy.value = false
    }
  }

  return {
    isBusy,
    run,
  }
}
