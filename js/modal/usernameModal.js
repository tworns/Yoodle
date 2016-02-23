angular.module('yoodle')

.controller('UsernameModalCtrl', function($scope, $rootScope, toastr, localStorageService) {
  $scope.submitUsername = function() {
    if ($scope.username.length > 0) {
      // Save the username to local storage
      localStorageService.set('username', $scope.username);

      // Close the modal
      $rootScope.modalInstance.close();
    }
    else {
      toastr.error('Usernames can\'t be empty', 'Try again');
    }
  };
});