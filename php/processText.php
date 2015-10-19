<?php

include 'globalpaths.php';

$docPath = dirname(dirname( __FILE__ )). DIRECTORY_SEPARATOR .'data'. DIRECTORY_SEPARATOR .'texts'. DIRECTORY_SEPARATOR;

$inputFile = 'sponsel_280_neu.pdf';
$image = 'sponsel_i.jpg';
$final = 'sponsel_final';

$lang = 'deu';

echo "Ghostscript\n";
$res = exec($pGhostscript.' -dNOPAUSE -dBATCH -sDEVICE=jpeg -sOutputFile='.$docPath.$image.' '.$docPath.$inputFile);
//$res = exec($pGhostscript.' -q -c "(../data/texts/'.$inputFile.') (r) file runpdfbegin pdfpagecount = quit"');
echo $res;

echo "Imagick\n";
$res = exec($pImagickMogrify.' -resample 300 '.$docPath.$image);
echo $res;

echo "Tesseract\n";
$res = exec($pTesseract.' --tessdata-dir '.$pTessData.' -l '.$lang.' '.$docPath.$image.' '.$docPath.$final.' pdf');
echo $res;

unlink($docPath.$image);

echo "PDFtk\n";
//$res = exec($pPDFtk.' *.pdf cat output final.pdf');
//echo $res;

echo "swish-e\n";
$res = exec('swish-e -i '.$docPath.$final.'.pdf -f '.$docPath.'index.swish-e');
echo $res;



?>