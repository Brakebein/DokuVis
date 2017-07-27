<?php
	$json = $_POST['json'];
	
	if(json_decode($json) != null) {
		$file = fopen('selected.json', 'w+');
		fwrite($file, $json);
		fclose($file);
	}
?>