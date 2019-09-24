import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import { Card, CardBlock, CardHeader } from 'card'
import { Col, Row } from 'grid'
import { alert, form } from 'modal'
import { connectStore, formatSize } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { downloadAndInstallResource, deleteTemplates } from 'xo'
import { error, success } from 'notification'
import { find, filter } from 'lodash'
import { injectState, provideState } from 'reaclette'
import { withRouter } from 'react-router'

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
      hubInstallLoadingState: state => state.hubInstallLoadingState,
    }
  }),
  provideState({
    initialState: () => ({
      selectedInstallPools: [],
    }),
    effects: {
      async install(__, { name, namespace, id, version }) {
        const { setHubInstallLoadingState } = this.props
        const {
          hubInstallLoadingState,
          installPoolPredicate,
          isFromSources,
        } = this.state
        if (isFromSources) {
          subscribeAlert()
        } else {
          const resourceParams = await form({
            render: props => (
              <ResourceForm
                install
                multi
                poolPredicate={installPoolPredicate}
                {...props}
              />
            ),
            header: (
              <span>
                <Icon icon='add-vm' /> {name}
              </span>
            ),
            size: 'medium',
          })

          setHubInstallLoadingState({
            ...hubInstallLoadingState,
            [id]: true,
          })
          for (const pool of resourceParams.pools) {
            try {
              await downloadAndInstallResource({
                namespace,
                id,
                version,
                sr: pool.default_SR,
              })
              success('XVA import', _('hubSuccessfulInstallMsg'))
            } catch (_error) {
              error('Error', _error.message)
            }
          }
          setHubInstallLoadingState({
            ...hubInstallLoadingState,
            [id]: false,
          })
        }
      },
      async create(__, { name }) {
        const {
          isFromSources,
          createPoolPredicate,
          installedTemplates,
        } = this.state
        if (isFromSources) {
          subscribeAlert()
        } else {
          const resourceParams = await form({
            render: props => (
              <ResourceForm poolPredicate={createPoolPredicate} {...props} />
            ),
            header: (
              <span>
                <Icon icon='add-vm' /> {name}
              </span>
            ),
            size: 'medium',
          })
          const { $pool } = resourceParams.pool
          const { id } = find(installedTemplates, ['$pool', $pool])
          this.props.router.push(`/vms/new?pool=${$pool}&template=${id}`)
        }
      },
      async deleteTemplates(__, { name }) {
        const { createPoolPredicate } = this.state
        const resourceParams = await form({
          render: props => (
            <ResourceForm
              delete
              multi
              poolPredicate={createPoolPredicate}
              {...props}
            />
          ),
          header: (
            <span>
              <Icon icon='vm-delete' /> {name}
            </span>
          ),
          size: 'medium',
        })
        const _templates = filter(this.state.installedTemplates, template =>
          find(resourceParams.pools, ['$pool', template.$pool])
        )
        await deleteTemplates(_templates)
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
      installedTemplates: (_, { id, templates }) =>
        filter(templates, ['other.xva_id', id]),
      installLoadingState: (_, { hubInstallLoadingState, id }) =>
        hubInstallLoadingState[id],
      isTemplateInstalledOnAllPools: ({ installedTemplates }, { pools }) => {
        let _isTemplateInstalledOnAllPools = true
        if (installedTemplates.length === 0) {
          _isTemplateInstalledOnAllPools = false
        }
        for (const $pool in pools) {
          if (find(installedTemplates, ['$pool', $pool]) === undefined) {
            _isTemplateInstalledOnAllPools = false
            break
          }
        }
        return _isTemplateInstalledOnAllPools
      },
      installPoolPredicate: ({ installedTemplates }) => pool =>
        !installedTemplates.some(template => template.$pool === pool.id),
      createPoolPredicate: ({ installedTemplates }) => pool =>
        installedTemplates.length === 0 ||
        installedTemplates.some(template => template.$pool === pool.id),
    },
  }),
  injectState,
  ({
    effects,
    id,
    name,
    namespace,
    os,
    size,
    state,
    totalDiskSize,
    version,
  }) => (
    <Card shadow>
      <CardHeader>
        {name}
        <ActionButton
          className='pull-right'
          color='light'
          data-name={name}
          disabled={state.installedTemplates.length === 0}
          handler={effects.deleteTemplates}
          size='small'
          style={{ border: 'none' }}
        >
          <Icon icon='delete' size='xs' />
        </ActionButton>
        <br />
      </CardHeader>
      <CardBlock className='text-center'>
        <div>
          <span className='text-muted'>{_('hubXvaOs')}</span>{' '}
          <strong>{os}</strong>
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
            <ActionButton
              block
              data-id={id}
              data-name={name}
              data-namespace={namespace}
              data-version={version}
              disabled={state.isTemplateInstalledOnAllPools}
              form={state.idInstallForm}
              handler={effects.install}
              icon='add'
              pending={state.installLoadingState}
            >
              {_('hubInstallXva')}
            </ActionButton>
          </Col>
          <Col mediumSize={6}>
            <ActionButton
              block
              data-name={name}
              disabled={state.installedTemplates.length === 0}
              form={state.idCreateForm}
              handler={effects.create}
              icon='deploy'
            >
              {_('hubCreateXva')}
            </ActionButton>
          </Col>
        </Row>
      </CardBlock>
    </Card>
  ),
])
