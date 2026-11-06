<template>
  <nav class="vdf-firewall-nav" :class="{ collapsed: isCollapsed }" :aria-label="t('firewall:nav')">
    <!-- the nav runs the page's length; its list stays in view -->
    <div class="sticky">
      <div v-for="(section, index) of sections" :key="section.label" class="section">
        <div class="heading-row">
          <span class="heading typo-caption-small">{{ section.label }}</span>
          <!-- first, open or folded, as XO's tree has its pin; below --small, always folded -->
          <UiButtonIcon
            v-if="index === 0 && !isSmall"
            v-tooltip="{ content: toggleLabel, placement: 'right' }"
            class="toggle"
            :icon="isCollapsed ? 'fa:angle-double-right' : 'fa:angle-double-left'"
            :aria-label="toggleLabel"
            :aria-expanded="!isCollapsed"
            size="small"
            accent="brand"
            @click="toggle()"
          />
        </div>
        <RouterLink v-for="page of section.pages" :key="page.label" v-slot="{ href, navigate }" :to="page.to" custom>
          <a
            v-tooltip="isCollapsed ? { content: page.label, placement: 'right' } : false"
            :href
            class="item typo-body-regular"
            :class="{ active: page.names.includes(String(route.name)) }"
            :aria-current="page.names.includes(String(route.name)) ? 'page' : undefined"
            :aria-label="isCollapsed ? page.label : undefined"
            @click="navigate"
          >
            <VtsIcon :name="page.icon" size="medium" />
            <span class="label">{{ page.label }}</span>
          </a>
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { useVdfFirewallPages } from '@/modules/vdf/composables/vdf-firewall-pages.composable.ts'
import type { VdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useLocalStorage, useMediaQuery } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

// The Firewall's pages as a list beside them, as vSphere lists Configure's:
// a second row of tabs under the pool's read as the same level. Open by
// default, labels read (a new section to most, icons alone say little):
// the user may fold it to a rail of icons, their label on hover, giving
// its width back to the pages, and that choice is kept. Below --small,
// always folded.
const { scope } = defineProps<{
  scope: VdfScope
}>()

const { t } = useI18n()

const route = useRoute()

const { sections } = useVdfFirewallPages(() => scope)

// as --small (web-core's .globals.pcss): always folded
const isSmall = useMediaQuery('(max-width: 1023px)')

// open unless the user folded it
const preference = useLocalStorage<'open' | 'folded'>('vdf-firewall-nav', 'open')

const isCollapsed = computed(() => isSmall.value || preference.value === 'folded')

const toggleLabel = computed(() => (isCollapsed.value ? t('firewall:nav:expand') : t('firewall:nav:collapse')))

function toggle() {
  preference.value = isCollapsed.value ? 'open' : 'folded'
}
</script>

<style lang="postcss" scoped>
.vdf-firewall-nav {
  flex-shrink: 0;
  width: 20rem;
  border-inline-end: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
  transition: width 0.15s ease;

  .sticky {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    padding: 1.6rem 0.8rem;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .heading-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    min-height: 2.4rem;
    padding: 0 0 0.4rem 0.8rem;
  }

  .heading {
    color: var(--color-neutral-txt-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 0.8rem;
    border-radius: 0.8rem;
    color: var(--color-neutral-txt-primary);
    text-decoration: none;
    white-space: nowrap;

    &:hover {
      background-color: var(--color-brand-background-hover);
    }

    &:active {
      background-color: var(--color-brand-background-active);
    }

    &.active {
      background-color: var(--color-brand-background-selected);
      color: var(--color-brand-txt-base);
    }

    &:focus-visible {
      outline: 0.2rem solid var(--color-brand-txt-base);
      outline-offset: -0.2rem;
    }
  }

  /* folded: a rail of icons, labels on hover */
  &.collapsed {
    width: 5.6rem;

    .sticky {
      align-items: center;
      padding-inline: 0.4rem;
    }

    .heading,
    .label {
      display: none;
    }

    .section + .section {
      padding-block-start: 1.6rem;
      border-block-start: 0.1rem solid var(--color-neutral-border);
    }

    .heading-row {
      justify-content: center;
      padding-inline: 0;
    }

    /* the toggle's row only, atop the rail */
    .section + .section .heading-row {
      display: none;
    }
  }
}
</style>
