import angular from 'angular';
import uiRouter from 'angular-ui-router';
import uiSelect from 'angular-ui-select';
import d3 from 'd3';
import filter from 'lodash.filter';

import xoApi from 'xo-api';
import xoServices from 'xo-services';

import view from './view';

export default angular.module('dashboard.dataviz', [
  uiRouter,
  uiSelect,

  xoApi,
  xoServices,
])
  .config(function ($stateProvider) {
    $stateProvider.state('dashboard.dataviz', {
      controller: 'Dataviz as ctrl',
      url: '/dataviz',
      template: view,
    });
  })

  .directive('sunburstChart', function ($parse) {
    function link(scope, element, attrs) {
      // size ?
      var width = attrs.width ? parseInt(attrs.width,10)  : 460,
        height = attrs.height ? parseInt(attrs.height,10)  : 460,
        radius = Math.min(width, height) / 2,
        color = d3.scale.category20c();

      var svg = d3.select(element[0]).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height * .52 + ")");

      var partition = d3.layout.partition()
        .sort(null)
        .size([2 * Math.PI, radius * radius])
        .value(function (d) {
          return d.size;
        });

      var arc = d3.svg.arc()
        .startAngle(function (d) {
          return d.x;
        })
        .endAngle(function (d) {
          return d.x + d.dx;
        })
        .innerRadius(function (d) {
          return Math.sqrt(d.y);
        })
        .outerRadius(function (d) {
          return Math.sqrt(d.y + d.dy);
        });

      var path = svg.datum(scope.chartData).selectAll("path")
        .data(partition.nodes)
        .enter().append("path")
        .attr("display", function (d) {
          return d.depth ? null : "none";
        }) // hide inner ring
        .attr("d", arc)
        .style("stroke", "#fff")
        .style("fill", function (d) {
          return d.color? d.color : color((d.children ? d : d.parent).name);
        })
        .style("fill-rule", "evenodd")
        .on("mouseover", mouseover)
        .on("click", click);

      function mouseover(d) {
        if(scope.over){
          scope.over.apply(null,[{d:d}]);
        }
      }
      function click(d) {
        if(scope.click){
          scope.click.apply(null,[{d:d}]);
        }
      }

      function highlight(node){


        var sequenceArray = getAncestors(node);

        // Fade all the segments.
        d3.selectAll("path")
          .style("opacity", 0.3);

        // Then highlight only those that are an ancestor of the current segment.
        svg.selectAll("path")
          .filter(function(node) {
            return (sequenceArray.indexOf(node) >= 0);
          })
          .style("opacity", 1);
      }

      scope.$watch('selected', function(newVal){
        console.log('seected is now ',newVal);
        if(newVal && newVal.name){
          highlight(newVal );

        }
      });

      function getAncestors(node) {
        var path = [];
        var current = node;
        while (current.parent) {
          path.unshift(current);
          current = current.parent;
        }
        return path;
      }

      d3.select(self.frameElement).style("height", height + "px");


    }

    return {
      resctict: 'E',
      replace: false,
      scope: {
        chartData: '=',
        selected:'=',
        over:'&',
        click:'&'
      },
      link: link
    }

  })
  .controller('Dataviz', function (xoApi, $scope) {
    $scope.charts = {};
    //extract RAM from bytypes
    $scope.charts.selected = {};

    $scope.charts.over =function(d){
      console.log(' over node',d)
      $scope.$apply(function(){
        $scope.charts.selected = d;

      })
    }

    $scope.charts.ram =
    {
      name: "ram",
      children: [{
        name: " first pool",
        children: [{
          name: "server1 ",
          children: [{
            name: "VM11",
            size: 512
          }, {
            name: "VM12",
            size: 1024
          }
          ]
        }, {
          name: "server2",
          children: [{
            name: "VM21",
            size: 256
          }, {
            name: "VM22",
            size: 2048
          }
          ]
        }
        ]
      },
        {
          name: " second pool",
          children: [{
            name: "server1 ",
            children: [{
              name: "VM11",
              size: 768
            }, {
              name: "VM12",
              size: 1284
            }
            ]
          }, {
            name: "server2",
            children: [{
              name: "VM21",
              size: 256
            }, {
              name: "VM22",
              size: 2048
            }
            ]
          }
          ]
        }]
    }


    //extract cpu from bytypes


    /*
     Object.defineProperties($scope, {
     xo: { get: -> xoApi.byTypes.xo?[0] },
     pools: { get: -> xoApi.byTypes.pool },
     hosts: { get: -> xoApi.byTypes.host },
     VMs: { get: -> xoApi.byTypes.VM },
     })*/
  })

  // A module exports its name.
  .name
;
