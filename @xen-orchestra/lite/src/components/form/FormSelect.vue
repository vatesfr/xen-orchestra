<template>
  <FormInput>
    <slot />
  </FormInput>
</template>

<script lang="ts" setup>
import { provide } from "vue";
import FormInput from "@/components/form/FormInput.vue";

provide("isSelect", true);
</script>

<style lang="postcss" scoped></style>
