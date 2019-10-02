import _ from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import marked from 'marked'
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
      hubInstallingResources: state => state.hubInstallingResources,
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
          markHubResourceAsInstalled,
          markHubResourceAsInstalling,
          version,
        } = this.props
        const { isTemplateInstalled } = this.state
        if (getXoaPlan() === 'Community') {
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

        markHubResourceAsInstalling(id)
        try {
          await Promise.all(
            resourceParams.pools.map(pool =>
              downloadAndInstallResource({
                namespace,
                id,
                version,
                sr: pool.default_SR,
              })
            )
          )
          success(_('hubImportNotificationTitle'), _('successfulInstall'))
        } catch (_error) {
          error(_('hubImportNotificationTitle'), _error.message)
        }
        markHubResourceAsInstalled(id)
      },
      async create() {
        const { isPoolCreated, installedTemplates } = this.state
        const { name } = this.props
        if (getXoaPlan() === 'Community') {
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
        const template = find(installedTemplates, { $pool })
        if (template !== undefined) {
          this.props.router.push(
            `/vms/new?pool=${$pool}&template=${template.id}`
          )
        } else {
          throw new Error(`can't find template for pool: ${$pool}`)
        }
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
      showDescription() {
        alert(
          this.props.name,
          <div
            dangerouslySetInnerHTML={{
              __html: marked(this.props.description),
            }}
          />
        )
      },
    },
    computed: {
      installedTemplates: (_, { id, templates }) =>
        filter(templates, ['other.xo:resource:xva:id', id]),
      isTemplateInstalledOnAllPools: ({ installedTemplates }, { pools }) =>
        installedTemplates.length > 0 &&
        pools.every(
          pool =>
            installedTemplates.find(template => template.$pool === pool.id) !==
            undefined
        ),
      isTemplateInstalled: ({ installedTemplates }) => pool =>
        installedTemplates.find(template => template.$pool === pool.id) ===
        undefined,
      isPoolCreated: ({ installedTemplates }) => pool =>
        installedTemplates.find(template => template.$pool === pool.id) !==
        undefined,
    },
  }),
  injectState,
  ({
    description,
    effects,
    hubInstallingResources,
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
          icon='delete'
          size='small'
          style={{ border: 'none' }}
          tooltip={_('remove')}
        />
        <br />
      </CardHeader>
      <CardBlock className='text-center'>
        <Row>
          <Col mediumSize={6}>
            <span className='text-muted'>{_('os')}</span> <strong>{os}</strong>
          </Col>
          <Col mediumSize={6}>
            {description !== undefined && (
              <div className='pull-right'>
                <Button onClick={effects.showDescription}>
                  <Icon icon='info' /> {_('vmNameDescription')}
                </Button>
              </div>
            )}
          </Col>
        </Row>
        <div>
          <span className='text-muted'>{_('version')}</span>
          {'  '}
          <strong>{version}</strong>
        </div>
        <div>
          <span className='text-muted'>{_('size')}</span>
          {'  '}
          <strong>{formatSize(size)}</strong>
        </div>
        <div>
          <span className='text-muted'>{_('totalDiskSize')}</span>
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
              pending={hubInstallingResources[id]}
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
              {_('create')}
            </ActionButton>
          </Col>
        </Row>
      </CardBlock>
    </Card>
  ),
])
