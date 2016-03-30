angular.module('dokuvisApp').factory('Utilities',
	function($alert) {
		
		var f = {};
		
		/**
		  * Base62 encoder/decoder
		*/
		f.Base62 = function() {
			var DEFAULT_CHARACTER_SET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
			this.characterSet = DEFAULT_CHARACTER_SET;
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
		  * generate unique id from timestamp
		*/
		f.getUniqueId = function() {
			return new f.Base62().encode(new Date().getTime());
		};
		
		/**
		  * sleep function - application on hold
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
		  * @desc wait until condition is met
		  * @param
		  *	  test - function that returns a value
		  *	  expectedValue - value of the test function we are waiting for
		  *	  msec - delay between the calls to test
		  *	  callback - function to execute wehen the condition is met
		  * @return nothing
		*/
		 f.waitfor = function(test, expectedValue, msec, params, callback) {
			// check if condition met. if not, re-check later
			while(test() !== expectedValue) {
				setTimeout(function() {
					waitfor(test, expectedValue, msec, params, callback);
				}, msec);
				return;
			}
			// condition finally met. callback() can be executed
			callback(params);
		}
		
		/**
		  * extracts data from neo4j response object
		  * if return values are nodes
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
		
		/**
		  * extracts array data from neo4j response object
		  * (e.g. for getting a list of tags etc.)
		*/
		f.extractArrayFromNeo4jData = function(data) {
			var results = [];
			for(var i=0; i<data.data.length; i++) {
				results.push(data.data[i][0]);
			}
			return results;
		};
		
		// createHierarchy(data, ['file', 'obj'])
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
		
		/**
		  * Alerts
		*/
		f.dangerAlert = function(message) {
			$alert({
				content: message,
				type: 'danger',
				duration: 5
			});
		};
		
		/**
		  * Exceptions
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
		f.throwNeo4jException = function(message, data) {
			$alert({
				title: 'Neo4jException:',
				content: message,
				type: 'danger',
				duration: 5
			});
			console.error('Neo4jException: '+message, data);
		};
		f.throwApiException = function(message, data) {
			$alert({
				title: 'API Exception:',
				content: message,
				type: 'danger',
				duration: 5
			});
			console.error('API Exception: '+message, data, "\n"+(new Error).stack.split("\n")[2]);
		};
		
		return f;
		
	});