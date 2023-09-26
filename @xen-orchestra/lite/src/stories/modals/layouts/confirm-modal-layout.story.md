```vue-template
<UiModal v-model="isOpen">
  <ConfirmModalLayout :icon="faShip">
    <template #title>Do you confirm?</template>
    <template #subtitle>You should be sure about this</template>
    <template #buttons>
      <UiButton outlined @click="close">I prefer not</UiButton>
      <UiButton @click="accept">Yes, I'm sure!</UiButton>
    </template>
  </ConfirmModalLayout>
</UiModal>
```

```vue-script
const { isOpen, close } = useModal();

const accept = async () => {
  // do something
  close();
}
```
