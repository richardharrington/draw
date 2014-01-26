define([
    'jquery',
    'util',
    'lodash'
], function(
    $,
    util,
    _
) {


    // ------------------ Status reporting mechanism. --------------------------

    // (would be called just "Status," but one of the browsers
    // doesn't like that. I forget which one.)

    function TheStatus( element ) {
        this._jQElement = $( element );
    }

    TheStatus.prototype.report = function( str ) {

        // If we've got something to report
        if (arguments.length) {
            this._jQElement.text( str );

        // No news is good news.
        } else {
            this._jQElement.html( '&nbsp;' );
        }
    };

    function PopupBox( linkEl, displayEl, closeEl ) {
        this._jQLink = $(linkEl);
        this._jQDisplay = $(displayEl);
        this._jQClose = $(closeEl);
    }

    PopupBox.prototype.init = function() {
        var self = this;
        var box = this._jQDisplay;
        this._jQLink.on('click', function( event ) {
            self._jQDisplay.css("display", "block");
            setTimeout(function() {
                self._jQDisplay.css("opacity", "1");
            }, 50);
        });
        this._jQClose.on('click', function() {
            self._jQDisplay.css("opacity", "0");
            setTimeout(function() {
                self._jQDisplay.css("display", "none");
            }, 550);
        });
    };


    // --------------------- Wrapper for DOM Canvas ----------------------------

    function Canvas( DOMElement, width, height, backgroundColor ) {
        var borderLeftPx = (window.getComputedStyle) ?
                            window.getComputedStyle( DOMElement, null )['border-left-width'] :
                            DOMElement.currentStyle.border; // TODO: check in IE6, IE7, IE8

        this.DOMElement = DOMElement;
        this._context = DOMElement.getContext( "2d" );

        // Stored as we go along so we don't have to constantly
        // change brush styles
        this._brushStyle = null;

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
    }

    Canvas.prototype = {
        getPos: function( event ) {
            event = event || window.event; // This is for IE's global window.event

            var r = this.DOMElement.getBoundingClientRect();
            var coords = {
              // No attempt to cater to IE here (I've heard they don't support
              // pageX/YOffset). We'll try to do that later.
              // But actually this seems to work in IE9.

              x : parseInt(event.pageX - (r.left + window.pageXOffset) - this._border, 10),
              y : parseInt(event.pageY - (r.top + window.pageYOffset) - this._border, 10)
            };
            return coords;
        },

        _applyStyle: function( style ) {
            var c = this._context;

            c.lineWidth = style.width;
            c.strokeStyle = "#" + style.color;

            // Don't know why I have to do this here with
            // these parameters that are already set, but
            // if I figure it out I can tell paper.js how to
            // similarly fix their stuff.
            c.lineCap = 'round';
            c.lineJoin = 'round';
        },

        startStroke: function( dot ) {
            var c = this._context,
                r,
                x = dot.x,
                y = dot.y;

            if (this._brushStyle !== dot.brushStyle) {
                this._applyStyle( dot.brushStyle );
                this._brushStyle = dot.brushStyle;
            }

            // Draw a dot.
            r = c.lineWidth / 2;
            c.fillStyle = c.strokeStyle;
            c.beginPath();
            c.arc( x, y, r, 0, Math.PI * 2 );
            c.fill();
        },

        stroke: function( seg ) {
            var c = this._context;
            var r;

            var ix = seg.ix,
                iy = seg.iy,
                fx = seg.fx,
                fy = seg.fy;

            if (this._brushStyle !== seg.brushStyle) {
                this._applyStyle( seg.brushStyle );
                this._brushStyle = seg.brushStyle;
            }

            // Make it so, Number One.
            c.beginPath();
            c.moveTo( ix, iy );
            c.lineTo( fx, fy );
            c.stroke();
        },

        clear: function() {
            var c = this._context;

            c.fillStyle = "#" + this._backgroundColor;
            c.fillRect( 0, 0, this._width, this._height );
        }
    };

    // -------------------- wrapper for DOM color panels --------------------------

    function ColorPanels( DOMContainer, DOMTitleSpan, title, colors ) {
        this.DOMContainer = DOMContainer;
        this.DOMTitleSpan = DOMTitleSpan;
        this.template = _.template($('#colorPanelsTemplate').html());

        this.populate( title, colors );
    }

    ColorPanels.prototype = {
        getDOMElmntClass: function( colorPanelIdx ) {
            return 'color-' + colorPanelIdx;
        },

        populate:function( title, colors ) {
            var i, len;
            var newLength, oldLength;
            var newColorPanels;
            var DOMElmntClassObjects = [];
            var newDOMElmntClassObjects;

            var jQContainer = $( this.DOMContainer );
            var jQTitleSpan = $( this.DOMTitleSpan );

            // Make the array of new DOM classes.
            for (i = 0, len = colors.length; i < len; i++) {
                DOMElmntClassObjects.push( {klass: 'color-' + i} );
            }

            // Set the title for this palette of colors.
            jQTitleSpan.text( title );

            oldLength = jQContainer.children().length;
            newLength = DOMElmntClassObjects.length;

            // Take away some if needed.
            for (i = oldLength; i > newLength; i--) {
                jQContainer.children(':last-child').remove();
            }

            // Add some if needed. (Will automatically be transparent.)
            var template = this.template;
            newDOMElmntClassObjects = DOMElmntClassObjects.slice(oldLength, newLength);
            var html = _.map(newDOMElmntClassObjects, function(classObject) {
                return template(classObject);
            }).join('\n');
            jQContainer.append(html);

            // Now go through and set the new colors.
            jQContainer.children().each( function( i ) {
                this.style.backgroundColor = '#' + colors[i];
            });
        }
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

        var jQContainer = $( this.DOMContainer );
        var jQTitleSpan = $( this.DOMTitleSpan );

        jQTitleSpan.text( paletteList.keywords );

        var template = this.template;
        var html = _.map(paletteList.data, function(palette) {
            return template(palette);
        }).join('\n');
        jQContainer.empty().append(html);

        // Show it.
        jQContainer.parent()[0].style.display = 'block';
    };

    // -- MODULE INTERFACE -- //

    return {
        TheStatus: TheStatus,
        PopupBox: PopupBox,
        Canvas: Canvas,
        ColorPanels: ColorPanels,
        PalettesColumn: PalettesColumn
    };

});