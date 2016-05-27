import _ from 'messages'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import find from 'lodash/find'
import map from 'lodash/map'
import React, { Component } from 'react'
import SingleLineRow from 'single-line-row'
import { Col } from 'grid'
import {
  SelectHost,
  SelectNetwork,
  SelectSr
} from 'select-objects'
import {
  connectStore,
  mapPlus
} from 'utils'
import {
  createGetObjectsOfType,
  createPicker,
  createSelector
} from 'selectors'

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

  return (state, props) => ({
    networks: getNetworks(state, props),
    pifs: getPifs(state, props),
    pools: getPools(state, props),
    srs: getSrs(state, props),
    vdis: getVdis(state, props),
    vifs: getVifs(state, props)
  })
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
        ? sr => sr.content_type !== 'iso' && (sr.$container === host.id || sr.$container === host.$pool)
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

  get value () {
    return {
      targetHost: this.state.host && this.state.host.id,
      mapVdisSrs: this.state.mapVdisSrs,
      mapVifsNetworks: this.state.mapVifsNetworks,
      migrationNetwork: this.state.network && this.state.network.id
    }
  }

  _selectHost = host => {
    console.log('Select host')
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

  _getSelectSr = vdiId =>
    sr => this.setState({ mapVdisSrs: { ...this.state.mapVdisSrs, [vdiId]: sr.id } })

  _getSelectNetwork = vifId =>
    network => this.setState({ mapVifsNetworks: { ...this.state.mapVifsNetworks, [vifId]: network.id } })

  render () {
    const { vdis, vifs, networks } = this.props
    return <div>
      <div className={styles.firstBlock}>
        <SingleLineRow>
          <Col size={6}>{_('migrateVmAdvancedModalSelectHost')}</Col>
          <Col size={6}>
            <SelectHost
              onChange={this._selectHost}
              predicate={this._getHostPredicate()}
            />
          </Col>
        </SingleLineRow>
      </div>
      {this.state.intraPool !== undefined &&
        (this.state.intraPool
          ? <p className='text-success'><em><Icon icon='info' size={1} /> {_('migrateVmAdvancedModalNoRemapping')}</em></p>
          : <div>
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
                <Col size={12}>{_('migrateVmAdvancedModalSelectSrs')}</Col>
              </SingleLineRow>
              &nbsp;
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
                      onChange={this._getSelectSr(vdi.id)}
                      predicate={this._getSrPredicate()}
                    />
                  </Col>
                </SingleLineRow>
              </div>)}
            </div>
            <div className={styles.block}>
              <SingleLineRow>
                <Col size={12}>{_('migrateVmAdvancedModalSelectNetworks')}</Col>
              </SingleLineRow>
              &nbsp;
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
                      onChange={this._getSelectNetwork(vif.id)}
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
