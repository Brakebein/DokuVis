/**
  * Directive für die graphbasierte Suche
  * Verwendung des D3.js - Frameworks
  */
angular.module('dokuvisApp').directive('graphSearch', ['$state', '$stateParams', 'GraphVis', 'CidocDict', 'Utilities', '$compile',
	function($state, $stateParams, GraphVis, CidocDict, Utilities, $compile) {
		
		function link(scope, element, attrs) {

			scope.nodeTransparency = 50;
			var history = [];
			var historyIndex = 0;
			var stateForward = false;

			/**
			 * D3.js force layout graph
			 * @constructor
             */
			function Graph() {
				
				var link, node;
				var fixedNodes = [];
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

				/**
				 * update SVG
				 */
				this.update = function() {
					link = svg.selectAll('.link')
						.data(links);
					var gLink = link.enter().insert('g', 'g.node')
						.attr('class', 'link')
						.attr('ng-style', '{opacity: nodeTransparency / 100}')
						.attr('id', function (d) { return 'link' + d.id; })
						.call(function () { $compile(this[0].parentNode)(scope); });
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
						.attr('ng-style', '{opacity: nodeTransparency / 100}')
						.attr('id', function (d) { return 'node' + d.id; })
						.on('mouseover', onMouseover)
						.on('mouseleave', onMouseleave)
						.on('dblclick', this.onDblclick)
						.on('contextmenu', onContextmenu)
						.call(drag)
						.call(function () { $compile(this[0].parentNode)(scope); });
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

				/**
				 * force layout simulation step
				 */
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

				/**
				 * called when node starts to be dragged
				 * @param d - node object
                 */
				function dragstart(d) {
					//console.log('dragstart', d);
					d3.select(this).classed('fixed', d.fixed = true);
					scope.selectedNode = d;
					if(fixedNodes.indexOf(d.id) === -1)
						fixedNodes.push(d.id);
					fixLinks();
					scope.$apply();
				}

				/**
				 * make link opaque, if source and target are fixed
				 */
				function fixLinks() {
					for(var i=0; i<links.length; i++) {
						var link = links[i];
						if(fixedNodes.indexOf(link.source.id) !== -1 && fixedNodes.indexOf(link.target.id) !== -1)
							d3.select('#link'+link.id).classed('opaque', true);
						else
							d3.select('#link'+link.id).classed('opaque', false);
					}
				}
				
				function onMouseover(d) {
					d3.select(this).select('circle')
						.attr('fill', d3.rgb(CidocDict.getNodeColor(d.labels[0])).darker(0.2));
					for(var i=0; i<links.length; i++) {
						var link = links[i];
						if(d.id === link.source.id || d.id === link.target.id) {
							d3.select('#node'+link.source.id).classed('highlight', true);
							d3.select('#node'+link.target.id).classed('highlight', true);
							d3.select('#link'+link.id).classed('highlight', true);
						}
					}
				}
				function onMouseleave(d) {
					d3.select(this).select('circle')
						.attr('fill', d3.rgb(CidocDict.getNodeColor(d.labels[0])));
					d3.selectAll('.node').classed('highlight', false);
					d3.selectAll('.link').classed('highlight', false);
				}
				
				function onContextmenu(d) {
					d3.event.preventDefault();
					d3.select(this).classed('fixed', d.fixed = false);
					fixedNodes.splice(fixedNodes.indexOf(d.id), 1);
					fixLinks();
				}
				
				// returns the graph object
				this.getData = function() {
					return {nodes: nodes, links: links};
				};
				
				// organize graph data

				/**
				 * add node to the graph object
				 * @param node
                 * @returns {boolean}
                 */
				this.addNode = function(node) {
					if(this.findNode(node.id) === undefined) {
						var newPos = getRandomPosition();
						console.log(newPos);
						node.x = newPos.x;
						node.y = newPos.y;
						nodes.push(node);
						history[historyIndex].nodes.push(node.id);
						return true;
					}
					return false;
				};

				/**
				 * add link to the graph object
				 * @param link
                 * @returns {boolean}
                 */
				this.addLink = function(link) {
					if(this.findLink(link.id) === undefined) {
						if(!link.source) link.source = this.findNode(link.startNode);
						if(!link.target) link.target = this.findNode(link.endNode);
						links.push(link);
						return true;
					}
					return false;
				};

				/**
				 * remove node from graph object
				 * @param nodeId
                 * @returns {boolean}
                 */
				this.removeNode = function (nodeId) {
					for(var i=0; i<nodes.length; i++) {
						if(nodes[i].id === nodeId) {
							nodes.splice(i,1);
							return true;
						}
					}
					return false;
				};

				/**
				 * remove link from graph object
				 * @param linkId
                 * @returns {boolean}
                 */
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

				/**
				 * find link by type and one node
				 * @param {string} type - relationship type
                 * @param node - node object
                 * @returns {*}
                 */
				this.findLinkByType = function (type, node) {
					for(var i in links) {
						if((links[i].source === node || links[i].target === node) && links[i].type === type) return links[i];
					}
					return undefined;
				};

				/**
				 * find link by node ID
				 * @param nodeId
                 * @returns {*}
                 */
				this.findLinkByNodeId = function (nodeId) {
					for(var i in links) {
						if(links[i].source.id === nodeId || links[i].target.id === nodeId) return links[i];
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

				/**
				 * get and store bounding box of selection
				 * @param selection
                 * @param bbox
                 */
				function getBBox(selection, bbox) {
					selection.each(function(d) { d[bbox] = this.getBBox() });
				}

				/**
				 * get position near to the clicked node, but outwards (because most nodes will be around the center)
				 * @returns {*}
                 */
				function getRandomPosition() {
					var newPos = new THREE.Vector2().subVectors(clickPos, centerPos);
					newPos.setLength(Math.random() * 200 + 100);
					newPos.rotateAround(new THREE.Vector2(), Math.random() * Math.PI - Math.PI / 2);
					//console.log(clickPos, centerPos, newPos);
					return newPos.add(clickPos); 
				}

				/**
				 * store position of clicked node
				 * @param d
                 */
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
							var endNode = graph.findNode(endNodeId);
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
				graph.setClickPosition(d);
				stateForward = true;
				$state.go('project.graph.node', { startNode: d.id });
			};

			// init
			//getNodeNeighbours(21235);
			if($stateParams.startNode) {
				history.push({ stateNode: $stateParams.startNode, nodes: [] });
				getNodeNeighbours(+$stateParams.startNode);
			}

			scope.$on('$stateChangeSuccess', function (event, toState, toParams) {
				console.log('graph state changed', toParams);
				if(toParams.startNode && stateForward) {
					history.push({ stateNode: toParams.startNode, nodes: [] });
					historyIndex++;
					getNodeNeighbours(+toParams.startNode);
				}
				else if(toParams.startNode && !stateForward && historyIndex > 0) {
					for(var i=0; i<history[historyIndex].nodes.length; i++) {
						var nodeId = history[historyIndex].nodes[i];
						if(!graph.findNode(nodeId)) continue;
						var link;
						while(link = graph.findLinkByNodeId(nodeId)) {
							graph.removeLink(link.id);
						}
						graph.removeNode(nodeId);
						graph.update();
					}
					history.splice(historyIndex, 1);
					historyIndex--;
				}
				stateForward = false;
				//console.log(history, historyIndex);
			});

			// rules
			function callRule(key, node, link) {
				if(key in rules)
					return rules[key](node, link);
				else
					return null;
			}

			var rules = {};

			rules['E21'] = function (node) {
				if(node.properties.title) return;
				getTitle(node, 'E82', 'value');
			};
			rules['E22'] = function (node) {
				if(node.properties.title) return;
				waitingForUpdate++;
				GraphVis.getE22Name(+node.id).then(function (response) {
					console.log(response);
					node.properties.title = response.data.name || response.data.content;
					waitingForUpdate--;
					if(waitingForUpdate === 0) graph.update();
				}, function (err) {
					Utilities.throwApiException('on GraphVis.getE22Name()', err);
				});
			};
			rules['E31'] = function (node) {
				getTitle(node, 'E35', 'content');
			};
			rules['E40'] = function (node) {
				getTitle(node, 'E82', 'content');
			};
			rules['E52'] = function (node) {
				getTitle(node, 'E61', 'value');
			};
			rules['E53'] = function (node) {
				getTitle(node, 'E48', 'content');
			};
			rules['E78'] = function (node) {
				getTitle(node, 'E41', 'content');
			};
			rules['P1-E41'] = function (endNode, link) {
				graph.removeNode(endNode.id);
				return true;
			};
			rules['P1-E75'] = function (endNode, link) {
				graph.removeNode(endNode.id);
				return true;
			};
			/*rules['P70-E36'] = function (node, link) {
				// graph.removeNode(node.id);
				// return true;
				waitingForUpdate++;
				GraphVis.getNodeNeighbours(+node.id).then(function (response) {
					if(!response.data.results[0]) return;
					var data = response.data.results[0].data;

					for(var i=0; i<data.length; i++) {
						var dataNodes = data[i].graph.nodes;
						var dataLinks = data[i].graph.relationships;

						for(var j=0; j<dataNodes.length; j++) {
							graph.addNode(dataNodes[j]);
						}
						for(var j=0; j<dataLinks.length; j++) {
							var link = dataLinks[j];
							var endNodeId = link.startNode === node.id ? link.endNode : link.startNode;
							var endNode = graph.findNode(endNodeId);
							callRule(endNode.labels[0], endNode);
							graph.addLink(link);
						}
					}

					var linkP70 = graph.findLinkByType('P70', node);
					var linkP138 = graph.findLinkByType('P138', node);

					if(linkP70 && linkP138) {
						graph.addLink({
							id: linkP70.id + linkP138.id,
							type: 'P70a',
							startNode: linkP70.source.id,
							source: linkP70.source,
							endNode: linkP138.target.id,
							target: linkP138.target
						});
					}

					if(linkP70) graph.removeLink(linkP70.id);
					if(linkP138) graph.removeLink(linkP138.id);
					graph.removeNode(node.id);

					waitingForUpdate--;
					if(waitingForUpdate === 0) graph.update();


				}, function(err) {
					Utilities.throwApiException('on GraphVis.getNodeNeighbours()', err);
				});
			};*/
			rules['P82-E61'] = function (endNode, link) {
				var startNode = graph.findNode(link.startNode);
				setTitle(startNode, endNode, 'value');
				return true;
			};
			rules['P102-E35'] = function (endNode, link) {
				var startNode = graph.findNode(link.startNode);
				setTitle(startNode, endNode, 'content');
				return true;
			};
			rules['P131-E82'] = function (endNode, link) {
				var startNode = graph.findNode(link.startNode);
				setTitle(startNode, endNode, 'value');
				return true;
			};
			/*rules['P138-E36'] = function (endNode, link) {
				graph.removeNode(endNode.id);
				return true;
			};*/
			rules['P129-E33'] = function (node, link) {
				waitingForUpdate++;
				GraphVis.getNodeNeighbours(+node.id).then(function (response) {
					if(!response.data.results[0]) return;
					var data = response.data.results[0].data;

					for(var i=0; i<data.length; i++) {
						var dataNodes = data[i].graph.nodes;
						var dataLinks = data[i].graph.relationships;

						for(var j=0; j<dataNodes.length; j++) {
							graph.addNode(dataNodes[j]);
						}
						for(var j=0; j<dataLinks.length; j++) {
							var link = dataLinks[j];
							var endNodeId = link.startNode === node.id ? link.endNode : link.startNode;
							var endNode = graph.findNode(endNodeId);
							callRule(endNode.labels[0], endNode);
							graph.addLink(link);
						}
					}

					var linkP3 = graph.findLinkByType('P3', node);

					if(linkP3) {
						node.properties.value = linkP3.target.properties.value;
						graph.removeNode(linkP3.target.id);
						graph.removeLink(linkP3.id);

						waitingForUpdate--;
						if(waitingForUpdate === 0) graph.update();
					}
				}, function(err) {
					Utilities.throwApiException('on GraphVis.getNodeNeighbours()', err);
				});
			};
			rules['E65'] = function (node) {
				waitingForUpdate++;
				GraphVis.getNodeNeighbours(+node.id).then(function(response) {
					if(!response.data.results[0]) return;
					var data = response.data.results[0].data;
					console.log(data);

					for(var i=0; i<data.length; i++) {
						var dataNodes = data[i].graph.nodes;
						var dataLinks = data[i].graph.relationships;

						for(var j=0; j<dataNodes.length; j++) {
							graph.addNode(dataNodes[j]);
						}
						for(var j=0; j<dataLinks.length; j++) {
							var link = dataLinks[j];
							var endNodeId = link.startNode === node.id ? link.endNode : link.startNode;
							var endNode = graph.findNode(endNodeId);
							callRule(endNode.labels[0], endNode);
							graph.addLink(link);
						}
					}
					
					var linkP94 = graph.findLinkByType('P94', node);
					var linkP14 = graph.findLinkByType('P14', node);
					var linkP4 = graph.findLinkByType('P4', node);
					var linkP7 = graph.findLinkByType('P7', node);

					if(linkP94 && linkP14) {
						graph.addLink({
							id: linkP94.id + linkP14.id,
							type: 'P14a',
							startNode: linkP94.target.id,
							source: linkP94.target,
							endNode: linkP14.target.id,
							target: linkP14.target
						});
					}
					if(linkP94 && linkP4) {
						graph.addLink({
							id: linkP94.id+linkP4.id,
							type: 'P4a',
							startNode: linkP94.target.id,
							source: linkP94.target,
							endNode: linkP4.target.id,
							target: linkP4.target
						});
					}
					if(linkP94 && linkP7) {
						graph.addLink({
							id: linkP94.id+linkP7.id,
							type: 'P7a',
							startNode: linkP94.target.id,
							source: linkP94.target,
							endNode: linkP7.target.id,
							target: linkP7.target
						});
					}

					if(linkP94) graph.removeLink(linkP94.id);
					if(linkP14) graph.removeLink(linkP14.id);
					if(linkP4) graph.removeLink(linkP4.id);
					if(linkP7) graph.removeLink(linkP7.id);
					graph.removeNode(node.id);

					waitingForUpdate--;
					if(waitingForUpdate === 0) graph.update();

					console.log(graph.getData());
				}, function(err) {
					Utilities.throwApiException('on GraphVis.getNodeNeighbours()', err);
				});
			};
			rules['E84'] = function (node) {
				waitingForUpdate++;
				GraphVis.getNodeNeighbours(+node.id).then(function(response) {
					if(!response.data.results[0]) return;
					var data = response.data.results[0].data;
					console.log(data);

					for(var i=0; i<data.length; i++) {
						var dataNodes = data[i].graph.nodes;
						var dataLinks = data[i].graph.relationships;

						for(var j=0; j<dataNodes.length; j++) {
							graph.addNode(dataNodes[j]);
						}
						for(var j=0; j<dataLinks.length; j++) {
							var link = dataLinks[j];
							var endNodeId = link.startNode === node.id ? link.endNode : link.startNode;
							var endNode = graph.findNode(endNodeId);
							callRule(endNode.labels[0], endNode);
							graph.addLink(link);
						}
					}

					var linkP128 = graph.findLinkByType('P128', node);
					var linkP46 = graph.findLinkByType('P46', node);

					if(linkP128 && linkP46) {
						graph.addLink({
							id: linkP128.id + linkP46.id,
							type: 'P128a',
							startNode: linkP128.target.id,
							source: linkP128.target,
							endNode: linkP46.source.id,
							target: linkP46.source
						});
					}

					if(linkP128) graph.removeLink(linkP128.id);
					if(linkP46) graph.removeLink(linkP46.id);
					graph.removeNode(node.id);

					waitingForUpdate--;
					if(waitingForUpdate === 0) graph.update();

					console.log(graph.getData());
				}, function(err) {
					Utilities.throwApiException('on GraphVis.getNodeNeighbours()', err);
				});
			};
			rules['P70-E33'] = function (node) {
				waitingForUpdate++;
				GraphVis.getNodeNeighbours(+node.id).then(function(response) {
					if(!response.data.results[0]) return;
					var data = response.data.results[0].data;
					console.log(data);

					for(var i=0; i<data.length; i++) {
						var dataNodes = data[i].graph.nodes;
						var dataLinks = data[i].graph.relationships;

						for(var j=0; j<dataNodes.length; j++) {
							graph.addNode(dataNodes[j]);
						}
						for(var j=0; j<dataLinks.length; j++) {
							var link = dataLinks[j];
							var endNodeId = link.startNode === node.id ? link.endNode : link.startNode;
							var endNode = graph.findNode(endNodeId);
							callRule(endNode.labels[0], endNode);
							graph.addLink(link);
						}
					}

					var linkP70 = graph.findLinkByType('P70', node);
					var linkP72 = graph.findLinkByType('P72', node);

					if(linkP70 && linkP72) {
						graph.addLink({
							id: linkP70.id + linkP72.id,
							type: 'P72a',
							startNode: linkP70.source.id,
							source: linkP70.source,
							endNode: linkP72.target.id,
							target: linkP72.target
						});
					}

					if(linkP70) graph.removeLink(linkP70.id);
					if(linkP72) graph.removeLink(linkP72.id);
					graph.removeNode(node.id);

					waitingForUpdate--;
					if(waitingForUpdate === 0) graph.update();

					console.log(graph.getData());
				}, function(err) {
					Utilities.throwApiException('on GraphVis.getNodeNeighbours()', err);
				});
			};


			function getTitle(node, label, property) {
				waitingForUpdate++;
				GraphVis.getNodeTitle(node.id, label).then(function (response) {
					node.properties.title = response.data[property] || response.data.content;
					waitingForUpdate--;
					if(waitingForUpdate === 0) graph.update();
				}, function (err) {
					Utilities.throwApiException('on GraphVis.getNodeTitle()', err);
				});
			}
			function setTitle(startNode, endNode, property) {
				startNode.properties.title = endNode.properties[property] || endNode.properties.content;
				graph.removeNode(endNode.id);
			}

		}
		
		return {
			restrict: 'A',
			templateUrl: 'app/directives/graphSearch/graphSearch.html',
			link: link
		};
		
	}]);
