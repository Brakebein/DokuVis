<?php
	$json = json_decode(file_get_contents("php://input"));
	
	include 'db_connect.php';
	
	$result = mysql_query('DELETE FROM projects WHERE proj_tstamp = "'.$json->proj.'"');
	
	if($result) {
		echo 'SUCCESS';
	}
	else {
		echo 'DELETE fehlgeschlagen';
	}
?>