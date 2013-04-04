require.config({
    paths: {
        'jquery': 'libs/jquery-1.8.3.min',
        'lodash': 'libs/lodash.min'
    }
});


require([
    'jquery',
    'util',
    'models',
    'views',
    'config'
], function(
    $,
    util,
    models,
    views,
    config
) {

    // Data

    var paletteList;
    var localPalette;
    var localBrush;
    var brushes;
    var currentBrush;

    // DOM stuff

    var theStatus;
    var clearRestoreCanvas;
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
            clearRestoreElement =   $( pageSelector + ' .clear-restore-button')[0];
            canvasElement =         $( pageSelector + ' .canvas' )[0],
            colorPanelsElement =    $( pageSelector + ' .color-panels' )[0],
            colorsTitleElement =    $( pageSelector + ' .current-palette-title' )[0],
            palettesColumnElement = $( pageSelector + ' .palette-list' )[0],
            palettesTitleElement =  $( pageSelector + ' .successful-keywords' )[0];
            instructionsLink =      $( pageSelector + ' .instructions-link' )[0];
            instructionsElement =   $( pageSelector + ' .instructions' )[0];
            instructionsClose =     $( pageSelector + ' .close' )[0];

        // Initialize status reporting.
        theStatus = new views.TheStatus( statusReportElement );

        // Initialize canvas clearing and restoring button.
        clearRestoreCanvas = new views.ClearRestoreCanvas( clearRestoreElement );

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
            searchURL = 'http://www.colourlovers.com/api/palettes?keywords=search+' + encodedKeywords +
                        '&jsonCallback=loadPalettes'
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
        };
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

        $( pageSelector ).on('click', '.restore-canvas', function( event ) {
            socket.emit('requestRestore');
        });

        $( pageSelector + ' .brush-size' ).change( function() {
            localPalette.activeSize( this.value );
            localBrush.style = localPalette.activeStyle();
            socket.emit('registerBrushStyle', localBrush.style, function(id) {
                localBrush.id = id;
            });
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

            // If the brush info is different from what's
            // currently being used, (either because this user
            // is starting with a new brush themselves or because
            // the last 'dot' or 'seg' event to be processed
            // happened to be somebody else's, then pass the brush
            // into to the canvas as part of the dot object,
            // and then update the currentBrush.
            if (id !== currentBrush.id) {
                dot.brushStyle = brush.style;
                currentBrush = brush;
            }
            canvas.startStroke( dot );
            brush.x = dot.x;
            brush.y = dot.y;
        }
        var strokeSegment = function( segment ) {
            var id = segment.id;
            var brush = brushes[id];

            // Similar to last one.
            if (id !== currentBrush.id) {
                segment.brushStyle = brush.style;
                currentBrush = brush;
            }

            // Pass along the last coordinates of this brush.
            // We draw in tiny pieces, starting a new segment each
            // time, because that's better than re-stroking the path
            // with every little move.
            segment.ix = brush.x;
            segment.iy = brush.y;

            canvas.stroke( segment );
            brush.x = segment.fx;
            brush.y = segment.fy;
        }
        var drawHistory = function( history ) {
            var i, len;
            var el;

            // This next loop checks for the existence of el.fx (a final x-coordinate)
            // to find out if we should stroke a path or just make a dot.

            for (i = 0, len = history.length; i < len; i++) {
                el = history[i];
                if (el.fx == null) {
                    drawDot(el);
                } else {
                    strokeSegment(el);
                }
            }
        };

        socket = io.connect();

        socket.on('dot', drawDot);
        socket.on('seg', strokeSegment);

        socket.on('restoreHistory', function( history ) {
            clearRestoreCanvas.showClear();
            drawHistory( history );
            clearConfirmPending = false;
        });
        socket.on('newBrushStyle', function( brushStyle ) {
            var brush = brushes[brushStyle.id] = {};
            brush.style = {};
            brush.style.color = brushStyle.color;
            brush.style.width = brushStyle.width;
            brush.id = brushStyle.id;
            // x and y coordinates will be added to
            // brushes[brushStyle.id] when it's first used
        });

        // Clear canvas and show the 'Restore canvas' undo button.
        socket.on('tempClear', function() {
            clearRestoreCanvas.showRestore();
            canvas.clear();
            clearConfirmPending = true;
        });

        // Swap out the 'Restore canvas' button for the 'Clear canvas' button.
        socket.on('finalClear', function() {
            clearRestoreCanvas.showClear();
            clearConfirmPending = false;
        });

        // Init
        socket.emit('init', function(response) {
            clearConfirmPending = response.clearConfirmPending;
            var history = response.history;
            var brushStyles = response.brushStyles;

            for (var id in brushStyles) {
                brushes[id] = {};
                brushes[id].style = brushStyles[id];
            }
            // Don't draw the history if we're in "clear canvas" confirmation
            // pending mode. (Actually, the history will not have been sent anyway.)
            if (!clearConfirmPending) {
                drawHistory( history );
                clearRestoreCanvas.showClear();
            }
            // Register the first brush.
            socket.emit('registerBrushStyle', localBrush.style, function(id) {
                localBrush.id = id;
            });
        });
    }

    // ------------- DRAWING FUNCTIONS, FOLLOWED BY EVENT LISTENERS FOR THEM. -----------

    var startDraw = function( event ) {
        var p = canvas.getPos( event );
        var x = p.x;
        var y = p.y;

        // Draw the first draft before sending info to the server.
        if (currentBrush !== localBrush) {
            canvas.startStroke({ x: x, y: y, brushStyle: localBrush.style });
        } else {
            canvas.startStroke({ x: x, y: y });
        }

        // Drawing (by any user) is what confirms the
        // clear canvas command.
        if (clearConfirmPending) {
            socket.emit('startOver', {x: x, y: y, id: localBrush.id} );
        } else {
            socket.emit('start', {x: x, y: y, id: localBrush.id} );
        }
        localBrush.x = x;
        localBrush.y = y;
        localBrush.drawing = true;
    }


    var continueDraw = function( event ) {
        var p = canvas.getPos( event );
        var fx = p.x;
        var fy = p.y;

        // Draw the first draft before sending info to the server.
        var ix = localBrush.x;
        var iy = localBrush.y;
        if (currentBrush !== localBrush) {
            canvas.stroke({ ix: ix, iy: iy, fx: fx, fy: fy, brushStyle: localBrush.style });
        } else {
            canvas.stroke({ ix: ix, iy: iy, fx: fx, fy: fy });
        }

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
            // someone just clicked the clear or restore button.
            if (event.which === LEFT_BUTTON && !$(event.target).hasClass('clear-restore-button')) {
                if (event.altKey) {
                    toggleDraw( event );
                } else {
                    startDraw( event );
                }
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
    }

    // Now set up the controllers for the color panels and the palettes column,
    // which are quite similar so we're going to re-use the code.

    var ElementsController = function() {};

    // highlightElement operates on either an element and its siblings,
    // or descendants of the top-level element and all the corresponding
    // descendants of the siblings of the top-level element.

    ElementsController.prototype.highlightElement = function( element, descendant ) {
        if (arguments.length === 1) {
            $( element ).addClass( 'selected' );
            $( element ).siblings().removeClass( 'selected' );
        } else {
            $( element ).find( descendant ).addClass( 'selected' );
            $( element ).siblings().find( descendant ).removeClass( 'selected' );
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


