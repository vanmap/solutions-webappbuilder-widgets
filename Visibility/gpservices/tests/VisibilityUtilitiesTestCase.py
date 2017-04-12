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
 VisibilityUtilitiesTestCase.py
 --------------------------------------------------
 requirements: ArcGIS 10.3+, Python 2.7
 author: ArcGIS Solutions
 contact: support@esri.com
 company: Esri
 ==================================================
 description:
 Unit tests for Visibility tools
 ==================================================
'''

# IMPORTS ==========================================
import os
import sys
import traceback
import arcpy
import unittest
import UnitTestUtilities
import Configuration

# import the viewshed package
sys.path.append(os.path.normpath(os.path.join(os.path.dirname(__file__), \
    r"../viewshed")))
import Viewshed

class VisibilityUtilitiesTestCase(unittest.TestCase):

    def setUp(self):
        arcpy.env.overwriteOutput = True 
        
    def test_toolboxTool(self):

        if arcpy.CheckExtension("3D") == "Available":
            arcpy.CheckOutExtension("3D")
        else:
            raise Exception("3D license is not available.")

        #TODO: replace with actual observer/surface datasets from test setup
        observers =  'C:\....\TestPoints'
        elevationSurface = r'C:\MyFiles\MapData\elevation\SRTM\n36_w121_proj'

        Viewshed.createViewshed(observers, \
           elevationSurface, \
           '3000', '40', '120', '20', '1000', \
           r'in_memory\viewshed', r'in_memory\wedge', r'in_memory\fullwedge')

    def test_surfaceContainsPoint(self):
        '''
        Check if elevation dataset contains the specified point
        '''
        runToolMessage = ".....VisibilityUtilityTestCase.test_surfaceContainsPoint"
        arcpy.AddMessage(runToolMessage)
        Configuration.Logger.info(runToolMessage)

        # List of coordinates
        # coordinates = [[-117.196717216, 34.046944853]]
        coordinates = [[-120.5, 36.5]]

        # Create an in_memory feature class to initially contain the coordinate pairs
        feature_class = arcpy.CreateFeatureclass_management(
            "in_memory", "tempfc", "POINT", spatial_reference=arcpy.SpatialReference(4326))[0]

        # Open an insert cursor
        with arcpy.da.InsertCursor(feature_class, ["SHAPE@"]) as cursor:
            # Iterate through list of coordinates and add to cursor
            for (x, y) in coordinates:
                point = arcpy.Point(x, y)
                pointGeo = arcpy.PointGeometry(point, \
                    arcpy.SpatialReference(4326))
                cursor.insertRow([pointGeo])

        # Create a FeatureSet object and load in_memory feature class
        feature_set = arcpy.FeatureSet()
        feature_set.load(feature_class)
        Point_Input = "in_memory\\tempPoints"
        arcpy.CopyFeatures_management(feature_set, Point_Input)

        #TODO: replace with actual surface from test setup
        elevationDataset = r"C:\MyFiles\MapData\elevation\SRTM\n36_w121_proj"

        try:
            # This should throw an exception since Spatial Refs do not match
            pointsIn = Viewshed.surfaceContainsPoint(Point_Input, elevationDataset)
        except Exception:
            pass
        else:
            self.fail('ExpectedException not raised')