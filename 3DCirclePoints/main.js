import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

//-----------------	Bolier Plate	-----------------
import CCGenerator from './BoilerPlate/CCGenerator.js';		//Colour System
import MIDIMapper from './BoilerPlate/MIDIMapper.js';		//Midi Mapper
import timerObject from './BoilerPlate/timerObject.js';		//Timers
import pixelMaper from './BoilerPlate/pixelMaper.js';		//Pixel Maper


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

//3d objects for general drawing
var geometry = new Array();
var material = new Array();
var objects = new Array();

//3d objects for trailes
var trails_geometry = new Array();
var trails_material = new Array();
var trails_objects = new Array();


camera.position.z = -100;
var oIndex=0;

//colours
var maxValue = 255;
var maxColourDitherSteps = 128;
var colourList = [maxValue,0,0, maxValue,maxValue,0, 0,maxValue,0, 0,maxValue,maxValue, 0,0,maxValue, maxValue,0,maxValue, maxValue,maxValue,maxValue];
var cIndex=0, cIncrement=10, innerCIndex=0;
let cObjectOne = new CCGenerator(maxColourDitherSteps, 7, colourList);

//MIDI
let MIDISTore = new MIDIMapper();

//Pixel Mapper
var pixelMap;//
var pixelTrack=0;
var frameCounter = 0;

//System Timers
let systemTimer = new timerObject();
var echoTape;


//mouse Tracker
var mouseLocation = [0,0];
var virtualMouse = [0,0];
var cameraLookingAt = new THREE.Vector3(0,0,0);
var orbitObjectCount = 90*3;
var orbitTrailCount = 20;
var orbitTape = new Array(orbitObjectCount);
var orbitTrailTape = new Array(orbitObjectCount*orbitTrailCount);

//Audio Capture
var audioCtx;
let source;
let stream;
var biquadFilter;
var analyser;
var fftBinCount = 256;
var numberOfSections = fftBinCount/2;
var dataArray = new Array();
var statsData=0;
var audioReady = 0;
var avDevices;
var globalAudioPickup=0, audioRadius=0, audioBoxSize=0;

setUp();

const controls = new OrbitControls( camera, renderer.domElement );
controls.update();

function setUp()
{
	var mpCount=0, oCount=0;
	var localDegIndex=0, localXXFactor=0, localYYFactor=0;
	
	//Init web MIDI
	navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
	//Init websockets for OSC
	initWebSockets();
	
	//Add MIDI/OSC controls
	MIDISTore.addItem(176,1,"colourIncrement", 100);
	MIDISTore.setValue("colourIncrement", 1);
	MIDISTore.addItem(176,2,"subColourIncrement", 100);
	MIDISTore.setValue("subColourIncrement", 2);
	MIDISTore.addItem(176,3,"radius", 300);
	MIDISTore.setValue("radius", 50);

	MIDISTore.addItem(176,4,"orbitSpeed", 10);
	MIDISTore.setValue("orbitSpeed", 1);
	MIDISTore.addItem(176,5,"xxOrbitTimer", 500);
	MIDISTore.setValue("xxOrbitTimer", 100);
	MIDISTore.addItem(176,6,"trailSpacing", 90);
	MIDISTore.setValue("trailSpacing", 10);
	MIDISTore.addItem(176,7,"blockSize", 100);
	MIDISTore.setValue("blockSize", 1);
	
	//FFT & Audio Contols
	MIDISTore.addItem(176,8,"startBin", fftBinCount/2);
	MIDISTore.setValue("startBin", 27);
	MIDISTore.addItem(176,9,"binBandWidth", fftBinCount/2);
	MIDISTore.setValue("binBandWidth", 10);
	MIDISTore.addItem(176,10,"fftSmoothing", 1);
	MIDISTore.setValue("fftSmoothing", 0.6);
	MIDISTore.addItem(176,11,"filterFrequency", 5000);
	MIDISTore.setValue("filterFrequency", 1053);
	
	MIDISTore.addItem(176,12,"depthAngle", 360);
	MIDISTore.setValue("depthAngle", 0);
	
	
	//pixel map helper
	 pixelMap = new pixelMaper(MIDISTore.getValue("radius"),MIDISTore.getValue("radius"));
	
	//COlour Indexes
	cIndex=0;
	innerCIndex=0;
	
	//set up Timers
	systemTimer.addTimer("orbitObjectCounthift");
	systemTimer.startTimer("orbitObjectCounthift", 20);
	systemTimer.addTimer("xxOrbitChange");
	systemTimer.startTimer("xxOrbitChange", 100);
	systemTimer.addTimer("yyOrbitChange");
	systemTimer.startTimer("yyOrbitChange", 100);
	
	//set up timers for each orbit particle
	for(mpCount=0; mpCount<orbitObjectCount; mpCount++)
	{
		localDegIndex=Math.round((Math.random()*360));
		localXXFactor=Math.random()*(2*Math.PI);
		localYYFactor=Math.random()*(2*Math.PI);
		systemTimer.addTimer("orbit_"+mpCount);
		systemTimer.startTimer("orbit_"+mpCount, Math.round((Math.random()*100)));
		orbitTape[mpCount] = [localDegIndex,localXXFactor,localYYFactor, Math.round(Math.random())];
		for(oCount=0; oCount<orbitTrailCount; oCount++)
		{
			//orbitTrailTape[(mpCount*orbitTrailCount)+oCount] = [localDegIndex+((360/orbitTrailCount)*oCount), localXXFactor, localYYFactor];
			orbitTrailTape[(mpCount*orbitTrailCount)+oCount] = [localDegIndex+MIDISTore.getValue("trailSpacing")*(oCount+1), localXXFactor, localYYFactor];
		}
	}
	
	//set up all 3d Objects 
	setUpObjects();
	
	onmousemove = function(e)
	{
	  mouseLocation[0] = e.clientX;
	  mouseLocation[1] = e.clientY;		
	  virtualMouse = getVirtualMouse(mouseLocation[0], mouseLocation[1], 300, 200, 1);
	};
	
	
	onclick = function(e)
	{
		//console.log(MIDISTore.getValue("depthAngle"));
	};
	
	cameraLookingAt = camera.position;
	cameraLookingAt.z = 300;
	camera.position.set( cameraLookingAt.x, cameraLookingAt.y, cameraLookingAt.z );	
	
	//Set up Audio
	navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
	document.onkeypress = function(e) 
	{
		//console.log(String.fromCharCode( e.which ));
		if(String.fromCharCode( e.which )=="a")
		{
			if(audioReady==0)
			{
				startAudio();
			}
		}
	};
	audioRadius = MIDISTore.getValue("radius");
	audioBoxSize = MIDISTore.getValue("blockSize");
	//Audio set up complete
}

//------------------	WEB Audio API Functions	------------------
function gotDevices(deviceInfos)
{
	var devCounter=0;
	console.log("gotDevices\t"+deviceInfos.length);
	
	for (devCounter=0; devCounter<deviceInfos.length; devCounter++) 
	{
		console.log("Device\t["+devCounter+"]\tDeviceID["+deviceInfos[devCounter].deviceId+"]\tType["+deviceInfos[devCounter].kind+"]\rLabel["+deviceInfos[devCounter].label+"]");
	}
	avDevices = deviceInfos;
	
}
function handleError(error) 
{
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}
function getDeviceIdByName(deviceName)
{
	var devCounter=0;
	for(devCounter=0; devCounter<avDevices.length; devCounter++)
	{
		if( avDevices[devCounter].label==deviceName )
		{
			return avDevices[devCounter].deviceId;
		}
	}
}
async function startAudio()
{
	audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	analyser = audioCtx.createAnalyser();
	biquadFilter = audioCtx.createBiquadFilter();
	
	console.log("Using device id["+getDeviceIdByName("Stereo Mix (Realtek(R) Audio)")+"]");
	
	if (navigator.mediaDevices.getUserMedia) 
	{
		console.log("getUserMedia supported.");
		const constraints = { audio: {autoGainControl: false,echoCancellation: false,noiseSuppression: false,latency: 0, deviceId: getDeviceIdByName("Stereo Mix (Realtek(R) Audio)")} };
		
		navigator.mediaDevices
		  .getUserMedia(constraints)
		  .then(function (stream)
		  {
			source = audioCtx.createMediaStreamSource(stream);
			source.connect(biquadFilter);	//connect the Source INTO the filter
			biquadFilter.connect(analyser);	//connect the FILTER INTO the ANALYSER
			//source.connect(analyser);		//uncoment to listen live
			//Set up the lowpass filter
			biquadFilter.type = "bandpass";
			biquadFilter.frequency.setValueAtTime(MIDISTore.getValueRounded("filterFrequency"), audioCtx.currentTime);
			//set up the analyizer
			analyser.maxDecibels = -10;
			analyser.minDecibels = -90;
			analyser.smoothingTimeConstant = 0.85;
			analyser.fftSize = fftBinCount;
			dataArray = new Uint8Array(analyser.frequencyBinCount);	//for fft
			audioReady=1;
		  })
		  .catch(function (err) 
		  {
			console.log("The following GetUserMedia error occured: " + err);
		  });
	} 
	else
	{
		console.log("getUserMedia not supported on your browser!");
	}
}
//------------------	WEB Audio API Functions	------------------

function getVirtualMouse(x, y, xBounds, yBounds, invertX)
{
	var localVMouse = [0,0];
	if(x<(window.innerWidth/2))
	{
	  localVMouse[0] = -xBounds-((x/(window.innerWidth/2)) * -xBounds);
	}
	else
	{
	  localVMouse[0] = ((x-(window.innerWidth/2)) /(window.innerWidth/2)) * xBounds;
	}
	if(y<(window.innerHeight/2))
	{
		localVMouse[1] = -yBounds-((y/(window.innerHeight/2)) * -yBounds);
		if(invertX==1)
		{
			localVMouse[1] = localVMouse[1]*-1;
		}
	}
	else
	{
		localVMouse[1] = ((y-(window.innerHeight/2)) /(window.innerHeight/2)) * yBounds;
		if(invertX==1)
		{
			localVMouse[1] = localVMouse[1]*-1;
		}
	}
	return localVMouse;
}

function setUpObjects()
{
	var localObjectCounter=0, blockCounter=0;
	var localCentrePoints3D = [0,0,0];

	//clear all globalArrays
	geometry = new Array();
	material = new Array();
	objects = new Array();
	scene.clear();

	
	for(localObjectCounter=0; localObjectCounter<90; localObjectCounter++)
	{
		localCentrePoints3D = pixelMap.getCircluarPoints3D(0, 0, MIDISTore.getValue("radius"), (360/(orbitTape.length/3))*blockCounter, 0);

		geometry.push( new THREE.BoxGeometry( MIDISTore.getValue("blockSize"), MIDISTore.getValue("blockSize"), MIDISTore.getValue("blockSize") ) );
		material.push( new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
		material[localObjectCounter].opacity = 1;
		material[localObjectCounter].transparent = true;
		objects.push(new THREE.Mesh( geometry[localObjectCounter], material[localObjectCounter] ));
		objects[localObjectCounter].position.x = localCentrePoints3D[0];
		objects[localObjectCounter].position.y = localCentrePoints3D[1];
		objects[localObjectCounter].position.z = localCentrePoints3D[2];
		scene.add( objects[ localObjectCounter ] );	
	    blockCounter++;		
	}
	blockCounter=0;
	for(localObjectCounter=90; localObjectCounter<180; localObjectCounter++)
	{
		localCentrePoints3D = pixelMap.getCircluarPoints3D(0, 0, MIDISTore.getValue("radius"), (360/(orbitTape.length/3))*blockCounter, 0);

		geometry.push( new THREE.BoxGeometry( MIDISTore.getValue("blockSize"), MIDISTore.getValue("blockSize"), MIDISTore.getValue("blockSize") ) );
		material.push( new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
		material[localObjectCounter].opacity = 1;
		material[localObjectCounter].transparent = true;
		objects.push(new THREE.Mesh( geometry[localObjectCounter], material[localObjectCounter] ));
		objects[localObjectCounter].position.x = localCentrePoints3D[2];
		objects[localObjectCounter].position.y = localCentrePoints3D[1];
		objects[localObjectCounter].position.z = localCentrePoints3D[0];
		scene.add( objects[ localObjectCounter ] );		
		blockCounter++;		
	}
	blockCounter=0;
	for(localObjectCounter=180; localObjectCounter<270; localObjectCounter++)
	{
		localCentrePoints3D = pixelMap.getCircluarPoints3D(0, 0, MIDISTore.getValue("radius"), (360/(orbitTape.length/3))*blockCounter, 0);

		geometry.push( new THREE.BoxGeometry( MIDISTore.getValue("blockSize"), MIDISTore.getValue("blockSize"), MIDISTore.getValue("blockSize") ) );
		material.push( new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
		material[localObjectCounter].opacity = 1;
		material[localObjectCounter].transparent = true;
		objects.push(new THREE.Mesh( geometry[localObjectCounter], material[localObjectCounter] ));
		objects[localObjectCounter].position.x = localCentrePoints3D[1];
		objects[localObjectCounter].position.y = localCentrePoints3D[2];
		objects[localObjectCounter].position.z = localCentrePoints3D[0];
		scene.add( objects[ localObjectCounter ] );		
		blockCounter++;		
	}
	
	
}

function animate() 
{
	var mpointCount=0, mpStart = 1, localTrailCounter=0;
	var centrePoints = [0,0];
	var localCentrePoints3D = [0,0,0];
	var localAngle = 0;

	localTrailCounter=0;
	for(mpointCount=0; mpointCount<90; mpointCount++)
	{
		localAngle = ((360/(orbitTape.length/3))*localTrailCounter)+frameCounter;
		localCentrePoints3D = pixelMap.getCircluarPoints3D(0, 0, MIDISTore.getValue("radius"), localAngle, (MIDISTore.getValue("depthAngle")+frameCounter)%360);
		objects[mpointCount].position.x = localCentrePoints3D[0];
		objects[mpointCount].position.y = localCentrePoints3D[1];
		objects[mpointCount].position.z = localCentrePoints3D[2];
		localTrailCounter++
	}
	localTrailCounter=0;
	for(mpointCount=90; mpointCount<180; mpointCount++)
	{
		localAngle = ((360/(orbitTape.length/3))*localTrailCounter)+frameCounter;
		localCentrePoints3D = pixelMap.getCircluarPoints3D(0, 0, MIDISTore.getValue("radius"), localAngle, (MIDISTore.getValue("depthAngle")+frameCounter)%360);
		objects[mpointCount].position.x = localCentrePoints3D[2];
		objects[mpointCount].position.y = localCentrePoints3D[1];
		objects[mpointCount].position.z = localCentrePoints3D[0];
		localTrailCounter++
	}
	localTrailCounter=0;
	for(mpointCount=180; mpointCount<270; mpointCount++)
	{
		localAngle = ((360/(orbitTape.length/3))*localTrailCounter)+frameCounter;
		localCentrePoints3D = pixelMap.getCircluarPoints3D(0, 0, MIDISTore.getValue("radius"), localAngle, (MIDISTore.getValue("depthAngle")+frameCounter)%360);
		objects[mpointCount].position.x = localCentrePoints3D[1];
		objects[mpointCount].position.y = localCentrePoints3D[2];
		objects[mpointCount].position.z = localCentrePoints3D[0];
		localTrailCounter++
	}
	
	//scale/colour
	for(mpointCount=0; mpointCount<orbitTape.length; mpointCount++)
	{
		objects[mpointCount].scale.x = MIDISTore.getValue("blockSize");
		objects[mpointCount].scale.y = MIDISTore.getValue("blockSize");
		objects[mpointCount].scale.z = MIDISTore.getValue("blockSize");
		//colour modification
		cObjectOne.getColour( innerCIndex%cObjectOne._bandWidth );
		material[mpointCount].color.r = cObjectOne._currentColour[0]/255;
		material[mpointCount].color.g = cObjectOne._currentColour[1]/255;
		material[mpointCount].color.b = cObjectOne._currentColour[2]/255;
		innerCIndex += MIDISTore.getValueRounded("colourIncrement");
	}
	cIndex += MIDISTore.getValue('colourIncrement');
	innerCIndex = cIndex;
	/*
	//collect FFT data at this frame
	if(audioReady==1)
	{
		processFFT();
		audioRadius = (globalAudioPickup*(MIDISTore.getValue("radius")/2))+MIDISTore.getValue("radius");
		//audioBoxSize = (globalAudioPickup*MIDISTore.getValue("blockSize"))+MIDISTore.getValue("blockSize");
		audioBoxSize = (globalAudioPickup*MIDISTore.getValue("blockSize"));
	}
	
	if(systemTimer.hasTimedOut("orbitObjectCounthift"))
	{
		for(mpointCount=0; mpointCount<orbitTape.length; mpointCount++)
		{
			centrePoints = pixelMap.getAdvancedCircularPoints(objects[0].position.x, objects[0].position.y, audioRadius, orbitTape[mpointCount][0], 1, 1, orbitTape[mpointCount][1], orbitTape[mpointCount][2]);
			objects[mpStart].position.x = centrePoints[0];
			objects[mpStart].position.y = centrePoints[1];
			objects[mpStart].scale.x = audioBoxSize; //MIDISTore.getValue("blockSize");
			objects[mpStart].scale.y = audioBoxSize; //MIDISTore.getValue("blockSize");
			objects[mpStart].scale.z = audioBoxSize; //MIDISTore.getValue("blockSize");
			//colour modification
			cObjectOne.getColour( innerCIndex%cObjectOne._bandWidth );
			material[mpStart].color.r = cObjectOne._currentColour[0]/255;
			material[mpStart].color.g = cObjectOne._currentColour[1]/255;
			material[mpStart].color.b = cObjectOne._currentColour[2]/255;
			if(orbitTape[mpointCount][3]==0)
			{
				orbitTape[mpointCount][0] += MIDISTore.getValue("orbitSpeed");
			}
			else
			{
				orbitTape[mpointCount][0] -= MIDISTore.getValue("orbitSpeed");
			}
			//render trails
			for(localTrailCounter=0; localTrailCounter<orbitTrailCount; localTrailCounter++)
			{
				centrePoints = pixelMap.getAdvancedCircularPoints(objects[0].position.x, objects[0].position.y, audioRadius, orbitTape[mpointCount][0]+((localTrailCounter+1)*MIDISTore.getValue("trailSpacing")), 1, 1, orbitTrailTape[(mpointCount*orbitTrailCount)+localTrailCounter][1], orbitTrailTape[(mpointCount*orbitTrailCount)+localTrailCounter][2]);
				trails_objects[(mpointCount*orbitTrailCount)+localTrailCounter].position.x = centrePoints[0];
				trails_objects[(mpointCount*orbitTrailCount)+localTrailCounter].position.y = centrePoints[1];
				trails_objects[(mpointCount*orbitTrailCount)+localTrailCounter].scale.x = audioBoxSize; //MIDISTore.getValue("blockSize");
				trails_objects[(mpointCount*orbitTrailCount)+localTrailCounter].scale.y = audioBoxSize; //MIDISTore.getValue("blockSize");
				trails_objects[(mpointCount*orbitTrailCount)+localTrailCounter].scale.z = audioBoxSize; //MIDISTore.getValue("blockSize");
				trails_material[(mpointCount*orbitTrailCount)+localTrailCounter].color.r = cObjectOne._currentColour[0]/255;
				trails_material[(mpointCount*orbitTrailCount)+localTrailCounter].color.g = cObjectOne._currentColour[1]/255;
				trails_material[(mpointCount*orbitTrailCount)+localTrailCounter].color.b = cObjectOne._currentColour[2]/255;
				orbitTrailTape[(mpointCount*orbitTrailCount)+localTrailCounter][0] += MIDISTore.getValue("orbitSpeed");
			}
			
			mpStart++;
			innerCIndex += MIDISTore.getValueRounded("colourIncrement");
		}		
		systemTimer.startTimer("orbitObjectCounthift", 20);
		cIndex += MIDISTore.getValue('colourIncrement');
		innerCIndex = cIndex;
	}	
	*/

	requestAnimationFrame( animate );
	controls.update();
	renderer.render( scene, camera );
	frameCounter+=5;
	
}
animate();


function processFFT()
{
	var localObjectIndex=0;
	if(audioReady==1)
	{
		biquadFilter.frequency.setValueAtTime(MIDISTore.getValueRounded("filterFrequency"), audioCtx.currentTime);
		analyser.smoothingTimeConstant = MIDISTore.getValue('fftSmoothing');
		analyser.getByteFrequencyData(dataArray);
		//clear stats data
		statsData=0;
		for(localObjectIndex=0; localObjectIndex<dataArray.length; localObjectIndex++)
		{
			if(localObjectIndex>=MIDISTore.getValueRounded("startBin") && localObjectIndex<=MIDISTore.getValueRounded("startBin")+MIDISTore.getValueRounded("binBandWidth"))
			{
				statsData+=dataArray[localObjectIndex];
			}
		}
		globalAudioPickup = (statsData/MIDISTore.getValueRounded("binBandWidth"))/255;
	}
}

function shiftRight(arrayObject)
{
	var arrayIndex=0;
	
	for(arrayIndex=arrayObject.length-1; arrayIndex>0; arrayIndex--)
	{
		arrayObject[arrayIndex] = arrayObject[arrayIndex-1];
	}
}

function shiftRightorbitObjectCount(arrayObject)
{
	var arrayIndex=0;
	
	for(arrayIndex=arrayObject.length-1; arrayIndex>0; arrayIndex--)
	{
		arrayObject[arrayIndex][0] = arrayObject[arrayIndex-1][0];
		arrayObject[arrayIndex][1] = arrayObject[arrayIndex-1][1];
	}
}
//-------------MIDI FUNCTIONS--------------------------
function onMIDISuccess(midiAccess)
{
    console.log(midiAccess);

    var inputs = midiAccess.inputs;
    var outputs = midiAccess.outputs;
	
	for(var input of midiAccess.inputs.values())
	{
        input.onmidimessage = getMIDIMessage;
    }
}
function onMIDIFailure()
{
    console.log('Could not access your MIDI devices.');
}
function getMIDIMessage(midiMessage) 
{
	//console.log(midiMessage.data[0]+" "+midiMessage.data[1]+" "+midiMessage.data[2]);
	MIDISTore.onMidiEvent(midiMessage)
}
//-------------MIDI FUNCTIONS--------------------------
//------------	WEB SOCKET Functions	------------
var wsObject;
function sleep(ms)
{
	return new Promise( resolve => setTimeout(resolve, ms));
}

function initWebSockets()
{
	wsObject = new WebSocket("wss://localhost:8000");
	
	wsObject.onopen = function()
	{
		wsObject.send("HELLO_FROM_CLIENT");
	};

	wsObject.onclose = function()
	{
	};

	wsObject.onmessage = function(event)
	{
		handleOSCEvent(event.data);
	};
}
function handleOSCEvent(data)
{
	var currValue = 0, numberOfValues=0;
	var currControl = "";
	var valIndex=0, valCounter=0;
	var valueArray;
	
	console.log("["+data+"]");
	
	currControl = data.substr(0, findNeedle(',', data, 0));
	numberOfValues = data.substr(findNeedle(',', data, 0)+1, (findNeedle(',', data, 1))-(findNeedle(',', data, 0)+1) );
	valueArray = new Array(numberOfValues);
	for(valCounter=0; valCounter<numberOfValues; valCounter++)
	{
		valIndex = findNeedle(',', data, 1+valCounter)+1;
		if(valCounter+1<numberOfValues)
		{
			valueArray[valCounter] = data.substr(valIndex, findNeedle(',', data, 1+(valCounter+1))-valIndex);
			console.log("more Value["+valCounter+"]["+valueArray[valCounter]+"]");
		}
		else
		{
			valueArray[valCounter] = data.substr(valIndex, data.length-valIndex);
			console.log("last Value["+valCounter+"]["+valueArray[valCounter]+"]");
		}
	}
	currValue = valueArray[numberOfValues-1];
	//console.log("Contol Name["+currControl+"]\tNumber Of Values["+numberOfValues+"]\tLastValue["+currValue+"]");
	MIDISTore.setMidiValue(currControl, currValue*127);
	MIDISTore.setMultiValues(currControl, valueArray);
}
function findNeedle(needle, haystack, needleCount)
{
	var aIndex=0, nCount=0;
	
	for(aIndex=0; aIndex<haystack.length; aIndex++)
	{
		if(haystack[aIndex]==needle && nCount==needleCount)
		{
			return aIndex;
		}
		else if(haystack[aIndex]==needle && nCount<needleCount)
		{
			nCount++;
		}
	}
	return -1;
}
//------------	WEB SOCKET Functions	------------
