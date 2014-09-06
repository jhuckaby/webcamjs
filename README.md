# WebcamJS

WebcamJS is a small (~3K minified and gzipped) standalone JavaScript library for capturing still images from your computer's camera, and delivering them to you as JPEG or PNG [Data URIs](http://en.wikipedia.org/wiki/Data_URI_scheme).  The images can then be displayed in your web page, rendered into a canvas, or submitted to your server.  WebcamJS uses [HTML5 getUserMedia](http://dev.w3.org/2011/webrtc/editor/getusermedia.html), but provides an automatic and invisible Adobe Flash fallback.

WebcamJS is based on my old [JPEGCam](https://code.google.com/p/jpegcam/) project, but has been redesigned for the modern web.  Instead of relying solely on Flash and only being able to submit images directly to a server, WebcamJS delivers your images as client-side Data URIs in JavaScript, and it uses HTML5 getUserMedia where available.  Flash is only used if your browser doesn't support getUserMedia, and the fallback is handled automatically using the same API (so your code doesn't have to care).

Here are some live demos showcasing various features of the library:

| Demo Link | Description |
|------|-------|
| [Basic Demo](http://pixlcore.com/demos/webcamjs/demos/basic.html) | Demonstrates a basic 320x240 image capture. |
| [Large Demo](http://pixlcore.com/demos/webcamjs/demos/large.html) | Demonstrates capturing a large 640x480 image, but showing a live preview at 320x240. |
| [Crop Demo](http://pixlcore.com/demos/webcamjs/demos/crop.html) | Demonstrates cropping a 240x240 square out of the center of a 320x240 webcam image. |
| [Large Crop Demo](http://pixlcore.com/demos/webcamjs/demos/crop-large.html) | Demonstrates a large 480x480 square crop, from a 640x480 image capture, with a 240x240 live preview. |
| [HD Demo](http://pixlcore.com/demos/webcamjs/demos/hd.html) | Demonstrates a 720p HD (1280x720) image capture (only supported by some webcams). |
| [SFX Demo](http://pixlcore.com/demos/webcamjs/demos/sfx.html) | Demonstrates a camera shutter sound effect at capture time. |
| [Flash Demo](http://pixlcore.com/demos/webcamjs/demos/flash.html) | Demonstrates forcing Adobe Flash fallback mode. |
| [Freeze Demo](http://pixlcore.com/demos/webcamjs/demos/preview.html) | Demonstrates freezing / previewing a snapshot before saving it. |
| **[Full Combo Demo](http://pixlcore.com/demos/webcamjs/demos/combo.html)** | A full combination demo showcasing all features. |

## Open Source

WebcamJS is open source, MIT licensed, and available on GitHub:

https://github.com/jhuckaby/webcamjs

## QuickStart Guide

Host the `webcam.js` and `webcam.swf` files on your web server, and drop in this HTML snippet:

```html
	<script src="webcam.js"></script>

	<div id="my_camera" style="width:320px; height:240px;"></div>
	<div id="my_result"></div>

	<script language="JavaScript">
		Webcam.attach( '#my_camera' );
		
		function take_snapshot() {
			Webcam.snap( function(data_uri) {
				document.getElementById('my_result').innerHTML = '<img src="'+data_uri+'"/>';
			} );
		}
	</script>

	<a href="javascript:void(take_snapshot())">Take Snapshot</a>
```

This will create a live camera view in the `my_camera` DIV, and when the **Take Snapshot** link is clicked it will take a still snapshot, convert it to a JPEG, and deliver a Data URI which is inserted into the `my_result` DIV as a standard `<IMG SRC>` tag.

Data URIs may be passed around like any URL, and can be submitted to your server as well (see below for example of this).

## Configuration

If you want to override the default settings, just call `Webcam.set()` and pass in a hash with any of the following keys:

| Param Name | Default Value | Notes |
|------------|---------------|-------|
| `width` | (Auto) | Width of the live camera viewer in pixels, defaults to the actual size of the DOM element. |
| `height` | (Auto) | Height of the live camera viewer in pixels, defaults to the actual size of the DOM element. |
| `dest_width` | (Auto) | Width of the captured camera image in pixels, defaults to the live viewer size. |
| `dest_height` | (Auto) | Height of the captured camera image in pixels, defaults to the live viewer size. |
| `crop_width` | (Disabled) | Width of the final cropped image in pixels, defaults to `dest_width`. |
| `crop_height` | (Disabled) | Height of the final cropped image in pixels, defaults to `dest_height`. |
| `image_format` | jpeg | Desired image format of captured image, may be "jpeg" or "png". |
| `jpeg_quality` | 90 | For JPEG images, this is the desired quality, from 0 (worst) to 100 (best). |
| `force_flash` | false | Setting this to true will always run in Adobe Flash fallback mode. |

Here is an example of overriding some parameters.  Remember to call this *before* you attach the viewer.

```javascript
	Webcam.set({
		width: 320,
		height: 240,
		dest_width: 640,
		dest_height: 480,
		image_format: 'jpeg',
		jpeg_quality: 90,
		force_flash: false
	});
	
	// Attach camera here
```

## Initialization

WebcamJS is initialized and activated by "attaching" a live camera viewer to a DOM element.  The DOM element must already be created and empty.  Pass in an ID or CSS selector to the `Webcam.attach()` function.  Example:

```javascript
	Webcam.attach( '#my_camera' );
```

This will activate the user's webcam, ask for the appropriate permission, and begin showing a live camera image in the specified DOM element.

Note that the browser itself handles asking the user for permission to use their camera.  WebcamJS has no control over this, so there is no way to style the UI.  Each browser does it a little differently, typically a bar at the top of the page, and Flash does it inside the view area.

## Snapping a Picture

To snap a picture, just call the `Webcam.snap()` function, passing in a callback function.  The image data will be passed to your function as a Data URI, which you can then display in your web page, or submit to a server.  Example:

```javascript
	Webcam.snap( function(data_uri) {
		document.getElementById('my_result').innerHTML = '<img src="'+data_uri+'"/>';
	} );
```

[See a live demo of this here](http://pixlcore.com/demos/webcamjs/demos/basic.html)

Your function is also passed a HTML5 Canvas and a 2D Context object, so you can gain access to the raw pixels instead of a compressed image Data URI.  These are passed as the 2nd and 3rd arguments to your callback function.  Example:

```javascript
	Webcam.snap( function(data_uri, canvas, context) {
		// copy image to my own canvas
		myContext.drawImage( context, 0, 0 );
	} );
```

If you would prefer that WebcamJS simply copy the image into your own canvas, it can do that instead of generating a Data URI (which can be an expensive operation).  To do this, simply pass your canvas object to the `Webcam.snap()` method, as the 2nd argument, right after your callback function.  Example:

```javascript
	// assumes 'myCanvas' is a reference to your own canvas object, at the correct size
	
	Webcam.snap( function() {
		// the webcam image is now in your own canvas
	}, myCanvas );
```

## Customizing Image Size

WebcamJS will automatically size the live camera viewer based on the DOM element it is attached to.  However, you can override this by setting the `width` and/or `height` parameters:

```javascript
	Webcam.set({
		width: 320,
		height: 240
	});
	
	// Attach camera here
```

The size of the captured JPEG / PNG image is set to match the live camera viewer by default.  However, you can override this by setting the `dest_width` and/or `dest_height`.  Note that you can set the destination image size different than the viewer size.  So you can have a small live viewer, but capture a large image.  Example:

```javascript
	Webcam.set({
		width: 320,
		height: 240,
		dest_width: 640,
		dest_height: 480,
	});
	
	// Attach camera here
```

[See a live demo of this feature here](http://pixlcore.com/demos/webcamjs/demos/large.html)

## Cropping The Image

WebcamJS can also crop the final image for you, to any dimensions you like.  This is useful for when you want a square image (perhaps for a website profile pic), but you want to capture the image from the user's webcam at 4:3 ratio to be fully compatible (some cameras require 4:3 and cannot capture square images).  To do this, include `crop_width` and `crop_height` params, specifying the area to crop out of the center of the final image:

```javascript
	Webcam.set({
		width: 320,
		height: 240,
		crop_width: 240,
		crop_height: 240
	});
	
	// Attach camera here
```

This would crop a 240x240 square out of the center of the 320x240 webcam image.  The crop is also reflected in the live preview area.  In this case the live preview would also be cropped to 240x240, so the user can see exactly what portion of the image will be captured.

[See a live demo of this feature here](http://pixlcore.com/demos/webcamjs/demos/crop.html)

## Freezing / Previewing The Image

Want to provide your users with the ability to "freeze" (i.e. preview) the image before actually saving a snapshot?  Just call `Webcam.freeze()` to freeze the current camera image.  Then call `Webcam.snap()` to save the frozen image, or call `Webcam.unfreeze()` to cancel and resume the live camera feed.

The idea here is to provide a photo-booth-like experience, where the user can take a snapshot, then choose to keep or discard it, before actually calling `Webcam.snap()` to save the image.

[See a live demo of this feature here](http://pixlcore.com/demos/webcamjs/demos/preview.html)

## Setting an Alternate SWF Location

By default WebcamJS looks for the SWF file in the same directory as the JS file.  If you are hosting the SWF in a different location, please set it using the `Webcam.setSWFLocation()` function.  It should be on the same domain as your page.  Example:

```javascript
	Webcam.setSWFLocation("/path/to/the/webcam.swf");
```

Note that this is only used if the user's browser doesn't support HTML5 getUserMedia, and WebcamJS has to fallback to using an Adobe Flash movie to capture the camera.

## Reset (Shutdown)

To shut down the live camera preview and reset the system, call `Webcam.reset()`.  This removes any DOM elements we added, including a Flash movie if applicable, and resets everything in the library to the initial state.  Example:

```javascript
	Webcam.reset();
```

To use the library again after resetting, you must call `Webcam.attach()` and pass it your DOM element.

## API Reference

Here is a list of all the API function calls available in the WebcamJS library.

| Method Name | Notes |
|-------------|-------|
| `Webcam.set()` | Set configuration parameters.  Pass a key + value, or a hash with multiple keys/values. |
| `Webcam.on()` | Register an event listener for a given event.  Pass in the event name, and a callback function. |
| `Webcam.setSWFLocation()` | Set an alternate location for the Adobe Flash fallback SWF file (defaults to JS location). |
| `Webcam.attach()` | Initialize library and attach live camera to specified DOM object. |
| `Webcam.reset()` | Shut down library and reset everything.  Must call `attach()` to use it again. |
| `Webcam.freeze()` | Freeze the current live camera frame, allowing the user to preview before saving. |
| `Webcam.unfreeze()` | Cancel the preview (discard image) and resume the live camera view. |
| `Webcam.snap()` | Take a snapshot from the camera (or frozen preview image).  Pass callback function to receive data. |
| `Webcam.upload()` | Upload a saved image to your server via binary AJAX.  Fires progress events (see below). |

## Custom Events

WebcamJS fires a number of events you can intercept using a simple JavaScript hook system.  Events are fired when: the library is fully loaded, when the camera is live, when an error occurs, and during upload.  To register an event listener, call the `Webcam.on()` function, passing an event name and callback function.  Here is a table of the available event types:

| Event Name | Notes |
|------------|-------|
| `load` | Fires when the library finishes loading. |
| `live` | Fires when the user's camera goes live (i.e. showing a live preview). |
| `error` | Fires when an error occurs (your callback function is passed an error string). |
| `uploadProgress` | Fires repeatedly while an upload is in progress (see below). |
| `uploadComplete` | Fires once when the upload completes (see below). |

Example:

```javascript
	Webcam.on( 'load', function() {
		// library is loaded
	} );
	
	Webcam.on( 'live', function() {
		// camera is live, showing preview image
	} );
	
	Webcam.on( 'error', function(err) {
		// an error occurred (see 'err')
	} );
```

By default the `error` event shows a JavaScript alert dialog, but if you register your own event handler this action is suppressed, and your function is called instead.

## Submitting Images to a Server

The `Webcam.snap()` function delivers your image by way of a client-side JavaScript Data URI.  The binary image data is encoded with Base64 and stuffed into the URI.  You can use this image in JavaScript and display it on your page.  However, the library also provides a way to decode and submit this image data to a server API endpoint, via binary AJAX.  Example:

```javascript
	var data_uri = Webcam.snap();
	
	Webcam.upload( data_uri, 'myscript.php', function(code, text) {
		// Upload complete!
		// 'code' will be the HTTP response code from the server, e.g. 200
		// 'text' will be the raw response content
	} );
```

The `Webcam.upload()` function accepts three arguments: the Data URI containing the Base64 encoded image data as returned from `snap()`, a URL to your server API endpoint (PHP script, etc.), and a callback function to execute when the upload is complete.  You can alternatively specify the callback using `Webcam.on('uploadComplete', YOUR_FUNC)`.

The image data is uploaded as part of a standard multipart form post, and included as a form element named `webcam`.  To gain access to this data, write some server-side code like this (PHP shown):

```php
	// be aware of file / directory permissions on your server
	move_uploaded_file($_FILES['webcam']['tmp_name'], 'webcam.jpg');
```

Treat the uploaded data as if you were receiving a standard form submission with a `<input type="file" name="webcam">` element.  The data is sent in the same exact way.

If you need to pass any additional information along with your image to the server, please add a query string to your script URL.  For example:

```javascript
	var username = 'jhuckaby';
	var image_fmt = 'jpeg';
	var url = 'myscript.php?username=' + username + '&format=' + image_fmt;
	Webcam.upload( data_uri, url, function(code, text) {...} );
```

Those variables will then be available to your server-side code however you would normally access the query string, e.g. `$_GET['username']` in PHP.

### Tracking Upload Progress

If you want to track progress while your image is uploading, you can register an event listener for the `uploadProgress` event.  This event is called very frequently while an upload is in progress, and passes the function a floating point number between 0.0 and 1.0 representing the upload progress.  Here is how to use:

```javascript
	var data_uri = Webcam.snap();
	
	Webcam.on( 'uploadProgress', function(progress) {
		// Upload in progress
		// 'progress' will be between 0.0 and 1.0
	} );
	
	Webcam.on( 'uploadComplete', function(code, text) {
		// Upload complete!
		// 'code' will be the HTTP response code from the server, e.g. 200
		// 'text' will be the raw response content
	} );
	
	Webcam.upload( data_uri, 'myscript.php' );
```

### Including in an Existing Form

If you are already submitting a form on your page, and simply want to include the image data in your form, you can do this.  However, note that the data will be Base64 encoded until it gets to the server, so you will need to decode it on the server-side, and the file size in transit will be about 30% larger than normal.

This alternate upload technique is also shown here because it's probably the only way it'll ever work in IE 7, 8, and 9.  Those older IE versions do not support binary AJAX and blobs, so the standard `Webcam.upload()` function will not work, and you'll have to use a form trick like this:

First, add a hidden text element to your form:

```html
	<form id="myform" method="post" action="myscript.php">
		<input id="mydata" type="hidden" name="mydata" value=""/>
	</form>
```

Then, when you snap your picture, stuff the Data URI into the form field value (minus the header), and submit the form:

```javascript
	Webcam.snap( function(data_uri) {
		var raw_image_data = data_uri.replace(/^data\:image\/\w+\;base64\,/, '');
		
		document.getElementById('mydata').value = raw_image_data;
		document.getElementById('myform').submit();
	} );
```

Finally, in your server-side script, grab the form data as if it were a plain form text field, decode the Base64, and you have your binary image file!  Example here in PHP, which assumes JPEG format:

```php
	$encoded_data = $_POST['mydata'];
	$binary_data = base64_decode( $encoded_data );
	
	// save to server (beware of permissions)
	$result = file_put_contents( 'webcam.jpg', $binary_data );
	if (!$result) die("Could not save image!  Check file permissions.");
```

## License

The MIT License (MIT)

Copyright (c) 2012 - 2014 Joseph Huckaby

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
