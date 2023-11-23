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
var orbitObjectCount = 50;
var orbitTrailCount = 20;
var orbitTape = new Array(orbitObjectCount);
var orbitTrailTape = new Array(orbitObjectCount*orbitTrailCount);

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
	MIDISTore.addItem(176,3,"radius", 200);
	MIDISTore.setValue("radius", 50);

	MIDISTore.addItem(176,4,"xFactor", 2*Math.PI);
	MIDISTore.setValue("xFactor", 1);
	MIDISTore.addItem(176,5,"yFactor", 2*Math.PI);
	MIDISTore.setValue("yFactor", 1);
	MIDISTore.addItem(176,6,"xxFactor", 2*Math.PI);
	MIDISTore.setValue("xxFactor", 1);
	MIDISTore.addItem(176,7,"yyFactor", 2*Math.PI);
	MIDISTore.setValue("yyFactor", 1);
	MIDISTore.addItem(176,8,"xWaveIncrement", 1);
	MIDISTore.setValue("xWaveIncrement", 0.01);
	MIDISTore.addItem(176,9,"yWaveIncrement", 1);
	MIDISTore.setValue("yWaveIncrement", 0.01);
	MIDISTore.addItem(176,10,"orbitSpeed", 10);
	MIDISTore.setValue("orbitSpeed", 1);
	MIDISTore.addItem(176,11,"xxOrbitTimer", 500);
	MIDISTore.setValue("xxOrbitTimer", 100);
	MIDISTore.addItem(176,12,"yyOrbitTimer", 500);
	MIDISTore.setValue("yyOrbitTimer", 100);

	
	
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
		orbitTape[mpCount] = [localDegIndex,localXXFactor,localYYFactor];
		for(oCount=0; oCount<orbitTrailCount; oCount++)
		{
			orbitTrailTape[(mpCount*orbitTrailCount)+oCount] = [localDegIndex+((360/orbitTrailCount)*oCount), localXXFactor, localYYFactor];
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
		//console.log(virtualMouse[0]+"\t"+virtualMouse[1]+"\t");
	};
	cameraLookingAt = camera.position;
	cameraLookingAt.z = 300;
	camera.position.set( cameraLookingAt.x, cameraLookingAt.y, cameraLookingAt.z );	
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
	var localObjectCount = orbitTape.length+1, localObjectCounter=1;
	var localCentrePoints = [0,0];
	var localTrailCounter=0;

	//clear all globalArrays
	geometry = new Array();
	material = new Array();
	objects = new Array();
	scene.clear();

	geometry.push( new THREE.BoxGeometry( 3, 3, 3 ) );
	material.push( new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
	objects.push(new THREE.Mesh( geometry[0], material[0] ));
	objects[0].position.x = 0;
	objects[0].position.y = 0;
	objects[0].position.z = 0;
	scene.add( objects[ 0 ] );
	
	for(localObjectCounter=1; localObjectCounter<localObjectCount; localObjectCounter++)
	{
		localCentrePoints = pixelMap.getAdvancedCircularPoints(0, 0, MIDISTore.getValue("radius"), orbitTape[localObjectCounter-1][0], 1, 1, orbitTape[localObjectCounter-1][1], orbitTape[localObjectCounter-1][2]);
		geometry.push( new THREE.BoxGeometry( 1, 1, 1 ) );
		material.push( new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
		material[localObjectCounter].opacity = 1;
		material[localObjectCounter].transparent = true;
		objects.push(new THREE.Mesh( geometry[localObjectCounter], material[localObjectCounter] ));
		objects[localObjectCounter].position.x = localCentrePoints[0];
		objects[localObjectCounter].position.y = localCentrePoints[1];
		objects[localObjectCounter].position.z = 0;
		scene.add( objects[ localObjectCounter ] );
		orbitTape[localObjectCounter-1][0] = ((360/orbitTape.length)*(localObjectCounter-1));
		
		for(localTrailCounter=0; localTrailCounter<orbitTrailCount; localTrailCounter++)
		{
			localCentrePoints = pixelMap.getAdvancedCircularPoints(0, 0, MIDISTore.getValue("radius"), orbitTrailTape[((localObjectCounter-1)*orbitTrailCount)+localTrailCounter][0], 1, 1, orbitTrailTape[((localObjectCounter-1)*orbitTrailCount)+localTrailCounter][1], orbitTrailTape[((localObjectCounter-1)*orbitTrailCount)+localTrailCounter][2]);
			trails_geometry.push( new THREE.BoxGeometry( 1, 1, 1 ) );
			trails_material.push( new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
			trails_material[((localObjectCounter-1)*orbitTrailCount)+localTrailCounter].opacity = 1-(localTrailCounter/orbitTrailCount);
			trails_material[((localObjectCounter-1)*orbitTrailCount)+localTrailCounter].transparent = true;
			trails_objects.push(new THREE.Mesh( trails_geometry[((localObjectCounter-1)*orbitTrailCount)+localTrailCounter], trails_material[((localObjectCounter-1)*orbitTrailCount)+localTrailCounter] ));
			trails_objects[((localObjectCounter-1)*orbitTrailCount)+localTrailCounter].position.x = localCentrePoints[0];
			trails_objects[((localObjectCounter-1)*orbitTrailCount)+localTrailCounter].position.y = localCentrePoints[1];
			trails_objects[((localObjectCounter-1)*orbitTrailCount)+localTrailCounter].position.z = 0;
			scene.add( trails_objects[ ((localObjectCounter-1)*orbitTrailCount)+localTrailCounter ] );
		}
		
	}
	
	
}

function animate() 
{
	var mpointCount=0, mpStart = 1, localTrailCounter=0;
	var centrePoints = [0,0];
	
	objects[0].position.x = virtualMouse[0];
	objects[0].position.y = virtualMouse[1];

	
	if(systemTimer.hasTimedOut("orbitObjectCounthift"))
	{
		for(mpointCount=0; mpointCount<orbitTape.length; mpointCount++)
		{
			centrePoints = pixelMap.getAdvancedCircularPoints(objects[0].position.x, objects[0].position.y, MIDISTore.getValue("radius"), orbitTape[mpointCount][0], 1, 1, orbitTape[mpointCount][1], orbitTape[mpointCount][2]);
			objects[mpStart].position.x = centrePoints[0];
			objects[mpStart].position.y = centrePoints[1];
			//colour modification
			cObjectOne.getColour( innerCIndex%cObjectOne._bandWidth );
			material[mpStart].color.r = cObjectOne._currentColour[0]/255;
			material[mpStart].color.g = cObjectOne._currentColour[1]/255;
			material[mpStart].color.b = cObjectOne._currentColour[2]/255;
			orbitTape[mpointCount][0] += MIDISTore.getValue("orbitSpeed");
			//render trails
			for(localTrailCounter=0; localTrailCounter<orbitTrailCount; localTrailCounter++)
			{
				centrePoints = pixelMap.getAdvancedCircularPoints(objects[0].position.x, objects[0].position.y, MIDISTore.getValue("radius"), orbitTrailTape[(mpointCount*orbitTrailCount)+localTrailCounter][0], 1, 1, orbitTrailTape[(mpointCount*orbitTrailCount)+localTrailCounter][1], orbitTrailTape[(mpointCount*orbitTrailCount)+localTrailCounter][2]);
				trails_objects[(mpointCount*orbitTrailCount)+localTrailCounter].position.x = centrePoints[0];
				trails_objects[(mpointCount*orbitTrailCount)+localTrailCounter].position.y = centrePoints[1];
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

	requestAnimationFrame( animate );
	controls.update();
	renderer.render( scene, camera );
	
}
animate();


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
