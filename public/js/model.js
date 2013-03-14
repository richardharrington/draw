// Dependency: util.js

;

var APP = (typeof APP !== 'undefined') ? APP : {};
APP.Model = (typeof APP.Model !== 'undefined') ? APP.Model : 

(function() {
    
    var util = APP.util;

    var PaletteList,
        Palette,
        Brush;
        
    var init;

    // --- A note about PaletteList, Palette and Brush:

    // There is one instance each of each of these objects for each
    // instance of the app on the page. An array with the default settings
    // for each instance can be found in the config.js file.    

    // --- Set up the Palette constructor.

    Palette = function( args ) {
        this._maxColors = args.maxColors;
        this._smallBrushWidth = args.smallBrushWidth;
        this._largeBrushWidth = args.largeBrushWidth;
        
        this.load( args.title, args.colors );
        this.activeSize( args.activeSize );
        this.activeColorPanelIdx( args.activeColorPanelIdx );
    };

    // Load in a new set of colors with their title.

    Palette.prototype.load = function( title, colors ) {
        var i, len;
        var color;
        var small, large;
        
        // We can only fit this.maxColors number of panels,
        // so truncate the array if necessary. 
        this.colors = colors.slice( 0, this._maxColors );
        this.title = title; 
        
        this._brushStyles = [];
        
        // brushStyles alternate between small brushes and large brushes.    
        for (i = 0, len = colors.length; i < len; i++) {
            this._brushStyles.push({
                color: colors[i],
                width: this._smallBrushWidth
            });
            this._brushStyles.push({
                color: colors[i],
                width: this._largeBrushWidth                
            });
        }
    };
    
    // styleIdx is a number that has two values
    // for every one that colorPanelIdx has,
    // because styleIdx takes into account
    // whether a brush is small or large.

    // activeSize and activeColorPanelIdx are overloaded as both 
    // getters and setters, depending on the number of arguments.
    
    // activeStyle is just a getter.
    
    Palette.prototype.activeStyle = function( size, colorPanelIdx ) {
        return this._brushStyles[ this._styleIdx ];
    };
    
    Palette.prototype.activeSize = function( size /* optional */) {
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
    };
    
    Palette.prototype.activeColorPanelIdx = function( colorPanelIdx /* optional */) {
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
    };
    
    // --- Set up a brush.

    Brush = function( brushStyle ) {
        this.drawing = false;
        this.style = brushStyle;
        // also will set this.x and this.y, dynamically
    };

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
    

    // This function does a deep copy of data from the feed
    // downloaded from the colourlovers website into the paletteList object.
    
    PaletteList = function() {};
    PaletteList.MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];

    PaletteList.prototype.load = function( data ) {
        if (!data || data.length === 0) {
            return false;
        }
        
        var i, len;
        var date;
        var self = this;
        
        this.data = [];
        
        for (i = 0, len = data.length; i < len; i++) {
            (function( idx ) {
                var entry;
                var desc;
                var newPalette = {};

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
                newPalette.dateCreated = PaletteList.MONTHS[date.getMonth()] + " " + 
                                         date.getDate() + ", " + 
                                         date.getFullYear();
            
                // Many of the descriptions on colourlovers.com
                // are long garbage strings of html, so exclude those
                // by checking if the string is too long.
            
                desc = newPalette.description;
                newPalette.description = (desc.length < 200) ? desc : "";
            
                // Load the new palette into the main database object.
            
                self.data[idx] = newPalette;
            
            }( i ));
        }
        return true;
    };
    
    init = function( config ) {
        var paletteList,
            localPalette,
            localBrush,
            currentBrush,
            brushes;
            
        // Initialize paletteList.
        paletteList = new PaletteList();
        
        // Initialize localPalette.
        localPalette = new Palette({
            title:               config.DEFAULT_PALETTE_TITLE,
            colors:              config.DEFAULT_PALETTE_COLORS, 
            maxColors:           config.MAX_COLORS,
            smallBrushWidth:     config.SMALL_BRUSH_WIDTH, 
            largeBrushWidth:     config.LARGE_BRUSH_WIDTH,
            activeSize:          config.DEFAULT_BRUSH_SIZE,
            activeColorPanelIdx: config.DEFAULT_COLOR_PANEL_INDEX
        });

        // Initialize localBrush.
        localBrush = new Brush(
            localPalette.activeStyle()
        );
        
        // Initialize the hash of brushes that will be used
        // by all the users on the canvas
        brushes = {};
        
        // Initialize currentBrush which is used to compare 
        // to brushStyle ids that come down from the server.
        currentBrush = {};
        currentBrush.id = 0;
        
        //----------- MODULE INTERFACE ----------------

        this.paletteList = paletteList;
        this.localPalette = localPalette;
        this.localBrush = localBrush,
        this.currentBrush = currentBrush,
        this.brushes = brushes;
        
    };

    //----------- MODULE INTERFACE ----------------
    
    return init;  
})();
