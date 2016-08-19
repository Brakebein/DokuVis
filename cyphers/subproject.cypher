MATCH (sub:E7:Proj {content: {subId}})-[:P2]->(:E55 {content: "subproject"}),
(tpdesc:E55:Proj {content: "projDesc"}),
(sub)-[:P102]->(title:E35)
OPTIONAL MATCH (sub)-[:P3]->(descr:E62)-[:P3_1]->(tpdesc)
FOREACH ( ignoreMe IN CASE WHEN descr IS NULL AND length({descr}) > 0 THEN [1] ELSE [] END | CREATE (sub)-[:P3]->(:E62:Proj {content: "e62_" + sub.content, value: {descr}})-[:P3_1]->(tpdesc) )
FOREACH ( ignoreMe IN CASE WHEN NOT descr IS NULL THEN [1] ELSE [] END | SET descr.value = {descr} )
SET title.value = {title}