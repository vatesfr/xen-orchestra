<template>
  <FormInput />
</template>

<script lang="ts" setup>
import { provide } from "vue";
import FormInput from "@/components/form/FormInput.vue";

provide("inputType", "textarea");
</script>

<style lang="postcss" scoped></style>
