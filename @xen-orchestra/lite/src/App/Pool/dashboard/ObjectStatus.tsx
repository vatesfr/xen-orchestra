import Grid from '@mui/material/Grid'
import React from 'react'
import styled from 'styled-components'
import Typography from '@mui/material/Typography'
import { withState } from 'reaclette'

import Icon from '../../../components/Icon'
import IntlMessage from '../../../components/IntlMessage'
import ProgressCircle from '../../../components/ProgressCircle'

interface ParentState {}

interface State {}

interface Props {
  nActive?: number
  nTotal?: number
  type: 'host' | 'VM'
}

interface ParentEffects {}

interface Effects {}

interface Computed {
  nInactive?: number
}

const DEFAULT_CAPTION_STYLE = { textTransform: 'uppercase', mt: 2 }
const TYPOGRAPHY_SX = { mb: 2 }

const ObjectStatusContainer = styled.div`
  display: flex;
  overflow: hidden;
  flex-direction: row;
  align-content: space-between;
  margin-bottom: 1em;
`

const CircularProgressPanel = styled.div`
  margin-left: 2em;
`

const GridPanel = styled.div`
  margin-left: 2em;
  width: 100%;
  height: 100%;
`

// TODO: use CircularProgress component when https://github.com/vatesfr/xen-orchestra/pull/6128 is merged.
// Add a loading page when data is not loaded as it is in the model(figma).
// FIXME: replace the hard-coded colors with the theme colors.
const ObjectStatus = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      nInactive: (state, { nTotal = 0, nActive = 0 }) => nTotal - nActive,
    },
  },
  ({ state: { nInactive }, nActive = 0, nTotal = 0, type }) => {
    if (nTotal === 0) {
      return (
        <span>
          <IntlMessage id={type === 'VM' ? 'noVms' : 'noHosts'} />
        </span>
      )
    }

    return (
      <ObjectStatusContainer>
        <CircularProgressPanel>
          <ProgressCircle max={nTotal} value={nActive} />
        </CircularProgressPanel>
        <GridPanel>
          <Grid container>
            <Grid item xs={12}>
              <Typography sx={TYPOGRAPHY_SX} variant='h5' component='div'>
                <IntlMessage id={type === 'VM' ? 'vms' : 'hosts'} />
              </Typography>
            </Grid>
            <Grid item xs={10}>
              <Icon icon='circle' htmlColor='#00BA34' />
              &nbsp;
              <Typography variant='body2' component='span'>
                <IntlMessage id='active' />
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant='body2' component='div'>
                {nActive}
              </Typography>
            </Grid>
            <Grid item xs={10}>
              <Icon icon='circle' htmlColor='#E8E8E8' />
              &nbsp;
              <Typography variant='body2' component='span'>
                <IntlMessage id='inactive' />
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant='body2' component='div'>
                {nInactive}
              </Typography>
            </Grid>
            <Grid item xs={10}>
              <Typography variant='caption' component='div' sx={DEFAULT_CAPTION_STYLE}>
                <IntlMessage id='total' />
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant='caption' component='div' sx={DEFAULT_CAPTION_STYLE}>
                {nTotal}
              </Typography>
            </Grid>
          </Grid>
        </GridPanel>
      </ObjectStatusContainer>
    )
  }
)

export default ObjectStatus
