<?php

ini_set('max_execution_time', 1000);

include 'globalpaths.php';

if ( !empty( $_FILES ) ) {
	
	(isset($_POST['newFileName'])) ? $newFileName = $_POST['newFileName'] : $newFileName = '';
	(isset($_POST['pureNewFileName'])) ? $pureNewFileName = $_POST['pureNewFileName'] : $pureNewFileName = '';
	(isset($_POST['fileType'])) ? $fileType = $_POST['fileType'] : $fileType = '';
	(isset($_POST['path'])) ? $path = $_POST['path'] : $path = '';
	
	(isset($_POST['language'])) ? $lang = $_POST['language'] : $lang = '';
	(isset($_POST['ocr'])) ? $ocr = $_POST['ocr'] : $ocr = false;
	(isset($_POST['resample'])) ? $resample = $_POST['resample'] : $resample = false;
	
	if(empty($lang)) {
		$lang = 'deu';
	}
	else {
		$tessLangMap = [
			'de' => 'deu',
			'de_frak' => 'deu_frak',
			'en' => 'eng',
			'fr' => 'fra',
			'es' => 'spa',
			'it' => 'ita',
			'la' => 'lat',
			'el' => 'ell',
			'ar' => 'ara'
		];
		$lang = $tessLangMap[$lang];
	}
	
	if(empty($path)) {
		echo 'No path';
		return;
	}
	else {
		$path = str_replace("/", $DS, $path);
		$upath = $pData . $DS . $path;	// upload path
	}
	
	// hochgeladene Datei in tmp-Ordner verschieben
	$tempPath = $_FILES[ 'file' ][ 'tmp_name' ];
    move_uploaded_file( $tempPath, $pTemp.$DS.$newFileName );
	
	$pageCount = 0;
	$pages = [];
	
	if($ocr === "true") {
		
		// Unterordner im tmp-Ordner anlegen
		mkdir($pTemp . $DS . $pureNewFileName)
			or exit('ERROR: mkdir() failed on'.$pureNewFileName);
		
		// pdf in jpg extrahieren
		$res = system($pGhostscript.' -dNOPAUSE -dBATCH -sDEVICE=jpeg -sOutputFile="'.$pTemp.$DS.$pureNewFileName.$DS.$newFileName.'-%04d.jpg" '.$pTemp.$DS.$newFileName);
		echo $res;
		
		// Dateien im Ordner durchgehen
		$files = array_diff(scandir($pTemp.$DS.$pureNewFileName), array('.','..'));
		foreach($files as $file) {
			if($pageCount === 0) {
				// thumbnail von erster Seite erstellen
				$res = system($pImagickConvert." ".$pTemp.$DS.$pureNewFileName.$DS.$file." -resize \"160x90^\" -gravity north -extent 160x90 ".$pTemp.$DS."t_".$pureNewFileName.".jpg");
				echo $res;
			}
			
			// resample auf 300 dpi für bessere Texterkennung
			if($resample === "true") {
				$res = system($pImagickMogrify.' -resample 300 '.$pTemp.$DS.$pureNewFileName.$DS.$file);
				echo $res;
			}

			// Texterkennung -> pdf mit Textlayer
			$res = system($pTesseract.' --tessdata-dir '.$pTessData.' -l '.$lang.' '.$pTemp.$DS.$pureNewFileName.$DS.$file.' '.$pTemp.$DS.$pureNewFileName.$DS.$file.' hocr');
			echo $res;
			
			$pageName = substr($file, 0, strrpos($file, "."));
			
			rename($pTemp.$DS.$pureNewFileName.$DS.$file.'.hocr', $upath.$pageName.'.hocr')
				or exit('ERROR: rename() failed on '.$pageCount.'.hocr');
			rename($pTemp.$DS.$pureNewFileName.$DS.$file, $upath.$pageName.'.jpg')
				or exit('ERROR: rename() failed on '.$pageCount.'.jpg');
			
			array_push($pages, $pageName);
			$pageCount++;
		}
		
		// Zusammenführen der einzelnen pdfs
		// $res = system($pPDFtk.' '.$pTemp.$DS.$pureNewFileName.$DS.'*.pdf cat output '.$pTemp.$DS.$pureNewFileName.$DS.'final.pdf');
		// echo $res;
		
		// verschiebe pdf in Projektordner
		// rename($pTemp.$DS.$pureNewFileName.$DS.'final.pdf', $upath.$pureNewFileName.'_ocr.pdf')
			// or exit('ERROR: rename() failed on final.pdf');
		
		rename($pTemp.$DS.$newFileName, $upath.$newFileName)
			or exit('ERROR: rename() failed on '.$newFileName);
		rename($pTemp.$DS.'t_'.$pureNewFileName.'.jpg', $upath.'_thumbs'.$DS.'t_'.$pureNewFileName.'.jpg')
			or exit('ERROR: rename() failed on t_'.$pureNewFileName);
		
		// Löschen der tmp-Dateien und Ordner
		$files = array_diff(scandir($pTemp.$DS.$pureNewFileName), array('.','..'));
		foreach ($files as $file) { 
			unlink($pTemp.$DS.$pureNewFileName.$DS.$file);
		}
		rmdir($pTemp.$DS.$pureNewFileName);
		
	}
	else {
		// erste Seite im pdf in jpg extrahieren
		$res = system($pGhostscript.' -dNOPAUSE -dBATCH -sDEVICE=jpeg -dLastPage=1 -sOutputFile="'.$pTemp.$DS.'t_'.$pureNewFileName.'.jpg" '.$pTemp.$DS.$newFileName);
		echo $res;
		
		// thumbnail erstellen
		$res = system($pImagickMogrify." -resize \"160x90^\" -gravity north -extent 160x90 ".$pTemp.$DS."t_".$pureNewFileName.".jpg");
		echo $res;
		
		rename($pTemp.$DS.$newFileName, $upath.$newFileName)
			or exit('ERROR: rename() failed on '.$newFileName);
		rename($pTemp.$DS.'t_'.$pureNewFileName.'.jpg', $upath.'_thumbs'.$DS.'t_'.$pureNewFileName.'.jpg')
			or exit('ERROR: rename() failed on t_'.$pureNewFileName);
		
	}
	
	$answer = array(
		'answer' => 'File transfer completed',
		'data' => array('pages' => $pages)
	);
    $json = json_encode( $answer );

    echo $json;

}
else {
	echo 'No files';
}

/*
$res = system($pPDFtk.' '.$docPath.$inputFile.' dump_data_utf8');
$res = system($pPDFtk.' '.$docPath.'sponsel\\final.pdf dump_data_utf8');
echo $res;


$res = system($pGhostscript.' -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dBATCH  -dQUIET -sOutputFile='.$docPath.'sponsel'.$DS.'final_c.pdf '.$docPath.'sponsel'.$DS.'final.pdf');

echo "swish-e\n";
$res = shell_exec($pSwishe.' -i '.$docPath.$final.'.pdf -f '.$docPath.'index.swish-e -c '.$pSwisheConfig);
echo $res;
*/
?>