<?php

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
		$upath = dirname(dirname( __FILE__ )) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . $_FILES[ 'file' ][ 'name' ];
	}
	else {
		$path = str_replace("/", DIRECTORY_SEPARATOR, $path);
		$upath = dirname(dirname( __FILE__ )) . DIRECTORY_SEPARATOR . $path;
	}
	//echo $upath;
	
    $tempPath = $_FILES[ 'file' ][ 'tmp_name' ];
    $uploadPath = dirname(dirname( __FILE__ )) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . $_FILES[ 'file' ][ 'name' ];

    //move_uploaded_file( $tempPath, $uploadPath );
    move_uploaded_file( $tempPath, $upath . $newFileName );

	$thumb = new Imagick($upath . $newFileName);
	//if($fileType != 'jpg')
	//	$thumb->writeImage($upath . $pureNewFileName . '.jpg');
	$thumb->cropThumbnailImage(160, 90);
	$thumb->setImageFormat('jpeg');
	$thumb->writeImage($upath . '_thumbs' . DIRECTORY_SEPARATOR . 't_' . $pureNewFileName . '.jpg');
	$thumb->destroy();
	
	exec("C:\\ImageMagick\convert.exe ".$upath.$newFileName." -resize \"1024x1024>\" ".$upath.$pureNewFileName."_1024.jpg");
	
    $answer = array( 'answer' => 'File transfer completed' );
    $json = json_encode( $answer );

    echo $json;

} else {

    echo 'No files';

}

?>