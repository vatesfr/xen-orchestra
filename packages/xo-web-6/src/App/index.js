import React, { Suspense } from 'react'
import styled from '@emotion/styled'
import { HashRouter as Router, Route, Link } from 'react-router-dom'
import { Helmet, HelmetProvider } from 'react-helmet-async'

const Bar = React.lazy(() => import('./Bar'))
const Foo = React.lazy(() => import('./Foo'))

const Title = styled.h1`
  color: red;
  text-align: center;
`

export default () => (
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

      <Suspense fallback='loading'>
        <Route path='/' exact component={Bar} />
        <Route path='/foo' component={Foo} />
      </Suspense>
    </HelmetProvider>
  </Router>
)
