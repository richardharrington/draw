var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , parse = require('url').parse
  , join = require('path').join
  , counter = 0
  , history = [];

io.sockets.on('connection', function(socket) {
  socket.on('getHistory', function() {
    socket.emit('drawHistory', history);
  });
  socket.on('requestClear', function() {
    io.sockets.emit('clear');
    
    // give them a chance to think about it 
    // and possibly press the restore button 
    // before they make their next move.
    io.sockets.once('move', function(data) {
      history = [];
      stroke(data);      
    });
    io.sockets.once('getHistory', function() {
      io.sockets.emit('drawHistory');
    })
  });
  socket.on('move', function(data) {
    stroke(data);
  });
});

app.listen(3000, '10.0.1.2');

function stroke(segment) {
  history.push(segment);
  io.sockets.emit('stroke', segment);
}

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