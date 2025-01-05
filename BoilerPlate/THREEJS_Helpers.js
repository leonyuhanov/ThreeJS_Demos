import * as THREE from 'three';
class THREEJS_Helpers
{	
	constructor()
	{
	}
	returnCustomTriangle = function(positionArray, radius, angleDeviation, material)
	{
		//create elongated trinagles
		var geometry = new THREE.BufferGeometry();
		var returnObject;
		var pointArray = new Array(), normals = new Array();
		var objectPositionArray = [0,0];
		var nx, ny, nz;
		
		var pA = new THREE.Vector3();
		var pB = new THREE.Vector3();
		var pC = new THREE.Vector3();
		var cb = new THREE.Vector3();
		var ab = new THREE.Vector3();
		
		//create a triangle around a centre point using a radius
		//Top Ppoint
		objectPositionArray = this.getCircularPointsRaw(positionArray[0], positionArray[1], radius, 0);
		pointArray.push( objectPositionArray[0], objectPositionArray[1], 0 );
		//Bottom right
		objectPositionArray = this.getCircularPointsRaw(positionArray[0], positionArray[1], radius, 180-angleDeviation);
		pointArray.push( objectPositionArray[0], objectPositionArray[1], 0 );
		//Bottom Left
		objectPositionArray = this.getCircularPointsRaw(positionArray[0], positionArray[1], radius, 180+angleDeviation);
		pointArray.push( objectPositionArray[0], objectPositionArray[1], 0 );
		// flat face normals
		pA.set( pointArray[0], pointArray[1], pointArray[2] );
		pB.set( pointArray[3], pointArray[4], pointArray[5] );
		pC.set( pointArray[6], pointArray[7], pointArray[8] );
		cb.subVectors( pC, pB );
		ab.subVectors( pA, pB );
		cb.cross( ab );
		cb.normalize();
		nx = cb.x;
		ny = cb.y;
		nz = cb.z;
		normals.push( nx, ny, nz );
		normals.push( nx, ny, nz );
		normals.push( nx, ny, nz );
		//No idea what this does
		function disposeArray()
		{
			this.array = null;
		}
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( pointArray, 3 ).onUpload( disposeArray ) );
		geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ).onUpload( disposeArray ) );
		geometry.computeBoundingSphere();
		returnObject = new THREE.Mesh( geometry, material );
		return [geometry,returnObject];
		
	}
	returnTriangle = function(positionArray, dimensionArray, rotationOffset, rgbaColourString, material)
	{
		var geometry = new THREE.BufferGeometry();
		var returnObject;
		var pointArray = new Array(), normals = new Array();
		var objectPositionArray = [0,0];
		var pointCounter=0, numberOfPoints=3;
		var nx, ny, nz;
		
		var pA = new THREE.Vector3();
		var pB = new THREE.Vector3();
		var pC = new THREE.Vector3();
		var cb = new THREE.Vector3();
		var ab = new THREE.Vector3();
		
		//create a triangle around a centre point using a radius
		for(pointCounter=0; pointCounter<numberOfPoints; pointCounter++)
		{
			objectPositionArray = this.getCircularPointsRaw(positionArray[0], positionArray[1], dimensionArray[0], ((360/numberOfPoints)*pointCounter)+rotationOffset);
			pointArray.push( objectPositionArray[0], objectPositionArray[1], 0 );
			
		}
		// flat face normals
		pA.set( pointArray[0], pointArray[1], pointArray[2] );
		pB.set( pointArray[3], pointArray[4], pointArray[5] );
		pC.set( pointArray[6], pointArray[7], pointArray[8] );
		cb.subVectors( pC, pB );
		ab.subVectors( pA, pB );
		cb.cross( ab );
		cb.normalize();
		nx = cb.x;
		ny = cb.y;
		nz = cb.z;
		normals.push( nx, ny, nz );
		normals.push( nx, ny, nz );
		normals.push( nx, ny, nz );
		//No idea what this does
		function disposeArray()
		{
			this.array = null;
		}
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( pointArray, 3 ).onUpload( disposeArray ) );
		geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ).onUpload( disposeArray ) );
		geometry.computeBoundingSphere();
		returnObject = new THREE.Mesh( geometry, material );
		return [geometry,returnObject];
		
	}
	getCircularPointsRaw = function(circleX, circleY, circleR, angleFromTopLeftoRight)
	{
		var circCoOrds = [0, 0];
		circCoOrds[0] = circleX + Math.sin(angleFromTopLeftoRight*(Math.PI / 180))*circleR ;
		circCoOrds[1] = circleY - Math.cos(angleFromTopLeftoRight*(Math.PI / 180))*circleR;
		return circCoOrds;
	}
	returnGPUCoords = function(x, y, dimensionArray)
	{
		var cWidth = dimensionArray[0];
		var cHeight = dimensionArray[1];
		var returnData = [0,0];
		var halfWidth=cWidth/2, halfHeight=cHeight/2;
		
		if( x < halfWidth )
		{
			returnData[0] = -(1-(x/halfWidth));
		}
		else
		{
			returnData[0] = (x-halfWidth)/halfWidth;
		}
		if(y<halfHeight)
		{
			returnData[1] = 1-(y/halfHeight);
		}
		else
		{
			returnData[1] = -(y-halfHeight)/halfHeight;
		}
		return returnData;
	}
	returnTextureUVCoords = function(x, y, dimensionArray, positionArray)
	{
		var returnData = [0,0];
		
		if(positionArray[0]>=0)
		{
			//returnData[0] = (x-positionArray[0])/dimensionArray[0];
			returnData[0] = x/(dimensionArray[0]-positionArray[0]);
		}
		else if(positionArray[0]<0)
		{
			//returnData[0] = (positionArray[0]+x)/dimensionArray[0];
			returnData[0] = x/(dimensionArray[0]+positionArray[0]);
		}
		
		if(positionArray[1]>=0)
		{
			//returnData[1] = (y-positionArray[1])/dimensionArray[1];
			returnData[1] = y/(dimensionArray[1]-positionArray[1]);
		}
		else if(positionArray[1]<0)
		{
			//returnData[1] = (positionArray[1]+y)/dimensionArray[1];
			returnData[1] = y/(positionArray[1]+dimensionArray[1]);
		}
		
		return returnData;
	}
}

export default THREEJS_Helpers;