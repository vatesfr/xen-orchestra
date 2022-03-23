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
  // if value is a string, it's considered as a pathname
  value: any
}

// For compatibility with 'withRouter'
interface Props extends RouteComponentProps {
  indicatorColor?: 'primary' | 'secondary'
  textColor?: 'inherit' | 'primary' | 'secondary'
  // tabs = [
  //   {
  //     component: <span>BAR</span>,
  //     value: '/path',
  //     label: (
  //       <span>
  //         <Icon icon='cloud' /> {labelA}
  //       </span>
  //     ),
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
      <IntlMessage id='xoLiteUnderConstruction' />
    </Typography>
    <Typography variant='h3'>
      <IntlMessage id='newFeaturesUnderConstruction' />
    </Typography>
  </div>
)

const Tabs = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: ({ tabs }) => ({ value: tabs[0].value }),
    effects: {
      onChange: function (_, value) {
        if (typeof value === 'string') {
          this.props.history.push(value)
        }
        this.state.value = value
      },
    },
  },
  ({ effects, state: { value }, indicatorColor, textColor, tabs }) => (
    <TabContext value={value}>
      <Box sx={BOX_STYLE}>
        <TabList indicatorColor={indicatorColor} onChange={effects.onChange} textColor={textColor}>
          {tabs.map((tab: Tab) => (
            <Tab disabled={tab.disabled} key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </TabList>
      </Box>
      {tabs.map((tab: Tab) => (
        <TabPanel key={tab.value} value={tab.value}>
          {tab.component === undefined ? pageUnderConstruction : tab.component}
        </TabPanel>
      ))}
    </TabContext>
  )
)

export default withRouter(Tabs)
