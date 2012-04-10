var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , parse = require('url').parse
  , join = require('path').join
  , history = []
  , waitingForClearCanvasConfirmation = false;


io.sockets.on('connection', function(socket) {
    
  // Get a new browser up to date.
  socket.on('requestInitHistory', function() {
    // As long as someone hasn't just cleared the canvas
    // in preparation for clearing the history...
    if (!waitingForClearCanvasConfirmation) {
      socket.emit('drawHistory', history);      
    }
  });
  
  socket.on('move', function(segment) {
    // Wipe the history if this is the 
    // first move after a request to clear the canvas.
    if (waitingForClearCanvasConfirmation) {
      history = [];
      waitingForClearCanvasConfirmation = false;
      io.sockets.emit('finalClear');
    }
    history.push(segment);
    io.sockets.emit('stroke', segment)
  });
  socket.on('requestClear', function() {
    waitingForClearCanvasConfirmation = true;
    io.sockets.emit('tempClear');
  });
  socket.on('requestRestore', function() {
    waitingForClearCanvasConfirmation = false;
    io.sockets.emit('drawHistory', history);
  });
});

app.listen(8888, '10.11.12.111');

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