<?php

include 'globalpaths.php';

if ( !empty( $_FILES ) ) {

	/*(isset($_POST['title'])) ? $title = $_POST['title'] : $title = '';
	(isset($_POST['author'])) ? $author = $_POST['author'] : $author = '';
	(isset($_POST['archive'])) ? $archive = $_POST['archive'] : $archive = '';
	(isset($_POST['type'])) ? $type = $_POST['type'] : $type = '';
	(isset($_POST['creationDate'])) ? $creationDate = $_POST['creationDate'] : $creationDate = '';
	(isset($_POST['creationPlace'])) ? $creationPlace = $_POST['creationPlace'] : $creationPlace = '';
	(isset($_POST['comment'])) ? $comment = $_POST['comment'] : $comment = '';
	(isset($_POST['oldFileName'])) ? $oldFileName = $_POST['oldFileName'] : $oldFileName = '';*/
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
	$res = system($pImagickConvert." ".$upath.$newFileName." -resize \"160x90^\" -gravity center -extend 160x90 ".$upath."_thumbs".$DS."t_".$pureNewFileName.".jpg");
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