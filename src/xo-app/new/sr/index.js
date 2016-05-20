import _, { messages } from 'messages'
import ActionButton from 'action-button'
import filter from 'lodash/filter'
import Icon from 'icon'
import includes from 'lodash/includes'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React, { Component } from 'react'
import trim from 'lodash.trim'
import Wizard, { Section } from 'wizard'
import { connectStore, formatSize } from 'utils'
import { hosts, objects, createFilter, createSelector } from 'selectors'
import { injectIntl } from 'react-intl'
import { SelectHost } from 'select-objects'

import {
  // createSrIso,
  // createSrIscsi,
  // createSrLvm,
  // createSrNfs,
  probeSrIscsiExists,
  probeSrIscsiIqns,
  probeSrIscsiLuns,
  probeSrNfs,
  probeSrNfsExists,
  reattachSrIso,
  reattachSr
} from 'xo'

// ===================================================================

const SR_TYPE_TO_INFO = {
  nfs: 'NFS',
  iscsi: 'iSCSI',
  lvm: 'Local LVM',
  local: 'Local',
  nfsiso: 'NFS ISO',
  smb: 'SMB'
}

// ===================================================================

@injectIntl
@connectStore(() => {
  const srs = createFilter(objects, () => object => object.type === 'SR', true)

  return (state, props) => ({
    hosts: hosts(state, props),
    srs: srs(state, props)
  })
})
export default class New extends Component {
  constructor (props) {
    super(props)
    this.state = {
      description: undefined,
      host: undefined,
      iqn: undefined,
      iqns: undefined,
      lockCreation: undefined,
      lun: undefined,
      luns: undefined,
      name: undefined,
      path: undefined,
      paths: undefined,
      type: undefined,
      unused: undefined,
      usage: undefined,
      used: undefined
    }
    this.getHostSrs = createFilter(
      () => this.props.srs,
      createSelector(
        () => this.state.host,
        ({$pool, id}) => sr => sr.$container === $pool || sr.$container === id
      ),
      true
    )
  }

  _handleSubmit = () => {
    const {
      device,
      host,
      localPath,
      lun,
      name,
      description,
      server,
      username,
      password
    } = this.refs
    const {
      iqn,
      path,
      type
    } = this.state
    const [address, port] = server && server.value.split(':') || []

    switch (type) {
      case 'nfs':
        console.log(host.getWrappedInstance().value, name.value, description.value, address, path)
        // createSrNfs(host.getWrappedInstance().value, name.value, description.value, address, path)
        break
      case 'iscsi':
        console.log(host.getWrappedInstance().value, name.value, description.value, iqn.ip, iqn.iqn, lun.scsiId, port, username && username.value, password && password.value)
        // createSrIscsi(host.getWrappedInstance().value, name.value, description.value, iqn.ip, iqn.iqn, lun.scsiId, port, username && username.value, password && password.value)
        break
      case 'lvm':
        console.log(host.getWrappedInstance().value, name.value, description.value, device.value)
        // createSrLvm(host.getWrappedInstance().value, name.value, description.value, device.value)
        break
      case 'local':
        console.log(host.getWrappedInstance().value, name.value, description.value, localPath.value, 'local')
        // createSrIso(host.getWrappedInstance().value, name.value, description.value, localPath.value, 'local')
        break
      case 'nfsiso':
        console.log(host.getWrappedInstance().value, name.value, description.value, `${address}:${path}`, 'nfs', username && username.value, password && password.value)
        // createSrIso(host.getWrappedInstance().value, name.value, description.value, `${address}:${path}`, 'nfs', username.value, password.value)
        break
      case 'smb':
        console.log(host.getWrappedInstance().value, name.value, description.value, server.value, 'smb', username && username.value, password && password.value)
        // createSrIso(host.getWrappedInstance().value, name.value, description.value, server.value, 'smb', username.value, password.value)
        break
    }
  }

  _handleSrHostSelection = host => this.setState({host})
  _handleNameChange = name => this.setState({name})
  _handleDescriptionChange = description => this.setState({description})

  _handleSrTypeSelection = type => {
    this.setState({
      type,
      paths: undefined,
      iqns: undefined,
      usage: undefined,
      used: undefined,
      unused: undefined,
      summary: type === 'lvm' || type === 'local' || type === 'smb'
    })
  }

  _handleSrIqnSelection = async iqn => {
    const {
      host,
      username,
      password
    } = this.refs

    try {
      const luns = await probeSrIscsiLuns(host.getWrappedInstance().value, iqn.ip, iqn.iqn, username, password)
      this.setState({
        iqn,
        luns
      })
    } catch (error) {
      console.error(error) // FIXME
    }
  }

  _handleSrLunSelection = async lun => {
    const {
      host,
      iqn,
      server,
      username,
      password
    } = this.refs

    const [, port] = server.value.split(':')

    try {
      const list = await probeSrIscsiExists(host.getWrappedInstance().value, iqn.ip, iqn.iqn, lun.scsiId, port, username, password)
      const srIds = map(this.getHostSrs(), sr => sr.id)
      const used = filter(list, item => includes(srIds, item.id))
      const unused = filter(list, item => !includes(srIds, item.id))
      this.setState({
        lun,
        usage: true,
        used,
        unused,
        summary: used.length <= 0
      })
    } catch (error) {
      console.error(error) // FIXME
    }
  }

  _handleAuthChoice = () => {
    const auth = this.refs['auth'].checked
    this.setState({
      auth
    })
  }

  _handleSearchServer = async () => {
    const {
      host,
      server,
      username,
      password
    } = this.refs

    const {
      type
    } = this.state

    const [address, port] = server.value.split(':')

    if (type === 'nfs' || type === 'nfsiso') {
      try {
        const paths = await probeSrNfs(host.getWrappedInstance().value, address)
        this.setState({
          usage: undefined,
          paths
        })
      } catch (error) {
        console.error(error) // FIXME
      }
    } else if (type === 'iscsi') {
      try {
        const iqns = await probeSrIscsiIqns(host.getWrappedInstance().value, address, port, username && username.value, password && password.value)
        if (!iqns.length) {
          console.warning('No IQNs found') // FIXME
        } else {
          this.setState({
            usage: undefined,
            iqns
          })
        }
      } catch (error) {
        console.error(error) // FIXME
      }
    }
  }

  _handleSrPathSelection = async path => {
    const {
      host,
      server
    } = this.refs

    const [address] = server.value.split(':')

    try {
      const list = await probeSrNfsExists(host.getWrappedInstance().value, address, path)
      const srIds = map(this.getHostSrs(), sr => sr.id)
      const used = filter(list, item => includes(srIds, item.id))
      const unused = filter(list, item => !includes(srIds, item.id))
      this.setState({
        path,
        usage: true,
        used,
        unused,
        summary: used.length <= 0
      })
    } catch (error) {
      console.error(error) // FIXME
    }
  }

  _reattach = async uuid => {
    const {
      host,
      type
    } = this.state

    let {
      name,
      description
    } = this.refs

    name = trim(name)
    description = trim(description)
    if (isEmpty(name) || isEmpty(description)) {
      throw new Error('Missing Parameter') // FIXME
    }

    const method = (type === 'nfsiso') ? reattachSrIso : reattachSr
    try {
      await method(host, uuid, name, description, type)
    } catch (error) {
      console.error(error) // FIXME
    }
  }

  render () {
    const { hosts } = this.props
    const {
      auth,
      iqns,
      lockCreation,
      lun,
      luns,
      path,
      paths,
      summary,
      type,
      unused,
      usage,
      used
    } = this.state
    const { formatMessage } = this.props.intl

    return (
      <form id='newSrForm'>
        <Wizard>
          <Section icon='storage' title='newSrGeneral'>
            <fieldset className='form-group'>
              <label htmlFor='selectSrHost'>{_('newSrHost')}</label>
              <SelectHost
                options={hosts}
                onChange={this._handleSrHostSelection}
                ref='host'
              />
              <label htmlFor='srName'>{_('newSrName')}</label>
              <input
                id='srName'
                className='form-control'
                placeholder='storage name'
                ref='name'
                onBlur={event => { this._handleNameChange(event.target.value) }}
                required
                type='text'
              />
              <label htmlFor='srDescription'>{_('newSrDescription')}</label>
              <input
                id='srDescription'
                className='form-control'
                placeholder='storage description'
                ref='description'
                onBlur={event => { this._handleDescriptionChange(event.target.value) }}
                required
                type='text'
              />
              <label htmlFor='selectSrType'>{_('newSrTypeSelection')}</label>
              <select
                className='form-control'
                defaultValue={null}
                id='selectSrType'
                onChange={event => { this._handleSrTypeSelection(event.target.value) }}
                required
              >
                <option value={null}>{formatMessage(messages.noSelectedValue)}</option>
                {map(SR_TYPE_TO_INFO, (label, key) =>
                  <option key={key} value={key}>{label}</option>
                )}
              </select>
            </fieldset>
          </Section>
          <Section icon='settings' title='newSrSettings'>
            {(type === 'nfs' || type === 'nfsiso') &&
              <fieldset>
                <label htmlFor='srServer'>{_('newSrServer')}</label>
                <div className='input-group'>
                  <input
                    id='srServer'
                    className='form-control'
                    placeholder='address'
                    ref='server'
                    required
                    type='text'
                  />
                  <span className='input-group-btn'>
                    <ActionButton icon='search' btnStyle='default' handler={this._handleSearchServer} />
                    {/* <button type='button' className='btn btn-default' onClick={this._handleSearchServer}>
                      <Icon icon='search' />
                    </button>*/}
                  </span>
                </div>
              </fieldset>
            }
            {paths &&
              <fieldset>
                <label htmlFor='selectSrPath'>{_('newSrPath')}</label>
                <select
                  className='form-control'
                  defaultValue={null}
                  id='selectSrPath'
                  onChange={event => { this._handleSrPathSelection(event.target.value) }}
                  ref='path'
                  required
                >
                  <option value={null}>{formatMessage(messages.noSelectedValue)}</option>
                  {map(paths, (item, key) =>
                    <option key={key} value={item.path}>{item.path}</option>
                  )}
                </select>
              </fieldset>
            }
            {type === 'iscsi' &&
              <fieldset>
                <label htmlFor='srServer'>
                  {_('newSrServer')} ({_('newSrAuth')}<input type='checkbox' ref='auth' onChange={event => { this._handleAuthChoice() }} />)
                </label>
                <div className='input-group'>
                  <input
                    id='srServer'
                    className='form-control'
                    placeholder='address[:port]'
                    ref='server'
                    required
                    type='text'
                  />
                  <span className='input-group-btn'>
                    <button type='button' className='btn btn-default' onClick={this._handleSearchServer}>
                      <Icon icon='search' />
                    </button>
                  </span>
                </div>
                {auth &&
                  <fieldset>
                    <label htmlFor='srServerUser'>{_('newSrUsername')}</label>
                    <input
                      id='srServerUser'
                      className='form-control'
                      placeholder='user'
                      ref='username'
                      required
                      type='text'
                    />
                    <label htmlFor='srServerUser'>{_('newSrPassword')}</label>
                    <input
                      id='srServerPassword'
                      className='form-control'
                      placeholder='password'
                      ref='password'
                      required
                      type='text'
                    />
                  </fieldset>
                }
              </fieldset>
            }
            {iqns &&
              <fieldset>
                <label htmlFor='selectSrIqn'>IQN</label>
                <select
                  className='form-control'
                  defaultValue={null}
                  id='selectSrIqn'
                  onChange={event => { this._handleSrIqnSelection(event.target.value) }}
                  ref='iqn'
                  required
                >
                  <option value={null}>{formatMessage(messages.noSelectedValue)}</option>
                  {map(iqns, (item, key) =>
                    <option key={key} value={item}>{item.iqn} ({item.ip})</option>
                  )}
                </select>
              </fieldset>
            }
            {luns &&
              <fieldset>
                <label htmlFor='selectSrLun'>LUN</label>
                <select
                  className='form-control'
                  defaultValue={null}
                  id='selectSrLun'
                  onChange={event => { this._handleSrLunSelection(event.target.value) }}
                  required
                >
                  <option value={null}>{formatMessage(messages.noSelectedValue)}</option>
                  {map(luns, (item, key) =>
                    <option key={key} value={item}>LUN {item.id}: {item.serial} {formatSize(item.size)} ({item.vendor})</option>
                  )}
                </select>
              </fieldset>
            }
            {type === 'smb' &&
              <fieldset>
                <label htmlFor='srServer'>{_('newSrServer')}</label>
                <input
                  id='srServer'
                  className='form-control'
                  placeholder='address'
                  ref='server'
                  required
                  type='text'
                />
                <label htmlFor='srServerUser'>{_('newSrUsername')}</label>
                <input
                  id='srServerUser'
                  className='form-control'
                  placeholder='user'
                  ref='username'
                  required
                  type='text'
                />
                <label htmlFor='srServerPassword'>{_('newSrPassword')}</label>
                <input
                  id='srServerPassword'
                  className='form-control'
                  placeholder='password'
                  ref='password'
                  required
                  type='text'
                />
              </fieldset>
            }
            {type === 'lvm' &&
              <fieldset>
                <label htmlFor='srDevice'>{_('newSrDevice')}</label>
                <input
                  id='srDevice'
                  className='form-control'
                  placeholder='Device, e.g /dev/sda...'
                  ref='device'
                  required
                  type='text'
                />
              </fieldset>
            }
            {type === 'local' &&
              <fieldset>
                <label htmlFor='srPath'>{_('newSrPath')}</label>
                <input
                  id='srPath'
                  className='form-control'
                  placeholder=''
                  ref='localPath'
                  required
                  type='text'
                />
              </fieldset>
            }
          </Section>
          <Section icon='shown' title='newSrUsage'>
            {usage &&
              <div>
                {map(unused, (sr, key) =>
                  <p key={key}>
                    {sr.uuid}
                    <span className='pull-right'>
                      <ActionButton btnStyle='primary' handler={this._reattach} handlerParam={sr.uuid} icon='connect' />
                    </span>
                  </p>
                )}
                {map(used, (sr, key) =>
                  <p key={key}>
                    {sr.uuid}
                    <span className='pull-right'>
                      <a className='btn btn-warning'>{_('newSrInUse')}</a> // FIXME Goes to sr view
                    </span>
                  </p>
                )}
              </div>
            }
          </Section>
          <Section icon='summary' title='newSrSummary'>
            {summary &&
              <div>
                <dl className='dl-horizontal'>
                  <dt>{_('newSrName')}</dt>
                  <dd>{this.refs.name && this.refs.name.value}</dd>
                  <dt>{_('newSrDescription')}</dt>
                  <dd>{this.refs.description && this.refs.description.value}</dd>
                  <dt>{_('newSrType')}</dt>
                  <dd>{type}</dd>
                </dl>
                {type === 'iscsi' &&
                  <dl className='dl-horizontal'>
                    <dt>{_('newSrSize')}</dt>
                    <dd>{formatSize(lun.size)}</dd>
                  </dl>
                }
                {type === 'nfs' &&
                  <dl className='dl-horizontal'>
                    <dt>{_('newSrPath')}</dt>
                    <dd>{path}</dd>
                  </dl>
                }
                <ActionButton form='newSrForm' type='submit' disabled={lockCreation} icon='play' btnStyle='primary' handler={this._handleSubmit}>
                  {_('newSrCreate')}
                </ActionButton>
              </div>
            }
          </Section>
        </Wizard>
      </form>
    )
  }
}
