<?php
	
	$string = file_get_contents('_list2.json');
	$json = json_decode($string);

	for($i=0; $i<sizeof($json); $i++) {
		echo $json[$i][0];
		$thumb = new Imagick($json[$i][0].'.jpg');
		
		//$thumb->resizeImage(320,240,Imagick::FILTER_LANCZOS,1,1);
		$thumb->cropThumbnailImage(160, 90);
		$thumb->writeImage('_thumbs/t_'.$json[$i][0].'.jpg');

		$thumb->destroy();
	}
?>
