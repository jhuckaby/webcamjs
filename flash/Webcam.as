﻿package {
	/* Webcam.js v1.0 */
	/* Webcam library for capturing JPEG/PNG images and sending them to JavaScript */
	/* Author: Joseph Huckaby <jhuckaby@effectgames.com> */
	/* Based on JPEGCam: http://code.google.com/p/jpegcam/ */
	/* Copyright (c) 2012 Joseph Huckaby */
	/* Licensed under the MIT License */
	
	import flash.display.LoaderInfo;
	import flash.display.Sprite;
	import flash.display.StageAlign;
	import flash.display.StageScaleMode;
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.events.*;
	import flash.utils.*;
	import flash.media.Camera;
	import flash.media.Video;
	import flash.external.ExternalInterface;
	import flash.net.*;
	import flash.system.Security;
	import flash.system.SecurityPanel;
	import flash.media.Sound;
	import flash.media.SoundChannel;
	import flash.geom.Matrix;
	import mx.utils.Base64Encoder;
	import com.adobe.images.BitString;
	import com.adobe.images.PNGEncoder;
	import com.adobe.images.JPGEncoder;

	public class Webcam extends Sprite {
		private var video:Video;
		private var video_width:int;
		private var video_height:int;
		private var dest_width:int;
		private var dest_height:int;
		private var camera:Camera;
		private var bmpdata:BitmapData;
		private var jpeg_quality:int;
		private var image_format:String;
		private var fps:int;
		private var flip_horiz:Boolean;
		private var camera_idx:int;
		
		public function Webcam() {
			// class constructor
			flash.system.Security.allowDomain("*");
			var flashvars:Object = LoaderInfo(this.root.loaderInfo).parameters;
			
			video_width = Math.floor( flashvars.width );
			video_height = Math.floor( flashvars.height );
			dest_width = Math.floor( flashvars.dest_width );
			dest_height = Math.floor( flashvars.dest_height );
			jpeg_quality = Math.floor( flashvars.jpeg_quality );
			image_format = flashvars.image_format;
			fps = Math.floor( flashvars.fps );
			flip_horiz = flashvars.flip_horiz == "true";
			
			stage.scaleMode = StageScaleMode.NO_SCALE;
			// stage.scaleMode = StageScaleMode.EXACT_FIT; // Note: This breaks HD capture
			
			stage.align = StageAlign.TOP_LEFT;
			stage.stageWidth = Math.max(video_width, dest_width);
			stage.stageHeight = Math.max(video_height, dest_height);
						
			if (flashvars.new_user) {
				Security.showSettings( SecurityPanel.PRIVACY );
			}
			
			// Hack to auto-select iSight camera on Mac (JPEGCam Issue #5, submitted by manuel.gonzalez.noriega)
			// From: http://www.squidder.com/2009/03/09/trick-auto-select-mac-isight-in-flash/
			camera_idx = -1;
			for (var idx = 0, len = Camera.names.length; idx < len; idx++) {
				if (Camera.names[idx] == "USB Video Class Video") {
					camera_idx = idx;
					idx = len;
				}
			}
			if (camera_idx > -1) camera = Camera.getCamera( String(camera_idx) );
			else camera = Camera.getCamera();
									
			if (camera != null) {
				ExternalInterface.addCallback('_getCameras', getCameras);
				ExternalInterface.addCallback('_setCamera', setCamera);
				ExternalInterface.addCallback('_initCamera', initCamera);
				ExternalInterface.addCallback('_snap', snap);
				ExternalInterface.addCallback('_configure', configure);
				ExternalInterface.addCallback('_releaseCamera', releaseCamera);
								
				ExternalInterface.call('Webcam.flashNotify', 'flashInitComplete', true);
			}
			else {
				trace("You need a camera.");
				ExternalInterface.call('Webcam.flashNotify', "error", "No camera was detected.");
			}
		}
		
		public function configure(panel:String = SecurityPanel.CAMERA) {
			// show configure dialog inside flash movie
			Security.showSettings(panel);
		}

		private function activityHandler(event:ActivityEvent):void {
			trace("activityHandler: " + event);
			ExternalInterface.call('Webcam.flashNotify', 'cameraLive', true);
			
			// now disable motion detection (may help reduce CPU usage)
			camera.setMotionLevel( 100 );
		}
		
		private function handleCameraStatus(e:StatusEvent):void {
			switch (e.code) {
				case 'Camera.Muted': {
					trace("Camera not allowed");
					ExternalInterface.call('Webcam.flashNotify', "error", "Access to camera denied");
					break;
				}
				case 'Camera.Unmuted': {
					trace("Camera allowed");
					break;
				}
			}
		}
		
		public function getCameras() {
			return Camera.names;
		}

		public function setCamera(name: String) {
			for (var idx = 0, len = Camera.names.length; idx < len; idx++) {
				if (Camera.names[idx] == name) {
					camera_idx = idx;
					return;
				}
			}
			ExternalInterface.call('Webcam.flashNotify', "error", "camera: " + name + " is not found");
			trace("camera: " + name + " is not found");
		}

		public function initCamera() {
			releaseCamera();
			if (camera_idx > -1) camera = Camera.getCamera(String(camera_idx));
			else camera = Camera.getCamera();

			if (camera != null) {
				camera.addEventListener(ActivityEvent.ACTIVITY, activityHandler);
				camera.addEventListener(StatusEvent.STATUS, handleCameraStatus, false, 0, true);
				video = new Video(Math.max(video_width, dest_width), Math.max(video_height, dest_height));
				video.attachCamera(camera);
				addChild(video);

				if ((video_width < dest_width) && (video_height < dest_height)) {
					video.scaleX = video_width / dest_width;
					video.scaleY = video_height / dest_height;
				}

				if (flip_horiz) {
					video.scaleX *= -1;
					video.x = video.width + video.x;
				}

				camera.setQuality(0, 100);
				camera.setKeyFrameInterval(10);
				camera.setMode(Math.max(video_width, dest_width), Math.max(video_height, dest_height), fps);

				// only detect motion once, to determine when camera is "live"
				camera.setMotionLevel(1);
				ExternalInterface.call('Webcam.flashNotify', 'flashLoadComplete', true);
			} else {
				trace("You need a camera.");
				ExternalInterface.call('Webcam.flashNotify', "error", "No camera was detected.");
			}
		}

		public function snap() {
			// take snapshot from camera, and upload if URL was provided
			trace("in snap(), drawing to bitmap");
			
			// take snapshot, convert to jpeg, submit to server
			bmpdata = new BitmapData( Math.max(video_width, dest_width), Math.max(video_height, dest_height) );
			bmpdata.draw( video );
			
			if ((video_width > dest_width) && (video_height > dest_height)) {
				// resize image downward before submitting
				var tmpdata = new BitmapData(dest_width, dest_height);
				
				var matrix = new Matrix();
				matrix.scale( dest_width / video_width, dest_height / video_height );
				
				tmpdata.draw( bmpdata, matrix, null, null, null, true ); // smoothing
				bmpdata = tmpdata;
			} // need resize
			
			trace("converting to " + image_format);
		
			var bytes:ByteArray;
			
			if (image_format == 'png') {
				bytes = PNGEncoder.encode( bmpdata );
			}
			else {
				var encoder:JPGEncoder;
				encoder = new JPGEncoder( jpeg_quality );
				bytes = encoder.encode( bmpdata );
			}
			
			trace("raw image length: " + bytes.length);
		
			var be = new Base64Encoder();
			be.encodeBytes( bytes );
			
			var bstr = be.toString();
			trace("b64 string length: " + bstr.length);
			
			return bstr;
		}

		public function releaseCamera() {
			trace("in releaseCamera(), turn off camera");
			if (video != null){
				video.attachCamera(null);
			    video.clear();
				camera = null;
			    removeChild(video);
			}
		}
	}
}
