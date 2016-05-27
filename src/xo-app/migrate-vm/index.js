import _ from 'messages'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
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
        ? sr => sr.$container === host.id || sr.$container === host.$pool
        : () => false)
    )

    this._getNetworkPredicate = createSelector(
      createPicker(
        () => this.props.pifs,
        createSelector(
          () => this.state.host,
          host => host && host.$PIFs
        )
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

  get value () {
    return {
      targetHost: this.state.host && this.state.host.id,
      mapVdisSrs: this.state.mapVdisSrs,
      mapVifsNetworks: this.state.mapVifsNetworks,
      migrationNetwork: this.state.network && this.state.network.id
    }
  }

  _selectHost = host => {
    const { srs, pools, pifs, vifs, networks } = this.props
    const defaultMigrationNetwork = networks[find(pifs, pif => pif.$host === host.id && pif.management).$network]
    const defaultSr = srs[pools[host.$pool].default_SR]
    const defaultNetworks = {}
    forEach(vifs, vif => {
      defaultNetworks[vif.id] = find(host.$PIFs, pif =>
        networks[vif.$network].name_label === networks[pifs[pif].$network].name_label
      )
      if (!defaultNetworks[vif.id]) {
        defaultNetworks[vif.id] = networks[pifs[host.$PIFs[0]].$network]
      }
    })
    this.setState({
      defaultMigrationNetwork,
      defaultNetworks,
      defaultSr,
      host,
      intraPool: isEmpty(host) ? undefined : this.props.vm.$pool === host.$pool
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
              defaultValue={this.state.defaultMigrationNetwork}
              onChange={this._selectHost}
              predicate={this._getHostPredicate()}
            />
          </Col>
        </SingleLineRow>
      </div>
      {this.state.intraPool !== undefined &&
      (this.state.intraPool
        ? <p><em><Icon icon='info' size={1} /> {_('migrateVmAdvancedModalNoRemapping')}</em></p>
        : <div>
          <div className={styles.block}>
            <SingleLineRow>
              <Col size={6}>{_('migrateVmAdvancedModalSelectNetwork')}</Col>
              <Col size={6}>
                <SelectNetwork
                  defaultValue={this.state.defaultMigrationNetwork}
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
