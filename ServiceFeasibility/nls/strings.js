/*global define,dojo,dijit,dojoConfig,alert,console */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/** @license
| Copyright 2013 Esri
|
| Licensed under the Apache License, Version 2.0 (the "License");
| you may not use this file except in compliance with the License.
| You may obtain a copy of the License at
|
|    http://www.apache.org/licenses/LICENSE-2.0
|
| Unless required by applicable law or agreed to in writing, software
| distributed under the License is distributed on an "AS IS" BASIS,
| WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
| See the License for the specific language governing permissions and
| limitations under the License.
*/
//============================================================================================================================//
define({
    root: ({
        ascendingOrderLabel: "Ascending",
        descendingOrderLabel: "Descending",
        ExportToLayer:"Export To Layer",
        configError: "Widget is not properly configured",
        searchContainerHeading: "Search",
        resultsContainerHeading: "Results",
        findNearest: "Find nearest",
        DrawBarriersOnMap: "Draw barriers on map (optional)",
        SelectLocationOnMap: "Select location on map",
        FindButton: "Find",
        ClearButton: "Clear",
        routeLengthHeading: "Route Length",
        businessPassedResultListHeading: "Businesses Passed",
        businessPassedCountLabel: "Businesses Passed",
        invalidGeometryService: "Invalid Geometry Service",
        featureNotExist: "No businesses were found within the search area",
        businessFeatureError: "Error locating the number of businesses, please try again",
        invalidTxtBoxValue: "Enter Valid Numbers",
        noBusinessPassedMsg: "No Businesses Passed",
        backButtonLabel: "Back",
        saveToLayerLabel: "Save To Layer",
        saveRouteLayerLabel: "Route Layer",
        businessPassedLabel: "Businesses Passed",
        exportToCSVTitle: "Export to CSV",
        saveLayerTitle: "Save to Layer",
        routeLengthLabel: "Route Length",
        businessLayerLabel: "Business Layer",
        saveBtnLabel: "Save",
        saveClickError: "Select atleast one layer to save",
        saveToLayerSuccess: "Successfully saved results to ${0}",
        saveToLayerFailed: "Failed to save results to ${0}",
        unableToCreateSearchBuffer:"Unable to to create serach buffer area",
        noChangesToSave: "No changes to save to Business layer",
        businessLayerUnavailable: "Selected business layer is not available in the webmap",
        targetRouteLayerUnavailable: "Target route layer is not available in the webmap",
        targetBusinessLayerUnavailable: "Target business layer is not available in the webmap",
        targetRouteLayerUneditable: "Target route layer is not editable",
        targetBusinessLayerUneditable: "Target business layer is not editable",
        unableToFindClosestFacility:"Unable to find closest facility",
        unableToGenerateRoute: "Unable to generate route"
    })
});
