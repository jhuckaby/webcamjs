NOTE: You don't need anything in the "flash" directory unless you are trying to edit the ActionScript code and rebuild the Flash movie from source. WebcamJS works out of the box in your browser, just grab "webcam.js" and "webcam.swf" for everything you need. The "flash" directory is the raw Flash ActionScript source only, which is not needed at runtime.

BUILDING INSTRUCTIONS

This library requires the AS3 Core Library (as3corelib) available from Google Code:
	https://github.com/mikechambers/as3corelib

As well as the "Base64Encoder.as" file from the Adobe Flex SDK, available free from Adobe:
	svn co http://opensource.adobe.com/svn/opensource/flex/sdk/trunk/frameworks/projects/framework

After downloading and extracting the package, place the "com" and "mx" directories right here, alongside the "Webcam.fla" and "Webcam.as" files.

You should then be able to compile the FLA into a SWF in Adobe Flash CS3, CS4 or CS5. This requires at least Adobe Flash CS3 (this is a Flash 9 movie). ActionScript 3.0 is required.

- Joe
