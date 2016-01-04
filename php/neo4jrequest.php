<?php
	$url = 'http://localhost:7474/db/data/cypher';
	$content = file_get_contents("php://input");
	
	//var_dump($content);
	$curl = curl_init($url);
	
	curl_setopt($curl, CURLOPT_URL, $url);
	curl_setopt($curl, CURLOPT_HEADER, false);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl, CURLOPT_HTTPHEADER, array("Content-type: application/json", "Authorization: Basic bmVvNGo6Y2F2YWxlcmE="));
	curl_setopt($curl, CURLOPT_POST, true);
	curl_setopt($curl, CURLOPT_POSTFIELDS, $content);
	
	$response = curl_exec($curl);
	//echo $response;
	print_r($response);
	curl_close($curl);
	
?>