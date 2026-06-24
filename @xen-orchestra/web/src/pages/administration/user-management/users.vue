<template>
  <div class="vdis" :class="{ mobile: uiStore.isSmall }">
    <UiCard class="container">
      <UsersTable :users>
        <template #title-actions>
          <MenuList placement="bottom-end">
            <UiButton variant="primary" accent="brand" size="medium" left-icon="fa:plus">
              {{ t('new') }}
            </UiButton>
            <!--                  <MenuItem> -->
            <!--                    <UiLink -->
            <!--                      class="add-vdi-link" -->
            <!--                      :to="{ name: '/vdi/new', query: { vmid: vm.id } }" -->
            <!--                      icon="fa:plus" -->
            <!--                      size="medium" -->
            <!--                    > -->
            <!--                      {{ t('action:create-vdi') }} -->
            <!--                    </UiLink> -->
            <!--                  </MenuItem> -->
            <!--                  <MenuItem> -->
            <!--                    <UiLink -->
            <!--                      class="add-vdi-link" -->
            <!--                      :to="{ name: '/vdi/attach', query: { vmid: vm.id } }" -->
            <!--                      icon="action:attach" -->
            <!--                      size="medium" -->
            <!--                    > -->
            <!--                      {{ t('action:attach-vdi') }} -->
            <!--                    </UiLink> -->
            <!--                  </MenuItem> -->
          </MenuList>
        </template>
      </UsersTable>
    </UiCard>
  </div>
</template>
<!--    &lt;!&ndash;    <VdiSidePanel v-if="selectedVdi" :vdi="selectedVdi" :vm @close="selectedVdi = undefined" /> &ndash;&gt; -->
<!--    &lt;!&ndash;    <UiPanel v-else-if="!uiStore.isSmall"> &ndash;&gt; -->
<!--    &lt;!&ndash;      <VtsStateHero format="panel" type="no-selection" size="medium"> &ndash;&gt; -->
<!--    &lt;!&ndash;        {{ t('select-to-see-details') }} &ndash;&gt; -->
<!--    &lt;!&ndash;      </VtsStateHero> &ndash;&gt; -->
<!--    &lt;!&ndash;    </UiPanel> &ndash;&gt; -->
<!--  </div> -->
<!-- </template> -->

<script setup lang="ts">
import UsersTable from '@/modules/administration/components/list/UsersTable.vue'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { users } = defineProps<{
  users: FrontXoUser[]
}>()

const { t } = useI18n()

const uiStore = useUiStore()

// watch(
//   () => users,
//   value => {
//     console.log('users.vue', value)
//   }
// )
</script>

<style scoped lang="postcss">
.vdis {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}

/* This selector can't be nested,
* as the links in MenuItem are teleported and are not children of .vdis element.
* This selector extends the clickable area of the links for better accessibility
*/
.add-vdi-link {
  height: 100%;
  width: 100%;
}
</style>
