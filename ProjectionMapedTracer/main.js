import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
//-----------------	Bolier Plate	-----------------
import CCGenerator from './BoilerPlate/CCGenerator.js';					//Colour System
import MIDIMapper from './BoilerPlate/MIDIMapper.js';					//Midi Mapper
import timerObject from './BoilerPlate/timerObject.js';					//Timers
import pixelMaper from './BoilerPlate/pixelMaper.js';					//Pixel Maper
import envelopGenerator from './BoilerPlate/envelopGenerator.js';		//Envelop Generator
import animationQue from './BoilerPlate/animationQue.js';				//Animation Sequencer
import animationObject from './BoilerPlate/animationObject.js';			//Generic Object Tracking class

//Scence Set up
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.1, 2000 );
//const camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 5000 );
const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );

//Set up the global DIVs for debug data to be overlaid
var mainDIv, fftDiv, debugCanvas, logCanvas, renderCanvas;
mainDIv = document.createElement('div');
mainDIv.setAttribute('id','mainDiv');
mainDIv.setAttribute('style','opacity: 1');
fftDiv = document.createElement('div');
fftDiv.setAttribute('id','fftDiv');
fftDiv.setAttribute('hidden', 'true');
//Debug Canvas for lines
debugCanvas = document.createElement('canvas');
debugCanvas.setAttribute('id','debugCanvas');
fftDiv.appendChild(debugCanvas);
//Debug Log Canvas
logCanvas = document.createElement('canvas');
logCanvas.setAttribute('id','logCanvas');
//HTML5 Canvas
renderCanvas = document.createElement('canvas');
renderCanvas.setAttribute('id','renderCanvas');
fftDiv.appendChild(renderCanvas);

fftDiv.appendChild(logCanvas);
mainDIv.appendChild(fftDiv);
renderer.domElement.setAttribute('id','threejscanvas');
mainDIv.appendChild( renderer.domElement );
document.body.appendChild( mainDIv );

//Lighting
var numberOfLights = 8;
var lights = new Array();
var lightHelpers = new Array();
var lightHelperObjectData = new Array();

//Colour system global vars
var cIndex=0, innerCIndex=0;

//MIDI
let MIDISTore = new MIDIMapper();
var MIDILEDMap = [[1,'C#-1',13],[2,'F0',29],[3,'A1',45],[4,'C#3',61],[5,'F4',77],[6,'A5',93],[7,'C#7',109],[8,'F8',125],[9,'D-1',14],[10,'F#0',30],[11,'A#1',46],[12,'D3',62],[13,'F#4',78],[14,'A#5',94],[15,'D7',110],[16,'F#8',126],[17,'D#-1',15],[18,'G0',31],[19,'B1',47],[20,'D#3',63],[21,'G4',79],[22,'B5',95],[23,'D#7',111],[24,'G8',127]];
var MIDILEDColourMap = [[12,'Off','Off'],[13,'Red','Low'],[15,'Red','Full'],[29,'Amber','Low'],[63,'Amber','Full'],[62,'Yellow','Full'],[28,'Green','Low'],[60,'Green','Full']];
var outputMIDIDevice;
//Global Websocket object for OSC
var wsObject;

//Pixel Mapper
var pixelMap;
var randomPoints = [0,0];
var screenRange = [300,150,209];

//System Timers
let systemTimer = new timerObject();

//mouse Tracker
var mouseLocation = [0,0];
var virtualMouse = [0,0];
var cameraLookingAt = new THREE.Vector3(0,0,0);
var globalClickID = 0;
var objectTape = new Array();

//Envelops
var envelopSystem = new envelopGenerator();

//efects composer

const renderScene = new RenderPass( scene, camera );
const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
let composer = new EffectComposer( renderer );
composer.addPass( renderScene );
composer.addPass( bloomPass );
var enablePostProcessing = 0;

//Global Animation Que
var animationSystem = new animationQue();
animationQueSetup();

setUp();

const controls = new OrbitControls( camera, renderer.domElement );
controls.update();
controls.autoRotateSpeed=1;

//debug vars
var debugOn = 0;
var debugString = "";


function animationQueSetup()
{
	//colours
	var maxValue = 255;
	var maxColourDitherSteps = 128;
	var colourList_1 = [maxValue,0,0, maxValue,maxValue,0, 0,maxValue,0, 0,maxValue,maxValue, 0,0,maxValue, maxValue,0,maxValue, maxValue,maxValue,maxValue];
	var colourList_2 = [maxValue,maxValue,maxValue, 0,0,0, maxValue,0,0];
	var colourList_3 = [0,0,maxValue, maxValue,maxValue,maxValue];
	var colourList_4 = [maxValue,0,0, maxValue,maxValue,0, 0,maxValue,0, 0,maxValue,maxValue, 0,0,maxValue, maxValue,0,maxValue];

	//Animation 1	----------------------------------------------------------------------------------------------------------------------------
	animationSystem.addAnimation("Tracer", 30, "canvas");
	//Set up controls
	animationSystem.addControl("Tracer", 176, 1, "colourIncrement", 20, 3);
	animationSystem.addControl("Tracer", 176, 2, "subColourIncrement", 20, 8);
	animationSystem.addControl("Tracer", 176, 3, "pointsPerSegment", 1, 0.25);
	animationSystem.addControl("Tracer", 176, 4, "wobleAmount", 200, 10);
	animationSystem.addControl("Tracer", 176, 5, "wobleIncrement", 20, 1);
	animationSystem.addControl("Tracer", 176, 6, "lineThickness", 10, 0);
	animationSystem.addControl("Tracer", 176, 25, "fadeValue", 1, 0.1);
	
	
	//Set up colour System
	animationSystem.addColourSystem("Tracer", new CCGenerator(maxColourDitherSteps, colourList_1.length/3, colourList_1));
	animationSystem.addFunctions("Tracer", animation_1_setup, animation_1_cleanup, animation_1);
		
	//--------------	Set up the fade out and fade in enevelops	--------------
	envelopSystem.addWithTimeCode("fadeOut", [100,0], [100,100], 1, 0);
	envelopSystem.addWithTimeCode("fadeIn", [0,100], [100,100], 1, 0);
	//----------------------------------------------------------------------------
}

function processAnimationQue(init)
{
	if(animationSystem._change==2 || init==1)
	{
		//Clear previous animations resources from system
		animationObjectCleanUp(animationSystem._previousAnimation);
		
		//Clear midi controls for previous animation
		animationSystem.clearControls( animationSystem.getAnimationName(animationSystem._previousAnimation), MIDISTore );
		//Load up midi controls for current animation
		animationSystem.setUpControls( animationSystem.getAnimationName(animationSystem._currentAnimation), MIDISTore);
		//Clear envelops for previous animation
		animationSystem.clearEnvelops( animationSystem.getAnimationName(animationSystem._previousAnimation), envelopSystem);
		//Load envelops for current animation
		animationSystem.setUpEnvelops( animationSystem.getAnimationName(animationSystem._currentAnimation), envelopSystem);
		//Clear timers for previous animation
		animationSystem.clearTimers( animationSystem.getAnimationName(animationSystem._previousAnimation), systemTimer);
		//Load timers for current animation
		animationSystem.setUpTimers( animationSystem.getAnimationName(animationSystem._currentAnimation), systemTimer);
		
		//reset change flag to fade in
		animationSystem._change=3;
		//reset conrol leds
		if(init!=1)
		{
			setUpControllerLEDs();
		}
		//Set up current animations Objects
		animationObjectSetup(animationSystem._currentAnimation);
	}
}

var animationKeyList = ["A1"];
function processAnimationChangeViaKeys()
{
	var localKeyCounter = 0;
	for(localKeyCounter=0; localKeyCounter<animationKeyList.length; localKeyCounter++)
	{
		if(MIDISTore.hasChanged(animationKeyList[localKeyCounter]))
		{
			if(MIDISTore.getValue(animationKeyList[localKeyCounter])==1)
			{
				animationSystem.gotoAnimation(localKeyCounter);
			}
		}
	}
}

function animationObjectSetup(animationIndex)
{
	animationSystem.getFunctions(animationIndex).setupFunction();
}
function animationObjectCleanUp(animationIndex)
{
	animationSystem.getFunctions(animationIndex).cleanUpFunction();	
}

//set up	--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function animation_1_setup()
{
	var fftOverLayCanvas = document.getElementById("renderCanvas");

	//clear canvas
	clearCanvas("renderCanvas", "rgba(0,0,0,1)");
	
	//Display canvas Overlays
	document.getElementById("fftDiv").hidden=false;
	document.getElementById("debugCanvas").hidden=true;
	document.getElementById("logCanvas").hidden=true;
	document.getElementById("renderCanvas").hidden=false;
	
	cIndex=0;
	innerCIndex=0
}


//Clean up	--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function animation_1_cleanup()
{
	//Hide canvas overlays
	document.getElementById("fftDiv").hidden=true;
	document.getElementById("debugCanvas").hidden=false;
	document.getElementById("logCanvas").hidden=true;
	document.getElementById("renderCanvas").hidden=true;
	
	
	
	cIndex=0;
	innerCIndex=0;
	
	//clear the object tape
	objectTape = new Array();
	//reset global id counter
	globalClickID=0;
}

function setUp()
{
	var pointIndex = 0, subPointIndex=0;
	
	//Init web MIDI
	navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
	
	//Init websockets for OSC
	//initWebSockets();
	
	//pixel map helper
	pixelMap = new pixelMaper(2,2);
	
	//set up the scence with lighting
	setUpObjects();
	
	//Set up all animation controls for current Animation
	processAnimationQue(1);
	
	//add global midi conrols
	MIDISTore.addItemKEY(145, 48, "A1", 1, 0);
	
	//Mouse follow
	onmousemove = function(e)
	{
	  mouseLocation[0] = e.clientX;
	  mouseLocation[1] = e.clientY;		
	  //virtualMouse = getVirtualMouse(mouseLocation[0], mouseLocation[1], screenRange[0], screenRange[1], 1);
	  if(MIDISTore.getValue("followOn")==1)
		{
			mouseLocation[2] = 1;	 
		}
		else
		{
			mouseLocation[2] = 0;
		}	  
	};
	onmouseout = function(e)
	{
		mouseLocation[2] = 0;
	}
	
	//mouse click
	onclick = function(e)
	{
		var genObject;
		var distance=0;
		genObject = new animationObject();
		genObject.objectID = globalClickID;
		//check if this click is within 10px of last click to join them
		if(objectTape.length>0)
		{
			distance = pixelMap.measureDistance([objectTape[objectTape.length-1].position[0], objectTape[objectTape.length-1].position[1]], [e.clientX, e.clientY]);
			if(distance<10)
			{
				genObject.position[0] = objectTape[objectTape.length-1].position[0];
				genObject.position[1] = objectTape[objectTape.length-1].position[1];
			}
			else
			{
				genObject.position[0] = e.clientX;
				genObject.position[1] = e.clientY;
			}
			console.log("This click is within "+distance+" pixels of last click.");
		}
		else
		{
			genObject.position[0] = e.clientX;
			genObject.position[1] = e.clientY;
		}
		objectTape.push(genObject);
		envelopSystem.addWithTimeCode("woble_"+globalClickID, [0,360], [200,200], 1, 0);
		globalClickID++;
	};
	
	//Camera location preset
	cameraLookingAt = camera.position;
	cameraLookingAt.z = 300;
	camera.position.set( cameraLookingAt.x, cameraLookingAt.y, cameraLookingAt.z );	
	
	document.onkeypress = function(e) 
	{
		//console.log(String.fromCharCode( e.which ));
		if(String.fromCharCode( e.which )=="d")
		{
			objectTape.pop();	
		}
		else if(String.fromCharCode( e.which )=="b")
		{
			/*
			currentBeatInterval = Date.now()-beatTimer;
			MIDISTore.setValue("beatTimer", currentBeatInterval);
			systemTimer.startTimer("beatTimer", MIDISTore.getValue("beatTimer"));
			beatTimer = Date.now();
			*/
		}
		else if(String.fromCharCode( e.which )=="=")
		{
			animationSystem.next();
			console.log("NEXT->Now playing["+animationSystem.getAnimationName(animationSystem._currentAnimation)+"]");
		}
		else if(String.fromCharCode( e.which )=="-")
		{
			animationSystem.previous();
			console.log("PREVIOUS->Now playing["+animationSystem.getAnimationName(animationSystem._currentAnimation)+"]");
		}

	};
	//Canvas Overlays for debug
	setUpCanvasOverlay("debugCanvas");
	setUpCanvasOverlay("logCanvas");
	setUpCanvasOverlay("renderCanvas");
}

function setUpControllerLEDs()
{
	var midiControlIndex=0;
	var midiMessageToController = [144,0,0];
	
	//Turn off all controlls
	for(midiControlIndex=0; midiControlIndex<MIDILEDMap.length; midiControlIndex++)
	{
		midiMessageToController[1] = MIDILEDMap[midiControlIndex][2];
		outputMIDIDevice.send(midiMessageToController);
	}
	//turn off all buttons 33 to 48 inclusive
	
	midiMessageToController[0] = 176;
	midiMessageToController[1] = 33;
	midiMessageToController[2] = 0;
	
	
	for(midiControlIndex=0; midiControlIndex<16; midiControlIndex++)
	{
		outputMIDIDevice.send(midiMessageToController);
		midiMessageToController[1]++;
	}
	
	//Turn on all controlls that are added
	
	for(midiControlIndex=0; midiControlIndex<MIDISTore.numberOfItems; midiControlIndex++)
	{
		if( MIDISTore.midiMapArray[midiControlIndex][1] < 25 && MIDISTore.midiMapArray[midiControlIndex][8]==0)
		{
			//light up this controll
			midiMessageToController[0] = 144;
			midiMessageToController[1] = MIDILEDMap[findLEDIndex(MIDISTore.midiMapArray[midiControlIndex][1])][2];
			midiMessageToController[2] = 60;
			outputMIDIDevice.send(midiMessageToController);
		}
		else if(MIDISTore.midiMapArray[midiControlIndex][1]>=33 && MIDISTore.midiMapArray[midiControlIndex][1]<=48  && MIDISTore.midiMapArray[midiControlIndex][8]==0)
		{
			midiMessageToController[0] = 176;
			midiMessageToController[1] = MIDISTore.midiMapArray[midiControlIndex][1];
			midiMessageToController[2] = 60;
			outputMIDIDevice.send(midiMessageToController);
		}
	}
	
}

function findLEDIndex(ccID)
{
	var ccIndex=0;
	for(ccIndex=0; ccIndex<MIDILEDMap.length; ccIndex++)
	{
		if(ccID==MIDILEDMap[ccIndex][0])
		{
			return ccIndex;
		}
	}
}

function buttonLights()
{
	var midiControlIndex=0;
	var buttonRED = 15, buttonGreen = 60;
	var midiMessageToController = [176,0,0];
	for(midiControlIndex=33; midiControlIndex<49; midiControlIndex++)
	{
		if(MIDISTore.getValueFromCCID(176,midiControlIndex,1)==1)
		{
			midiMessageToController[1] = midiControlIndex;
			midiMessageToController[2] = buttonRED;
			outputMIDIDevice.send(midiMessageToController);
		}
		else if(MIDISTore.getValueFromCCID(176,midiControlIndex,1)==0)
		{
			midiMessageToController[1] = midiControlIndex;
			midiMessageToController[2] = buttonGreen;
			outputMIDIDevice.send(midiMessageToController);
		}
	}
}

//Canvas Overlays
function debugToCanvas(canvasID, xpos, ypos, fontSize, debugString)//debugCanvas
{
	var fftOverLayCanvas = document.getElementById(canvasID);
	var canvasObject = fftOverLayCanvas.getContext("2d");
	
	canvasObject.fillStyle = "rgba(255,255,255,1)";
	canvasObject.font = fontSize+"px Arial";
	canvasObject.fillText(debugString, xpos, ypos);
}
function setUpCanvasOverlay(canvasID)
{
	var fftOverLayCanvas = document.getElementById(canvasID);
	fftOverLayCanvas.width = window.innerWidth;
	fftOverLayCanvas.height = window.innerHeight-4;	
}
function clearCanvas(canvasID, fillStyle)
{
	var fftOverLayCanvas = document.getElementById(canvasID);
	var canvasObject = fftOverLayCanvas.getContext("2d");
	if(fillStyle==null)
	{
		canvasObject.clearRect(0, 0, fftOverLayCanvas.width,fftOverLayCanvas.height);
	}
	else
	{
		canvasObject.fillStyle = fillStyle;
		canvasObject.fillRect(0, 0, fftOverLayCanvas.width,fftOverLayCanvas.height);
	}
}

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
	var localObjectCounter = 0;
	var localCentrePoints = [0,0];
	var lightRadius = 500;	
	//clear Scene
	scene.clear();
	//set up scene background COlour
	//scene.background = new THREE.Color( 0xffffff );

	//set up lighting around the y axis
	for(localObjectCounter=0; localObjectCounter<numberOfLights/2; localObjectCounter++)
	{
		lights.push(new THREE.DirectionalLight( 0xffffff, 5 ));
		localCentrePoints = pixelMap.getCircularPointsRaw(0, 0, lightRadius, (360/(numberOfLights/2))*localObjectCounter);
		lights[localObjectCounter].position.x = localCentrePoints[0];
		lights[localObjectCounter].position.y = 0;
		lights[localObjectCounter].position.z = localCentrePoints[1];
		lightHelpers.push([localCentrePoints[0], 0, localCentrePoints[1]]);
		lights[localObjectCounter].castShadow = true;
		scene.add(lights[localObjectCounter]);
	}	
	//set up lighting around the x axis
	for(localObjectCounter=numberOfLights/2; localObjectCounter<numberOfLights; localObjectCounter++)
	{
		lights.push(new THREE.DirectionalLight( 0xffffff, 5 ));
		localCentrePoints = pixelMap.getCircularPointsRaw(0, 0, lightRadius, (360/(numberOfLights/2))*localObjectCounter-(numberOfLights/2));
		lights[localObjectCounter].position.x = 0;
		lights[localObjectCounter].position.y = localCentrePoints[0];
		lights[localObjectCounter].position.z = localCentrePoints[1];
		lightHelpers.push([0, localCentrePoints[0], localCentrePoints[1]]);
		scene.add(lights[localObjectCounter]);
	}
	//------------------------------------------------------------
	//Debug Axis View
	//------------------------------------------------------------
	//const axesHelper = new THREE.AxesHelper( 200 );
	//scene.add( axesHelper );
	//------------------------------------------------------------
}

//Animation play scripts
function animation_1()
{
	if(animationSystem._change!=0)
	{
		return;
	}
	var localObjectCounter = 0;
	var fftOverLayCanvas = document.getElementById("renderCanvas");
	var canvasObject = fftOverLayCanvas.getContext("2d");
	animationSystem.setCurrentColourObject("Tracer");
	var localColourObject = animationSystem._colourObject;
	var tempAngle=0, tempLength=0;
	var debugText="";
	
	clearCanvas("renderCanvas", "rgba(0,0,0,"+MIDISTore.getValue("fadeValue")+")");
	
	for(localObjectCounter=0; localObjectCounter<objectTape.length; localObjectCounter++)
	{
		localColourObject.getRGBA(innerCIndex%localColourObject._bandWidth);
		canvasObject.strokeStyle = localColourObject._rgba;
		canvasObject.lineWidth = MIDISTore.getValue("lineThickness")+1;
		canvasObject.beginPath();
		canvasObject.ellipse(objectTape[localObjectCounter].position[0], objectTape[localObjectCounter].position[1], 10, 10, 0, 0,  2 * Math.PI);
		canvasObject.stroke();
		innerCIndex += MIDISTore.getValue("subColourIncrement");
	}
	cIndex += MIDISTore.getValue("colourIncrement");
	innerCIndex = cIndex;
	
	//---
	if(objectTape.length>0)
	{
		for(localObjectCounter=0; localObjectCounter<objectTape.length; localObjectCounter+=2)
		{
			if(localObjectCounter+1<objectTape.length)
			{
				tempAngle = pixelMap.measureAngle([objectTape[localObjectCounter].position[0],objectTape[localObjectCounter].position[1]], [objectTape[localObjectCounter+1].position[0],objectTape[localObjectCounter+1].position[1]]);
				tempAngle = (tempAngle-180);
				tempLength = pixelMap.measureDistance([objectTape[localObjectCounter].position[0],objectTape[localObjectCounter].position[1]], [objectTape[localObjectCounter+1].position[0],objectTape[localObjectCounter+1].position[1]]);
				drawWave(objectTape[localObjectCounter].objectID, [objectTape[localObjectCounter].position[0],objectTape[localObjectCounter].position[1]], [objectTape[localObjectCounter+1].position[0],objectTape[localObjectCounter+1].position[1]], tempLength, (100*MIDISTore.getValue('pointsPerSegment'))+1, tempAngle, localColourObject, cIndex, canvasObject);
			}
		}
	}
	//debugToCanvas("renderCanvas", 200, 100, 20, debugText);
}

function drawWave(objectTapeID, pointA, pointB, numberOfPoints, rotationalIncrement, directionAngle, colourToUse, currentColourIndex, canvasObject)
{
	var pIndex = [0,0], wIndex = [0,0];
	var pCounter=0, envelopCounter=0;
	var currentTimeCode = envelopSystem.getTimeCode("woble_"+objectTapeID);
	var wobleColourIndex = currentColourIndex;
	
	for(pCounter=0; pCounter<numberOfPoints; pCounter+=rotationalIncrement)
	{
		envelopCounter = envelopSystem.getEnvelopNonZeroStart("woble_"+objectTapeID, MIDISTore.getValue('wobleIncrement'), 0);
		//debugToCanvas("renderCanvas", 200, 600, 20, "LFO["+envelopCounter+"]");
		pIndex = pixelMap.getCircularPointsRaw(pointA[0], pointA[1], pCounter, directionAngle);
		wIndex = pixelMap.getCircularPointsRaw(pIndex[0], pIndex[1], MIDISTore.getValue('wobleAmount'), 360-envelopCounter);
		
		colourToUse.getRGBA(wobleColourIndex%colourToUse._bandWidth);
		canvasObject.strokeStyle = colourToUse._rgba;
		canvasObject.lineWidth = MIDISTore.getValue("lineThickness")+1;
		canvasObject.beginPath();
		canvasObject.ellipse(pIndex[0], pIndex[1], 2, 2, 0, 0,  2 * Math.PI);
		canvasObject.ellipse(wIndex[0], wIndex[1], 2, 2, 0, 0,  2 * Math.PI);
		canvasObject.stroke();
		wobleColourIndex+=MIDISTore.getValue("subColourIncrement");
	}
	envelopSystem.setTimeCode("woble_"+objectTapeID, currentTimeCode+2);
}

function animate() 
{
	var localObjectCounter = 0, opacityIndex = 0;
	
	processAnimationQue(0);
	processAnimationChangeViaKeys();
	
	//fade out	---------------------------------------------------------------------------------------------------------
	if(animationSystem._change==1)
	{
		for(localObjectCounter=0; localObjectCounter<numberOfLights; localObjectCounter++)
		{
			//lights[localObjectCounter].intensity  = envelopSystem.getEnvelopNonZeroStartAsRatioSingleShot_SINGLE("fadeOut", 0.5, 0, 100)*1;
			opacityIndex = envelopSystem.getEnvelopNonZeroStartAsRatioSingleShot_SINGLE("fadeOut", 0.5, 0, 100);
			if(opacityIndex>=0)
			{
				document.getElementById("mainDiv").style.opacity = opacityIndex;
			}
		}
		if(envelopSystem.getOneShotState("fadeOut")==2)
		{
			animationSystem._change=2;
			envelopSystem.setOneShotState("fadeOut", 1, 0);
		}
	}
	else if(animationSystem._change==3)
	{
		for(localObjectCounter=0; localObjectCounter<numberOfLights; localObjectCounter++)
		{
			//lights[localObjectCounter].intensity  = envelopSystem.getEnvelopNonZeroStartAsRatioSingleShot_SINGLE("fadeIn", 0.5, 0, 100)*1;
			opacityIndex = envelopSystem.getEnvelopNonZeroStartAsRatioSingleShot_SINGLE("fadeIn", 0.5, 0, 100);
			if(opacityIndex>=0)
			{
				document.getElementById("mainDiv").style.opacity = opacityIndex;
			}
		}
		if(envelopSystem.getOneShotState("fadeIn")==2)
		{
			animationSystem._change=0;
			envelopSystem.setOneShotState("fadeIn", 1, 0);
		}
	}
	//------------------------------------------------------------------------------------------------------------------------------
	
	//Call current animation function
	animationSystem.getFunctions(animationSystem._currentAnimation).animationFunction();
	
	
	//Light Intencity
	if(MIDISTore.hasChanged("lightIntensity") && animationSystem._change==0)
	{
		for(localObjectCounter=0; localObjectCounter<numberOfLights; localObjectCounter++)
		{
			lights[localObjectCounter].intensity  = MIDISTore.getValue("lightIntensity");
		}	
	}
	//Light helpers on/off
	if(MIDISTore.hasChanged("lightHelpers"))
	{
		for(localObjectCounter=0; localObjectCounter<numberOfLights; localObjectCounter++)
		{	
			lightHelperObjectData[localObjectCounter][1].opacity=MIDISTore.getValue("lightHelpers");
		}
	}	
	
	requestAnimationFrame( animate );
	controls.update();
	if(enablePostProcessing==0)
	{
		renderer.render( scene, camera );		//Standard render method
	}
	else
	{
		composer.render();						//Render via effects composer
	}
	
	//debug Log
	/*
	if(MIDISTore.hasChanged("debugOn"))
	{
		if( MIDISTore.getValue("debugOn")==1 )
		{
			document.getElementById("fftDiv").hidden=false;
			document.getElementById("debugCanvas").hidden=true;
			document.getElementById("logCanvas").hidden=false;
			document.getElementById("renderCanvas").hidden=true;
			debugOn = 1;
		}
		else
		{
			document.getElementById("fftDiv").hidden=true;
			document.getElementById("debugCanvas").hidden=false;
			document.getElementById("logCanvas").hidden=true;
			document.getElementById("renderCanvas").hidden=true;
			debugOn = 0;
		}
	}
	if(debugOn==1)
	{
		clearCanvas("logCanvas");
		debugString = "BLAHBLAHBLAHBLAHBLAHBLAHBLAHBLAHBLAHBLAHBLAHBLAHBLAH!	BLAH";	
		//(canvasID, xpos, ypos, fontSize, debugString
		debugToCanvas("logCanvas", 10, 20, 15, debugString);
	}
	*/
	
	//Auto rotate
	if(MIDISTore.hasChanged("autoRotate"))
	{
		if( MIDISTore.getValue("autoRotate")==1 )
		{
			controls.autoRotate=true;
		}
		else
		{
			controls.autoRotate=false;
		}
		controls.autoRotateSpeed = MIDISTore.getValue("autoRotateSpeed");
	}
	
}
animate();

//-------------MIDI FUNCTIONS--------------------------
function onMIDISuccess(midiAccess)
{
	//console.log(midiAccess);
	for(var input of midiAccess.inputs.values())
	{
        input.onmidimessage = getMIDIMessage;
    }
	midiAccess.outputs.forEach(output => console.log(output.manufacturer, output.name, output.id));
	outputMIDIDevice = midiAccess.outputs.get("output-1");
	outputMIDIDevice.open();
	//light up controller done after all midi elements have been entered (move up top!!!)
	setUpControllerLEDs();
}
function onMIDIFailure()
{
    console.log('Could not access your MIDI devices.');
}
function getMIDIMessage(midiMessage) 
{
	var currentControlName, testIndex=0;
	//console.log(midiMessage.data[0]+" "+midiMessage.data[1]+" "+midiMessage.data[2]);
	MIDISTore.onMidiEvent(midiMessage)
	
	//filter out KEYboard note presses
	if(midiMessage.data[0]>=144 && midiMessage.data[0]<=159 || midiMessage.data[0]>=128 && midiMessage.data[0]<=143)
	{
		//console.log("a key");
		testIndex = MIDISTore.findControlKeyIndex(midiMessage.data[1]);
		if(testIndex!=-1)
		{
			currentControlName = MIDISTore.midiMapArray[ testIndex ][2];
			console.log("["+currentControlName+"]->["+MIDISTore.midiMapArray[ testIndex ][4]+"]");
		}
	}
	else
	{
		//Debug Actual value
		currentControlName = MIDISTore.getNameFromCCID(midiMessage.data[0], midiMessage.data[1]);
		if(currentControlName!=-1)
		{
			console.log("["+currentControlName+"]->["+MIDISTore.getValueFromCCID(midiMessage.data[0], midiMessage.data[1],1)+"]");
		}
		buttonLights();
	}
}
//-------------MIDI FUNCTIONS--------------------------
//------------	WEB SOCKET Functions	------------
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
			//console.log("more Value["+valCounter+"]["+valueArray[valCounter]+"]");
		}
		else
		{
			valueArray[valCounter] = data.substr(valIndex, data.length-valIndex);
			//console.log("last Value["+valCounter+"]["+valueArray[valCounter]+"]");
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
