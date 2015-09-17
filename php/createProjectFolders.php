<?php

	$postdata = json_decode(file_get_contents("php://input"));
	$prj = $postdata->project;
	
	// Pfade
	$datapath = dirname(dirname( __FILE__ )) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR;
	$prjpath = $datapath . $prj . DIRECTORY_SEPARATOR;
	$ds = DIRECTORY_SEPARATOR;
	
	mkdir($datapath . $prj)
		or exit('ERROR: mkdir() failed on'.$prj);
	
	mkdir($prjpath . 'models'.$ds.'maps', 0777, true)
		or exit('ERROR: mkdir() failed on models');
	
	mkdir($prjpath . 'pictures'.$ds.'_thumbs', 0777, true)
		or exit('ERROR: mkdir() failed on pictures');
	
	mkdir($prjpath . 'screenshots'.$ds.'_thumbs', 0777, true)
		or exit('ERROR: mkdir() failed on screenshots');
	
	mkdir($prjpath . 'plans'.$ds.'_thumbs', 0777, true)
		or exit('ERROR: mkdir() failed on plans');
		
	mkdir($prjpath . 'plans'.$ds.'models'.$ds.'maps', 0777, true)
		or exit('ERROR: mkdir() failed on plans/models');
		
	echo 'SUCCESS';
?>