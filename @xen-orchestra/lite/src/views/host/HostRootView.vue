<template>
  <RedirectIfNotFound object-type="host">
    <RouterView />
  </RedirectIfNotFound>
</template>

<script lang="ts" setup>
import RedirectIfNotFound from "@/components/RedirectIfNotFound.vue";
</script>
