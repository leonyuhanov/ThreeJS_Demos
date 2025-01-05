import * as THREE from 'three';
import envelopGenerator from './envelopGenerator.js';					//Envelop Generator
import CCGenerator from './CCGenerator.js';								//Colour System
import timerObject from './timerObject.js';								//Timers
import pixelMaper from './pixelMaper.js';								//Pixel Maper
import animationObject from './animationObject.js';						//Generic Object Tracking class

class threeOrbitalPulses
{	
	constructor()
	{
		//Main object stores
		this.objectTape = new Array();
		this.groupArray = new Array();
		this.groupName = "OP_";
		this.objectIDIndex = 0;
		this.groupID = 0;
		this.type = "implosion";									//implosion or explosion
		this.genObject = new animationObject();
		
		//Global Three Objects form main System
		this.scene;
		
		//Main properties
		this.pulseCount = 16;										//pusles per orbit count
		this.pointsPerPulse = 30;									//number of points per pulse beam
		this.pulseRange = [40, 1, 1];									
		this.count = 10;												//orbit count
		this.defaultRadius = 1;
		this.maxRadius = 20;
		this.orbitOrigin = [0,0,0];
		this.rotationVectors = [1,1,1];
		this.defaultMotionIncrements = [0,0,0];
		this.rotationIncrements = [1,1,1];
		this.create = this.count;
		this.defaultObjectInsertionDelay = 10;
		this.defaultPulseDelay = 50;
		this.defaultFadeDelay = 3000;
		
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
	}
	
	init = function(scene, colourIndex)
	{
		this.timers.addTimer("orbitInsertionTimer");
		this.timers.startTimer("orbitInsertionTimer", this.defaultObjectInsertionDelay);
		this.scene = scene;
		this.colourIndex = colourIndex;
	}
	
	animate = function(colourIndex, subColourIndex, pointSize)
	{
		
		var objectCounter, subObjectCounter, pointCounter;
		var tempObjectTape = new Array();
		var tempGenObject;
		var pointVector = [0,0];
		var tempRadius = 0, tempX=0, tempZ=0, tempMaxRadius=0, tempPulseAngle=0;
		var vertexArray = new Array();
		
		for(objectCounter=0; objectCounter<this.objectTape.length; objectCounter++)
		{
			//colour * point Size
			for(subObjectCounter=0; subObjectCounter<this.objectTape[objectCounter].objects.length; subObjectCounter++)
			{
				this.colourObject.getColour((this.objectTape[objectCounter].colourIndex+colourIndex+(subColourIndex*subObjectCounter))%this.colourObject._bandWidth);
				this.objectTape[objectCounter].materials[subObjectCounter].color.r = this.colourObject._currentColour[0]/255;
				this.objectTape[objectCounter].materials[subObjectCounter].color.g = this.colourObject._currentColour[1]/255;
				this.objectTape[objectCounter].materials[subObjectCounter].color.b = this.colourObject._currentColour[2]/255;
				this.objectTape[objectCounter].materials[subObjectCounter].size = pointSize;
			}
			if(this.objectTape[objectCounter].setUpStatus==0)
			{
				//grow radius from defaultRadius to maxRadius
				if(this.objectTape[objectCounter].radius<this.objectTape[objectCounter].subRadius)
				{
					this.objectTape[objectCounter].radius += this.objectTape[objectCounter].motionIncrements[0];
					for(subObjectCounter=0; subObjectCounter<this.objectTape[objectCounter].pollyPoints; subObjectCounter++)
					{
							vertexArray = new Array();
							for(pointCounter=0; pointCounter<this.objectTape[objectCounter].subPollyPoints; pointCounter++)
							{
								tempRadius = this.objectTape[objectCounter].extrude[subObjectCounter*pointCounter]+this.objectTape[objectCounter].radius;		
								this.generateRotationVectors();
								tempX = ((Math.random()*this.pulseRange[1])*this.rotationVectors[0]);
								tempZ = ((Math.random()*this.pulseRange[2])*this.rotationVectors[2]);
								tempPulseAngle = this.objectTape[objectCounter].shape[subObjectCounter];	
								pointVector = this.pixelMap.getCircularPointsRaw(tempX, 0, tempRadius, tempPulseAngle);
								vertexArray.push(pointVector[0], pointVector[1], tempZ);							
							}
							this.objectTape[objectCounter].geometry[subObjectCounter].setAttribute( 'position', new THREE.Float32BufferAttribute( vertexArray , 3 ) );
					}
				}
				else
				{
					this.objectTape[objectCounter].setUpStatus = 1;
				}
			}
			else if(this.objectTape[objectCounter].setUpStatus==1)
			{
				//rotation
				for(subObjectCounter=0; subObjectCounter<this.objectTape[objectCounter].objects.length; subObjectCounter++)
				{
					this.objectTape[objectCounter].objects[subObjectCounter].rotateX( this.objectTape[objectCounter].rotations[0]*this.rotationIncrements[0] );
					this.objectTape[objectCounter].objects[subObjectCounter].rotateY( this.objectTape[objectCounter].rotations[1]*this.rotationIncrements[0] );
					this.objectTape[objectCounter].objects[subObjectCounter].rotateZ( this.objectTape[objectCounter].rotations[2]*this.rotationIncrements[0] );
				}
				//point motion based on orbitPulseTimer
				if(this.timers.hasTimedOut("orbitPulseTimer_"+this.objectTape[objectCounter].objectID))
				{
					for(subObjectCounter=0; subObjectCounter<this.objectTape[objectCounter].pollyPoints; subObjectCounter++)
					{
							vertexArray = new Array();
							for(pointCounter=0; pointCounter<this.objectTape[objectCounter].subPollyPoints; pointCounter++)
							{
								tempRadius = this.objectTape[objectCounter].extrude[subObjectCounter*pointCounter]+this.objectTape[objectCounter].radius;		
								this.generateRotationVectors();
								tempX = ((Math.random()*this.pulseRange[1])*this.rotationVectors[0]);
								tempZ = ((Math.random()*this.pulseRange[2])*this.rotationVectors[2]);
								tempPulseAngle = this.objectTape[objectCounter].shape[subObjectCounter];	
								pointVector = this.pixelMap.getCircularPointsRaw(tempX, 0, tempRadius, tempPulseAngle);
								vertexArray.push(pointVector[0], pointVector[1], tempZ);							
							}
							this.objectTape[objectCounter].geometry[subObjectCounter].setAttribute( 'position', new THREE.Float32BufferAttribute( vertexArray , 3 ) );
					}
					this.timers.startTimer("orbitPulseTimer_"+this.objectTape[objectCounter].objectID, this.defaultPulseDelay);
				}
			}
			else if(this.objectTape[objectCounter].setUpStatus==2)
			{
				//shrink untill radius is 0
				if(this.objectTape[objectCounter].texture=="implosion")
				{
					if(this.objectTape[objectCounter].radius-this.objectTape[objectCounter].motionIncrements[1]>0)
					{
						this.objectTape[objectCounter].radius-=this.objectTape[objectCounter].motionIncrements[1];
						for(subObjectCounter=0; subObjectCounter<this.objectTape[objectCounter].pollyPoints; subObjectCounter++)
						{
								vertexArray = new Array();
								for(pointCounter=0; pointCounter<this.objectTape[objectCounter].subPollyPoints; pointCounter++)
								{
									tempRadius = this.objectTape[objectCounter].extrude[subObjectCounter*pointCounter]+this.objectTape[objectCounter].radius;		
									this.generateRotationVectors();
									tempX = ((Math.random()*this.pulseRange[1])*this.rotationVectors[0]);
									tempZ = ((Math.random()*this.pulseRange[2])*this.rotationVectors[2]);
									tempPulseAngle = this.objectTape[objectCounter].shape[subObjectCounter];	
									pointVector = this.pixelMap.getCircularPointsRaw(tempX, 0, tempRadius, tempPulseAngle);
									vertexArray.push(pointVector[0], pointVector[1], tempZ);							
								}
								this.objectTape[objectCounter].geometry[subObjectCounter].setAttribute( 'position', new THREE.Float32BufferAttribute( vertexArray , 3 ) );
								this.objectTape[objectCounter].materials[subObjectCounter].opacity = (this.objectTape[objectCounter].radius/(this.objectTape[objectCounter].subRadius));
						}
					}
					else
					{
						this.objectTape[objectCounter].setUpStatus = 3;
					}
				}
				else if(this.objectTape[objectCounter].texture=="explosion")
				{
					if(this.objectTape[objectCounter].radius+this.objectTape[objectCounter].motionIncrements[1]<(this.objectTape[objectCounter].subRadius*5))
					{
						this.objectTape[objectCounter].radius+=this.objectTape[objectCounter].motionIncrements[1];
						for(subObjectCounter=0; subObjectCounter<this.objectTape[objectCounter].pollyPoints; subObjectCounter++)
						{
								vertexArray = new Array();
								for(pointCounter=0; pointCounter<this.objectTape[objectCounter].subPollyPoints; pointCounter++)
								{
									tempRadius = this.objectTape[objectCounter].extrude[subObjectCounter*pointCounter]+this.objectTape[objectCounter].radius;	
									this.generateRotationVectors();
									tempX = ((Math.random()*this.pulseRange[1])*this.rotationVectors[0]);
									tempZ = ((Math.random()*this.pulseRange[2])*this.rotationVectors[2]);
									tempPulseAngle = this.objectTape[objectCounter].shape[subObjectCounter];
									pointVector = this.pixelMap.getCircularPointsRaw(tempX, 0, tempRadius, tempPulseAngle);
									vertexArray.push(pointVector[0], pointVector[1], tempZ);							
								}
								this.objectTape[objectCounter].geometry[subObjectCounter].setAttribute( 'position', new THREE.Float32BufferAttribute( vertexArray , 3 ) );
								this.objectTape[objectCounter].materials[subObjectCounter].opacity = 1-(this.objectTape[objectCounter].radius/(this.objectTape[objectCounter].subRadius*5));
						}
					}
					else
					{
						this.objectTape[objectCounter].setUpStatus = 3;
					}
				}
				
			}
		}
		
		//clean up if timer expires
		for(objectCounter=0; objectCounter<this.objectTape.length; objectCounter++)
		{
			if( this.timers.hasTimedOut("orbit_"+this.objectTape[objectCounter].objectID) && this.objectTape[objectCounter].setUpStatus==1)
			{
				this.objectTape[objectCounter].setUpStatus = 2;
				tempObjectTape.push(this.objectTape[objectCounter]);
			}
			else if(this.objectTape[objectCounter].setUpStatus==3)
			{
				//delete timer
				this.timers.deleteTimer("orbit_"+this.objectTape[objectCounter].objectID);
				this.timers.deleteTimer("orbitPulseTimer_"+this.objectTape[objectCounter].objectID);
				//delete Envelop
				//remove all objects from scene
				for(subObjectCounter=0; subObjectCounter<this.objectTape[objectCounter].objects.length; subObjectCounter++)
				{
					this.scene.remove(this.objectTape[objectCounter].objects[subObjectCounter]);
					this.objectTape[objectCounter].geometry[subObjectCounter].dispose();
					this.objectTape[objectCounter].materials[subObjectCounter].dispose();
				}
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
		//creation loop
		this.orbitCreationLoop(colourIndex);
	}
	addSlice = function(objectID, colourIndex)
	{
		var pulseCounter=0, pointCounter=0;
		var pointVector = [0,0];
		var tempRadius = 0, tempX=0, tempZ=0, tempMaxRadius=0, tempPulseAngle=0;
		var vertexArray = new Array();
		this.genObject = new animationObject();
				
		this.genObject.objectID = objectID;
		this.genObject.canvasObject = this.groupID;
		this.genObject.position[0] = this.orbitOrigin[0];
		this.genObject.position[1] = this.orbitOrigin[1];
		this.genObject.position[2] = this.orbitOrigin[2];
		this.genObject.radius = this.defaultRadius;
		this.genObject.subRadius = this.groupArray[ this.groupIndex( this.genObject.canvasObject ) ][1];
		this.genObject.pollyPoints = this.pulseCount;
		this.genObject.subPollyPoints = this.pointsPerPulse;
		if(this.defaultMotionIncrements[0]==0)
		{
			this.genObject.motionIncrements[0] = (Math.random()*0.5)+1;							//Grow Rate
			this.genObject.motionIncrements[1] = this.genObject.motionIncrements[0]*5;			//dispose Rate		
		}
		else
		{
			this.genObject.motionIncrements[0] = this.defaultMotionIncrements[0];							//Grow Rate
			this.genObject.motionIncrements[1] = this.defaultMotionIncrements[1];			//dispose Rate		
		}
		this.generateRotationVectors();
		this.genObject.rotations[0] = ((Math.random()*((Math.PI/180)*1) )+0.0001)*this.rotationVectors[0];
		this.genObject.rotations[1] = ((Math.random()*((Math.PI/180)*1) )+0.0001)*this.rotationVectors[1];
		this.genObject.rotations[2] = ((Math.random()*((Math.PI/180)*1) )+0.0001)*this.rotationVectors[2];
		this.genObject.colourIndex = colourIndex;
		this.genObject.texture = this.type;
		this.genObject.setUpStatus = 0;

	
		for(pulseCounter=0; pulseCounter<this.pulseCount; pulseCounter++)
		{
			vertexArray = new Array();
			tempMaxRadius = Math.random()*this.pulseRange[0];
			tempPulseAngle = Math.round(Math.random()*360);
			this.genObject.shape.push( tempPulseAngle );
			for(pointCounter=0; pointCounter<this.pointsPerPulse; pointCounter++)
			{
				tempRadius = (Math.random()*tempMaxRadius);
				this.genObject.extrude.push( tempRadius );
				this.generateRotationVectors();
				tempX = ((Math.random()*this.pulseRange[1])*this.rotationVectors[0]);
				tempZ = ((Math.random()*this.pulseRange[2])*this.rotationVectors[2]);
				//this.genObject.shape.push( tempPulseAngle );
				pointVector = this.pixelMap.getCircularPointsRaw(tempX, 0, tempRadius+this.genObject.radius, tempPulseAngle);
				vertexArray.push(pointVector[0], pointVector[1], tempZ);
			}
			this.genObject.geometry.push( new THREE.BufferGeometry() );
			this.genObject.geometry[pulseCounter].setAttribute( 'position', new THREE.Float32BufferAttribute( vertexArray , 3 ) );
			this.genObject.materials.push( new THREE.PointsMaterial( { color: 0xffffff, size:1} ) );
			this.genObject.materials[pulseCounter].transparent = true;
			this.genObject.materials[pulseCounter].opacity = 1;
			this.genObject.objects.push( new THREE.Points( this.genObject.geometry[pulseCounter], this.genObject.materials[pulseCounter] ) );
			this.genObject.objects[pulseCounter].position.x = this.genObject.position[0];
			this.genObject.objects[pulseCounter].position.y = this.genObject.position[1];
			this.genObject.objects[pulseCounter].position.z = this.genObject.position[2];
			this.scene.add( this.genObject.objects[this.genObject.objects.length-1] );
		}
		this.objectTape.push(this.genObject);
		this.timers.addTimer("orbit_"+this.genObject.objectID);
		this.timers.startTimer("orbit_"+this.genObject.objectID, this.defaultFadeDelay );
		this.timers.addTimer("orbitPulseTimer_"+this.genObject.objectID);
		this.timers.startTimer("orbitPulseTimer_"+this.genObject.objectID, this.defaultPulseDelay );
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
		this.create = 0;
	}
	orbitCreationLoop = function(colourIncrement)
	{
		if(this.create<this.count)
		{
			if(this.timers.hasTimedOut("orbitInsertionTimer"))
			{
				if(this.create==0)
				{
					this.groupArray.push([this.groupID, this.maxRadius]);
				}
				this.addSlice(this.groupName+this.objectIDIndex, colourIncrement);
				this.timers.startTimer("orbitInsertionTimer", this.defaultObjectInsertionDelay);
				this.objectIDIndex++;
				this.create++;
				if(this.create==this.count)
				{
					this.groupID++;
				}
			}
		}
	}
	groupIndex = function(groupID)
	{
		var gIndex=0;
		for(gIndex=0; gIndex<this.groupArray.length; gIndex++)
		{
			if(this.groupArray[gIndex][0]==groupID)
			{
				return gIndex;
			}
		}
	}
}
export default threeOrbitalPulses;