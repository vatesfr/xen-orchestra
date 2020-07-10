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
      toggleRemoveHttpProxyCfg() {
        const { onChange, value } = this.props
        onChange({
          ...value,
          removeHttpProxyCfg: !value.removeHttpProxyCfg,
        })
      },
    },
    computed: {
      idHttpProxyInput: generateId,
    },
  }),
  injectIntl,
  injectState,
  ({ intl: { formatMessage }, effects, state, value }) => (
    <Container>
      <SingleLineRow>
        <Col mediumSize={3}>
          <label htmlFor={state.idHttpProxyInput} style={{ cursor: 'pointer' }}>
            <strong>{_('httpProxy')}</strong>
          </label>
        </Col>
        <Col mediumSize={8}>
          <input
            className='form-control'
            disabled={value.removeHttpProxyCfg}
            id={state.idHttpProxyInput}
            onChange={effects.onHttpProxyChange}
            placeholder={formatMessage(messages.httpProxyPlaceholder)}
            value={value.httpProxy}
          />
        </Col>
        <Col mediumSize={1}>
          <Tooltip content={_('removeExistingConfiguration')}>
            <input
              checked={value.removeHttpProxyCfg}
              onChange={effects.toggleRemoveHttpProxyCfg}
              type='checkbox'
            />
          </Tooltip>
        </Col>
      </SingleLineRow>
    </Container>
  ),
])

const updateApplianceSettings = async proxy => {
  let { httpProxy, removeHttpProxyCfg } = await form({
    defaultValue: {
      httpProxy: '',
      removeHttpProxyCfg: false,
    },
    render: props => <Modal {...props} />,
    header: (
      <span>
        <Icon icon='settings' /> {_('settings')}
      </span>
    ),
  })

  httpProxy = httpProxy.trim()
  await updateProxyAppliance(proxy, {
    httpProxy: removeHttpProxyCfg
      ? null
      : httpProxy !== ''
      ? httpProxy
      : undefined,
  })
}

export { updateApplianceSettings as default }
