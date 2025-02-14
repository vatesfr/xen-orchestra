```vue-template
<UiModal @submit.prevent="handleSubmit()">
  <FormModalLayout :icon="faShip">
    <template #title>Migrate 3 VMs/template>

    <template #default>
      <!-- Form content goes here... -->
    </template>

    <template #buttons>
      <ModalDeclineButton />
      <ModalApproveButton>Migrate 3 VMs</ModalApproveButton>
    </template>
  </FormModalLayout>
</UiModal>
```

```vue-script
import { IK_MODAL } from "@/types/injection-keys";

const { approve } = inject(IK_MODAL)!;

const migrate = async () => {
  // Do the migration...
}

const handleSubmit = () => {
  approve(migrate());
}
```
