<?php
	include 'db_connect.php';
	
	$result = mysql_query('SELECT * FROM projects');
	
	$json = '{ "data": [';
		$json .= '{ "pid":'.$row->pid.',"proj":"'.$row->proj_tstamp.'","name":"'.utf8_encode($row->name).'","description":"'.utf8_encode($row->description).'" }';
	$json .= '] }';
	
	echo $json;

?>