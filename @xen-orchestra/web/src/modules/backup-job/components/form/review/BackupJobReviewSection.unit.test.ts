import BackupJobReviewSection from '@/modules/backup-job/components/form/review/BackupJobReviewSection.vue'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { mount } from '@vue/test-utils'

function mountSection(props: { hasError?: boolean } = {}) {
  return mount(BackupJobReviewSection, {
    props: { title: 'Section title', ...props },
    slots: { default: '<p class="content">Section content</p>' },
    global: createGlobalTestConfig(),
  })
}

it('shows the title and the content of the section', () => {
  const wrapper = mountSection()

  expect(wrapper.text()).toContain('Section title')
  expect(wrapper.get('.content').text()).toBe('Section content')
})

describe('error', () => {
  it('tells the step contains errors', () => {
    const info = mountSection({ hasError: true }).getComponent(UiInfo)

    expect(info.props('accent')).toBe('danger')
    expect(info.text()).toBe(t('step-contains-errors'))
  })

  it('tells nothing when the step has no error', () => {
    expect(mountSection({ hasError: false }).findComponent(UiInfo).exists()).toBe(false)
  })

  it('tells nothing by default', () => {
    expect(mountSection().findComponent(UiInfo).exists()).toBe(false)
  })
})

describe('edit', () => {
  it('emits edit from the edit button', async () => {
    const wrapper = mountSection()

    await getButton(wrapper, t('action:edit')).trigger('click')

    expect(wrapper.emitted('edit')).toHaveLength(1)
  })
})
