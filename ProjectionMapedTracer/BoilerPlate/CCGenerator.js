class CCGenerator
{	
	constructor(maxValue, colourBlockCount, rgbColourArray)
	{
		this._primaryColours = new Array();
		this._currentColour = [0,0,0];
		this._colourTable = [[0,0,0],[0,0,0],[0,0,0]];
		this._modifierTable = [[0,0,0],[0,0,0]];
		this._colourBlockCount=0;
		this._coloursPerBlock=0;
		this._bandWidth=0;
		this._cnt=0;
		this._primColIndex=0;
		this._rgba="";
	
		this._colourBlockCount = colourBlockCount;
		this._primaryColours = new Array(this._colourBlockCount);
		for(this._cnt=0; this._cnt<this._colourBlockCount; this._cnt++)
	    {
			this._primaryColours[this._cnt] = new Array(3);
	    }
		//Init the Colour Table
		for(this._cnt=0; this._cnt<3; this._cnt++)
		{
			this._colourTable[this._cnt][0] = 0;
			this._colourTable[this._cnt][1] = 0;
			this._colourTable[this._cnt][2] = 0;
		}
		//Init the Modofier Table
		for(this._cnt=0; this._cnt<2; this._cnt++)
		{
			this._modifierTable[this._cnt][0] = 0;
			this._modifierTable[this._cnt][1] = 0;
			this._modifierTable[this._cnt][2] = 0;
		}	
		//number of colours between 1 block and its neighbour    
		this._coloursPerBlock = maxValue;
		//Total number of colours in this spectrum
		this._bandWidth = this._coloursPerBlock * this._colourBlockCount;
		//Fill out primary colours based on array passed
		for(this._cnt=0; this._cnt<colourBlockCount; this._cnt++)
		{
			this._primaryColours[this._cnt][0] = rgbColourArray[this._cnt*3];
			this._primaryColours[this._cnt][1] = rgbColourArray[(this._cnt*3)+1];
			this._primaryColours[this._cnt][2] = rgbColourArray[(this._cnt*3)+2];
		}
	}
	
	getColour = function(colourIndex)
	{
		this._primColIndex = Math.floor(colourIndex/this._coloursPerBlock) ;
		this._colourTable[0][0] = this._primaryColours[this._primColIndex][0]; 
		this._colourTable[0][1] = this._primaryColours[this._primColIndex][1];
		this._colourTable[0][2] = this._primaryColours[this._primColIndex][2];
		
		this._colourTable[1][0] = this._primaryColours[(this._primColIndex+1)%this._colourBlockCount][0]; 
		this._colourTable[1][1] = this._primaryColours[(this._primColIndex+1)%this._colourBlockCount][1]; 
		this._colourTable[1][2] = this._primaryColours[(this._primColIndex+1)%this._colourBlockCount][2];
				
		this.gradientGenerator(colourIndex%this._coloursPerBlock, this._coloursPerBlock);
		
		this._currentColour[0] = this._colourTable[2][0];
		this._currentColour[1] = this._colourTable[2][1];
		this._currentColour[2] = this._colourTable[2][2];		
	}
	
	getRGBA = function(colourIndex)
	{
		this.getColour(colourIndex);
		this._rgba = 'rgba('+this._currentColour[0]+','+this._currentColour[1]+','+this._currentColour[2]+',1)';
	}
	
	gradientGenerator = function(colourIndex, bandWidth)
	{
		for(this._cnt=0; this._cnt<3; this._cnt++)
		{
			//fill modifier
			if(this._colourTable[1][this._cnt]>this._colourTable[0][this._cnt]) { this._modifierTable[0][this._cnt]=1; }
			else if(this._colourTable[1][this._cnt]<this._colourTable[0][this._cnt]) { this._modifierTable[0][this._cnt]=-1; }
			else if(this._colourTable[1][this._cnt]==this._colourTable[0][this._cnt]) { this._modifierTable[0][this._cnt]=0; }

			//fill step value
			if(this._modifierTable[0][this._cnt]==1)
			{
			 this._modifierTable[1][this._cnt] = this._colourTable[1][this._cnt] - this._colourTable[0][this._cnt];
			}
			else if(this._modifierTable[0][this._cnt]==-1)
			{
			  this._modifierTable[1][this._cnt] = this._colourTable[0][this._cnt] - this._colourTable[1][this._cnt];
			}
			else if(this._modifierTable[0][this._cnt]==0)
			{
			  this._modifierTable[1][this._cnt] = 0;
			}
			//calculate current gradient between 2 based on the percentile index
			this._colourTable[2][this._cnt] = this._colourTable[0][this._cnt] + ((this._modifierTable[1][this._cnt]*(colourIndex/bandWidth))*this._modifierTable[0][this._cnt]);
		}
  }
}
export default CCGenerator;