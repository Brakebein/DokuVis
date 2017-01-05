create (ctype:E55:Proj_pCSbD9l {content: "commentType"}),
(cg:E55:Proj_pCSbD9l {content: "commentGeneral"})-[:P127]->(ctype),
(cs:E55:Proj_pCSbD9l {content: "commentSource"})-[:P127]->(ctype),
(ca:E55:Proj_pCSbD9l {content: "commentAnswer"})-[:P127]->(ctype),
(cm:E55:Proj_pCSbD9l {content: "commentModel"})-[:P127]->(ctype),
(ct:E55:Proj_pCSbD9l {content: "commentTask"})-[:P127]->(ctype)
return ctype

match (n {content:"sourceInsertion"})
set n.content = "sourceUpload"
return n