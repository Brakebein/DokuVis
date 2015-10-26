<?php
	$json = json_decode(file_get_contents("php://input"));
	
	include 'db_connect.php';
	
	$result = mysql_query('UPDATE `db_dokuvis`.`projects` SET `description` = "'.utf8_decode($json->description).'" WHERE `projects`.`pid` = "'.utf8_decode($json->pid).'";');
	
	if($result) {
		echo 'SUCCESS';
	}
	else {
		echo 'Eintrag fehlgeschlagen';
	}
?>