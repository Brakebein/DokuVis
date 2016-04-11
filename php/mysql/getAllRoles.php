<?php

	include 'db_connect.php';
	
	$result = mysql_query('SELECT *	FROM roles'); //Projektnummer ändern
	
	$data = [];
	
	while($row = mysql_fetch_object($result)) {
		$obj = new stdClass();
		$obj->rid = $row->id;
		$obj->role = utf8_encode($row->role);
		array_push($data, $obj);
	}
	
echo json_encode($data);

?> 

