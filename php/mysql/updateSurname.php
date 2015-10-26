<?php
	$json = json_decode(file_get_contents("php://input"));
	
	include 'db_connect.php';
	
	$result = mysql_query('UPDATE `db_dokuvis`.`staff` SET `surname` = "'.utf8_decode($json->surname).'" WHERE `staff`.`sid` = "'.utf8_decode($json->sid).'";');
	
	if($result) {
		echo 'SUCCESS';
	}
	else {
		echo 'Eintrag fehlgeschlagen';
	}
?>