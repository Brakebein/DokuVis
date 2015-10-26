<?php
	$json = json_decode(file_get_contents("php://input"));
	
	include 'db_connect.php';
	
	$result = mysql_query('UPDATE `db_dokuvis`.`staff` SET `mail` = "'.utf8_decode($json->mail).'" WHERE `staff`.`sid` = "'.utf8_decode($json->sid).'";');
	
	if($result) {
		echo 'SUCCESS';
	}
	else {
		echo 'Eintrag fehlgeschlagen';
	}
?>