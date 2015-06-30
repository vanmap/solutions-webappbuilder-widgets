/*global define,dojo,dijit,dojoConfig,alert,dojox,console */
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
define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/query",
    "dojo/on",
    "dojo/parser",
    "dojo/dom-attr",
    "dojo/string",
    "jimu/dijit/CheckBox",
    "dijit/form/Select",
    "dojo/_base/array",
    "dojo/text!./outageSetting.html",
    "jimu/dijit/SymbolChooser",
    "jimu/utils",
    "esri/symbols/jsonUtils",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin"

], function (
    declare,
    lang,
    domConstruct,
    dom,
    domClass,
    query,
    on,
    parser,
    domAttr,
    string,
    CheckBox,
    Select,
    array,
    outageSetting,
    SymbolChooser,
    utils,
    jsonUtils,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: outageSetting,
        paramNameArray: [],
        paramNameValue: [],
        outageAreaLayerSaveOption: false,
        startup: function () {
            this.inherited(arguments);
        },
        postCreate: function () {
            this._createOutagePanel();
        },

        /**
        * This function is called to create outage left panel and right container.
        * @memberOf widgets/isolation-trace/settings/outageSetting
        */
        _createOutagePanel: function () {
            this.esriUnit = [{ label: this.nls.outagePanel.esriMeters, value: 9001 }, { label: this.nls.outagePanel.esriMiles, value: 9030 }, { label: this.nls.outagePanel.esriFeets, value: 9002 }, { label: this.nls.outagePanel.esriKilometers, value: 9036}];
            this._createEsriUnitDropdown();
            this._addSaveToLayerOptions();
            this._setConfigParameters();
            this._createSymbolInput();
            this.own(on(this.outputLayer, "click", lang.hitch(this, this._onLayerChange)));
            on(this.outputLayerType, "change", lang.hitch(this, function (evt) {
                if (!domClass.contains(this.selectOutputLayerType, "esriCTHidden")) {
                    this.displayOutageData(false);
                } else {
                    if (this.outageData) {
                        domConstruct.empty(this.outageData);
                    }
                }
            }));
        },

        /**
        * This function creates output config parameters.
        * @memberOf widgets/isolation-trace/settings/outputSetting
        */
        getOverviewForm: function () {
            var cloneFieldMapArray, fieldMapArray, overviewParam;
            cloneFieldMapArray = "";
            // Getting the field map array value from all drop down value
            fieldMapArray = this.getOutageConfig();
            // Cloning the feld map array for storing it in field to map value
            cloneFieldMapArray = lang.clone(fieldMapArray);
            overviewParam = {
                "visibility": this.visible.checked ? true : false,
                "type": "Overview",
                "BufferDistance": this.overviewBufferDistance.value,
                "Unit": this.esriUnits.value,
                "MinScale": this.outputMinScaleData.value,
                "MaxScale": this.outputMaxScaleData.value,
                "saveToLayer": this.outputLayer.checked ? this.outputLayerType.value : "",
                "symbol": this.symbolChooser.getSymbol().toJson(),
                "fieldMap": cloneFieldMapArray
            };
            return overviewParam;
        },

        _setConfigParameters: function () {
            var i;
            // if output config object is not null
            if (this.overviewConfig) {
                if (this.overviewConfig.visibility) {
                    this.visible.checked = true;
                    domClass.add(this.visible.checkNode, "checked");
                }
                this.outputMinScaleData.set("value", ((this.overviewConfig && this.overviewConfig.MinScale) ? this.overviewConfig.MinScale : 0));
                this.outputMaxScaleData.set("value", ((this.overviewConfig && this.overviewConfig.MaxScale) ? this.overviewConfig.MaxScale : 0));
                this.overviewBufferDistance.set("value", ((this.overviewConfig && this.overviewConfig.BufferDistance) ? this.overviewConfig.BufferDistance : 0));
                // loop for setting selected target Layer
                for (i = 0; i < this.outputLayerType.options.length; i++) {
                    // if layers in dropdown is same as already the parameter that exist in the configuration
                    if (this.outputLayerType.options[i].value === this.overviewConfig.saveToLayer) {
                        this.outputLayerType.set("value", this.outputLayerType.options[i].value);
                    }
                }
                // validate whether save to layer parameter is available in configuration
                if (this.overviewConfig.saveToLayer) {
                    this.outputLayer.checked = this.overviewConfig.saveToLayer;
                    domClass.add(this.outputLayer.checkNode, "checked");
                    domClass.remove(this.selectOutputLayerType, "esriCTHidden");
                }

                if (this.overviewConfig.Unit) {
                    for (i = 0; i < this.esriUnits.options.length; i++) {
                        if (this.esriUnits.options[i].value === this.overviewConfig.Unit) {
                            this.esriUnits.set("value", this.esriUnits.options[i].value);
                        }
                    }
                }

            }
        },

        /**
        * This function is called to change the save layer status.
        * @memberOf widgets/isolation-trace/settings/outputSetting
        **/
        _onLayerChange: function (evt) {
            var targetLayerDiv;
            //this.outageArea.isChecked = this.outputLayer.checked;
            // if evt object and parent exist then toggle hide/show of target layer dropdown
            if (evt && evt.currentTarget && evt.currentTarget.offsetParent && evt.currentTarget.offsetParent.parentNode) {
                targetLayerDiv = query(".outputTargetLayer", evt.currentTarget.offsetParent.parentNode);
                domClass.toggle(targetLayerDiv[0], "esriCTHidden");
                if (!domClass.contains(targetLayerDiv[0], "esriCTHidden")) {
                    this.displayOutageData(false);
                } else {
                    if (this.outageData) {
                        domConstruct.empty(this.outageData);
                    }
                }
            }
        },
        _createSymbolInput: function () {
            var objSymbol, geometryType;
            geometryType = "esriGeometryPolygon";
            //if symbol geometry exist
            if (geometryType) {
                this.data.featureSetMode = 'draw';
                objSymbol = {};
                // if symbols parameter available in input parameters then takes symbol details
                // otherwise using geometry type for fetching the symbol details
                if (this.overviewConfig && this.overviewConfig.symbol) {
                    objSymbol.symbol = jsonUtils.fromJson(this.overviewConfig.symbol);
                } else {
                    // if symbols parameter is available in input parameters then set the symbol details
                    // otherwise using geometry type for fetching the symbol details
                    if (this.data.symbol) {
                        objSymbol.symbol = jsonUtils.fromJson(this.data.symbol);
                    } else {
                        objSymbol.type = utils.getSymbolTypeByGeometryType(geometryType);
                    }
                }
                this.symbolChooser = new SymbolChooser(objSymbol, domConstruct.create("div", {}, this.symbolData));
                this.symbolChooser.startup();
            }
        },

        _addSaveToLayerOptions: function () {
            var n, operationalLayers;
            // save to Layer type Dropdown
            if (this.map && this.map.itemInfo && this.map.itemInfo.itemData && this.map.itemInfo.itemData.operationalLayers) {
                this.outputLayerType.startup();
                operationalLayers = this.map.itemInfo.itemData.operationalLayers;
                // loop's populates Dropdown values
                for (n = 0; n < operationalLayers.length; n++) {
                    // if layer type is feature Layer then
                    if (operationalLayers[n].layerType && operationalLayers[n].layerType === "ArcGISFeatureLayer" && operationalLayers[n].resourceInfo && operationalLayers[n].resourceInfo.capabilities && this._validateLayerCapabilities(operationalLayers[n].resourceInfo.capabilities) && operationalLayers[n].layerObject.geometryType === "esriGeometryPolygon") {
                        // for first index of loop set default value
                        if (n === 0) {
                            domAttr.set(this.outputLayer, "value", operationalLayers[n].id);
                        }
                        this.outputLayerType.addOption({
                            value: operationalLayers[n].id,
                            label: operationalLayers[n].title,
                            selected: false
                        });
                    }
                }
            }
        },

        _validateLayerCapabilities: function (layerCapabilities) {
            // if layer has capability of create & update than return true
            if (layerCapabilities && layerCapabilities.indexOf("Create") > -1 && layerCapabilities.indexOf("Update") > -1) {
                return true;
            }
            // if layer has capability of create & editing than return true
            if (layerCapabilities && layerCapabilities.indexOf("Create") > -1 && layerCapabilities.indexOf("Editing") > -1) {
                return true;
            }
            return false;
        },

        /**
        * This function is called to handle the click event on left outage click.
        * @memberOf widgets/isolation-trace/settings/outageSetting
        */
        outageFieldClicked: function (widgetNode) {
            return;
        },

        /**
        * This function is called handle the outage parameter change in outage area dropdown.
        * @memberOf widgets/isolation-trace/settings/outageSetting
        */
        outageParamChanged: function () {
            return;
        },

        _createEsriUnitDropdown: function () {
            var i;
            for (i = 0; i < this.esriUnit.length; i++) {
                if (this.esriUnit[i].value === 9002) {
                    this.esriUnits.addOption({
                        value: this.esriUnit[i].value,
                        label: this.esriUnit[i].label,
                        selected: true
                    });
                } else {
                    this.esriUnits.addOption({
                        value: this.esriUnit[i].value,
                        label: this.esriUnit[i].label
                    });
                }
            }
        },
        /**
        * This function is called to display outage task details.
        * @memberOf widgets/isolation-trace/settings/outageSetting
        */
        displayOutageData: function (showFieldMap) {
            var k;
            this.paramNameValue = [];
            if (this.outageData) {
                domConstruct.empty(this.outageData);
            }
            // looping for output parameter array for fetching data which have "esriGeometryPolygon" geometrytype
            // this.paramNameValue.length = 0;
            for (k = 0; k < this.data.length; k++) {
                // Checking for output Parameters Array, default value and gemetry type
                if (this.data[k] && this.data[k].defaultValue && this.data[k].defaultValue.geometryType) {
                    // Checking for "GPFeatureRecordSetLayer" data type for showing param name in drop down
                    if (this.data[k].dataType === "GPFeatureRecordSetLayer") {
                        this.paramNameValue.push(this.data[k].displayName);
                    }
                }
            }
            this.showFieldMapDiv();
        },

        /**
        * This function shows the field mapping
        * @param {object} outageLayerName
        * @memberOf widgets/isolation-trace/settings/outageSetting
        **/
        showFieldMapDiv: function (outageLayerName) {
            var layer, keyValue, j, t, outageAreaFieldNameDropDown, self, fieldMap, index, arrayIndex, divFieldValue, fieldsetDiv, selectOptionsArray = [],
                selectOptionsObject = {};
            // Calling find layer function to get layer from selected layer name
            layer = this.findLayer(this.map.itemInfo.itemData.operationalLayers, this.outputLayerType.value);
            this.paramNameArray = [];
            this.fieldNameArray = [];
            // Checking for layer
            if (layer) {
                // Setting the field name attribute
                keyValue = [];
                keyValue = this._getAttributesFromLayer(layer);
                // Empty the field mapped div
                if (this.divParamvalue) {
                    domConstruct.empty(this.divParamvalue);
                }
                //Create a dropdown control for Field Name and Parameter Name
                this.divParamvalue = domConstruct.create("div", { "class": "esriCTOutageField field" }, this.outageData);
                self = this;
                fieldsetDiv = domConstruct.create("fieldset", { "class": "esriCTFieldset" }, this.divParamvalue);
                domConstruct.create("legend", { "class": "esriCTFieldMappingLegend", "innerHTML": this.nls.outagePanel.outageFieldTagName }, fieldsetDiv);
                domConstruct.create("div", { "class": "esriCTFieldMappingHint", "innerHTML": this.nls.outagePanel.fieldMappingHint_1 }, fieldsetDiv);
                domConstruct.create("div", { "class": "esriCTFieldMappingHint", "innerHTML": this.nls.outagePanel.fieldMappingHint_2 }, fieldsetDiv);
                // Setting select option for field mapping, First option is set to be none
                selectOptionsObject.value = 0;
                selectOptionsObject.label = this.nls.outagePanel.outageNoneText;
                selectOptionsObject.selected = true;
                selectOptionsArray.push(selectOptionsObject);
                // Looping for field key value to create drop down values for field value
                for (j = 0; j < keyValue.length; j++) {
                    selectOptionsObject = {};
                    selectOptionsObject.value = keyValue[j];
                    selectOptionsObject.label = keyValue[j];
                    selectOptionsObject.selected = false;
                    selectOptionsArray.push(selectOptionsObject);
                }
                // Looping for param name value
                array.forEach(this.paramNameValue, lang.hitch(this, function (paramName, i) {
                    // Creation of div and select
                    fieldMap = "";
                    divFieldValue = domConstruct.create("div", { "class": "esriCTOutageFieldParams" }, fieldsetDiv);
                    domConstruct.create("label", { "class": "esriCTFieldName ", "innerHTML": paramName, "title": paramName }, divFieldValue);
                    outageAreaFieldNameDropDown = new Select({ "class": "esriCTOutageAreaFieldName" }, domConstruct.create("input", {}, divFieldValue));
                    domConstruct.create("div", { "class": "esriCTFieldMapPadding", "innerHTML": this.nls.hintText.fieldNameHint }, divFieldValue);
                    outageAreaFieldNameDropDown.options = selectOptionsArray;
                    domAttr.set(outageAreaFieldNameDropDown, "index", i);
                    outageAreaFieldNameDropDown.title = this.nls.outagePanel.OutageFieldName;
                    // Setting none text to defalue item value in drop down
                    outageAreaFieldNameDropDown.set({
                        value: selectOptionsArray[0].value,
                        label: selectOptionsArray[0].label
                    });
                    // Getting the field maped config
                    fieldMap = this._getFieldMapConfig(paramName);
                    // If field map config exsists; set the field name from field map config
                    if (fieldMap !== "") {
                        outageAreaFieldNameDropDown.set({
                            value: fieldMap.fieldName,
                            label: fieldMap.fieldName
                        });
                    }
                    // setting the param name object and param name array
                    this.paramNameObject = { "index": i, "value": paramName };
                    this.paramNameArray.push(this.paramNameObject);
                    this.fieldName = { "index": i, "value": outageAreaFieldNameDropDown.value };
                    this.fieldNameArray.push(this.fieldName);
                    // onchange event of outage area field name drop down
                    outageAreaFieldNameDropDown.on('change', function (evt) {
                        index = this.index;
                        for (t = 0; t < self.fieldNameArray.length; t++) {
                            if (self.fieldNameArray[t].index === index) {
                                arrayIndex = t;
                                break;
                            }
                        }
                        self.fieldNameArray.splice(arrayIndex, 1);
                        self.fieldName = { "index": index, "value": evt };
                        self.fieldNameArray.push(self.fieldName);
                    });
                }));
            }
        },

        /**
        * This function gets the field map array
        * @param {string} paramNameValue param name
        * @return {object} returns fieldMap
        * @memberOf widgets/isolation-trace/settings/outageSetting
        **/
        _getFieldMapConfig: function (paramNameValue) {
            var fieldMap = "", e;
            if (this.overviewConfig) {
                // looping for geoprocessing outputs
                for (e = 0; e < this.overviewConfig.fieldMap.length; e++) {
                    // If geoprocessing outputs type is overview then change the config value in check box
                    if (this.overviewConfig.fieldMap[e]) {
                        if (this.overviewConfig.fieldMap[e].paramName === paramNameValue) {
                            fieldMap = this.overviewConfig.fieldMap[e];
                        }
                    }
                }
            }
            return fieldMap;
        },

        /**
        * This function gets the attributes from layer
        * @param {object} layer the object of layer
        * @return {object} returns the object of layer
        * @memberOf widgets/isolation-trace/settings/outageSetting
        **/
        _getAttributesFromLayer: function (layer) {
            var layerObject = [], i, isFieldTypeFound;
            // Checking for layer object
            if (layer && layer.layerObject && layer.layerObject.fields) {
                // Looping for layer object field
                for (i = 0; i < layer.layerObject.fields.length; i++) {
                    isFieldTypeFound = true;
                    // Checking for layer object fields type
                    if (layer.layerObject.fields[i].type === "esriFieldTypeOID") {
                        isFieldTypeFound = false;
                    }
                    // Checking for layer object fields type
                    if (layer.layerObject.fields[i].type === "esriFieldTypeGlobalID") {
                        isFieldTypeFound = false;
                    }
                    // pushing key value in array
                    if (isFieldTypeFound) {
                        layerObject.push(layer.layerObject.fields[i].name);
                    }
                }
            }
            return layerObject;
        },

        /**
        * This function is called to change the skippable status.
        * @return {object} returns the field to map array
        * @memberOf widgets/isolation-trace/settings/outageSetting
        **/
        getOutageConfig: function () {
            var fieldMapedArray = [], fieldMapedObject = {}, p, q;

            // Looping param name array for matching and getting value from field name array
            for (p = 0; p < this.paramNameArray.length; p++) {
                for (q = 0; q < this.fieldNameArray.length; q++) {
                    if (this.fieldNameArray[q].value !== 0) {
                        // Checking for param name array index and fiel name array index and creating new fiel map array object to set value in config
                        if (this.paramNameArray[p].index === this.fieldNameArray[q].index) {
                            fieldMapedObject = { "fieldName": this.fieldNameArray[q].value, "paramName": this.paramNameArray[p].value };
                            fieldMapedArray.push(fieldMapedObject);
                            break;
                        }
                    }
                }
            }
            return fieldMapedArray;
        },

        /**
        * This function is called to change the skippable status.
        * @returns {object} returns the layer object
        * @memberOf widgets/isolation-trace/settings/outageSetting
        **/
        findLayer: function (layers, layerId) {
            var result = null;
            // Looping for layer object and fetching the layer object
            array.some(layers, function (layer) {
                if (layer.id !== null) {
                    if (layer.id === layerId) {
                        result = layer;
                    }
                }
            });
            return result;
        }
    });
});
