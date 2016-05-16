angular.module('dokuvisApp').factory('CidocDict',
	function() {
		
		// dictionary
		
		var entities = {};
		
		entities['E21'] = { de: 'Person', prefProp: 'title', color: '#ffa992' };
		entities['E31'] = { de: 'Dokument', prefProp: 'title', color: '#cbf09a' };
		entities['E33'] = { de: 'Kommentar', prefProp: 'value', color: '#cae4e8' };
		entities['E35'] = { de: 'Titel', prefProp: 'value', color: '#cae4e8' };
		entities['E40'] = { de: 'Institution', prefProp: 'title' };
		entities['E42'] = { de: 'Kennung' };
		entities['E52'] = { de: 'Zeit', prefProp: 'title', color: '#ffffbf' };
		entities['E53'] = { de: 'Ort', prefProp: 'title', color: '#ffffbf' };
		entities['E55'] = { de: 'Typus', color: '#e5e5e5' };
		entities['E56'] = { de: 'Sprache', color: '#e5e5e5' };
		entities['E62'] = { de: 'Zeichenkette', prefProp: 'value', color: '#ffe866' };
		entities['E65'] = { de: 'Begriffliche Schöpfung' };
		entities['E78'] = { de: 'Sammlung', prefProp: 'title' };
		entities['E82'] = { de: 'Akteurbenennung', color: '#cae4e8' };
		entities['E84'] = { de: 'Informationsträger' };
		
		var properties = {};
		
		properties['P1'] = { de: 'wird bezeichnet als', en: 'is identified by' };
		properties['P2'] = { de: 'hat den Typus', en: 'has type' };
		properties['P3'] = { de: 'hat Anmerkung', en: 'has note' };
		properties['P14'] = { de: 'wurde ausgeführt von', en: 'carried out by' };
		properties['P15'] = { de: 'wurde beeinflusst durch', en: 'was influenced by' };
		properties['P52'] = { de: 'im Besitz von', en: 'has current owner' };
		properties['P94'] = { de: 'hat erschaffen', en: 'has produced' };
		
		properties['P4a'] = { de: 'wurde erstellt während', en: 'produced during' };
		properties['P7a'] = { de: 'wurde erstellt in', en: 'produced in' };
		properties['P14a'] = { de: 'wurde erstellt durch', en: 'produced by' };
		properties['P72a'] = { de: 'hat Sprache', en: 'has language' };
		properties['P128a'] = { de: 'archiviert in', en: 'archived in' };

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
		
		return dict;
		
	});