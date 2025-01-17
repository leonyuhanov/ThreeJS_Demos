import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class

class threeCubeoid
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalObjectArray = new Array();
		this.groupName = "CO_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.pointsPerFace = 4;
		this.radius = 50;
		this.subRadius = 0;
		this.drawOutline = true;
		this.pointsPerOutline = 25;
		this.outlineOpacity = 1;
		this.trailPoints = 100;
		this.trailSpacingType = 0;
		this.trailPointSpacing = 0.005;
		this.trailSize = 1;
		this.equalTrailStart = 1;
		this.enableVoidEnvelop = 0;
		this.startAngle = 45;
		this.setUpStatus = 0;
		this.rotationalVectors = [0,0,0];
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
		this.screenRange = [100,100,100];
		this.timers = new timerObject();
		this.envelops = new envelopGenerator();
		this.directionalVectors = [1,1,1];
		this.facePointArray = [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
		
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
	animate = function(colourIndex, subColourIncrement, trailSpeed, rotationScaler, voidEnvelopIncrement)
	{
		//creation loop
		this.orbitCreationLoop(colourIndex);
		if(this.setUpStatus==0){return;}
		
		var trailIndex = 0, faceIndex=0, trailCounter=0;
		var shapeVector, volumePos, faceCounter, pointArray, vertexCounter, faceVectors;
		var voidSpaceRadius=1;
		if(this.enableVoidEnvelop==1)
		{
			voidSpaceRadius = this.envelops.getEnvelopNonZeroStartAsRatio("voidSpaceModulator", voidEnvelopIncrement+0.001, 0, 100)*2;
		}
		volumePos = this.pixelMap.getCircularPointsRaw(0,0, (this.objectTape[0].radius+this.objectTape[0].subRadius)*voidSpaceRadius, this.startAngle);
		if(this.drawOutline==true)
		{
			trailIndex = 6;
			//recalculate the point lines
			for(faceCounter=0; faceCounter<6; faceCounter++)
			{
				pointArray = new Array();
				for(vertexCounter=0; vertexCounter<this.objectTape[0].subPollyPoints; vertexCounter++)
				{
					faceVectors = this.genObject.shape[0].getPoint(vertexCounter/this.objectTape[0].subPollyPoints);
					this.generateFacePointArray([faceVectors.x, faceVectors.y, volumePos[0]]);
					pointArray.push( this.facePointArray[faceCounter][0], this.facePointArray[faceCounter][1], this.facePointArray[faceCounter][2] );
				}
				this.objectTape[0].geometry[faceCounter].setAttribute( 'position', new THREE.Float32BufferAttribute( pointArray , 3 ) );
			}
		}
		else
		{
			trailIndex = 0;
		}
		this.objectTape[0].motionIncrements[0] += trailSpeed;
		this.colourIndex = colourIndex;
		this.subColourIndex = this.colourIndex;
		for(faceIndex=0; faceIndex<6; faceIndex++)
		{
			for(trailCounter=0; trailCounter<this.objectTape[0].pollyPoints; trailCounter++)
			{
				if(this.trailSpacingType==0)
				{
					shapeVector = this.objectTape[0].shape[0].getPoint( ((trailCounter/this.objectTape[0].pollyPoints)+this.objectTape[0].motionIncrements[0]+this.objectTape[0].extrude[faceIndex])%1 );
				}
				else
				{
					shapeVector = this.objectTape[0].shape[0].getPoint( ((trailCounter*this.trailPointSpacing)+this.objectTape[0].motionIncrements[0]+this.objectTape[0].extrude[faceIndex])%1 );
				}
				this.generateFacePointArray([shapeVector.x, shapeVector.y, volumePos[0]]);
				this.objectTape[0].objects[trailIndex].position.set(this.facePointArray[faceIndex][0], this.facePointArray[faceIndex][1], this.facePointArray[faceIndex][2]);
				
				this.subColourIndex += subColourIncrement;
				this.colourObject.getColour(this.subColourIndex%this.colourObject._bandWidth);
				this.objectTape[0].materials[trailIndex].color.r = this.colourObject._currentColour[0]/255;
				this.objectTape[0].materials[trailIndex].color.g = this.colourObject._currentColour[1]/255;
				this.objectTape[0].materials[trailIndex].color.b = this.colourObject._currentColour[2]/255;
				trailIndex++;
			}
		}
		//rotation
		this.globalObjectArray[0].rotateX(this.rotationalVectors[0]*rotationScaler[0]);
		this.globalObjectArray[0].rotateY(this.rotationalVectors[1]*rotationScaler[1]);
		this.globalObjectArray[0].rotateZ(this.rotationalVectors[2]*rotationScaler[2]);
	}
	updatePath = function(newRadius)
	{
		if(this.setUpStatus==0){return;}
		var volumePos, vertexCounter, startPos, midPos;
		
		//this.radius = newRadius;
		this.objectTape[0].radius = newRadius;
		this.objectTape[0].shape[0] = new THREE.Shape();
		volumePos = this.pixelMap.getCircularPointsRaw(0,0, this.objectTape[0].radius+this.objectTape[0].subRadius, this.startAngle);
		for(vertexCounter=0; vertexCounter<this.pointsPerFace; vertexCounter++)
		{
			if(vertexCounter==0)
			{
				startPos = this.pixelMap.getCircularPointsRaw(0,0, this.objectTape[0].radius, this.startAngle);
				this.objectTape[0].shape[0].moveTo(startPos[0], startPos[1]);
			}
			else
			{
				midPos = this.pixelMap.getCircularPointsRaw(0,0, this.objectTape[0].radius, ((360/this.pointsPerFace)*vertexCounter)+this.startAngle);
				this.objectTape[0].shape[0].lineTo(midPos[0], midPos[1]);
			}
		}
		this.objectTape[0].shape[0].lineTo(startPos[0], startPos[1]);
	}
	insertCuboid = function()
	{
		var objectGroup = new THREE.Object3D();
		var vertexCounter=0, startPos, midPos, pointArray, faceVectors, volumePos, trailStart=0;
		var faceCounter=0, objectIndex=0;
		
		this.genObject = new animationObject();		
		this.genObject.objectID = this.groupName+this.objectIDIndex;
		this.genObject.position = [this.origin[0],this.origin[1],this.origin[2]];
		this.genObject.radius = this.radius;
		this.genObject.subRadius = this.subRadius;
		this.genObject.pollyPoints = this.trailPoints; 
		this.genObject.subPollyPoints = this.pointsPerOutline; 
		//Create the shape that is used via getPoints() to get a path for all objects
		this.genObject.shape.push( new THREE.Shape() );
		volumePos = this.pixelMap.getCircularPointsRaw(0,0, this.genObject.radius+this.genObject.subRadius, this.startAngle);
		for(vertexCounter=0; vertexCounter<this.pointsPerFace; vertexCounter++)
		{
			if(vertexCounter==0)
			{
				startPos = this.pixelMap.getCircularPointsRaw(0,0, this.genObject.radius, 0+this.startAngle);
				this.genObject.shape[0].moveTo(startPos[0], startPos[1]);
			}
			else
			{
				midPos = this.pixelMap.getCircularPointsRaw(0,0, this.genObject.radius, ((360/this.pointsPerFace)*vertexCounter)+this.startAngle);
				this.genObject.shape[0].lineTo(midPos[0], midPos[1]);
			}
		}
		this.genObject.shape[0].lineTo(startPos[0], startPos[1]);
		//Create the wireframe is this.drawOutline == true
		if(this.drawOutline==true)
		{
			for(faceCounter=0; faceCounter<6; faceCounter++)
			{
				this.genObject.geometry.push(new THREE.BufferGeometry());
				this.genObject.materials.push( new THREE.PointsMaterial({color: 0xffffff, size: 0.5 }) );
				this.genObject.materials[faceCounter].transparent = true;
				this.genObject.materials[faceCounter].opacity = this.outlineOpacity;
				pointArray = new Array();
				for(vertexCounter=0; vertexCounter<this.genObject.subPollyPoints; vertexCounter++)
				{
					faceVectors = this.genObject.shape[0].getPoint(vertexCounter/this.genObject.subPollyPoints);
					this.generateFacePointArray([faceVectors.x, faceVectors.y, volumePos[0]]);
					pointArray.push( this.facePointArray[faceCounter][0], this.facePointArray[faceCounter][1], this.facePointArray[faceCounter][2] );
				}
				this.genObject.geometry[faceCounter].setAttribute( 'position', new THREE.Float32BufferAttribute( pointArray , 3 ) );
				this.genObject.objects.push( new THREE.Points(this.genObject.geometry[faceCounter], this.genObject.materials[faceCounter]) );
				objectGroup.add( this.genObject.objects[faceCounter] );
			}
		}
		//create trailing Objects
		objectIndex = this.genObject.objects.length;
		for(faceCounter=0; faceCounter<6; faceCounter++)
		{
			if(this.equalTrailStart==0)
			{
				trailStart = Math.random();
			}
			this.genObject.extrude.push(trailStart);
			for(vertexCounter=0; vertexCounter<this.genObject.pollyPoints; vertexCounter++)
			{
				this.genObject.geometry.push( new THREE.SphereGeometry( this.trailSize+(0.01*vertexCounter), 10, 10 ) );
				this.genObject.materials.push( new THREE.MeshLambertMaterial( { color: 0xffffff } ) );
				this.genObject.materials[objectIndex].transparent = true;
				this.genObject.materials[objectIndex].opacity = vertexCounter/this.genObject.pollyPoints;
				this.genObject.objects.push( new THREE.Mesh( this.genObject.geometry[objectIndex], this.genObject.materials[objectIndex] ) );
				this.genObject.objects[objectIndex].layers.enable( 1 );
				if(this.trailSpacingType==0)
				{
					faceVectors = this.genObject.shape[0].getPoint(((vertexCounter/this.genObject.pollyPoints)+this.genObject.extrude[faceCounter])%1);
				}
				else
				{
					faceVectors = this.genObject.shape[0].getPoint(((vertexCounter*this.trailPointSpacing)+this.genObject.extrude[faceCounter])%1);
				}
				this.generateFacePointArray([faceVectors.x, faceVectors.y, volumePos[0]]);	//this.genObject.radius
				this.genObject.objects[objectIndex].position.set(this.facePointArray[faceCounter][0], this.facePointArray[faceCounter][1], this.facePointArray[faceCounter][2]);
				objectGroup.add( this.genObject.objects[objectIndex] );
				objectIndex++;
			}
		}
		objectGroup.position.set(this.origin[0], this.origin[1], this.origin[2]);
		this.objectTape.push(this.genObject);
		this.globalObjectArray.push(objectGroup);
		this.scene.add(this.globalObjectArray[0]);
		this.objectIDIndex++;
		this.setUpStatus = 1;
		//Void space envelop
		this.envelops.addWithTimeCode("voidSpaceModulator", [100,0], [150,100], 1, 0);
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
	orbitCreationLoop = function(colourIncrement)
	{
		if(this.setUpStatus==0)
		{
			this.insertCuboid();
		}
	}
	generateFacePointArray = function(frontFacePoints)
	{
		//Front
		this.facePointArray[0] = [frontFacePoints[0],frontFacePoints[1],frontFacePoints[2]];
		//Rear
		this.facePointArray[1] = [frontFacePoints[0],frontFacePoints[1],-frontFacePoints[2]];
		//Right
		this.facePointArray[2] = [frontFacePoints[2],frontFacePoints[1],frontFacePoints[0]];
		//Left
		this.facePointArray[3] = [-frontFacePoints[2],frontFacePoints[1],frontFacePoints[0]];
		//top
		this.facePointArray[4] = [frontFacePoints[1],frontFacePoints[2],frontFacePoints[0]];
		//bottom
		this.facePointArray[5] = [frontFacePoints[1],-frontFacePoints[2],frontFacePoints[0]];
	}
}
export default threeCubeoid;