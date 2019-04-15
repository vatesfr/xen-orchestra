import React, { Component } from 'react'
import data from './rrd_host_11.json'

export default class Visualization extends Component {
  render() {
    return <pre>{JSON.stringify(data, null, 2)}</pre>
  }
}
