import BaseComponent from 'base-component'
import every from 'lodash/every'
import flatten from 'lodash/flatten'
import forEach from 'lodash/forEach'
import filter from 'lodash/filter'
import find from 'lodash/find'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import some from 'lodash/some'
import store from 'store'

import _ from '../../intl'
import Icon from 'icon'
import invoke from '../../invoke'
import SingleLineRow from '../../single-line-row'
import Tooltip from '../../tooltip'
import { Col } from '../../grid'
import { getDefaultNetworkForVif, getDefaultMigrationNetwork } from '../utils'
import { SelectHost, SelectNetwork, SelectSr } from '../../select-objects'
import { connectStore, createCompare } from '../../utils'
import { createGetObjectsOfType, createPicker, createSelector, getObject } from '../../selectors'
import { isSrShared } from 'xo'

import { isSrWritable } from '../'

const LINE_STYLE = { paddingBottom: '1em' }

@connectStore(
  () => {
    const getNetworks = createGetObjectsOfType('network')
    const getPifs = createGetObjectsOfType('PIF')
    const getPools = createGetObjectsOfType('pool')

    const getVms = createGetObjectsOfType('VM').pick((_, props) => props.vms)

    const getVbdsByVm = createGetObjectsOfType('VBD')
      .pick(createSelector(getVms, vms => flatten(map(vms, vm => vm.$VBDs))))
      .groupBy('VM')

    const getVifsByVM = createGetObjectsOfType('VIF')
      .pick(createSelector(getVms, vms => flatten(map(vms, vm => vm.VIFs))))
      .groupBy('$VM')

    return {
      networks: getNetworks,
      pifs: getPifs,
      pools: getPools,
      vbdsByVm: getVbdsByVm,
      vifsByVm: getVifsByVM,
      vms: getVms,
    }
  },
  { withRef: true }
)
export default class MigrateVmsModalBody extends BaseComponent {
  constructor(props) {
    super(props)

    this._getHostPredicate = createSelector(
      () => this.props.vms,
      vms => host => some(vms, vm => host.id !== vm.$container)
    )

    this._getSrPredicate = createSelector(
      () => this.state.host,
      host => (host ? sr => isSrWritable(sr) && (sr.$container === host.id || sr.$container === host.$pool) : false)
    )

    this._getTargetNetworkPredicate = createSelector(
      () => this.props.networks,
      () => this.state.host.$poolId,
      (networks, poolId) => {
        const _networks = {}
        forEach(networks, network => {
          if (network.$poolId === poolId) {
            _networks[network.id] = true
          }
        })
        return isEmpty(_networks) ? false : network => _networks[network.id]
      }
    )

    this._getMigrationNetworkPredicate = createSelector(
      createPicker(
        () => this.props.pifs,
        () => this.state.host.$PIFs
      ),
      pifs => {
        if (!pifs) {
          return false
        }

        const networks = {}
        forEach(pifs, pif => {
          pif.ip && (networks[pif.$network] = true)
        })

        return network => networks[network.id]
      }
    )
  }

  componentDidMount() {
    this._selectHost(this.props.host)
  }

  get value() {
    const { host } = this.state
    const vms = filter(this.props.vms, vm => vm.$container !== host.id)
    if (!host || isEmpty(vms)) {
      return { vms }
    }
    const { networks, pifs, vbdsByVm, vifsByVm } = this.props
    const { doNotMigrateVdi, doNotMigrateVmVdis, migrationNetworkId, networkId, smartVifMapping, srId } = this.state

    // Map VM --> ( Map VDI --> SR )
    // 2021-02-16: Fill the map (VDI -> SR) with *all* the VDIs to avoid unexpectedly migrating them to the wrong SRs:
    // - Intra-pool: a VDI will only be migrated to the selected SR if the VDI was on a local SR.
    // - Inter-pool: all VDIs will be migrated to the selected SR.
    const mapVmsMapVdisSrs = {}
    forEach(vbdsByVm, (vbds, vm) => {
      const mapVdisSrs = {}
      forEach(vbds, vbd => {
        const vdi = vbd.VDI
        if (!vbd.is_cd_drive && vdi) {
          mapVdisSrs[vdi] = doNotMigrateVmVdis[vm] || doNotMigrateVdi[vdi] ? this._getObject(vdi).$SR : srId
        }
      })
      mapVmsMapVdisSrs[vm] = mapVdisSrs
    })

    const defaultNetwork =
      smartVifMapping &&
      invoke(() => {
        // First PIF with an IP.
        const pifId = find(host.$PIFs, pif => pifs[pif].ip)
        const pif = pifId && pifs[pifId]

        return pif && pif.$network
      })

    // Map VM --> ( Map VIF --> network )
    const mapVmsMapVifsNetworks = {}
    forEach(vms, vm => {
      if (vm.$pool === host.$pool) {
        return
      }
      const mapVifsNetworks = {}
      forEach(vifsByVm[vm.id], vif => {
        mapVifsNetworks[vif.id] = smartVifMapping
          ? getDefaultNetworkForVif(vif, host, pifs, networks) || defaultNetwork
          : networkId
      })
      mapVmsMapVifsNetworks[vm.id] = mapVifsNetworks
    })

    return {
      mapVmsMapVdisSrs,
      mapVmsMapVifsNetworks,
      migrationNetwork: migrationNetworkId,
      sr: srId,
      targetHost: host.id,
      vms,
    }
  }

  _getObject(id) {
    return getObject(store.getState(), id)
  }

  _selectHost = host => {
    if (!host) {
      this.setState({ targetHost: undefined })
      return
    }
    const { pools, pifs } = this.props
    const intraPool = every(this.props.vms, vm => vm.$pool === host.$pool)
    const defaultMigrationNetworkId = getDefaultMigrationNetwork(intraPool, host, pools, pifs)
    const defaultSrId = pools[host.$pool].default_SR
    const defaultSrConnectedToHost = some(host.$PBDs, pbd => this._getObject(pbd).SR === defaultSrId)

    const doNotMigrateVmVdis = {}
    const doNotMigrateVdi = {}
    let noVdisMigration = false
    if (intraPool) {
      forEach(this.props.vbdsByVm, (vbds, vm) => {
        if (this._getObject(vm).$container === host.id) {
          doNotMigrateVmVdis[vm] = true
          return
        }
        const _doNotMigrateVdi = {}
        forEach(vbds, vbd => {
          if (vbd.VDI != null) {
            doNotMigrateVdi[vbd.VDI] = _doNotMigrateVdi[vbd.VDI] = isSrShared(
              this._getObject(this._getObject(vbd.VDI).$SR)
            )
          }
        })
        doNotMigrateVmVdis[vm] = every(_doNotMigrateVdi)
      })
      noVdisMigration = every(doNotMigrateVmVdis)
    }
    this.setState({
      defaultSrConnectedToHost,
      defaultSrId,
      host,
      intraPool,
      doNotMigrateVdi,
      doNotMigrateVmVdis,
      migrationNetworkId: defaultMigrationNetworkId,
      networkId: defaultMigrationNetworkId,
      noVdisMigration,
      smartVifMapping: true,
      srId: defaultSrConnectedToHost ? defaultSrId : undefined,
    })
  }

  getCompareContainers = createSelector(
    () => this.props.vms,
    vms => createCompare([pool => some(vms, vm => vm.$pool === pool.id)])
  )

  _selectMigrationNetwork = migrationNetwork =>
    this.setState({ migrationNetworkId: migrationNetwork == null ? undefined : migrationNetwork.id })
  _selectNetwork = network => this.setState({ networkId: network.id })
  _selectSr = sr => this.setState({ srId: sr.id })
  _toggleSmartVifMapping = () => this.setState({ smartVifMapping: !this.state.smartVifMapping })

  render() {
    const {
      defaultSrConnectedToHost,
      defaultSrId,
      host,
      intraPool,
      migrationNetworkId,
      networkId,
      noVdisMigration,
      smartVifMapping,
      srId,
    } = this.state
    return (
      <div>
        <div style={LINE_STYLE}>
          <SingleLineRow>
            <Col size={6}>{_('migrateVmSelectHost')}</Col>
            <Col size={6}>
              <SelectHost
                compareContainers={this.getCompareContainers()}
                onChange={this._selectHost}
                predicate={this._getHostPredicate()}
                value={host}
              />
            </Col>
          </SingleLineRow>
        </div>
        {host !== undefined && (
          <div style={LINE_STYLE}>
            <SingleLineRow>
              <Col size={6}>{_('migrateVmSelectMigrationNetwork')}</Col>
              <Col size={6}>
                <SelectNetwork
                  onChange={this._selectMigrationNetwork}
                  predicate={this._getMigrationNetworkPredicate()}
                  required={!intraPool}
                  value={migrationNetworkId}
                />
              </Col>
            </SingleLineRow>
            {intraPool && <i>{_('optionalEntry')}</i>}
          </div>
        )}
        {host && (!noVdisMigration || migrationNetworkId != null) && (
          <div key='sr' style={LINE_STYLE}>
            <SingleLineRow>
              <Col size={6}>
                {!intraPool ? _('migrateVmsSelectSr') : _('migrateVmsSelectSrIntraPool')}{' '}
                {(defaultSrId === undefined || !defaultSrConnectedToHost) && (
                  <Tooltip
                    content={
                      defaultSrId !== undefined
                        ? _('migrateVmNotConnectedDefaultSrError')
                        : _('migrateVmNoDefaultSrError')
                    }
                  >
                    <Icon
                      icon={defaultSrId !== undefined ? 'alarm' : 'info'}
                      className={defaultSrId !== undefined ? 'text-warning' : 'text-info'}
                      size='lg'
                    />
                  </Tooltip>
                )}
              </Col>
              <Col size={6}>
                <SelectSr onChange={this._selectSr} predicate={this._getSrPredicate()} required value={srId} />
              </Col>
            </SingleLineRow>
          </div>
        )}
        {host && !intraPool && (
          <div key='network' style={LINE_STYLE}>
            <SingleLineRow>
              <Col size={6}>{_('migrateVmsSelectNetwork')}</Col>
              <Col size={6}>
                <SelectNetwork
                  disabled={smartVifMapping}
                  onChange={this._selectNetwork}
                  predicate={this._getTargetNetworkPredicate()}
                  value={networkId}
                />
              </Col>
            </SingleLineRow>
            <SingleLineRow>
              <Col size={6} offset={6}>
                <input type='checkbox' onChange={this._toggleSmartVifMapping} checked={smartVifMapping} />{' '}
                {_('migrateVmsSmartMapping')}
              </Col>
            </SingleLineRow>
          </div>
        )}
      </div>
    )
  }
}
