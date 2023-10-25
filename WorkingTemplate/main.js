import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

//-----------------	Colour System	-----------------
class CCGenerator
{	
	constructor(maxValue, colourBlockCount, rgbColourArray)
	{
		this._primaryColours = new Array();
		this._currentColour = [0,0,0];
		this._colourTable = [[0,0,0],[0,0,0],[0,0,0]];
		this._modifierTable = [[0,0,0],[0,0,0]];
		this._colourBlockCount=0;
		this._coloursPerBlock=0;
		this._bandWidth=0;
		this._cnt=0;
		this._primColIndex=0;
		this._rgba="";
	
		this._colourBlockCount = colourBlockCount;
		this._primaryColours = new Array(this._colourBlockCount);
		for(this._cnt=0; this._cnt<this._colourBlockCount; this._cnt++)
	    {
			this._primaryColours[this._cnt] = new Array(3);
	    }
		//Init the Colour Table
		for(this._cnt=0; this._cnt<3; this._cnt++)
		{
			this._colourTable[this._cnt][0] = 0;
			this._colourTable[this._cnt][1] = 0;
			this._colourTable[this._cnt][2] = 0;
		}
		//Init the Modofier Table
		for(this._cnt=0; this._cnt<2; this._cnt++)
		{
			this._modifierTable[this._cnt][0] = 0;
			this._modifierTable[this._cnt][1] = 0;
			this._modifierTable[this._cnt][2] = 0;
		}	
		//number of colours between 1 block and its neighbour    
		this._coloursPerBlock = maxValue;
		//Total number of colours in this spectrum
		this._bandWidth = this._coloursPerBlock * this._colourBlockCount;
		//Fill out primary colours based on array passed
		for(this._cnt=0; this._cnt<colourBlockCount; this._cnt++)
		{
			this._primaryColours[this._cnt][0] = rgbColourArray[this._cnt*3];
			this._primaryColours[this._cnt][1] = rgbColourArray[(this._cnt*3)+1];
			this._primaryColours[this._cnt][2] = rgbColourArray[(this._cnt*3)+2];
		}
	}
	
	getColour = function(colourIndex)
	{
		this._primColIndex = Math.floor(colourIndex/this._coloursPerBlock) ;
		this._colourTable[0][0] = this._primaryColours[this._primColIndex][0]; 
		this._colourTable[0][1] = this._primaryColours[this._primColIndex][1];
		this._colourTable[0][2] = this._primaryColours[this._primColIndex][2];
		
		this._colourTable[1][0] = this._primaryColours[(this._primColIndex+1)%this._colourBlockCount][0]; 
		this._colourTable[1][1] = this._primaryColours[(this._primColIndex+1)%this._colourBlockCount][1]; 
		this._colourTable[1][2] = this._primaryColours[(this._primColIndex+1)%this._colourBlockCount][2];
				
		this.gradientGenerator(colourIndex%this._coloursPerBlock, this._coloursPerBlock);
		
		this._currentColour[0] = this._colourTable[2][0];
		this._currentColour[1] = this._colourTable[2][1];
		this._currentColour[2] = this._colourTable[2][2];		
	}
	
	getRGBA = function(colourIndex)
	{
		this.getColour(colourIndex);
		this._rgba = 'rgba('+this._currentColour[0]+','+this._currentColour[1]+','+this._currentColour[2]+',1)';
	}
	
	gradientGenerator = function(colourIndex, bandWidth)
	{
		for(this._cnt=0; this._cnt<3; this._cnt++)
		{
			//fill modifier
			if(this._colourTable[1][this._cnt]>this._colourTable[0][this._cnt]) { this._modifierTable[0][this._cnt]=1; }
			else if(this._colourTable[1][this._cnt]<this._colourTable[0][this.cnt]) { this._modifierTable[0][this._cnt]=-1; }
			else if(this._colourTable[1][this._cnt]==this._colourTable[0][this._cnt]) { this._modifierTable[0][this._cnt]=0; }

			//fill step value
			if(this._modifierTable[0][this._cnt]==1)
			{
			 this._modifierTable[1][this._cnt] = this._colourTable[1][this._cnt] - this._colourTable[0][this._cnt];
			}
			else if(this._modifierTable[0][this._cnt]==-1)
			{
			  this._modifierTable[1][this._cnt] = this._colourTable[0][this._cnt] - this._colourTable[1][this._cnt];
			}
			else if(this._modifierTable[0][this._cnt]==0)
			{
			  this._modifierTable[1][this._cnt] = 0;
			}
			//calculate current gradient between 2 based on the percentile index
			this._colourTable[2][this._cnt] = this._colourTable[0][this._cnt] + ((this._modifierTable[1][this._cnt]*(colourIndex/bandWidth))*this._modifierTable[0][this._cnt]);
		}
  }
}
//-----------------	Colour System	-----------------
//-----------------	MIDI System	-----------------
class MIDIMapper
{	
	constructor()
	{
		this.midiMapArray = new Array();
		this.numberOfItems=0;
		this.innerCounter=0;
		this.lastKeyHit=0;
		this.lastKeyReleased=0;
		this.midiKeyRange = [48,84];
	}
	addItem =  function(MIDIChan, CCID, controlName, scaleToValue)
	{
		this.midiMapArray.push([MIDIChan, CCID, controlName, 0, 0, scaleToValue, new Array(), 0])
		this.numberOfItems = this.midiMapArray.length;
	}
	scaleTo = function(value, scaleTo)
	{
		return (value/127)*scaleTo;
	}
	onMidiEvent = function(midiData)
	{
		//Hadnle Midi Keys
		this.handleKeys(midiData.data[0], midiData.data[1], midiData.data[2]);
		//Handle all other stored controlls
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(midiData.data[0] == this.midiMapArray[this.innerCounter][0] && midiData.data[1] == this.midiMapArray[this.innerCounter][1])
			{
				//Actual midi value 0-127
				this.midiMapArray[this.innerCounter][3] = midiData.data[2];
				//scaled value for application use
				this.midiMapArray[this.innerCounter][4] = this.scaleTo( midiData.data[2], this.midiMapArray[this.innerCounter][5] );
				this.midiMapArray[this.innerCounter][7] = 1;
				//console.log(this.midiMapArray[this.innerCounter][2]+"->"+this.midiMapArray[this.innerCounter][3]+" "+this.midiMapArray[this.innerCounter][4]);
				return;
			}
		}
	}
	hasChanged = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				if(this.midiMapArray[this.innerCounter][7]==1)
				{
					return 1;
				}
				else
				{
					return 0;
				}
			}
		}
	}
	setMultiValues = function(controlName, valueArray)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				console.log(valueArray);
				this.midiMapArray[this.innerCounter][6] = valueArray;
				//set flag indicating value has changed
				this.midiMapArray[this.innerCounter][7] = 1;
			}
		}
	}
	setValue = function(controlName, value)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				//Scaled value used by the application
				this.midiMapArray[this.innerCounter][4] = value;
				//Midi value 0-127 from the above scaled value
				this.midiMapArray[this.innerCounter][3] = value*127;
				this.midiMapArray[this.innerCounter][7] = 1;
				return;
			}
		}
	}
	setMidiValue = function(controlName, value)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][3] = value;
				this.midiMapArray[this.innerCounter][4] = this.scaleTo( value, this.midiMapArray[this.innerCounter][5] );
				this.midiMapArray[this.innerCounter][7] = 1;
				return;
			}
		}
	}
	getValue = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][7] = 0;
				return this.midiMapArray[this.innerCounter][4];
			}
		}
	}
	getValueRounded = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][7] = 0;
				return Math.round(this.midiMapArray[this.innerCounter][4]);
			}
		}
	}
	getScaleToValue = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][7] = 0;
				return this.midiMapArray[this.innerCounter][5];
			}
		}
	}
	handleKeys = function(midiID, ccID, velocity)
	{
		if(ccID>=this.midiKeyRange[0] && ccID<=this.midiKeyRange[1])
		{
			if(midiID==144)
			{
				this.lastKeyHit = ccID;
			}
			else if (midiID==128)
			{
				this.lastKeyReleased = ccID;
			}
		}
	}
}
//-----------------	MIDI System	-----------------


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var geometry = new Array();// = new THREE.BoxGeometry( 2, 1, 1 );
var material = new Array();//new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cubes = Array();// = new THREE.Mesh( geometry, material );
//scene.add( cube );

camera.position.z = -30;

var centrePoints = [0,0];
var numberOfObjects = 90, depth=10;
var oIndex=0;

//colours
var maxValue = 255;
var maxColourDitherSteps = 128;
var colourList = [maxValue,0,0, maxValue,maxValue,0, 0,maxValue,0, 0,maxValue,maxValue, 0,0,maxValue, maxValue,0,maxValue, maxValue,maxValue,maxValue];
var cIndex=0, cIncrement=10, innerCIndex=0;
let cObjectOne = new CCGenerator(maxColourDitherSteps, 7, colourList);

//MIDI
let MIDISTore = new MIDIMapper();

setUp();

const controls = new OrbitControls( camera, renderer.domElement );
controls.update();

function setUp()
{
	//Init web MIDI
	navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
	//Init websockets for OSC
	initWebSockets();
	
	//Add MIDI/OSC controls
	MIDISTore.addItem(176,1,"colourIncrement", 100);
	MIDISTore.setValue("colourIncrement", 10);
	MIDISTore.addItem(176,2,"subColourIncrement", 100);
	MIDISTore.setValue("subColourIncrement", 10);
	
	MIDISTore.addItem(176,3,"radius", 500);
	MIDISTore.setValue("radius", 30);
	
	for(var depthCounter=0; depthCounter<depth; depthCounter++)
	{
		for(var oCount=0; oCount<numberOfObjects; oCount++)
		{
			oIndex = oCount+(depthCounter*numberOfObjects);
			centrePoints = getCircularPoints(0, 0, MIDISTore.getValue("radius"), (360/numberOfObjects)*oCount);
			cObjectOne.getColour(innerCIndex%cObjectOne._bandWidth);
			geometry.push(new THREE.BoxGeometry( 1, 1, 1 ));
			material.push(new THREE.MeshBasicMaterial( { color: 0x00ff00 } ));
			
			material[oIndex].color.r = cObjectOne._currentColour[0]/255;
			material[oIndex].color.g = cObjectOne._currentColour[1]/255;
			material[oIndex].color.b = cObjectOne._currentColour[2]/255;
			//material[oIndex].wireframe=true;
			cubes.push(new THREE.Mesh( geometry[oIndex], material[oIndex] ));
			cubes[oIndex].position.x = centrePoints[0];
			cubes[oIndex].position.y = centrePoints[1];
			cubes[oIndex].position.z = ((depthCounter/100)*500);
			scene.add( cubes[ oIndex ] );
			innerCIndex+=cIncrement;
		}
	}
	innerCIndex=0;
}

function animate() 
{
	requestAnimationFrame( animate );

	//cube.rotation.x += 0.01;
	//cube.position.y += 0.01;
	//cube.geometry.setX(cube.geometry.getX()+0.01);
	//cube.scale.z = cube.rotation.x;
	
	innerCIndex = cIndex;
	
	for(var depthCounter=0; depthCounter<depth; depthCounter++)
	{
		for(var oCount=0; oCount<numberOfObjects; oCount++)
		{
			oIndex = oCount+(depthCounter*numberOfObjects);
			cObjectOne.getColour(innerCIndex%cObjectOne._bandWidth);
			material[oIndex].color.r = cObjectOne._currentColour[0]/255;
			material[oIndex].color.g = cObjectOne._currentColour[1]/255;
			material[oIndex].color.b = cObjectOne._currentColour[2]/255;
			innerCIndex+=MIDISTore.getValue("subColourIncrement");
		}
	}
	
	cIndex+=MIDISTore.getValue("colourIncrement");
	
	controls.update();
	renderer.render( scene, camera );
	
	polControls();
}

function polControls()
{
	var oIndex;
	
	if(MIDISTore.hasChanged("radius")==1)
	{
		console.log("Radiuous");
		for(var depthCounter=0; depthCounter<depth; depthCounter++)
		{
			for(var oCount=0; oCount<numberOfObjects; oCount++)
			{
				oIndex = oCount+(depthCounter*numberOfObjects);
				centrePoints = getCircularPoints(0, 0, MIDISTore.getValue("radius"), (360/numberOfObjects)*oCount);
				cubes[oIndex].position.x = centrePoints[0];
				cubes[oIndex].position.y = centrePoints[1];
				//cubes[oIndex].position.z = ((depthCounter/100)*500);
			}
		}
	}
}

animate();

function getCircularPoints(circleX, circleY, circleR, angleFromTopLeftoRight)
{
	var circCoOrds = [0, 0];
	circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*circleR ;
	circCoOrds[1] = circleY - Math.cos(angleFromTopLeftoRight*(Math.PI / 180))*circleR;
	return circCoOrds;
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
	console.log("Contol Name["+currControl+"]\tNumber Of Values["+numberOfValues+"]\tLastValue["+currValue+"]");
	MIDISTore.setMidiValue(currControl, currValue*127);
	MIDISTore.setMultiValues(currControl, valueArray);
	//console.log(MIDISTore.getValue(currControl));
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
