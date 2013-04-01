var app = require('http').createServer(handler).listen(3000),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    parse = require('url').parse,
    mime = require('mime'),
    history = [],
    brushStyles = {},
    brushStyleIdGen = 0,
    clearConfirmPending = false;



io.configure('production', function(){
    io.enable('browser client minification');  // send minified client
    io.enable('browser client etag');          // apply etag caching logic based on version number
    io.enable('browser client gzip');          // gzip the file
    io.set('log level', 1);                    // reduce logging
    io.set('transports', [                     // enable all transports (optional if you want flashsocket)
        'websocket',
  //    'flashsocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling'
    ]);
});

io.configure('development', function(){
    io.set('transports', ['websocket']);
});



io.sockets.on('connection', function(socket) {

    // Get a new browser up to date.
    socket.on('init', function(init) {

        // Send the brushes, and long as someone hasn't just cleared the canvas
        // in preparation for clearing the history, send the full history too.
        var response = {
            brushStyles: brushStyles,
            clearConfirmPending: clearConfirmPending
        };
        if (!clearConfirmPending) {
            response.history = history;
        }
        init(response);
    });

    socket.on('requestClear', function() {
        io.sockets.emit('tempClear');
        clearConfirmPending = true;
    });
    socket.on('requestRestore', function() {
        io.sockets.emit('restoreHistory', history);
        clearConfirmPending = false;
    });
    socket.on('registerBrushStyle', function(brushStyle, returnNewId) {
        brushStyleIdGen++;
        var id = brushStyle.id = brushStyleIdGen;
        io.sockets.emit('newBrushStyle', brushStyle);
        brushStyles[id] = brushStyle;
        returnNewId(id);
    });

    socket.on('move', function(segment) {
        io.sockets.emit('seg', segment);
        history.push(segment);
    });

    socket.on('start', function(dot) {
        io.sockets.emit('dot', dot);
        history.push(dot);
    });

    socket.on('startOver', function(dot) {
        io.sockets.emit('finalClear');
        io.sockets.emit('dot', dot);
        history = [];
        history.push(dot);
        clearConfirmPending = false;
    });
});

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
            var type = mime.lookup(path);
            var charset = mime.charsets.lookup(type);
            res.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''));
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