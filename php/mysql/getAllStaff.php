<?php

	include 'db_connect.php';
	
	$result = mysql_query('SELECT * FROM staff');
	
	$json = '{ "data": [';
	$c = 0;
	while($row = mysql_fetch_object($result)) {
		if($c != 0) $json .= ',';
		$c += 1;
		$json .= '{ "sid":'.$row->sid.',"name":"'.utf8_encode($row->name).'","surname":"'.utf8_encode($row->surname).'","mail":"'.utf8_encode($row->mail).'","role":"'.utf8_encode($row->role).'","projects":"'.utf8_encode($row->projects).'" }';
	}
	$json .= '] }';
	
	echo $json;

?>