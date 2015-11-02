<?php

include 'globalpaths.php';

$docPath = $pData . $DS .'texts'. $DS;

$inputFile = 'sponsel_280_neu.pdf';
//$inputFile = 'whbartlett-jerusalem_revisited.pdf';
$image = 'sponsel_i.jpg';
$final = 'sponsel_final';

$lang = 'deu';
//$lang = 'eng';



$res = system($pPDFtk.' '.$docPath.$inputFile.' dump_data_utf8');
$res = system($pPDFtk.' '.$docPath.'sponsel\\final.pdf dump_data_utf8');
echo $res;
/*
mkdir($docPath . 'sponsel')
	or exit('ERROR: mkdir() failed on'.$prj);

echo "Ghostscript\n";
$res = system($pGhostscript.' -dNOPAUSE -dBATCH -sDEVICE=jpeg -sOutputFile="'.$docPath.'sponsel'.$DS.'sponsel-%04d.jpg" '.$docPath.$inputFile);
//$res = exec($pGhostscript.' -q -c "(../data/texts/'.$inputFile.') (r) file runpdfbegin pdfpagecount = quit"');
echo $res;

$files = array_diff(scandir($docPath.'sponsel'), array('.','..')); 
var_dump($files);
foreach ($files as $file) { 
	//(is_dir($dir.$ds.$file)) ? delTree($dir.$ds.$file) : unlink($dir.$ds.$file); 

	echo "Imagick\n";
	$res = system($pImagickMogrify.' -resample 300 '.$docPath.'sponsel'.$DS.$file);
	echo $res;

	echo "Tesseract\n";
	$res = system($pTesseract.' --tessdata-dir '.$pTessData.' -l '.$lang.' '.$docPath.'sponsel'.$DS.$file.' '.$docPath.'sponsel'.$DS.$file.' pdf');
	echo $res;
}

echo "PDFtk\n";
$res = system($pPDFtk.' '.$docPath.'sponsel'.$DS.'*.pdf cat output '.$docPath.'sponsel'.$DS.'final.pdf');
echo $res;
*/
/*$res = system($pGhostscript.' -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dBATCH  -dQUIET -sOutputFile='.$docPath.'sponsel'.$DS.'final_c.pdf '.$docPath.'sponsel'.$DS.'final.pdf');


//$res = system($pQPDF.' --linearize '.$docPath.'sponsel'.$DS.'final.pdf '.$docPath.'sponsel'.$DS.'final_c.pdf');
echo $res;
*/
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