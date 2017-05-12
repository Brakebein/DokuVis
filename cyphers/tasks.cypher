//create task
match (ttask:E55 {content: "task"}),
      (tdesc:E55 {content: "taskDesc"}),
      (user:E21 {content: "bruschie@hotmail.com"}),
      (parent:E7 {content: "parentId"})
optional match (editors:E21)
  where editors.content in {editors}
create (task:E7 {content: {taskId}}),
       (task)-[:P2]->(ttask),
       (task)-[:P102]->(:E35 {titleContent}),
       (task)-[:P3]->(:E62 {descContent})-[:P3_1]->(tdesc),
       (task)<-[:P9]-(parent),
       (task)-[:P4]->(:E52 {content: {e52id}})-[:P81]->(:E61 {timeContent}),
       (task)-[:P94]->(e65:E65 {content: "e65id"}),
       (e65)-[:P14]->(user),
       (e65)-[:P4]->(:E52 {content: "e52id"})-[:P82]->(:E61 {dateContent}),
       (task)-[:P14]->(editors)

//query tasks
MATCH (task:E7)-[:P2]->(:E55 {content: "task"}),
      (task)-[:P102]->(title:E35),
      (task)-[:P3]->(desc:E62)-[:P3_1]->(:E55 {content: "taskDesc"}),
      (task)-[:P4]->(:E52)-[:P81]->(time:E61),
      (task)-[:P14]->(editor:E21)-[:P131]->(editorName:E82),
      (task)-[:P94]->(e65:E65)-[:P14]->(user:E21)-[:P131]->(userName:E82),
      (e65)-[:P4]->(:E52)-[:P82]->(date:E61)
RETURN task.content AS id,
       title.value AS title,
       desc.value AS description,
       time.value AS from, time.until AS to,
       parent.content AS parent,
       collect({id: editor.content, name: editor.name}) AS editors,
       {id: user.content, name: userName.value, date: date.value} AS user