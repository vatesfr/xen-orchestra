import Box from '@mui/material/Box'
import React from 'react'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { RouteComponentProps } from 'react-router-dom'
import { withState } from 'reaclette'
import { withRouter } from 'react-router'

interface ParentState {}

interface State {
  pathname: string
}

interface TabType {
  component?: React.ReactNode
  disabled: boolean
  label: React.ReactNode
  pathname: string
}

interface Props {
  history: RouteComponentProps['history']
  // list= [
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
  list: Array<TabType>
}

interface ParentEffects {}

interface Effects {
  onChange: (event: React.SyntheticEvent, value: string) => void
}

interface Computed {}

// TODO: improve view as done in the model(figma).
const pageUnderConstruction = (
  <div style={{ color: '#0085FF', textAlign: 'center' }}>
    <h2>XOLite is under construction</h2>
    <h3>New features are coming soon !</h3>
  </div>
)

const Tabs = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: ({ list }) => ({ pathname: list[0].pathname }),
    effects: {
      onChange: function (event, pathname) {
        this.props.history.push(pathname)
        this.state.pathname = pathname
      },
    },
  },
  ({ effects, state: { pathname }, list }) => (
    <TabContext value={pathname}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', marginTop: '0.5em' }}>
        <TabList onChange={effects.onChange} variant='standard'>
          {list.map((tab: TabType, index) => (
            <Tab disabled={tab.disabled} key={index} label={tab.label} value={tab.pathname} />
          ))}
        </TabList>
      </Box>
      {list.map((tab: TabType) => (
        <TabPanel key={tab.pathname} value={tab.pathname}>
          {tab.component === undefined ? pageUnderConstruction : tab.component}
        </TabPanel>
      ))}
    </TabContext>
  )
)

export default withRouter(Tabs)
