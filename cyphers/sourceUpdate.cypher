MATCH (st:E55 {content: "sourceType"})<-[:P127]-(type:E55 {content: $type}),
      (sc:E55 {content: "sourceComment"}),
      (sr:E55 {content: "sourceRepros"}),
      (sp:E55 {content: "primarySource"})
WITH st, sc, sr, sp, type
MATCH (e31:E31:Proj_q66NrRJ {content: $id})-[rtype:P2]->(:E55)-[:P127]->(st),
  (e31)-[:P102]->(title:E35),
  (e31)-[:P1]->(file:E75),
  (e31)<-[:P94]-(e65:E65),
  (e31)<-[:P128]-(e84:E84)
OPTIONAL MATCH (e31)-[rtag:has_tag]->(:TAG)
WITH e31, type, title, file, e65, e84, collect(rtag) AS rtags

MATCH (mUser:E21:`+prj+` {content: $user})-[:P131]->(mUserName:E82)

OPTIONAL MATCH (e31)-[rprimary:P2]->(sp)
OPTIONAL MATCH (e65)-[rauthor:P14]->(author:E21)-[:P131]->(aname:E82)
OPTIONAL MATCH (e65)-[rplace:P7]->(place:E53)-[:P87]->(pname:E48)
OPTIONAL MATCH (e65)-[:P4]->(:E52)-[:P82]->(date:E61)
OPTIONAL MATCH (e84)-[:P48]->(archivenr:E42)
OPTIONAL MATCH (e31)-[rnote:P3]->(note:E62)-[:P3_1]->({content: "sourceComment"})
OPTIONAL MATCH (e31)-[rrepros:P3]->(repros:E62)-[:P3_1]->({content: "sourceRepros"})
OPTIONAL MATCH (e84)<-[rcoll:P46]-(e78:E78)-[:P1]->(coll:E41),
  (e78)-[:P52]->(:E40)-[:P131]->(inst:E82)
OPTIONAL MATCH (e31)<-[:P129]-(ce33:E33)-[:P2]->(:E55 {content: "commentSource"})
OPTIONAL MATCH (e31)<-[:P15]-(up:E7)-[:P2]->(:E55 {content: "sourceUpload"}),
  (up)-[:P14]->(user:E21)-[:P131]->(userName:E82),
  (up)-[:P4]->(:E52)-[:P82]->(upDate:E61)

CREATE (e31)-[:P2]->(type)

CREATE (e31)<-[:P31]-(e11:E11 {content: $e11id}),
(e11)-[:P14]->(mUser),
(e11)-[:P4]->(:E52 {content: $e52id})-[:P82]->(mDate:E61 {value: $mDate})

MERGE (aname:E82 {value: $author})<-[:P131]-(e21:E21)
  ON CREATE SET e21.content = $e21id, aname.content = $e82id
  CREATE (e65)-[:P14]->(e21)

MERGE (pname:E48 {value: $place})<-[:P87]-(e53:E53)
  ON CREATE SET e53.content = $e53id, pname.content = $e48id
  CREATE (e65)-[:P7]->(e53)

MERGE

MERGE (e31)-[:P3]->(note:E62)-[:P3_1]->(sc)
  ON CREATE SET note.content = $nodeId, note.value = $note
  ON MATCH SET note.value = $note

MERGE (e31)-[:P3]->(repros:E62)-[:P3_1]->(sr)
  ON CREATE SET note.content = $reprosId, note.value = $repros
  ON MATCH SET note.value = $repros

SET title.value = $title

DELETE rtype, rprimary, rauthor, rplace

DETACH DELETE note

FOREACH (rt in rtags |
  DELETE rt )

FOREACH (tag in $tags |
  MERGE (t:TAG {content: tag})
  MERGE (e31)-[:has_tag]->(t) )

RETURN e31.content AS id,
  id(e31) AS nId,
  type.content AS type,
  title.value AS title,
  primary IS NOT NULL AS primary,
  aname.value AS author,
  pname.value AS place,
  date.value AS date,
//  {identifier: archivenr.value, collection: coll.value, institution: inst.value, institutionAbbr: inst.abbr} AS archive,
  file AS file,
  plan3d.content AS plan3d,
  note.value AS note,
  repros.value AS repros,
  tags,
  count(ce33) AS commentLength,
  {id: user.content, name: userName.value, date: upDate.value} AS user
;

MATCH (e31:E31:Proj_q66NrRJ {content: $id})<-[:P128]-(e84:E84)
OPTIONAL MATCH (e84)-[ranr:P48]->(archivenrOld:E42)
OPTIONAL MATCH (archivenrOld)<-[ranrs:P48]-()
RETURN e31, archivenrOld, count(ranrs) AS size