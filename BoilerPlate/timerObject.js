class timerObject
{	
	constructor()
	{
		this.timerArray = new Array();
		this.numberOfItems=0;
		this.timerCounter=0;
		this.currentTimer=-1;
	}
	
	addTimer =  function(timerName)
	{
		this.timerArray.push([timerName,0,0,0]);
		this.numberOfItems = this.timerArray.length;
	}
	deleteTimer = function(timerName)
	{
		this.timerArray.splice(this.getTimerIndex(timerName),1);
		this.numberOfItems--;
	}
	startTimer =  function(timerName, timeOut)
	{
		this.currentTimer = this.getTimerIndex(timerName);
		if(this.currentTimer!=-1)
		{
			this.timerArray[this.currentTimer][3] = timeOut;
			this.timerArray[this.currentTimer][1] = Date.now();
		}
	}
	
	hasTimedOut = function(timerName)
	{
		this.currentTimer = this.getTimerIndex(timerName);
		if(this.currentTimer!=-1)
		{
			this.timerArray[this.currentTimer][2] = Date.now();
			if(this.timerArray[this.currentTimer][2]-this.timerArray[this.currentTimer][1]>this.timerArray[this.currentTimer][3])
			{
				return 1;
			}
			else
			{
				return 0;
			}
		}
		else
		{
			console.log("Timer not found!");
			return -1;
		}
	}
	
	getLastTimeout = function(timerName)
	{
		this.currentTimer = this.getTimerIndex(timerName);
		if(this.currentTimer!=-1)
		{
			return this.timerArray[this.currentTimer][3];
		}
		return -1;
	}
	
	getTimerIndex = function(timerName)
	{
		for(this.timerCounter=0; this.timerCounter<this.numberOfItems; this.timerCounter++)
		{
			if(this.timerArray[this.timerCounter][0] == timerName)
			{
				return this.timerCounter;
			}
		}
		return -1;
	}
}
export default timerObject;