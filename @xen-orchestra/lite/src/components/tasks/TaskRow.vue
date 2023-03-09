<template>
  <tr class="finished-task-row" :class="{ finished: !isPending }">
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
      <UiProgressBar v-if="isPending" :max-value="1" :value="task.progress" />
    </td>
    <td>
      <RelativeTime v-if="isPending" :date="createdAt" />
      <template v-else>{{ $d(createdAt, "datetime_short") }}</template>
    </td>
    <td>
      <template v-if="finishedAt !== undefined">
        {{ $d(finishedAt, "datetime_short") }}
      </template>
      <RelativeTime
        v-else-if="isPending && estimatedEndAt !== Infinity"
        :date="estimatedEndAt"
      />
    </td>
  </tr>
</template>

<script lang="ts" setup>
import RelativeTime from "@/components/RelativeTime.vue";
import UiProgressBar from "@/components/ui/progress/UiProgressBar.vue";
import { parseDateTime } from "@/libs/utils";
import type { XenApiTask } from "@/libs/xen-api";
import { useHostStore } from "@/stores/host.store";
import { computed } from "vue";

const props = defineProps<{
  isPending?: boolean;
  task: XenApiTask;
}>();

const { getRecord: getHost } = useHostStore();

const createdAt = computed(() => parseDateTime(props.task.created));

const host = computed(() => getHost(props.task.resident_on));

const estimatedEndAt = computed(
  () =>
    createdAt.value +
    (new Date().getTime() - createdAt.value) / props.task.progress
);

const finishedAt = computed(() =>
  props.isPending ? undefined : parseDateTime(props.task.finished)
);
</script>

<style lang="postcss" scoped>
.finished {
  opacity: 0.5;
}
</style>
