<template>
  <tr class="finished-task-row">
    <td>{{ task.name_label }}</td>
    <td>
      <RouterLink
        :to="{
          name: 'host.dashboard',
          params: { uuid: host.uuid },
        }"
      >
        {{ host.name_label }}
      </RouterLink>
    </td>
    <td></td>
    <td>
      {{ $d(createdAt, "datetime_short") }}
    </td>
    <td></td>
  </tr>
</template>

<script lang="ts" setup>
import { parseDateTime } from "@/libs/utils";
import type { XenApiTask } from "@/libs/xen-api";
import { useHostStore } from "@/stores/host.store";
import { computed } from "vue";

const props = defineProps<{
  task: XenApiTask;
}>();

const { getRecord: getHost } = useHostStore();

const createdAt = computed(() => parseDateTime(props.task.created));

const host = computed(() => getHost(props.task.resident_on));
</script>

<style lang="postcss" scoped>
.finished-task-row {
  opacity: 0.5;
}
</style>
