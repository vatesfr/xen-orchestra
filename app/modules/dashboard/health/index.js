import angular from 'angular'
import uiRouter from 'angular-ui-router'
import forEach from 'lodash.foreach'

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
  .controller('Health', function (xoApi, xo) {
    // console.log(' in main ')
    this.charts = {
      heatmap: null
    }

    this.objects = xoApi.all

    this.prepareMetrics = function (object, notify) {
      this.metrics = undefined
      this.selectedMetric = undefined
      if (object) {
        this.loadingMetrics = true
        const apiType = (object.type === 'host' && 'host') || (object.type === 'VM' && 'vm') || undefined
        if (!apiType) {
          notify.error({
            title: 'Unhandled object',
            message: 'There is no stats available for this type of objects'
          })
        }
        xo[apiType].refreshStats(object.id, 2) // 2: week granularity (7 * 24 hours)
        .then(result => {
          const metrics = []
          forEach(result.cpus, (values, metricKey) => {
            const mapValues = []
            forEach(values, (value, key) => {
              mapValues.push({
                value: +value,
                date: +result.date[key] * 1000
              })
            })
            metrics.push({
              key: 'CPU ' + metricKey,
              values: mapValues
            })
          })
          forEach(result.vifs, (values, metricKey) => {
            const mapValues = []
            forEach(values, (value, key) => {
              mapValues.push({
                value: +value,
                date: +result.date[key] * 1000
              })
            })
            metrics.push({
              key: 'Network ' + Math.floor(metricKey / 2) + ' ' + (metricKey % 2 ? 'out' : 'in'),
              values: mapValues
            })
          })
          forEach(result.pifs, (values, metricKey) => {
            const mapValues = []
            forEach(values, (value, key) => {
              mapValues.push({
                value: +value,
                date: +result.date[key] * 1000
              })
            })
            metrics.push({
              key: 'Disk ' + Math.floor(metricKey / 2) + ' ' + (metricKey % 2 ? 'out' : 'in'),
              values: mapValues
            })
          })
          forEach(result.xvds, (values, key) => {
            const mapValues = []
            forEach(values, (value, key) => {
              mapValues.push({
                 value: +value,
                date: +result.date[key] * 1000
              })
            })
            metrics.push({
              key: 'xvd' + String.fromCharCode(Math.floor(key / 2) + 97) + ' ' + (key % 2 ? 'write' : 'read'),
              values: mapValues
            })
          })
          if (result.load) {
            const mapValues = []
            forEach(result.load, (value, key) => {
              mapValues.push({
                value: +value,
                date: +result.date[key] * 1000
              })
            })
            metrics.push({
              key: 'Load average',
              values: mapValues
            })
          }
          if (result.memoryUsed) {
            const mapValues = []
            forEach(result.memoryUsed, (value, key) => {
              mapValues.push({
                value: +value * (object.type === 'host' ? 1024 : 1),
                date: +result.date[key] * 1000
              })
            })
            metrics.push({
              key: 'RAM Used',
              values: mapValues
            })
          }
          this.loadingMetrics = false
          this.metrics = metrics
        })
      }
    }
    // $interval(
    //   function(){
    //     var values = [];
    //     for (var i = 0 ;i < 220 ; i ++){
    //       values.push({
    //         value:Math.random()*1500-750,
    //         date:Date.now()+ i*60*60*1000
    //       })
    //     }
    //     $scope.example = values;
    //   },5000
    // )
  })
  .name
