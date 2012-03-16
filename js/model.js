// Dependency: util.js

;

var APP = (typeof APP !== 'undefined') ? APP : {};
APP.Model = (typeof APP.Model !== 'undefined') ? APP.Model : 

(function() {
    
    var util = APP.util;

    var BrushStyle,
        brushChildrenProto;

    var Palettes,
        CurrentPalette,
        CurrentBrush;
        
    var init;

    // --- A note about Palettes, CurrentPalette and CurrentBrush:

    // There is one instance each of each of these objects for each
    // instance of the app on the page. An array with the default settings
    // for each instance can be found in the config.js file.    

    // --- Set up the BrushStyle constructor -----

    BrushStyle = function( color, width ) {
        this.color = color;
        this.width = width;
    };
    
    // We always have the option of making lineCap and lineJoin instance
    // variables in the future, but for now let's put them in the prototype.
    
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
        this._maxColors = maxColors;
        this._smallBrushWidth = smallBrushWidth;
        this._largeBrushWidth = largeBrushWidth;
        
        this.load( title, colors );
    };

    // Load in a new palette of colors. 

    CurrentPalette.prototype.load = function( title, colors ) {
        var i, len;
        var color;
        var small, large;
        
        // We can only fit this.maxColors number of panels,
        // so truncate the array if necessary. 
        this.colors = colors.slice( 0, this._maxColors );
        
        this.title = title; 
        this.brushStyles = [];
    
        for (i = 0, len = colors.length; i < len; i++) {
            color = colors[i];
            small = util.object( brushChildrenProto, {
                color: color,
                width: this._smallBrushWidth
            });
            large = util.object( brushChildrenProto, {
       	        color: color,
       	        width: this._largeBrushWidth
       	    });

            this.brushStyles.push( small );
            this.brushStyles.push( large );
        }
    };

    // --- Set up the current brush.

    CurrentBrush = function( size, colorPanelIdx, currentPalette ) {
        this._currentPalette = currentPalette;
        this._styleIdx = (colorPanelIdx * 2) + (size === "large" ? 1 : 0);
    };

    // styleIdx is a number that has two values
    // for every one that colorPanelIdx has,
    // because styleIdx takes into account
    // whether a brush is small or large.

    // size and colorPanelIdx are overloaded as both 
    // getters and setters, depending on the number of arguments.

    CurrentBrush.prototype.size = function( size /* optional */) {
        var oldSize = (this._styleIdx % 2) ? "large" : "small";
    
        // get
        if (arguments.length === 0) {
            return oldSize;
        
        // set
        } else {
            this._styleIdx += (oldSize === size) ? 0 : 
                              (size === "small") ? -1 : 1;
        }
    }

    CurrentBrush.prototype.colorPanelIdx = function( colorPanelIdx /* optional */) {
        var oldColorPanelIdx = Math.floor( this._styleIdx / 2 );
    
        // get
        if (arguments.length === 0) {
            return oldColorPanelIdx;
        
        // set        
        } else {
            this._styleIdx += (colorPanelIdx - oldColorPanelIdx) * 2;
        }
    }
    
    // style is a getter only.
    
    CurrentBrush.prototype.style = function() {
        return this._currentPalette.brushStyles[ this._styleIdx ];
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
    Palettes.MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];

    Palettes.prototype.load = function( data ) {
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
                newPalette.dateCreated = Palettes.MONTHS[date.getMonth()] + " " + 
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
        var palettes,
            currentPalette,
            currentBrush;
            
        // Initialize palettes.
        palettes = new Palettes();
        
        // Initialize currentPalette.
        currentPalette = new CurrentPalette( 
            config.DEFAULT_PALETTE_TITLE, 
            config.DEFAULT_PALETTE_COLORS, 
            config.MAX_COLORS,
            config.SMALL_BRUSH_WIDTH, 
            config.LARGE_BRUSH_WIDTH 
        );

        // Initialize currentBrush.
        currentBrush = new CurrentBrush(
            config.DEFAULT_BRUSH_SIZE,
            config.DEFAULT_COLOR_PANEL_INDEX,
            currentPalette 
        );
                
        //----------- MODULE INTERFACE ----------------

        this.palettes = palettes;
        this.currentPalette = currentPalette;
        this.currentBrush = currentBrush;
    };

    //----------- MODULE INTERFACE ----------------
    
    return init;  
})();
