import * as React from 'react'
import styled from '@emotion/styled'
import { HashRouter as Router, Route, Link } from 'react-router-dom'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { withStore } from 'reaclette'

const Bar = React.lazy(() => import('./Bar'))
const Foo = React.lazy(() => import('./Foo'))
const Visualization = React.lazy(() => import('./Visualization'))

const Title = styled.h1`
  color: red;
  text-align: center;
`

export default withStore(
  {
    initialState: () => ({
      objects: new Map(),
      onNotification: undefined,
    }),
    effects: {
      initialize() {
        const onNotification = notification => {
          if (notification.message === 'objects') {
            // TODO: update `objects`
          }
        }
        this.props.connection.on('notification', onNotification)
        this.state.onNotification = onNotification
      },
      finalize() {
        this.props.connection.off('notification', this.state.onNotification)
        this.state.onNotification = undefined
      },
    },
  },
  (store, props) => (
    <Router>
      <HelmetProvider>
        <Helmet>
          <title>Xen Orchestra</title>
        </Helmet>

        <Title>Xen Orchestra</Title>

        <nav>
          <ul>
            <li>
              <Link to='/'>Bar</Link>
            </li>
            <li>
              <Link to='/foo/'>Foo</Link>
            </li>
          </ul>
        </nav>

      <React.Suspense fallback='loading'>
        <Route path='/' exact component={Bar} />
        <Route path='/foo' component={Foo} />
        <Route path='/visualization' component={Visualization} />
      </React.Suspense>
    </HelmetProvider>
  </Router>
)
