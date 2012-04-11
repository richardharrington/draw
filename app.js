var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , parse = require('url').parse
  , join = require('path').join
  , history = []
  , mostRecentUserId = 0
  , userIdGen = 0
  , waitingForClearCanvasConfirmation = false;
  
/*

io.configure('production', function(){
  io.enable('browser client minification');  // send minified client
  io.enable('browser client etag');          // apply etag caching logic based on version number
  io.enable('browser client gzip');          // gzip the file
  io.set('log level', 1);                    // reduce logging
  io.set('transports', [                     // enable all transports (optional if you want flashsocket)
      'websocket'
    , 'flashsocket'
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
  ]);
});

io.configure('development', function(){
  io.set('transports', ['websocket']);
});

*/

io.sockets.on('connection', function(socket) {
  var userId = userIdGen++
    , location = {}
    , brushStyle = {}
    , brushIsNew;
    
  // Get a new browser up to date.
  socket.on('requestInitHistory', function() {
    // As long as someone hasn't just cleared the canvas
    // in preparation for clearing the history...
    if (!waitingForClearCanvasConfirmation) {
      socket.emit('drawHistory', history);      
    }
  });
  
  socket.on('requestClear', function() {
    io.sockets.emit('tempClear');
    waitingForClearCanvasConfirmation = true;
  });
  socket.on('requestRestore', function() {
    io.sockets.emit('drawHistory', history);
    waitingForClearCanvasConfirmation = false;
  });
  socket.on('registerBrush', function(style) {
      brushStyle = style;
      brushIsNew = true;
  });
  
  // point will be an object with properties x and y.
  socket.on('start', function(dot) {
    
    // Wipe the history if this is the first click after
    // a request to clear the canvas.
    if (waitingForClearCanvasConfirmation) {
      io.sockets.emit('finalClear');
      history = [];
      waitingForClearCanvasConfirmation = false;
    }
    
    // Only broadcast brush info if it's a new brush, 
    // or if we're switching back to this user from somebody else.
    if (brushIsNew || (userId !== mostRecentUserId)) {
      dot.width = brushStyle.width;
      dot.color = brushStyle.color;
    }
    io.sockets.emit('dot', dot);
    
    // Now set it up for the next round. 
    history.push(dot);
    location.x = dot.x;
    location.y = dot.y;
    mostRecentUserId = userId;
    brushIsNew = false;
  });

  // segment will be an object with properties fx and fy.
  socket.on('move', function(segment) {
    
    // Set initial coordinates and brush style 
    // only if we're switching back to this user from somebody else.
    if (userId !== mostRecentUserId) {
      segment.ix = location.x;
      segment.iy = location.y;
      segment.width = brushStyle.width;
      segment.color = brushStyle.color;
    }
    io.sockets.emit('seg', segment);
    
    // Now set it up for the next round. 
    history.push(segment);
    location.x = segment.fx;
    location.y = segment.fy;
    mostRecentUserId = userId;
  });
});

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