<template>
  <div class="json-schema-examples">
    <div v-if="isCollapsible">
      <UiButton variant="tertiary" accent="brand" size="small" @click="isExpanded = !isExpanded">
        {{ isExpanded ? t('json-schema:hide-examples') : t('json-schema:show-examples-n', examplesCount) }}
      </UiButton>
    </div>
    <template v-if="areExamplesVisible">
      <div v-for="(group, index) of groups" :key="index" class="group">
        <JsonSchemaText
          v-if="group.caption !== undefined"
          :text="group.caption"
          class="caption typo-body-regular-small"
        />
        <div class="values">
          <UiButton
            v-for="value of group.values"
            :key="value"
            variant="secondary"
            accent="brand"
            size="small"
            @click="emit('pick', value)"
          >
            {{ value }}
          </UiButton>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import JsonSchemaText from '@/modules/plugin/components/json-schema-form/JsonSchemaText.vue'
import type { JsonSchemaExampleGroup } from '@/modules/plugin/utils/json-schema-description.util.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { groups } = defineProps<{
  groups: JsonSchemaExampleGroup[]
}>()

const emit = defineEmits<{
  pick: [value: string]
}>()

const MAX_VISIBLE_EXAMPLES = 2

const { t } = useI18n()

const examplesCount = computed(() => groups.reduce((count, group) => count + group.values.length, 0))

const isCollapsible = computed(() => examplesCount.value > MAX_VISIBLE_EXAMPLES)

const isExpanded = ref(false)

const areExamplesVisible = computed(() => !isCollapsible.value || isExpanded.value)
</script>

<style lang="postcss" scoped>
.json-schema-examples {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .caption {
    color: var(--color-neutral-txt-secondary);
  }

  .values {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
}
</style>
