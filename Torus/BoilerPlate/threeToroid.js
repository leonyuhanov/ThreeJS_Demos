import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class

class threeToroid
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "CO_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [150,150];
		this.type = 0;		//0 = circlular paths	1 = rectangular paths
		this.radius = 110;
		this.slices = 32;
		this.pointsPerSlice = 50;
		this.sliceOpacity = 1;
		this.trailsPerSlice = 10;
		this.initialTrailSize = 2;
		this.trailPointSpacing = 0.005;
		this.showPoints = 1;
		this.setUpStatus = 0;
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
		this.screenRange = [100,100,100];
		this.timers = new timerObject();
		this.envelops = new envelopGenerator();
		this.directionalVectors = [1,1,1];
		
		//Colour System
		this.colourIndex = 0;
		this.maxValue = 255;
		this.maxColourDitherSteps = 128;
		this.colourList_1 = [this.maxValue,0,0,this.maxValue,this.maxValue,0, 0,this.maxValue,0, 0,this.maxValue,this.maxValue, 0,0,this.maxValue, this.maxValue,0,this.maxValue, this.maxValue,this.maxValue,this.maxValue];
		this.colourObject = new CCGenerator(this.maxColourDitherSteps, this.colourList_1.length/3, this.colourList_1);
		this.colourIndex=0;
		this.subColourIndex=0;
	}
	
	init = function(scene, colourIndex)
	{
		this.scene = scene;
		this.colourIndex = colourIndex;
	}
	animate = function(colourIncrement, subColourIncrement, motionIncrement, rotationalIncrements)
	{
		//creation loop
		this.orbitCreationLoop();
		if(this.setUpStatus==0){return;}
		var localObjectCounter=0, localTrailCounter=0;
		var pointVector;
		
		for(localObjectCounter=0; localObjectCounter<this.objectTape.length; localObjectCounter++)
		{
			this.objectTape[localObjectCounter].extrude[0] += this.objectTape[localObjectCounter].motionIncrements[0]*motionIncrement;
			for(localTrailCounter=0; localTrailCounter<this.objectTape[localObjectCounter].subPollyPoints; localTrailCounter++)
			{
				pointVector = this.objectTape[localObjectCounter].shape[0].getPoint( (this.objectTape[localObjectCounter].extrude[0]+(this.trailPointSpacing*localTrailCounter))%1 );
				//pointVector = this.objectTape[localObjectCounter].shape[0].getPoint( (((localTrailCounter/this.objectTape[localObjectCounter].subPollyPoints)*localTrailCounter)+this.objectTape[localObjectCounter].extrude[0])%1 );
				this.objectTape[localObjectCounter].objects[this.showPoints+localTrailCounter].position.x = pointVector.x;
				this.objectTape[localObjectCounter].objects[this.showPoints+localTrailCounter].position.z = pointVector.y;
				this.colourObject.getColour(this.subColourIndex%this.colourObject._bandWidth);
				this.objectTape[localObjectCounter].materials[this.showPoints+localTrailCounter].color.r = this.colourObject._currentColour[0]/255;
				this.objectTape[localObjectCounter].materials[this.showPoints+localTrailCounter].color.g = this.colourObject._currentColour[1]/255;
				this.objectTape[localObjectCounter].materials[this.showPoints+localTrailCounter].color.b = this.colourObject._currentColour[2]/255;
				this.subColourIndex += subColourIncrement;
			}
		}
		this.colourIndex +=colourIncrement;
		this.subColourIndex = this.colourIndex;
		
		this.globalObjectGroup.rotateX( (rotationalIncrements[0])*(Math.PI/180) );
		this.globalObjectGroup.rotateY( (rotationalIncrements[1])*(Math.PI/180) );
		this.globalObjectGroup.rotateZ( (rotationalIncrements[2])*(Math.PI/180) );
		
	}
	updatePath = function(radiusScale, xScale=1, yScale=1)
	{
		if(this.setUpStatus==0){return;}
		var localObjectCounter=0;
		var currentRadius = this.radius*radiusScale, pointPos, verticies, pointCounter, pointVectors;
		var objectTrack=0		
		
		for(localObjectCounter=0; localObjectCounter<this.objectTape.length; localObjectCounter++)
		{
			objectTrack=0;
			this.objectTape[localObjectCounter].shape[0] = new THREE.Shape();
			pointPos = this.pixelMap.getCircularPointsRaw(0,0, currentRadius, (360/this.slices)*localObjectCounter);
			this.objectTape[localObjectCounter].dimensions = [pointPos[0]+(this.dimensions[0]*xScale), pointPos[0]+(this.dimensions[1]*yScale),0];
			if(this.type==1)
			{
				this.objectTape[localObjectCounter].shape[0].moveTo(this.objectTape[localObjectCounter].position[0]-(this.objectTape[localObjectCounter].dimensions[0]/2), this.objectTape[localObjectCounter].position[1]+(this.objectTape[localObjectCounter].dimensions[1]/2));
				this.objectTape[localObjectCounter].shape[0].lineTo(this.objectTape[localObjectCounter].position[0]+(this.objectTape[localObjectCounter].dimensions[0]/2), this.objectTape[localObjectCounter].position[1]+(this.objectTape[localObjectCounter].dimensions[1]/2));
				this.objectTape[localObjectCounter].shape[0].lineTo(this.objectTape[localObjectCounter].position[0]+(this.objectTape[localObjectCounter].dimensions[0]/2), this.objectTape[localObjectCounter].position[1]-(this.objectTape[localObjectCounter].dimensions[1]/2));
				this.objectTape[localObjectCounter].shape[0].lineTo(this.objectTape[localObjectCounter].position[0]-(this.objectTape[localObjectCounter].dimensions[0]/2), this.objectTape[localObjectCounter].position[1]-(this.objectTape[localObjectCounter].dimensions[1]/2));
				this.objectTape[localObjectCounter].shape[0].lineTo(this.objectTape[localObjectCounter].position[0]-(this.objectTape[localObjectCounter].dimensions[0]/2), this.objectTape[localObjectCounter].position[1]+(this.objectTape[localObjectCounter].dimensions[1]/2));
			}
			else
			{
				this.objectTape[localObjectCounter].shape[0].ellipse( this.objectTape[localObjectCounter].position[0], this.objectTape[localObjectCounter].position[1], this.objectTape[localObjectCounter].dimensions[0], this.objectTape[localObjectCounter].dimensions[1], 0, 2*Math.PI, false, 0);
			}
			if(this.showPoints==1)
			{
				verticies = new Array();
				for(pointCounter=0; pointCounter<this.objectTape[localObjectCounter].pollyPoints; pointCounter++)
				{
					pointVectors = this.objectTape[localObjectCounter].shape[0].getPoint(pointCounter/this.objectTape[localObjectCounter].pollyPoints);
					verticies.push(pointVectors.x, pointPos[1], pointVectors.y);
				}
				this.objectTape[localObjectCounter].geometry[objectTrack].setAttribute( 'position', new THREE.Float32BufferAttribute( verticies , 3 ) );
				objectTrack++;
			}
			for(pointCounter=0; pointCounter<this.objectTape[localObjectCounter].subPollyPoints; pointCounter++)
			{
				this.objectTape[localObjectCounter].objects[objectTrack+pointCounter].position.y = pointPos[1];
			}
		}
		
	}
	insertToroid = function()
	{
		var objectCounter=0;
		var pointCounter=0, verticies, pointVectors;
		var pointPos, objectTrack=0;
		var localGroup;
		
		for(objectCounter=0; objectCounter<this.slices; objectCounter++)
		{
			objectTrack=0;
			localGroup = new THREE.Object3D();
			this.objectTape.push( new animationObject() );
			this.objectTape[objectCounter].position = [this.origin[0],this.origin[1],this.origin[2]];
			pointPos = this.pixelMap.getCircularPointsRaw(0,0,this.radius, (360/this.slices)*objectCounter);
			this.objectTape[objectCounter].dimensions = [pointPos[0]+this.dimensions[0],pointPos[0]+this.dimensions[1],0];
			this.objectTape[objectCounter].pollyPoints = this.pointsPerSlice;
			this.objectTape[objectCounter].subPollyPoints = this.trailsPerSlice;
			this.objectTape[objectCounter].shape.push( new THREE.Shape() );
			if(this.type==1)
			{
				this.objectTape[objectCounter].shape[0].moveTo(this.objectTape[objectCounter].position[0]-(this.radius/2), this.objectTape[objectCounter].position[1]+(this.radius/2));
				this.objectTape[objectCounter].shape[0].lineTo(this.objectTape[objectCounter].position[0]+(this.radius/2), this.objectTape[objectCounter].position[1]+(this.radius/2));
				this.objectTape[objectCounter].shape[0].lineTo(this.objectTape[objectCounter].position[0]+(this.radius/2), this.objectTape[objectCounter].position[1]-(this.radius/2));
				this.objectTape[objectCounter].shape[0].lineTo(this.objectTape[objectCounter].position[0]-(this.radius/2), this.objectTape[objectCounter].position[1]+(this.radius/2));
				this.objectTape[objectCounter].shape[0].lineTo(this.objectTape[objectCounter].position[0]-(this.radius/2), this.objectTape[objectCounter].position[1]+(this.radius/2));
			}
			else
			{
				this.objectTape[objectCounter].shape[0].ellipse( this.objectTape[objectCounter].position[0], this.objectTape[objectCounter].position[1], this.objectTape[objectCounter].dimensions[0], this.objectTape[objectCounter].dimensions[1], 0, 2*Math.PI, false, 0);
			}
			if(this.showPoints==1)
			{
				verticies = new Array();
				for(pointCounter=0; pointCounter<this.objectTape[objectCounter].pollyPoints; pointCounter++)
				{
					pointVectors = this.objectTape[objectCounter].shape[0].getPoint(pointCounter/this.objectTape[objectCounter].pollyPoints);
					verticies.push(pointVectors.x, pointPos[1], pointVectors.y);
				}
				this.objectTape[objectCounter].geometry.push(new THREE.BufferGeometry());
				this.objectTape[objectCounter].materials.push( new THREE.PointsMaterial({color: 0xffffff, size: 1 }) );
				this.objectTape[objectCounter].materials[objectTrack].transparent = true;
				this.objectTape[objectCounter].materials[objectTrack].opacity = this.sliceOpacity;
				this.objectTape[objectCounter].geometry[objectTrack].setAttribute( 'position', new THREE.Float32BufferAttribute( verticies , 3 ) );
				this.objectTape[objectCounter].objects.push( new THREE.Points(this.objectTape[objectCounter].geometry[objectTrack], this.objectTape[objectCounter].materials[objectTrack]) );
				localGroup.add( this.objectTape[objectCounter].objects[objectTrack] );
				objectTrack++;
			}
			//create trails
			this.objectTape[objectCounter].motionIncrements[0] = Math.random();
			this.objectTape[objectCounter].extrude.push( 0/*Math.random()*/ );
			for(pointCounter=0; pointCounter<this.objectTape[objectCounter].subPollyPoints; pointCounter++)
			{
				this.objectTape[objectCounter].geometry.push( new THREE.SphereGeometry( this.initialTrailSize+(0.01*pointCounter), 10, 10 ) );
				//this.objectTape[objectCounter].geometry.push( new THREE.BoxGeometry( this.initialTrailSize+(0.01*pointCounter), this.initialTrailSize, this.initialTrailSize ) );
				this.objectTape[objectCounter].materials.push( new THREE.MeshLambertMaterial( { color: 0xffffff } ) );
				this.objectTape[objectCounter].materials[objectTrack].transparent = true;
				this.objectTape[objectCounter].materials[objectTrack].opacity = (pointCounter/this.objectTape[objectCounter].subPollyPoints);
				this.objectTape[objectCounter].objects.push( new THREE.Mesh( this.objectTape[objectCounter].geometry[objectTrack], this.objectTape[objectCounter].materials[objectTrack] ) );
				this.objectTape[objectCounter].objects[objectTrack].layers.enable( 1 );
				pointVectors = this.objectTape[objectCounter].shape[0].getPoint((this.objectTape[objectCounter].extrude[0]+(this.trailPointSpacing*pointCounter))%1);
				this.objectTape[objectCounter].objects[objectTrack].position.set(pointVectors.x, pointPos[1], pointVectors.y);
				localGroup.add( this.objectTape[objectCounter].objects[objectTrack] );
				objectTrack++;
			}
			this.globalGroupArray.push( localGroup );
			this.globalObjectGroup.add( localGroup );
			//this.scene.add( this.globalGroupArray[objectCounter] );
		}
		this.scene.add( this.globalObjectGroup );
		this.setUpStatus = 1;
	}
	generatedirectionalVectors = function()
	{
		if( Math.round(Math.random()) == 1 ){this.directionalVectors[0]=1;}else{this.directionalVectors[0]=-1;}
		if( Math.round(Math.random()) == 1 ){this.directionalVectors[1]=1;}else{this.directionalVectors[1]=-1;}
		if( Math.round(Math.random()) == 1 ){this.directionalVectors[2]=1;}else{this.directionalVectors[2]=-1;}
	}
	seed = function(originPoint)
	{
		if(originPoint==undefined)
		{
			this.origin[0] = (-this.screenRange[0])+Math.round(Math.random()*(this.screenRange[0]*2));
			this.origin[1] = (this.screenRange[1])-Math.round(Math.random()*(this.screenRange[1]*2));
			this.origin[2] = (-this.screenRange[2])+Math.round(Math.random()*(this.screenRange[2]*2));
		}
		else
		{
			this.origin[0] = originPoint[0];
			this.origin[1] = originPoint[1];
			this.origin[2] = originPoint[2];
		}
		this.create = 0;
	}
	orbitCreationLoop = function()
	{
		if(this.setUpStatus==0)
		{
			this.insertToroid();
		}
	}
}
export default threeToroid;