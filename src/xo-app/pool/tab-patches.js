import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import SortedTable from 'sorted-table'
import TabButton from 'tab-button'
import { connectStore } from 'utils'
import { Container, Row, Col } from 'grid'
import {
  createFilter,
  createGetObjectsOfType,
  createSelector
} from 'selectors'
import {
  getHostMissingPatches,
  installAllHostPatches
} from 'xo'

// ===================================================================

const MISSING_PATCHES_COLUMNS = [
  {
    name: _('srHost'),
    itemRenderer: host => host.name_label,
    sortCriteria: host => host.name_label
  },
  {
    name: _('hostDescription'),
    itemRenderer: host => host.name_description,
    sortCriteria: host => host.name_description
  },
  {
    name: _('hostMissingPatches'),
    itemRenderer: (host, { missingPatches }) => missingPatches[host.id],
    sortCriteria: (host, { missingPatches }) => missingPatches[host.id]
  },
  {
    name: _('patchUpdateButton'),
    itemRenderer: (host, { installAllHostPatches }) => (
      <ActionButton
        btnStyle='primary'
        handler={installAllHostPatches}
        handlerParam={host}
        icon='host-patch-update'
      />
    )
  }
]

@connectStore(() => {
  const getHosts = createGetObjectsOfType('host').filter(
    (_, props) => host => props.pool.id === host.$pool
  )

  return {
    hosts: getHosts
  }
})
export default class TabPatches extends Component {
  constructor (props) {
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

  _refreshMissingPatches = () => (
    Promise.all(
      map(this.props.hosts, this._refreshHostMissingPatches)
    )
  )

  _installAllMissingPatches = () => (
    Promise.all(map(this._getHosts(), this._installAllHostPatches))
  )

  _refreshHostMissingPatches = host => (
    getHostMissingPatches(host).then(patches => {
      this.setState({
        missingPatches: {
          ...this.state.missingPatches,
          [host.id]: patches.length
        }
      })
    })
  )

  _installAllHostPatches = host => (
    installAllHostPatches(host).then(() =>
      this._refreshHostMissingPatches(host)
    )
  )

  componentWillMount () {
    this._refreshMissingPatches()
  }

  componentWillReceiveProps (nextProps) {
    forEach(nextProps.hosts, host => {
      const { id } = host

      if (this.state.missingPatches[id] !== undefined) {
        return
      }

      this.setState({
        missingPatches: {
          ...this.state.missingPatches,
          [id]: 0
        }
      })

      this._refreshHostMissingPatches(host)
    })
  }

  render () {
    const hosts = this._getHosts()
    const noPatches = isEmpty(hosts)

    return (
      <Container>
        <Row>
          <Col className='text-xs-right'>
            <TabButton
              btnStyle='secondary'
              handler={this._refreshMissingPatches}
              icon='refresh'
              labelId='refreshPatches'
            />
            <TabButton
              btnStyle='primary'
              disabled={noPatches}
              handler={this._installAllMissingPatches}
              icon='host-patch-update'
              labelId='installPoolPatches'
            />
          </Col>
        </Row>
        <Row>
          <Col>
            {!noPatches
            ? (
              <SortedTable
                collection={hosts}
                columns={MISSING_PATCHES_COLUMNS}
                userData={{
                  installAllHostPatches: this._installAllHostPatches,
                  missingPatches: this.state.missingPatches
                }}
              />
            ) : <p>{_('patchNothing')}</p>
          }
          </Col>
        </Row>
      </Container>
    )
  }
}
