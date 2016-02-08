<?php
	$json = json_decode(file_get_contents("php://input"));
	
	include 'db_connect.php';
	
	
	
	$result = mysql_query('DELETE FROM users WHERE id = "'.$json->sid.'";');
	$result2= mysql_query('DELETE FROM user_project_role WHERE user_id = "'.$json->sid.'" and project_id = "40" and role_id = "'.$json->rid.'"');
	
	if($result && $result2) {
		echo 'SUCCESS';
	}
	else {
		echo 'DELETE fehlgeschlagen';
	}
?><?php

?>