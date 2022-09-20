import { ref } from "vue";

export default function useModal<T>() {
  const $payload = ref<T>();
  const $isOpen = ref(false);

  const open = (payload?: T) => {
    $isOpen.value = true;
    $payload.value = payload;
  };

  const close = () => {
    $isOpen.value = false;
    $payload.value = undefined;
  };

  return {
    payload: $payload,
    isOpen: $isOpen,
    open,
    close,
  };
}
