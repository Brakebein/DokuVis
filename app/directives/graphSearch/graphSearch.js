/**
  * Directive für die graphbasierte Suche
  * Verwendung des D3.js - Frameworks
  */
angular.module('dokuvisApp').directive('graphSearch', ['APIRequest', 'CidocDict',
	function(APIRequest, CidocDict) {
		
		function link(scope, element, attrs) {
			/*var data = {
				name: 'Zwingerschloss Longuelune Grundriss',
				children: [
					{ name: 'Titel: halbierter EG-Grundriss für das Zwingerschloss' },
					{ name: 'Arbeitsriss in Graphit' },
					{ name: 'M 8 II c. Bl. 2' },
					{ name: 'Plan' },
					{ name: 'Plansammlung', children: [ {name: 'Landesamt für Denkmalpflege Sachsen' } ] },
					{ name: 'Entstehung', children: [ { name: 'Zacharias Longuelune' }, { name: 'Dresden' } ] },
					{ name: 'ZS09', children: [
						{ name: 'Wappenkartusche' },
						{ name: 'Zwingerpavillon komplett' },
						{ name: 'Situationsplan' },
						{ name: 'Rekonstruktion Elbfassade' },
						{ name: 'Aufriss Seitenflügel' }
					]}
				]
			};
			
			var nodes = [
				{ name: 'Zwingerschloss Longuelune Grundriss' },
				{ name: 'Titel: halbierter EG-Grundriss für das Zwingerschloss' },
				{ name: 'Arbeitsriss in Graphit' },
				{ name: 'M 8 II c. Bl. 2' },
				{ name: 'Plan' },
				{ name: 'Plansammlung' },
				{ name: 'Landesamt für Denkmalpflege Sachsen' },
				{ name: 'Entstehung' },
				{ name: 'Zacharias Longuelune' },
				{ name: 'Dresden' },
				{ name: 'ZS09' },
				{ name: 'Wappenkartusche' },
				{ name: 'Zwingerpavillon komplett' },
				{ name: 'Situationsplan' },
				{ name: 'Rekonstruktion Elbfassade' },
				{ name: 'Aufriss Seitenflügel' }
			];
			
			var links = [
				{ source: 0, target: 1, name: 'verbindet' },
				{ source: 0, target: 2, name: 'verbindet'},
				{ source: 0, target: 3, name: 'verbindet' },
				{ source: 0, target: 4, name: 'verbindet' },
				{ source: 0, target: 5, name: 'verbindet' },
				{ source: 5, target: 6, name: 'verbindet' },
				{ source: 0, target: 7, name: 'verbindet' },
				{ source: 7, target: 8, name: 'Kind von' },
				{ source: 7, target: 9, name: 'has title' },
				{ source: 0, target: 10, name: 'verbindet' },
				{ source: 10, target: 11, name: 'verbindet' },
				{ source: 10, target: 12, name: 'verbindet' },
				{ source: 10, target: 13, name: 'verbindet' },
				{ source: 10, target: 14, name: 'verbindet' },
				{ source: 10, target: 15, name: 'verbindet' }
			];*/
			
			function Graph() {
				
				var link, node;
				var width = element.width(), height = element.height();
				var centerPos = new THREE.Vector2(width / 2, height / 2)
				var clickPos = new THREE.Vector2();
				
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
					// gNode.append('text')
						// .attr('text-anchor', 'middle')
						// .attr('dy', '.75em')
						// .attr('class', 'shadow')
						// .text(getNodeText);
					gNode.append('text')
						.attr('text-anchor', 'middle')
						.attr('dy', '.75em')
						.text(getNodeText)
						.call(getBBox, 'bbox2');
					gNode.insert('rect', 'text')
						.attr('class', 'bg-text')
						.attr('x', function(d) { return d.bbox2.x; })
						.attr('y', function(d) { return d.bbox2.y; })
						.attr('width', function(d) { return d.bbox2.width; })
						.attr('height', function(d) { return d.bbox2.height; });
					gNode.append('title')
						.text(function(d) { return d.properties.content; });
					node.exit().remove();
					
					
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
					//console.log('dragstart');
					d3.select(this).classed('fixed', d.fixed = true);
				};
				
				function onMouseover(d) {
					d3.select(this).select('circle')
						.attr('fill', d3.rgb(CidocDict.getNodeColor(d.labels[0])).darker(0.2));
				};
				function onMouseleave(d) {
					d3.select(this).select('circle')
						.attr('fill', d3.rgb(CidocDict.getNodeColor(d.labels[0])));
				};
				
				function onContextmenu(d) {
					d3.event.preventDefault();
					d3.select(this).classed('fixed', d.fixed = false);
					//console.log(this.getBBox());
				};
				
				// returns the graph object
				this.getData = function() {
					return {nodes: nodes, links: links};
				};
				
				// organize graph data
				
				// add node to the graph object
				this.addNode = function(node) {
					if(findNode(node.id) === undefined) {
						if(nodes.length) {
							var newPos = getRandomPosition();
							node.x = newPos.x;
							node.y = newPos.y;
						}
						else {
							node.x = centerPos.x;
							node.y = centerPos.y;
						}
						nodes.push(node);
						return true;
					}
					return false;
				};
				
				// add link to the graph object
				this.addLink = function(link) {
					if(findLink(link.id) === undefined) {
						link.source = findNode(link.startNode);
						link.target = findNode(link.endNode);
						links.push(link);
						return true;
					}
					return false;
				};
				
				function findNode(id) {
					for(var i in nodes) {
						if(nodes[i].id === id) return nodes[i];
					}
					return undefined;
				}
				
				function findLink(id) {
					for(var i in links) {
						if(links[i].id === id) return links[i];
					}
					return undefined;
				}
				
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
					console.log(clickPos, centerPos, newPos);
					return newPos.add(clickPos); 
				}
				
				// store position of clicked node
				this.setClickPosition = function(d) {
					clickPos.set(d.x, d.y);
				};
				
			}
			
			var graph = new Graph();
			
			function getNodeNeighbours(id) {
				APIRequest.getNodeNeighbours(id).then(function(response) {
					var data = response.data.results[0].data;
					//console.log(data);
					
					var newNodes = 0, newLinks = 0;
					
					for(var i=0; i<data.length; i++) {
						var dataNodes = data[i].graph.nodes;
						var dataLinks = data[i].graph.relationships;
						
						for(var j=0; j<dataNodes.length; j++) {
							if(graph.addNode(dataNodes[j])) newNodes++;
						}
						for(var j=0; j<dataLinks.length; j++) {
							if(graph.addLink(dataLinks[j])) newLinks++;
						}
					}
					
					if(newNodes || newLinks) {
						graph.update();
					}
					
					console.log(graph.getData());
				});
			}
			
			getNodeNeighbours(21235);
			
			graph.onDblclick = function(d) {
				//console.log('dbclick', d);
				getNodeNeighbours(+d.id);
				graph.setClickPosition(d);
			};
			
			
 			/*function buildTree(data) {
				var tree = { node: data[0].graph.nodes[0], children: [] };
				var tree = data[0].graph.nodes[0];
				tree.children = [];
				for(var i=0; i<data.length; i++) {
					var node = getTreeNode(tree, data[i].graph.nodes[1]);
					if(node) {
						// if(!node.children) node.children = [];
						// tree.children.push(node);
					}
					else {
						tree.children.push(data[i].graph.nodes[1]);
					}
				}
				return tree;
			}*/
			
			/*function getTreeNode(parent, node) {
				if(parent.id === node.id) return parent;
				if(!parent.children) return undefined;
				for(var i=0; i<parent.children.length; i++) {
					var tnode = getTreeNode(parent.children[i], node);
					if(tnode !== undefined) return tnode;
				}
				return undefined;
			}*/
			
			
		}
		
		return {
			restrict: 'A',
			link: link
		};
		
	}]);