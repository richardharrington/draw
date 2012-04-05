var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , parse = require('url').parse
  , join = require('path').join
  , counter = 0;

io.sockets.on('connection', function (socket) {
  socket.on('move', function (data) {
    console.log("We've received move number " + counter++);
    socket.emit('stroke', data);
  });
});

app.listen(3000, '10.0.1.2');

function handler (req, res) {
  var url = parse(req.url);
  var localPathname = (url.pathname === '/') ? 'index.html' : url.pathname;
  var path = __dirname + localPathname;
  
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