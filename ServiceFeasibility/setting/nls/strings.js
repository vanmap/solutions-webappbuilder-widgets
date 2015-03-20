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
    root: {
        lblBusinessesLayer: "Businessess Layer",
        lblAccessPointLayers: "Access Point Layers",
        lblForRouteLengthUnits: "Label for Route Length Units",
        txtValueRouteLength: "Feet",
        lblFieldTobeDisplayed: "Field to be displayed in Business list",
        captionServiceAreaParameters: "Service area parameters",
        lblBufferDistanceToGenerateServiceArea: "Buffer distance to generate service area",
        lblBufferUnits: "Buffer Units",
        lblBufferWKID: "Buffer WKID",
        captionClosestFacilityParameters: "Closest Facility Parameters",
        lblClosestFacilityServiceUrl: "Closest Facility Service URL",
        btnSet: "Set",

        lblFacilitySearchDistance: "Facility Search Distance",
        lblImpedanceAttribute: "Impedance Attribute",
        lblDefaultCutOffDistance: "Default Cutoff distance",
        captiveAttributeLookup: "Attribute Lookup",
        lblAttributeParamLookup: "Attribute Parameter Value Lookup",
        captionSaveResults: "Target layers for saving results",
        lblBusinessesLayer: "Businesses layer",
        lblRouteLayer: "Route Layer",
        lblRouteLength: "Field to Save Route Length",
        lblBusinessCount: "Field to Save Business Count",
        captionExportCSV:"Export to CSV",
        operationalLayersErrorMessage: "There are no operational layers available in webmap.",
        symbol: {
            barrier: "Barrier Symbols",
            location: "Location Symbol",
            route: "Route Symbol",
            buffer: "Buffer Symbol",
            business: "Business Symbol",
            pointBarrierSymbol: "Point Barrier Symbol",
            lineBarrierSymbol: "Line Barrier Symbol",
            polygonBarrierSymbol: "Polygon Barrier Symbol",
            pointLocationSymbol: "Point Location Symbol",
            businessSymbol: "Business Symbol",
            routeSymbol: "Route Symbol",
            bufferSymbol: "Buffer Symbol"
        },
        highlighter: {
            highlighterSection : "Highlighter Image",
            imageUplaod : "Image",
            imageHeight: "Height",
            imageWidth: "Width",
            imageHighlightTimeout: "Timeout",
            pixel: "(Pixels)",
            thumbnailHint: "(Click image to update)",
            miliseconds: "(Milliseconds)"
        },
        invalidURL: "Please enter valid closest facility service URL",
        allowToUserInput: "Allow user input",
        defaultToValue: "Default to value",
        minText: "Min",
        maxText: "Max",
        lblAttributeParameterValues: "Attribute Parameter Values",
        valueText: "Value",
        defaultDataDictionaryValue: "Avoid_Medium,Avoid_Low,Avoid_High"
    }
});