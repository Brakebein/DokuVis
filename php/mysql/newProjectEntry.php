<?php
	$json = json_decode(file_get_contents("php://input"));
	
	include 'db_connect.php';
	
	$result = mysql_query('INSERT INTO projects(proj_tstamp, name, description) VALUES("'.$json->proj.'","'.utf8_decode($json->name).'","'.utf8_decode($json->description).'")');
	
	if($result) {
		echo 'SUCCESS';
	}
	else {
		echo 'Eintrag fehlgeschlagen';
	}
?>