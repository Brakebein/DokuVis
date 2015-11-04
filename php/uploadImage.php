<?php

include 'globalpaths.php';

if ( !empty( $_FILES ) ) {

	(isset($_POST['newFileName'])) ? $newFileName = $_POST['newFileName'] : $newFileName = '';
	(isset($_POST['pureNewFileName'])) ? $pureNewFileName = $_POST['pureNewFileName'] : $pureNewFileName = '';
	(isset($_POST['fileType'])) ? $fileType = $_POST['fileType'] : $fileType = '';
	(isset($_POST['path'])) ? $path = $_POST['path'] : $path = '';
	
	if(empty($path)) {
		echo 'No path';
		return;
	}
	else {
		$path = str_replace("/", $DS, $path);
		$upath = $pData . $DS . $path;	// upload path
	}
	
    $tempPath = $_FILES[ 'file' ][ 'tmp_name' ];
    move_uploaded_file( $tempPath, $upath . $newFileName );
	
	// thumbnail
	$res = system($pImagickConvert." ".$upath.$newFileName." -resize \"160x90^\" -gravity center -extent 160x90 ".$upath."_thumbs".$DS."t_".$pureNewFileName.".jpg");
	echo $res;
	
	// downsampling for normal viewing
	$res = system($pImagickConvert." ".$upath.$newFileName." -resize \"1024x1024>\" ".$upath.$pureNewFileName."_1024.jpg");
	echo $res;
	
    $answer = array( 'answer' => 'File transfer completed' );
    $json = json_encode( $answer );

    echo $json;

} else {

    echo 'No files';

}

?>