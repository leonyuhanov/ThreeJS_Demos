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
		this.midiNoteArray = [[21,'A',0],[22,'A#',0],[23,'B',0],[24,'C',1],[25,'C#',1],[26,'D',1],[27,'D#',1],[28,'E',1],[29,'F',1],[30,'F#',1],[31,'G',1],[32,'G#',1],[33,'A',1],[34,'A#',1],[35,'B',1],[36,'C',2],[37,'C#',2],[38,'D',2],[39,'D#',2],[40,'E',2],[41,'F',2],[42,'F#',2],[43,'G',2],[44,'G#',2],[45,'A',2],[46,'A#',2],[47,'B',2],[48,'C',3],[49,'C#',3],[50,'D',3],[51,'D#',3],[52,'E',3],[53,'F',3],[54,'F#',3],[55,'G',3],[56,'G#',3],[57,'A',3],[58,'A#',3],[59,'B',3],[60,'C',4],[61,'C#',4],[62,'D',4],[63,'D#',4],[64,'E',4],[65,'F',4],[66,'F#',4],[67,'G',4],[68,'G#',4],[69,'A',4],[70,'A#',4],[71,'B',4],[72,'C',5],[73,'C#',5],[74,'D',5],[75,'D#',5],[76,'E',5],[77,'F',5],[78,'F#',5],[79,'G',5],[80,'G#',5],[81,'A',5],[82,'A#',5],[83,'B',5],[84,'C',6],[85,'C#',6],[86,'D',6],[87,'D#',6],[88,'E',6],[89,'F',6],[90,'F#',6],[91,'G',6],[92,'G#',6],[93,'A',6],[94,'A#',6],[95,'B',6],[96,'C',7],[97,'C#',7],[98,'D',7],[99,'D#',7],[100,'E',7],[101,'F',7],[102,'F#',7],[103,'G',7],[104,'G#',7],[105,'A',7],[106,'A#',7],[107,'B',7],[108,'C',8]];
		this.chordOffests = [[0,4,9,12],[0,5,9,12]];
		this.keyCounter = 0;
	}
	addItem =  function(MIDIChan, CCID, controlName, scaleToValue, scaleFromValue=0)
	{
		this.midiMapArray.push([MIDIChan, CCID, controlName, 0, 0, scaleToValue, new Array(), 0, 0, scaleFromValue])
		this.numberOfItems = this.midiMapArray.length;
	}
	addItem =  function(MIDIChan, CCID, controlName, scaleToValue, initialValue, scaleFromValue=0)
	{
		this.midiMapArray.push([MIDIChan, CCID, controlName, 0, 0, scaleToValue, new Array(), 0, 0, scaleFromValue])
		this.numberOfItems = this.midiMapArray.length;
		this.setValue(controlName, initialValue);
	}
	addItemKEY =  function(MIDIChan, CCID, controlName, scaleToValue, initialValue)
	{
		this.midiMapArray.push([MIDIChan, CCID, controlName, 0, 0, scaleToValue, new Array(), 0, 1, 0])
		this.numberOfItems = this.midiMapArray.length;
		this.setValue(controlName, initialValue);
	}
	deleteItem = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray.splice(this.innerCounter, 1);
				this.numberOfItems--;
				return;
			}
		}
	}
	changeScaleToValue = function(controlName, scaleToValue, scaleFromValue=0)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][5] = scaleToValue;
				this.midiMapArray[this.innerCounter][9] = scaleFromValue;
			}
		}
	}
	scaleTo = function(value, scaleTo)
	{
		return (value/127)*scaleTo;
	}
	onMidiEvent = function(midiData)
	{
		//Handle Midi Keys
		//this.handleKeys(midiData.data[0], midiData.data[1], midiData.data[2]);
		if(this.handleKeysAsControls(midiData.data[0], midiData.data[1])==1)
		{
			return;
		}
		//Handle all other stored controlls
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(midiData.data[0] == this.midiMapArray[this.innerCounter][0] && midiData.data[1] == this.midiMapArray[this.innerCounter][1])
			{
				//Actual midi value 0-127
				this.midiMapArray[this.innerCounter][3] = midiData.data[2];
				//scaled value for application use
				this.midiMapArray[this.innerCounter][4] = this.scaleTo( midiData.data[2], this.midiMapArray[this.innerCounter][5]-this.midiMapArray[this.innerCounter][9] ) + this.midiMapArray[this.innerCounter][9];
				this.midiMapArray[this.innerCounter][7] = 1;
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
	setChanged = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				this.midiMapArray[this.innerCounter][7]=1;
			}
		}
	}
	setMultiValues = function(controlName, valueArray)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
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
	checkValue = function(controlName)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][2]==controlName)
			{
				return this.midiMapArray[this.innerCounter][4];
			}
		}
	}
	getValueFromCCID = function(CCID, changeFlag)
	{
		if(changeFlag==null){changeFlag=0;}
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][1]==CCID)
			{
				this.midiMapArray[this.innerCounter][7] = changeFlag;
				return this.midiMapArray[this.innerCounter][4];
			}
		}
		return null;
	}
	getValueFromCCID = function(MIDIChanel, CCID, changeFlag)
	{
		if(changeFlag==null){changeFlag=0;}
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][0]==MIDIChanel && this.midiMapArray[this.innerCounter][1]==CCID)
			{
				this.midiMapArray[this.innerCounter][7] = changeFlag;
				return this.midiMapArray[this.innerCounter][4];
			}
		}
		return null;
	}
	getNameFromCCID = function(CCID)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][1]==CCID)
			{
				return this.midiMapArray[this.innerCounter][2];
			}
		}
		return -1;
	}
	getNameFromCCID = function(MIDIChanel, CCID)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][0]==MIDIChanel && this.midiMapArray[this.innerCounter][1]==CCID)
			{
				return this.midiMapArray[this.innerCounter][2];
			}
		}
		return -1;
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
	findControlIndex = function(midiID, ccID)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][0]==midiID && this.midiMapArray[this.innerCounter][1]==ccID)
			{
				return this.innerCounter;
			}
		}
		return -1;
	}
	findControlKeyIndex = function(ccID)
	{
		for(this.innerCounter=0; this.innerCounter<this.numberOfItems; this.innerCounter++)
		{
			if(this.midiMapArray[this.innerCounter][1]==ccID && this.midiMapArray[this.innerCounter][8]==1)
			{
				return this.innerCounter;
			}
		}
		return -1;
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
	handleKeysAsControls = function(midiID, ccID)
	{
		if(midiID>=144 && midiID<=159)
		{
			//NOTE ON
			this.innerCounter = this.findControlIndex(midiID, ccID);
			if(this.innerCounter!=-1)
			{
				this.setMidiValue(this.midiMapArray[this.innerCounter][2], 127);
				return 1;
			}
		}
		else if(midiID>=128 && midiID<=143)
		{
			//NOTE OFF
			this.innerCounter = this.findControlKeyIndex(ccID);
			if(this.innerCounter!=-1)
			{
				this.setMidiValue(this.midiMapArray[this.innerCounter][2], 0);
				return 1;
			}
		}	
		return -1;
	}
	getNote = function(note, octave)
	{
		for(this.keyCounter=0; this.keyCounter<this.midiNoteArray.length; this.keyCounter++)
		{
			if(this.midiNoteArray[this.keyCounter][1]==note && this.midiNoteArray[this.keyCounter][2]==octave)
			{
				return this.midiNoteArray[this.keyCounter][0];
			}
		}
	}
	timeFromBPM = function(bpm)
	{
		return (60000/bpm);
	}
}
export default MIDIMapper;