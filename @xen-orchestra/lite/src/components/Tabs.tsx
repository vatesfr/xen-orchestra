import Box from '@mui/material/Box'
import React from 'react'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Typography from '@mui/material/Typography'
import { RouteComponentProps } from 'react-router-dom'
import { withState } from 'reaclette'
import { withRouter } from 'react-router'

import IntlMessage from '../components/IntlMessage'

interface ParentState {}

interface State {
  pathname: string
}

interface Tab {
  component?: React.ReactNode
  disabled?: boolean
  label: React.ReactNode
  pathname: string
}

interface Props {
  history: RouteComponentProps['history']
  // tabs= [
  //   {
  //      component: (<span>BAR</span>)
  //      pathname: '/path',
  //      label: (
  //        <span>
  //          <Icon icon='cloud' /> {labelA}
  //        </span>
  //      ),
  //   },
  // ]
  tabs: Array<Tab>
}

interface ParentEffects {}

interface Effects {
  onChange: (event: React.SyntheticEvent, value: string) => void
}

interface Computed {}

// TODO: improve view as done in the model(figma).
const pageUnderConstruction = (
  <div style={{ color: '#0085FF', textAlign: 'center' }}>
    <Typography variant='h2'>
      {' '}
      <IntlMessage id='xoLiteUnderConstruction' />
    </Typography>

    <Typography variant='h3'>
      <IntlMessage id='newFeaturesUnderConstruction' />
    </Typography>
  </div>
)

const Tabs = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: ({ tabs }) => ({ pathname: tabs[0].pathname }),
    effects: {
      onChange: function (event, pathname) {
        this.props.history.push(pathname)
        this.state.pathname = pathname
      },
    },
  },
  ({ effects, state: { pathname }, tabs }) => (
    <TabContext value={pathname}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', marginTop: '0.5em' }}>
        <TabList onChange={effects.onChange}>
          {tabs.map((tab: Tab) => (
            <Tab disabled={tab.disabled} key={tab.pathname} label={tab.label} value={tab.pathname} />
          ))}
        </TabList>
      </Box>
      {tabs.map((tab: Tab) => (
        <TabPanel key={tab.pathname} value={tab.pathname}>
          {tab.component === undefined ? pageUnderConstruction : tab.component}
        </TabPanel>
      ))}
    </TabContext>
  )
)

export default withRouter(Tabs)
