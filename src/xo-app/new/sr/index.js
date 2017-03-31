import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import filter from 'lodash/filter'
import Icon from 'icon'
import includes from 'lodash/includes'
import info, { error } from 'notification'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import Page from '../../page'
import propTypes from 'prop-types-decorator'
import React from 'react'
import store from 'store'
import trim from 'lodash/trim'
import Wizard, { Section } from 'wizard'
import { confirm } from 'modal'
import { connectStore, formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import { injectIntl } from 'react-intl'
import { Password, Select } from 'form'
import { SelectHost } from 'select-objects'
import {
  createFilter,
  createGetObjectsOfType,
  createSelector,
  getObject
} from 'selectors'
import {
  createSrIso,
  createSrIscsi,
  createSrLvm,
  createSrNfs,
  probeSrIscsiExists,
  probeSrIscsiIqns,
  probeSrIscsiLuns,
  probeSrNfs,
  probeSrNfsExists,
  reattachSrIso,
  reattachSr
} from 'xo'

// ===================================================================

@propTypes({
  onChange: propTypes.func.isRequired,
  options: propTypes.array.isRequired
})
class SelectIqn extends Component {
  _computeOptions (props = this.props) {
    this.setState({
      options: map(props.options, (iqn, id) => ({
        value: `${iqn.ip}$${iqn.iqn}`,
        label: `${iqn.iqn} (${iqn.ip})`
      }))
    })
  }

  _handleChange = value => {
    const { onChange } = this.props

    value = value.value
    const index = value.indexOf('$')

    this.setState({
      value
    }, () => onChange({
      ip: value.slice(0, index),
      iqn: value.slice(index + 1)
    }))
  }

  componentWillMount () {
    this._computeOptions()
  }

  componentWillReceiveProps (props) {
    this._computeOptions(props)
  }

  render () {
    const { state } = this
    return (
      <Select
        clearable={false}
        onChange={this._handleChange}
        options={state.options}
        value={state.value}
      />
    )
  }
}

@propTypes({
  onChange: propTypes.func.isRequired,
  options: propTypes.array.isRequired
})
class SelectLun extends Component {
  _computeOptions (props = this.props) {
    this.setState({
      options: map(props.options, lun => ({
        value: lun.id,
        label: `LUN ${lun.id}: ${lun.serial} - ${formatSize(+lun.size)} - (${lun.vendor})`
      }))
    })
  }

  _handleChange = value => {
    const { onChange, options } = this.props
    value = value.value
    this.setState({ value }, () => onChange(options[value]))
  }

  componentWillMount () {
    this._computeOptions()
  }

  componentWillReceiveProps (props) {
    this._computeOptions(props)
  }

  render () {
    const { state } = this
    return (
      <Select
        clearable={false}
        onChange={this._handleChange}
        options={state.options}
        value={state.value}
      />
    )
  }
}

// ===================================================================

const SR_TYPE_TO_LABEL = {
  nfs: 'NFS',
  iscsi: 'iSCSI',
  lvm: 'Local LVM',
  local: 'Local',
  nfsiso: 'NFS ISO',
  smb: 'SMB'
}

const SR_GROUP_TO_LABEL = {
  vdisr: 'VDI SR',
  isosr: 'ISO SR'
}

const typeGroups = {
  vdisr: ['nfs', 'iscsi', 'lvm'],
  isosr: ['local', 'nfsiso', 'smb']
}

const getSrPath = id => `/srs/${id}`

// ===================================================================

@injectIntl
@connectStore(() => ({
  hosts: createGetObjectsOfType('host'),
  srs: createGetObjectsOfType('SR')
}))
export default class New extends Component {
  constructor (props) {
    super(props)

    const hostId = props.location.query.host

    this.state = {
      description: undefined,
      host: hostId && getObject(store.getState(), hostId),
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

  _handleSubmit = async () => {
    const {
      description,
      device,
      localPath,
      name,
      password,
      port,
      server,
      username
    } = this.refs
    const {
      host,
      iqn,
      lun,
      path,
      type
    } = this.state

    const createMethodFactories = {
      nfs: async () => {
        const previous = await probeSrNfsExists(host.id, server.value, path)
        if (previous && previous.length > 0) {
          try {
            await confirm({title: _('existingSrModalTitle'),
              body: <p>{_('existingSrModalText')}</p>
            })
          } catch (error) {
            return
          }
        }
        return createSrNfs(host.id, name.value, description.value, server.value, path)
      },
      iscsi: async () => {
        const previous = await probeSrIscsiExists(host.id, iqn.ip, iqn.iqn, lun.scsiId, +port.value, username && username.value, password && password.value)
        if (previous && previous.length > 0) {
          try {
            await confirm({title: _('existingLunModalTitle'),
              body: <p>{_('existingLunModalText')}</p>
            })
          } catch (error) {
            return
          }
        }
        return createSrIscsi(host.id, name.value, description.value, iqn.ip, iqn.iqn, lun.scsiId, +port.value, username && username.value, password && password.value)
      },
      lvm: () => createSrLvm(host.id, name.value, description.value, device.value),
      local: () => createSrIso(host.id, name.value, description.value, localPath.value, 'local'),
      nfsiso: () => createSrIso(host.id, name.value, description.value, `${server.value}:${path}`, 'nfs', username && username.value, password && password.value),
      smb: () => createSrIso(host.id, name.value, description.value, server.value, 'smb', username && username.value, password && password.value)
    }

    try {
      return await createMethodFactories[type]()
    } catch (err) {
      error('SR Creation', err.message || String(err))
    }
  }

  _handleSrHostSelection = host => this.setState({host})
  _handleNameChange = event => this.setState({name: event.target.value})
  _handleDescriptionChange = event => this.setState({description: event.target.value})

  _handleSrTypeSelection = event => {
    const type = event.target.value
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
      username,
      password
    } = this.refs
    const {
      host
    } = this.state

    try {
      this.setState({loading: true})
      const luns = await probeSrIscsiLuns(host.id, iqn.ip, iqn.iqn, username && username.value, password && password.value)
      this.setState({
        iqn,
        luns
      })
    } catch (err) {
      error('LUNs Detection', err.message || String(err))
    } finally {
      this.setState({loading: undefined})
    }
  }

  _handleSrLunSelection = async lun => {
    const {
      password,
      port,
      username
    } = this.refs
    const {
      host,
      iqn
    } = this.state

    try {
      this.setState({loading: true})
      const list = await probeSrIscsiExists(host.id, iqn.ip, iqn.iqn, lun.scsiId, +port.value, username && username.value, password && password.value)
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
    } catch (err) {
      error('iSCSI Error', err.message || String(err))
    } finally {
      this.setState({loading: undefined})
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
      password,
      port,
      server,
      username
    } = this.refs

    const {
      host,
      type
    } = this.state

    try {
      if (type === 'nfs' || type === 'nfsiso') {
        const paths = await probeSrNfs(host.id, server.value)
        this.setState({
          usage: undefined,
          paths
        })
      } else if (type === 'iscsi') {
        const iqns = await probeSrIscsiIqns(host.id, server.value, +port.value, username && username.value, password && password.value)
        if (!iqns.length) {
          info('iSCSI Detection', 'No IQNs found')
        } else {
          this.setState({
            usage: undefined,
            iqns
          })
        }
      }
    } catch (err) {
      error('Server Detection', err.message || String(err))
    }
  }

  _handleSrPathSelection = async path => {
    const {
      server
    } = this.refs
    const {
      host
    } = this.state

    try {
      this.setState({loading: true})
      const list = await probeSrNfsExists(host.id, server.value, path)
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
    } catch (err) {
      error('NFS Error', err.message || String(err))
    } finally {
      this.setState({loading: undefined})
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
      error('Missing General Parameters', 'Please complete General Information')
    }

    const method = (type === 'nfsiso') ? reattachSrIso : reattachSr
    try {
      await method(host.id, uuid, name, description, type)
    } catch (err) {
      error('Reattach', err.message || String(err))
    }
  }

  _renderHeader () {
    return <Container>
      <Row>
        <Col>
          <h2><Icon icon='sr' /> {_('newSrTitle')}</h2>
        </Col>
      </Row>
    </Container>
  }

  render () {
    const { hosts } = this.props
    const {
      auth,
      host,
      iqns,
      loading,
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
      <Page header={this._renderHeader()}>
        <form id='newSrForm'>
          <Wizard>
            <Section icon='sr' title='newSrGeneral'>
              <fieldset className='form-group'>
                <label>{_('newSrHost')}</label>
                <SelectHost
                  value={host}
                  options={hosts}
                  onChange={this._handleSrHostSelection}
                />
                <label htmlFor='srName'>{_('newSrName')}</label>
                <input
                  id='srName'
                  className='form-control'
                  placeholder={formatMessage(messages.newSrNamePlaceHolder)}
                  ref='name'
                  onBlur={this._handleNameChange}
                  required
                  type='text'
                />
                <label htmlFor='srDescription'>{_('newSrDescription')}</label>
                <input
                  id='srDescription'
                  className='form-control'
                  placeholder={formatMessage(messages.newSrDescPlaceHolder)}
                  ref='description'
                  onBlur={this._handleDescriptionChange}
                  required
                  type='text'
                />
                <label htmlFor='selectSrType'>{_('newSrTypeSelection')}</label>
                <select
                  className='form-control'
                  defaultValue={null}
                  id='selectSrType'
                  onChange={this._handleSrTypeSelection}
                  required
                >
                  <option value={null}>{formatMessage(messages.noSelectedValue)}</option>
                  {map(typeGroups, (types, group) =>
                    <optgroup key={group} label={SR_GROUP_TO_LABEL[group]}>
                      {map(types, type =>
                        <option key={type} value={type}>{SR_TYPE_TO_LABEL[type]}</option>
                      )}
                    </optgroup>)}
                </select>
              </fieldset>
            </Section>
            <Section icon='settings' title='newSrSettings'>
              {host &&
                <fieldset>
                  {(type === 'nfs' || type === 'nfsiso') &&
                    <fieldset>
                      <label htmlFor='srServer'>{_('newSrServer')}</label>
                      <div className='input-group'>
                        <input
                          id='srServer'
                          className='form-control'
                          placeholder={formatMessage(messages.newSrAddressPlaceHolder)}
                          ref='server'
                          required
                          type='text'
                        />
                        <span className='input-group-btn'>
                          <ActionButton icon='search' handler={this._handleSearchServer} />
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
                      <div className='form-inline'>
                        <input
                          id='srServer'
                          className='form-control'
                          placeholder={formatMessage(messages.newSrAddressPlaceHolder)}
                          ref='server'
                          required
                          type='text'
                        />
                        {' : '}
                        <input
                          id='srServer'
                          className='form-control'
                          placeholder={formatMessage(messages.newSrPortPlaceHolder)}
                          ref='port'
                          type='text'
                        />
                        <ActionButton icon='search' handler={this._handleSearchServer} />
                      </div>
                      {auth &&
                        <fieldset>
                          <label htmlFor='srServerUser'>{_('newSrUsername')}</label>
                          <input
                            id='srServerUser'
                            className='form-control'
                            placeholder={formatMessage(messages.newSrUsernamePlaceHolder)}
                            ref='username'
                            required
                            type='text'
                          />
                          <label>{_('newSrPassword')}</label>
                          <Password
                            placeholder={formatMessage(messages.newSrPasswordPlaceHolder)}
                            ref='password'
                            required
                          />
                        </fieldset>
                      }
                    </fieldset>
                  }
                  {iqns &&
                    <fieldset>
                      <label>{_('newSrIqn')}</label>
                      <SelectIqn
                        options={iqns}
                        onChange={this._handleSrIqnSelection}
                      />
                    </fieldset>
                  }
                  {luns &&
                    <fieldset>
                      <label>{_('newSrLun')}</label>
                      <SelectLun
                        options={luns}
                        onChange={this._handleSrLunSelection}
                      />
                    </fieldset>
                  }
                  {type === 'smb' &&
                    <fieldset>
                      <label htmlFor='srServer'>{_('newSrServer')}</label>
                      <input
                        id='srServer'
                        className='form-control'
                        placeholder={formatMessage(messages.newSrAddressPlaceHolder)}
                        ref='server'
                        required
                        type='text'
                      />
                      <label htmlFor='srServerUser'>{_('newSrUsername')}</label>
                      <input
                        id='srServerUser'
                        className='form-control'
                        placeholder={formatMessage(messages.newSrUsernamePlaceHolder)}
                        ref='username'
                        required
                        type='text'
                      />
                      <label>{_('newSrPassword')}</label>
                      <Password
                        placeholder={formatMessage(messages.newSrPasswordPlaceHolder)}
                        ref='password'
                        required
                      />
                    </fieldset>
                  }
                  {type === 'lvm' &&
                    <fieldset>
                      <label htmlFor='srDevice'>{_('newSrDevice')}</label>
                      <input
                        id='srDevice'
                        className='form-control'
                        placeholder={formatMessage(messages.newSrLvmDevicePlaceHolder)}
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
                        placeholder={formatMessage(messages.newSrLocalPathPlaceHolder)}
                        ref='localPath'
                        required
                        type='text'
                      />
                    </fieldset>
                  }
                </fieldset>
              }
              {loading &&
                <Icon icon='loading' />
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
                      <dd>{formatSize(+lun.size)}</dd>
                    </dl>
                  }
                  {type === 'nfs' &&
                    <dl className='dl-horizontal'>
                      <dt>{_('newSrPath')}</dt>
                      <dd>{path}</dd>
                    </dl>
                  }
                  <ActionButton
                    btnStyle='primary'
                    disabled={lockCreation}
                    form='newSrForm'
                    handler={this._handleSubmit}
                    icon='run'
                    redirectOnSuccess={getSrPath}
                  >
                    {_('newSrCreate')}
                  </ActionButton>
                </div>
              }
            </Section>
          </Wizard>
        </form>
      </Page>
    )
  }
}
