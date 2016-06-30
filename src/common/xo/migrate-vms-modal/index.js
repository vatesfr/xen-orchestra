import BaseComponent from 'base-component'
import concat from 'lodash/concat'
import every from 'lodash/every'
import forEach from 'lodash/forEach'
import find from 'lodash/find'
import map from 'lodash/map'
import React from 'react'
import some from 'lodash/some'

import _ from '../../intl'
import SingleLineRow from '../../single-line-row'
import { Col } from '../../grid'
import {
  SelectHost,
  SelectNetwork,
  SelectSr
} from '../../select-objects'
import {
  connectStore
} from '../../utils'
import {
  createGetObjectsOfType,
  createPicker,
  createSelector
} from '../../selectors'

import { isSrWritable } from '../'

const LINE_STYLE = { paddingBottom: '1em' }

@connectStore(() => {
  const getNetworks = createGetObjectsOfType('network')
  const getPifs = createGetObjectsOfType('PIF')
  const getPools = createGetObjectsOfType('pool')
  const getSrs = createGetObjectsOfType('SR')

  const getVms = createGetObjectsOfType('VM').pick(
    (_, props) => props.vms
  )

  const getVbdsByVm = createGetObjectsOfType('VBD').pick(
    createSelector(
      getVms,
      vms => concat(...map(vms, vm => vm.$VBDs))
    )
  ).groupBy('VM')

  return {
    networks: getNetworks,
    pifs: getPifs,
    pools: getPools,
    srs: getSrs,
    vbdsByVm: getVbdsByVm,
    vms: getVms
  }
}, { withRef: true })
export default class MigrateVmsModalBody extends BaseComponent {
  constructor (props) {
    super(props)

    this._getHostPredicate = createSelector(
      () => this.props.vms,
      vms => host => some(vms, vm => host.id !== vm.$container)
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
    // Map VM --> ( Map VDI --> SR )
    const mapVmsMapVdisSrs = {}
    forEach(this.props.vbdsByVm, (vbds, vm) => {
      const mapVdisSrs = {}
      forEach(vbds, vbd => {
        if (!vbd.is_cd_drive && vbd.VDI) {
          mapVdisSrs[vbd.VDI] = this.state.sr.id
        }
      })
      mapVmsMapVdisSrs[vm] = mapVdisSrs
    })

    // Map VM --> ( Map VIF --> network )
    const mapVmsMapVifsNetworks = {}
    forEach(this.props.vms, vm => {
      const mapVifsNetworks = {}
      forEach(vm.VIFs, vif => {
        mapVifsNetworks[vif] = this.state.network.id
      })
      mapVmsMapVifsNetworks[vm.id] = mapVifsNetworks
    })
    return {
      mapVmsMapVdisSrs,
      mapVmsMapVifsNetworks,
      migrationNetwork: this.state.migrationNetwork && this.state.migrationNetwork.id,
      targetHost: this.state.host && this.state.host.id
    }
  }

  _selectHost = host => {
    if (!host) {
      this.setState({ targetHost: undefined })
      return
    }
    const { networks, pools, pifs, srs } = this.props
    const defaultMigrationNetwork = networks[find(pifs, pif => pif.$host === host.id && pif.management).$network]
    const defaultSr = srs[pools[host.$pool].default_SR]
    this.setState({
      host,
      intraPool: every(this.props.vms, vm => vm.$pool === host.$pool),
      migrationNetwork: defaultMigrationNetwork,
      network: defaultMigrationNetwork,
      sr: defaultSr
    })
  }
  _selectMigrationNetwork = migrationNetwork => this.setState({ migrationNetwork })
  _selectNetwork = network => this.setState({ network })
  _selectSr = sr => this.setState({ sr })

  render () {
    return <div>
      <div style={LINE_STYLE}>
        <SingleLineRow>
          <Col size={6}>{_('migrateVmSelectHost')}</Col>
          <Col size={6}>
            <SelectHost
              onChange={this._selectHost}
              predicate={this._getHostPredicate()}
              value={this.state.host}
            />
          </Col>
        </SingleLineRow>
      </div>
      {this.state.intraPool === false &&
        <div style={LINE_STYLE}>
          <SingleLineRow>
            <Col size={6}>{_('migrateVmSelectMigrationNetwork')}</Col>
            <Col size={6}>
              <SelectNetwork
                onChange={this._selectMigrationNetwork}
                predicate={this._getNetworkPredicate()}
                value={this.state.migrationNetwork}
              />
            </Col>
          </SingleLineRow>
        </div>
      }
      {this.state.host && [
        <div key='sr' style={LINE_STYLE}>
          <SingleLineRow>
            <Col size={6}>{_('migrateVmsSelectSr')}</Col>
            <Col size={6}>
              <SelectSr
                onChange={this._selectSr}
                predicate={this._getSrPredicate()}
                value={this.state.sr}
              />
            </Col>
          </SingleLineRow>
        </div>,
        <div key='network' style={LINE_STYLE}>
          <SingleLineRow>
            <Col size={6}>{_('migrateVmsSelectNetwork')}</Col>
            <Col size={6}>
              <SelectNetwork
                onChange={this._selectNetwork}
                predicate={this._getNetworkPredicate()}
                value={this.state.network}
              />
            </Col>
          </SingleLineRow>
        </div>
      ]}
    </div>
  }
}
