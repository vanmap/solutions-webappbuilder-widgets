/*global define,dojo,alert,dijit */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define({
    root: ({
        searchContainerHeading:"Search",
        resultsContainerHeading: "Results",
        findNearest:"1. Find nearest",
        DrawBarriersOnMap: "3. Draw barriers on map (optional)",
        SelectLocationOnMap: "4. Select location on map",
        FindButton:"Find",
        ClearButton: "Clear",
        routeLengthHeading: "Route Length",
        businessPassedHeading:"Businesses Passed",
        // Error Alert Messages
        invalidGeometryService : "Invalid Geometry Service",
        featureNotExist: "No businesses were found within the search area",
        routeSolveError: "Error while solving the route",
        businessFeatureError:"Error locating the number of businesses, please try again",
        selectBusinessValues: "Select Business Influence Value",
        invalidTxtBoxValue: "Enter Valid Numbers",
        textboxValueIsInvalid:"Attribute Parameter value is invalid"
    })
});
