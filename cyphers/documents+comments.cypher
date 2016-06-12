profile MATCH (e31:Proj_pCSbD9l:E31)<-[:P15]-(:E7 {content: "subpF7Vgba"})
WITH e31
MATCH (e31)-[:P2]->(type:E55)-[:P127]->(:E55 {content:"sourceType"})
WITH e31, type
MATCH (e31)-[:P102]->(title:E35)
MATCH (e31)-[:P1]->(file:E75)
MATCH (e31)<-[:P94]-(e65:E65)
WITH e31, e65, title, type, file
OPTIONAL MATCH (e31)-[:P2]->(primary:E55 {content:"primarySource"})
OPTIONAL MATCH (e65)-[:P14]->(author:E21)-[:P131]->(author:E82)
OPTIONAL MATCH (e65)-[:P7]->(place:E53)-[:P87]->(place:E48)
OPTIONAL MATCH (e65)-[:P4]->(:E52)-[:P82]->(date:E61)
OPTIONAL MATCH (e31)-[:P48]->(archivenr:E42)
OPTIONAL MATCH (e31)<-[:P138]-(plan3d:E36)
OPTIONAL MATCH (e31)-[:P3]->(note:E62)
WITH e31, e65, title, type, file, primary, author, place, date, archivenr, plan3d, note
OPTIONAL MATCH (e31)<-[:P128]-(:E84)<-[:P46]-(e78:E78)-[:P1]->(coll:E41),
	(e78)-[:P52]->(:E40)-[:P131]->(inst:E82)
OPTIONAL MATCH (e31)-[:has_tag]->(tag:TAG)
WITH e31, title, type, file, primary, author, place, date, archivenr, plan3d, note, coll, inst, collect(tag.content) as tags
// OPTIONAL MATCH (e31)<-[:P129]-(ce33:E33)-[:P2]->(:E55 {content: "commentSource"}),
	// (ce33)-[:P3]->(ce62:E62),
	// (ce33)<-[:P94]-(ce65:E65)-[:P14]->(:E21)-[:P131]->(ce82:E82),
	// (ce65)-[:P4]->(:E52)-[:P82]->(ce61:E61)
RETURN e31.content AS eid,
	type.content AS type,
	title.content AS title,
	primary.content AS primary,
	author.content AS author,
	place.content AS place,
	date.content AS date,
	{identifier: archivenr.content, collection: coll.content, institution: inst.content, institutionAbbr: inst.abbr} AS archive,
	{name: file.content, path: file.path, display: file.contentDisplay, thumb: file.thumb} AS file,
	plan3d.content AS plan3d,
	note.content AS note,
	tags
	// collect({id: ce33.content, value: ce62.value, time: ce61.value, author: ce82.value}) AS comments
	

MATCH (e31:E31:Proj_pCSbD9l)-[:P2]->(type:E55)-[:P127]->(:E55:Proj_pCSbD9l {content:"sourceType"}),
(e31)<-[:P15]-(:E7:Proj_pCSbD9l {content: "subpF7Vgba"}),
(e31)-[:P102]->(title:E35),
(e31)-[:P1]->(file:E75),
(e31)<-[:P94]-(e65:E65)
OPTIONAL MATCH (e31)-[:P2]->(primary:E55:Proj_pCSbD9l {content:"primarySource"})
OPTIONAL MATCH (e65)-[:P14]->(author:E21)-[:P131]->(aname:E82)
OPTIONAL MATCH (e65)-[:P7]->(place:E53)-[:P87]->(pname:E48)
OPTIONAL MATCH (e65)-[:P4]->(:E52)-[:P82]->(date:E61)
OPTIONAL MATCH (e31)-[:P48]->(archivenr:E42)
OPTIONAL MATCH (e31)<-[:P138]-(plan3d:E36)
OPTIONAL MATCH (e31)-[:P3]->(comment:E62)
OPTIONAL MATCH (e31)<-[:P128]-(:E84)<-[:P46]-(e78:E78)-[:P1]->(coll:E41),
	(e78)-[:P52]->(:E40)-[:P131]->(inst:E82)
OPTIONAL MATCH (e31)-[:has_tag]->(tag:TAG)
RETURN e31.content AS eid,
	type.content AS type,
	title.content AS title,
	primary.content AS primary,
	aname.content AS author,
	pname.content AS place,
	date.content AS date,
	{identifier: archivenr.content, collection: coll.content, institution: inst.content, institutionAbbr: inst.abbr} AS archive,
	{name: file.content, path: file.path, display: file.contentDisplay, thumb: file.thumb} AS file,
	plan3d.content AS plan3d,
	comment.value AS comment,
	collect(tag.content) as tags
	

profile MATCH (e31:E31:Proj_pCSbD9l)-[:P2]->(type:E55)-[:P127]->(:E55 {content:"sourceType"}),
(e31)<-[:P15]-(:E7 {content: "subpF7Vgba"}),
(e31)-[:P102]->(title:E35),
(e31)-[:P1]->(file:E75),
(e31)<-[:P94]-(e65:E65)
OPTIONAL MATCH (e31)-[:P2]->(primary:E55 {content:"primarySource"})
OPTIONAL MATCH (e65)-[:P14]->(author:E21)-[:P131]->(aname:E82)
OPTIONAL MATCH (e65)-[:P7]->(place:E53)-[:P87]->(pname:E48)
OPTIONAL MATCH (e65)-[:P4]->(:E52)-[:P82]->(date:E61)
OPTIONAL MATCH (e31)-[:P48]->(archivenr:E42)
OPTIONAL MATCH (e31)<-[:P138]-(plan3d:E36)
OPTIONAL MATCH (e31)-[:P3]->(comment:E62)
OPTIONAL MATCH (e31)<-[:P128]-(:E84)<-[:P46]-(e78:E78)-[:P1]->(coll:E41),
	(e78)-[:P52]->(:E40)-[:P131]->(inst:E82)
OPTIONAL MATCH (e31)-[:has_tag]->(tag:TAG)
OPTIONAL MATCH (e31)<-[:P129]-(ce33:E33)-[:P2]->(:E55 {content: "commentSource"}),
	(ce33)-[:P3]->(ce62:E62),
	(ce33)<-[:P94]-(ce65:E65)-[:P14]->(:E21)-[:P131]->(ce82:E82),
	(ce65)-[:P4]->(:E52)-[:P82]->(ce61:E61)
RETURN e31.content AS eid,
	type.content AS type,
	title.content AS title,
	primary.content AS primary,
	aname.content AS author,
	pname.content AS place,
	date.content AS date,
	{identifier: archivenr.content, collection: coll.content, institution: inst.content, institutionAbbr: inst.abbr} AS archive,
	{name: file.content, path: file.path, display: file.contentDisplay, thumb: file.thumb} AS file,
	plan3d.content AS plan3d,
	comment.value AS comment,
	collect(tag.content) as tags,
	collect({id: ce33.content, value: ce62.value, time: ce61.value, author: ce82.value}) AS comments
	
MATCH (target:Proj_pCSbD9l {content: "e31_pF7XIod_ZS_9a_Longuelune_Zwingerschloss_Hoftrakte_schnitt_seitlicher_fluegel.jpg"})<-[:P129]-(ce33:E33)-[:P2]->()-[:P127]->(:E55 {content: "commentType"}),
(ce33)-[:P3]->(ce62:E62),
(ce33)<-[:P94]-(ce65:E65)-[:P14]->(:E21)-[:P131]->(ce82:E82),
(ce65)-[:P4]->(:E52)-[:P82]->(ce61:E61)
RETURN ce33.content AS id, ce62.value AS value, ce61.value AS time, ce82.value AS author

profile MATCH (target:Proj_pCSbD9l {content: "e31_pF7XIod_ZS_9a_Longuelune_Zwingerschloss_Hoftrakte_schnitt_seitlicher_fluegel.jpg"})<-[:P129]-(ce33:E33)-[:P2]->(type)-[:P127]->(:E55 {content: "commentType"}),
	(ce33)-[:P3]->(ce62:E62),
	(ce33)<-[:P94]-(ce65:E65)-[:P14]->(:E21)-[:P131]->(ce82:E82),
	(ce65)-[:P4]->(:E52)-[:P82]->(ce61:E61)
OPTIONAL MATCH (ce33)<-[:P129]-(ae33:E33)-[:P2]->(atype),
	(ae33)-[:P3]->(ae62:E62),
	(ae33)<-[:P94]-(ae65:E65)-[:P14]->(:E21)-[:P131]->(ae82:E82),
	(ae65)-[:P4]->(:E52)-[:P82]->(ae61:E61)
RETURN ce33.content AS id, ce62.value AS value, ce61.value AS date, ce82.value AS author, type.content AS type,
	collect({ id: ae33.content, value: ae62.value, date: ae61.value, author: ae82.value, type: atype.content }) AS answers