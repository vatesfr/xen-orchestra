import BaseComponent from 'base-component'
import every from 'lodash/every'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import store from 'store'

import _ from '../../intl'
import ChooseSrForEachVdisModal from '../choose-sr-for-each-vdis-modal'
import invoke from '../../invoke'
import SingleLineRow from '../../single-line-row'
import { Col } from '../../grid'
import { connectStore, mapPlus, resolveId, resolveIds } from '../../utils'
import { getDefaultNetworkForVif, getDefaultMigrationNetwork } from '../utils'
import { SelectHost, SelectNetwork } from '../../select-objects'
import { createGetObjectsOfType, createPicker, createSelector, getObject } from '../../selectors'

import { isSrShared, isSrWritable } from '../'

import styles from './index.css'

@connectStore(
  () => {
    const getVm = (_, props) => props.vm

    const getVbds = createGetObjectsOfType('VBD')
      .pick((state, props) => getVm(state, props).$VBDs)
      .sort()

    const getVdis = createGetObjectsOfType('VDI').pick(
      createSelector(getVbds, vbds =>
        mapPlus(vbds, (vbd, push) => {
          if (!vbd.is_cd_drive && vbd.VDI) {
            push(vbd.VDI)
          }
        })
      )
    )

    const getVifs = createGetObjectsOfType('VIF')
      .pick(createSelector(getVm, vm => vm.VIFs))
      .sort()

    const getPifs = createGetObjectsOfType('PIF')
    const getNetworks = createGetObjectsOfType('network')
    const getPools = createGetObjectsOfType('pool')

    return {
      networks: getNetworks,
      pifs: getPifs,
      pools: getPools,
      vbds: getVbds,
      vdis: getVdis,
      vifs: getVifs,
    }
  },
  { withRef: true }
)
export default class MigrateVmModalBody extends BaseComponent {
  constructor(props) {
    super(props)

    this.state = {
      mapVifsNetworks: {},
      targetSrs: {},
      host: props.host || undefined,
      intraPool: props.host ? props.vm.$pool === props.host.$pool : undefined,
    }

    this._getHostPredicate = createSelector(
      () => this.props.vm,
      ({ $container }) =>
        host =>
          host.id !== $container
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

  get value() {
    return {
      mapVdisSrs: resolveIds(this.state.targetSrs.mapVdisSrs),
      mapVifsNetworks: this.state.mapVifsNetworks,
      migrationNetwork: this.state.migrationNetworkId,
      sr: resolveId(this.state.targetSrs.mainSr),
      targetHost: this.state.host && this.state.host.id,
    }
  }

  _getObject(id) {
    return getObject(store.getState(), id)
  }

  _selectHost = host => {
    // No host selected
    if (!host) {
      this.setState({
        host: undefined,
        intraPool: undefined,
      })
      return
    }

    const { pifs, pools, vbds, vm } = this.props
    const intraPool = vm.$pool === host.$pool
    // Intra-pool
    if (intraPool) {
      let doNotMigrateVdis
      if (vm.$container === host.id) {
        doNotMigrateVdis = true
      } else {
        const _doNotMigrateVdi = {}
        forEach(vbds, vbd => {
          if (vbd.VDI != null) {
            _doNotMigrateVdi[vbd.VDI] = isSrShared(this._getObject(this._getObject(vbd.VDI).$SR))
          }
        })
        doNotMigrateVdis = every(_doNotMigrateVdi)
      }

      this.setState({
        doNotMigrateVdis,
        host,
        intraPool,
        mapVifsNetworks: undefined,
        migrationNetworkId: getDefaultMigrationNetwork(intraPool, host, pools, pifs),
        targetSrs: {},
      })
      return
    }

    // Inter-pool
    const { networks, vifs } = this.props

    const defaultNetwork = invoke(() => {
      // First PIF with an IP.
      const pifId = find(host.$PIFs, pif => pifs[pif].ip)
      const pif = pifId && pifs[pifId]

      return pif && pif.$network
    })

    const defaultNetworksForVif = {}
    forEach(vifs, vif => {
      defaultNetworksForVif[vif.id] = getDefaultNetworkForVif(vif, host, pifs, networks) || defaultNetwork
    })

    this.setState({
      doNotMigrateVdis: false,
      host,
      intraPool,
      mapVifsNetworks: defaultNetworksForVif,
      migrationNetworkId: getDefaultMigrationNetwork(intraPool, host, pools, pifs),
      targetSrs: { mainSr: pools[host.$pool].default_SR },
    })
  }

  compareContainers = (pool1, pool2) => {
    const { $pool: poolId } = this.props.vm
    return pool1.id === poolId ? -1 : pool2.id === poolId ? 1 : 0
  }

  _selectMigrationNetwork = migrationNetwork =>
    this.setState({
      migrationNetworkId: migrationNetwork == null ? undefined : migrationNetwork.id,
    })

  render() {
    const { vdis, vifs, networks } = this.props
    const { doNotMigrateVdis, host, intraPool, mapVifsNetworks, migrationNetworkId, targetSrs } = this.state
    return (
      <div>
        <div className={styles.block}>
          <SingleLineRow>
            <Col size={6}>{_('migrateVmSelectHost')}</Col>
            <Col size={6}>
              <SelectHost
                compareContainers={this.compareContainers}
                onChange={this._selectHost}
                predicate={this._getHostPredicate()}
                required
                value={host}
              />
            </Col>
          </SingleLineRow>
        </div>
        {host && (!doNotMigrateVdis || migrationNetworkId != null) && (
          <div className={styles.groupBlock}>
            <SingleLineRow>
              <Col size={12}>
                <ChooseSrForEachVdisModal
                  mainSrPredicate={this._getSrPredicate()}
                  onChange={this.linkState('targetSrs')}
                  required
                  value={targetSrs}
                  vdis={vdis}
                />
              </Col>
            </SingleLineRow>
          </div>
        )}
        {host !== undefined && (
          <div className={styles.groupBlock}>
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
        {intraPool !== undefined && !intraPool && (
          <div>
            <div className={styles.groupBlock}>
              <SingleLineRow>
                <Col>{_('migrateVmSelectNetworks')}</Col>
              </SingleLineRow>
              <br />
              <SingleLineRow>
                <Col size={6}>
                  <span className={styles.listTitle}>{_('migrateVmVif')}</span>
                </Col>
                <Col size={6}>
                  <span className={styles.listTitle}>{_('migrateVmNetwork')}</span>
                </Col>
              </SingleLineRow>
              {map(vifs, vif => (
                <div className={styles.listItem} key={vif.id}>
                  <SingleLineRow>
                    <Col size={6}>
                      {vif.MAC} ({networks[vif.$network].name_label})
                    </Col>
                    <Col size={6}>
                      <SelectNetwork
                        onChange={network =>
                          this.setState({
                            mapVifsNetworks: {
                              ...mapVifsNetworks,
                              [vif.id]: network.id,
                            },
                          })
                        }
                        predicate={this._getTargetNetworkPredicate()}
                        value={mapVifsNetworks[vif.id]}
                      />
                    </Col>
                  </SingleLineRow>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
}
