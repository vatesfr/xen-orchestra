```vue-template
<button @click="open">Delete all items</button>

<UiModal v-if="isOpen" @close="close" :icon="faRemove">
  <template #title>You are about to delete 12 items</template>
  <template #subtitle>They'll be gone forever</template>
  <template #buttons>
    <UiButton @click="delete" color="error">Yes, delete</UiButton>
    <UiButton @click="close">Cancel</UiButton>
  </template>
</UiModal>
```

```vue-script
import { faRemove } from "@fortawesome/free-solid-svg-icons";
import { useModal } from "@composable/modal.composable";

const { open, close, isOpen } = useModal().
```
