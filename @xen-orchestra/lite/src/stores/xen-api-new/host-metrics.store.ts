import { createSubscribe } from '@/stores/xen-api-new/create-subscribe'
import { defineStore } from 'pinia'

export const useNewHostMetricsStore = defineStore('host-metrics-new', () => {
  return {
    subscribe: createSubscribe('host_metrics'),
  }
})
