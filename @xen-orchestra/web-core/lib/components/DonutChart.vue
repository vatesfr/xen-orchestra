<template>
  <div class="donut-chart">
    <div id="porcion1" class="recorte"><div class="quesito ios" data-rel="21"></div></div>
    <div id="porcion2" class="recorte"><div class="quesito mac" data-rel="39"></div></div>
    <div id="porcion3" class="recorte"><div class="quesito win" data-rel="31"></div></div>
    <div id="porcionFin" class="recorte"><div class="quesito linux" data-rel="9"></div></div>
    <span class="donut-hole"></span>
  </div>
</template>
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
p.center-date {
  background: #394264;
  position: absolute;
  text-align: center;
  font-size: 28px;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 130px;
  height: 130px;
  margin: auto;
  border-radius: 50%;
  line-height: 35px;
  padding: 15% 0 0;
}
.center-date span.scnd-font-color {
  line-height: 0;
}
.recorte {
  border-radius: 50%;
  clip: rect(0px, 200px, 200px, 100px);
  height: 100%;
  position: absolute;
  width: 100%;
}
.quesito {
  border-radius: 50%;
  clip: rect(0px, 100px, 200px, 0px);
  height: 100%;
  position: absolute;
  width: 100%;
  font-family: monospace;
  font-size: 1.5rem;
}
#porcion1 {
  transform: rotate(0deg);
}

#porcion1 .quesito {
  background-color: #e64c65;
  transform: rotate(76deg);
}
#porcion2 {
  transform: rotate(76deg);
}
#porcion2 .quesito {
  background-color: #11a8ab;
  transform: rotate(140deg);
}
#porcion3 {
  transform: rotate(215deg);
}
#porcion3 .quesito {
  background-color: #4fc4f6;
  transform: rotate(113deg);
}
#porcionFin {
  transform: rotate(-32deg);
}
#porcionFin .quesito {
  background-color: #fcb150;
  transform: rotate(32deg);
}
.nota-final {
  clear: both;
  color: #4fc4f6;
  font-size: 1rem;
  padding: 2rem 0;
}
.nota-final strong {
  color: #e64c65;
}
.nota-final a {
  color: #fcb150;
  font-size: inherit;
}
</style>
