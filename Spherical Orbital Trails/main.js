import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
//-----------------	Bolier Plate	-----------------
import CCGenerator from './BoilerPlate/CCGenerator.js';					//Colour System
import timerObject from './BoilerPlate/timerObject.js';					//Timers
import pixelMaper from './BoilerPlate/pixelMaper.js';					//Pixel Maper
import envelopGenerator from './BoilerPlate/envelopGenerator.js';		//Envelop Generator
import animationObject from './BoilerPlate/animationObject.js';			//Generic Object Tracking class
import threeLineSphere from './BoilerPlate/threeLineSphere.js';

//Scence Set up
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 20, window.innerWidth / window.innerHeight, 0.1, 2000 );
const renderer = new THREE.WebGLRenderer( { antialias: true } );
//renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );

//Set up the global DIVs for debug data to be overlaid
var mainDIv;
mainDIv = document.createElement('div');
mainDIv.setAttribute('id','mainDiv');
mainDIv.setAttribute('style','opacity: 1');
renderer.domElement.setAttribute('id','threejscanvas');
mainDIv.appendChild( renderer.domElement );
document.body.appendChild( mainDIv );

//Lighting
var numberOfLights = 6;
var lights = new Array();
var lightHelpers = new Array();

//Colour system global vars
var cIndex=0, innerCIndex=0;
//Colour System
var maxValue = 255, maxColourDitherSteps = 128;
var colourList_1 = [maxValue,0,0,maxValue,maxValue,0, 0,maxValue,0, 0,maxValue,maxValue, 0,0,maxValue, maxValue,0,maxValue, maxValue,maxValue,maxValue];
let colourObject = new CCGenerator(maxColourDitherSteps, colourList_1.length/3, colourList_1);
var objectTape = new Array();

//Pixel Mapper
var pixelMap;
var randomPoints = [0,0];
var screenRange = [800,600,300];

//mouse Tracker
var mouseLocation = [0,0];
var virtualMouse = [0,0];
var cameraLookingAt = new THREE.Vector3(0,0,0);


//Global colour System
var globalColour;


//efects composer
const renderScene = new RenderPass( scene, camera );
const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
const bloomComposer = new EffectComposer( renderer );
bloomComposer.renderToScreen = false;
bloomComposer.addPass( renderScene );
bloomComposer.addPass( bloomPass );

const mixPass = new ShaderPass(
				new THREE.ShaderMaterial( {
					uniforms: {
						baseTexture: { value: null },
						bloomTexture: { value: bloomComposer.renderTarget2.texture }
					},
					vertexShader: document.getElementById( 'vertexshader' ).textContent,
					fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
					defines: {}
				} ), 'baseTexture'
			);
			mixPass.needsSwap = true;
const outputPass = new OutputPass();
let composer = new EffectComposer( renderer );
composer.addPass( renderScene );
composer.addPass( mixPass );

var enablePostProcessing = 0;


//System Set up
var objectCount = 1;
var sceneReady = 0;
var rotationTrack = 0;
var gobalObject;

const BLOOM_SCENE = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set( BLOOM_SCENE );
const darkMaterial = new THREE.MeshLambertMaterial( { color: 'black' } );
			
setUp();
setUpScene();
animationSetUp();

const controls = new OrbitControls( camera, renderer.domElement );
controls.update();
controls.autoRotateSpeed=1;
controls.saveState();

function setUp()
{	
	
	//pixel map helper
	pixelMap = new pixelMaper(2,2);
	
	//Camera location preset
	cameraLookingAt = camera.position;
	cameraLookingAt.z = 300;
	camera.position.set( 0, 0, cameraLookingAt.z );	


}

function setUpScene()
{
	var localObjectCounter = 0;
	var localCentrePoints = [0,0];
	var lightRadius = 500;	
	//clear Scene
	scene.clear();
	//set up scene background COlour
	//set up lighting around the y axis
	
	for(localObjectCounter=0; localObjectCounter<numberOfLights/2; localObjectCounter++)
	{
		lights.push(new THREE.DirectionalLight( 0xffffff, 1 ));
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
		lights.push(new THREE.DirectionalLight( 0xffffff, 1 ));
		localCentrePoints = pixelMap.getCircularPointsRaw(0, 0, lightRadius, (360/(numberOfLights/2))*localObjectCounter-(numberOfLights/2));
		lights[localObjectCounter].position.x = 0;
		lights[localObjectCounter].position.y = localCentrePoints[0];
		lights[localObjectCounter].position.z = localCentrePoints[1];
		lightHelpers.push([0, localCentrePoints[0], localCentrePoints[1]]);
		scene.add(lights[localObjectCounter]);
	}

}


//set up	--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function animationSetUp()
{	
	//Colour System
	var objectCounter=0;
	var colourIndex = 0;
	var maxValue = 255;
	var maxColourDitherSteps = 128;
	var colourList_1 = [maxValue,0,0,maxValue,maxValue,0, 0,maxValue,0, 0,maxValue,maxValue, 0,0,maxValue, maxValue,0,maxValue, maxValue,maxValue,maxValue];
	var colourObject = new CCGenerator(maxColourDitherSteps, colourList_1.length/3, colourList_1);
	
	enablePostProcessing = 1;	//enables bloom
	
	objectCount = 1;
	for(objectCounter=0; objectCounter<objectCount; objectCounter++)
	{
		objectTape.push(new threeLineSphere());
		objectTape[objectCounter].init(scene, 127*objectCounter);
		objectTape[objectCounter].radius = 100 +(objectCounter*100);
		objectTape[objectCounter].sliceStart = (0.1)*objectCounter;
		objectTape[objectCounter].rotationalVectors = [Math.random(), Math.random(), Math.random()];
		objectTape[objectCounter].slices = 25;
		objectTape[objectCounter].sliceAcuracy = 50;
		objectTape[objectCounter].trails = 20;
		objectTape[objectCounter].trailSpacing = 0.005;
		objectTape[objectCounter].sliceOpacity = 0.1;
		objectTape[objectCounter].seed([0,0,0]);
	}
	sceneReady = 1;
	
}

const materials = {};
function darkenNonBloomed( obj ) 
{
	if ( (obj.isMesh || obj.isPoints || obj.isLine)&& bloomLayer.test( obj.layers ) === false )
	{

		materials[ obj.uuid ] = obj.material;
		obj.material = darkMaterial;
	}
}
function restoreMaterial( obj )
{
	if ( materials[ obj.uuid ] ) 
	{
		obj.material = materials[ obj.uuid ];
		delete materials[ obj.uuid ];
	}
}



function animate() 
{
	if(sceneReady!=1){return;}
	var localObjectCounter;
	var colourIncrement = 1, subColourIncrement=20, motionSpeed=0.05, rotationSpeed=0, radiusEnvelopIncrement=0, radiusSubEnvelopIncrement=0, trailSpeed=0.001;
	var objectScale = 1, xScale=1, yScale=1;
	
	for(localObjectCounter=0; localObjectCounter<objectTape.length; localObjectCounter++)
	{
		objectTape[localObjectCounter].animate(colourIncrement, subColourIncrement, motionSpeed, [rotationSpeed,rotationSpeed,rotationSpeed], radiusEnvelopIncrement,radiusSubEnvelopIncrement, trailSpeed);
		objectTape[localObjectCounter].updatePath(objectScale, xScale, yScale, radiusEnvelopIncrement,radiusSubEnvelopIncrement);
	}
	
	requestAnimationFrame( animate );
	controls.update();	
	
	if(enablePostProcessing==0)
	{
		renderer.render( scene, camera );		//Standard render method
	}
	else
	{
		scene.traverse( darkenNonBloomed );
		bloomComposer.render();
		scene.traverse( restoreMaterial );
		// render the entire scene, then render bloom scene on top
		composer.render();						//Render via effects composer
	}
	
	//Bloom Controls
	bloomPass.threshold = 0;
	bloomPass.strength = 1;
	bloomPass.radius = 1;
}
animate();