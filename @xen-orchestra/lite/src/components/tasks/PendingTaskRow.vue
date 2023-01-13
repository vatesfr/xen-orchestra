<template>
  <tr class="pending-task-row">
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
    <td>
      <UiProgressBar :max-value="1" :value="task.progress" />
    </td>
    <td>
      <RelativeTime :date="createdAt" />
    </td>
    <td>
      <RelativeTime v-if="estimatedEndAt !== Infinity" :date="estimatedEndAt" />
    </td>
  </tr>
</template>

<script lang="ts" setup>
import RelativeTime from "@/components/RelativeTime.vue";
import UiProgressBar from "@/components/ui/UiProgressBar.vue";
import { parseDateTime } from "@/libs/utils";
import type { XenApiTask } from "@/libs/xen-api";
import { useHostStore } from "@/stores/host.store";
import { computed } from "vue";

const props = defineProps<{
  task: XenApiTask;
}>();

const { getRecord: getHost } = useHostStore();

const createdAt = computed(() => parseDateTime(props.task.created));

const estimatedEndAt = computed(
  () =>
    createdAt.value +
    (new Date().getTime() - createdAt.value) / props.task.progress
);

const host = computed(() => getHost(props.task.resident_on));
</script>

<style lang="postcss" scoped></style>
