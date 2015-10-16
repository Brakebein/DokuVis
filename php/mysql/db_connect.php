<?php
	$server = "127.0.0.1";
	$user = "root";
	$passwort = "";
	$datenbank = "db_dokuvis";
	$verbindung = mysql_connect($server, $user, $passwort) or die ("Es konnte keine Verbindung zum Server hergestellt werden");
	mysql_select_db($datenbank) or die ("Die Datenbank existiert nicht");
?>