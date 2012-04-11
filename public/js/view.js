// Dependency: util.js

;

var APP = (typeof APP !== 'undefined') ? APP : {};
APP.View = (typeof APP.View !== 'undefined') ? APP.View : 

(function() {
    
    var util = APP.util;
    
    var TheStatus,
        Canvas,
        ColorPanels,
        PalettesColumn,
        ClearRestoreCanvas;
        
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

    // ----- Clear or Restore canvas button (toggles between the two). ---------
    
    ClearRestoreCanvas = function( element ) {
        this._jQElement = $( element );
    };
    
    ClearRestoreCanvas.prototype.showClear = function() {
        var el = this._jQElement;
        el.addClass('clear-canvas');
        el.removeClass('restore-canvas');
        el.val('Clear canvas');
    }

    ClearRestoreCanvas.prototype.showRestore = function() {
        var el = this._jQElement;
        el.addClass('restore-canvas');
        el.removeClass('clear-canvas');
        el.val('Restore canvas');
    }

    // --------------------- Wrapper for DOM Canvas ----------------------------

    Canvas = function( DOMElement, width, height, backgroundColor ) {
        var borderLeftPx = (window.getComputedStyle) ? 
                            window.getComputedStyle( DOMElement, null )['border-left-width'] :
                            DOMElement.currentStyle.border; // TODO: check in IE6, IE7, IE8
                            
        this.DOMElement = DOMElement;
        this.drawing = false;

        this._context = DOMElement.getContext( "2d" );
        
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
    };

    Canvas.prototype.getPos = function( event ) {
        event = event || window.event; // This is for IE's global window.event

        var r = this.DOMElement.getBoundingClientRect();
        var coords = {
          // No attempt to cater to IE here (doesn't support
          // pageX/YOffset). We'll try to do that later.

          x : event.pageX - (r.left + window.pageXOffset) - this._border,
          y : event.pageY - (r.top + window.pageYOffset) - this._border
        };
        return coords;
    };

    Canvas.prototype._applyStyle = function( style ) {
        var c = this._context;

        c.lineWidth = style.width;
        c.strokeStyle = "#" + style.color;
        
        // Don't know why I have to do this here with 
        // these parameters that are already set, but
        // if I figure it out I can tell paper.js how to 
        // similarly fix their stuff.
        c.lineCap = 'round';
        c.lineJoin = 'round';
    };
    
    // The 'segment' argument is an object containing all the 
    // properties of BrushStyle object, plus the two starting 
    // and two ending coordinates of the segment.
    // REDO THIS COMMENT TO REFLECT THE NEW REALITY.
    
    Canvas.prototype.stroke = function( segment ) {
        var c = this._context; 
        var r;
            
        var ix = segment.ix,
            iy = segment.iy,
            fx = segment.fx,
            fy = segment.fy,
            color = segment.color;

        // load the style if we've been sent a new one at all,
        // otherwise we're supposed to go with the one we already have loaded.
        if (segment.color) {
          this._applyStyle( segment );
        }

        // Move the brush if it should be moved, 
        // (indicated by two sets of identical coordinates)
        if (ix !== fx || iy !== fy) {
            
            // Reset the brush if we've been sent initial coordinates.
            if (ix != null) {
                c.beginPath();
                c.moveTo( ix, iy );              
            }
            c.lineTo( fx, fy );
            c.stroke();              
        } 
        
        // If it's not a move but just a click,
        // draw a dot the diameter of the brush.
        else {
            r = c.lineWidth / 2;
            c.fillStyle = c.strokeStyle;
            c.beginPath();
            c.moveTo( ix, iy );
            c.arc( ix, iy, r, 0, Math.PI * 2 );
            c.fill();
            // Clear path for next move.
            c.beginPath();
        }
    };

    Canvas.prototype.clear = function() {
        var c = this._context;

        c.fillStyle = "#" + this._backgroundColor;
        c.fillRect( 0, 0, this._width, this._height );
    };
    
    Canvas.prototype.drawHistory = function( history ) {
        var c = this._context;
        var i, len;
        
        this.clear();
        
        // This next loop checks for the existence of segment.fx
        // because that will tell us whether it's an initial dot or a continuing stroke
        // (ix stands for initial x and fx stands for final x).
        
        for (var i = 0, len = history.length; i < len; i++) {
            this.stroke(history[i]);
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
            clearRestoreElement =   $( pageSelector + ' .clear-restore-button')[0];
            canvasElement =         $( pageSelector + ' .canvas' )[0],
            colorPanelsElement =    $( pageSelector + ' .color-panels' )[0],
            colorsTitleElement =    $( pageSelector + ' .current-palette-title' )[0],
            palettesColumnElement = $( pageSelector + ' .palette-list' )[0],
            palettesTitleElement =  $( pageSelector + ' .successful-keywords' )[0];
            
        // Initialize status reporting.
        theStatus = new TheStatus( statusReportElement );
        
        // Initialize canvas clearing and restoring button.
        clearRestoreCanvas = new ClearRestoreCanvas( clearRestoreElement );
        
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
        this.clearRestoreCanvas = clearRestoreCanvas;
        this.canvas = canvas;
        this.colorPanels = colorPanels;
        this.palettesColumn = palettesColumn;
        this.pageId = pageId;
    };
    
    //----------- MODULE INTERFACE ----------------

    return init;
})();