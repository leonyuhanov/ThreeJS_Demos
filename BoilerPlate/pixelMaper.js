class pixelMaper
{
	constructor(cols, rows)
	{
		this.bitmapArray = new Array();
		this.cols = cols;
		this.rows = rows;
		this.colCounter = 0;
		this.rowCounter = 0;
		this.tempRow = new Array();
		this.boxDimensions = [1,1,1];
		this.mapLocation = [0,0];
		this.spacing = 1;
		
		for(this.rowCounter=0; this.rowCounter<this.rows; this.rowCounter++)
		{
			this.tempRow = new Array();			
			for(this.colCounter=0; this.colCounter<this.cols; this.colCounter++)
			{
				this.tempRow.push([0,0,0]);
			}
			this.bitmapArray.push(this.tempRow);
		}
	}
	
	drawPixel = function(x, y, pixColour)
	{
		if(x<this.cols && y<this.rows && x>=0 && y>=0)
		{
			this.bitmapArray[y][x][0] = pixColour[0];
			this.bitmapArray[y][x][1] = pixColour[1];
			this.bitmapArray[y][x][2] = pixColour[2];
		}
	}
	
	drawLine = function(x0, y0, x1, y1, pixelColour)
	{
	   var dx = Math.abs(x1-x0);
	   var dy = Math.abs(y1-y0);
	   var sx = (x0 < x1) ? 1 : -1;
	   var sy = (y0 < y1) ? 1 : -1;
	   var err = dx-dy;

	   while(true)
	   {
		 this.drawPixel(x0, y0, pixelColour);
		 if ((x0==x1) && (y0==y1)) break;
		 var e2 = 2*err;
		 if (e2 >-dy){ err -= dy; x0  += sx; }
		 if (e2 < dx){ err += dx; y0  += sy; }
	   }
	}

	renderHLine = function(x,y,length,pixColour)
	{
		var xCnt = 0;
		if(xCnt+length<=this.cols)
		{
			for(xCnt=x; xCnt<x+length; xCnt++)
			{
				this.drawPixel(xCnt, y, pixColour);
			}
		}
	}

	renderVLine = function(x,y,length, pixColour)
	{
		var yCnt = 0;
		if(y+length<=this.rows)
		{
			for(yCnt=y; yCnt<y+length; yCnt++)
			{
				this.drawPixel(x, yCnt, pixColour);
			}
		}
	}
	
	renderRecetangle = function(x, width, y, height, pixColour)
	{
		this.renderHLine(x, y, width, pixColour);
		this.renderHLine(x, y+height, width, pixColour);
		this.renderVLine(x, y, height, pixColour);
		this.renderVLine(x+width, y, height, pixColour);
	}
	
	renderPolly = function(x, y, radius, numberOfPoints, pixColour)
	{
		var pointCounter;
		var startPoints = [0,0];
		var endPoints = [0,0];
		for(pointCounter=0; pointCounter<numberOfPoints; pointCounter++)
		{
			startPoints = this.getCircularPoints(x, y, radius, (360/numberOfPoints)*pointCounter);
			if(pointCounter+1<numberOfPoints)
			{
				endPoints = this.getCircularPoints(x, y, radius, (360/numberOfPoints)*(pointCounter+1));
			}
			else
			{
				endPoints = this.getCircularPoints(x, y, radius, 0);
			}
			this.drawLine(startPoints[0], startPoints[1], endPoints[0], endPoints[1], pixColour);
		}
	}
	
	fill = function(xStart, yStart, width, height, pixColour)
	{
		var xp, yp;
		for(xp=xStart; xp<xStart+width; xp++)
		{
			for(yp=yStart; yp<yStart+height; yp++)
			{
				this.drawPixel(xp, yp, pixColour);
			}
		}
	}
	
	drawCircle = function(cX, cY, radius, pixColour, degreePointIncrement)
	{
		var degCounter = 0;
		var cPoints = [0,0];
		for(degCounter=0; degCounter<360; degCounter+=degreePointIncrement)
		{
			cPoints = this.getCircularPoints(cX, cY, radius, degCounter);
			this.drawPixel(Math.round(cPoints[0]), Math.round(cPoints[1]), pixColour);
		}
	}
	
	getCircularPoints = function(circleX, circleY, circleR, angleFromTopLeftoRight)
	{
		var circCoOrds = [0, 0];
		angleFromTopLeftoRight+=180;
		circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*circleR ;
		circCoOrds[1] = circleY - Math.cos(angleFromTopLeftoRight*(Math.PI / 180))*circleR;
		return circCoOrds;
	}
	
	getCircularPointsRaw = function(circleX, circleY, circleR, angleFromTopLeftoRight)
	{
		var circCoOrds = [0, 0];
		circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*circleR ;
		circCoOrds[1] = circleY - Math.cos(angleFromTopLeftoRight*(Math.PI / 180))*circleR;
		return circCoOrds;
	}
	getAdvancedCircularPoints = function(cX, cY, radius, angleFromTopLeftoRight, xFactor, yFactor, xxFactor, yyFactor)
	{
		var cPoints = [0,0];
		cPoints[0] = Math.round( cX + Math.sin(angleFromTopLeftoRight*xFactor*(Math.PI / 180))*radius*xxFactor );
		cPoints[1] = Math.round( cY - Math.cos(angleFromTopLeftoRight*yFactor*(Math.PI / 180))*radius*yyFactor );
		return cPoints;
	}
	
	subtractiveFade = function(fadeLevel)
	{
		var xCnt=0, yCnt=0;
		
		for(yCnt=0; yCnt<this.rows; yCnt++)
		{
			for(xCnt=0; xCnt<this.cols; xCnt++)
			{
				if(this.bitmapArray[yCnt][xCnt][0]-fadeLevel<0){ this.bitmapArray[yCnt][xCnt][0]=0; }
				else{this.bitmapArray[yCnt][xCnt][0]-=fadeLevel;}
				if(this.bitmapArray[yCnt][xCnt][1]-fadeLevel<0){ this.bitmapArray[yCnt][xCnt][1]=0; }
				else{this.bitmapArray[yCnt][xCnt][1]-=fadeLevel;}
				if(this.bitmapArray[yCnt][xCnt][2]-fadeLevel<0){ this.bitmapArray[yCnt][xCnt][2]=0; }
				else{this.bitmapArray[yCnt][xCnt][2]-=fadeLevel;}
			}
		}
	}
	
	clear = function()
	{
		var xCnt=0, yCnt=0;
		for(yCnt=0; yCnt<this.rows; yCnt++)
		{
			for(xCnt=0; xCnt<this.cols; xCnt++)
			{
				this.bitmapArray[yCnt][xCnt][0] = 0;
				this.bitmapArray[yCnt][xCnt][1] = 0;
				this.bitmapArray[yCnt][xCnt][2] = 0;
			}
		}
	}
	
	shiftUpDown = function(limitArray, direction, wrap)
	{
		var xCnt=0, yCnt=0;
		var tempBlock = new Array();
		
		if(limitArray==undefined)
		{
			var limitArray = [0,this.cols, 0, this.rows];
		}
		
		if(direction=="down")
		{
			//copy the last row if wrap is defined
			if(wrap)
			{
				for(xCnt=0; xCnt<this.cols; xCnt++)
				{
					tempBlock.push( this.bitmapArray[limitArray[3]-1][xCnt] );
				}
			}
			//start at the end, copy next row into the current
			for(yCnt=limitArray[3]; yCnt>limitArray[2]; yCnt--)
			{
				for(xCnt=limitArray[0]; xCnt<limitArray[1]; xCnt++)
				{
					this.bitmapArray[yCnt][xCnt][0] = this.bitmapArray[yCnt-1][xCnt][0];
					this.bitmapArray[yCnt][xCnt][1] = this.bitmapArray[yCnt-1][xCnt][1];
					this.bitmapArray[yCnt][xCnt][2] = this.bitmapArray[yCnt-1][xCnt][2];
				}
			}
			//copy the last row into the 1st row if wrap is defines
			if(wrap)
			{
				for(xCnt=0; xCnt<this.cols; xCnt++)
				{
					this.bitmapArray[limitArray[2]][xCnt][0] = tempBlock[xCnt][0];
					this.bitmapArray[limitArray[2]][xCnt][1] = tempBlock[xCnt][1];
					this.bitmapArray[limitArray[2]][xCnt][2] = tempBlock[xCnt][2];
				}
			}
		}
		else
		{
			//copy the 1st row
			if(wrap)
			{
				for(xCnt=0; xCnt<this.cols; xCnt++)
				{
					tempBlock.push( this.bitmapArray[limitArray[2]][xCnt] );
				}
			}
			//start at the top, copy next row into the current
			for(yCnt=limitArray[2]; yCnt<limitArray[3]; yCnt++)
			{
				for(xCnt=limitArray[0]; xCnt<limitArray[1]; xCnt++)
				{
					this.bitmapArray[yCnt][xCnt][0] = this.bitmapArray[yCnt+1][xCnt][0];
					this.bitmapArray[yCnt][xCnt][1] = this.bitmapArray[yCnt+1][xCnt][1];
					this.bitmapArray[yCnt][xCnt][2] = this.bitmapArray[yCnt+1][xCnt][2];
				}
			}		
			//copy the 1st row into the last row
			if(wrap)
			{
				for(xCnt=0; xCnt<this.cols; xCnt++)
				{
					this.bitmapArray[limitArray[3]][xCnt][0] = tempBlock[xCnt][0];
					this.bitmapArray[limitArray[3]][xCnt][1] = tempBlock[xCnt][1];
					this.bitmapArray[limitArray[3]][xCnt][2] = tempBlock[xCnt][2];
				}
			}
		}
	}

	shiftLeftRight = function(limitArray, direction, wrap)
	{
		var xCnt=0, yCnt=0;
		var tempBlock = new Array();

		if(limitArray==undefined)
		{
			var limitArray = [0,this.cols, 0, this.rows];
		}
		
		if(direction=="right")
		{
			//copy the last column
			if(wrap)
			{
				for(yCnt=0; yCnt<this.rows; yCnt++)
				{
					tempBlock.push( this.bitmapArray[yCnt][this.cols-1] );
				}
			}
			//start at the end, copy next row into the current
			for(xCnt=limitArray[1]-1; xCnt>limitArray[0]; xCnt--)
			{
				for(yCnt=limitArray[2]; yCnt<limitArray[3]; yCnt++)
				{
					this.bitmapArray[yCnt][xCnt][0] = this.bitmapArray[yCnt][xCnt-1][0];
					this.bitmapArray[yCnt][xCnt][1] = this.bitmapArray[yCnt][xCnt-1][1];
					this.bitmapArray[yCnt][xCnt][2] = this.bitmapArray[yCnt][xCnt-1][2];
				}
			}
			//copy the last column into the 1st column
			if(wrap)
			{
				for(yCnt=0; yCnt<this.rows; yCnt++)
				{
					this.bitmapArray[yCnt][0][0] = tempBlock[yCnt][0];
					this.bitmapArray[yCnt][0][1] = tempBlock[yCnt][1];
					this.bitmapArray[yCnt][0][2] = tempBlock[yCnt][2];
				}
			}
		}
		else
		{
			//copy the 1st column
			if(wrap)
			{
				for(yCnt=0; yCnt<this.rows; yCnt++)
				{
					tempBlock.push( this.bitmapArray[yCnt][0] );
				}
			}	
			//start at the end, copy next row into the current
			for(xCnt=limitArray[0]; xCnt<limitArray[1]-1; xCnt++)
			{
				for(yCnt=limitArray[2]; yCnt<limitArray[3]; yCnt++)
				{
					this.bitmapArray[yCnt][xCnt][0] = this.bitmapArray[yCnt][xCnt+1][0];
					this.bitmapArray[yCnt][xCnt][1] = this.bitmapArray[yCnt][xCnt+1][1];
					this.bitmapArray[yCnt][xCnt][2] = this.bitmapArray[yCnt][xCnt+1][2];
				}
			}
			//copy the 1st column into the last column
			if(wrap)
			{
				for(yCnt=0; yCnt<this.rows; yCnt++)
				{
					this.bitmapArray[yCnt][this.cols-1][0] = tempBlock[yCnt][0];
					this.bitmapArray[yCnt][this.cols-1][1] = tempBlock[yCnt][1];
					this.bitmapArray[yCnt][this.cols-1][2] = tempBlock[yCnt][2];
				}
			}
		}
	}
	
	//for spherical maps
	pixelPositionAt = function(x, y, realRadius)
	{
		var verticalMap, horizontalMap;
				
		if(y==Math.round(this.rows/2))
		{
			verticalMap = this.getCircularPoints(0, 0, realRadius, 90);
		}
		else if(y<Math.round(this.rows/2))
		{
			verticalMap = this.getCircularPoints(0, 0, realRadius, (360/Math.round(this.rows))*y);
		}
		else if(y>Math.round(this.rows/2))
		{
			verticalMap = this.getCircularPoints(0, 0, realRadius, (360/Math.round(this.rows))*y);
			verticalMap[1] = verticalMap[1]*-1;
		}
		horizontalMap = this.getCircularPoints(0, 0, verticalMap[0], (360/Math.round(this.cols))*x );
		
		return [horizontalMap[0],verticalMap[1],horizontalMap[1]];
	}
	
	pixelAt = function(x, y)
	{
		return this.bitmapArray[y][x];
	}
	
	hasColour = function(x, y)
	{
		if( (this.bitmapArray[y][x][0]+this.bitmapArray[y][x][1]+this.bitmapArray[y][x][2])>0 )
		{
			return 1;
		}
		else
		{
			return 0;
		}
	}
	
	getHeight = function(x, y, range)
	{
		var currentPixel = this.pixelAt(x, y);
		var returnValue = currentPixel[0]+currentPixel[1]+currentPixel[2];
		return (returnValue/(256*3))*range;
	}
	
	getWave = function(counter, minWave, maxWave)
	{
		return ( Math.sin(counter)*((maxWave-minWave)/2) )+( maxWave-((maxWave-minWave)/2) );
	}
}
export default pixelMaper;
