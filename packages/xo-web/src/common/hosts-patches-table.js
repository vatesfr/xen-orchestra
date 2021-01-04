import PropTypes from 'prop-types'
import React from 'react'
import { Portal } from 'react-overlays'
import { forEach, isEmpty, keys, map } from 'lodash'

import _ from './intl'
import ActionButton from './action-button'
import Component from './base-component'
import Link from './link'
import SortedTable from './sorted-table'
import TabButton from './tab-button'
import { connectStore } from './utils'
import { createGetObjectsOfType, createFilter, createSelector } from './selectors'
import { installAllPatchesOnPool, subscribeHostMissingPatches } from './xo'

// ===================================================================

const MISSING_PATCHES_COLUMNS = [
  {
    name: _('srHost'),
    itemRenderer: host => <Link to={`/hosts/${host.id}`}>{host.name_label}</Link>,
    sortCriteria: host => host.name_label,
  },
  {
    name: _('hostDescription'),
    itemRenderer: host => host.name_description,
    sortCriteria: host => host.name_description,
  },
  {
    name: _('hostMissingPatches'),
    itemRenderer: (host, { missingPatches }) => <Link to={`/hosts/${host.id}/patches`}>{missingPatches[host.id]}</Link>,
    sortCriteria: (host, { missingPatches }) => missingPatches[host.id],
  },
]

const POOLS_MISSING_PATCHES_COLUMNS = [
  {
    name: _('srPool'),
    itemRenderer: (host, { pools }) => {
      const pool = pools[host.$pool]
      return <Link to={`/pools/${pool.id}`}>{pool.name_label}</Link>
    },
    sortCriteria: (host, { pools }) => pools[host.$pool].name_label,
  },
].concat(MISSING_PATCHES_COLUMNS)

// Small component to homogenize Button usage in HostsPatchesTable
const ActionButton_ = ({ children, labelId, ...props }) => (
  <ActionButton {...props} tooltip={_(labelId)}>
    {children}
  </ActionButton>
)

// ===================================================================

class HostsPatchesTable extends Component {
  constructor(props) {
    super(props)
    this.state.missingPatches = {}
  }

  _getHosts = createFilter(
    () => this.props.hosts,
    createSelector(
      () => this.state.missingPatches,
      missingPatches => host => missingPatches[host.id]
    )
  )

  _subscribeMissingPatches = (hosts = this.props.hosts) => {
    const unsubs = map(hosts, host =>
      subscribeHostMissingPatches(host, patches =>
        this.setState({
          missingPatches: {
            ...this.state.missingPatches,
            [host.id]: patches.length,
          },
        })
      )
    )

    if (this.unsubscribeMissingPatches !== undefined) {
      this.unsubscribeMissingPatches()
    }

    this.unsubscribeMissingPatches = () => forEach(unsubs, unsub => unsub())
  }

  _installAllMissingPatches = () => {
    const pools = {}
    forEach(this._getHosts(), host => {
      pools[host.$pool] = true
    })

    return Promise.all(map(keys(pools), pool => installAllPatchesOnPool({ pool })))
  }

  componentDidMount() {
    // Force one Portal refresh.
    // Because Portal cannot see the container reference at first rendering.
    this.forceUpdate()
    this._subscribeMissingPatches()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.hosts !== this.props.hosts) {
      this._subscribeMissingPatches(nextProps.hosts)
    }
  }

  componentWillUnmount() {
    this.unsubscribeMissingPatches()
  }

  render() {
    const { buttonsGroupContainer, container, displayPools, pools, useTabButton } = this.props

    const hosts = this._getHosts()
    const noPatches = isEmpty(hosts)

    const Container = container || 'div'

    const Button = useTabButton ? TabButton : ActionButton_

    return (
      <div>
        {!noPatches ? (
          <SortedTable
            collection={hosts}
            columns={displayPools ? POOLS_MISSING_PATCHES_COLUMNS : MISSING_PATCHES_COLUMNS}
            userData={{
              missingPatches: this.state.missingPatches,
              pools,
            }}
          />
        ) : (
          <p>{_('patchNothing')}</p>
        )}
        <Portal container={() => buttonsGroupContainer()}>
          <Container>
            <Button
              btnStyle='primary'
              disabled={noPatches}
              handler={this._installAllMissingPatches}
              icon='host-patch-update'
              labelId='installPoolPatches'
            />
          </Container>
        </Portal>
      </div>
    )
  }
}

// ===================================================================

@connectStore(() => {
  const getPools = createGetObjectsOfType('pool')

  return {
    pools: getPools,
  }
})
class HostsPatchesTableByPool extends Component {
  render() {
    const { props } = this
    return <HostsPatchesTable {...props} pools={props.pools} />
  }
}

// ===================================================================
const HostsPatches = props =>
  props.displayPools ? <HostsPatchesTableByPool {...props} /> : <HostsPatchesTable {...props} />

HostsPatches.propTypes = {
  buttonsGroupContainer: PropTypes.func.isRequired,
  container: PropTypes.any,
  displayPools: PropTypes.bool,
  hosts: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.object), PropTypes.objectOf(PropTypes.object)]).isRequired,
  useTabButton: PropTypes.bool,
}

export { HostsPatches as default }
