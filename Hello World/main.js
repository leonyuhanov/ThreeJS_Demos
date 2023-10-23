import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var geometry = new Array();// = new THREE.BoxGeometry( 2, 1, 1 );
var material = new Array();//new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cubes = Array();// = new THREE.Mesh( geometry, material );
//scene.add( cube );

camera.position.z = -50;

var centrePoints = [0,0];
var numberOfObjects = 90;
//colours
var maxValue = 255;
var maxColourDitherSteps = 128;
var colourList = [maxValue,0,0, maxValue,maxValue,0, 0,maxValue,0, 0,maxValue,maxValue, 0,0,maxValue, maxValue,0,maxValue, maxValue,maxValue,maxValue];
var cIndex=0, cIncrement=10, innerCIndex=0;
let cObjectOne = new CCGenerator(maxColourDitherSteps, 7, colourList);


setUp();

const controls = new OrbitControls( camera, renderer.domElement );
controls.update();

function setUp()
{
	for(var oCount=0; oCount<numberOfObjects; oCount++)
	{
		centrePoints = getCircularPoints(0, 0, 30, (360/numberOfObjects)*oCount);
		cObjectOne.getColour(innerCIndex%cObjectOne._bandWidth);
		geometry.push(new THREE.BoxGeometry( 1, 1, 1 ));
		material.push(new THREE.MeshBasicMaterial( { color: 0x00ff00 } ));
		
		material[oCount].color.r = cObjectOne._currentColour[0]/255;
		material[oCount].color.g = cObjectOne._currentColour[1]/255;
		material[oCount].color.b = cObjectOne._currentColour[2]/255;
		
		cubes.push(new THREE.Mesh( geometry[oCount], material[oCount] ));
		cubes[oCount].position.x = centrePoints[0];
		cubes[oCount].position.y = centrePoints[1];
		cubes[oCount].position.z = 0;
		scene.add( cubes[ oCount ] );
		innerCIndex+=cIncrement;
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
	for(var oCount=0; oCount<numberOfObjects; oCount++)
	{
		cObjectOne.getColour(innerCIndex%cObjectOne._bandWidth);
		material[oCount].color.r = cObjectOne._currentColour[0]/255;
		material[oCount].color.g = cObjectOne._currentColour[1]/255;
		material[oCount].color.b = cObjectOne._currentColour[2]/255;
		innerCIndex+=cIncrement;
	}
	cIndex+=cIncrement;
	
	controls.update();
	renderer.render( scene, camera );
}

animate();

function getCircularPoints(circleX, circleY, circleR, angleFromTopLeftoRight)
{
	var circCoOrds = [0, 0];
	circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*circleR ;
	circCoOrds[1] = circleY - Math.cos(angleFromTopLeftoRight*(Math.PI / 180))*circleR;
	return circCoOrds;
}

