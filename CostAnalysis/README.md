# Cost Analysis

The Cost Analysis widget allows users draw features to estimate costs associated with them as defined in feature templates.

Usage example: 
* internet/gas/water company wants to give a quote to a customer on how much it would cost for them to service the customer's new home.

Important Note: These widgets are only tested with the Beta 2 release of or ArcGIS WebApp Builder. All the Widgets in this repo should be considered Beta (or possibly untested) until the final release of Web AppBuilder for ArcGIS.

## Sections

* [Features](#features)
* [Requirements](#requirements)
* [Instructions](#instructions)
* [Resources](#resources)
* [Issues](#issues)
* [Contributing](#contributing)
* [Licensing](#licensing)

## Features

* Cost is calculated by using a cost equation defined in feature templates.
* Define which field contains the cost equation.
* Ability to add/remove/update features.
* Ability to save currently drawn features to a project layer.
* Configurable length, areal, and currency units.
* Draw buffer around saved project.
* Project layer is linked by a field to drawn features: useful for post analysis.
* Totals and counts from current session are saved into project layer.
* Ability to add notes and project names to distinguish each project quote.

## Requirements
* ArcGIS WebApp Builder Beta 2.

## Instructions
Deploying Widget

Setting Up Repository for Development
In order to develop and test widgets you need to deploy the BatchEditor folder to the stemapp/widgets directory in your WebApp Builder installation. If you use Github for windows this can be accomplished using the following steps.

1. Sync the repository to your local machine.
2. Close Open the Repository in Windows Explorer
3. Close Github for Windows
4. Cut and paste the entire BatchEditor folder into the stemapp/widgets folder
5. Launch Github for Windows and choose the option to locate the repository. This will change the location on disk to the new location. 

### General Help
[New to Github? Get started here.](http://htmlpreview.github.io/?https://github.com/Esri/esri.github.com/blob/master/help/esri-getting-to-know-github.html)

## Resources

* Learn more about Esri's [Solutions for ArcGIS](http://solutions.arcgis.com/).

## Issues

* Map popup does not restore to default after saving a project in the widget.
* Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing

Esri welcomes contributions from anyone and everyone. Please see our [guidelines for contributing](https://github.com/esri/contributing).

All web application produced follow Esri's tailcoat style guide
http://arcgis.github.io/tailcoat/styleguides/css/

If you are using [JS Hint](http://http://www.jshint.com/) there is a .jshintrc file included in the root folder which enforces this style.
We allow for 120 characters per line instead of the highly restrictive 80. 

## Licensing

Copyright 2013 Esri

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

[](Esri Tags: ArcGIS Gas Electric Telco Telecommunications Utilities)
[](Esri Language: Javascript)
