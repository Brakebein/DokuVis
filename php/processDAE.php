<?php
	/* verarbeite hochgeladene COLLADA DAE-Dateien */
	//error_reporting(0);
	ini_set('display_errors',1);
	error_reporting(E_ALL);
	ini_set('max_execution_time', 3600);

	include 'globalpaths.php';
	
	// lese POST-Parameter ein
	(isset($_POST['newFileName'])) ? $newFileName = $_POST['newFileName'] : $newFileName = '';
	(isset($_POST['path'])) ? $path = $_POST['path'] : $path = '';
	(isset($_POST['tid'])) ? $tid = $_POST['tid'] : $tid = '';
	
	if(empty($path) || empty($newFileName) || empty($tid))
		exit('ERROR: POST parameter not complete');
	
	// Pfade
	$path = str_replace("/", $DS, $path);
	$upath = $pData . $DS . $path;
	$tmppath = $pTemp . $DS;
	
	// hochgeladene Datei in den tmp Ordner verschieben
	move_uploaded_file( $_FILES[ 'file' ][ 'tmp_name' ], $tmppath . $newFileName )
		or exit('ERROR: move_uploaded_file() failed');
	
	// hochgeladene Datei einlesen
	$fstring =  file_get_contents($tmppath . $newFileName)
		or exit('ERROR: file_get_contents() failed');
	// $fp = fopen($tmppath . $newFileName, "r")
		// or exit('ERROR: fopen() failed');
	
	// $fstring = '';
	// $rflag = false;
	// while(($buffer = fgets($fp)) !== false) {
		//entferne xml namespace (erforderlich für xpath query)
		// if($rflag)
			// $fstring .= $buffer;
		// else {
			// $fstring .= str_replace('xmlns=', 'ns=', $buffer, $rcount);
			// if($rcount > 0) $rflag = true;
		// }
	// }
	// fclose($fp);
	
	$fstring = str_replace('xmlns=', 'ns=', $fstring);
	
	// xml-string zu SimpleXMLElement
	$xml = simplexml_load_string($fstring)
	//$xml = simplexml_load_file($tmppath . $newFileName)
		or exit('ERROR: simplexml_load_string() failed');
		
	//echo $xml->asset->up_axis."\n";
	//echo $xml->asset->unit['meter']."\n";
	//echo $xml->asset->unit['name']."\n";
	
	$nodes = [];
	
	function getNodes($node, $depth, &$children, $parentid) {
		global $xml;
		foreach($node as $n) {
			//workaround
			if($n['name'] == "EnvironmentAmbientLight")
				continue;
			
			// Objekte auslesen
			$child = new stdClass();
			$child->name = (string)$n['name'];
			$child->id = (string)$n['id'];
			$child->layer = (string)$n['layer'];
			$child->unit = (string)$xml->asset->unit['name'];
			$child->upAxis = (string)$xml->asset->up_axis;
			$child->parentid = $parentid;
			$child->children = [];
			
			// Matrix
			$m = preg_split('/\s+/', $n->matrix);
			$child->matrix = [+$m[0], +$m[1], +$m[2], +$m[3], +$m[4], +$m[5], +$m[6], +$m[7], +$m[8], +$m[9], +$m[10], +$m[11], +$m[12], +$m[13], +$m[14], +$m[15]];
			
			if(isset($n->node[0]) && !isset($n->node[0]['id'])) {
				$m = preg_split('/\s+/', $n->node[0]->matrix);
				$pivotMatrix = [+$m[0], +$m[1], +$m[2], +$m[3], +$m[4], +$m[5], +$m[6], +$m[7], +$m[8], +$m[9], +$m[10], +$m[11], +$m[12], +$m[13], +$m[14], +$m[15]];
				$child->matrix = multiplyMatrices($pivotMatrix, $child->matrix);
				append_simplexml($n, $n->node[0]);
				unset($n->node[0]);
				// if($child->name == "dach_fluegel_001") {
					// var_dump($pivotMatrix);
					// var_dump($child->matrix);
				// }
			}
			
			// Geometry
			$child->geometryUrl = '';
			$child->material = null;
			if(isset($n->instance_geometry)) {
				$child->geometryUrl = substr((string)$n->instance_geometry['url'], 1);
				$child->type = 'object';
				
				// material
				if(isset($n->instance_geometry->bind_material->technique_common->instance_material)) {
					$child->material = new stdClass();
					$child->material->id = substr((string)$n->instance_geometry->bind_material->technique_common->instance_material['target'], 1);
					$mat = $xml->library_materials->xpath('./material[@id="'.$child->material->id.'"]')[0];
					$child->material->name = (string)$mat['name'];
					$effect = $xml->library_effects->xpath('./effect[@id="'.substr((string)$mat->instance_effect['url'], 1).'"]')[0];
					if(isset($effect->profile_COMMON->technique->phong))
						$color = $effect->profile_COMMON->technique->phong->diffuse->color;
					elseif(isset($effect->profile_COMMON->technique->lambert))
						$color = $effect->profile_COMMON->technique->lambert->diffuse->color;
					elseif(isset($effect->profile_COMMON->technique->blinn))
						$color = $effect->profile_COMMON->technique->blinn->diffuse->color;
					$color = preg_split('/\s+/', $color);
					$child->material->color = [+$color[0], +$color[1], +$color[2], +$color[3]];
				}
			}
			elseif(isset($n->instance_camera)) {
				$child->type = 'camera';
				continue;
			}
			elseif(isset($n->instance_light)) {
				$child->type = 'light';
				continue;
			}
			else
				$child->type = 'group';
			
			if(!empty($child->geometryUrl))
				convertGeometry($child->geometryUrl);
			
			
			
			getNodes($n->node, $depth+1, $child->children, $child->id);
			array_push($children, $child);
		}
	}
	
	function convertGeometry($geoid) {
		global $xml, $tmppath, $upath, $tid;
		// finde geometry mit gegebener id
		$geo = $xml->library_geometries->xpath('./geometry[@id="'.$geoid.'"]')[0];
		if(!$geo)
			exit('ERROR: simplexml->xpath() failed with '.$geoid);
		
		// polylist zu triangles, damit ctm-Konverter damit was anfangen (für aus Blender exportierte dae)
		if(!isset($geo->mesh->triangles) && isset($geo->mesh->polylist)) {
			$triangles = $geo->mesh->addChild('triangles');
			polylist2triangles($geo->mesh->polylist, $triangles);
			//append_simplexml($triangles, $geo->mesh->polylist);
			//$triangles->addAttribute('count', $geo->mesh->polylist['count']);
			$triangles->addAttribute('material', $geo->mesh->polylist['material']);
		}
		
		$fname = str_replace(" ", "_", utf8_decode($geoid));
		$fname = $tid.'_'.$fname;
		// schreibe geometry daten in temporäre dae-Datei
		$wfile = fopen($tmppath.$fname.'.dae', 'w+');
		fwrite($wfile, '<?xml version="1.0" encoding="utf-8"?>'."\n".'<COLLADA>'."\n".'<library_geometries>'."\n");
		fwrite($wfile, $geo->asXML()."\n");
		fwrite($wfile, '</library_geometries>'."\n".'</COLLADA>'."\n");
		fclose($wfile);
		
		// dae in ctm konvertieren
		$res = exec("\"C:\\Program Files (x86)\\OpenCTM 1.0.3\\bin\\ctmconv.exe\" ".$tmppath.$fname.".dae ".$tmppath.$fname.".ctm --method MG2 --level 1 --vprec 0.001 --nprec 0.01 --no-colors");
		//echo $res."\n";
		if(strpos($res, ' Error: ') !== false)
			exit('ERROR: ctm Converter failed on '.$fname.'.dae');
		
		// lösche temporäre dae-Datei
		unlink($tmppath.$fname.".dae")
			or exit('ERROR: unlink() failed on '.$fname.'.dae');
		// verschiebe ctm-Datei in Projektordner
		rename($tmppath.$fname.".ctm", $upath.$fname.".ctm")
			or exit('ERROR: rename() failed on '.$fname.'.ctm');
	}
	
	function polylist2triangles(&$polylist, &$triangles) {
		// Anzahl der input nodes
		$inputs = $polylist->xpath('./input');
		$icount = count($inputs);
		// übertrage input nodes
		for($i=0; $i<$icount; $i++) {
			$ti = $triangles->addChild('input');
			foreach ($inputs[$i]->attributes() as $attr_key => $attr_value) {
				$ti->addAttribute($attr_key, $attr_value);
			}
		}
		
		// vertex array
		$vinput = $polylist[0]->xpath('./input[@semantic="VERTEX"]')[0];
		$voffset = (int)$vinput['offset'];
		$vvertices = $polylist[0]->xpath('./../vertices[@id="'.substr((string)$vinput['source'], 1).'"]')[0];
		$vsource = $polylist[0]->xpath('./../source[@id="'.substr((string)$vvertices->input['source'], 1).'"]')[0];
		$vstride = (int)$vsource->technique_common->accessor['stride'];
		$verts = preg_split('/\s+/', $vsource->float_array);
		
		$tp = [];
		
		for($k=0; $k<count($polylist); $k++) {
			$vcount = preg_split('/\s+/', $polylist[$k]->vcount);
			$pp = preg_split('/\s+/', $polylist[$k]->p);
			
			for($i=0, $l=count($vcount), $offset=0; $i<$l; $i++) {
				$psize = (int)$vcount[$i];
				if($psize == 3) {
					for($j=0, $m=$psize*$icount; $j<$m; $j++) {
						array_push($tp, $pp[$offset+$j]);
					}
					$offset += $psize * $icount;
				}
				elseif($psize == 4) {
					// test if polygon concave
					$pverts = [];
					for($j=0, $m=$psize; $j<$m; $j++) {
						$vindex = $pp[$offset+$j*$icount] * $vstride;
						$v = [];
						for($h=0, $n=$vstride; $h<$n; $h++) {
							array_push($v, $verts[$vindex+$h]);
						}
						array_push($pverts, $v);
					}
					
					$n0 = crossFromPoints($pverts[3],$pverts[0],$pverts[1]);
					$n1 = crossFromPoints($pverts[0],$pverts[1],$pverts[2]);
					$n2 = crossFromPoints($pverts[1],$pverts[2],$pverts[3]);
					$n3 = crossFromPoints($pverts[2],$pverts[3],$pverts[0]);
					
					$pstart = 0;
					if(dot($n3, $n0) < 0 && dot($n0, $n1) < 0)
						$pstart = 0;
					elseif(dot($n0, $n1) < 0 && dot($n1, $n2) < 0)
						$pstart = 1*$icount;
					elseif(dot($n1, $n2) < 0 && dot($n2, $n3) < 0)
						$pstart = 2*$icount;
					elseif(dot($n2, $n3) < 0 && dot($n3, $n0) < 0)
						$pstart = 3*$icount;
					
					$plength = $psize*$icount;
					
					// reorder quad to triangles
					for($j=0, $m=(int)$plength*0.75; $j<$m; $j++) {
						array_push($tp, $pp[ $offset + (($j+$pstart)%$plength) ]);
					}
					for($j=0, $m=(int)$plength*0.25; $j<$m; $j++) {
						array_push($tp, $pp[ $offset + (($j+$pstart)%$plength) ]);
					}
					for($j=(int)$plength*0.5, $m=$plength; $j<$m; $j++) {
						array_push($tp, $pp[ $offset + (($j+$pstart)%$plength) ]);
					}
					$offset += $psize * $icount;
				}
			}
		}
		
		$triangles->addAttribute('count', count($tp)/(3*$icount));
		$triangles->addChild('p', implode(' ', $tp));
	}
	
	function crossFromPoints(&$vl, &$v0, &$vr) {
		$vecl = array($vl[0]-$v0[0], $vl[1]-$v0[1], $vl[2]-$v0[2]);
		$vecr = array($vr[0]-$v0[0], $vr[1]-$v0[1], $vr[2]-$v0[2]);
		
		return [$vecl[1]*$vecr[2] - $vecl[2]*$vecr[1],
				$vecl[2]*$vecr[0] - $vecl[0]*$vecr[2],
				$vecl[0]*$vecr[1] - $vecl[1]*$vecr[0]];
		
		//return cross($vecl, $vecr);
		//return atan2(norm(cross($vecl, $vecr)), dot($vecl, $vecr));
	}
	function norm(&$v) {
		return sqrt( pow(abs($v[0]),2) + pow(abs($v[1]),2) + pow(abs($v[2]),2) );
	}
	/*function cross(&$vecl, &$vecr) {
		return [$vecl[1]*$vecr[2] - $vecl[2]*$vecr[1],
				$vecl[2]*$vecr[0] - $vecl[0]*$vecr[2],
				$vecl[0]*$vecr[1] - $vecl[1]*$vecr[0]];
	}*/
	function dot(&$vecl, &$vecr) {
		return $vecl[0]*$vecr[0] + $vecl[1]*$vecr[1] + $vecl[2]*$vecr[2];
	}
	
	function append_simplexml(&$simplexml_to, &$simplexml_from)
	{
		foreach ($simplexml_from->children() as $simplexml_child)
		{
			$simplexml_temp = $simplexml_to->addChild($simplexml_child->getName(), (string) $simplexml_child);
			foreach ($simplexml_child->attributes() as $attr_key => $attr_value)
			{
				$simplexml_temp->addAttribute($attr_key, $attr_value);
			}
			append_simplexml($simplexml_temp, $simplexml_child);
		}
	}
	
	function multiplyMatrices($ae, $be) {
		$te = array_fill(0,16,0);
	
		$a11 = $ae[ 0 ]; $a12 = $ae[ 4 ]; $a13 = $ae[ 8 ]; $a14 = $ae[ 12 ];
		$a21 = $ae[ 1 ]; $a22 = $ae[ 5 ]; $a23 = $ae[ 9 ]; $a24 = $ae[ 13 ];
		$a31 = $ae[ 2 ]; $a32 = $ae[ 6 ]; $a33 = $ae[ 10 ]; $a34 = $ae[ 14 ];
		$a41 = $ae[ 3 ]; $a42 = $ae[ 7 ]; $a43 = $ae[ 11 ]; $a44 = $ae[ 15 ];

		$b11 = $be[ 0 ]; $b12 = $be[ 4 ]; $b13 = $be[ 8 ]; $b14 = $be[ 12 ];
		$b21 = $be[ 1 ]; $b22 = $be[ 5 ]; $b23 = $be[ 9 ]; $b24 = $be[ 13 ];
		$b31 = $be[ 2 ]; $b32 = $be[ 6 ]; $b33 = $be[ 10 ]; $b34 = $be[ 14 ];
		$b41 = $be[ 3 ]; $b42 = $be[ 7 ]; $b43 = $be[ 11 ]; $b44 = $be[ 15 ];

		$te[ 0 ] = $a11 * $b11 + $a12 * $b21 + $a13 * $b31 + $a14 * $b41;
		$te[ 4 ] = $a11 * $b12 + $a12 * $b22 + $a13 * $b32 + $a14 * $b42;
		$te[ 8 ] = $a11 * $b13 + $a12 * $b23 + $a13 * $b33 + $a14 * $b43;
		$te[ 12 ] = $a11 * $b14 + $a12 * $b24 + $a13 * $b34 + $a14 * $b44;

		$te[ 1 ] = $a21 * $b11 + $a22 * $b21 + $a23 * $b31 + $a24 * $b41;
		$te[ 5 ] = $a21 * $b12 + $a22 * $b22 + $a23 * $b32 + $a24 * $b42;
		$te[ 9 ] = $a21 * $b13 + $a22 * $b23 + $a23 * $b33 + $a24 * $b43;
		$te[ 13 ] = $a21 * $b14 + $a22 * $b24 + $a23 * $b34 + $a24 * $b44;

		$te[ 2 ] = $a31 * $b11 + $a32 * $b21 + $a33 * $b31 + $a34 * $b41;
		$te[ 6 ] = $a31 * $b12 + $a32 * $b22 + $a33 * $b32 + $a34 * $b42;
		$te[ 10 ] = $a31 * $b13 + $a32 * $b23 + $a33 * $b33 + $a34 * $b43;
		$te[ 14 ] = $a31 * $b14 + $a32 * $b24 + $a33 * $b34 + $a34 * $b44;

		$te[ 3 ] = $a41 * $b11 + $a42 * $b21 + $a43 * $b31 + $a44 * $b41;
		$te[ 7 ] = $a41 * $b12 + $a42 * $b22 + $a43 * $b32 + $a44 * $b42;
		$te[ 11 ] = $a41 * $b13 + $a42 * $b23 + $a43 * $b33 + $a44 * $b43;
		$te[ 15 ] = $a41 * $b14 + $a42 * $b24 + $a43 * $b34 + $a44 * $b44;
		
		return $te;
	}
	
	getNodes($xml->library_visual_scenes->visual_scene->node, 0, $nodes, null);
	
	// verschiebe hochgeladene dae-Datei in Projektordner
	rename($tmppath . $newFileName, $upath . $newFileName)
		or exit('ERROR: rename() failed on '.$newFileName);
	
	// ausgelesene Objekte zurückgeben
	echo json_encode($nodes);
	
	/*
	$wfile = fopen($tmppath.'_list.json', 'w+');
	fwrite($wfile, json_encode($nodes));
	fclose($wfile);
	*/
?>