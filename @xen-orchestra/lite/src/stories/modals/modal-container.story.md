A basic modal container containing 3 slots: `header`, `default` and `footer`.

Color can be changed with the `color` prop.

To keep the content centered vertically, header and footer will always have the same height.

Modal content has a max height + overflow to prevent the modal growing out of the screen.

Modal containers can be nested.

```vue-template
<ModalContainer>
  <template #header>Header</template>
  <template #default>Content</template>
  <template #header>Footer</template>
</ModalContainer>
```
