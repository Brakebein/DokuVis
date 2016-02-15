<?php

	include 'db_connect.php';
	
	$result = mysql_query('SELECT u.id as uid, u.email, u.name as uname, r.role, r.id as rid, p.name as pname
	FROM users u
		INNER JOIN user_project_role upr 
		ON u.id = upr.user_id 
		INNER JOIN projects p 
		ON upr.project_id=p.pid 
		INNER JOIN roles r 
		ON upr.role_id=r.id 
		WHERE p.pid = 52'); //Projektnummer ändern
	
	$data = [];
	
	while($row = mysql_fetch_object($result)) {
		$obj = new stdClass();
		$obj->sid = $row->uid;
		$obj->email = utf8_encode($row->email);
		$obj->name = utf8_encode($row->uname);
		$obj->rid = utf8_encode($row->rid);
		$obj->role = utf8_encode($row->role);
		$obj->pname = utf8_encode($row->pname);
		array_push($data, $obj);
	}
	
echo json_encode($data);

?> 

