<template>
  <nav class="vm-backup-archive-restore-files-breadcrumb" :aria-label="t('aria:breadcrumb:label')">
    <ol>
      <li v-for="(crumb, index) of crumbs" :key="index">
        <VtsResponsiveMenu v-if="crumb.type === 'ellipsis'" :title="t('hidden-folders')" placement="bottom-start">
          <template #trigger="{ open, isOpen, bindings }">
            <UiButtonIcon
              v-bind="bindings"
              :aria-label="t('show-hidden-folders')"
              icon="fa:ellipsis"
              accent="brand"
              size="small"
              :selected="isOpen"
              @click="open($event)"
            />
          </template>
          <MenuItem
            v-for="item of crumb.items"
            :key="item.depth"
            accent="neutral"
            icon="fa:folder-closed"
            @click="emit('navigate', item.depth)"
          >
            {{ item.label }}
          </MenuItem>
        </VtsResponsiveMenu>
        <UiButton
          v-else-if="!crumb.isLast"
          variant="tertiary"
          accent="brand"
          size="small"
          @click="emit('navigate', crumb.depth)"
        >
          {{ crumb.label }}
        </UiButton>
        <span v-else class="typo-body-bold-small" aria-current="location">{{ crumb.label }}</span>
        <VtsIcon v-if="index < crumbs.length - 1" name="fa:angle-right" size="small" />
      </li>
    </ol>
  </nav>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsResponsiveMenu from '@core/components/menu/VtsResponsiveMenu.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type Folder = { label: string; depth: number }

type Crumb = ({ type: 'folder' } & Folder & { isLast: boolean }) | { type: 'ellipsis'; items: Folder[] }

const { rootLabel, segments } = defineProps<{
  rootLabel: string
  segments: string[]
}>()

const emit = defineEmits<{
  navigate: [depth: number]
}>()

const MAX_VISIBLE_CRUMBS = 4

const { t } = useI18n()

const crumbs = computed<Crumb[]>(() => {
  const folders: Folder[] = [
    { label: rootLabel, depth: 0 },
    ...segments.map((segment, index) => ({ label: segment, depth: index + 1 })),
  ]

  const visibleFolders = folders.length > MAX_VISIBLE_CRUMBS ? [folders[0], null, ...folders.slice(-2)] : folders

  return visibleFolders.map((folder, index) =>
    folder === null
      ? { type: 'ellipsis', items: folders.slice(1, -2) }
      : { type: 'folder', ...folder, isLast: index === visibleFolders.length - 1 }
  )
})
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-files-breadcrumb {
  ol {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
}
</style>
