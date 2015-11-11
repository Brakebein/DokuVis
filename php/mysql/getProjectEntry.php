<?php
	$json = json_decode(file_get_contents("php://input"));
	
	include 'db_connect.php';
	
	$result = mysql_query('SELECT * FROM projects WHERE proj_tstamp = "'.$json->proj.'"');
	
	$obj = 0;
	
	if($row = mysql_fetch_object($result)) {
		$obj = new stdClass();
		$obj->pid = $row->pid;
		$obj->proj = $row->proj_tstamp;
		$obj->name = utf8_encode($row->name);
		$obj->description = utf8_encode($row->description);
	}
	
	if($obj) {
		echo json_encode($obj);
	}
	else {
		echo 'NO ENTRY';
	}
?>