angular.module('dokuvisApp').controller('navCtrl', ['$scope', '$state', '$window', 'UserAuthFactory', 'AuthenticationFactory', 'Utilities',
    function($scope, $state, $window, UserAuthFactory, AuthenticationFactory, Utilities) {

        $scope.user = {
            email: '',
            password: ''
        };

        $scope.login = function() {
            var email = $scope.user.email,
                password = $scope.user.password;

            if(email.length === 0) { Utilities.dangerAlert('Ungültige Emailadresse!'); return; }
            if(password.length === 0) { Utilities.dangerAlert('Ungültiges Passwort!'); return; }

            UserAuthFactory.login(email, password)
                .success(function(data) {
                    AuthenticationFactory.isLogged = true;
                    AuthenticationFactory.user = data.user.email;
                    AuthenticationFactory.userName = data.user.name;
                    //AuthenticationFactory.userRole = data.user.role;

                    $window.localStorage.token = data.token;
                    $window.localStorage.user = data.user.email;
                    $window.localStorage.userName = data.user.name;
                    //$window.localStorage.userRole = data.user.role;

                    $state.go('projectlist');
                })
                .error(function(status) {
                    Utilities.throwException('Login', 'failed', status);
                });
        };

        $scope.logout = function() {
            UserAuthFactory.logout();
        };

    }]);