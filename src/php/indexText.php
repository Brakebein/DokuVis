<?php

include 'globalpaths.php';

$postdata = json_decode(file_get_contents("php://input"));

$projPath = $pData . $DS . $postdata->project . $DS;

$res = system($pSwishe.' -i '.$projPath.'texts'.$DS.'*.hocr -f '.$projPath.'index.swish-e -c '.$projPath.'swish.config');
echo $res;

?>