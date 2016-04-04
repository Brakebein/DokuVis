angular.module('dokuvisApp').controller('registerCtrl', ['$scope', '$state', '$window', 'UserAuthFactory', 'AuthenticationFactory', 'Utilities',
    function($scope, $state, $window, UserAuthFactory, AuthenticationFactory, Utilities) {

        $scope.userRegister = {
            email: '',
            name: '',
            password1: '',
            password2: ''
        };

        $scope.register = function() {
            var email = $scope.userRegister.email,
                username = $scope.userRegister.name,
                password1 = $scope.userRegister.password1,
                password2 = $scope.userRegister.password2;

            if(password1 !== password2) { Utilities.dangerAlert('Die Passwörter stimmen nicht überein!'); return; }
            if(email.length === 0) { Utilities.dangerAlert('Bitte geben Sie eine Emailadresse ein!'); return; }
            if(username.length === 0) { Utilities.dangerAlert('Bitte geben Sie einen Nutzernamen ein!'); return; }
            if(password1.length < 5) { Utilities.dangerAlert('Passwort hat nicht genügend Zeichen (mind. 6)!'); return; }

            UserAuthFactory.register(email, username, password1)
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
                    Utilities.throwException('Register', 'failed', status);
                });
        };

    }]);