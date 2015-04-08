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

