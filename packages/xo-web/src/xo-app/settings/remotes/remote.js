import _, { messages } from 'intl'
import ActionButton from 'action-button'
import defined from 'xo-defined'
import Icon from 'icon'
import React from 'react'
import { alert, confirm } from 'modal'
import { createRemote, editRemote, subscribeRemotes } from 'xo'
import { error } from 'notification'
import { format, parse } from 'xo-remote-parser'
import { addSubscriptions, linkState, generateRandomId } from 'utils'
import { injectState, provideState } from '@julien-f/freactal'
import { map, some, trimStart, keyBy } from 'lodash'
import { Number } from 'form'

const remoteTypes = {
  file: 'remoteTypeLocal',
  nfs: 'remoteTypeNfs',
  smb: 'remoteTypeSmb',
}

export default [
  addSubscriptions({
    remotes: cb =>
      subscribeRemotes(remotes => {
        cb(
          keyBy(
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
            'id'
          )
        )
      }),
  }),
  provideState({
    initialState: () => ({
      domain: undefined,
      host: undefined,
      inputTypeId: generateRandomId(),
      name: undefined,
      password: undefined,
      path: undefined,
      port: undefined,
      type: undefined,
      username: undefined,
    }),
    effects: {
      linkState,
      setPort: (_, port) => () => ({
        port,
      }),
      editRemote: ({ reset }) => (state, { remotes }) => {
        const remote = remotes[state.remoteId]
        const {
          domain = remote.domain,
          host = remote.host,
          name,
          password = remote.password,
          path = remote.path,
          port = remote.port,
          type = remote.type,
          username = remote.username,
        } = state
        return editRemote(remote, {
          name,
          url: format({
            domain,
            host,
            password,
            path,
            port,
            type,
            username,
          }),
        }).then(reset)
      },
      createRemote: ({ reset }) => async (state, { remotes }) => {
        if (some(remotes, { name: state.name })) {
          return alert(
            <span>
              <Icon icon='error' /> {_('remoteTestName')}
            </span>,
            <p>{_('remoteTestNameFailure')}</p>
          )
        }

        const {
          domain,
          host,
          name,
          password,
          path,
          port,
          type = 'nfs',
          username,
        } = state

        const urlParams = {
          host,
          path,
          port,
          type,
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
        return createRemote(name, url)
          .then(reset)
          .catch(err => error('Create Remote', err.message || String(err)))
      },
    },
    computed: {
      effectiveDomain: (state, { remotes }) =>
        defined(state.domain, () => remotes[state.remoteId].domain, ''),
      effectiveHost: (state, { remotes }) =>
        defined(state.host, () => remotes[state.remoteId].host, ''),
      effectiveName: (state, { remotes }) =>
        defined(state.name, () => remotes[state.remoteId].name, ''),
      effectivePassword: (state, { remotes }) =>
        defined(state.password, () => remotes[state.remoteId].password, ''),
      effectivePath: (state, { remotes }) =>
        defined(
          state.path,
          () => trimStart(remotes[state.remoteId].path, '/'),
          ''
        ),
      effectivePort: (state, { remotes }) =>
        defined(state.port, () => remotes[state.remoteId].port),
      effectiveType: (state, { remotes }) =>
        defined(state.type, () => remotes[state.remoteId].type, 'nfs'),
      effectiveUsername: (state, { remotes }) =>
        defined(state.username, () => remotes[state.remoteId].username, ''),
    },
  }),
  injectState,
  ({ state, effects, formatMessage, remotes = {} }) => (
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
            value={state.effectiveType}
          >
            {map(remoteTypes, (label, key) =>
              _({ key }, label, message => (
                <option value={key}>{message}</option>
              ))
            )}
          </select>
          {state.effectiveType === 'smb' && (
            <em className='text-warning'>{_('remoteSmbWarningMessage')}</em>
          )}
        </div>
        <div className='form-group'>
          <input
            className='form-control'
            name='name'
            onChange={effects.linkState}
            placeholder={formatMessage(messages.remoteMyNamePlaceHolder)}
            required
            type='text'
            value={state.effectiveName}
          />
        </div>
        {state.effectiveType === 'file' && (
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
                value={state.effectivePath}
              />
            </div>
          </fieldset>
        )}
        {state.effectiveType === 'nfs' && (
          <fieldset>
            <div className='form-group'>
              <input
                className='form-control'
                name='host'
                onChange={effects.linkState}
                placeholder={formatMessage(messages.remoteNfsPlaceHolderHost)}
                required
                type='text'
                value={state.effectiveHost}
              />
              <br />
              <Number
                onChange={effects.setPort}
                placeholder={formatMessage(messages.remoteNfsPlaceHolderPort)}
                value={state.effectivePort}
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
                value={state.effectivePath}
              />
            </div>
          </fieldset>
        )}
        {state.effectiveType === 'smb' && (
          <fieldset>
            <div className='input-group form-group'>
              <span className='input-group-addon'>\\</span>
              <input
                className='form-control'
                name='host'
                onChange={effects.linkState}
                pattern='^([^\\/]+)\\([^\\/]+)$'
                placeholder={formatMessage(
                  messages.remoteSmbPlaceHolderAddressShare
                )}
                required
                type='text'
                value={state.effectiveHost}
              />
              <span className='input-group-addon'>\</span>
              <input
                className='form-control'
                name='path'
                onChange={effects.linkState}
                pattern='^(([^\\/]+)+(\\[^\\/]+)*)?$'
                placeholder={formatMessage(
                  messages.remoteSmbPlaceHolderRemotePath
                )}
                required
                type='text'
                value={state.effectivePath}
              />
            </div>
            <div className='form-group'>
              <input
                className='form-control'
                name='username'
                onChange={effects.linkState}
                placeholder={formatMessage(
                  messages.remoteSmbPlaceHolderUsername
                )}
                required
                type='text'
                value={state.effectiveUsername}
              />
            </div>
            <div className='form-group'>
              <input
                className='form-control'
                name='password'
                onChange={effects.linkState}
                placeholder={formatMessage(
                  messages.remoteSmbPlaceHolderPassword
                )}
                required
                type='text'
                value={state.effectivePassword}
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
                value={state.effectiveDomain}
              />
            </div>
          </fieldset>
        )}
        <div className='form-group'>
          <ActionButton
            btnStyle='primary'
            form={state.formId}
            handler={
              state.remoteId === undefined
                ? effects.createRemote
                : effects.editRemote
            }
            icon='save'
            type='submit'
          >
            {_('savePluginConfiguration')}
          </ActionButton>
          <ActionButton
            className='pull-right'
            handler={effects.reset}
            icon='reset'
            type='reset'
          >
            {_('formReset')}
          </ActionButton>
        </div>
      </form>
    </div>
  ),
].reduceRight((value, decorator) => decorator(value))
