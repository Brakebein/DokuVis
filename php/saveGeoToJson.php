<?php

include 'globalpaths.php';

$postdata = json_decode(file_get_contents("php://input"));

// Pfade
$path = str_replace("/", $DS, $postdata->path);
$upath = $pData . $DS . $path;

$fname = $postdata->filename;

$data = str_replace('data:application/zip;base64,', '', $postdata->data);

file_put_contents($upath . $fname.'.zip', base64_decode($data))
	or exit('ERROR: file_put_contents() failed');

//echo json_encode($dim);
echo 'SUCCESS';
	
?>