# Usage

Enter or comma adds the typed value: it is trimmed, and an empty value or a value already in the list is ignored. A
pasted comma-separated draft adds each of its values. Enter while an IME composition is in progress adds nothing.

Removing a chip updates the model with the new array.

The label comes from the surrounding `VtsInputWrapper`.

```vue-template
<VtsInputWrapper label="Values">
  <VtsTagsInput v-model="values" accent="brand" placeholder="Add a value" />
</VtsInputWrapper>
```
