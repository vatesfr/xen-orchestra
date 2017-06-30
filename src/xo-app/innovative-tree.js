import React, {Component} from 'react'
import * as d3 from 'd3'
import forEach from 'lodash/forEach'
import find from 'lodash/find'
import { createGetObjectsOfType } from 'selectors'

import { connectStore } from 'utils'

const COLORS = {
  'VM': 'green',
  host: 'red',
  pool: 'blue'
}

@connectStore(() => {
  const getVms = createGetObjectsOfType('VM')
  const getPools = createGetObjectsOfType('pool')
  const getHosts = createGetObjectsOfType('host')

  return {
    vms: getVms,
    pools: getPools,
    hosts: getHosts
  }
})
class CanvasComponent extends React.Component {
  componentDidMount = () => {
    this.updateCanvas()
  }

  componentDidUpdate = () => {
    this.updateCanvas()
  }

  constructTree = () => {
    const {hosts, pools, vms} = this.props
    const vmsGroupedByHost = []

    forEach(vms, vm => {
      const vmInformations = {id: vm.uuid, name_label: vm.name_label, object: vm, type: vm.type}
      if (vmsGroupedByHost.size === 0) {
        vmsGroupedByHost.push([{object: vm, ...vmInformations}])
      } else {
        var added = false
        forEach(vmsGroupedByHost, group => {
          if (group[0].object.$container === vm.$container) {
            group.push({object: vm, ...vmInformations})
            added = true
          }
        })
        if (!added) {
          vmsGroupedByHost.push([{object: vm, ...vmInformations}])
        }
      }
    })
    const hostArray = []
    forEach(hosts, host => {
      const children = find(vmsGroupedByHost, group => group[0].object.$container === host.uuid)
      const hostInformations = {id: host.uuid, name_label: host.name_label, object: host, type: host.type}
      if (children === undefined) {
        hostArray.push({children: [], ...hostInformations})
      } else {
        hostArray.push({children, ...hostInformations})
      }
    })
    const poolsArray = []
    forEach(pools, pool => {
      const objectPool = {id: pool.uuid, children: [], object: pool, name_label: pool.name_label, type: pool.type}
      forEach(hostArray, host => {
        if (objectPool.id === host.object.$pool) {
          objectPool.children.push(host)
        }
      })
      poolsArray.push(objectPool)
    })
    return {children: poolsArray, id: 'xoApp', name_label: 'xoApp'}
  }

  updateCanvas () {
    const context = this.refs.canvas.getContext('2d')
    const canvas = this.refs.canvas
    const width = canvas.width
    const height = canvas.height

    var root = d3.hierarchy(this.constructTree())
    var displayingText = false
    var nodes = root.descendants()
    var links = root.links()

    var simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody())
        .force('link', d3.forceLink(links).strength(1))
        .force('x', d3.forceX())
        .force('y', d3.forceY())
        .on('tick', ticked)

    d3.select(canvas)
        .call(d3.drag()
        .container(canvas)
        .subject(dragsubject)
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
        .on('mousemove', displayName)

    function ticked () {
      context.clearRect(0, 0, width, height)
      context.save()
      context.translate(width / 2, height / 2)

      context.beginPath()
      links.forEach(drawLink)
      context.strokeStyle = '#aaa'
      context.stroke()
      nodes.forEach(drawNode)
      context.restore()
    }

    function displayName () {
      const limit = 5
      const cursorX = d3.event.layerX - width / 2 - d3.event.target.offsetLeft
      const cursorY = d3.event.layerY - height / 2 - d3.event.target.offsetTop
      const node = find(nodes, n => n.x <= cursorX + limit && n.x >= cursorX - limit && n.y <= cursorY + limit && n.y >= cursorY - limit)
      if (node !== undefined && !displayingText) {
        context.fillText(node.data.name_label, 50, 50)
        displayingText = true
      } else if (node === undefined) {
        displayingText = false
        ticked()
      }
    }

    function dragsubject () {
      return simulation.find(d3.event.x - width / 2, d3.event.y - height / 2)
    }

    function dragstarted () {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart()
      d3.event.subject.fx = d3.event.subject.x
      d3.event.subject.fy = d3.event.subject.y
    }

    function dragged () {
      d3.event.subject.fx = d3.event.x
      d3.event.subject.fy = d3.event.y
    }

    function dragended () {
      if (!d3.event.active) simulation.alphaTarget(0)
      d3.event.subject.fx = null
      d3.event.subject.fy = null
    }

    function drawLink (d) {
      context.moveTo(d.source.x, d.source.y)
      context.lineTo(d.target.x, d.target.y)
    }

    function drawNode (d) {
      context.beginPath()
      if (d.data.type !== undefined) {
        context.fillStyle = COLORS[d.data.type]
      } else {
        context.fillStyle = 'black'
      }
      context.moveTo(d.x + 3, d.y)
      context.arc(d.x, d.y, 8, 0, 2 * Math.PI)
      context.fill()
    }
  }
  render () {
    return (
      <canvas ref='canvas' width={500} height={500} />
    )
  }
}

export default class InnovativeTree extends Component {
  render () {
    return (
      <div>
        <h1>Innovative Tree</h1>
        <CanvasComponent />
      </div>

    )
  }
}
