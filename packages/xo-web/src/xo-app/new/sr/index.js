import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import filter from 'lodash/filter'
import Icon from 'icon'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import includes from 'lodash/includes'
import info, { error } from 'notification'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import Page from '../../page'
import PropTypes from 'prop-types'
import React from 'react'
import store from 'store'
import Wizard, { Section } from 'wizard'
import { confirm } from 'modal'
import { adminOnly, connectStore, formatSize } from 'utils'
import { Container, Row, Col } from 'grid'
import { injectIntl } from 'react-intl'
import { Password, Select } from 'form'
import { SelectHost } from 'select-objects'
import { createFilter, createGetObjectsOfType, createSelector, getObject } from 'selectors'
import {
  createSrExt,
  createSrIso,
  createSrIscsi,
  createSrLvm,
  createSrNfs,
  createSrHba,
  createSrZfs,
  probeSrIscsiExists,
  probeSrIscsiIqns,
  probeSrIscsiLuns,
  probeSrNfs,
  probeSrNfsExists,
  probeSrHba,
  probeSrHbaExists,
  probeZfs,
  reattachSrIso,
  reattachSr,
} from 'xo'

// ===================================================================

const NFS_VERSIONS = ['4', '4.1']

// ===================================================================

class SelectScsiId extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    options: PropTypes.array.isRequired,
  }

  _getOptions = createSelector(
    () => this.props.options,
    options =>
      map(options, ({ vendor, path, size, scsiId }) => ({
        label: `${vendor} - ${path} (${formatSize(size)})`,
        value: scsiId,
      }))
  )

  _handleChange = opt => {
    const { props } = this

    this.setState({ value: opt.value }, () => props.onChange(opt.value))
  }

  componentDidMount() {
    return this.componentDidUpdate()
  }

  componentDidUpdate() {
    let options
    if (this.state.value === null && (options = this._getOptions()).length === 1) {
      this._handleChange(options[0])
    }
  }

  state = { value: null }

  render() {
    return (
      <Select clearable={false} onChange={this._handleChange} options={this._getOptions()} value={this.state.value} />
    )
  }
}

class SelectIqn extends Component {
  _getOptions = createSelector(
    () => this.props.options,
    options =>
      map(options, ({ ip, iqn }, index) => ({
        label: `${iqn} (${ip})`,
        value: index,
      }))
  )

  _handleChange = ({ value }) => {
    const { props } = this

    this.setState({ value }, () => props.onChange(props.options[value]))
  }

  componentDidMount() {
    return this.componentDidUpdate()
  }

  componentDidUpdate() {
    let options
    if (this.state.value === null && (options = this._getOptions()).length === 1) {
      this._handleChange(options[0])
    }
  }

  state = { value: null }

  render() {
    return (
      <Select clearable={false} onChange={this._handleChange} options={this._getOptions()} value={this.state.value} />
    )
  }
}

@injectIntl
class SelectLun extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    options: PropTypes.array.isRequired,
  }

  _getOptions = createSelector(
    () => this.props.options,
    () => this.props.intl.formatMessage,
    (options, formatMessage) =>
      map(options, (lun, index) => ({
        label: `LUN ${lun.id}: ${lun.serial} - ${
          lun.size !== undefined ? formatSize(+lun.size) : formatMessage(messages.unknownSize)
        } - (${lun.vendor})`,
        value: index,
      }))
  )

  _handleChange = ({ value }) => {
    const { props } = this
    this.setState({ value }, () => props.onChange(props.options[value]))
  }

  componentDidMount() {
    return this.componentDidUpdate()
  }

  componentDidUpdate() {
    let options
    if (this.state.value === null && (options = this._getOptions()).length === 1) {
      this._handleChange(options[0])
    }
  }

  state = { value: null }

  render() {
    return (
      <Select clearable={false} onChange={this._handleChange} options={this._getOptions()} value={this.state.value} />
    )
  }
}

// ===================================================================

const SR_TYPE_TO_LABEL = {
  ext: 'ext (local)',
  hba: 'HBA',
  iscsi: 'iSCSI',
  local: 'Local',
  lvm: 'LVM (local)',
  nfs: 'NFS',
  nfsiso: 'NFS ISO',
  smb: 'SMB',
  zfs: 'ZFS (local)',
}

const SR_GROUP_TO_LABEL = {
  vdisr: 'VDI SR',
  isosr: 'ISO SR',
}

const typeGroups = {
  vdisr: ['ext', 'hba', 'iscsi', 'lvm', 'nfs', 'zfs'],
  isosr: ['local', 'nfsiso', 'smb'],
}

const getSrPath = id => (id !== undefined ? `/srs/${id}` : undefined)

// ===================================================================

@adminOnly
@injectIntl
@connectStore(() => ({
  hosts: createGetObjectsOfType('host'),
  srs: createGetObjectsOfType('SR'),
}))
export default class New extends Component {
  constructor(props) {
    super(props)

    const hostId = props.location.query.host

    this.state = {
      description: undefined,
      host: hostId && getObject(store.getState(), hostId),
      iqn: undefined,
      iqns: undefined,
      loading: 0,
      lockCreation: undefined,
      lun: undefined,
      luns: undefined,
      nfsVersion: '',
      hbaDevices: undefined,
      name: undefined,
      path: undefined,
      paths: undefined,
      type: undefined,
      unused: undefined,
      usage: undefined,
      used: undefined,
      zfsPools: undefined,
    }
    this.getHostSrs = createFilter(
      () => this.props.srs,
      createSelector(
        () => this.state.host,
        ({ $pool, id }) => sr => sr.$container === $pool || sr.$container === id
      ),
      true
    )
  }

  _handleSubmit = async () => {
    const { description, device, localPath, name, password, port, server, username, zfsLocation } = this.refs
    const { host, iqn, lun, nfsOptions, nfsVersion, path, scsiId, type } = this.state

    const createMethodFactories = {
      nfs: () =>
        createSrNfs(
          host.id,
          name.value,
          description.value,
          server.value,
          path,
          nfsVersion !== '' ? nfsVersion : undefined,
          nfsOptions
        ),
      hba: async () => {
        const previous = await probeSrHbaExists(host.id, scsiId)
        if (previous && previous.length > 0) {
          try {
            await confirm({
              title: _('existingLunModalTitle'),
              body: <p>{_('existingLunModalText')}</p>,
            })
          } catch (error) {
            return
          }
        }
        return createSrHba(host.id, name.value, description.value, scsiId)
      },
      iscsi: async () => {
        const previous = await probeSrIscsiExists(
          host.id,
          iqn.ip,
          iqn.iqn,
          lun.scsiId,
          +port.value,
          username && username.value,
          password && password.value
        )
        if (previous && previous.length > 0) {
          try {
            await confirm({
              title: _('existingLunModalTitle'),
              body: <p>{_('existingLunModalText')}</p>,
            })
          } catch (error) {
            return
          }
        }
        return createSrIscsi(
          host.id,
          name.value,
          description.value,
          iqn.ip,
          iqn.iqn,
          lun.scsiId,
          +port.value,
          username && username.value,
          password && password.value
        )
      },
      lvm: () => createSrLvm(host.id, name.value, description.value, device.value),
      ext: () => createSrExt(host.id, name.value, description.value, device.value),
      zfs: () => createSrZfs(host.id, name.value, description.value, zfsLocation.value),
      local: () => createSrIso(host.id, name.value, description.value, localPath.value, 'local'),
      nfsiso: () =>
        createSrIso(
          host.id,
          name.value,
          description.value,
          `${server.value}:${path}`,
          'nfs',
          username && username.value,
          password && password.value
        ),
      smb: () =>
        createSrIso(
          host.id,
          name.value,
          description.value,
          server.value,
          'smb',
          username && username.value,
          password && password.value
        ),
    }

    try {
      return await createMethodFactories[type]()
    } catch (err) {
      error('SR Creation', err.message || String(err))
    }
  }

  _handleSrHostSelection = async host => {
    this.setState({ host })
    await this._probe(host, this.state.type)
  }
  _handleNameChange = event => this.setState({ name: event.target.value })
  _handleDescriptionChange = event => this.setState({ description: event.target.value })

  _handleSrTypeSelection = async event => {
    const type = event.target.value
    this.setState({
      hbaDevices: undefined,
      iqns: undefined,
      paths: undefined,
      summary: includes(['ext', 'lvm', 'local', 'smb', 'hba', 'zfs'], type),
      type,
      unused: undefined,
      usage: undefined,
      used: undefined,
    })
    await this._probe(this.state.host, type)
  }

  _handleSrHbaSelection = async scsiId => {
    this.setState({
      scsiId,
      usage: true,
    })
  }

  _handleSrIqnSelection = async iqn => {
    const { username, password } = this.refs
    const { host } = this.state

    try {
      this.setState(({ loading }) => ({ loading: loading + 1 }))
      const luns = await probeSrIscsiLuns(
        host.id,
        iqn.ip,
        iqn.iqn,
        username && username.value,
        password && password.value
      )
      this.setState({
        iqn,
        luns,
      })
    } catch (err) {
      error('LUNs Detection', err.message || String(err))
    } finally {
      this.setState(({ loading }) => ({ loading: loading - 1 }))
    }
  }

  _handleSrLunSelection = async lun => {
    const { password, port, username } = this.refs
    const { host, iqn } = this.state

    try {
      this.setState(({ loading }) => ({ loading: loading + 1 }))
      const list = await probeSrIscsiExists(
        host.id,
        iqn.ip,
        iqn.iqn,
        lun.scsiId,
        +port.value,
        username && username.value,
        password && password.value
      )
      const srIds = map(this.getHostSrs(), sr => sr.id)
      const used = filter(list, item => includes(srIds, item.id))
      const unused = filter(list, item => !includes(srIds, item.id))
      this.setState({
        lun,
        usage: true,
        used,
        unused,
        summary: used.length <= 0,
      })
    } catch (err) {
      error('iSCSI Error', err.message || String(err))
    } finally {
      this.setState(({ loading }) => ({ loading: loading - 1 }))
    }
  }

  _handleAuthChoice = () => {
    const auth = this.refs.auth.checked
    this.setState({
      auth,
    })
  }

  _handleSearchServer = async () => {
    const { password, port, server, username } = this.refs

    const { host, type } = this.state

    try {
      if (type === 'nfs' || type === 'nfsiso') {
        const paths = await probeSrNfs(host.id, server.value)
        this.setState({
          usage: undefined,
          paths,
        })
      } else if (type === 'iscsi') {
        const iqns = await probeSrIscsiIqns(
          host.id,
          server.value,
          +port.value,
          username && username.value,
          password && password.value
        )
        if (!iqns.length) {
          info('iSCSI Detection', 'No IQNs found')
        } else {
          this.setState({
            usage: undefined,
            iqns,
          })
        }
      }
    } catch (err) {
      error('Server Detection', err.message || String(err))
    }
  }

  _handleSrPathSelection = async path => {
    const { server } = this.refs
    const { host } = this.state

    try {
      this.setState(({ loading }) => ({ loading: loading + 1 }))
      const list = await probeSrNfsExists(host.id, server.value, path)
      const srIds = map(this.getHostSrs(), sr => sr.id)
      const used = filter(list, item => includes(srIds, item.id))
      const unused = filter(list, item => !includes(srIds, item.id))
      this.setState({
        path,
        usage: true,
        used,
        unused,
        summary: used.length <= 0,
      })
    } catch (err) {
      error('NFS Error', err.message || String(err))
    } finally {
      this.setState(({ loading }) => ({ loading: loading - 1 }))
    }
  }

  _handleNfsVersion = ({ target: { value } }) => {
    this.setState({
      nfsVersion: value,
    })
  }

  _probe = async (host, type) => {
    const probeMethodFactories = {
      hba: async hostId => ({
        hbaDevices: await probeSrHba(hostId)::ignoreErrors(),
      }),
      zfs: async hostId => ({
        zfsPools: await probeZfs(hostId)::ignoreErrors(),
      }),
    }
    if (probeMethodFactories[type] !== undefined && host != null) {
      this.setState(({ loading }) => ({ loading: loading + 1 }))
      const probeResult = await probeMethodFactories[type](host.id)
      this.setState(({ loading }) => ({
        loading: loading - 1,
        ...probeResult,
      }))
    }
  }

  _reattach = async uuid => {
    const { host, type } = this.state

    let { name, description } = this.refs

    name = name.value.trim()
    description = description.value.trim()
    if (isEmpty(name) || isEmpty(description)) {
      error('Missing General Parameters', 'Please complete General Information')
      return
    }

    const method = type === 'nfsiso' ? reattachSrIso : reattachSr
    try {
      await method(host.id, uuid, name, description, type)
    } catch (err) {
      error('Reattach', err.message || String(err))
    }
  }

  _renderHeader() {
    return (
      <Container>
        <Row>
          <Col>
            <h2>
              <Icon icon='sr' /> {_('newSrTitle')}
            </h2>
          </Col>
        </Row>
      </Container>
    )
  }

  render() {
    const { hosts } = this.props
    const {
      auth,
      host,
      iqns,
      hbaDevices,
      loading,
      lockCreation,
      lun,
      luns,
      nfsVersion,
      path,
      paths,
      summary,
      type,
      unused,
      usage,
      used,
      zfsPools,
    } = this.state
    const { formatMessage } = this.props.intl

    return (
      <Page header={this._renderHeader()}>
        <form id='newSrForm'>
          <Wizard>
            <Section icon='sr' title='newSrGeneral'>
              <fieldset className='form-group'>
                <label>{_('newSrHost')}</label>
                <SelectHost value={host} options={hosts} onChange={this._handleSrHostSelection} />
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
                  {map(typeGroups, (types, group) => (
                    <optgroup key={group} label={SR_GROUP_TO_LABEL[group]}>
                      {map(types, type => (
                        <option key={type} value={type}>
                          {SR_TYPE_TO_LABEL[type]}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </fieldset>
            </Section>
            <Section icon='settings' title='newSrSettings'>
              {host && (
                <fieldset>
                  {(type === 'nfs' || type === 'nfsiso') && [
                    <fieldset>
                      <label htmlFor='srServer'>{_('newSrServer')}</label>
                      <div className='input-group'>
                        <input
                          id='srServer'
                          className='form-control'
                          placeholder={formatMessage(messages.newSrNfsAddressPlaceHolder)}
                          ref='server'
                          required
                          type='text'
                        />
                        <span className='input-group-btn'>
                          <ActionButton icon='search' handler={this._handleSearchServer} />
                        </span>
                      </div>
                    </fieldset>,
                    <fieldset>
                      <label htmlFor='selectNfsVersion'>{_('newSrNfs')}</label>
                      <select
                        className='form-control'
                        id='selectNfsVersion'
                        onChange={this._handleNfsVersion}
                        value={nfsVersion}
                      >
                        <option value=''>{formatMessage(messages.newSrNfsDefaultVersion)}</option>
                        {map(NFS_VERSIONS, option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </fieldset>,
                    <fieldset>
                      <label>{_('newSrNfsOptions')}</label>
                      <input
                        className='form-control'
                        onChange={this.linkState('nfsOptions')}
                        type='text'
                        value={this.state.nfsOptions}
                      />
                    </fieldset>,
                  ]}
                  {type === 'hba' && (
                    <fieldset>
                      <label>{_('newSrLun')}</label>
                      <div>
                        {!isEmpty(hbaDevices) ? (
                          <SelectScsiId options={hbaDevices} onChange={this._handleSrHbaSelection} />
                        ) : (
                          <em>{_('newSrNoHba')}</em>
                        )}
                      </div>
                    </fieldset>
                  )}
                  {paths && (
                    <fieldset>
                      <label htmlFor='selectSrPath'>{_('newSrPath')}</label>
                      <select
                        className='form-control'
                        defaultValue={null}
                        id='selectSrPath'
                        onChange={event => {
                          this._handleSrPathSelection(event.target.value)
                        }}
                        ref='path'
                        required
                      >
                        <option value={null}>{formatMessage(messages.noSelectedValue)}</option>
                        {map(paths, (item, key) => (
                          <option key={key} value={item.path}>
                            {item.path}
                          </option>
                        ))}
                      </select>
                    </fieldset>
                  )}
                  {type === 'iscsi' && (
                    <fieldset>
                      <label htmlFor='srServer'>
                        {_('newSrServer')} ({_('newSrAuth')}
                        <input
                          type='checkbox'
                          ref='auth'
                          onChange={event => {
                            this._handleAuthChoice()
                          }}
                        />
                        )
                      </label>
                      <div className='form-inline'>
                        <input
                          id='srServer'
                          className='form-control'
                          placeholder={formatMessage(messages.newSrIscsiAddressPlaceHolder)}
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
                      {auth && (
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
                      )}
                    </fieldset>
                  )}
                  {iqns && (
                    <fieldset>
                      <label>{_('newSrIqn')}</label>
                      <SelectIqn options={iqns} onChange={this._handleSrIqnSelection} />
                    </fieldset>
                  )}
                  {luns && (
                    <fieldset>
                      <label>{_('newSrLun')}</label>
                      <SelectLun options={luns} onChange={this._handleSrLunSelection} />
                    </fieldset>
                  )}
                  {type === 'smb' && (
                    <fieldset>
                      <label htmlFor='srServer'>{_('newSrServer')}</label>
                      <input
                        id='srServer'
                        className='form-control'
                        placeholder={formatMessage(messages.newSrSmbAddressPlaceHolder)}
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
                  )}
                  {(type === 'lvm' || type === 'ext') && (
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
                  )}
                  {type === 'local' && (
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
                  )}
                  {type === 'zfs' && (
                    <fieldset>
                      <label htmlFor='selectSrLocation'>{_('srLocation')}</label>
                      <select className='form-control' defaultValue='' id='selectSrLocation' ref='zfsLocation' required>
                        <option value=''>
                          {isEmpty(zfsPools)
                            ? formatMessage(messages.noSharedZfsAvailable)
                            : formatMessage(messages.noSelectedValue)}
                        </option>
                        {map(zfsPools, (pool, poolName) => (
                          <option key={poolName} value={pool.mountpoint}>
                            {poolName} - {pool.mountpoint}
                          </option>
                        ))}
                      </select>
                    </fieldset>
                  )}
                </fieldset>
              )}
              {loading !== 0 && <Icon icon='loading' />}
            </Section>
            <Section icon='shown' title='newSrUsage'>
              {usage && (
                <div>
                  {map(unused, (sr, key) => (
                    <p key={key}>
                      {sr.uuid}
                      <span className='pull-right'>
                        <ActionButton
                          btnStyle='primary'
                          handler={this._reattach}
                          handlerParam={sr.uuid}
                          icon='connect'
                          tooltip={_('reattachNewSrTooltip')}
                        />
                      </span>
                    </p>
                  ))}
                  {map(used, (sr, key) => (
                    <p key={key}>
                      {sr.uuid}
                      <span className='pull-right'>
                        {/* FIXME Goes to sr view */}
                        <a className='btn btn-warning'>{_('newSrInUse')}</a>
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </Section>
            <Section icon='summary' title='newSrSummary'>
              {summary && (
                <div>
                  <dl className='dl-horizontal'>
                    <dt>{_('newSrName')}</dt>
                    <dd>{this.refs.name && this.refs.name.value}</dd>
                    <dt>{_('newSrDescription')}</dt>
                    <dd>{this.refs.description && this.refs.description.value}</dd>
                    <dt>{_('newSrType')}</dt>
                    <dd>{type}</dd>
                  </dl>
                  {type === 'iscsi' && (
                    <dl className='dl-horizontal'>
                      <dt>{_('newSrSize')}</dt>
                      <dd>{lun.size !== undefined ? formatSize(+lun.size) : _('unknownSize')}</dd>
                    </dl>
                  )}
                  {includes(['nfs', 'hba'], type) && (
                    <dl className='dl-horizontal'>
                      <dt>{_('newSrPath')}</dt>
                      <dd>{path}</dd>
                    </dl>
                  )}
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
              )}
            </Section>
          </Wizard>
        </form>
      </Page>
    )
  }
}
