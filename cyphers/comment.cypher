MATCH (e21:E21:Proj_pIFGTJt {content: "e21_bruschie@hotmail.com"})-[:P131]->(userName:E82),
(type:E55:Proj_pIFGTJt {content: "commentModel"})
WITH e21, userName, type
OPTIONAL MATCH (target:Proj_pIFGTJt) WHERE target.content IN ["e73_pM76yde_node-dach_fluegel_wall", "e73_pM76yde_node-fluegel_wall_wand_002", "e73_pM76yde_node-boden_hof"]
WITH e21, userName, type, collect(DISTINCT target) AS targets
OPTIONAL MATCH (ref:Proj_pIFGTJt) WHERE ref.content IN ["e31_pIG0Ozg_ZS_9a_Longuelune_Zwingerschloss_Grundrisse_1.jpg", "e31_pIG8E0I_ZS_9a_Longuelune_Zwingerschloss_Laengsschnitt.jpg"]
WITH e21, userName, type, targets, collect(DISTINCT ref) AS refs

CREATE (e33:E33:Proj_pIFGTJt {content: {e33id}})-[:P3]->(e62:E62:Proj_pIFGTJt {e62content}),
	(e65:E65:Proj_pIFGTJt {content: "e65_" + {e33id}})-[:P4]->(:E52:Proj_pIFGTJt {content: "e52_e65_" + {e33id}})-[:P82]->(e61:E61:Proj_pIFGTJt {value: {date}}),
	(e33)-[:P2]->(type),
	(e33)-[:P102]->(:E35:Proj_pIFGTJt {e35content}),
	(e65)-[:P94]->(e33),
	(e65)-[:P14]->(e21)
FOREACH (t IN targets | CREATE (e33)-[:P129]->(t))
FOREACH (r IN refs | CREATE (e33)-[:P67]->(r))

WITH e33, e62, e61, userName, type
MATCH (tSs:E55:Proj_pIFGTJt {content: "screenshot"}), (tUd:E55:Proj_pIFGTJt {content: "userDrawing"})
CREATE (e33)-[:P106]->(:E73:Proj_pIFGTJt {content: "e73_" + {e33id} + "_pins", pins: {pins}})
FOREACH (s IN {screenshots} |
	CREATE (e33)-[:P67]->(screen:E36 {content: s.screen36content, cameraCenter: s.cameraCenter, cameraFOV: s.cameraFOV, cameraMatrix: s.cameraMatrix})-[:P2]->(tSs),
		(screen)-[:P1]->(:E75 {content: s.screen75content, path: s.path, width: s.width, height: s.height}),
		(screen)-[:P106]->(draw:E36 {content: s.paintId})-[:P2]->(tUd),
		(draw)-[:P1]->(:E75 {content: s.paint75content, path: s.path, width: s.width, height: s.height}) )

RETURN e33.content AS id, e62.value AS value, e61.value AS date, userName.value AS author, type.content AS type


// test
create (:E55 {content: "userDrawing"}),
(:E55 {content: "screenshot"}),
(:E55 {content: "commentModel"}),
(:E21 {content: "e21_bruschie@hotmail.com"})-[:P131]->(:E82 {content: "e82_e21_bruschie@hotmail.com", value: "Brakebein"}),
(:E33 {content: "e31_pIG0Ozg_ZS_9a_Longuelune_Zwingerschloss_Grundrisse_1.jpg"}),
(:E33 {content: "e31_pIG8E0I_ZS_9a_Longuelune_Zwingerschloss_Laengsschnitt.jpg"}),
(:E22 {content: "e22_pM76yde_node-dach_fluegel_wall"}),
(:E22 {content: "e22_pM76yde_node-fluegel_wall_wand_002"}),
(:E22 {content: "e22_pM76yde_node-boden_hof"})

MATCH (e21:E21 {content: "e21_bruschie@hotmail.com"})-[:P131]->(userName:E82),
(type:E55 {content: "commentModel"})
WITH e21, userName, type
OPTIONAL MATCH (target) WHERE target.content IN ["e22_pM76yde_node-dach_fluegel_wall", "e22_pM76yde_node-fluegel_wall_wand_002", "e22_pM76yde_node-boden_hof"]
WITH e21, userName, type, collect(DISTINCT target) AS targets
OPTIONAL MATCH (ref) WHERE ref.content IN ["e31_pIG0Ozg_ZS_9a_Longuelune_Zwingerschloss_Grundrisse_1.jpg", "e31_pIG8E0I_ZS_9a_Longuelune_Zwingerschloss_Laengsschnitt.jpg"]
WITH e21, userName, type, targets, collect(DISTINCT ref) AS refs
CREATE (e33:E33 {content: "e33_pNweIre_comment"})-[:P3]->(e62:E62 {content:"e62_e33_pNweIre_comment",value:"Das ist der eigentliche Kommentar"}),
	(e65:E65 {content: "e65_e33_pNweIre_comment"})-[:P4]->(:E52 {content: "e52_e65_e33_pNweIre_comment"})-[:P82]->(e61:E61 {value: "2016-06-08T09:59:08+02:00"}),
	(e33)-[:P2]->(type),
	(e33)-[:P102]->(:E35 {content:"e35_e33_pNweIre_comment",value:"Dies ist der Titel"}),
	(e65)-[:P94]->(e33),
	(e65)-[:P14]->(e21)
FOREACH (t IN targets | CREATE (e33)-[:P129]->(t))
FOREACH (r IN refs | CREATE (e33)-[:P67]->(r))

WITH e33, e62, e61, userName, type, [{screen36content: "e36_sFilename0", cameraCenter: [3,2,1], cameraFOV: 35,	cameraMatrix: [2,4,5,6,2,2], screen75content: "sFilename0", paintId: "e36_pFilename0", paint75content: "pFilename0", path: "path/to", width: 1273, height: 783},{screen36content: "e36_sFilename1", cameraCenter: [3,2,1], cameraFOV: 35,	cameraMatrix: [2,4,5,6,2,2], screen75content: "sFilename1", paintId: "e36_pFilename1", paint75content: "pFilename1", path: "path/to", width: 1273, height: 783}] AS screenshots
MATCH (tSs:E55 {content: "screenshot"}), (tUd:E55 {content: "userDrawing"})
FOREACH (s IN {screenshots} |
	CREATE (e33)-[:P67]->(screen:E36 {content: s.screen36content, cameraCenter: s.cameraCenter, cameraFOV: s.cameraFOV, cameraMatrix: s.cameraMatrix})-[:P2]->(tSs),
		(screen)-[:P1]->(:E75 {content: s.screen75content, path: s.path, width: s.width, height: s.height}),
		(screen)-[:P106]->(draw:E36 {content: s.paintId})-[:P2]->(tUd),
		(draw)-[:P1]->(:E75 {content: s.paint75content, path: s.path, width: s.width, height: s.height})
	FOREACH (p in s.pins |
		CREATE (screen)-[:P106]->(:E73 {content: p.id, targetId: p.targetId, screenIndex: p.screenIndex, pinMatrix: p.pinMatrix}) ) )

RETURN e33.content AS id, e62.value AS value, e61.value AS date, userName.value AS author, type.content AS type

// get commentModel
MATCH (tSs:E55 {content: "screenshot"}), (tUd:E55 {content: "userDrawing"})
WITH tSs, tUd
MATCH (:E55 {content: "commentType"})<-[:P127]-(type:E55)
WHERE type.content <> "commentAnswer"
MATCH (type)<-[:P2]-(e33:E33),
(e33)-[:P3]->(text:E62),
(e33)<-[:P94]-(e65:E65),
	(e65)-[:P14]->(user:E21)-[:P131]->(userName:E82),
	(e65)-[:P4]->(:E52)-[:P82]->(date:E61)
OPTIONAL MATCH (e33)-[:P102]->(title:E35)
OPTIONAL MATCH (e33)-[:P129]->(targets)
OPTIONAL MATCH (e33)-[:P67]->(refs) WHERE NOT (refs)-[:P2]->(tSs)
OPTIONAL MATCH (e33)<-[:P129]-(answer:E33)-[:P2]->(:E55 {content: "commentAnswer"})
WITH e33, text, title, type, {id: user.content, name: userName.value } AS author, date.value AS date, collect(DISTINCT targets.content) AS targets, collect(DISTINCT refs.content) AS refs, count(answer) AS answerLength, tSs, tUd
OPTIONAL MATCH (e33)-[:P67]->(screen:E36)-[:P2]->(tSs),
	(screen)-[:P1]->(screenFile:E75),
	(screen)-[:P106]->(paint:E36)-[:P2]->(tUd),
	(paint)-[:P1]->(paintFile:E75)
WITH e33, text, title, type, author, date, targets, refs, CASE WHEN count(screen) = 0 THEN [] ELSE collect({screenId: screen.content, cameraCenter: screen.cameraCenter, cameraFOV: screen.cameraFOV, cameraMatrix: screen.cameraMatrix, file: screenFile.content, path: screenFile.path, width: screenFile.width, height: screenFile.height, paint: {id: paint.content, file: paintFile.content, path: paintFile.path, width: paintFile.width, height: paintFile.height}}) END AS screenshots, screen, answerLength
OPTIONAL MATCH (screen)-[:P106]->(pin:E73)
RETURN e33.content AS eid, text.value AS text, title.value AS title, author, date, type.content AS type, targets AS targets, refs AS refs, screenshots, collect(DISTINCT pin) AS pins, answerLength

// OPTIONAL MATCH n
// collect(DISTINCT n) --> NullPointerException