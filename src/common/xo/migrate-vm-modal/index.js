import BaseComponent from 'base-component'
import every from 'lodash/every'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import React from 'react'
import some from 'lodash/some'
import store from 'store'

import _ from '../../intl'
import Icon from 'icon'
import invoke from '../../invoke'
import SingleLineRow from '../../single-line-row'
import Tooltip from '../../tooltip'
import { Col } from '../../grid'
import { getDefaultNetworkForVif } from '../utils'
import {
  SelectHost,
  SelectNetwork,
  SelectSr
} from '../../select-objects'
import {
  connectStore,
  mapPlus
} from '../../utils'
import {
  createGetObjectsOfType,
  createPicker,
  createSelector,
  getObject
} from '../../selectors'
import {
  isSrShared
} from 'xo'

import { isSrWritable } from '../'

import styles from './index.css'

@connectStore(() => {
  const getVm = (_, props) => props.vm

  const getVbds = createGetObjectsOfType('VBD').pick(
    (state, props) => getVm(state, props).$VBDs
  ).sort()

  const getVdis = createGetObjectsOfType('VDI').pick(
    createSelector(
      getVbds,
      vbds => mapPlus(vbds, (vbd, push) => {
        if (!vbd.is_cd_drive && vbd.VDI) {
          push(vbd.VDI)
        }
      })
    )
  )

  const getVifs = createGetObjectsOfType('VIF').pick(
    createSelector(getVm, vm => vm.VIFs)
  ).sort()

  const getPifs = createGetObjectsOfType('PIF')
  const getNetworks = createGetObjectsOfType('network')
  const getPools = createGetObjectsOfType('pool')

  return {
    networks: getNetworks,
    pifs: getPifs,
    pools: getPools,
    vbds: getVbds,
    vdis: getVdis,
    vifs: getVifs
  }
}, { withRef: true })
export default class MigrateVmModalBody extends BaseComponent {
  constructor (props) {
    super(props)

    this.state = {
      mapVdisSrs: {},
      mapVifsNetworks: {}
    }

    this._getHostPredicate = createSelector(
      () => this.props.vm,
      ({ $container }) => host => host.id !== $container
    )

    this._getSrPredicate = createSelector(
      () => this.state.host,
      host => (host
        ? sr => isSrWritable(sr) && (sr.$container === host.id || sr.$container === host.$pool)
        : false
      )
    )

    this._getTargetNetworkPredicate = createSelector(
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
          networks[pif.$network] = true
        })

        return network => networks[network.id]
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

  componentDidMount () {
    this._selectHost(this.props.host)
  }

  get value () {
    return {
      mapVdisSrs: this.state.mapVdisSrs,
      mapVifsNetworks: this.state.mapVifsNetworks,
      migrationNetwork: this.state.migrationNetworkId,
      targetHost: this.state.host && this.state.host.id
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
        intraPool: undefined
      })
      return
    }

    const { pools, vbds, vdis, vm } = this.props
    const intraPool = vm.$pool === host.$pool

    // Intra-pool
    const defaultSr = pools[host.$pool].default_SR
    const defaultSrConnectedToHost = some(host.$PBDs, pbd => this._getObject(pbd).SR === defaultSr)

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
        defaultSr,
        defaultSrConnectedToHost,
        doNotMigrateVdis,
        host,
        intraPool,
        mapVdisSrs: doNotMigrateVdis
          ? undefined
          : defaultSrConnectedToHost
            ? mapValues(vdis, vdi => defaultSr)
            : undefined,
        mapVifsNetworks: undefined,
        migrationNetwork: undefined
      })
      return
    }

    // Inter-pool
    const { networks, pifs, vifs } = this.props
    const defaultMigrationNetworkId = find(pifs, pif => pif.$host === host.id && pif.management).$network

    const defaultNetwork = invoke(() => {
      // First PIF with an IP.
      const pifId = find(host.$PIFs, pif => pifs[pif].ip)
      const pif = pifId && pifs[pifId]

      return pif && pif.$network
    })

    const defaultNetworksForVif = {}
    forEach(vifs, vif => {
      defaultNetworksForVif[vif.id] = (
        getDefaultNetworkForVif(vif, host, pifs, networks) ||
        defaultNetwork
      )
    })

    this.setState({
      defaultSr,
      defaultSrConnectedToHost,
      doNotMigrateVdis: false,
      host,
      intraPool,
      mapVdisSrs: defaultSrConnectedToHost
        ? mapValues(vdis, vdi => defaultSr)
        : undefined,
      mapVifsNetworks: defaultNetworksForVif,
      migrationNetworkId: defaultMigrationNetworkId
    })
  }

  _selectMigrationNetwork = migrationNetwork => this.setState({ migrationNetworkId: migrationNetwork.id })

  render () {
    const { vdis, vifs, networks } = this.props
    const {
      defaultSr,
      defaultSrConnectedToHost,
      doNotMigrateVdis,
      host,
      intraPool,
      mapVdisSrs,
      mapVifsNetworks,
      migrationNetworkId
    } = this.state
    return <div>
      <div className={styles.block}>
        <SingleLineRow>
          <Col size={6}>{_('migrateVmSelectHost')}</Col>
          <Col size={6}>
            <SelectHost
              onChange={this._selectHost}
              predicate={this._getHostPredicate()}
              value={host}
            />
          </Col>
        </SingleLineRow>
      </div>
      {host && !doNotMigrateVdis && <div className={styles.groupBlock}>
        <SingleLineRow>
          <Col>{_('migrateVmSelectSrs')}</Col>
        </SingleLineRow>
        <br />
        <SingleLineRow>
          <Col size={6}><span className={styles.listTitle}>{_('migrateVmName')}</span></Col>
          <Col size={6}>
            <span className={styles.listTitle}>{_('migrateVmSr')}</span>
            {' '}
            {(defaultSr === undefined || !defaultSrConnectedToHost) &&
              <Tooltip
                content={defaultSr !== undefined
                  ? _('migrateVmNotConnectedDefaultSrError')
                  : _('migrateVmNoDefaultSrError')
                }
              >
                <Icon
                  icon={defaultSr !== undefined ? 'alarm' : 'info'}
                  className={defaultSr !== undefined ? 'text-warning' : 'text-info'}
                  size='lg'
                />
              </Tooltip>
            }
          </Col>
        </SingleLineRow>
        {map(vdis, vdi => <div className={styles.listItem} key={vdi.id}>
          <SingleLineRow>
            <Col size={6}>{vdi.name_label}</Col>
            <Col size={6}>
              <SelectSr
                onChange={sr => this.setState({ mapVdisSrs: { ...mapVdisSrs, [vdi.id]: sr.id } })}
                predicate={this._getSrPredicate()}
                value={mapVdisSrs && mapVdisSrs[vdi.id]}
              />
            </Col>
          </SingleLineRow>
        </div>)}
      </div>}
      {intraPool !== undefined &&
        (!intraPool &&
          <div>
            <div className={styles.groupBlock}>
              <SingleLineRow>
                <Col size={6}>{_('migrateVmSelectMigrationNetwork')}</Col>
                <Col size={6}>
                  <SelectNetwork
                    onChange={this._selectMigrationNetwork}
                    predicate={this._getMigrationNetworkPredicate()}
                    value={migrationNetworkId}
                  />
                </Col>
              </SingleLineRow>
            </div>
            <div className={styles.groupBlock}>
              <SingleLineRow>
                <Col>{_('migrateVmSelectNetworks')}</Col>
              </SingleLineRow>
              <br />
              <SingleLineRow>
                <Col size={6}><span className={styles.listTitle}>{_('migrateVmVif')}</span></Col>
                <Col size={6}><span className={styles.listTitle}>{_('migrateVmNetwork')}</span></Col>
              </SingleLineRow>
              {map(vifs, vif => <div className={styles.listItem} key={vif.id}>
                <SingleLineRow>
                  <Col size={6}>{vif.MAC} ({networks[vif.$network].name_label})</Col>
                  <Col size={6}>
                    <SelectNetwork
                      onChange={network => this.setState({ mapVifsNetworks: { ...mapVifsNetworks, [vif.id]: network.id } })}
                      predicate={this._getTargetNetworkPredicate()}
                      value={mapVifsNetworks[vif.id]}
                    />
                  </Col>
                </SingleLineRow>
              </div>)}
            </div>
          </div>
        )}
    </div>
  }
}
