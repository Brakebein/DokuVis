angular.module('dokuvis.activities', [

])

.factory('Activity', ['$resource', 'ApiParams', 'ApiActivity',
	function ($resource, ApiParams, ApiActivity) {

		return $resource(ApiActivity, ApiParams);

	}
])

.directive('activityList', ['$q', '$state', 'Activity', 'Subproject', 'Utilities', '$log',
	function ($q, $state, Activity, Subproject, Utilities, $log) {

		return {
			templateUrl: 'components/dokuvis.activities/activityList.tpl.html',
			restrict: 'E',
			link: function (scope) {

				scope.activities = [];
				scope.pages = [];
				scope.currentPage = 0;

				var subprojects = null;

				function querySubprojects() {
					return Subproject.query().$promise
						.then(function (results) {
							subprojects = results;
							return $q.resolve();
						})
						.catch(function (reason) {
							Utilities.throwApiException('Subproject.query', reason);
							return $q.reject(reason);
						});
				}

				function queryActivities() {
					var deferred = $q.defer();

					if (subprojects)
						deferred.resolve();
					else
						querySubprojects()
							.then(function () {
								deferred.resolve();
							})
							.catch(function () {
								deferred.reject();
							});

					deferred.promise
						.catch(function () {
							// aborted
						})
						.then(function () {
							return Activity.query().$promise
						})
						.then(function (results) {
							results.forEach(function (a) {
								a.subproject = subprojects.find(function (sp) {
									return a.subproject === sp.id;
								}) || { id: 'master', name: 'master' };
							});
							scope.activities = results;

							scope.pages = [];
							scope.pages.push({active: true});
							for (var i = 1, l = Math.ceil(results.length / 10); i < l; i++) {
								scope.pages.push({active: false});
							}

							$log.debug('Last activites', results);
						})
						.catch(function (reason) {
							Utilities.throwApiException('Activity.query', reason);
						});
				}

				// init
				queryActivities();

				scope.openActivity = function (activity) {
					switch (activity.type) {
						case 'source_upload':
						case 'source.update':
							$state.go('^.explorer.source.id', {
								subproject: activity.subproject.id,
								sourceId: activity.id
							});
							break;
						case 'model_upload':
						case 'version_update':
							$state.go('^.explorer', {
								subproject: activity.subproject.id,
								initialVersion: activity.id
							});
							break;
						case 'task_create':
						case 'task_update':
							$state.go('^.tasks', {
								initialTask: activity.id
							});
							break;
						case 'comment_create':
							if (activity.commentType === 'commentSource')
								$state.go('^.explorer.source.id', {
									subproject: activity.subproject.id,
									sourceId: activity.commentTarget
								});
							else if (activity.commentType === 'commentModel')
								$state.go('^.explorer', {
									subproject: activity.subproject.id,
									initialComment: activity.id
								});
							else if (activity.commentType === 'commentTask')
								$state.go('^.tasks', {
									initialTask: activity.commentTarget
								});
							else
								$state.go('^.explorer', {
									subproject: activity.subproject.id,
									initialComment: activity.commentTarget
								});
					}
				};

				scope.setPage = function (value) {
					if (value === 'prev') value = scope.currentPage - 1;
					else if (value === 'next') value = scope.currentPage + 1;

					scope.pages[scope.currentPage].active = false;
					scope.currentPage = value;
					scope.pages[value].active = true;
				}

			}
		};

	}
]);
