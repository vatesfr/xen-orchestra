```vue-template
<UiModal @submit.prevent="approve()">
  <ConfirmModalLayout :icon="faShip">
    <template #title>Do you confirm?</template>
    <template #subtitle>You should be sure about this</template>
    <template #buttons>
      <ModalDeclineButton>I prefer not</UiButton>
      <ModalApproveButton>Yes, I'm sure!</UiButton>
    </template>
  </ConfirmModalLayout>
</UiModal>
```

```vue-script
import { IK_MODAL } from "@/types/injection-keys";

const { approve } = inject(IK_MODAL)!;
```
