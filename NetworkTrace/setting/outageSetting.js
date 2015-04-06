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
            this.outageNode = domConstruct.toDom(this.templateString).childNodes[0];
            on(this.outageDiv, "click", lang.hitch(this, function (evt) {
                this.outageFieldClicked(this);
            }));
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
        outageParamChanged: function (evt) {
            return;
        },

        /**
        * This function is called to display outage task details.
        * @memberOf widgets/isolation-trace/settings/outageSetting
        */
        displayOutageData: function (showFieldMap) {
            var divOutageParam, visibleCheckBoxDiv, outageAreaDropDownValue = [], i, self,
                k, checkBoxStatus, e, visibleConfigData;
            this.paramNameValue = [];


            if (this.outageData) {
                domConstruct.empty(this.outageData);
            }
            // looping for output parameter array for fetching data which have "esriGeometryPolygon" geometrytype
            // this.paramNameValue.length = 0;
            for (k = 0; k < this.data.length; k++) {
                // Checking for output Parameters Array, default value and gemetry type
                if (this.data[k] && this.data[k].defaultValue && this.data[k].defaultValue.geometryType) {
                    //Push parameter name into array  whose geometry type is "esriGeometryPolygon"
                    if (this.data[k].defaultValue.geometryType === "esriGeometryPolygon") {
                        outageAreaDropDownValue.push(this.data[k].name);
                    } else {
                        // Checking for "GPFeatureRecordSetLayer" data type for showing param name in drop down
                        if (this.data[k].dataType === "GPFeatureRecordSetLayer") {
                            this.paramNameValue.push(this.data[k].name);
                        }
                    }
                }
            }
            divOutageParam = domConstruct.create("div", { "class": "esriCTImagePath field" }, this.outageData);
            domConstruct.create("label", { "class": "esriCTImg esriCTLayoutLeft", "innerHTML": this.nls.outagePanel.outageParameter, "title": this.nls.outagePanel.outageParameter }, divOutageParam);
            this.outageAreaDropDown = new Select({ "class": "esriCTOutageAreaParamValue" }, domConstruct.create("input", {}, divOutageParam));
            domConstruct.create("div", { "class": "esriCTExample fieldMarginHint", "innerHTML": this.nls.hintText.outageParamHint }, divOutageParam);
            // Looping for getting outage area value
            for (i = 0; i < outageAreaDropDownValue.length; i++) {
                this.outageAreaDropDown.addOption({
                    value: outageAreaDropDownValue[i],
                    label: outageAreaDropDownValue[i],
                    selected: false
                });
            }

            visibleCheckBoxDiv = domConstruct.create("div", {
                "class": "field"
            }, this.outageData);
            domConstruct.create("label", {
                "class": "esriCTImg esriCTLayoutLeft",
                "innerHTML": this.nls.outagePanel.isvisible,
                "title": this.nls.outagePanel.isvisible
            }, visibleCheckBoxDiv);

            checkBoxStatus = false;
            // Checking for output in geoprocessing
            if (this.outageConfig) {
                // looping for geoprocessing outputs
                for (e = 0; e < this.outageConfig.length; e++) {
                    // If geoprocessing outputs type is overview then change the config value in check box
                    if (this.outageConfig[e].type === "Overview") {
                        visibleConfigData = this.outageConfig && this.outageConfig[e].visible ? this.outageConfig[e].visible : "";
                        checkBoxStatus = visibleConfigData === "" ? false : true;
                    }
                }
            }
            this.visibleCheckBox = new CheckBox({ checked: checkBoxStatus }, domConstruct.create("div", {}, visibleCheckBoxDiv));
            this.visibleCheckBox.title = this.nls.outagePanel.isvisible;
            domConstruct.create("div", { "class": "esriCTExample", "innerHTML": this.nls.hintText.visibilityHint }, visibleCheckBoxDiv);

            if (showFieldMap) {
                this.outageAreaDropDown.set("value", this.outageLayerName);
                this.showFieldMapDiv(this.outageLayerName);
            } else {
                if (this.divParamvalue) {
                    domConstruct.empty(this.divParamvalue);
                }
            }

            self = this;
            this.outageAreaDropDown.on('change', function (evt) {
                if (self.outageLayerName) {
                    self.showFieldMapDiv(self.outageLayerName);
                } else {
                    if (self.divParamvalue) {
                        domConstruct.empty(self.divParamvalue);
                    }
                }
                self.outageParamChanged(self);
            });
        },

        /**
        * This function shows the field mapping
        * @param {object} outageLayerName
        * @memberOf widgets/isolation-trace/settings/outageSetting
        **/
        showFieldMapDiv: function (outageLayerName) {
            var layer, keyValue, i, j, t, k, outageAreaParamValue, outPutArrayLength, outageAreaFieldNameDropDown, self, fieldMap, e, index, arrayIndex, divFieldValue, divParamValue;
            // Calling find layer function to get layer from selected layer name
            layer = this.findLayer(this.map.itemInfo.itemData.operationalLayers, outageLayerName);
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

                if (this.outageConfig) {
                    // looping for geoprocessing outputs
                    for (e = 0; e < this.outageConfig.length; e++) {
                        // If geoprocessing outputs type is overview then change the config value in check box
                        if (this.outageConfig[e].type === "Overview" && this.outageConfig[e].fieldMap && this.outageConfig[e].fieldMap.length > 0) {
                            if (this.outageAreaDropDown.value === this.outageConfig[e].paramName) {
                                fieldMap = this.outageConfig[e].fieldMap;
                            }
                        }
                    }
                }
                self = this;
                outPutArrayLength = this.data.length - 1;
                array.forEach(this.data, lang.hitch(this, function (outPutArray, indexNumber) {
                    // Checking for array to execute not for the last index
                    if (outPutArrayLength !== indexNumber) {
                        divFieldValue = domConstruct.create("div", { "class": "esriCTOutageFieldParams" }, this.divParamvalue);
                        domConstruct.create("label", { "class": "esriCTFieldName ", "innerHTML": this.nls.outagePanel.OutageFieldName, "title": this.nls.outagePanel.OutageFieldName }, divFieldValue);
                        outageAreaFieldNameDropDown = new Select({ "class": "esriCTOutageAreaFieldName" }, domConstruct.create("input", {}, divFieldValue));
                        domConstruct.create("div", { "class": "esriCTExample", "innerHTML": this.nls.hintText.fieldNameHint }, divFieldValue);
                        domAttr.set(outageAreaFieldNameDropDown, "index", indexNumber);
                        outageAreaFieldNameDropDown.title = this.nls.outagePanel.OutageFieldName;
                        divParamValue = domConstruct.create("div", { "class": "esriCTOutageFieldParams" }, this.divParamvalue);
                        domConstruct.create("label", { "class": "esriCTParamValue", "innerHTML": this.nls.outagePanel.OutageParamName, "title": this.nls.outagePanel.OutageParamName }, divParamValue);
                        outageAreaParamValue = new Select({ "class": "esriCTOutageAreaParamValue" }, domConstruct.create("input", {}, divParamValue));
                        domConstruct.create("div", { "class": "esriCTExample", "innerHTML": this.nls.hintText.paramNameHint }, divParamValue);
                        domAttr.set(outageAreaParamValue, "index", indexNumber);
                        outageAreaParamValue.title = this.nls.outagePanel.OutageFieldName;
                        outageAreaParamValue.removeOption();
                        // Looping for getting outage area value
                        for (i = 0; i < this.paramNameValue.length; i++) {
                            outageAreaParamValue.addOption({
                                value: this.paramNameValue[i],
                                label: this.paramNameValue[i],
                                selected: false
                            });
                            if (fieldMap && fieldMap.length > 0) {
                                if (fieldMap && fieldMap.length > 0) {
                                    outageAreaParamValue.set({
                                        value: fieldMap[indexNumber].paramName,
                                        label: fieldMap[indexNumber].paramName
                                    });
                                }
                            }
                        }
                        // looping key value  array for setting outage field name drop down
                        for (j = 0; j < keyValue.length; j++) {
                            outageAreaFieldNameDropDown.addOption({ value: keyValue[j], label: keyValue[j] });
                            if (fieldMap && fieldMap.length > 0) {
                                outageAreaFieldNameDropDown.set({
                                    value: fieldMap[indexNumber].fieldName,
                                    label: fieldMap[indexNumber].fieldName
                                });
                            }
                        }
                        // setting the param name object and param name array
                        this.paramNameObject = { "index": indexNumber, "value": outageAreaParamValue.value };
                        this.paramNameArray.push(this.paramNameObject);
                        this.fieldName = { "index": indexNumber, "value": outageAreaFieldNameDropDown.value };
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
                        // onchange event of outage area param value
                        outageAreaParamValue.on('change', function (evt) {
                            index = this.index;
                            for (k = 0; k < self.paramNameArray.length; k++) {
                                if (self.paramNameArray[k].index === index) {
                                    arrayIndex = k;
                                    break;
                                }
                            }
                            //removing  array which is matched
                            self.paramNameArray.splice(arrayIndex, 1);
                            self.paramNameObject = { "index": index, "value": evt };
                            self.paramNameArray.push(self.paramNameObject);
                        });
                    }
                }));
            }
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
                    // Checking for param name array index and fiel name array index and creating new fiel map array object to set value in config
                    if (this.paramNameArray[p].index === this.fieldNameArray[q].index) {
                        fieldMapedObject = { "fieldName": this.fieldNameArray[p].value, "paramName": this.paramNameArray[q].value };
                        fieldMapedArray.push(fieldMapedObject);
                        break;
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
