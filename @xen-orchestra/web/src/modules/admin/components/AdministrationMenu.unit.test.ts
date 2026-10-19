import AdministrationMenu from '@/modules/admin/components/AdministrationMenu.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { type DOMWrapper, mount } from '@vue/test-utils'

function mountMenu() {
  return mount(AdministrationMenu, { global: createGlobalTestConfig() })
}

function findSections(wrapper: ReturnType<typeof mountMenu>) {
  return wrapper.findAll('.menu-section')
}

function findSectionTitle(section: DOMWrapper<Element>) {
  return section.get('.section-title').text()
}

function findSection(wrapper: ReturnType<typeof mountMenu>, title: string) {
  return findSections(wrapper).find(section => findSectionTitle(section) === title)
}

it('lists the V2V migration between backups and user management', () => {
  expect(findSections(mountMenu()).map(findSectionTitle)).toEqual([
    t('backup-and-replication'),
    t('v2v'),
    t('user-management'),
  ])
})

it('links the V2V section to the migration wizard', () => {
  const section = findSection(mountMenu(), t('v2v'))

  expect(section?.findAll('a').map(link => [link.text(), link.attributes('href')])).toEqual([
    [t('migrate-vms'), '/admin/v2v/migrate'],
  ])
})
