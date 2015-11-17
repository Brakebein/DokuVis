<?php

include 'globalpaths.php';

$postdata = json_decode(file_get_contents("php://input"));

$projPath = $pData . $DS . $postdata->project . $DS;

file_put_contents($projPath.$postdata->file, utf8_decode(implode(" ", $postdata->words)));

echo 'SUCCESS';

?>