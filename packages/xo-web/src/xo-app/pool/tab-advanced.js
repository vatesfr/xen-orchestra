import React from 'react'

import _ from 'intl'
import Component from 'base-component'
import Copiable from 'copiable'
import renderXoItem from 'render-xo-item'
import SelectFiles from 'select-files'
import SingleLineRow from 'single-line-row'
import Upgrade from 'xoa-upgrade'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { Text, XoSelect } from 'editable'
import { Container, Row, Col } from 'grid'
import { map, sortBy, uniq } from 'lodash'
import {
  editHost,
  installSupplementalPackOnAllHosts,
  setPoolMaster,
  setRemoteSyslogHost,
  setRemoteSyslogHosts,
} from 'xo'

@connectStore(() => ({
  master: createGetObjectsOfType('host').find((_, { pool }) => ({
    id: pool.master,
  })),
}))
class PoolMaster extends Component {
  _getPoolMasterPredicate = host => host.$pool === this.props.pool.id

  _onChange = host => setPoolMaster(host)

  render () {
    const { pool, master } = this.props

    return (
      <XoSelect
        onChange={this._onChange}
        predicate={this._getPoolMasterPredicate}
        value={pool.master}
        xoType='host'
      >
        {master.name_label}
      </XoSelect>
    )
  }
}

@connectStore({
  hostsByPool: createGetObjectsOfType('host').groupBy('$pool'),
  gpuGroups: createGetObjectsOfType('gpuGroup'),
})
export default class TabAdvanced extends Component {
  _setNameLabel = (host, nameLabel) => editHost(host, { name_label: nameLabel })
  _setRemoteSyslogHost = (host, syslogDestination) =>
    setRemoteSyslogHost(host, syslogDestination)
  _setRemoteSyslogHosts = (hosts, syslogDestination) =>
    setRemoteSyslogHosts(hosts, syslogDestination)

  render () {
    const { hostsByPool, gpuGroups, pool } = this.props
    const hostsOfPool = sortBy(hostsByPool[pool.uuid], 'name_label')
    const syslogRemoteHost =
      uniq(
        map(
          hostsOfPool,
          host => host.logging && host.logging.syslog_destination
        )
      ).length === 1
        ? hostsOfPool[0].logging && hostsOfPool[0].logging.syslog_destination
        : ''

    return (
      <div>
        <Container>
          <Row>
            <Col>
              <h3>{_('xenSettingsLabel')}</h3>
              <table className='table'>
                <tbody>
                  <tr>
                    <th>{_('uuid')}</th>
                    <Copiable tagName='td'>{pool.uuid}</Copiable>
                  </tr>
                  <tr>
                    <th>{_('poolHaStatus')}</th>
                    <td>
                      {pool.HA_enabled
                        ? _('poolHaEnabled')
                        : _('poolHaDisabled')}
                    </td>
                  </tr>
                  <tr>
                    <th>{_('setpoolMaster')}</th>
                    <td>
                      <PoolMaster pool={pool} />
                    </td>
                  </tr>
                  <tr>
                    <th>{_('syslogRemoteHost')}</th>
                    {syslogRemoteHost !== '' ? (
                      <td>
                        <Text
                          value={syslogRemoteHost}
                          onChange={value =>
                            this._setRemoteSyslogHosts(hostsOfPool, value)
                          }
                        />
                      </td>
                    ) : (
                      <td>
                        {map(hostsOfPool, host => (
                          <div key={host.id} className='mb-1'>
                            <SingleLineRow>
                              <Col size={1}>
                                <Text
                                  value={host.name_label}
                                  onChange={value =>
                                    this._setNameLabel(host, value)
                                  }
                                />
                              </Col>
                              <Col>
                                <Text
                                  value={
                                    (host.logging &&
                                      host.logging.syslog_destination) ||
                                    ''
                                  }
                                  onChange={value =>
                                    this._setRemoteSyslogHost(host, value)
                                  }
                                />
                              </Col>
                            </SingleLineRow>
                          </div>
                        ))}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </Col>
          </Row>
        </Container>
        <h3 className='mt-1 mb-1'>{_('poolGpuGroups')}</h3>
        <Container>
          <Row>
            <Col size={9}>
              <ul className='list-group'>
                {map(gpuGroups, gpuGroup => (
                  <li key={gpuGroup.id} className='list-group-item'>
                    {renderXoItem(gpuGroup)}
                  </li>
                ))}
              </ul>
            </Col>
          </Row>
        </Container>
        <h3 className='mt-1 mb-1'>{_('supplementalPackPoolNew')}</h3>
        <Upgrade place='poolSupplementalPacks' required={2}>
          <SelectFiles
            onChange={file => installSupplementalPackOnAllHosts(pool, file)}
          />
        </Upgrade>
      </div>
    )
  }
}
