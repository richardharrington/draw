define(['util'], function(util) {

    // --- Set up the Palette constructor.

    function Palette( args ) {
        this._maxColors = args.maxColors;
        this._smallBrushWidth = args.smallBrushWidth;
        this._largeBrushWidth = args.largeBrushWidth;

        this.load( args.title, args.colors );
        this.activeSize( args.activeSize );
        this.activeColorPanelIdx( args.activeColorPanelIdx );
    }

    Palette.prototype = {

        // Load in a new set of colors with their title.

        load: function( title, colors ) {

            // We can only fit this.maxColors number of panels,
            // so truncate the array if necessary.
            this.colors = colors.slice( 0, this._maxColors );
            this.title = title;

            // brushStyles alternate between small brushes and large brushes,
            // so create an array with twice as many elements as the colors array.

            this._brushStyles = _.flatten(_.map(colors, function(color) {
                return [
                    { color: color, width: this._smallBrushWidth },
                    { color: color, width: this._largeBrushWidth }
                ];
            }, this));
        },

        // styleIdx is a number that has two values
        // for every one that colorPanelIdx has,
        // because styleIdx takes into account
        // whether a brush is small or large.

        // activeSize and activeColorPanelIdx are overloaded as both
        // getters and setters, depending on the number of arguments.

        // activeStyle is just a getter.

        activeStyle: function( size, colorPanelIdx ) {
            return this._brushStyles[ this._styleIdx ];
        },

        activeSize: function( size /* optional */) {
            var styleIdx = this._styleIdx || 0;
            var oldSize = (styleIdx % 2) ? "large" : "small";

            // get
            if (arguments.length === 0) {
                return oldSize;

            // set
            } else {
                styleIdx += (oldSize === size) ? 0 :
                            (size === "small") ? -1 : 1;
                this._styleIdx = styleIdx;
            }
        },

        activeColorPanelIdx: function( colorPanelIdx /* optional */) {
            var styleIdx = this._styleIdx || 0;
            var oldColorPanelIdx = Math.floor( styleIdx / 2 );

            // get
            if (arguments.length === 0) {
                return oldColorPanelIdx;

            // set
            } else {
                styleIdx += (colorPanelIdx - oldColorPanelIdx) * 2;
                this._styleIdx = styleIdx;
            }
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

    PaletteList.prototype = {

        // This function loads data from the colourlovers website
        // into the paletteList object.

        load: function( data ) {
            if (!data || data.length === 0) {
                return false;
            }

            this.data = _.map(data, function(entry) {
                var newPalette = _.pick(entry,
                    "colors",
                    "imageUrl",
                    "title",
                    "userName",
                    "description",
                    "dateCreated"
                );

                // Now make "dateCreated" a more readable string.

                var date = util.parseSQLDate( newPalette.dateCreated );
                newPalette.dateCreated = MONTHS[date.getMonth()] + " " +
                                         date.getDate() + ", " +
                                         date.getFullYear();


                // Many of the descriptions on colourlovers.com
                // are long garbage strings of html, so exclude those
                // by checking if the string is too long.

                if (newPalette.description.length > 200) {
                    newPalette.description = "";
                }

                return newPalette;
            });

            return true;
        }
    };

    // -- MODULE INTERFACE -- //

    return {
        Palette:     Palette,
        Brush:       Brush,
        PaletteList: PaletteList
    };

});
