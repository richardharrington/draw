var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , parse = require('url').parse
  , join = require('path').join
  , history = []
  , lastUserId = 0
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
  var userId = userIdGen++;
  var lastUserSegment = {};
    
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
    
    // REWRITE THESE COMMENTS WHEN I'M THINKING STRAIGHT.
    // Various properties being present tell us what's happening here.
    // If ix, iy, width and color exist, it's a new stroke with a new brush.
    // If only fx and fy exist, it's the continuation of a stroke.
    // If only ix and iy exist, it's a new stroke with the same brush.
    
    // If a new brush has been sent from the user, or if the user's ongoing
    // brush is different from the one in the last history element that happens
    // to have been broadcast (channelBrush), then broadcast brush information.
    if (segment.color != null) {
      lastUserSegment.width = segment.color;
      lastUserSegment.color = segment.color;
    } 
    
    // We're continuing a stroke, so make sure we don't jump back and forth between brushes.
    else if (userId !== lastUserId) {
      segment.ix = lastUserSegment.fx;
      segment.iy = lastUserSegment.fy;
      segment.width = lastUserSegment.width;
      segment.color = lastUserSegment.color;
    }
    
    // Now set it up for the next round. Don't actually 
    // care about the initial coordinates here.
    lastUserSegment.fx = segment.fx;
    lastUserSegment.fy = segment.fy;

    lastUserId = userId;
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