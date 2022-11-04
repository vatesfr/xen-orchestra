# useFetchStats composable

```vue
<div>
  <p v-for="(stat, index) in stats" :key="index">
    {{ stat.name }}
  </p>
</div>
<script lang="ts" setup>
import { onMounted } from "vue";
import useFetchStats from "@/composables/fetch-stats-composable";
import { GRANULARITY, type HostStats, type VmStats } from "@/libs/xapi-stats";

const vmStore = useVmStore();

const { register, unregister, stats } = useFetchStats<XenApiVm, VmStats>(
  "vm",
  GRANULARITY.Seconds
);

onMounted(() => {
  vmStore.allRecords.forEach(register);
});
</script>
```
