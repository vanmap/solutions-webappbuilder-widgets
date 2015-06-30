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
        lblBusinessesLayer: "Businesses layer",
        lblAccessPointLayers: "Access point layers",
        lblForRouteLengthUnits: "Label for route length units",
        lblFieldTobeDisplayed: "Field to be displayed in business list",
        captionServiceAreaParameters: "Service area parameters",
        lblBufferDistanceToGenerateServiceArea: "Buffer distance to generate service area",
        lblBufferUnits: "Buffer units",
        captionClosestFacilityParameters: "Closest facility parameters",
        lblClosestFacilityServiceUrl: "Closest facility service URL",
        btnSet: "Set",
        btnRefresh: "Refresh",
        lblFacilitySearchDistance: "Facility search distance",
        lblImpedanceAttribute: "Impedance attribute",
        lblDefaultCutOffDistance: "Default cut off distance",
        captiveAttributeLookup: "Attribute lookup",
        lblAttributeParamLookup: "Attribute parameter value lookup",
        captionSaveResults: "Target layers to save results to layer",
        lblRouteLayer: "Route layer",
        lblRouteLength: "Field to save route length",
        lblBusinessCount: "Field to save business count",
        captionExportCSV: "Export to CSV",
        FieldmMappingText: "Route-Business attribute transfer",
        RoutLayerField: "Route layer field",
        BussinessLayerField: "Business layer field",
        symbol: {
            barrier: "Barrier symbols",
            location: "Location symbol",
            route: "Route symbol",
            buffer: "Buffer symbol",
            business: "Business symbol",
            pointBarrierSymbol: "Point barrier symbol",
            lineBarrierSymbol: "Line barrier symbol",
            polygonBarrierSymbol: "Polygon barrier symbol",
            pointLocationSymbol: "Point location symbol",
            businessSymbol: "Business symbol",
            routeSymbol: "Route symbol",
            bufferSymbol: "Buffer symbol"
        },
        highlighter: {
            highlighterSection: "Highlighter image",
            imageUplaod: "Image",
            imageHeight: "Height",
            imageWidth: "Width",
            imageHighlightTimeout: "Timeout",
            pixel: "(Pixels)",
            milliseconds: "(Milliseconds)"
        },
        validationErrorMessage: {
            routeLengthErr: "Please specify ",
            greaterThanZeroMessage: " should be numeric value greater than 0.",
            highlighterImageErr: "Please select highlighter image.",
            andText: " and ",
            diffText: " should be different.",
            nullValueErr: "Specify numeric ${0} value ",
            valueNumberOnlyErr: "${0} value should be numeric only. ",
            minValueErr: "Maximum value should be greater than minimum value.",
            invalidClosestFacilityTask: "Please enter valid ",
            accessPointCheck: "No access point layers available to continue.",
            checkGeometryType: "Geometry type of target",
            BusinessGeometryType: " should be same as the geometry type of ",
            valueCharErr: "${0} value should be numeric only.",
            specifyText: "Specify",
            blankLayerErr: "Specify businesses layer and route layer.",
            NoLayersInWebMap: "No business layer available to continue.",
            defaultAttrLookupParamValueMsg: "Unsaved changes in attribute parameter lookup. Please refresh.",
            emptyLookupParamValueErr : "Lookup parameters cannot be empty.",
            minValueErrorLabel: "minimum",
            maxValueErrorLabel: "maximum",
            defaultValueErrorLabel: "default",
            NoFieldsInBusinessLayer: "No field to display as a title in result business list."
        },
        esriUnit: {
            esriCTMeters: "Meters",
            esriCTMiles: "Miles",
            esriCTFeets: "Feet",
            esriCTKilometers: "Kilometers"
        },
        attributeParameter: {
             minText: "Min",
             maxText: "Max"
            },
        hintText: {
            bussinessesLayerText: "Hint: Select business layer.",
            accessPointLayerText: "Hint: Select minimum one access point layer.",
            routeLengthUnitText: "Hint: Specify a label for route length unit. Please note this should be set to basemap's linear distance units.",
            bussinessListText: "Hint: Select desired business list field.",
            bufferDistanceText: "Hint: Specify a numeric value for buffer distance.",
            bufferUnitsText: "Hint: Select buffer unit.",
            closestFacilityText: "Hint: Specify the URL of closest facility.",
            facilitySearchDistanceText: "Hint: Specify a numeric value for facility search distance.",
            impedanceText: "Hint: Select impedance attribute.",
            cuttOffDistanceText: "Hint: Specify a numeric value for cut off distance.",
            lookupText: "Hint: Lookup for values if data type of attribute parameter is not an integer or a double.",
            lookupTextOnSet: "Click on 'Refresh' button to update 'Attribute parameter values' in 'Closest facility parameters' section.",
            AttributeParameterValueText1: "Hint: Minimum and maximum values should be numeric only.",
            AttributeParameterValueText2: "Configure attribute parameters from closest facility task",
            bussinessLayerText: "Hint: Select a results business layer whose geometry type is same as the business layer.",
            routeLayerText: "Hint: Select route layer.",
            routeLengthText: "Hint: Select field of route layer to save route length.",
            routeNameFieldText: "Hint: Select route name field",
            saveBussinessText: "Hint: Select field of route layer to save business count.",
            saveBusinessNameField: "Hint: Select route name  field for corresponding business field.",
            exportToCSVText: "Hint: Select this option to export business results to CSV.",
            imageHeightText: "Hint: Specify numeric value for image height.",
            imageWidthText: "Hint: Specify numeric value for image width.",
            imageTimeoutText: "Hint: Specify numeric value for highlight animation timeout.",
            selectImageHintText: "Hint: Please click on the image to select any other highlighter image."
        },
        invalidURL: " Please enter a valid ",
        allowToUserInput: "Allow user input",
        defaultToValue: "Default to value",
        valueText: "Value",
        lblAttributeParameterValues: "Attribute parameter values",
        defaultDataDictionaryValue: "Prohibited,Avoid_High,Avoid_Medium,Avoid_Low,Prefer_Low,Prefer_Medium,Prefer_High",
    }
});