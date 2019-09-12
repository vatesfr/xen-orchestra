import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import { Card, CardBlock, CardHeader } from 'card'
import { Col, Row } from 'grid'
import { alert, form } from 'modal'
import { downloadAndInstallResource } from 'xo'
import { error, success } from 'notification'
import { connectStore, formatSize } from 'utils'
import { injectState, provideState } from 'reaclette'
import { withRouter } from 'react-router'
import { createGetObjectsOfType } from 'selectors'
import { find } from 'lodash'

import ResourceForm from './resource-form'

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
    }),
    effects: {
      initialize: () => {},
      async install(__, { name, namespace, id, size, version }) {
        const { isFromSources, installPoolPredicate } = this.state
        if (isFromSources) {
          subscribeAlert()
        } else {
          const resourceParams = await form({
            render: props => (
              <ResourceForm
                {...props}
                multi
                poolPredicate={installPoolPredicate}
              />
            ),
            header: (
              <span>
                <Icon icon='add-vm' /> {name}
              </span>
            ),
            size: 'medium',
            handler: value => {
              return value
            },
          })

          this.state.loading = true
          for (const pool of resourceParams.pools) {
            try {
              await downloadAndInstallResource({
                namespace,
                id,
                version,
                sr: pool.default_SR,
              })
              success('XVA import', 'XVA installed successfuly')
            } catch (_error) {
              error('Error', _error.message)
            }
          }
          this.state.loading = false
        }
      },
      async create(__, { name }) {
        const { isFromSources, createPoolPredicate, template } = this.state
        if (isFromSources) {
          subscribeAlert()
        } else {
          const resourceParams = await form({
            render: props => (
              <ResourceForm {...props} poolPredicate={createPoolPredicate} />
            ),
            header: (
              <span>
                <Icon icon='add-vm' /> {name}
              </span>
            ),
            size: 'medium',
            handler: value => {
              return value
            },
          })
          const { $pool } = resourceParams.pool
          this.props.router.push(
            `/vms/new?pool=${$pool}&template=${template.id}`
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
  ({
    totalDiskSize,
    effects,
    id,
    name,
    namespace,
    os,
    popularity,
    size,
    state,
    version,
  }) => (
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
        <div>
          <span className='text-muted'>{_('hubTotalDiskSize')}</span>
          {'  '}
          <strong>{formatSize(totalDiskSize)}</strong>
        </div>
        <hr />
        <Row>
          <Col mediumSize={6}>
            {state.loading ? (
              <div className='mb-3'>
                <a href='/#/tasks' target='_blank'>
                  {_('hubXvaProgressMessage')}
                </a>
                <progress className='progress' />
              </div>
            ) : (
              <ActionButton
                block
                data-id={id}
                data-name={name}
                data-namespace={namespace}
                data-version={version}
                disabled={state.isTemplateInstalledOnAllPools}
                form={state.idInstallForm}
                handler={effects.install}
                icon={'add'}
                size='meduim'
              >
                {_('hubInstallXva')}
              </ActionButton>
            )}
          </Col>
          <Col mediumSize={6}>
            <ActionButton
              block
              data-name={name}
              disabled={state.template === undefined}
              form={state.idCreateForm}
              handler={effects.create}
              icon={'add'}
              size='meduim'
            >
              {_('hubCreateXva')}
            </ActionButton>
          </Col>
        </Row>
      </CardBlock>
    </Card>
  ),
])
