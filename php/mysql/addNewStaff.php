<?php
	$json = json_decode(file_get_contents("php://input"));
	
	include 'db_connect.php';
	
	$result = mysql_query('INSERT INTO users(id, name, email) VALUES("'.utf8_decode($json->sid).'","'.utf8_decode($json->name).'","'.utf8_decode($json->mail).'")'); 
	$result2 = mysql_query('INSERT INTO user_project_role(user_id,project_id,role_id) VALUES("'.utf8_decode($json->sid).'","'.$json->pid.'","'.utf8_decode($json->rid).'")');//Projektid anpassen
	if($result && $result2) {
		echo 'SUCCESS';
	}
	else {
		echo 'Eintrag fehlgeschlagen';
	}
?>