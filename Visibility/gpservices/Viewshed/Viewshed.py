# coding: utf-8
'''
------------------------------------------------------------------------------
 Copyright 2016 Esri
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
------------------------------------------------------------------------------
 ==================================================
 Viewshed.py
 --------------------------------------------------
 requirements: ArcGIS 10.3+, Python 2.7
 author: ArcGIS Solutions
 contact: support@esri.com
 company: Esri
 ==================================================
 description:
 Creates a viewshed based on input parameters
 ==================================================
'''

import arcpy
import math
import os

####
########Script Parameters##################
####
inputPoints = arcpy.GetParameterAsText(0)
elevationRaster = arcpy.GetParameterAsText(1)
Radius2_Input = arcpy.GetParameterAsText(2)
Azimuth1_Input = arcpy.GetParameterAsText(3)
Azimuth2_Input = arcpy.GetParameterAsText(4)
OffsetA_Input = arcpy.GetParameterAsText(5)
Radius1_Input = arcpy.GetParameterAsText(6)
viewshed = arcpy.GetParameterAsText(7)
sectorWedge = arcpy.GetParameterAsText(8)
fullWedge = arcpy.GetParameterAsText(9)

DEBUG = False

def drawWedge(cx,cy,r1,r2,start,end):
    point = arcpy.Point()
    array = arcpy.Array()

    #Calculate the end x,y for the wedge
    x_end = cx + r2*math.cos(start)
    y_end = cy + r2*math.sin(start)

    #Calculate the step value for the x,y coordinates, use 5 degrees for each circle point
    intervalInDegrees = 1
    intervalInRadians = math.radians(intervalInDegrees)

    #Calculate the outer edge of the wedge
    a = start

    #If r1 == 0 then create a wedge from the center point
    if r1 == 0:
        #Add the start point to the array
        point.X = cx
        point.Y = cy
        array.add(point)
        #Calculate the rest of the wedge
        while a >= end:
            point.X = cx + r2*math.cos(a)
            point.Y = cy + r2*math.sin(a)
            array.add(point)
            a -= intervalInRadians
        #Close the polygon
        point.X = cx
        point.Y = cy
        array.add(point)

    else:
        while a >= end:
            point.X = cx + r2*math.cos(a)
            point.Y = cy + r2*math.sin(a)
            a -= intervalInRadians
            array.add(point)

        #Calculate the inner edge of the wedge
        a = end

        while a <= start:
            point.X = cx + r1*math.cos(a)
            point.Y = cy + r1*math.sin(a)
            a += intervalInRadians
            array.add(point)

        #Close the polygon by adding the end point
        point.X = x_end
        point.Y = y_end
        array.add(point)

    #Create the polygon
    polygon = arcpy.Polygon(array)

    return polygon

def surfaceContainsPoint(pointFeature, surfRaster):
    '''
    Check if point extent falls within surface extent, return True or False
    '''
    surfDesc = arcpy.Describe(surfRaster)
    surfaceExtentPoly = extentToPoly(surfDesc.extent, surfDesc.spatialReference)

    pointDesc = arcpy.Describe(pointFeature)
    pointExtent = pointDesc.extent
    pointFeature = extentToPoly(pointExtent, pointDesc.spatialReference)
    #project poly to same sr as surface
    pointFeatProj = pointFeature.projectAs(surfDesc.spatialReference)

    isWithin = pointFeatProj.within(surfaceExtentPoly)

    if DEBUG: arcpy.AddMessage("Within: {0}".format(isWithin))
    return isWithin

def extentToPoly(extent, sr):
    '''
    Extent object returns arcpy.Polygon or arcpy.Point
    '''
    if extent.height == 0.0 and extent.width == 0.0:
        if DEBUG: arcpy.AddMessage("point: {0}\n sr: {1}".format(extent, sr.name))
        return arcpy.PointGeometry(extent.lowerLeft, sr)
    else:
        if DEBUG: arcpy.AddMessage("poly: {0}\n sr: {1}".format(extent, sr.name))
        return extent.polygon

def main():

    inputPointsCount = int(arcpy.GetCount_management(inputPoints).getOutput(0))
    if (inputPointsCount == 0) :
        raise Exception('No features in input feature set: ' + str(inputPoints))

    elevDesc = arcpy.Describe(elevationRaster)
    Output_CS = elevDesc.spatialReference

    if not Output_CS.type == "Projected":
        msgErrorNonProjectedSurface = "Error: Input elevation raster must be in a projected coordinate system. Existing elevation raster is in {0}.".format(Output_CS.name)
        arcpy.AddError(msgErrorNonProjectedSurface)
        raise Exception(msgErrorNonProjectedSurface)

    arcpy.env.outputCoordinateSystem = Output_CS

    donutWedges = []
    pieWedges = []

    ####
    ########End of Script Parameters##################
    ####

    Point_Input = r"in_memory\tempPoints"
    arcpy.CopyFeatures_management(inputPoints, Point_Input)

    #Check if point extent falls within surface extent
    isWithin = surfaceContainsPoint(Point_Input, elevationRaster)
    if not isWithin:
        msgErrorPointNotInSurface = "Error: Input Observer(s) does not fall within the extent of the input surface: {0}!".format(os.path.basename(elevationRaster))
        arcpy.AddError(msgErrorPointNotInSurface)
        raise Exception(msgErrorPointNotInSurface)

    desc = arcpy.Describe(Point_Input)
    if "OFFSETB" not in desc.Fields : 
        arcpy.AddField_management(Point_Input, "OFFSETB", "SHORT")
    # Set Target Height to 0
    arcpy.CalculateField_management(Point_Input, "OFFSETB", "0")

    if "RADIUS2" not in desc.Fields : 
        arcpy.AddField_management(Point_Input, "RADIUS2", "SHORT")
    arcpy.CalculateField_management(Point_Input, "RADIUS2", Radius2_Input)

    if "AZIMUTH1" not in desc.Fields : 
        arcpy.AddField_management(Point_Input, "AZIMUTH1", "SHORT")
    arcpy.CalculateField_management(Point_Input, "AZIMUTH1", Azimuth1_Input)

    if "AZIMUTH2" not in desc.Fields : 
        arcpy.AddField_management(Point_Input, "AZIMUTH2", "SHORT")
    arcpy.CalculateField_management(Point_Input, "AZIMUTH2", Azimuth2_Input)

    if "OFFSETA" not in desc.Fields : 
        arcpy.AddField_management(Point_Input, "OFFSETA", "SHORT")
    arcpy.CalculateField_management(Point_Input, "OFFSETA", OffsetA_Input)

    if "RADIUS1" not in desc.Fields : 
        arcpy.AddField_management(Point_Input, "RADIUS1", "SHORT")
    arcpy.CalculateField_management(Point_Input, "RADIUS1", Radius1_Input)

    arcpy.AddMessage("Buffering observers...")
    arcpy.Buffer_analysis(Point_Input, r"in_memory\OuterBuffer", "RADIUS2", "FULL", "ROUND", "NONE", "", "GEODESIC")

    desc = arcpy.Describe(r"in_memory\OuterBuffer")
    xMin = desc.Extent.XMin
    yMin = desc.Extent.YMin
    xMax = desc.Extent.XMax
    yMax = desc.Extent.YMax
    Extent = str(xMin) + " " + str(yMin) + " " + str(xMax) + " " + str(yMax)

    arcpy.env.extent = Extent

    # TODO: investigate why this doesn't work in ArcGIS Pro (setting mask to in_memory or %scatchGDB%)
    # This output is clipped to the wedge below, so not entirely necessary 
    if arcpy.GetInstallInfo()['ProductName'] != 'ArcGISPro':
        arcpy.env.mask = r"in_memory\OutBuffer"

    arcpy.AddMessage("Clipping image to observer buffer...")
    arcpy.Clip_management(elevationRaster, Extent, r"in_memory\clip")

    arcpy.AddMessage("Calculating viewshed...")
    arcpy.Viewshed_3d("in_memory\clip", Point_Input, r"in_memory\intervis", "1", "FLAT_EARTH", "0.13")

    arcpy.AddMessage("Creating features from raster...")
    arcpy.RasterToPolygon_conversion(in_raster=r"in_memory\intervis", out_polygon_features=r"in_memory\unclipped",simplify="NO_SIMPLIFY")

    fields = ["SHAPE@XY","RADIUS1","RADIUS2","AZIMUTH1","AZIMUTH2"]
    ## get the attributes from the input point
    with arcpy.da.SearchCursor(Point_Input,fields) as cursor:
        for row in cursor:
            cx = row[0][0]
            cy = row[0][1]
            r1 = row[1]
            r2 = row[2]
            startAz = row[3]
            endAz = row[4]

            # Convert from north bearing to XY angle 
            start = math.radians(90 - startAz)
            # Adjust end if it crosses 360
            if startAz > endAz:
                endAz = endAz + 360

            end = math.radians(90 - endAz)

            donutWedge = drawWedge(cx,cy,r1,r2,start,end)
            donutWedges.append(donutWedge)

            pieWedge = drawWedge(cx,cy,0,r2,start,end)
            pieWedges.append(pieWedge)

    arcpy.CopyFeatures_management(donutWedges, sectorWedge)
    arcpy.CopyFeatures_management(pieWedges, fullWedge)

    arcpy.AddMessage("Finishing output features...")
    arcpy.Clip_analysis(r"in_memory\unclipped", sectorWedge, r"in_memory\dissolve")
    arcpy.Dissolve_management(r"in_memory\dissolve", viewshed, "gridcode", "", "MULTI_PART", "DISSOLVE_LINES")

# MAIN =============================================
if __name__ == "__main__":

    if arcpy.CheckExtension("3D") != "Available":
        raise Exception("3D license is not available.")

    main()
