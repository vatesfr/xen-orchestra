# Usage

Open the modal with `useErrorModal`.

```vue-script
import { useErrorModal } from '@core/composables/modals/use-error-modal.ts'

const { open: openErrorModal } = useErrorModal()

try {
  // ...
} catch (error) {
  void openErrorModal({
    props: {
      title: 'Unable to create cluster',
      error: 'An error occurred',
      details: error,
    },
  })
}
```

The `details` prop is displayed below the message, even when the `content` slot is overridden:

```vue-template
<VtsErrorModal title="Unable to delete network" :details @close="close()">
  <template #content>Custom error message</template>
</VtsErrorModal>
```
