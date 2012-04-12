// Dependencies: util.js, model.js, view.js, config.js

;

var APP = (typeof APP !== 'undefined') ? APP : {};
APP.controller = (typeof APP.controller !== 'undefined') ? APP.controller : 

(function() {
    
    var util = APP.util;

    var requestFromColourloversAPI;
    var loadPalettes;
    
    var setMiscellaneousUserControls;
    var setErrorControls;
    var setMouseEventListeners;
    var setBrushEventListers;
    
    var ElementsController;
    var colorPanelsController;
    var palettesColumnController;
    
    var socket;
    
    var view
      , model
      , init;
    
    // -- the event handler for requesting data from colourlovers.com
    
    requestFromColourloversAPI = function() {
        var encodedKeywords;
        var colourLoversScript;
        var searchURL;
        
        var pageSelector = '#' + view.pageId;
        var searchField = $( pageSelector + ' .search-field' );
        var keywords = searchField.val();

        // if the user typed anything
        if (keywords) {
            model.paletteList.keywords = keywords;
            searchField.val( '' );
                        
            view.theStatus.report( "Loading..." );

            // First overwrite any previous script tags with the class 'colourLoversUrl',
            // than create the new one that makes the next http request to colourlovers.com.
      
            if ( $( pageSelector + ' .colourLoversUrl' ).length > 0 ) {
                $( pageSelector + ' .colourLoversUrl' ).remove();
            }
            colourLoversScript = document.createElement( 'script' );
        	$( colourLoversScript ).addClass( 'colourLoversUrl' );
            document.getElementById( view.pageId ).appendChild( colourLoversScript );
      
            // Change spaces to plus signs for insertion into search query.
            // This query string tells colourlovers.com to pass back the data wrapped
            // in our callback function, APP.controller.loadPalettes
        
            encodedKeywords = keywords.replace( /\s+/g, '+' );
            searchURL = 'http://www.colourlovers.com/api/palettes?keywords=search+' + encodedKeywords + 
                        '&jsonCallback=APP.controller.loadPalettes'
            colourLoversScript.setAttribute( 'src', searchURL);
        }
        return false;
    };
    
    // Remember: PropertyToParameter will create a hash (loadPalettes) whose values are functions
    // that, when called, take their own property names, add them to the front of the argument
    // list that was passed to them, and then call the anonymous function that was originally passed
    // to the constructor. The anonymous function is invoked with the new, extended argument list.
    
    loadPalettes = function( data ) {
        if (model.paletteList.load( data )) {
            palettesColumnController.init();
            view.theStatus.report();   // no arguments means all clear, no errors to report.  
        } else {
            view.theStatus.report( 'No palettes matched the keyword or keywords "' + 
                                    model.paletteList.keywords + '." Try again.' );
        };
    };

    setErrorControls = function() {
        // Set up error handlers for all current and future cases of 
        // the manual script tag that downloads the data from colourlovers
        // (using jQuery .delegate()).
        
        var keywords;
        var pageSelector = '#' + view.pageId;
        $( pageSelector ).delegate(' .colourLoversUrl', 'error', function () {

            // extract the search string from the colourlovers.com request url.
            keywords = $( this ).attr( 'src' ).replace( /(.*?keywords=search\+)(.*?)(&.*)/, '$2' );
            
            // unescape (changes plusses to spaces)
            keywords = keywords.replace( /\+/g, ' ' );
            
            view.theStatus.report( 'Unable to load palettes for the keyword(s) "' + keywords + '." ' +
                                   'Probably a problem with either the colourlovers.com website or your internet connection.' );
        });
    };
    
    setMiscellaneousUserControls = function() {
        var pageSelector = '#' + view.pageId;
        var code;
        
        // Set active brush size HTML select element, 
        // because Firefox preserves state even when it's refreshed.
        $( pageSelector + ' .brush-size' ).val( model.localPalette.activeSize() );  

        // bind the event handlers for toggling the brush size and 
        // entering search keywords. Also for toggling the clear and
        // restore canvas buttons, which are dynamically swapped out
        // for each other.

        $( pageSelector ).on('click', '.clear-canvas', function() {
            socket.emit('requestClear');
        });
        
        $( pageSelector ).on('click', '.restore-canvas', function() {
            socket.emit('requestRestore');
        });
        
        $( pageSelector + ' .brush-size' ).change( function() {
            model.localPalette.activeSize( this.value );
            model.localBrush.style = model.localPalette.activeStyle();
            socket.emit('registerBrush', model.localBrush.style);
        });        

        $( pageSelector + ' .search-button' ).click( function() {
            requestFromColourloversAPI( view, model, instanceNumber );
        });
        $( pageSelector + ' .search-field' ).keydown( function( event ) {
            var code = event.which;
            if (code == 13) {
                event.preventDefault();
                requestFromColourloversAPI();
            }
        });
    };

    setSocketIO = function () {
        var canvas = view.canvas;
        socket = io.connect();
        socket.on('dot', function( dot ) {
            canvas.startStroke( dot );
        });
        socket.on('seg', function( segment ) {
            canvas.stroke( segment );
        });
        socket.on('drawHistory', function( history ) {
            view.clearRestoreCanvas.showClear();
            canvas.drawHistory( history );
        });
        
        // Clear canvas and show the 'Restore canvas' undo button.
        socket.on('tempClear', function() {
            view.clearRestoreCanvas.showRestore();
            canvas.clear();
        });
        
        // Swap out the 'Restore canvas' button for the 'Clear canvas' button.
        socket.on('finalClear', function() {
            view.clearRestoreCanvas.showClear();
        });
        
        // Init
        socket.emit('registerBrush', model.localBrush.style);
        socket.emit('requestInitHistory');
    }
    
    // ------------- DRAWING FUNCTIONS, FOLLOWED BY EVENT LISTENERS FOR THEM. -----------
    
    var startDraw = function( event ) {
        var canvas = view.canvas;
        var localBrush = model.localBrush;
        var p = canvas.getPos( event );
        var x = p.x;
        var y = p.y;
        socket.emit('start', {x: x, y: y} );
        localBrush.x = x;
        localBrush.y = y;
        localBrush.drawing = true; 
    }
    
    var continueDraw = function( event ) {
        var canvas = view.canvas;
        var localBrush = model.localBrush;
        var p = canvas.getPos( event );
        var fx = p.x;
        var fy = p.y;
        socket.emit('move', {fx: fx, fy: fy} );
        localBrush.x = fx;
        localBrush.y = fy;
    }
    
    var stopDraw = function() {
        model.localBrush.drawing = false;
    }
    
    setMouseEventListeners = function() {
        var canvas = view.canvas;
        var localBrush = model.localBrush;
        
        canvas.DOMElement.addEventListener('mousedown', function( event ) {
            startDraw( event );
        }, false);
        canvas.DOMElement.addEventListener('mousemove', function( event ) {
            if (localBrush.drawing) {
                continueDraw( event );
            }
        }, false);
        canvas.DOMElement.addEventListener('mouseup', function() {
            stopDraw();
        }, false);
    };
    
    var setTouchEventListeners = function() {
        var canvas = view.canvas;
        var localBrush = model.localBrush;
        
        canvas.DOMElement.addEventListener('touchstart', function( event ) {
            
            // Don't want to disable pinch and zoom.
            if (event.touches.length === 1) {
                startDraw( event.touches[0] );
                event.preventDefault();
            } else {
                stopDraw();
            }
        }, false);
        canvas.DOMElement.addEventListener('touchmove', function( event ) {
            if (localBrush.drawing && event.touches.length === 1) {
                continueDraw( event.changedTouches[0] );
                event.preventDefault();
            }
        }, false);
        canvas.DOMElement.addEventListener('touchend', function( event ) {
            stopDraw();
        }, false);
    }
        
    // Now set up the controllers for the color panels and the palettes column,
    // which are quite similar so we're going to re-use the code.

    ElementsController = function() {};
    
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
    
    colorPanelsController = new ElementsController();
    
    colorPanelsController.init = function() {
        var panel;
        var pageSelector = '#' + view.pageId;
        
        // Populate the color panels.
        view.colorPanels.populate( model.localPalette.title, model.localPalette.colors ); 
        
        // Reset the localPalette's activeColorPanelIdx if it was set to a panel that no longer
        // exists (because a new palette has fewer colors than the old one)
        if (!model.localPalette.activeStyle()) {
            model.localPalette.activeColorPanelIdx( 0 );
        }
        
        // Now make the already selected one pink.
        panel = $( pageSelector + ' .' + view.colorPanels.getDOMElmntClass( model.localPalette.activeColorPanelIdx()) );
        this.highlightElement( panel );

        // Add the event listeners.
        this.addEventListeners( view.colorPanels, function( element, i ) {
            
            // Update localPalette and localBrush.
            model.localPalette.activeColorPanelIdx( i );
            model.localBrush.style = model.localPalette.activeStyle();
            
            // Tell the server about it.
            socket.emit('registerBrush', model.localBrush.style);
            
            // Turn the selected one pink.
            colorPanelsController.highlightElement( element );
        });
    };

    palettesColumnController = new ElementsController();
    
    palettesColumnController.init = function() {
        var pageSelector = '#' + view.pageId;
                
        // Populate the palettes column.
        view.palettesColumn.populate( model.paletteList );
        
        // Adjust its height based on the height of the canvas.
        // TODO: Find a way to have this not happen, using CSS.
        // For one thing, we're 'illegally' using the private property view.canvas._height
        $( view.palettesColumn.DOMContainer ).parent().css( 'height', '' + (305 + view.canvas._height) );
        
        // Widen the left column.
        $( view.palettesColumn.DOMContainer ).parent().css( {'width': '220px', 'margin-left': '15px'} );
        
        
        // Slide the main box over.
        $( pageSelector + ' .main-box-wrapper' ).css ( 'margin-left', 240 );
        
        // Add the event handlers.
        this.addEventListeners( view.palettesColumn, function( element, i ) {
            
            // Load the localPalette with the new colors.
            var title = model.paletteList.data[i].title;
            var colors = model.paletteList.data[i].colors;
            model.localPalette.load( title, colors );
            colorPanelsController.init( view, model );
            model.localBrush.style = model.localPalette.activeStyle();
            
            // Tell the server about it.
            socket.emit('registerBrush', model.localBrush.style);
            
            // Turn the selected one pink.
            palettesColumnController.highlightElement( element, ".palette-image" );
        });        
    };
    
    // -------------------- CONTROLLER INIT --------------------------

    init = function() {
        
        var i, len;
        var config = APP.config;
        var pageId = '#mainPage';
        var pageSelector = $('#mainPage');
        
        // Create the model and view.
        model = new APP.Model( config );
        view = new APP.View( config );
        
        // EXPOSE FOR DEBUGGING
        APP.model = model;
        APP.view = view;
        
        // Set the controls.
        setMiscellaneousUserControls();
        setErrorControls();
        if (util.isTouchSupported()) {
            setTouchEventListeners();
        } else {
            setMouseEventListeners();
        }
        setSocketIO();
        colorPanelsController.init();

        if (!$('html').hasClass('ie')) {
            pageSelector.css('display', 'block');
        }
        
    };
    
    //----------- module interface -----------------
    
    return { init: init };
})();

$( function () {
    APP.controller.init();
});

