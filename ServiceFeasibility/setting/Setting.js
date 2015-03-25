/*global define,dojo,alert,dijit, console */
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
define([
    'dojo/_base/declare',
    'jimu/BaseWidgetSetting',
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    'dijit/_WidgetsInTemplateMixin',
    'dojox/validate/regexp',
    "esri/request",
    "dojo/_base/lang",
    "dijit/TitlePane",
    "dojo/store/Memory",
    "dijit/tree/ObjectStoreModel",
    "dijit/Tree",
    "dojo/dom-construct",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/_base/html",
    "dojo/query",
    "dojo/on",
    "dojo/parser",
    "dojo/dom-attr",
    "dojo/string",
    "jimu/dijit/CheckBox",
    "jimu/dijit/SymbolChooser",
    "jimu/utils",
    "esri/symbols/jsonUtils",
    "dijit/form/TextBox",
    "dijit/form/ValidationTextBox",
    "dijit/form/NumberTextBox",
    "dijit/form/Select",
    "dijit/form/NumberSpinner",
    "dojo/_base/array",
    "dijit/form/RadioButton",
    "dojo/window",
    "jimu/dijit/Message",
    "./attribute-parameter",
    "jimu/dijit/ImageChooser",
    "dojo/domReady!"

], function (
    declare,
    BaseWidgetSetting,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    regexp,
    esriRequest,
    lang,
    TitlePane,
    Memory,
    ObjectStoreModel,
    Tree,
    domConstruct,
    dom,
    domClass,
    html,
    query,
    on,
    parser,
    domAttr,
    string,
    CheckBox,
    SymbolChooser,
    utils,
    jsonUtils,
    TextBox,
    ValidationTextBox,
    NumberTextBox,
    Select,
    NumberSpinner,
    array,
    RadioButton,
    Window,
    Message,
    AttributeParameter,
    ImageChooser
) {
    return declare([BaseWidgetSetting, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        baseClass: 'jimu-widget-ServiceFeasbility-setting',
        operationalLayers: null,
        ImageChooser: null,
        attributeLookup: this.defaultDataDictionaryValue,
        ESRIBufferUnits: "UNIT_STATUTE_MILE, UNIT_FOOT,UNIT_KILOMETER,UNIT_METER,UNIT_NAUTICAL_MILE,UNIT_US_NAUTICAL_MILE,UNIT_DEGREE",
        startup: function () {
            this.inherited(arguments);
            if (this.map.itemInfo.itemData.operationalLayers.length === 0) {
                this._errorMessage(this.nls.operationalLayersErrorMessage);
            }

            this.operationalLayers = this.map.itemInfo.itemData.operationalLayers;
            this._initializeBusinessLayerSelect();
            this._initializeAccessPointLayersCheckboxes();
            this._initializeBufferUnitsSelect();
            this._addConfigParameters();
            this._onSetBtnClick();
            this._saveTargetLayerSelect();
            this._setClosestFacilityParams();
            this._createExportToCSV();
            this._createSymbol();
            this._createHighlighterImage();
        },

        /**
        * This function is used to add parameters from config file
        * @memberOf widgets/ServiceFeasibility/setting/Settings
        **/
        _addConfigParameters: function () {
            domConstruct.empty(query(".esriCTAttrParamContainer")[0]);
            var parameters;
            parameters = {
                "closestFacilityURL": this.config.closestFacilityURL,
                "nls": this.nls,
                "config": this.config
            };
            // if config object not null and attributes name & closestFacilityURL  available
            if (this.config && this.config.attributeName && this.config.closestFacilityURL) {
                this.closedFacilityServiceURL.value = this.config.closestFacilityURL;
            }
            this._attributeParameterObj = new AttributeParameter(parameters);
            this._attributeParameterObj.addConfigParameters();
        },

        /**
        * This function is used to show attribute paramaters on click of set button.
        * @memberOf widgets/ServiceFeasibility/setting/Settings
        **/
        _onSetBtnClick: function () {
            this.own(on(this.onSetBtnClick, 'click', lang.hitch(this, function (evt) {
                domConstruct.empty(query(".esriCTAttrParamContainer")[0]);
                var parameters;
                parameters = {
                    "closestFacilityURL": this.closedFacilityServiceURL.value,
                    "nls": this.nls
                };
                this._attributeParameterObj = new AttributeParameter(parameters);
                this._attributeParameterObj.validateClosestFacilityServiceURL();
            })));
        },


        /**
        * This function will add option in Business Layer select tag
        **/
        _initializeBusinessLayerSelect: function () {
            var i, j, k;
            // loop for creating Dropdown for business layer
            for (i = 0; i < this.operationalLayers.length; i++) {
                if (i === 0) {
                    this.businessIndex = i;
                }
                this.selectBusinessLayer.addOption({ label: this.operationalLayers[i].title, value: i, selected: false });
            }

            // check whether data for business layer in config exists
            if (this.config && this.config.businessesLayerName && this.selectBusinessLayer && this.selectBusinessLayer.options && this.selectBusinessLayer.options.length > 0) {
                // loop to set the selected option for business layer dropdown
                for (i = 0; i < this.selectBusinessLayer.options.length; i++) {
                    if (this.selectBusinessLayer.options[i].label === this.config.businessesLayerName) {
                        this.selectBusinessLayer.set("value", i);
                        this.businessIndex = i;
                        break;
                    }
                }
            }

            if (this.operationalLayers[0] && this.operationalLayers[0].layerObject && this.operationalLayers[0].layerObject.fields && this.operationalLayers[0].layerObject.fields.length > 0) {
                // loop to populate the fields of selected business layer in dropdown when widget added first time
                for (k = 0; k < this.operationalLayers[0].layerObject.fields.length; k++) {
                    //this.selectbusinessList.addOption({ label: this.operationalLayers[0].layerObject.fields[k].name, value: i });
                    this.selectbusinessList.addOption({ label: this.operationalLayers[0].layerObject.fields[k].name, value: this.operationalLayers[0].layerObject.fields[k].name });
                }
            }

            this.selectBusinessLayer.on("change", lang.hitch(this, function (index) {
                this.selectbusinessList.options.length = 0;
                var currentValue = this.selectBusinessLayer.value;
                // loop to change the field names on changing the business layer
                for (j = 0; j < this.operationalLayers[currentValue].layerObject.fields.length; j++) {
                    this.selectbusinessList.addOption({ label: this.operationalLayers[currentValue].layerObject.fields[j].name, value: this.operationalLayers[currentValue].layerObject.fields[j].name });
                }
                if (this.config && this.config.businessDisplayField && this.selectbusinessList && this.selectbusinessList.options && this.selectbusinessList.options.length > 0) {
                    // loop to set the business layer field name according to the value in config
                    for (i = 0; i < this.selectbusinessList.options.length; i++) {
                        if (this.selectbusinessList.options[i].value === this.config.businessDisplayField) {
                            this.selectbusinessList.set("value", this.selectbusinessList.options[i].value);
                            break;
                        }
                    }
                }
            }));
        },



        /**
        * This function will create checkboxes for Access point layers
        **/
        _initializeAccessPointLayersCheckboxes: function () {
            var i, j, divAccessPointLayerContainer, accessPointChecks, chkBoxTitle;
            this.checkedLayers = [];
            // loop to create check box and it's label for oprational layers
            for (i = 0; i < this.operationalLayers.length; i++) {
                divAccessPointLayerContainer = domConstruct.create("div");
                accessPointChecks = new CheckBox({
                    "id": this.operationalLayers[i].id + "checkbox"
                }, divAccessPointLayerContainer);
                domAttr.set(accessPointChecks.domNode, "title", this.operationalLayers[i].title);
                domConstruct.create("label", {
                    innerHTML: this.operationalLayers[i].title,
                    class: "esriCTCheckboxLabel"
                }, divAccessPointLayerContainer);
                domConstruct.place(divAccessPointLayerContainer, this.divAccessPointLayer);
                domClass.remove(accessPointChecks, "esriCTcheckedPointLayer");
                domClass.remove(accessPointChecks.checkNode, "checked");
                this._addEventToCheckBox(accessPointChecks);
                // if config object not null and accessPointsLayersName available
                if (this.config && this.config.accessPointsLayersName) {
                    chkBoxTitle = domAttr.get(accessPointChecks.domNode, "title");
                    // if config object not null and accessPointsLayersName length is greater than 1
                    if (this.config.accessPointsLayersName.split(",").length > 1) {
                        for (j = 0; j < this.config.accessPointsLayersName.split(",").length; j++) {
                            // if checkbox title and  accessPointsLayersName of this index are same
                            if (chkBoxTitle === this.config.accessPointsLayersName.split(",")[j]) {
                                accessPointChecks.checked = true;
                                domClass.add(accessPointChecks.checkNode, "checked");
                                domClass.add(accessPointChecks.domNode, "esriCTcheckedPointLayer");
                            }
                        }
                    } else {
                        // if checkbox title and accessPointsLayersName in config is same
                        if (chkBoxTitle === this.config.accessPointsLayersName) {
                            accessPointChecks.checked = true;
                            domClass.add(accessPointChecks.checkNode, "checked");
                            domClass.add(accessPointChecks.domNode, "esriCTcheckedPointLayer");
                            this.checkedLayers.push(accessPointChecks.domNode);
                        }
                    }
                    // if value doesn't exist in array
                    if (array.indexOf(this.checkedLayers, accessPointChecks.domNode) === -1) {
                        this.checkedLayers.push(accessPointChecks.domNode);
                    }
                }
            }
        },

        _addEventToCheckBox: function (checkBox) {
            var queryLayer;
            on(checkBox.domNode, "click", lang.hitch(this, function (event) {
                if (domClass.contains(event.target, "checked")) {
                    this.checkedLayers.push(event.currentTarget);
                    domClass.add(event.currentTarget, "esriCTcheckedPointLayer");

                } else if (array.indexOf(this.checkedLayers, event.currentTarget) !== -1) {
                    this.checkedLayers.splice(array.indexOf(this.checkedLayers, event.currentTarget), 1);
                    domClass.remove(event.currentTarget, "esriCTcheckedPointLayer");
                }
                if (!this.config.accessPointsLayersName) {
                    this.checkedAccessPointLayers = this.checkedLayers;
                } else {
                    queryLayer = query(".esriCTcheckedPointLayer");
                    this.checkedAccessPointLayers = queryLayer;
                }
            }));

        },

        /**
        * This function will create the buffer units select
        **/
        _initializeBufferUnitsSelect: function () {
            var i, ESRIBufferUnits;
            ESRIBufferUnits = this.ESRIBufferUnits.split(",");
            // loop to create the drop down for buffer units from config
            for (i = 0; i < ESRIBufferUnits.length; i++) {
                if (this.config && this.config.bufferEsriUnits) {
                    this.selectBufferUnits.set("value", this.config.bufferEsriUnits);
                }
                this.selectBufferUnits.addOption({ label: ESRIBufferUnits[i], value: ESRIBufferUnits[i] });
            }
            on(this.selectBufferUnits, "change", lang.hitch(this, function (value) {
                this.selectedBufferUnit = value;
            }));
        },

        /**
        * This function set the closest facility parameters
        **/
        _setClosestFacilityParams: function () {
            if (this.config && this.config.routeLengthLabelUnits) {
                this.txtRouteLength.set("value", this.config.routeLengthLabelUnits);
            }
            if (this.config && this.config.bufferDistance) {
                this.txtBufferDistance.set("value", this.config.bufferDistance);
            }
            if (this.config && this.config.bufferWKID) {
                this.txtBufferWkid.set("value", this.config.bufferWKID);
            }
            if (this.config && this.config.closestFacilityURL) {
                this.closedFacilityServiceURL.value = this.config.closestFacilityURL;
            }
            if (this.config && this.config.facilitySearchDistance) {
                this.txtFacilityDistance.set("value", this.config.facilitySearchDistance);
            }
            if (this.config && this.config.impedanceAttribute) {
                this.txtImpedenceAttribute.set("value", this.config.impedanceAttribute);
            }
            if (this.config && this.config.defaultCutoff) {
                this.txtdefaultCuttoff.set("value", this.config.defaultCutoff);
            }
            if (this.config && this.config.attributeValueLookup) {
                this.txtAttributeParam.set("value", "");
                this.txtAttributeParam.set("value", this.config.attributeValueLookup);
            }
        },

        /**
        * This function create checkbox and dropdown for saving business layer
        **/
        _saveTargetLayerSelect: function () {
            domConstruct.empty(this.businessLayerCheckbox);
            this.saveBusinessCheck = new CheckBox({ "title": this.nls.lblBusinessesLayer }, this.businessLayerCheckbox);
            domConstruct.create("label", {
                innerHTML: this.nls.lblBusinessesLayer,
                class: "esriCTTargetLayerLabel"
            }, this.saveBusinessLayerLabel);

            if (this.config && this.config.targetBusinessLayer) {
                this.saveBusinessCheck.checked = true;
                domClass.add(this.saveBusinessCheck.checkNode, "checked");
                domClass.remove(this.selectSaveBusinessLayerBlock, "esriCTHidden");
            }

            on(this.saveBusinessCheck, "click", lang.hitch(this, function (event) {
                if (domClass.contains(event.target, "checked")) {
                    domClass.remove(this.selectSaveBusinessLayerBlock, "esriCTHidden");
                } else {
                    domClass.add(this.selectSaveBusinessLayerBlock, "esriCTHidden");
                }
            }));

            this.saveRouteCheck = new CheckBox({ "title": this.nls.lblRouteLayer }, this.routeLayerCheckbox);
            domConstruct.create("label", {
                innerHTML: this.nls.lblRouteLayer,
                class: "esriCTTargetLayerLabel"
            }, this.saveRouteLayerLabel);

            if (this.config && this.config.targetRouteLayer) {
                this.saveRouteCheck.checked = true;
                domClass.add(this.saveRouteCheck.checkNode, "checked");
                domClass.remove(this.routeLayerCheck, "esriCTHidden");
                domClass.remove(this.selectrouteLayerBlock, "esriCTHidden");
            }

            on(this.saveRouteCheck, "click", lang.hitch(this, function (event) {
                if (domClass.contains(event.target, "checked")) {
                    domClass.remove(this.routeLayerCheck, "esriCTHidden");
                    domClass.remove(this.selectrouteLayerBlock, "esriCTHidden");
                } else {
                    domClass.add(this.routeLayerCheck, "esriCTHidden");
                    domClass.add(this.selectrouteLayerBlock, "esriCTHidden");
                }
            }));

            this.saveRouteLength = new CheckBox({ "title": this.nls.lblRouteLength }, this.routelengthCheckbox);
            domConstruct.create("label", {
                innerHTML: this.nls.lblRouteLength,
                class: "esriCTTargetLayerLabel"
            }, this.saveRouteLengthLabel);

            on(this.saveRouteLength, "click", lang.hitch(this, function (event) {
                if (domClass.contains(event.target, "checked")) {
                    domClass.remove(this.selectSaveRouteLength, "esriCTHidden");
                    domClass.remove(this.selectRouteLengthBlock, "esriCTHidden");
                } else {
                    domClass.add(this.selectSaveRouteLength, "esriCTHidden");
                    domClass.add(this.selectRouteLengthBlock, "esriCTHidden");
                }
            }));

            this.saveBusinessCount = new CheckBox({ "title": this.nls.lblBusinessCount }, this.businessCountCheckbox);
            domConstruct.create("label", {
                innerHTML: this.nls.lblBusinessCount,
                class: "esriCTTargetLayerLabel"
            }, this.businessCountLabel);

            on(this.saveBusinessCount, "click", lang.hitch(this, function (event) {
                if (domClass.contains(event.target, "checked")) {
                    domClass.remove(this.selectSaveBusinessCount, "esriCTHidden");
                    domClass.remove(this.selectBusinessCountBlock, "esriCTHidden");
                } else {
                    domClass.add(this.selectSaveBusinessCount, "esriCTHidden");
                    domClass.add(this.selectBusinessCountBlock, "esriCTHidden");
                }
            }));

            if (this.operationalLayers && this.operationalLayers[0] && this.operationalLayers[0].layerObject && this.operationalLayers[0].layerObject.fields && this.operationalLayers[0].layerObject.fields.length) {
                // loop to create options for route length and business count drop downs according to the layer selected in save route layer dropdown
                this._setRouteAttributeOptions(0, false);
            }

            if (this.config && this.config.saveRoutelengthField) {
                this.saveRouteLength.checked = true;
                domClass.add(this.saveRouteLength.checkNode, "checked");
                domClass.remove(this.selectSaveRouteLength, "esriCTHidden");
                domClass.remove(this.selectRouteLengthBlock, "esriCTHidden");
            }

            if (this.config && this.config.saveBusinessCountField) {
                this.saveBusinessCount.checked = true;
                domClass.add(this.saveBusinessCount.checkNode, "checked");
                domClass.remove(this.selectSaveBusinessCount, "esriCTHidden");
                domClass.remove(this.selectBusinessCountBlock, "esriCTHidden");
            }

            this._setLayerOptions();

            setTimeout(lang.hitch(this, function () {
                on(this.selectSaveRouteLayer, "change", lang.hitch(this, function (value) {
                    this._setRouteAttributeOptions(value, false);
                }));
            }), 500);
        },

        /**
        * This function adds business and route layer options from the webmap feature layers and set a default selection option
        **/
        _setLayerOptions: function () {
            var i, optionValue;
            for (i = 0; i < this.operationalLayers.length; i++) {
                if (this.operationalLayers[i].layerType && this.operationalLayers[i].layerType === "ArcGISFeatureLayer") {
                    optionValue = this.operationalLayers[i].title;
                    this.selectSaveBusinessLayer.addOption({ label: optionValue, value: i });
                    this.selectSaveRouteLayer.addOption({ label: optionValue, value: i });
                    this.selectSaveBusinessLayer.index = i;
                    if (this.config) {
                        if (this.config.targetBusinessLayer && optionValue === this.config.targetBusinessLayer) {
                            this.selectSaveBusinessLayer.set("value", i);
                        }
                        if (this.config.targetRouteLayer && optionValue === this.config.targetRouteLayer) {
                            this.selectSaveRouteLayer.set("value", i);
                            this._setRouteAttributeOptions(i, true);
                        }
                    }
                }
            }
        },

        /**
        * This function adds route layer fields for route length and business count field mapping options.
        * @param {string} layerIndex
        * @param {string} setDefaultField
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _setRouteAttributeOptions: function (layerIndex, setDefaultField) {
            var j, optionValue;
            this.selectSaveRouteLength.options.length = 0;
            this.selectSaveBusinessCount.options.length = 0;
            for (j = 0; j < this.operationalLayers[layerIndex].layerObject.fields.length; j++) {
                optionValue = this.operationalLayers[layerIndex].layerObject.fields[j].name;
                this.selectSaveRouteLength.addOption({ label: optionValue, value: optionValue, selected: false });
                this.selectSaveBusinessCount.addOption({ label: optionValue, value: optionValue });
                if (setDefaultField && this.config) {
                    if (this.config.saveRoutelengthField && optionValue === this.config.saveRoutelengthField) {
                        this.selectSaveRouteLength.set("value", optionValue);
                    }
                    if (this.config.saveBusinessCountField && optionValue === this.config.saveBusinessCountField) {
                        this.selectSaveBusinessCount.set("value", optionValue);
                    }
                }
            }
        },

        /**
        * This creates the checkbox for export to CSV
        **/
        _createExportToCSV: function () {
            this.exportCheck = new CheckBox({ "title": this.nls.captionExportCSV }, this.exportCsvCheck);
            domConstruct.create("label", {
                innerHTML: this.nls.captionExportCSV,
                class: "esriCTTargetLayerLabel"
            }, this.exportCsvLabel);

            if (this.config && this.config.exportToCSV) {
                domClass.add(this.exportCheck.checkNode, "checked");
                this.exportCheck.checked = this.config.exportToCSV;
            }

        },

        /**
        * This function create error alert.
        * @param {string} err
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _errorMessage: function (err) {
            var errorMessage = new Message({ message: err });
            errorMessage.message = err;
        },

        /**
        * This function gets and create config data in config file.
        * @return {object} Object of config
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        getConfig: function () {
            var i, accessLayerName, accessLayerCount, checkedLayer, businessLayerCheck = false, businessLayer = "", routeLayerCheck = false,
                routelengthCheck = false, routeLayerValue = "", routelengthLayer = "", businessCountCheck = false, businessCountLayer = "", getSymbolvalues, queryLayer, highlighterDetails;
            // if check accessPointsLayersName already exist in config then
            if (this.config.accessPointsLayersName) {
                queryLayer = query(".esriCTcheckedPointLayer");
                this.checkedAccessPointLayers = queryLayer;
            }
            // if check accessPointsLayersName already exist then take length
            if (this.checkedAccessPointLayers && this.checkedAccessPointLayers.length) {
                accessLayerCount = this.checkedAccessPointLayers.length;
            }

            getSymbolvalues = this._getSymbols();
            highlighterDetails = this._getHighlighterForm();
            businessLayerCheck = this.saveBusinessCheck && this.saveBusinessCheck.checked ? this.saveBusinessCheck.checked : false;
            // check whether business layer check box is checked
            if (businessLayerCheck) {
                businessLayer = (this.selectSaveBusinessLayer && this.selectSaveBusinessLayer.value !== "") ? this.operationalLayers[this.selectSaveBusinessLayer.value].title : "";
            }
            // if Route Layer Checkbox is checked
            if (this.saveRouteCheck && this.saveRouteCheck.checked) {
                routeLayerCheck = this.saveRouteCheck && this.saveRouteCheck.checked ? this.saveRouteCheck.checked : false;
                // if Route Layer Checkbox is checked then set route layer value from dropdown
                if (routeLayerCheck) {
                    routeLayerValue = (this.selectSaveRouteLayer && this.selectSaveRouteLayer.value !== "") ? this.operationalLayers[this.selectSaveRouteLayer.value].title : "";
                }

                routelengthCheck = this.saveRouteLength && this.saveRouteLength.checked ? this.saveRouteLength.checked : false;
                // if Route Layer Checkbox is checked  and Route Length checkbox is checked then set Route Length value from dropdown
                if (routeLayerCheck && routelengthCheck) {
                    routelengthLayer = this.selectSaveRouteLength && this.selectSaveRouteLength.value ? this.selectSaveRouteLength.value : "";
                }

                businessCountCheck = this.saveBusinessCount && this.saveBusinessCount.checked ? this.saveBusinessCount.checked : false;
                // if Route Layer Checkbox is checked  and Business Count checkbox is checked then set Business Count value from dropdown
                if (routeLayerCheck && businessCountCheck) {
                    businessCountLayer = this.selectSaveBusinessCount && this.selectSaveBusinessCount.value ? this.selectSaveBusinessCount.value : "";
                }
            }
            // if access point layer selected
            if (this.checkedAccessPointLayers && this.checkedAccessPointLayers.length > 0) {
                // loop for traversing checkedAccessPointLayers in checkboxes and pushing then comma seperated in a variable
                for (i = this.checkedAccessPointLayers.length; i > 0; i--) {
                    if (i !== accessLayerCount) {
                        checkedLayer = this.checkedAccessPointLayers.pop();
                        accessLayerName += "," + checkedLayer.title;
                    } else {
                        accessLayerName = this.checkedAccessPointLayers.pop();
                        accessLayerName = accessLayerName.title;
                    }
                    this.config = {
                        "businessesLayerName": this.operationalLayers[this.selectBusinessLayer.value].title,
                        "accessPointsLayersName": accessLayerName,
                        "routeLengthLabelUnits": this.txtRouteLength.value,
                        "bufferEsriUnits": this.selectBufferUnits.value,
                        "bufferWKID": this.txtBufferWkid.value,
                        "bufferDistance": this.txtBufferDistance.value,
                        "facilitySearchDistance": this.txtFacilityDistance.value,
                        "closestFacilityURL": this.closedFacilityServiceURL.value,
                        "impedanceAttribute": this.txtImpedenceAttribute.value,
                        "attributeName": this._attributeParameterObj.getAttributeParameterConfiguration(),
                        "defaultCutoff": this.txtdefaultCuttoff.value,
                        "attributeValueLookup": (this.txtAttributeParam && this.txtAttributeParam.textbox && this.txtAttributeParam.textbox.value !== "") ? this.txtAttributeParam.textbox.value : "",
                        "businessDisplayField": this.selectbusinessList.value,
                        "targetBusinessLayer": businessLayer,
                        "targetRouteLayer": routeLayerValue,
                        "saveRoutelengthField": routelengthLayer,
                        "exportToCSV": this.exportCheck.checked,
                        "saveBusinessCountField": businessCountLayer,
                        "symbol": getSymbolvalues,
                        "highlighterDetails": highlighterDetails
                    };
                }
            } else {
                accessLayerName = "";
                this.config = {
                    "businessesLayerName": this.operationalLayers[this.selectBusinessLayer.value].title,
                    "accessPointsLayersName": accessLayerName,
                    "routeLengthLabelUnits": this.txtRouteLength.value,
                    "bufferEsriUnits": this.selectBufferUnits.value,
                    "bufferWKID": this.txtBufferWkid.value,
                    "bufferDistance": this.txtBufferDistance.value,
                    "facilitySearchDistance": this.txtFacilityDistance.value,
                    "closestFacilityURL": this.closedFacilityServiceURL.value,
                    "impedanceAttribute": this.txtImpedenceAttribute.value,
                    "attributeName": this._attributeParameterObj.getAttributeParameterConfiguration(),
                    "defaultCutoff": this.txtdefaultCuttoff.value,
                    "attributeValueLookup": (this.txtAttributeParam && this.txtAttributeParam.textbox && this.txtAttributeParam.textbox.value !== "") ? this.txtAttributeParam.textbox.value : "",
                    "businessDisplayField": this.selectbusinessList.value,
                    "targetBusinessLayer": businessLayer,
                    "targetRouteLayer": routeLayerValue,
                    "saveRoutelengthField": routelengthLayer,
                    "exportToCSV": this.exportCheck.checked,
                    "saveBusinessCountField": businessCountLayer,
                    "symbol": getSymbolvalues,
                    "highlighterDetails": highlighterDetails
                };
            }
            console.log(this.config);
            return this.config;
        },

        /**
        * This function gets and creates config data for symbols
        * @return {object} Object of config
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _getSymbols: function () {
            var symbolParam;
            symbolParam = [
                { "pointBarrierSymbol": this.pointBarrierSymbolVal.getSymbol().toJson() },
                { "lineBarrierSymbol": this.lineBarrierSymbolVal.getSymbol().toJson() },
                { "polygonBarrierSymbol": this.polygonBarrierSymbolVal.getSymbol().toJson() },
                { "pointLocationSymbol": this.pointLocationSymbolVal.getSymbol().toJson() },
                { "routeSymbol": this.routeSymbolVal.getSymbol().toJson() },
                { "bufferSymbol": this.bufferSymbolVal.getSymbol().toJson() }
            ];
            return symbolParam;
        },

        /**
        * This function creates symbols in config UI for respective symbols
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _createSymbol: function () {
            this.pointBarrierSymbolVal = this._createSymbolPicker(this.pointBarrierSymbol, "pointBarrierSymbol", "esriGeometryPoint");
            this.lineBarrierSymbolVal = this._createSymbolPicker(this.lineBarrierSymbol, "lineBarrierSymbol", "esriGeometryPolyline");
            this.polygonBarrierSymbolVal = this._createSymbolPicker(this.polygonBarrierSymbol, "polygonBarrierSymbol", "esriGeometryPolygon");
            this.pointLocationSymbolVal = this._createSymbolPicker(this.pointLocationSymbol, "pointLocationSymbol", "esriGeometryPoint");
            this.routeSymbolVal = this._createSymbolPicker(this.routeSymbol, "routeSymbol", "esriGeometryPolyline");
            this.bufferSymbolVal = this._createSymbolPicker(this.bufferSymbol, "bufferSymbol", "esriGeometryPolygon");
        },


        /**
        * This function creates symbols in config UI
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _createSymbolPicker: function (symbolNode, symbolType, geometryType) {
            var objSymbol, i, symbolObjFlag = false, symbolArray, key;
            //if symbol geometry exist
            if (geometryType) {
                //this.data.featureSetMode = 'draw';
                objSymbol = {};
                // if symbols parameter available in input parameters then takes symbol details
                if (this.config && this.config.symbol) {
                    symbolArray = [];
                    symbolArray = this.config.symbol;
                    // loop for picking requested symbols from the object of config symbol object
                    for (i = 0; i < symbolArray.length; i++) {
                        for (key in symbolArray[i]) {
                            if (symbolArray[i].hasOwnProperty(key)) {
                                // if requested type and config object symbol object key value is same
                                if (key === symbolType) {
                                    objSymbol.symbol = jsonUtils.fromJson(symbolArray[i][key]);
                                    symbolObjFlag = true;
                                    break;
                                }
                            }
                        }
                        // checks for symbol flag
                        if (symbolObjFlag) {
                            break;
                        }
                    }
                } else {
                    objSymbol.type = utils.getSymbolTypeByGeometryType(geometryType);
                }
            }
            this.symbolChooser = new SymbolChooser(objSymbol, domConstruct.create("div", {}, symbolNode));
            this.symbolChooser.startup();
            return this.symbolChooser;
        },

        /**
        * This function creates Highlighter Image for config UI
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _createHighlighterImage: function () {
            var thumbnailUrl, baseURL;
            this.imageChooser = new ImageChooser({
                displayImg: this.showImageChooser,
                goldenWidth: 84,
                goldenHeight: 67
            });
            this.imageDataObj = "";
            domClass.add(this.imageChooser.domNode, 'img-chooser');
            domConstruct.place(this.imageChooser.domNode, this.imageChooserBase);
            // if Config object and highlighter image detail is not null then
            if (this.config && this.config.highlighterDetails && this.config.highlighterDetails.imageData) {
                // if "${appPath}" string found inside highlighter image detail object
                if (this.config.highlighterDetails.imageData.indexOf("${appPath}") > -1) {
                    baseURL = this.folderUrl.slice(0, this.folderUrl.lastIndexOf("widgets"));
                    domAttr.set(this.showImageChooser, 'src', string.substitute(this.config.highlighterDetails.imageData, { appPath: baseURL }));
                    this.imageDataObj = string.substitute(this.config.highlighterDetails.imageData, { appPath: baseURL });
                } else {
                    domAttr.set(this.showImageChooser, 'src', this.config.highlighterDetails.imageData);
                    this.imageDataObj = this.config.highlighterDetails.imageData;
                }
            } else {
                thumbnailUrl = this.folderUrl + "/images/default.jpg";
                domAttr.set(this.showImageChooser, 'src', thumbnailUrl);
            }
            // if Config object and highlighter image detail is not null then
            if (this.config && this.config.highlighterDetails) {
                this.imageWidth.set("value", this.config.highlighterDetails.height);
                this.imageHeight.set("value", this.config.highlighterDetails.width);
                this.highlighterImageTimeout.set("value", this.config.highlighterDetails.timeout);
            }
        },

        /**
        * This function returns the highlighter image object for configuration.
        * @memberOf widgets/isolation-trace/settings/settings
        */
        _getHighlighterForm: function () {
            var othersParam;
            // if imageChooser instance exist and imageData in imageChooser available
            if (this.imageChooser && this.imageChooser.imageData) {
                this.imageDataObj = this.imageChooser.imageData;
            } else if (this.othersConfig && this.othersConfig.imageData) {
                this.imageDataObj = this.othersConfig.imageData;
            }
            othersParam = {
                "imageData": this.imageDataObj,
                "height": ((this.imageHeight && this.imageHeight.value) ? this.imageHeight.value : ""),
                "width": ((this.imageWidth && this.imageWidth.value) ? this.imageWidth.value : ""),
                "timeout": ((this.highlighterImageTimeout && this.highlighterImageTimeout.value) ? this.highlighterImageTimeout.value : "")
            };
            return othersParam;
        }
    });
});
