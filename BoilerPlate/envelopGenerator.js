class envelopGenerator
{	
	constructor()
	{
		this.envelopArray = new Array();
		this.numberOfItems=0;
		this.genCounter=0;
		this.timeCounter=0;
		this.currentIndex=0;
		this.timeTracker=0;
	}
	
	add =  function(envelopName, pointArray, durationArray, singleShot)
	{
		this.envelopArray.push([envelopName, pointArray, durationArray, singleShot, 0, 0]);
		//set total number of steps for envelop
		this.currentIndex = this.getEnvelopIndex(envelopName);
		for(this.genCounter=0; this.genCounter<this.envelopArray[this.currentIndex][2].length; this.genCounter++)
		{
			this.envelopArray[this.currentIndex][5]+=this.envelopArray[this.currentIndex][2][this.genCounter];
		}
		//sets the global array counter
		this.numberOfItems = this.envelopArray.length;
	}
	addWithTimeCode =  function(envelopName, pointArray, durationArray, singleShot, timeCodeIndex)
	{
		this.add(envelopName, pointArray, durationArray, singleShot);
		this.setTimeCode(envelopName, timeCodeIndex);
	}
	remove = function(envelopName)
	{
		var envelopIndex = this.getEnvelopIndex(envelopName);
		if(envelopIndex!=-1)
		{
			this.envelopArray.splice(envelopIndex,1);
			this.numberOfItems--;
		}
	}
	getEnvelop = function(envelopName, step, timeIndex)
	{
		this.timeTracker=0;
		var yValue = 0, xValue = 0;
		var distanceBetweenPoints = 0;

		//Find the envelop in the array via its name
		this.currentIndex = this.getEnvelopIndex(envelopName);
		//increment the steps for this envelop if STEP is NOT 0 otherwise use timeIndex
		if(step!=0)
		{
			this.envelopArray[this.currentIndex][4] = (this.envelopArray[this.currentIndex][4]+step)%this.envelopArray[this.currentIndex][5];
		}
		else
		{
			this.envelopArray[this.currentIndex][4] = timeIndex%this.envelopArray[this.currentIndex][5];
		}
		
		for(this.genCounter=0; this.genCounter<this.envelopArray[this.currentIndex][2].length; this.genCounter++)
		{
			//Work out what step range the envelop is in
			if(this.envelopArray[this.currentIndex][4]>=this.timeTracker && this.envelopArray[this.currentIndex][4]<=this.timeTracker+this.envelopArray[this.currentIndex][2][this.genCounter])
			{
				//work out where you are in the current step range
				xValue = (this.envelopArray[this.currentIndex][4]-this.timeTracker) / this.envelopArray[this.currentIndex][2][this.genCounter];
				xValue = xValue*this.envelopArray[this.currentIndex][2][this.genCounter];
				//check envelops gradient
				if(this.genCounter>0)
				{
					//Work out the distance between points use as maxPoints
					distanceBetweenPoints = Math.abs(this.envelopArray[this.currentIndex][1][this.genCounter-1]-this.envelopArray[this.currentIndex][1][this.genCounter]);
					//Previous point is Greater then current, downwards granient
					if(this.envelopArray[this.currentIndex][1][this.genCounter-1]>this.envelopArray[this.currentIndex][1][this.genCounter])
					{
						yValue = this.runPorabola(xValue, distanceBetweenPoints, this.envelopArray[this.currentIndex][2][this.genCounter]);	
						yValue = this.envelopArray[this.currentIndex][1][this.genCounter-1]-yValue;
						return yValue;
					}
					else
					{
						yValue = this.runPorabola(xValue, distanceBetweenPoints, this.envelopArray[this.currentIndex][2][this.genCounter]);
						yValue = this.envelopArray[this.currentIndex][1][this.genCounter-1]+yValue;
						return yValue;
					}
				}
				yValue = this.runPorabola(xValue, this.envelopArray[this.currentIndex][1][this.genCounter], this.envelopArray[this.currentIndex][2][this.genCounter]);	
				return yValue;
			}
			else
			{
				this.timeTracker += this.envelopArray[this.currentIndex][2][this.genCounter];
			}
		}
		return -1;
	}
	getEnvelopNonZeroStart = function(envelopName, step, timeIndex)
	{
		this.timeTracker=0;
		var yValue = 0, xValue = 0;
		var distanceBetweenPoints = 0;

		//Find the envelop in the array via its name
		this.currentIndex = this.getEnvelopIndex(envelopName);
		//increment the steps for this envelop if STEP is NOT 0 otherwise use timeIndex
		if(step!=0)
		{
			this.envelopArray[this.currentIndex][4] = (this.envelopArray[this.currentIndex][4]+step)%this.envelopArray[this.currentIndex][5];
		}
		else
		{
			this.envelopArray[this.currentIndex][4] = timeIndex%this.envelopArray[this.currentIndex][5];
		}
		
		for(this.genCounter=0; this.genCounter<this.envelopArray[this.currentIndex][2].length; this.genCounter++)
		{
			//Work out what step range the envelop is in
			if(this.envelopArray[this.currentIndex][4]>=this.timeTracker && this.envelopArray[this.currentIndex][4]<=this.timeTracker+this.envelopArray[this.currentIndex][2][this.genCounter])
			{
				//work out where you are in the current step range
				xValue = (this.envelopArray[this.currentIndex][4]-this.timeTracker) / this.envelopArray[this.currentIndex][2][this.genCounter];
				xValue = xValue*this.envelopArray[this.currentIndex][2][this.genCounter];
				//check envelops gradient
				if(this.genCounter+1<this.envelopArray[this.currentIndex][2].length)
				{
					//Work out the distance between points use as maxPoints
					distanceBetweenPoints = Math.abs(this.envelopArray[this.currentIndex][1][this.genCounter]-this.envelopArray[this.currentIndex][1][this.genCounter+1]);
					//Previous point is Greater then current, downwards granient
					if(this.envelopArray[this.currentIndex][1][this.genCounter]>this.envelopArray[this.currentIndex][1][this.genCounter+1])
					{
						yValue = this.runPorabola(xValue, distanceBetweenPoints, this.envelopArray[this.currentIndex][2][this.genCounter]);	
						yValue = this.envelopArray[this.currentIndex][1][this.genCounter]-yValue;
						return yValue;
					}
					else
					{
						yValue = this.runPorabola(xValue, distanceBetweenPoints, this.envelopArray[this.currentIndex][2][this.genCounter]);
						yValue = this.envelopArray[this.currentIndex][1][this.genCounter]+yValue;
						return yValue;
					}
				}
				else
				{
					//Work out the distance between points use as maxPoints
					distanceBetweenPoints = Math.abs(this.envelopArray[this.currentIndex][1][this.genCounter]-this.envelopArray[this.currentIndex][1][0]);
					//Previous point is Greater then current, downwards granient
					if(this.envelopArray[this.currentIndex][1][this.genCounter]>this.envelopArray[this.currentIndex][1][0])
					{
						yValue = this.runPorabola(xValue, distanceBetweenPoints, this.envelopArray[this.currentIndex][2][this.genCounter]);	
						yValue = this.envelopArray[this.currentIndex][1][this.genCounter]-yValue;
						return yValue;
					}
					else
					{
						yValue = this.runPorabola(xValue, distanceBetweenPoints, this.envelopArray[this.currentIndex][2][this.genCounter]);
						yValue = this.envelopArray[this.currentIndex][1][this.genCounter]+yValue;
						return yValue;
					}
				}
				return yValue;
			}
			else
			{
				this.timeTracker += this.envelopArray[this.currentIndex][2][this.genCounter];
			}
		}
		return -1;
	}
	setTimeCode = function(envelopName, timeCodeIndex)
	{
		this.currentIndex = this.getEnvelopIndex(envelopName);
		this.envelopArray[this.currentIndex][4] = timeCodeIndex%this.envelopArray[this.currentIndex][5];
	}
	getTimeCode = function(envelopName)
	{
		this.currentIndex = this.getEnvelopIndex(envelopName);
		return this.envelopArray[this.currentIndex][4];
	}
	getTotalRunTime = function(envelopName)
	{
		var totalRunTime=0;
		this.currentIndex = this.getEnvelopIndex(envelopName);
		for(this.genCounter=0; this.genCounter<this.envelopArray[ this.currentIndex ][2].length; this.genCounter++)
		{
			totalRunTime += this.envelopArray[ this.currentIndex ][2][this.genCounter];
		}
		return totalRunTime;
	}
	runPorabola = function(x, maxPoints, maxSteps)
	{
		return (x/(maxSteps/maxPoints))*(x/maxSteps);
	}
	getEnvelopIndex = function(envelopName)
	{
		for(this.genCounter=0; this.genCounter<this.envelopArray.length; this.genCounter++)
		{
			if(this.envelopArray[this.genCounter][0] == envelopName)
			{
				return this.genCounter;
			}
		}
		return -1;
	}
	getEnvelopAsRatio = function(envelopName, step, timeIndex, totalDivident)
	{
		return this.getEnvelop(envelopName, step, timeIndex)/totalDivident;
	}
	getEnvelopNonZeroStartAsRatio = function(envelopName, step, timeIndex, totalDivident)
	{
		return this.getEnvelopNonZeroStart(envelopName, step, timeIndex)/totalDivident;
	}
	getEnvelopNonZeroStartAsRatioSingleShot = function(envelopName, step, timeIndex, totalDivident)
	{
		this.currentIndex = this.getEnvelopIndex(envelopName);
		this.timeCounter = (this.envelopArray[this.currentIndex][4]+step);
		
		if(this.envelopArray[this.currentIndex][3]==1 && this.timeCounter<this.envelopArray[this.currentIndex][5] )
		{
			return this.getEnvelopNonZeroStart(envelopName, step, timeIndex)/totalDivident;
		}
		else
		{
			this.envelopArray[this.currentIndex][3] = 2;
			this.envelopArray[this.currentIndex][4] = 0;
			return this.getEnvelopNonZeroStart(envelopName, 0, this.timeCounter-step)/totalDivident;
			//return -1;
		}
	}
	getEnvelopNonZeroStartAsRatioSingleShot_SINGLE = function(envelopName, step, timeIndex, totalDivident)
	{
		this.currentIndex = this.getEnvelopIndex(envelopName);
		this.timeCounter = (this.envelopArray[this.currentIndex][4]+step);
		
		if(this.envelopArray[this.currentIndex][3]==1 && this.timeCounter<this.envelopArray[this.currentIndex][5]/2 )
		{
			return this.getEnvelopNonZeroStart(envelopName, step, timeIndex)/totalDivident;
		}
		else
		{
			this.envelopArray[this.currentIndex][3] = 2;
			this.envelopArray[this.currentIndex][4] = 0;
			return this.getEnvelopNonZeroStart(envelopName, 0, this.timeCounter-step)/totalDivident;
			//return -1;
		}
	}
	setOneShotState = function(envelopName, state, timeIndex)
	{
		this.currentIndex = this.getEnvelopIndex(envelopName);
		this.envelopArray[this.currentIndex][3] = state;
		this.envelopArray[this.currentIndex][4] = timeIndex;
	}
	getOneShotState = function(envelopName)
	{
		this.currentIndex = this.getEnvelopIndex(envelopName);
		return this.envelopArray[this.currentIndex][3];
	}
}
export default envelopGenerator;