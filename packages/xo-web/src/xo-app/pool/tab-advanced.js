import React from 'react'

import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import Copiable from 'copiable'
import propTypes from 'prop-types-decorator'
import renderXoItem from 'render-xo-item'
import SelectFiles from 'select-files'
import SingleLineRow from 'single-line-row'
import Upgrade from 'xoa-upgrade'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { injectIntl } from 'react-intl'
import { Text, XoSelect } from 'editable'
import { Container, Row, Col } from 'grid'
import { map, sortBy, uniq } from 'lodash'
import {
  editHost,
  installSupplementalPackOnAllHosts,
  setRemoteSyslogHosts,
  setPoolMaster,
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

@injectIntl
@propTypes({
  onClose: propTypes.func,
  hosts: propTypes.object.isRequired,
})
class EditPoolRemoteSyslog extends Component {
  _setRemoteSyslogHosts = ({ hosts, syslogDestination }) =>
    setRemoteSyslogHosts(hosts, syslogDestination).then(this.props.onClose)

  render () {
    const { hosts, intl } = this.props
    return (
      <form id='formRemoteSyslog' className='form-inline mt-1'>
        <div className='form-group'>
          <input
            className='form-control'
            onChange={this.linkState('syslogDestination')}
            placeholder={intl.formatMessage(
              messages.hostRemoteSyslogPlaceHolder
            )}
            type='text'
          />
        </div>
        <div className='form-group ml-1'>
          <ActionButton
            btnStyle='primary'
            data-hosts={hosts}
            data-syslogDestination={this.state.syslogDestination}
            form='formRemoteSyslog'
            handler={this._setRemoteSyslogHosts}
            icon='save'
            tooltip={_('hostRemoteSyslogTooltip')}
          >
            {_('changeHostRemoteSyslogOK')}
          </ActionButton>
        </div>
      </form>
    )
  }
}

@connectStore({
  hostsByPool: createGetObjectsOfType('host').groupBy('$pool'),
  gpuGroups: createGetObjectsOfType('gpuGroup'),
})
export default class TabAdvanced extends Component {
  _closeEditRemoteSyslogForm = () => this.setState({ editRemoteSyslog: false })
  _closeEditRemoteSyslogHostsForm = () =>
    this.setState({ editRemoteSyslogHosts: false })
  _openEditRemoteSyslogHostsForm = idHost =>
    this.setState({ idHost, editRemoteSyslogHosts: true })

  _setNameLabel = (host, nameLabel) => editHost(host, { name_label: nameLabel })

  render () {
    const { hostsByPool, gpuGroups, pool } = this.props
    const { editRemoteSyslog, editRemoteSyslogHosts, idHost } = this.state
    const hostsOfPool = sortBy(hostsByPool[pool.uuid], 'name_label')

    const syslogRemoteHost =
      uniq(map(hostsOfPool, host => host.logging.syslog_destination)).length ===
      1
        ? hostsOfPool[0].logging.syslog_destination
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
                    <th>{_('poolRemoteSyslog')}</th>
                    <td>
                      <SingleLineRow>
                        <Col>
                          <span>{syslogRemoteHost} </span>
                          <ActionRowButton
                            btnStyle={editRemoteSyslog ? 'info' : 'primary'}
                            handler={this.toggleState('editRemoteSyslog')}
                            icon='edit'
                            tooltip={_('poolEditRemoteSyslog')}
                          />
                        </Col>
                      </SingleLineRow>
                      {editRemoteSyslog && (
                        <Row>
                          <Col>
                            <EditPoolRemoteSyslog
                              hosts={hostsOfPool}
                              onClose={this._closeEditRemoteSyslogForm}
                            />
                          </Col>
                        </Row>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>{_('syslogRemoteHost')}</th>
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
                                useLongClick
                              />
                            </Col>
                            <Col>
                              <span>
                                {' '}
                                {host.logging['syslog_destination']}{' '}
                              </span>
                              <ActionRowButton
                                btnStyle={editRemoteSyslog ? 'info' : 'primary'}
                                handler={() =>
                                  this._openEditRemoteSyslogHostsForm(host.id)
                                }
                                icon='edit'
                                tooltip={_('editRemoteSyslog')}
                              />
                            </Col>
                          </SingleLineRow>
                          {idHost === host.id &&
                            editRemoteSyslogHosts && (
                              <Row>
                                <Col>
                                  <EditPoolRemoteSyslog
                                    hosts={[host]}
                                    onClose={
                                      this._closeEditRemoteSyslogHostsForm
                                    }
                                  />
                                </Col>
                              </Row>
                            )}
                        </div>
                      ))}
                    </td>
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
