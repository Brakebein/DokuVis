const utils = require('../utils');
const neo4j = require('../neo4j-request');
const shortid = require('shortid');

module.exports = {

	query: function (req, res) {
		var prj = req.params.id;

		//noinspection JSAnnotator
		var q = `
		MATCH (task:E7:`+prj+`)-[:P2]->(ttask:E55 {content: "task"}),
			(task)-[:P102]->(title:E35),
    		(task)-[:P3]->(desc:E62)-[:P3_1]->(:E55 {content: "taskDesc"}),
      		(task)-[:P4]->(:E52)-[:P81]->(time:E61),
      		(task)<-[:P94]-(e65:E65)-[:P14]->(user:E21)-[:P131]->(userName:E82),
      		(e65)-[:P4]->(:E52)-[:P82]->(date:E61),
      		(task)<-[:P9]-(parent),
      		(task)-[:P2]->(tprior:E55)-[:P127]->(:E55 {content: "taskPriority"})
      	OPTIONAL MATCH (task)-[:P14]->(editor:E21)-[:P131]->(editorName:E82)
      	OPTIONAL MATCH (task)<-[:P31]-(e11)-[:P14]->(mUser:E21)-[:P131]->(mUserName:E82),
      		(e11)-[:P4]->(:E52)-[:P82]->(mDate:E61)
		RETURN task.content AS id,
       		title.value AS title,
       		desc.value AS description,
       		time.value AS from, time.until AS to,
       		parent.content AS parent,
       		ttask.content AS type,
       		tprior.value AS priority,
       		collect({id: editor.content, name: editorName.value}) AS editors,
       		{id: user.content, name: userName.value, date: date.value} AS created,
       		{id: mUser.content, name: mUserName.value, date: mDate.value} AS modified`;

		neo4j.readTransaction(q)
			.then(function (result) {
				res.json(neo4j.removeEmptyArrays(result, 'editors', 'id'));
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#task.query');
			});
	},

	get: function (req, res) {
		var prj = req.params.id;

		//noinspection JSAnnotator
		var q = `
		MATCH (task:E7:`+prj+` {content: {taskId}})-[:P2]->(ttask:E55 {content: "task"}),
			(task)-[:P102]->(title:E35),
    		(task)-[:P3]->(desc:E62)-[:P3_1]->(:E55 {content: "taskDesc"}),
      		(task)-[:P4]->(:E52)-[:P81]->(time:E61),
      		(task)<-[:P94]-(e65:E65)-[:P14]->(cUser:E21)-[:P131]->(cUserName:E82),
      		(e65)-[:P4]->(:E52)-[:P82]->(cDate:E61),
      		(task)<-[:P9]-(parent),
      		(task)-[:P2]->(tprior:E55)-[:P127]->(:E55 {content: "taskPriority"})
      	OPTIONAL MATCH (task)-[:P14]->(editor:E21)-[:P131]->(editorName:E82)
      	OPTIONAL MATCH (task)<-[:P31]-(e11)-[:P14]->(mUser:E21)-[:P131]->(mUserName:E82),
      		(e11)-[:P4]->(:E52)-[:P82]->(mDate:E61)
		RETURN task.content AS id,
       		title.value AS title,
       		desc.value AS description,
       		time.value AS from, time.until AS to,
       		parent.content AS parent,
       		ttask.content AS type,
       		tprior.value AS priority,
       		collect({id: editor.content, name: editorName.value}) AS editors,
       		{id: cUser.content, name: cUserName.value, date: cDate.value} AS created,
       		{id: mUser.content, name: mUserName.value, date: mDate.value} AS modified`;

		var params = {
			taskId: req.params.tid
		};

		neo4j.readTransaction(q, params)
			.then(function (result) {
				res.json(neo4j.removeEmptyArrays(result, 'editors', 'id')[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#task.query');
			});
	},

	create: function (req, res) {
		if (!req.body.title) { utils.abort.missingData(res, '#task.create body.title'); return; }
		if (!req.body.date) { utils.abort.missingData(res, '#task.create body.date'); return; }
		if (!req.body.from || !req.body.to) { utils.abort.missingData(res, '#task.create body.from|body.to'); return; }
		if (!req.body.parent) { utils.abort.missingData(res, '#task.create body.parent'); return; }

		var prj = req.params.id;
		var id = 'task_' + shortid.generate();

		var priority = 'priority_low';
		if (req.body.priority === 1)
			priority = 'priority_medium';
		else if (req.body.priority === 2)
			priority = 'priority_high';

		//noinspection JSAnnotator
		var q = `
		MATCH (ttask:E55:`+prj+` {content: "task"}),
     		(tdesc:E55:`+prj+` {content: "taskDesc"}),
      		(user:E21:`+prj+` {content: {user}})-[:P131]->(userName:E82),
      		(parent:E7:`+prj+` {content: {parentId}}),
      		(tprior:E55:`+prj+` {content: {priority}})-[:P127]->(:E55 {content: "taskPriority"})
      	OPTIONAL MATCH (editor:E21:`+prj+`)-[:P131]->(editorName:E82)
  			WHERE editor.content IN {editors}
		CREATE (task:E7:`+prj+` {content: {taskId}}),
			(task)-[:P2]->(ttask),
			(task)-[:P102]->(title:E35:`+prj+` {titleContent}),
			(task)-[:P3]->(desc:E62:`+prj+` {descContent})-[:P3_1]->(tdesc),
			(parent)-[:P9]->(task),
			(task)-[:P2]->(tprior),
			(task)-[:P4]->(:E52:`+prj+` {content: {timeId}})-[:P81]->(time:E61:`+prj+` {timeContent}),
			(task)<-[:P94]-(e65:E65:`+prj+` {content: {e65id}}),
			(e65)-[:P14]->(user),
			(e65)-[:P4]->(:E52:`+prj+` {content: {e52id}})-[:P82]->(date:E61:`+prj+` {value: {date}})
		FOREACH (o IN CASE WHEN editor IS NOT NULL THEN [editor] ELSE [] END |
			CREATE (task)-[:P14]->(editor)
		)
		RETURN task.content AS id,
       		title.value AS title,
       		desc.value AS description,
       		time.value AS from, time.until AS to,
       		parent.content AS parent,
       		ttask.content AS type,
       		tprior.value AS priority,
       		collect({id: editor.content, name: editorName.value}) AS editors,
       		{id: user.content, name: userName.value, date: date.value} AS created`;

		var params = {
			taskId: id,
			titleContent: {
				content: 'e35_' + id,
				value: req.body.title
			},
			descContent: {
				content: 'e62_' + id,
				value: req.body.description
			},
			timeContent: {
				value: req.body.from,
				until: req.body.to
			},
			timeId: 'e52_' + id,
			parentId: req.body.parent,
			priority: priority,
			user: req.headers['x-key'],
			date: req.body.date,
			e65id: 'e65_' + id,
			e52id: 'e52_e65_' + id,
			editors: req.body.editors
		};

		neo4j.writeTransaction(q, params)
			.then(function (result) {
				res.json(neo4j.removeEmptyArrays(result, 'editors', 'id')[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#task.create');
			});
	},

	update: function (req, res) {
		var prj = req.params.id;
		var id = req.params.tid;
		var mId = shortid.generate();

		var priority = 'priority_low';
		if (req.body.priority === 1)
			priority = 'priority_medium';
		else if (req.body.priority === 2)
			priority = 'priority_high';

		//noinspection JSAnnotator
		var q = `
		MATCH (task:E7:`+prj+` {content: {taskId}})-[:P2]->(ttask:E55 {content: "task"}),
			(ttp:E55:`+prj+` {content: "taskPriority"}),
			(task)-[:P102]->(title:E35),
    		(task)-[:P3]->(desc:E62)-[:P3_1]->(:E55 {content: "taskDesc"}),
      		(task)-[:P4]->(:E52)-[:P81]->(time:E61),
      		(task)<-[:P9]-(parent),
      		(task)-[rprior:P2]->(:E55)-[:P127]->(ttp),
      		(tprior:E55:`+prj+` {content: {priority}})-[:P127]->(ttp),
      		(task)<-[:P94]-(e65:E65)-[:P14]->(cUser:E21)-[:P131]->(cUserName:E82),
      		(e65)-[:P4]->(:E52)-[:P82]->(cDate:E61),
      		(mUser:E21:`+prj+` {content: {user}})-[:P131]->(mUserName:E82)
      		
      	OPTIONAL MATCH (task)-[reditor:P14]->(editorOld:E21)
      	OPTIONAL MATCH (editor:E21:`+prj+`)-[:P131]->(editorName:E82)
  			WHERE editor.content IN {editors}
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
       		{id: mUser.content, name: mUserName.value, date: mDate.value} AS modified`;

		var params = {
			taskId: id,
			title: req.body.title,
			desc: req.body.description,
			from: req.body.from,
			until: req.body.to,
			priority: priority,
			editors: req.body.editors,
			e11id: 'e11_m_' + mId,
			e52id: 'e52_m_' + mId,
			mDate: req.body.date,
			user: req.headers['x-key']
		};

		neo4j.writeTransaction(q, params)
			.then(function (result) {
				res.json(neo4j.removeEmptyArrays(result, 'editors', 'id')[0]);
			})
			.catch(function (err) {
				utils.error.neo4j(res, err, '#task.update');
			});
	},

	delete: function (req, res) {

	}

};
