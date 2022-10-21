# useRedirectIfNotFound

```vue
<script lang="ts" setup>
const hostStore = useHostStore();

useRedirectIfNotFound(
  () => hostStore.isReady,
  (route) =>
    hostStore.getRecordByUuid(route.params.uuid as string) !== undefined,
  "notFound"
);
</script>
```
