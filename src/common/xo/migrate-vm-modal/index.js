import forEach from 'lodash/forEach'
import find from 'lodash/find'
import map from 'lodash/map'
import React, { Component } from 'react'

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
export default class MigrateVmModalBody extends Component {
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
      migrationNetwork: this.state.network && this.state.network.id
    }
  }

  _selectHost = host => {
    if (!host) {
      this.setState({ intraPool: undefined, targetHost: undefined })
      return
    }
    const { networks, pools, pifs, srs, vdis, vifs } = this.props
    const defaultMigrationNetwork = networks[find(pifs, pif => pif.$host === host.id && pif.management).$network]
    const defaultSr = srs[pools[host.$pool].default_SR]
    const defaultNetworks = {}
    // Default network...
    forEach(vifs, vif => {
      // ...is the one which has the same name_label as the VIF's previous network (if it has an IP)...
      const defaultPif = find(host.$PIFs, pifId => {
        const pif = pifs[pifId]
        return pif.ip && networks[vif.$network].name_label === networks[pif.$network].name_label
      })
      defaultNetworks[vif.id] = defaultPif && networks[defaultPif.$network]
      // ...or the first network in the target host networks list that has an IP.
      if (!defaultNetworks[vif.id]) {
        defaultNetworks[vif.id] = networks[pifs[find(host.$PIFs, pif => pifs[pif].ip)].$network]
      }
    })
    this.setState({
      network: defaultMigrationNetwork,
      defaultNetworks,
      defaultSr,
      host,
      intraPool: this.props.vm.$pool === host.$pool
    }, () => {
      if (!this.state.intraPool) {
        this.refs.network.value = defaultMigrationNetwork
        forEach(vdis, vdi => {
          this.refs['sr_' + vdi.id].value = defaultSr
        })
        forEach(vifs, vif => {
          this.refs['network_' + vif.id].value = defaultNetworks[vif.id]
        })
      }
    })
  }

  _selectMigrationNetwork = network => this.setState({ network })

  render () {
    const { host, vdis, vifs, networks } = this.props
    return <div>
      <div className={styles.firstBlock}>
        <SingleLineRow>
          <Col size={6}>{_('migrateVmAdvancedModalSelectHost')}</Col>
          <Col size={6}>
            <SelectHost
              defaultValue={host}
              onChange={this._selectHost}
              predicate={this._getHostPredicate()}
            />
          </Col>
        </SingleLineRow>
      </div>
      {this.state.intraPool !== undefined &&
        (!this.state.intraPool &&
          <div>
            <div className={styles.block}>
              <SingleLineRow>
                <Col size={6}>{_('migrateVmAdvancedModalSelectNetwork')}</Col>
                <Col size={6}>
                  <SelectNetwork
                    ref='network'
                    defaultValue={this.state.network}
                    onChange={this._selectMigrationNetwork}
                    predicate={this._getNetworkPredicate()}
                  />
                </Col>
              </SingleLineRow>
            </div>
            <div className={styles.block}>
              <SingleLineRow>
                <Col>{_('migrateVmAdvancedModalSelectSrs')}</Col>
              </SingleLineRow>
              <br />
              <SingleLineRow>
                <Col size={6}><span className={styles.listTitle}>{_('migrateVmAdvancedModalName')}</span></Col>
                <Col size={6}><span className={styles.listTitle}>{_('migrateVmAdvancedModalSr')}</span></Col>
              </SingleLineRow>
              {map(vdis, vdi => <div className={styles.listItem} key={vdi.id}>
                <SingleLineRow>
                  <Col size={6}>{vdi.name_label}</Col>
                  <Col size={6}>
                    <SelectSr
                      ref={'sr_' + vdi.id}
                      defaultValue={this.state.defaultSr}
                      onChange={sr => this.setState({ mapVdisSrs: { ...this.state.mapVdisSrs, [vdi.id]: sr.id } })}
                      predicate={this._getSrPredicate()}
                    />
                  </Col>
                </SingleLineRow>
              </div>)}
            </div>
            <div className={styles.block}>
              <SingleLineRow>
                <Col>{_('migrateVmAdvancedModalSelectNetworks')}</Col>
              </SingleLineRow>
              <br />
              <SingleLineRow>
                <Col size={6}><span className={styles.listTitle}>{_('migrateVmAdvancedModalVif')}</span></Col>
                <Col size={6}><span className={styles.listTitle}>{_('migrateVmAdvancedModalNetwork')}</span></Col>
              </SingleLineRow>
              {map(vifs, vif => <div className={styles.listItem} key={vif.id}>
                <SingleLineRow>
                  <Col size={6}>{vif.MAC} ({networks[vif.$network].name_label})</Col>
                  <Col size={6}>
                    <SelectNetwork
                      ref={'network_' + vif.id}
                      defaultValue={this.state.defaultNetworks[vif.id]}
                      onChange={network => this.setState({ mapVifsNetworks: { ...this.state.mapVifsNetworks, [vif.id]: network.id } })}
                      predicate={this._getNetworkPredicate()}
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
