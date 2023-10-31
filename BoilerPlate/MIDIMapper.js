class MIDIMapper
{	
	constructor()
	{
		this.midiMapArray = new Array();
		this.numberOfItems=0;
		this.innerCounter=0;
		this.lastKeyHit=0;
		this.lastKeyReleased=0;
		this.midiKeyRange = [48,84];
	}
	addItem =  function(MIDIChan, CCID, controlName, scaleToValue)
	{
		this.midiMapArray.push([MIDIChan, CCID, controlName, 0, 0, scaleToValue, new Array(), 0])
		this.numberOfItems = this.midiMapArray.length;
	}
	changeScaleToValue = function(controlName, scaleToValue)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][5] = scaleToValue;
			}
		}
	}
	scaleTo = function(value, scaleTo)
	{
		return (value/127)*scaleTo;
	}
	onMidiEvent = function(midiData)
	{
		//Hadnle Midi Keys
		this.handleKeys(midiData.data[0], midiData.data[1], midiData.data[2]);
		//Handle all other stored controlls
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(midiData.data[0] == this.midiMapArray[this.innerCounter][0] && midiData.data[1] == this.midiMapArray[this.innerCounter][1])
			{
				//Actual midi value 0-127
				this.midiMapArray[this.innerCounter][3] = midiData.data[2];
				//scaled value for application use
				this.midiMapArray[this.innerCounter][4] = this.scaleTo( midiData.data[2], this.midiMapArray[this.innerCounter][5] );
				this.midiMapArray[this.innerCounter][7] = 1;
				//console.log(this.midiMapArray[this.innerCounter][2]+"->"+this.midiMapArray[this.innerCounter][3]+" "+this.midiMapArray[this.innerCounter][4]);
				return;
			}
		}
	}
	hasChanged = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				if(this.midiMapArray[this.innerCounter][7]==1)
				{
					return 1;
				}
				else
				{
					return 0;
				}
			}
		}
	}
	setMultiValues = function(controlName, valueArray)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				console.log(valueArray);
				this.midiMapArray[this.innerCounter][6] = valueArray;
				//set flag indicating value has changed
				this.midiMapArray[this.innerCounter][7] = 1;
			}
		}
	}
	setValue = function(controlName, value)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				//Scaled value used by the application
				this.midiMapArray[this.innerCounter][4] = value;
				//Midi value 0-127 from the above scaled value
				this.midiMapArray[this.innerCounter][3] = value*127;
				this.midiMapArray[this.innerCounter][7] = 1;
				console.log("\tSet ["+controlName+"] to ["+this.midiMapArray[this.innerCounter][4]+"]");
				return;
			}
		}
	}
	setMidiValue = function(controlName, value)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][3] = value;
				this.midiMapArray[this.innerCounter][4] = this.scaleTo( value, this.midiMapArray[this.innerCounter][5] );
				this.midiMapArray[this.innerCounter][7] = 1;
				console.log("\tSet ["+controlName+"] to ["+this.midiMapArray[this.innerCounter][4]+"]");
				return;
			}
		}
	}
	getValue = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][7] = 0;
				return this.midiMapArray[this.innerCounter][4];
			}
		}
	}
	getValueArray = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][7] = 0;
				return this.midiMapArray[this.innerCounter][6];
			}
		}
	}
	getValueRounded = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][7] = 0;
				return Math.round(this.midiMapArray[this.innerCounter][4]);
			}
		}
	}
	getScaleToValue = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][7] = 0;
				return this.midiMapArray[this.innerCounter][5];
			}
		}
	}
	handleKeys = function(midiID, ccID, velocity)
	{
		if(ccID>=this.midiKeyRange[0] && ccID<=this.midiKeyRange[1])
		{
			if(midiID==144)
			{
				this.lastKeyHit = ccID;
			}
			else if (midiID==128)
			{
				this.lastKeyReleased = ccID;
			}
		}
	}
}
export default MIDIMapper;