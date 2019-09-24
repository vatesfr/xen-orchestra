import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import { Card, CardBlock, CardHeader } from 'card'
import { Col, Row } from 'grid'
import { alert, form } from 'modal'
import { connectStore, formatSize, getXoaPlan } from 'utils'
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
      async install() {
        const {
          id,
          name,
          namespace,
          setHubInstallLoadingState,
          version,
        } = this.props
        const {
          hubInstallLoadingState,
          isTemplateInstalled,
          isFromSources,
        } = this.state
        if (isFromSources) {
          subscribeAlert()
          return
        }
        const resourceParams = await form({
          render: props => (
            <ResourceForm
              install
              multi
              poolPredicate={isTemplateInstalled}
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
      },
      async create() {
        const { isFromSources, isPoolCreated, installedTemplates } = this.state
        const { name } = this.props
        if (isFromSources) {
          subscribeAlert()
          return
        }
        const resourceParams = await form({
          render: props => (
            <ResourceForm poolPredicate={isPoolCreated} {...props} />
          ),
          header: (
            <span>
              <Icon icon='add-vm' /> {name}
            </span>
          ),
          size: 'medium',
        })
        const { $pool } = resourceParams.pool
        const { id } = find(installedTemplates, { $pool })
        this.props.router.push(`/vms/new?pool=${$pool}&template=${id}`)
      },
      async deleteTemplates(__, { name }) {
        const { isPoolCreated } = this.state
        const resourceParams = await form({
          render: props => (
            <ResourceForm
              delete
              multi
              poolPredicate={isPoolCreated}
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
          find(resourceParams.pools, { $pool: template.$pool })
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
      isFromSources: () => getXoaPlan(process.env.XOA_PLAN) === 'Community',
      installedTemplates: (_, { id, templates }) =>
        filter(templates, ['other.xva_id', id]),
      isTemplateInstalledOnAllPools: ({ installedTemplates }, { pools }) =>
        installedTemplates.length > 0 &&
        installedTemplates.every(pool =>
          installedTemplates.some(template => template.$pool === pool.id)
        ),
      isTemplateInstalled: ({ installedTemplates }) => pool =>
        installedTemplates.find(template => template.$pool !== pool.id) !==
        undefined,
      isPoolCreated: ({ installedTemplates }) => pool =>
        installedTemplates.length === 0 ||
        installedTemplates.find(template => template.$pool !== pool.id) ===
          undefined,
    },
  }),
  injectState,
  ({
    effects,
    hubInstallLoadingState,
    id,
    name,
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
              disabled={state.isTemplateInstalledOnAllPools}
              form={state.idInstallForm}
              handler={effects.install}
              icon='add'
              pending={hubInstallLoadingState[id]}
            >
              {_('install')}
            </ActionButton>
          </Col>
          <Col mediumSize={6}>
            <ActionButton
              block
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
