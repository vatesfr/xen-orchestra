<template>No subscription</template>

<script lang="ts" setup>
import { onBeforeRouteLeave } from 'vue-router'

// eslint-disable-next-line no-console
onBeforeRouteLeave(() => console.log('-'.repeat(20)))
</script>
