//create task
match (editor:E21)-[:P131]->(editorName:E82)
  where editor.content in {editors}
with collect({editor: editor, editorName: editorName}) as editorsColl
match (ttask:E55 {content: "task"}),
      (tdesc:E55 {content: "taskDesc"}),
      (user:E21 {content: "bruschie@hotmail.com"}),
      (parent:E7 {content: "parentId"}),
      (tprior:E55:`+prj+` {content: {priority}})-[:P127]->(:E55 {content: "taskPriority"}),
      (tstatus:E55:`+prj+` {content: "status_todo"})-[:P127]->(:E55 {content: "taskStatus"})
create (task:E7 {content: {taskId}, progress: {progress}}),
       (task)-[:P2]->(ttask),
       (task)-[:P102]->(:E35 {titleContent}),
       (task)-[:P3]->(:E62 {descContent})-[:P3_1]->(tdesc),
       (task)<-[:P9]-(parent),
       (task)-[:P2]->(tprior),
       (task)-[:P2]->(tstatus),
       (task)-[:P4]->(:E52 {content: {e52id}})-[:P81]->(:E61 {timeContent}),
       (task)<-[:P94]-(e65:E65 {content: "e65id"}),
       (e65)-[:P14]->(user),
       (e65)-[:P4]->(:E52 {content: "e52id"})-[:P82]->(:E61 {dateContent})

with task, title, desc, time, parent, ttask, tprior, tstatus, user, userName, date, editorsColl

unwind editorsColl as editors
foreach (e in editors.editor |
  create (task)-[:P14]->(e)
)

//query tasks
MATCH (task:E7)-[:P2]->(ttask:E55)
WHERE ttask.content = "task" OR ttask.content = "subproject"
WITH task, ttask
MATCH (task)-[:P102]->(title:E35),
      (task)-[:P3]->(desc:E62)-[:P3_1]->(:E55 {content: "taskDesc"}),
      (task)-[:P4]->(:E52)-[:P81]->(time:E61),
      (task)-[:P14]->(editor:E21)-[:P131]->(editorName:E82),
      (task)<-[:P94]-(e65:E65)-[:P14]->(user:E21)-[:P131]->(userName:E82),
      (e65)-[:P4]->(:E52)-[:P82]->(date:E61),
      (task)<-[:P9]-(parent),
      (task)-[:P2]->(tprior:E55)-[:P127]->(:E55 {content: "taskPriority"}),
      (task)-[:P2]->(tstatus:E55)-[:P127]->(:E55 {content: "taskStatus"})
OPTIONAL MATCH (task)-[:P14]->(editor:E21)-[:P131]->(editorName:E82)
OPTIONAL MATCH (task)<-[:P31]-(e11:E11)-[:P14]->(mUser:E21)-[:P131]->(mUserName:E82),
               (e11)-[:P4]->(:E52)-[:P82]->(mDate:E61)
RETURN task.content AS id,
       title.value AS title,
       desc.value AS description,
       time.value AS from, time.until AS to,
       parent.content AS parent,
       ttask.content AS type,
       tprior.value AS priority,
       tstatus.value AS status,
       collect({id: editor.content, name: editor.name}) AS editors,
       {id: user.content, name: userName.value, date: date.value} AS user

//update task
MATCH (ttp:E55 {content: "taskPriority"})<-[:P127]-(tprior:E55 {content: "priority_medium"}),
      (tts:E55 {content: "taskStatus"})<-[:P127]-(tstatus:E55 {content: "status_done"}),
      (ttd:E55 {content: "taskDesc"})
WITH ttp, tprior, tts, tstatus, ttd

MATCH (editor:E21)-[:P131]->(editorName:E82)
  WHERE editor.content IN {editors}
WITH ttp, tprior, tts, tstatus, ttd, collect({editor: editor, editorName: editorName}) AS editorsColl

MATCH (mUser:E21 {content: "bruschie@hotmail.com"})-[:P131]->(mUserName:E82)
WITH ttp, tprior, tts, tstatus, ttd, editorsColl, mUser, mUserName

MATCH (task:E7 {content: "task_sfee3dscds"})-[:P2]->(ttask:E55 {content: "task"}),
      (task)-[:P102]->(title:E35),
      (task)-[:P3]->(desc:E62)-[:P3_1]->(ttd),
      (task)-[:P4]->(:E52)-[:P81]->(time:E61),
      (task)<-[:P9]-(parent),
      (task)-[rprior:P2]->(:E55)-[:P127]->(ttp),
      (task)-[rstatus:P2]->(:E55)-[:P127]->(tts),
      (task)<-[:P94]-(e65:E65)-[:P14]->(cUser:E21)-[:P131]->(cUserName:E82),
      (e65)-[:P4]->(:E52)-[:P82]->(cDate:E61)

OPTIONAL MATCH (task)-[reditor:P14]->(:E21)
OPTIONAL MATCH (task)<-[:P31]-(e11old:E11)-[:P14]->(:E21),
               (e11old)-[:P4]->(e52old:E52)-[:P82]->(mDateOld:E61)

DELETE rprior, rstatus
DETACH DELETE e11old, e52old, mDateOld

WITH task, title, desc, time, parent, ttask, tprior, tstatus,
     editorsColl, mUser, mUserName,
     collect(reditor) as reditorColl,
     {id: cUser.content, name: cUserName.value, date: cDate.value} AS created

CREATE (task)-[:P2]->(tprior),
       (task)-[:P2]->(tstatus),
       (task)<-[:P31]-(e11:E11:`+prj+` {content: {e11id}}),
       (e11)-[:P14]->(mUser),
       (e11)-[:P4]->(:E52:`+prj+` {content: {e52id}})-[:P82]->(mDate:E61:`+prj+` {value: {mDate}})
SET title.value = {title},
    desc.value = {desc},
    time.value = {from},
    time.until = {until}

FOREACH (r IN reditorColl |
  DELETE r
)

WITH task, title, desc, time, parent, ttask, tprior, tstatus, created,
     {id: mUser.content, name: mUserName.value, date: mDate.value} AS modified,
     editorsColl

UNWIND editorsColl AS editors
FOREACH (e IN editors.editor |
  CREATE (task)-[:P14]->(e)
)

RETURN task.content AS id,
       title.value AS title,
       desc.value AS desc,
       time.value AS from, time.until AS to,
       parent.content AS parent,
       ttask.content AS type,
       tprior.value AS priority,
       tstatus.value AS status,
       collect({id: editors.editor.content, name: editors.editorName.value}) AS editors,
       created,
       modified

// delete
MATCH (task:E7:`+prj+` {content: {taskId}})-[:P2]->(:E55 {content: "task"}),
      (task)-[:P102]->(title:E35),
      (task)-[:P3]->(desc:E62)-[:P3_1]->(:E55 {content: "taskDesc"}),
      (task)-[:P4]->(taske52:E52)-[:P81]->(time:E61),
      (task)<-[:P94]-(e65:E65)-[:P4]->(ce52:E52)-[:P82]->(cDate:E61),
      (task)-[:P2]->(:E55)-[:P127]->(:E55 {content: "taskPriority"}),
      (task)-[:P2]->(:E55)-[:P127]->(:E55 {content: "taskStatus"}),
      (task)<-[:P9]-(parent)

OPTIONAL MATCH (task)<-[:P31]-(e11:E11)-[:P4]->(me52:E52)-[:P82]->(mDate:E61)
OPTIONAL MATCH (task)-[:P9]->(child)

DETACH DELETE task, title, desc, taske52, time, e65, ce52, cDate, e11, me52, mDate

WITH parent, collect(child) AS children
FOREACH (c IN children |
  CREATE (parent)-[:P9]->(c)
)