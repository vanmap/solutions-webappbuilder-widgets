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
        btnRefresh: "Refresh",
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
        FieldmMappingText: "Route-Bussiness attribute transfer:",
        RoutLayerField: "Route Layer field :",
        BussinessLayerField: "Business Layer Field :",
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
            greaterThanZeroMessage: " should be numeric value greater than 0.",
            highlighterImageErr: "Please select Highlighter image.",
            andText: " and ",
            diffText: " should be different.",
            nullValueErr: "Specify numeric ${0} value. ",
            valueNumberOnlyErr: "${0} value should be numeric only. ",
            minValueErr: "Maximum value should be greater than Minimum value.",
            invalidClosestFacilityTask: "Please enter valid ",
            accessPointCheck: "No Access Point Layers available to continue.",
            checkGeometryType: "Geometry type of Target",
            BusinessGeometryType: "should be same as the geometry type of main",
            valueCharErr: "${0} value should be numeric only.",
            specifyText: "Specify",
            blankLayerErr: "Specify businesses layer and route layer.",
            NoLayersInWebMap: "No Business Layer available to continue.",
            defaultAttrLookupParamValueMsg: "Unsaved changes in attribute parameter lookup, please refresh",
            emptyLookupParamValueErr : "Lookup parameters cannot be empty",
            minValueErrorLabel: "minimum",
            maxValueErrorLabel: "maximum",
            defaultValueErrorLabel: "default",
            NoFieldsInBusinessLayer: "No field to be display as a title in result business list"
        },
        esriUnit: {
            esriCTMeters: "Meters",
            esriCTMiles: "Miles",
            esriCTFeets: "Feets",
            esriCTKilometers: "Kilometers"
        },
        attributeParameter: {
             minText: "Min",
             maxText: "Max"
            },
        hintText: {
            bussinessesLayerText: "Hint: Select Business layer.",
            accessPointLayerText: "Hint: Select minimum one Access Point Layer.",
            routeLengthUnitText: "Hint: Specify a label for route length unit. Please note this should be set to basemap's linear distance units.",
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
            routeNameFieldText: "Hint: Select route name Field",
            saveBussinessText: "Hint: Select field of route layer to save business count.",
            saveBusinessNameField: "Hint: Select route name  field for corresponding business Field.",
            exportToCSVText: "Hint: Select this option to export business results to CSV.",
            imageHeightText: "Hint: Specify numeric value for Image Height.",
            imageWidthText: "Hint: Specify numeric value for Image Width.",
            imageTimeoutText: "Hint: Specify numeric value for Image Timeout."
        },
        invalidURL: " Please enter valid ",
        allowToUserInput: "Allow user input",
        defaultToValue: "Default to value",
        valueText: "Value",
        lblAttributeParameterValues: "Attribute Parameter Values",
        defaultDataDictionaryValue: "Prohibited,Avoid_High,Avoid_Medium,Avoid_Low,Prefer_Low,Prefer_Medium,Prefer_High"
    }
});