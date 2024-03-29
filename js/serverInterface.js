angular.module('yoodle')

.factory('serverInterfaceService', function () {
  return {
    init: function ($scope, $rootScope, $timeout, $interval, $location, toastr, localStorageService, roomService) {
      $scope.connectionStatus = {
        color: 'yellow'
      };

      var ip = localStorageService.get('serverIP') || '127.0.0.1';
      $rootScope.socket = io('http://' + ip + ':3001', {
        'connect timeout': 5000
      });

      $rootScope.socket.on('connect', function () {
        console.log('Connected to server');

        // Must be wrapped in a timeout to update in the next digest
        $timeout(function () {
          $scope.connectionStatus = {
            color: 'green'
          };
        });

        $rootScope.socket.on('playersInsufficient', function () {
          console.log('Need at least 3 players to start.');
          toastr.warning('Need at least 3 players to start.');
        });

        $rootScope.socket.on('roomCreated', function (roomID) {
          console.log('New room created. ID: ' + roomID);
          roomService.setRoomID(roomID);

          $rootScope.socket.emit('joinRoom', roomID, localStorageService.get('username'),localStorageService.get('difficulty'));
        });

        $rootScope.socket.on('roomJoined', function (success, msg) {
          if (success) {
            $rootScope.$apply(function () {
              $location.path('play');
            });
          }
          else {
            console.log('Failed to join. ' + msg);
            toastr.error(msg, 'Hmm... That didn\'t work');
          }
        });

        $rootScope.socket.on('updatePlayerList', function (list) {
          roomService.setPlayerList(list);
        });

        $rootScope.socket.on('gameStarted', function (time) {
          console.log('Game started!');

          $rootScope.gameStarted = true;
          roomService.newTimer(time);
        });

        $rootScope.socket.on('artistSelected', function (name) {
          $rootScope.isArtist = false;
          $rootScope.artistName = name;
          if (name == localStorageService.get('username')) {
            console.log('I\'m the artist!');
            $rootScope.isArtist = true;

            toastr.info('You are the artist now', 'Your turn');
          }
          else {
            toastr.info(name + ' is the artist now');
          }

          $rootScope.clearCtx();
        });
      });

      $rootScope.socket.on('minusTimer',function(){
          roomService.minusTimer(5);

          if ($rootScope.isArtist) {
            toastr.warning('You skipped the word!', '-5 seconds!');
          }
          else {
            toastr.warning('The artist skipped the word');
          }
      });

      $rootScope.socket.on('connect_error', function(err) {
        console.log('error');
        $timeout(function () {
          $scope.connectionStatus = {
            color: 'red'
          };
        });
      });
    }
  };
});
