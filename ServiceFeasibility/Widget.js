/*global define,dojo,dojoConfig,esri,esriConfig,alert,handle:true,dijit */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/** @license
| Version 10.2
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
    "jimu/BaseWidget",
    "jimu/dijit/TabContainer",
    "dijit/layout/ContentPane",
    "dijit/layout/TabContainer",
    'jimu/dijit/LoadingIndicator',
    "dojo/request/xhr",
    "dojo/window",
    "dojo/_base/lang",
    "esri/map",
    "dojo/on",
    "dojo/dom-construct",
    "dijit/form/HorizontalSlider",
    "dijit/form/TextBox",
    "dojo/dom",
    "esri/request",
    "esri/toolbars/draw",
    "dojo/dom-class",
    "dojo/query",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/Color",
    "esri/graphic",
    "esri/layers/GraphicsLayer",
    "esri/tasks/query",
    "esri/tasks/FeatureSet",
    "esri/tasks/GeometryService",
    "esri/tasks/BufferParameters",
    "esri/tasks/ClosestFacilityParameters",
    "esri/tasks/ClosestFacilityTask",
    "esri/geometry",
    "dojo/_base/array",
    "dojo/topic",
    "jimu/dijit/Message",
    "esri/tasks/QueryTask",
    "dojo/dom-attr",
    "dojo/dom-style",
    "jimu/PanelManager",
    "dijit/form/Select",
    "esri/SpatialReference",
    "dijit/form/NumberTextBox",
    "esri/layers/FeatureLayer",
    "dojox/timing",
    "esri/symbols/PictureMarkerSymbol",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/jsonUtils",
    "dojo/string",
    "esri/geometry/Point"
],

    function (declare, BaseWidget, JimuTabContainer, ContentPane, TabContainer, LoadingIndicator, xhr, window, lang, map, on, domConstruct, HorizontalSlider, TextBox, dom, esriRequest,
        Draw, domClass, query, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, Graphic, GraphicsLayer, Query, FeatureSet, GeometryService, BufferParameters, ClosestFacilityParameters,
        ClosestFacilityTask, Geometry, array, topic, Message, QueryTask, domAttr, domStyle, PanelManager, Select, SpatialReference, NumberTextBox, FeatureLayer, Timing, PictureMarkerSymbol, SimpleRenderer, symbolJsonUtils, string, Point) {
        return declare([BaseWidget], {
            baseClass: 'jimu-widget-ServiceFeasibility',
            configData: null,
            networkAnalysisJsonArray: null,
            arrayIntegerValues: null,
            arrayOtherValues: null,
            toolbar: null,
            selectLocationToolbar: null,
            pointBarrierClicked: false,
            polylineBarrierClicked: false,
            polygonBarrierClicked: false,
            selectLocationClicked: false,
            infoPopupEnabled: false,
            isResultExist: false,
            pointBarriersArray: null,
            polylineBarriersArray: null,
            polygonBarriersArray: null,
            selectLocationArray: null,
            panelManager: null,
            viewWindowSize: null,
            selectLocationGraphicLayer: null,
            bufferGraphicLayerId: "bufferGraphicLayer",
            routeGraphicLayerId: "routeGraphicLayer",
            highlightGraphicLayerId: "highlightGraphicLayer",
            highlightGraphicLayer: null,
            businessesLayerDefaultExpression: null,
            resultPanelIndex: 0,
            postCreate: function () {
                this._initializingNetworkAnalysisServiceData();
                this._initializingJimuTabContainer();
                this._initializingFindNearestOptions();
                this._accessGeometryService();
                domConstruct.create("div", { innerHTML: this.nls.FindButton, id: "btnFindButton", "class": "esriCTButtonDisableColor" }, this.divFindButtonContainer);
                domConstruct.create("div", { innerHTML: this.nls.ClearButton, id: "btnClearButton", "class": "esriCTButtonDisableColor" }, this.divClearButtonContainer);
            },
            startup: function () {
                this.toolbar = new Draw(this.map);
                this.toolbar.on("draw-end", lang.hitch(this, function (evt) {
                    this.map.infoWindow.hide();
                    this._addBarrierGraphic(evt);
                }));
                this.selectLocationToolbar = new Draw(this.map);
                this.selectLocationToolbar.on("draw-end", lang.hitch(this, function (evt) {
                    this.map.infoWindow.hide();
                    this._addSelectLocationGraphic(evt);
                }));
                this.selectLocationGraphicLayer = new GraphicsLayer();
                this.map.addLayer(this.selectLocationGraphicLayer);

                this.bufferGraphicLayer = new GraphicsLayer();
                this.bufferGraphicLayer.id = this.bufferGraphicLayerId;
                this.map.addLayer(this.bufferGraphicLayer);

                this.routeGraphicLayer = new GraphicsLayer();
                this.routeGraphicLayer.id = this.routeGraphicLayerId;
                this.map.addLayer(this.routeGraphicLayer);

                this.highlightGraphicLayer = new GraphicsLayer();
                this.highlightGraphicLayer.id = this.highlightGraphicLayerId;

                this.defaultMapExtent = this.map.extent;
                this.loading = new LoadingIndicator({
                    hidden: true
                });
                this.viewWindowSize = window.getBox();
                this.panelManager = PanelManager.getInstance();
                dom.byId(this.panelManager.panels[0].titleNode);
                dom.byId("btnFindButton").disabled = true;
                dom.byId("btnClearButton").disabled = true;
                this._createTimer();
                on(dom.byId("btnFindButton"), "click", lang.hitch(this, function (evt) {
                    if (!dom.byId("btnFindButton").disabled) {
                        dom.byId("btnFindButton").disabled = true;
                        domClass.replace(dom.byId("btnFindButton"), "esriCTButtonDisableColor", "esriCTButtonEnabledColor");
                        domClass.replace(this.imgSelectLocationDojo, "esriCTimgSelectLocation", "esriCTImgLocationSelected");
                        this.selectLocationToolbar.deactivate();
                        domClass.replace(this.pointImageContainer, "esriCTImgPoint", "esriCTImgPointSelected");
                        domClass.replace(this.polylineImageContainer, "esriCTImgPolyline", "esriCTImgPolylineSelected");
                        domClass.replace(this.polygonImageContainer, "esriCTImgPolygon", "esriCTImgPolygonSelected");
                        this.toolbar.deactivate();
                        dom.byId("btnClearButton").disabled = true;
                        domClass.replace(dom.byId("btnClearButton"), "esriCTButtonDisableColor", "esriCTButtonEnabledColor");
                        this.showLoadingIndicator();
                        this._checkParameterValues();
                        if (this.selectLocationClicked) {
                            this._createBufferGeometry([this.locationPointGeometry], [this.config.facilitySearchDistance], this.config.bufferEsriUnits, this.config.bufferWKID);
                        }
                    }
                }));
                on(dom.byId("btnClearButton"), "click", lang.hitch(this, function () {
                    this._onClearButtonClicked();
                }));
                on(this.map, "click", lang.hitch(this, function () {
                    if (this.polylineBarrierClicked || this.polygonBarrierClicked) {
                        this.map.infoWindow.hide();
                    }
                }));
            },
            /**
            Accessing config.json file and creating a global variable for the same
            **/
            _accessGeometryService: function () {
                xhr("config.json", {
                    handleAs: "json"
                }).then(lang.hitch(this, function (data) {
                    this.appConfigData = data;
                    // checking whether geometry service url exists in config file
                    if (this.appConfigData.hasOwnProperty("geometryService")) {
                        if (this.appConfigData.geometryService === null || this.appConfigData.geometryService === "") {
                            this._showAlertMessage(this.nls.invalidGeometryService);
                        }
                    } else {
                        this._showAlertMessage(this.nls.invalidGeometryService);
                    }
                }), function (error) {
                    this._showAlertMessage(error.message);
                });
            },

            /**
            * This function will convert network analysis data into json.
            **/
            _initializingNetworkAnalysisServiceData: function () {
                var requestArguments = {
                    url: this.config.closestFacilityURL,
                    content: { f: "json" },
                    handleAs: "json",
                    callbackParamName: "callback",
                    timeout: 20000
                };
                esriRequest(requestArguments).then(lang.hitch(this, function (response) {
                    this.networkAnalysisJsonArray = response;
                    this._initializingAttributeParameterValues();
                }), lang.hitch(this, function (error) {
                    this._showAlertMessage(error.message);
                }));

            },

            /**
            * This function will initialize jimu tab container.
            **/
            _initializingJimuTabContainer: function () {
                this.tabContainer = new JimuTabContainer({
                    tabs: [
                        {
                            title: this.nls.searchContainerHeading,
                            content: this.tabSearch,
                            selected: true
                        },
                        {
                            title: this.nls.resultsContainerHeading,
                            content: this.tabResults,
                            selected: false
                        }
                    ]
                }, this.tabContainerServiceFeasibility);
                this._switchToResultPanel();
                this.tabContainer.startup();
            },

            /**
            * This function will initialize options in select for Find Nearest.
            **/
            _initializingFindNearestOptions: function () {
                var findNearestOptions, arrayFindNearestOptions, i, labelDiv, labelValue;
                if (this.config && this.config.accessPointsLayersName) {
                    findNearestOptions = this.config.accessPointsLayersName;
                    arrayFindNearestOptions = findNearestOptions.split(",");
                    //Looping through the Nearest Options to create options in a select.
                    for (i = 0; i < arrayFindNearestOptions.length; i++) {
                        domConstruct.create("option", { value: arrayFindNearestOptions[i], innerHTML: arrayFindNearestOptions[i] }, this.selectFindNearest);
                    }
                    labelDiv = query(".esriCTFindNearest", this.divFindNearest)[0];
                    this.resultPanelIndex = (this.resultPanelIndex + 1);
                    if (labelDiv) {
                        labelValue = "";
                        labelValue = (this.resultPanelIndex) + ".  " + this.nls.findNearest;
                        labelDiv.innerHTML = labelValue;
                        this.resultPanelIndex = (this.resultPanelIndex + 1);
                    }
                    this._setLayerForDropdown(this.selectFindNearest.value);
                }
                on(this.selectFindNearest, "change", lang.hitch(this, function (change) {
                    this.businessInfluenceValue.length = 0;
                    if (dom.byId("btnFindButton").disabled === true && this.selectLocationArray && this.selectLocationArray.length > 0) {
                        dom.byId("btnFindButton").disabled = false;
                        domClass.replace(dom.byId("btnFindButton"), "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                    }
                    this._setLayerForDropdown(change.target.value);
                }));
            },

            /**
            * This function will initialize business influence values.
            **/
            _initializingAttributeParameterValues: function () {
                var attributeParameterValues = this.config.attributeName, tempArray, i, m, j;
                this.arrayIntegerValues = [];
                this.arrayOtherValues = [];
                tempArray = [];
                this.businessInfluenceValue = [];
                this.textboxValues = [];
                tempArray = this.networkAnalysisJsonArray.networkDataset.networkAttributes;
                for (i = 0; i < attributeParameterValues.length; i++) {
                    for (m = 0; m < tempArray.length; m++) {
                        // comparing each networkAttributes name with the attributeParameterValues name in config
                        if (tempArray[m].name === attributeParameterValues[i].name) {
                            // checking data type of each networkAttributes and accordingly create slider and dropdown for business influence
                            if (tempArray[m].dataType === "esriNADTDouble" || tempArray[m].dataType === "esriNADTInteger") {
                                if (attributeParameterValues[i].allowUserInput === "true") {
                                    this._createRangeSlider(attributeParameterValues[i]);
                                } else {
                                    this.arrayIntegerValues.push(attributeParameterValues[i].value);
                                }
                            } else {
                                if (attributeParameterValues[i].allowUserInput === "true") {
                                    this._createDropDown(attributeParameterValues[i]);
                                }
                                else {
                                    this.arrayOtherValues.push(attributeParameterValues[i].value);
                                }
                            }
                        }
                    }
                }
                this._setSearchPanelIndex();
            },

            /**
            * This function will create indexes of search panel headings
            **/
            _setSearchPanelIndex: function () {
                var labelDiv, labelValue, selectLocationLabelDiv, selectLocationLabelValue;
                labelDiv = query(".esriCTBarriersLabel", this.divDrawBarriersOnMap)[0];
                selectLocationLabelDiv = query(".esriCTLocationLabel", this.divSelectLocationOnMap)[0];
                if (labelDiv) {
                    labelValue = "";
                    labelValue = this.resultPanelIndex + ".  " + this.nls.DrawBarriersOnMap;
                    if (labelValue) {
                        labelDiv.innerHTML = labelValue;
                        this.resultPanelIndex = (this.resultPanelIndex + 1);
                    }
                }
                if (selectLocationLabelDiv) {
                    selectLocationLabelValue = "";
                    selectLocationLabelValue = this.resultPanelIndex + ".  " + this.nls.SelectLocationOnMap;
                    if (selectLocationLabelValue) {
                        selectLocationLabelDiv.innerHTML = selectLocationLabelValue;
                        this.resultPanelIndex = (this.resultPanelIndex + 1);
                    }
                }
            },

            /**
            * This function will create the Range Slider.
            * param{object}attributeParameterValues: object of attributeParameterValue coming from config.json
            **/
            _createRangeSlider: function (attributeParameterValue) {
                var tempValue, maxValue, minValue, textbox, slider, businessContainer, influenceInput, buisnessInfluenceSlider;
                tempValue = (attributeParameterValue.value.split(","));
                if (tempValue.length < 2) {
                    tempValue = attributeParameterValue.value;
                    maxValue = parseFloat(tempValue);
                    minValue = 0;
                } else {
                    maxValue = parseFloat(tempValue[1], 10);
                    minValue = parseFloat(tempValue[0], 10);
                }
                textbox = new NumberTextBox({
                    name: "txtattributeParameterValue",
                    id: attributeParameterValue.name,
                    value: minValue,
                    "class": "esriCTTxtboxParamValue",
                    required: true,
                    intermediateChanges: true,
                    constraints: { min: minValue, max: maxValue, places: 0, regex: "/^[a-z]{0,3}$/" }
                });
                slider = new HorizontalSlider({
                    name: "slider",
                    id: attributeParameterValue.name + "Slider",
                    value: minValue,
                    minimum: minValue,
                    maximum: maxValue,
                    discreteValues: maxValue + 1
                });
                slider.startup();

                on(dijit.byId(attributeParameterValue.name + "Slider"), "change", lang.hitch(this, function (value) {
                    // enable the find button when disabled and when location is already added to map
                    if (dom.byId("btnFindButton").disabled === true && this.selectLocationArray && this.selectLocationArray.length > 0) {
                        dom.byId("btnFindButton").disabled = false;
                        domClass.replace(dom.byId("btnFindButton"), "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                    }
                    dom.byId(attributeParameterValue.name).value = value;
                }));
                on(textbox, "change", lang.hitch(this, function (evt) {
                    if (parseFloat(textbox.value) >= minValue && parseFloat(textbox.value) <= maxValue && !isNaN(parseFloat(textbox.value))) {
                        // enable the find button when disabled and when location is already added to map
                        if (dom.byId("btnFindButton").disabled === true && this.selectLocationArray && this.selectLocationArray.length > 0) {
                            dom.byId("btnFindButton").disabled = false;
                            domClass.replace(dom.byId("btnFindButton"), "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                        }
                        dijit.byId(attributeParameterValue.name + "Slider").attr("value", textbox.value);
                    } else {
                        dom.byId("btnFindButton").disabled = true;
                        domClass.replace(dom.byId("btnFindButton"), "esriCTButtonDisableColor", "esriCTButtonEnabledColor");
                    }

                }));
                on(textbox, "focusout", lang.hitch(this, function (evt) {
                    textbox.value = evt.target.value.replace(/\s/g, "");
                }));
                businessContainer = domConstruct.create("div", { "class": "esriCTBusinessInfluence" });
                domConstruct.create("div", { "class": "esriCTBusinessInfluenceValue", innerHTML: this.resultPanelIndex + ". " + attributeParameterValue.displayLabel }, businessContainer);
                this.resultPanelIndex = (this.resultPanelIndex + 1);
                influenceInput = domConstruct.create("div", { "class": "esriCTBusinessInfluenceInput" }, businessContainer);
                influenceInput.appendChild(textbox.domNode);
                buisnessInfluenceSlider = domConstruct.create("div", { "class": "esriCTBusinessInfluenceSlider" }, businessContainer);
                buisnessInfluenceSlider.appendChild(slider.domNode);
                this.divBuisnessInfluence.appendChild(businessContainer);
            },

            /**
            * This function will create the Drop Down for business influence value.
            * param{object}attributeParameterValues: object of attributeParameterValue coming from config.json
            **/
            _createDropDown: function (attributeParameterValues) {
                var selectValue, selectOptionArray, selectContainer, selectDropdownList, k, selectOptionArr = [], optionArray;
                selectContainer = domConstruct.create("div", { "class": "esriCTBusinessDropdownContainer" }, this.divBuisnessInfluence);
                domConstruct.create("div", { "class": "esriCTBusinessDropdownLabel", innerHTML: this.resultPanelIndex + ". " + attributeParameterValues.name }, selectContainer);
                this.resultPanelIndex = (this.resultPanelIndex + 1);
                selectDropdownList = domConstruct.create("div", { "class": "esriCTBusinessDropdownValue" }, selectContainer);
                optionArray = this.config.attributeValueLookup;
                selectOptionArray = optionArray.split(",");
                // looping to push all the values with label in an array to create options for business influence dropdown
                for (k = 0; k < selectOptionArray.length; k++) {
                    if (selectOptionArray.hasOwnProperty(k)) {
                        selectOptionArr.push({ "label": selectOptionArray[k], "value": selectOptionArray[k] });
                    }
                }
                selectValue = new Select({
                    options: selectOptionArr,
                    id: attributeParameterValues.name,
                    "class": "esriCTDropdownValues"
                }, selectDropdownList);
                domAttr.set(dom.byId(attributeParameterValues.name), "value", attributeParameterValues.name);
                domClass.add(selectValue, "esriCTDropdownValues");
                on(dom.byId(attributeParameterValues.name), "change", lang.hitch(this, function (selectedVal) {
                    if (this.selectLocationArray.length > 0) {
                        dom.byId(attributeParameterValues.name).set("value", selectedVal);
                        dom.byId("btnFindButton").disabled = false;
                        domClass.replace(dom.byId("btnFindButton"), "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                    }
                }));

            },

            /**
            * This function checks the parameter value for businesss influence.
            **/
            _checkParameterValues: function () {
                var j, txtboxCount, dropDownCount, dropDownID;
                this.businessInfluenceValue.length = 0;
                txtboxCount = query(".esriCTTxtboxParamValue");
                dropDownCount = query(".esriCTDropdownValues");
                // pushing all the business influence values in array
                for (j = 0; j < this.config.attributeName.length; j++) {
                    if (this.config.attributeName[j].allowUserInput === "true") {
                        //checking the length of textbox for business influence && datatype of textbox value
                        if (txtboxCount.length > 0 && (this.networkAnalysisJsonArray.networkDataset.networkAttributes[j].dataType === "esriNADTDouble" || this.networkAnalysisJsonArray.networkDataset.networkAttributes[j].dataType === "esriNADTInteger")) {
                            if (!isNaN(parseFloat(dom.byId(this.config.attributeName[j].name).value))) {
                                this.arrayIntegerValues.push(parseFloat(dom.byId(this.config.attributeName[j].name).value));
                                this.businessInfluenceValue.push(this.arrayIntegerValues.pop());
                                this.selectLocationClicked = true;
                            } else {
                                this.selectLocationClicked = false;
                                dom.byId("btnFindButton").disabled = true;
                                domClass.replace(dom.byId("btnFindButton"), "esriCTButtonDisableColor", "esriCTButtonEnabledColor");
                                this.loading.hide();
                                this._showAlertMessage(this.nls.textboxValueIsInvalid);
                            }
                        } else if (dropDownCount.length > 0) {
                            dropDownID = dom.byId(this.config.attributeName[j].name);
                            this.arrayOtherValues.push(domAttr.get(dropDownID, 'textContent'));
                            this.businessInfluenceValue.push(this.arrayOtherValues.pop());
                        }
                        if (this.selectLocationClicked && dijit.byId(this.config.attributeName[j].name + "Slider")) {
                            dijit.byId(this.config.attributeName[j].name + "Slider").disabled = true;
                            dom.byId(this.config.attributeName[j].name).disabled = true;
                            this.selectFindNearest.disabled = true;
                        }
                    }
                }
            },

            /**
            * This function will execute when user clicked on Point barrier.
            **/
            _onPointBarrierClicked: function () {
                if (!this.pointBarrierClicked) {
                    //Checking the width of the device.
                    if (this.viewWindowSize.w < 768) {
                        this.panelManager.getPanelById(this.id + '_panel').onTitleClick();
                    }
                    if (this.infoPopupEnabled === false) {
                        this.map.infoWindow.hide();
                    }
                    this.pointBarrierClicked = true;
                    this.polylineBarrierClicked = false;
                    this.polygonBarrierClicked = false;
                    this.selectLocationClicked = false;
                    domClass.replace(this.pointImageContainer, "esriCTImgPointSelected", "esriCTImgPoint");
                    this.toolbar.activate(Draw.POINT);
                    this._checkForGeometry();
                } else {
                    this.pointBarrierClicked = false;
                    domClass.replace(this.pointImageContainer, "esriCTImgPoint", "esriCTImgPointSelected");
                    if (this.toolbar._geometryType === "point") {
                        this.toolbar.deactivate();
                    }
                }
            },

            /**
            * This function will execute when user clicked on Polyline Barrier.
            **/
            _onPolylineBarrierClicked: function () {
                if (!this.polylineBarrierClicked) {
                    //Checking the width of the device.
                    if (this.viewWindowSize.w < 768) {
                        this.panelManager.getPanelById(this.id + '_panel').onTitleClick();
                    }
                    if (this.infoPopupEnabled === false) {
                        this.map.infoWindow.hide();
                    }
                    this.polylineBarrierClicked = true;
                    this.polygonBarrierClicked = false;
                    this.pointBarrierClicked = false;
                    this.selectLocationClicked = false;
                    domClass.replace(this.polylineImageContainer, "esriCTImgPolylineSelected", "esriCTImgPolyline");
                    this.toolbar.activate(Draw.POLYLINE);
                    this._checkForGeometry();
                } else {
                    this.polylineBarrierClicked = false;
                    domClass.replace(this.polylineImageContainer, "esriCTImgPolyline", "esriCTImgPolylineSelected");
                    if (this.toolbar._geometryType === "polyline") {
                        this.toolbar.deactivate();
                    }
                }
            },

            /**
            * This function will execute when user clicked on Polygon Barrier.
            **/
            _onPolygonBarrierClicked: function () {
                if (!this.polygonBarrierClicked) {
                    //Checking the width of the device.
                    if (this.viewWindowSize.w < 768) {
                        this.panelManager.getPanelById(this.id + '_panel').onTitleClick();
                    }
                    if (this.infoPopupEnabled === false) {
                        this.map.infoWindow.hide();
                    }
                    this.polygonBarrierClicked = true;
                    this.polylineBarrierClicked = false;
                    this.pointBarrierClicked = false;
                    this.selectLocationClicked = false;
                    domClass.replace(this.polygonImageContainer, "esriCTImgPolygonSelected", "esriCTImgPolygon");
                    this.toolbar.activate(Draw.POLYGON);
                    this._checkForGeometry();
                } else {
                    this.polygonBarrierClicked = false;
                    domClass.replace(this.polygonImageContainer, "esriCTImgPolygon", "esriCTImgPolygonSelected");
                    if (this.toolbar._geometryType === "polygon") {
                        this.toolbar.deactivate();
                    }
                }
            },

            /**
            * This function will execute when user clicked on Select Location.
            **/
            _onSelectLocationClicked: function () {
                if (!this.selectLocationClicked) {
                    //Checking the width of the device.
                    if (this.viewWindowSize.w < 768) {
                        this.panelManager.getPanelById(this.id + '_panel').onTitleClick();
                    }
                    if (this.infoPopupEnabled === false) {
                        this.map.infoWindow.hide();
                    }
                    this.selectLocationClicked = true;
                    this.polylineBarrierClicked = false;
                    this.polygonBarrierClicked = false;
                    this.pointBarrierClicked = false;
                    this.toolbar.deactivate();
                    domClass.replace(this.imgSelectLocationDojo, "esriCTImgLocationSelected", "esriCTimgSelectLocation");
                    this.selectLocationToolbar.activate(Draw.POINT);
                    this._checkForGeometry();
                } else {
                    this.selectLocationClicked = false;
                    domClass.replace(this.imgSelectLocationDojo, "esriCTimgSelectLocation", "esriCTImgLocationSelected");
                    if (this.selectLocationToolbar._geometryType === "point") {
                        this.selectLocationToolbar.deactivate();
                    }
                }
            },

            /**
            * This function checks the geometry of location and geometry for each barriers
            **/
            _checkForGeometry: function () {
                if (!this.pointBarrierClicked) {
                    this.pointBarrierClicked = false;
                    domClass.replace(this.pointImageContainer, "esriCTImgPoint", "esriCTImgPointSelected");
                }
                if (!this.polylineBarrierClicked) {
                    this.polylineBarrierClicked = false;
                    domClass.replace(this.polylineImageContainer, "esriCTImgPolyline", "esriCTImgPolylineSelected");
                }
                if (!this.polygonBarrierClicked) {
                    this.polygonBarrierClicked = false;
                    domClass.replace(this.polygonImageContainer, "esriCTImgPolygon", "esriCTImgPolygonSelected");
                }
                if (!this.selectLocationClicked) {
                    this.selectLocationClicked = false;
                    this.selectLocationToolbar.deactivate();
                    domClass.replace(this.imgSelectLocationDojo, "esriCTimgSelectLocation", "esriCTImgLocationSelected");
                }

            },

            /**
            * This function will add barriers to the map.
            * param{object}evt: object which is coming from draw-end event.
            **/

            _addBarrierGraphic: function (evt) {
                var pointBarrierSymbol, polylineBarrierSymbol, polygonBarrierSymbol, symbol, graphic, btnClear, pointBarrierSymbolData, polylineBarrierData, polygonBarrierData;
                if (this.infoPopupEnabled === false) {
                    this.map.infoWindow.hide();
                }
                if (!this.barrierExists) {
                    this.barrierExists = true;
                    this.pointBarriersArray = [];
                    this.polylineBarriersArray = [];
                    this.polygonBarriersArray = [];
                }

                if (this.config && this.config.symbol && this.config.symbol.length && this.config.symbol.length > 0) {
                    switch (evt.geometry.type) {
                        case "point":
                            pointBarrierSymbolData = this._getSymbolJson("pointBarrierSymbol");
                            pointBarrierSymbol = this._createGraphicFromJSON(pointBarrierSymbolData);
                            symbol = pointBarrierSymbol;
                            this.pointBarriersArray.push(evt.geometry);
                            break;
                        case "polyline":
                            polylineBarrierData = this._getSymbolJson("lineBarrierSymbol");
                            polylineBarrierSymbol = this._createGraphicFromJSON(polylineBarrierData);
                            symbol = polylineBarrierSymbol;
                            this.polylineBarriersArray.push(evt.geometry);
                            break;
                        case "polygon":
                            polygonBarrierData = this._getSymbolJson("polygonBarrierSymbol");
                            polygonBarrierSymbol = this._createGraphicFromJSON(polygonBarrierData);
                            symbol = polygonBarrierSymbol;
                            this.polygonBarriersArray.push(evt.geometry);
                            break;
                    }
                    graphic = new Graphic(evt.geometry, symbol);
                    this.map.graphics.add(graphic);
                }
                btnClear = dom.byId("btnClearButton");
                // enable the find button when disabled and location is already added to map
                if (dom.byId("btnFindButton").disabled === true && this.selectLocationArray && this.selectLocationArray.length && this.selectLocationArray.length > 0) {
                    dom.byId("btnFindButton").disabled = false;
                    domClass.replace(dom.byId("btnFindButton"), "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                }
                // enable clear button when disabled
                if (btnClear.disabled) {
                    btnClear.disabled = false;
                    domClass.replace(btnClear, "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                }
            },

            /**
            * This function will add the select location to the map.
            * param{object}evt: object which is coming from draw-end event.
            **/
            _addSelectLocationGraphic: function (evt) {
                var selectLocationSymbol, graphic, btnFind, btnClear, k, pointLocationSymbolData, businessValue;

                if (!this.appConfigData.geometryService || (this.appConfigData.geometryService === null || this.appConfigData.geometryService === "")) {
                    dom.byId("btnFindButton").disabled = true;
                    domClass.replace(dom.byId("btnClearButton"), "esriCTButtonDisableColor", "esriCTButtonEnabledColor");
                } else {
                    if (this.infoPopupEnabled === false) {
                        this.map.infoWindow.hide();
                    }
                    this.selectLocationGraphicLayer.clear();
                    this.selectLocationArray = [];
                    if (this.config && this.config.symbol && this.config.symbol.length && this.config.symbol.length > 0) {
                        pointLocationSymbolData = this._getSymbolJson("pointLocationSymbol");
                        selectLocationSymbol = this._createGraphicFromJSON(pointLocationSymbolData);
                        this.selectLocationArray.push(evt.geometry);
                        graphic = new Graphic(evt.geometry, selectLocationSymbol);
                        this.selectLocationGraphicLayer.add(graphic);

                        btnFind = dom.byId("btnFindButton");
                        btnClear = dom.byId("btnClearButton");
                        //  validating each slider's value and accordingly enable the find button
                        for (k = 0; k < this.config.attributeName.length; k++) {
                            if (this.config.attributeName[k].allowUserInput === "true") {
                                businessValue = dom.byId(this.config.attributeName[k].name).value;
                                if (btnFind.disabled && !isNaN(dom.byId(this.config.attributeName[k].name).value) && businessValue >= dijit.byId(this.config.attributeName[k].name + "Slider").minimum && businessValue <= dijit.byId(this.config.attributeName[k].name + "Slider").maximum) {
                                    btnFind.disabled = false;
                                    domClass.replace(btnFind, "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                                } else if (isNaN(dom.byId(this.config.attributeName[k].name).value)) {
                                    btnFind.disabled = false;
                                    domClass.replace(btnFind, "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                                }
                            } else {
                                btnFind.disabled = false;
                                domClass.replace(btnFind, "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                            }
                        }
                        if (btnClear.disabled) {
                            btnClear.disabled = false;
                            domClass.replace(btnClear, "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                        }
                        this.locationPointGeometry = graphic.geometry;
                    }
                }
            },

            /**
            * This function clear all the graphic layers on map and reset the controls to default
            **/
            _onClearButtonClicked: function () {
                var resettxtbox, resetDropdown, j;
                this.loading.hide();
                this.map.graphics.clear();
                this.selectLocationGraphicLayer.clear();
                this.map.getLayer("routeGraphicLayer").clear();
                this.map.getLayer("bufferGraphicLayer").clear();
                if (this.highlightGraphicLayer) {
                    this.highlightGraphicLayer.clear();
                }
                this.businessLayer.layerObject.hide();
                domStyle.set(this.resultContainer, "display", "none");
                dom.byId("btnClearButton").disabled = true;
                dom.byId("btnFindButton").disabled = true;
                domClass.replace(dom.byId("btnFindButton"), "esriCTButtonDisableColor", "esriCTButtonEnabledColor");
                domClass.replace(dom.byId("btnClearButton"), "esriCTButtonDisableColor", "esriCTButtonEnabledColor");
                domConstruct.empty(this.resultListContainer);
                domConstruct.empty(this.listTitleContainer);
                domStyle.set(this.resultListContainer, "display", "none");
                domStyle.set(this.listTitleContainer, "display", "none");
                this.locationPointGeometry = null;
                this.toolbar.deactivate();
                this.selectLocationToolbar.deactivate();
                //disable the point barrier control if selected
                if ((this.pointBarriersArray && this.pointBarriersArray.length > 0) || this.pointBarrierClicked) {
                    this.pointBarriersArray.length = 0;
                    this.pointBarrierClicked = false;
                    domClass.replace(this.pointImageContainer, "esriCTImgPoint", "esriCTImgPointSelected");
                }
                //disable the polyline barrier control if selected
                if ((this.polylineBarriersArray && this.polylineBarriersArray.length > 0) || this.polylineBarrierClicked) {
                    this.polylineBarriersArray.length = 0;
                    this.polylineBarrierClicked = false;
                    domClass.replace(this.polylineImageContainer, "esriCTImgPolyline", "esriCTImgPolylineSelected");
                }
                //disable the polygon barrier control if selected
                if ((this.polygonBarriersArray && this.polygonBarriersArray.length > 0) || this.polygonBarrierClicked) {
                    this.polygonBarriersArray.length = 0;
                    this.polygonBarrierClicked = false;
                    domClass.replace(this.polygonImageContainer, "esriCTImgPolygon", "esriCTImgPolygonSelected");
                }
                //disable the select location control if selected
                if ((this.selectLocationArray && this.selectLocationArray.length > 0) || this.selectLocationClicked) {
                    this.selectLocationClicked = false;
                    this.selectLocationArray.length = 0;
                    domClass.replace(this.imgSelectLocationDojo, "esriCTimgSelectLocation", "esriCTImgLocationSelected");
                }
                if (this.infoPopupEnabled === false && (this.routeGraphicLayer.graphics.length !== 0 || this.bufferGraphicLayer.graphics.length !== 0 || this.map.graphics.length !== 0)) {
                    this.map.infoWindow.hide();
                }
                this.selectFindNearest.selectedIndex = 0;
                this._setLayerForDropdown(this.selectFindNearest.value);
                // query for each textbox value of slider for business influence
                resettxtbox = query(".esriCTTxtboxParamValue");
                // query for each drop down value for business influence
                resetDropdown = query(".esriCTDropdownValues");
                // loop to set business influence slider and drop down values to default values
                for (j = 0; j < this.config.attributeName.length; j++) {
                    if (resettxtbox.length > 0 && (this.networkAnalysisJsonArray.networkDataset.networkAttributes[j].dataType === "esriNADTDouble" || this.networkAnalysisJsonArray.networkDataset.networkAttributes[j].dataType === "esriNADTInteger")) {
                        if (this.config.attributeName[j].name === this.networkAnalysisJsonArray.networkDataset.networkAttributes[j].name) {
                            dom.byId(this.config.attributeName[j].name).value = dom.byId(this.config.attributeName[j].name).defaultValue;
                            dijit.byId(this.config.attributeName[j].name + "Slider").attr("value", dom.byId(this.config.attributeName[j].name).value);
                        }
                    } else if (resetDropdown.length > 0 && this.config.attributeName[j].name === this.networkAnalysisJsonArray.networkDataset.networkAttributes[j].name) {
                        dijit.byId(this.config.attributeName[j].name).reset();
                    }
                }
            },

            /**
            * This function will create buffer geometry on the map.
            * param{array} geometry: An array which contains geometries.
            * param{integer} distance: buffer distance.
            * param{integer} unit: buffer unit.
            * param{integer} wkid: sptial reference constant.
            **/
            _createBufferGeometry: function (geometry, distance, unit, wkid) {
                var bufferParams, geometryService, bufferSymbol, bufferResultGeometry, bufferSymbolData, bufferGraphic;
                geometryService = new GeometryService(this.appConfigData.geometryService);
                bufferParams = new BufferParameters();
                bufferParams.distances = distance;
                bufferParams.bufferSpatialReference = new SpatialReference(parseInt(this.config.bufferWKID, 10));
                bufferParams.outSpatialReference = new SpatialReference(parseInt(this.config.bufferWKID, 10));
                bufferParams.unit = GeometryService[unit];
                bufferParams.geometries = geometry;
                try {
                    geometryService.buffer(bufferParams, lang.hitch(this, function (response) {
                        if (bufferParams.geometries[0] && bufferParams.geometries[0].type && bufferParams.geometries[0].type === "point") {
                            this._onBufferGeometryComplete(response);
                        } else {
                            // when buffer geometry is polygon
                            if (this.config && this.config.symbol && this.config.symbol.length && this.config.symbol.length > 0) {
                                bufferSymbolData = this._getSymbolJson("bufferSymbol");
                                bufferSymbol = this._createGraphicFromJSON(bufferSymbolData);
                                array.forEach(response, lang.hitch(this, function (resultGeometry) {
                                    bufferGraphic = new Graphic(resultGeometry, bufferSymbol);
                                    if (this.bufferGraphicLayer.graphics.length > 0) {
                                        this.map.getLayer("bufferGraphicLayer").clear();
                                    }
                                    this.bufferGraphicLayer.add(bufferGraphic);
                                    bufferResultGeometry = resultGeometry;
                                }), lang.hitch(this, function (err) {
                                    this._onClearButtonClicked();
                                    this._showAlertMessage(err.message);
                                    this._enableAllControls();
                                }));
                                this.map.setExtent(bufferResultGeometry.getExtent(), true);
                                this._queryForBusinessData(bufferResultGeometry);
                            }
                        }
                    }), lang.hitch(this, function (error) {
                        this._onBufferGeometryError(error);
                        this._onClearButtonClicked();
                        this._enableAllControls();
                    }));
                } catch (err) {
                    this._showAlertMessage(err.message);
                    this._onClearButtonClicked();
                    this._enableAllControls();
                }
            },

            /**
            * This function will execute when buffer geometry is complete.
            * param{object} geometry: object containing information of buffer geometry.
            **/
            _onBufferGeometryComplete: function (geometries) {
                var storedGeometry = [];
                storedGeometry = geometries[0];
                this._queryForFacilityFeatures(storedGeometry);
            },

            /**
            * This function will execute if any error occured while creating buffer geometries.
            * param {object} error: object containing information regarding error.
            **/
            _onBufferGeometryError: function (error) {
                this._onClearButtonClicked();
                this._showAlertMessage(error.message);
                this._enableAllControls();
            },

            /**
            * This function will query for features lies within the given buffer
            * param{object}geometry:object containing information of buffer geometry.
            **/
            _queryForFacilityFeatures: function (geometry) {
                var queryFeature, queryTask;
                queryFeature = new Query();
                queryFeature.geometry = geometry;
                queryFeature.returnGeometry = true;
                queryFeature.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                queryFeature.outFields = ["*"];
                queryTask = new QueryTask(this.layer);
                queryTask.execute(queryFeature, lang.hitch(this, function (results) {
                    if (results !== null && results.features && results.features.length > 0) {
                        this._getResultantRoutes(results);
                    } else {
                        this.loading.hide();
                        this._onClearButtonClicked();
                        this._showAlertMessage(this.nls.featureNotExist);
                        this._enableAllControls();
                    }
                }), lang.hitch(this, function (error) {
                    this._onClearButtonClicked();
                    this._showAlertMessage(error.message);
                    this._enableAllControls();
                }));
            },

            /**
            * This function will set the parameters for closest facility task and call closest facility task to get closest route
            * @param{array}results:array containing the resultant features of query
            * @return{array}solve: array containing closest facility solve results
            **/
            _getResultantRoutes: function (results) {
                var facilityParams, incidents, facilities, locationGraphics, features = [], pointLocation, attributeParameterValues = [], closestFacilityTask, i;

                facilityParams = new ClosestFacilityParameters();
                facilityParams.defaultCutoff = this.config.defaultCutoff;
                facilityParams.useHierarchy = false;
                facilityParams.returnIncidents = true;
                facilityParams.returnRoutes = true;
                facilityParams.returnFacilities = true;
                facilityParams.returnDirections = false;
                facilityParams.defaultTargetFacilityCount = 1;
                facilityParams.impedenceAttribute = this.config.impedanceAttribute;

                if (this.barrierExists && this.barrierExists === true) {
                    facilityParams.returnBarriers = true;

                    if (this.pointBarriersArray.length > 0) {
                        facilityParams.PointBarriers = this.pointBarriersArray;
                        facilityParams.returnPointBarriers = true;
                    }

                    if (this.polygonBarriersArray.length > 0) {
                        facilityParams.PolygonBarriers = this.polygonBarriersArray;
                        facilityParams.returnPolygonBarriers = true;
                    }

                    if (this.polylineBarriersArray.length > 0) {
                        facilityParams.PolylineBarriers = this.polylineBarriersArray;
                        facilityParams.returnPolylineBarriers = true;
                    }
                }
                // loop to push the each business influence value and each attributeName in attributeParameterValues
                for (i = 0; i < this.config.attributeName.length; i++) {
                    if (this.businessInfluenceValue.length > 0) {
                        attributeParameterValues.push({
                            attributeName: this.config.attributeName[i].name,
                            //parameterName: this.config.parameterName,
                            parameterName: this.config.attributeName[i].displayLabel,
                            value: this.businessInfluenceValue[i].toString()
                        });
                    } else {
                        attributeParameterValues.push({
                            attributeName: this.config.attributeName[i].name,
                            //parameterName: this.config.parameterName,
                            parameterName: this.config.attributeName[i].displayLabel,
                            value: this.config.attributeName[i].value.toString()
                        });
                    }
                }
                facilityParams.attributeParameterValues = attributeParameterValues;
                incidents = new FeatureSet();
                pointLocation = new Graphic(this.locationPointGeometry);
                features.push(pointLocation);
                incidents.features = features;
                facilityParams.incidents = incidents;
                facilities = new FeatureSet();
                locationGraphics = [];
                array.forEach(results.features, function (pointLocation, index) {
                    locationGraphics.push(new Graphic(pointLocation.geometry));
                });
                facilities.features = locationGraphics;
                facilityParams.facilities = facilities;

                facilityParams.outSpatialReference = this.map.spatialReference;
                //set the closest facility task url from config
                closestFacilityTask = new ClosestFacilityTask(this.config.closestFacilityURL);

                // Return solve for closest facility task
                return closestFacilityTask.solve(facilityParams, lang.hitch(this, function (solveResults) {
                    this._showFinalRoute(solveResults.routes[0]);

                }), lang.hitch(this, function (error) {
                    this._onClearButtonClicked();
                    this._showAlertMessage(this.nls.routeSolveError);
                    this._enableAllControls();
                    this.loading.hide();
                }));
            },

            /**
            * This function will draw the closest route path and show
            * @params{object}routes: object containing the information of closest route
            **/
            _showFinalRoute: function (routes) {
                var lineSymbol, finalRoute, pathLine, routeSymbolData;
                this.routeLengthCountValue.innerHTML = routes.attributes.Shape_Length.toFixed(0) + " " + this.config.routeLengthLabelUnits;

                if (this.config && this.config.symbol && this.config.symbol.length && this.config.symbol.length > 0) {
                    routeSymbolData = this._getSymbolJson("routeSymbol");
                    lineSymbol = this._createGraphicFromJSON(routeSymbolData);

                    pathLine = new Geometry.Polyline(this.map.spatialReference);
                    pathLine.addPath(routes.geometry.paths[0]);
                    finalRoute = new Graphic(pathLine, lineSymbol);
                    if (this.routeGraphicLayer && this.routeGraphicLayer.graphics && this.routeGraphicLayer.graphics.length > 0) {
                        this.map.getLayer("routeGraphicLayer").clear();
                    }
                    this.routeGraphicLayer.add(finalRoute);
                    // Call function to draw buffer around the closest route path
                    this._createBufferGeometry([routes.geometry], [this.config.bufferDistance], this.config.bufferEsriUnits, this.config.bufferWKID);
                }
            },

            /**
            * This function will show the loading indicator
            **/
            showLoadingIndicator: function () {
                this.loading.placeAt(this.domNode);
                this.loading.show();
            },

            /**
            * This function will set the feature layer according to the selected option in find nearest dropdown
            * @params{object}value: object containing the value of selected option of dropdown
            **/
            _setLayerForDropdown: function (value) {
                var j;
                // get the url of the values from access point layer dropdown
                for (j = 0; j < this.map.itemInfo.itemData.operationalLayers.length; j++) {
                    if (this.map.itemInfo.itemData.operationalLayers[j].title === this.selectFindNearest.value) {
                        this.layer = this.map.itemInfo.itemData.operationalLayers[j].url;
                    }
                    if (this.map.itemInfo.itemData.operationalLayers[j].title === this.config.businessesLayerName) {
                        this.businessLayer = this.map.itemInfo.itemData.operationalLayers[j];
                    }
                }
            },

            /**
            * This function will query for business features lies inside the buffer of closest route and show them on map
            * @params{object}resultGeometry: object containing information of buffer geometry
            **/
            _queryForBusinessData: function (resultGeometry) {
                var businessQuery, queryLayerTask, dateobj;
                businessQuery = new Query();
                businessQuery.geometry = resultGeometry;
                businessQuery.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                dateobj = new Date().getTime().toString();
                businessQuery.where = dateobj + "=" + dateobj;
                this.businessLayer.layerObject.refresh();
                queryLayerTask = new QueryTask(this.businessLayer.url);
                queryLayerTask.executeForIds(businessQuery, lang.hitch(this, function (queryResult) {
                    if (queryResult.length > 0 && queryResult !== null) {
                        this.businessPassedCountValue.innerHTML = queryResult.length;
                        this.isResultExist = true;
                        this.businessLayer.layerObject.setDefinitionExpression("OBJECTID IN (" + queryResult + ")");
                        this.businessLayer.layerObject.show();
                        this.businessLayer.layerObject.refresh();
                        this._queryForGridFeatures(queryResult);
                        this._enableAllControls();
                    } else if (queryResult.length === 0 && queryResult !== null) {
                        this.isResultExist = true;
                        domConstruct.empty(this.resultListContainer);
                        domConstruct.empty(this.listTitleContainer);
                        this.businessPassedCountValue.innerHTML = queryResult.length;
                        domConstruct.create("div", { "innerHTML": this.nls.noBusinessPassedMsg, "class": "esriCTDefaultCursor" }, this.resultListContainer);
                        domConstruct.create("div", { "innerHTML": this.nls.businessPassedHeading }, this.listTitleContainer);
                        domClass.add(this.resultListContainer.childNodes[0], "esriCTDefaultCursor");
                        this.resultListContainer.disabled = true;
                        this._switchToResultPanel();
                        this._enableAllControls();
                    } else {
                        this.loading.hide();
                        this._onClearButtonClicked();
                        this._showAlertMessage(this.nls.businessFeatureError);
                        this._enableAllControls();
                    }
                    this.loading.hide();
                }), lang.hitch(this, function (err) {
                    this._onClearButtonClicked();
                    this._showAlertMessage(err.message);
                    this._enableAllControls();
                }));
            },

            /**
            * This function change the panel to show results
            **/
            _switchToResultPanel: function () {
                var j;
                for (j = 0; j < this.tabContainer.controlNodes.length; j++) {
                    // when result exists then show the result panel else show search panel
                    if (this.isResultExist) {
                        if (this.tabContainer.controlNodes[j].innerHTML === this.nls.resultsContainerHeading) {
                            domClass.remove(this.tabContainer.controlNodes[j], "jimu-tab>.control>.tab.jimu-state-selected+.tab");
                            domClass.replace(this.tabContainer.controlNodes[j], "tab jimu-vcenter-text jimu-state-selected", "tab jimu-vcenter-text");
                            domStyle.set(this.tabContainer.tabs[j].content, "display", "block");
                            domStyle.set(this.resultContainer, "display", "block");
                            domStyle.set(this.resultListContainer, "display", "block");
                            domStyle.set(this.listTitleContainer, "display", "block");
                        } else if (this.tabContainer.controlNodes[j].innerHTML === this.nls.searchContainerHeading) {
                            domClass.replace(this.tabContainer.controlNodes[j], "tab jimu-vcenter-text", "tab jimu-vcenter-text jimu-state-selected");
                            domStyle.set(this.tabContainer.tabs[j].content, "display", "none");
                            domStyle.set(this.tabSearch, "display", "none");
                        }
                    } else if (this.tabContainer.controlNodes[j].innerHTML === this.nls.resultsContainerHeading) {
                        domStyle.set(this.resultContainer, "display", "none");
                        domStyle.set(this.resultListContainer, "display", "none");
                        domStyle.set(this.listTitleContainer, "display", "none");
                        domClass.add(this.tabContainer.controlNodes[j], "changeForResultContainer");
                    }

                }
            },

            /**
            * This function will enable all the controls of search panel once run analysis is completed
            **/
            _enableAllControls: function () {
                var j;
                dom.byId("btnClearButton").disabled = false;
                domClass.add(dom.byId("btnClearButton"), "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                this.selectLocationClicked = false;
                if (this.config && this.config.attributeName && this.config.attributeName.length && this.config.attributeName.length > 0) {
                    for (j = 0; j < this.config.attributeName.length; j++) {
                        if (this.config.attributeName[j].allowUserInput === "true") {
                            if (this.config.attributeName[j].value !== ",") {
                                dijit.byId(this.config.attributeName[j].name + "Slider").disabled = false;
                                dom.byId(this.config.attributeName[j].name).disabled = false;
                            }
                        }
                    }
                }
                this.selectFindNearest.disabled = false;
            },

            /**
            * This function will query for all the business feature attributes lies within the buffer area
            * @params{object}businessIds: object containing the ids of the businesses passed features
            **/
            _queryForGridFeatures: function (businessIds) {
                var businessResultQuery, dateobj, queryObjectTask, l, resultDisplayField = [], resultDisplayAttributes = [];
                if (businessIds !== null) {
                    businessResultQuery = new Query();
                    dateobj = new Date().getTime().toString();
                    businessResultQuery.outFields = ["*"];
                    businessResultQuery.objectIds = businessIds;
                    businessResultQuery.returnGeometry = true;
                    businessResultQuery.where = dateobj + "=" + dateobj;
                    queryObjectTask = new QueryTask(this.businessLayer.url);
                    queryObjectTask.execute(businessResultQuery, lang.hitch(this, function (result) {
                        if (result && result.features && result.features.length > 0) {
                            for (l = 0; l < result.features.length; l++) {
                                if (result.features[l].attributes.hasOwnProperty(this.config.businessDisplayField)) {
                                    resultDisplayAttributes.push(result.features[l]);
                                    resultDisplayField.push(result.features[l].attributes[this.config.businessDisplayField]);
                                }
                            }
                            this._createResultGrid(resultDisplayField, resultDisplayAttributes);
                        }
                    }), lang.hitch(this, function (err) {
                        this._showAlertMessage(err.message);
                    }));
                }
            },

            /**
            * This function will create the grid for diplaying results of businesses passed
            * @params{Array}displayList: array containing the field text to be displayed on grid
            * @params{Array}attributesList: array containing the geometry and attributes of the features lies within buffer
            **/
            _createResultGrid: function (displayList, attributesList) {
                var m, n, countSelectedFeatures, selectedFeature;
                domConstruct.empty(this.listTitleContainer);
                domConstruct.empty(this.resultListContainer);
                domConstruct.create("div", { innerHTML: this.nls.businessPassedHeading }, this.listTitleContainer);

                // loop to create result grid for each feature and binding the events
                for (m = 0; m < displayList.length; m++) {
                    domConstruct.create("div", { "id": (m + 1) + "esriCTFeatureFieldContainer", "class": "esriCTFeatureFieldContainer", "innerHTML": displayList[m] }, this.resultListContainer);

                }

                this.own(on(this.resultListContainer, "click", lang.hitch(this, function (evt) {
                    selectedFeature = lang.trim(evt.target.innerHTML.replace("amp;", ""));
                    domClass.remove(evt.target, "esriCTHoverFeatureList");
                    countSelectedFeatures = query(".esriCTSelectedFeatureFieldList");
                    // deselect the already selected feature in the result grid
                    for (n = 0; n < countSelectedFeatures.length; n++) {
                        domClass.replace(dom.byId(countSelectedFeatures[n].id), "esriCTDeselectedFeatureList", "esriCTSelectedFeatureFieldList");
                    }
                    domClass.replace(evt.target, "esriCTSelectedFeatureFieldList", "esriCTDeselectedFeatureList");
                    domClass.replace(this.resultListContainer, "esriCTDeselectedFeatureList", "esriCTSelectedFeatureFieldList");
                    if (this.viewWindowSize.w < 768) {
                        this.panelManager.getPanelById(this.id + '_panel').onTitleClick();
                    }

                    this._highlightFeatureOnMap(selectedFeature, attributesList);
                })));
                this.own(on(this.resultListContainer, "mouseover", lang.hitch(this, function (evt) {
                    if (evt.target.childNodes.length < 2) {
                        domClass.replace(evt.target, "esriCTHoverFeatureList", "esriCTFocusoutFeatureList");
                        domClass.remove(this.resultListContainer, "esriCTSelectedFeatureFieldList");
                        domClass.remove(evt.target, "esriCTSelectedFeatureFieldList");
                    }
                })));

                this.own(on(this.resultListContainer, "mouseout", lang.hitch(this, function (evt) {
                    if (evt.target.childNodes.length < 2) {
                        domClass.replace(evt.target, "esriCTFocusoutFeatureList", "esriCTHoverFeatureList");
                        domClass.remove(this.resultListContainer, "esriCTSelectedFeatureFieldList");
                    }
                })));

                this._switchToResultPanel();
            },

            /**
            * This function will highlight the selected feature from the grid and show it on map
            * @params{object}selectedFeature: object containing the selected feature text from the result grid
            * @params{Array}attributesList: array containing the geometry and attributes of the features lies within buffer
            **/
            _highlightFeatureOnMap: function (selectedFeature, attributesList) {
                var m, rippleGraphic, featureGeometry;
                for (m = 0; m < attributesList.length; m++) {
                    if ((attributesList[m].attributes[this.config.businessDisplayField].toString()) === selectedFeature) {
                        featureGeometry = attributesList[m].geometry;
                        rippleGraphic = new Graphic(featureGeometry, null, null, null);
                        this.highlightGraphicLayer.clear();
                        if (attributesList[m].geometry.type === "polyline") {
                            featureGeometry = this._getLineCenter(attributesList[m].geometry);
                        } else if (attributesList[m].geometry.type === "polygon") {
                            featureGeometry = this._getPolygonCentroid(attributesList[m].geometry);
                        } else if (attributesList[m].geometry.type === "point") {
                            featureGeometry = attributesList[m].geometry;
                        }
                        this.highlightGraphicLayer.add(rippleGraphic);
                        if (featureGeometry) {
                            this.map.centerAt(featureGeometry);
                        }
                        this.timer.stop();
                        this.timer.start();
                    }
                }
            },

            /**
            * This function will get the center of polyline geometry
            * @params{object}polyline: polyline geometry
            **/
            _getLineCenter: function (polyline) {
                var path, pointIndex, startPoint, endPoint, polylinePoint;
                path = polyline.paths[Math.round(polyline.paths.length / 2) - 1];
                pointIndex = Math.round((path.length - 1) / 2) - 1;
                startPoint = path[pointIndex];
                endPoint = path[pointIndex + 1];
                polylinePoint = new Point((startPoint[0] + endPoint[0]) / 2.0, (startPoint[1] + endPoint[1]) / 2.0, polyline.spatialReference);
                return polylinePoint;
            },

            /**
            * This function will get the centroid of polygon geometry
            * @params{object}polyline: polygon geometry
            **/
            _getPolygonCentroid: function (polygon) {
                var ring = polygon.rings[Math.round(polygon.rings.length / 2) - 1], centroid, i, polygonPoint, polylinePoint;
                centroid = {
                    x: 0,
                    y: 0
                }; // Array object
                for (i = 0; i < ring.length; i++) {
                    polygonPoint = ring[i];
                    centroid.x += polygonPoint[0];
                    centroid.y += polygonPoint[1];
                }
                centroid.x /= ring.length;
                centroid.y /= ring.length;
                polylinePoint = new Point(centroid.x, centroid.y, polygon.spatialReference);
                return polylinePoint;
            },

            /**
            * This function will set timer for ripple effect on selected feature
            **/
            _createTimer: function () {
                var animatedSymbol, animatedRenderer, jsonObj, baseURL;
                if (this.config && this.config.highlighterDetails && this.config.highlighterDetails.timeout) {
                    this.timer = new Timing.Timer(this.config.highlighterDetails.timeout);
                    this.highlightGraphicLayer = new GraphicsLayer();
                    baseURL = location.href.slice(0, location.href.lastIndexOf('/'));
                    jsonObj = {
                        "type": "esriPMS",
                        "url": string.substitute(this.config.highlighterDetails.imageData, { appPath: baseURL }),
                        "imageData": "",
                        "contentType": "image/png",
                        "color": null,
                        "width": this.config.highlighterDetails.width,
                        "height": this.config.highlighterDetails.height,
                        "angle": 0,
                        "xoffset": 0,
                        "yoffset": 0
                    };
                    animatedSymbol = this._createGraphicFromJSON(jsonObj);
                    animatedRenderer = new SimpleRenderer(animatedSymbol);
                    this.highlightGraphicLayer.setRenderer(animatedRenderer);
                    this.map.addLayer(this.highlightGraphicLayer);
                    this.timer.onTick = lang.hitch(this, function () {
                        this.timer.stop();
                        this.highlightGraphicLayer.clear();
                    });
                }
            },

            /**
            * This function will show all the alert and error messages
            * @params{object}msg: object contains the message content
            **/
            _showAlertMessage: function (msg) {
                var alertMsg = new Message({ message: msg });
                alertMsg.message = msg;
            },

            /**
            *This function will return the symbol as per the provided JSON.
            *@param{object} json: The JSON object from which symbol will be returned.
            *@return{object} symbol:Symbol can be simplefillsymbol, simplemarkersymbol, simplelinesymbol or picturemarkersymbol.
            **/
            _createGraphicFromJSON: function (json) {
                var symbol;
                symbol = symbolJsonUtils.fromJson(json);
                return symbol;
            },

            /**
            *This function will return the symbol JSON of the provided symbol type.
            *@param{object} symbolType: The type of symbol to be converted to JSON.
            *@return{object} symbol: symbol JSON.
            **/
            _getSymbolJson: function (symbolType) {
                var symbolData, i, symbolObjFlag = false, key;
                for (i = 0; i < this.config.symbol.length; i++) {
                    for (key in this.config.symbol[i]) {
                        if (this.config.symbol[i].hasOwnProperty(key)) {
                            if (key === symbolType) {
                                symbolData = this.config.symbol[i][key];
                                symbolObjFlag = true;
                                break;
                            }
                        }
                    }
                    // flag is true then break the loop
                    if (symbolObjFlag) {
                        break;
                    }
                }
                return symbolData;
            }
        });
    });