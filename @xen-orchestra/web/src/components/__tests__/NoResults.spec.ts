import i18n from '@core/i18n'
import { config, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NoResults from '../NoResults.vue'

config.global.plugins.push(i18n)

describe('NoResults', () => {
  it('displays "No results"', () => {
    const wrapper = mount(NoResults)

    expect(wrapper.text()).toContain('No results')
  })
})
