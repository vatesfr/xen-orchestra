import _ from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import ImportProgress from './import-progress'
import React from 'react'
import Tooltip from 'tooltip'
import { Card, CardBlock, CardHeader } from 'card'
import { Col, Row } from 'grid'
import { alert, form } from 'modal'
import { downloadAndInstallResource } from 'xo'
import { error, success } from 'notification'
import { connectStore, formatSize } from 'utils'
import { injectState, provideState } from 'reaclette'
import { generateId } from 'reaclette-utils'
import { withRouter } from 'react-router'
import { createGetObjectsOfType } from 'selectors'
import { SelectPool } from 'select-objects'
import * as FormGrid from 'form-grid'
import { forEach, find } from 'lodash'

const subscribeAlert = () =>
  alert(
    _('hubResourceAlert'),
    <div>
      <p>
        {_('considerSubscribe', {
          link: 'https://xen-orchestra.com',
        })}
      </p>
    </div>
  )

export default decorate([
  withRouter,
  connectStore(() => {
    const getTemplates = createGetObjectsOfType('VM-template').sort()
    const getPools = createGetObjectsOfType('pool')
    return {
      templates: getTemplates,
      pools: getPools,
    }
  }),
  provideState({
    initialState: () => ({
      loading: false,
      selectedInstallPools: [],
      selectedCreatePool: undefined,
    }),
    effects: {
      initialize: () => {},
      async install(__, { name, namespace, id, size, version }) {
        const { isFromSources, selectedInstallPools } = this.state
        if (isFromSources) {
          subscribeAlert()
        } else {
          this.state.loading = true
          for (const pool of selectedInstallPools) {
            try {
              const templateId = await downloadAndInstallResource({
                namespace,
                id,
                version,
                sr: pool.default_SR,
              })
              success('XVA import', 'XVA installed successfuly')
              return {
                selectedInstallPools: [],
              }
            } catch (_error) {
              error('Error', _error.message)
            }
          }
          this.state.loading = false
        }
      },
      async create() {
        const { isFromSources, selectedCreatePool, template } = this.state
        if (isFromSources) {
          subscribeAlert()
        } else {
          this.props.router.push(
            `/vms/new?pool=${selectedCreatePool.$pool}&template=${template.id}`
          )
        }
      },
      updateSelectedInstallPools(_, selectedInstallPools) {
        return {
          selectedInstallPools,
        }
      },
      updateSelectedCreatePool(_, selectedCreatePool) {
        return {
          selectedCreatePool,
        }
      },
      redirectToTaskPage() {
        this.props.router.push('/tasks')
      },
    },
    computed: {
      idInstallForm: generateId,
      idCreateForm: generateId,
      isFromSources: () => +process.env.XOA_PLAN > 4,
      poolName: ({ pool }) => pool && pool.name_label,
      template: (_, { id, templates }) => {
        return find(templates, ['other.xva_id', id])
      },
      isTemplateInstalledOnAllPools: ({ template }, { pools }) => {
        let _isTemplateInstalledOnAllPools = true
        if (template === undefined) {
          _isTemplateInstalledOnAllPools = false
        }
        for (const $pool in pools) {
          if (template && template.$pool !== $pool) {
            _isTemplateInstalledOnAllPools = false
            break
          }
        }
        return _isTemplateInstalledOnAllPools
      },
      installPoolPredicate: ({ template }) => {
        if (template) {
          return pool => template.$pool !== pool.$pool
        }
        return () => true
      },
      createPoolPredicate: ({ template }) => {
        if (template) {
          return pool => template.$pool === pool.$pool
        }
        return () => true
      },
    },
  }),
  injectState,
  ({ effects, id, name, namespace, os, popularity, size, state, version }) => (
    <Card shadow>
      <CardHeader>{name}</CardHeader>
      <CardBlock className='text-center'>
        <div>
          <span className='text-muted'>{_('hubXvaOs')}</span>{' '}
          <strong>{os}</strong>
          <span className='pull-right'>
            {popularity} <Icon icon='plan-trial' />
          </span>
        </div>
        <div>
          <span className='text-muted'>{_('hubXvaVersion')}</span>
          {'  '}
          <strong>{version}</strong>
        </div>
        <div>
          <span className='text-muted'>{_('hubXvaSize')}</span>
          {'  '}
          <strong>{formatSize(size)}</strong>
        </div>
        <hr />
        {state.loading ? (
          <div>
            <a href='/#/tasks' target='_blank'>
              {_('hubXvaProgressMessage')}
            </a>
            <ImportProgress />
          </div>
        ) : (
          <form id={state.idInstallForm}>
            <Tooltip content={_('hubHideInstalledPoolMsg')}>
              <SelectPool
                autoFocus
                className='mb-1'
                disabled={state.isTemplateInstalledOnAllPools}
                multi
                onChange={effects.updateSelectedInstallPools}
                predicate={state.installPoolPredicate}
                required
                value={state.selectedInstallPools}
              />
            </Tooltip>
            <ActionButton
              block
              data-id={id}
              data-name={name}
              data-namespace={namespace}
              data-version={version}
              form={state.idInstallForm}
              handler={effects.install}
              icon={'add'}
              size='meduim'
            >
              {_('hubInstallXva')}
            </ActionButton>
          </form>
        )}
        <hr />
        <form id={state.idCreateForm}>
          <SelectPool
            autoFocus
            className='mb-1'
            disabled={state.template === undefined}
            onChange={effects.updateSelectedCreatePool}
            predicate={state.createPoolPredicate}
            required
            value={state.selectedCreatePool}
          />
          <ActionButton
            block
            form={state.idCreateForm}
            handler={effects.create}
            icon={'add'}
            size='meduim'
          >
            {_('hubCreateXva')}
          </ActionButton>
        </form>
      </CardBlock>
    </Card>
  ),
])
