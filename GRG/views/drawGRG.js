///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  'esri/geometry/Polygon',  
  'esri/geometry/geometryEngine',
  'esri/graphic',
  'esri/SpatialReference',
  'jimu/dijit/Message'
], function(
  Polygon,
  geometryEngine,
  Graphic,
  SpatialReference,
  Message
) {
  
  var grg = {};
  
  grg.createGRG = function(HorizontalCells,VerticalCells,centerPoint,cellWidth,cellHeight,angle,labelStartPosition,labelStyle) {
    
    //set up variables
    var letterIndex = 0;
    var secondLetterIndex = 0;
    var letter = 'A';
    var secondLetter = 'A';
    var number = 1;
    var lastY = -9999;
    var features = [];    
    var startX = 0;
    var startY = 0;
    
    //work out required off set for first point
    var offsetX = (HorizontalCells*cellWidth)/2;
    var offsetY = (VerticalCells*cellHeight)/2; 
    
    for (var i = 0; i < VerticalCells; i++)
    {       
      for (var j = 0; j < HorizontalCells; j++)
      {
        var polygon = new Polygon(new SpatialReference({wkid:102100}));
          
        switch (labelStartPosition) {
          case 'Upper-Left':
            startX = centerPoint.x - offsetX;
            startY = centerPoint.y + offsetY;
            polygon.addRing([
              [startX + (j * cellWidth) , startY - (i * cellHeight)],[startX + ((j+1) * cellWidth) , startY - (i * cellHeight)],[startX + ((j+1) * cellWidth) , startY - ((i+1) * cellHeight)],[startX + (j * cellWidth) , startY - ((i+1) * cellHeight)],[startX + (j * cellWidth) , startY - (i * cellHeight)]]);
            break;
          case 'Upper-Right':
            startX = centerPoint.x + offsetX;
            startY = centerPoint.y + offsetY;
            polygon.addRing([
              [startX - (j * cellWidth) , startY - (i * cellHeight)],[startX - ((j+1) * cellWidth) , startY - (i * cellHeight)],[startX - ((j+1) * cellWidth) , startY - ((i+1) * cellHeight)],[startX - (j * cellWidth) , startY - ((i+1) * cellHeight)],[startX - (j * cellWidth) , startY - (i * cellHeight)]]);
            break;
          case 'Lower-Right':
            startX = centerPoint.x + offsetX;
            startY = centerPoint.y - offsetY;
            polygon.addRing([
              [startX - (j * cellWidth) , startY + (i * cellHeight)],[startX - ((j+1) * cellWidth) , startY + (i * cellHeight)],[startX - ((j+1) * cellWidth) , startY + ((i+1) * cellHeight)],[startX - (j * cellWidth) , startY + ((i+1) * cellHeight)],[startX - (j * cellWidth) , startY + (i * cellHeight)]]);
            break;
          case 'Lower-Left':
            startX = centerPoint.x - offsetX;
            startY = centerPoint.y - offsetY;
            polygon.addRing([
              [startX + (j * cellWidth) , startY + (i * cellHeight)],[startX + ((j+1) * cellWidth) , startY + (i * cellHeight)],[startX + ((j+1) * cellWidth) , startY + ((i+1) * cellHeight)],[startX + (j * cellWidth) , startY + ((i+1) * cellHeight)],[startX + (j * cellWidth) , startY + (i * cellHeight)]]);
            break;              
        }
        
        //rotate the graphics as required
        var polygonRotated =  geometryEngine.rotate(polygon, (angle * -1),  centerPoint);
        var graphic = new Graphic(polygonRotated);
                            
        var attr = {};
            
        switch (labelStyle) {
          case 'Alpha-Numeric':
            attr["grid"] = letter.toString() + number.toString();
            break;
          case 'Alpha-Alpha':
            attr["grid"] = letter.toString() + secondLetter.toString();
            break;
           case 'Numeric':
            attr["grid"] = number.toString();
            break
        }
            
        number += 1;
        secondLetterIndex += 1;
        secondLetter = grg.convertNumberToLetters(secondLetterIndex)
        
        graphic.setAttributes(attr);
        
        features.push(graphic);
      }  
      letterIndex += 1;
      letter = grg.convertNumberToLetters(letterIndex);
      if (labelStyle != 'Numeric')
      {
        number = 1;
      }
      secondLetter = 'A';
      secondLetterIndex = 0;                
    }
    return features    
  },
  
  grg.convertNumberToLetters = function (n) {          
    var ordA = 'A'.charCodeAt(0);
    var ordZ = 'Z'.charCodeAt(0);
    var len = ordZ - ordA + 1;          
    var s = "";
    while(n >= 0) {
        s = String.fromCharCode(n % len + ordA) + s;
        n = Math.floor(n / len) - 1;
    }
    return s;
  },
  
  grg.checkGridSize = function (numCellsHorizontal,numCellsVertical) {          
    var totalNumber = numCellsHorizontal*numCellsVertical;
    if(totalNumber > 2000) {
      // Invalid entry
      var alertMessage = new Message({
        message: '<p>You are attempting to create a grid comprising of ' + totalNumber + ' cells. It is advisable to reduce the number of cells being created by changing the grid size or grid area.</li></ul>'
      });
      return false;
    } else {
      return true;
    }
  }, 
  
  grg.convertUnits = function (unitFrom,unitTo,amount) {          
    if(unitFrom == unitTo){
      return amount;
    } else {
      switch(unitFrom) {
        case 'meters':
          switch(unitTo) {
            case 'feet':
              return amount * 3.2808399;
              break;
            case 'kilometers':
              return amount * 0.001;
              break;
            case 'miles':
              return amount / 1609.34;
              break;            
          }
          break;
        case 'feet':
          switch(unitTo) {
            case 'meters':
              return amount / 3.2808399;
              break;
            case 'kilometers':
              return amount / 3280.83989501;
              break;
            case 'miles':
              return amount * 0.0001893939394;
              break;            
          }
          break;
        case 'kilometers':
          switch(unitTo) {
            case 'meters':
              return amount * 1000;
              break;
            case 'feet':
              return amount * 3280.83989501;
              break;
            case 'miles':
              return amount * 0.62137119223733;
              break;            
          }
          break;
        case 'miles':
          switch(unitTo) {
            case 'meters':
              return amount * 1609.34;
              break;
            case 'feet':
              return amount / 0.0001893939394;
              break;
            case 'kilometers':
              return amount / 0.62137119223733;
              break;            
          }
          break;
      }
    }
  }
  
  return grg;
});

