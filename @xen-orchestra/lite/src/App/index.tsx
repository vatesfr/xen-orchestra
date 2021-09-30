// import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import Container from '@mui/material/Container'
import Cookies from 'js-cookie'
import CssBaseline from '@mui/material/CssBaseline'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import MenuIcon from '@mui/icons-material/Menu'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import MuiDrawer from '@mui/material/Drawer'
import React from 'react'
import styledComponent from 'styled-components'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { HashRouter as Router, Switch, Redirect, Route } from 'react-router-dom'
import { IntlProvider } from 'react-intl'
import { Map } from 'immutable'
import { styled, createTheme, ThemeProvider } from '@mui/material/styles'
import { withState } from 'reaclette'

// import Button from '../components/Button'
import Icon from '../components/Icon'
import Infrastructure from './Infrastructure'
import IntlMessage from '../components/IntlMessage'
import Link from '../components/Link'
import messagesEn from '../lang/en.json'
import PoolTab from './PoolTab'
import Signin from './Signin/index'
import StyleGuide from './StyleGuide/index'
import TabConsole from './TabConsole'
import XapiConnection, { ObjectsByType, Vm } from '../libs/xapi'

const drawerWidth = 240

interface AppBarProps extends MuiAppBarProps {
  open?: boolean
}

// -----------------------------------------------------------------------------
// Provided by this template: https://github.com/mui-org/material-ui/tree/next/docs/src/pages/getting-started/templates/dashboard

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: prop => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}))

const Drawer = styled(MuiDrawer, { shouldForwardProp: prop => prop !== 'open' })(({ theme, open }) => ({
  '& .MuiDrawer-paper': {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: 'border-box',
    ...(!open && {
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9),
      },
    }),
  },
}))

const MainListItems = (): JSX.Element => (
  <div>
    <ListItemButton component='a' href='#infrastructure'>
      <ListItemIcon>
        <Icon icon='project-diagram' />
      </ListItemIcon>
      <ListItemText primary={<IntlMessage id='infrastructure' />} />
    </ListItemButton>
    <ListItemButton component='a' href='#about'>
      <ListItemIcon>
        <Icon icon='info-circle' />
      </ListItemIcon>
      <ListItemText primary='About' />
    </ListItemButton>
  </div>
)

interface SecondaryListItemsParentState {}

interface SecondaryListItemsState {}

interface SecondaryListItemsProps {}

interface SecondaryListItemsParentEffects {}

interface SecondaryListItemsEffects {
  disconnect: () => void
}

interface SecondaryListItemsComputed {}

const ICON_STYLE = { fontSize: '1.5em' }

const SecondaryListItems = withState<
  SecondaryListItemsState,
  SecondaryListItemsProps,
  SecondaryListItemsEffects,
  SecondaryListItemsComputed,
  SecondaryListItemsParentState,
  SecondaryListItemsParentEffects
>({}, ({ effects }) => (
  <div>
    <ListItem button onClick={() => effects.disconnect()}>
      <ListItemIcon style={ICON_STYLE}>
        <Icon icon='sign-out-alt' />
      </ListItemIcon>
      <ListItemText primary={<IntlMessage id='disconnect' />} />
    </ListItem>
  </div>
))

// -----------------------------------------------------------------------------

const mdTheme = createTheme()

const FullPage = styledComponent.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
`

interface ParentState {
  objectsByType: ObjectsByType
  xapi: XapiConnection
}

interface State {
  connected: boolean
  drawerOpen: boolean
  error: React.ReactNode
  xapiHostname: string
}

interface Props {}

interface ParentEffects {}

interface Effects {
  connectToXapi: (password: string, rememberMe: boolean) => void
  disconnect: () => void
  toggleDrawer: () => void
}

interface Computed {
  objectsFetched: boolean
  url: string
  vms?: Map<string, Vm>
}

const App = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      connected: Cookies.get('sessionId') !== undefined,
      drawerOpen: false,
      error: '',
      objectsByType: undefined,
      xapi: undefined,
      xapiHostname: process.env.XAPI_HOST || window.location.host,
    }),
    effects: {
      initialize: async function () {
        const xapi = (this.state.xapi = new XapiConnection())

        xapi.on('connected', () => {
          this.state.connected = true
        })

        xapi.on('disconnected', () => {
          this.state.connected = false
        })

        xapi.on('objects', (objectsByType: ObjectsByType) => {
          this.state.objectsByType = objectsByType
        })

        try {
          await xapi.reattachSession(this.state.url)
        } catch (err) {
          if (err?.code !== 'SESSION_INVALID') {
            throw err
          }

          console.log('Session ID is invalid. Asking for credentials.')
        }
      },
      toggleDrawer: function () {
        this.state.drawerOpen = !this.state.drawerOpen
      },
      connectToXapi: async function (password, rememberMe = false) {
        try {
          await this.state.xapi.connect({
            url: this.state.url,
            user: 'root',
            password,
            rememberMe,
          })
        } catch (err) {
          if (err?.code !== 'SESSION_AUTHENTICATION_FAILED') {
            throw err
          }

          this.state.error = <IntlMessage id='badCredentials' />
        }
      },
      disconnect: async function () {
        await this.state.xapi.disconnect()
        this.state.connected = false
      },
    },
    computed: {
      objectsFetched: state => state.objectsByType !== undefined,
      vms: state =>
        state.objectsFetched
          ? state.objectsByType
              ?.get('VM')
              ?.filter((vm: Vm) => !vm.is_control_domain && !vm.is_a_snapshot && !vm.is_a_template)
          : undefined,
      url: state => `${window.location.protocol}//${state.xapiHostname}`,
    },
  },
  ({ effects, state }) => (
    <IntlProvider messages={messagesEn} locale='en'>
      {!state.connected ? (
        <Signin />
      ) : !state.objectsFetched ? (
        <IntlMessage id='loading' />
      ) : (
        <>
          <Router>
            <Switch>
              <Route exact path='/'>
                <Redirect to='/infrastructure' />
              </Route>
              <Route exact path='/vm-list'>
                {state.vms !== undefined && (
                  <>
                    <p>There are {state.vms.size} VMs!</p>
                    <ul>
                      {state.vms.valueSeq().map((vm: Vm) => (
                        <li key={vm.$id}>
                          <Link to={vm.$id}>
                            {vm.name_label} - {vm.name_description} ({vm.power_state})
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Route>
              <Route exact path='/styleguide'>
                <StyleGuide />
              </Route>
              <Route exact path='/pool'>
                <PoolTab />
              </Route>
              <Route path='/'>
                {/* Provided by this template: https://github.com/mui-org/material-ui/tree/next/docs/src/pages/getting-started/templates/dashboard */}
                <ThemeProvider theme={mdTheme}>
                  <Box sx={{ display: 'flex' }}>
                    <CssBaseline />
                    <AppBar position='absolute' open={state.drawerOpen}>
                      <Toolbar
                        sx={{
                          pr: '24px', // keep right padding when drawer closed
                        }}
                      >
                        <IconButton
                          edge='start'
                          color='inherit'
                          aria-label='open drawer'
                          onClick={effects.toggleDrawer}
                          sx={{
                            marginRight: '36px',
                            ...(state.drawerOpen && { display: 'none' }),
                          }}
                        >
                          <MenuIcon />
                        </IconButton>
                        <Typography component='h1' variant='h6' color='inherit' noWrap sx={{ flexGrow: 1 }}>
                          <Switch>
                            <Route path='/infrastructure'>
                              <IntlMessage id='infrastructure' />
                            </Route>
                            <Route path='/about'>
                              <IntlMessage id='about' />
                            </Route>
                            <Route>
                              <IntlMessage id='notFound' />
                            </Route>
                          </Switch>
                        </Typography>
                        {/* <IconButton color='inherit'>
                                <Badge badgeContent={4} color='secondary'>
                                  <NotificationsIcon />
                                </Badge>
                              </IconButton> */}
                      </Toolbar>
                    </AppBar>
                    <Drawer variant='permanent' open={state.drawerOpen}>
                      <Toolbar
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          px: [1],
                        }}
                      >
                        <IconButton onClick={effects.toggleDrawer}>
                          <ChevronLeftIcon />
                        </IconButton>
                      </Toolbar>
                      <Divider />
                      <List>
                        <MainListItems />
                      </List>
                      <Divider />
                      <List>
                        <SecondaryListItems />
                      </List>
                    </Drawer>
                    <Box
                      component='main'
                      sx={{
                        backgroundColor: theme =>
                          theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
                        flexGrow: 1,
                        height: '100vh',
                        overflow: 'auto',
                      }}
                    >
                      <Switch>
                        <Route path='/infrastructure'>
                          <FullPage>
                            <Toolbar />
                            <Infrastructure />
                          </FullPage>
                        </Route>
                        <Route path='/about'>
                          <Toolbar />
                          <Container maxWidth='lg' sx={{ mt: 4, mb: 4 }}>
                            <p>
                              Check out{' '}
                              <Link to='https://xen-orchestra.com/blog/xen-orchestra-lite/'>Xen Orchestra Lite</Link>{' '}
                              dev blog.
                            </p>
                            <p>
                              <IntlMessage id='versionValue' values={{ version: process.env.NPM_VERSION }} />
                            </p>
                          </Container>
                        </Route>
                        <Route>
                          <Toolbar />
                          <IntlMessage id='pageNotFound' />
                        </Route>
                      </Switch>
                    </Box>
                  </Box>
                </ThemeProvider>
              </Route>
            </Switch>
          </Router>
        </>
      )}
    </IntlProvider>
  )
)

export default App
