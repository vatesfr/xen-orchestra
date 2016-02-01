import angular from 'angular'
import Bluebird from 'bluebird'
import uiRouter from 'angular-ui-router'
import filter from 'lodash.filter'
import find from 'lodash.find'
import forEach from 'lodash.foreach'
import sortBy from 'lodash.sortby'

import xoApi from 'xo-api'
import xoHorizon from'xo-horizon'
import xoServices from 'xo-services'

import xoWeekHeatmap from'xo-week-heatmap'

import view from './view'

export default angular.module('dashboard.stats', [
  uiRouter,
  xoApi,
  xoHorizon,
  xoServices,
  xoWeekHeatmap
])
  .config(function ($stateProvider) {
    $stateProvider.state('dashboard.stats', {
      controller: 'stats as bigController',
      data: {
        requireAdmin: true
      },
      url: '/stats',
      template: view
    })
  })

  .filter('type', () => {
    return function (objects, type) {
      if (!type) {
        return objects
      }
      return filter(objects, object => object.type === type)
    }
  })
  .controller('stats', function () {})
  .controller('statsHeatmap', function (xoApi, xo, xoAggregate, notify, bytesToSizeFilter) {
    this.charts = {
      heatmap: null
    }
    this.objects = xoApi.all

    this.prepareTypeFilter = function (selection) {
      const object = selection[0]
      this.typeFilter = object && object.type || undefined
    }

    this.selectAll = function (type) {
      this.selected = filter(this.objects, object =>
                             (object.type === type && object.power_state === 'Running'))
      this.typeFilter = type
    }

    this.prepareMetrics = function (objects) {
      this.chosen = objects && objects.slice()
      this.metrics = undefined
      this.selectedMetric = undefined

      if (this.chosen && this.chosen.length) {
        this.loadingMetrics = true

        const statPromises = []
        forEach(this.chosen, object => {
          const apiType = (object.type === 'host' && 'host') || (object.type === 'VM' && 'vm') || undefined
          if (!apiType) {
            notify.error({
              title: 'Unhandled object ' + (objects.name_label || ''),
              message: 'There is no stats available for this type of objects'
            })
            object._ignored = true
          } else {
            delete object._ignored
            statPromises.push(
              xo[apiType].refreshStats(object.id, 'hours') // hours granularity (7 * 24 hours)
              .then(result => {
                if (result.stats === undefined) {
                  object._ignored = true
                  throw new Error('No stats')
                }

                return {object, result}
              })
              .catch(error => {
                error.object = object
                object._ignored = true
                throw error
              })
            )
          }
        })

        Bluebird.settle(statPromises)
        .then(stats => {
          const averageMetrics = {}
          let averageObjectLayers = {}
          let averageCPULayers = 0

          forEach(stats, statePromiseInspection => { // One object...
            if (statePromiseInspection.isRejected()) {
              notify.warning({
                title: 'Error fetching stats',
                message: 'Metrics do not include ' + statePromiseInspection.reason().object.name_label
              })
            } else if (statePromiseInspection.isFulfilled()) {
              const {object, result} = statePromiseInspection.value()

              // Make date array
              result.stats.date = []
              let timestamp = result.endTimestamp

              for (let i = result.stats.memory.length - 1; i >= 0; i--) {
                result.stats.date.unshift(timestamp)
                timestamp -= 3600
              }

              const averageCPU = averageMetrics['All CPUs'] && averageMetrics['All CPUs'].values || []
              forEach(result.stats.cpus, (values, metricKey) => { // Every CPU metric of this object
                metricKey = 'CPU ' + metricKey
                averageObjectLayers[metricKey] !== undefined || (averageObjectLayers[metricKey] = 0)
                averageObjectLayers[metricKey]++
                averageCPULayers++

                const mapValues = averageMetrics[metricKey] && averageMetrics[metricKey].values || [] // already fed or not
                forEach(values, (value, key) => {
                  if (mapValues[key] === undefined) { // first value
                    mapValues.push({
                      value: +value,
                      date: +result.stats.date[key] * 1000
                    })
                  } else { // average with previous
                    mapValues[key].value = ((mapValues[key].value || 0) * (averageObjectLayers[metricKey] - 1) + (+value)) / averageObjectLayers[metricKey]
                  }

                  if (averageCPU[key] === undefined) { // first overall value
                    averageCPU.push({
                      value: +value,
                      date: +result.stats.date[key] * 1000
                    })
                  } else { // average with previous overall value
                    averageCPU[key].value = (averageCPU[key].value * (averageCPULayers - 1) + value) / averageCPULayers
                  }
                })
                averageMetrics[metricKey] = {
                  key: metricKey,
                  values: mapValues
                }
              })
              averageMetrics['All CPUs'] = {
                key: 'All CPUs',
                values: averageCPU
              }

              forEach(result.stats.vifs, (vif, vifType) => {
                const rw = (vifType === 'rx') ? 'out' : 'in'

                forEach(vif, (values, metricKey) => {
                  metricKey = 'Network ' + metricKey + ' ' + rw
                  averageObjectLayers[metricKey] !== undefined || (averageObjectLayers[metricKey] = 0)
                  averageObjectLayers[metricKey]++

                  const mapValues = averageMetrics[metricKey] && averageMetrics[metricKey].values || [] // already fed or not

                  forEach(values, (value, key) => {
                    if (mapValues[key] === undefined) { // first value
                      mapValues.push({
                        value: +value,
                        date: +result.stats.date[key] * 1000
                      })
                    } else { // average with previous
                      mapValues[key].value = ((mapValues[key].value || 0) * (averageObjectLayers[metricKey] - 1) + (+value)) / averageObjectLayers[metricKey]
                    }
                  })

                  averageMetrics[metricKey] = {
                    key: metricKey,
                    values: mapValues,
                    filter: bytesToSizeFilter
                  }
                })
              })

              forEach(result.stats.pifs, (pif, pifType) => {
                const rw = (pifType === 'rx') ? 'out' : 'in'

                forEach(pif, (values, metricKey) => {
                  metricKey = 'NIC ' + metricKey + ' ' + rw
                  averageObjectLayers[metricKey] !== undefined || (averageObjectLayers[metricKey] = 0)
                  averageObjectLayers[metricKey]++

                  const mapValues = averageMetrics[metricKey] && averageMetrics[metricKey].values || [] // already fed or not
                  forEach(values, (value, key) => {
                    if (mapValues[key] === undefined) { // first value
                      mapValues.push({
                        value: +value,
                        date: +result.stats.date[key] * 1000
                      })
                    } else { // average with previous
                      mapValues[key].value = ((mapValues[key].value || 0) * (averageObjectLayers[metricKey] - 1) + (+value)) / averageObjectLayers[metricKey]
                    }
                  })
                  averageMetrics[metricKey] = {
                    key: metricKey,
                    values: mapValues,
                    filter: bytesToSizeFilter
                  }
                })
              })

              forEach(result.stats.xvds, (xvd, xvdType) => {
                const rw = (xvdType === 'r') ? 'read' : 'write'

                forEach(xvd, (values, metricKey) => {
                  metricKey = 'Disk ' + metricKey + ' ' + rw
                  averageObjectLayers[metricKey] !== undefined || (averageObjectLayers[metricKey] = 0)
                  averageObjectLayers[metricKey]++

                  const mapValues = averageMetrics[metricKey] && averageMetrics[metricKey].values || [] // already fed or not
                  forEach(values, (value, key) => {
                    if (mapValues[key] === undefined) { // first value
                      mapValues.push({
                        value: +value,
                        date: +result.stats.date[key] * 1000
                      })
                    } else { // average with previous
                      mapValues[key].value = ((mapValues[key].value || 0) * (averageObjectLayers[metricKey] - 1) + (+value)) / averageObjectLayers[metricKey]
                    }
                  })
                  averageMetrics[metricKey] = {
                    key: metricKey,
                    values: mapValues,
                    filter: bytesToSizeFilter
                  }
                })
              })

              if (result.stats.load) {
                const metricKey = 'Load average'
                averageObjectLayers[metricKey] !== undefined || (averageObjectLayers[metricKey] = 0)
                averageObjectLayers[metricKey]++

                const mapValues = averageMetrics[metricKey] && averageMetrics[metricKey].values || [] // already fed or not
                forEach(result.stats.load, (value, key) => {
                  if (mapValues[key] === undefined) { // first value
                    mapValues.push({
                      value: +value,
                      date: +result.stats.date[key] * 1000
                    })
                  } else { // average with previous
                    mapValues[key].value = ((mapValues[key].value || 0) * (averageObjectLayers[metricKey] - 1) + (+value)) / averageObjectLayers[metricKey]
                  }
                })
                averageMetrics[metricKey] = {
                  key: metricKey,
                  values: mapValues
                }
              }

              if (result.stats.memoryUsed) {
                const metricKey = 'RAM Used'
                averageObjectLayers[metricKey] !== undefined || (averageObjectLayers[metricKey] = 0)
                averageObjectLayers[metricKey]++

                const mapValues = averageMetrics[metricKey] && averageMetrics[metricKey].values || [] // already fed or not
                forEach(result.stats.memoryUsed, (value, key) => {
                  if (mapValues[key] === undefined) { // first value
                    mapValues.push({
                      value: +value * (object.type === 'host' ? 1024 : 1),
                      date: +result.stats.date[key] * 1000
                    })
                  } else { // average with previous
                    mapValues[key].value = ((mapValues[key].value || 0) * (averageObjectLayers[metricKey] - 1) + (+value)) / averageObjectLayers[metricKey]
                  }
                })
                averageMetrics[metricKey] = {
                  key: metricKey,
                  values: mapValues,
                  filter: bytesToSizeFilter
                }
              }
            }
          })

          this.metrics = sortBy(averageMetrics, (_, key) => key)
          this.loadingMetrics = false
        })
      }
    }
  })
  .controller('statsHorizons', function ($scope, xoApi, xoAggregate, xo, $timeout) {
    let ctrl, stats
    ctrl = this

    ctrl.synchronizescale = true
    ctrl.objects = xoApi.all
    ctrl.chosen = []
    this.prepareTypeFilter = function (selection) {
      const object = selection[0]
      ctrl.typeFilter = object && object.type || undefined
    }

    this.selectAll = function (type) {
      ctrl.selected = filter(ctrl.objects, object =>
                             (object.type === type && object.power_state === 'Running'))
      ctrl.typeFilter = type
    }

    this.prepareMetrics = function (objects) {
      ctrl.chosen = objects
      ctrl.selectedMetric = null
      ctrl.loadingMetrics = true

      xoAggregate
        .refreshStats(ctrl.chosen, 'hours')
        .then(function (result) {
          stats = result
          ctrl.metrics = stats.keys
          ctrl.stats = {}
          // $timeout(refreshStats, 1000)
          ctrl.loadingMetrics = false
        })
        .catch(function (e) {
          console.log(' ERROR ', e)
        })
    }
    this.toggleSynchronizeScale = function () {
      ctrl.synchronizescale = !ctrl.synchronizescale
      if (ctrl.selectedMetric) {
        ctrl.prepareStat()
      }
    }
    this.prepareStat = function () {
      let min, max
      max = 0
      min = 0
      ctrl.stats = {}

      // compute a global extent => the chart will have the same scale
      if (ctrl.synchronizescale) {
        forEach(stats.details, function (stat, object_id) {
          forEach(stat[ctrl.selectedMetric], function (val) {
            if (!isNaN(val.value)) {
              max = Math.max(val.value || 0, max)
            }
          })
        })
        ctrl.extents = [min, max]
      } else {
        ctrl.extents = null
      }
      forEach(stats.details, function (stat, object_id) {
        const label = find(ctrl.chosen, {id: object_id})
        ctrl.stats[label.name_label] = stat[ctrl.selectedMetric]
      })
    }
  })
  .name
