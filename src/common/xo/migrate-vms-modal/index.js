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
  const getPifs = createGetObjectsOfType('PIF')
  const getPools = createGetObjectsOfType('pool')

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
    pifs: getPifs,
    pools: getPools,
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
        : false
      )
    )

    this._getNetworkPredicate = createSelector(
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
    // Map VM --> ( Map VDI --> SR )
    const mapVmsMapVdisSrs = {}
    forEach(this.props.vbdsByVm, (vbds, vm) => {
      const mapVdisSrs = {}
      forEach(vbds, vbd => {
        if (!vbd.is_cd_drive && vbd.VDI) {
          mapVdisSrs[vbd.VDI] = this.state.srId
        }
      })
      mapVmsMapVdisSrs[vm] = mapVdisSrs
    })

    // Map VM --> ( Map VIF --> network )
    const mapVmsMapVifsNetworks = {}
    forEach(this.props.vms, vm => {
      const mapVifsNetworks = {}
      forEach(vm.VIFs, vif => {
        mapVifsNetworks[vif] = this.state.networkId
      })
      mapVmsMapVifsNetworks[vm.id] = mapVifsNetworks
    })
    return {
      mapVmsMapVdisSrs,
      mapVmsMapVifsNetworks,
      migrationNetwork: this.state.migrationNetworkId,
      targetHost: this.state.host && this.state.host.id
    }
  }

  _selectHost = host => {
    if (!host) {
      this.setState({ targetHost: undefined })
      return
    }
    const { pools, pifs } = this.props
    const defaultMigrationNetworkId = find(pifs, pif => pif.$host === host.id && pif.management).$network
    const defaultSrId = pools[host.$pool].default_SR
    this.setState({
      host,
      intraPool: every(this.props.vms, vm => vm.$pool === host.$pool),
      migrationNetworkId: defaultMigrationNetworkId,
      networkId: defaultMigrationNetworkId,
      srId: defaultSrId
    })
  }
  _selectMigrationNetwork = migrationNetwork => this.setState({ migrationNetworkId: migrationNetwork.id })
  _selectNetwork = network => this.setState({ networkId: network.id })
  _selectSr = sr => this.setState({ srId: sr.id })

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
                value={this.state.migrationNetworkId}
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
                value={this.state.srId}
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
                value={this.state.networkId}
              />
            </Col>
          </SingleLineRow>
        </div>
      ]}
    </div>
  }
}
