import React from 'react'

import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import Icon from 'icon'
import renderXoItem, { Network } from 'render-xo-item'
import SelectFiles from 'select-files'
import TabButton from 'tab-button'
import Upgrade from 'xoa-upgrade'
import { addSubscriptions, connectStore } from 'utils'
import { Container, Row, Col } from 'grid'
import { CustomFields } from 'custom-fields'
import { injectIntl } from 'react-intl'
import { map } from 'lodash'
import { Text, XoSelect } from 'editable'
import {
  createGetObject,
  createGetObjectsOfType,
  createGroupBy,
  createCollectionWrapper,
  createSelector,
} from 'selectors'
import {
  editPool,
  installSupplementalPackOnAllHosts,
  setHostsMultipathing,
  setPoolMaster,
  setRemoteSyslogHost,
  setRemoteSyslogHosts,
  subscribePlugins,
  synchronizeNetbox,
} from 'xo'

@connectStore(() => ({
  master: createGetObjectsOfType('host').find((_, { pool }) => ({
    id: pool.master,
  })),
}))
class PoolMaster extends Component {
  _getPoolMasterPredicate = host => host.$pool === this.props.pool.id

  _onChange = host => setPoolMaster(host)

  render() {
    const { pool, master } = this.props

    return (
      <XoSelect onChange={this._onChange} predicate={this._getPoolMasterPredicate} value={pool.master} xoType='host'>
        {master.name_label}
      </XoSelect>
    )
  }
}

@injectIntl
@connectStore(() => {
  const getHosts = createGetObjectsOfType('host')
    .filter((_, { pool }) => ({ $pool: pool.id }))
    .sort()
  return {
    hosts: getHosts,
    hostsByMultipathing: createGroupBy(
      getHosts,
      () =>
        ({ multipathing }) =>
          multipathing ? 'enabled' : 'disabled'
    ),
    gpuGroups: createGetObjectsOfType('gpuGroup')
      .filter((_, { pool }) => ({ $pool: pool.id }))
      .sort(),
    migrationNetwork: createGetObject((_, { pool }) => pool.otherConfig['xo:migrationNetwork']),
  }
})
@addSubscriptions({
  plugins: subscribePlugins,
})
export default class TabAdvanced extends Component {
  _getMigrationNetworkPredicate = createSelector(
    createCollectionWrapper(
      createSelector(
        () => this.props.pifs,
        pifs => {
          const networkIds = new Set()
          pifs.forEach(pif => {
            if (pif.ip !== '') {
              networkIds.add(pif.$network)
            }
          })
          return networkIds
        }
      )
    ),
    networkIds => network => networkIds.has(network.id)
  )

  _isNetboxPluginLoaded = createSelector(
    () => this.props.plugins,
    plugins => plugins !== undefined && plugins.some(plugin => plugin.name === 'netbox' && plugin.loaded)
  )

  _onChangeMigrationNetwork = migrationNetwork => editPool(this.props.pool, { migrationNetwork: migrationNetwork.id })

  _removeMigrationNetwork = () => editPool(this.props.pool, { migrationNetwork: null })

  _setRemoteSyslogHosts = () =>
    setRemoteSyslogHosts(this.props.hosts, this.state.syslogDestination).then(() =>
      this.setState({ editRemoteSyslog: false, syslogDestination: '' })
    )

  render() {
    const { hosts, gpuGroups, pool, hostsByMultipathing, migrationNetwork } = this.props
    const { state } = this
    const { editRemoteSyslog } = state
    const { enabled: hostsEnabledMultipathing, disabled: hostsDisabledMultipathing } = hostsByMultipathing
    return (
      <div>
        <Container>
          {this._isNetboxPluginLoaded() && (
            <Row>
              <Col className='text-xs-right'>
                <TabButton
                  btnStyle='primary'
                  handler={synchronizeNetbox}
                  handlerParam={[pool]}
                  icon='refresh'
                  labelId='syncNetbox'
                />
              </Col>
            </Row>
          )}
          <Row>
            <Col>
              <h3>{_('xenSettingsLabel')}</h3>
              <table className='table'>
                <tbody>
                  <tr>
                    <th>{_('poolHaStatus')}</th>
                    <td>{pool.HA_enabled ? _('poolHaEnabled') : _('poolHaDisabled')}</td>
                  </tr>
                  <tr>
                    <th>{_('setpoolMaster')}</th>
                    <td>
                      <PoolMaster pool={pool} />
                    </td>
                  </tr>
                  <tr>
                    <th>{_('customFields')}</th>
                    <td>
                      <CustomFields object={pool.id} />
                    </td>
                  </tr>
                  <tr>
                    <th>{_('syslogRemoteHost')}</th>
                    <td>
                      <ul className='pl-0'>
                        {map(hosts, host => (
                          <li key={host.id}>
                            <span>{`${host.name_label}: `}</span>
                            <Text
                              value={host.logging.syslog_destination || ''}
                              onChange={value => setRemoteSyslogHost(host, value)}
                            />
                          </li>
                        ))}
                      </ul>
                      <ActionRowButton
                        btnStyle={editRemoteSyslog ? 'info' : 'primary'}
                        handler={this.toggleState('editRemoteSyslog')}
                        icon='edit'
                      >
                        {_('poolEditAll')}
                      </ActionRowButton>
                      {editRemoteSyslog && (
                        <form id='formRemoteSyslog' className='form-inline mt-1'>
                          <div className='form-group'>
                            <input
                              className='form-control'
                              onChange={this.linkState('syslogDestination')}
                              placeholder={this.props.intl.formatMessage(messages.poolRemoteSyslogPlaceHolder)}
                              type='text'
                              value={state.syslogDestination}
                            />
                          </div>
                          <div className='form-group ml-1'>
                            <ActionButton
                              btnStyle='primary'
                              form='formRemoteSyslog'
                              handler={this._setRemoteSyslogHosts}
                              icon='save'
                            >
                              {_('confirmOk')}
                            </ActionButton>
                          </div>
                        </form>
                      )}
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
        <h3 className='mt-1 mb-1'>{_('multipathing')}</h3>
        <div>
          <ActionButton
            btnStyle='success'
            data-hosts={hostsDisabledMultipathing}
            data-multipathing
            disabled={hostsDisabledMultipathing === undefined}
            handler={setHostsMultipathing}
            icon='host'
          >
            {_('enableAllHostsMultipathing')}
          </ActionButton>{' '}
          <ActionButton
            btnStyle='danger'
            data-hosts={hostsEnabledMultipathing}
            data-multipathing={false}
            disabled={hostsEnabledMultipathing === undefined}
            handler={setHostsMultipathing}
            icon='host'
          >
            {_('disableAllHostsMultipathing')}
          </ActionButton>
        </div>
        <h3 className='mt-1 mb-1'>{_('supplementalPackPoolNew')}</h3>
        <Upgrade place='poolSupplementalPacks' required={2}>
          <SelectFiles onChange={file => installSupplementalPackOnAllHosts(pool, file)} />
        </Upgrade>
        <h3 className='mt-1 mb-1'>{_('miscLabel')}</h3>
        <Container>
          <Row>
            <Col>
              <table className='table'>
                <tbody>
                  <tr>
                    <th>{_('defaultMigrationNetwork')}</th>
                    <td>
                      <XoSelect
                        onChange={this._onChangeMigrationNetwork}
                        predicate={this._getMigrationNetworkPredicate()}
                        value={migrationNetwork}
                        xoType='network'
                      >
                        {migrationNetwork !== undefined ? <Network id={migrationNetwork.id} /> : _('noValue')}
                      </XoSelect>{' '}
                      {migrationNetwork !== undefined && (
                        <a role='button' onClick={this._removeMigrationNetwork}>
                          <Icon icon='remove' />
                        </a>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Col>
          </Row>
        </Container>
      </div>
    )
  }
}
