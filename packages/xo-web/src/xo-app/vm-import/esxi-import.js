import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import decorate from 'apply-decorators'
import React from 'react'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { Input } from 'debounce-input-decorator'
import { InputCol, LabelCol, Row } from 'form-grid'
import { linkState } from 'reaclette-utils'
import { Password, Select } from 'form'

import { esxiConnect, isSrWritableOrIso } from '../../common/xo'
import { SelectNetwork, SelectPool, SelectSr } from '../../common/select-objects'

const INITIAL_CONNECT_FORM_STATE = {
  hasCertificate: true,
  hostIp: '',
  user: '',
  password: '',
}

const VMS_TEST = [
  {
    id: '1',
    name_label: 'test_linux',
    memory: 2147483648,
    numCpu: 1,
    guestToolsInstalled: false,
    firmware: 'bios',
    powerState: 'poweredOff',
    storage: {
      used: 216761,
      free: 2318061568,
    },
  },
  {
    id: '2',
    name_label: 'test_small',
    memory: 2147483648,
    numCpu: 1,
    guestToolsInstalled: false,
    firmware: 'bios',
    powerState: 'poweredOff',
    storage: {
      used: 10696,
      free: 2586497520,
    },
  },
  {
    id: '4',
    name_label: 'test flo',
    memory: 1073741824,
    numCpu: 2,
    guestToolsInstalled: false,
    firmware: 'bios',
    powerState: 'poweredOff',
    storage: {
      used: 6860092734,
      free: 35570518969,
    },
  },
  {
    id: '8',
    name_label: 'damnsmalllinux',
    memory: 268435456,
    numCpu: 1,
    guestToolsInstalled: false,
    firmware: 'bios',
    powerState: 'poweredOff',
    storage: {
      used: 154318782,
      free: 553288173,
    },
  },
  {
    id: '9',
    name_label: 'miniubuntu',
    memory: 2147483648,
    numCpu: 3,
    guestToolsInstalled: false,
    firmware: 'bios',
    powerState: 'poweredOn',
    storage: {
      used: 7720281547,
      free: 8588887706,
    },
  },
  {
    id: '10',
    name_label: 'ubuntu2',
    memory: 2147483648,
    numCpu: 4,
    guestToolsInstalled: false,
    firmware: 'bios',
    powerState: 'poweredOn',
    storage: {
      used: 6132889490,
      free: 8555332434,
    },
  },
  {
    id: '20',
    name_label: 'windows',
    memory: 2147483648,
    numCpu: 1,
    guestToolsInstalled: false,
    firmware: 'uefi',
    powerState: 'poweredOff',
    storage: {
      used: 1971,
      free: 36662014449,
    },
  },
]

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
        // const { hostIp, hasCertificate, password, user } = state
        // await esxiConnect(hostIp, user, password, hasCertificate)
        return { isConnected: true, vms: VMS_TEST }
      },
      linkState,
      networkpredicate: (_, network) => network.$poolId === this.state.pool,
      onChangePool: (_, pool) => ({ pool, sr: pool.default_SR }),
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
    computed: {
      selectVmOptions: ({ vms }) =>
        vms.map(vm => ({
          label: vm.name_label,
          value: vm.id,
        })),
    },
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
    state: { hasCertificate, hostIp, isConnected, network, password, pool, selectVmOptions, sr, user, vm, vms },
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
      )}
      {isConnected && vms.length > 0 && (
        <form id='esxi-migrate-form'>
          <Row>
            <LabelCol>{_('vm')}</LabelCol>
            <InputCol>
              <Select name='vm' onChange={linkState} options={selectVmOptions} required value={vm} />
            </InputCol>
          </Row>
          <Row>
            <LabelCol>{_('vmImportToPool')}</LabelCol>
            <InputCol>
              <SelectPool name='pool' onChange={onChangePool} required value={pool} />
            </InputCol>
          </Row>

          <Row>
            <LabelCol>{_('vmImportToSr')}</LabelCol>
            <InputCol>
              <SelectSr
                disabled={pool === undefined}
                name='sr'
                onChange={linkState}
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
