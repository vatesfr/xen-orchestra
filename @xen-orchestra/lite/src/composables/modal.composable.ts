import { ref } from "vue";

export default function useModal() {
  const $payload = ref();
  const $isOpen = ref(false);

  const open = (payload?: any) => {
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
