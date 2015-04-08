(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Webcam = require('../../webcam.js');

function createWebcam(params){

	var webcam = new Webcam(params);

	// forcing flash to test the uuid flash interface
	webcam.swfURL = "../../webcam.swf";

	var webcamEl = document.createElement('div');
	var result = document.createElement('img');
	var button = document.createElement('button');

	button.innerHTML = "snap";
	button.addEventListener('click', function(){
		webcam.snap( function(data_uri) {
			result.src = data_uri;
		} );
	});

	document.body.appendChild(result);
	document.body.appendChild(button);
	document.body.appendChild(webcamEl);

	webcam.attach( webcamEl );

};

createWebcam({
	force_flash: true,
	width: 320,
	height: 240,
});

createWebcam({
	force_flash: true,
	width: 320,
	height: 240,
});

createWebcam({
	width: 320,
	height: 240
});

createWebcam({
	width: 640,
	height: 480
});


},{"../../webcam.js":2}],2:[function(require,module,exports){
// WebcamJS v1.0.2
// Webcam library for capturing JPEG/PNG images in JavaScript
// Attempts getUserMedia, falls back to Flash
// Author: Joseph Huckaby: http://github.com/jhuckaby
// Based on JPEGCam: http://code.google.com/p/jpegcam/
// Copyright (c) 2012 - 2015 Joseph Huckaby
// Licensed under the MIT License

(function(window) {

function Webcam(params){

	this.globals = {
		version: '1.0.2',
		protocol: location.protocol.match(/https/i) ? 'https' : 'http',
		swfURL: '', // URI to webcam.swf movie (defaults to cwd)
		loaded: false, // true when webcam movie finishes loading
		live: false, // true when webcam is initialized and ready to snap
		userMedia: true, // true when getUserMedia is supported natively
	};
	this.obj_merge(this, this.globals);

	this.params = {
		width: 0,
		height: 0,
		dest_width: 0, // size of captured image
		dest_height: 0, // these default to width/height
		image_format: 'jpeg', // image format (may be jpeg or png)
		jpeg_quality: 90, // jpeg image quality from 0 (worst) to 100 (best)
		force_flash: false, // force flash mode,
		flip_horiz: false, // flip image horiz (mirror mode)
		external_interface_method: '' // unique method name for flash to use as callback
	};
	this.obj_merge(this.params, params);
		

	// callback hook functions
	this.hooks = {
		load: null,
		live: null,
		uploadcomplete: null,
		uploadprogress: null,
		error: function(msg) { alert("Webcam.js Error: " + msg); }
	};

	this.init();
};

Webcam.prototype.init = function() {
	// initialize, check for getUserMedia support
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
	window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
	
	this.userMedia = this.userMedia && !!navigator.getUserMedia && !!window.URL;
	
	// Older versions of firefox (< 21) apparently claim support but user media does not actually work
	if (navigator.userAgent.match(/Firefox\D+(\d+)/)) {
		if (parseInt(RegExp.$1, 10) < 21) this.userMedia = null;
	}

	// generate unique flash interface for this instance
	var EImethodName = '_flashNotify_' + this.guid();
	window[EImethodName] = this.flashNotify.bind(this);
	this.params.external_interface_method = EImethodName;
};

Webcam.prototype.attach = function(elem) {
	// create webcam preview and attach to DOM element
	// pass in actual DOM reference, ID, or CSS selector
	if (typeof(elem) == 'string') {
		elem = document.getElementById(elem) || document.querySelector(elem);
	}
	if (!elem) {
		return this.dispatch('error', "Could not locate DOM element to attach to.");
	}
	this.container = elem;
	elem.innerHTML = ''; // start with empty element
	
	// insert "peg" so we can insert our preview canvas adjacent to it later on
	var peg = document.createElement('div');
	elem.appendChild( peg );
	this.peg = peg;
	
	// set width/height if not already set
	if (!this.params.width) this.params.width = elem.offsetWidth;
	if (!this.params.height) this.params.height = elem.offsetHeight;
	
	// set defaults for dest_width / dest_height if not set
	if (!this.params.dest_width) this.params.dest_width = this.params.width;
	if (!this.params.dest_height) this.params.dest_height = this.params.height;
	
	// if force_flash is set, disable userMedia
	if (this.params.force_flash) this.userMedia = null;
	
	// adjust scale if dest_width or dest_height is different
	var scaleX = this.params.width / this.params.dest_width;
	var scaleY = this.params.height / this.params.dest_height;
	
	if (this.userMedia) {
		// setup webcam video container
		var video = document.createElement('video');
		video.setAttribute('autoplay', 'autoplay');
		video.style.width = '' + this.params.dest_width + 'px';
		video.style.height = '' + this.params.dest_height + 'px';
		
		if ((scaleX != 1.0) || (scaleY != 1.0)) {
			elem.style.overflow = 'hidden';
			video.style.webkitTransformOrigin = '0px 0px';
			video.style.mozTransformOrigin = '0px 0px';
			video.style.msTransformOrigin = '0px 0px';
			video.style.oTransformOrigin = '0px 0px';
			video.style.transformOrigin = '0px 0px';
			video.style.webkitTransform = 'scaleX('+scaleX+') scaleY('+scaleY+')';
			video.style.mozTransform = 'scaleX('+scaleX+') scaleY('+scaleY+')';
			video.style.msTransform = 'scaleX('+scaleX+') scaleY('+scaleY+')';
			video.style.oTransform = 'scaleX('+scaleX+') scaleY('+scaleY+')';
			video.style.transform = 'scaleX('+scaleX+') scaleY('+scaleY+')';
		}
		
		// add video element to dom
		elem.appendChild( video );
		this.video = video;
		
		// ask user for access to their camera
		var self = this;
		navigator.getUserMedia({
			"audio": false,
			"video": {
				mandatory: {
					minWidth: this.params.dest_width,
					minHeight: this.params.dest_height
				}
			}
		}, 
		function(stream) {
			// got access, attach stream to video
			video.src = window.URL.createObjectURL( stream ) || stream;
			self.stream = stream;
			self.loaded = true;
			self.live = true;
			self.dispatch('load');
			self.dispatch('live');
			self.flip();
		},
		function(err) {
			return self.dispatch('error', "Could not access webcam.");
		});
	}
	else {
		// flash fallback
		var div = document.createElement('div');
		div.innerHTML = this.getSWFHTML();
		elem.appendChild( div );
	}
	
	// setup final crop for live preview
	if (this.params.crop_width && this.params.crop_height) {
		var scaled_crop_width = Math.floor( this.params.crop_width * scaleX );
		var scaled_crop_height = Math.floor( this.params.crop_height * scaleY );
		
		elem.style.width = '' + scaled_crop_width + 'px';
		elem.style.height = '' + scaled_crop_height + 'px';
		elem.style.overflow = 'hidden';
		
		elem.scrollLeft = Math.floor( (this.params.width / 2) - (scaled_crop_width / 2) );
		elem.scrollTop = Math.floor( (this.params.height / 2) - (scaled_crop_height / 2) );
	}
	else {
		// no crop, set size to desired
		elem.style.width = '' + this.params.width + 'px';
		elem.style.height = '' + this.params.height + 'px';
	}
};

Webcam.prototype.reset = function() {
	// shutdown camera, reset to potentially attach again
	if (this.preview_active) this.unfreeze();
	
	if (this.userMedia) {
		try { this.stream.stop(); } catch (e) {;}
		delete this.stream;
		delete this.video;
	}
	
	if (this.container) {
		this.container.innerHTML = '';
		delete this.container;
	}

	this.loaded = false;
	this.live = false;
};

Webcam.prototype.set = function() {
	// set one or more params
	// variable argument list: 1 param = hash, 2 params = key, value
	if (arguments.length == 1) {
		for (var key in arguments[0]) {
			this.params[key] = arguments[0][key];
		}
	}
	else {
		this.params[ arguments[0] ] = arguments[1];
	}
},

Webcam.prototype.on = function(name, callback) {
	// set callback hook
	// supported hooks: onLoad, onError, onLive
	name = name.replace(/^on/i, '').toLowerCase();
	
	if (typeof(this.hooks[name]) == 'undefined')
		throw "Event type not supported: " + name;
	
	this.hooks[name] = callback;
};

Webcam.prototype.dispatch = function() {
	// fire hook callback, passing optional value to it
	var name = arguments[0].replace(/^on/i, '').toLowerCase();
	var args = Array.prototype.slice.call(arguments, 1);
	
	if (this.hooks[name]) {
		if (typeof(this.hooks[name]) == 'function') {
			// callback is function reference, call directly
			this.hooks[name].apply(this, args);
		}
		else if (typeof(this.hooks[name]) == 'array') {
			// callback is PHP-style object instance method
			this.hooks[name][0][this.hooks[name][1]].apply(this.hooks[name][0], args);
		}
		else if (window[this.hooks[name]]) {
			// callback is global function name
			window[ this.hooks[name] ].apply(window, args);
		}
		return true;
	}
	return false; // no hook defined
};

Webcam.prototype.setSWFLocation = function(url) {
	// set location of SWF movie (defaults to webcam.swf in cwd)
	this.swfURL = url;
};

Webcam.prototype.detectFlash = function() {
	// return true if browser supports flash, false otherwise
	// Code snippet borrowed from: https://github.com/swfobject/swfobject
	var SHOCKWAVE_FLASH = "Shockwave Flash",
		SHOCKWAVE_FLASH_AX = "ShockwaveFlash.ShockwaveFlash",
    	FLASH_MIME_TYPE = "application/x-shockwave-flash",
    	win = window,
    	nav = navigator,
    	hasFlash = false;
    
    if (typeof nav.plugins !== "undefined" && typeof nav.plugins[SHOCKWAVE_FLASH] === "object") {
    	var desc = nav.plugins[SHOCKWAVE_FLASH].description;
    	if (desc && (typeof nav.mimeTypes !== "undefined" && nav.mimeTypes[FLASH_MIME_TYPE] && nav.mimeTypes[FLASH_MIME_TYPE].enabledPlugin)) {
    		hasFlash = true;
    	}
    }
    else if (typeof win.ActiveXObject !== "undefined") {
    	try {
    		var ax = new ActiveXObject(SHOCKWAVE_FLASH_AX);
    		if (ax) {
    			var ver = ax.GetVariable("$version");
    			if (ver) hasFlash = true;
    		}
    	}
    	catch (e) {;}
    }
    
    return hasFlash;
};

Webcam.prototype.getSWFHTML = function() {
	// Return HTML for embedding flash based webcam capture movie		
	var html = '';
	
	// make sure we aren't running locally (flash doesn't work)
	if (location.protocol.match(/file/)) {
		this.dispatch('error', "Flash does not work from local disk.  Please run from a web server.");
		return '<h3 style="color:red">ERROR: the Webcam.js Flash fallback does not work from local disk.  Please run it from a web server.</h3>';
	}
	
	// make sure we have flash
	if (!this.detectFlash()) {
		this.dispatch('error', "Adobe Flash Player not found.  Please install from get.adobe.com/flashplayer and try again.");
		return '<h3 style="color:red">ERROR: No Adobe Flash Player detected.  Webcam.js relies on Flash for browsers that do not support getUserMedia (like yours).</h3>';
	}
	
	// set default swfURL if not explicitly set
	if (!this.swfURL) {
		// find our script tag, and use that base URL
		var base_url = '';
		var scpts = document.getElementsByTagName('script');
		for (var idx = 0, len = scpts.length; idx < len; idx++) {
			var src = scpts[idx].getAttribute('src');
			if (src && src.match(/\/webcam(\.min)?\.js/)) {
				base_url = src.replace(/\/webcam(\.min)?\.js.*$/, '');
				idx = len;
			}
		}
		if (base_url) this.swfURL = base_url + '/webcam.swf';
		else this.swfURL = 'webcam.swf';
	}
	
	// if this is the user's first visit, set flashvar so flash privacy settings panel is shown first
	if (window.localStorage && !localStorage.getItem('visited')) {
		this.params.new_user = 1;
		localStorage.setItem('visited', 1);
	}
	
	// construct flashvars string
	var flashvars = '';
	for (var key in this.params) {
		if (flashvars) flashvars += '&';
		flashvars += key + '=' + escape(this.params[key]);
	}
	
	// construct object/embed tag
	html += '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" type="application/x-shockwave-flash" codebase="'+this.protocol+'://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="'+this.params.width+'" height="'+this.params.height+'" id="webcam_movie_obj" align="middle"><param name="wmode" value="opaque" /><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="false" /><param name="movie" value="'+this.swfURL+'" /><param name="loop" value="false" /><param name="menu" value="false" /><param name="quality" value="best" /><param name="bgcolor" value="#ffffff" /><param name="flashvars" value="'+flashvars+'"/><embed id="webcam_movie_embed" src="'+this.swfURL+'" wmode="opaque" loop="false" menu="false" quality="best" bgcolor="#ffffff" width="'+this.params.width+'" height="'+this.params.height+'" name="webcam_movie_embed" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" flashvars="'+flashvars+'"></embed></object>';
	
	return html;
};

Webcam.prototype.getMovie = function() {
	console.log('Webcam.getMovie', this);

	// get reference to movie object/embed in DOM
	if (!this.loaded) return this.dispatch('error', "Flash Movie is not loaded yet");
	var movie = document.getElementById('webcam_movie_obj');
	if (!movie || !movie._snap) movie = document.getElementById('webcam_movie_embed');
	if (!movie) this.dispatch('error', "Cannot locate Flash movie in DOM");
	return movie;
};

Webcam.prototype.freeze = function() {
	// show preview, freeze camera
	var self = this;
	var params = this.params;
	
	// kill preview if already active
	if (this.preview_active) this.unfreeze();
	
	// determine scale factor
	var scaleX = this.params.width / this.params.dest_width;
	var scaleY = this.params.height / this.params.dest_height;
	
	// must unflip container as preview canvas will be pre-flipped
	this.unflip();
	
	// calc final size of image
	var final_width = params.crop_width || params.dest_width;
	var final_height = params.crop_height || params.dest_height;
	
	// create canvas for holding preview
	var preview_canvas = document.createElement('canvas');
	preview_canvas.width = final_width;
	preview_canvas.height = final_height;
	var preview_context = preview_canvas.getContext('2d');
	
	// save for later use
	this.preview_canvas = preview_canvas;
	this.preview_context = preview_context;
	
	// scale for preview size
	if ((scaleX != 1.0) || (scaleY != 1.0)) {
		preview_canvas.style.webkitTransformOrigin = '0px 0px';
		preview_canvas.style.mozTransformOrigin = '0px 0px';
		preview_canvas.style.msTransformOrigin = '0px 0px';
		preview_canvas.style.oTransformOrigin = '0px 0px';
		preview_canvas.style.transformOrigin = '0px 0px';
		preview_canvas.style.webkitTransform = 'scaleX('+scaleX+') scaleY('+scaleY+')';
		preview_canvas.style.mozTransform = 'scaleX('+scaleX+') scaleY('+scaleY+')';
		preview_canvas.style.msTransform = 'scaleX('+scaleX+') scaleY('+scaleY+')';
		preview_canvas.style.oTransform = 'scaleX('+scaleX+') scaleY('+scaleY+')';
		preview_canvas.style.transform = 'scaleX('+scaleX+') scaleY('+scaleY+')';
	}
	
	// take snapshot, but fire our own callback
	this.snap( function() {
		// add preview image to dom, adjust for crop
		preview_canvas.style.position = 'relative';
		preview_canvas.style.left = '' + self.container.scrollLeft + 'px';
		preview_canvas.style.top = '' + self.container.scrollTop + 'px';
		
		self.container.insertBefore( preview_canvas, self.peg );
		self.container.style.overflow = 'hidden';
		
		// set flag for user capture (use preview)
		self.preview_active = true;
		
	}, preview_canvas );
};

Webcam.prototype.unfreeze = function() {
	// cancel preview and resume live video feed
	if (this.preview_active) {
		// remove preview canvas
		this.container.removeChild( this.preview_canvas );
		delete this.preview_context;
		delete this.preview_canvas;
		
		// unflag
		this.preview_active = false;
		
		// re-flip if we unflipped before
		this.flip();
	}
};

Webcam.prototype.flip = function() {
	// flip container horiz (mirror mode) if desired
	if (this.params.flip_horiz) {
		var sty = this.container.style;
		sty.webkitTransform = 'scaleX(-1)';
		sty.mozTransform = 'scaleX(-1)';
		sty.msTransform = 'scaleX(-1)';
		sty.oTransform = 'scaleX(-1)';
		sty.transform = 'scaleX(-1)';
		sty.filter = 'FlipH';
		sty.msFilter = 'FlipH';
	}
};

Webcam.prototype.unflip = function() {
	// unflip container horiz (mirror mode) if desired
	if (this.params.flip_horiz) {
		var sty = this.container.style;
		sty.webkitTransform = 'scaleX(1)';
		sty.mozTransform = 'scaleX(1)';
		sty.msTransform = 'scaleX(1)';
		sty.oTransform = 'scaleX(1)';
		sty.transform = 'scaleX(1)';
		sty.filter = '';
		sty.msFilter = '';
	}
};

Webcam.prototype.savePreview = function(user_callback, user_canvas) {
	// save preview freeze and fire user callback
	var params = this.params;
	var canvas = this.preview_canvas;
	var context = this.preview_context;
	
	// render to user canvas if desired
	if (user_canvas) {
		var user_context = user_canvas.getContext('2d');
		user_context.drawImage( canvas, 0, 0 );
	}
	
	// fire user callback if desired
	user_callback(
		user_canvas ? null : canvas.toDataURL('image/' + params.image_format, params.jpeg_quality / 100 ),
		canvas,
		context
	);
	
	// remove preview
	this.unfreeze();
};

Webcam.prototype.snap = function(user_callback, user_canvas) {
	console.log('Webcam.snap', this);
	// take snapshot and return image data uri
	var self = this;
	var params = this.params;
	
	if (!this.loaded) return this.dispatch('error', "Webcam is not loaded yet");
	// if (!this.live) return this.dispatch('error', "Webcam is not live yet");
	if (!user_callback) return this.dispatch('error', "Please provide a callback function or canvas to snap()");
	
	// if we have an active preview freeze, use that
	if (this.preview_active) {
		this.savePreview( user_callback, user_canvas );
		return null;
	}
	
	// create offscreen canvas element to hold pixels
	var canvas = document.createElement('canvas');
	canvas.width = this.params.dest_width;
	canvas.height = this.params.dest_height;
	var context = canvas.getContext('2d');
	
	// flip canvas horizontally if desired
	if (this.params.flip_horiz) {
		context.translate( params.dest_width, 0 );
		context.scale( -1, 1 );
	}
	
	// create inline function, called after image load (flash) or immediately (native)
	var func = function() {
		// render image if needed (flash)
		if (this.src && this.width && this.height) {
			context.drawImage(this, 0, 0, params.dest_width, params.dest_height);
		}
		
		// crop if desired
		if (params.crop_width && params.crop_height) {
			var crop_canvas = document.createElement('canvas');
			crop_canvas.width = params.crop_width;
			crop_canvas.height = params.crop_height;
			var crop_context = crop_canvas.getContext('2d');
			
			crop_context.drawImage( canvas, 
				Math.floor( (params.dest_width / 2) - (params.crop_width / 2) ),
				Math.floor( (params.dest_height / 2) - (params.crop_height / 2) ),
				params.crop_width,
				params.crop_height,
				0,
				0,
				params.crop_width,
				params.crop_height
			);
			
			// swap canvases
			context = crop_context;
			canvas = crop_canvas;
		}
		
		// render to user canvas if desired
		if (user_canvas) {
			var user_context = user_canvas.getContext('2d');
			user_context.drawImage( canvas, 0, 0 );
		}
		
		// fire user callback if desired
		user_callback(
			user_canvas ? null : canvas.toDataURL('image/' + params.image_format, params.jpeg_quality / 100 ),
			canvas,
			context
		);
	};
	
	// grab image frame from userMedia or flash movie
	if (this.userMedia) {
		// native implementation
		context.drawImage(this.video, 0, 0, this.params.dest_width, this.params.dest_height);
		
		// fire callback right away
		func();
	}
	else {
		// flash fallback
		var raw_data = this.getMovie()._snap();
		
		// render to image, fire callback when complete
		var img = new Image();
		img.onload = func;
		img.src = 'data:image/'+this.params.image_format+';base64,' + raw_data;
	}
	
	return null;
};

Webcam.prototype.configure = function(panel) {
	// open flash configuration panel -- specify tab name:
	// "camera", "privacy", "default", "localStorage", "microphone", "settingsManager"
	if (!panel) panel = "camera";
	this.getMovie()._configure(panel);
},

Webcam.prototype.flashNotify = function(type, msg) {
	console.log('flashNotify', type, msg, this);

	// receive notification from flash about event
	switch (type) {
		case 'flashLoadComplete':
			// movie loaded successfully
			this.loaded = true;
			this.dispatch('load');
			break;
		
		case 'cameraLive':
			// camera is live and ready to snap
			this.live = true;
			this.dispatch('live');
			this.flip();
			break;

		case 'error':
			// Flash error
			this.dispatch('error', msg);
			break;

		default:
			// catch-all event, just in case
			// console.log("webcam flash_notify: " + type + ": " + msg);
			break;
	}
};


Webcam.prototype.guid = function() {
	function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); }
	return [s4() + s4(), s4(), s4(), s4(), s4() + s4() + s4()].join('_');
};

Webcam.prototype.obj_merge = function(obj1, obj2){
    for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
}

Webcam.prototype.b64ToUint6 = function(nChr) {
	// convert base64 encoded character to 6-bit integer
	// from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
	return nChr > 64 && nChr < 91 ? nChr - 65
		: nChr > 96 && nChr < 123 ? nChr - 71
		: nChr > 47 && nChr < 58 ? nChr + 4
		: nChr === 43 ? 62 : nChr === 47 ? 63 : 0;
};

Webcam.prototype.base64DecToArr = function(sBase64, nBlocksSize) {
	// convert base64 encoded string to Uintarray
	// from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
	var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
		nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, 
		taBytes = new Uint8Array(nOutLen);
	
	for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
		nMod4 = nInIdx & 3;
		nUint24 |= this.b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
		if (nMod4 === 3 || nInLen - nInIdx === 1) {
			for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
				taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
			}
			nUint24 = 0;
		}
	}
	return taBytes;
};

Webcam.prototype.upload = function(image_data_uri, target_url, callback) {
	// submit image data to server using binary AJAX
	if (callback) this.on('uploadComplete', callback);
	var form_elem_name = 'webcam';
	
	// detect image format from within image_data_uri
	var image_fmt = '';
	if (image_data_uri.match(/^data\:image\/(\w+)/))
		image_fmt = RegExp.$1;
	else
		throw "Cannot locate image format in Data URI";
	
	// extract raw base64 data from Data URI
	var raw_image_data = image_data_uri.replace(/^data\:image\/\w+\;base64\,/, '');
	
	// contruct use AJAX object
	var http = new XMLHttpRequest();
	http.open("POST", target_url, true);
	
	// setup progress events
	if (http.upload && http.upload.addEventListener) {
		http.upload.addEventListener( 'progress', function(e) {
			if (e.lengthComputable) {
				var progress = e.loaded / e.total;
				this.dispatch('uploadProgress', progress, e);
			}
		}, false );
	}
	
	// completion handler
	var _this = this;
	http.onload = function() {
		_this.dispatch('uploadComplete', http.status, http.responseText, http.statusText);
	};
	
	// create a blob and decode our base64 to binary
	var blob = new Blob( [ this.base64DecToArr(raw_image_data) ], {type: 'image/'+image_fmt} );
	
	// stuff into a form, so servers can easily receive it as a standard file upload
	var form = new FormData();
	form.append( form_elem_name, blob, form_elem_name+"."+image_fmt.replace(/e/, '') );
	
	// send data to server
	http.send(form);
};

if (typeof define === 'function' && define.amd) {
	define(function() { return Webcam });
} else if (typeof module === 'object' && module.exports) {
	module.exports = Webcam;
} else {
	window.Webcam = Webcam;
}

}(window));

},{}]},{},[1]);
