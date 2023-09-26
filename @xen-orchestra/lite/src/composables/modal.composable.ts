import { computed, readonly, ref } from "vue";

type ModalOptions = {
  confirmClose?: () => boolean;
  onClose?: () => void;
};

export default function useModal<T>(options: ModalOptions = {}) {
  const $payload = ref<T>();
  const $isOpen = ref(false);

  const open = (payload?: T) => {
    $isOpen.value = true;
    $payload.value = payload;
  };
  const close = (force = false) => {
    if (!force && options.confirmClose?.() === false) {
      return;
    }

    if (options.onClose) {
      options.onClose();
    }

    $isOpen.value = false;
    $payload.value = undefined;
  };

  const isOpen = computed({
    get() {
      return $isOpen.value;
    },
    set(value) {
      if (value) {
        open();
      } else {
        close();
      }
    },
  });

  return {
    payload: readonly($payload),
    isOpen,
    open,
    close,
  };
}
