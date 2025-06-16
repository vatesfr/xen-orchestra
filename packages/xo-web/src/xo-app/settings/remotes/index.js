import _, { messages } from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import SortedTable from 'sorted-table'
import StateButton from 'state-button'
import Tooltip from 'tooltip'
import { addSubscriptions, formatSize, formatSpeed, generateRandomId, noop } from 'utils'
import { alert } from 'modal'
import { format, parse } from 'xo-remote-parser'
import { get } from '@xen-orchestra/defined'
import { groupBy, map, isEmpty } from 'lodash'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { Number, Password, Text, XoSelect } from 'editable'
import { Proxy } from 'render-xo-item'

import {
  deleteRemote,
  deleteRemotes,
  disableRemote,
  editRemote,
  enableRemote,
  subscribeRemotes,
  subscribeRemotesInfo,
  testRemote,
} from 'xo'

import Remote from './remote'

const formatError = error => (typeof error === 'string' ? error : JSON.stringify(error, null, 2).replace(/\\n/g, '\n'))

const _changeUrlElement = (value, { remote, element }) =>
  editRemote(remote, {
    url: format({ ...parse(remote.url), [element]: value === null ? undefined : value }),
  })
const _showError = remote => alert(_('remoteConnectionFailed'), <pre>{formatError(remote.error)}</pre>)
const _editRemoteName = (name, { remote }) => editRemote(remote, { name })
const _editRemoteOptions = (options, { remote }) => editRemote(remote, { options: options !== '' ? options : null })

const COLUMN_NAME = {
  itemRenderer: (remote, { formatMessage }) => (
    <Text
      data-remote={remote}
      onChange={_editRemoteName}
      placeholder={formatMessage(messages.remoteMyNamePlaceHolder)}
      value={remote.name}
    />
  ),
  name: _('remoteName'),
  sortCriteria: 'name',
}
const COLUMN_STATE = {
  itemRenderer: remote => (
    <div>
      <StateButton
        disabledLabel={_('remoteDisabled')}
        disabledHandler={enableRemote}
        disabledTooltip={_('enableRemote')}
        enabledLabel={_('remoteEnabled')}
        enabledHandler={disableRemote}
        enabledTooltip={_('disableRemote')}
        handlerParam={remote}
        state={remote.enabled}
      />{' '}
      {remote.error && (
        <Tooltip content={_('remoteConnectionFailed')}>
          <a className='text-danger btn btn-link' onClick={() => _showError(remote)} style={{ padding: '0px' }}>
            <Icon icon='alarm' size='lg' />
          </a>
        </Tooltip>
      )}
    </div>
  ),
  name: _('remoteState'),
}
const COLUMN_DISK = {
  itemRenderer: remote =>
    remote.info !== undefined &&
    remote.info.used !== undefined &&
    remote.info.size !== undefined && (
      <span>{`${formatSize(remote.info.used)} / ${formatSize(remote.info.size)}`}</span>
    ),
  name: _('remoteDisk'),
}
const COLUMN_SPEED = {
  itemRenderer: remote => {
    const benchmark = get(() => remote.benchmarks[remote.benchmarks.length - 1])

    return (
      benchmark !== undefined &&
      benchmark.readRate !== undefined &&
      benchmark.writeRate !== undefined && (
        <span>{`${formatSpeed(benchmark.writeRate, 1e3)} / ${formatSpeed(benchmark.readRate, 1e3)}`}</span>
      )
    )
  },
  name: (
    <span>
      {_('remoteSpeed')}{' '}
      <Tooltip content={_('remoteSpeedInfo')}>
        <Icon icon='info' size='lg' />
      </Tooltip>
    </span>
  ),
}

const COLUMN_PROXY = {
  itemRenderer: remote => (
    <XoSelect onChange={proxy => editRemote(remote, { proxy })} value={remote.proxy} xoType='proxy'>
      {remote.proxy !== undefined ? (
        <div>
          <Proxy id={remote.proxy} />{' '}
          <a role='button' onClick={() => editRemote(remote, { proxy: null })}>
            <Icon icon='remove' />
          </a>
        </div>
      ) : (
        _('noValue')
      )}
    </XoSelect>
  ),
  name: _('proxy'),
}

const COLUMN_ENCRYPTION = {
  itemRenderer: remote => {
    // remote.info?.encryption undefined means that remote is not enabled and synced
    // we don't have the algorithm used at this step
    if (remote.info?.encryption === undefined) {
      return remote.encryptionKey !== undefined ? <Icon size='lg' icon='lock' /> : null
    } else {
      // remote enabled and not encrypted
      if (remote.info.encryption.algorithm === 'none') {
        return null
      }
      const { algorithm, isLegacy, recommendedAlgorithm } = remote.info.encryption
      return (
        <span>
          <Tooltip content={algorithm}>
            <Icon className='mr-1' icon='lock' size='lg' />
          </Tooltip>

          {isLegacy && (
            <Tooltip content={_('remoteEncryptionLegacy', { algorithm, recommendedAlgorithm })}>
              <Icon icon='error' size='lg' />
            </Tooltip>
          )}
        </span>
      )
    }
  },
  name: _('encryption'),
}

const fixRemoteUrl = remote => editRemote(remote, { url: format(remote) })
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
  COLUMN_DISK,
  COLUMN_ENCRYPTION,
  COLUMN_SPEED,
  COLUMN_PROXY,
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
        />{' '}
        {remote.invalidUrl && (
          <ActionButton
            btnStyle='danger'
            handler={fixRemoteUrl}
            handlerParam={remote}
            icon='alarm'
            size='small'
            tooltip={_('remoteErrorMessage', {
              url: remote.url,
              newUrl: format(remote),
            })}
          />
        )}
      </span>
    ),

    name: _('remoteDevice'),
  },
  {
    name: _('remoteOptions'),
    itemRenderer: remote => <Text data-remote={remote} onChange={_editRemoteOptions} value={remote.options || ''} />,
  },
  COLUMN_STATE,
  COLUMN_DISK,
  COLUMN_ENCRYPTION,
  COLUMN_SPEED,
  COLUMN_PROXY,
]
const COLUMNS_SMB_REMOTE = [
  COLUMN_NAME,
  {
    itemRenderer: (remote, { formatMessage }) => (
      <span>
        <strong className='text-info'>\\</strong>
        <Text data-element='host' data-remote={remote} onChange={_changeUrlElement} value={remote.host} />
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
  {
    name: _('remoteOptions'),
    itemRenderer: remote => <Text data-remote={remote} onChange={_editRemoteOptions} value={remote.options || ''} />,
  },
  COLUMN_STATE,
  {
    itemRenderer: (remote, { formatMessage }) => (
      <span>
        <Text data-element='username' data-remote={remote} onChange={_changeUrlElement} value={remote.username} />
        :
        <Password
          data-element='password'
          data-remote={remote}
          onChange={_changeUrlElement}
          placeholder={formatMessage(messages.remotePlaceHolderPassword)}
          value=''
        />
        @
        <Text data-element='domain' data-remote={remote} onChange={_changeUrlElement} value={remote.domain} />
      </span>
    ),
    name: _('remoteAuth'),
  },
  COLUMN_ENCRYPTION,
  COLUMN_SPEED,
  COLUMN_PROXY,
]

const COLUMNS_S3_REMOTE = [
  COLUMN_NAME,
  {
    itemRenderer: remote => remote.protocol === 'https' && <Icon icon='success' />,
    name: <span>{_('remoteS3LabelUseHttps')} </span>,
  },
  {
    itemRenderer: remote => remote.allowUnauthorized && <Icon icon='success' />,
    name: <span>{_('remoteS3LabelAllowInsecure')} </span>,
  },
  {
    itemRenderer: (remote, { formatMessage }) => (
      <Text
        data-element='host'
        data-remote={remote}
        onChange={_changeUrlElement}
        placeholder='AWS endpoint'
        value={remote.host}
      />
    ),
    name: 'AWS S3 Endpoint',
  },
  {
    itemRenderer: (remote, { formatMessage }) => (
      <Text
        data-element='path'
        data-remote={remote}
        onChange={_changeUrlElement}
        placeholder='bucket placeholder'
        value={remote.path}
      />
    ),
    name: 'Bucket',
  },
  COLUMN_STATE,
  {
    itemRenderer: (remote, { formatMessage }) => (
      <span>
        <Text data-element='username' data-remote={remote} onChange={_changeUrlElement} value={remote.username} />
        :
        <Password
          data-element='password'
          data-remote={remote}
          onChange={_changeUrlElement}
          placeholder='Click to change Secret Key'
          value=''
        />
      </span>
    ),
    name: 'Key',
  },
  COLUMN_ENCRYPTION,
  COLUMN_SPEED,
  COLUMN_PROXY,
]

const COLUMNS_AZURE_REMOTE = [
  COLUMN_NAME,
  {
    itemRenderer: remote => remote.protocol === 'https' && <Icon icon='success' />,
    name: <span>{_('remoteAzureLabelUseHttps')} </span>,
  },
  {
    itemRenderer: (remote, { formatMessage }) => (
      <Text
        data-element='host'
        data-remote={remote}
        onChange={_changeUrlElement}
        placeholder='Azure host'
        value={remote.host}
      />
    ),
    name: 'Azure Endpoint',
  },
  {
    itemRenderer: (remote, { formatMessage }) => (
      <Text
        data-element='path'
        data-remote={remote}
        onChange={_changeUrlElement}
        placeholder='Azure placeholder'
        value={remote.path}
      />
    ),
    name: 'Path',
  },
  COLUMN_STATE,
  {
    itemRenderer: (remote, { formatMessage }) => (
      <span>
        <Text data-element='username' data-remote={remote} onChange={_changeUrlElement} value={remote.username} />
        :
        <Password
          data-element='password'
          data-remote={remote}
          onChange={_changeUrlElement}
          placeholder='Click to change Secret Key'
          value=''
        />
      </span>
    ),
    name: 'Account',
  },
  COLUMN_ENCRYPTION,
  COLUMN_SPEED,
  COLUMN_PROXY,
]

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
                  <Icon icon='success' /> {_('remoteTestSuccess', { name: remote.name })}
                </span>,
                _('remoteTestSuccessMessage')
              )
            : alert(
                <span>
                  <Icon icon='error' /> {_('remoteTestFailure', { name: remote.name })}
                </span>,
                <p>
                  <dl className='dl-horizontal'>
                    <dt>{_('remoteTestError')}</dt>
                    <dd>
                      <pre>{formatError(answer.error)}</pre>
                    </dd>
                    <dt>{_('remoteTestStep')}</dt>
                    <dd>{answer.step}</dd>
                  </dl>
                </p>
              ),
        noop
      ),
    icon: 'diagnosis',
    label: _('remoteTestTip'),
    level: 'primary',
  },
  {
    handler: (remote, { reset, editRemote }) => {
      reset()
      editRemote(remote)
    },
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

export default decorate([
  addSubscriptions({
    remotes: subscribeRemotes,
    remotesInfo: subscribeRemotesInfo,
  }),
  injectIntl,
  provideState({
    initialState: () => ({
      formKey: generateRandomId(),
      remote: undefined,
    }),
    effects: {
      reset: () => () => ({
        formKey: generateRandomId(),
        remote: undefined,
      }),
      editRemote: (_, remote) => () => ({
        remote,
      }),
    },
    computed: {
      remoteWithInfo: (_, { remotes, remotesInfo }) =>
        groupBy(
          map(remotes, remote => ({
            ...parse(remote.url),
            ...remote,
            info: remotesInfo !== undefined ? remotesInfo[remote.id] : {},
          })),
          'type'
        ),
    },
  }),
  injectState,
  ({ state, effects, remotes = {}, intl: { formatMessage } }) => (
    <div>
      {!isEmpty(state.remoteWithInfo.file) && (
        <div>
          <h2>{_('remoteTypeLocal')}</h2>
          <SortedTable
            collection={state.remoteWithInfo.file}
            columns={COLUMNS_LOCAL_REMOTE}
            data-editRemote={effects.editRemote}
            data-formatMessage={formatMessage}
            data-reset={effects.reset}
            filters={FILTERS}
            groupedActions={GROUPED_ACTIONS}
            individualActions={INDIVIDUAL_ACTIONS}
            stateUrlParam='l'
          />
        </div>
      )}

      {!isEmpty(state.remoteWithInfo.nfs) && (
        <div>
          <h2>{_('remoteTypeNfs')}</h2>
          <SortedTable
            collection={state.remoteWithInfo.nfs}
            columns={COLUMNS_NFS_REMOTE}
            data-editRemote={effects.editRemote}
            data-formatMessage={formatMessage}
            data-reset={effects.reset}
            filters={FILTERS}
            groupedActions={GROUPED_ACTIONS}
            individualActions={INDIVIDUAL_ACTIONS}
            stateUrlParam='nfs'
          />
        </div>
      )}

      {!isEmpty(state.remoteWithInfo.smb) && (
        <div>
          <h2>{_('remoteTypeSmb')}</h2>
          <SortedTable
            collection={state.remoteWithInfo.smb}
            columns={COLUMNS_SMB_REMOTE}
            data-editRemote={effects.editRemote}
            data-formatMessage={formatMessage}
            data-reset={effects.reset}
            filters={FILTERS}
            groupedActions={GROUPED_ACTIONS}
            individualActions={INDIVIDUAL_ACTIONS}
            stateUrlParam='smb'
          />
        </div>
      )}

      {!isEmpty(state.remoteWithInfo.s3) && (
        <div>
          <h2>{_('remoteTypeS3')}</h2>
          <SortedTable
            collection={state.remoteWithInfo.s3}
            columns={COLUMNS_S3_REMOTE}
            data-editRemote={effects.editRemote}
            data-formatMessage={formatMessage}
            data-reset={effects.reset}
            filters={FILTERS}
            groupedActions={GROUPED_ACTIONS}
            individualActions={INDIVIDUAL_ACTIONS}
            stateUrlParam='s3'
          />
        </div>
      )}
      {!isEmpty(state.remoteWithInfo.azure) && (
        <div>
          <h2>{_('remoteTypeAzure')}</h2>
          <p>{state.remoteWithInfo.azurite}</p>
          <SortedTable
            collection={state.remoteWithInfo.azurite}
            columns={COLUMNS_AZURE_REMOTE}
            data-editRemote={effects.editRemote}
            data-formatMessage={formatMessage}
            data-reset={effects.reset}
            filters={FILTERS}
            groupedActions={GROUPED_ACTIONS}
            individualActions={INDIVIDUAL_ACTIONS}
            stateUrlParam='azure'
          />
        </div>
      )}
      {!isEmpty(state.remoteWithInfo.azurite) && (
        <div>
          <h2>{_('remoteTypeAzurite')}</h2>
          <SortedTable
            collection={state.remoteWithInfo.azurite}
            columns={COLUMNS_AZURE_REMOTE}
            data-editRemote={effects.editRemote}
            data-formatMessage={formatMessage}
            data-reset={effects.reset}
            filters={FILTERS}
            groupedActions={GROUPED_ACTIONS}
            individualActions={INDIVIDUAL_ACTIONS}
            stateUrlParam='azurite'
          />
        </div>
      )}
      <Remote formatMessage={formatMessage} key={state.formKey} />
    </div>
  ),
])
