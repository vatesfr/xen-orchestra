import { whenever } from "@vueuse/core";
import { ref } from "vue";

type ModalOptions = {
  onBeforeClose?: () => boolean;
  onClose?: () => void;
};

export default function useModal<T>(options: ModalOptions = {}) {
  const payload = ref<T>();
  const isOpen = ref(false);

  const open = (currentPayload?: T) => {
    isOpen.value = true;
    payload.value = currentPayload;
  };

  const close = () => {
    isOpen.value = false;
  };

  whenever(
    () => !isOpen.value,
    () => {
      if (options.onBeforeClose?.() === false) {
        isOpen.value = true;
        return;
      }

      options.onClose?.();
      payload.value = undefined;
    },
    { flush: "pre" }
  );

  return {
    payload,
    isOpen,
    open,
    close,
  };
}
