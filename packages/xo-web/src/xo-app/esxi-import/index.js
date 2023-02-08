import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import decorate from 'apply-decorators'
import React from 'react'
import { Container } from 'grid'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { Input } from 'debounce-input-decorator'
import { InputCol, LabelCol, Row } from 'form-grid'
import { linkState } from 'reaclette-utils'
import { Password } from 'form'

import { esxiConnect, isSrWritableOrIso } from '../../common/xo'
import { SelectNetwork, SelectPool, SelectSr, SelectVm } from '../../common/select-objects'

const getInitialState = () => ({
  isConnected: false,
  hasCertificate: true,
  hostIp: '',
  user: '',
  password: '',

  pool: undefined,
  sr: undefined,
  network: undefined,
  vms: [],
})

const EsxiImport = decorate([
  provideState({
    initialState: getInitialState,
    effects: {
      connect: async () => state => {
        // const { hostIp, hasCertificate, password, user } = this.state
        // await esxiConnect(hostIp, user, password, hasCertificate)
        // isConnected = true
      },
      linkState,
      networkpredicate: (_, network) => network.$poolId === this.state.pool,
      onChangePool: (_, pool) => ({ pool }),
      srPredicate: (_, sr) => isSrWritableOrIso(sr) && sr.$poolId === this.state.pool,
      toggleCertificateCheck:
        (_, { target: { checked, name } }) =>
        state => ({
          ...state,
          [name]: checked,
        }),
      vmPredicate: (_, vm) => {
        const { pool } = this.state
        return vm.$poolId === pool // this.state.vms.includes(vm)
      },
      reset: getInitialState,
    },
    computed: {},
  }),
  injectIntl,
  injectState,
  ({
    effects: {
      connect,
      linkState,
      networkPredicate,
      onChangePool,
      reset,
      srPredicate,
      toggleCertificateCheck,
      vmPredicate,
    },
    intl: { formatMessage },
    state: { hasCertificate, hostIp, isConnected, network, password, pool, sr, user, vm, vms },
  }) => (
    <Container>
      {!isConnected && (
        <Container>
          <form id='esxi-connect-form'>
            <Row>
              <LabelCol>{_('hostIp')}</LabelCol>
              <InputCol>
                <Input
                  className='form-control'
                  name='hostIp'
                  onChange={linkState}
                  placeholder='192.168.2.20'
                  required
                  value={hostIp}
                />
              </InputCol>
            </Row>
            <Row>
              <LabelCol>{_('user')}</LabelCol>
              <InputCol>
                <Input
                  className='form-control'
                  name='user'
                  onChange={linkState}
                  placeholder={formatMessage(messages.user)}
                  required
                  value={user}
                />
              </InputCol>
            </Row>
            <Row>
              <LabelCol>{_('password')}</LabelCol>
              <InputCol>
                <Password
                  name='password'
                  onChange={linkState}
                  placeholder={formatMessage(messages.password)}
                  required
                  value={password}
                />
              </InputCol>
            </Row>
            <Row>
              <LabelCol>{_('sslCertificate')}</LabelCol>
              <InputCol>
                <input
                  checked={hasCertificate}
                  name='hasCertificate'
                  onChange={toggleCertificateCheck}
                  required
                  type='checkbox'
                />
              </InputCol>
            </Row>
            <div className='form-group pull-right'>
              <ActionButton
                btnStyle='primary'
                className='mr-1'
                form='esxi-connect-form'
                handler={connect}
                icon='connect'
                type='submit'
              >
                {_('serverConnect')}
              </ActionButton>
              <Button onClick={reset}>{_('formReset')}</Button>
            </div>
          </form>
        </Container>
      )}
      {isConnected && vms.length > 0 && (
        <Container>
          <form id='esxi-migrate-form'>
            <Row>
              <LabelCol>{_('pool')}</LabelCol>
              <InputCol>
                <SelectPool name='pool' onChange={onChangePool} required value={pool} />
              </InputCol>
            </Row>
            <Row>
              <LabelCol>{_('vm')}</LabelCol>
              <InputCol>
                <SelectVm name='vm' onChange={linkState} predicate={vmPredicate} required value={vm} />
              </InputCol>
            </Row>
            <Row>
              <LabelCol>{_('importToSr')}</LabelCol>
              <InputCol>
                <SelectSr name='sr' onChange={linkState} predicate={srPredicate} required value={sr} />
              </InputCol>
            </Row>
            <Row>
              <LabelCol>{_('network')}</LabelCol>
              <InputCol>
                <SelectNetwork
                  name='network'
                  onChange={linkState}
                  predicate={networkPredicate}
                  required
                  value={network}
                />
              </InputCol>
            </Row>

            <div className='form-group pull-right'>
              <ActionButton
                btnStyle='primary'
                className='mr-1'
                form='esxi-migrate-form'
                handler={connect}
                icon='vm-migrate'
                type='submit'
              >
                {_('migrateVmLabel')}
              </ActionButton>
              <Button onClick={reset}>{_('formReset')}</Button>
            </div>
          </form>
        </Container>
      )}
    </Container>
  ),
])

export default EsxiImport
