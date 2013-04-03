define([], function() {

    return {
        parseSQLDate: function(str) {
            // Split timestamp into [ Y, M, D, h, m, s ]
            var t = str.split(/[- :]/);

            // Apply each element to the Date function
            var date = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);

            return date;
        },

        // Are we on a touch-screen device?
        isTouchSupported: function() {
            var el = document.createElement('div');
            var eventName = 'ontouchstart';
            var isSupported = (eventName in el);
            if (!isSupported) {
                el.setAttribute(eventName, 'return;');
                isSupported = typeof el[eventName] === 'function';
            }
            el = null;
            return isSupported;
        }
    };
});