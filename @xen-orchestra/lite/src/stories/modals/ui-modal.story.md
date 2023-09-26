This component only handle the modal backdrop and content positioning.

You can use any pre-made layouts, create your own or use the `ModalContainer` component.

It is meant to be used with `useModal` composable.

```vue-template
<button @click="open">Delete all items</button>

<UiModal v-model="isOpen">
  <ModalContainer...>
  <!-- <ConfirmModalLayout ...> (Or you can use a pre-made layout) -->
</UiModal>
```

```vue-script
import { faRemove } from "@fortawesome/free-solid-svg-icons";
import { useModal } from "@composable/modal.composable";

const { open, close, isOpen } = useModal().
```
