```vue-template
<UiModal v-model="isOpen">
  <FormModalLayout :icon="faShip" @submit.prevent="handleSubmit">
    <template #title>Migrate 3 VMs/template>

    <template #default>
      <!-- Form content goes here... -->
    </template>

    <template #buttons>
      <UiButton outlined @click="close">Cancel</UiButton>
      <UiButton type="submit">Migrate 3 VMs</UiButton>
    </template>
  </ConfirmModalLayout>
</UiModal>
```

```vue-script
const { isOpen, close } = useModal();

const handleSubmit = async () => {
  // Handling form submission...
  close();
}
```
