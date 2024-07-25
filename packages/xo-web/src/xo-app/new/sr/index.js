import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
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
import { Sr } from 'render-xo-item'
import { createCollectionWrapper, createFilter, createGetObjectsOfType, createSelector, getObject } from 'selectors'
import {
  createSrExt,
  createSrIso,
  createSrIscsi,
  createSrLvm,
  createSrNfs,
  createSrHba,
  createSrSmb,
  createSrZfs,
  probeSrIscsiExists,
  probeSrIscsiIqns,
  probeSrIscsiLuns,
  probeSrNfs,
  probeSrNfsExists,
  probeSrHba,
  probeSrHbaExists,
  probeZfs,
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
      map(options, ({ id, path, scsiId, size, vendor, lun }) => ({
        label: `${vendor} ${id}: ${scsiId} - LUN: ${lun} - ${path} (${formatSize(size)})`,
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
  smbiso: 'SMB ISO',
  zfs: 'ZFS (local)',
}

const SR_GROUP_TO_LABEL = {
  vdisr: 'VDI SR',
  isosr: 'ISO SR',
}

const SR_TYPE_REQUIRE_DISK_FORMATTING = ['ext', 'lvm']

const typeGroups = {
  vdisr: ['ext', 'hba', 'iscsi', 'lvm', 'nfs', 'smb', 'zfs'],
  isosr: ['local', 'nfsiso', 'smbiso'],
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
      existingSrs: undefined,
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
      usage: undefined,
      zfsPools: undefined,
    }
  }

  getHostSrs = createFilter(
    () => this.props.srs,
    createSelector(
      () => this.state.host,
      host => host !== undefined && (sr => sr.$container === host.$pool || sr.$container === host.id)
    )
  )

  getUsedSrs = createCollectionWrapper(
    createSelector(
      this.getHostSrs,
      () => this.state.existingSrs,
      (hostSrs, existingSrs) => {
        if (existingSrs === undefined) {
          return []
        }

        const usedSrs = []
        existingSrs.forEach(({ uuid }) => {
          if (uuid in hostSrs) {
            usedSrs.push(hostSrs[uuid])
          }
        })

        return usedSrs
      }
    )
  )

  getUnusedSrs = createFilter(
    () => this.state.existingSrs,
    createSelector(this.getUsedSrs, usedSrs => existingSr => !usedSrs.some(sr => sr.uuid === existingSr.uuid))
  )

  _handleSubmit = async srUuid => {
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
          nfsOptions,
          srUuid
        ),
      smb: () => createSrSmb(host.id, name.value, description.value, server.value, username.value, password.value),
      hba: async () => {
        if (srUuid === undefined) {
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
        }
        return createSrHba(host.id, name.value, description.value, scsiId, srUuid)
      },
      iscsi: async () => {
        if (srUuid === undefined) {
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
          password && password.value,
          srUuid
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
          password && password.value,
          nfsVersion !== '' ? nfsVersion : undefined,
          nfsOptions,
          srUuid
        ),
      smbiso: () =>
        createSrIso(
          host.id,
          name.value,
          description.value,
          server.value,
          'smb',
          username && username.value,
          password && password.value,
          undefined,
          undefined,
          srUuid
        ),
    }

    try {
      if (SR_TYPE_REQUIRE_DISK_FORMATTING.includes(type)) {
        await confirm({
          title: _('newSr'),
          body: <p>{_('newSrConfirm', { name: device.value })}</p>,
        })
      }
      const existingSrsLength = this.state.existingSrs?.length ?? 0
      // `existingsSrs` is defined if the SR type is `NFS` or `ISCSI` and if at least one SR is detected
      // Ignore NFS type because it is not supposed to erase data
      if (type !== 'nfs' && existingSrsLength !== 0 && srUuid === undefined) {
        await confirm({
          title: _('newSr'),
          body: _('newSrExistingSr', { path: <b>{this.state.path}</b>, n: existingSrsLength }),
          strongConfirm: {
            messageId: 'newSrTitle',
          },
        })
      }
      return await createMethodFactories[type]()
    } catch (err) {
      if (err === undefined) {
        return
      }
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
      existingSrs: undefined,
      hbaDevices: undefined,
      iqns: undefined,
      paths: undefined,
      summary: includes(['ext', 'lvm', 'local', 'smb', 'smbiso', 'hba', 'zfs'], type),
      type,
      usage: undefined,
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
      this.setState({
        existingSrs: list,
        lun,
        usage: true,
        summary: true,
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

    const { host, nfsVersion, type } = this.state

    try {
      if (type === 'nfs' || type === 'nfsiso') {
        const paths = await probeSrNfs(host.id, server.value, nfsVersion !== '' ? nfsVersion : undefined)
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
    const { host, nfsVersion } = this.state

    try {
      this.setState(({ loading }) => ({ loading: loading + 1 }))
      this.setState({
        existingSrs: await probeSrNfsExists(host.id, server.value, path, nfsVersion !== '' ? nfsVersion : undefined),
        path,
        usage: true,
        summary: true,
      })
    } catch (err) {
      this.setState({ summary: false, usage: false })
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
      nfsSubdir,
      path,
      paths,
      selectedMainPath,
      summary,
      type,
      usage,
      zfsPools,
    } = this.state
    const { formatMessage } = this.props.intl

    const used = this.getUsedSrs()
    const unused = this.getUnusedSrs()

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
                    <fieldset key='nfsServer'>
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
                    <fieldset key='nfsVersion'>
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
                    <fieldset key='nfsOptions'>
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
                        defaultValue=''
                        id='selectSrPath'
                        onChange={event => {
                          const selectedPath = event.target.value
                          this.setState({ selectedMainPath: selectedPath })
                          this._handleSrPathSelection(selectedPath)
                        }}
                        ref='path'
                        required
                      >
                        <option disabled value=''>
                          {formatMessage(messages.noSelectedValue)}
                        </option>
                        {map(paths, (item, key) => (
                          <option key={key} value={item.path}>
                            {item.path}
                          </option>
                        ))}
                      </select>
                      {(type === 'nfs' || type === 'nfsiso') && selectedMainPath !== undefined && (
                        <div>
                          <label htmlFor='nfsSubdirectory'>{_('subdirectory')}</label>
                          <div className='input-group'>
                            <span className='input-group-addon'>/</span>
                            <input
                              className='form-control'
                              id='nfsSubdirectory'
                              type='text'
                              onChange={this.linkState('nfsSubdir')}
                            />
                            <span className='input-group-btn'>
                              <ActionButton
                                icon='search'
                                handler={() => {
                                  this._handleSrPathSelection(selectedMainPath.concat('/' + (nfsSubdir?.trim() ?? '')))
                                }}
                              />
                            </span>
                          </div>
                        </div>
                      )}
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
                  {(type === 'smb' || type === 'smbiso') && (
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
                        type='text'
                      />
                      <label>{_('newSrPassword')}</label>
                      <Password placeholder={formatMessage(messages.newSrPasswordPlaceHolder)} ref='password' />
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
                  {map(unused, sr => (
                    <p key={sr.uuid}>
                      {sr.uuid}
                      <span className='pull-right'>
                        <ActionButton
                          btnStyle='primary'
                          handler={this._handleSubmit}
                          handlerParam={sr.uuid}
                          icon='connect'
                          tooltip={_('reattachNewSrTooltip')}
                        />
                      </span>
                    </p>
                  ))}
                  {map(used, sr => (
                    <p key={sr.id}>
                      <Sr id={sr.id} link />
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
