<?php

include 'globalpaths.php';

$postdata = json_decode(file_get_contents("php://input"));

$projPath = $pData . $DS . $postdata->project . $DS;

$res = system($pSwishe.' -f '.$projPath.'index.swish-e -w '.utf8_decode($postdata->search));

echo utf8_encode($res);

?>