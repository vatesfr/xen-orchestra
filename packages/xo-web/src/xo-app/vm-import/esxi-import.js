import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import decorate from 'apply-decorators'
import React from 'react'
import { esxiConnect, importVmFromEsxi, isSrWritable } from 'xo'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { Input } from 'debounce-input-decorator'
import { InputCol, LabelCol, Row } from 'form-grid'
import { isEmpty, map } from 'lodash'
import { linkState } from 'reaclette-utils'
import { Password, Select } from 'form'
import { SelectNetwork, SelectPool, SelectSr } from 'select-objects'

import VmData from './vm-data'

const getInitialState = () => ({
  hasCertificate: true,
  hostIp: '',
  isConnected: false,
  network: undefined,
  password: '',
  pool: undefined,
  sr: undefined,
  user: '',
  vm: undefined,
  vmData: undefined,
  vmsById: undefined,
})

const EsxiImport = decorate([
  provideState({
    initialState: getInitialState,
    effects: {
      importVm:
        () =>
        ({ hasCertificate, hostIp, network, password, sr, user, vmData }) => {
          importVmFromEsxi({
            host: hostIp,
            network: network.id,
            password,
            sr,
            sslVerify: hasCertificate,
            user,
            vm: vmData.id,
          })
        },
      connect:
        () =>
        async ({ hostIp, hasCertificate, password, user }) => {
          const vms = await esxiConnect(hostIp, user, password, hasCertificate)
          return { isConnected: true, vmsById: vms.reduce((vms, vm) => ({ ...vms, [vm.id]: vm }), {}) }
        },
      linkState,
      onChangeVm: (_, vm) => state => ({ vm, vmData: state.vmsById[vm.value] }),
      onChangeVmData: (_, vmData) => ({ vmData }),
      onChangeNetwork: (_, network) => ({ network }),
      onChangePool: (_, pool) => ({ pool, sr: pool.default_SR }),
      onChangeSr: (_, sr) => ({ sr }),
      toggleCertificateCheck:
        (_, { target: { checked, name } }) =>
        state => ({
          ...state,
          [name]: checked,
        }),
      reset: getInitialState,
    },
    computed: {
      selectVmOptions: ({ vmsById }) =>
        map(vmsById, vm => ({
          label: vm.nameLabel,
          value: vm.id,
        })),
      networkpredicate:
        ({ pool }) =>
        network =>
          network.$poolId === pool?.uuid,
      srPredicate:
        ({ pool }) =>
        sr =>
          isSrWritable(sr) && sr.$poolId === pool?.uuid,
    },
  }),
  injectIntl,
  injectState,
  ({
    effects: {
      connect,
      importVm,
      linkState,
      onChangeVm,
      onChangeVmData,
      onChangeNetwork,
      onChangePool,
      onChangeSr,
      reset,
      srPredicate,
      toggleCertificateCheck,
    },
    intl: { formatMessage },
    state: {
      hasCertificate,
      hostIp,
      isConnected,
      network,
      networkPredicate,
      password,
      pool,
      selectVmOptions,
      sr,
      user,
      vm,
      vmsById,
      vmData,
    },
  }) => (
    <div>
      {!isConnected && (
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
                type='checkbox'
                value={hasCertificate}
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
      )}
      {isConnected && (
        <form id='esxi-migrate-form'>
          <Row>
            <LabelCol>{_('vm')}</LabelCol>
            <InputCol>
              <Select disabled={isEmpty(vmsById)} onChange={onChangeVm} options={selectVmOptions} required value={vm} />
            </InputCol>
          </Row>
          <Row>
            <LabelCol>{_('vmImportToPool')}</LabelCol>
            <InputCol>
              <SelectPool onChange={onChangePool} required value={pool} />
            </InputCol>
          </Row>
          <Row>
            <LabelCol>{_('vmImportToSr')}</LabelCol>
            <InputCol>
              <SelectSr
                disabled={pool === undefined}
                onChange={onChangeSr}
                predicate={srPredicate}
                required
                value={sr}
              />
            </InputCol>
          </Row>
          <Row>
            <LabelCol>{_('network')}</LabelCol>
            <InputCol>
              <SelectNetwork
                disabled={pool === undefined}
                onChange={onChangeNetwork}
                predicate={networkPredicate}
                required
                value={network}
              />
            </InputCol>
          </Row>
          {vm !== undefined && (
            <div>
              <hr />
              <h5>{_('vmsToImport', { nVms: 1 })}</h5>
              <VmData data={vmData} onChange={onChangeVmData} pool={pool} />
            </div>
          )}
          <div className='form-group pull-right'>
            <ActionButton
              btnStyle='primary'
              className='mr-1'
              disabled={vm === undefined}
              form='esxi-migrate-form'
              handler={importVm}
              icon='import'
              type='submit'
            >
              {_('newImport')}
            </ActionButton>
            <Button onClick={reset}>{_('formReset')}</Button>
          </div>
        </form>
      )}
    </div>
  ),
])

export default EsxiImport
