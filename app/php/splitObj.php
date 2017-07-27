<?php
	$rfile = fopen('j_crusaderruins.obj', 'r');
	$wfile = null;
	$objnames = [];
	if($rfile) {
		while(($buffer = fgets($rfile)) !== false) {
			//echo $buffer;
			if(preg_match('/^# object /', $buffer)) {
				if($wfile) {
					fclose($wfile);
				}
				echo $buffer;
				$s = substr($buffer, 9);
				$filename = trim($s).'.obj';
				array_push($objnames, trim($s));
				$wfile = fopen($filename, 'w+');
				fwrite($wfile, $buffer);
			}
			else if(preg_match('/^#[\r\n]$/', $buffer)) {
				//skip
			}
			else if(preg_match('/^[\r\n]$/', $buffer)) {
				//skip
			}
			else {
				if($wfile) {
					fwrite($wfile, $buffer);
				}
			}
		}
		if(!feof($rfile)) {
			echo 'Fehler: fgets()\n';
			
		}
		fclose($rfile);
		if($wfile) {
			fclose($wfile);
		}
		$wfile = fopen('list.json', 'w+');
		fwrite($wfile, json_encode($objnames));
		fclose($wfile);
	}
?>