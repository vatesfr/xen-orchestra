import _, { messages } from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Col, Container } from 'grid'
import { form } from 'modal'
import { generateId } from 'reaclette-utils'
import { injectIntl } from 'react-intl'
import { provideState, injectState } from 'reaclette'
import { updateProxyApplianceSettings } from 'xo'

const UpdateApplianceSettingsModal = decorate([
  provideState({
    effects: {
      onHttpProxyChange(_, { target: { value } }) {
        this.props.onChange({
          ...this.props.value,
          httpProxy: value,
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
        <Col mediumSize={4}>
          <label htmlFor={state.idHttpProxyInput}>
            <strong>{_('httpProxy')}</strong>
          </label>
        </Col>
        <Col mediumSize={8}>
          <input
            className='form-control'
            id={state.idHttpProxyInput}
            onChange={effects.onHttpProxyChange}
            placeholder={formatMessage(messages.httpProxyPlaceholder)}
            value={value.httpProxy}
          />
        </Col>
      </SingleLineRow>
      <SingleLineRow className='mt-1'>
        <Col className='text-info'>
          <Icon icon='info' /> {_('proxyApplianceSettingsInfo')}
        </Col>
      </SingleLineRow>
    </Container>
  ),
])

const updateApplianceSettings = async proxy => {
  let { httpProxy } = await form({
    defaultValue: {
      httpProxy: '',
    },
    render: props => <UpdateApplianceSettingsModal {...props} />,
    header: (
      <span>
        <Icon icon='settings' /> {_('settings')}
      </span>
    ),
  })

  await updateProxyApplianceSettings(proxy.id, {
    httpProxy: (httpProxy = httpProxy.trim()) !== '' ? httpProxy : null,
  })
}

export { updateApplianceSettings }
