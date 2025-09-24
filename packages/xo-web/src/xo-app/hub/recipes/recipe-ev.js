import _ from 'intl'
import ActionButton from 'action-button'
import ButtonLink from 'button-link'
import decorate from 'apply-decorators'
import Icon from 'icon'
import marked from 'marked'
import React from 'react'
import { Card, CardBlock, CardHeader } from 'card'
import { form } from 'modal'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { createEasyVirtVm } from 'xo'
import { injectState, provideState } from 'reaclette'
import { success } from 'notification'
import { withRouter } from 'react-router'
import { generateId } from 'reaclette-utils'

import RecipeForm from './recipe-form-ev'
import moment from 'moment-timezone'
const DEFAULT_TIMEZONE = moment.tz.guess()

const RECIPE_INFO = {
  id: generateId(),
  name: 'EasyVirt VM',
  description: 'Creates a DC Scope or a DC Net Scope VM with parameters and application inside',
}

const INDEX_TO_PERF_CONFIG = [
  { cpu: 2, ram: 8 * 1024 * 1024 * 1024, diskSize: 10 * 1024 * 1024 * 1024 }, // 10GB
  { cpu: 2, ram: 12 * 1024 * 1024 * 1024, diskSize: 250 * 1024 * 1024 * 1024 }, // 250GB
  { cpu: 2, ram: 24 * 1024 * 1024 * 1024, diskSize: 550 * 1024 * 1024 * 1024 }, // 550GB
  { cpu: 4, ram: 48 * 1024 * 1024 * 1024, diskSize: 750 * 1024 * 1024 * 1024 }, // 750GB
  { cpu: 4, ram: 64 * 1024 * 1024 * 1024, diskSize: 1228 * 1024 * 1024 * 1024 }, // 1.2TB
  { cpu: 8, ram: 96 * 1024 * 1024 * 1024, diskSize: 1536 * 1024 * 1024 * 1024 }, // 1.5TB
  { cpu: 8, ram: 128 * 1024 * 1024 * 1024, diskSize: 2 * 1024 * 1024 * 1024 * 1024 }, // 2TB
]

export default decorate([
  withRouter,
  connectStore(() => ({
    pools: createGetObjectsOfType('pool'),
    recipeCreatingResources: state => state.recipeCreatingResources,
  })),
  provideState({
    effects: {
      async create() {
        const recipeParams = await form({
          defaultValue: {
            pool: {},
          },
          render: props => {
            return <RecipeForm {...props} value={{ ...props.value, timezone: DEFAULT_TIMEZONE }} />
          },
          header: (
            <span>
              <Icon icon='hub-recipe' /> {RECIPE_INFO.name}
            </span>
          ),
          size: 'medium',
        })

        const {
          vmName,
          vmIpAddress,
          gatewayIpAddress,
          network,
          sr,
          timezone,
          xoUsername,
          xoPassword,
          xoUrl,
          productName,
          userEmail,
          userCompany,
          performanceIndex,
        } = recipeParams

        const performanceConfig = INDEX_TO_PERF_CONFIG[performanceIndex]

        const vmId = await createEasyVirtVm({
          vmName,
          vmIpAddress,
          gatewayIpAddress,
          network: network.id,
          sr: sr.id,
          timezone,
          xoUsername,
          xoPassword,
          xoUrl,
          productName,
          userEmail,
          userCompany,
          performanceConfig,
        })

        success(
          _('recipeCreatedSuccessfully'),
          <ButtonLink btnStyle='success' size='small' to={`/vms/${vmId}/general`}>
            {_('recipeViewCreatedVms')}
          </ButtonLink>,
          8e3
        )
      },
    },
  }),
  injectState,
  ({ effects, recipeCreatingResources }) => (
    <Card shadow>
      <CardHeader>{RECIPE_INFO.name}</CardHeader>
      <CardBlock>
        <div
          className='text-muted'
          dangerouslySetInnerHTML={{
            __html: marked(RECIPE_INFO.description),
          }}
        />
        <hr />
        <ActionButton
          block
          handler={effects.create}
          icon='deploy'
          pending={recipeCreatingResources[RECIPE_INFO.id]}
          // redirectOnSuccess={(vmId) => `/vms/${vmId}/general`}
        >
          {_('create')}
        </ActionButton>
      </CardBlock>
    </Card>
  ),
])
