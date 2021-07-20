import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SingleLineRow from 'single-line-row'
import { Col, Container } from 'grid'
import { form } from 'modal'
import { generateId } from 'reaclette-utils'
import { installCertificateOnHost } from 'xo'
import { provideState, injectState } from 'reaclette'
import { Textarea as DebounceTextarea } from 'debounce-input-decorator'

const InstallCertificateModal = decorate([
  provideState({
    effects: {
      onChange(_, { target: { name, value } }) {
        const { props } = this
        props.onChange({
          ...props.value,
          [name]: value,
        })
      },
    },
    computed: {
      inputCertificateChainId: generateId,
      inputCertificateId: generateId,
      inputPrivateKeyId: generateId,
    },
  }),
  injectState,
  ({ state, effects, value }) => (
    <Container>
      <SingleLineRow>
        <Col mediumSize={4}>
          <label htmlFor={state.inputCertificateId}>
            <strong>{_('certificate')}</strong>
          </label>
        </Col>
        <Col mediumSize={8}>
          <DebounceTextarea
            className='form-control text-monospace'
            id={state.inputCertificateId}
            name='certificate'
            onChange={effects.onChange}
            required
            value={value.certificate}
          />
        </Col>
      </SingleLineRow>
      <SingleLineRow className='mt-1'>
        <Col mediumSize={4}>
          <label htmlFor={state.inputPrivateKeyId}>
            <strong>{_('privateKey')}</strong>
          </label>
        </Col>
        <Col mediumSize={8}>
          <DebounceTextarea
            className='form-control text-monospace'
            id={state.inputPrivateKeyId}
            name='privateKey'
            onChange={effects.onChange}
            required
            value={value.privateKey}
          />
        </Col>
      </SingleLineRow>
      <SingleLineRow className='mt-1'>
        <Col mediumSize={4}>
          <label htmlFor={state.inputCertificateChainId}>
            <strong>{_('certificateChain')}</strong>
          </label>
        </Col>
        <Col mediumSize={8}>
          <DebounceTextarea
            className='form-control text-monospace'
            id={state.inputCertificateChainId}
            name='certificateChain'
            onChange={effects.onChange}
            value={value.certificateChain}
          />
        </Col>
      </SingleLineRow>
    </Container>
  ),
])

const installCertificate = async ({ id, isNewInstallation = false }) => {
  const { certificate, certificateChain, privateKey } = await form({
    defaultValue: {
      certificate: '',
      certificateChain: '',
      privateKey: '',
    },
    render: props => <InstallCertificateModal {...props} />,
    header: (
      <span>
        <Icon icon='upload' /> {isNewInstallation ? _('installNewCertificate') : _('replaceExistingCertificate')}
      </span>
    ),
  })

  await installCertificateOnHost(id, {
    certificate: certificate.trim(),
    chain: certificateChain.trim(),
    privateKey: privateKey.trim(),
  })
}

export { installCertificate }
