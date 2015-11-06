<?php
	
	include 'globalpaths.php';
	
	$postdata = json_decode(file_get_contents("php://input"));
	$prj = $postdata->project;
	
	// Pfade
	$pProj = $pData . $DS . $prj . $DS;
	
	mkdir($pData . $DS . $prj)
		or exit('ERROR: mkdir() failed on'.$prj);
	
	mkdir($pProj . 'models'.$DS.'maps', 0777, true)
		or exit('ERROR: mkdir() failed on models');
	
	mkdir($pProj . 'pictures'.$DS.'_thumbs', 0777, true)
		or exit('ERROR: mkdir() failed on pictures');
	
	mkdir($pProj . 'texts'.$DS.'_thumbs', 0777, true)
		or exit('ERROR: mkdir() failed on texts');
	
	mkdir($pProj . 'screenshots'.$DS.'_thumbs', 0777, true)
		or exit('ERROR: mkdir() failed on screenshots');
	
	mkdir($pProj . 'plans'.$DS.'_thumbs', 0777, true)
		or exit('ERROR: mkdir() failed on plans');
		
	mkdir($pProj . 'plans'.$DS.'models'.$DS.'maps', 0777, true)
		or exit('ERROR: mkdir() failed on plans/models');
		
	echo 'SUCCESS';
?>