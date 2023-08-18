import _ from 'intl'
import ActionButton from 'action-button'
import Collapse from 'collapse'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import Select from 'form/select'
import { Card, CardBlock, CardHeader } from 'card'
import { connectStore, formatSize } from 'utils'
import { Container, Col, Row } from 'grid'
import { createGetObjectsOfType } from 'selectors'
import { find, first, map, remove, size, some } from 'lodash'
import { getBlockdevices } from 'xo'
import { injectState, provideState } from 'reaclette'
import { Input as DebounceInput } from 'debounce-input-decorator'
import { Pool as PoolRenderItem, Network as NetworkRenderItem } from 'render-xo-item'
import { SelectHost, SelectPool, SelectNetwork } from 'select-objects'
import { toggleState, linkState } from 'reaclette-utils'

import styles from './index.css'

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

const hasAXostor = srs => some(srs, sr => sr.SR_type === 'linstor')
const formatDiskName = name => '/dev/' + name
const diskHasChildren = disk => Array.isArray(disk.children) && disk.children.length > 0
const isDiskGoodType = disk => disk.type === 'disk' || disk.type.startsWith('raid')
const isDiskMounted = disk => disk.mountpoint !== ''
const isDiskRo = disk => disk.ro === '1'
const hasGoodNumberOfHosts = hosts => size(hosts) >= N_HOSTS_MIN && size(hosts) <= N_HOSTS_MAX
const isXcpngHost = host => host?.productBrand === 'XCP-ng'
const diskSelectRenderer = disk => (
  <span>
    <Icon icon='disk' /> {formatDiskName(disk.name)} {formatSize(Number(disk.size))}
  </span>
)
const xostorDiskPredicate = disk =>
  isDiskGoodType(disk) && !isDiskRo(disk) && !isDiskMounted(disk) && !diskHasChildren(disk)

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
    computed: {
      showWarningReplication: state => state.replication?.value === 1,
    },
  }),
  injectState,
  ({ effects, state }) => (
    <Card>
      <CardHeader>{_('settings')}</CardHeader>
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
          return hasGoodNumberOfHosts(poolHosts) && isXcpngHost(first(poolHosts)) && !hasAXostor(props.srs[pool.id])
        }
      },
      poolHasGoodNumberOfHosts: state => hasGoodNumberOfHosts(state.poolHosts),
      poolHasAXostor: (state, props) => hasAXostor(props.srs[state.poolId]),
      isPoolXostorCompatible: state => state.isXcpngHost && state.poolHasGoodNumberOfHosts && !state.poolHasAXostor,
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
                {!state.poolHasGoodNumberOfHosts && <li>{_('wrongNumberOfHosts')}</li>}
                {state.poolHasAXostor && <li>{_('poolAlreadyHasXostor')}</li>}
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
      hostId: undefined,
      onlyShowXostorDisks: true,
    }),
    effects: {
      toggleState,
      onHostChange(_, host) {
        this.state.hostId = host?.id
      },
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
  const _isDiskGoodType = isDiskGoodType(disk)
  const _isDiskRo = isDiskRo(disk)
  const _isDiskMounted = isDiskMounted(disk)
  const _diskHasChildren = diskHasChildren(disk)
  const isDiskValid = _isDiskGoodType && !_isDiskRo && !_isDiskMounted && !_diskHasChildren

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
            {!_isDiskGoodType && <li>{_('selectedDiskTypeIncompatibleXostor', { type: disk.type })}</li>}
            {_isDiskRo && <li>{_('diskIsReadOnly')}</li>}
            {_isDiskMounted && <li>{_('diskAlreadyMounted', { mountpoint: disk.mountpoint })}</li>}
            {_diskHasChildren && <li>{_('diskHasChildren')}</li>}
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
  ({ state }) => (
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
              <Col size={6}>{_('keyValue', { key: _('description'), value: state.srDescription })}</Col>
            </Row>
            <Row>
              <Col size={6}>{_('keyValue', { key: _('replication'), value: state.replication.label })}</Col>
              <Col size={6}>{_('keyValue', { key: _('provisioning'), value: state.provisioning.label })}</Col>
            </Row>
            <Row>
              <Col size={6}>{_('keyValue', { key: _('pool'), value: <PoolRenderItem id={state.poolId} /> })}</Col>
              <Col size={6}>
                {_('keyValue', { key: _('network'), value: <NetworkRenderItem id={state.networkId} /> })}
              </Col>
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
  ),
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
      disksByHost: {},
      provisioning: PROVISIONING_OPTIONS[0], // default value 'thin'
      poolId: undefined,
      replication: REPLICATION_OPTIONS[1], // default value 2
      srDescription: '',
      srName: '',
    }),
    effects: {
      linkState,
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
        this.state._networkId = network?.id
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
      // State ============
      networkId: state => state._networkId ?? state._defaultNetworkId,
    },
  }),
  injectState,
  ({ resetState, state, hostsByPoolId, networks, pifs }) => (
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
        <Col size={6}>
          <PoolCard hostsByPoolId={hostsByPoolId} />
        </Col>
        <Col size={6}>
          <NetworkCard networks={networks} pifs={pifs} />
        </Col>
      </Row>
      <Row>
        <DisksCard />
      </Row>
      <Row>
        <SummaryCard />
      </Row>
      <Row>
        <ActionButton btnStyle='primary' disabled={state.isFormInvalid} icon='add'>
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
