import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class

class threeNovas
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.groupName = "N_";
		this.objectIDIndex = 0;
		this.type = "implosion";								//implosion or explosion
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Action Tracking
		this.maxOrbits = 25;
		this.maxPointsPerOrbit = 90;
		this.pointModulator = this.maxPointsPerOrbit/2;
		this.maxRadius = 50;
		this.rotationVectors = [1,1,1];
		this.defaultMotionIncrements = [0,0,0];
		this.defaultRotationIncrements = [0,0,0];
		this.pulseMaxRadius = this.maxRadius*2;
		this.orbitOrigin = [0,0,0];
		this.createNova = this.maxOrbits;
		this.defaultOrbitInsertionDelay = 10;
		this.defaultFadeDelay = 2000;
		
		//Utility Objects
		this.pixelMap = new pixelMaper(2,2);
		this.screenRange = [100,100,100];
		this.timers = new timerObject();
		this.envelops = new envelopGenerator();
		
		//Colour System
		this.colourIndex = 0;
		this.maxValue = 255;
		this.maxColourDitherSteps = 128;
		this.colourList_1 = [this.maxValue,0,0,this.maxValue,this.maxValue,0, 0,this.maxValue,0, 0,this.maxValue,this.maxValue, 0,0,this.maxValue, this.maxValue,0,this.maxValue, this.maxValue,this.maxValue,this.maxValue];
		this.colourObject = new CCGenerator(this.maxColourDitherSteps, this.colourList_1.length/3, this.colourList_1);
		
		//MIDI
		/*
		this.midiOUT;
		this.keyArray = [48, 52, 55, 60];
		this.keyIndex = 0;
		*/
	}
	init = function(scene, colourIndex)
	{
		this.timers.addTimer("orbitInsertionTimer");
		this.timers.startTimer("orbitInsertionTimer", this.defaultOrbitInsertionDelay);
		this.scene = scene;
		this.colourIndex = colourIndex;
	}
	animate = function(colourIncrement, particleSize)
	{
		var objectCounter, pointCounter, orbitWobble, localPointLocs;
		var vertices;
		var objectName="";
		var tempObjectTape = new Array();
		
		for(objectCounter=0; objectCounter<this.objectTape.length; objectCounter++)
		{
			objectName = this.objectTape[objectCounter].objectID+"";
			if(objectName.search("beam_")==0)
			{
				//Nova BEAM
				//colour
				this.colourObject.getColour(this.objectTape[objectCounter].colourIndex%this.colourObject._bandWidth);
				this.objectTape[objectCounter].materials[0].color.r = this.colourObject._currentColour[0]/255;
				this.objectTape[objectCounter].materials[0].color.g = this.colourObject._currentColour[1]/255;
				this.objectTape[objectCounter].materials[0].color.b = this.colourObject._currentColour[2]/255;
				if(this.objectTape[objectCounter].setUpStatus==0)
				{
					//Increment length untill mouse release
					this.objectTape[objectCounter].dimensions[1] += this.objectTape[objectCounter].motionIncrements[0];
					this.objectTape[objectCounter].objects[0].scale.y = this.objectTape[objectCounter].dimensions[1];
					//complete object once it reaches its max radius
					if(this.objectTape[objectCounter].dimensions[1] > this.objectTape[objectCounter].subRadius)
					{
						this.objectTape[objectCounter].setUpStatus = 1;
					}
				}
				else
				{
					if(this.objectTape[objectCounter].setUpStatus==2)
					{
						if(this.objectTape[objectCounter].dimensions[1]-this.objectTape[objectCounter].motionIncrements[0]>0)
						{
							orbitWobble = this.objectTape[objectCounter].dimensions[1]-=this.objectTape[objectCounter].motionIncrements[0];
							this.objectTape[objectCounter].objects[0].scale.y = this.objectTape[objectCounter].dimensions[1];
							this.objectTape[objectCounter].materials[0].opacity = (orbitWobble/this.objectTape[objectCounter].subRadius);
						}
						else
						{
							this.objectTape[objectCounter].setUpStatus=3;
						}
					}
					else
					{
						orbitWobble = this.objectTape[objectCounter].dimensions[1];
						this.objectTape[objectCounter].objects[0].scale.y = this.objectTape[objectCounter].dimensions[1];
					}
					this.objectTape[objectCounter].pointAngleOffset += this.objectTape[objectCounter].rotations[0];
					this.objectTape[objectCounter].objects[0].rotateX(this.objectTape[objectCounter].rotations[1]);
					this.objectTape[objectCounter].objects[0].rotateY(this.objectTape[objectCounter].rotations[2]);
				}
			}
			else
			{
				//Nova Orbits
				//colour
				this.colourObject.getColour(this.objectTape[objectCounter].colourIndex%this.colourObject._bandWidth);
				this.objectTape[objectCounter].materials[0].color.r = this.colourObject._currentColour[0]/255;
				this.objectTape[objectCounter].materials[0].color.g = this.colourObject._currentColour[1]/255;
				this.objectTape[objectCounter].materials[0].color.b = this.colourObject._currentColour[2]/255;
				//Uncomnet to increment each orbits colour in real time
				//objectTape[objectCounter].colourIndex += MIDISTore.getValue("subColourIncrement");
				//orbit particle size
				this.objectTape[objectCounter].materials[0].size = particleSize;
				if(this.objectTape[objectCounter].setUpStatus==0)
				{
					//Increment radius untill mouse release
					this.objectTape[objectCounter].radius += this.objectTape[objectCounter].motionIncrements[0];
					this.objectTape[objectCounter].pointAngleOffset += this.objectTape[objectCounter].rotations[0];
					vertices = new Array();
					for(pointCounter=0; pointCounter<this.objectTape[objectCounter].pollyPoints; pointCounter++)
					{
						localPointLocs = this.pixelMap.getCircularPointsRaw(0, 0, this.objectTape[objectCounter].radius, this.objectTape[objectCounter].extrude[pointCounter]+this.objectTape[objectCounter].pointAngleOffset);
						vertices.push(localPointLocs[0], localPointLocs[1], 0);
					}
					this.objectTape[objectCounter].geometry[0].setAttribute( 'position', new THREE.Float32BufferAttribute( vertices , 3 ) );
					//complete object once it reaches its max radius
					if(this.objectTape[objectCounter].radius > this.objectTape[objectCounter].subRadius)
					{
						this.objectTape[objectCounter].setUpStatus=1;
					}
				}
				else
				{
					//Implode or explode based on .texture variable "implosion" or "explosion"
					if(this.objectTape[objectCounter].setUpStatus==2 && this.objectTape[objectCounter].texture=="implosion")
					{
						if(this.objectTape[objectCounter].radius-this.objectTape[objectCounter].motionIncrements[0]>0)
						{
							orbitWobble = this.objectTape[objectCounter].radius-=this.objectTape[objectCounter].motionIncrements[0];
							this.objectTape[objectCounter].materials[0].opacity = (orbitWobble/this.objectTape[objectCounter].subRadius);
						}
						else
						{
							this.objectTape[objectCounter].setUpStatus=3;
						}
					}
					else if(this.objectTape[objectCounter].setUpStatus==2 && this.objectTape[objectCounter].texture=="explosion")
					{
						if(this.objectTape[objectCounter].radius+(this.objectTape[objectCounter].motionIncrements[0])<(this.objectTape[objectCounter].subRadius*4))
						{
							//this.objectTape[objectCounter].subRadius * 4
							orbitWobble = this.objectTape[objectCounter].radius+=(this.objectTape[objectCounter].motionIncrements[0]);
							this.objectTape[objectCounter].materials[0].opacity = 1-(orbitWobble/(this.objectTape[objectCounter].subRadius*4));
						}
						else
						{
							this.objectTape[objectCounter].setUpStatus=3;
						}
					}
					else
					{
						orbitWobble = this.objectTape[objectCounter].radius;
					}
					this.objectTape[objectCounter].pointAngleOffset += this.objectTape[objectCounter].rotations[0];
					vertices = new Array();
					for(pointCounter=0; pointCounter<this.objectTape[objectCounter].pollyPoints; pointCounter++)
					{
						localPointLocs = this.pixelMap.getCircularPointsRaw(0, 0, orbitWobble, this.objectTape[objectCounter].extrude[pointCounter]+this.objectTape[objectCounter].pointAngleOffset);
						vertices.push(localPointLocs[0], localPointLocs[1], 0);
					}
					this.objectTape[objectCounter].geometry[0].setAttribute( 'position', new THREE.Float32BufferAttribute( vertices , 3 ) );
					this.objectTape[objectCounter].objects[0].rotateX(this.objectTape[objectCounter].rotations[1]);
					this.objectTape[objectCounter].objects[0].rotateY(this.objectTape[objectCounter].rotations[2]);
				}
			}
		}
		
		//orbit creation
		this.orbitCreationLoop();
		
		//orbit destruction based on orbits group timer
		for(objectCounter=0; objectCounter<this.objectTape.length; objectCounter++)
		{
			if(this.timers.hasTimedOut("orbit_"+this.objectTape[objectCounter].objectID) && this.objectTape[objectCounter].setUpStatus==3)
			{
				//delete timer
				this.timers.deleteTimer("orbit_"+this.objectTape[objectCounter].objectID);
				//remove from scene
				this.scene.remove(this.objectTape[objectCounter].objects[0]);
				this.objectTape[objectCounter].geometry[0].dispose();
				this.objectTape[objectCounter].materials[0].dispose();				
			}
			else if(this.timers.hasTimedOut("orbit_"+this.objectTape[objectCounter].objectID) && this.objectTape[objectCounter].setUpStatus==1)
			{
				this.objectTape[objectCounter].setUpStatus = 2;
				tempObjectTape.push(this.objectTape[objectCounter]);	
			}
			else
			{
				tempObjectTape.push(this.objectTape[objectCounter]);			
			}
		}
		this.objectTape = new Array();
		for(objectCounter=0; objectCounter<tempObjectTape.length; objectCounter++)
		{
			this.objectTape.push(tempObjectTape[objectCounter]);
		}
		
		this.colourIndex+=colourIncrement;		
	}
	addOrbit = function(objectID)
	{
		var pointMod = Math.round(Math.random()*45);
		var currentPoints = this.maxPointsPerOrbit - Math.round(Math.random()*this.pointModulator);
		var pointCounter;
		this.genObject = new animationObject();
		var vertices = new Array();
		var pointLocation;
				
		this.genObject.objectID = objectID;
		this.genObject.position[0] = this.orbitOrigin[0];
		this.genObject.position[1] = this.orbitOrigin[1];
		this.genObject.position[2] = this.orbitOrigin[2];
		this.genObject.radius = 1;
		this.genObject.subRadius = Math.round(Math.random()*this.maxRadius);
		this.genObject.pollyPoints = currentPoints;
		if(this.defaultMotionIncrements[0]==0)
		{
			this.genObject.motionIncrements[0] = (Math.random()*1)+1;
		}
		else
		{
			this.genObject.motionIncrements[0] = this.defaultMotionIncrements[0];
		}
		this.genObject.pointAngleOffset = 0;
		if(this.defaultRotationIncrements[0]==0)
		{
			this.generateRotationVectors();
			this.genObject.rotations[0] = ((Math.random()*2)+0.01)*this.rotationVectors[0];
			this.genObject.rotations[1] = ((Math.random()*((Math.PI/180)*1) )+0.0001)*this.rotationVectors[1];
			this.genObject.rotations[2] = ((Math.random()*((Math.PI/180)*1) )+0.0001)*this.rotationVectors[2];
		}
		else
		{
			this.genObject.rotations[0] = this.defaultRotationIncrements[0];
			this.genObject.rotations[1] = this.defaultRotationIncrements[1];
			this.genObject.rotations[2] = this.defaultRotationIncrements[2];
		}
		this.genObject.colourIndex = this.colourIndex;
		this.genObject.texture = this.type;
		this.genObject.setUpStatus = 0;
		
		for(pointCounter=0; pointCounter<this.genObject.pollyPoints; pointCounter++)
		{
			this.genObject.extrude.push(Math.round(Math.random()*360));
			pointLocation = this.pixelMap.getCircularPointsRaw(0, 0, this.genObject.radius, this.genObject.extrude[pointCounter]);
			vertices.push(pointLocation[0], pointLocation[1], 0);
		}
		this.genObject.geometry.push( new THREE.BufferGeometry() );
		this.genObject.geometry[0].setAttribute( 'position', new THREE.Float32BufferAttribute( vertices , 3 ) );
		this.genObject.materials.push( new THREE.PointsMaterial( { color: 0xffffff, size:.5} ) );
		this.genObject.materials[0].transparent = true;
		this.genObject.materials[0].opacity = 1;
		this.genObject.objects.push( new THREE.Points( this.genObject.geometry[0], this.genObject.materials[0] ) );
		this.genObject.objects[0].position.x = this.genObject.position[0];
		this.genObject.objects[0].position.y = this.genObject.position[1];
		this.genObject.objects[0].position.z = this.genObject.position[2];
		this.scene.add( this.genObject.objects[this.genObject.objects.length-1] );
		this.objectTape.push(this.genObject);
		this.timers.addTimer("orbit_"+this.genObject.objectID);
		this.timers.startTimer("orbit_"+this.genObject.objectID, this.defaultFadeDelay );
	}
	addBeam = function(objectID)
	{
		this.genObject = new animationObject();
		var pointLocation;
		
		this.genObject.objectID = "beam_"+objectID;
		this.genObject.position[0] = this.orbitOrigin[0];
		this.genObject.position[1] = this.orbitOrigin[1];
		this.genObject.position[2] = this.orbitOrigin[2];
		this.genObject.dimensions[0] = 1;
		this.genObject.dimensions[1] = 1;
		this.genObject.dimensions[2] = 1;
		this.genObject.radius = 0.25;
		this.genObject.subRadius = this.maxRadius*3;
		if(this.defaultMotionIncrements[0]==0)
		{
			this.genObject.motionIncrements[0] = (Math.random()*10)+1;
		}
		else
		{
			this.genObject.motionIncrements[0] = this.defaultMotionIncrements[0];
		}
		this.genObject.pointAngleOffset = 0;
		if(this.defaultRotationIncrements[0]==0)
		{
			this.generateRotationVectors();
			this.genObject.rotations[0] = ((Math.random()*2)+0.01)*this.rotationVectors[0];
			this.genObject.rotations[1] = ((Math.random()*((Math.PI/180)*1) )+0.0001)*this.rotationVectors[1];
			this.genObject.rotations[2] = ((Math.random()*((Math.PI/180)*1) )+0.0001)*this.rotationVectors[2];
		}
		else
		{
			this.genObject.rotations[0] = this.defaultRotationIncrements[0];
			this.genObject.rotations[1] = this.defaultRotationIncrements[1];
			this.genObject.rotations[2] = this.defaultRotationIncrements[2];
		}
		this.genObject.colourIndex = this.colourIndex;
		this.genObject.texture = this.type;
		this.genObject.setUpStatus = 0;		
		
		this.genObject.geometry.push( new THREE.CapsuleGeometry( this.genObject.radius, this.genObject.dimensions[1], 12, 24 ) );
		this.genObject.materials.push( new THREE.MeshLambertMaterial( { color: 0xffffff } ) );
		this.genObject.materials[0].transparent = true;
		this.genObject.materials[0].opacity = 1;
		this.genObject.objects.push( new THREE.Mesh( this.genObject.geometry[0], this.genObject.materials[0] ) );
		this.genObject.objects[0].position.x = this.genObject.position[0];
		this.genObject.objects[0].position.y = this.genObject.position[1];
		this.genObject.objects[0].position.z = this.genObject.position[2];
		this.scene.add( this.genObject.objects[0] );
		this.objectTape.push(this.genObject);
		this.timers.addTimer("orbit_"+this.genObject.objectID);
		this.timers.startTimer("orbit_"+this.genObject.objectID, this.defaultFadeDelay );
	}
	generateRotationVectors = function()
	{
		if( Math.round(Math.random()) == 1 ){this.rotationVectors[0]=1;}else{this.rotationVectors[0]=-1;}
		if( Math.round(Math.random()) == 1 ){this.rotationVectors[1]=1;}else{this.rotationVectors[1]=-1;}
		if( Math.round(Math.random()) == 1 ){this.rotationVectors[2]=1;}else{this.rotationVectors[2]=-1;}
	}
	seed = function(orbitOrigin)
	{
		if(orbitOrigin==undefined)
		{
			this.orbitOrigin[0] = (-this.screenRange[0])+Math.round(Math.random()*(this.screenRange[0]*2));
			this.orbitOrigin[1] = (this.screenRange[1])-Math.round(Math.random()*(this.screenRange[1]*2));
			this.orbitOrigin[2] = (-this.screenRange[2])+Math.round(Math.random()*(this.screenRange[2]*2));
		}
		else
		{
			this.orbitOrigin[0] = orbitOrigin[0];
			this.orbitOrigin[1] = orbitOrigin[1];
			this.orbitOrigin[2] = orbitOrigin[2];
		}
		this.createNova = 0;
	}
	orbitCreationLoop = function()
	{
		if(this.createNova<this.maxOrbits)
		{
			if(this.timers.hasTimedOut("orbitInsertionTimer"))
			{
				if(this.createNova==0)
				{
					this.addBeam(this.groupName+this.objectIDIndex);
					/*
					if(this.midiOUT.connection=='open')
					{						
						this.midiOUT.send([144,this.keyArray[this.keyIndex%this.keyArray.length],100]);
						this.midiOUT.send([144,this.keyArray[(this.keyIndex+1)%this.keyArray.length],100]);
						this.midiOUT.send([144,this.keyArray[this.keyIndex%this.keyArray.length],0], window.performance.now()+this.defaultFadeDelay);
						this.midiOUT.send([144,this.keyArray[(this.keyIndex+1)%this.keyArray.length],0], window.performance.now()+this.defaultFadeDelay);
						this.keyIndex++;
					}
					*/						
				}
				else
				{
					this.addOrbit(this.groupName+this.objectIDIndex);
				}
				this.timers.startTimer("orbitInsertionTimer", this.defaultOrbitInsertionDelay);
				this.objectIDIndex++;
				this.createNova++;
			}
		}
	}
}
export default threeNovas;
	