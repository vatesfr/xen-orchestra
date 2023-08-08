<template>Chargement en cours...</template>

<script lang="ts" setup>
import { usePoolCollection } from "@/composables/xen-api-collection/pool-collection.composable";
import { whenever } from "@vueuse/core";
import { useRouter } from "vue-router";

const router = useRouter();

const { pool } = usePoolCollection();

whenever(
  () => pool.value?.uuid,
  (poolUuid) =>
    router.push({
      name: "pool.dashboard",
      params: { uuid: poolUuid },
    }),
  { immediate: true }
);
</script>
