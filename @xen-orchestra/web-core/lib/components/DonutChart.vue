<template>
  <div class="donut-chart">
    <div id="segment1" class="cut"><div class="colored-part"></div></div>
    <div id="segment2" class="cut"><div class="colored-part"></div></div>
    <div id="segment3" class="cut"><div class="colored-part"></div></div>
    <div id="segmentFin" class="cut"><div class="colored-part"></div></div>
    <span class="donut-hole"></span>
  </div>
</template>
<script setup lang="ts">
type chartFigure = {
  value: number
  color: string
  legend: string
}

interface Props {
  chartFigures: chartFigure[]
}

const props = withDefaults(defineProps<Props>(), {
  chartFigures: () => [
    {
      value: 100,
      color: 'unknown',
      legend: 'Unknown',
    },
  ],
})
</script>
<style lang="postcss" scoped>
.donut-chart {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 2rem;
  border-radius: 100%;
}
.donut-hole {
  width: 70%;
  height: 70%;
  position: absolute;
  background-color: var(--background-color-primary);
  inset: 0;
  margin: auto;
  border-radius: 50%;
}

.cut {
  border-radius: 50%;
  clip: rect(0px, 200px, 200px, 100px);
  height: 100%;
  position: absolute;
  width: 100%;
}
.colored-part {
  border-radius: 50%;
  clip: rect(0px, 100px, 200px, 0px);
  height: 100%;
  position: absolute;
  width: 100%;
  font-family: monospace;
  font-size: 1.5rem;
}
#segment1 {
  transform: rotate(0deg);
}

#segment1 .colored-part {
  background-color: #e64c65;
  transform: rotate(76deg);
}
#segment2 {
  transform: rotate(76deg);
}
#segment2 .colored-part {
  background-color: #11a8ab;
  transform: rotate(140deg);
}
#segment3 {
  transform: rotate(215deg);
}
#segment3 .colored-part {
  background-color: #4fc4f6;
  transform: rotate(113deg);
}
#segmentFin {
  transform: rotate(-32deg);
}
#segmentFin .colored-part {
  background-color: #fcb150;
  transform: rotate(32deg);
}
</style>
