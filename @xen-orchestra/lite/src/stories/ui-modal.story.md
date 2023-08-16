This component is meant to be used with `useModal` composable.

```vue-template
<button @click="open">Delete all items</button>

<UiModal v-model="isOpen">
  <ModalContainer...>
  <!-- <ModalContainer...> (Multiple container can be used if needed) -->
</UiModal>
```

```vue-script
import { faRemove } from "@fortawesome/free-solid-svg-icons";
import { useModal } from "@composable/modal.composable";

const { open, close, isOpen } = useModal().
```
