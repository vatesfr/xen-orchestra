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
import { confirm } from 'modal'
import { createGetObjectsOfType } from 'selectors'
import { first, map, mapValues, remove, size, some } from 'lodash'
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
const isTapdevDisk = disk => disk.name.startsWith('td')
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
  !isTapdevDisk(disk)
const arePifsAttached = pifs => pifs.every(pif => pif.attached)
const arePifsStatic = pifs => pifs.every(pif => pif.mode === 'Static' || pif.ipv6Mode === 'Static')
const doesNetworkHavePifs = network => network.PIFs.length > 0
const doPifsHaveIp = pifs => pifs.every(pif => pif.ip !== '' || (pif.ipv6.length > 0 && pif.ipv6.some(v6 => v6 !== '')))

// ===================================================================

const StorageCard = decorate([
  injectState,
  ({ effects, state }) => (
    <Card>
      <CardHeader>{_('newSrGeneral')}</CardHeader>
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
          <Col>
            <i>
              <Icon icon='info' /> {_('ignoreFileSystemsInfo')}
            </i>
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
              {/* <a href='#' rel='noreferrer' target='_blank'>
                {_('objectDoesNotMeetXostorRequirements', { object: <PoolRenderItem id={state.poolId} /> })}
              </a> */}
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
          <div>
            <em>
              <Icon icon='info' /> {_('xostorPackagesWillBeInstalled')}
            </em>
          </div>
        </div>
      </CardBlock>
    </Card>
  ),
])

export const NetworkCard = decorate([
  connectStore({
    networks: createGetObjectsOfType('network'),
    pifsByNetwork: createGetObjectsOfType('PIF').groupBy('$network'),
  }),
  provideState({
    initialState: () => ({ onlyShowXostorNetworks: true }),
    effects: {
      toggleState,
      _onNetworkChange(_, network) {
        this.props.onChange({
          ...this.state._networkValues,
          networkId: network?.id,
        })
      },
      _onInterfaceNameChange(_, ev) {
        this.props.onChange({
          ...this.state._networkValues,
          interfaceName: ev.target.value,
        })
      },
    },
    computed: {
      networksPredicate: (state, props) => network => {
        if (network.$pool !== (props.insideModalForm ? props.sr.$pool : state.poolId)) {
          return false
        }
        const pifs = props.pifsByNetwork[network.id]
        return (
          !state.onlyShowXostorNetworks ||
          (doesNetworkHavePifs(network) && arePifsStatic(pifs) && doPifsHaveIp(pifs) && arePifsAttached(pifs))
        )
      },
      networkHavePifs: (state, props) => doesNetworkHavePifs(props.networks[state._networkValues.networkId]),
      pifsAreAttached: (state, props) => arePifsAttached(props.pifsByNetwork[state._networkValues.networkId]),
      pifsAreStatic: (state, props) => arePifsStatic(props.pifsByNetwork[state._networkValues.networkId]),
      pifsHaveIp: (state, props) => doPifsHaveIp(props.pifsByNetwork[state._networkValues.networkId]),
      interfaceNameContainsWhiteSpace: state => state._networkValues.interfaceName.includes(' '),
      interfaceNameReserved: state => state._networkValues.interfaceName.trim() === 'default',
      networkCompatible: state =>
        state.networkHavePifs && state.pifsAreStatic && state.pifsHaveIp && state.pifsAreAttached,
      _networkValues: (state, props) => ({
        interfaceName: props.insideModalForm ? props.value.interfaceName : state.interfaceName,
        networkId: props.insideModalForm ? props.value.networkId : state.networkId,
      }),
    },
  }),
  injectState,
  ({ effects, state, insideModalForm }) => (
    <Card>
      <CardHeader>
        {_('network')}
        {!insideModalForm && _('optionalEntry')}
      </CardHeader>
      <CardBlock>
        {!insideModalForm && (
          <i className='d-block'>
            <Icon icon='info' /> {_('byDefaultManagementNetworkUsed')}
          </i>
        )}
        <Row className='mb-1'>
          <Col>
            {_('interfaceName')}
            <DebounceInput
              className='form-control'
              name='interfaceName'
              onChange={effects._onInterfaceNameChange}
              value={state._networkValues.interfaceName}
            />
            <ul className='text-danger'>
              {state.interfaceNameReserved && (
                <li>
                  <Icon icon='alarm' /> {_('interfaceNameReserved')}
                </li>
              )}
              {state.interfaceNameContainsWhiteSpace && (
                <li>
                  <Icon icon='alarm' /> {_('whiteSpaceNotAllowed')}
                </li>
              )}
            </ul>
          </Col>
        </Row>
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
          disabled={!insideModalForm && !state.isPoolSelected}
          onChange={effects._onNetworkChange}
          predicate={state.networksPredicate}
          value={state._networkValues.networkId}
        />
        {state._networkValues.networkId !== undefined && !state.networkCompatible && (
          <div className='text-danger'>
            <ul>
              {!state.networkHavePifs && <li>{_('networkNoPifs')}</li>}
              {!state.pifsHaveIp && <li>{_('pifsNoIp')}</li>}
              {!state.pifsAreStatic && <li>{_('pifsNotStatic')}</li>}
              {!state.pifsAreAttached && <li>{_('pifsNotAttached')}</li>}
            </ul>
          </div>
        )}
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
  const _isTapdevDisk = isTapdevDisk(disk)
  const isDiskValid = _isDiskRecommendedType && !_isDiskRo && !_isDiskMounted && !_diskHasChildren && !_isTapdevDisk

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
            {_diskHasChildren && <li>{_('diskHasExistingPartition')}</li>}
            {_isTapdevDisk && <li>{_('isTapdevDisk')}</li>}
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
          if (disks.length === 0) {
            return minSize
          }
          const size = disks.reduce((acc, disk) => acc + Number(disk.size), 0)
          return minSize === 0 || size < minSize ? size : minSize
        }, 0)

        return (totalSize * state.numberOfHostsWithDisks) / state.replication.value
      },
      replicationNotValid: state => state.replication.value > state.numberOfHostsWithDisks,
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
                {state.isInterfaceNameMissing && <li>{_('interfaceNameRequired')}</li>}
              </ul>
            </div>
          ) : (
            <div>
              {!state.areHostsDisksConsistent && (
                <p className='text-warning'>
                  <Icon icon='alarm' /> {_('hostsNotSameNumberOfDisks')}
                </p>
              )}
              {state.replicationNotValid && (
                <p className='text-warning'>
                  <Icon icon='alarm' /> {_('replicationCountHigherThanHostsWithDisks')}
                </p>
              )}
              <Row>
                <Col size={6}>{_('keyValue', { key: _('name'), value: state.srName })}</Col>
                <Col size={6}>
                  {_('keyValue', {
                    key: _('description'),
                    value: srDescription,
                  })}
                </Col>
              </Row>
              <Row>
                <Col size={6}>{_('keyValue', { key: _('replication'), value: state.replication.label })}</Col>
                <Col size={6}>{_('keyValue', { key: _('provisioning'), value: state.provisioning.label })}</Col>
              </Row>
              <Row>
                <Col size={6}>{_('keyValue', { key: _('pool'), value: <PoolRenderItem id={state.poolId} /> })}</Col>
                <Col size={6}>
                  {_('keyValue', {
                    key: _('network'),
                    value: state.networkId && <NetworkRenderItem id={state.networkId} />,
                  })}
                </Col>
              </Row>
              <Row>
                <Col size={6}>{_('keyValue', { key: _('numberOfHosts'), value: state.numberOfHostsWithDisks })}</Col>
                <Col size={6}>
                  {_('keyValue', { key: _('approximateSrCapacity'), value: formatSize(state.finalSize) })}
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
  }),
  provideState({
    initialState: () => ({
      _createdSrUuid: undefined, // used for redirection when the storage has been created
      disksByHost: {},
      ignoreFileSystems: false,
      interfaceName: '',
      provisioning: PROVISIONING_OPTIONS[0], // default value 'thin'
      poolId: undefined,
      hostId: undefined,
      networkId: undefined,
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
        const disksByHost = {}
        this.props.hostsByPoolId[pool?.id]?.forEach(host => {
          disksByHost[host.id] = []
        })
        this.state.disksByHost = disksByHost
        this.state.poolId = pool?.id
      },
      onReplicationChange(_, replication) {
        this.state.replication = replication
      },
      onProvisioningChange(_, provisioning) {
        this.state.provisioning = provisioning
      },
      onNetworkChange(_, { interfaceName, networkId }) {
        this.state.interfaceName = interfaceName
        this.state.networkId = networkId
      },
      onDiskChange(_, disk, hostId) {
        const { disksByHost } = this.state

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
        const {
          disksByHost,
          ignoreFileSystems,
          interfaceName,
          networkId,
          srDescription,
          srName,
          provisioning,
          replication,
        } = this.state

        await confirm({
          title: _('xostorCreation'),
          body: _('createXostoreConfirm'),
        })

        const preferredInterface =
          networkId !== undefined
            ? {
                networkId,
                name: interfaceName.trim(),
              }
            : undefined

        this.state._createdSrUuid = await createXostorSr({
          description: srDescription.trim() === '' ? undefined : srDescription.trim(),
          disksByHost: mapValues(disksByHost, disks => disks.map(disk => formatDiskName(disk.name))),
          ignoreFileSystems,
          name: srName.trim() === '' ? undefined : srName.trim(),
          provisioning: provisioning.value,
          replication: replication.value,
          preferredInterface,
        })
      },
    },
    computed: {
      // Private ==========
      _disksByHostValues: state => Object.values(state.disksByHost),
      // Utils ============
      poolHosts: (state, props) => props.hostsByPoolId?.[state.poolId],
      isPoolSelected: state => state.poolId !== undefined,
      numberOfHostsWithDisks: state => state._disksByHostValues.filter(disks => disks.length > 0).length,
      isReplicationMissing: state => state.replication === null,
      isProvisioningMissing: state => state.provisioning === null,
      isNameMissing: state => state.srName.trim() === '',
      isDisksMissing: state => state.numberOfHostsWithDisks === 0,
      isInterfaceNameMissing: state => state.networkId !== undefined && state.interfaceName.trim() === '',
      isFormInvalid: state =>
        state.isReplicationMissing ||
        state.isProvisioningMissing ||
        state.isNameMissing ||
        state.isDisksMissing ||
        state.isInterfaceNameMissing,
      isXcpngHost: state => isXcpngHost(first(state.poolHosts)),
      getSrPath: state => () => `/srs/${state._createdSrUuid}`,
    },
  }),
  injectState,
  ({ effects, resetState, state, hostsByPoolId }) => (
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
          <NetworkCard onChange={effects.onNetworkChange} />
        </Col>
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
