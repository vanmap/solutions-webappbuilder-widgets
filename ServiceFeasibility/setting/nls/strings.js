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
        captionClosestFacilityParameters: "Closest Facility Parameters",
        lblClosestFacilityServiceUrl: "Closest Facility Service URL",
        btnSet: "Set",
        lblFacilitySearchDistance: "Facility Search Distance",
        lblImpedanceAttribute: "Impedance Attribute",
        lblDefaultCutOffDistance: "Default Cutoff distance",
        captiveAttributeLookup: "Attribute Lookup",
        lblAttributeParamLookup: "Attribute Parameter Value Lookup",
        captionSaveResults: "Target layers for saving results to layer",
        lblRouteLayer: "Route Layer",
        lblRouteLength: "Field to Save Route Length",
        lblBusinessCount: "Field to Save Business Count",
        captionExportCSV: "Export to CSV",
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
            highlighterSection: "Highlighter Image",
            imageUplaod: "Image",
            imageHeight: "Height",
            imageWidth: "Width",
            imageHighlightTimeout: "Timeout",
            pixel: "(Pixels)",
            miliseconds: "(Milliseconds)"
        },
        validationErrorMessage: {
            routeLengthErr: "Please specify ",
            bufferDistanceErr: " should be numeric value greater than 0",
            defaultFacilityDistance: " should be numeric value greater than 0",
            defaultCutOffDistance: " should be numeric value greater than 0",
            highlighterImageErr: "Please select Highlighter image.",
            imageHeightErr: " should be numeric value greater than 0",
            imageWidthErr: "Image Width should be numeric value greater than 0",
            imageTimeoutErr: "Image Timeout should be numeric value greater than 0",
            routeLayerErr: "",
            andText: " and ",
            diffText: " should be different.",
            minNullValueErr: "Specify numeric Minimum value. ",
            MaxNullValueErr: "Specify numeric Maximum value. ",
            minValueNumberOnlyErr: "Minimum value should be numeric only. ",
            MaxValueNumberOnlyErr: "Maximum value should be numeric only. ",
            minValueErr: "Maximum value should be greater than Minimum value.",
            invalidClosestFacilityTask: "Please enter valid ",
            accessPointCheck: "Please select minimum one",
            checkGeometryType: "Geometry type of Target",
            BusinessGeometryType: "should be same as the geometry type of main",
            minValueCharErr: "Minimum value should be numeric only.",
            MaxValueCharErr: "Maximum value should be numeric only.",
            specifyText: "Specify",
            blankLayerErr: "Specify Business Layer and Route Layer.",
            NoLayersInWebMap: "No Business Layer available to continue."

        },

        hintText: {
            bussinessesLayerText: "Hint: Select Business layer.",
            accessPointLayerText: "Hint: Select minimum one Access Point Layer.",
            routeLengthUnitText: "Hint: Specify route length Unit.",
            bussinessListText: "Hint: Select desired Business List Field.",
            bufferDistanceText: "Hint: Specify a numeric value for Buffer Distance.",
            bufferUnitsText: "Hint: Select Buffer Unit.",
            closestFacilityText: "Hint: Specify the URL of closest facility.",
            facilitySearchDistanceText: "Hint: Specify a numeric value for Facility Search Distance.",
            impedanceText: "Hint: Select Impedance attribute.",
            cuttOffDistanceText: "Hint: Specify a numeric value for Cutoff Distance.",
            lookupText: "Hint: Lookup for values if datatype of attribute parameter is not integer or double.",
            lookupTextOnSet: "Click on 'Set' button of Closest Facility URL to update 'Attribute Parameter Value'.",
            AttributeParameterValueText1: "Hint: Minimum and Maximum values should be numeric only.",
            AttributeParameterValueText2: "Configure attribute parameters from Closest facility task",
            bussinessLayerText: "Hint: Select a Results Business layer whose geometry type is same as the Business Layer.",
            routeLayerText: "Hint: Select Route layer.",
            routeLengthText: "Hint: Select field of route layer to save route length.",
            saveBussinessText: "Hint: Select field of route layer to save business count.",
            exportToCSVText: "Hint: Select this option to export business results to CSV.",
            imageHeightText: "Hint: Specify numeric value for Image Height.",
            imageWidthText: "Hint: Specify numeric value for Image Width.",
            imageTimeoutText: "Hint: Specify numeric value for Image Timeout."
        },
        invalidURL: " Please enter valid ",

        allowToUserInput: "Allow user input",
        defaultToValue: "Default to value",
        minText: "Min",
        maxText: "Max",
        lblAttributeParameterValues: "Attribute Parameter Values",
        valueText: "Value",
        defaultDataDictionaryValue: "Avoid_Medium,Avoid_Low,Avoid_High"
    }
});