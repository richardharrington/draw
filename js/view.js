// Dependency: util.js

;

var APP = (typeof APP !== 'undefined') ? APP : {};
APP.view = (typeof APP.view !== 'undefined') ? APP.view : 

(function() {
    
    var util = APP.util;
    
    var TheStatus,
        Canvas,
        ColorPanels,
        PalettesColumn;
        
    var init;

    var instances = [];
    var instanceNumber = 0;
    var absolutePageTop = 0;

    // ------------------ Status reporting mechanism. --------------------------
    
    // (would be called just "Status," but one of the browsers
    // doesn't like that. I forget which one.)

    TheStatus = function( element ) {
        this.jQElement = $( element );
    };

    TheStatus.prototype.report = function( str ) {  

        // If we've got something to report
        if (arguments.length) {
            this.jQElement.text( str );

        // No news is good news.
        } else {
            this.jQElement.html( '&nbsp;' );
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
        
        $( DOMElement ).attr( 'width', width );
        $( DOMElement ).attr( 'height', height );
                
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
        
        var jQContainer = $( this.DOMContainer );
        var jQTitleSpan = $( this.DOMTitleSpan );
        
        for (i = 0, len = colors.length; i < len; i++) {
            elementKlasses.push( {klass: 'color-' + i} );
        }

        // Now empty the old color panels, then load the new ones 
        // into the DOM. Create the div tags with the 
        // jQuery template, then add background colors.
        
        // THIS SHOULD BE CHANGED TO RE-BACKGROUND-COLORING
        // WHAT WAS ALREADY THERE, INSTEAD OF EMPTYING AND RE-DRAWING. 

        jQContainer.empty();
        jQTitleSpan.text( title );

        $( "#currentPaletteTemplate" ).
                tmpl( elementKlasses ).
                appendTo( jQContainer ).
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
    
        var jQContainer = $( this.DOMContainer );
        var jQTitleSpan = $( this.DOMTitleSpan );
        
        jQTitleSpan.text( palettes.keywords );
        
        jQContainer.empty();
        $( '#palettesTemplate' ).tmpl( palettes.data ).appendTo( jQContainer );
    
        jQContainer.show();
        jQTitleSpan.parent().show();
    };
    
    init = function( args ) {
        var theStatus,
            canvas,
            colorPanels,
            palettesColumn;
            
        var pageSelector = '#page-' + instanceNumber;
            
        var statusReportElement =   $( pageSelector + ' .status-report' )[0], 
            canvasElement =         $( pageSelector + ' .canvas' )[0],
            colorPanelsElement =    $( pageSelector + ' .color-container' )[0],
            colorsTitleElement =    $( pageSelector + ' .current-palette-title' )[0],
            palettesColumnElement = $( pageSelector + ' .palette-list' )[0],
            palettesTitleElement =  $( pageSelector + ' .successfulKeywords' )[0];
            
        // Initialize status reporting.
        theStatus = new TheStatus( statusReportElement );
        
        // Initialize canvas.
        canvas = new Canvas( canvasElement, args.canvasWidth, args.canvasHeight, 
                             args.canvasBackgroundColor, args.brushStyle, args.colorPanelIdx );
        
        // Load the colors into the DOM.
        colorPanels = new ColorPanels ( colorPanelsElement, colorsTitleElement, 
                                        args.paletteTitle, args.paletteColors );
                                           
        // Initialize empty palettesColumn object.
        palettesColumn = new PalettesColumn( palettesColumnElement, palettesTitleElement );

        instances[instanceNumber] = {
            theStatus: theStatus,
            canvas: canvas,
            colorPanels: colorPanels,
            palettesColumn: palettesColumn
        };
        
        // Little hack here to make everything space well vertically, 
        // probably should be tied to some sort of object. Or I should
        // just have a better understanding of CSS. Yeah, that would help.
        
        absolutePageTop += (instanceNumber === 0) ? 0 : 
            APP.view.instances[instanceNumber - 1].canvas.height + 460;
        
        var pageSelector = '#page-' + instanceNumber;
        $( pageSelector ).css( 'top', '' + absolutePageTop + 'px' );

        // Increment the main instance number.
        
        instanceNumber += 1;
    };
    
    //----------- MODULE INTERFACE ----------------

    return {
        init: init,
        instances: instances
    };
})();