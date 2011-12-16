# Draw

An experiment in using Canvas to create a simple browser-based drawing app.

In its current form, it uses a search engine to grab color palettes from the API of a color-sharing website called colourlovers.com. 

In the future, it may or may not incorporate the following features:

* The ability to take snapshots of the canvas and save them to disk or upload them to social media sites or email them.
* The ability to have two people in different browsers drawing on the same canvas.
* Other fun stuff. Ideas?


## Origin

This project came out of an assignment in the November 2011 Advanced Javascript class taught by Pedro Ha at NYU SCPS. Pedro had created a basic version of the app, and our assignment was to add the API search functionality and also to significantly refactor the code. His original version can be found in the folder "original-files." That code should in no way reflect on his abilities -- it is in a deliberately half-finished state, so that the students could fix it up.


## Near-term feature changes

* Fix the bug that causes it to remain in drawing mode if you go off the canvas while you have the mouse pressed down. This bug creates a few problems:
    1. If you drag the brush out and around to the other side of the canvas, a straight line is drawn from where you left the canvas to where you re-enter it. 
    2. If go off the canvas while you have the mouse pressed down, when you reenter the canvas you will be in drawing mode whether you have the mouse pressed down or not, and 
    3. If you go off the canvas while you have the mouse pressed down and then change the color, when you reenter the canvas, everything you've drawn since you last went into drawing mode will be changed to the new color.
    
* Change the "small" and "large" selector at the bottom so that they are just buttons, or two sides of one rounded-corner button.


## License

Licenses for Pedro's original work and also for excanvas.js (by Google) can be found in the appropriate folders. The rest is:

(MIT License)

Copyright (c) 2011 Richard Harrington

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.