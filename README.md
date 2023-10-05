Draw
----

![screen recording gif](readme_images/screenrecording.gif)

An experiment in using Canvas, Node and Socket.io to create a multi-user browser-based drawing app. You can see the other people drawing with you in real-time, even if they're on another continent. Check out the live site, hosted by Nodejitsu, at [draw.jit.su](http://draw.jit.su). Make sure to open it on two devices at the same time!

In the future, it may or may not incorporate the following features:

* The ability to take snapshots of the canvas and save them to disk or upload them to social media sites or email them.
* The ability to create instances for more than one group of scribblers in the world
* Other fun stuff. Ideas?


## Origin

This project came out of an assignment in the November 2011 Advanced Javascript class taught by Pedro Ha at NYU SCPS. Pedro had created a basic version of the app, and our assignment was to add the API search functionality using a color palette service called Colourlovers which has since gone defunct, and also to significantly refactor the code.The chief expansion made by this version is to use socket.io (websockets) and Nodejs to make it into a multi-user experience.


## License

[MIT License](https://mit-license.org/) (this was also the license on Pedro's original version)