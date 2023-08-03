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

import Page from '../page'

const N_HOSTS_MIN = 3
const N_HOSTS_MAX = 7

const HEADER = (
  <Container>
    <h2>
      <Icon icon='menu-xostor' /> {_('xostor')}
    </h2>
  </Container>
)

const PROVISIONING_OPTIONS = [
  { value: 'thin', label: 'Thin' },
  { value: 'thick', label: 'Thick' },
]

const REPLICATION_OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
]

const alreadyHaveAXostor = srs => some(srs, sr => sr.SR_type === 'linstor')
const formatDiskName = name => '/dev/' + name
const isDiskHaveChildren = disk => Array.isArray(disk.children) && disk.children.length > 0
const isDiskGoodType = disk => disk.type === 'disk' || /^raid/.test(disk.type)
const isDiskNotMounted = disk => disk.mountpoint === ''
const isDiskNotRo = disk => disk.ro === '0'
const isGoodNumberOfHosts = hosts => size(hosts) >= N_HOSTS_MIN && size(hosts) <= N_HOSTS_MAX
const isXcpngPool = host => host?.productBrand === 'XCP-ng'
const rendererDiskSelect = disk => (
  <span>
    <Icon icon='disk' /> {formatDiskName(disk.name)} {formatSize(Number(disk.size))}
  </span>
)
const xostorDiskPredicate = disk =>
  isDiskGoodType(disk) && isDiskNotRo(disk) && isDiskNotMounted(disk) && !isDiskHaveChildren(disk)

// ===================================================================

const StorageCard = decorate([
  injectState,
  ({ effects, state }) => (
    <Card>
      <CardHeader>{_('storage')}</CardHeader>
      <CardBlock>
        <Row>
          <Col size={6}>
            {_('name')}
            <DebounceInput className='form-control' name='srName' onChange={effects.linkState} value={state.srName} />
          </Col>
          <Col size={6}>
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
        <div>
          <label>
            <strong>{_('replication')}</strong>
          </label>
          <Select options={REPLICATION_OPTIONS} onChange={effects.onReplicationChange} value={state.replication} />
          {state.showWarningReplication && (
            <p className='text-warning'>
              <Icon icon='alarm' /> {_('xostorReplicationWarning')}
            </p>
          )}
        </div>
        <div className='form-group'>
          <label>
            <strong>{_('provisioning')}</strong>
          </label>
          <Select onChange={effects.onProvisioningChange} options={PROVISIONING_OPTIONS} value={state.provisioning} />
        </div>
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
      poolPredicate: (state, props) => pool => {
        if (!state.onlyShowXostorPools) {
          return true
        }
        const hostsPool = props.hostsByPoolId?.[pool.id]
        return (
          isGoodNumberOfHosts(hostsPool) && isXcpngPool(first(hostsPool)) && !alreadyHaveAXostor(props.srs[pool.id])
        )
      },
      isPoolGoodNumberOfHosts: state => isGoodNumberOfHosts(state.hostsPool),
      isPoolAlreadyHaveXostor: (state, props) => alreadyHaveAXostor(props.srs[state.poolId]),
      isPoolCompatibleXostor: state =>
        state.isXcpngPool && state.isPoolGoodNumberOfHosts && !state.isPoolAlreadyHaveXostor,
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
          {state.hostsPool !== undefined && !state.isPoolCompatibleXostor && (
            <div className='text-danger'>
              {/* FIXME: add link of the documentation when ready */}
              <a href='#' rel='noreferrer' target='_blank'>
                {_('objectDoesNotMeetXostorRequirements', { object: <PoolRenderItem id={state.poolId} /> })}
              </a>
              <ul>
                {!state.isXcpngPool && <li>{_('notXcpPool')}</li>}
                {!state.isPoolGoodNumberOfHosts && <li>{_('wrongNumberOfHosts')}</li>}
                {state.isPoolAlreadyHaveXostor && <li>{_('poolAlreadyHaveXostor')}</li>}
              </ul>
            </div>
          )}
          <em>
            {/*
              FIXME: If packages are already installed display: '"xcp-ng-release-linstor" and "xcp-ng-linstor" are already installed.'
              Need to be done when backend is done.
            */}
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
        const filterByPoolId = network.$pool === state.poolId
        const pifs = network.PIFs
        return state.onlyShowXostorNetworks
          ? filterByPoolId && pifs.length > 0 && pifs.every(pifId => props.pifs[pifId].ip !== '')
          : filterByPoolId
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
        state.isHostSelected && state.isXcpngPool ? (await getBlockdevices(state.hostId)).blockdevices : undefined,
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
            <Row>
              <div className={styles.disksSelectors}>
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
                  {state.isPoolSelected && !state.isXcpngPool && (
                    <p className='text-danger mb-0'>
                      <Icon icon='alarm' /> {_('cantFetchDisksFromNonXcpngHost')}
                    </p>
                  )}
                  <Select
                    disabled={!state.isHostSelected || !state.isPoolSelected || !state.isXcpngPool}
                    onChange={effects._onDiskChange}
                    optionRenderer={rendererDiskSelect}
                    options={state.isHostSelected ? state.selectableDisks : []}
                    placeholder={_('selectDisks')}
                    value={null}
                  />
                </Col>
              </div>
            </Row>
            <Row>
              <Col>
                <ListSelectedDisks hostId={state.hostId} />
              </Col>
            </Row>
          </Col>
          <Col size={4}>
            {map(state.hostsPool, host => (
              <Collapse
                buttonText={_('xostorDisksDropdownLabel', {
                  nDisks: state.disksByHost[host.id]?.length ?? 0,
                  hostname: host.hostname,
                })}
                defaultOpen
                key={host.id}
                size='small'
              >
                <ListSelectedDisks hostId={host.id} fromDropdown />
              </Collapse>
            ))}
          </Col>
        </Row>
      </CardBlock>
    </Card>
  ),
])

const ListSelectedDisks = decorate([
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
  const diskGoodType = isDiskGoodType(disk)
  const diskNotRo = isDiskNotRo(disk)
  const diskNotMounted = isDiskNotMounted(disk)
  const diskHaveChildren = isDiskHaveChildren(disk)
  const isDiskValid = diskGoodType && diskNotRo && diskNotMounted && !diskHaveChildren

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
            {!diskGoodType && <li>{_('selectedDiskTypeIncompatibleXostor', { type: disk.type })}</li>}
            {!diskNotRo && <li>{_('diskIsReadOnly')}</li>}
            {!diskNotMounted && <li>{_('diskAlreadyMounted', { mountpoint: disk.mountpoint })}</li>}
            {diskHaveChildren && <li>{_('diskHaveChildren')}</li>}
          </ul>
        </div>
      )}
    </li>
  )
}

const ResumeCard = decorate([
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
      <CardHeader>{_('resume')}</CardHeader>
      <CardBlock>
        {state.isFormInvalid ? (
          <div className='text-danger'>
            <p>{_('fieldsMissing')}</p>
            <ul>
              {state.isReplicationMissing && <li>{_('fieldRequired', { field: _('replication') })}</li>}
              {state.isProvisioningMissing && <li>{_('fieldRequired', { field: _('provisioning') })}</li>}
              {state.isNameIsMissing && <li>{_('fieldRequired', { field: _('name') })}</li>}
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
              <Col size={6}>{_('keyValue', { key: _('hostsNumber'), value: state.numberOfHostsWithDisks })}</Col>
              <Col size={6}>
                {_('keyValue', { key: _('approximativeFinalSize'), value: formatSize(state.finalSize) })}
              </Col>
            </Row>
          </div>
        )}
      </CardBlock>
    </Card>
  ),
])

const Xostor = decorate([
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
      hostsPool: (state, props) => props.hostsByPoolId?.[state.poolId],
      isPoolSelected: state => state.poolId !== undefined,
      numberOfHostsWithDisks: state => state._disksByHostValues.length,
      isReplicationMissing: state => state.replication === null,
      isProvisioningMissing: state => state.provisioning === null,
      isNameIsMissing: state => state.srName.trim() === '',
      isDisksMissing: state => state.numberOfHostsWithDisks === 0,
      isFormInvalid: state =>
        state.isReplicationMissing || state.isProvisioningMissing || state.isNameIsMissing || state.isDisksMissing,
      isXcpngPool: state => isXcpngPool(first(state.hostsPool)),
      // State ============
      networkId: state => state._networkId ?? state._defaultNetworkId,
    },
  }),
  injectState,
  ({ resetState, state, hostsByPoolId, networks, pifs }) => (
    <Page header={HEADER}>
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
          <ResumeCard />
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
    </Page>
  ),
])

export default Xostor
