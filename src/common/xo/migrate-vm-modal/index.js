import BaseComponent from 'base-component'
import forEach from 'lodash/forEach'
import find from 'lodash/find'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import React from 'react'

import _ from '../../intl'
import SingleLineRow from '../../single-line-row'
import { Col } from '../../grid'
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
  createSelector
} from '../../selectors'

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
  const getSrs = createGetObjectsOfType('SR')
  const getPools = createGetObjectsOfType('pool')

  return {
    networks: getNetworks,
    pifs: getPifs,
    pools: getPools,
    srs: getSrs,
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
        : () => false
      )
    )

    this._getNetworkPredicate = createSelector(
      createPicker(
        () => this.props.pifs,
        () => this.state.host.$PIFs
      ),
      pifs => {
        if (!pifs) {
          return () => false
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
      targetHost: this.state.host && this.state.host.id,
      mapVdisSrs: this.state.mapVdisSrs,
      mapVifsNetworks: this.state.mapVifsNetworks,
      migrationNetwork: this.state.migrationNetwork && this.state.migrationNetwork.id
    }
  }

  _selectHost = host => {
    if (!host) {
      this.setState({ intraPool: undefined, host: undefined })
      return
    }
    const { networks, pools, pifs, srs, vdis, vifs } = this.props
    const defaultMigrationNetwork = networks[find(pifs, pif => pif.$host === host.id && pif.management).$network]
    const defaultSr = srs[pools[host.$pool].default_SR].id
    const defaultNetworks = {}
    // Default network...
    forEach(vifs, vif => {
      // ...is the one which has the same name_label as the VIF's previous network (if it has an IP)...
      const defaultPif = find(host.$PIFs, pifId => {
        const pif = pifs[pifId]
        return pif.ip && networks[vif.$network].name_label === networks[pif.$network].name_label
      })
      let defaultNetwork = defaultPif && networks[defaultPif.$network]
      defaultNetworks[vif.id] = defaultPif && defaultNetwork && defaultNetwork.id
      // ...or the first network in the target host networks list that has an IP.
      if (!defaultNetworks[vif.id]) {
        defaultNetwork = networks[pifs[find(host.$PIFs, pif => pifs[pif].ip)].$network]
        defaultNetworks[vif.id] = defaultNetwork && defaultNetwork.id
      }
    })
    this.setState({
      host,
      intraPool: this.props.vm.$pool === host.$pool,
      mapVdisSrs: mapValues(vdis, vdi => defaultSr),
      mapVifsNetworks: defaultNetworks,
      migrationNetwork: defaultMigrationNetwork
    })
  }

  _selectMigrationNetwork = migrationNetwork => this.setState({ migrationNetwork })

  render () {
    const { vdis, vifs, networks } = this.props
    const {
      host,
      intraPool,
      mapVdisSrs,
      mapVifsNetworks,
      migrationNetwork
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
      {intraPool !== undefined &&
        (!intraPool &&
          <div>
            <div className={styles.groupBlock}>
              <SingleLineRow>
                <Col size={6}>{_('migrateVmSelectMigrationNetwork')}</Col>
                <Col size={6}>
                  <SelectNetwork
                    ref='migrationNetwork'
                    onChange={this._selectMigrationNetwork}
                    predicate={this._getNetworkPredicate()}
                    value={migrationNetwork}
                  />
                </Col>
              </SingleLineRow>
            </div>
            <div className={styles.groupBlock}>
              <SingleLineRow>
                <Col>{_('migrateVmSelectSrs')}</Col>
              </SingleLineRow>
              <br />
              <SingleLineRow>
                <Col size={6}><span className={styles.listTitle}>{_('migrateVmName')}</span></Col>
                <Col size={6}><span className={styles.listTitle}>{_('migrateVmSr')}</span></Col>
              </SingleLineRow>
              {map(vdis, vdi => <div className={styles.listItem} key={vdi.id}>
                <SingleLineRow>
                  <Col size={6}>{vdi.name_label}</Col>
                  <Col size={6}>
                    <SelectSr
                      onChange={sr => this.setState({ mapVdisSrs: { ...mapVdisSrs, [vdi.id]: sr.id } })}
                      predicate={this._getSrPredicate()}
                      value={mapVdisSrs[vdi.id]}
                    />
                  </Col>
                </SingleLineRow>
              </div>)}
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
                      predicate={this._getNetworkPredicate()}
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
