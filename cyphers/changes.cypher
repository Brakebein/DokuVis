// E82 Actor Appellation content/value
match (n:E82)
where n.value is null
set n.value = n.content
set n.content = "e82_" + id(n)
return n

// E48 Place Appellation content/value
match (n:E48)
where n.value is null
set n.value = n.content
set n.content = "e48_" + id(n)
return n

// E42 Identifier content/value
match (n:E42)
where n.value is null
set n.value = n.content
set n.content = "e42_" + id(n)
return n

// E35 Title content/value
match (n:E35)
where n.value is null
set n.value = n.content
set n.content = "e35_" + id(n)
return n

// E41 Appellation content/value
match (n:E41)
where n.value is null
set n.value = n.content
set n.content = "e41_" + id(n)
return n

// E62 String Primitive content/value
match (n:E62)
where n.value is null
set n.value = n.content
set n.content = "e62_" + id(n)
return n

// E61 Time Primitive value
match (n:E61)
where n.value is null
set n.value = n.content
remove n.content
return n

// E42 Identifier to E84 Information Carrier
match (n:E31),
(n)-[r:P48]->(k:E42),
(n)<-[:P128]-(c:E84)
create (c)-[:P48]->(k)
delete r
return n, c, k

// E75 file preview
match (n:E75)
where exists(n.contentDisplay)
and n.preview is null
set n.preview = n.contentDisplay
remove n.contentDisplay
return n

// E75 file add "_thumbs/"
match (n:E75)
where exists(n.thumb)
and n.thumb starts with "t_"
set n.thumb = "_thumbs/" + n.thumb
return n

// E55 Type sourceUpload
match (n {content:"sourceInsertion"})
set n.content = "sourceUpload"
return n

// change user id to blank email
match (n:E21)-[:P2]->(:E55 {content:"projectPerson"})
set n.content = replace(n.content, "e21_", "")
return n

// set priority values
match (pl:E55 {content: "priority_low"}), (pm:E55 {content: "priority_medium"}), (ph:E55 {content: "priority_high"})
set pl.value = 0,
  pm.value = 1,
  ph.value = 2
return pl,pm,ph

// set priority
match (task:E7:Proj_q66NrRJ)-[:P2]->(:E55 {content: "task"}),
      (tprior:E55:Proj_q66NrRJ {content: "priority_low"})
create (task)-[:P2]->(tprior)
return task, tprior

// task P94 direction
match (task:E7)-[:P2]->(:E55 {content: "task"}),
      (task)-[r:P94]->(c:E65)
create (task)<-[:P94]-(c)
delete r
return task,c

// 2017-10-12
// E35 Title to E41 Appellation
match (d:D7)-[r]->(title:E35)
create (d)-[:P1]->(title)
set title:E41
remove title:E35
delete r
return d, title