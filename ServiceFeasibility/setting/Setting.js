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
    "dijit/_WidgetsInTemplateMixin",
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
    "jimu/dijit/SymbolChooser",
    "jimu/utils",
    "esri/symbols/jsonUtils",
    "dijit/form/Select",
    "dijit/form/NumberSpinner",
    "dojo/_base/array",
    "dojo/window",
    "jimu/dijit/Message",
    "./attribute-parameter",
    "jimu/dijit/ImageChooser",
    "dojox/validate/regexp",
    "jimu/dijit/LoadingIndicator",
    "esri/request",
    "dojo/domReady!"
], function (
    declare,
    BaseWidgetSetting,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
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
    SymbolChooser,
    utils,
    jsonUtils,
    Select,
    NumberSpinner,
    array,
    Window,
    Message,
    AttributeParameter,
    ImageChooser,
    regexp,
    LoadingIndicator,
    esriRequest
) {
    return declare([BaseWidgetSetting, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        baseClass: 'jimu-widget-ServiceFeasbility-setting',
        operationalLayers: null,
        ImageChooser: null,
        thumbnailUrl: null,
        serviceURL: null,
        attributeLookup: this.defaultDataDictionaryValue,
        checkedAccessPointLayers: [],

        ESRIBufferUnits: "UNIT_STATUTE_MILE, UNIT_FOOT,UNIT_KILOMETER,UNIT_METER",

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
        postCreate: function () {
            this._initLoading();
        },

        /**
        * This function used for loading indicator
        * @memberOf widgets/ServiceFeasibility/setting/Setting.js
        */
        _initLoading: function () {
            var popupContainer;
            this.loading = new LoadingIndicator({
                hidden: true
            });
            popupContainer = query(".widget-setting-popup")[0];
            this.loading.placeAt(popupContainer);
            this.loading.startup();
        },

        /**
        * This function is used to add parameters from config file
        * @memberOf widgets/ServiceFeasibility/setting/Setting.js
        **/
        _addConfigParameters: function () {
            domConstruct.empty(query(".esriCTAttrParamContainer")[0]);
            var parameters;
            parameters = { "closestFacilityURL": this.config.closestFacilityURL, "nls": this.nls, "config": this.config };
            // if config object not null and attributes name & closestFacilityURL  available
            if (this.config && this.config.attributeName && this.config.closestFacilityURL) {
                this.closedFacilityServiceURL.value = this.config.closestFacilityURL;
                this._attributeParameterObj = new AttributeParameter(parameters);
                this._validateClosestFacilityServiceURL(true);
            }
        },

        /**
        * This function is used to show attribute paramaters on click of set button.
        * @memberOf widgets/ServiceFeasibility/setting/Settings
        **/
        _onSetBtnClick: function () {
            this.own(on(this.onSetBtnClick, 'click', lang.hitch(this, function (evt) {
                this.loading.show();
                this.serviceURL = "";
                domClass.add(this.attributeParameterValues, "esriCTHidden");
                domConstruct.empty(query(".esriCTAttrParamContainer")[0]);
                var parameters;
                parameters = { "closestFacilityURL": this.closedFacilityServiceURL.value, "nls": this.nls };
                this._attributeParameterObj = new AttributeParameter(parameters);
                this._validateClosestFacilityServiceURL(false);
            })));
        },

        /**
        * This function is used to validate closed facility service url.
        * @param {boolean}  setConfig.
        * @memberOf widgets/ServiceFeasibility/settings/Settings
        **/
        _validateClosestFacilityServiceURL: function (setConfig) {
            this._clickedRows = [];
            var isURLcorrect, url, requestArgs;
            url = this.closedFacilityServiceURL.value;
            isURLcorrect = this._urlValidator(url);
            // if the task URL is valid
            if (isURLcorrect) {
                requestArgs = { url: url, content: { f: "json" }, handleAs: "json", callbackParamName: "callback", timeout: 20000 };
                esriRequest(requestArgs).then(lang.hitch(this, function (response) {
                    if (response.layerType === "esriNAServerClosestFacilityLayer") {
                        this.serviceURL = url;
                        this._setImpedanceAttributeOptions(response, setConfig);
                        this._displayAttributeParameter(response, setConfig);
                        this.loading.hide();
                    } else {
                        this._errorMessage(this.nls.validationErrorMessage.invalidClosestFacilityTask + "'" + this.nls.lblClosestFacilityServiceUrl + "'.");
                        this.loading.hide();
                    }
                }), lang.hitch(this, function (err) {
                    if (this._initialLoad) {
                        this._initialLoad = false;
                    }
                    this._errorMessage(this.nls.invalidURL + "'" + this.nls.lblClosestFacilityServiceUrl + "'.");
                    this.loading.hide();
                }));
            } else {
                this._errorMessage(this.nls.invalidURL + "'" + this.nls.lblClosestFacilityServiceUrl + "'.");
                this.loading.hide();
            }
        },

        /**
        * This function will display attribute parameter  .
        * @param which will get from response of URL.
        * @memberOf widgets/ServiceFeasibility/setting/Setting.
        **/
        _displayAttributeParameter: function (response, setConfig) {
            if (setConfig) {
                this._attributeParameterObj.addConfigParameters();
            }
            if (response.attributeParameterValues.length > 0) {
                domClass.remove(this.attributeParameterValues, "esriCTHidden");
            } else {
                domClass.add(this.attributeParameterValues, "esriCTHidden");
            }
            this._attributeParameterObj.displayAttributeParamaterValues(response);
        },

        /**
        * This function will validate the URL string.
        * @param {string} URL that needs to be validated
        * @memberOf widgets/ServiceFeasibility/settings/Settings
        **/
        _urlValidator: function (value) {
            var strReg, reg, b1, p2, b2;
            strReg = '^' + regexp.url({ allowNamed: true, allLocal: false });
            reg = new RegExp(strReg, 'g');
            b1 = reg.test(value);
            p2 = /\/rest\/services/gi;
            b2 = p2.test(value);
            return b1 && b2;
        },

        /**
        * This function will add options to select impedance attribute
        * @memberOf widgets/ServiceFeasibility/settings/Settings
        **/
        _setImpedanceAttributeOptions: function (response, setConfig, url) {
            this.selectInpedanceAttribute.options.length = 0;
            array.forEach(response.networkDataset.networkAttributes, lang.hitch(this, function (networkAttr) {
                if (networkAttr.usageType === "esriNAUTCost") {
                    this.selectInpedanceAttribute.addOption({ label: networkAttr.name, value: networkAttr.name });
                }
            }));
            if (this.selectInpedanceAttribute.options.length > 0) {
                if (setConfig && this.config.impedanceAttribute) {
                    this.selectInpedanceAttribute.set("value", this.config.impedanceAttribute);
                } else {
                    this.selectInpedanceAttribute.set("value", response.impedance);
                }
                domClass.remove(this.ImpedanceAttributeContainer, "esriCTHidden");
            }
        },

        /**
        * This function will add option in Business Layer select tag
        * @memberOf widgets/ServiceFeasibility/setting/Settings
        **/
        _initializeBusinessLayerSelect: function () {
            var i, k;
            if (this.operationalLayers.length > 0) {
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
                        this.selectbusinessList.addOption({ label: this.operationalLayers[0].layerObject.fields[k].name, value: this.operationalLayers[0].layerObject.fields[k].name });
                    }
                }
                this._attachChangeEventToBussinessLayer();
            } else {
                this._errorMessage(this.nls.validationErrorMessage.NoLayersInWebMap);
            }
        },

        /**
        * This function is used to handle onchange event of 'Business layer' while changing the business.
        * @memberOf widgets/serviceFeasibility/setting/settings
        **/
        _attachChangeEventToBussinessLayer: function () {
            var j, i;
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
        * @memberOf widgets/ServiceFeasibility/setting/Settings
        **/
        _initializeAccessPointLayersCheckboxes: function () {
            var i, j, divAccessPointLayerContainer, accessPointChecks, chkBoxTitle;
            this.checkedLayers = [];
            // loop to create check box and it's label for oprational layers
            for (i = 0; i < this.operationalLayers.length; i++) {
                if (this.operationalLayers[i].layerObject.type === "Feature Layer" && this.operationalLayers[i].layerObject.geometryType === "esriGeometryPoint") {
                    divAccessPointLayerContainer = domConstruct.create("div");
                    accessPointChecks = new CheckBox({ "id": this.operationalLayers[i].id + "checkbox" }, divAccessPointLayerContainer);
                    domAttr.set(accessPointChecks.domNode, "title", this.operationalLayers[i].title);
                    domConstruct.create("label", { innerHTML: this.operationalLayers[i].title, "class": "esriCTCheckboxLabel" }, divAccessPointLayerContainer);
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
                                this.checkedAccessPointLayers = this.checkedLayers;
                            }
                        }
                        // if value doesn't exist in array
                        if (array.indexOf(this.checkedLayers, accessPointChecks.domNode) === -1) {
                            this.checkedLayers.push(accessPointChecks.domNode);
                            this.checkedAccessPointLayers = this.checkedLayers;
                        }
                    }
                }
            }
        },

        /**
        * This function is get call if user clik on 'Access Point Layer' Checkbox
        * @memberOf widgets/ServiceFeasibility/setting/Settings
        **/
        _addEventToCheckBox: function (checkBox) {
            var queryLayer;
            on(checkBox.domNode, "click", lang.hitch(this, function (event) {
                if (domClass.contains(event.target, "checked")) {
                    this.checkedLayers.push(event.currentTarget);
                    domClass.add(event.currentTarget, "esriCTcheckedPointLayer");
                } else if (array.indexOf(this.checkedLayers, event.currentTarget) !== -1) {
                    this.checkedLayers.splice(array.indexOf(this.checkedLayers, event.currentTarget), 1);
                    this.checkedAccessPointLayers = this.checkedLayers;
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
        * This function will create the buffer units
        * @memberOf widgets/ServiceFeasibility/setting/Settings
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
        * @memberOf widgets/ServiceFeasibility/setting/Settings
        **/
        _setClosestFacilityParams: function () {
            if (this.config && this.config.routeLengthLabelUnits) {
                this.txtRouteLength.set("value", this.config.routeLengthLabelUnits);
            }
            if (this.config && this.config.bufferDistance) {
                this.txtBufferDistance.set("value", this.config.bufferDistance);
            }
            if (this.config && this.config.closestFacilityURL) {
                this.closedFacilityServiceURL.set("value", this.config.closestFacilityURL);
            }
            if (this.config && this.config.facilitySearchDistance) {
                this.txtFacilityDistance.set("value", this.config.facilitySearchDistance);
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
        * @memberOf widgets/ServiceFeasibility/setting/Settings
        **/
        _saveTargetLayerSelect: function () {
            domConstruct.empty(this.businessLayerCheckbox);
            this._createSaveBussinessCheckBox();
            this._createSaveRouteCheckBox();
            this._createSaveRouteLengthCheckBox();
            this._setLayerOptions();
            this._attachCheckBoxEvents();
            setTimeout(lang.hitch(this, function () {
                on(this.selectSaveRouteLayer, "change", lang.hitch(this, function (value) {
                    this._setRouteAttributeOptions(value, false);
                }));
            }), 500);
        },

        /**
        * this function used to 'Businesses Layer' checkbox
        * @memberOf widgets/serviceFeasibility/setting/settings
        **/
        _createSaveBussinessCheckBox: function () {
            this.saveBusinessCheck = new CheckBox({ "title": this.nls.lblBusinessesLayer }, this.businessLayerCheckbox);
            this.businessLayerDiv = domConstruct.create("label", { innerHTML: this.nls.lblBusinessesLayer, "class": "esriCTTargetLayerLabel" }, this.saveBusinessLayerLabel);
            if (this.config && this.config.targetBusinessLayer) {
                this.saveBusinessCheck.checked = true;
                domClass.add(this.saveBusinessCheck.checkNode, "checked");
                domClass.remove(this.selectSaveBusinessLayerBlock, "esriCTHidden");
            }
        },

        /**
        * this function used to 'Route Layer' checkbox
        * @memberOf widgets/serviceFeasibility/setting/settings
        **/
        _createSaveRouteCheckBox: function () {
            this.saveRouteCheck = new CheckBox({ "title": this.nls.lblRouteLayer }, this.routeLayerCheckbox);
            domConstruct.create("label", { innerHTML: this.nls.lblRouteLayer, "class": "esriCTTargetLayerLabel" }, this.saveRouteLayerLabel);
            if (this.config && this.config.targetRouteLayer) {
                this.saveRouteCheck.checked = true;
                domClass.add(this.saveRouteCheck.checkNode, "checked");
                domClass.remove(this.routeLayerCheck, "esriCTHidden");
                domClass.remove(this.selectrouteLayerBlock, "esriCTHidden");
            }
        },

        /**
        * This function create 'Route Length' and 'Business Count ' checkbox
        * if RouteLength checked 'RouteLengthBlock' will  visible
        * if Business Count checked selected 'BusinessCountBlock' will  visible
        * @memberOf widgets/serviceFeasibility/setting/settings
        **/
        _createSaveRouteLengthCheckBox: function () {
            this.saveRouteLength = new CheckBox({ "title": this.nls.lblRouteLength }, this.routelengthCheckbox);
            domConstruct.create("label", { innerHTML: this.nls.lblRouteLength, "class": "esriCTTargetLayerLabel esriCTEllipsis" }, this.saveRouteLengthLabel);
            this.saveBusinessCount = new CheckBox({ "title": this.nls.lblBusinessCount }, this.businessCountCheckbox);
            domConstruct.create("label", { innerHTML: this.nls.lblBusinessCount, "class": "esriCTTargetLayerLabel esriCTEllipsis" }, this.businessCountLabel);
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
        },

        /**
        * This function is used to add event to checkbox
        * @memberOf widgets/serviceFeasibility/setting/settings
        **/
        _attachCheckBoxEvents: function () {
            on(this.saveBusinessCheck, "click", lang.hitch(this, function (event) {
                if (domClass.contains(event.target, "checked")) {
                    domClass.remove(this.selectSaveBusinessLayerBlock, "esriCTHidden");
                } else {
                    domClass.add(this.selectSaveBusinessLayerBlock, "esriCTHidden");
                }
            }));
            on(this.saveRouteCheck, "click", lang.hitch(this, function (event) {
                if (domClass.contains(event.target, "checked")) {
                    domClass.remove(this.routeLayerCheck, "esriCTHidden");
                    domClass.remove(this.selectrouteLayerBlock, "esriCTHidden");
                } else {
                    domClass.add(this.routeLayerCheck, "esriCTHidden");
                    domClass.add(this.selectrouteLayerBlock, "esriCTHidden");
                }
            }));
            on(this.saveRouteLength, "click", lang.hitch(this, function (event) {
                if (domClass.contains(event.target, "checked")) {
                    domClass.remove(this.selectSaveRouteLength, "esriCTHidden");
                    domClass.remove(this.selectRouteLengthBlock, "esriCTHidden");
                } else {
                    domClass.add(this.selectSaveRouteLength, "esriCTHidden");
                    domClass.add(this.selectRouteLengthBlock, "esriCTHidden");
                }
            }));
            on(this.saveBusinessCount, "click", lang.hitch(this, function (event) {
                if (domClass.contains(event.target, "checked")) {
                    domClass.remove(this.selectSaveBusinessCount, "esriCTHidden");
                    domClass.remove(this.selectBusinessCountBlock, "esriCTHidden");
                } else {
                    domClass.add(this.selectSaveBusinessCount, "esriCTHidden");
                    domClass.add(this.selectBusinessCountBlock, "esriCTHidden");
                }
            }));
        },

        /**
        * This function adds business and route layer options from the webmap feature layers and set a default selection option
        * @memberOf widgets/ServiceFeasibility/setting/Settings
        **/
        _setLayerOptions: function () {
            var i, optionValue;
            this.selectSaveBusinessLayer.options.length = 0;
            this.selectSaveRouteLayer.options.length = 0;
            for (i = 0; i < this.operationalLayers.length; i++) {
                if (this.operationalLayers[i].layerType && this.operationalLayers[i].layerType === "ArcGISFeatureLayer" && this._validateLayerCapabilities(this.operationalLayers[i].resourceInfo.capabilities)) {
                    optionValue = this.operationalLayers[i].title;
                    this.selectSaveBusinessLayer.addOption({ label: optionValue, value: i });
                    if (this.operationalLayers[i].layerObject.geometryType === "esriGeometryPolyline") {
                        this.selectSaveRouteLayer.addOption({ label: optionValue, value: i });
                    }
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
            if (!this.config.targetRouteLayer && this.selectSaveRouteLayer.options.length > 0) {
                this._setRouteAttributeOptions(this.selectSaveRouteLayer.options[0].value, false);
            }
        },

        /**
        * This function is used to validate the capabalites of the layer
        * @param{object} capabilities of layer
        * @memberOf widgets/ServiceFeasibility/setting/settings
        */
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
        * This function adds route layer fields for route length and business count field mapping options.
        * @param {string} layerIndex
        * @param {string} setDefaultField
        * @memberOf widgets/ServiceFeasibility/setting/settings
        **/
        _setRouteAttributeOptions: function (layerIndex, setDefaultField) {
            var j, optionValue;
            this.selectSaveRouteLength.options.length = 0;
            this.selectSaveBusinessCount.options.length = 0;
            for (j = 0; j < this.operationalLayers[layerIndex].layerObject.fields.length; j++) {
                if ((this.operationalLayers[layerIndex].layerObject.fields[j].editable) && (this.operationalLayers[layerIndex].layerObject.fields[j].type === "esriFieldTypeString" || this.operationalLayers[layerIndex].layerObject.fields[j].type === "esriFieldTypeDouble" || this.operationalLayers[layerIndex].layerObject.fields[j].type === "esriFieldTypeInteger" || this.operationalLayers[layerIndex].layerObject.fields[j].type === "esriFieldTypeSingle" || this.operationalLayers[layerIndex].layerObject.fields[j].type === "esriFieldTypeSmallInteger")) {
                    optionValue = this.operationalLayers[layerIndex].layerObject.fields[j].name;
                    this.selectSaveRouteLength.addOption({ label: optionValue, value: optionValue, selected: false });
                    this.selectSaveBusinessCount.addOption({ label: optionValue, value: optionValue });
                }
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
        * @memberOf widgets/ServiceFeasibility/setting/Settings
        **/
        _createExportToCSV: function () {
            this.exportCheck = new CheckBox({ "title": this.nls.captionExportCSV }, this.exportCsvCheck);
            domConstruct.create("label", { innerHTML: this.nls.captionExportCSV, "class": "esriCTTargetLayerLabel" }, this.exportCsvLabel);
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
            var accessLayerName = "", businessLayer = "", routeLayerValue = "", routelengthLayer = "", businessCountLayer = "", getSymbolvalues, businessLayerCheck = false, routeLayerCheck = false, routelengthCheck = false, businessCountCheck = false, queryLayer, highlighterDetails;
            // Setting object for highlighted details
            highlighterDetails = { "imageData": "", "height": "", "width": "", "timeout": "" };
            //check all validation is done
            if (this._validateConfigData()) {
                // if check accessPointsLayersName already exist in config then
                if (this.config.accessPointsLayersName) {
                    queryLayer = query(".esriCTcheckedPointLayer");
                    this.checkedAccessPointLayers = queryLayer;
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
                accessLayerName = this._getAccessLayerNames();
                this.config = {
                    "businessesLayerName": this.operationalLayers[this.selectBusinessLayer.value].title,
                    "accessPointsLayersName": accessLayerName,
                    "routeLengthLabelUnits": this.txtRouteLength.value,
                    "bufferEsriUnits": this.selectBufferUnits.value,
                    "bufferDistance": this.txtBufferDistance.value,
                    "facilitySearchDistance": this.txtFacilityDistance.value,
                    "closestFacilityURL": this.closedFacilityServiceURL.value,
                    "impedanceAttribute": this.selectInpedanceAttribute.value,
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
            } else {
                return false;
            }
            return this.config;
        },
        /**
        * This function validates config data
        * @param {return} flag value for validation
        * @memberOf widgets/serviceFeasibility/setting/settings
        **/
        _validateConfigData: function () {
            var isValid, validateInputTask, validateClosestFacilityParameters, validateImageParameters, validateTargateLayer, validateTargateLayerParameters, validateMinMaxValue, validateCheckPoint, validateBusinessLayerGeometry, validateOperationLayer;
            isValid = true;
            validateOperationLayer = this._validateOperationLayer();
            // Validation of Check point Layer
            validateCheckPoint = this._validateAccesspointCheck();
            // Validation of 'Route length units' and 'Buffer distance'
            validateInputTask = this._validateInputTaskParameters();
            // Validation of 'closest Facility URL' , 'Facility Search Distance' and 'Default Cutoff distance'
            validateClosestFacilityParameters = this.validateClosestFacilityParameters();
            if (!validateClosestFacilityParameters.hasError) {
                validateMinMaxValue = this._attributeParameterObj.validateMinMax();
            }
            // Validation of Image Parameter
            validateImageParameters = this._validateImageParameters();
            // Validation of 'Businesses Layer' and 'Route Layer'
            validateTargateLayer = this._validateTargetLayer();
            //Check Bussiness layer Geometry
            validateBusinessLayerGeometry = this._getGeometryFromBussinessLayer();
            validateTargateLayerParameters = this._validateTargetLayerParameters();
            // validateInputTask is set to true, ie. validation error found then
            if (validateOperationLayer.hasError) {
                this._errorMessage(validateOperationLayer.returnErr);
                isValid = false;
            } else if (validateCheckPoint.hasError) {
                this._errorMessage(validateCheckPoint.returnErr);
                isValid = false;
            } else if (validateInputTask.hasError) {
                this._errorMessage(validateInputTask.returnErr);
                isValid = false;
            } else if (validateClosestFacilityParameters.hasError) {
                this._errorMessage(validateClosestFacilityParameters.returnErr);
                isValid = false;
            } else if (validateMinMaxValue && validateMinMaxValue.hasError) {
                this._errorMessage(validateMinMaxValue.returnErr);
                isValid = false;
            } else if (validateTargateLayer.hasError) {
                this._errorMessage(validateTargateLayer.returnErr);
                isValid = false;
            } else if (validateBusinessLayerGeometry && validateBusinessLayerGeometry.hasError) {
                this._errorMessage(validateBusinessLayerGeometry.returnErr);
                isValid = false;
            } else if (validateTargateLayerParameters.hasError) {
                this._errorMessage(validateTargateLayerParameters.returnErr);
                isValid = false;
            } else if (validateImageParameters.hasError) {
                this._errorMessage(validateImageParameters.returnErr);
                isValid = false;
            }
            return isValid;
        },

        /**
        * This function checks whether operation layer is present on webmap or not
        * @memberOf widgets/ServiceFeasibility/setting/Settings
        **/
        _validateOperationLayer: function () {
            var returnObj = { returnErr: "", hasError: false };
            if (this.operationalLayers.length === 0) {
                returnObj.returnErr = this.nls.validationErrorMessage.NoLayersInWebMap;
                returnObj.hasError = true;
            }
            return returnObj;
        },

        /**
        * This function used to check the geometry type of bussinesses layer
        * @memberOf widgets/ServiceFeasibility/setting/Settings
        **/
        _getGeometryFromBussinessLayer: function () {
            if (this.saveBusinessCheck.checked) {
                var i, saveBussinessLayerGeometeyType, bussinessLayerGeometryType, returnObj = { returnErr: "", hasError: false };
                for (i = 0; i < this.operationalLayers.length; i++) {
                    if (this.operationalLayers[i].layerType && this.operationalLayers[i].layerType === "ArcGISFeatureLayer" && this._validateLayerCapabilities(this.operationalLayers[i].resourceInfo.capabilities)) {
                        if (this.operationalLayers[i].title === this.operationalLayers[this.selectSaveBusinessLayer.value].title) {
                            saveBussinessLayerGeometeyType = this.operationalLayers[i].layerObject.geometryType;
                        }
                    }
                }
                bussinessLayerGeometryType = this.operationalLayers[this.selectBusinessLayer.value].layerObject.geometryType;
                if (saveBussinessLayerGeometeyType !== bussinessLayerGeometryType) { // If 'Businesses layer' and 'Businesses layer from target layer' are different.
                    returnObj.returnErr = this.nls.validationErrorMessage.checkGeometryType + " '" + this.businessLayerDiv.innerHTML + " '" + this.nls.validationErrorMessage.BusinessGeometryType + " '" + this.selectBusinessLayerLabel.innerHTML + "'";
                    returnObj.hasError = true;
                }
                return returnObj;
            }
        },

        /**
        * function is used to check whether at least one 'access point layer ' checkbox is checked or not .
        * @return {object} Object of config
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _validateAccesspointCheck: function () {
            var returnObj = { returnErr: "", hasError: false };
            if (this.checkedAccessPointLayers && this.checkedAccessPointLayers.length === 0) {
                returnObj.returnErr = this.nls.validationErrorMessage.accessPointCheck + "'" + this.nls.lblAccessPointLayers + "'.";
                returnObj.hasError = true;
            }
            return returnObj;
        },

        /**
        * This function validates 'Field to Save route lenght' and 'Field to Save business count' if both options are equal validation error message will occur.
        * @param {return} flag value for validation
        * @memberOf widgets/serviceFeasibility/setting/settings
        **/
        _validateTargetLayerParameters: function () {
            var returnObj = { returnErr: "", hasError: false };
            if (this.saveRouteCheck.checked && this.saveRouteLength.checked && this.saveBusinessCount.checked) {
                if (this.selectSaveRouteLength.value === this.selectSaveBusinessCount.value) {
                    returnObj.returnErr = "'" + this.nls.lblRouteLength + "'" + this.nls.validationErrorMessage.andText + "'" + this.nls.lblBusinessCount + "'" + this.nls.validationErrorMessage.diffText + ".";
                    returnObj.hasError = true;
                }
            }
            return returnObj;
        },

        /**
        * This function validates 'Businesses Layer' and 'Route Layer' if both options are equal validation error message will occur.
        * @param {return} flag value for validation
        * @memberOf widgets/serviceFeasibility/setting/settings
        **/
        _validateTargetLayer: function () {
            var returnObj = { returnErr: "", hasError: false };
            if (this.saveBusinessCheck && this.saveBusinessCheck.checked && this.selectSaveBusinessLayer && this.selectSaveBusinessLayer.options.length === 0) {
                returnObj.returnErr = this.nls.validationErrorMessage.specifyText + "'" + this.saveBusinessLayerLabel.innerHTML + "'.";
                returnObj.hasError = true;

            } else if (this.saveRouteCheck && this.saveRouteCheck.checked && this.selectSaveRouteLayer && this.selectSaveRouteLayer.options.length === 0) {
                returnObj.returnErr = this.nls.validationErrorMessage.specifyText + "'" + this.saveRouteLayerLabel.innerHTML + "'";
                returnObj.hasError = true;
            }
            return returnObj;
        },

        /**
        * This function validates image parameters for if Image not selected.
        * if Image height,width,Timeout is null or is not a number.
        * @param {return} flag value for validation
        * @memberOf widgets/serviceFeasibility/settings/settings
        **/
        _validateImageParameters: function () {
            var imageDataOBJ, returnObj;
            returnObj = { returnErr: "", hasError: false };
            this._getHighlighterForm();
            imageDataOBJ = this.imageChooser;
            if (imageDataOBJ === "" || imageDataOBJ === null) {
                returnObj.returnErr = this.nls.validationErrorMessage.highlighterImageErr;
                returnObj.hasError = true;
            } else if (this.imageHeight === "" || this.imageHeight === null || isNaN(parseInt(this.imageHeight, 10)) || parseInt(this.imageHeight, 10) < 0) {
                returnObj.returnErr = "'" + this.nls.highlighter.imageUplaod + this.nls.highlighter.imageHeight + "'" + this.nls.validationErrorMessage.imageHeightErr;
                returnObj.hasError = true;
            } else if (this.imageWidth === "" || this.imageWidth.value === null || isNaN(parseInt(this.imageWidth, 10)) || parseInt(this.imageWidth, 10) < 0) {
                returnObj.returnErr = "'" + this.nls.highlighter.imageUplaod + this.nls.highlighter.imageWidth + "'" + this.nls.validationErrorMessage.imageWidthErr;
                returnObj.hasError = true;
            } else if (this.highlighterImageTimeout === "" || this.highlighterImageTimeout === null || isNaN(parseInt(this.highlighterImageTimeout, 10)) || parseInt(this.highlighterImageTimeout, 10) < 0) {
                returnObj.returnErr = "'" + this.nls.highlighter.imageUplaod + this.nls.highlighter.imageHighlightTimeout + "'" + this.nls.validationErrorMessage.imageTimeoutErr;
                returnObj.hasError = true;
            }
            return returnObj;
        },

        /**
        * This function is used to validate Input parameters.
        * @memberOf widgets/Service Fesibility//setting
        **/
        _validateInputTaskParameters: function () {
            var returnObj = { returnErr: "", hasError: false };
            // Return validation error if Route lenght and buffer distance  is empty/null/not positive a number.
            if (this.txtRouteLength.value === "" || this.txtRouteLength.value === null) {
                returnObj.returnErr = this.nls.validationErrorMessage.routeLengthErr + "'" + this.nls.lblForRouteLengthUnits + "'.";
                returnObj.hasError = true;
            } else if (this.txtBufferDistance.value === "" || this.txtBufferDistance.value === null || isNaN(parseInt(this.txtBufferDistance.value, 10)) || parseInt(this.txtBufferDistance.value, 10) <= 0 || !this._validateInput(this.txtBufferDistance.value)) {
                returnObj.returnErr = "'" + this.nls.lblBufferDistanceToGenerateServiceArea + "'" + this.nls.validationErrorMessage.bufferDistanceErr;
                returnObj.hasError = true;
            }
            return returnObj;
        },

        /**
        * This function is used to validate closest facility parameters.
        * @memberOf widgets/SearviceFeasibility/settings/settings
        **/
        validateClosestFacilityParameters: function () {
            var returnObj = { returnErr: "", hasError: false };
            // Return validation error if closest facility service URL is empty/null.
            // Return validation error if Facility search distance and Default cutofff distance  is empty/null/not positive a number.
            if (this.closedFacilityServiceURL.value === "" || this.closedFacilityServiceURL.value === null) {
                returnObj.returnErr = this.nls.invalidURL + "'" + this.nls.lblClosestFacilityServiceUrl + "'.";
                returnObj.hasError = true;
                // If previous URL that was set on set button and if user enters another URL in textbox control are different
            } else if (this.serviceURL !== this.closedFacilityServiceURL.value) {
                returnObj.returnErr = this.nls.invalidURL + "'" + this.nls.lblClosestFacilityServiceUrl + "'.";
                returnObj.hasError = true;
            } else if (this.txtFacilityDistance.value === "" || this.txtFacilityDistance.value === null || isNaN(parseInt(this.txtFacilityDistance.value, 10)) || parseInt(this.txtFacilityDistance.value, 10) <= 0 || !this._validateInput(this.txtFacilityDistance.value)) {
                returnObj.returnErr = "'" + this.nls.lblFacilitySearchDistance + "'" + this.nls.validationErrorMessage.defaultFacilityDistance;
                returnObj.hasError = true;
            } else if (this.txtdefaultCuttoff.value === "" || this.txtdefaultCuttoff.value === null || isNaN(parseInt(this.txtdefaultCuttoff.value, 10)) || parseInt(this.txtdefaultCuttoff.value, 10) <= 0 || !this._validateInput(this.txtdefaultCuttoff.value)) {
                returnObj.returnErr = "'" + this.nls.lblDefaultCutOffDistance + "'" + this.nls.validationErrorMessage.defaultCutOffDistance;
                returnObj.hasError = true;
            }
            return returnObj;
        },

        /**
        * This function is used to allow digits only
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _validateInput: function (input) {
            var regex;
            regex = /^[+]?\d*(?:\.\d{1,2})?$/; // allow only numbers [0-9]
            return regex.test(input);
        },

        /**
        * This function returns selected access Layer's names
        * @return {string} accessLayerName
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _getAccessLayerNames: function () {
            var i, accessLayerName = "",
                checkedLayer, accessLayerCount;
            // if access point layer selected
            if (this.checkedAccessPointLayers && this.checkedAccessPointLayers.length && this.checkedAccessPointLayers.length > 0) {
                accessLayerCount = this.checkedAccessPointLayers.length;
                // loop for traversing checkedAccessPointLayers in checkboxes and pushing then comma separated in a variable
                for (i = this.checkedAccessPointLayers.length; i > 0; i--) {
                    if (i !== accessLayerCount) {
                        checkedLayer = this.checkedAccessPointLayers.pop();
                        accessLayerName += "," + checkedLayer.title;
                    } else {
                        accessLayerName = this.checkedAccessPointLayers.pop();
                        accessLayerName = accessLayerName.title;
                    }
                }
            }
            return accessLayerName;
        },

        /**
        * This function gets and creates config data for symbols
        * @return {object} Object of config
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _getSymbols: function () {
            var symbolParam;
            symbolParam = [{ "pointBarrierSymbol": this.pointBarrierSymbolVal.getSymbol().toJson() }, { "lineBarrierSymbol": this.lineBarrierSymbolVal.getSymbol().toJson() },
                { "polygonBarrierSymbol": this.polygonBarrierSymbolVal.getSymbol().toJson() }, { "pointLocationSymbol": this.pointLocationSymbolVal.getSymbol().toJson() },
                { "routeSymbol": this.routeSymbolVal.getSymbol().toJson() }, { "bufferSymbol": this.bufferSymbolVal.getSymbol().toJson()}];
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
            var objSymbol, i, symbolObjFlag = false,
                symbolArray, key;
            //if symbol geometry exist
            if (geometryType) {
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
            var baseURL;
            this.imageChooser = new ImageChooser({ displayImg: this.showImageChooser, goldenWidth: 84, goldenHeight: 67 });
            domClass.add(this.imageChooser.domNode, 'img-chooser');
            domConstruct.place(this.imageChooser.domNode, this.imageChooserBase);
            // if Config object and highlighter image detail is not null then
            if (this.config && this.config.highlighterDetails && this.config.highlighterDetails.imageData) {
                // if "${appPath}" string found inside highlighter image data string
                if (this.config.highlighterDetails.imageData.indexOf("${appPath}") > -1) {
                    baseURL = this.folderUrl.slice(0, this.folderUrl.lastIndexOf("widgets"));
                    domAttr.set(this.showImageChooser, 'src', string.substitute(this.config.highlighterDetails.imageData, { appPath: baseURL }));
                } else {
                    domAttr.set(this.showImageChooser, 'src', this.config.highlighterDetails.imageData);
                }
            } else {
                this.thumbnailUrl = this.folderUrl + "/images/ani/default.gif";
                domAttr.set(this.showImageChooser, 'src', this.thumbnailUrl);
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
            this.imageDataObj = "";
            // if imageChooser instance exist and imageData in imageChooser available
            if (this.imageChooser && this.imageChooser.imageData) {
                this.imageDataObj = this.imageChooser.imageData;
            } else if (this.config.highlighterDetails && this.config.highlighterDetails.imageData) {
                this.imageDataObj = this.config.highlighterDetails.imageData;
            } else if (this.thumbnailUrl) {
                this.imageDataObj = this.thumbnailUrl;
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