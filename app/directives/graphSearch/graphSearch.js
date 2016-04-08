/**
  * Directive für die graphbasierte Suche
  * Verwendung des D3.js - Frameworks
  */
angular.module('dokuvisApp').directive('graphSearch', ['$state', '$stateParams', 'GraphVis', 'CidocDict', 'Utilities',
	function($state, $stateParams, GraphVis, CidocDict, Utilities) {
		
		function link(scope, element, attrs) {
						
			function Graph() {
				
				var link, node;
				var width = element.width(), height = element.height();
				var centerPos = new THREE.Vector2( width / 2, height / 2 );
				var clickPos = new THREE.Vector2( width / 2 - 10, height / 2 );
				
				var force = d3.layout.force()
					.size([width, height])
					.charge(-2000)
					.friction(0.7)
					.gravity(0.08)
					.linkDistance(200)
					.linkStrength(0.5);
					
				var nodes = force.nodes(),
					links = force.links();
					
				var drag = force.drag()
					.on('dragstart', dragstart);
				
				var svg = d3.select(element[0]).append('svg')
					.attr('width', width)
					.attr('height', height);
				
				// defs - arrowHead
				var defs = svg.append('defs');
				defs.append('marker')
					.attr({
						id: 'arrow',
						viewBox: '0 -5 10 10',
						refX: 35,
						refY: 0,
						markerWidth: 10,
						markerHeight: 10,
						orient: 'auto'
					})
					.append('path')
						.attr('class', 'arrowHead')
						.attr('d', 'M0,-5L10,0L0,5');
				
				// updates the SVG
				this.update = function() {
					link = svg.selectAll('.link')
						.data(links);
					var gLink = link.enter().insert('g', 'g.node')
						.attr('class', 'link');
					gLink.append('path')
						.attr('class', 'linkPath')
						.attr('marker-end', 'url(#arrow)');
					gLink.append('path')
						.attr('class', 'textPath')
						.attr('id', function(d) { return 'linkId_' + d.id; });
					gLink.append('text')
						.attr('class', 'linkLabel')
						.attr('text-anchor', 'middle')
						.append('textPath')
							.attr('xlink:href', function(d) { return '#linkId_' + d.id; })
							.attr('startOffset', '50%')
							.text(function(d) { return CidocDict.getPropertyName(d.type); });
					link.exit().remove();
					
					node = svg.selectAll('.node')
						.data(nodes);
					var gNode = node.enter().append('g')
						.attr('class', 'node')
						.on('mouseover', onMouseover)
						.on('mouseleave', onMouseleave)
						.on('dblclick', this.onDblclick)
						.on('contextmenu', onContextmenu)
						.call(drag);
					gNode.append('circle')
						.attr('class', 'nodeChild')
						.attr('fill', function(d) { return CidocDict.getNodeColor(d.labels[0]); })
						.attr('r', 25);
					gNode.append('text')
						.attr('text-anchor', 'middle')
						.attr('dy', '-.5em')
						.attr('class', 'title')
						.text(function(d) { return CidocDict.getClassName(d.labels[0]); })
						.call(getBBox, 'bbox1');
					gNode.insert('rect', 'text')
						.attr('class', 'bg-text')
						.attr('x', function(d) { return d.bbox1.x; })
						.attr('y', function(d) { return d.bbox1.y; })
						.attr('width', function(d) { return d.bbox1.width; })
						.attr('height', function(d) { return d.bbox1.height; });
					gNode.append('text')
						.attr('class', 'caption')
						.attr('text-anchor', 'middle')
						.attr('dy', '.75em');
					gNode.insert('rect', 'text')
						.attr('class', 'bg-text bg-caption');
					gNode.append('title')
						.text(function(d) { return d.properties.content; });
					node.exit().remove();

					// update caption
					node.select('.caption')
						.text(getNodeText)
						.call(getBBox, 'bbox2');
					node.select('.bg-caption')
						.attr('x', function(d) { return d.bbox2.x; })
						.attr('y', function(d) { return d.bbox2.y; })
						.attr('width', function(d) { return d.bbox2.width; })
						.attr('height', function(d) { return d.bbox2.height; });
					
					force.drag().on('dragstart', dragstart);
					force.on('tick', tick);
					force.start();
				};
				
				// events
				
				// force layout simulation step
				function tick() {
					link.select('.linkPath').attr('d', function(d) {
						return 'M'+d.source.x+' '+d.source.y+'L'+d.target.x+' '+d.target.y;
					});
					link.select('.textPath').attr('d', function(d) { 
						if(d.source.x < d.target.x)
							return 'M'+d.source.x+' '+d.source.y+'L'+d.target.x+' '+d.target.y;
						else
							return 'M'+d.target.x+' '+d.target.y+'L'+d.source.x+' '+d.source.y;
					});
					node.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });
				}
				
				function dragstart(d) {
					console.log('dragstart', d);
					d3.select(this).classed('fixed', d.fixed = true);
					scope.selectedNode = d;
					scope.$apply();
				}
				
				function onMouseover(d) {
					d3.select(this).select('circle')
						.attr('fill', d3.rgb(CidocDict.getNodeColor(d.labels[0])).darker(0.2));
				}
				function onMouseleave(d) {
					d3.select(this).select('circle')
						.attr('fill', d3.rgb(CidocDict.getNodeColor(d.labels[0])));
				}
				
				function onContextmenu(d) {
					d3.event.preventDefault();
					d3.select(this).classed('fixed', d.fixed = false);
					//console.log(this.getBBox());
				}
				
				// returns the graph object
				this.getData = function() {
					return {nodes: nodes, links: links};
				};
				
				// organize graph data
				
				// add node to the graph object
				this.addNode = function(node) {
					if(this.findNode(node.id) === undefined) {
						var newPos = getRandomPosition();
						node.x = newPos.x;
						node.y = newPos.y;
						nodes.push(node);
						return true;
					}
					return false;
				};
				
				// add link to the graph object
				this.addLink = function(link) {
					if(this.findLink(link.id) === undefined) {
						link.source = this.findNode(link.startNode);
						link.target = this.findNode(link.endNode);
						links.push(link);
						return true;
					}
					return false;
				};

				// remove node from graph object
				this.removeNode = function (nodeId) {
					for(var i in nodes) {
						if(nodes[i].id === nodeId) {
							nodes.splice(i,1);
							return true;
						}
					}
					return false;
				};
				
				// remove link from graph object
				this.removeLink = function (linkId) {
					for(var i in links) {
						if(links[i].id === linkId) {
							links.splice(i,1);
							return true;
						}
					}
					return false;
				};
				
				this.findNode = function(id) {
					for(var i in nodes) {
						if(nodes[i].id === id) return nodes[i];
					}
					return undefined;
				};
				
				this.findLink = function(id) {
					for(var i in links) {
						if(links[i].id === id) return links[i];
					}
					return undefined;
				};
				
				function getNodeText(d) {
					var text = d.properties[CidocDict.getNodePropertyName(d.labels[0])] || d.properties.content;
					if(text.length > 20)
						return text.substring(0,20) + '...';
					else
						return text;
				}
				
				// get and store bounding box of selection
				function getBBox(selection, bbox) {
					selection.each(function(d) { d[bbox] = this.getBBox() });
				}
				
				// get position near to the clicked node, but outwards (because most nodes will be around the center)
				function getRandomPosition() {
					var newPos = new THREE.Vector2().subVectors(clickPos, centerPos);
					newPos.setLength(Math.random() * 200 + 100);
					newPos.rotateAround(new THREE.Vector2(), Math.random() * Math.PI - Math.PI / 2);
					//console.log(clickPos, centerPos, newPos);
					return newPos.add(clickPos); 
				}
				
				// store position of clicked node
				this.setClickPosition = function(d) {
					clickPos.set(d.x, d.y);
				};
				
			}
			
			var graph = new Graph();
			var waitingForUpdate = 0;
			
			function getNodeNeighbours(id) {
				waitingForUpdate++;
				GraphVis.getNodeNeighbours(id).then(function(response) {
					if(!response.data.results[0]) return;
					var data = response.data.results[0].data;
					console.log(data);
					
					var newNodes = 0, newLinks = 0;
					
					for(var i=0; i<data.length; i++) {
						var dataNodes = data[i].graph.nodes;
						var dataLinks = data[i].graph.relationships;
						
						for(var j=0; j<dataNodes.length; j++) {
							if(graph.addNode(dataNodes[j])) newNodes++;
						}
						for(var j=0; j<dataLinks.length; j++) {
							var link = dataLinks[j];
							var endNodeId = +link.startNode === id ? link.endNode : link.startNode;
							var endNode= graph.findNode(endNodeId);
							callRule(endNode.labels[0], endNode);
							var key = link.type + '-' + endNode.labels[0];
							if(callRule(key, endNode, link)) newNodes--;
							else if(graph.addLink(link)) newLinks++;
						}
					}

					waitingForUpdate--;
					if(newNodes || newLinks) {
						if(waitingForUpdate === 0) graph.update();
						if(!scope.selectedNode) scope.selectedNode = graph.findNode($stateParams.startNode);
					}
					
					console.log(graph.getData());
				}, function(err) {
					Utilities.throwApiException('on GraphVis.getNodeNeighbours()', err);
				});
			}
			
			graph.onDblclick = function(d) {
				//console.log('dbclick', d);
				//getNodeNeighbours(+d.id);
				graph.setClickPosition(d);
				$state.go('project.graph.node', { startNode: d.id });
			};

			// init
			//getNodeNeighbours(21235);
			if($stateParams.startNode)
				getNodeNeighbours(+$stateParams.startNode);

			scope.$on('$stateChangeSuccess', function (event, toState, toParams) {
				console.log('graph state changed', toParams);
				if(toParams.startNode)
					getNodeNeighbours(+toParams.startNode);
			});

			// rules
			function callRule(key, node, link) {
				if(key in rules)
					return rules[key](node, link);
				else
					return null;
			};

			var rules = {};

			rules['E21'] = function (node) {
				if(node.properties.title) return;
				getTitle(node, 'E82', 'content');
			};
			rules['E31'] = function (node) {
				getTitle(node, 'E35', 'content');
			};
			rules['P102-E35'] = function (endNode, link) {
				var startNode = graph.findNode(link.startNode);
				setTitle(startNode, endNode, 'content');
				return true;
			};
			rules['P131-E82'] = function (endNode, link) {
				var startNode = graph.findNode(link.startNode);
				setTitle(startNode, endNode, 'content');
				return true;
			};
			rules['E65'] = function (node) {
				getNodeNeighbours(+node.id);
			};

			function getTitle(node, label, property) {
				waitingForUpdate++;
				GraphVis.getNodeTitle(node.id, label).then(function (response) {
					node.properties.title = response.data[property];
					waitingForUpdate--;
					if(waitingForUpdate === 0) graph.update();
				}, function (err) {
					Utilities.throwApiException('on GraphVis.getNodeTitle()', err);
				});
			}
			function setTitle(startNode, endNode, property) {
				startNode.properties.title = endNode.properties[property];
				graph.removeNode(endNode.id);
			}
		}
		
		return {
			restrict: 'A',
			templateUrl: 'app/directives/graphSearch/graphSearch.html',
			link: link
		};
		
	}]);