import ApplianceVersionBlock from '@/modules/appliance/components/version/ApplianceVersionBlock.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

type VersionBlockProps = {
  label: string
  version: string
  detail?: string
  variant: 'neutral' | 'highlighted' | 'unknown'
}

function mountBlock(props: Partial<VersionBlockProps> = {}) {
  return mount(ApplianceVersionBlock, {
    props: { label: 'You run', version: '5.100.0', variant: 'neutral', ...props },
    global: createGlobalTestConfig(),
  })
}

it('shows its label and its version', () => {
  const wrapper = mountBlock()

  expect(wrapper.get('.label').text()).toBe('You run')
  expect(wrapper.get('.version').text()).toBe('5.100.0')
})

it('shows its detail, when given', () => {
  expect(mountBlock({ detail: 'Channel stable' }).get('.detail').text()).toBe('Channel stable')
})

it('shows no detail without one', () => {
  expect(mountBlock().find('.detail').exists()).toBe(false)
})

it.each(['neutral', 'highlighted', 'unknown'] as const)('applies the %s variant', variant => {
  expect(mountBlock({ variant }).classes()).toContain(`variant--${variant}`)
})
