;

var APP = (typeof APP !== 'undefined') ? APP : {};
APP.util = (typeof APP.util !== 'undefined') ? APP.util : 

(function() {
    
    var isArray,
        keyList;
        
    var PropertyToParameter;
    
    var copy,
        parseSQLDate,
        object,
        forEach;
    
    // PRIVATE METHODS
    
    isArray = function( obj ) {
        return Object.prototype.toString.call( obj ) === "[object Array]";
    };

    // keyList returns an array of all own property names in an object.

    keyList = function( obj ) {
        var k, obj;
        var list = [];
        for (k in obj) {
            if (obj.hasOwnProperty( k )) {
                list.push( k );
            }
        }
        return list;
    };

    // PUBLIC CONSTRUCTORS AND METHODS
    
    // Very basic iterator function, used only for debugging
    // so far.

    forEach = function( array, action ) {
        for (var i = 0, len = array.length; i < len; i++) {
            action( array[i], i );
        }
    };
    
    // PropertyToParameter takes a function (func) and creates
    // an object with a series of properties, all added by the 
    // method "add," each of which is a function that takes an arbitrary number of arguments,
    // adds its own property name to the beginning of the list of arguments that were passed to it,
    // and then calls the original function "func" with the new argument list.
    
    // This is a hack so that we can pass to a JSONP request the name of a callback
    // function such that the name of the function itself will tell
    // another function, when the AJAX request returns, which model
    // instance is supposed to be filled.
    
    PropertyToParameter = function( func ) {
        this.func = func;
    };
    
    PropertyToParameter.prototype.add = function( prop ) {
        this[prop] = (function( f ) {
            return function() {
                var args = Array.prototype.slice.call( arguments, 0 );
                args.unshift( prop );
                f.apply( null, args );
            };
        })(this.func);
    };
    
    // copyProps is like jQuery.extend, except that it lacks 
    // jQuery.extend's ability to copy from more than one object. 
    // Also, it has an ability that jQuery.extend doesn't have, 
    // which is to select a list of properties from the source object,
    // instead of automatically copying all of them.

    // The target argument is mandatory, just like in jQuery.extend.

    // The array in the arguments list contains the list of properties to be
    // copied from the source to the target. This array is only for selecting a subset
    // of the top-level primitives and object references in the source object.
    // If the copying is deep (the default), once the recursive calls begin, 
    // objects and arrays are copied with all of their properties, 
    // just as jQuery.extend would do. 

    // The last two arguments, deep and arrayOfProps, are optional and can
    // be in any order.

    copy = function copy( target, source /* optional args: arrayOfProps, deep */ ) {
        var key, value;
        var toStr = Object.prototype.toString;
        var i;
        var arrayOfProps = []; // optional argument 
        var deep;              // optional argument

        // Assign the optional arguments arrayOfProps and deep.

        deep = (typeof arguments[2] === "boolean") ? arguments[2] :
            (typeof arguments[3] === "boolean") ? arguments[3] : 
            true; // default is deep copy

        arrayOfProps = (isArray( arguments[2] )) ? arguments[2] :
            (isArray( arguments[3] )) ? arguments[3] :
            keyList( source ); // default is copy all of source's properties

        i = arrayOfProps.length;

        while (i) {
            i -= 1;
            key = arrayOfProps[i];
            if (deep && (typeof source[key] === "object")) {
                target[key] = (isArray( source[key] )) ? [] : {};
                copy( target[key], source[key] );
            } else {
                target[key] = source[key];
            }
        }
    };

    parseSQLDate = function( str ) {
        
        // Split timestamp into [ Y, M, D, h, m, s ]
        var t = str.split(/[- :]/);

        // Apply each element to the Date function
        var d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);

        return d;
    };

    // object is an object inheritor function. (NOT USED IN THE CURRENT VERSION OF THE SCRIPT)

    object = function ( o, vals ) {
        function F() {};
        F.prototype = o;
        var instance = new F();            
        for (var p in vals) {
            instance[p] = vals[p];
        }
        return instance;
    };

    // ------------ Module interface ------------------------

    return {
        copy: copy,
        parseSQLDate: parseSQLDate,
        object: object,
        forEach: forEach,
        
        PropertyToParameter: PropertyToParameter
    };
})();
