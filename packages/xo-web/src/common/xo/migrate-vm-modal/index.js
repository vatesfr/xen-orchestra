import BaseComponent from 'base-component'
import React from 'react'
import store from 'store'
import { every, find, flatMap, forEach, isEmpty, map } from 'lodash'

import _ from '../../intl'
import ChooseSrForEachVdisModal from '../choose-sr-for-each-vdis-modal'
import Collapse from 'collapse'
import invoke from '../../invoke'
import SingleLineRow from '../../single-line-row'
import { Col, Row } from '../../grid'
import { connectStore, mapPlus, resolveId, resolveIds } from '../../utils'
import { getDefaultNetworkForVif } from '../utils'
import { SelectHost, SelectNetwork, SelectSr } from '../../select-objects'
import {
  createGetObjectsOfType,
  createPicker,
  createSelector,
  getObject,
} from '../../selectors'

import { isSrShared, isSrWritable } from '../'

import styles from './index.css'

@connectStore(() => {
  const getSnapshot = (_, props) => props.snapshot

  const getVbds = createGetObjectsOfType('VBD')
    .pick(createSelector(getSnapshot, snapshot => snapshot.$VBDs))
    .filter([vbd => !vbd.is_cd_drive && vbd.VDI !== undefined])

  const getVdis = createGetObjectsOfType('VDI-snapshot').pick(
    createSelector(getVbds, vbds => map(vbds, 'VDI'))
  )

  const getVifs = createGetObjectsOfType('VIF').pick(
    createSelector(getSnapshot, snapshot => snapshot.VIFs)
  )

  const getNetworks = createGetObjectsOfType('network')

  return {
    networks: getNetworks,
    vdis: getVdis,
    vifs: getVifs,
    snapshot: getSnapshot,
  }
})
class Snapshot extends BaseComponent {
  _onChange = newValues => {
    this.props.onChange({
      ...this.props,
      ...newValues,
    })
  }

  render () {
    const {
      displayVdis,
      displayVifs,
      vdis,
      vifs,
      mapVdisSrs,
      mapVifsNetworks,
      networks,
      networkPredicate,
      snapshot,
      srPredicate,
    } = this.props

    return (
      <div className={styles.groupBlock} key={snapshot.id}>
        {displayVdis &&
          !isEmpty(vdis) && (
            <div>
              <SingleLineRow>
                <Col size={6}>
                  <strong>{_('chooseSrForEachVdisModalVdiLabel')}</strong>
                </Col>
                <Col size={6}>
                  <strong>{_('chooseSrForEachVdisModalSrLabel')}</strong>
                </Col>
              </SingleLineRow>
              {map(vdis, vdi => (
                <SingleLineRow key={vdi.uuid}>
                  <Col size={6}>{vdi.name_label || vdi.name}</Col>
                  <Col size={6}>
                    <SelectSr
                      onChange={sr =>
                        this._onChange({
                          mapVdisSrs: { ...mapVdisSrs, [vdi.uuid]: sr },
                        })
                      }
                      predicate={srPredicate}
                      value={mapVdisSrs !== undefined && mapVdisSrs[vdi.uuid]}
                    />
                  </Col>
                </SingleLineRow>
              ))}
              <i>{_('chooseSrForEachVdisModalOptionalEntry')}</i>
            </div>
          )}
        {displayVifs &&
          !isEmpty(vifs) && (
            <div>
              <Row className='mt-1'>
                <Col size={6}>
                  <span className={styles.listTitle}>{_('migrateVmVif')}</span>
                </Col>
                <Col size={6}>
                  <span className={styles.listTitle}>
                    {_('migrateVmNetwork')}
                  </span>
                </Col>
              </Row>
              {map(vifs, vif => (
                <div className={styles.listItem} key={vif.id}>
                  <SingleLineRow>
                    <Col size={6}>
                      {vif.MAC} ({networks[vif.$network].name_label})
                    </Col>
                    <Col size={6}>
                      <SelectNetwork
                        onChange={network =>
                          this._onChange({
                            mapVifsNetworks: {
                              ...mapVifsNetworks,
                              [vif]: network.id,
                            },
                          })
                        }
                        predicate={networkPredicate}
                        value={mapVifsNetworks[vif.id]}
                      />
                    </Col>
                  </SingleLineRow>
                </div>
              ))}
            </div>
          )}
      </div>
    )
  }
}

@connectStore(
  () => {
    const getVm = (_, props) => props.vm

    const getVmVbds = createGetObjectsOfType('VBD')
      .pick((state, props) => getVm(state, props).$VBDs)
      .sort()

    const getVmVdis = createGetObjectsOfType('VDI').pick(
      createSelector(getVmVbds, vbds =>
        mapPlus(vbds, (vbd, push) => {
          if (!vbd.is_cd_drive && vbd.VDI) {
            push(vbd.VDI)
          }
        })
      )
    )

    const getSnapshots = createGetObjectsOfType('VM-snapshot').pick(
      createSelector(getVm, vm => vm.snapshots)
    )

    const getSnapshotsVbds = createGetObjectsOfType('VBD').pick(
      createSelector(getSnapshots, snapshots => flatMap(snapshots, '$VBDs'))
    )

    const getVbds = createSelector(
      getVmVbds,
      getSnapshotsVbds,
      (vbds, snapshotsVbds) => vbds.concat(snapshotsVbds)
    )

    const getVmVifs = createGetObjectsOfType('VIF')
      .pick(createSelector(getVm, vm => vm.VIFs))
      .sort()

    const getSnapshotsVifs = createGetObjectsOfType('VIF')
      .pick(createSelector(getSnapshots, vms => flatMap(vms, 'VIFs')))
      .sort()

    const getVifs = createSelector(
      getVmVifs,
      getSnapshotsVifs,
      (vmVifs, snapshotsVifs) => vmVifs.concat(snapshotsVifs)
    )

    const getPifs = createGetObjectsOfType('PIF')
    const getNetworks = createGetObjectsOfType('network')
    const getPools = createGetObjectsOfType('pool')

    return {
      networks: getNetworks,
      pifs: getPifs,
      pools: getPools,
      vbds: getVbds,
      vifs: getVifs,
      vmVdis: getVmVdis,
      vmVifs: getVmVifs,
      snapshots: getSnapshots,
    }
  },
  { withRef: true }
)
export default class MigrateVmModalBody extends BaseComponent {
  constructor (props) {
    super(props)

    this.state = {
      mapVifsNetworks: {},
      targetSrs: {},
      host: props.host || undefined,
      intraPool: props.host ? props.vm.$pool === props.host.$pool : undefined,
    }

    this._getHostPredicate = createSelector(
      () => this.props.vm,
      ({ $container }) => host => host.id !== $container
    )

    this._getSrPredicate = createSelector(
      () => this.state.host,
      host =>
        host
          ? sr =>
              isSrWritable(sr) &&
              (sr.$container === host.id || sr.$container === host.$pool)
          : false
    )

    this._getTargetNetworkPredicate = createSelector(
      createPicker(() => this.props.pifs, () => this.state.host.$PIFs),
      pifs => {
        if (!pifs) {
          return false
        }

        const networks = {}
        forEach(pifs, pif => {
          networks[pif.$network] = true
        })

        return network => networks[network.id]
      }
    )

    this._getMigrationNetworkPredicate = createSelector(
      createPicker(() => this.props.pifs, () => this.state.host.$PIFs),
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

  get value () {
    return {
      mapVdisSrs: resolveIds(this.state.targetSrs.mapVdisSrs),
      mapVifsNetworks: this.state.mapVifsNetworks,
      migrationNetwork: this.state.migrationNetworkId,
      sr: resolveId(this.state.targetSrs.mainSr),
      targetHost: this.state.host && this.state.host.id,
    }
  }

  _getObject (id) {
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

    const { vbds, vm } = this.props
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
            _doNotMigrateVdi[vbd.VDI] = isSrShared(
              this._getObject(this._getObject(vbd.VDI).$SR)
            )
          }
        })
        doNotMigrateVdis = every(_doNotMigrateVdi)
      }

      this.setState({
        doNotMigrateVdis,
        host,
        intraPool,
        mapVifsNetworks: undefined,
        migrationNetwork: undefined,
        targetSrs: {},
      })
      return
    }

    // Inter-pool
    const { networks, pifs, vifs } = this.props
    const defaultMigrationNetworkId = find(
      pifs,
      pif => pif.$host === host.id && pif.management
    ).$network

    const defaultNetwork = invoke(() => {
      // First PIF with an IP.
      const pifId = find(host.$PIFs, pif => pifs[pif].ip)
      const pif = pifId && pifs[pifId]

      return pif && pif.$network
    })

    const defaultNetworksForVif = {}
    forEach(vifs, vif => {
      defaultNetworksForVif[vif.id] =
        getDefaultNetworkForVif(vif, host, pifs, networks) || defaultNetwork
    })

    this.setState({
      doNotMigrateVdis: false,
      host,
      intraPool,
      mapVifsNetworks: defaultNetworksForVif,
      migrationNetworkId: defaultMigrationNetworkId,
      targetSrs: {},
    })
  }

  _selectMigrationNetwork = migrationNetwork =>
    this.setState({ migrationNetworkId: migrationNetwork.id })

  render () {
    const { vmVdis, vmVifs, networks, snapshots } = this.props
    const {
      doNotMigrateVdis,
      host,
      intraPool,
      mapVifsNetworks,
      migrationNetworkId,
      targetSrs,
    } = this.state

    const displayVdis = host !== undefined && !doNotMigrateVdis
    const displayVifs = intraPool === false

    return (
      <div>
        <div className={styles.block}>
          <SingleLineRow>
            <Col size={6}>{_('migrateVmSelectHost')}</Col>
            <Col size={6}>
              <SelectHost
                onChange={this._selectHost}
                predicate={this._getHostPredicate()}
                required
                value={host}
              />
            </Col>
          </SingleLineRow>

          {displayVifs && (
            <SingleLineRow className='mt-1'>
              <Col size={6}>{_('migrateVmSelectMigrationNetwork')}</Col>
              <Col size={6}>
                <SelectNetwork
                  onChange={this._selectMigrationNetwork}
                  predicate={this._getMigrationNetworkPredicate()}
                  value={migrationNetworkId}
                />
              </Col>
            </SingleLineRow>
          )}
        </div>
        {displayVdis && (
          <div className={styles.groupBlock}>
            <SingleLineRow>
              <Col size={12}>
                <ChooseSrForEachVdisModal
                  mainSrPredicate={this._getSrPredicate()}
                  onChange={this.linkState('targetSrs')}
                  value={targetSrs}
                  vdis={vmVdis}
                />
              </Col>
            </SingleLineRow>
          </div>
        )}
        {displayVifs && (
          <div>
            <div className={styles.groupBlock}>
              <Row>
                <Col>{_('migrateVmSelectNetworks')}</Col>
              </Row>
              <SingleLineRow>
                <Col size={6}>
                  <span className={styles.listTitle}>{_('migrateVmVif')}</span>
                </Col>
                <Col size={6}>
                  <span className={styles.listTitle}>
                    {_('migrateVmNetwork')}
                  </span>
                </Col>
              </SingleLineRow>
              {map(vmVifs, vif => (
                <div className={styles.listItem} key={vif.id}>
                  <SingleLineRow>
                    <Col size={6}>
                      {vif.MAC} ({networks[vif.$network].name_label})
                    </Col>
                    <Col size={6}>
                      <SelectNetwork
                        onChange={this.linkState(`mapVifsNetworks.${vif.id}`)}
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
        {!isEmpty(snapshots) &&
          (displayVdis || displayVifs) && (
            <div className={styles.groupBlock}>
              <div>
                <Row>
                  <Col>
                    <strong>{_('IndividualSnapshotConfiguration')}:</strong>
                  </Col>
                </Row>
              </div>
              <div>
                {map(snapshots, snapshot => (
                  <Collapse
                    buttonText={snapshot.name_label}
                    size='small'
                    className='mb-1'
                  >
                    <Snapshot
                      displayVdis={displayVdis}
                      displayVifs={displayVifs}
                      key={snapshot.id}
                      mapVdisSrs={targetSrs.mapVdisSrs}
                      mapVifsNetworks={mapVifsNetworks}
                      networkPredicate={this._getTargetNetworkPredicate()}
                      onChange={props => {
                        this.setState({
                          mapVifsNetworks: props.mapVifsNetworks,
                          targetSrs: {
                            ...targetSrs,
                            mapVdisSrs: props.mapVdisSrs,
                          },
                        })
                      }}
                      snapshot={snapshot}
                      srPredicate={this._getSrPredicate()}
                    />
                  </Collapse>
                ))}
              </div>
            </div>
          )}
      </div>
    )
  }
}
