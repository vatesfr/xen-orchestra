# useBusy composable

```vue
<template>
  <span class="error" v-if="error">{{ error }}</span>
  <button @click="run" :disabled="isBusy">Do something</button>
</template>

<script lang="ts" setup>
import useBusy from "@/composables/busy.composable";

async function doSomething() {
  try {
    // Doing some async work
  } catch (e) {
    throw "Something bad happened";
  }
}

const { isBusy, error, run } = useBusy(doSomething);
</script>
```
