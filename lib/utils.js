// sleep
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

/**
  * @desc wait until condition is met
  * @param
  *	  test - function that returns a value
  *	  expectedValue - value of the test function we are waiting for
  *	  msec - delay between the calls to test
  *	  callback - function to execute wehen the condition is met
  * @return nothing
*/
function waitfor(test, expectedValue, msec, params, callback) {
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
  * Base62 encoder/decoder
*/
function Base62() {
	var DEFAULT_CHARACTER_SET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	this.characterSet = DEFAULT_CHARACTER_SET;
}
Base62.prototype.encode = function(integer) {
	if(integer === 0) return '0';
	var s = '';
	while(integer > 0) {
		s = this.characterSet[integer % 62] + s;
		integer = Math.floor(integer/62);
	}
	return s;
}
Base62.prototype.decode = function(base62String) {
	var val = 0, base62Chars = base62String.split("").reverse();
	base62Chars.forEach(function(character, index) {
		val += this.characterSet.indexOf(character) * Math.pow(62, index);
	});
	return val;
}
Base62.prototype.setCharacterSet = function(chars) {
	var arrayOfChars = chars.split(""), uniqueCharacters = [];

	if(arrayOfChars.length != 62) throw Error("You must supply 62 characters");

	arrayOfChars.forEach(function(char){
		if(!~uniqueCharacters.indexOf(char)) uniqueCharacters.push(char);
	});

	if(uniqueCharacters.length != 62) throw Error("You must use unique characters.");

	this.characterSet = arrayOfChars;
}