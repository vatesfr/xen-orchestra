import _, { messages } from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import Tooltip from 'tooltip'
import { addSubscriptions, resolveId } from 'utils'
import { alert, confirm } from 'modal'
import { createRemote, editRemote, subscribeRemotes } from 'xo'
import { error } from 'notification'
import { format } from 'xo-remote-parser'
import { generateId, linkState } from 'reaclette-utils'
import { injectState, provideState } from 'reaclette'
import { map, some, trimStart } from 'lodash'
import { Password, Number, Toggle } from 'form'
import { SelectProxy } from 'select-objects'

const remoteTypes = {
  file: 'remoteTypeLocal',
  nfs: 'remoteTypeNfs',
  smb: 'remoteTypeSmb',
  s3: 'remoteTypeS3',
}

export default decorate([
  addSubscriptions({
    remotes: subscribeRemotes,
  }),
  provideState({
    initialState: () => ({
      domain: undefined,
      host: undefined,
      name: undefined,
      options: undefined,
      password: undefined,
      path: undefined,
      port: undefined,
      proxyId: undefined,
      type: undefined,
      username: undefined,
      directory: undefined,
      bucket: undefined,
      protocol: undefined,
      region: undefined,
      allowUnauthorized: undefined,
      useVhdDirectory: undefined,
      encryptionKey: undefined,
    }),
    effects: {
      linkState,
      setPort: (_, port) => state => ({
        port: port === undefined && state.remote !== undefined ? '' : port,
      }),
      setProxy(_, proxy) {
        this.state.proxyId = resolveId(proxy)
      },
      editRemote:
        ({ reset }) =>
        state => {
          const {
            remote,
            domain = remote.domain || '',
            host = remote.host,
            name,
            options = remote.options || '',
            password = remote.password,
            port = remote.port,
            proxyId = remote.proxy,
            type = remote.type,
            username = remote.username,
            protocol = remote.protocol || 'https',
            region = remote.region,
            encryptionKey = remote.encryptionKey,
          } = state

          let {
            path = remote.path,
            useVhdDirectory = remote.useVhdDirectory,
            allowUnauthorized = remote.allowUnauthorized,
          } = state

          // making it undefined if falsish won't save it in the remote url
          allowUnauthorized = allowUnauthorized ? true : undefined
          useVhdDirectory = useVhdDirectory ? true : undefined
          if (type === 's3') {
            const { parsedPath, bucket = parsedPath.split('/')[0], directory = parsedPath.split('/')[1] } = state
            path = bucket + '/' + directory
            useVhdDirectory = true // always on for s3
          }
          return editRemote(remote, {
            name,
            url: format({
              domain,
              host,
              password,
              path,
              port: port || undefined,
              type,
              username,
              protocol,
              region,
              allowUnauthorized,
              useVhdDirectory,
              encryptionKey: encryptionKey?.trim() !== '' ? encryptionKey : undefined,
            }),
            options: options !== '' ? options : null,
            proxy: proxyId,
          }).then(reset)
        },
      createRemote:
        ({ reset }) =>
        async (state, { remotes }) => {
          if (some(remotes, { name: state.name })) {
            return alert(
              <span>
                <Icon icon='error' /> {_('remoteTestName')}
              </span>,
              <p>{_('remoteTestNameFailure')}</p>
            )
          }

          const {
            domain = 'WORKGROUP',
            host,
            name,
            options,
            password,
            path,
            port,
            proxyId,
            type = 'nfs',
            username,
            useVhdDirectory = undefined,
            encryptionKey = '',
          } = state

          const urlParams = {
            host,
            path,
            port,
            type,
            useVhdDirectory,
            encryptionKey: encryptionKey.trim() !== '' ? encryptionKey : undefined,
          }
          if (type === 's3') {
            const { allowUnauthorized, bucket, directory, protocol = 'https', region } = state
            urlParams.path = bucket + '/' + directory
            urlParams.allowUnauthorized = allowUnauthorized
            urlParams.protocol = protocol
            urlParams.useVhdDirectory = true // always on for s3
            urlParams.region = region
          }
          username && (urlParams.username = username)
          password && (urlParams.password = password)
          domain && (urlParams.domain = domain)

          if (type === 'file') {
            await confirm({
              title: _('localRemoteWarningTitle'),
              body: _('localRemoteWarningMessage'),
            })
          }

          const url = format(urlParams)
          return createRemote(name, url, options !== '' ? options : undefined, proxyId === null ? undefined : proxyId)
            .then(reset)
            .catch(err => error('Create Remote', err.message || String(err)))
        },
      setSecretKey(_, { target: { value } }) {
        this.state.password = value
      },
      setInsecure(_, value) {
        this.state.protocol = value ? 'https' : 'http'
      },
      setAllowUnauthorized(_, value) {
        this.state.allowUnauthorized = value
      },
      setUseVhdDirectory(_, value) {
        this.state.useVhdDirectory = value
      },
    },
    computed: {
      formId: generateId,
      inputTypeId: generateId,
      parsedPath: ({ remote }) => remote && trimStart(remote.path, '/'),
    },
  }),
  injectState,
  ({ state, effects, formatMessage }) => {
    const {
      remote = {},
      domain = remote.domain || 'WORKGROUP',
      host = remote.host || '',
      name = remote.name || '',
      options = remote.options || '',
      password = remote.password || '',
      protocol = remote.protocol || 'https',
      region = remote.region || '',
      parsedPath,
      path = parsedPath || '',
      parsedBucket = parsedPath != null && parsedPath.split('/')[0],
      bucket = parsedBucket || '',
      parsedDirectory = parsedPath != null && parsedPath.split('/')[1],
      directory = parsedDirectory || '',
      port = remote.port,
      proxyId = remote.proxy,
      type = remote.type || 'nfs',
      username = remote.username || '',
      allowUnauthorized = remote.allowUnauthorized || false,
      useVhdDirectory = remote.useVhdDirectory || type === 's3',
      encryptionKey = remote.encryptionKey || '',
    } = state

    const isEncrypted = encryptionKey.trim() !== ''

    return (
      <div>
        <h2>{_('newRemote')}</h2>
        <form id={state.formId}>
          <div className='form-group'>
            <label htmlFor={state.inputTypeId}>{_('remoteType')}</label>
            <select
              className='form-control'
              id={state.inputTypeId}
              name='type'
              onChange={effects.linkState}
              required
              value={type}
            >
              {map(remoteTypes, (label, key) => _({ key }, label, message => <option value={key}>{message}</option>))}
            </select>
            {type === 'smb' && <em className='text-warning'>{_('remoteSmbWarningMessage')}</em>}
          </div>
          <div className='form-group'>
            <input
              className='form-control'
              name='name'
              onChange={effects.linkState}
              placeholder={formatMessage(messages.remoteMyNamePlaceHolder)}
              required
              type='text'
              value={name}
            />
          </div>
          <div className='form-group'>
            <SelectProxy onChange={effects.setProxy} value={proxyId} />
          </div>
          {type === 'file' && (
            <fieldset className='form-group'>
              <div className='input-group'>
                <span className='input-group-addon'>/</span>
                <input
                  className='form-control'
                  name='path'
                  onChange={effects.linkState}
                  pattern='^(([^/]+)+(/[^/]+)*)?$'
                  placeholder={formatMessage(messages.remoteLocalPlaceHolderPath)}
                  required
                  type='text'
                  value={path}
                />
              </div>
            </fieldset>
          )}
          {type === 'nfs' && (
            <fieldset>
              <div className='form-group'>
                <input
                  className='form-control'
                  name='host'
                  onChange={effects.linkState}
                  placeholder={formatMessage(messages.remoteNfsPlaceHolderHost)}
                  required
                  type='text'
                  value={host}
                />
                <br />
                <Number
                  onChange={effects.setPort}
                  placeholder={formatMessage(messages.remoteNfsPlaceHolderPort)}
                  value={port}
                />
              </div>
              <div className='input-group form-group'>
                <span className='input-group-addon'>/</span>
                <input
                  className='form-control'
                  name='path'
                  onChange={effects.linkState}
                  pattern='^(([^/]+)+(/[^/]+)*)?$'
                  placeholder={formatMessage(messages.remoteNfsPlaceHolderPath)}
                  required
                  type='text'
                  value={path}
                />
              </div>
              <div className='input-group form-group'>
                <span className='input-group-addon'>-o</span>
                <input
                  className='form-control'
                  name='options'
                  onChange={effects.linkState}
                  placeholder={formatMessage(messages.remoteNfsPlaceHolderOptions)}
                  type='text'
                  value={options}
                />
              </div>
            </fieldset>
          )}
          {type === 'smb' && (
            <fieldset>
              <div className='input-group form-group'>
                <span className='input-group-addon'>\\</span>
                <input
                  className='form-control'
                  name='host'
                  onChange={effects.linkState}
                  pattern='^[^\\/]+\\[^\\/]+$'
                  placeholder={formatMessage(messages.remoteSmbPlaceHolderAddressShare)}
                  required
                  type='text'
                  value={host}
                />
                <span className='input-group-addon'>\</span>
                <input
                  className='form-control'
                  name='path'
                  onChange={effects.linkState}
                  pattern='^([^\\/]+(\\[^\\/]+)*)?$'
                  placeholder={formatMessage(messages.remoteSmbPlaceHolderRemotePath)}
                  type='text'
                  value={path}
                />
              </div>
              <div className='form-group'>
                <input
                  className='form-control'
                  name='username'
                  onChange={effects.linkState}
                  placeholder={formatMessage(messages.remoteSmbPlaceHolderUsername)}
                  required
                  type='text'
                  value={username}
                />
              </div>
              <div className='form-group'>
                <Password
                  name='password'
                  onChange={effects.linkState}
                  placeholder={formatMessage(messages.remoteSmbPlaceHolderPassword)}
                  required
                  value={password}
                />
              </div>
              <div className='form-group'>
                <input
                  className='form-control'
                  onChange={effects.linkState}
                  name='domain'
                  placeholder={formatMessage(messages.remoteSmbPlaceHolderDomain)}
                  required
                  type='text'
                  value={domain}
                />
              </div>
              <div className='input-group form-group'>
                <span className='input-group-addon'>-o</span>
                <input
                  className='form-control'
                  name='options'
                  onChange={effects.linkState}
                  placeholder={formatMessage(messages.remoteSmbPlaceHolderOptions)}
                  type='text'
                  value={options}
                />
              </div>
            </fieldset>
          )}
          {type === 's3' && (
            <fieldset className='form-group form-group'>
              <div className='input-group form-group'>
                <span className='align-middle'>
                  {_('remoteS3LabelUseHttps')}{' '}
                  <Tooltip content={_('remoteS3TooltipProtocol')}>
                    <Icon icon='info' size='lg' />
                  </Tooltip>
                </span>
                <Toggle
                  className='align-middle pull-right'
                  onChange={effects.setInsecure}
                  value={protocol === 'https'}
                />
              </div>

              <div className='input-group form-group'>
                <span className='align-middle '>
                  {_('remoteS3LabelAllowInsecure')}{' '}
                  <Tooltip content={_('remoteS3TooltipAcceptInsecure')}>
                    <Icon icon='info' size='lg' />
                  </Tooltip>
                </span>
                <Toggle
                  className='align-middle pull-right'
                  disabled={protocol !== 'https'}
                  onChange={effects.setAllowUnauthorized}
                  value={allowUnauthorized}
                />
              </div>

              <div className='input-group form-group'>
                <input
                  className='form-control'
                  name='host'
                  onChange={effects.linkState}
                  // pattern='^[^\\/]+\\[^\\/]+$'
                  placeholder={formatMessage(messages.remoteS3PlaceHolderEndpoint)}
                  required
                  type='text'
                  value={host}
                />
              </div>
              <div className='input-group form-group'>
                <input
                  className='form-control'
                  name='region'
                  onChange={effects.linkState}
                  pattern='[a-z0-9-]+'
                  placeholder={formatMessage(messages.remoteS3Region)}
                  type='text'
                  value={region}
                />
              </div>
              <div className='input-group form-group'>
                <input
                  className='form-control'
                  name='bucket'
                  onChange={effects.linkState}
                  placeholder={formatMessage(messages.remoteS3PlaceHolderBucket)}
                  required
                  type='text'
                  value={bucket}
                />
              </div>
              <div className='input-group form-group'>
                <input
                  className='form-control'
                  name='directory'
                  onChange={effects.linkState}
                  pattern='^(([^/]+)+(/[^/]+)*)?$'
                  placeholder={formatMessage(messages.remoteS3PlaceHolderDirectory)}
                  required
                  type='text'
                  value={directory}
                />
              </div>
              <div className='input-group form-group'>
                <input
                  className='form-control'
                  name='username'
                  onChange={effects.linkState}
                  placeholder={formatMessage(messages.remoteS3PlaceHolderAccessKeyID)}
                  required
                  type='text'
                  value={username}
                />
              </div>
              <div className='input-group form-group'>
                <input
                  className='form-control'
                  name='password'
                  onChange={effects.setSecretKey}
                  placeholder={formatMessage(messages.remoteS3PlaceHolderSecret)}
                  autoComplete='off'
                  type='text'
                />
              </div>
            </fieldset>
          )}
          <div className='form-group'>
            <label>{_('remoteEncryptionKey')}</label>
            {isEncrypted && !useVhdDirectory && (
              <p className='text-warning'>
                <Icon icon='alarm' /> {_('remoteEncryptionMustUseVhd')}
              </p>
            )}
            <ul className='small'>
              <li>{_('remoteEncryptionEncryptedFiles')}</li>
              <li>{_('remoteEncryptionKeyStorageLocation')}</li>
              <li>{_('remoteEncryptionBackupSize')}</li>
            </ul>
            <input
              autoComplete='new-password'
              className='form-control'
              name='encryptionKey'
              placeholder={formatMessage(messages.remoteS3PlaceHolderEncryptionKey)}
              onChange={effects.linkState}
              pattern='^.{32}$'
              type='password'
              value={encryptionKey}
            />
          </div>
          {type !== 's3' && (
            <fieldset className='form-group form-group'>
              <div className='input-group form-group'>
                <span className='align-middle'>
                  {_('remoteUseVhdDirectory')}{' '}
                  <Tooltip content={_('remoteUseVhdDirectoryTooltip')}>
                    <Icon icon='info' size='lg' />
                  </Tooltip>
                </span>
                <Toggle
                  className='align-middle pull-right'
                  onChange={effects.setUseVhdDirectory}
                  value={useVhdDirectory === true}
                />
              </div>
            </fieldset>
          )}
          <div className='form-group'>
            <ActionButton
              btnStyle='primary'
              form={state.formId}
              handler={state.remote === undefined ? effects.createRemote : effects.editRemote}
              icon='save'
              type='submit'
            >
              {_('savePluginConfiguration')}
            </ActionButton>
            <ActionButton className='pull-right' handler={effects.reset} icon='reset' type='reset'>
              {_('formReset')}
            </ActionButton>
          </div>
        </form>
      </div>
    )
  },
])
