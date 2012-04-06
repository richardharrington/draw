var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , parse = require('url').parse
  , join = require('path').join
  , history = [];
  
var waitingForClearCanvasConfirmation = false;


io.sockets.on('connection', function(socket) {
  // Get a new browser up to date.
  socket.on('updateFromHistory', function() {
    socket.emit('drawHistory', history);
  });
});

// Draw on all browsers when any user drags the mouse.
function stroke(segment) {
  history.push(segment);
  io.sockets.emit('stroke', segment);
}

// Clear all browsers' canvases when any user so desires,
// But allow anyone the chance to press the 'Restore' button
// until someone else makes the next move.
function confirmClear(socket) {
  io.sockets.emit('clear');
  
  // Remove regular 'move' listener and replace with 
  // a function that wipes the history first.
  io.sockets.clients().forEach(function(socket) {
    socket.removeListener('move', stroke);
  });
  var wipeHistoryAndStartAgain = function (segment) {
    history = [];
    stroke(segment);
    // Restore regular 'move' listener.
    io.sockets.clients().forEach(function(socket) {
      socket.on('move', stroke);
    });
  }
  io.sockets.once('move', wipeHistoryAndStartAgain);
  
  // Restore instead.
  io.sockets.on('requestRestore', function() {
    
    // Restore 'move' listener
    io.sockets.removeListener('move', wipeHistoryAndStartAgain);
    io.sockets.on('move', stroke);
    
    // Restore everyone's canvas.
    io.sockets.emit('drawHistory', history);
  });
  
  // TODO, related to above: Check to see whether new 'requestRestore'
  // listeners are going to keep getting added, or whether it's an idempotent assignment.
  
  io.sockets.once('move', function(segment) {
    history = [];
    stroke(data);
    // Restore regular 'move' listener.
    io.sockets.on('move', stroke);
  });
  var wipeHistoryAndStartAgain = function(data) {
    history = [];
    stroke(data);
  }
  
  io.sockets.once('move', wipeHistoryAndStartAgain);
  io.sockets.once('requestRestore', function(data) {
    io.sockets.removeListener(wipeHistoryAndStartAgain);
    io.sockets.emit('drawHistory');
  });
}
io.sockets.on('move', stroke);




app.listen(3000, '10.0.1.2');

function handler (req, res) {
  var url = parse(req.url);
  var localPathname = (url.pathname === '/') 
    ? '/index.html' 
    : url.pathname;
  var path = __dirname + '/public' + localPathname;
  
  fs.stat(path, function(err, stat) {
    if (err) {
      if ('ENOENT' === err.code) {
        res.statusCode = 404;
        res.end('Not Found');
      } else {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    } else {
      res.setHeader('Content-Length', stat.size);
      var stream = fs.createReadStream(path);
      stream.pipe(res);
      stream.on('error', function(err) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      });
    }
  });
}