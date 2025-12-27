<template>
  <UiCard class="vts-query-builder-group" :class="[{ root, highlighted }, item.operator]">
    <div class="group">
      <div class="header">
        <VtsSelect :id="groupOperatorSelectId" class="group-operator" accent="brand" />
        <MenuList v-if="!root" placement="bottom-end">
          <template #trigger="{ open }">
            <UiButtonIcon size="medium" accent="brand" icon="fa:ellipsis" @click="open" />
          </template>
          <MenuItem @click="emit('duplicate')">{{ t('action:duplicate') }}</MenuItem>
          <MenuItem @click="emit('remove', true)">{{ t('action:move-filters-to-parent-group') }}</MenuItem>
          <MenuItem @click="emit('remove')">{{ t('action:delete-group') }}</MenuItem>
        </MenuList>
      </div>
      <div class="content">
        <VtsQueryBuilderRow
          v-for="(child, index) of item.children"
          :key="child.id"
          v-model:node="item.children[index]"
          v-model:operator="item.operator"
          :index
          @convert-to-group="item.convertChildToGroup(index)"
          @remove="keepChildren => item.removeChild(index, keepChildren)"
          @duplicate="item.duplicateChild(index)"
        />
        <div class="add-child-buttons">
          <VtsQueryBuilderTreeLine last />
          <div class="buttons">
            <UiButton variant="secondary" size="small" accent="brand" icon="fa:ellipsis" @click="item.addChildFilter()">
              {{ t('action:add-filter') }}
            </UiButton>
            <UiButton variant="secondary" size="small" accent="brand" icon="fa:ellipsis" @click="item.addChildGroup()">
              {{ t('action:add-group') }}
            </UiButton>
          </div>
        </div>
      </div>
    </div>
    <div v-if="root && item.children.length > 1" class="group-filters-button">
      <UiButton variant="secondary" size="small" accent="brand" icon="fa:ellipsis" @click="item.wrapInGroup()">
        {{ item.operator === 'and' ? t('action:plus-or') : t('action:plus-and') }}
      </UiButton>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsQueryBuilderRow from '@core/components/query-builder/VtsQueryBuilderRow.vue'
import VtsQueryBuilderTreeLine from '@core/components/query-builder/VtsQueryBuilderTreeLine.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useFormSelect } from '@core/packages/form-select'
import type { QueryBuilderGroup } from '@core/packages/query-builder/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  root?: boolean
  highlighted?: boolean
}>()

const emit = defineEmits<{
  duplicate: []
  remove: [keepChildren?: boolean]
}>()

const item = defineModel<QueryBuilderGroup>({ required: true })

const { t } = useI18n()

const { id: groupOperatorSelectId } = useFormSelect(['and', 'or'], {
  model: computed({
    get: () => item.value.operator,
    set: value => {
      item.value.operator = value
    },
  }),
  option: {
    label: (option: string) => (option === 'and' ? t('and') : t('or')),
  },
})
</script>

<style lang="postcss" scoped>
.vts-query-builder-group {
  padding: 0;
  border: none;

  &.root {
    margin-block-end: 1.4rem;
  }

  &.and {
    --main-color: var(--color-brand-item-active);
    --secondary-color: var(--color-brand-background-selected);
  }

  &.or {
    --main-color: var(--color-success-item-active);
    --secondary-color: var(--color-success-background-selected);
  }

  .group-operator:deep(.ui-input) {
    padding-inline: 0.6rem;
    gap: 0.6rem;
  }

  .group {
    position: relative;
    border: 0.1rem solid var(--main-color);
    background-color: var(--secondary-color);

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.3rem;
      background-color: var(--main-color);
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .content {
      display: flex;
      flex-direction: column;
      padding-block-end: 0.5rem;
      padding-inline-start: 0.6rem;
      max-width: 100%;
    }
  }

  .add-child-buttons {
    display: flex;

    & > .buttons {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      background-color: #00000010;
      padding: 0.3rem;
      border-radius: 0.3rem;
    }
  }

  .group-filters-button {
    position: absolute;
    bottom: -1.4rem;
    right: 0.5rem;
  }
}
</style>
