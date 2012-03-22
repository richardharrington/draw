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
        this._history = [];

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

    Canvas.prototype._applyStyle = function( segment ) {
        var c = this._context;
        
        c.lineWidth = segment.width;
        c.strokeStyle = "#" + segment.color;
        c.lineCap = segment.lineCap;
        c.lineJoin = segment.lineJoin;
    };
    
    Canvas.prototype.startStroke = function( brush ) {
        var brushStyle = brush.style;
        var segment = {
            lineCap: brushStyle.lineCap,
            lineJoin: brushStyle.lineJoin,
            color: brushStyle.color,
            width: brushStyle.width,
            ix: brush.x,
            iy: brush.y,
        };
        this._drawDot( segment );
        this._history.push( segment );
    };

    Canvas.prototype._drawDot = function( segment ) {
        var c = this._context;
        var x = segment.ix;
        var y = segment.iy;

        // load the styles.
        this._applyStyle( segment );
        
        // draw a dot the diameter of the brush
        var r = c.lineWidth / 2;
        c.fillStyle = c.strokeStyle;
        c.beginPath();
        c.moveTo( x, y );
        c.arc( x, y, r, 0, Math.PI * 2 );
        c.fill();
    };
    
    Canvas.prototype.stroke = function( brush, x, y ) {
        var brushStyle = brush.style;
        var segment = {
            lineCap: brushStyle.lineCap,
            lineJoin: brushStyle.lineJoin,
            color: brushStyle.color,
            width: brushStyle.width,
            ix: brush.x,
            iy: brush.y,
            fx: x,
            fy: y            
        };
        this._strokeSegment( segment );
        this._history.push( segment );
        
        // update brush position.
        brush.x = x;
        brush.y = y;
    };

    Canvas.prototype._strokeSegment = function( segment ) {
        var c = this._context;
        var ix = segment.ix,
            iy = segment.iy,
            fx = segment.fx,
            fy = segment.fy;
        
        // load the styles.
        this._applyStyle( segment );
        
        // go to the location where the brush was last seen.
        c.beginPath();
        c.moveTo( ix, iy );
        
        // draw to new coordinates.
        c.lineTo( fx, fy );
        c.stroke();
    };

    Canvas.prototype.clear = function() {
        var c = this._context;

        c.fillStyle = "#" + this._backgroundColor;
        c.fillRect( 0, 0, this._width, this._height );
    };
    
    Canvas.prototype.restoreHistory = function() {
        var c = this._context;
        var history = this._history;
        var i, len;
        var segment;
        
        this.clear();
        
        // This next loop checks for the existence of segment.fx
        // because that will tell us whether it's an initial dot or a continuing stroke
        // (ix stands for initial x and fx stands for final x).
        
        for (var i = 0, len = history.length; i < len; i++) {
            segment = history[i];
            if (segment.fx == null) {
                this._drawDot( segment );
            } else {
                this._strokeSegment( segment )
            }
        }
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