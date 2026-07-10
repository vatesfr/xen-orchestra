<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    full-width-component
    :params="[
      prop('side').enum('left', 'right').default('left').widget().help('Which side of the layout the sidebar occupies'),
      prop('showLock').bool().default(true).widget().help('Show the lock/unlock button'),
      slot('header').help('Optional area above the content'),
      slot('subheader').help('Optional area between the header and the content'),
      slot().help('Main scrollable sidebar content'),
      slot('footer').help('Optional area below the content'),
      setting('showHeader').widget(boolean()).preset(false).help('Render the header slot'),
      setting('showSubheader').widget(boolean()).preset(false).help('Render the subheader slot'),
      setting('showFooter').widget(boolean()).preset(false).help('Render the footer slot'),
      setting('longContent').widget(boolean()).preset(false).help('Add a lot of content to test contentscrolling'),
    ]"
    :presets="{
      Left: { props: { side: 'left' } },
      Right: { props: { side: 'right' } },
    }"
  >
    <UiButtonIcon
      v-tooltip="{
        content: isExpanded(properties.side) ? t('action:sidebar-close') : t('action:sidebar-open'),
        placement: 'right',
      }"
      accent="brand"
      size="medium"
      icon="fa:bars"
      @click="toggleExpand(properties.side)"
    />
    <div class="layout" :class="`side--${properties.side}`">
      <VtsLayoutSidebar :side="properties.side" :show-lock="properties.showLock" class="sidebar">
        <template v-if="settings.showHeader" #header>
          <div class="slot-header">Sidebar header</div>
        </template>
        <template v-if="settings.showSubheader" #subheader>
          <div class="slot-subheader">
            <div class="sidebar-search">
              <UiInput
                v-model="search"
                :aria-label="t('action:search-treeview')"
                right-icon="fa:magnifying-glass"
                :placeholder="t('action:search-treeview')"
                accent="brand"
                clearable
              />
            </div>
          </div>
        </template>
        <div class="slot-content">
          <p>Sidebar content</p>
          <template v-if="settings.longContent">
            <p>
              Id provident hic repellendus. Atque repellendus amet eum nam. Quas laboriosam praesentium ratione non
              voluptas occaecati optio qui. Beatae vel reiciendis et non non dolorum consequatur. Ratione nisi rem aut
              sint aut molestiae sit. Soluta voluptatem unde ullam in dolorem nisi corporis.
            </p>
            <p>
              Quae et voluptas cupiditate dolorum. Ullam labore veniam vel. Sint quo et ut cum aut aspernatur sit natus.
              Aspernatur culpa quia aliquam vel voluptatem animi. Ratione animi omnis repellendus ut tempora temporibus
              quaerat illo.
            </p>
            <p>
              In nostrum maiores itaque consequuntur sit. Facere qui qui autem debitis ratione eos natus facilis. Omnis
              nam ipsam et voluptate doloremque facere. Ut eos delectus aut qui qui eos illum voluptatem. Mollitia eius
              sapiente aut est.
            </p>
          </template>
        </div>
        <template v-if="settings.showFooter" #footer>
          <div class="slot-footer">Sidebar footer</div>
        </template>
      </VtsLayoutSidebar>
      <main class="main">
        <UiCard class="card">
          <UiCardTitle>VtsLayoutSidebar Demo</UiCardTitle>
          <p>Use the burger button to expand/collapse the sidebar.</p>
          <p>Click and drag the inner edge of the sidebar to resize it (desktop only).</p>
          <div>
            <p>Use the lock/unlock button in the sidebar header to switch behavior (desktop only):</p>
            <ul>
              <li>Locked: The sidebar will shrink the main content area when expanded</li>
              <li>Unlocked: The sidebar will slide over the main content area when expanded</li>
            </ul>
          </div>
          <p>
            Both sidebars can coexist in the same layout, and they each have their own locked/expanded states (not shown
            in this demo).
          </p>
        </UiCard>
      </main>
    </div>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, setting, slot } from '@/libs/story/story-param'
import { boolean } from '@/libs/story/story-widget'
import VtsLayoutSidebar from '@core/components/layout/VtsLayoutSidebar.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { type SidebarSide, useLeftSidebarStore, useRightSidebarStore } from '@core/packages/sidebar'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const search = ref('')

const leftSidebar = useLeftSidebarStore()
const rightSidebar = useRightSidebarStore()

function getSidebar(side: SidebarSide) {
  return side === 'right' ? rightSidebar : leftSidebar
}

function isExpanded(side: SidebarSide) {
  return getSidebar(side).isExpanded
}

function toggleExpand(side: SidebarSide) {
  getSidebar(side).toggleExpand()
}
</script>

<style lang="postcss" scoped>
.layout {
  position: relative;
  display: flex;
  height: 50rem;
  overflow: hidden;
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.4rem;
}

.layout.side--right {
  flex-direction: row-reverse;
}

.sidebar {
  flex-shrink: 0;
  height: 50rem;
}

.sidebar-search {
  padding: 0.4rem;
}

.card {
  background-color: var(--color-info-background-selected);

  ul {
    list-style: disc;
    padding-inline-start: 1.6rem;
    margin-block-start: 0.8rem;
  }
}

.main {
  flex: 1;
  overflow: auto;
  padding: 1.6rem;
  background-color: var(--color-neutral-background-primary);
}

.slot-header,
.slot-footer {
  padding: 1.2rem 1.6rem;
}

.slot-content {
  padding: 1.6rem;

  p {
    margin-block: 1.6rem;
  }
}
</style>
