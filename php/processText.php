<?php

include 'globalpaths.php';

$docPath = dirname(dirname( __FILE__ )). DIRECTORY_SEPARATOR .'data'. DIRECTORY_SEPARATOR .'texts'. DIRECTORY_SEPARATOR;
$ds = DIRECTORY_SEPARATOR;

$inputFile = 'sponsel_280_neu.pdf';
$inputFile = 'whbartlett-jerusalem_revisited.pdf';
$image = 'sponsel_i.jpg';
$final = 'sponsel_final';

$lang = 'deu';
//$lang = 'eng';



$res = system('pdftk '.$docPath.$inputFile.' dump_data_utf8');
echo $res;
/*
mkdir($docPath . 'sponsel')
	or exit('ERROR: mkdir() failed on'.$prj);

echo "Ghostscript\n";
$res = system($pGhostscript.' -dNOPAUSE -dBATCH -sDEVICE=jpeg -sOutputFile="'.$docPath.'sponsel'.$ds.'sponsel-%04d.jpg" '.$docPath.$inputFile);
//$res = exec($pGhostscript.' -q -c "(../data/texts/'.$inputFile.') (r) file runpdfbegin pdfpagecount = quit"');
echo $res;

$files = array_diff(scandir($docPath.'sponsel'), array('.','..')); 
var_dump($files);
foreach ($files as $file) { 
	//(is_dir($dir.$ds.$file)) ? delTree($dir.$ds.$file) : unlink($dir.$ds.$file); 

	// echo "Imagick\n";
	// $res = system($pImagickMogrify.' -resample 300 '.$docPath.'sponsel'.$ds.$file);
	// echo $res;

	echo "Tesseract\n";
	$res = system($pTesseract.' --tessdata-dir '.$pTessData.' -l '.$lang.' '.$docPath.'sponsel'.$ds.$file.' '.$docPath.'sponsel'.$ds.$file);
	echo $res;
}

echo "PDFtk\n";
echo $pPDFtk;
$res = system('pdftk '.$docPath.'sponsel'.$ds.'*.pdf cat output '.$docPath.'sponsel'.$ds.'final.pdf');
echo $res;
/*
unlink($docPath.$image);

echo "PDFtk\n";
//$res = exec($pPDFtk.' *.pdf cat output final.pdf');
//echo $res;

echo "swish-e\n";
$res = shell_exec($pSwishe.' -i '.$docPath.$final.'.pdf -f '.$docPath.'index.swish-e -c '.$pSwisheConfig);
echo $res;
*/
?>