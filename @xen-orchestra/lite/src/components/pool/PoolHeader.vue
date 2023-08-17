<template>
  <TitleBar :icon="faBuilding">
    {{ name }}
  </TitleBar>
</template>

<script lang="ts" setup>
import { usePoolCollection } from "@/composables/xen-api-collection/pool-collection.composable";
import { computed } from "vue";
import { faBuilding } from "@fortawesome/free-regular-svg-icons";
import TitleBar from "@/components/TitleBar.vue";

const { pool } = usePoolCollection();

const name = computed(() => pool.value?.name_label ?? "...");
</script>
