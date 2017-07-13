/**
 * Resolver: Check for valid token and user data.
 *
 * @ngdoc factory
 * @name ValidateResolve
 * @module dokuvisApp
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires https://docs.angularjs.org/api/ng/service/$timeout $timeout
 * @requires AuthenticationFactory
 * @requires https://github.com/mikemclin/angular-acl AclService
 */
angular.module('dokuvisApp')
	.factory('ValidateResolve', ['$q', 'AuthenticationFactory', 'AclService',
	function ($q, AuthenticationFactory, AclService) {
		return function () {
			var defer = $q.defer();

			AuthenticationFactory.check()
				.then(function () {
					AclService.flushRoles();
					AclService.attachRole('member');
					defer.resolve();
				})
				.catch(function (reason) {
					console.log(reason);
					defer.resolve();
				});

			return defer.promise;
		};
	}])

/**
 * Resolver: No access, if user is not logged in.
 *
 * @ngdoc factory
 * @name AuthenticateResolve
 * @module dokuvisApp
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires https://docs.angularjs.org/api/ng/service/$timeout $timeout
 * @requires AuthenticationFactory
 * @requires ValidateResolve
 */
.factory('AuthenticateResolve', ['$state', '$q', '$timeout', 'AuthenticationFactory', 'ValidateResolve',
	function ($state, $q, $timeout, AuthenticationFactory, ValidateResolve) {
		return function () {
			var defer = $q.defer();

			ValidateResolve().then(function () {
				if (AuthenticationFactory.isLogged) {
					console.log('auth resolve');
					defer.resolve();
				}
				else {
					console.log('auth reject');
					defer.reject();
					$timeout(function () {
						$state.go('home');
					});
				}
			});

			return defer.promise;
		};
	}])

/**
 * Resolver: If the user is already logged in, take him to the home page.
 *
 * @ngdoc factory
 * @name SkipResolve
 * @module dokuvisApp
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires https://docs.angularjs.org/api/ng/service/$timeout $timeout
 * @requires AuthenticationFactory
 * @requires ValidateResolve
 */
.factory('SkipResolve', ['$state', '$q', '$timeout', 'AuthenticationFactory', 'ValidateResolve',
	function ($state, $q, $timeout, AuthenticationFactory, ValidateResolve) {
		return function () {
			var defer = $q.defer();

			ValidateResolve().then(function () {
				if (!AuthenticationFactory.isLogged) {
					console.log('skip resolve');
					defer.resolve();
				}
				else {
					defer.reject();
					console.log('skip reject');
					$timeout(function () {
						$state.go('home');
					});
				}
			});

			return defer.promise;
		};
	}])

/**
 * Resolver: Check, if project exists and user is granted to access.
 *
 * @ngdoc factory
 * @name ProjectResolve
 * @module dokuvisApp
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires https://code.angularjs.org/1.4.6/docs/api/ng/service/$rootScope $rootScope
 * @requires Project
 * @requires https://github.com/mikemclin/angular-acl AclService
 */
.factory('ProjectResolve', ['$q', '$state', '$rootScope', 'Project', 'AclService',
	function ($q, $state, $rootScope, Project, AclService) {
		return function (params) {

			return Project.get({ id: params.project }).$promise.then(function (result) {

				if (result.status === 'NO_ENTRY') {

					$state.go('projectlist');
					return $q.reject(result.status);

				}

				$rootScope.userRole = result.role;

				AclService.attachRole('visitor');
				if (result.role === 'superadmin') {
					AclService.attachRole('superadmin');
					AclService.attachRole('admin');
					AclService.attachRole('historian');
					AclService.attachRole('modeler');
				}
				else if (result.role === 'admin')
					AclService.attachRole('admin');
				else if (result.role === 'historian')
					AclService.attachRole('historian');
				else if (result.role === 'modeler')
					AclService.attachRole('modeler');

				console.log(AclService.getRoles());
			}, function (err) {
				console.error('API Exception on Project.get()', err);
				return $q.reject(err);
			});

		};
	}])

/**
 * Resolver: Check, if subproject exists.
 *
 * @ngdoc factory
 * @name SubprojectResolve
 * @module dokuvisApp
 * @requires https://docs.angularjs.org/api/ng/service/$q $q
 * @requires https://ui-router.github.io/ng1/docs/0.3.1/index.html#/api/ui.router.state.$state $state
 * @requires Subproject
 */
.factory('SubprojectResolve', ['$q', '$state', 'Subproject',
	function ($q, $state, Subproject) {
		return function (params) {

			if (params.subproject === 'master')
				return $q.resolve();
			else {
				return Subproject.get({ id: params.subproject, project: params.project }).$promise.then(function (result) {

					if (!result.id) {
						$state.go('project.home', {project: params.project, subproject: 'master'});
						return $q.reject('Subproject does not exist!');
					}

				}, function (err) {
					console.error('API Exception on Subproject.check()', err);
					return $q.reject(err);
				});

			}
		};
	}]);
