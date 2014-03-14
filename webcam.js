// WebcamJS v1.0
// Webcam library for capturing JPEG/PNG images in JavaScript
// Attempts getUserMedia, falls back to Flash
// Author: Joseph Huckaby: http://github.com/jhuckaby
// Based on JPEGCam: http://code.google.com/p/jpegcam/
// Copyright (c) 2012 Joseph Huckaby
// Licensed under the MIT License

/* Usage:
	<div id="my_camera" style="width:320px; height:240px;"></div>
	<div id="my_result"></div>
	
	<script language="JavaScript">
		Webcam.attach( '#my_camera' );
		
		function take_snapshot() {
			var data_uri = Webcam.snap();
			document.getElementById('my_result').innerHTML = 
				'<img src="'+data_uri+'"/>';
		}
	</script>
	
	<a href="javascript:void(take_snapshot())">Take Snapshot</a>
*/

var Webcam = {
	version: '1.0.0',
	
	// globals
	protocol: location.protocol.match(/https/i) ? 'https' : 'http',
	swfURL: '', // URI to webcam.swf movie (defaults to cwd)
	loaded: false, // true when webcam movie finishes loading
	live: false, // true when webcam is initialized and ready to snap
	userMedia: true, // true when getUserMedia is supported natively
	
	params: {
		width: 0,
		height: 0,
		dest_width: 0, // size of captured image
		dest_height: 0, // these default to width/height
		image_format: 'jpeg', // image format (may be jpeg or png)
		jpeg_quality: 90, // jpeg image quality from 0 (worst) to 100 (best)
		force_flash: false // force flash mode
	},
	
	hooks: {
		load: null,
		live: null,
		uploadcomplete: null,
		uploadprogress: null,
		error: function(msg) { alert("Webcam.js Error: " + msg); }
	}, // callback hook functions
	
	init: function() {
		// initialize, check for getUserMedia support
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
		window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
		
		this.userMedia = this.userMedia && !!navigator.getUserMedia && !!window.URL;
		
		// Older versions of firefox (< 21) apparently claim support but user media does not actually work
		if (navigator.userAgent.match(/Firefox\D+(\d+)/)) {
			if (parseInt(RegExp.$1, 10) < 21) this.userMedia = null;
		}
	},
	
	attach: function(elem) {
		// create webcam preview and attach to DOM element
		// pass in actual DOM reference, ID, or CSS selector
		if (typeof(elem) == 'string') {
			elem = document.getElementById(elem) || document.querySelector(elem);
		}
		if (!elem) {
			return this.dispatch('error', "Could not locate DOM element to attach to.");
		}
		
		this.container = elem;
		if (!this.params.width) this.params.width = elem.offsetWidth;
		if (!this.params.height) this.params.height = elem.offsetHeight;
		
		// set defaults for dest_width / dest_height if not set
		if (!this.params.dest_width) this.params.dest_width = this.params.width;
		if (!this.params.dest_height) this.params.dest_height = this.params.height;
		
		// if force_flash is set, disable userMedia
		if (this.params.force_flash) this.userMedia = null;
		
		if (this.userMedia) {
			// setup webcam video container
			var video = document.createElement('video');
			video.setAttribute('autoplay', 'autoplay');
			video.style.width = '' + this.params.dest_width + 'px';
			video.style.height = '' + this.params.dest_height + 'px';
			
			// adjust scale if dest_width or dest_height is different
			var scaleX = this.params.width / this.params.dest_width;
			var scaleY = this.params.height / this.params.dest_height;
			
			if ((scaleX != 1.0) || (scaleY != 1.0)) {
				elem.style.overflow = 'visible';
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
			
			// create offscreen canvas element to hold pixels later on
			var canvas = document.createElement('canvas');
			canvas.width = this.params.dest_width;
			canvas.height = this.params.dest_height;
			var context = canvas.getContext('2d');
			this.context = context;
			this.canvas = canvas;
			
			// ask user for access to their camera
			var self = this;
			navigator.getUserMedia({
				"audio": false,
				"video": true
			}, 
			function(stream) {
				// got access, attach stream to video
				video.src = window.URL.createObjectURL( stream ) || stream;
				Webcam.stream = stream;
				Webcam.loaded = true;
				Webcam.live = true;
				Webcam.dispatch('load');
				Webcam.dispatch('live');
			},
			function(err) {
				return self.dispatch('error', "Could not access webcam.");
			});
		}
		else {
			// flash fallback
			elem.innerHTML = this.getSWFHTML();
		}
	},
	
	reset: function() {
		// shutdown camera, reset to potentially attach again
		if (this.userMedia) {
			try { this.stream.stop(); } catch (e) {;}
			delete this.stream;
			delete this.canvas;
			delete this.context;
			delete this.video;
		}
		
		this.container.innerHTML = '';
		delete this.container;
		
		this.loaded = false;
		this.live = false;
	},
	
	set: function() {
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
	
	on: function(name, callback) {
		// set callback hook
		// supported hooks: onLoad, onError, onLive
		name = name.replace(/^on/i, '').toLowerCase();
		
		if (typeof(this.hooks[name]) == 'undefined')
			throw "Event type not supported: " + name;
		
		this.hooks[name] = callback;
	},
	
	dispatch: function() {
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
	},
	
	setSWFLocation: function(url) {
		// set location of SWF movie (defaults to webcam.swf in cwd)
		this.swfURL = url;
	},
	
	getSWFHTML: function() {
		// Return HTML for embedding flash based webcam capture movie		
		var html = '';
		
		// make sure we aren't running locally (flash doesn't work)
		if (location.protocol.match(/file/)) {
			return '<h1 style="color:red">Sorry, the Webcam.js Flash fallback does not work from local disk.  Please upload it to a web server first.</h1>';
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
		
		html += '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="'+this.protocol+'://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="'+this.params.width+'" height="'+this.params.height+'" id="webcam_movie_obj" align="middle"><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="false" /><param name="movie" value="'+this.swfURL+'" /><param name="loop" value="false" /><param name="menu" value="false" /><param name="quality" value="best" /><param name="bgcolor" value="#ffffff" /><param name="flashvars" value="'+flashvars+'"/><embed id="webcam_movie_embed" src="'+this.swfURL+'" loop="false" menu="false" quality="best" bgcolor="#ffffff" width="'+this.params.width+'" height="'+this.params.height+'" name="webcam_movie_embed" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" flashvars="'+flashvars+'"></embed></object>';
		
		return html;
	},
	
	getMovie: function() {
		// get reference to movie object/embed in DOM
		if (!this.loaded) return this.dispatch('error', "Flash Movie is not loaded yet");
		var movie = document.getElementById('webcam_movie_obj');
		if (!movie || !movie._snap) movie = document.getElementById('webcam_movie_embed');
		if (!movie) this.dispatch('error', "Cannot locate Flash movie in DOM");
		return movie;
	},
	
	snap: function() {
		// take snapshot and return image data uri
		if (!this.loaded) return this.dispatch('error', "Webcam is not loaded yet");
		if (!this.live) return this.dispatch('error', "Webcam is not live yet");
		
		if (this.userMedia) {
			// native implementation
			this.context.drawImage(this.video, 0, 0, this.params.dest_width, this.params.dest_height);
			return this.canvas.toDataURL('image/' + this.params.image_format, this.params.jpeg_quality / 100 );
		}
		else {
			// flash fallback
			var raw_data = this.getMovie()._snap();
			return 'data:image/'+this.params.image_format+';base64,' + raw_data;
		}
	},
	
	configure: function(panel) {
		// open flash configuration panel -- specify tab name:
		// "camera", "privacy", "default", "localStorage", "microphone", "settingsManager"
		if (!panel) panel = "camera";
		this.getMovie()._configure(panel);
	},
	
	flashNotify: function(type, msg) {
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
	},
	
	b64ToUint6: function(nChr) {
		// convert base64 encoded character to 6-bit integer
		// from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
		return nChr > 64 && nChr < 91 ? nChr - 65
			: nChr > 96 && nChr < 123 ? nChr - 71
			: nChr > 47 && nChr < 58 ? nChr + 4
			: nChr === 43 ? 62 : nChr === 47 ? 63 : 0;
	},

	base64DecToArr: function(sBase64, nBlocksSize) {
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
	},
	
	upload: function(image_data_uri, target_url, callback) {
		// submit image data to server using binary AJAX
		if (callback) Webcam.on('uploadComplete', callback);
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
					Webcam.dispatch('uploadProgress', progress, e);
				}
			}, false );
		}
		
		// completion handler
		http.onload = function() {
			Webcam.dispatch('uploadComplete', http.status, http.responseText, http.statusText);
		};
		
		// create a blob and decode our base64 to binary
		var blob = new Blob( [ this.base64DecToArr(raw_image_data) ], {type: 'image/'+image_fmt} );
		
		// stuff into a form, so servers can easily receive it as a standard file upload
		var form = new FormData();
		form.append( form_elem_name, blob, form_elem_name+"."+image_fmt.replace(/e/, '') );
		
		// send data to server
		http.send(form);
	}
	
};

Webcam.init();
