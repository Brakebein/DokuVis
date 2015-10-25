<?php

include 'globalpaths.php';

//$docPath = dirname(dirname( __FILE__ )). DIRECTORY_SEPARATOR .'data'. DIRECTORY_SEPARATOR .'texts'. DIRECTORY_SEPARATOR;
$docPath = $pData . $DS .'texts'. $DS;

$inputFile = 'sponsel_280_neu.pdf';
$image = 'sponsel_i.jpg';
$final = 'sponsel_final';

$lang = 'deu';

$suche = 'aufwand';

echo "swish-e suche\n";
$res = system($pSwishe.' -f '.$docPath.'index.swish-e -w '.$suche);
//$res = exec($pSwishe.' -f '.$docPath.'index.swish-e -k*');
echo $res;

?>