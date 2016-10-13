# coding: utf-8
#------------------------------------------------------------------------------
# Copyright 2015 Esri
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#------------------------------------------------------------------------------
#
# ==================================================
# CanvasAreaGRG.py
# --------------------------------------------------
# Built on ArcGIS 10.?
# ==================================================
#
# Creates a Gridded Reference Graphic
#
# ==================================================
# HISTORY:
#
# 8/24/2015 - mf - Needed to update script for non-ArcMap/Pro testing environment
#
# ==================================================

import os, sys, math, traceback, inspect
import arcpy
from arcpy import env

# Read in the parameters
grgName = arcpy.GetParameterAsText(0)
templateExtent = arcpy.GetParameterAsText(1)
cellWidth = arcpy.GetParameterAsText(2)
cellHeight = arcpy.GetParameterAsText(3)
cellUnits = arcpy.GetParameterAsText(4)
gridSize = arcpy.GetParameterAsText(5)
labelStartPos = arcpy.GetParameterAsText(6)
labelStyle = arcpy.GetParameterAsText(7)

tempOutput = os.path.join("in_memory", "tempFishnetGrid")

outputFeatureClass = r"C:\OpsServer\DBConnections\CurrentOperations.sde\currentoperations.sde.GRGGrid"

DEBUG = True

def RotateFeatureClass(inputFC, outputFC, angle=0, pivot_point=None):
    """Rotate Feature Class
    inputFC     Input features
    outputFC    Output feature class
    angle       Angle to rotate, in degrees
    pivot_point X,Y coordinates (as space-separated string)
                Default is lower-left of inputFC
    As the output feature class no longer has a "real" xy locations,
    after rotation, it no coordinate system defined.
    """

    def RotateXY(x, y, xc=0, yc=0, angle=0, units="DEGREES"):
        """Rotate an xy cooordinate about a specified origin
        x,y      xy coordinates
        xc,yc   center of rotation
        angle   angle
        units    "DEGREES" (default) or "RADIANS"
        """
        import math
        x = x - xc
        y = y - yc
        # make angle clockwise (like Rotate_management)
        angle = angle * -1
        if units == "DEGREES":
            angle = math.radians(angle)
        xr = (x * math.cos(angle)) - (y * math.sin(angle)) + xc
        yr = (x * math.sin(angle)) + (y * math.cos(angle)) + yc
        return xr, yr

    try:
        xcen, ycen = [float(xy) for xy in pivot_point.split()]
        pivot_point = xcen, ycen
                    
    except:
        # if pivot point was not specified, get it from the lower-left corner of the feature class
        ext = arcpy.Describe(inputFC).extent
        xcen, ycen  = ext.XMin, ext.YMin
        pivot_point = xcen, ycen
    
    angle = float(angle)    

    # create an array to temporarily store new polygon geometry
    ring = arcpy.Array()
    
    #set fields to use for the insert and search cursors
    fields = ['SHAPE@', 'grid', 'grg_name']
    
    #create inset cursor against the in memory feature class 
    insertCursor = arcpy.da.InsertCursor(outputFC, fields)
    
    with arcpy.da.SearchCursor(inputFC, fields) as cursor:
      for row in cursor:
        for part in row[0]:
          for pnt in part:
            #loop through each point in polygon and rotate
            x, y = RotateXY(pnt.X, pnt.Y, xcen, ycen, angle)
            ring.add(arcpy.Point(x, y, pnt.ID))
        shp = arcpy.Polygon(ring)
        ring.removeAll()       
        insertCursor.insertRow((shp,row[1],row[2]))      
    
    # close write cursor (ensure buffer written)
    del insertCursor        

    

def ColIdxToXlName(index):
    ''' Converts an index into a letter, labeled like excel columns, A to Z, AA to ZZ, etc. '''
    if index < 1:
        raise ValueError("Index is too small")
    result = ""
    while True:
        if index > 26:
            index, r = divmod(index - 1, 26)
            result = chr(r + ord('A')) + result
        else:
            return chr(index + ord('A') - 1) + result

def main():
    ''' Main tool method '''
    try:
        # From the template extent, get the origin, y axis, and opposite corner corrdinates
        if DEBUG == True: arcpy.AddMessage("Getting extent info...")
        
        extents = str.split(str(templateExtent))
        originCoordinate = extents[0] + " " + extents[1]
        yAxisCoordinate = extents[0] + " " + extents[3]
        oppCornerCoordinate = extents[2] + " " + extents[3]
        centerPoint = str((float(extents[0]) + float(extents[2]))/2.0) + " " + str((float(extents[1]) + float(extents[3]))/2.0)

        # If grid size is drawn on the map, use this instead of cell width and cell height
        inputExtentDrawnFromMap = False
        angleDrawn = 0

        global cellWidth
        global cellHeight
        
        if float(cellWidth) == 0 and float(cellHeight) == 0:
            if DEBUG == True: arcpy.AddMessage("Cell extent from features...")
            inputExtentDrawnFromMap = True
            tempGridFC = os.path.join("in_memory", "GridSize")
            arcpy.CopyFeatures_management(gridSize, tempGridFC)
            pts = None
            with arcpy.da.SearchCursor(tempGridFC, 'SHAPE@XY', explode_to_points=True) as cursor:
                pts = [r[0] for r in cursor][0:4]
            arcpy.Delete_management(tempGridFC)

            cellWidth = math.sqrt((pts[0][0] - pts[1][0]) ** 2 + (pts[0][1] - pts[1][1]) ** 2)
            cellHeight = math.sqrt((pts[1][0] - pts[2][0]) ** 2 + (pts[1][1] - pts[2][1]) ** 2)
            highestPoint = None
            nextHighestPoint = None
            for pt in pts:
                if highestPoint is None or pt[1] > highestPoint[1]:
                    nextHighestPoint = highestPoint
                    highestPoint = pt
                elif nextHighestPoint is None or pt[1] > nextHighestPoint[1]:
                    nextHighestPoint = pt

            topLeft = highestPoint if highestPoint[0] < nextHighestPoint[0] else nextHighestPoint
            topRight = highestPoint if highestPoint[0] > nextHighestPoint[0] else nextHighestPoint
            yDiff = topRight[1] - topLeft[1]
            xDiff = topRight[0] - topLeft[0]

            # Calculate angle
            hypotenuse = math.sqrt(math.pow(topLeft[0] - topRight[0], 2) + math.pow(topLeft[1] - topRight[1], 2))
            adjacent = topRight[0] - topLeft[0]
            numberToCos = float(adjacent)/float(hypotenuse)
            angleInRadians = math.acos(numberToCos)
            angleDrawn = math.degrees(angleInRadians)
            if (topRight[1] > topLeft[1]):
                angleDrawn = 360 - angleDrawn
        else:
            if DEBUG == True:
                arcpy.AddMessage("Cell extent from (" + str(cellWidth) + "," + str(cellHeight) + ")")
            if (cellUnits == "Feet"):
                cellWidth = float(cellWidth) * 0.3048
                cellHeight = float(cellHeight) * 0.3048

        # Set the start position for labeling
        startPos = None
        if (labelStartPos == "Upper-Right"):
            startPos = "UR"
        elif (labelStartPos == "Upper-Left"):
            startPos = "UL"
        elif (labelStartPos == "Lower-Left"):
            startPos = "LL"
        elif (labelStartPos == "Lower-Right"):
            startPos = "LR"
        arcpy.AddMessage("Cell width: " + str(cellWidth) + " Cell height: " + str(cellHeight))
        arcpy.AddMessage("Creating Fishnet Grid...")
        arcpy.CreateFishnet_management(tempOutput, originCoordinate, yAxisCoordinate, str(cellWidth), str(cellHeight), 0, 0, oppCornerCoordinate, "NO_LABELS", templateExtent, "POLYGON")

        # Sort the grid upper left to lower right
        arcpy.AddMessage("Sorting the grid for labeling")
        tempSort = os.path.join("in_memory","tempSort")
        arcpy.Sort_management(tempOutput, tempSort, [["Shape", "ASCENDING"]], startPos)

        # Add a field which will be used to add the grid labels
        arcpy.AddMessage("Adding field for labeling the grid")
        gridField = "grid"
        arcpy.AddField_management(tempSort, gridField, "TEXT")
        # Add a field to hold grid name
        arcpy.AddField_management(tempSort, "grg_name", "TEXT")

        # Number the fields
        arcpy.AddMessage("Numbering the grids")
        letterIndex = 1
        secondLetterIndex = 1
        letter = 'A'
        secondLetter = 'A'
        number = 1
        lastY = -9999
        
        fields = ['SHAPE@', 'grid', 'grg_name']
        with arcpy.da.UpdateCursor(tempSort,fields) as cursor:        
          for row in cursor:
              yPoint = row[0].firstPoint.Y
              if (lastY != yPoint) and (lastY != -9999):
                  letterIndex += 1
                  letter = ColIdxToXlName(letterIndex)
                  if (labelStyle != "Numeric"):
                      number = 1
                  secondLetter = 'A'
                  secondLetterIndex = 1
              lastY = yPoint

              if (labelStyle == "Alpha-Numeric"):
                  row[1] = str(letter) + str(number)
              elif (labelStyle == "Alpha-Alpha"):
                  row[1] = str(letter) + str(secondLetter)
              elif (labelStyle == "Numeric"):
                  row[1] = str(number)              
              
              #Add grid name to feature    
              row[2] = grgName
              
                            
              cursor.updateRow(row)
              number += 1
              secondLetterIndex += 1
              secondLetter = ColIdxToXlName(secondLetterIndex)
              
        del cursor

        # Rotate the shape, if needed.
        if (inputExtentDrawnFromMap):
            arcpy.AddMessage("Rotating the feature using angle: " + str(angleDrawn) + " Center Point: " + centerPoint)            
            RotateFeatureClass(tempSort, outputFeatureClass, angleDrawn, centerPoint)
        else:
            arcpy.AddMessage("Adding Grid to feature Class")
            insertCursor = arcpy.da.InsertCursor(outputFeatureClass, fields)
            #arcpy.Append_management([tempSort], outputFeatureClass)
            with arcpy.da.SearchCursor(tempSort, fields) as cursor:
              for row in cursor:
                insertCursor.insertRow((row[0],row[1],row[2]))
    
            # close write cursor (ensure buffer written)
            del insertCursor
            
        arcpy.Delete_management(tempSort)


    except arcpy.ExecuteError: 
        # Get the tool error messages
        msgs = arcpy.GetMessages()
        arcpy.AddError(msgs)
        print(msgs)

    except:
        # Get the traceback object
        tb = sys.exc_info()[2]
        tbinfo = traceback.format_tb(tb)[0]

        # Concatenate information together concerning the error into a message string
        pymsg = "PYTHON ERRORS:\nTraceback info:\n" + tbinfo + "\nError Info:\n" + str(sys.exc_info()[1])
        msgs = "ArcPy ERRORS:\n" + arcpy.GetMessages() + "\n"

        # Return python error messages for use in script tool or Python Window
        arcpy.AddError(pymsg)
        arcpy.AddError(msgs)
    
        # Print Python error messages for use in Python / Python Window
        print(pymsg + "\n")
        print(msgs)

# MAIN =============================================
if __name__ == "__main__":
    main()
