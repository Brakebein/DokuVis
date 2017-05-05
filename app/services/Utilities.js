/**
 * This factory provides some helpful functions.
 * @ngdoc factory
 * @name Utilities
 * @module dokuvisApp
 * @author Brakebein
 * @requires http://mgcrea.github.io/angular-strap/#/alerts $alert
 */
angular.module('dokuvisApp').factory('Utilities',
	function($alert) {
		
		var f = {};
		
		/**
		  * Base62 encoder/decoder
		*/
		f.Base62 = function() {
			this.characterSet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		};
		f.Base62.prototype.encode = function(integer) {
			if(integer === 0) return '0';
			var s = '';
			while(integer > 0) {
				s = this.characterSet[integer % 62] + s;
				integer = Math.floor(integer/62);
			}
			return s;
		};
		f.Base62.prototype.decode = function(base62String) {
			var val = 0, base62Chars = base62String.split("").reverse();
			base62Chars.forEach(function(character, index) {
				val += this.characterSet.indexOf(character) * Math.pow(62, index);
			});
			return val;
		};
		f.Base62.prototype.setCharacterSet = function(chars) {
			var arrayOfChars = chars.split(""), uniqueCharacters = [];

			if(arrayOfChars.length != 62) throw Error("You must supply 62 characters");

			arrayOfChars.forEach(function(char){
				if(!~uniqueCharacters.indexOf(char)) uniqueCharacters.push(char);
			});

			if(uniqueCharacters.length != 62) throw Error("You must use unique characters.");

			this.characterSet = arrayOfChars;
		};

		/**
		 * Generate unique short id (using timestamp).
		 * @ngdoc method
		 * @name Utilities#getUniqueId
		 * @returns {string} Short id
		 */
		f.getUniqueId = function() {
			return new f.Base62().encode(new Date().getTime());
		};

		/**
		 * Sleep function - application on hold.
		 * @ngdoc method 
		 * @name Utilities#sleep
		 * @param milliseconds {number} Milliseconds
		 */
		f.sleep = function(milliseconds) {
			var start = new Date().getTime();
			for (var i = 0; i < 1e7; i++) {
				if ((new Date().getTime() - start) > milliseconds){
					break;
				}
			}
		};

		/**
		 * Wait until condition is met.
		 * @ngdoc method 
		 * @name Utilities#waitfor
		 * @param test {function} Function that returns a value
		 * @param expectedValue {string|number|boolean} Value of the test function we are waiting for
		 * @param msec {number} Delay between the calls to test
		 * @param params {Object} Parameters to be passed to the callback function
		 * @param callback {function} Function to execute when the condition is met
		 */
		 f.waitfor = function(test, expectedValue, msec, params, callback) {
			// check if condition met. if not, re-check later
			if (test() !== expectedValue) {
				setTimeout(function() {
					waitfor(test, expectedValue, msec, params, callback);
				}, msec);
				return;
			}
			// condition finally met. callback() can be executed
			callback(params);
		};
		
		/**
		 * Extracts data from neo4j response object, if return values are nodes.
		 * @ngdoc method
		 * @name Utilities#extractNeo4jData
		 * @param data {Object}
		 * @returns {Array}
		 * @deprecated
		*/
		f.extractNeo4jData = function(data) {
			var results = [];
			for(var i=0; i<data.data.length; i++) {
				var object = new Object();
				for(var j=0; j<data.columns.length; j++) {
					if(data.data[i][j] == null)
						//object[data.columns[j]] = 'unbekannt';
						object[data.columns[j]] = null;
					else
						object[data.columns[j]] = data.data[i][j].data;
						//object[data.columns[j]] = data.data[i][j].data.content;
				}
				results.push(object);
			}
			return results;
		};
		
		/**
		 * extracts data from neo4j response object
		 * if return values are normal values or objects
		 * @ngdoc method
		 * @name Utilities#cleanNeo4jData
		 * @param data {Object}
		 * @param selected {boolean}
		 * @returns {Array}
		 * @deprecated
		*/
		f.cleanNeo4jData = function(data, selected) {
			selected = selected || false;
			var results = [];
			for(var i=0; i<data.data.length; i++) {
				var obj = new Object();
				for(var j=0; j<data.columns.length; j++) {
					if(data.data[i][j] == null)
						//obj[data.columns[j]] = 'unbekannt';
						obj[data.columns[j]] = null;
					else
						obj[data.columns[j]] = data.data[i][j];
				}
				if(selected)
					obj.selected = false;
				results.push(obj);
			}
			return results;
		};
		
		f.extractNeo4jTransactData = function(data) {
			var results = [];
			for(var i=0, l=data.data.length; i<l; i++) {
				var obj = {};
				for(var j=0; j<data.columns.length; j++) {
					obj[data.columns[j]] = data.data[i].row[j];
				}
				results.push(obj);
			}
			return results;
		};
		
		/**
		 * extracts array data from neo4j response object
		 * (e.g. for getting a list of tags etc.)
		 * @ngdoc method
		 * @name Utilities#extractArrayFromNeo4jData
		 * @param data {Object}
		 * @returns {Array}
		 * @deprecated
		*/
		f.extractArrayFromNeo4jData = function(data) {
			var results = [];
			for(var i=0; i<data.data.length; i++) {
				results.push(data.data[i][0]);
			}
			return results;
		};
		
		/**
		 * Create hierarchy of node results.
		 * @ngdoc method
		 * @name Utilities#createHierarchy
		 * @param data {Object}
		 * @param props {string[]}
		 * @param isNode {boolean}
		 * @returns {Array}
		 * @deprecated
		 * @example
		 * ```js
		 * createHierarchy(data, ['file', 'obj']);
		 * ```
		 */
		f.createHierarchy = function(data, props, isNode) {
			var results = [];
			for(var i=0, l=data.data.length; i<l; i++) {
				var parent = {};
				/*parent.file = data.data[i][0].file.data;
				parent.obj = data.data[i][0].obj.data;*/
				parent.content = data.data[i][0].parent.data.content;
				parent.children = [];
				for(var j=0, m=data.data[i][1].length; j<m; j++) {
					var child = {};
					for(var k=0; k<props.length; k++) {
						if(isNode)
							child[props[k]] = data.data[i][1][j][props[k]].data;
						else
							child[props[k]] = data.data[i][1][j][props[k]];
					}
					// child.file = data.data[i][1][j].file.data;
					// child.obj = data.data[i][1][j].obj.data;
					child.content = data.data[i][1][j].child.data.content;
					child.children = [];
					parent.children.push(child);
				}
				results.push(parent);
			}
			for(var i=0; i<results.length; i++) {
				for(var j=0, m=results.length; j<m; j++) {
					if(i===j) continue;
					var p = getElementInHierarchy(results[j], results[i].content);
					if(p !== undefined) {
						p.children = results[i].children;
						results.splice(i,1);
						i--;
						break;
					}
				}
			}
			return results;
		};
		
		function getElementInHierarchy(node, content) {
			if(node.content === content) return node;
			for(var i=0, l=node.children.length; i<l; i++) {
				var obj = getElementInHierarchy(node.children[i], content);
				if(obj !== undefined) return obj;
			}
			return undefined;
		}

		// Alerts
		/**
		 * Shows a danger alert for 5 seconds.
		 * @ngdoc method
		 * @name Utilities#dangerAlert
		 * @param message {string} Message to show
		 */
		f.dangerAlert = function(message) {
			$alert({
				content: message,
				type: 'danger',
				duration: 5
			});
		};

		// Exceptions
		/**
		 * Shows a danger alert.
		 * @ngdoc method
		 * @name Utilities#throwException
		 * @param title {string} Title of the alert
		 * @param message {string} Message to show
		 * @param data {*} Addtional data to be shown within the console
		 */
		f.throwException = function(title, message, data) {
			$alert({
				title: title+':',
				content: message,
				type: 'danger',
				duration: 5
			});
			console.error(title+': '+message, data, "\n"+(new Error).stack.split("\n")[2]);
		};
		/**
		 * Shows a danger alert titled with `Neo4jException`.
		 * @ngdoc method
		 * @name Utilities#throwNeo4jException
		 * @param message {string} Message to show
		 * @param data {*} Addtional data to be shown within the console
		 */
		f.throwNeo4jException = function(message, data) {
			$alert({
				title: 'Neo4jException:',
				content: message,
				type: 'danger',
				duration: 5
			});
			console.error('Neo4jException: '+message, data);
		};
		/**
		 * Shows a danger alert titled with `API Exception`.
		 * @ngdoc method
		 * @name Utilities#throwApiException
		 * @param message {string} Message to show
		 * @param data {*} Addtional data to be shown within the console
		 */
		f.throwApiException = function(message, data) {
			if (data.status === 403)
				message = 'Access denied ' + message + ' (' + data.statusText + ' ' + data.status + ')';
			$alert({
				title: 'API Exception:',
				content: message,
				type: 'danger',
				duration: 5
			});
			console.error('API Exception: ' + message, data, "\n" + (new Error).stack.split("\n")[2]);
		};
		
		return f;
		
	});
