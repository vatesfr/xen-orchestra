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
      template: view
    });
  })

  .directive('sunburstChart', function ($parse) {
    function link(scope, element, attrs) {
      if (!scope.chartData) {
        console.log(' no data, no graph')
        return;
      }

      // size ?
      var width = attrs.width ? parseInt(attrs.width, 10) : 460,
        height = attrs.height ? parseInt(attrs.height, 10) : 460,
        radius = Math.min(width, height) / 2,
        color = d3.scale.category20c(),
        b = {
          w: 75, h: 30, s: 3, t: 10
        };


      var breadcrumbs = d3.select(element[0])
        .append('div')
        .attr('class', 'breadcrumbs-container')
        .append("svg:svg")
        .attr("width", width)
        .attr("height", 50);

      var svg = d3.select(element[0]).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr('class', 'breadcrumbs')
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
          return d.color ? d.color : color((d.children ? d : d.parent).name);
        })
        .style("fill-rule", "evenodd")
        .on("mouseover", mouseover)
        .on("click", click);

      function mouseover(d) {
        if (scope.over) {
          scope.over.apply(null, [{d: d}]);
        }
      }

      function click(d) {
        if (scope.click) {
          scope.click.apply(null, [{d: d}]);
        }
      }

      function highlight(id) {
        console.log('will highlight ', id)

        var sequenceArray = getAncestors(id);
        updateBreadcrumbs(sequenceArray);
        // Fade all the segments.
        svg.selectAll("path")
          .style("opacity", 0.3);

        // Then highlight only those that are an ancestor of the current segment.
        svg.selectAll("path")
          .filter(function (node) {
            return (sequenceArray.indexOf(node) >= 0);
          })
          .style("opacity", 1);
      }

      // Generate a string that describes the points of a breadcrumb polygon.
      function breadcrumbPoints(d, i) {
        var points = [];
        points.push("0,0");
        points.push(b.w + ",0");
        points.push(b.w + b.t + "," + (b.h / 2));
        points.push(b.w + "," + b.h);
        points.push("0," + b.h);
        if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
          points.push(b.t + "," + (b.h / 2));
        }
        console.log(points.join(" "));
        return points.join(" ");
      }


// Update the breadcrumb trail to show the current sequence and percentage.
      function updateBreadcrumbs(nodeArray, percentageString) {

        var g = breadcrumbs
          .selectAll("g")
          .data(nodeArray, function (d) {
            return d.name + d.depth;
          });

        // Add breadcrumb and label for entering nodes.
        var entering = g.enter().append("svg:g");

        entering.append("svg:polygon")
          .attr("points", breadcrumbPoints)
          .style("fill", function (d) {
            return d.color ? d.color : color((d.children ? d : d.parent).name);

          });

        entering.append("svg:text")
          .attr("x", (b.w + b.t) / 2)
          .attr("y", b.h / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .text(function (d) {
            return d.name;
          });

        // Set position for entering and updating nodes.
        g.attr("transform", function (d, i) {
          return "translate(" + i * (b.w + b.s) + ", 0)";
        });

        // Remove exiting nodes.
        g.exit().remove();
        /*
         // Now move and update the percentage at the end.
         d3.select("#trail").select("#endlabel")
         .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
         .attr("y", b.h / 2)
         .attr("dy", "0.35em")
         .attr("text-anchor", "middle")
         .text(percentageString);
         */
        // Make the breadcrumb trail visible, if it's hidden.
        d3.select(".breadcrumbs")
          .style("visibility", "");

      }

      scope.$watch('selected', function (newVal) {
        if (newVal && newVal.id) {
          highlight(newVal.id);

        }
      });

      function getAncestors(id) {
        var path = [];
        svg.selectAll("path")
          .each(function (node) {
            if (node.id === id) {
              var current = node;
              while (current.parent) {
                path.unshift(current);
                current = current.parent;
              }
            }
          })
        return path;
      }

      d3.select(self.frameElement).style("height", height + "px");


    }

    return {
      resctict: 'E',
      replace: false,
      scope: {
        chartData: '=',
        selected: '=',
        over: '&',
        click: '&'
      },
      link: link
    }

  })
  .controller('Dataviz', function (xoApi, $scope) {
    $scope.charts = {};

    $scope.charts.selected = {};

    $scope.charts.over = function (d) {
      console.log(' over node', d)
      $scope.$apply(function () {
        $scope.charts.selected = d;

      })
    };

    $scope.charts.ram =
    {
      name: "ram",
      children: [{
        name: " first pool",
        id: 'pool1',
        children: [{
          id: 'server11',
          name: "server1 ",
          children: [{
            id: 'vm11',
            name: "VM11",
            size: 512
          }, {
            id: 'vm12',
            name: "VM12",
            size: 1024
          },
            {
              id: 'server11unallocated',
              name: "unallocated",
              size: 8048,
              color: '#000'
            }
          ]
        }, {
          name: "server2",
          id: 'server12',
          children: [{
            id: 'VM121',
            name: "VM21 et gs ert",
            size: 256
          }, {
            id: 'VM122',
            name: "VM22 seghtrsedg",
            size: 2048
          }
          ]
        }
        ]
      },
        {
          name: " second pool",
          id: 'pool2',
          children: [{
            id: 'server21',
            name: "server1 ",
            children: [{
              name: "VM11",
              size: 768
            }, {
              id: 'vm211',
              name: "VM12",
              size: 1284
            },
              {
                id: 'server21unallocated',
                name: "unallocated",
                size: 512,
                color: '#000'
              }
            ]
          }, {
            name: "server2",
            id: 'server22',
            children: [{
              id: 'VMM221',
              name: "VM21",
              size: 256
            }, {
              name: "VM22",
              id: 'server222',
              size: 2048
            },
              {
                id: 'server22unallocated',
                name: "unallocated",
                size: 4000,
                color: '#000'
              }
            ]
          }
          ]
        }]
    };

    $scope.charts.cpu =
    {
      name: "ram",
      children: [{
        name: " first pool",
        id: 'pool1',
        children: [{
          id: 'server11',
          name: "server1 ",
          children: [{
            id: 'vm11',
            name: "VM11",
            size: 512
          }, {
            id: 'vm12',
            name: "VM12",
            size: 1024
          },
            {
              id: 'server11unallocated',
              name: "unallocated",
              size: 8048,
              color: '#000'
            }
          ]
        }, {
          name: "server2",
          id: 'server12',
          children: [{
            id: 'VM121',
            name: "VM21 et gs ert",
            size: 256
          }, {
            id: 'VM122',
            name: "VM22 seghtrsedg",
            size: 2048
          }
          ]
        }
        ]
      },
        {
          name: " second pool",
          id: 'pool2',
          children: [{
            id: 'server21',
            name: "server1 ",
            children: [{
              name: "VM11",
              size: 768
            }, {
              id: 'vm211',
              name: "VM12",
              size: 1284
            },
              {
                id: 'server21unallocated',
                name: "unallocated",
                size: 512,
                color: '#000'
              }
            ]
          }, {
            name: "server2",
            id: 'server22',
            children: [{
              id: 'VMM221',
              name: "VM21",
              size: 256
            }, {
              name: "VM22",
              id: 'server222',
              size: 2048
            },
              {
                id: 'server22unallocated',
                name: "unallocated",
                size: 4000,
                color: '#000'
              }
            ]
          }
          ]
        }]
    };
     

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
