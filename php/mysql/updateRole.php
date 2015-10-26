<?php
	$json = json_decode(file_get_contents("php://input"));
	
	include 'db_connect.php';
	
	$result = mysql_query('UPDATE `db_dokuvis`.`staff` SET `role` = "'.utf8_decode($json->role).'" WHERE `staff`.`sid` = "'.utf8_decode($json->sid).'";');
	
	if($result) {
		echo 'SUCCESS';
	}
	else {
		echo 'Eintrag fehlgeschlagen';
	}
?>