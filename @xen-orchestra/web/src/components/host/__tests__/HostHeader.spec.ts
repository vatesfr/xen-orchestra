import HostHeader from '@/components/host/HostHeader.vue'
import { pinia } from '@/pinia'
import { router } from '@/router'
import HeadBar from '@core/components/head-bar/HeadBar.vue'
import ObjectIcon from '@core/components/icon/ObjectIcon.vue'
import i18n from '@core/i18n'
import { config, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { runningHost } from '../../../mocks/host.mock'

config.global.plugins.push(router, i18n, pinia)

describe('HostHeader', () => {
  it('should render the host name', () => {
    const wrapper = mount(HostHeader, {
      props: {
        host: runningHost,
      },
    })

    expect(wrapper.getComponent(ObjectIcon).props()).toEqual({
      size: 'small',
      type: 'host',
      state: 'running',
    })

    expect(wrapper.getComponent(HeadBar).text()).toContain('Mocked Running Host')
  })
})
