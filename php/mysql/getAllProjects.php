<?php

	include 'db_connect.php';
	
	$result = mysql_query('SELECT * FROM projects');
	
	$data = [];
	
	while($row = mysql_fetch_object($result)) {
		$obj = new stdClass();
		$obj->pid = $row->pid;
		$obj->proj = $row->proj_tstamp;
		$obj->name = utf8_encode($row->name);
		$obj->description = utf8_encode($row->description);
		array_push($data, $obj);
	}
	
	echo json_encode($data);

?>