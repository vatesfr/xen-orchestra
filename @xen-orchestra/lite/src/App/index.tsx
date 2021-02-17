import React from 'react'
import { injectState, provideState } from 'reaclette'
import { HashRouter as Router, Switch, Route, Link } from 'react-router-dom'
import { IntlProvider } from 'react-intl'

import './style.css'
import messagesEn from '../lang/en.json'
import Signin from './Signin/index'
import Console from '../components/Console'
import XapiConnection, { ObjectsByType, Vm } from '../libs/xapi'
import { EffectContext, RenderParams, State } from '../../types/reaclette'

const App = [
  provideState({
    initialState: () => ({
      connected: false,
      objectsByType: undefined,
      xapiHostname: process.env.XAPI_HOST || window.location.host,
      xapi: undefined,
    }),
    effects: {
      connectToXapi: function (this: EffectContext, password: string) {
        const xapi = new XapiConnection()
        this.state.xapi = xapi

        xapi.onConnect(status => {
          this.state.connected = true
          console.log('Connected to XAPI!', status)
        })

        xapi.onObjects((objectsByType: ObjectsByType) => {
          this.state.objectsByType = objectsByType
        })

        xapi.connect({
          url: `${window.location.protocol}//${this.state.xapiHostname}`,
          user: 'root',
          password,
        })
      },
    },
    computed: {
      objectsFetched: (state: State) => state.objectsByType !== undefined,
      vms: (state: State) =>
        state.objectsFetched &&
        state.objectsByType.get('VM').filter((vm: Vm) => !vm.is_control_domain && !vm.is_a_snapshot && !vm.is_a_template),
    },
  }),
  injectState,
  ({ state }: RenderParams) => (
    <IntlProvider messages={messagesEn} locale='en'>
      {!state.connected || !state.objectsFetched ? (
        <Signin />
      ) : (
        <Router>
          <Switch>
            <Route path='/about'>About page</Route>
            <Route exact path='/'>
              <p>There are {state.objectsByType.size || 0} types!</p>
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
            <Route path='/:id' render={({ match }) => <Console vmId={match.params.id} />} />
          </Switch>
        </Router>
      )}
    </IntlProvider>
  ),
].reduceRight((value, fn) => fn(value))

export default App
