<?php
	$postdata = json_decode(file_get_contents("php://input"));
	
	$file = dirname(dirname( __FILE__ )) . DIRECTORY_SEPARATOR . str_replace("/", DIRECTORY_SEPARATOR, $postdata->file);
	
	echo file_get_contents($file);
?>