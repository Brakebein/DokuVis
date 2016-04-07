angular.module('dokuvisApp').factory('CidocDict',
	function() {
		
		// dictionary
		
		var entities = {};
		
		entities['E21'] = { de: 'Person', color: '#ffa992' };
		entities['E31'] = { de: 'Dokument', prefProp: 'value', color: '#cbf09a' };
		entities['E35'] = { de: 'Titel', prefProp: 'value', color: '#cae4e8' };
		entities['E55'] = { de: 'Typus', color: '#e5e5e5' };
		entities['E56'] = { de: 'Sprache', color: '#e5e5e5' };
		entities['E62'] = { de: 'Zeichenkette', prefProp: 'value', color: '#ffe866' };
		entities['E65'] = { de: 'Begriffliche Schöpfung' };
		entities['E82'] = { de: 'Akteurbenennung', color: '#cae4e8' };
		entities['E84'] = { de: 'Informationsträger' };
		
		var properties = {};
		
		properties['P1'] = { de: 'wird bezeichnet als', en: 'is identified by' };
		properties['P2'] = { de: 'hat den Typus', en: 'has type' };
		properties['P3'] = { de: 'hat Anmerkung', en: 'has note' };
		properties['P14'] = { de: 'wurde ausgeführt von', en: 'carried out by' };
		properties['P15'] = { de: 'wurde beeinflusst durch' };
		properties['P94'] = { de: 'hat erschaffen' };
		
		var rules = {};
		
		rules['P102-E35'] = function (graph, link) {
			// add title property to start node
			var endNode = graph.findNode(link.endNode);
			graph.findNode(link.startNode).properties.value = endNode.properties.content;
			// delete end node
			graph.removeNode(endNode.id);
			//console.log('rule', endNode);
			return true;
		};
		rules['P94-E65'] = function (graph, link) {
			
		};
		
		// getter functions
		
		var dict = {};
		
		dict.getClassName = function(entityId) {
			if(entityId in entities)
				return entities[entityId].de;
			else
				return entityId;
		};
		
		dict.getPropertyName = function(propertyId) {
			if(propertyId in properties)
				return properties[propertyId].de;
			else
				return propertyId;
		};
		
		dict.getNodePropertyName = function(classLabel) {
			if(classLabel in entities && entities[classLabel].prefProp)
				return entities[classLabel].prefProp;
			else
				return 'content';
		};
		
		dict.getNodeColor = function(entityId) {
			if(entityId in entities && entities[entityId].color)
				return entities[entityId].color;
			else
				return '#fff';
		};
		
		dict.callRule = function (key, graph, link) {
			if(key in rules)
				return rules[key](graph, link);
			else
				return null;
		};
		
		return dict;
		
	});