import React, { Component } from 'react'
import {
  XAxis,
  YAxis,
  AreaChart,
  //Area,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import moment, { max } from 'moment'

import { Area, Brush, CartesianGrid } from 'recharts'
import dataJson from './dump.json'
import dataJson2 from './dump2.json'
import { any, string } from 'prop-types'
import { statement } from '@babel/template'

import Xo from 'xo-lib'
import { removeProperties } from '@babel/types'
import { setTimeout } from 'timers'
import { start } from 'repl'
import { getMaxListeners } from 'cluster'
import { stackOffsetNone, stackOffsetSilhouette, stack } from 'd3-shape'
import { cpus } from 'os'

const NB_VALUES = 118

const xo = new Xo({ url: '/' })
xo.open().then(() => xo.signIn({ email: 'admin@admin.net', password: 'admin' }))
const signedIn = new Promise(resolve => xo.once('authenticated', resolve))
const xoCall = (method, params) => signedIn.then(() => xo.call(method, params))

export default class Visualization extends Component<any, any> {
  state: any = {
    dataCpuVm1: [],
    propCpusVm1: [],

    dataCpuVm2: [],
    propCpusVm2: [],

    propCpusRX: [],
    propCpusTX: [],

    granularity: 'seconds',
    format: 'LTS',
    startIndexCpuVm: 0,
    endIndexCpuVm: 0,

    dataXvds: [],
    propXvds: [],
    propXvdsR: [],

    dataXvds2: [],
    propXvds2: [],
    propXvdsR2: [],

    dataVifs: [],
    dataVifs2: [],
    startIndexNetworkVm: 0,
    endIndexNetworkVm: 0,
    propVifs: [],
    propVifsR: [],

    propVifs2: [],
    propVifsR2: [],

    //host
    dataHostCpu: [],
    propHostCpus: [],

    startIndexCpuHost: 0,
    endIndexCpuHost: 0,
    maxCpuVM1: 0,
    maxCpuVM2: 0,
    maxValue: 0,
    click: true,

    maxVifTxVM1: 0,
    maxVifRxVM1: 0,
    maxVifVM1: 0,
    maxVifTxVM2: 0,
    maxVifRxVM2: 0,
    maxVifVM2: 0,
    maxVif: 0,
  }

  componentDidMount() {
    setInterval(this.fetchVmStats1.bind(this), 5e3)
    setInterval(this.fetchVmStats2.bind(this), 5e3)
  }

  setTime = (event: any) => {
    this.setState({ granularity: event.target.value })
  }

  //days, hours, minutes, seconds
  fetchVmStats1 = () => {
    xoCall('vm.stats', {
      id: '28851ef6-951c-08bc-a5be-8898e2a31b7a',
      granularity: this.state.granularity,
    }).then(
      ({
        endTimestamp,
        stats: { cpus },
        interval,
        stats: { memory },
        stats: { xvds },
        stats: { vifs },
      }) => {
        //let interval =this.getHours()
        let start = endTimestamp - NB_VALUES * 5 * 1000

        this.setState({ propXvds: Object.keys(xvds.w) })
        this.setState({ propXvdsR: Object.keys(xvds.r) })

        this.setState({ propCpusVm1: Object.keys(cpus) })

        this.setState({ propVifs: Object.keys(vifs.tx) })
        this.setState({ propVifsR: Object.keys(vifs.rx) })

        const dataXvds: any[] = []
        const dataCpuVm1: any[] = []
        const result: any[] = []
        const dataVifs: any[] = []
        for (var i = 0; i < NB_VALUES; i++) {
          result[i] = 0
          for (var j = 0; j < this.state.propCpusVm1.length; j++) {
            result[i] += cpus[j][i] / this.state.propCpusVm1.length
          }
        }

        for (var i = 0; i < NB_VALUES; i++) {
          const tmpValueTx: any = {}
          const tmpValueCpu: any = {}
          const tmpValueVifs: any = {}

          tmpValueTx.time = start += 5
          tmpValueCpu.cpu = tmpValueTx.time
          tmpValueCpu.cpu = result

          this.state.propXvds.forEach((property: string | number) => {
            tmpValueTx[`xvds_w_${property}`] = xvds.w[property][i]
          })

          this.state.propXvdsR.forEach((property: string | number) => {
            tmpValueTx[`xvds_r_${property}`] = xvds.r[property][i]
          })

          this.state.propVifs.forEach((property: string | number) => {
            tmpValueVifs[`vifs_tx_${property}`] = vifs.tx[property][i]
          })

          this.state.propVifsR.forEach((property: string | number) => {
            tmpValueVifs[`vifs_rx_${property}`] = vifs.rx[property][i]
          })

          dataVifs.push(tmpValueVifs)

          dataCpuVm1.push(tmpValueCpu)
          dataXvds.push(tmpValueTx)
        }

        for (var i = 0; i < this.state.propXvds.length; i++) {
          this.state.propXvds.forEach((property: string | number) => {
            this.state.maxVifTxVM1 = Math.max(...xvds.w[property])
          })
        }

        for (var i = 0; i < this.state.propXvdsR.length; i++) {
          this.state.propXvdsR.forEach((property: string | number) => {
            this.state.maxVifRxVM1 = Math.max(...xvds.r[property])
          })
        }

        for (var i = 0; i < this.state.propVifs.length; i++) {
          this.state.propVifs.forEach((property: string | number) => {
            this.state.maxVTxVM1 = Math.max(...vifs.tx[property])
          })
        }

        for (var i = 0; i < this.state.propVifsR.length; i++) {
          this.state.propVifsR.forEach((property: string | number) => {
            this.state.maxVRxVM1 = Math.max(...vifs.rx[property])
          })
        }

        this.state.maxVifVM1 = Math.max(
          this.state.maxVifTxVM1,
          this.state.maxVifRxVM1
        )
        this.state.maxVVM1 = Math.max(
          this.state.maxVTxVM1,
          this.state.maxVRxVM1
        )

        console.log('txx', this.state.maxVTxVM1)
        console.log('rx', this.state.maxVRxVM1)
        console.log('maxx', this.state.maxVVM1)

        this.setState({ dataXvds, dataCpuVm1, dataVifs })
      }
    )
  }

  fetchVmStats2 = () => {
    xoCall('vm.stats', {
      id: '8c05611a-0f25-948e-dc1a-49329576866d',
      granularity: this.state.granularity,
    }).then(
      ({ endTimestamp, stats: { vifs }, stats: { cpus }, stats: { xvds } }) => {
        //let interval =this.getHours()
        let start = endTimestamp - NB_VALUES * 5 * 1000

        this.setState({ propXvds2: Object.keys(xvds.w) })
        this.setState({ propXvdsR2: Object.keys(xvds.r) })

        this.setState({ propCpusVm2: Object.keys(cpus) })

        this.setState({ propVifs2: Object.keys(vifs.tx) })
        this.setState({ propVifsR2: Object.keys(vifs.rx) })

        const dataXvds2: any[] = []

        const dataCpuVm2: any[] = []

        const dataVifs2: any[] = []
        const result: any[] = []
        for (var i = 0; i < NB_VALUES; i++) {
          result[i] = 0
          for (var j = 0; j < this.state.propCpusVm2.length; j++) {
            result[i] += cpus[j][i] / this.state.propCpusVm2.length
          }
        }
        for (var i = 0; i < NB_VALUES; i++) {
          const tmpValueTx: any = {}
          const tmpValueCpu: any = {}
          const tmpValueVifs: any = {}
          tmpValueTx.time = start += 5

          tmpValueCpu.time = tmpValueTx.time
          tmpValueVifs.time = tmpValueTx.time

          tmpValueCpu.cpu = result

          this.state.propXvds2.forEach((property: string | number) => {
            tmpValueTx[`xvds_w_${property}`] = xvds.w[property][i]
          })

          this.state.propXvdsR2.forEach((property: string | number) => {
            tmpValueTx[`xvds_r_${property}`] = xvds.r[property][i]
          })

          this.state.propVifs2.forEach((property: string | number) => {
            tmpValueVifs[`vifs_tx_${property}`] = vifs.tx[property][i]
          })

          this.state.propVifsR2.forEach((property: string | number) => {
            tmpValueVifs[`vifs_rx_${property}`] = vifs.rx[property][i]
          })

          dataVifs2.push(tmpValueVifs)
          dataCpuVm2.push(tmpValueCpu)
          dataXvds2.push(tmpValueTx)
        }

        for (var i = 0; i < this.state.propXvds2.length; i++) {
          this.state.propXvds2.forEach((property: string | number) => {
            this.state.maxVifTxVM2 = Math.max(...xvds.w[property])
          })
        }

        for (var i = 0; i < this.state.propXvds2.length; i++) {
          this.state.propXvdsR2.forEach((property: string | number) => {
            this.state.maxVifRxVM2 = Math.max(...xvds.r[property])
          })
        }

        for (var i = 0; i < this.state.propVifs2.length; i++) {
          this.state.propVifs2.forEach((property: string | number) => {
            this.state.maxVTxVM2 = Math.max(...vifs.tx[property])
          })
        }

        for (var i = 0; i < this.state.propVifsR2.length; i++) {
          this.state.propVifsR2.forEach((property: string | number) => {
            this.state.maxVRxVM2 = Math.max(...vifs.rx[property])
          })
        }

        this.state.maxVifVM2 = Math.max(
          this.state.maxVifTxVM2,
          this.state.maxVifRxVM2
        )
        this.state.maxVVM2 = Math.max(
          this.state.maxVTxVM2,
          this.state.maxVRxVM2
        )

        this.setState({ dataXvds2, dataCpuVm2, dataVifs2 })
      }
    )
  }

  setMaxValueXvds = () => {
    if (this.state.click) {
      if (this.state.maxVifVM1 < 1000000 && this.state.maxVifVM2 < 1000000) {
        this.state.maxVif = 1000000
        this.state.click = false
      } else {
        this.state.maxVif = Math.max(this.state.maxVifVM1, this.state.maxVifVM2)

        this.state.click = false
      }
    } else {
      this.state.maxVif = 0

      this.state.click = true
    }
  }

  setMaxValueVifs = () => {
    if (this.state.click) {
      if (this.state.maxVVM1 < 1000000 && this.state.maxVVM2 < 1000000) {
        this.state.maxV = 1000000
        this.state.click = false
      } else {
        this.state.maxV = Math.max(this.state.maxVVM1, this.state.maxVVM2)

        this.state.click = false
      }
    } else {
      this.state.maxV = 0
      this.state.click = true
    }
  }
  render() {
    return (
      <div>
        <div>
          <form>
            <select onChange={this.setTime} value={this.state.granularity}>
              <option value='seconds'>Last 5 secondes</option>
              <option value='minutes'>Last 10 minutes</option>
              <option value='hours'>Last 2 hours</option>
              <option value='days'>Last year</option>
            </select>
          </form>
        </div>
        <div>
          <button onClick={this.setMaxValueXvds}>Synchronize scale xvds</button>
          <button onClick={this.setMaxValueVifs}>Synchronize scale vifs</button>
        </div>

        <VuCpuStatsVM1
          dataXvds={this.state.dataXvds}
          propXvds={this.state.propXvds}
          propXvdsR={this.state.propXvdsR}
          maxVif={this.state.maxVif}
        />
        <VuCpuStatsVM2
          dataXvds2={this.state.dataXvds2}
          propXvds2={this.state.propXvds2}
          propXvdsR2={this.state.propXvdsR2}
          maxVif={this.state.maxVif}
        />
        <VuCpuStatsssVM1
          dataCpuVm1={this.state.dataCpuVm1}
          propCpusVm1={this.state.propCpusVm1}
        />
        <VuCpuStatsssVM2
          dataCpuVm2={this.state.dataCpuVm2}
          propCpusVm2={this.state.propCpusVm2}
        />
        <VuVifsStatsVM1
          dataVifs={this.state.dataVifs}
          propVifs={this.state.propVifs}
          propVifsR={this.state.propVifsR}
          maxV={this.state.maxV}
        />

        <VuVifStatsVM2
          dataVifs2={this.state.dataVifs2}
          propVifs2={this.state.propVifs2}
          propVifsR2={this.state.propVifsR2}
          maxV={this.state.maxV}
        />
      </div>
    )
  }
}

class VuCpuStatsVM1 extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    maxVif: 0,
  }

  render() {
    const allColors = [
      '#493BD8',
      '#ADD83B',
      '#D83BB7',
      '#3BC1D8',
      '#aabd8a',
      '#667772',
      '#FA8072',
      '#800080',
      '#00FF00',
      '#8abda7',
    ]
    const colors = [
      '#cee866',
      '#6f9393',
      '#bb97cd',
      '#8778db',
      '#2f760b',
      '#a9578a',
      '#C0C0C0',
      '#000080',
      '#000000',
      '#800000',
    ]

    return (
      <div>
        <div>Disk throughput Vm1</div>
        <div>
          <AreaChart
            width={400}
            height={100}
            data={this.props.dataXvds}
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis domain={[0, this.props.maxVif]} hide={true} />
            <Legend iconType='rect' iconSize={10} />
            {this.props.propXvds
              .map((currProperty: any) => `xvds_w_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={allColors[index]}
                  fill={allColors[index]}
                />
              ))}
            {this.props.propXvdsR
              .map((currProperty: any) => `xvds_r_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={colors[index]}
                  fill={colors[index]}
                />
              ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VuCpuStatsVM2 extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    maxVif: 0,
  }

  render() {
    const allColors = [
      '#493BD8',
      '#ADD83B',
      '#D83BB7',
      '#3BC1D8',
      '#aabd8a',
      '#667772',
      '#FA8072',
      '#800080',
      '#00FF00',
      '#8abda7',
    ]
    const colors = [
      '#cee866',
      '#6f9393',
      '#bb97cd',
      '#8778db',
      '#2f760b',
      '#a9578a',
      '#C0C0C0',
      '#000080',
      '#000000',
      '#800000',
    ]

    return (
      <div>
        <div>Disk throughput Vm2</div>
        <div>
          <AreaChart
            width={400}
            height={100}
            data={this.props.dataXvds2}
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis domain={[0, this.props.maxVif]} hide={true} />
            <Legend iconType='rect' iconSize={10} />
            {this.props.propXvds2
              .map((currProperty: any) => `xvds_w_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={allColors[index]}
                  fill={allColors[index]}
                />
              ))}
            {this.props.propXvdsR2
              .map((currProperty: any) => `xvds_r_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={colors[index]}
                  fill={colors[index]}
                />
              ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VuCpuStatsssVM1 extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    maxValue: 0,
  }

  render() {
    const allColors = [
      '#493BD8',
      '#ADD83B',
      '#D83BB7',
      '#3BC1D8',
      '#aabd8a',
      '#667772',
      '#FA8072',
      '#800080',
      '#00FF00',
      '#8abda7',
    ]

    return (
      <div>
        <div>
          <h2>CPU Usage VM1 </h2>
        </div>

        <div>
          <div> {this.props.propCpusVm1.length} X CPU (%)</div>
          <AreaChart
            width={400}
            height={100}
            data={this.props.dataCpuVm1}
            syncId='anyId'
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis domain={[0, 100]} hide={true} />

            <Area
              connectNulls
              isAnimationActive={false}
              type='monotone'
              dataKey='cpu'
              stroke={'blue'}
              fill={'blue'}
            />
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VuCpuStatsssVM2 extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    maxValue: 0,
  }

  render() {
    const allColors = [
      '#493BD8',
      '#ADD83B',
      '#D83BB7',
      '#3BC1D8',
      '#aabd8a',
      '#667772',
      '#FA8072',
      '#800080',
      '#00FF00',
      '#8abda7',
    ]

    return (
      <div>
        <div>
          <h2>CPU Usage VM2 </h2>
        </div>

        <div>
          <div> {this.props.propCpusVm2.length} X CPU (%)</div>
          <AreaChart
            width={400}
            height={100}
            data={this.props.dataCpuVm2}
            syncId='anyId'
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis domain={[0, 100]} hide={true} />

            <Area
              connectNulls
              isAnimationActive={false}
              type='monotone'
              dataKey='cpu'
              stroke={'blue'}
              fill={'blue'}
            />
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VuVifsStatsVM1 extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    maxVif: 0,
  }

  render() {
    const allColors = [
      '#493BD8',
      '#ADD83B',
      '#D83BB7',
      '#3BC1D8',
      '#aabd8a',
      '#667772',
      '#FA8072',
      '#800080',
      '#00FF00',
      '#8abda7',
    ]
    const colors = [
      '#cee866',
      '#6f9393',
      '#bb97cd',
      '#8778db',
      '#2f760b',
      '#a9578a',
      '#C0C0C0',
      '#000080',
      '#000000',
      '#800000',
    ]

    return (
      <div>
        <div>Network throughput Vm1</div>
        <div>
          <AreaChart
            width={400}
            height={100}
            data={this.props.dataVifs}
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis domain={[0, this.props.maxV]} hide={true} />
            <Legend iconType='rect' iconSize={10} />
            {this.props.propVifs
              .map((currProperty: any) => `vifs_tx_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={allColors[index]}
                  fill={allColors[index]}
                />
              ))}
            {this.props.propVifsR
              .map((currProperty: any) => `vifs_rx_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={colors[index]}
                  fill={colors[index]}
                />
              ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}

class VuVifStatsVM2 extends Component<any, any> {
  state: any = {
    granularity: 'seconds',
    format: 'LTS',
    maxVif: 0,
  }

  render() {
    const allColors = [
      '#493BD8',
      '#ADD83B',
      '#D83BB7',
      '#3BC1D8',
      '#aabd8a',
      '#667772',
      '#FA8072',
      '#800080',
      '#00FF00',
      '#8abda7',
    ]
    const colors = [
      '#cee866',
      '#6f9393',
      '#bb97cd',
      '#8778db',
      '#2f760b',
      '#a9578a',
      '#C0C0C0',
      '#000080',
      '#000000',
      '#800000',
    ]

    return (
      <div>
        <div>Network throughput Vm2</div>
        <div>
          <AreaChart
            width={400}
            height={100}
            data={this.props.dataVifs2}
            margin={{
              top: 5,
              right: 20,
              left: 90,
              bottom: 5,
            }}
          >
            <YAxis domain={[0, this.props.maxVif]} hide={true} />
            <Legend iconType='rect' iconSize={10} />
            {this.props.propVifs2
              .map((currProperty: any) => `vifs_tx_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={allColors[index]}
                  fill={allColors[index]}
                />
              ))}
            {this.props.propVifsR2
              .map((currProperty: any) => `vifs_rx_${currProperty}`)
              .map((property: any, index: any) => (
                <Area
                  connectNulls
                  isAnimationActive={false}
                  type='monotone'
                  dataKey={property}
                  stroke={colors[index]}
                  fill={colors[index]}
                />
              ))}
          </AreaChart>
        </div>
      </div>
    )
  }
}
