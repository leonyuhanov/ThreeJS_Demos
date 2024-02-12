import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import CCGenerator from './BoilerPlate/CCGenerator.js';
import MIDIMapper from './BoilerPlate/MIDIMapper.js';
import pixelMaper from './BoilerPlate/pixelMaper.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
//var directionalLight = new THREE.DirectionalLight( 0xffffff, .1 );
var canvasObject = document.createElement('canvas');
canvasObject.setAttribute('id', "textureCanvas");

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
document.body.appendChild( canvasObject );

var geometry = new Array();// = new THREE.BoxGeometry( 2, 1, 1 );
var material = new Array();//new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cubes = Array();// = new THREE.Mesh( geometry, material );
const spotLight = new THREE.SpotLight( 0xffffff );

camera.position.z = -30;

var centrePoints = [0,0];
var numberOfObjects = 90;
var oIndex=0;
var frameCounter=0;

//colours
var maxValue = 255;
var maxColourDitherSteps = 128;
var colourList = [maxValue,0,0, maxValue,maxValue,0, 0,maxValue,0, 0,maxValue,maxValue, 0,0,maxValue, maxValue,0,maxValue, maxValue,maxValue,maxValue];
var cIndex=0, cIncrement=10, innerCIndex=0;
let cObjectOne = new CCGenerator(maxColourDitherSteps, 7, colourList);

//textures
var canvasCTX;
var globaltexture;

setUp();

const controls = new OrbitControls( camera, renderer.domElement );
controls.update();

function setUp()
{
	
	
	oIndex = 0;
	geometry.push(new THREE.BoxGeometry( 5, 5, 5 ));
	
	material.push(new THREE.MeshBasicMaterial( { color: 0xffffff } ));
	material[oIndex].transparent = true;
	material[oIndex].opacity = 1;
	material[oIndex].color.r = 1;
	material[oIndex].color.g = 1;
	material[oIndex].color.b = 1;
	material[oIndex].map = globaltexture;
	
	cubes.push(new THREE.Mesh( geometry[oIndex], material[oIndex] ));
	cubes[oIndex].position.x = 0;
	cubes[oIndex].position.y = 0;
	cubes[oIndex].position.z = 0;

	scene.add( cubes[ oIndex ] );

	
	spotLight.position.set( 0, 0, -10 );
	spotLight.castShadow = true;
	scene.add( spotLight );	
	
	canvasCTX = document.getElementById("textureCanvas");
	canvasCTX.width = 100;
	canvasCTX.height = 100;
}

function animate() 
{
	requestAnimationFrame( animate );
	canvasCTX = document.getElementById("textureCanvas").getContext("2d");
	
	clearCanvas("textureCanvas", 0.05);
	canvasCTX.strokeStyle = "rgba(255,0,0,1)";
	canvasCTX.beginPath();
	canvasCTX.arc(50, 50, frameCounter%(document.getElementById("textureCanvas").width-20), 0, 2 * Math.PI);
	canvasCTX.stroke();
	globaltexture = new THREE.CanvasTexture(document.getElementById("textureCanvas"));
	globaltexture.needsUpdate = 1;
	material[0].map = globaltexture;
	
	//cube.rotation.x += 0.01;
	//cube.position.y += 0.01;
	//cube.geometry.setX(cube.geometry.getX()+0.01);
	//cube.scale.z = cube.rotation.x;
	
	innerCIndex = cIndex;
	//spotLight.position.set( (frameCounter%30), 0, 0 );
	/*
	for(var oCount=0; oCount<numberOfObjects; oCount++)
	{
		oIndex = oCount;
		centrePoints = getCircularPoints(0, 0, (frameCounter)%20, ((360/numberOfObjects)*oCount)+frameCounter);
		cubes[oIndex].position.x = centrePoints[0];
		cubes[oIndex].position.y = centrePoints[1];
		cubes[oIndex].position.z = 0;
		cObjectOne.getColour(innerCIndex%cObjectOne._bandWidth);
		material[oIndex].color.r = cObjectOne._currentColour[0]/255;
		material[oIndex].color.g = cObjectOne._currentColour[1]/255;
		material[oIndex].color.b = cObjectOne._currentColour[2]/255;
		innerCIndex+=cIncrement;
	}
	*/
	
	cIndex+=cIncrement;
	frameCounter+=0.5;
	
	controls.update();
	renderer.render( scene, camera );
}

animate();

function clearCanvas(canvasId, clearBy)
{
	var localCanvasCtx = document.getElementById(canvasId).getContext("2d");
	localCanvasCtx.fillStyle = "rgba(0,0,0,"+clearBy+")";
	localCanvasCtx.beginPath();
	localCanvasCtx.rect(0, 0, document.getElementById(canvasId).width, document.getElementById(canvasId).height);
	localCanvasCtx.fill();	
}

function getCircularPoints(circleX, circleY, circleR, angleFromTopLeftoRight)
{
	var circCoOrds = [0, 0];
	circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*circleR ;
	circCoOrds[1] = circleY - Math.cos(angleFromTopLeftoRight*(Math.PI / 180))*circleR;
	return circCoOrds;
}

