importScripts( "jszip.min.js" );

self.onmessage = function( event ) {

	var zip = new JSZip(event.data.data);

	var vobj = JSON.parse(zip.file(event.data.file + '.json').asText());

	if (vobj.data.attributes.position.array.length === 0)
		self.postMessage( 0 );
	else {
		var floatarray = new Float32Array(vobj.data.attributes.position.array);
		self.postMessage(floatarray);
	}

	self.close();

};
