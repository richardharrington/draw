// Dependency: util.js

;

var APP = (typeof APP !== 'undefined') ? APP : {};
APP.model = (typeof APP.model !== 'undefined') ? APP.model : 

(function() {
    
    var config = [{
        DEFAULT_PALETTE_COLORS: ['B04141', '85224A', 'EBE3B2', '1A4F6B', '042B4F'],
        MAX_COLORS: 10,
        DEFAULT_PALETTE_TITLE: "default page 1",
        DEFAULT_COLOR_PANEL_INDEX: 0,
        LARGE_BRUSH_WIDTH: 25,
        SMALL_BRUSH_WIDTH: 10,
        DEFAULT_BRUSH_SIZE: "large",
        CANVAS_WIDTH: 600,
        CANVAS_HEIGHT: 400,
        CANVAS_BACKGROUND_COLOR: "EEE"
    }, {
        DEFAULT_PALETTE_COLORS: ['B04141', '85224A', 'EBE3B2', '1A4F6B', '042B4F'],
        MAX_COLORS: 10,
        DEFAULT_PALETTE_TITLE: "default page 2",
        DEFAULT_COLOR_PANEL_INDEX: 0,
        LARGE_BRUSH_WIDTH: 50,
        SMALL_BRUSH_WIDTH: 30,
        DEFAULT_BRUSH_SIZE: "large",
        CANVAS_WIDTH: 800,
        CANVAS_HEIGHT: 300,
        CANVAS_BACKGROUND_COLOR: "FFF"
    }, {
        DEFAULT_PALETTE_COLORS: ['B04141', '85224A', 'EBE3B2', '1A4F6B', '042B4F'],
        MAX_COLORS: 10,
        DEFAULT_PALETTE_TITLE: "default page 3",
        DEFAULT_COLOR_PANEL_INDEX: 3,
        LARGE_BRUSH_WIDTH: 80,
        SMALL_BRUSH_WIDTH: 5,
        DEFAULT_BRUSH_SIZE: "small",
        CANVAS_WIDTH: 700,
        CANVAS_HEIGHT: 1000,
        CANVAS_BACKGROUND_COLOR: "DFF"
    }];

    var util = APP.util;

    var BrushStyle,
        brushChildrenProto;

    var Palettes,
        CurrentPalette,
        CurrentBrush;
        
    var init;
    
    var instances = [];
    var instanceNumber = 0;

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
        this.maxColors = maxColors;
        this.smallBrushWidth = smallBrushWidth;
        this.largeBrushWidth = largeBrushWidth;             
        this.init( title, colors );
    };

    // Load in a new palette of colors. 

    CurrentPalette.prototype.init = function( title, colors, maxColors, smallBrushWidth, largeBrushWidth ) {
        
        var i, len;
        var color;
        var small, large;
        
        this.brushStyles = [];

        // We can only fit this.maxColors number of panels,
        // so truncate the array if necessary. 

        colors = colors.slice( 0, this.maxColors );
    
        for (i = 0, len = colors.length; i < len; i++) {
            color = colors[i];
            small = util.object( brushChildrenProto, {
                color: color,
                width: this.smallBrushWidth
            });
            large = util.object( brushChildrenProto, {
       	        color: color,
       	        width: this.largeBrushWidth
       	    });

            this.brushStyles.push( small );
            this.brushStyles.push( large );
        }
        
        this.title = title;
        this.colors = colors;
    };


    // --- Set up the current brush.

    CurrentBrush = function( size, colorPanelIdx, currPalette ) {
        this.currentPalette = currPalette;
        this.styleIdx = (colorPanelIdx * 2) + (size === "large" ? 1 : 0);
    };

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
    

    // And now, a series of functions that are both getters and setters,
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

    CurrentBrush.prototype.style = function() {
        
        // size and colorPanelIdx are both optional arguments 
        //and can be in either order.
        var size, colorPanelIdx;
    
        // get
        if (arguments.length === 0) {
            return this.currentPalette.brushStyles[ this.styleIdx ];
    
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
                         this.currentPalette.brushStyles[ this.styleIdx ].toString() );
            console.log("\n");
        }
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

    Palettes.prototype.load = function( data ) {
        if (!data || data.length === 0) {
            return false;
        }
        
        var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
        var i, len;
        var date;
        var self = this;
        
        this.data = [];
        
        for (i = 0, len = data.length; i < len; i++) {
            (function( idx ) {
                var entry;
                var desc;
                var newPalette = {};
                console.log(idx);

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
                newPalette.dateCreated = MONTHS[date.getMonth()] + " " + 
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
    
    init = function( args ) {
        var palettes,
            currentPalette,
            currentBrush;
            
        var conf = config[instanceNumber];
        
        // Initialize palettes.
        palettes = new Palettes();
        
        // Initialize currentPalette.
        currentPalette = new CurrentPalette( 
            conf.DEFAULT_PALETTE_TITLE, 
            conf.DEFAULT_PALETTE_COLORS, 
            conf.MAX_COLORS,
            conf.SMALL_BRUSH_WIDTH, 
            conf.LARGE_BRUSH_WIDTH );

        // Initialize currentBrush.
        currentBrush = new CurrentBrush(
            conf.DEFAULT_BRUSH_SIZE,
            conf.DEFAULT_COLOR_PANEL_INDEX,
            currentPalette );
        
        instances[instanceNumber] = {
            palettes: palettes,
            currentPalette: currentPalette,
            currentBrush: currentBrush
        };
        
        // Increment the main instance number.
        instanceNumber += 1;
    };

    //----------- MODULE INTERFACE ----------------
    
    return {
        init: init, 
        config: config,
        instances: instances
    };  
    
})();
