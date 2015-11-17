<?php

	include 'globalpaths.php';

	// lese POST-Parameter ein
	(isset($_POST['newFileName'])) ? $newFileName = $_POST['newFileName'] : $newFileName = '';
	(isset($_POST['path'])) ? $path = $_POST['path'] : $path = '';
	(isset($_POST['tid'])) ? $tid = $_POST['tid'] : $tid = '';
	
	if(empty($path) || empty($newFileName) || empty($tid))
		exit('ERROR: POST parameter not complete');
	
	
	// Pfade
	$path = str_replace("/", $DS, $path);
	$upath = $pData . $DS . $path;
	$tmppath = $pTemp . $DS;
	
	// hochgeladene Datei in den tmp Ordner verschieben
	move_uploaded_file( $_FILES[ 'file' ][ 'tmp_name' ], $tmppath . $newFileName )
		or exit('ERROR: move_uploaded_file() failed');
		
	// öffne ZipArchive
	$zip = new ZipArchive();
	$zip->open($tmppath . $newFileName)
		or exit('ERROR: zip open failed');
	
	$plandata = new StdClass();
	
	for($i=0; $i<$zip->numFiles; $i++) {
		$fname = $zip->getNameIndex($i);
		$ftype = array_pop(explode(".", $fname));
		
		if($ftype == 'obj') {
			processObjMtl($fname);
			break;
		}
	}
	
	$zip->close();
	
	// lösche zip-Datei
	unlink($tmppath.$newFileName)
		or exit('ERROR: unlink() failed on '.$newFileName);
	
	// ausgelesene Objekte zurückgeben
	echo json_encode($plandata);
	
	// verarbeite OBJ Datei
	function processObjMtl($objfile) {
		global $tmppath, $upath, $tid, $zip, $plandata;
		
		// extrahiere OBJ-Datei
		$zip->extractTo($tmppath, $objfile)
			or exit('ERROR: zip extraction on obj failed');
		
		$objlines = file($tmppath . $objfile)
			or exit('ERROR: file() failed');
		
		$pattern_mtllib = '/^mtllib ([^\r\n\t\f]*)/';
		$pattern_object = '/^(?:(?:# object )|(?:o ))([^\r\n\t\f]*)/';
		$pattern_usemtl = '/^usemtl ([^\r\n\t\f]*)/';
		
		$mtlfile = $objname = $mtlname = null;
		$flag = 0;
		
		foreach($objlines as $line) {
			if(preg_match($pattern_mtllib, $line, $matches)) {
				//print_r($matches);
				$mtlfile = $matches[1];
			}
			else if(preg_match($pattern_object, $line, $matches)) {
				//print_r($matches);
				$objname = $matches[1];
				$flag = 1;
			}
			else if(preg_match($pattern_usemtl, $line, $matches)) {
				//print_r($matches);
				$mtlname = $matches[1];
				$flag = 0;
			}
		}
		
		if(!($mtlfile && $objname && $mtlname))
			exit('ERROR: no mtllib, object or usemtl found');
		
		$plandata->name = $objname;
		$plandata->materialName = $mtlname;
		
		// extrahiere MTL-Datei
		$zip->extractTo($tmppath, $mtlfile)
			or exit('ERROR: zip extraction on mtl failed');
		
		$mtllines = file($tmppath . $mtlfile)
			or exit('ERROR: file() failed');
		
		$pattern_newmtl = '/^newmtl '.$mtlname.'/';
		$pattern_mapkd = '/map_Kd ([^\r\n\t\f]*)/';
		
		$imgfile = null;
		$flag = 0;
		
		foreach($mtllines as $line) {
			if(preg_match($pattern_newmtl, $line, $matches)) {
				//print_r($matches);
				//$mtlfile = $matches[1];
				$flag = 1;
			}
			else if(preg_match($pattern_mapkd, $line, $matches)) {
				//print_r($matches);
				$imgfile = $matches[1];
				$flag = 0;
			}
		}
		
		if(!$imgfile)
			exit('ERROR: no imgfile found');
		
		// extrahiere Bilddatei
		$zip->extractTo($tmppath, $imgfile)
			or exit('ERROR: zip extraction on img failed');
		
		// entferne möglich Leerzeichen im Dateinamen
		$newimgfile = preg_replace('/\s+/', '_', $imgfile);
		rename($tmppath.$imgfile, $tmppath.$newimgfile)
			or exit('ERROR: rename() failed on '.$imgfile);
		$imgfile = $newimgfile;
		
		// Auflösung auslesen
		$ans = exec("C:\\ImageMagick\\identify.exe -ping ".$tmppath.$imgfile);
		//print_r($ans);
		
		$resolution = preg_split('/x/', preg_split('/\s+/', $ans)[2]);
		$width = $resolution[0];
		$height = $resolution[1];
		
		// neue Auflösung nach 2er-Potenz
		if($width > 1280) $width = 2048;
		else if($width > 640) $width = 1024;
		else if($width > 320) $width = 512;
		else $width = 256;
		if($height > 1280) $height = 2048;
		else if($height > 640) $height = 1024;
		else if($height > 320) $height = 512;
		else $height = 256;
		
		// trenne Dateiendung
		$imgsplit = explode(".", $imgfile);
		$imgtype = array_pop($imgsplit);
		$imgname = $tid."_".implode('_', $imgsplit);
		
		//print_r($imgname.' '.$imgtype);
		
		$ans = exec("C:\\ImageMagick\\convert.exe ".$tmppath.$imgfile." -resize ".$width."x".$height."! ".$tmppath.$imgname.".jpg");
		//print_r($ans."\n");
		
		// trenne Dateiendung
		$objsplit = explode(".", $objfile);
		$objtype = array_pop($objsplit);
		$objname = $tid."_".implode('_', $objsplit);
		
		$res = exec("\"C:\\Program Files (x86)\\OpenCTM 1.0.3\\bin\\ctmconv.exe\" ".$tmppath.$objfile." ".$tmppath.$objname.".ctm --method MG2 --level 1 --vprec 0.001 --nprec 0.01 --no-colors");
		if(strpos($res, ' Error: ') !== false)
			exit('ERROR: ctm Converter failed on '.$objfile);
		
		$plandata->type = $objtype;
		$plandata->file = $objname.'.ctm';
		$plandata->materialMap = $imgname.'.jpg';
		
		// lösche temporäre Dateien
		unlink($tmppath.$objfile)
			or exit('ERROR: unlink() failed on '.$objfile);
		unlink($tmppath.$mtlfile)
			or exit('ERROR: unlink() failed on '.$mtlfile);
		unlink($tmppath.$imgfile)
			or exit('ERROR: unlink() failed on '.$imgfile);
		
		// verschiebe ctm-Datei in Projektordner
		rename($tmppath.$objname.".ctm", $upath.$objname.".ctm")
			or exit('ERROR: rename() failed on '.$objname.'.ctm');
		rename($tmppath.$imgname.".jpg", $upath.'maps'. DIRECTORY_SEPARATOR .$imgname.".jpg")
			or exit('ERROR: rename() failed on '.$imgname.'.jpg');
		
		
	}
	
	
	
?>