//create task
match (ttask:E55 {content: "task"}),
      (tdesc:E55 {content: "taskDesc"}),
      (user:E21 {content: "bruschie@hotmail.com"}),
      (parent:E7 {content: "parentId"}),
      (tprior:E55:`+prj+` {content: {priority}})-[:P127]->(:E55 {content: "taskPriority"})
optional match (editors:E21)
  where editors.content in {editors}
create (task:E7 {content: {taskId}}),
       (task)-[:P2]->(ttask),
       (task)-[:P102]->(:E35 {titleContent}),
       (task)-[:P3]->(:E62 {descContent})-[:P3_1]->(tdesc),
       (task)<-[:P9]-(parent),
       (task)-[:P2]->(tprior),
       (task)-[:P4]->(:E52 {content: {e52id}})-[:P81]->(:E61 {timeContent}),
       (task)<-[:P94]-(e65:E65 {content: "e65id"}),
       (e65)-[:P14]->(user),
       (e65)-[:P4]->(:E52 {content: "e52id"})-[:P82]->(:E61 {dateContent})
foreach (editor in case when editors is not null then [editors] else [] end |
  create (task)-[:P14]->(editor)
)

//query tasks
MATCH (task:E7)-[:P2]->(ttask:E55 {content: "task"}),
      (task)-[:P102]->(title:E35),
      (task)-[:P3]->(desc:E62)-[:P3_1]->(:E55 {content: "taskDesc"}),
      (task)-[:P4]->(:E52)-[:P81]->(time:E61),
      (task)-[:P14]->(editor:E21)-[:P131]->(editorName:E82),
      (task)<-[:P94]-(e65:E65)-[:P14]->(user:E21)-[:P131]->(userName:E82),
      (e65)-[:P4]->(:E52)-[:P82]->(date:E61),
      (task)<-[:P9]-(parent),
      (task)-[:P2]->(tprior:E55)-[:P127]->(:E55 {content: "taskPriority"})
RETURN task.content AS id,
       title.value AS title,
       desc.value AS description,
       time.value AS from, time.until AS to,
       parent.content AS parent,
       ttask.content AS type,
       tprior.value AS priority,
       collect({id: editor.content, name: editor.name}) AS editors,
       {id: user.content, name: userName.value, date: date.value} AS user

//update task
MATCH (ttp:E55 {content: "taskPriority"})<-[:P127]-(tprior:E55 {content: "priority_medium"}),
      (ttd:E55 {content: "taskDesc"})
WITH ttp, ttd, tprior
MATCH (mUser:E21 {content: "bruschie@hotmail.com"})-[:P131]->(mUserName:E82)
WITH ttp, ttd, tprior, mUser, mUserName
MATCH (task:E7 {content: "task_sfee3dscds"})-[:P2]->(ttask:E55 {content: "task"}),
      (task)-[:P102]->(title:E35),
      (task)-[:P3]->(desc:E62)-[:P3_1]->(ttd),
      (task)-[:P4]->(:E52)-[:P81]->(time:E61),
      (task)<-[:P9]-(parent),
      (task)-[rprior:P2]->(:E55)-[:P127]->(ttp),
      (task)<-[:P94]-(e65:E65)-[:P14]->(cUser:E21)-[:P131]->(cUserName:E82),
      (e65)-[:P4]->(:E52)-[:P82]->(cDate:E61)

OPTIONAL MATCH (task)-[reditor:P14]->(editorOld:E21)
OPTIONAL MATCH (editor:E21)-[:P131]->(editorName:E82)
    WHERE editor.content IN ["bruschie@hotmail.com"]
OPTIONAL MATCH (task)<-[:P31]-(e11old:E11)-[:P14]->(:E21),
               (e11old)-[:P4]->(e52old:E52)-[:P82]->(mDateOld:E61)

CREATE (task)-[:P2]->(tprior),
       (task)<-[:P31]-(e11:E11:`+prj+` {content: {e11id}}),
       (e11)-[:P14]->(mUser),
       (e11)-[:P4]->(:E52:`+prj+` {content: {e52id}})-[:P82]->(mDate:E61:`+prj+` {value: {mDate}})
SET title.value = {title},
    desc.value = {desc},
    time.value = {from},
    time.until = {until}
DELETE rprior, reditor
DETACH DELETE e11old, e52old, mDateOld
FOREACH (o IN CASE WHEN editor IS NOT NULL THEN [editor] ELSE [] END |
    CREATE (task)-[:P14]->(editor)
)
RETURN task.content AS id,
       title.value AS title,
       desc.value AS desc,
       time.value AS from, time.until AS to,
       parent.content AS parent,
       ttask.content AS type,
       tprior.value AS priority,
       collect({id: editor.content, name: editorName.value}) AS editors,
       {id: cUser.content, name: cUserName.value, date: cDate.value} AS created,
       {id: mUser.content, name: mUserName.value, date: mDate.value} AS modified