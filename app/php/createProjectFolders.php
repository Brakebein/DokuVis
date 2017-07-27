<?php
	
	include 'globalpaths.php';
	
	$postdata = json_decode(file_get_contents("php://input"));
	$prj = $postdata->project;
	
	// Pfade
	$pProj = $pData . $DS . $prj . $DS;
	
	// Ordner anlegen
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
	
	// swish.config kopieren und editieren
	copy($pData . $DS . 'default_swish.config', $pProj . 'swish.config')
		or exit('ERROR: copy failed on swish.config');
	
	$sfp = fopen($pProj.'swish.config', 'a')
		or die('Unable to open file swish.config');
	
	$configAdd = "\nIgnoreWords File: ".$pProj."blacklist.txt";
	$configAdd .= "\nBuzzwords File: ".$pProj."whitelist.txt";
	
	fwrite($sfp, $configAdd);
	fclose($sfp);
	
	// blacklist und whitelist erstellen
	$fp = fopen($pProj.'blacklist.txt', 'w')
		or die('Unable to open file blacklist.txt');
	fclose($fp);
	$fp = fopen($pProj.'whitelist.txt', 'w')
		or die('Unable to open file whitelist.txt');
	fclose($fp);
	
	echo 'SUCCESS';
?>