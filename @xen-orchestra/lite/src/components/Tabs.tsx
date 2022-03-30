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

const BOX_STYLE = { borderBottom: 1, borderColor: 'divider', marginTop: '0.5em' }

interface ParentState {}

interface State {
  value: string
}

interface Tab {
  component?: React.ReactNode
  disabled?: boolean
  label: React.ReactNode
}

interface UrlTab extends Tab {
  pathname: string
  value?: any
}

interface NoUrlTab extends Tab {
  value: any
}

// For compatibility with 'withRouter'
interface Props extends RouteComponentProps {
  indicatorColor?: 'primary' | 'secondary'
  textColor?: 'inherit' | 'primary' | 'secondary'
  // tabs = [
  //   {
  //     component: <span>BAR</span>,
  //     pathname: '/path',
  //     label: (
  //       <span>
  //         <Icon icon='cloud' /> {labelA}
  //       </span>
  //     ),
  //   },
  // ]
  tabs: Array<NoUrlTab | UrlTab>
  useUrl?: boolean
  value?: any
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
      <IntlMessage id='xoLiteUnderConstruction' />
    </Typography>
    <Typography variant='h3'>
      <IntlMessage id='newFeaturesUnderConstruction' />
    </Typography>
  </div>
)

const Tabs = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: ({ location: { pathname }, tabs, useUrl = false, value }) => ({
      value: (useUrl && pathname) || (value ?? tabs[0].value ?? tabs[0].pathname),
    }),
    effects: {
      onChange: function (_, value) {
        if (this.props.useUrl) {
          const { history, tabs } = this.props
          history.push(tabs.find(tab => (tab.value ?? tab.pathname) === value).pathname)
        }
        this.state.value = value
      },
    },
  },
  ({ effects, state: { value }, indicatorColor, textColor, tabs }) => (
    <TabContext value={value}>
      <Box sx={BOX_STYLE}>
        <TabList indicatorColor={indicatorColor} onChange={effects.onChange} textColor={textColor}>
          {tabs.map((tab: UrlTab | NoUrlTab) => {
            const value = tab.value ?? tab.pathname
            return <Tab disabled={tab.disabled} key={value} label={tab.label} value={value} />
          })}
        </TabList>
      </Box>
      {tabs.map((tab: UrlTab | NoUrlTab) => {
        const value = tab.value ?? tab.pathname
        return (
          <TabPanel key={value} value={value}>
            {tab.component === undefined ? pageUnderConstruction : tab.component}
          </TabPanel>
        )
      })}
    </TabContext>
  )
)

export default withRouter(Tabs)
