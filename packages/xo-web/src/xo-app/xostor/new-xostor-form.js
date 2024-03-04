import _ from 'intl'
import ActionButton from 'action-button'
import Collapse from 'collapse'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import Select from 'form/select'
import semver from 'semver'
import { Card, CardBlock, CardHeader } from 'card'
import { connectStore, formatSize } from 'utils'
import { Container, Col, Row } from 'grid'
import { createGetObjectsOfType } from 'selectors'
import { find, first, map, mapValues, remove, size, some } from 'lodash'
import { createXostorSr, getBlockdevices } from 'xo'
import { injectState, provideState } from 'reaclette'
import { Input as DebounceInput } from 'debounce-input-decorator'
import { Pool as PoolRenderItem, Network as NetworkRenderItem } from 'render-xo-item'
import { SelectHost, SelectPool, SelectNetwork } from 'select-objects'
import { toggleState, linkState } from 'reaclette-utils'
import { Toggle } from 'form'

import styles from './index.css'

const MINIMAL_POOL_VERSION_FOR_XOSTOR = '8.2.1'

const N_HOSTS_MIN = 3
const N_HOSTS_MAX = 7

const PROVISIONING_OPTIONS = [
  { value: 'thin', label: _('thin') },
  { value: 'thick', label: _('thick') },
]

const REPLICATION_OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
]

const SPACE_BETWEEN = {
  display: 'flex',
  justifyContent: 'space-between',
}

const hasXostor = srs => some(srs, sr => sr.SR_type === 'linstor')
const formatDiskName = name => '/dev/' + name
const diskHasChildren = disk => Array.isArray(disk.children) && disk.children.length > 0
const isDiskRecommendedType = disk => disk.type === 'disk' || disk.type.startsWith('raid')
const isDiskMounted = disk => disk.mountpoint !== ''
const isDiskRo = disk => disk.ro === '1'
const isTapdevsDisk = disk => disk.name.startsWith('td')
const isWithinRecommendedHostRange = hosts => size(hosts) >= N_HOSTS_MIN && size(hosts) <= N_HOSTS_MAX
const isXcpngHost = host => host?.productBrand === 'XCP-ng'
const isHostRecentEnough = host => semver.satisfies(host?.version, `>=${MINIMAL_POOL_VERSION_FOR_XOSTOR}`)
const diskSelectRenderer = disk => (
  <span>
    <Icon icon='disk' /> {formatDiskName(disk.name)} {formatSize(Number(disk.size))}
  </span>
)
const xostorDiskPredicate = disk =>
  isDiskRecommendedType(disk) &&
  !isDiskRo(disk) &&
  !isDiskMounted(disk) &&
  !diskHasChildren(disk) &&
  !isTapdevsDisk(disk)

// ===================================================================

const StorageCard = decorate([
  injectState,
  ({ effects, state }) => (
    <Card>
      <CardHeader>{_('storage')}</CardHeader>
      <CardBlock>
        <Row>
          <Col>
            {_('name')}
            <DebounceInput className='form-control' name='srName' onChange={effects.linkState} value={state.srName} />
          </Col>
        </Row>
        <Row className='mt-1'>
          <Col>
            {_('description')}
            <DebounceInput
              className='form-control'
              name='srDescription'
              onChange={effects.linkState}
              value={state.srDescription}
            />
          </Col>
        </Row>
      </CardBlock>
    </Card>
  ),
])

const SettingsCard = decorate([
  provideState({
    initialState: () => ({ displayAdvancedSettings: false }),
    computed: {
      showWarningReplication: state => state.replication?.value === 1,
    },
    effects: {
      toggleDisplayAdvancedSettings: () => state => ({
        displayAdvancedSettings: !state.displayAdvancedSettings,
      }),
    },
  }),
  injectState,
  ({ effects, state }) => (
    <Card>
      <CardHeader>
        {_('settings')}
        {/* Uncomment when some advanced settings need to be added  */}
        {/* <ActionButton
          className='pull-right'
          data-mode='_displayAdvancedSettings'
          handler={effects.toggleDisplayAdvancedSettings}
          icon={state.displayAdvancedSettings ? 'toggle-on' : 'toggle-off'}
          iconColor={state.displayAdvancedSettings ? 'text-success' : undefined}
          size='small'
        >
          {_('advancedSettings')}
        </ActionButton> */}
      </CardHeader>
      <CardBlock>
        <Row>
          <Col>
            {_('replication')}
            <Select options={REPLICATION_OPTIONS} onChange={effects.onReplicationChange} value={state.replication} />
            {state.showWarningReplication && (
              <p className='text-warning'>
                <Icon icon='alarm' /> {_('xostorReplicationWarning')}
              </p>
            )}
          </Col>
        </Row>
        <Row className='form-group mt-1'>
          <Col>
            {_('provisioning')}
            <Select onChange={effects.onProvisioningChange} options={PROVISIONING_OPTIONS} value={state.provisioning} />
          </Col>
        </Row>
        <Row className='form-group mt-1'>
          <Col style={SPACE_BETWEEN}>
            <label>{_('ignoreFileSystems')}</label>
            <Toggle value={state.ignoreFileSystems} onChange={effects.onIgnoreFileSystemsChange} size='small' />
          </Col>
        </Row>
        {/* {state.displayAdvancedSettings && ( Advanced settings section )} */}
      </CardBlock>
    </Card>
  ),
])

const PoolCard = decorate([
  connectStore({
    srs: createGetObjectsOfType('SR').groupBy('$pool'),
  }),
  provideState({
    initialState: () => ({ onlyShowXostorPools: true }),
    effects: {
      toggleState,
    },
    computed: {
      poolPredicate: (state, props) => {
        if (!state.onlyShowXostorPools) {
          return undefined
        }
        return pool => {
          const poolHosts = props.hostsByPoolId?.[pool.id]
          const host = first(poolHosts)
          return (
            isWithinRecommendedHostRange(poolHosts) &&
            isXcpngHost(host) &&
            !hasXostor(props.srs[pool.id]) &&
            isHostRecentEnough(host)
          )
        }
      },
      poolIsWithinRecommendedHostRange: state => isWithinRecommendedHostRange(state.poolHosts),
      poolHasXostor: (state, props) => hasXostor(props.srs[state.poolId]),
      isPoolRecentEnough: state => isHostRecentEnough(first(state.poolHosts)),
      isPoolXostorCompatible: state =>
        state.isXcpngHost && state.poolIsWithinRecommendedHostRange && !state.poolHasXostor && state.isPoolRecentEnough,
    },
  }),
  injectState,
  ({ effects, state }) => (
    <Card>
      <CardHeader>{_('pool')}</CardHeader>
      <CardBlock>
        <div>
          <label>
            <input
              checked={state.onlyShowXostorPools}
              name='onlyShowXostorPools'
              onChange={effects.toggleState}
              type='checkbox'
            />{' '}
            {_('onlyShowXostorRequirements', { type: _('pools') })}
          </label>
          <SelectPool onChange={effects.onPoolChange} predicate={state.poolPredicate} value={state.poolId} />
          {state.poolHosts !== undefined && !state.isPoolXostorCompatible && (
            <div className='text-danger'>
              {/* FIXME: add link of the documentation when ready */}
              <a href='#' rel='noreferrer' target='_blank'>
                {_('objectDoesNotMeetXostorRequirements', { object: <PoolRenderItem id={state.poolId} /> })}
              </a>
              <ul>
                {!state.isXcpngHost && <li>{_('notXcpPool')}</li>}
                {!state.poolIsWithinRecommendedHostRange && <li>{_('wrongNumberOfHosts')}</li>}
                {state.poolHasXostor && <li>{_('poolAlreadyHasXostor')}</li>}
                {!state.isPoolRecentEnough && (
                  <li>{_('poolNotRecentEnough', { version: first(state.poolHosts).version })}</li>
                )}
              </ul>
            </div>
          )}
          <em>
            <Icon icon='info' /> {_('xostorPackagesWillBeInstalled')}
          </em>
        </div>
      </CardBlock>
    </Card>
  ),
])

const NetworkCard = decorate([
  provideState({
    initialState: () => ({ onlyShowXostorNetworks: true }),
    effects: {
      toggleState,
    },
    computed: {
      networksPredicate: (state, props) => network => {
        const isOnPool = network.$pool === state.poolId
        const pifs = network.PIFs
        return state.onlyShowXostorNetworks
          ? isOnPool && pifs.length > 0 && pifs.every(pifId => props.pifs[pifId].ip !== '')
          : isOnPool
      },
    },
  }),
  injectState,
  ({ effects, state }) => (
    <Card>
      <CardHeader>{_('network')}</CardHeader>
      <CardBlock>
        <label>
          <input
            checked={state.onlyShowXostorNetworks}
            name='onlyShowXostorNetworks'
            onChange={effects.toggleState}
            type='checkbox'
          />{' '}
          {_('onlyShowXostorRequirements', { type: _('networks') })}
        </label>
        <SelectNetwork
          disabled={!state.isPoolSelected}
          onChange={effects.onNetworkChange}
          predicate={state.networksPredicate}
          value={state.networkId}
        />
      </CardBlock>
    </Card>
  ),
])

const DisksCard = decorate([
  provideState({
    initialState: () => ({
      onlyShowXostorDisks: true,
    }),
    effects: {
      toggleState,
      _onDiskChange(_, disk) {
        this.effects.onDiskChange(disk, this.state.hostId)
      },
    },
    computed: {
      _blockdevices: async state =>
        state.isHostSelected && state.isXcpngHost ? (await getBlockdevices(state.hostId)).blockdevices : undefined,
      _disks: state =>
        state.onlyShowXostorDisks ? state._blockdevices?.filter(xostorDiskPredicate) : state._blockdevices,
      predicate: state => host => host.$pool === state.poolId,
      isHostSelected: state => state.hostId !== undefined,
      selectableDisks: state =>
        state._disks
          ?.filter(disk => !state.disksByHost[state.hostId]?.some(_disk => _disk.name === disk.name))
          .sort((prev, next) => Number(next.size) - Number(prev.size)),
    },
  }),
  injectState,
  ({ effects, state }) => (
    <Card>
      <CardHeader>{_('disks')}</CardHeader>
      <CardBlock>
        <Row>
          <Col size={8}>
            <Row className={styles.disksSelectors}>
              <Col size={6}>
                <SelectHost
                  disabled={!state.isPoolSelected}
                  onChange={effects.onHostChange}
                  predicate={state.predicate}
                  value={state.hostId}
                />
              </Col>
              <Col size={6}>
                <label>
                  <input
                    checked={state.onlyShowXostorDisks}
                    onChange={effects.toggleState}
                    name='onlyShowXostorDisks'
                    type='checkbox'
                  />{' '}
                  {_('onlyShowXostorRequirements', { type: _('disks') })}
                </label>
                {state.isPoolSelected && !state.isXcpngHost && (
                  <p className='text-danger mb-0'>
                    <Icon icon='alarm' /> {_('cantFetchDisksFromNonXcpngHost')}
                  </p>
                )}
                <Select
                  disabled={!state.isHostSelected || !state.isPoolSelected || !state.isXcpngHost}
                  onChange={effects._onDiskChange}
                  optionRenderer={diskSelectRenderer}
                  options={state.isHostSelected ? state.selectableDisks : []}
                  placeholder={_('selectDisks')}
                  value={null}
                />
              </Col>
            </Row>
            <Row className='mt-1'>
              <Col>
                <SelectedDisks hostId={state.hostId} />
              </Col>
            </Row>
          </Col>
          <Col size={4}>
            {map(state.poolHosts, host => (
              <Collapse
                buttonText={_('xostorDisksDropdownLabel', {
                  nDisks: state.disksByHost[host.id]?.length ?? 0,
                  hostname: host.hostname,
                })}
                defaultOpen
                key={host.id}
                size='small'
              >
                <SelectedDisks hostId={host.id} fromDropdown />
              </Collapse>
            ))}
          </Col>
        </Row>
      </CardBlock>
    </Card>
  ),
])

const SelectedDisks = decorate([
  provideState({
    effects: {
      _onDiskRemove(_, disk) {
        this.effects.onDiskRemove(disk, this.props.hostId)
      },
    },
    computed: {
      disksHost: (state, props) => state.disksByHost[props.hostId],
    },
  }),
  injectState,
  ({ effects, state, fromDropdown }) =>
    state.isHostSelected || fromDropdown ? (
      state.disksHost === undefined || state.disksHost.length < 1 ? (
        <p>{_('noDisks')}</p>
      ) : (
        <ul className='list-group'>
          {state.disksHost.map(disk => (
            <ItemSelectedDisks disk={disk} key={disk.name} onDiskRemove={effects._onDiskRemove} />
          ))}
        </ul>
      )
    ) : null,
])

const ItemSelectedDisks = ({ disk, onDiskRemove }) => {
  const _isDiskRecommendedType = isDiskRecommendedType(disk)
  const _isDiskRo = isDiskRo(disk)
  const _isDiskMounted = isDiskMounted(disk)
  const _diskHasChildren = diskHasChildren(disk)
  const _isTapdevsDisk = isTapdevsDisk(disk)
  const isDiskValid = _isDiskRecommendedType && !_isDiskRo && !_isDiskMounted && !_diskHasChildren && !_isTapdevsDisk

  return (
    <li className='list-group-item'>
      <Icon icon='disk' /> {formatDiskName(disk.name)} {formatSize(Number(disk.size))}
      <ActionButton
        btnStyle='danger'
        className='pull-right'
        handler={onDiskRemove}
        handlerParam={disk}
        icon='delete'
        size='small'
      />
      {!isDiskValid && (
        <div className='text-danger'>
          <Icon icon='error' /> {_('diskIncompatibleXostor')}
          <ul>
            {!_isDiskRecommendedType && <li>{_('selectedDiskTypeIncompatibleXostor', { type: disk.type })}</li>}
            {_isDiskRo && <li>{_('diskIsReadOnly')}</li>}
            {_isDiskMounted && <li>{_('diskAlreadyMounted', { mountpoint: disk.mountpoint })}</li>}
            {_diskHasChildren && <li>{_('diskHasChildren')}</li>}
            {_isTapdevsDisk && <li>{_('isTapdevsDisk')}</li>}
          </ul>
        </div>
      )}
    </li>
  )
}

const SummaryCard = decorate([
  provideState({
    computed: {
      areHostsDisksConsistent: state =>
        state._disksByHostValues.every(disks => disks.length === state._disksByHostValues[0]?.length),
      finalSize: state => {
        const totalSize = state._disksByHostValues.reduce((minSize, disks) => {
          const size = disks.reduce((acc, disk) => acc + Number(disk.size), 0)
          return minSize === 0 || size < minSize ? size : minSize
        }, 0)

        return (totalSize * state.numberOfHostsWithDisks) / state.replication.value
      },
    },
  }),
  injectState,
  ({ state }) => {
    const srDescription = state.srDescription.trim()
    return (
      <Card>
        <CardHeader>{_('summary')}</CardHeader>
        <CardBlock>
          {state.isFormInvalid ? (
            <div className='text-danger'>
              <p>{_('fieldsMissing')}</p>
              <ul>
                {state.isReplicationMissing && <li>{_('fieldRequired', { field: _('replication') })}</li>}
                {state.isProvisioningMissing && <li>{_('fieldRequired', { field: _('provisioning') })}</li>}
                {state.isNameMissing && <li>{_('fieldRequired', { field: _('name') })}</li>}
                {state.isDisksMissing && <li>{_('xostorDiskRequired')}</li>}
              </ul>
            </div>
          ) : (
            <div>
              {!state.areHostsDisksConsistent && (
                <p className='text-warning'>
                  <Icon icon='alarm' /> {_('hostsNotSameNumberOfDisks')}
                </p>
              )}
              <Row>
                <Col size={6}>{_('keyValue', { key: _('name'), value: state.srName })}</Col>
                <Col size={6}>
                  {_('keyValue', {
                    key: _('description'),
                    value: srDescription === '' ? _('noValue') : srDescription,
                  })}
                </Col>
              </Row>
              <Row>
                <Col size={6}>{_('keyValue', { key: _('replication'), value: state.replication.label })}</Col>
                <Col size={6}>{_('keyValue', { key: _('provisioning'), value: state.provisioning.label })}</Col>
              </Row>
              <Row>
                <Col size={12}>{_('keyValue', { key: _('pool'), value: <PoolRenderItem id={state.poolId} /> })}</Col>
                {/* FIXME: XOSTOR network management is not yet implemented at XOSTOR level */}
                {/* <Col size={6}>
                  {_('keyValue', { key: _('network'), value: <NetworkRenderItem id={state.networkId} /> })}
                </Col> */}
              </Row>
              <Row>
                <Col size={6}>{_('keyValue', { key: _('numberOfHosts'), value: state.numberOfHostsWithDisks })}</Col>
                <Col size={6}>
                  {_('keyValue', { key: _('approximateFinalSize'), value: formatSize(state.finalSize) })}
                </Col>
              </Row>
            </div>
          )}
        </CardBlock>
      </Card>
    )
  },
])

const NewXostorForm = decorate([
  connectStore({
    hostsByPoolId: createGetObjectsOfType('host').sort().groupBy('$pool'),
    networks: createGetObjectsOfType('network'),
    pifs: createGetObjectsOfType('PIF'),
  }),
  provideState({
    initialState: () => ({
      _networkId: undefined,
      _createdSrUuid: undefined, // used for redirection when the storage has been created
      disksByHost: {},
      ignoreFileSystems: false,
      provisioning: PROVISIONING_OPTIONS[0], // default value 'thin'
      poolId: undefined,
      hostId: undefined,
      replication: REPLICATION_OPTIONS[1], // default value 2
      srDescription: '',
      srName: '',
    }),
    effects: {
      linkState,
      onHostChange(_, host) {
        this.state.hostId = host?.id
      },
      onIgnoreFileSystemsChange(_, value) {
        this.state.ignoreFileSystems = value
      },
      onPoolChange(_, pool) {
        this.state.disksByHost = {}
        this.state.poolId = pool?.id
      },
      onReplicationChange(_, replication) {
        this.state.replication = replication
      },
      onProvisioningChange(_, provisioning) {
        this.state.provisioning = provisioning
      },
      onNetworkChange(_, network) {
        this.state._networkId = network?.id ?? null
      },
      onDiskChange(_, disk, hostId) {
        const { disksByHost } = this.state
        if (disksByHost[hostId] === undefined) {
          disksByHost[hostId] = []
        }
        disksByHost[hostId].push(disk)
        this.state.disksByHost = { ...disksByHost }
      },
      onDiskRemove(_, disk, hostId) {
        const disks = this.state.disksByHost[hostId]
        remove(disks, _disk => _disk.name === disk.name)
        this.state.disksByHost = {
          ...this.state.disksByHost,
          [hostId]: disks,
        }
      },
      async createXostorSr() {
        const { disksByHost, ignoreFileSystems, srDescription, srName, provisioning, replication } = this.state

        this.state._createdSrUuid = await createXostorSr({
          description: srDescription.trim() === '' ? undefined : srDescription.trim(),
          disksByHost: mapValues(disksByHost, disks => disks.map(disk => formatDiskName(disk.name))),
          ignoreFileSystems,
          name: srName.trim() === '' ? undefined : srName.trim(),
          provisioning: provisioning.value,
          replication: replication.value,
        })
      },
    },
    computed: {
      // Private ==========
      _disksByHostValues: state => Object.values(state.disksByHost).filter(disks => disks.length > 0),
      _defaultNetworkId: (state, props) => props.networks?.[state._pifManagement?.$network]?.id,
      _pifManagement: (state, props) => find(props.pifs, pif => pif.$pool === state.poolId && pif.management),
      // Utils ============
      poolHosts: (state, props) => props.hostsByPoolId?.[state.poolId],
      isPoolSelected: state => state.poolId !== undefined,
      numberOfHostsWithDisks: state => state._disksByHostValues.length,
      isReplicationMissing: state => state.replication === null,
      isProvisioningMissing: state => state.provisioning === null,
      isNameMissing: state => state.srName.trim() === '',
      isDisksMissing: state => state.numberOfHostsWithDisks === 0,
      isFormInvalid: state =>
        state.isReplicationMissing || state.isProvisioningMissing || state.isNameMissing || state.isDisksMissing,
      isXcpngHost: state => isXcpngHost(first(state.poolHosts)),
      getSrPath: state => () => `/srs/${state._createdSrUuid}`,
      // State ============
      networkId: state => (state._networkId === undefined ? state._defaultNetworkId : state._networkId),
    },
  }),
  injectState,
  ({ effects, resetState, state, hostsByPoolId, networks, pifs }) => (
    <Container>
      <Row>
        <Col size={6}>
          <StorageCard />
        </Col>
        <Col size={6}>
          <SettingsCard />
        </Col>
      </Row>
      <Row>
        <Col size={12}>
          <PoolCard hostsByPoolId={hostsByPoolId} />
        </Col>
        {/* FIXME: XOSTOR network management is not yet implemented at XOSTOR level */}
        {/* <Col size={6}>
            <NetworkCard networks={networks} pifs={pifs} />
          </Col> */}
      </Row>
      <Row>
        <DisksCard />
      </Row>
      <Row>
        <SummaryCard />
      </Row>
      <Row>
        <ActionButton
          btnStyle='primary'
          disabled={state.isFormInvalid}
          handler={effects.createXostorSr}
          icon='add'
          redirectOnSuccess={state.getSrPath}
        >
          {_('create')}
        </ActionButton>
        <ActionButton className='ml-1' handler={resetState} icon='reset'>
          {_('formReset')}
        </ActionButton>
      </Row>
    </Container>
  ),
])

export default NewXostorForm
