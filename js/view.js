// Dependency: util.js

;

var APP = (typeof APP !== 'undefined') ? APP : {};
APP.View = (typeof APP.View !== 'undefined') ? APP.View : 

(function() {
    
    var util = APP.util;
    
    var TheStatus,
        Canvas,
        ColorPanels,
        PalettesColumn;
        
    var init;

    // ------------------ Status reporting mechanism. --------------------------
    
    // (would be called just "Status," but one of the browsers
    // doesn't like that. I forget which one.)

    TheStatus = function( element ) {
        this._jQElement = $( element );
    };

    TheStatus.prototype.report = function( str ) {  

        // If we've got something to report
        if (arguments.length) {
            this._jQElement.text( str );

        // No news is good news.
        } else {
            this._jQElement.html( '&nbsp;' );
        }

    }

    // --------------------- Wrapper for DOM Canvas ----------------------------

    Canvas = function( DOMElement, width, height, backgroundColor ) {
        var borderLeftPx = (window.getComputedStyle) ? 
                            window.getComputedStyle( DOMElement, null )['border-left-width'] :
                            DOMElement.currentStyle.border; // TODO: check in IE6, IE7, IE8
                            
        this.DOMElement = DOMElement;
        this.drawing = false;

        this._context = DOMElement.getContext( "2d" );
        this._width = width;
        this._height = height;
        this._backgroundColor = backgroundColor;

        this._border = (borderLeftPx) ? parseInt(borderLeftPx, 10) : 16;
        
        $( DOMElement ).attr( 'width', width );
        $( DOMElement ).attr( 'height', height );
                
        this.clear();
    };

    Canvas.prototype.getMousePos = function( event ) {
        event = event || window.event; // This is for IE's global window.event

        var r = this.DOMElement.getBoundingClientRect();
        var coords = {
            x : event.clientX - r.left - this._border,
            y : event.clientY - r.top - this._border
        };
        return coords;
    };

    Canvas.prototype._applyStyle = function( brushStyle ) {
        var c = this._context;
        
        c.lineWidth = brushStyle.width;
        c.strokeStyle = "#" + brushStyle.color;
        c.lineCap = brushStyle.lineCap;
        c.lineJoin = brushStyle.lineJoin;
    };

    Canvas.prototype.startStroke = function( brush ) {
        var c = this._context;
        var x = brush.x;
        var y = brush.y;

        // save fillStyle on stack
        var savedFillStyle = c.fillStyle;

        // load the brushstyle.
        this._applyStyle( brush.style );
        
        // draw a dot the diameter of the brush
        var r = c.lineWidth / 2;
        c.fillStyle = c.strokeStyle;
        c.beginPath();
        c.moveTo( x, y );
        c.arc( x, y, r, 0, Math.PI * 2 );
        c.fill();

        // restore fillStyle 
        c.fillStyle = savedFillStyle;
    };

    Canvas.prototype.stroke = function( brush, x, y ) {
        var c = this._context;
        var oldX = brush.x,
            oldY = brush.y;

        // load the brushstyle.
        this._applyStyle( brush.style );
        
        // go to the location where the brush was last seen.
        c.beginPath();
        c.moveTo( oldX, oldY );
        
        // draw to new coordinates.
        c.lineTo( x, y );
        c.stroke();
        
        //update brush position.
        brush.x = x;
        brush.y = y;
    };

    Canvas.prototype.clear = function() {
        var c = this._context;

        c.fillStyle = "#" + this._backgroundColor;
        c.fillRect( 0, 0, this._width, this._height );
    };
    
    // -------------------- wrapper for DOM color panels --------------------------
    
    ColorPanels = function( DOMContainer, DOMTitleSpan, title, colors ) {
        this.DOMContainer = DOMContainer;
        this.DOMTitleSpan = DOMTitleSpan;
        
        this.populate( title, colors );
    };
    
    ColorPanels.prototype.populate = function( title, colors ) {
        var i, len;
        var newLength, oldLength;
        var newColorPanels;
        var DOMElmntClasses = [];
        var newDOMElmntClasses;
        
        var jQContainer = $( this.DOMContainer );
        var jQTitleSpan = $( this.DOMTitleSpan );
        
        // Make the array of new DOM classes.
        for (i = 0, len = colors.length; i < len; i++) {
            DOMElmntClasses.push( {klass: 'color-' + i} );
        }
        
        // Set the title for this palette of colors.
        jQTitleSpan.text( title );
        
        oldLength = jQContainer.children().length;
        newLength = DOMElmntClasses.length;
        
        // Take away some if needed.
        for (i = oldLength; i > newLength; i--) {
            jQContainer.children(':last-child').remove();
        }
        
        // Add some if needed. (Will automatically be transparent.)
        newDOMElmntClasses = DOMElmntClasses.slice(oldLength, newLength);
        if (newDOMElmntClasses.length > 0) {
            newColorPanels = $( "#colorPanelsTemplate" )
                    .tmpl( newDOMElmntClasses )
                    .appendTo( jQContainer );
        }
                
        // Now go through and set the new colors.
        jQContainer.children().each( function( i ) {
            this.style.backgroundColor = '#' + colors[i];
        });
    };
    
    ColorPanels.prototype.getDOMElmntClass = function( colorPanelIdx ) {
        return 'color-' + colorPanelIdx;
    };
    
    // -------------------- wrapper for DOM palettes column --------------------------
    
    PalettesColumn = function( DOMContainer, DOMTitleSpan ) {
        this.DOMContainer = DOMContainer;
        this.DOMTitleSpan = DOMTitleSpan;
    };
    
    PalettesColumn.prototype.populate = function( paletteList ) {
        
        // In the left column, show the heading with the keywords, and all the palettes below it,
        // along with their click handlers for loading colors into the drawing program.
    
        var jQContainer = $( this.DOMContainer );
        var jQTitleSpan = $( this.DOMTitleSpan );

        jQTitleSpan.text( paletteList.keywords );
        
        jQContainer.empty();
        $( '#paletteListTemplate' ).tmpl( paletteList.data ).appendTo( jQContainer );
        
        // Show it.    
        jQContainer.parent()[0].style.display = 'block';
    };
    
    init = function( config, pageNumber ) {

        var theStatus,
            canvas,
            colorPanels,
            palettesColumn;
            
        var pageId = 'page-' + pageNumber;
        var pageSelector = '#' + pageId;
            
        var statusReportElement =   $( pageSelector + ' .status-report' )[0], 
            canvasElement =         $( pageSelector + ' .canvas' )[0],
            colorPanelsElement =    $( pageSelector + ' .color-panels' )[0],
            colorsTitleElement =    $( pageSelector + ' .current-palette-title' )[0],
            palettesColumnElement = $( pageSelector + ' .palette-list' )[0],
            palettesTitleElement =  $( pageSelector + ' .successful-keywords' )[0];
            
        // Initialize status reporting.
        theStatus = new TheStatus( statusReportElement );
        
        // Initialize canvas.
        canvas = new Canvas( canvasElement, config.CANVAS_WIDTH, config.CANVAS_HEIGHT, 
                             config.CANVAS_BACKGROUND_COLOR );
        
        // Load the colors into the DOM.
        colorPanels = new ColorPanels ( colorPanelsElement, colorsTitleElement, 
                                        config.DEFAULT_PALETTE_TITLE, config.DEFAULT_PALETTE_COLORS );
                                           
        // Initialize empty palettesColumn object.
        palettesColumn = new PalettesColumn( palettesColumnElement, palettesTitleElement );

        //----------- MODULE INTERFACE ----------------

        this.theStatus = theStatus;
        this.canvas = canvas;
        this.colorPanels = colorPanels;
        this.palettesColumn = palettesColumn;
        this.pageId = pageId;
    };
    
    //----------- MODULE INTERFACE ----------------

    return init;
})();