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

import VmData from './vm-data'
import { esxiConnect, importVm, isSrWritableOrIso } from '../../common/xo'
import { SelectNetwork, SelectPool, SelectSr } from '../../common/select-objects'

// JUST FOR TEST NOW
const VMS_TEST = [
  {
    id: '1',
    nameLabel: 'test_linux',
    memory: 2147483648,
    nCpus: 1,
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
    nameLabel: 'test_small',
    memory: 2147483648,
    nCpus: 1,
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
    nameLabel: 'test flo',
    memory: 1073741824,
    nCpus: 2,
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
    nameLabel: 'damnsmalllinux',
    memory: 268435456,
    nCpus: 1,
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
    nameLabel: 'miniubuntu',
    memory: 2147483648,
    nCpus: 3,
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
    nameLabel: 'ubuntu2',
    memory: 2147483648,
    nCpus: 4,
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
    nameLabel: 'windows',
    memory: 2147483648,
    nCpus: 1,
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
  hasCertificate: true,
  hostIp: '',
  isConnected: false,
  network: undefined,
  password: '',
  pool: undefined,
  sr: undefined,
  user: '',
  vm: undefined,
  vms: [],
  vmsData: {},
})

const EsxiImport = decorate([
  provideState({
    initialState: getInitialState,
    effects: {
      _importVm: () => {
        const { sr, network, vm, vmsData } = this.state
        importVm(undefined, 'esxi', { ...vmsData[vm.value], network }, sr)
      },
      connect: async () => state => {
        // const { hostIp, hasCertificate, password, user } = state
        // const vms = await esxiConnect(hostIp, user, password, hasCertificate)
        const vmsData = VMS_TEST.reduce((vms, vm) => ({ ...vms, [vm.id]: vm }), {})
        return { isConnected: true, vms: VMS_TEST, vmsData }
      },
      linkState,
      networkpredicate: (_, network) => network.$poolId === this.state.pool,
      onChangeVm: (_, vm) => ({ vm }),
      onChangeVmData: (_, data) => {
        const vmId = this.state.vm.value
        const previousData = this.state.vmsData[vmId]
        this.state.vmsData[vmId] = { ...previousData, ...data }
      },
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
      selectVmOptions: ({ vms }) =>
        vms.map(vm => ({
          label: vm.nameLabel,
          value: vm.id,
        })),
      srPredicate:
        ({ pool }) =>
        sr =>
          isSrWritableOrIso(sr) && sr.$poolId === pool.uuid,
    },
  }),
  injectIntl,
  injectState,
  ({
    effects: {
      _importVm,
      connect,
      linkState,
      networkPredicate,
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
      password,
      pool,
      selectVmOptions,
      sr,
      user,
      vm,
      vms,
      vmsData,
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
              <Select onChange={onChangeVm} options={selectVmOptions} required value={vm} />
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
              <VmData onChange={onChangeVmData} value={{ ...vmsData[vm.value], pool }} />
            </div>
          )}
          <div className='form-group pull-right'>
            <ActionButton
              btnStyle='primary'
              className='mr-1'
              form='esxi-migrate-form'
              handler={_importVm}
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
