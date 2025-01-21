import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class

class threeLineSphere
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.globalGroupArray = new Array();
		this.globalObjectGroup = new THREE.Object3D();
		this.groupName = "LS_";
		this.objectIDIndex = 0;
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.origin = [0,0,0];
		this.dimensions = [0,0];
		this.scale = [0,0,0];
		this.rotationalVectors = [0,0,0];
		this.radius = 100;
		this.slices = 22;
		this.sliceAcuracy = 50;
		this.sliceOpacity = 1;
		this.sliceStart = 0;
		this.trails = 10;
		this.trailSpacing = 0.005;
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
		this.envelops.addWithTimeCode("radiusEnvelop", [100,0], [100,100], 1, 0);
	}
	animate = function(colourIncrement, subColourIncrement, motionIncrement, rotationalIncrements=[0,0,0], radiusEnvelopIncrement, radiusSubEnvelopIncrement, trailSpeed)
	{
		//creation loop
		this.orbitCreationLoop();
		if(this.setUpStatus==0){return;}
		
		var localObjectCounter=0, pointPos, lpCounter=0;
		var tempRotationalVectors = [0,0,0];
		var currentEnvelopIndex = this.envelops.getTimeCode("radiusEnvelop");
		var tempEnvelopIndex = currentEnvelopIndex;
		var radiusEnvelop=0;
		
		for(localObjectCounter=0; localObjectCounter<this.objectTape.length/2; localObjectCounter++)
		{
			this.objectTape[localObjectCounter].motionIncrements[0] += motionIncrement;
			tempEnvelopIndex += radiusEnvelopIncrement;
			radiusEnvelop = this.envelops.getEnvelopNonZeroStartAsRatio("radiusEnvelop", 0, tempEnvelopIndex, 100);
			this.objectTape[localObjectCounter].shape[0] = new THREE.Shape();
			pointPos = this.pixelMap.getCircularPointsRaw(0,0,this.radius*this.scale[0], ((180/this.objectTape[localObjectCounter].pollyPoints)*localObjectCounter+this.objectTape[localObjectCounter].motionIncrements[0])%180 );
			this.objectTape[localObjectCounter].dimensions = [pointPos[0]*this.scale[1],pointPos[0]*this.scale[2],0];
			this.objectTape[localObjectCounter].shape[0].ellipse( this.objectTape[localObjectCounter].position[0], this.objectTape[localObjectCounter].position[1], this.objectTape[localObjectCounter].dimensions[0]*radiusEnvelop, this.objectTape[localObjectCounter].dimensions[1]*radiusEnvelop, 0, 2*Math.PI, false, 0);
			this.objectTape[localObjectCounter].geometry[0].setFromPoints( this.objectTape[localObjectCounter].shape[0].getPoints(this.sliceAcuracy) );
			this.objectTape[localObjectCounter].objects[0].position.set(0, 0, pointPos[1]);
			this.objectTape[localObjectCounter].position[2] = pointPos[1];
			this.colourObject.getColour(this.subColourIndex%this.colourObject._bandWidth);
			this.objectTape[localObjectCounter].materials[0].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[localObjectCounter].materials[0].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[localObjectCounter].materials[0].color.b = this.colourObject._currentColour[2]/255;
			this.subColourIndex += subColourIncrement;
			
		}
		for(localObjectCounter; localObjectCounter<this.objectTape.length; localObjectCounter++)
		{
			this.subColourIndex = this.colourIndex;
			this.objectTape[localObjectCounter].motionIncrements[0] += trailSpeed*this.objectTape[localObjectCounter].motionIncrements[1];
			for(lpCounter=0; lpCounter<this.objectTape[localObjectCounter].pollyPoints; lpCounter++)
			{
				pointPos = this.objectTape[localObjectCounter-this.slices].shape[0].getPoint((this.objectTape[localObjectCounter].motionIncrements[0]+(this.trailSpacing*lpCounter))%1);
				this.objectTape[localObjectCounter].objects[lpCounter].position.set(pointPos.x, pointPos.y, this.objectTape[localObjectCounter-this.slices].position[2]);
				this.colourObject.getColour(this.subColourIndex%this.colourObject._bandWidth);
				this.objectTape[localObjectCounter].materials[lpCounter].color.r = this.colourObject._currentColour[0]/255;
				this.objectTape[localObjectCounter].materials[lpCounter].color.g = this.colourObject._currentColour[1]/255;
				this.objectTape[localObjectCounter].materials[lpCounter].color.b = this.colourObject._currentColour[2]/255;
				this.subColourIndex += subColourIncrement;
			}
		}
		
		this.colourIndex += colourIncrement;
		this.subColourIndex = this.colourIndex;
		this.envelops.setTimeCode("radiusEnvelop", currentEnvelopIndex+radiusSubEnvelopIncrement);

		tempRotationalVectors[0] = this.rotationalVectors[0]*rotationalIncrements[0];
		tempRotationalVectors[1] = this.rotationalVectors[1]*rotationalIncrements[1];
		tempRotationalVectors[2] = this.rotationalVectors[2]*rotationalIncrements[2];
	
		this.globalObjectGroup.rotateX( (tempRotationalVectors[0])*(Math.PI/180) );
		this.globalObjectGroup.rotateY( (tempRotationalVectors[1])*(Math.PI/180) );
		this.globalObjectGroup.rotateZ( (tempRotationalVectors[2])*(Math.PI/180) );
		
	}
	updatePath = function(radiusScale, xScale=1, yScale=1, radiusEnvelopIncrement, radiusSubEnvelopIncrement)
	{
		if(this.setUpStatus==0){return;}
		var localObjectCounter=0;
		var pointPos;
		var currentEnvelopIndex = this.envelops.getTimeCode("radiusEnvelop");
		var tempEnvelopIndex = currentEnvelopIndex;
		var radiusEnvelop=0;
		
		this.scale = [radiusScale, xScale, yScale];
		
		for(localObjectCounter=0; localObjectCounter<this.objectTape.length/2; localObjectCounter++)
		{
			tempEnvelopIndex += radiusEnvelopIncrement;
			radiusEnvelop = this.envelops.getEnvelopNonZeroStartAsRatio("radiusEnvelop", 0, tempEnvelopIndex, 100);
			this.objectTape[localObjectCounter].shape[0] = new THREE.Shape();
			pointPos = this.pixelMap.getCircularPointsRaw(0,0,this.radius*this.scale[0], (((180/this.objectTape[localObjectCounter].pollyPoints)*localObjectCounter)+this.objectTape[localObjectCounter].motionIncrements[0])%180);
			this.objectTape[localObjectCounter].dimensions = [pointPos[0]*this.scale[1],pointPos[0]*this.scale[2],0];
			this.objectTape[localObjectCounter].shape[0].ellipse( this.objectTape[localObjectCounter].position[0], this.objectTape[localObjectCounter].position[1], this.objectTape[localObjectCounter].dimensions[0]*radiusEnvelop, this.objectTape[localObjectCounter].dimensions[1]*radiusEnvelop, 0, 2*Math.PI, false, 0);
			this.objectTape[localObjectCounter].geometry[0].setFromPoints( this.objectTape[localObjectCounter].shape[0].getPoints(this.sliceAcuracy) );
			this.objectTape[localObjectCounter].objects[0].position.set(0,0, pointPos[1]);
			this.objectTape[localObjectCounter].position[2] = pointPos[1];
		}
		this.envelops.setTimeCode("radiusEnvelop", currentEnvelopIndex+radiusSubEnvelopIncrement);
	}
	insertSphere = function()
	{
		var objectCounter=0, lpCounter=0;
		var pointPos, tempRadius=0, tempCurve;
		var localGroup;
		
		for(objectCounter=0; objectCounter<this.slices; objectCounter++)
		{
			localGroup = new THREE.Object3D();
			this.objectTape.push( new animationObject() );
			this.objectTape[objectCounter].position = [0,0,0];
			pointPos = this.pixelMap.getCircularPointsRaw(0,0,this.radius,(180/this.slices)*objectCounter);
			tempRadius = (this.radius/this.slices)*objectCounter;
			this.objectTape[objectCounter].dimensions = [pointPos[0],pointPos[0],0];
			this.objectTape[objectCounter].pollyPoints = this.slices;
			this.objectTape[objectCounter].motionIncrements[0] = this.sliceStart;
			this.objectTape[objectCounter].shape.push( new THREE.Shape() );
			this.objectTape[objectCounter].shape[0].ellipse( this.objectTape[objectCounter].position[0], this.objectTape[objectCounter].position[1], this.objectTape[objectCounter].dimensions[0], this.objectTape[objectCounter].dimensions[1], 0, 2*Math.PI, false, 0);
			this.objectTape[objectCounter].geometry.push( new THREE.BufferGeometry().setFromPoints( this.objectTape[objectCounter].shape[0].getPoints(this.sliceAcuracy) ) );
			this.objectTape[objectCounter].materials.push( new THREE.LineBasicMaterial({color: 0x0000ff}) );
			this.objectTape[objectCounter].materials[0].transparent = true;
			this.objectTape[objectCounter].materials[0].opacity = this.sliceOpacity;			
			this.colourObject.getColour((this.colourIndex+(20*objectCounter))%this.colourObject._bandWidth);
			this.objectTape[objectCounter].materials[0].color.r = this.colourObject._currentColour[0]/255;
			this.objectTape[objectCounter].materials[0].color.g = this.colourObject._currentColour[1]/255;
			this.objectTape[objectCounter].materials[0].color.b = this.colourObject._currentColour[2]/255;
			this.objectTape[objectCounter].objects.push( new THREE.Line(this.objectTape[objectCounter].geometry[0], this.objectTape[objectCounter].materials[0]) );
			this.objectTape[objectCounter].objects[0].position.set(0,0, pointPos[1]);
			this.objectTape[objectCounter].position[2] = pointPos[1];
			
			if(objectCounter%4==3)
			{
				this.objectTape[objectCounter].objects[0].layers.enable( 1 );
			}
			
			localGroup.add( this.objectTape[objectCounter].objects[0] );
			this.globalGroupArray.push( localGroup );
			this.globalObjectGroup.add( localGroup );
		}
		//insert trails
		for(objectCounter; objectCounter<this.slices*2; objectCounter++)
		{
			localGroup = new THREE.Object3D();
			this.objectTape.push( new animationObject() );
			this.objectTape[objectCounter].position = [0,0,0];
			this.objectTape[objectCounter].pollyPoints = this.trails;
			this.objectTape[objectCounter].motionIncrements = [ Math.random(), Math.random(), 0];
			for(lpCounter=0; lpCounter<this.objectTape[objectCounter].pollyPoints; lpCounter++)
			{
				pointPos = this.objectTape[objectCounter-this.slices].shape[0].getPoint((this.objectTape[objectCounter].motionIncrements[0]+(this.trailSpacing*lpCounter))%1);
				this.objectTape[objectCounter].geometry.push( new THREE.SphereGeometry( 1+(0.01*lpCounter), 10, 10 ) );
				this.objectTape[objectCounter].materials.push( new THREE.MeshLambertMaterial( { color: 0xffffff } ) );
				this.objectTape[objectCounter].materials[lpCounter].transparent = true;
				this.objectTape[objectCounter].materials[lpCounter].opacity = (lpCounter/this.objectTape[objectCounter].pollyPoints);
				this.objectTape[objectCounter].objects.push( new THREE.Mesh( this.objectTape[objectCounter].geometry[lpCounter], this.objectTape[objectCounter].materials[lpCounter] ) );
				this.objectTape[objectCounter].objects[lpCounter].layers.enable( 1 );
				this.objectTape[objectCounter].objects[lpCounter].position.set(pointPos.x, pointPos.y, this.objectTape[objectCounter-this.slices].position[2]);
				localGroup.add( this.objectTape[objectCounter].objects[lpCounter] );
			}
			this.globalGroupArray.push( localGroup );
			this.globalObjectGroup.add( localGroup );
			
		}
		
		//complete set up
		this.globalObjectGroup.position.x =  this.origin[0];
		this.globalObjectGroup.position.y =  this.origin[1];
		this.globalObjectGroup.position.z =  this.origin[2];

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
			this.insertSphere();
		}
	}
}
export default threeLineSphere;