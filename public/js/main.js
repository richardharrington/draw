var config = {
    PAGE_ID: 'mainPage',
    DEFAULT_PALETTE_COLORS: ['B04141', '85224A', 'EBE3B2', '1A4F6B', '042B4F'],
    MAX_COLORS: 10,
    DEFAULT_PALETTE_TITLE: "default palette",
    DEFAULT_COLOR_PANEL_INDEX: 0,
    LARGE_BRUSH_WIDTH: 25,
    SMALL_BRUSH_WIDTH: 10,
    DEFAULT_BRUSH_SIZE: "large",
    CANVAS_WIDTH: 900,
    CANVAS_HEIGHT: 500,
    CANVAS_BACKGROUND_COLOR: "EEE"
};

var util = {
    parseSQLDate: function(str) {
        // Split timestamp into [ Y, M, D, h, m, s ]
        var t = str.split(/[- :]/);

        // Apply each element to the Date function
        var date = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);

        return date;
    },

    // Are we on a touch-screen device?
    isTouchSupported: function() {
        var el = document.createElement('div');
        var eventName = 'ontouchstart';
        var isSupported = (eventName in el);
        if (!isSupported) {
            el.setAttribute(eventName, 'return;');
            isSupported = typeof el[eventName] === 'function';
        }
        el = null;
        return isSupported;
    }
};


//////// MODELS //////////

// --- Set up the Palette constructor.

function Palette( args ) {
    this._maxColors = args.maxColors;
    this._smallBrushWidth = args.smallBrushWidth;
    this._largeBrushWidth = args.largeBrushWidth;

    this.load( args.title, args.colors );
    this.activeSize( args.activeSize );
    this.activeColorPanelIdx( args.activeColorPanelIdx );
}

Palette.prototype = {

    // Load in a new set of colors with their title.

    load: function( title, colors ) {

        // We can only fit this.maxColors number of panels,
        // so truncate the array if necessary.
        this.colors = colors.slice( 0, this._maxColors );
        this.title = title;

        // brushStyles alternate between small brushes and large brushes,
        // so create an array with twice as many elements as the colors array.

        this._brushStyles = _.flatten(_.map(colors, function(color) {
            return [
                { color: color, width: this._smallBrushWidth },
                { color: color, width: this._largeBrushWidth }
            ];
        }, this));
    },

    // styleIdx is a number that has two values
    // for every one that colorPanelIdx has,
    // because styleIdx takes into account
    // whether a brush is small or large.

    // activeSize and activeColorPanelIdx are overloaded as both
    // getters and setters, depending on the number of arguments.

    // activeStyle is just a getter.

    activeStyle: function( size, colorPanelIdx ) {
        return this._brushStyles[ this._styleIdx ];
    },

    activeSize: function( size /* optional */) {
        var styleIdx = this._styleIdx || 0;
        var oldSize = (styleIdx % 2) ? "large" : "small";

        // get
        if (arguments.length === 0) {
            return oldSize;

        // set
        } else {
            styleIdx += (oldSize === size) ? 0 :
                        (size === "small") ? -1 : 1;
            this._styleIdx = styleIdx;
        }
    },

    activeColorPanelIdx: function( colorPanelIdx /* optional */) {
        var styleIdx = this._styleIdx || 0;
        var oldColorPanelIdx = Math.floor( styleIdx / 2 );

        // get
        if (arguments.length === 0) {
            return oldColorPanelIdx;

        // set
        } else {
            styleIdx += (colorPanelIdx - oldColorPanelIdx) * 2;
            this._styleIdx = styleIdx;
        }
    }
};

// --- Set up a brush.

function Brush( brushStyle ) {
    this.drawing = false;
    this.style = brushStyle;
    // also will set this.x and this.y, dynamically
}

// PaletteList objects are the objects into which we'll be adding the data from
// colourlovers.com. (There's only one instance created by the PaletteList constructor
// in the current version of the app.)

// The PaletteList constructor prototype contains a method to load the data.
// Each paletteList object contains a string with the search keywords and
// an array with the returned data.

// After we add properties on the fly it will look like this:

// paletteList = {
//   keywords: 'summer apple tree',
//   data: [
//     { imageUrl: 'http://myimage.jpg',
//       title: 'my palette',
//       userName: 'richard',
//       dateCreated: 'July 4, 1545',
//       description: 'this is my palette',
//       colors: ['B04141', '85224A', 'EBE3B2', '1A4F6B', '042B4F']
//     },
//     { imageUrl: 'http://myotherimage.jpg',
//       title: 'my other palette',
//       userName: 'harrington',
//       dateCreated: 'July 9, 1970',
//       description: 'this is my otherpalette',
//       colors: ['B04141', '85224A', 'EBE3B2', '1A4F6B', '042B4F']
//     },
//   ]
// }

var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];

function PaletteList() {}

PaletteList.prototype = {

    // This function loads data from the colourlovers website
    // into the paletteList object.

    load: function( data ) {
        if (!data || data.length === 0) {
            return false;
        }

        this.data = _.map(data, function(entry) {
            var newPalette = _.pick(entry,
                "colors",
                "imageUrl",
                "title",
                "userName",
                "description",
                "dateCreated"
            );

            // Now make "dateCreated" a more readable string.

            var date = util.parseSQLDate( newPalette.dateCreated );
            newPalette.dateCreated = MONTHS[date.getMonth()] + " " +
                                     date.getDate() + ", " +
                                     date.getFullYear();


            // Many of the descriptions on colourlovers.com
            // are long garbage strings of html, so exclude those
            // by checking if the string is too long.

            if (newPalette.description.length > 200) {
                newPalette.description = "";
            }

            return newPalette;
        });

        return true;
    }
};

// -- MODULE INTERFACE -- //

var models = {
    Palette:     Palette,
    Brush:       Brush,
    PaletteList: PaletteList
};


//////////// VIEWS ////////////

// ------------------ Status reporting mechanism. --------------------------

// (would be called just "Status," but one of the browsers
// doesn't like that. I forget which one.)

function TheStatus( element ) {
    this._jQElement = $( element );
}

TheStatus.prototype.report = function( str ) {

    // If we've got something to report
    if (arguments.length) {
        this._jQElement.text( str );

    // No news is good news.
    } else {
        this._jQElement.html( '&nbsp;' );
    }
};

function PopupBox( linkEl, displayEl, closeEl ) {
    this._jQLink = $(linkEl);
    this._jQDisplay = $(displayEl);
    this._jQClose = $(closeEl);
}

PopupBox.prototype.init = function() {
    var self = this;
    var box = this._jQDisplay;
    this._jQLink.on('click', function( event ) {
        self._jQDisplay.css("display", "block");
        setTimeout(function() {
            self._jQDisplay.css("opacity", "1");
        }, 50);
    });
    this._jQClose.on('click', function() {
        self._jQDisplay.css("opacity", "0");
        setTimeout(function() {
            self._jQDisplay.css("display", "none");
        }, 550);
    });
};


// --------------------- Wrapper for DOM Canvas ----------------------------

function Canvas( DOMElement, width, height, backgroundColor ) {
    var borderLeftPx = (window.getComputedStyle) ?
                        window.getComputedStyle( DOMElement, null )['border-left-width'] :
                        DOMElement.currentStyle.border; // TODO: check in IE6, IE7, IE8

    this.DOMElement = DOMElement;
    this._context = DOMElement.getContext( "2d" );

    // Stored as we go along so we don't have to constantly
    // change brush styles
    this._brushStyle = null;

    // Possibly make these configurable in the future.
    this._context.lineCap = 'round';
    this._context.lineJoin = 'round';

    this._width = width;
    this._height = height;
    this._backgroundColor = backgroundColor;
    this._history = [];

    // We may make lineCap & lineJoin configurable at some
    // point in the future, but not now.
    this._context.lineCap = 'round';
    this._context.lineJoin = 'round';

    this._border = (borderLeftPx) ? parseInt(borderLeftPx, 10) : 16;

    $( DOMElement ).attr( 'width', width );
    $( DOMElement ).attr( 'height', height );

    this.clear();
}

Canvas.prototype = {
    getPos: function( event ) {
        event = event || window.event; // This is for IE's global window.event

        var r = this.DOMElement.getBoundingClientRect();
        var coords = {
          // No attempt to cater to IE here (I've heard they don't support
          // pageX/YOffset). We'll try to do that later.
          // But actually this seems to work in IE9.

          x : parseInt(event.pageX - (r.left + window.pageXOffset) - this._border, 10),
          y : parseInt(event.pageY - (r.top + window.pageYOffset) - this._border, 10)
        };
        return coords;
    },

    _applyStyle: function( style ) {
        var c = this._context;

        c.lineWidth = style.width;
        c.strokeStyle = "#" + style.color;

        // Don't know why I have to do this here with
        // these parameters that are already set, but
        // if I figure it out I can tell paper.js how to
        // similarly fix their stuff.
        c.lineCap = 'round';
        c.lineJoin = 'round';
    },

    startStroke: function( dot ) {
        var c = this._context,
            r,
            x = dot.x,
            y = dot.y;

        if (this._brushStyle !== dot.brushStyle) {
            this._applyStyle( dot.brushStyle );
            this._brushStyle = dot.brushStyle;
        }

        // Draw a dot.
        r = c.lineWidth / 2;
        c.fillStyle = c.strokeStyle;
        c.beginPath();
        c.arc( x, y, r, 0, Math.PI * 2 );
        c.fill();
    },

    stroke: function( seg ) {
        var c = this._context;
        var r;

        var ix = seg.ix,
            iy = seg.iy,
            fx = seg.fx,
            fy = seg.fy;

        if (this._brushStyle !== seg.brushStyle) {
            this._applyStyle( seg.brushStyle );
            this._brushStyle = seg.brushStyle;
        }

        // Make it so, Number One.
        c.beginPath();
        c.moveTo( ix, iy );
        c.lineTo( fx, fy );
        c.stroke();
    },

    clear: function() {
        var c = this._context;

        c.fillStyle = "#" + this._backgroundColor;
        c.fillRect( 0, 0, this._width, this._height );
    }
};

// -------------------- wrapper for DOM color panels --------------------------

function ColorPanels( DOMContainer, DOMTitleSpan, title, colors ) {
    this.DOMContainer = DOMContainer;
    this.DOMTitleSpan = DOMTitleSpan;
    this.template = _.template($('#colorPanelsTemplate').html());

    this.populate( title, colors );
}

ColorPanels.prototype = {
    getDOMElmntClass: function( colorPanelIdx ) {
        return 'color-' + colorPanelIdx;
    },

    populate:function( title, colors ) {
        var i, len;
        var newLength, oldLength;
        var newColorPanels;
        var DOMElmntClassObjects = [];
        var newDOMElmntClassObjects;

        var jQContainer = $( this.DOMContainer );
        var jQTitleSpan = $( this.DOMTitleSpan );

        // Make the array of new DOM classes.
        for (i = 0, len = colors.length; i < len; i++) {
            DOMElmntClassObjects.push( {klass: 'color-' + i} );
        }

        // Set the title for this palette of colors.
        jQTitleSpan.text( title );

        oldLength = jQContainer.children().length;
        newLength = DOMElmntClassObjects.length;

        // Take away some if needed.
        for (i = oldLength; i > newLength; i--) {
            jQContainer.children(':last-child').remove();
        }

        // Add some if needed. (Will automatically be transparent.)
        var template = this.template;
        newDOMElmntClassObjects = DOMElmntClassObjects.slice(oldLength, newLength);
        var html = _.map(newDOMElmntClassObjects, function(classObject) {
            return template(classObject);
        }).join('\n');
        jQContainer.append(html);

        // Now go through and set the new colors.
        jQContainer.children().each( function( i ) {
            this.style.backgroundColor = '#' + colors[i];
        });
    }
};


// -------------------- wrapper for DOM palettes column --------------------------

PalettesColumn = function( DOMContainer, DOMTitleSpan ) {
    this.DOMContainer = DOMContainer;
    this.DOMTitleSpan = DOMTitleSpan;
    this.template = _.template($('#paletteListTemplate').html());
};

PalettesColumn.prototype.populate = function( paletteList ) {

    // In the left column, show the heading with the keywords, and all the palettes below it,
    // along with their click handlers for loading colors into the drawing program.

    var jQContainer = $( this.DOMContainer );
    var jQTitleSpan = $( this.DOMTitleSpan );

    jQTitleSpan.text( paletteList.keywords );

    var template = this.template;
    var html = _.map(paletteList.data, function(palette) {
        return template(palette);
    }).join('\n');
    jQContainer.empty().append(html);

    // Show it.
    jQContainer.parent()[0].style.display = 'block';
};

// -- MODULE INTERFACE -- //

var views = {
    TheStatus: TheStatus,
    PopupBox: PopupBox,
    Canvas: Canvas,
    ColorPanels: ColorPanels,
    PalettesColumn: PalettesColumn
};


////////// MAIN CODE ////////////


require([], function() {

    // Data

    var paletteList;
    var localPalette;
    var localBrush;
    var brushes;
    var currentBrush;

    // DOM stuff

    var theStatus;
    var instructionBox;
    var canvas;
    var colorPanels;
    var palettesColumn;
    var pageId;

    var instantiateData = function(config) {

        // Initialize paletteList.
        paletteList = new models.PaletteList();

        // Initialize localPalette.
        localPalette = new models.Palette({
            title:               config.DEFAULT_PALETTE_TITLE,
            colors:              config.DEFAULT_PALETTE_COLORS,
            maxColors:           config.MAX_COLORS,
            smallBrushWidth:     config.SMALL_BRUSH_WIDTH,
            largeBrushWidth:     config.LARGE_BRUSH_WIDTH,
            activeSize:          config.DEFAULT_BRUSH_SIZE,
            activeColorPanelIdx: config.DEFAULT_COLOR_PANEL_INDEX
        });

        // Initialize localBrush.
        localBrush = new models.Brush(
            localPalette.activeStyle()
        );

        // Initialize the hash of brushes that will be used
        // by all the users on the canvas
        brushes = {};

        // Initialize currentBrush which is used to compare
        // to brushStyle ids that come down from the server.
        currentBrush = { id: 0 };

    };

    var instantiateDOMStuff = function(config) {

        pageId = config.PAGE_ID;
        var pageSelector = '#' + pageId;

        var statusReportElement =   $( pageSelector + ' .status-report' )[0],
            canvasElement =         $( pageSelector + ' .canvas' )[0],
            colorPanelsElement =    $( pageSelector + ' .color-panels' )[0],
            colorsTitleElement =    $( pageSelector + ' .current-palette-title' )[0],
            palettesColumnElement = $( pageSelector + ' .palette-list' )[0],
            palettesTitleElement =  $( pageSelector + ' .successful-keywords' )[0],
            instructionsLink =      $( pageSelector + ' .instructions-link' )[0],
            instructionsElement =   $( pageSelector + ' .instructions' )[0],
            instructionsClose =     $( pageSelector + ' .close' )[0];

        // Initialize status reporting.
        theStatus = new views.TheStatus( statusReportElement );

        // Initialize instruction box.
        instructionBox = new views.PopupBox( instructionsLink, instructionsElement, instructionsClose );

        // Initialize canvas.
        canvas = new views.Canvas( canvasElement, config.CANVAS_WIDTH, config.CANVAS_HEIGHT,
                                 config.CANVAS_BACKGROUND_COLOR );

        // Load the colors into the DOM.
        colorPanels = new views.ColorPanels ( colorPanelsElement, colorsTitleElement,
                                            config.DEFAULT_PALETTE_TITLE, config.DEFAULT_PALETTE_COLORS );

        // Initialize empty palettesColumn object.
        palettesColumn = new views.PalettesColumn( palettesColumnElement, palettesTitleElement );

    };

    // -- the event handler for requesting data from colourlovers.com

    var requestFromColourloversAPI = function() {
        var encodedKeywords;
        var colourLoversScript;
        var searchURL;

        var pageSelector = '#' + pageId;
        var searchField = $( pageSelector + ' .search-field' );
        var keywords = searchField.val();

        // if the user typed anything
        if (keywords) {
            paletteList.keywords = keywords;
            searchField.val( '' );

            theStatus.report( "Loading..." );

            // First overwrite any previous script tags with the class 'colourLoversUrl',
            // than create the new one that makes the next http request to colourlovers.com.

            if ( $( pageSelector + ' .colourLoversUrl' ).length > 0 ) {
                $( pageSelector + ' .colourLoversUrl' ).remove();
            }
            colourLoversScript = document.createElement( 'script' );
            $( colourLoversScript ).addClass( 'colourLoversUrl' );
            document.getElementById( pageId ).appendChild( colourLoversScript );

            // Change spaces to plus signs for insertion into search query.
            // This query string tells colourlovers.com to pass back the data wrapped
            // in our callback function, APP.controller.loadPalettes

            encodedKeywords = keywords.replace( /\s+/g, '+' );
            searchURL = 'http://www.colourlovers.com/api/palettes?keywords=search+' +
                         encodedKeywords +
                        '&jsonCallback=loadPalettes';
            colourLoversScript.setAttribute( 'src', searchURL);
        }
        return false;
    };

    var loadPalettes = function( data ) {
        if (paletteList.load( data )) {
            palettesColumnController.init();
            theStatus.report();   // no arguments means all clear, no errors to report.
        } else {
            theStatus.report( 'No palettes matched the keyword or keywords "' +
                                    paletteList.keywords + '." Try again.' );
        }
    };

    // Needs to be global to be exposed to JSONP.
    window.loadPalettes = loadPalettes;

    var setErrorControls = function() {
        // Set up error handlers for all current and future cases of
        // the manual script tag that downloads the data from colourlovers
        // (using jQuery .delegate()).

        var keywords;
        var pageSelector = '#' + pageId;
        $( pageSelector ).delegate(' .colourLoversUrl', 'error', function () {

            // extract the search string from the colourlovers.com request url.
            keywords = $( this ).attr( 'src' ).replace( /(.*?keywords=search\+)(.*?)(&.*)/, '$2' );

            // unescape (changes plusses to spaces)
            keywords = keywords.replace( /\+/g, ' ' );

            theStatus.report( 'Unable to load palettes for the keyword(s) "' + keywords + '." ' +
                                   'Probably a problem with either the colourlovers.com website or your internet connection.' );
        });
    };

    var setMiscellaneousUserControls = function() {
        var pageSelector = '#' + pageId;
        var code;

        // Set active brush size HTML select element,
        // because Firefox preserves state even when it's refreshed.
        $( pageSelector + ' .brush-size' ).val( localPalette.activeSize() );

        // bind the event handlers for toggling the brush size and
        // entering search keywords. Also for toggling the clear and
        // restore canvas buttons, which are dynamically swapped out
        // for each other. Also for the instruction link.

        instructionBox.init();

        $( pageSelector ).on('click', '.clear-canvas', function( event ) {
            socket.emit('requestClear');
        });

        $( pageSelector + ' .brush-size' ).change( function() {
            localPalette.activeSize( this.value );
            localBrush.style = localPalette.activeStyle();
            socket.emit('registerBrushStyle', localBrush.style, function(id) {
                localBrush.id = id;
            });
        });

        $( pageSelector + ' .brush-size' ).on('mousedown', function(event) {
            event.stopPropagation();
        });

        $( pageSelector + ' .search-button' ).click( function( event ) {
            requestFromColourloversAPI();
        });
        $( pageSelector + ' .search-field' ).keydown( function( event ) {
            var code = event.which;
            if (code == 13) {
                event.preventDefault();
                requestFromColourloversAPI();
            }
        });
    };

    var socket;
    var clearConfirmPending;

    var setSocketIO = function () {

        var drawDot = function( dot ) {
            var id = dot.id;
            var brush = brushes[id];

            // Pass the brush into to the canvas as part of the dot object,
            // and then update the currentBrush.
            dot.brushStyle = brush.style;
            currentBrush = brush;

            canvas.startStroke( dot );
            brush.x = dot.x;
            brush.y = dot.y;
        };
        var strokeSegment = function( segment ) {
            var id = segment.id;
            var brush = brushes[id];

            // Similar to last one.
            segment.brushStyle = brush.style;
            currentBrush = brush;

            // Pass along the last coordinates of this brush.
            // We draw in tiny pieces, starting a new segment each
            // time, because that's better than re-stroking the path
            // with every little move.
            segment.ix = brush.x;
            segment.iy = brush.y;

            canvas.stroke( segment );
            brush.x = segment.fx;
            brush.y = segment.fy;
        };

        var drawHistory = function( history ) {
            // Check for the existence of el.fx (a final x-coordinate)
            // to find out if we should stroke a path or just make a dot.

            history.forEach(function(historyItem) {
                var action = historyItem.hasOwnProperty("fx") ? strokeSegment : drawDot;
                action(historyItem);
            });
        };

        socket = io.connect();

        socket.on('dot', drawDot);
        socket.on('seg', strokeSegment);

        socket.on('newBrushStyle', function( brushStyle ) {
            var brush = brushes[brushStyle.id] = {};
            brush.style = {};
            brush.style.color = brushStyle.color;
            brush.style.width = brushStyle.width;
            brush.id = brushStyle.id;
            // x and y coordinates will be added to
            // brushes[brushStyle.id] when it's first used
        });

        // Clear canvas
        socket.on('clear', function() {
            canvas.clear();
        });

        // Init
        socket.emit('init', function(response) {
            var history = response.strokeHistory;
            var brushStyles = response.brushStyles;

            for (var id in brushStyles) {
                brushes[id] = {};
                brushes[id].style = brushStyles[id];
            }
            drawHistory( history );

            // Register the first brush.
            socket.emit('registerBrushStyle', localBrush.style, function(id) {
                localBrush.id = id;
            });
        });
    };

    // ------------- DRAWING FUNCTIONS, FOLLOWED BY EVENT LISTENERS FOR THEM. -----------

    var startDraw = function( event ) {
        var p = canvas.getPos( event );
        var x = p.x;
        var y = p.y;

        // Draw the first draft before sending info to the server.
        canvas.startStroke({ x: x, y: y, brushStyle: localBrush.style });

        socket.emit('start', {x: x, y: y, id: localBrush.id} );
        localBrush.x = x;
        localBrush.y = y;
        localBrush.drawing = true;
    };


    var continueDraw = function( event ) {
        var p = canvas.getPos( event );
        var fx = p.x;
        var fy = p.y;

        // Draw the first draft before sending info to the server.
        var ix = localBrush.x;
        var iy = localBrush.y;
        canvas.stroke({ ix: ix, iy: iy, fx: fx, fy: fy, brushStyle: localBrush.style });

        socket.emit('move', {fx: fx, fy: fy, id: localBrush.id} );
        localBrush.x = fx;
        localBrush.y = fy;
    }

    var stopDraw = function() {
        localBrush.drawing = false;
    }

    var toggleDraw = function( event ) {
        if (localBrush.drawing) {
            stopDraw();
        } else {
            startDraw( event );
        }
    }

    var setMouseEventListeners = function() {
        var LEFT_BUTTON = 1;
        var canvasEl = canvas.DOMElement;

        // Have to use document instead of the canvas element,
        // because it's the easiest way to deal with stuff entering
        // and exiting the canvas. We have to have access to the click and move
        // events just off the canvas anyway, when people are drawing really quickly.

        // Note: we cannot do this for touch events, because we don't want to
        // prevent the default behavior of scrolling around the screen, when the user
        // is outside the canvas. But this is not as much of an issue, because
        // the touch events weren't messing up the drawing like the mouse events were.

        $(document).on('mousedown', function( event ) {
            // Don't treat this as a drawing click if
            // someone just clicked the clear button.
            if (event.which === LEFT_BUTTON && !$(event.target).hasClass('clear-button')) {
                var action = event.altKey ? toggleDraw : startDraw;
                action( event );
            }
        });
         $(document).on('mousemove', function( event ) {
            if (localBrush.drawing) {
                continueDraw( event );
            }
        });
        $(document).on('mouseup', function( event ) {
            if (event.which === LEFT_BUTTON && !event.altKey) {
                stopDraw();
            }
        });
    };

    var setTouchEventListeners = function() {
        var canvasEl = canvas.DOMElement;

        canvasEl.addEventListener('touchstart', function( event ) {

            // Don't want to disable pinch and zoom.
            if (event.touches.length === 1) {
                startDraw( event.touches[0] );
                event.preventDefault();
            } else {
                stopDraw();
            }
        }, false);
        canvasEl.addEventListener('touchmove', function( event ) {
            if (localBrush.drawing && event.touches.length === 1) {
                continueDraw( event.changedTouches[0] );
                event.preventDefault();
            }
        }, false);
        canvasEl.addEventListener('touchend', function( event ) {
            stopDraw();
        }, false);
    };

    // Now set up the controllers for the color panels and the palettes column,
    // which are quite similar so we're going to re-use the code.

    var ElementsController = function() {};

    // highlightElement operates on either an element and its siblings,
    // or descendants of the top-level element and all the corresponding
    // descendants of the siblings of the top-level element.

    ElementsController.prototype.highlightElement = function( element, descendant ) {
        var el = $(element);
        if (arguments.length === 1) {
            el.addClass( 'selected' );
            el.siblings().removeClass( 'selected' );
        } else {
            el.find( descendant ).addClass( 'selected' );
            el.siblings().find( descendant ).removeClass( 'selected' );
        }
    };

    ElementsController.prototype.addEventListeners = function( wrapper, eventHandler ) {
        $( wrapper.DOMContainer ).children().each( function( i ) {
            $( this ).click( function() {
                eventHandler( this, i );
            });
        });
    };

    var colorPanelsController = new ElementsController();

    colorPanelsController.init = function() {
        var panel;
        var pageSelector = '#' + pageId;

        // Populate the color panels.
        colorPanels.populate( localPalette.title, localPalette.colors );

        // Reset the localPalette's activeColorPanelIdx if it was set to a panel that no longer
        // exists (because a new palette has fewer colors than the old one)
        if (!localPalette.activeStyle()) {
            localPalette.activeColorPanelIdx( 0 );
        }

        // Now make the already selected one pink.
        panel = $( pageSelector + ' .' + colorPanels.getDOMElmntClass( localPalette.activeColorPanelIdx()) );
        this.highlightElement( panel );

        // Add the event listeners.
        this.addEventListeners( colorPanels, function( element, i ) {

            // Update localPalette and localBrush.
            localPalette.activeColorPanelIdx( i );
            localBrush.style = localPalette.activeStyle();

            // Tell the server about it.
            socket.emit('registerBrushStyle', localBrush.style, function(id) {
                localBrush.id = id;
            });

            // Turn the selected one pink.
            colorPanelsController.highlightElement( element );
        });
    };

    var palettesColumnController = new ElementsController();

    palettesColumnController.init = function() {
        var pageSelector = '#' + pageId;

        // Populate the palettes column.
        palettesColumn.populate( paletteList );

        // Adjust its height based on the height of the canvas.
        // TODO: Find a way to have this not happen, using CSS.
        // For one thing, we're 'illegally' using the private property canvas._height
        $( palettesColumn.DOMContainer ).parent().css( 'height', '' + (305 + canvas._height) );

        // Widen the left column.
        $( palettesColumn.DOMContainer ).parent().css( {'width': '220px', 'margin-left': '15px'} );


        // Slide the main box over.
        $( pageSelector + ' .main-box-wrapper' ).css ( 'margin-left', 240 );

        // Add the event handlers.
        this.addEventListeners( palettesColumn, function( element, i ) {

            // Load the localPalette with the new colors.
            var title = paletteList.data[i].title;
            var colors = paletteList.data[i].colors;
            localPalette.load( title, colors );
            colorPanelsController.init();
            localBrush.style = localPalette.activeStyle();

            // Tell the server about it.
            socket.emit('registerBrushStyle', localBrush.style, function(id) {
                localBrush.id = id;
            });

            // Turn the selected one pink.
            palettesColumnController.highlightElement( element, ".palette-image" );
        });
    };

    // -------------------- APP INIT --------------------------

    var initialize = function() {

        // Set the controls.
        instantiateData( config );
        instantiateDOMStuff( config );
        colorPanelsController.init();
        setMiscellaneousUserControls();
        setErrorControls();

        if (util.isTouchSupported()) {
            setTouchEventListeners();
        } else {
            setMouseEventListeners();
        }

        setSocketIO();
    };

    // Make it so.
    $(initialize);

});


