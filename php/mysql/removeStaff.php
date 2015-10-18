<?php
	$json = json_decode(file_get_contents("php://input"));
	
	include 'db_connect.php';
	
	$result = mysql_query('DELETE FROM staff WHERE name = "'.$json->name.'" and surname = "'.$json->surname.'"');
	
	if($result) {
		echo 'SUCCESS';
	}
	else {
		echo 'DELETE fehlgeschlagen';
	}
?><?php

?>