<?php

include 'globalpaths.php';

$postdata = json_decode(file_get_contents("php://input"));

$projPath = $pData . $DS . $postdata->project . $DS;

$res = shell_exec($pSwishe.' -f '.$projPath.'index.swish-e -k*');

echo utf8_encode($res);

?>