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
    
    var init;
    
    // -- the event handler for requesting data from colourlovers.com
    
    requestFromColourloversAPI = function( view, model, instanceNumber ) {
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
                        '&jsonCallback=APP.controller.loadPalettes[' + instanceNumber + ']'
            colourLoversScript.setAttribute( 'src', searchURL);
        }
        return false;
    };
    
    // Remember: PropertyToParameter will create a hash (loadPalettes) whose values are functions
    // that, when called, take their own property names, add them to the front of the argument
    // list that was passed to them, and then call the anonymous function that was originally passed
    // to the constructor. The anonymous function is invoked with the new, extended argument list.
    
    loadPalettes = new util.PropertyToParameter( function( instanceNumber, data ) {
        var model = APP.models[instanceNumber];
        var view = APP.views[instanceNumber];
        
        if (model.paletteList.load( data )) {
            palettesColumnController.init( view, model );
            view.theStatus.report();   // no arguments means all clear, no errors to report.  
        } else {
            view.theStatus.report( 'No palettes matched the keyword or keywords "' + 
                                    model.paletteList.keywords + '." Try again.' );
        };
    });

    setErrorControls = function( view ) {
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
    
    setMiscellaneousUserControls = function( view, model, instanceNumber ) {
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
        });        

        $( pageSelector + ' .search-button' ).click( function() {
            requestFromColourloversAPI( view, model, instanceNumber );
        });
        $( pageSelector + ' .search-field' ).keydown( function( event ) {
            var code = event.which;
            if (code == 13) {
                event.preventDefault();
                requestFromColourloversAPI( view, model, instanceNumber );
            }
        });
    };

    setSocketIOEventListeners = function ( view ) {
        var canvas = view.canvas;
        socket = io.connect();
        socket.on('stroke', function( segment ) {
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
    }
    
    // ------------- DRAWING FUNCTIONS, FOLLOWED BY EVENT LISTENERS FOR THEM. -----------
    
    var startDraw = function( view, model, event ) {
        var canvas = view.canvas;
        var localBrush = model.localBrush;
        var p = canvas.getPos( event );
        var x = localBrush.x = p.x;
        var y = localBrush.y = p.y;
        localBrush.drawing = true; 
        socket.emit('move', $.extend({}, localBrush.style, {ix: x, iy: y} ));
    }
    
    var continueDraw = function( view, model, event ) {
        var canvas = view.canvas;
        var localBrush = model.localBrush;
        var p = canvas.getPos( event );
        var ix = localBrush.x;
        var iy = localBrush.y;
        var fx = p.x;
        var fy = p.y;
        socket.emit('move', $.extend({}, localBrush.style, {ix: ix, iy: iy, fx: fx, fy: fy} ));
        localBrush.x = fx;
        localBrush.y = fy;
    }
    
    var stopDraw = function( model ) {
        model.localBrush.drawing = false;
    }
    
    setMouseEventListeners = function( view, model ) {
        var canvas = view.canvas;
        var localBrush = model.localBrush;
        
        canvas.DOMElement.addEventListener('mousedown', function( event ) {
            startDraw( view, model, event );
        }, false);
        canvas.DOMElement.addEventListener('mousemove', function( event ) {
            if (localBrush.drawing) {
                continueDraw( view, model, event );
            }
        }, false);
        canvas.DOMElement.addEventListener('mouseup', function() {
            stopDraw( model );
        }, false);
    };
    
    var setTouchEventListeners = function( view, model ) {
        var canvas = view.canvas;
        var localBrush = model.localBrush;
        
        canvas.DOMElement.addEventListener('touchstart', function( event ) {
            // Don't want to disable pinch and zoom.
            // THIS WORKS IN ANDROID BUT NOT IN IPHONE, 
            // WHERE THE PINCH AND ZOOM IS INDEED DISABLED.
            if (event.touches.length === 1) {
                startDraw( view, model, event.touches[0] );
                event.preventDefault();
            } else {
                stopDraw( model );
            }
        }, false);
        canvas.DOMElement.addEventListener('touchmove', function( event ) {
            if (localBrush.drawing && event.touches.length === 1) {
                continueDraw( view, model, event.changedTouches[0] );
                event.preventDefault();
            }
        }, false);
        canvas.DOMElement.addEventListener('touchend', function( event ) {
            stopDraw( model );
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
    
    colorPanelsController.init = function( view, model ) {
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
            
            // Turn the selected one pink.
            colorPanelsController.highlightElement( element );
        });
    };

    palettesColumnController = new ElementsController();
    
    palettesColumnController.init = function( view, model ) {
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
            
            // Turn the selected one pink.
            palettesColumnController.highlightElement( element, ".palette-image" );
        });        
    };
    
    // -------------------- CONTROLLER INIT --------------------------

    init = function() {

        var models = APP.models = [];
        var views = APP.views = [];
        var model, view;
        
        var i, len;
        var configArray = APP.config;
        var config;
        var pageSelector;
        var pageVariables = [];
        
        // Create the main html blocks. 
        for (i = 0, len = configArray.length; i < len; i++) {
            pageVariables.push({
                instanceNum: i,
                title: configArray[i].APP_TITLE
            });
        }
        $( '#pageTemplate' ).tmpl( pageVariables ).appendTo( 'body' );
        
        // Create the models and views.
        for (i = 0, len = configArray.length; i < len; i++) {
            
            config = configArray[i];
            model = new APP.Model( config );
            models.push( model );
            view = new APP.View( config, i );
            views.push( view );
            
            setMiscellaneousUserControls( view, model, i );
            setErrorControls( view );
            if (util.isTouchSupported()) {
                setTouchEventListeners( view, model );
            } else {
                setMouseEventListeners( view, model );
            }
                        
            // Attention: this is just a temporary thing now. We need to rethink
            // whether we want to support multiple views on the same page.
            // currently this will erase the previous event listeners every time we iterate
            // through this loop, if there is more than one view on the page.
            setSocketIOEventListeners( view );
            socket.emit('requestInitHistory');
                        
            colorPanelsController.init( view, model );
            loadPalettes.add( i );
        }
        $( 'body' ).css('display', 'block');
    };
    
    //----------- module interface -----------------
    
    return {
        
        // We need init right now.
        // We might need the rest of this stuff in a later version of this app.

        requestFromColourloversAPI: requestFromColourloversAPI,
        loadPalettes: loadPalettes,

        setMiscellaneousUserControls: setMiscellaneousUserControls,
        setErrorControls: setErrorControls,
        setMouseEventListeners: setMouseEventListeners,

        colorPanelsController: colorPanelsController,
        palettesColumnController: palettesColumnController,

        init: init
    };
})();

$( function () {
    APP.controller.init();
});

