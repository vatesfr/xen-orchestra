import _ from 'intl'
import ActionButton from 'action-button'
import addSubscriptions from 'add-subscriptions'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import { confirm } from 'modal'
import { injectState, provideState } from 'reaclette'
import { SelectXoCloudConfig } from 'select-objects'
import { subscribeCloudXoConfig, subscribeCloudXoConfigBackups } from 'xo'

import BackupXoConfigModal from './backup-xo-config-modal'
import RestoreXoConfigModal from './restore-xo-config-modal'

const CloudConfig = decorate([
  addSubscriptions({
    cloudXoConfig: subscribeCloudXoConfig,
    cloudXoConfigBackups: subscribeCloudXoConfigBackups,
  }),
  provideState({
    initialState: () => ({ config: undefined }),
    effects: {
      downloadCloudXoConfig:
        () =>
        ({ config, isConfigDefined }) => {
          if (isConfigDefined) {
            window.open(config.content_href, '_blank')
          }
        },
      restoreCloudXoConfig:
        () =>
        async ({ config, isConfigDefined }) => {
          if (isConfigDefined) {
            const { passphrase } = await confirm({
              icon: 'backup',
              title: _('xoConfigCloudBackup'),
              body: <RestoreXoConfigModal />,
            })

            const resp = await fetch(`./rest/v0/cloud/xo-config/backups/${config.id}/actions/import?sync`, {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                passphrase,
              }),
            })
            if (!resp.ok) {
              throw new Error(resp.statusText)
            }
            return {
              config: undefined,
            }
          }
        },
      onChangeCloudXoConfig: (_, config) => ({
        config,
      }),
      toggleEnableCloudXoConfig:
        () =>
        async (state, { cloudXoConfig }) => {
          let passphrase
          if (!cloudXoConfig?.enabled) {
            const params = await confirm({
              icon: 'backup',
              title: _('xoConfigCloudBackup'),
              body: <BackupXoConfigModal />,
            })
            passphrase = params.passphrase
          }

          const resp = await fetch('./rest/v0/cloud/xo-config', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              enabled: !cloudXoConfig?.enabled,
              passphrase,
            }),
          })
          if (!resp.ok) {
            throw new Error(resp.statusText)
          }
          subscribeCloudXoConfig.forceRefresh()
        },
    },
    computed: {
      isConfigDefined: ({ config }) => config != null,
    },
  }),
  injectState,
  ({ effects, state, cloudXoConfig }) => (
    <div>
      <div className='mb-1'>
        <h2>
          <Icon icon='backup' /> {_('manageXoConfigCloudBackup')}
        </h2>
        <em>
          <Icon icon='info' /> {_('xoConfigCloudBackupTips')}
        </em>
        <br />
        <ActionButton
          btnStyle={cloudXoConfig?.enabled ? 'warning' : 'primary'}
          handler={effects.toggleEnableCloudXoConfig}
          icon='backup'
        >
          {cloudXoConfig?.enabled ? _('disable') : _('enable')}
        </ActionButton>
      </div>
      <div>
        <h2>
          <Icon icon='xo-cloud-config' /> {_('backedUpXoConfigs')}
        </h2>
        <SelectXoCloudConfig onChange={effects.onChangeCloudXoConfig} value={state.config} />
        <div className='mt-1'>
          <ActionButton
            handler={effects.restoreCloudXoConfig}
            btnStyle='warning'
            icon='upload'
            disabled={!state.isConfigDefined}
          >
            {_('restore')}
          </ActionButton>{' '}
          <ActionButton
            btnStyle='primary'
            icon='download'
            handler={effects.downloadCloudXoConfig}
            disabled={!state.isConfigDefined}
          >
            {_('download')}
          </ActionButton>
        </div>
      </div>
    </div>
  ),
])

export default CloudConfig
