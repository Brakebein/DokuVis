<?php

include 'globalpaths.php';

$postdata = json_decode(file_get_contents("php://input"));

$projPath = $pData . $DS . $postdata->project . $DS;

echo utf8_encode(file_get_contents($projPath.$postdata->file));

?>