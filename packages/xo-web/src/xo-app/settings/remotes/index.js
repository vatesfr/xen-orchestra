import _, { messages } from 'intl'
import ActionButton from 'action-button'
import defined from 'xo-defined'
import Icon from 'icon'
import React from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import Tooltip from 'tooltip'
import { addSubscriptions, generateRandomId } from 'utils'
import { alert, confirm } from 'modal'
import { error } from 'notification'
import { format, parse } from 'xo-remote-parser'
import { groupBy, isEmpty, map, some } from 'lodash'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from '@julien-f/freactal'
import { Number as InputNumber } from 'form'
import { Number, Password, Text } from 'editable'
import {
  createRemote,
  deleteRemote,
  deleteRemotes,
  disableRemote,
  editRemote,
  enableRemote,
  subscribeRemotes,
  testRemote,
} from 'xo'

// ===================================================================

const remoteTypes = {
  file: 'remoteTypeLocal',
  nfs: 'remoteTypeNfs',
  smb: 'remoteTypeSmb',
}

const _changeUrlElement = (value, { remote, element }) =>
  editRemote(remote, {
    url: format({ ...remote, [element]: value === null ? undefined : value }),
  })

// ===================================================================

const GROUPED_ACTIONS = [
  {
    handler: deleteRemotes,
    icon: 'delete',
    label: _('remoteDeleteSelected'),
    level: 'danger',
  },
]

const INDIVIDUAL_ACTIONS = [
  {
    disabled: remote => !remote.enabled,
    handler: remote =>
      testRemote(remote).then(
        answer =>
          answer.success
            ? alert(
                <span>
                  <Icon icon='success' />{' '}
                  {_('remoteTestSuccess', { name: remote.name })}
                </span>,
                _('remoteTestSuccessMessage')
              )
            : alert(
                <span>
                  <Icon icon='error' />{' '}
                  {_('remoteTestFailure', { name: remote.name })}
                </span>,
                <p>
                  <dl className='dl-horizontal'>
                    <dt>{_('remoteTestError')}</dt>
                    <dd>{answer.error}</dd>
                    <dt>{_('remoteTestStep')}</dt>
                    <dd>{answer.step}</dd>
                  </dl>
                </p>
              )
      ),
    icon: 'diagnosis',
    label: _('remoteTestTip'),
    level: 'primary',
  },
  {
    handler: (remote, { editRemote }) => editRemote(remote),
    icon: 'edit',
    label: _('formEdit'),
    level: 'primary',
  },
  {
    handler: deleteRemote,
    icon: 'delete',
    label: _('remoteDeleteTip'),
    level: 'danger',
  },
]

const FILTERS = {
  filterRemotesOnlyConnected: 'enabled?',
  filterRemotesOnlyDisconnected: '!enabled?',
}

const _editRemote = (name, { remote }) => editRemote(remote, { name })
const COLUMN_NAME = {
  itemRenderer: (remote, { formatMessage }) => (
    <Text
      data-remote={remote}
      onChange={_editRemote}
      placeholder={formatMessage(messages.remoteMyNamePlaceHolder)}
      value={remote.name}
    />
  ),
  name: _('remoteName'),
  sortCriteria: 'name',
}

const _showError = remote => alert(_('remoteConnectionFailed'), remote.error)
const COLUMN_STATE = {
  itemRenderer: remote => (
    <div>
      <StateButton
        disabledHandler={enableRemote}
        disabledLabel={_('remoteDisconnected')}
        disabledTooltip={_('remoteConnectTip')}
        enabledHandler={disableRemote}
        enabledLabel={_('remoteConnected')}
        enabledTooltip={_('remoteDisconnectTip')}
        handlerParam={remote}
        state={remote.enabled}
      />{' '}
      {remote.error && (
        <Tooltip content={_('remoteConnectionFailed')}>
          <a
            className='text-danger btn btn-link'
            onClick={() => _showError(remote)}
            style={{ padding: '0px' }}
          >
            <Icon icon='alarm' size='lg' />
          </a>
        </Tooltip>
      )}
    </div>
  ),
  name: _('remoteState'),
}

const COLUMNS_LOCAL_REMOTE = [
  COLUMN_NAME,
  {
    itemRenderer: (remote, { formatMessage }) => (
      <Text
        data-element='path'
        data-remote={remote}
        onChange={_changeUrlElement}
        placeholder={formatMessage(messages.remoteLocalPlaceHolderPath)}
        value={remote.path}
      />
    ),
    name: _('remotePath'),
  },
  COLUMN_STATE,
]

const COLUMNS_NFS_REMOTE = [
  COLUMN_NAME,
  {
    itemRenderer: (remote, { formatMessage }) => (
      <span>
        <strong className='text-info'>\\</strong>
        <Text
          data-element='host'
          data-remote={remote}
          onChange={_changeUrlElement}
          placeholder={formatMessage(messages.remoteNfsPlaceHolderHost)}
          value={remote.host}
        />
        :
        <Number
          data-element='port'
          data-remote={remote}
          nullable
          onChange={_changeUrlElement}
          placeholder={formatMessage(messages.remoteNfsPlaceHolderPort)}
          value={remote.port || ''}
        />
        :
        <Text
          data-element='path'
          data-remote={remote}
          onChange={_changeUrlElement}
          placeholder={formatMessage(messages.remoteNfsPlaceHolderPath)}
          value={remote.path}
        />
      </span>
    ),
    name: _('remoteDevice'),
  },
  COLUMN_STATE,
]

const COLUMNS_SMB_REMOTE = [
  COLUMN_NAME,
  {
    itemRenderer: (remote, { formatMessage }) => (
      <span>
        <strong className='text-info'>\\</strong>
        <Text
          data-element='host'
          data-remote={remote}
          onChange={_changeUrlElement}
          value={remote.host}
        />
        <strong className='text-info'>\</strong>
        <span>
          <Text
            data-element='path'
            data-remote={remote}
            onChange={_changeUrlElement}
            placeholder={formatMessage(messages.remoteSmbPlaceHolderRemotePath)}
            value={remote.path}
          />
        </span>
      </span>
    ),
    name: _('remoteShare'),
  },
  COLUMN_STATE,
  {
    itemRenderer: (remote, { formatMessage }) => (
      <span>
        <Text
          data-element='username'
          data-remote={remote}
          onChange={_changeUrlElement}
          value={remote.username}
        />
        :
        <Password
          data-element='password'
          data-remote={remote}
          onChange={_changeUrlElement}
          placeholder={formatMessage(messages.remotePlaceHolderPassword)}
          value=''
        />
        @
        <Text
          data-element='domain'
          data-remote={remote}
          onChange={_changeUrlElement}
          value={remote.domain}
        />
      </span>
    ),
    name: _('remoteAuth'),
  },
]

// ===================================================================

const getInitialState = () => ({
  domain: undefined,
  formId: generateRandomId(),
  host: undefined,
  name: undefined,
  password: undefined,
  path: undefined,
  port: undefined,
  remote: undefined,
  type: undefined,
  typeInputId: generateRandomId(),
  username: undefined,
})

export default [
  injectIntl,
  addSubscriptions({
    remotes: cb =>
      subscribeRemotes(remotes => {
        cb(
          groupBy(
            map(remotes, remote => {
              try {
                return {
                  ...remote,
                  ...parse(remote.url),
                }
              } catch (err) {
                console.error('Remote parsing error:', remote, '\n', err)
              }
            }).filter(r => r !== undefined),
            'type'
          )
        )
      }),
  }),
  provideState({
    initialState: getInitialState,
    effects: {
      setInputValue: (_, { target: { value, name } }) => () => ({
        [name]: value,
      }),
      setPort: (_, port) => () => ({
        port,
      }),
      reset: () => getInitialState,
      editRemote: ({ reset }, remote) => () => {
        reset()
        return {
          remote,
        }
      },
      saveRemote: ({ reset }) => async (
        {
          computedDomain: domain,
          computedHost: host,
          computedName: name,
          computedPassword: password,
          computedPath: path,
          computedPort: port,
          computedType: type,
          computedUsername: username,
          remote,
        },
        { remotes }
      ) => {
        if (remote === undefined) {
          if (some(remotes, values => some(values, { name: name }))) {
            alert(
              <span>
                <Icon icon='error' /> {_('remoteTestName')}
              </span>,
              <p>{_('remoteTestNameFailure')}</p>
            )
            return
          }

          if (type === 'file') {
            await confirm({
              title: _('localRemoteWarningTitle'),
              body: _('localRemoteWarningMessage'),
            })
          }
        }

        const urlParams = {
          path,
          type,
        }

        if (type === 'nfs') {
          urlParams.host = host
          urlParams.port = port
        } else if (type === 'smb') {
          urlParams.host = host
          username && (urlParams.username = username)
          password && (urlParams.password = password)
          domain && (urlParams.domain = domain)
        }
        const url = format(urlParams)

        if (remote === undefined) {
          await createRemote(name, url).catch(err =>
            error('Create Remote', err.message || String(err))
          )
        } else {
          await editRemote(remote, { name, url })
        }

        reset()
      },
    },
    computed: {
      computedType: state =>
        defined(state.type, () => state.remote.type, 'nfs'),
      computedName: state => defined(state.name, () => state.remote.name, ''),
      computedPath: state =>
        defined(state.path, () => state.remote.path.replace('/', ''), ''),
      computedHost: state => defined(state.host, () => state.remote.host, ''),
      computedPort: state => defined(state.port, () => state.remote.port),
      computedUsername: state =>
        defined(state.username, () => state.remote.username, ''),
      computedPassword: state =>
        defined(state.password, () => state.remote.password, ''),
      computedDomain: state =>
        defined(state.domain, () => state.remote.domain, ''),
    },
  }),
  injectState,
  ({ state, effects, remotes = {}, intl: { formatMessage } }) => (
    <div>
      {!isEmpty(remotes.file) && (
        <SortedTable
          collection={remotes.file}
          columns={COLUMNS_LOCAL_REMOTE}
          data-editRemote={effects.editRemote}
          data-formatMessage={formatMessage}
          filters={FILTERS}
          groupedActions={GROUPED_ACTIONS}
          individualActions={INDIVIDUAL_ACTIONS}
          stateUrlParam='l'
        />
      )}

      {!isEmpty(remotes.nfs) && (
        <div>
          <h2>{_('remoteTypeNfs')}</h2>
          <SortedTable
            collection={remotes.nfs}
            columns={COLUMNS_NFS_REMOTE}
            data-editRemote={effects.editRemote}
            data-formatMessage={formatMessage}
            filters={FILTERS}
            groupedActions={GROUPED_ACTIONS}
            individualActions={INDIVIDUAL_ACTIONS}
            stateUrlParam='nfs'
          />
        </div>
      )}

      {!isEmpty(remotes.smb) && (
        <div>
          <h2>{_('remoteTypeSmb')}</h2>
          <SortedTable
            collection={remotes.smb}
            columns={COLUMNS_SMB_REMOTE}
            data-editRemote={effects.editRemote}
            data-formatMessage={formatMessage}
            filters={FILTERS}
            groupedActions={GROUPED_ACTIONS}
            individualActions={INDIVIDUAL_ACTIONS}
            stateUrlParam='smb'
          />
        </div>
      )}

      <h2>{_('newRemote')}</h2>
      <form id={state.formId}>
        <div className='form-group'>
          <label htmlFor={state.typeInputId}>{_('remoteType')}</label>
          <select
            className='form-control'
            id={state.typeInputId}
            name='type'
            onChange={effects.setInputValue}
            required
            value={state.computedType}
          >
            {map(remoteTypes, (label, key) =>
              _({ key }, label, message => (
                <option value={key}>{message}</option>
              ))
            )}
          </select>
          {state.computedType === 'smb' && (
            <em className='text-warning'>{_('remoteSmbWarningMessage')}</em>
          )}
        </div>
        <div className='form-group'>
          <input
            className='form-control'
            name='name'
            onChange={effects.setInputValue}
            placeholder={formatMessage(messages.remoteMyNamePlaceHolder)}
            required
            type='text'
            value={state.computedName}
          />
        </div>
        {state.computedType === 'file' && (
          <fieldset className='form-group'>
            <div className='input-group'>
              <span className='input-group-addon'>/</span>
              <input
                className='form-control'
                name='path'
                onChange={effects.setInputValue}
                pattern='^(([^/]+)+(/[^/]+)*)?$'
                placeholder={formatMessage(messages.remoteLocalPlaceHolderPath)}
                required
                type='text'
                value={state.computedPath}
              />
            </div>
          </fieldset>
        )}
        {state.computedType === 'nfs' && (
          <fieldset>
            <div className='form-group'>
              <input
                className='form-control'
                name='host'
                onChange={effects.setInputValue}
                placeholder={formatMessage(messages.remoteNfsPlaceHolderHost)}
                required
                type='text'
                value={state.computedHost}
              />
              <br />
              <InputNumber
                onChange={effects.setPort}
                placeholder={formatMessage(messages.remoteNfsPlaceHolderPort)}
                value={state.computedPort}
              />
            </div>
            <div className='input-group form-group'>
              <span className='input-group-addon'>/</span>
              <input
                className='form-control'
                name='path'
                onChange={effects.setInputValue}
                pattern='^(([^/]+)+(/[^/]+)*)?$'
                placeholder={formatMessage(messages.remoteNfsPlaceHolderPath)}
                required
                type='text'
                value={state.computedPath}
              />
            </div>
          </fieldset>
        )}
        {state.computedType === 'smb' && (
          <fieldset>
            <div className='input-group form-group'>
              <span className='input-group-addon'>\\</span>
              <input
                className='form-control'
                name='host'
                onChange={effects.setInputValue}
                pattern='^([^\\/]+)\\([^\\/]+)$'
                placeholder={formatMessage(
                  messages.remoteSmbPlaceHolderAddressShare
                )}
                required
                type='text'
                value={state.computedHost}
              />
              <span className='input-group-addon'>\</span>
              <input
                className='form-control'
                name='path'
                onChange={effects.setInputValue}
                pattern='^(([^\\/]+)+(\\[^\\/]+)*)?$'
                placeholder={formatMessage(
                  messages.remoteSmbPlaceHolderRemotePath
                )}
                required
                type='text'
                value={state.computedPath}
              />
            </div>
            <div className='form-group'>
              <input
                className='form-control'
                name='username'
                onChange={effects.setInputValue}
                placeholder={formatMessage(
                  messages.remoteSmbPlaceHolderUsername
                )}
                required
                type='text'
                value={state.computedUsername}
              />
            </div>
            <div className='form-group'>
              <input
                className='form-control'
                name='password'
                onChange={effects.setInputValue}
                placeholder={formatMessage(
                  messages.remoteSmbPlaceHolderPassword
                )}
                required
                type='text'
                value={state.computedPassword}
              />
            </div>
            <div className='form-group'>
              <input
                className='form-control'
                name='domain'
                onChange={effects.setInputValue}
                placeholder={formatMessage(messages.remoteSmbPlaceHolderDomain)}
                required
                type='text'
                value={state.computedDomain}
              />
            </div>
          </fieldset>
        )}
        <div className='form-group'>
          <ActionButton
            btnStyle='primary'
            form={state.formId}
            handler={effects.saveRemote}
            icon='save'
          >
            {_('savePluginConfiguration')}
          </ActionButton>
          <ActionButton
            className='pull-right'
            handler={effects.reset}
            icon='reset'
          >
            {_('formReset')}
          </ActionButton>
        </div>
      </form>
    </div>
  ),
].reduceRight((value, decorator) => decorator(value))
