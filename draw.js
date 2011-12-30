/*

TO DO:

1. set the view init so that it puts new templates into the WHOLE html page.

2. change everything from id to class. (PARTICULARLY THE VIEW INIT)

3. Change setMiscellaneousUserControls to set a bunch of DOM element variables at the beginning.

SUPPLEMENTAL (for next commit): 

1. deal with the generic error controller situation.

2. Move some stuff out of the view and into the model, like the color palette title,
   and the background color of the canvas. That stuff should be passed from the
   model to the view by the controller.

*/

;

var APP = (typeof APP !== 'undefined') ? APP : {};
APP.util = (typeof APP.util !== 'undefined') ? APP.util : {};
APP.config = (typeof APP.config !== 'undefined') ? APP.config : {};
APP.model = (typeof APP.model !== 'undefined') ? APP.model : {};
APP.view = (typeof APP.view !== 'undefined') ? APP.view : {};
APP.controller = (typeof APP.controller !== 'undefined') ? APP.controller : {};

APP.config = [{
    DEFAULT_PALETTE_COLORS: ['B04141', '85224A', 'EBE3B2', '1A4F6B', '042B4F'],
    MAX_COLORS: 10,
    DEFAULT_PALETTE_TITLE: "default page 1",
    DEFAULT_COLOR_PANEL_INDEX: 0,
    LARGE_BRUSH_WIDTH: 25,
    SMALL_BRUSH_WIDTH: 10,
    DEFAULT_BRUSH_SIZE: "large",
    CANVAS_WIDTH: 1000,
    CANVAS_HEIGHT: 1000,
    CANVAS_BACKGROUND_COLOR: "EEE"
}
];


/*

, {
    DEFAULT_PALETTE_COLORS: ['B04141', '85224A', 'EBE3B2', '1A4F6B', '042B4F'],
    MAX_COLORS: 10,
    DEFAULT_PALETTE_TITLE: "default page 2",
    DEFAULT_COLOR_PANEL_INDEX: 0,
    LARGE_BRUSH_WIDTH: 50,
    SMALL_BRUSH_WIDTH: 30,
    DEFAULT_BRUSH_SIZE: "large",
    CANVAS_WIDTH: 1500,
    CANVAS_HEIGHT: 1000,
    CANVAS_BACKGROUND_COLOR: "FFF"
}, {
    DEFAULT_PALETTE_COLORS: ['B04141', '85224A', 'EBE3B2', '1A4F6B', '042B4F'],
    MAX_COLORS: 10,
    DEFAULT_PALETTE_TITLE: "default page 3",
    DEFAULT_COLOR_PANEL_INDEX: 3,
    LARGE_BRUSH_WIDTH: 15,
    SMALL_BRUSH_WIDTH: 2,
    DEFAULT_BRUSH_SIZE: "small",
    CANVAS_WIDTH: 700,
    CANVAS_HEIGHT: 1000,
    CANVAS_BACKGROUND_COLOR: "DFF"
}];


*/

APP.util = (function() {
    
    var isArray,
        keyList;
        
    var PropertyToParameter;
    
    var copy,
        parseSQLDate,
        object,
        forEach;
        
    
    // PRIVATE METHODS
    
    isArray = function( obj ) {
        return Object.prototype.toString.call( obj ) === "[object Array]";
    };

    // keyList returns an array of all own property names in an object.

    keyList = function( obj ) {
        var k, obj;
        var list = [];
        for (k in obj) {
            if (obj.hasOwnProperty( k )) {
                list.push( k );
            }
        }
        return list;
    };

    // PUBLIC CONSTRUCTORS AND METHODS
    
    // Very basic iterator function, used only for debugging
    // so far.

    forEach = function( array, action ) {
        for (var i = 0, len = array.length; i < len; i++) {
            action( array[i], i );
        }
    };
    
    // PropertyToParameter takes a function (func) and creates
    // an object with a series of properties, all added by the 
    // method "add," each of which is a function that takes an arbitrary number of arguments,
    // adds its own property name to the beginning of the list of arguments that were passed to it,
    // and then calls the original function "func" with the new argument list.
    
    // This is a hack so that we can pass to a JSONP request the name of a callback
    // function such that the name of the function itself will tell
    // another function, when the AJAX request returns, which model
    // instance is supposed to be filled.
    
    PropertyToParameter = function( func ) {
        this.func = func;
    };
    
    PropertyToParameter.prototype.add = function( prop ) {
        this[prop] = (function( f ) {
            return function() {
                var args = Array.prototype.slice.call( arguments, 0 );
                args.unshift( prop );
                f.apply( null, args );
            };
        })(this.func);
    };
    
    // copyProps is like jQuery.extend, except that it lacks 
    // jQuery.extend's ability to copy from more than one object. 
    // Also, it has an ability that jQuery.extend doesn't have, 
    // which is to select a list of properties from the source object,
    // instead of automatically copying all of them.

    // The target argument is mandatory, just like in jQuery.extend.

    // The array in the arguments list contains the list of properties to be
    // copied from the source to the target. This array is only for selecting a subset
    // of the top-level primitives and object references in the source object.
    // If the copying is deep (the default), once the recursive calls begin, 
    // objects and arrays are copied with all of their properties, 
    // just as jQuery.extend would do. 

    // The last two arguments, deep and arrayOfProps, are optional and can
    // be in any order.

    copy = function copy( target, source /* optional args: arrayOfProps, deep */ ) {
        var key, value;
        var toStr = Object.prototype.toString;
        var i;
        var arrayOfProps = []; // optional argument 
        var deep;              // optional argument

        // Assign the optional arguments arrayOfProps and deep.

        deep = (typeof arguments[2] === "boolean") ? arguments[2] :
            (typeof arguments[3] === "boolean") ? arguments[3] : 
            true; // default is deep copy

        arrayOfProps = (isArray( arguments[2] )) ? arguments[2] :
            (isArray( arguments[3] )) ? arguments[3] :
            keyList( source ); // default is copy all of source's properties

        i = arrayOfProps.length;

        while (i) {
            i -= 1;
            key = arrayOfProps[i];
            if (deep && (typeof source[key] === "object")) {
                target[key] = (isArray( source[key] )) ? [] : {};
                copy( target[key], source[key] );
            } else {
                target[key] = source[key];
            }
        }
    };

    parseSQLDate = function( str ) {
        
        // Split timestamp into [ Y, M, D, h, m, s ]
        var t = str.split(/[- :]/);

        // Apply each element to the Date function
        var d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);

        return d;
    };

    // object is an object inheritor function. 

    object = function ( o, vals ) {
        function F() {};
        F.prototype = o;
        var instance = new F();            
        for (var p in vals) {
            instance[p] = vals[p];
        }
        return instance;
    };

    // ------------ Module interface ------------------------

    return {
        copy: copy,
        parseSQLDate: parseSQLDate,
        object: object,
        forEach: forEach,
        
        PropertyToParameter: PropertyToParameter
    };
})();


APP.model = (function() {
    
    var util = APP.util;

    var BrushStyle,
        brushChildrenProto;

    var Palettes,
        CurrentPalette,
        CurrentBrush;
        
    var init;
    
    var instances = [];
    var instanceNumber = 0;

    // --- A note about Palettes, CurrentPalette and CurrentBrush:

    // These constructors are designed to have only one instance each,
    // for each instance of this app. The properties of these objects
    // will be reset each time something changes.

    // If I get around to setting this up where there can be more than
    // one instance of the app on the same page (as an exercise),
    // then there will be multiple instances created from these constructors.
    

    // --- Now set up the BrushStyle constructor -----
    //

    BrushStyle = function( color, width ) {
        this.color = color;
        this.width = width;
    };
    
    // We always have the option of making lineCap and lineJoin instance
    // variables in the future.
    
    BrushStyle.prototype.lineCap = 'round';
    BrushStyle.prototype.lineJoin = 'round';

    BrushStyle.prototype.toString = function() {
      return "{" +
          "color: " + this.color + ", " +
          "width: " + this.width + ", " +
          "lineCap: " + this.lineCap + ", " +
          "lineJoin: " + this.lineJoin +    
      "}";
    }

    brushChildrenProto = new BrushStyle();
    
    // --- Set up the CurrentPalette constructor, whose instances',
    // --- own properties are all the Brushstyle children.

    CurrentPalette = function( title, colors, maxColors, smallBrushWidth, largeBrushWidth ) { 
        this.maxColors = maxColors;
        this.smallBrushWidth = smallBrushWidth;
        this.largeBrushWidth = largeBrushWidth;             
        this.init( title, colors );
    };

    // Load in a new palette of colors. 

    CurrentPalette.prototype.init = function( title, colors, maxColors, smallBrushWidth, largeBrushWidth ) {
        
        var i, len;
        var color;
        var small, large;
        
        this.brushStyles = [];

        // We can only fit this.maxColors number of panels,
        // so truncate the array if necessary. 

        colors = colors.slice( 0, this.maxColors );
    
        for (i = 0, len = colors.length; i < len; i++) {
            color = colors[i];
            small = util.object( brushChildrenProto, {
                color: color,
                width: this.smallBrushWidth
            });
            large = util.object( brushChildrenProto, {
       	        color: color,
       	        width: this.largeBrushWidth
       	    });

            this.brushStyles.push( small );
            this.brushStyles.push( large );
        }
        
        this.title = title;
        this.colors = colors;
    };


    // --- Set up the current brush.

    CurrentBrush = function( size, colorPanelIdx, currPalette ) {
        this.currentPalette = currPalette;
        this.styleIdx = (colorPanelIdx * 2) + (size === "large" ? 1 : 0);
    };

    // styleIdx is a number that has two values
    // for every one that colorPanelIdx has,
    // because styleIdx takes into account
    // whether a brush is small or large.

    // styleIdx is a property of each CurrentBrush
    // instance. size, colorPanelIdx and style are all 
    // derived from it when needed.

    // Perhaps styleIdx should be private, because it's never
    // meant to be read or written directly, but that seemed
    // like too much of a pain, because then I would have had
    // to create getter and setter methods for it just so the 
    // prototype methods could use it.
    

    // And now, a series of functions that are both getters and setters,
    // depending on the number of arguments.

    CurrentBrush.prototype.size = function( size /* optional */) {
        var oldSize = (this.styleIdx % 2) ? "large" : "small";
    
        // get
        if (arguments.length === 0) {
            return oldSize;
        
        // set
        } else {
            this.styleIdx += (oldSize === size) ? 0 : 
                             (size === "small") ? -1 : 1;
        }
    }

    CurrentBrush.prototype.colorPanelIdx = function( colorPanelIdx /* optional */) {
        var oldColorPanelIdx = Math.floor( this.styleIdx / 2 );
    
        // get
        if (arguments.length === 0) {
            return oldColorPanelIdx;
        
        // set        
        } else {
            this.styleIdx += (colorPanelIdx - oldColorPanelIdx) * 2;
        }
    }

    CurrentBrush.prototype.style = function() {
        
        // size and colorPanelIdx are both optional arguments 
        //and can be in either order.
        var size, colorPanelIdx;
    
        // get
        if (arguments.length === 0) {
            return this.currentPalette.brushStyles[ this.styleIdx ];
    
        // set
        } else {
        
            // Figure out optional arguments.
        
            size = (typeof arguments[0] === "string") ? arguments[0] :
                (typeof arguments[1] === "string") ? arguments[1] :
                null;
               
            colorPanelIdx = (typeof arguments[0] === "number") ? arguments[0] :
                (typeof arguments[1] === "number") ? arguments[1] :
                null;
        
            // Between the arguments and the CurrentBrush instance properties,
            // whichever exist, bring the others up to speeed.
        
            if (size !== null) {
                this.size( size );
            } else {
                size = this.size();
            }
        
            if (colorPanelIdx !== null) {
                this.colorPanelIdx( colorPanelIdx );
            } else {
                colorPanelIdx = this.colorPanelIdx();
            }
        
            // this.styleIdx should now be updated and accurate.
        
            console.log( "colorPanelIdx: " + colorPanelIdx );
            console.log( "size: " + size );
            console.log( "this.styleIdx: " + this.styleIdx );
            console.log( "currentPalette.brushStyles[ this.styleIdx ].toString(): " + 
                         this.currentPalette.brushStyles[ this.styleIdx ].toString() );
            console.log("\n");
        }
    };
    

    // Palettes objects are the objects into which we'll be adding the data from
    // colourlovers.com. (There's only one instance created by the Palettes constructor
    // in the current version of the app.) 
    
    // The Palettes constructor prototype contains a method to load the data.
    // Each palettes object contains a string with the search keywords and 
    // an array with the returned data.
     
    // After we add properties on the fly it will look like this:

    // palettes = { 
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
    

    // This function does a deep copy of data from the feed
    // downloaded from the colourlovers website into the palettes object.
    
    Palettes = function() {};

    Palettes.prototype.load = function( data ) {
        if (!data || data.length === 0) {
            return false;
        }
        
        var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
        var i, len;
        var date;
        var self = this;
        
        this.data = [];
        
        for (i = 0, len = data.length; i < len; i++) {
            (function( idx ) {
                var entry;
                var desc;
                var newPalette = {};
                console.log(idx);

                entry = data[idx];

                util.copy( newPalette, entry, [
                    "colors", 
                    "imageUrl", 
                    "title", 
                    "userName", 
                    "description", 
                    "dateCreated"] ); // omitting last argument
                                      // makes it a deep copy
                                          
                // Now make "dateCreated" a more readable string.
            
                date = util.parseSQLDate( newPalette.dateCreated );
                newPalette.dateCreated = MONTHS[date.getMonth()] + " " + 
                                         date.getDate() + ", " + 
                                         date.getFullYear();
            
                // Many of the descriptions on colourlovers.com
                // are long garbage strings of html, so exclude those.
            
                desc = newPalette.description;
                newPalette.description = (desc.length < 200) ? desc : "";
            
                // Load the new palette into the main database object.
            
                self.data[idx] = newPalette;
            
            }( i ));
        }
        return true;
    };
    
    init = function( args ) {
        var palettes,
            currentPalette,
            currentBrush;
        
        // Initialize palettes.
        palettes = new Palettes();

        // Initialize currentPalette.
        currentPalette = new CurrentPalette( args.paletteTitle, args.paletteColors, args.maxColors,
                                             args.smallBrushWidth, args.largeBrushWidth );

        // Initialize currentBrush.
        currentBrush = new CurrentBrush( args.brushSize, args.colorPanelIdx, currentPalette );
        
        instances[instanceNumber] = {
            palettes: palettes,
            currentPalette: currentPalette,
            currentBrush: currentBrush
        };
        instanceNumber += 1;
    };

    //----------- MODULE INTERFACE ----------------
    
    return {
        init: init, 
        instances: instances
    };  
    
})();



// ------------------ VIEW --------------------------

APP.view = (function() {
    
    var util = APP.util;
    var config = APP.config;
    var model = APP.model;
    
    var TheStatus,
        Canvas,
        ColorPanels,
        PalettesColumn;
        
    var init;

    var instances = [];
    var instanceNumber = 0;

    // ------------------ Status reporting mechanism. --------------------------
    
    // (would be called "Status," but one of the browsers
    // doesn't like that. I forget which one.)

    TheStatus = function( element ) {
        this.jQelement = $( element );
    };

    TheStatus.prototype.report = function( str ) {  

        // If we've got something to report
        if (arguments.length) {
            this.jQelement.text( str );

        // No news is good news.
        } else {
            this.jQelement.html( '&nbsp;' );
        }

    }

    // --------------------- Wrapper for DOM Canvas ----------------------------

    Canvas = function( DOMElement, width, height, backgroundColor, brushStyle, colorPanelIdx ) {
        var borderLeftPx = (window.getComputedStyle) ? 
                            window.getComputedStyle( DOMElement, null )['border-left-width'] :
                            DOMElement.currentStyle.border; // TODO: check in IE6, IE7, IE8
                            
        this.DOMElement = DOMElement;
        this.context = DOMElement.getContext( "2d" );
        this.width = width;
        this.height = height;
        this.backgroundColor = backgroundColor;

        this.border = (borderLeftPx) ? parseInt(borderLeftPx, 10) : 16;
        this.drawing = false;
        
        this.applyStyle( brushStyle );
        this.clear();
    }

    Canvas.prototype.getMousePos = function( event ) {
        event = event || window.event; // This is for IE's global window.event

        var r = this.DOMElement.getBoundingClientRect();
        var coords = {
            x : event.clientX - r.left - this.border,
            y : event.clientY - r.top - this.border
        };
        return coords;
    }

    Canvas.prototype.applyStyle = function( brushStyle ) {
        var c = this.context;
        
        c.lineWidth = brushStyle.width;
        c.strokeStyle = "#" + brushStyle.color;
        c.lineCap = brushStyle.lineCap;
        c.lineJoin = brushStyle.lineJoin;
    }

    Canvas.prototype.startStroke = function( x, y ) {
        var c = this.context;

        // save fillStyle on stack
        var savedFillStyle = c.fillStyle;

        // draw a dot the diameter of the brush
        var r = c.lineWidth / 2;
        c.fillStyle = c.strokeStyle;
        c.beginPath();
        c.moveTo( x, y );
        c.arc( x, y, r, 0, Math.PI * 2 );
        c.fill();

        // finish up, restore fillStyle and start new path
        c.beginPath();
        c.moveTo( x, y );
        c.fillStyle = savedFillStyle;

    };

    Canvas.prototype.stroke = function( x, y ) {
        var c = this.context;

        c.lineTo( x, y );
        c.stroke();
    };

    Canvas.prototype.clear = function() {
        var c = this.context;

        c.fillStyle = "#" + this.backgroundColor;
        c.fillRect( 0, 0, this.width, this.height );
    };
    
    // -------------------- wrapper for DOM color panels --------------------------
    
    ColorPanels = function( DOMContainer, DOMTitleSpan, title, colors ) {
        this.DOMContainer = DOMContainer;
        this.DOMTitleSpan = DOMTitleSpan;
        this.populate( title, colors );
    };
    
    ColorPanels.prototype.populate = function( title, colors ) {
        var i, len;
        var color;
        var elementKlasses = [];
        
        var jQcontainer = $( this.DOMContainer );
        var jQtitleSpan = $( this.DOMTitleSpan );
        
        for (i = 0, len = colors.length; i < len; i++) {
            elementKlasses.push( {klass: 'color-' + i} );
        }

        // Now empty the old color panels, then load the new ones 
        // into the DOM. Create the div tags with the 
        // jQuery template, then add background colors.
        
        // THIS SHOULD BE CHANGED TO RE-BACKGROUND-COLORING
        // WHAT WAS ALREADY THERE, INSTEAD OF EMPTYING AND RE-DRAWING. 

        jQcontainer.empty();
        jQtitleSpan.text( title );

        $( "#currentPaletteTemplate" ).
                tmpl( elementKlasses ).
                appendTo( jQcontainer ).
                each( function( elementIndex ) {
                    this.style.backgroundColor = '#' + colors[elementIndex];
                });
            
    };
    
    ColorPanels.prototype.getKlass = function( colorPanelIdx ) {
        return 'color-' + colorPanelIdx;
    };
    
    // -------------------- wrapper for DOM palettes column --------------------------
    
    PalettesColumn = function( DOMContainer, DOMTitleSpan ) {
        this.DOMContainer = DOMContainer;
        this.DOMTitleSpan = DOMTitleSpan;
    };
    
    PalettesColumn.prototype.populate = function( palettes ) {
        
        // In the left column, show the heading with the keywords, and all the palettes below it,
        // along with their click handlers for loading colors into the drawing program.
    
        var jQcontainer = $( this.DOMContainer );
    
        $( this.DOMTitleSpan ).text( palettes.keywords );
        jQcontainer.find( '.palettesFound' ).show();
    
        jQcontainer.empty();
        $( '#palettesTemplate' ).tmpl( palettes.data ).appendTo( jQcontainer );
    
        jQcontainer.show();
    };
    
    init = function( args ) {
        var theStatus,
            canvas,
            colorPanels,
            palettesColumn;
        
        // Initialize status reporting.
        theStatus = new TheStatus( args.statusReportElement );
        
        // Initialize canvas.
        canvas = new Canvas( args.canvasElement, args.canvasWidth, args.canvasHeight, 
                             args.canvasBackgroundColor, args.brushStyle, args.colorPanelIdx );
        
        // Load the colors into the DOM.
        colorPanels = new ColorPanels ( args.colorPanelsElement, args.colorsTitleElement, 
                                        args.paletteTitle, args.paletteColors );
                                           
        // Initialize empty palettesColumn object.
        palettesColumn = new PalettesColumn( args.palettesColumnElement, args.palettesTitleElement );

        instances[instanceNumber] = {
            theStatus: theStatus,
            canvas: canvas,
            colorPanels: colorPanels,
            palettesColumn: palettesColumn
        };
        instanceNumber += 1;
    };
    
    //----------- MODULE INTERFACE ----------------

    return {
        init: init,
        instances: instances
    };
})();

APP.controller = (function() {
    
    var util = APP.util;
    var config = APP.config;

    var requestFromColourloversAPI;
    var loadPalettes;
    
    var setMiscellaneousUserControls;
    var setErrorControls;
    var setCanvasControls;
    
    var ElementsController;
    var colorPanelsController;
    var palettesColumnController;
    
    var init;
    
    // -- the event handler for requesting data from colourlovers.com
    
    requestFromColourloversAPI = function( instanceNumber ) {
        var model = APP.model.instances[instanceNumber];
        var view = APP.view.instances[instanceNumber];
        
        var encodedKeywords;
        var colourLoversScript;
        var searchURL;
        
        var pageId = 'page-' + instanceNumber;
        var pageSelector = '#' + pageId;
        var searchField = $( pageSelector + ' .searchField' );
        var keywords = searchField.val();

        // if the user typed anything
        if (keywords) {
            model.palettes.keywords = keywords;
            searchField.val( '' );
                        
            view.theStatus.report( "Loading..." );

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
            // in our callback function, palettes.load()
        
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
        var model = APP.model.instances[instanceNumber];
        var view = APP.view.instances[instanceNumber];
        
        if (model.palettes.load( data )) {
            palettesColumnController.init( instanceNumber );
            view.theStatus.report();   // no arguments means all clear, no errors to report.  
        } else {
            view.theStatus.report( 'No palettes matched the keyword or keywords "' + 
                                    model.palettes.keywords + '." Try again.' );
        };
    });

    /* We'll get this generic error handler going once we get the rest working.
    
    // For the specialized case of when the error handler cannot
    // be bound to the script element (it seems to work on all browsers, but many
    // fairly recent posts on the Internet say this handler can only be bound
    // to the window object or to an img element), we have as a fallback a
    // generic error handler on the window object if anything goes wrong on the page at all.
    
    setGenericError = function() {
        try {
            $( document ).delegate( '#fakeTest', 'error', function () {} );
        } catch( e ) {

            if (window.addEventListener) {
                window.addEventListener('error', function () {
                    alert( "There's been a nebulous problem of some sort." );
                }, false);

            } else if (window.attachEvent) {
                window.attachEvent('error', function () {
                    alert( "There's been a nebulous problem of some sort, probably IE-related." );
                });
            }
        }

            
    };
    
    */
    
    setErrorControls = function( instanceNumber ) {
        // Set up error handlers for all current and future cases of 
        // the manual script tag that downloads the data from colourlovers
        // (using jQuery .delegate()).

        var view = APP.view.instances[instanceNumber];
        var pageSelector = '#page-' + instanceNumber;

        $( pageSelector ).delegate(' colourLoversUrl', 'error', function () {

            // extract the search string from the colourlovers.com request url.
            var keywords = $( this ).attr( 'src' ).replace( /(.*?keywords=search+)(.*?)(&.*)/, '$2' );
            view.theStatus.report( 'Unable to load palettes for the keywords ' + keywords + '."' );
        });
    };
    
    setMiscellaneousUserControls = function( instanceNumber ) {
        var model = APP.model.instances[instanceNumber];
        var view = APP.view.instances[instanceNumber];
        
        var pageSelector = '#page-' + instanceNumber;
        var code;
        
        // Set brush size HTML select element, 
        // because Firefox preserves state even when it's refreshed.
        $( pageSelector + ' .brushSize' ).val( model.currentBrush.size() );  

        // bind the event handlers for clearing the screen, 
        // toggling the brush size and entering search keywords.

        $( pageSelector + ' .clearCanvas' ).click( function() {
            view.canvas.clear();
        });

        $( pageSelector + ' .brushSize' ).change( function() {
            model.currentBrush.style( this.value );
            view.canvas.applyStyle( model.currentBrush.style() );
        });        

        $( pageSelector + ' .searchButton' ).click( function() {
            requestFromColourloversAPI( instanceNumber );
        });
        $( pageSelector + ' .searchField' ).keydown( function( event ) {

            // cross-browser compliance for different keydown event key code property names
    
            code = event.keyCode || event.which;
            if (code == 13) {
                event.preventDefault();
                requestFromColourloversAPI( instanceNumber );
            }
        });
    };
    
    setCanvasControls = function( instanceNumber ) {
        var canvas = APP.view.instances[instanceNumber].canvas;

        canvas.DOMElement.onmousedown = function( event ) {
            var p = canvas.getMousePos( event );
            canvas.startStroke( p.x, p.y );
            canvas.drawing = true;
        };

        canvas.DOMElement.onmousemove = function( event ) {
            var p = canvas.getMousePos( event );

            if (canvas.drawing) {
                canvas.stroke( p.x, p.y );
            }
        };

        canvas.DOMElement.onmouseup = function( event ) {
            canvas.drawing = false;
        };
    };
    
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
    
    colorPanelsController.init = function( instanceNumber ) {
        var model = APP.model.instances[instanceNumber];
        var view = APP.view.instances[instanceNumber];
        var pageSelector = '#page-' + instanceNumber;
        
        var panel;
        
        // Populate the color panels.
        view.colorPanels.populate( model.currentPalette.title, model.currentPalette.colors ); 
        
        // Set the canvas to the right style.
        view.canvas.applyStyle( model.currentBrush.style() );

        // Now make the already selected one pink.
        panel = $( pageSelector + ' .' + view.colorPanels.getKlass( model.currentBrush.colorPanelIdx()) );
        this.highlightElement( panel );

        // Add the event listeners.
        this.addEventListeners( view.colorPanels, function( element, i ) {
            
            // Update currentBrush and canvas.
            model.currentBrush.style( i );
            view.canvas.applyStyle( model.currentBrush.style() );
            
            // Turn the selected one pink.
            colorPanelsController.highlightElement( element );
        });
    };
         

    palettesColumnController = new ElementsController();
    
    palettesColumnController.init = function( instanceNumber ) {
        var model = APP.model.instances[instanceNumber];
        var view = APP.view.instances[instanceNumber];
        var pageSelector = '#page-' + instanceNumber;
                
        // Populate the palettes column.
        view.palettesColumn.populate( model.palettes );
        
        // Add the event handlers.
        this.addEventListeners( view.palettesColumn, function( element, i ) {
            
            // Load the currentPalette with the new colors.
            var title = model.palettes.data[i].title;
            var colors = model.palettes.data[i].colors;
            model.currentPalette.init( title, colors );
            colorPanelsController.init( instanceNumber );
            
            // Turn the selected one pink.
            palettesColumnController.highlightElement( element, ".palette-image" );
        });        
    };
    
    // the init will eventually be broken up into two parts: one for everything
    // that gets executed only once when the user goes to this URL or refreshes 
    // their browser, and the other one for every time a new instance of 
    // the drawing app is created on the page.

    init = function() {

        var i, len;
        var pageSelector;
        
        for (i = 0, len = config.length; i < len; i++) {
            pageSelector = "#page-" + i;
            
            APP.model.init({ 
                paletteTitle:    config[i].DEFAULT_PALETTE_TITLE, 
                paletteColors:   config[i].DEFAULT_PALETTE_COLORS, 
                maxColors:       config[i].MAX_COLORS,
                brushSize:       config[i].DEFAULT_BRUSH_SIZE, 
                largeBrushWidth: config[i].LARGE_BRUSH_WIDTH,
                smallBrushWidth: config[i].SMALL_BRUSH_WIDTH,
                colorPanelIdx:   config[i].DEFAULT_COLOR_PANEL_INDEX 
            });
            
            APP.view.init({ 
                canvasWidth:             config[i].CANVAS_WIDTH, 
                canvasHeight:            config[i].CANVAS_HEIGHT, 
                canvasBackgroundColor:   config[i].CANVAS_BACKGROUND_COLOR, 
                colorPanelIdx:           config[i].DEFAULT_COLOR_PANEL_INDEX,
                paletteTitle:            config[i].DEFAULT_PALETTE_TITLE, 
                paletteColors:           config[i].DEFAULT_PALETTE_COLORS,
                
                statusReportElement:     $( pageSelector + ' .statusReport' )[0], 
                canvasElement:           $( pageSelector + ' .canvas' )[0],
                colorPanelsElement:      $( pageSelector + ' .color-container' )[0],
                colorsTitleElement:      $( pageSelector + ' .currentPaletteTitle' )[0],
                palettesColumnElement:   $( pageSelector + ' .paletteList' )[0],
                palettesTitleElement:    $( pageSelector + ' .successfulKeywords' )[0],

                brushStyle:              APP.model.instances[i].currentBrush.style() 
            });
            
            setMiscellaneousUserControls( i );
            setErrorControls( i );
            setCanvasControls( i );
            colorPanelsController.init( i );
            loadPalettes.add( i );
        }
    };
    
    //----------- module interface -----------------
    
    return {
        
        // We need init right now.
        // We might need the rest of this stuff in a later version of this app.

        requestFromColourloversAPI: requestFromColourloversAPI,
        loadPalettes: loadPalettes,

        setMiscellaneousUserControls: setMiscellaneousUserControls,
        setErrorControls: setErrorControls,
        setCanvasControls: setCanvasControls,

        colorPanelsController: colorPanelsController,
        palettesColumnController: palettesColumnController,

        init: init
    };
})();

$( function () {
    APP.controller.init();
});

