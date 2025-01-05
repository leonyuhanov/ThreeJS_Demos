//import MIDIMapper from './BoilerPlate/MIDIMapper.js';
class animationQue
{	
	constructor()
	{
		this._animationList = new Array();
		this._functions = new Array();
		this._colourList = Array();
		this._controlList = new Array();
		this._envelopList = new Array()
		this._timerList = new Array();
		this._variableList = new Array();
		this._animationConrolAssign = new Array();
		
		//Public Counters
		this._animationCount = 0;
		this._currentAnimation = 0;
		this._previousAnimation = 0;
		this._colourObject;
		this._change = 0;
		
		//Private Counters
		this._indexCounter = 0;
		this._currenAnimationIndex = 0;
		this._currentControlIndex = 0;
		this._currentEnvelopIndex = 0;
		this._currentTimerIndex = 0;
		this._currentVariableIndex = 0;
		this._currentColourIndex = 0;
		this._currentFunctionIndex = 0;
	}
	
	//Insertion functions
	addAnimation = function(animationName, runTime, animationType)
	{
		this._animationList.push([animationName,[0,0,runTime], animationType]);
		this._animationCount = this._animationList.length;
	}
	addFunctions = function(animationName, setupFunction, cleanUpFunction, animationFunction)
	{
		var functionList = new animationQueFunctions(setupFunction, cleanUpFunction, animationFunction);
		this._functions.push([animationName, functionList]);
	}
	addColourSystem = function(animationName, colourObject)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		this._colourList.push([this._currenAnimationIndex, colourObject]);
	}
	addControl = function(animationName, MIDIChan, CCID, controlName, scaleToValue, initialValue, scaleFromValue=0)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		if(this._currenAnimationIndex!=-1)
		{
			this._controlList.push([this._currenAnimationIndex, MIDIChan, CCID, controlName, scaleToValue, initialValue, scaleFromValue]);
		}
	}
	//for asigining MIDI buttons to launch bookmarked animations
	assignAnimationControl = function(animationName, controlName)
	{
		this._animationConrolAssign.push([animationName, controlName]);
	}
	addEnvelop = function(animationName, envelopName, pointArray, durationArray, singleShot, timeCodeIndex)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		if(this._currenAnimationIndex!=-1)
		{
			this._envelopList.push([this._currenAnimationIndex, envelopName, pointArray, durationArray, singleShot, timeCodeIndex]);
		}
	}
	addTimer = function(animationName, timerName, timeOut, startNow)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		if(this._currenAnimationIndex!=-1)
		{
			this._timerList.push([this._currenAnimationIndex, timerName, timeOut, startNow]);
		}
	}
	addVar = function(animationName, varName, varValue)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		if(this._currenAnimationIndex!=-1)
		{
			this._variableList.push([this._currenAnimationIndex,varName,varValue]);
		}
	}
	
	//Deletion Functions
	removeAnimation = function(animationName)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		if(this._currenAnimationIndex!=-1)
		{
			this._animationList.splice(this._currenAnimationIndex,1);
			this._animationCount--;
		}
	}
	removeControl = function(animationName, controlName)
	{
		this._currentControlIndex = this.findControlIndex(animationName, controlName);
		if(this._currentControlIndex!=-1)
		{
			this._controlList.splice(this._currentControlIndex,1);
		}
	}
	removeEnvelop = function(animationName, envelopName)
	{
		this._currentEnvelopIndex = this.findEnvelopIndex(animationName, envelopName);
		if(this._currentEnvelopIndex!=-1)
		{
			this._envelopList.splice(this._currentEnvelopIndex,1);
		}
	}
	removeTimer = function(animationName, timerName)
	{
		this._currentTimerIndex = this.findTimerIndex(animationName, timerName);
		if(this._currentTimerIndex!=-1)
		{
			this._timerList.splice(this._currentTimerIndex,1);
		}
	}
	removeVar = function(animationName, varName)
	{
		this._currentVariableIndex = this.findVariableIndex(animationName, varName);
		if(this._currentVariableIndex!=-1)
		{
			this._variableList.splice(this._currentVariableIndex, 1);
		}
	}
	
	
	//Timing system
	startTimer =  function(animationName, timeOut)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		if(this._currenAnimationIndex!=-1)
		{
			if(timeOut!=0)
			{
				this._animationList[this._currenAnimationIndex][1][2] = timeOut;
				this._animationList[this._currenAnimationIndex][1][0] = Date.now();
			}
			else
			{
				this._animationList[this._currenAnimationIndex][1][0] = Date.now();
			}
		}
	}
	hasTimedOut = function(animationName)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		if(this._currenAnimationIndex!=-1)
		{
			this._animationList[this._currenAnimationIndex][1][1] = Date.now();
			if(this._animationList[this._currenAnimationIndex][1][1]-this._animationList[this._currenAnimationIndex][1][0]>this._animationList[this._currenAnimationIndex][1][2])
			{
				return 1;
			}
			else
			{
				return 0;
			}
		}
	}
	
	//Finders
	findAnimationIndex = function(animationName)
	{
		for(this._indexCounter=0; this._indexCounter<this._animationCount; this._indexCounter++)
		{
			if(this._animationList[this._indexCounter][0]==animationName)
			{
				return this._indexCounter;
			}
		}
		return -1;
	}
	findControlIndex = function(animationName, controlName)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		for(this._indexCounter=0; this._indexCounter<this._controlList.length; this._indexCounter++)
		{
			if(this._controlList[this._indexCounter][0]==this._currenAnimationIndex && this._controlList[this._indexCounter][3]==controlName)
			{
				return this._indexCounter;
			}
		}
		return -1;
	}
	findEnvelopIndex = function(animationName, envelopName)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		for(this._indexCounter=0; this._indexCounter<this._envelopList.length; this._indexCounter++)
		{
			if(this._envelopList[this._indexCounter][0]==this._currenAnimationIndex && this._envelopList[this._indexCounter][1]==envelopName)
			{
				return this._indexCounter;
			}
		}
		return -1;
	}
	findTimerIndex = function(animationName, timerName)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		for(this._currentTimerIndex=0; this._currentTimerIndex<this._timerList.length; this._currentTimerIndex++)
		{
			if(this._timerList[this._currentTimerIndex][0]==this._currenAnimationIndex && this._timerList[this._currentTimerIndex][1]==timerName)
			{
				return this._currentTimerIndex;
			}
		}
	}
	findVariableIndex = function(animationName, varName)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		for(this._currentVariableIndex=0; this._currentVariableIndex<this._variableList.length; this._currentVariableIndex++)
		{
			if(this._variableList[this._currentVariableIndex][0]==this._currenAnimationIndex && this._variableList[this._currentVariableIndex][1]==varName)
			{
				return this._currentVariableIndex;
			}
		}
		return -1;
	}
	//getters
	
	getVarVValue = function(varName)
	{
		var tempVarIndex = this.findVariableIndex(this.getAnimationName(this._currentAnimation),varName);
		if(tempVarIndex!=-1)
		{
			return this._variableList[tempVarIndex][2];
		}
		else
		{
			console.log("["+varName+"] was not found in this animation!");
		}
	}
	getVarValue = function(animationName, varName)
	{
		return this._variableList[this.findVariableIndex(animationName,varName)][2];
	}

	setVarValue = function(animationName, varName, varValue)
	{
		this._currentVariableIndex = this.findVariableIndex(animationName,varName);
		if(this._currentVariableIndex!=-1)
		{
			this._variableList[this._currentVariableIndex][2] = varValue;
		}
		else
		{
			console.log("["+varName+"] was not found in this animation!");
		}
	} 
	
	setVarValue = function(varName, varValue)
	{
		var tempVarIndex = this.findVariableIndex(this.getAnimationName(this._currentAnimation),varName);
		if(tempVarIndex!=-1)
		{
			this._variableList[tempVarIndex][2] = varValue;
		}
		else
		{
			console.log("["+varName+"] was not found in this animation!");
		}
	} 
	
	getAnimationName = function(animationIndex)
	{
		return this._animationList[animationIndex][0];
	}
	getFunctions = function(animationIndex)
	{
		var currentAnimationName = this.getAnimationName(animationIndex);
		for(this._currentFunctionIndex=0; this._currentFunctionIndex<this._functions.length; this._currentFunctionIndex++)
		{
			if(this._functions[this._currentFunctionIndex][0]==currentAnimationName)
			{
				return this._functions[this._currentFunctionIndex][1];
			}
		}
		return null;
	}
	
	//control setup
	setUpControls = function(animationName, midiSystem)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		if(this._currenAnimationIndex!=-1)
		{
			for(this._currentControlIndex=0; this._currentControlIndex<this._controlList.length; this._currentControlIndex++)
			{
				if(this._controlList[this._currentControlIndex][0]==this._currenAnimationIndex)
				{
					midiSystem.addItem(this._controlList[this._currentControlIndex][1],this._controlList[this._currentControlIndex][2],this._controlList[this._currentControlIndex][3], this._controlList[this._currentControlIndex][4], this._controlList[this._currentControlIndex][5], this._controlList[this._currentControlIndex][6]);
				}
			}
		}
	}
	clearControls = function(animationName, midiSystem)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		if(this._currenAnimationIndex!=-1)
		{
			for(this._currentControlIndex=0; this._currentControlIndex<this._controlList.length; this._currentControlIndex++)
			{
				if(this._controlList[this._currentControlIndex][0]==this._currenAnimationIndex)
				{
					midiSystem.deleteItem(this._controlList[this._currentControlIndex][3]);
				}
			}
		}
	}
	//envelop set up
	setUpEnvelops = function(animationName, envelopSystem)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		if(this._currenAnimationIndex!=-1)
		{
			for(this._currentEnvelopIndex=0; this._currentEnvelopIndex<this._envelopList.length; this._currentEnvelopIndex++)
			{
				if(this._envelopList[this._currentEnvelopIndex][0]==this._currenAnimationIndex)
				{
					envelopSystem.addWithTimeCode(this._envelopList[this._currentEnvelopIndex][1], this._envelopList[this._currentEnvelopIndex][2], this._envelopList[this._currentEnvelopIndex][3], this._envelopList[this._currentEnvelopIndex][4], this._envelopList[this._currentEnvelopIndex][5]); 
				}
			}
		}
	}
	clearEnvelops = function(animationName, envelopSystem)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		if(this._currenAnimationIndex!=-1)
		{
			for(this._currentEnvelopIndex=0; this._currentEnvelopIndex<this._envelopList.length; this._currentEnvelopIndex++)
			{
				if(this._envelopList[this._currentEnvelopIndex][0]==this._currenAnimationIndex)
				{
					envelopSystem.remove(this._envelopList[this._currentEnvelopIndex][1]);
				}
			}
		}
	}
	//timer set up
	setUpTimers = function(animationName, timerSystem)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		if(this._currenAnimationIndex!=-1)
		{
			for(this._currentTimerIndex=0; this._currentTimerIndex<this._timerList.length; this._currentTimerIndex++)
			{
				if(this._timerList[this._currentTimerIndex][0]==this._currenAnimationIndex)
				{
					timerSystem.addTimer(this._timerList[this._currentTimerIndex][1]);
					if(this._timerList[this._currentTimerIndex][3]==1)
					{
						timerSystem.startTimer(this._timerList[this._currentTimerIndex][1], this._timerList[this._currentTimerIndex][2]);
					}
				}
			}
		}
	}
	clearTimers = function(animationName, timerSystem)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		if(this._currenAnimationIndex!=-1)
		{
			for(this._currentTimerIndex=0; this._currentTimerIndex<this._timerList.length; this._currentTimerIndex++)
			{
				timerSystem.deleteTimer(this._timerList[this._currentTimerIndex][1]);
			}
		}
	}
	setCurrentColourObject = function(animationName)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		if(this._currenAnimationIndex!=-1)
		{
			for(this._currentColourIndex=0; this._currentColourIndex<this._colourList.length; this._currentColourIndex++)
			{
				if(this._colourList[this._currentColourIndex][0]==this._currenAnimationIndex)
				{
					this._colourObject = this._colourList[this._currentColourIndex][1];
					return;
				}
			}
		}
	}
	getCurrentColourObject = function(animationName)
	{
		this._currenAnimationIndex  = this.findAnimationIndex(animationName);
		if(this._currenAnimationIndex!=-1)
		{
			for(this._currentColourIndex=0; this._currentColourIndex<this._colourList.length; this._currentColourIndex++)
			{
				if(this._colourList[this._currentColourIndex][0]==this._currenAnimationIndex)
				{
					return this._colourList[this._currentColourIndex][1];
				}
			}
		}
		return -1;
	}
	getCurrentColourObject = function()
	{
		this._currenAnimationIndex  = this._currentAnimation;
		if(this._currenAnimationIndex!=-1)
		{
			for(this._currentColourIndex=0; this._currentColourIndex<this._colourList.length; this._currentColourIndex++)
			{
				if(this._colourList[this._currentColourIndex][0]==this._currenAnimationIndex)
				{
					return this._colourList[this._currentColourIndex][1];
				}
			}
		}
		return -1;
	}
	
	//animation switching
	next = function()
	{
		this._previousAnimation = this._currentAnimation;
		this._currentAnimation = (this._currentAnimation+1)%this._animationCount;
		//set up colour system
		this.setCurrentColourObject(this._animationList[this._currentAnimation][0]);
		this._change = 1;
	}
	previous = function()
	{
		this._previousAnimation = this._currentAnimation;
		if(this._currentAnimation==0)
		{
			this._currentAnimation=this._animationCount-1;
		}
		else
		{
			this._currentAnimation--;
		}
		//set up colour system
		this.setCurrentColourObject(this._animationList[this._currentAnimation][0]);
		this._change = 1;
	}
	gotoAnimation = function(index)
	{
		this._previousAnimation = this._currentAnimation;
		this._currentAnimation = index%this._animationCount;
		//set up colour system
		this.setCurrentColourObject(this._animationList[this._currentAnimation][0]);
		this._change = 1;
	}
	gotoAnimationByName = function(animationName)
	{
		var animCounter = 0;
		for(animCounter=0; animCounter<this._animationList.length; animCounter++)
		{
			if(this._animationList[animCounter][0]==animationName)
			{
				this._previousAnimation = this._currentAnimation;
				this._currentAnimation = animCounter;
				this.setCurrentColourObject(this._animationList[this._currentAnimation][0]);
				this._change = 1;
				console.log("\tJumped to["+animationName+"]@["+animCounter+"]");
				return;
			}
		}
	}
	checkAnimationConrolBookmarks = function(midiSystem)
	{
		var controlCounter=0;
		for(controlCounter=0; controlCounter<this._animationConrolAssign.length; controlCounter++)
		{
			if(midiSystem.hasChanged(this._animationConrolAssign[controlCounter][1]))
			{
				if(midiSystem.getValue(this._animationConrolAssign[controlCounter][1])==1)
				{
					this.gotoAnimationByName(this._animationConrolAssign[controlCounter][0]);
					return;
				}
			}
		}
	}
}
class animationQueFunctions
{
	constructor(setupFunction, cleanUpFunction, animationFunction)
	{
		this.setupFunction = setupFunction;
		this.cleanUpFunction = cleanUpFunction;
		this.animationFunction = animationFunction;
	}
}
export default animationQue;