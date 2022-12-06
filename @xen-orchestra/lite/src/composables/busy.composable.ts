import { ref } from "vue";

export default function useBusy<T extends (...args: any[]) => any>(func: T) {
  const isBusy = ref(false);
  const error = ref<any>();

  const run = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    error.value = undefined;
    isBusy.value = true;

    try {
      return await func(...args);
    } catch (_error) {
      error.value = _error;
      throw _error;
    } finally {
      isBusy.value = false;
    }
  };

  return {
    isBusy,
    error,
    run,
  };
}
