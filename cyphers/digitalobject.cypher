// create event
MATCH (user:E21 {content: $user}),
      (subprj:E7 {content: $subprj})
OPTIONAL MATCH (pre:D7 {content: $predecessor})
CREATE (devent:D7 {content: $deventId})-[:P14]->(user),
       (devent)-[:P4]->(:E52 {content: $e52id})-[:P82]->(:E61 {value: $date}),
       (devent)<-[:P15]-(subprj),
       (devent)-[:P102]->(:E35 $title),
       (devent)-[:P3]->(:E62 $note)
FOREACH (sw IN $software |
  MERGE (software:D14 {value: sw.value})
    ON CREATE SET software.content = sw.content
  CREATE (devent)-[:L23]->(software)
)
FOREACH (ignoreMe IN CASE WHEN pre IS NOT NULL THEN [1] ELSE [] END |
  CREATE (devent)-[:P134]->(pre)
)
RETURN devent;

// create digital object
MATCH (tmodel:E55:Proj_q66NrRJ {content: 'model'}),
      (subprj:E7:Proj_q66NrRJ {content: $subprj}),
      (devent:D7 {content: $deventId})
OPTIONAL MATCH (subprj)-[:P15]->(deventOld:D7)-[:L11]->(dobjOld:D1 {id: $obj.id})<-[:P106]-(dglobOld:D1)-[:P2]->(tmodel)
WHERE NOT (dobjOld)<-[:L10]-(:D7)

MERGE (dobj:D1 {content: $obj.content})
  ON CREATE SET dobj = $obj
CREATE (devent)-[:L11]->(dobj),
       (dobj)-[:P1]->(file:E75 $file)

FOREACH (parentId IN $parentId |
  MERGE (parent:D1 {content: parentId})
  CREATE (parent)-[:P106]->(dobj)
)
FOREACH (ignoreMe IN CASE WHEN dobjOld IS NOT NULL THEN [1] ELSE [] END |
  CREATE (devent)-[:L10]->(dobjOld),
         (dobj)<-[:P106]-(dglobOld)
)
FOREACH (ignoreMe IN CASE WHEN dobjOld IS NULL THEN [1] ELSE [] END |
  CREATE (dobj)<-[:P106]-(dglob:D1 {content: $dglobid})-[:P2]->(tmodel),
         (dglob)-[:P67]->(e22:E22 {content: $e22id})
)

WITH dobj
UNWIND range(0, size($materials) - 1) AS i
MERGE (e57:E57 {content: $materials[i].content})
  ON CREATE SET e57 = $materials[i]
CREATE (dobj)-[:P2 {order: i}]->(e57)

RETURN DISTINCT dobj;


// query event
MATCH (:E7 {content: $subprj})-[:P15]->(devent:D7 {content: $deventId}),
      (devent)-[:P102]->(title:E35),
      (devent)-[:P3]->(note:E62),
      (devent)-[:P14]->(user:E21)-[:P131]->(userName:E82),
      (devent)-[:P4]->(:E52)-[:P82]->(date:E61)
OPTIONAL MATCH (devent)-[:L23]->(software:D14)
OPTIONAL MATCH (devent)-[:P134]->(prev:D7)
RETURN devent.content AS id,
       title.value AS title,
       note.value AS note,
       {id: user.content, name: userName.value, date: date.value} AS created,
       software.value AS software,
       prev.content AS predecessor;


// query models/digital objects
MATCH (tmodel:E55 {content: 'model'})
WITH tmodel
MATCH (:E7 {content: $subprj})-[:P15]->(devent:D7 {content: $deventId}),
      (devent)-[:L11]->(dobj:D1)-[:P1]->(file:E75),
      (dobj)-[rmat:P2]->(mat:E57),
      (dobj)<-[:P106]-(dglob:D1)-[:P2]->(tmodel),
      (dglob)-[:P67]->(e22:E22)
WITH dobj, file, mat
ORDER BY rmat.order
WITH dobj, file, collect(mat) AS materials
OPTIONAL MATCH (dobj)<-[:P106]-(parent:D1)
WHERE NOT (parent)-[:P2]->(tmodel)
RETURN dobj.content AS id,
       dobj AS obj,
       file AS file,
       materials,
       parent.content AS parent;

RETURN $id AS id,
$test[0] AS test;

MATCH (n {content:'d1_H1lLoLblsW_Box001'}) RETURN n