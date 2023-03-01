<template>
  <FormCheckbox />
</template>

<script lang="ts" setup>
import { provide } from "vue";
import FormCheckbox from "@/components/form/FormCheckbox.vue";

provide("inputType", "radio");
</script>
