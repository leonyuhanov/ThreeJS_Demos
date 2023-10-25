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
//---------------	Pixel Maper	---------------
class pixelMaper
{
	constructor(cols, rows)
	{
		this.bitmapArray = new Array();
		this.cols = cols;
		this.rows = rows;
		this.colCounter = 0;
		this.rowCounter = 0;
		this.tempRow = new Array();
		
		for(this.rowCounter=0; this.rowCounter<this.rows; this.rowCounter++)
		{
			this.tempRow = new Array();			
			for(this.colCounter=0; this.colCounter<this.cols; this.colCounter++)
			{
				this.tempRow.push([0,0,0]);
			}
			this.bitmapArray.push(this.tempRow);
		}
	}
	
	drawPixel = function(x, y, pixColour)
	{
		if(x<this.cols && y<this.rows && x>=0 && y>=0)
		{
			this.bitmapArray[y][x][0] = pixColour[0];
			this.bitmapArray[y][x][1] = pixColour[1];
			this.bitmapArray[y][x][2] = pixColour[2];
		}
	}
	
	drawLine = function(x0, y0, x1, y1, pixelColour)
	{
	   var dx = Math.abs(x1-x0);
	   var dy = Math.abs(y1-y0);
	   var sx = (x0 < x1) ? 1 : -1;
	   var sy = (y0 < y1) ? 1 : -1;
	   var err = dx-dy;

	   while(true)
	   {
		 this.drawPixel(x0, y0, pixelColour);
		 if ((x0==x1) && (y0==y1)) break;
		 var e2 = 2*err;
		 if (e2 >-dy){ err -= dy; x0  += sx; }
		 if (e2 < dx){ err += dx; y0  += sy; }
	   }
	}

	renderHLine = function(x,y,length,pixColour)
	{
		var xCnt = 0;
		if(xCnt+length<=this.cols)
		{
			for(xCnt=x; xCnt<x+length; xCnt++)
			{
				this.drawPixel(xCnt, y, pixColour);
			}
		}
	}

	renderVLine = function(x,y,length, pixColour)
	{
		var yCnt = 0;
		if(y+length<=this.rows)
		{
			for(yCnt=y; yCnt<y+length; yCnt++)
			{
				this.drawPixel(x, yCnt, pixColour);
			}
		}
	}
	
	fill = function(xStart, yStart, width, height, pixColour)
	{
		var xp, yp;
		for(xp=xStart; xp<xStart+width; xp++)
		{
			for(yp=yStart; yp<yStart+height; yp++)
			{
				this.drawPixel(xp, yp, pixColour);
			}
		}
	}
	
	drawCircle = function(cX, cY, radius, pixColour, degreePointIncrement)
	{
		var degCounter = 0;
		var cPoints = [0,0];
		for(degCounter=0; degCounter<360; degCounter+=degreePointIncrement)
		{
			cPoints = this.getCircularPoints(cX, cY, radius, degCounter);
			this.drawPixel(cPoints[0], cPoints[1], pixColour);
		}
	}
	
	getCircularPoints = function (circleX, circleY, circleR, angleFromTopLeftoRight)
	{
		var circCoOrds = [0, 0];
		circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*circleR ;
		circCoOrds[1] = circleY - Math.cos(angleFromTopLeftoRight*(Math.PI / 180))*circleR;
		return circCoOrds;
	}
	
	subtractiveFade = function(fadeLevel)
	{
		var xCnt=0, yCnt=0;
		
		for(yCnt=0; yCnt<this.rows; yCnt++)
		{
			for(xCnt=0; xCnt<this.cols; xCnt++)
			{
				if(this.bitmapArray[yCnt][xCnt][0]-fadeLevel<0){ this.bitmapArray[yCnt][xCnt][0]=0; }
				else{this.bitmapArray[yCnt][xCnt][0]-=fadeLevel;}
				if(this.bitmapArray[yCnt][xCnt][1]-fadeLevel<0){ this.bitmapArray[yCnt][xCnt][1]=0; }
				else{this.bitmapArray[yCnt][xCnt][1]-=fadeLevel;}
				if(this.bitmapArray[yCnt][xCnt][2]-fadeLevel<0){ this.bitmapArray[yCnt][xCnt][2]=0; }
				else{this.bitmapArray[yCnt][xCnt][2]-=fadeLevel;}
			}
		}
	}
	
	clear = function()
	{
		var xCnt=0, yCnt=0;
		for(yCnt=0; yCnt<this.rows; yCnt++)
		{
			for(xCnt=0; xCnt<this.cols; xCnt++)
			{
				this.bitmapArray[yCnt][xCnt][0] = 0;
				this.bitmapArray[yCnt][xCnt][1] = 0;
				this.bitmapArray[yCnt][xCnt][2] = 0;
			}
		}
	}
	
	shiftUpDown = function(limitArray, direction, wrap)
	{
		var xCnt=0, yCnt=0;
		var tempBlock = new Array();
		
		if(limitArray==undefined)
		{
			var limitArray = [0,this.cols, 0, this.rows];
		}
		
		if(direction=="down")
		{
			//copy the last row if wrap is defined
			if(wrap)
			{
				for(xCnt=0; xCnt<this.cols; xCnt++)
				{
					tempBlock.push( this.bitmapArray[limitArray[3]-1][xCnt] );
				}
			}
			//start at the end, copy next row into the current
			for(yCnt=limitArray[3]; yCnt>limitArray[2]; yCnt--)
			{
				for(xCnt=limitArray[0]; xCnt<limitArray[1]; xCnt++)
				{
					this.bitmapArray[yCnt][xCnt][0] = this.bitmapArray[yCnt-1][xCnt][0];
					this.bitmapArray[yCnt][xCnt][1] = this.bitmapArray[yCnt-1][xCnt][1];
					this.bitmapArray[yCnt][xCnt][2] = this.bitmapArray[yCnt-1][xCnt][2];
				}
			}
			//copy the last row into the 1st row if wrap is defines
			if(wrap)
			{
				for(xCnt=0; xCnt<this.cols; xCnt++)
				{
					this.bitmapArray[limitArray[2]][xCnt][0] = tempBlock[xCnt][0];
					this.bitmapArray[limitArray[2]][xCnt][1] = tempBlock[xCnt][1];
					this.bitmapArray[limitArray[2]][xCnt][2] = tempBlock[xCnt][2];
				}
			}
		}
		else
		{
			//copy the 1st row
			if(wrap)
			{
				for(xCnt=0; xCnt<this.cols; xCnt++)
				{
					tempBlock.push( this.bitmapArray[limitArray[2]][xCnt] );
				}
			}
			//start at the top, copy next row into the current
			for(yCnt=limitArray[2]; yCnt<limitArray[3]; yCnt++)
			{
				for(xCnt=limitArray[0]; xCnt<limitArray[1]; xCnt++)
				{
					this.bitmapArray[yCnt][xCnt][0] = this.bitmapArray[yCnt+1][xCnt][0];
					this.bitmapArray[yCnt][xCnt][1] = this.bitmapArray[yCnt+1][xCnt][1];
					this.bitmapArray[yCnt][xCnt][2] = this.bitmapArray[yCnt+1][xCnt][2];
				}
			}		
			//copy the 1st row into the last row
			if(wrap)
			{
				for(xCnt=0; xCnt<this.cols; xCnt++)
				{
					this.bitmapArray[limitArray[3]][xCnt][0] = tempBlock[xCnt][0];
					this.bitmapArray[limitArray[3]][xCnt][1] = tempBlock[xCnt][1];
					this.bitmapArray[limitArray[3]][xCnt][2] = tempBlock[xCnt][2];
				}
			}
		}
	}

	shiftLeftRight = function(limitArray, direction, wrap)
	{
		var xCnt=0, yCnt=0;
		var tempBlock = new Array();

		if(limitArray==undefined)
		{
			var limitArray = [0,this.cols, 0, this.rows];
		}
		
		if(direction=="right")
		{
			//copy the last column
			if(wrap)
			{
				for(yCnt=0; yCnt<this.rows; yCnt++)
				{
					tempBlock.push( this.bitmapArray[yCnt][this.cols-1] );
				}
			}
			//start at the end, copy next row into the current
			for(xCnt=limitArray[1]-1; xCnt>limitArray[0]; xCnt--)
			{
				for(yCnt=limitArray[2]; yCnt<limitArray[3]; yCnt++)
				{
					this.bitmapArray[yCnt][xCnt][0] = this.bitmapArray[yCnt][xCnt-1][0];
					this.bitmapArray[yCnt][xCnt][1] = this.bitmapArray[yCnt][xCnt-1][1];
					this.bitmapArray[yCnt][xCnt][2] = this.bitmapArray[yCnt][xCnt-1][2];
				}
			}
			//copy the last column into the 1st column
			if(wrap)
			{
				for(yCnt=0; yCnt<this.rows; yCnt++)
				{
					this.bitmapArray[yCnt][0][0] = tempBlock[yCnt][0];
					this.bitmapArray[yCnt][0][1] = tempBlock[yCnt][1];
					this.bitmapArray[yCnt][0][2] = tempBlock[yCnt][2];
				}
			}
		}
		else
		{
			//copy the 1st column
			if(wrap)
			{
				for(yCnt=0; yCnt<this.rows; yCnt++)
				{
					tempBlock.push( this.bitmapArray[yCnt][0] );
				}
			}	
			//start at the end, copy next row into the current
			for(xCnt=limitArray[0]; xCnt<limitArray[1]-1; xCnt++)
			{
				for(yCnt=limitArray[2]; yCnt<limitArray[3]; yCnt++)
				{
					this.bitmapArray[yCnt][xCnt][0] = this.bitmapArray[yCnt][xCnt+1][0];
					this.bitmapArray[yCnt][xCnt][1] = this.bitmapArray[yCnt][xCnt+1][1];
					this.bitmapArray[yCnt][xCnt][2] = this.bitmapArray[yCnt][xCnt+1][2];
				}
			}
			//copy the 1st column into the last column
			if(wrap)
			{
				for(yCnt=0; yCnt<this.rows; yCnt++)
				{
					this.bitmapArray[yCnt][this.cols-1][0] = tempBlock[yCnt][0];
					this.bitmapArray[yCnt][this.cols-1][1] = tempBlock[yCnt][1];
					this.bitmapArray[yCnt][this.cols-1][2] = tempBlock[yCnt][2];
				}
			}
		}
	}
	
	pixelPositionAt = function(x, y, realRadius)
	{
		var verticalMap, horizontalMap;
				
		if(y==Math.round(this.rows/2))
		{
			//console.log("Frame["+frameCounter+"]\t\tx["+x+"]\ty["+y+"]\trows/2["+this.rows/2+"]\trounded rows["+Math.round(this.rows/2)+"]");
			verticalMap = this.getCircularPoints(0, 0, realRadius, 90);
		}
		else if(y<Math.round(this.rows/2))
		{
			verticalMap = this.getCircularPoints(0, 0, realRadius, (360/Math.round(this.rows))*y);
		}
		else if(y>Math.round(this.rows/2))
		{
			verticalMap = this.getCircularPoints(0, 0, realRadius, (360/Math.round(this.rows))*y);
			verticalMap[1] = verticalMap[1]*-1;
		}
		horizontalMap = this.getCircularPoints(0, 0, verticalMap[0], (360/Math.round(this.cols))*x );
		
		return [horizontalMap[0],verticalMap[1],horizontalMap[1]];
	}
	
	hasColour = function(x, y)
	{
		if( (this.bitmapArray[y][x][0]+this.bitmapArray[y][x][1]+this.bitmapArray[y][x][2])>0 )
		{
			return 1;
		}
		else
		{
			return 0;
		}
	}
	
	getWave = function(counter, minWave, maxWave)
	{
		return Math.round( ( Math.sin(counter)*((maxWave-minWave)/2) )+( maxWave-((maxWave-minWave)/2) ) );
	}
}
//---------------	Pixel Maper	---------------

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var geometry = new Array();// = new THREE.BoxGeometry( 2, 1, 1 );
var material = new Array();//new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var objects = Array();// = new THREE.Mesh( geometry, material );
//scene.add( cube );

camera.position.z = -100;

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

//Pixel Mapper
let pixelMap;
var pixelTrack=0;
var yCount, xCount;
var frameCounter = 0;

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
	
	MIDISTore.addItem(176,3,"radius", 200);
	MIDISTore.setValue("radius", 100);
	
	MIDISTore.addItem(176,4,"waveSpeed", 1);
	MIDISTore.setValue("waveSpeed", 0.01);
	
	MIDISTore.addItem(176,40,"colourDecay", 100);
	MIDISTore.setValue("colourDecay", 20);
	
	//set up pixelmap and all 3d Objects based on said pixel map
	recalculatePixelMap();
	innerCIndex=0;
}

function recalculatePixelMap()
{
	//set up pixel map
	pixelMap = new pixelMaper(MIDISTore.getValueRounded("radius"), MIDISTore.getValueRounded("radius"));	
	
	//clear all globalArrays
	geometry = new Array();
	material = new Array();
	objects = new Array();
	scene.clear();

	
	//add all game objects from pixel map
	var geometryTR, materialTR, objectTR;
	var mapPoints = [0,0,0];
	for(var rowCounter=0; rowCounter<pixelMap.rows; rowCounter++)
	{
		geometryTR = new Array();
		materialTR = new Array();
		objectTR = new Array();
		for(var colCounter=0; colCounter<pixelMap.cols; colCounter++)
		{
			mapPoints = pixelMap.pixelPositionAt(colCounter, rowCounter, MIDISTore.getValueRounded("radius"));;
			geometryTR.push(new THREE.BoxGeometry( 1, 1, 1 ));
			materialTR.push(new THREE.MeshBasicMaterial( { color: 0xff0000 } ));
			objectTR.push(new THREE.Mesh( geometryTR[colCounter], materialTR[colCounter] ));
			objectTR[colCounter].material=0;
			objectTR[colCounter].position.x = mapPoints[0];
			objectTR[colCounter].position.y = mapPoints[1];
			objectTR[colCounter].position.z = mapPoints[2];
			scene.add( objectTR[ colCounter ] );
		}
		geometry.push(geometryTR);
		material.push(materialTR);
		objects.push(objectTR);
	}
}

function animate() 
{
	requestAnimationFrame( animate );

	//cube.rotation.x += 0.01;
	//cube.position.y += 0.01;
	//cube.geometry.setX(cube.geometry.getX()+0.01);
	//cube.scale.z = cube.rotation.x;
	
	
	
	for(yCount=0; yCount<pixelMap.rows; yCount++)
	{
		for(xCount=0; xCount<pixelMap.cols; xCount++)
		{
			if(pixelMap.hasColour(xCount, yCount)==1)
			{
				material[yCount][xCount].color.r = pixelMap.bitmapArray[yCount][xCount][0]/255;
				material[yCount][xCount].color.g = pixelMap.bitmapArray[yCount][xCount][1]/255;
				material[yCount][xCount].color.b = pixelMap.bitmapArray[yCount][xCount][2]/255;
				objects[yCount][xCount].material = material[yCount][xCount];
			}
			else
			{
				objects[yCount][xCount].material = 0;
			}
		}
	}
	
	/*
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
	*/
	//
	
	controls.update();
	renderer.render( scene, camera );
	
	polControls();
	animateBitmap();
	frameCounter++;
}

function animateBitmap()
{
	//pixelMap.clear();
	innerCIndex = cIndex;
	
	//pixelMap.drawPixel(0, pixelMap.getWave(pixelTrack, 0, pixelMap.rows), cObjectOne._currentColour);
	
	/*
	for(pixelTrack=0; pixelTrack<pixelMap.cols; pixelTrack++)
	{
		cObjectOne.getColour(innerCIndex%cObjectOne._bandWidth);
		pixelMap.renderVLine(pixelTrack,0, Math.round(pixelMap.rows/2), cObjectOne._currentColour);
		innerCIndex += MIDISTore.getValue('subColourIncrement');
	}
	*/
	//pixelMap.renderHLine(0, pixelTrack%pixelMap.rows, pixelMap.cols, cObjectOne._currentColour);
	/*
	if(frameCounter%10==9)
	{
		pixelMap.shiftLeftRight([0,pixelMap.cols, 0, pixelMap.rows], "right", 1);
	}
	*/
	cObjectOne.getColour(cIndex%cObjectOne._bandWidth);
	pixelMap.renderVLine(pixelTrack%pixelMap.cols,0, Math.round(pixelMap.rows/2), cObjectOne._currentColour);
	pixelMap.subtractiveFade(MIDISTore.getValueRounded('colourDecay'));
	cIndex += MIDISTore.getValue('colourIncrement');
	//pixelTrack+=MIDISTore.getValue('waveSpeed');
	pixelTrack++;
}

function polControls()
{	
	if(MIDISTore.hasChanged("radius")==1)
	{
		recalculatePixelMap();
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
