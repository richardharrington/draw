var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
              'July', 'August', 'September', 'October', 'November', 'December'];

var DEFAULT_PALETTE_COLORS = ['B04141', '85224A', 'EBE3B2', '1A4F6B', '042B4F'];
var MAX_COLORS = 10;
var DEFAULT_PALETTE_TITLE = "default";
var DEFAULT_COLOR_PANEL_INDEX = 0;
var DEFAULT_BRUSH_WIDTH = 25;
var LARGE_BRUSH_WIDTH = 25;
var SMALL_BRUSH_WIDTH = 10;
var DEFAULT_BRUSH_SIZE = "large";
var CANVAS_BACKGROUND_COLOR = "#eee";

var brushChildrenProto;
var BrushStyle;

var CurrentPalette, currentPalette;
var CurrentBrush, currentBrush;
        
var paletteData = {};
var Stat, stat;

var Canvas, canvas;

var initApp;


// ------ Set up the status reporting mechanism. -------

Stat = function( element ) {
    this.jQElement = $( element );
};
    
Stat.prototype.report = function( str ) {  
     
    // If we've got something to report
    if (arguments.length) {
        this.jQElement.text( str );

    // No news is good news.
    } else {
        this.jQElement.html( '&nbsp;' );
    }
    
}


// --- Now set up the BrushStyle constructor -----
//

BrushStyle = function( color, width ) {
    this.color = '#' + color;
    this.width = width || DEFAULT_BRUSH_WIDTH;
    this.lineCap = 'round';
    this.lineJoin = 'round';
};

BrushStyle.prototype.toString = function() {
  var state = "{" +
      "color: " + this.color + ", " +
      "width: " + this.width + ", " +
      "lineCap: " + this.lineCap + ", " +
      "lineJoin: " + this.lineJoin +    
  "}";
  return state;
}

brushChildrenProto = new BrushStyle();


// --- A note about CurrentPalette, CanvasContext and CurrentBrush:

// These constructors are designed to have only one instance each,
// for each instance of this app. The properties of these objects
// will be reset each time something changes.

// If I get around to doing the Week 4 homework assignment,
// then there will be multiple instances created from these constructors.


// --- Set up the currentPalette object,
// --- whose own properties are all the Brushstyle children.

CurrentPalette = function() {              
    this.brushStyles = [];
};

// Select a new palette of colors and load them into brushStyles
// and into the DOM. 

CurrentPalette.prototype.select = function( title, colors ) {
        
    var i, len;
    var color;
    var small, large;

    var elementIds = [];
    
    // The number of color panels can vary, but we can only fit MAX_COLORS,
    // so truncate the array if necessary. (Normally we will set MAX_COLORS 
    // in the constant declaration block to 10, but in practice we probably won't 
    // be loading from anywhere but the colourlovers.com api, 
    // which provides 5 colors per palette.)

    colors = colors.slice( 0, MAX_COLORS );

    this.brushStyles.length = 0;
    
    for (i = 0, len = colors.length; i < len; i++) {
        color = '#' + colors[i];
        small = object( brushChildrenProto, {
            color: color,
            width: SMALL_BRUSH_WIDTH
        });
        large = object( brushChildrenProto, {
   	        color: color,
   	        width: LARGE_BRUSH_WIDTH
   	    });

        this.brushStyles.push( small );
        this.brushStyles.push( large );

        // While we're iterating through this loop, create
        // the array that will soon be applied to the jQuery template
        // to populate the color panel div tags:

        elementIds.push( {id: 'color-' + (i + 1)} );
    }

    // Now empty the old color palettes, then load the new ones 
    // into the DOM. Create the div tags with the 
    // jQuery template, then add background colors and 
    // click handlers.

    $( 'div.color-container' ).empty();
    $( '#currentPalette' ).text( title );

    $( "#colorPanelsTemplate" ).
            tmpl( elementIds ).
            appendTo( "div.color-container" ).
            each( function( elementIndex ) {
                this.style.backgroundColor = '#' + colors[elementIndex];

                this.onclick = (function( i ) {
                    return function() {
                        currentBrush.style( i );
                        canvas.applyStyle( currentBrush.style(), i );
                    };
                })( elementIndex );
            });
};


// --- Set up the current brush.

CurrentBrush = function() {

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
    
    this.styleIdx = 0; // Have to set it to something, but it will be 
                       // changed right after the first instantiation.
                       // (This is probably not ideal. Check into this
                       // if we have time.)
};

// a series of functions that are both getters and setters,
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

CurrentBrush.prototype.style = function( /* size, colorPanelIdx are both optional arguments and can be in either order */ ) {
    var jQElement;
    var style;
    var size, colorPanelIdx;
    
    // get
    if (arguments.length === 0) {
        return currentPalette.brushStyles[ this.styleIdx ];
    
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
                     currentPalette.brushStyles[ this.styleIdx ].toString() );
        console.log("\n");

        style = currentPalette.brushStyles[ this.styleIdx ];
    }
};


// --------- Prepare canvas ----------

var Canvas = function( element ) {
    var borderLeftPx;
    
    this.DOMElement = element;
    this.context = element.getContext( "2d" );
    
    borderLeftPx = (window.getComputedStyle) ? 
                    window.getComputedStyle( element, null )['border-left-width'] :
                    element.currentStyle.border; // TODO: check in IE6, IE7, IE8

    this.border = (borderLeftPx) ? parseInt(borderLeftPx, 10) : 16;

    this.drawing = false;
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

Canvas.prototype.applyStyle = function( brushStyle, colorPanelIdx ) {
    var c = this.context;
    var jQElement = $( '#color-' + (colorPanelIdx + 1) );
    
    c.lineWidth = brushStyle.width;
    c.strokeStyle = brushStyle.color;
    c.lineCap = brushStyle.lineCap;
    c.lineJoin = brushStyle.lineJoin;

    // Highlight color panel
    jQElement.addClass( 'selected' );

    // Un-highlight all others
    jQElement.siblings().removeClass( 'selected' );
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

Canvas.prototype.clear = function( color ) {
    var c = this.context;
    
    c.fillStyle = color;
    c.fillRect( 0, 0, 1000, 1000 );
}


// --- Retrieve palettes from colourlovers.com ---------------

// paletteData is the object into which we'll be adding the data from
// colourlovers.com. It contains two methods, request to 
// make a JSON request and load to load the data. After we add 
// properties on the fly it will look like this:

// paletteData = { 
//   keywords: 'summer apple tree',
//   palettes: [
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

paletteData.request = function() {
    var keywords = $( '#searchField' ).val();
    var encodedKeywords;
    var colourLoverScript;

    // if the user typed anything
    if (keywords) {
        this.keywords = keywords;
        $( '#searchField' ).val( '' );
                        
        stat.report( "Loading..." );

        // Create the script tag that makes the http request to Colourlovers.com. 
        // But first overwrite any previous script tags 
        // with the id 'colourLoversUrl', after checking to see whether they exist.
        // We do this tag replacement (instead of adding new tags every time) 
        // partly just to keep the tags from piling up,
        // and partly to prevent the DOM from having tags with the same id.
      
        if ( $( '#colourLoversUrl' ).length > 0 ) {
            $( '#colourLoversUrl' ).remove();
        }
        colourLoversScript = document.createElement( 'script' );
    	colourLoversScript.id = 'colourLoversUrl';
        document.getElementsByTagName( 'head' )[0].appendChild( colourLoversScript );
      
        // Change spaces to plus signs for insertion into search query.
        // This query string tells colourlovers.com to pass back the data wrapped
        // in our callback function, paletteData.load()
        
        encodedKeywords = keywords.replace( /\s+/g, '+' );
        colourLoversScript.setAttribute( 'src', 
                'http://www.colourlovers.com/api/palettes?keywords=search+' + encodedKeywords + 
                '&jsonCallback=paletteData.load' );
    }
    return false;
}


// This function does a deep copy of data from the feed
// downloaded from the colourlovers website into the paletteData object.

paletteData.load = function( data ) {
    if (data && data.length > 0) {
        var i, len;
        var date;
        var self = this;
            
        this.palettes = [];
            
        for (i = 0, len = data.length; i < len; i++) {
            (function( idx ) {
                var entry;
                var desc;
                var newPalette = {};
                console.log(idx);

                entry = data[idx];

                copy( newPalette, entry, ["colors", 
                                          "imageUrl", 
                                          "title", 
                                          "userName", 
                                          "description", 
                                          "dateCreated"] ); // omitting last argument
                                                            // makes it a deep copy
                                              
                // Now make "dateCreated" a more readable string.
                
                date = parseSQLDate( newPalette.dateCreated );
                newPalette.dateCreated = MONTHS[date.getMonth()] + " " + 
                                         date.getDate() + ", " + 
                                         date.getFullYear();
                
                // Many of the descriptions on colourlovers.com
                // are long garbage strings of html, so exclude those.
                
                desc = newPalette.description;
                newPalette.description = (desc.length < 200) ? desc : "";
                
                // Load the new palette into the main database object.
                
                self.palettes[idx] = newPalette;
                
            }( i ));
        }
        
        
        // In the left column, show the heading with the keywords, and all the palettes below it,
        // along with their click handlers for loading colors into the drawing program.
        
        // Also clear the "Loading..." message by calling stat.report() with no arguments.
        
        $( '#successfulKeywords' ).text( this.keywords );
        $( '#palettesFound' ).show();
        
        $( '#paletteList' ).empty();
        $( '#palettesTemplate' ).
                tmpl( this.palettes ).
                appendTo( "#paletteList" ).
                each( function( paletteIndex ) {
                    this.onclick = function() {
                        
                        var title = paletteData.palettes[paletteIndex].title;
                        var colors = paletteData.palettes[paletteIndex].colors;
                        
                        var style, colorPanelIdx;
                        
                        currentPalette.select( title, colors );
                        
                        // Now that we have loaded currentPalette
                        // with the new colors, invoking currentBrush.style()
                        // will give access the correct style information
                        // in currentPalette.
                        
                        style = currentBrush.style();
                        colorPanelIdx = currentBrush.colorPanelIdx();
                        
                        canvas.applyStyle( style, colorPanelIdx );
                        
                        // turn the palette thumbnail pink
                        
                        $( '#paletteList .selected' ).removeClass( 'selected' );
                        $( this ).find( 'img' ).addClass( 'selected' );
                         
                    };
                });
        
        stat.report();   // no arguments means all clear, no errors to report.  
        $( '.left-column' ).show();
        
    } else {
        stat.report( 'No palettes matched the keyword or keywords "' + this.keywords + '." Try again.' );
    }
    
}


// initApp will eventually be broken up into two parts: one for everything
// that gets executed only once when the user goes to this URL or refreshes 
// their browser, and the other one for every time a new instance of 
// the drawing app is created on the page.

initApp = function() {
    
    var brushSizeElement = document.getElementById( 'brushSize' );
    var canvasElement = document.getElementById( "canvas" );
    
    var code;
    
    // Initialize status reporting for this app.
    
    stat = new Stat( document.getElementById( 'statusReport' ) );
    
    // Initialize currentPalette, currentBrush, and canvas.
    
    currentPalette = new CurrentPalette();
    currentPalette.select( DEFAULT_PALETTE_TITLE, DEFAULT_PALETTE_COLORS );
    
    currentBrush = new CurrentBrush();
    currentBrush.style( DEFAULT_BRUSH_SIZE, DEFAULT_COLOR_PANEL_INDEX );

    canvas = new Canvas( canvasElement );
    canvas.applyStyle( currentBrush.style(), DEFAULT_COLOR_PANEL_INDEX );

    // need to manually set brush size HTML select element, 
    // because Firefox preserves state even when it's refreshed.

    $( brushSizeElement ).val( currentBrush.size() );  

    // bind the event handlers for clearing the screen, 
    // toggling the brush size and entering search keywords.
    
    $( '#clearCanvas' ).click( function() {
        canvas.clear( CANVAS_BACKGROUND_COLOR );
    });
    
    $( brushSizeElement ).change( function() {
        currentBrush.style( this.value );
        canvas.applyStyle( currentBrush.style(), currentBrush.colorPanelIdx() );
    });        

    $( '#searchButton' ).click( paletteData.request );
    $( '#searchField' ).keydown( function( event ) {

        // cross-browser compliance for different keydown event key code property names
        
        code = event.keyCode || event.which;
        if (code == 13) {
            event.preventDefault();
            paletteData.request();
        }
    });

    // Set up error handlers for all current and future cases of 
    // the manual script tag that downloads the data from colourlovers
    // (using jQuery .delegate()).
    // Also, for the specialized case of when the error handler cannot
    // be bound to the script element (it seems to work on all browsers, but many
    // fairly recent posts on the Internet say this handler can only be bound
    // to the window object or to an img element), we have as a fallback a
    // generic error handler on the window object if anything goes wrong on the page at all.

    try {
        $( document ).delegate('#colourLoversUrl', 'error', function () {

            // extract the search string from the colourlovers.com request url.
            var keywords = $(this).attr('src').replace(/(.*?keywords=search+)(.*?)(&.*)/, '$2');
            stat.report( 'Unable to load palettes for the keywords ' + keywords + '."' );
        });
        
    } catch ( e ) {

        if (window.addEventListener) {
            window.addEventListener('error', function () {
                stat.report( "There's been a nebulous problem of some sort." );
            }, false);

        } else if (window.attachEvent) {
            window.attachEvent('error', function () {
                stat.report( "There's been a nebulous problem of some sort, probably IE-related." );
            });
        }
    }
    
    //========== Canvas events ==============

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
    
    canvas.clear( CANVAS_BACKGROUND_COLOR );
    canvas.drawing = false;

} // end init code


$(document).ready( function () {
    initApp();
});  
