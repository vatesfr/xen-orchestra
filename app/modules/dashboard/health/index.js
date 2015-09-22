import angular from 'angular'
import Bluebird from 'bluebird'
import uiRouter from 'angular-ui-router'
import filter from 'lodash.filter'
import forEach from 'lodash.foreach'
import sortBy from 'lodash.sortby'

import xoApi from 'xo-api'
import xoServices from 'xo-services'

import view from './view'

export default angular.module('dashboard.health', [
  uiRouter,

  xoApi,
  xoServices
])
  .config(function ($stateProvider) {
    $stateProvider.state('dashboard.health', {
      controller: 'Health as ctrl',
      data: {
        requireAdmin: true
      },
      url: '/health',
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

  .controller('Health', function (xoApi, xo,xoAggregate, notify, bytesToSizeFilter) {
    this.charts = {
      heatmap: null
    }

    this.objects = xoApi.all

    this.prepareTypeFilter = function (selection) {
      const object = selection[0]
      this.typeFilter = object && object.type || undefined
    }

    this.selectAll = function (type) {
      this.selected = filter(this.objects, object => object.type === type)
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
              xo[apiType].refreshStats(object.id, 2) // 2: week granularity (7 * 24 hours)
              .then(result => ({object, result}))
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
              const averageCPU = averageMetrics['All CPUs'] && averageMetrics['All CPUs'].values || []
              forEach(result.cpus, (values, metricKey) => { // Every CPU metric of this object
                metricKey = 'CPU ' + metricKey
                averageObjectLayers[metricKey] !== undefined || (averageObjectLayers[metricKey] = 0)
                averageObjectLayers[metricKey]++
                averageCPULayers++

                const mapValues = averageMetrics[metricKey] && averageMetrics[metricKey].values || [] // already fed or not
                forEach(values, (value, key) => {
                  if (mapValues[key] === undefined) { // first value
                    mapValues.push({
                      value: +value,
                      date: +result.date[key] * 1000
                    })
                  } else { // average with previous
                    mapValues[key].value = ((mapValues[key].value || 0) * (averageObjectLayers[metricKey] - 1) + (+value)) / averageObjectLayers[metricKey]
                  }

                  if (averageCPU[key] === undefined) { // first overall value
                    averageCPU.push({
                      value: +value,
                      date: +result.date[key] * 1000
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

              forEach(result.vifs, (values, metricKey) => {
                metricKey = 'Network ' + Math.floor(metricKey / 2) + ' ' + (metricKey % 2 ? 'out' : 'in')
                averageObjectLayers[metricKey] !== undefined || (averageObjectLayers[metricKey] = 0)
                averageObjectLayers[metricKey]++

                const mapValues = averageMetrics[metricKey] && averageMetrics[metricKey].values || [] // already fed or not
                forEach(values, (value, key) => {
                  if (mapValues[key] === undefined) { // first value
                    mapValues.push({
                      value: +value,
                      date: +result.date[key] * 1000
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

              forEach(result.pifs, (values, metricKey) => {
                metricKey = 'NIC ' + Math.floor(metricKey / 2) + ' ' + (metricKey % 2 ? 'out' : 'in')
                averageObjectLayers[metricKey] !== undefined || (averageObjectLayers[metricKey] = 0)
                averageObjectLayers[metricKey]++

                const mapValues = averageMetrics[metricKey] && averageMetrics[metricKey].values || [] // already fed or not
                forEach(values, (value, key) => {
                  if (mapValues[key] === undefined) { // first value
                    mapValues.push({
                      value: +value,
                      date: +result.date[key] * 1000
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

              forEach(result.xvds, (values, metricKey) => {
                metricKey = 'Disk ' + String.fromCharCode(Math.floor(metricKey / 2) + 65) + ' ' + (metricKey % 2 ? 'write' : 'read')
                averageObjectLayers[metricKey] !== undefined || (averageObjectLayers[metricKey] = 0)
                averageObjectLayers[metricKey]++

                const mapValues = averageMetrics[metricKey] && averageMetrics[metricKey].values || [] // already fed or not
                forEach(values, (value, key) => {
                  if (mapValues[key] === undefined) { // first value
                    mapValues.push({
                      value: +value,
                      date: +result.date[key] * 1000
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

              if (result.load) {
                const metricKey = 'Load average'
                averageObjectLayers[metricKey] !== undefined || (averageObjectLayers[metricKey] = 0)
                averageObjectLayers[metricKey]++

                const mapValues = averageMetrics[metricKey] && averageMetrics[metricKey].values || [] // already fed or not
                forEach(result.load, (value, key) => {
                  if (mapValues[key] === undefined) { // first value
                    mapValues.push({
                      value: +value,
                      date: +result.date[key] * 1000
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

              if (result.memoryUsed) {
                const metricKey = 'RAM Used'
                averageObjectLayers[metricKey] !== undefined || (averageObjectLayers[metricKey] = 0)
                averageObjectLayers[metricKey]++

                const mapValues = averageMetrics[metricKey] && averageMetrics[metricKey].values || [] // already fed or not
                forEach(result.memoryUsed, (value, key) => {
                  if (mapValues[key] === undefined) { // first value
                    mapValues.push({
                      value: +value * (object.type === 'host' ? 1024 : 1),
                      date: +result.date[key] * 1000
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
  .name
