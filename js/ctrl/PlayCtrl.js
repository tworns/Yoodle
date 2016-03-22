angular.module('yoodle')

.controller('PlayCtrl', function($scope, $rootScope, $location, $window, $interval, localStorageService, roomService) {
  $scope.canvas = document.getElementById('canvas');
  $scope.ctx = $scope.canvas.getContext('2d');

  $rootScope.clearCtx = function() {
    $scope.ctx.clearRect(0,0,canvas.width, canvas.height);
  };

  var interval;
  var lastX;
  var lastY;
  var currX;
  var currY;
  var drawing = false;
  $scope.canvas.onmousedown = function(e){
    console.log('artistDown!\n');
    var x;// = e.layerX - $scope.currentTarget.offsetLeft;
    var y;// = e.layerY-  $scope.currentTarget.offsetTop;
     if(e.offsetX!==undefined){
       x = e.offsetX-45;
        y = e.offsetY-45;
      } else {
        x = e.layerX - e.currentTarget.offsetLeft;
        y = e.layerY - event.currentTarget.offsetTop;
      }

        $rootScope.socket.emit('artistDrawDown',x,y, roomService.getRoomID());
        //$scope.onArtistDrawDown(e.pageX,e.pageY);
  $scope.canvas.onmousemove = function(e) {
        //  interval = $interval(function () {

        var x;// = e.layerX - $scope.offsetX;// - $scope.currentTarget.offsetLeft;
        var y;// = e.layerY- $scope.offsetY;// - $scope.currentTarget.offsetTop;
        if(e.offsetX!==undefined){
          x = e.offsetX-45;
           y = e.offsetY-45;
         } else {
           x = e.layerX - e.currentTarget.offsetLeft;
           y = e.layerY - event.currentTarget.offsetTop;
         }

            $rootScope.socket.emit('artistDrawMove',x,y,roomService.getRoomID());
          //  $scope.onArtistDrawMove(e.pageX,e.pageY);
        //});
        };
};

  $scope.canvas.onmouseup = function(e) {
    console.log("Hit mouseup");
    $rootScope.socket.emit('artistDrawStop',roomService.getRoomID());
    //$interval.cancel(interval);
  };

$rootScope.socket.on('artistDrawDown',function(x,y,e){
console.log("I'm going to draw!\n");
$scope.lastX = x;
$scope.lastY = y;
$scope.ctx.beginPath();
$scope.drawing = true;

});
$rootScope.socket.on('artistDraw',function(x,y){

if($scope.drawing) {

  console.log("I'm drawing!\n");
  $scope.ctx.beginPath();
$scope.currX = x;
$scope.currY = y;
$scope.ctx.moveTo($scope.lastX,$scope.lastY);
$scope.ctx.lineTo($scope.currX,$scope.currY);
  $scope.ctx.strokeStyle = "#4bf";
  $scope.ctx.stroke();
  $scope.lastX = $scope.currX;
  $scope.lastY = $scope.currY;
}
});
$rootScope.socket.on('artistDrawStop', function(){
  $scope.drawing = false;
});
$rootScope.socket.on('artistClear',function(){
  console.log('trying to clear (client)');
  $scope.ctx.clearRect(0, 0, $scope.canvas.width, $scope.canvas.height);
});
  $scope.username = localStorageService.get('username');
  $scope.roomID = roomService.getRoomID();
  roomService.setRoomIDCallback(function (id) {
    $scope.roomID = id;
  });

  $scope.playerList = roomService.getPlayerList();
  roomService.setPlayerListCallback(function (list) {
    $scope.playerList = list;
    $scope.$apply();
  });

  $scope.time = 60;
  roomService.setTimerCallback(function (timer) {
    $scope.time--;

    document.getElementById("bar").style.width = ($scope.time)/60*100+"%";
    document.getElementById("bar").innerHTML = ($scope.time)/60*100+"%";

    if ($scope.time <= 0) {
      $interval.cancel(timer);
    }
  });

  $rootScope.socket.on('newWord', function (word) {
    $scope.currentWord = word;
  });

  $scope.goGallery = function () {
    $location.path('end');
  };

  $scope.backToMenu = function () {
    // Let the server know we left the game
    $rootScope.socket.emit('leaveRoom', roomService.getRoomID(), $scope.username);

    // Perform some cleanup on global vars. Local scope will be recreated next time we join/create a game
    roomService.cleanup();

    $location.path('app');
  };

  $scope.startGame = function () {
    $rootScope.socket.emit('startGame', roomService.getRoomID());
    $rootScope.socket.emit('artistClear',roomService.getRoomID);
  };

  $scope.clearCanvas = function () {
    $scope.ctx.clearRect(0, 0, $scope.canvas.width, $scope.canvas.height);
    //trying to clear all canvases when artist clears his.
    console.log('Clear button pressed.');
    $rootScope.socket.emit('artistClear',roomService.getRoomID);
  };

  $scope.savaImage = function () {
    $scope.image = $scope.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    window.location.href=$scope.image;
  };

  $scope.sendGuess = function () {
    $rootScope.socket.emit('guess', $scope.guess, $scope.username);
    $scope.guess = '';
  };

  $scope.skipWord = function () {
    // Only let the artist skip words
    if ($rootScope.isArtist) {
      $rootScope.socket.emit('newWord');
    }
  };

  // Make sure to leave the game before closing the window!
  window.onbeforeunload = function (e) {
    if ($rootScope.socket.connected) {
      $rootScope.socket.emit('leaveRoom', roomService.getRoomID(), $scope.username);
    }

    return true;
  };

  //gallery things
  $scope.myInterval = 5000;
  $scope.noWrapSlides = false;
  $scope.active = 0;
  var slides = $scope.slides = [];
  var currIndex = 0;

  $scope.addSlide = function() {
    var newWidth = 600 + slides.length + 1;
    slides.push({
      image: 'http://lorempixel.com/' + newWidth + '/300',
      text: ['Nice image','Awesome photograph','That is so cool','I love that'][slides.length % 4],
      id: currIndex++
    });
  };

  $scope.randomize = function() {
    var indexes = generateIndexesArray();
    assignNewIndexesToSlides(indexes);
  };

  for (var i = 0; i < 4; i++) {
    $scope.addSlide();
  }

  // Randomize logic below

  function assignNewIndexesToSlides(indexes) {
    for (var i = 0, l = slides.length; i < l; i++) {
      slides[i].id = indexes.pop();
    }
  }

  function generateIndexesArray() {
    var indexes = [];
    for (var i = 0; i < currIndex; ++i) {
      indexes[i] = i;
    }
    return shuffle(indexes);
  }

  // http://stackoverflow.com/questions/962802#962890
  function shuffle(array) {
    var tmp, current, top = array.length;

    if (top) {
      while (--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = array[current];
        array[current] = array[top];
        array[top] = tmp;
      }
    }

    return array;
  }
});
