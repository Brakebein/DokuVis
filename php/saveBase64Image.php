<?php

	$postdata = json_decode(file_get_contents("php://input"));
	
	// Pfade
	$path = str_replace("/", DIRECTORY_SEPARATOR, $postdata->path);
	$upath = dirname(dirname( __FILE__ )) . DIRECTORY_SEPARATOR . $path;
	$tmppath = dirname(dirname( __FILE__ )) . DIRECTORY_SEPARATOR . 'tmp' . DIRECTORY_SEPARATOR;
	
	$fname = $postdata->filename;
	
	$img = $postdata->imgdata;
	$img = str_replace('data:image/jpeg;base64,', '', $img);
	
	file_put_contents($upath . $fname, base64_decode($img))
		or exit('ERROR: file_put_contents() failed');
		
	// Auflösung auslesen
	/*$ans = exec("C:\\ImageMagick\\identify.exe -ping ".$upath.$fname);
	//print_r($ans);
	
	$resolution = preg_split('/x/', preg_split('/\s+/', $ans)[2]);
	$dim = new StdClass();
	$dim->width = $resolution[0];
	$dim->height = $resolution[1];
	*/
	// Thumbnail erstellen
	exec("C:\\ImageMagick\convert.exe ".$upath.$fname." -resize \"160x90^\" -gravity center -extent 160x90 ".$upath."_thumbs".DIRECTORY_SEPARATOR."t_".$fname);
	
	//echo json_encode($dim);
	echo 'SUCCESS';
	
?>