<?php
	$json = json_decode(file_get_contents("php://input"));
	
	include 'db_connect.php';
	
	$result = mysql_query('INSERT INTO staff(name, surname, mail, role) VALUES("'.utf8_decode($json->name).'","'.utf8_decode($json->surname).'","'.utf8_decode($json->mail).'","'.$json->role.'")');
	
	if($result) {
		echo 'SUCCESS';
	}
	else {
		echo 'Eintrag fehlgeschlagen';
	}
?>