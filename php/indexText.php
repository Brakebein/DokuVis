<?php

include 'globalpaths.php';

$docPath = $pData . $DS . 'Proj_pt4oj1G' . $DS . 'texts'. $DS;

echo "swish-e\n";
$res = system($pSwishe.' -i '.$docPath.' -f '.$docPath.'index.swish-e -c '.$pSwisheConfig);
echo $res;
/*

$inputFile = 'sponsel_280_neu.pdf';
$image = 'sponsel_i.jpg';
$final = 'sponsel_final'

$lang = 'deu';

$suche = 'aufwand';

echo "swish-e suche\n";
$res = system($pSwishe.' -f '.$docPath.'index.swish-e -w '.$suche);
//$res = exec($pSwishe.' -f '.$docPath.'index.swish-e -k*');
echo $res;
*/
?>