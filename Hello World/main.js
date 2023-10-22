import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var geometry = new Array();// = new THREE.BoxGeometry( 2, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cubes = Array();// = new THREE.Mesh( geometry, material );
//scene.add( cube );

camera.position.z = -50;

var centrePoints = [0,0];
var numberOfObjects = 90;

setUp();

const controls = new OrbitControls( camera, renderer.domElement );
controls.update();

function setUp()
{
	for(var oCount=0; oCount<numberOfObjects; oCount++)
	{
		centrePoints = getCircularPoints(0, 0, 30, (360/numberOfObjects)*oCount);
		geometry.push(new THREE.BoxGeometry( 1, 1, 1 ));
		cubes.push(new THREE.Mesh( geometry[oCount], material ));
		cubes[oCount].position.x = centrePoints[0];
		cubes[oCount].position.y = centrePoints[1];
		cubes[oCount].position.z = 0;
		scene.add( cubes[ oCount ] );
	}
}

function animate() 
{
	requestAnimationFrame( animate );

	//cube.rotation.x += 0.01;
	//cube.position.y += 0.01;
	//cube.geometry.setX(cube.geometry.getX()+0.01);
	//cube.scale.z = cube.rotation.x;
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