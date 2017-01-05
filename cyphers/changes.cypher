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
