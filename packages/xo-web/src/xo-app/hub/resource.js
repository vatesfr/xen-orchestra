import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import ImportProgress from './import-progress'
import React from 'react'
import { Card, CardBlock, CardHeader } from 'card'
import { Col, Row } from 'grid'
import { alert, form } from 'modal'
import { downloadAndInstallResource } from 'xo'
import { error, success } from 'notification'
import { formatSize } from 'utils'
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
  provideState({
    initialState: () => ({
      loading: false,
    }),
    effects: {
      initialize: () => {},
      async install(__, { deploy, name, namespace, id, size, version, uuid }) {
        const { isFromSources } = this.state
        if (isFromSources) {
          subscribeAlert()
        } else {
          const resourceParams = await form({
            render: props => (
              <ResourceForm {...props} xvaSize={this.props.size} uuid={uuid} />
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
          try {
            const vmUuid = await downloadAndInstallResource({
              namespace,
              id,
              version,
              sr: resourceParams.sr,
            })
            success('XVA import', 'XVA installed successfuly')
            if (deploy) {
              this.props.router.push(`vms/${vmUuid}`)
            } else {
              this.props.router.push(`/home?p=1&s=${name}&t=VM-template`)
            }
          } catch (_error) {
            error('Error', _error.message)
          } finally {
            this.state.loading = false
          }
        }
      },
      redirectToTaskPage() {
        this.props.router.push('/tasks')
      },
    },
    computed: {
      isFromSources: () => +process.env.XOA_PLAN > 4,
      poolName: ({ pool }) => pool && pool.name_label,
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
          <Row>
            <br />
            <Col size={6}>
              <ActionButton
                block
                handler={effects.install}
                data-name={name}
                data-namespace={namespace}
                data-id={id}
                data-version={version}
                icon={'add'}
                size='meduim'
              >
                {_('hubInstallXva')}
              </ActionButton>
            </Col>
            <Col size={6}>
              <ActionButton
                block
                handler={effects.install}
                data-name={name}
                data-namespace={namespace}
                data-id={id}
                data-version={version}
                data-deploy
                icon={'deploy'}
                size='meduim'
              >
                {_('hubDeployXva')}
              </ActionButton>
            </Col>
            <br />
          </Row>
        )}
      </CardBlock>
    </Card>
  ),
])
