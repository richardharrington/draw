var config = {
    DEFAULT_PALETTE_COLORS: ['B04141', '85224A', 'EBE3B2', '1A4F6B', '042B4F'],
    DEFAULT_PALETTE_TITLE: "default palette",
    DEFAULT_COLOR_PANEL_INDEX: 0,
    LARGE_BRUSH_WIDTH: 25,
    SMALL_BRUSH_WIDTH: 10,
    DEFAULT_BRUSH_SIZE: "large",
    CANVAS_WIDTH: 900,
    CANVAS_HEIGHT: 500,
    CANVAS_BACKGROUND_COLOR: "EEE"
};


//////// MODELS //////////

// --- Set up the Palette constructor.

function Palette( title, colors, smallBrushWidth, 
                  largeBrushWidth, activeSize, 
                  activeColorPanelIdx ) {

    this.smallBrushWidth = smallBrushWidth;
    this.largeBrushWidth = largeBrushWidth;
    this.load( title, colors );
    this.activeSize( activeSize );
    this.activeColorPanelIdx( activeColorPanelIdx );
}

// Load in a new set of colors with their title.

Palette.prototype.load = function( title, colors ) {

    this.colors = colors;
    this.title = title;

    // brushStyles alternate between small brushes and large brushes,
    // so create an array with twice as many elements as the colors array.

    var brushStyles = [];
    for (var i = 0; i < colors.length; i++) {
        brushStyles.push({ color: colors[i], width: this.smallBrushWidth });
        brushStyles.push({ color: colors[i], width: this.largeBrushWidth });
    }
    this.brushStyles = brushStyles;
};

// styleIdx is a number that has two values
// for every one that colorPanelIdx has,
// because styleIdx takes into account
// whether a brush is small or large.

// activeSize and activeColorPanelIdx are overloaded as both
// getters and setters, depending on the number of arguments.

// activeStyle is just a getter.

Palette.prototype.activeStyle = function( size, colorPanelIdx ) {
    return this.brushStyles[ this.styleIdx ];
};

Palette.prototype.activeSize = function( size /* optional */) {
    var styleIdx = this.styleIdx || 0;
    var oldSize = (styleIdx % 2) ? "large" : "small";

    // get
    if (arguments.length === 0) {
        return oldSize;

    // set
    } else {
        styleIdx += (oldSize === size) ? 0 :
                    (size === "small") ? -1 : 1;
        this.styleIdx = styleIdx;
    }
};

Palette.prototype.activeColorPanelIdx = function( colorPanelIdx /* optional */) {
    var styleIdx = this.styleIdx || 0;
    var oldColorPanelIdx = Math.floor( styleIdx / 2 );

    // get
    if (arguments.length === 0) {
        return oldColorPanelIdx;

    // set
    } else {
        styleIdx += (colorPanelIdx - oldColorPanelIdx) * 2;
        this.styleIdx = styleIdx;
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

// This function loads data from the colourlovers website
// into the paletteList object.

PaletteList.prototype.load = function( data ) {
    if (!data || data.length === 0) {
        return false;
    }

    this.data = data.map(function(entry) {
        // We only want newPalette to contain SOME
        // of the ton of stuff that comes down from
        // the colorlovers api
        var newPalette = {
            colors:      entry.colors,
            imageUrl:    entry.imageUrl,
            title:       entry.title,
            userName:    entry.userName,
            description: entry.description,
            dateCreated: entry.dateCreated
        };

        // Now make "dateCreated" a more readable string
        // by parsing the SQL-formatted date into 
        // [ Y, M, D, h, m, s ]
        var sqlDateParts = newPalette.dateCreated.split(/[- :]/);
        var jsDate = new Date(sqlDateParts[0], sqlDateParts[1] - 1, 
                              sqlDateParts[2], sqlDateParts[3], 
                              sqlDateParts[4], sqlDateParts[5]);
        newPalette.dateCreated = MONTHS[jsDate.getMonth()] + " " +
                                 jsDate.getDate() + ", " +
                                 jsDate.getFullYear();


        // Many of the descriptions on colourlovers.com
        // are long garbage strings of html, so exclude those
        // by checking if the string is too long.

        if (newPalette.description.length > 200) {
            newPalette.description = "";
        }

        return newPalette;
    });

    return true;
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
    this.$element = $( element );
}

TheStatus.prototype.report = function( str ) {

    // If we've got something to report
    if (arguments.length) {
        this.$element.text( str );

    // No news is good news.
    } else {
        this.$element.html( '&nbsp;' );
    }
};

function PopupBox( linkEl, displayEl, closeEl ) {
    this.$link = $(linkEl);
    this.$display = $(displayEl);
    this.$close = $(closeEl);
}

PopupBox.prototype.init = function() {
    var self = this;
    var box = this.$display;
    this.$link.on('click', function( event ) {
        self.$display.css("display", "block");
        setTimeout(function() {
            self.$display.css("opacity", "1");
        }, 50);
    });
    this.$close.on('click', function() {
        self.$display.css("opacity", "0");
        setTimeout(function() {
            self.$display.css("display", "none");
        }, 550);
    });
};


// --------------------- Wrapper for DOM Canvas ----------------------------

function Canvas( DOMElement, width, height, backgroundColor ) {
    var borderLeftPx = (window.getComputedStyle) ?
                        window.getComputedStyle( DOMElement, null )['border-left-width'] :
                        DOMElement.currentStyle.border; // TODO: check in IE6, IE7, IE8

    this.DOMElement = DOMElement;
    this.context = DOMElement.getContext( "2d" );

    // Stored as we go along so we don't have to constantly
    // change brush styles
    this.brushStyle = null;

    // Possibly make these configurable in the future.
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';

    this.width = width;
    this.height = height;
    this.backgroundColor = backgroundColor;

    // We may make lineCap & lineJoin configurable at some
    // point in the future, but not now.
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';

    this.border = (borderLeftPx) ? parseInt(borderLeftPx, 10) : 16;

    $( DOMElement ).attr( 'width', width );
    $( DOMElement ).attr( 'height', height );

    this.clear();
}

Canvas.prototype.getPos = function( event ) {
    event = event || window.event; // This is for IE's global window.event

    var r = this.DOMElement.getBoundingClientRect();
    var coords = {
      // No attempt to cater to IE here (I've heard they don't support
      // pageX/YOffset). We'll try to do that later.
      // But actually this seems to work in IE9.

      x : parseInt(event.pageX - (r.left + window.pageXOffset) - this.border, 10),
      y : parseInt(event.pageY - (r.top + window.pageYOffset) - this.border, 10)
    };
    return coords;
};

Canvas.prototype.applyStyle = function( style ) {
    var c = this.context;

    c.lineWidth = style.width;
    c.strokeStyle = "#" + style.color;

    // Don't know why I have to do this here with
    // these parameters that are already set, but
    // if I figure it out I can tell paper.js how to
    // similarly fix their stuff.
    c.lineCap = 'round';
    c.lineJoin = 'round';
};

Canvas.prototype.startStroke = function( dot ) {
    var c = this.context,
        r,
        x = dot.x,
        y = dot.y;

    this.applyStyle( dot.brushStyle );
    this.brushStyle = dot.brushStyle;

    // Draw a dot.
    r = c.lineWidth / 2;
    c.fillStyle = c.strokeStyle;
    c.beginPath();
    c.arc( x, y, r, 0, Math.PI * 2 );
    c.fill();
};

Canvas.prototype.stroke = function( seg ) {
    var c = this.context;

    var ix = seg.ix,
        iy = seg.iy,
        fx = seg.fx,
        fy = seg.fy;

    if (this.brushStyle !== seg.brushStyle) {
        this.applyStyle( seg.brushStyle );
        this.brushStyle = seg.brushStyle;
    }

    // Make it so, Number One.
    c.beginPath();
    c.moveTo( ix, iy );
    c.lineTo( fx, fy );
    c.stroke();
};

Canvas.prototype.clear = function() {
    var c = this.context;

    c.fillStyle = "#" + this.backgroundColor;
    c.fillRect( 0, 0, this.width, this.height );
};


// -------------------- wrapper for DOM color panels --------------------------

function ColorPanels( DOMContainer, DOMTitleSpan, title, colors ) {
    this.DOMContainer = DOMContainer;
    this.DOMTitleSpan = DOMTitleSpan;
    this.template = _.template($('#colorPanelsTemplate').html());

    this.populate( title, colors );
}

ColorPanels.prototype.getDOMElmntClass = function( colorPanelIdx ) {
    return 'color-' + colorPanelIdx;
};

ColorPanels.prototype.populate = function( title, colors ) {
    var i, len;
    var newLength, oldLength;
    var newColorPanels;
    var DOMElmntClassObjects = [];
    var newDOMElmntClassObjects;

    var $container = $( this.DOMContainer );
    var $titleSpan = $( this.DOMTitleSpan );

    // Make the array of new DOM classes.
    for (i = 0, len = colors.length; i < len; i++) {
        DOMElmntClassObjects.push( {klass: 'color-' + i} );
    }

    // Set the title for this palette of colors.
    $titleSpan.text( title );

    oldLength = $container.children().length;
    newLength = DOMElmntClassObjects.length;

    // Take away some if needed.
    for (i = oldLength; i > newLength; i--) {
        $container.children(':last-child').remove();
    }

    // Add some if needed. (Will automatically be transparent.)
    var template = this.template;
    newDOMElmntClassObjects = DOMElmntClassObjects.slice(oldLength, newLength);
    var html = newDOMElmntClassObjects.map(function(classObject) {
        return template(classObject);
    }).join('\n');
    $container.append(html);

    // Now go through and set the new colors.
    $container.children().each( function( i ) {
        this.style.backgroundColor = '#' + colors[i];
    });
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

    var $container = $( this.DOMContainer );
    var $titleSpan = $( this.DOMTitleSpan );

    $titleSpan.text( paletteList.keywords );

    var template = this.template;
    var html = paletteList.data.map(function(palette) {
        return template(palette);
    }).join('\n');
    $container.empty().append(html);

    // Show it.
    $container.parent()[0].style.display = 'block';
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




// Data

var paletteList;
var mainPalette;
var Brush;
var brushes;

// DOM stuff

var theStatus;
var instructionBox;
var canvas;
var colorPanels;
var palettesColumn;

var instantiateData = function(config) {

    // Initialize paletteList.
    paletteList = new models.PaletteList();

    // Initialize mainPalette.
    mainPalette = new models.Palette(
        config.DEFAULT_PALETTE_TITLE,
        config.DEFAULT_PALETTE_COLORS,
        config.SMALL_BRUSH_WIDTH,
        config.LARGE_BRUSH_WIDTH,
        config.DEFAULT_BRUSH_SIZE,
        config.DEFAULT_COLOR_PANEL_INDEX
    );

    // Initialize currentBrush.
    currentBrush = new models.Brush(
        mainPalette.activeStyle()
    );

    // Initialize the hash of brushes that will be used
    // by all the users on the canvas
    brushes = {};

};

var instantiateDOMStuff = function(config) {
    var q = document.querySelector.bind(document);
    var statusReportEl =    q('.status-report'),
        canvasEl =          q('.canvas'),
        colorPanelsEl =     q('.color-panels'),
        colorsTitleEl =     q('.current-palette-title'),
        palettesColumnEl =  q('.palette-list'),
        palettesTitleEl =   q('.successful-keywords'),
        instructionsLink =  q('.instructions-link'),
        instructionsEl =    q('.instructions'),
        instructionsClose = q('.close');

    // Initialize status reporting.
    theStatus = new views.TheStatus( statusReportEl );

    // Initialize instruction box.
    instructionBox = new views.PopupBox( instructionsLink, instructionsEl, instructionsClose );

    // Initialize canvas.
    canvas = new views.Canvas( canvasEl, config.CANVAS_WIDTH, config.CANVAS_HEIGHT,
                             config.CANVAS_BACKGROUND_COLOR );

    // Load the colors into the DOM.
    colorPanels = new views.ColorPanels ( colorPanelsEl, colorsTitleEl,
                                        config.DEFAULT_PALETTE_TITLE, config.DEFAULT_PALETTE_COLORS );

    // Initialize empty palettesColumn object.
    palettesColumn = new views.PalettesColumn( palettesColumnEl, palettesTitleEl );

};

// -- the event handler for requesting data from colourlovers.com

var requestFromColourloversAPI = function() {
    var encodedKeywords;
    var colourLoversScript;
    var searchURL;

    var searchField = $('.search-field' );
    var keywords = searchField.val();

    // if the user typed anything
    if (keywords) {
        paletteList.keywords = keywords;
        searchField.val( '' );

        theStatus.report( "Loading..." );

        // First overwrite any previous script tags with the class 'colourLoversUrl',
        // than create the new one that makes the next http request to colourlovers.com.

        if ( $('.colourLoversUrl').length > 0 ) {
            $('.colourLoversUrl').remove();
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
    $('.colourLoversUrl').on('error', function () {

        // extract the search string from the colourlovers.com request url.
        keywords = $( this ).attr( 'src' ).replace( /(.*?keywords=search\+)(.*?)(&.*)/, '$2' );

        // unescape (changes plusses to spaces)
        keywords = keywords.replace( /\+/g, ' ' );

        theStatus.report( 'Unable to load palettes for the keyword(s) "' + keywords + '." ' +
                               'Probably a problem with either the colourlovers.com website or your internet connection.' );
    });
};

var setMiscellaneousUserControls = function() {

    // Set active brush size HTML select element,
    // because Firefox preserves state even when it's refreshed.
    $('.brush-size').val( mainPalette.activeSize() );

    // bind the event handlers for toggling the brush size and
    // entering search keywords. Also for toggling the clear and
    // restore canvas buttons, which are dynamically swapped out
    // for each other. Also for the instruction link.

    instructionBox.init();

    $('.clear-canvas').on('click', function( event ) {
        canvas.clear();
    });

    $('.brush-size').change( function() {
        mainPalette.activeSize( this.value );
        currentBrush.style = mainPalette.activeStyle();
    });

    $('.brush-size').on('mousedown', function(event) {
        event.stopPropagation();
    });

    $('.search-button').click( function( event ) {
        requestFromColourloversAPI();
    });
    $('.search-field').keydown( function( event ) {
        var code = event.which;
        if (code == 13) {
            event.preventDefault();
            requestFromColourloversAPI();
        }
    });
};



// ------------- DRAWING FUNCTIONS, FOLLOWED BY EVENT LISTENERS FOR THEM. -----------

var startDraw = function( event ) {
    var p = canvas.getPos( event );
    var x = p.x;
    var y = p.y;

    canvas.startStroke({ x: x, y: y, brushStyle: currentBrush.style });

    currentBrush.x = x;
    currentBrush.y = y;
    currentBrush.drawing = true;
};


var continueDraw = function( event ) {
    var p = canvas.getPos( event );
    var fx = p.x;
    var fy = p.y;

    var ix = currentBrush.x;
    var iy = currentBrush.y;
    canvas.stroke({ ix: ix, iy: iy, fx: fx, fy: fy, brushStyle: currentBrush.style });

    currentBrush.x = fx;
    currentBrush.y = fy;
}

var stopDraw = function() {
    currentBrush.drawing = false;
}

var toggleDraw = function( event ) {
    if (currentBrush.drawing) {
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

    $(document).on('mousedown', function( event ) {
        // Don't treat this as a drawing click if
        // someone just clicked the clear button.
        if (event.which === LEFT_BUTTON && !$(event.target).hasClass('clear-button')) {
            var action = event.altKey ? toggleDraw : startDraw;
            action( event );
        }
    });
     $(document).on('mousemove', function( event ) {
        if (currentBrush.drawing) {
            continueDraw( event );
        }
    });
    $(document).on('mouseup', function( event ) {
        if (event.which === LEFT_BUTTON && !event.altKey) {
            stopDraw();
        }
    });
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

    // Populate the color panels.
    colorPanels.populate( mainPalette.title, mainPalette.colors );

    // Reset the mainPalette's activeColorPanelIdx if it was set to a panel that no longer
    // exists (because a new palette has fewer colors than the old one)
    if (!mainPalette.activeStyle()) {
        mainPalette.activeColorPanelIdx( 0 );
    }

    // Now make the already selected one pink.
    panel = $( '.' + colorPanels.getDOMElmntClass( mainPalette.activeColorPanelIdx()) );
    this.highlightElement( panel );

    // Add the event listeners.
    this.addEventListeners( colorPanels, function( element, i ) {

        // Update mainPalette and currentBrush.
        mainPalette.activeColorPanelIdx( i );
        currentBrush.style = mainPalette.activeStyle();

        // Turn the selected one pink.
        colorPanelsController.highlightElement( element );
    });
};

var palettesColumnController = new ElementsController();

palettesColumnController.init = function() {
    // Populate the palettes column.
    palettesColumn.populate( paletteList );

    // Adjust its height based on the height of the canvas.
    // TODO: Find a way to have this not happen, using CSS.
    // For one thing, we're 'illegally' using the private property canvas.height
    $( palettesColumn.DOMContainer ).parent().css( 'height', '' + (305 + canvas.height) );

    // Widen the left column.
    $( palettesColumn.DOMContainer ).parent().css( {'width': '220px', 'margin-left': '15px'} );

    // Slide the main box over.
    $( '.main-box-wrapper' ).css ( 'margin-left', 240 );

    // Add the event handlers.
    this.addEventListeners( palettesColumn, function( element, i ) {

        // Load the mainPalette with the new colors.
        var title = paletteList.data[i].title;
        var colors = paletteList.data[i].colors;
        mainPalette.load( title, colors );
        colorPanelsController.init();
        currentBrush.style = mainPalette.activeStyle();

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
    setMouseEventListeners();
};

// Make it so.
$(initialize);




