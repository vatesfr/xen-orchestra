import { useUiStore } from '@core/stores/ui.store'
import { storeToRefs } from 'pinia'
import { computed, provide, ref, watch } from 'vue'
import { THEME_KEY } from 'vue-echarts'

export const useChartTheme = () => {
  const { colorMode } = storeToRefs(useUiStore())

  const style = window.getComputedStyle(window.document.documentElement)

  const getColors = () => ({
    background: style.getPropertyValue('--color-neutral-background-primary'),
    text: style.getPropertyValue('--color-neutral-txt-secondary'),
    splitLine: style.getPropertyValue('--color-neutral-border'),
    primary: style.getPropertyValue('--color-normal-txt-base'),
    secondary: style.getPropertyValue('--color-warning-txt-base'),
  })

  const colors = ref(getColors())

  watch(colorMode, () => (colors.value = getColors()), { flush: 'post' })

  provide(
    THEME_KEY,
    computed(() => ({
      color: [colors.value.primary, colors.value.secondary],
      backgroundColor: colors.value.background,
      textStyle: {},
      grid: {
        top: 40,
        left: 80,
        right: 20,
      },
      line: {
        itemStyle: {
          borderWidth: 2,
        },
        lineStyle: {
          width: 2,
        },
        showSymbol: false,
        symbolSize: 10,
        symbol: 'circle',
        smooth: false,
      },
      radar: {
        itemStyle: {
          borderWidth: 2,
        },
        lineStyle: {
          width: 2,
        },
        symbolSize: 10,
        symbol: 'circle',
        smooth: false,
      },
      bar: {
        itemStyle: {
          barBorderWidth: 0,
          barBorderColor: '#cccccc',
        },
      },
      pie: {
        itemStyle: {
          borderWidth: 0,
          borderColor: '#cccccc',
        },
      },
      scatter: {
        itemStyle: {
          borderWidth: 0,
          borderColor: '#cccccc',
        },
      },
      boxplot: {
        itemStyle: {
          borderWidth: 0,
          borderColor: '#cccccc',
        },
      },
      parallel: {
        itemStyle: {
          borderWidth: 0,
          borderColor: '#cccccc',
        },
      },
      sankey: {
        itemStyle: {
          borderWidth: 0,
          borderColor: '#cccccc',
        },
      },
      funnel: {
        itemStyle: {
          borderWidth: 0,
          borderColor: '#cccccc',
        },
      },
      gauge: {
        itemStyle: {
          borderWidth: 0,
          borderColor: '#cccccc',
        },
      },
      candlestick: {
        itemStyle: {
          color: '#eb8146',
          color0: 'transparent',
          borderColor: '#d95850',
          borderColor0: '#58c470',
          borderWidth: '2',
        },
      },
      graph: {
        itemStyle: {
          borderWidth: 0,
          borderColor: '#cccccc',
        },
        lineStyle: {
          width: 1,
          color: '#aaaaaa',
        },
        symbolSize: '10',
        symbol: 'emptyArrow',
        smooth: true,
        color: ['#893448', '#d95850', '#eb8146', '#ffb248', '#f2d643', '#ebdba4'],
        label: {
          color: '#ffffff',
        },
      },
      map: {
        itemStyle: {
          areaColor: '#f3f3f3',
          borderColor: '#999999',
          borderWidth: 0.5,
        },
        label: {
          color: '#893448',
        },
        emphasis: {
          itemStyle: {
            areaColor: '#ffb248',
            borderColor: '#eb8146',
            borderWidth: 1,
          },
          label: {
            color: '#893448',
          },
        },
      },
      geo: {
        itemStyle: {
          areaColor: '#f3f3f3',
          borderColor: '#999999',
          borderWidth: 0.5,
        },
        label: {
          color: '#893448',
        },
        emphasis: {
          itemStyle: {
            areaColor: '#ffb248',
            borderColor: '#eb8146',
            borderWidth: 1,
          },
          label: {
            color: '#893448',
          },
        },
      },
      categoryAxis: {
        axisLine: {
          show: true,
          lineStyle: {
            color: '#aaaaaa',
          },
        },
        axisTick: {
          show: false,
          lineStyle: {
            color: '#333',
          },
        },
        axisLabel: {
          show: true,
          color: '#999999',
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: [colors.value.splitLine],
          },
        },
        splitArea: {
          show: false,
          areaStyle: {
            color: ['rgba(250,250,250,0.05)', 'rgba(200,200,200,0.02)'],
          },
        },
      },
      valueAxis: {
        axisLine: {
          show: false,
          // lineStyle: {
          //   color: "#aaaaaa",
          // },
        },
        axisTick: {
          show: false,
          // lineStyle: {
          //   color: "#333",
          // },
        },
        axisLabel: {
          show: true,
          color: colors.value.text,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: [colors.value.splitLine],
          },
        },
        splitArea: {
          show: false,
          areaStyle: {
            color: ['rgba(250,250,250,0.05)', 'rgba(200,200,200,0.02)'],
          },
        },
      },
      logAxis: {
        axisLine: {
          show: true,
          lineStyle: {
            color: '#aaaaaa',
          },
        },
        axisTick: {
          show: false,
          lineStyle: {
            color: '#333',
          },
        },
        axisLabel: {
          show: true,
          color: '#999999',
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: [colors.value.splitLine],
          },
        },
        splitArea: {
          show: false,
          areaStyle: {
            color: ['rgba(250,250,250,0.05)', 'rgba(200,200,200,0.02)'],
          },
        },
      },
      timeAxis: {
        axisLine: {
          show: false,
          // lineStyle: {
          //   color: "#aaaaaa",
          // },
        },
        axisTick: {
          show: false,
          // lineStyle: {
          //   color: "#333",
          // },
        },
        axisLabel: {
          show: true,
          color: colors.value.text,
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
            color: [colors.value.splitLine],
          },
        },
        splitArea: {
          show: false,
          areaStyle: {
            color: ['rgba(250,250,250,0.05)', 'rgba(200,200,200,0.02)'],
          },
        },
      },
      toolbox: {
        iconStyle: {
          borderColor: '#999999',
        },
        emphasis: {
          iconStyle: {
            borderColor: '#666666',
          },
        },
      },
      legend: {
        left: 'right',
        top: 'bottom',
        textStyle: {
          color: colors.value.text,
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          lineStyle: {
            color: '#8F84FF',
            width: 1,
          },
          crossStyle: {
            color: '#8F84FF',
            width: 1,
          },
        },
      },
      timeline: {
        lineStyle: {
          color: '#893448',
          width: 1,
        },
        itemStyle: {
          color: '#893448',
          borderWidth: 1,
        },
        controlStyle: {
          color: '#893448',
          borderColor: '#893448',
          borderWidth: 0.5,
        },
        checkpointStyle: {
          color: '#eb8146',
          borderColor: '#ffb248',
        },
        label: {
          color: '#893448',
        },
        emphasis: {
          itemStyle: {
            color: '#ffb248',
          },
          controlStyle: {
            color: '#893448',
            borderColor: '#893448',
            borderWidth: 0.5,
          },
          label: {
            color: '#893448',
          },
        },
      },
      visualMap: {
        color: ['#893448', '#d95850', '#eb8146', '#ffb248', '#f2d643', 'rgb(247,238,173)'],
      },
      dataZoom: {
        backgroundColor: 'rgba(255,255,255,0)',
        dataBackgroundColor: 'rgba(255,178,72,0.5)',
        fillerColor: 'rgba(255,178,72,0.15)',
        handleColor: '#ffb248',
        handleSize: '100%',
        textStyle: {
          color: '#333',
        },
      },
      markPoint: {
        label: {
          color: '#ffffff',
        },
        emphasis: {
          label: {
            color: '#ffffff',
          },
        },
      },
    }))
  )
}
