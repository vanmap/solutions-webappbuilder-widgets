# Cost Analysis
The Cost Analysis widget allows users to quickly develop a cost for a proposed project and persist that information in a mapping service.

  - Sketch in new and proposed assets
  - Real time costing updates
  - Add cost escalation factors
  - Override default cost
  - Extend an existing project
  - View summaries of project

## Sections

* [Features](#features)
* [Requirements](#requirements)
* [Instructions](#instructions)
* [Resources](#resources)
* [Issues](#issues)
* [Contributing](#contributing)
* [Licensing](#licensing)

## Features

### Setting up the data
* Sample data and required data
  * Unzip the DataStructure.zip file to access the sample data and schema   
* Create a project GDB
  * Create a new GDB
  * Copy all the layers from the DataSctructure.gdb to your new GDB
* Prep your project layer
  * If you have project layer you wish to use, add these to the Project layer.
  * If you have a lot of fields, you can run the Add Project Fields model and overwrite the Project layer provided in the DataStructure.gdb
* Prep your data
  * Place copies of the layer you wish to include in your costing analysis solutions and put them into the costing GDB you created.  
  * Run the Add Cost Required Fields model on each of these layers to add the required fields
* Creating the service
  * Create a new ArcMap Document and add all the layers from the costing gdb.
  * Add your cost equations to the Costing Table
    * Costing Table Fields definitions
        * **INITIALCOSTID**:  This ID that identifies the record and applied to the edit templates.  This value can be repeated on multi rows.  This allows the user to tie different cost to the same feature depending on the Geography and Equation Type
        * **COSTEQUATION**:  The equation to apply to the new record.  The JS Eval statement is used so ensure your equation is valid
            * Special Parameters:
                * **{QUANTITY}**
                    * Length for lines
                    * Area for polygons
                    * Count for lines
                * **{UNITCOST}** 
                    * The value from the field UNITCOST is placed here
                * **{COUNT}**
                    * Count of features for all shape types
        * **UNITCOST**:  The cost to apply to the UNITCOST equation
        * **Description**:  Text description, optional
        * **GEOGRAPHYLAYERID**:  ID of feature from the Costing Geometry layer.  This allows you to tie and equation to a geometry.
        * **EQUATIONTYPE**:  Name of equation.  This value can be used if for the same asset, the user would like to present more than one cost.  For example, if the organization uses two contractors for the same work, they can add both equations and provide their name as the Equation Type.  As Run Time, the designer will be prompted to select one of these.
    * For an Example, please see table in the Sample.gdb
* Optionally Add costing geography.  If you would like to provide different cost per geography, sketch in the areas and fill out the details.  Make sure to apply the geography names to the cost equations for that area.  
    * Costing Geometry Fields definitions
        * **COSTGEOMID**:  String name that represents the ID of the costing Geometry, this is the value that needs to be stored in the costing table.  This value needs to be unique.
    * Apply Cost to Templates:  To link a cost record to a feature, some information needs to be stored on the feature templates.  Open the Organize Feature Template dialog and make the following changes for each features templates.
* Asset Feature Template Fields definitions
    * **INITIALCOSTID**:  The **INITIALCOSTID** from the costing table to link the cost to this type of feature
    * **PROJECTGROUPCOSTINGINFOID**:  Leave Null, used by the widget
    * **PROJECTID**: Leave Null, used by the widget
    * **TEMPLATEID**:  A unique name for this template on this feature.  This is required in case data edits are made outside this widget and the widget is to load an cost this “orphaned” data.

## Requirements
Requires Web AppBuilder for ArcGIS 1.3

## Instructions
Deploying Widgets.

To use the widgets with you should copy any of the widgets to the stemapp/widget directory. This is located in %webappbuilder_install%/client directory.

For more resources on developing modifying widgets please visit
[Web AppBuilder for ArcGIS Documentation](http://doc.arcgis.com/en/web-appbuilder/)

### General Help
[New to Github? Get started here.](http://htmlpreview.github.com/?https://github.com/Esri/esri.github.com/blob/master/help/esri-getting-to-know-github.html)


## Resources

* Learn more about Esri's Solutions [Focused Maps and Apps for Your Organization](http://solutions.arcgis.com/).

## Issues

* Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing

Esri welcomes contributions from anyone and everyone. Please see our [guidelines for contributing](https://github.com/esri/contributing).

If you are using [JS Hint](http://http://www.jshint.com/) there is a .jshintrc file included in the root folder which enforces this style.
We allow for 120 characters per line instead of the highly restrictive 80.

## Licensing

Copyright 2015 Esri

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's
[license.txt](license.txt) file.

[](Esri Tags: ArcGISSolutions ArcGIS Defense and Intelligence Military Environment Planning Analysis Emergency Management Local-Government Local Government State-Government State Government Utilities ArcGISSolutions)
[](Esri Language: Javascript)
