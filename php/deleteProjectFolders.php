<?php

	$postdata = json_decode(file_get_contents("php://input"));
	$prj = $postdata->project;
	
	// Pfade
	$datapath = dirname(dirname( __FILE__ )) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR;
	$prjpath = $datapath . $prj . DIRECTORY_SEPARATOR;
	$ds = DIRECTORY_SEPARATOR;
	
	// Rekursives Löschen aller Unterordner und Dateien
	function delTree($dir) {
		global $ds;
		$files = array_diff(scandir($dir), array('.','..')); 
		foreach ($files as $file) { 
			(is_dir($dir.$ds.$file)) ? delTree($dir.$ds.$file) : unlink($dir.$ds.$file); 
		} 
		return rmdir($dir); 
	}
	
	if( delTree($datapath . $prj) )
		echo 'SUCCESS';
	else
		echo 'delTree fehlgeschlagen';
	
?>