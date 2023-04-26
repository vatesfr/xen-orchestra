<template>Chargement en cours...</template>

<script lang="ts" setup>
import { usePoolStore } from "@/stores/pool.store";
import { whenever } from "@vueuse/core";
import { useRouter } from "vue-router";

const router = useRouter();
const { pool } = usePoolStore().subscribe();

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
