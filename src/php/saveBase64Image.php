<?php

include 'globalpaths.php';

$postdata = json_decode(file_get_contents("php://input"));

// Pfade
$path = str_replace("/", $DS, $postdata->path);
$upath = $pData . $DS . $path;

$fname = $postdata->filename;

$img = $postdata->imgdata;
$img = str_replace('data:image/jpeg;base64,', '', $img);
$img = str_replace('data:image/png;base64,', '', $img);

file_put_contents($upath . $fname, base64_decode($img))
	or exit('ERROR: file_put_contents() failed');
	
// Thumbnail erstellen
if($postdata->thumbnail)
	system($pImagickConvert." ".$upath.$fname." -resize \"160x90^\" -gravity center -extent 160x90 ".$upath."_thumbs".$DS."t_".$fname);

echo 'SUCCESS';
	
?>