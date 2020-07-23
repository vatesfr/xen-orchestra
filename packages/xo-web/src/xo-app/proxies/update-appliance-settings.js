import _, { messages } from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import Tooltip from 'tooltip'
import { Col, Container } from 'grid'
import { form } from 'modal'
import { generateId } from 'reaclette-utils'
import { injectIntl } from 'react-intl'
import { provideState, injectState } from 'reaclette'
import { updateProxyAppliance } from 'xo'

const Modal = decorate([
  provideState({
    effects: {
      onHttpProxyChange(_, { target: { value } }) {
        this.props.onChange({
          ...this.props.value,
          httpProxy: value,
        })
      },
      toggleUpdateHttpProxy() {
        const { onChange, value } = this.props
        onChange({
          ...value,
          updateHttpProxy: !value.updateHttpProxy,
        })
      },
    },
  }),
  injectIntl,
  injectState,
  ({ intl: { formatMessage }, effects, state, value }) => (
    <Container>
      <SingleLineRow>
        <Col mediumSize={4}>
          <label style={{ cursor: 'pointer' }}>
            <Tooltip content={_('updateSetting')}>
              <input
                checked={value.updateHttpProxy}
                onChange={effects.toggleUpdateHttpProxy}
                type='checkbox'
              />
            </Tooltip>{' '}
            <strong>{_('httpProxy')}</strong>
          </label>
        </Col>
        <Col mediumSize={8}>
          <input
            className='form-control'
            disabled={!value.updateHttpProxy}
            onChange={effects.onHttpProxyChange}
            placeholder={formatMessage(messages.httpProxyPlaceholder)}
            value={value.httpProxy}
          />
        </Col>
      </SingleLineRow>
      <SingleLineRow className='mt-1'>
        <Col className='text-muted'>
          <Icon icon='info' /> {_('httpProxyRemoveCfgInfo')}
        </Col>
      </SingleLineRow>
    </Container>
  ),
])

const updateApplianceSettings = async proxy => {
  let { httpProxy, updateHttpProxy } = await form({
    defaultValue: {
      httpProxy: '',
      updateHttpProxy: false,
    },
    render: props => <Modal {...props} />,
    header: (
      <span>
        <Icon icon='settings' /> {_('settings')}
      </span>
    ),
  })

  if (updateHttpProxy) {
    await updateProxyAppliance(proxy, {
      httpProxy: updateHttpProxy
        ? (httpProxy = httpProxy.trim()) !== ''
          ? httpProxy
          : null
        : undefined,
    })
  }
}

export { updateApplianceSettings as default }
