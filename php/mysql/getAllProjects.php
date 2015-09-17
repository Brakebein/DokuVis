<?php

	include 'db_connect.php';
	
	$result = mysql_query('SELECT * FROM projects');
	
	$json = '{ "data": [';
	$c = 0;
	while($row = mysql_fetch_object($result)) {
		if($c != 0) $json .= ',';
		$c += 1;
		$json .= '{ "pid":'.$row->pid.',"proj":"'.$row->proj_tstamp.'","name":"'.utf8_encode($row->name).'","description":"'.utf8_encode($row->description).'" }';
	}
	$json .= '] }';
	
	echo $json;

?>