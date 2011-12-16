// ------- Library of general-purpose utilities ---------


// object is an object inheritor function. 

function object( o, vals ) {
    function F() {};
    F.prototype = o;
    var instance = new F();            
    for (var p in vals) {
        instance[p] = vals[p];
    }
    return instance;
}


function parseSQLDate( str ) {
  // Split timestamp into [ Y, M, D, h, m, s ]
  var t = str.split(/[- :]/);

  // Apply each element to the Date function
  var d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);

  return d;
}


var isArray = function( obj ) {
    return Object.prototype.toString.call( obj ) === "[object Array]";
}


// keyList returns an array of all property names in an object.

var keyList = function( obj ) {
    var k, obj;
    var list = [];
    for (k in obj) {
        if (obj.hasOwnProperty( k )) {
            list.push( k );
        }
    }
    return list;
}


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

var copy = function copy( target, source /* optional args: arrayOfProps, deep */ ) {
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
}

