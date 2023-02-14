When using a `string` as `before` or `after` prop, you will probably have to set `before-width` and `after-width` accordingly.

```vue-template
<FormInput
  v-model="myValue"
  color="error"
  :before="before"
  :after="after"
  :before-width="beforeWidth"
  :after-width="afterWidth"
  right
  disabled
  :wrapper-attrs="wrapperAttrs"
/>
```
