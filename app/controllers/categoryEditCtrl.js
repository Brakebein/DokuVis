angular.module('dokuvisApp').controller('categoryEditCtrl',
    function($scope, $stateParams, APIRequest, Utilities) {

        $scope.categories = [];

        // color picker settings
        $scope.minicolors = {
            control: 'wheel',
            opacity: true,
            position: 'bottom left',
            format: 'rgb',
            changeDelay: 200
        };


        function getAllCategories() {
            APIRequest.getAllCategories().then(function(response) {
                console.log(response);
                $scope.categories = Utilities.cleanNeo4jData(response.data);
            }, function(err) {
                Utilities.throwApiException('on getAllCategories()', err);
            });
        };
        getAllCategories();

        $scope.addCategory = function() {
            if(!$scope.newCategory) return;
            var category = {
                value: $scope.newCategory,
                id: Utilities.getUniqueId() + '_category',
                attributes: []
            };

            APIRequest.createCategory(category.id, category.value).then(function(response) {
                $scope.categories.push(category);
                $scope.newCategory = '';
            }, function(err) {
                Utilities.throwApiException('on createCategory()', err);
            });
        };

        $scope.removeCategory = function(category) {
            APIRequest.deleteCategory(category.id).then(function(response) {
                $scope.categories.splice($scope.categories.indexOf(category), 1);
            }, function(err) {
                Utilities.throwApiException('on deleteCategory()', err);
            });
        };

        $scope.updateCategory = function(cid, value) {
            APIRequest.updateCategory(cid, value).then(function(response) {}, function(err) {
                Utilities.throwApiException('on updateCategory()', err);
            });
        };

        $scope.addAttribute = function(category) {
            if(!category.newAttribute) return;
            var attribute = {
                value: category.newAttribute,
                id: Utilities.getUniqueId() + '_categoryAttr',
                color: getRandomColor()
            };

            APIRequest.createCategoryAttribute(category.id, attribute).then(function(response) {
                category.attributes.push(attribute);
                category.newAttribute = '';
            }, function(err) {
                Utilities.throwApiException('on createCategoryAttribute()', err);
            });
        };

        $scope.removeAttribute = function(category, attribute) {
            APIRequest.deleteCategoryAttribute(category.id, attribute.id).then(function(response) {
                category.attributes.splice(category.attributes.indexOf(attribute), 1);
            }, function(err) {
                Utilities.throwApiException('on deleteCategoryAttribute()', err);
            });
        };

        $scope.updateAttribute = function(cid, id, value) {
            APIRequest.updateCategoryAttribute(category.id, attribute.id, value).then(function(response) {}, function(err) {
                Utilities.throwApiException('on updateCategoryAttribute()', err);
            });
        };

        $scope.updateColor = function(cid, id, value) {
            APIRequest.updateCategoryAttribute(cid, id, null, value).then(function(response) {}, function(err) {
                Utilities.throwApiException('on updateCategoryAttribute()', err);
            });
        };

        var getRandomColor = function () {
            var letters = '0123456789ABCDEF'.split('');
            var color = '#';
            for (var i = 0; i < 6; i++ ) {
                color += letters[Math.round(Math.random() * 15)];
            }
            return color;
        };

    });