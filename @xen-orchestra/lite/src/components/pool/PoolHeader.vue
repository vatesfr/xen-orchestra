<template>
  <TitleBar :icon="faBuilding">
    {{ name }}
  </TitleBar>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { faBuilding } from "@fortawesome/free-regular-svg-icons";
import TitleBar from "@/components/TitleBar.vue";
import { usePoolStore } from "@/stores/pool.store";

const poolStore = usePoolStore();
const name = computed(() => poolStore.pool?.name_label ?? "...");
</script>
