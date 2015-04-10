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
    "esri/geometry/Point",
    "dojo/Deferred",
    "dojo/promise/all",
    "jimu/dijit/CheckBox"
], function (
    declare,
    BaseWidget,
    JimuTabContainer,
    ContentPane,
    TabContainer,
    LoadingIndicator,
    xhr,
    dojoWindow,
    lang,
    map,
    on,
    domConstruct,
    HorizontalSlider,
    TextBox,
    dom,
    esriRequest,
    Draw,
    domClass,
    query,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    SimpleFillSymbol,
    Color,
    Graphic,
    GraphicsLayer,
    Query,
    FeatureSet,
    GeometryService,
    BufferParameters,
    ClosestFacilityParameters,
    ClosestFacilityTask,
    Geometry,
    array,
    topic,
    Message,
    QueryTask,
    domAttr,
    domStyle,
    PanelManager,
    Select,
    SpatialReference,
    NumberTextBox,
    FeatureLayer,
    Timing,
    PictureMarkerSymbol,
    SimpleRenderer,
    symbolJsonUtils,
    string,
    Point,
    Deferred,
    all,
    CheckBox
) {
    return declare([BaseWidget], {
        baseClass: 'jimu-widget-ServiceFeasibility',
        networkAnalysisJsonArray: null,
        arrayIntegerValues: null,
        arrayOtherValues: null,
        toolbar: null,
        selectLocationToolbar: null,
        pointBarrierClicked: false,
        polylineBarrierClicked: false,
        polygonBarrierClicked: false,
        selectLocationClicked: false,
        errorExist: false,
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
        IsIE: null,
        IsChrome: null,
        IsSafari: null,
        IsOpera: null,
        resultPanelIndex: 0,

        postCreate: function () {
            this._initializingNetworkAnalysisServiceData();
            this._initializingJimuTabContainer();
            this._initializingFindNearestOptions();
            this.loading = new LoadingIndicator({ hidden: true });
            domConstruct.create("div", { innerHTML: this.nls.FindButton, id: "btnFindButton", "class": "esriCTButtonDisableColor" }, this.divFindButtonContainer);
            domConstruct.create("div", { innerHTML: this.nls.ClearButton, id: "btnClearButton", "class": "esriCTButtonDisableColor" }, this.divClearButtonContainer);
            this.IsOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
            this.IsSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
            this.IsChrome = !!window.chrome && !this.IsOpera;
            this.IsIE = !!document.documentMode || false;
            if ((this.appConfig && this.appConfig.hasOwnProperty("geometryService")) && (this.appConfig.geometryService === null || this.appConfig.geometryService === "")) {
                this._showAlertMessage(this.nls.invalidGeometryService);
            } else {
                this._initializeDrawToolAndAddLayer();
            }
        },
        /**
        * This is a startup function for Service Feasibility widget
        * @memberOf widgets/ServiceFeasibility/Widget
        */
        startup: function () {
            dom.byId("btnFindButton").disabled = true;
            dom.byId("btnClearButton").disabled = true;
            this._createTimer();
            on(dom.byId("btnFindButton"), "click", lang.hitch(this, function (evt) {
                if (!dom.byId("btnFindButton").disabled) {
                    domClass.add(this.saveLayercontentContainer, "esriCTHidePanel");
                    domClass.add(this.saveToLayerContainer, "esriCTHidePanel");
                    this._disableAllControls();
                    this.showLoadingIndicator();
                    this._checkParameterValues();
                    this._createBufferGeometry([this.locationPointGeometry], [this.config.facilitySearchDistance], this.config.bufferEsriUnits, [this.map.extent.spatialReference.wkid]);
                }
            }));
            on(dom.byId("btnClearButton"), "click", lang.hitch(this, function () {
                this._onClearButtonClicked();
            }));
            on(this.map, "click", lang.hitch(this, function (evt) {
                if (this.polylineBarrierClicked || this.polygonBarrierClicked) {
                    this.map.infoWindow.hide();
                }
            }));
            this.viewWindowSize = dojoWindow.getBox();
            this.panelManager = PanelManager.getInstance();
            dom.byId(this.panelManager.panels[0].titleNode);
        },
        /**
        * This function will destroy Service Feasibility widget
        * @memberOf widgets/ServiceFeasibility/Widget
        */
        destroy: function () {
            this._onClearButtonClicked();
            this._removeGraphicLayers();
            this.inherited(arguments);
        },

        /**
        * This function will initialize draw toolbar and add graphic layers on map
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _initializeDrawToolAndAddLayer: function () {
            this.toolbar = new Draw(this.map);
            on(this.toolbar, "draw-end", lang.hitch(this, function (evt) {
                if (this.selectLocationClicked) {
                    this._addSelectLocationGraphic(evt);
                } else {
                    this._addBarrierGraphic(evt);
                }
            }));
            this.bufferGraphicLayer = new GraphicsLayer();
            this.bufferGraphicLayer.id = this.bufferGraphicLayerId;
            this.map.addLayer(this.bufferGraphicLayer);
            this.highlightGraphicLayer = new GraphicsLayer();
            this.highlightGraphicLayer.id = this.highlightGraphicLayerId;
            this.barrierGraphicLayer = new GraphicsLayer();
            this.map.addLayer(this.barrierGraphicLayer);
            this.routeGraphicLayer = new GraphicsLayer();
            this.routeGraphicLayer.id = this.routeGraphicLayerId;
            this.map.addLayer(this.routeGraphicLayer);
            this.selectLocationGraphicLayer = new GraphicsLayer();
            this.map.addLayer(this.selectLocationGraphicLayer);
        },

        /**
        * This function will convert network analysis data into json.
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _initializingNetworkAnalysisServiceData: function () {
            var requestArguments;
            // checking whether closest facility url exists in config
            if (this.config && this.config.closestFacilityURL) {
                requestArguments = { url: this.config.closestFacilityURL, content: { f: "json" }, handleAs: "json", callbackParamName: "callback", timeout: 20000 };
                esriRequest(requestArguments).then(lang.hitch(this, function (response) {
                    this.networkAnalysisJsonArray = response;
                    this.showLoadingIndicator();
                    this._initializingAttributeParameterValues();
                }), lang.hitch(this, function (error) {
                    this._showAlertMessage(error.message);
                    if (this.loading) {
                        this.loading.hide();
                    }
                }));
            }
        },

        /**
        * This function will initialize jimu tab container.
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _initializingJimuTabContainer: function () {
            this.tabContainer = new JimuTabContainer({ tabs: [{ title: this.nls.searchContainerHeading, content: this.tabSearch, selected: true }, { title: this.nls.resultsContainerHeading, content: this.tabResults, selected: false}] }, this.tabContainerServiceFeasibility);
            this._switchToResultPanel();
            this.tabContainer.startup();
        },

        /**
        * This function will initialize options in select for Find Nearest.
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _initializingFindNearestOptions: function () {
            var findNearestOptions, arrayFindNearestOptions, i, labelDiv, labelValue;
            if (this.config && this.config.accessPointsLayersName) {
                domClass.remove(this.selectFindNearestDropdownDiv, "esriCTHidePanel");
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

                on(this.selectFindNearest, "change", lang.hitch(this, function (change) {
                    this.businessInfluenceValue.length = 0;
                    if (dom.byId("btnFindButton").disabled === true && this.selectLocationArray && this.selectLocationArray.length > 0) {
                        dom.byId("btnFindButton").disabled = false;
                        domClass.replace(dom.byId("btnFindButton"), "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                    }
                    this._setLayerForDropdown(change.target.value);
                }));
            } else {
                this._showAlertMessage(this.nls.configError);
            }
        },

        /**
        * This function will initialize business influence values.
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _initializingAttributeParameterValues: function () {
            var attributeParameterValues, tempArray, i, m;
            attributeParameterValues = this.config.attributeName;
            this.arrayIntegerValues = [];
            this.arrayOtherValues = [];
            tempArray = [];
            this.businessInfluenceValue = [];
            this.textboxValues = [];
            tempArray = this.networkAnalysisJsonArray.networkDataset.networkAttributes;
            //loop to create control for each attribute parameter name
            for (i = 0; i < attributeParameterValues.length; i++) {
                // loop to compare each networkAttributes name with the attributeParameterValues name in config
                for (m = 0; m < tempArray.length; m++) {
                    if (tempArray[m].name === attributeParameterValues[i].name) {
                        // checking data type of each networkAttributes and accordingly create slider and dropdown for business influence
                        //when data type for networkAttribute is either integer or double and allow user input is true then create range slider else create drop down
                        if (tempArray[m].dataType === "esriNADTDouble" || tempArray[m].dataType === "esriNADTInteger") {
                            if (attributeParameterValues[i].allowUserInput === "true") {
                                this._createRangeSlider(attributeParameterValues[i]);
                            } else {
                                this.arrayIntegerValues.push(attributeParameterValues[i].value);
                            }
                        } else {
                            if (attributeParameterValues[i].allowUserInput === "true") {
                                this._createDropDown(attributeParameterValues[i]);
                            } else {
                                this.arrayOtherValues.push(attributeParameterValues[i].value);
                            }
                        }
                    }
                }
            }
            this._setSearchPanelIndex();
            if (this.loading) {
                this.loading.hide();
            }
        },

        /**
        * This function will create indexes of search panel headings
        * @memberOf widgets/ServiceFeasibility/Widget
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
        * @memberOf widgets/ServiceFeasibility/Widget
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
            textbox = new NumberTextBox({ name: "txtattributeParameterValue", id: attributeParameterValue.name, value: minValue, "class": "esriCTTxtboxParamValue", required: true, intermediateChanges: true, trim: true, constraints: { min: minValue, max: maxValue} });
            slider = new HorizontalSlider({ name: "slider", id: attributeParameterValue.name + "Slider", value: minValue, minimum: minValue, maximum: maxValue, discreteValues: maxValue + 1 });
            slider.startup();
            on(dijit.byId(attributeParameterValue.name + "Slider"), "change", lang.hitch(this, function (value) {
                // enable the find button when disabled and when location is already added to map
                if (dom.byId("btnFindButton").disabled === true && (this.selectLocationArray && this.selectLocationArray.length > 0)) {
                    dom.byId("btnFindButton").disabled = false;
                    domClass.replace(dom.byId("btnFindButton"), "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                }
                if (dom.byId(attributeParameterValue.name)) {
                    dom.byId(attributeParameterValue.name).value = value;
                }
            }));
            this._attachTextBoxEvents(textbox, attributeParameterValue, minValue, maxValue);
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
        * This function will bind the events with business influence textbox
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _attachTextBoxEvents: function (textbox, attributeParameterValue, minValue, maxValue) {
            on(textbox, "change", lang.hitch(this, function (evt) {
                if (isNaN(textbox.value)) {
                    dijit.byId(attributeParameterValue.name + "Slider").attr("value", minValue);
                }
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
                // trim the white spaces if exists
                textbox.value = evt.target.value.replace(/\s/g, "");
            }));
        },

        /**
        * This function will create the Drop Down for business influence value.
        * param{object}attributeParameterValues: object of attributeParameterValue coming from config.json
        * @memberOf widgets/ServiceFeasibility/Widget
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
            selectValue = new Select({ options: selectOptionArr, id: attributeParameterValues.name, "class": "esriCTDropdownValues" }, selectDropdownList);
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
        * @memberOf widgets/ServiceFeasibility/Widget
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
        * @memberOf widgets/ServiceFeasibility/Widget
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
        * @memberOf widgets/ServiceFeasibility/Widget
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
                // set other barriers flags and location flag to false
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
        * @memberOf widgets/ServiceFeasibility/Widget
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
                // set other barriers flags and location flag to false
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
        * @memberOf widgets/ServiceFeasibility/Widget
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
                // set barriers flags to false
                this.polylineBarrierClicked = false;
                this.polygonBarrierClicked = false;
                this.pointBarrierClicked = false;
                domClass.replace(this.imgSelectLocationDojo, "esriCTImgLocationSelected", "esriCTimgSelectLocation");
                this.toolbar.activate(Draw.POINT);
                this._checkForGeometry();
            } else {
                this.selectLocationClicked = false;
                domClass.replace(this.imgSelectLocationDojo, "esriCTimgSelectLocation", "esriCTImgLocationSelected");
                if (this.toolbar._geometryType === "point") {
                    this.toolbar.deactivate();
                }
            }
        },

        /**
        * This function checks the geometry of location and geometry for each barriers
        * @memberOf widgets/ServiceFeasibility/Widget
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
                //                this.selectLocationToolbar.deactivate();
                domClass.replace(this.imgSelectLocationDojo, "esriCTimgSelectLocation", "esriCTImgLocationSelected");
            }
        },

        /**
        * This function will add barriers to the map.
        * param{object}evt: object which is coming from draw-end event.
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _addBarrierGraphic: function (evt) {
            var btnClear;
            if (this.infoPopupEnabled === false) {
                this.map.infoWindow.hide();
            }
            if (!this.barrierExists) {
                this.barrierExists = true;
                this.pointBarriersArray = [];
                this.polylineBarriersArray = [];
                this.polygonBarriersArray = [];
            }
            this._addDataInBarrierArray(evt);
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
        * This function will check and add selected barrier on map
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _addDataInBarrierArray: function (evt) {
            var pointBarrierSymbolData, pointBarrierSymbol, polylineBarrierData, polylineBarrierSymbol, polygonBarrierSymbol, polygonBarrierData, symbol, graphic;
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
            this.barrierGraphicLayer.add(graphic);
        },

        /**
        * This function will add the select location to the map.
        * param{object}evt: object which is coming from draw-end event.
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _addSelectLocationGraphic: function (evt) {
            var selectLocationSymbol, graphic, btnFind, btnClear, k, pointLocationSymbolData, businessValue;
            if (!this.appConfig.geometryService || (this.appConfig.geometryService === null || this.appConfig.geometryService === "")) {
                dom.byId("btnFindButton").disabled = true;
                domClass.replace(dom.byId("btnClearButton"), "esriCTButtonDisableColor", "esriCTButtonEnabledColor");
            } else {
                if (this.infoPopupEnabled === false) {
                    this.map.infoWindow.hide();
                }
                this.selectLocationGraphicLayer.clear();
                this.selectLocationArray = [];
                if (this.config && this.config.symbol && this.config.symbol.length && this.config.symbol.length > 0 && this.config.accessPointsLayersName) {
                    pointLocationSymbolData = this._getSymbolJson("pointLocationSymbol");
                    selectLocationSymbol = this._createGraphicFromJSON(pointLocationSymbolData);
                    this.selectLocationArray.push(evt.geometry);
                    graphic = new Graphic(evt.geometry, selectLocationSymbol);
                    this.selectLocationGraphicLayer.add(graphic);
                    btnFind = dom.byId("btnFindButton");
                    btnClear = dom.byId("btnClearButton");
                    //  validating each slider's value and accordingly enable the find button
                    if (this.config.attributeName.length > 0) {
                        for (k = 0; k < this.config.attributeName.length; k++) {
                            if (this.config.attributeName[k].allowUserInput === "true") {
                                if (dom.byId(this.config.attributeName[k].name).value !== "") {
                                    businessValue = dom.byId(this.config.attributeName[k].name).value;
                                    // check for valid range slider value else check for valid drop down value, if valid accordingly enable find button
                                    if (btnFind.disabled && !isNaN(parseInt(dom.byId(this.config.attributeName[k].name).value, 10)) && businessValue >= dijit.byId(this.config.attributeName[k].name + "Slider").minimum && businessValue <= dijit.byId(this.config.attributeName[k].name + "Slider").maximum) {
                                        btnFind.disabled = false;
                                        domClass.replace(btnFind, "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                                    } else if (isNaN(parseFloat((dom.byId(this.config.attributeName[k].name).value))) && dom.byId(this.config.attributeName[k].name).value !== "") {
                                        btnFind.disabled = false;
                                        domClass.replace(btnFind, "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                                    }
                                }
                            } else {
                                btnFind.disabled = false;
                                domClass.replace(btnFind, "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                            }
                        }
                    } else {
                        btnFind.disabled = false;
                        domClass.replace(btnFind, "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
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
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _onClearButtonClicked: function () {
            if (!dom.byId("btnClearButton").disabled || this.errorExist) {
                var resettxtbox, resetDropdown, j, i;
                this.loading.hide();
                this.barrierGraphicLayer.clear();
                this.selectLocationGraphicLayer.clear();
                this.map.getLayer("routeGraphicLayer").clear();
                this.map.getLayer("bufferGraphicLayer").clear();
                if (this.highlightGraphicLayer) {
                    this.highlightGraphicLayer.clear();
                }
                this.businessLayer.layerObject.hide();
                domStyle.set(this.resultContainer, "display", "none");
                domStyle.set(this.resultListContainer, "display", "none");
                domStyle.set(this.listTitleContainer, "display", "none");
                this.locationPointGeometry = null;
                this._disableBarrierControls();
                this.selectFindNearest.selectedIndex = 0;
                this._setLayerForDropdown(this.selectFindNearest.value);
                this._disableAllControls();
                this.isClearClicked = true;
                this.errorExist = false;
                this.saveLayerClicked = false;
                this._setDisplayForPanels();
                // query for each textbox value of slider for business influence
                resettxtbox = query(".esriCTTxtboxParamValue");
                // query for each drop down value for business influence
                resetDropdown = query(".esriCTDropdownValues");
                // loop to set business influence slider and drop down values to default values
                for (j = 0; j < this.config.attributeName.length; j++) {
                    for (i = 0; i < this.networkAnalysisJsonArray.networkDataset.networkAttributes.length; i++) {
                        if (resettxtbox.length > 0 && (this.networkAnalysisJsonArray.networkDataset.networkAttributes[i].dataType === "esriNADTDouble" || this.networkAnalysisJsonArray.networkDataset.networkAttributes[i].dataType === "esriNADTInteger")) {
                            if (this.config.attributeName[j].name === this.networkAnalysisJsonArray.networkDataset.networkAttributes[i].name) {
                                if (dom.byId(this.config.attributeName[j].name)) {
                                    dom.byId(this.config.attributeName[j].name).value = dom.byId(this.config.attributeName[j].name).defaultValue;
                                    dom.byId(this.config.attributeName[j].name).blur();
                                }
                                if (dijit.byId(this.config.attributeName[j].name + "Slider")) {
                                    dijit.byId(this.config.attributeName[j].name + "Slider").reset();
                                }
                            }
                        } else if (resetDropdown.length > 0 && this.config.attributeName[j].name === this.networkAnalysisJsonArray.networkDataset.networkAttributes[i].name) {
                            if (dijit.byId(this.config.attributeName[j].name)) {
                                dijit.byId(this.config.attributeName[j].name).reset();
                            }
                        }
                    }
                }
            }
        },
        /**
        * This function will remove all graphic layers from map
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _removeGraphicLayers: function () {
            this.map.removeLayer(this.bufferGraphicLayer);
            this.map.removeLayer(this.routeGraphicLayer);
            this.map.removeLayer(this.highlightGraphicLayer);
            this.map.removeLayer(this.selectLocationGraphicLayer);
            this.map.removeLayer(this.barrierGraphicLayer);
        },

        /**
        * This function will disable barriers and location controls
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _disableBarrierControls: function () {
            //disable the point barrier control if selected
            if ((this.pointBarriersArray && this.pointBarriersArray.length > 0) || this.pointBarrierClicked) {
                this.pointBarriersArray.length = 0;
                this.pointBarrierClicked = false;
            }
            //disable the polyline barrier control if selected
            if ((this.polylineBarriersArray && this.polylineBarriersArray.length > 0) || this.polylineBarrierClicked) {
                this.polylineBarriersArray.length = 0;
                this.polylineBarrierClicked = false;
            }
            //disable the polygon barrier control if selected
            if ((this.polygonBarriersArray && this.polygonBarriersArray.length > 0) || this.polygonBarrierClicked) {
                this.polygonBarriersArray.length = 0;
                this.polygonBarrierClicked = false;
            }
            //disable the select location control if selected
            if ((this.selectLocationArray && this.selectLocationArray.length > 0) || this.selectLocationClicked) {
                this.selectLocationClicked = false;
                this.selectLocationArray.length = 0;
            }
            if (this.infoPopupEnabled === false && ((this.routeGraphicLayer && this.routeGraphicLayer.graphics && this.routeGraphicLayer.graphics.length !== 0) || (this.bufferGraphicLayer && this.bufferGraphicLayer.graphics && this.bufferGraphicLayer.graphics.length !== 0) || this.barrierGraphicLayer.graphics.length !== 0)) {
                this.map.infoWindow.hide();
            }
        },

        /**
        * This function will create buffer geometry on the map.
        * param{array} geometry: An array which contains geometries.
        * param{integer} distance: buffer distance.
        * param{integer} unit: buffer unit.
        * param{integer} wkid: sptial reference constant.
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _createBufferGeometry: function (geometry, distance, unit, wkid) {
            var bufferParams, geometryService;
            geometryService = new GeometryService(this.appConfig.geometryService);
            bufferParams = new BufferParameters();
            bufferParams.distances = distance;
            bufferParams.bufferSpatialReference = new SpatialReference(parseInt(wkid, 10));
            bufferParams.outSpatialReference = new SpatialReference(parseInt(wkid, 10));
            bufferParams.unit = GeometryService[unit];
            bufferParams.geometries = geometry;
            try {
                geometryService.buffer(bufferParams, lang.hitch(this, function (response) {
                    this._addBufferGeometryOnMap(response, bufferParams);
                }), lang.hitch(this, function (error) {
                    this._onBufferGeometryError(error);
                    this._onClearButtonClicked();
                    this._enableAllControls();
                    if (this.loading) {
                        this.loading.hide();
                    }
                }));
            } catch (err) {
                this._showAlertMessage(err.message);
                this.errorExist = true;
                this._onClearButtonClicked();
                this._enableAllControls();
                if (this.loading) {
                    this.loading.hide();
                }
            }
        },

        /**
        * This function will create the buffer on map
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _addBufferGeometryOnMap: function (response, bufferParams) {
            var bufferResultGeometry, bufferGraphic, bufferSymbol, bufferSymbolData;
            // when buffer geomtery is point
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
                        if (this.loading) {
                            this.loading.hide();
                        }
                    }));
                    this.map.setExtent(bufferResultGeometry.getExtent(), true);
                    this._queryForBusinessData(bufferResultGeometry);
                }
            }
        },

        /**
        * This function will execute when buffer geometry is complete.
        * param{object} geometry: object containing information of buffer geometry.
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _onBufferGeometryComplete: function (geometries) {
            var storedGeometry = [];
            storedGeometry = geometries[0];
            this._queryForFacilityFeatures(storedGeometry);
        },

        /**
        * This function will execute if any error occured while creating buffer geometries.
        * param {object} error: object containing information regarding error.
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _onBufferGeometryError: function (error) {
            this._onClearButtonClicked();
            this._showAlertMessage(error.message);
            this._enableAllControls();
        },

        /**
        * This function will query for facility features lies within the given buffer
        * param{object}geometry:object containing information of buffer geometry.
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _queryForFacilityFeatures: function (geometry) {
            var queryFeature, queryTask;
            queryFeature = new Query();
            queryFeature.geometry = geometry;
            queryFeature.returnGeometry = true;
            queryFeature.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            queryFeature.outFields = ["*"];
            queryTask = new QueryTask(this.layer);
            queryTask.execute(queryFeature, lang.hitch(this, function (results) {
                if (results !== null && results.features && results.features.length > 0) {
                    this._getResultantRoutes(results);
                } else {
                    this.loading.hide();
                    this.errorExist = true;
                    this._onClearButtonClicked();
                    this._showAlertMessage(this.nls.featureNotExist);
                    this._enableAllControls();
                }
            }), lang.hitch(this, function (error) {
                this.errorExist = true;
                this._onClearButtonClicked();
                this._showAlertMessage(error.message);
                this._enableAllControls();
                if (this.loading) {
                    this.loading.hide();
                }
            }));
        },

        /**
        * This function will set the parameters for closest facility task and call closest facility task to get closest route
        * @param{array}results:array containing the resultant features of query
        * @return{array}solve: array containing closest facility solve results
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _getResultantRoutes: function (results) {
            var facilityParams, incidents, facilities, locationGraphics, features = [], pointLocation, attributeParameterValues = [], closestFacilityTask, i;
            facilityParams = this._getFacilityParameters();
            // loop to push the each business influence value and each attributeName in attributeParameterValues
            for (i = 0; i < this.config.attributeName.length; i++) {
                if (this.businessInfluenceValue.length > 0) {
                    attributeParameterValues.push({
                        attributeName: this.config.attributeName[i].name,
                        parameterName: this.config.attributeName[i].displayLabel,
                        value: this.businessInfluenceValue[i].toString()
                    });
                    this.businessInfluenceValue.splice(array.indexOf(this.businessInfluenceValue, this.businessInfluenceValue[i]));
                } else {
                    attributeParameterValues.push({
                        attributeName: this.config.attributeName[i].name,
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
                this.errorExist = true;
                this._onClearButtonClicked();
                this._showAlertMessage(this.nls.routeSolveError);
                this._enableAllControls();
                this.loading.hide();
            }));
        },

        /**
        * This function will set the facility parameters for Closest facility Task and check for barriers
        * @return{array} : array of facility parameters
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _getFacilityParameters: function () {
            var facilityParams;
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
                // check for point barriers
                if (this.pointBarriersArray.length > 0) {
                    facilityParams.PointBarriers = this.pointBarriersArray;
                    facilityParams.returnPointBarriers = true;
                }
                // check for polygon barriers
                if (this.polygonBarriersArray.length > 0) {
                    facilityParams.PolygonBarriers = this.polygonBarriersArray;
                    facilityParams.returnPolygonBarriers = true;
                }
                // check for polyline barriers
                if (this.polylineBarriersArray.length > 0) {
                    facilityParams.PolylineBarriers = this.polylineBarriersArray;
                    facilityParams.returnPolylineBarriers = true;
                }
            }
            return facilityParams;
        },

        /**
        * This function will draw the closest route path and show it on map
        * @params{object}routes: object containing the information of closest route
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _showFinalRoute: function (routes) {
            var lineSymbol, finalRoute, pathLine, routeSymbolData;
            this.routeLengthCountValue.innerHTML = routes.attributes.Shape_Length.toFixed(0) + " " + this.config.routeLengthLabelUnits;
            if (this.config && this.config.symbol && this.config.symbol.length && this.config.symbol.length > 0) {
                routeSymbolData = this._getSymbolJson("routeSymbol");
                lineSymbol = this._createGraphicFromJSON(routeSymbolData);
                this.shortestPath = routes;
                pathLine = new Geometry.Polyline(this.map.spatialReference);
                pathLine.addPath(routes.geometry.paths[0]);
                finalRoute = new Graphic(pathLine, lineSymbol);
                if (this.routeGraphicLayer && this.routeGraphicLayer.graphics && this.routeGraphicLayer.graphics.length > 0) {
                    this.map.getLayer("routeGraphicLayer").clear();
                }
                this.routeGraphicLayer.add(finalRoute);
                // Call function to draw buffer around the closest route path
                this._createBufferGeometry([routes.geometry], [this.config.bufferDistance], this.config.bufferEsriUnits, [this.map.extent.spatialReference.wkid]);
            }
        },

        /**
        * This function will show the loading indicator
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        showLoadingIndicator: function () {
            this.loading.placeAt(this.domNode);
            this.loading.show();
        },

        /**
        * This function will set the feature layer according to the selected option in find nearest dropdown
        * @params{object}value: object containing the value of selected option of dropdown
        * @memberOf widgets/ServiceFeasibility/Widget
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
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _queryForBusinessData: function (resultGeometry) {
            var businessQuery, queryLayerTask, dateobj;
            businessQuery = new Query();
            businessQuery.geometry = resultGeometry;
            businessQuery.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            dateobj = new Date().getTime().toString();
            businessQuery.where = dateobj + "=" + dateobj;
            this.businessLayer.layerObject.refresh();
            queryLayerTask = new QueryTask(this.businessLayer.url);
            queryLayerTask.executeForIds(businessQuery, lang.hitch(this, function (queryResult) {
                this._showBusinessDataOnMap(queryResult);
            }), lang.hitch(this, function (err) {
                this.errorExist = true;
                this._onClearButtonClicked();
                this._showAlertMessage(err.message);
                this._enableAllControls();
            }));
        },

        /**
        * This function will show the business feature graphics on map
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _showBusinessDataOnMap: function (queryResult) {
            var saveToLayer, saveExportDiv;
            if (queryResult.length > 0 && queryResult !== null) {
                this.businessPassedCountValue.innerHTML = queryResult.length;
                this.isResultExist = true;
                this.businessLayer.layerObject.setDefinitionExpression("OBJECTID IN (" + queryResult + ")");
                this.businessLayer.layerObject.show();
                this.businessLayer.layerObject.refresh();
                this._queryForObjectIds(queryResult);
                this._enableAllControls();
            } else if (queryResult.length === 0 && queryResult !== null) {
                this.isResultExist = true;
                domConstruct.empty(this.resultListContainer);
                domConstruct.empty(this.listTitleContainer);
                this.businessPassedCountValue.innerHTML = queryResult.length;
                domConstruct.create("div", { "innerHTML": this.nls.noBusinessPassedMsg, "class": "esriCTDefaultCursor" }, this.resultListContainer);
                domConstruct.create("div", { "innerHTML": this.nls.businessPassedHeading, "class": "esriCTBusinessPassedListLabel" }, this.listTitleContainer);
                domClass.add(this.resultListContainer.childNodes[0], "esriCTDefaultCursor");
                if (this.config.targetBusinessLayer || this.config.targetRouteLayer) {
                    saveExportDiv = domConstruct.create("div", { "class": "esriCTSaveExportBtnDiv" }, this.listTitleContainer);
                    saveToLayer = domConstruct.create("div", { "class": "esriCTSaveLayerBtn", "title": this.nls.saveLayerTitle }, saveExportDiv);
                    on(saveToLayer, "click", lang.hitch(this, function () {
                        this.saveLayerClicked = true;
                        this.isResultExist = false;
                        this._switchToResultPanel();
                        this._onSaveToLayerClick();
                    }));
                }
                this.resultListContainer.disabled = true;
                this._switchToResultPanel();
                this._enableAllControls();
            } else {
                this.loading.hide();
                this.errorExist = true;
                this._onClearButtonClicked();
                this._showAlertMessage(this.nls.businessFeatureError);
                this._enableAllControls();
            }
        },

        /**
        * This function change the panel to show results
        * @memberOf widgets/ServiceFeasibility/Widget
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
                        domStyle.set(this.businessTitleContainer, "display", "block");
                    } else if (this.tabContainer.controlNodes[j].innerHTML === this.nls.searchContainerHeading) {
                        domClass.replace(this.tabContainer.controlNodes[j], "tab jimu-vcenter-text", "tab jimu-vcenter-text jimu-state-selected");
                        domStyle.set(this.tabContainer.tabs[j].content, "display", "none");
                        domStyle.set(this.tabSearch, "display", "none");
                    }
                } else if (this.tabContainer.controlNodes[j].innerHTML === this.nls.resultsContainerHeading && !this.saveLayerClicked) {
                    domStyle.set(this.resultContainer, "display", "none");
                    domStyle.set(this.resultListContainer, "display", "none");
                    domStyle.set(this.listTitleContainer, "display", "none");
                    domClass.add(this.tabContainer.controlNodes[j], "changeForResultContainer");
                } else if (this.saveLayerClicked) {
                    domStyle.set(this.tabContainer.controlNodes[j], "display", "none");
                }
            }
            if (this.loading) {
                this.loading.hide();
            }
        },

        /**
        * This function will disable all the controls of search & result panel
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _disableAllControls: function () {
            dom.byId("btnFindButton").disabled = true;
            domClass.replace(dom.byId("btnFindButton"), "esriCTButtonDisableColor", "esriCTButtonEnabledColor");
            domClass.replace(this.imgSelectLocationDojo, "esriCTimgSelectLocation", "esriCTImgLocationSelected");
            domClass.replace(this.pointImageContainer, "esriCTImgPoint", "esriCTImgPointSelected");
            domClass.replace(this.polylineImageContainer, "esriCTImgPolyline", "esriCTImgPolylineSelected");
            domClass.replace(this.polygonImageContainer, "esriCTImgPolygon", "esriCTImgPolygonSelected");
            domClass.replace(dom.byId("btnClearButton"), "esriCTButtonDisableColor", "esriCTButtonEnabledColor");
            this.toolbar.deactivate();
            dom.byId("btnClearButton").disabled = true;
            domConstruct.empty(this.listTitleContainer);
            domConstruct.empty(this.resultListContainer);
            this.isClearClicked = false;
        },

        /**
        * This function will enable all the controls of search panel once run analysis is completed
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _enableAllControls: function () {
            var j;
            if (this.barrierGraphicLayer.graphics.length > 0 || this.selectLocationGraphicLayer.graphics.length > 0 || this.map.getLayer("routeGraphicLayer").graphics.length > 0 || this.map.getLayer("bufferGraphicLayer").length > 0) {
                domClass.add(dom.byId("btnClearButton"), "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                dom.byId("btnClearButton").disabled = false;
            }
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
        * @params{array}batchIds: array containing the ids of the businesses passed features
        * @return{object}queryObjectDeferred: promise object of the request
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _queryForGridFeatures: function (batchIds) {
            var dateobj, queryObjectTask, queryObjectDeferred, businessResultQuery;
            businessResultQuery = new Query();
            dateobj = new Date().getTime().toString();
            businessResultQuery.outFields = ["*"];
            businessResultQuery.objectIds = batchIds;
            businessResultQuery.returnGeometry = true;
            businessResultQuery.where = dateobj + "=" + dateobj;
            queryObjectTask = new QueryTask(this.businessLayer.url);
            queryObjectDeferred = queryObjectTask.execute(businessResultQuery, lang.hitch(this, function (result) {
                queryObjectDeferred.resolve(result);
            }), lang.hitch(this, function (err) {
                queryObjectDeferred.resolve();
                this.errorExist = true;
                this._onClearButtonClicked();
                this._showAlertMessage(err.message);
                if (this.loading) {
                    this.loading.hide();
                }
            }));
            return queryObjectDeferred;
        },

        /**
        * This function will handle the deferred promise returned from _queryForGridFeatures function containing result for each feature lies in the buffer
        * @params{array}businessIds: array containing the ids of the businesses passed features
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _queryForObjectIds: function (businessIds) {
            var batchIds = [], resultDisplayField = [], batch, startIdx, endIdx, deferredArray = [], l, j, i;
            this.resultDisplayAttributes = [];
            if (businessIds !== null) {
                batch = Math.ceil(businessIds.length / 1000);
                for (i = 1; i < batch + 2; i++) {
                    batchIds = [];
                    startIdx = 0;
                    endIdx = 0;
                    if (i !== batch) {
                        endIdx = (i * 1000);
                        startIdx = endIdx - 1000;
                    } else {
                        endIdx = businessIds.length;
                        startIdx = (i - 1) * 1000;
                    }
                    batchIds = businessIds.slice(startIdx, endIdx);
                    deferredArray.push(this._queryForGridFeatures(batchIds));
                    if (endIdx === businessIds.length) {
                        break;
                    }
                }
                all(deferredArray).then(lang.hitch(this, function (result) {
                    if (result && result.length > 0) {
                        // loop to get the attributes of each feature for the given field in config and push it in array
                        for (j = 0; j < result.length; j++) {
                            if (result[j] && result[j].features && result[j].features.length > 0) {
                                for (l = 0; l < result[j].features.length; l++) {
                                    if (result[j].features[l].attributes.hasOwnProperty(this.config.businessDisplayField)) {
                                        this.resultDisplayAttributes.push(result[j].features[l]);
                                        resultDisplayField.push(result[j].features[l].attributes[this.config.businessDisplayField]);
                                    }
                                }
                                this._createResultGrid(resultDisplayField, this.resultDisplayAttributes);
                            }
                        }
                    }
                }));
            }

        },

        /**
        * This function will create the grid for diplaying results of businesses passed
        * @params{Array}displayList: array containing the field text to be displayed on grid
        * @params{Array}resultFeatures: array containing the geometry and attributes of the features lies within buffer
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _createResultGrid: function (displayList, resultFeatures) {
            var m, saveToLayer, exportToCSV, list, saveExportDiv;
            domConstruct.empty(this.listTitleContainer);
            domConstruct.create("div", { "class": "esriCTBusinessPassedListLabel", "innerHTML": this.nls.businessPassedHeading }, this.listTitleContainer);
            saveExportDiv = domConstruct.create("div", { "class": "esriCTSaveExportBtnDiv" }, this.listTitleContainer);
            if (this.config.exportToCSV) {
                exportToCSV = domConstruct.create("div", { "class": "esriCTexportCsvBtn", "title": this.nls.exportToCSVTitle }, saveExportDiv);
                on(exportToCSV, "click", lang.hitch(this, function () {
                    this._onExportToCSVClick();
                }));
            }
            if (this.config.targetBusinessLayer || this.config.targetRouteLayer) {
                saveToLayer = domConstruct.create("div", { "class": "esriCTSaveLayerBtn", "title": this.nls.saveLayerTitle }, saveExportDiv);
                on(saveToLayer, "click", lang.hitch(this, function () {
                    this.saveLayerClicked = true;
                    this.isResultExist = false;
                    this._switchToResultPanel();
                    this._onSaveToLayerClick();
                }));
            }
            // loop to create result grid for each feature and binding the events
            for (m = 0; m < displayList.length; m++) {
                list = domConstruct.create("div", { "id": (m + 1) + "esriCTFeatureFieldContainer", "class": "esriCTFeatureFieldContainer", "innerHTML": displayList[m] }, this.resultListContainer);


                this._attachEventsToResultListContainer(resultFeatures, list);
            }
            this._switchToResultPanel();
        },

        /**
        * This function will bind the events for each result in the business passed grid
        * @params{Array}resultFeatures: array containing the geometry and attributes of the features lies within buffer
        * @params{object}list: object containing displayed information about feature
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _attachEventsToResultListContainer: function (resultFeatures, list) {
            var countSelectedFeatures, selectedFeature;
            this.own(on(list, "click", lang.hitch(this, function (evt) {
                selectedFeature = lang.trim(evt.target.innerHTML.replace("amp;", ""));
                domClass.remove(evt.target, "esriCTHoverFeatureList");
                countSelectedFeatures = query(".esriCTSelectedFeatureFieldList");
                // deselect the already selected feature in the result grid
                if (countSelectedFeatures.length > 0) {
                    domClass.remove(dom.byId(countSelectedFeatures[0].id), "esriCTHoverFeatureList");
                    domClass.replace(dom.byId(countSelectedFeatures[0].id), "esriCTDeselectedFeatureList", "esriCTSelectedFeatureFieldList");
                }
                domClass.replace(evt.target, "esriCTSelectedFeatureFieldList", "esriCTDeselectedFeatureList");
                domClass.replace(this.resultListContainer, "esriCTDeselectedFeatureList", "esriCTSelectedFeatureFieldList");
                if (this.viewWindowSize.w < 768) {
                    this.panelManager.getPanelById(this.id + '_panel').onTitleClick();
                }
                this._highlightFeatureOnMap(selectedFeature, resultFeatures);


            })));
            this.own(on(list, "mouseover", lang.hitch(this, function (evt) {
                if (evt.target.childNodes.length < 2 && !(evt.target.innerHTML === this.nls.noBusinessPassedMsg)) {
                    domClass.replace(evt.target, "esriCTHoverFeatureList", "esriCTFocusoutFeatureList");
                }
            })));
            this.own(on(list, "mouseout", lang.hitch(this, function (evt) {
                if (evt.target.childNodes.length < 2 && !domClass.contains(evt.target, "esriCTSelectedFeatureFieldList")) {
                    domClass.replace(evt.target, "esriCTFocusoutFeatureList", "esriCTHoverFeatureList");

                }
            })));
        },

        /**
        * This function will highlight the selected feature from the grid and show it on map
        * @params{object}selectedFeature: object containing the selected feature text from the result grid
        * @params{Array}resultFeatures: array containing the geometry and attributes of the features lies within buffer
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _highlightFeatureOnMap: function (selectedFeature, resultFeatures) {
            var m, rippleGraphic, featureGeometry;
            for (m = 0; m < resultFeatures.length; m++) {
                if ((resultFeatures[m].attributes[this.config.businessDisplayField].toString()) === selectedFeature) {
                    this.highlightGraphicLayer.clear();
                    if (resultFeatures[m].geometry.type === "polyline") {
                        featureGeometry = this._getLineCenter(resultFeatures[m].geometry);
                    } else if (resultFeatures[m].geometry.type === "polygon") {
                        featureGeometry = this._getPolygonCentroid(resultFeatures[m].geometry);
                    } else if (resultFeatures[m].geometry.type === "point") {
                        featureGeometry = resultFeatures[m].geometry;
                    }
                    if (featureGeometry) {
                        rippleGraphic = new Graphic(featureGeometry, null, null, null);
                        this.highlightGraphicLayer.add(rippleGraphic);
                        this.map.centerAt(featureGeometry);
                    }
                    this.timer.stop();
                    this.timer.start();
                }
            }
        },

        /**
        * This function will handle the returned deferred promise from createCSVContent function
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _onExportToCSVClick: function () {
            var deferredArray = [];
            deferredArray.push(this._createCSVContent());
            all(deferredArray).then(lang.hitch(this, function (result) {
                if (result && result.length !== 0) {
                    this._onExportToCsvComplete(this.businessLayer.title, result);
                }
            }), lang.hitch(this, function (error) {
                this._showAlertMessage(error.message);
                if (this.loading) {
                    this.loading.hide();
                }
            }));
        },

        /**
        * This function will create the content to export in format of CSV
        *  @return{object}deferred: promise object of the request
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _createCSVContent: function () {
            var i, fieldAttributes = [], csvNewLineChar, fieldName = [], deferred, csvContent;
            deferred = new Deferred();
            try {
                setTimeout(lang.hitch(this, function () {
                    csvNewLineChar = "\r\n";
                    array.forEach(this.businessLayer.popupInfo.fieldInfos, lang.hitch(this, function (resultField) {
                        fieldName.push(resultField.label);
                    }));

                    csvContent = fieldName.join(",") + csvNewLineChar;
                    for (i = 0; i < this.resultDisplayAttributes.length; i++) {
                        fieldAttributes = this._addFieldAttributesValue(i);
                        csvContent += fieldAttributes.join(",") + csvNewLineChar;
                    }
                    deferred.resolve({ "csvdata": csvContent });
                }, 1000));
            } catch (error) {
                this._showAlertMessage(error.message);
                if (this.loading) {
                    this.loading.hide();
                }
            }
            return deferred;
        },
        /**
        * This function will create the content to export in format of CSV
        * @params{object}i: index for each attribute name
        *  @return{array}fieldAttributes: array containing field attribute values
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _addFieldAttributesValue: function (i) {
            var fieldAttributes = [];
            array.forEach(this.businessLayer.popupInfo.fieldInfos, lang.hitch(this, function (field) {
                if (this.resultDisplayAttributes[i].attributes.hasOwnProperty(field.fieldName)) {
                    if (array.indexOf(fieldAttributes, this.resultDisplayAttributes[i].attributes[field.fieldName]) === -1) {
                        fieldAttributes.push(this.resultDisplayAttributes[i].attributes[field.fieldName]);
                    }
                }
            }));
            return fieldAttributes;
        },

        /**
        * This function will check the browsers and accordingly download the csv file on client side.
        * @params{object}layerName: Name of the layer to export
        * @params{object}csvData: data to be export
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _onExportToCsvComplete: function (layerName, csvData) {
            var link, oWin, click_ev;
            if (this.IsIE) {
                oWin = window.open("");
                oWin.document.write(csvData[0].csvdata);
                oWin.document.close();
                oWin.document.execCommand('SaveAs', true, layerName);
                oWin.close();
            } else {
                link = domConstruct.create("a", { href: 'data:attachment/csv;charset=utf-8,' + encodeURIComponent(csvData[0].csvdata), target: '_blank', download: layerName + ".csv" }, this.domNode);
                if (this.IsSafari) {
                    click_ev = document.createEvent("MouseEvents");
                    click_ev.initEvent("click", true, true);
                    link.dispatchEvent(click_ev);
                } else {
                    link.click();
                }
                domConstruct.destroy(link);
            }
        },

        /**
        * This function is used to create content for "Save to Layer" panel
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _onSaveToLayerClick: function () {
            var saveLayerBackBtn, checkQuery;
            this.checkedLayers = [];
            this._setDisplayForPanels();
            checkQuery = query(".clearInstance");
            if (checkQuery) {
                checkQuery.forEach(domConstruct.destroy);
            }
            this._emptyControls();
            saveLayerBackBtn = domConstruct.create("div", { "class": "esriCTBackButtonLabel", "innerHTML": this.nls.backButtonLabel }, this.saveLayerTitleContainer);
            domConstruct.create("div", { "class": "esriCTSaveLayerLabel", "innerHTML": this.nls.saveToLayerLabel }, this.saveLayerTitleContainer);

            on(saveLayerBackBtn, "click", lang.hitch(this, function () {
                this.saveLayerClicked = false;
                this._setDisplayForPanels();
            }));
            if (this.config && this.config.targetRouteLayer) {
                this._createRouteLayerCheck();
                domStyle.set(this.routeLayerContaineDiv, "display", "block");
            } else {
                domStyle.set(this.routeLayerContaineDiv, "display", "none");
            }
            this._createBussinessLayerContainer();
            this._createSaveToLayerBtn();
        },

        /**
        * This functiuon will create Business Layer check box in Save To layer panel
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _createBussinessLayerContainer: function () {
            var bussinessLayerDiv, bussinessContainer;
            // check whether business layer which is to be saved exists in config
            if (this.config && this.config.targetBusinessLayer) {
                bussinessLayerDiv = domConstruct.create("div", { "class": "clearInstance" }, this.businessLayerChkbox);
                bussinessContainer = domConstruct.create("div", { "class": "clearInstance" }, bussinessLayerDiv);
                this.businessLayerChk = new CheckBox({ "class": "esriCTRouteChkBox clearInstance" }, bussinessContainer);
                domConstruct.create("label", { "class": "esriCTRouteLayerLabel clearInstance", "innerHTML": this.nls.businessLayerLabel }, bussinessContainer);
                domAttr.set(this.businessLayerChk.domNode, "title", this.config.targetBusinessLayer);
                this._onBusinessLayerCheck(this.businessLayerChk.domNode);
                domStyle.set(this.businessLayerContainerDiv, "display", "block");
            } else {
                domStyle.set(this.businessLayerContainerDiv, "display", "none");
            }
        },

        /**
        * This function will create "Save" button in Save to Layer panel
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _createSaveToLayerBtn: function () {
            this.saveToLayerBtn = domConstruct.create("div", { "class": "esriCTSaveButtonLabel esriCTButtonDisableColor", "innerHTML": this.nls.saveBtnLabel }, this.saveToLayerBtnContainer);
            this.saveToLayerBtn.disabled = true;
            on(this.saveToLayerBtn, "click", lang.hitch(this, function () {
                if (!this.saveToLayerBtn.disabled) {
                    this._onSaveBtnClick();
                }
            }));
            domClass.remove(this.saveToLayerContainer, "esriCTHidePanel");
            if (this.loading) {
                this.loading.hide();
            }
        },

        /**
        * This function will empty the controls of Save to layer panel
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _emptyControls: function () {
            domConstruct.empty(this.saveToLayerBtnContainer);
            domConstruct.empty(this.businessLayerChkbox);
            domConstruct.empty(this.routeLayerChkbox);
            domConstruct.empty(this.saveBusinessPassedlabel);
            domConstruct.empty(this.saveBusinessPassedTxtbox);
            domConstruct.empty(this.saveRouteLengthTxtbox);
        },

        /**
        * This function is used to bind the event for route Layer checkBox in "Save to Layer" panel
        * @params{object}checkBox: Checkbox for saving route layer
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _onRouteLayerCheck: function (checkbox) {
            on(checkbox, "click", lang.hitch(this, function (event) {
                if (domClass.contains(event.target, "checked")) {
                    if (this.config && this.config.saveBusinessCountField) {
                        domClass.remove(this.saveBusinessPassedContainer, "esriCTHidePanel");
                    }
                    if (this.config.saveRoutelengthField) {
                        domClass.remove(this.saveRouteLengthContainer, "esriCTHidePanel");
                    }
                    domClass.remove(this.esriCTSaveBusinessRouteLength, "esriCTHidePanel");
                    domClass.add(event.currentTarget, "esriCTSaveCheckbox");
                    if (array.indexOf(this.checkedLayers, event.currentTarget) === -1) {
                        this.checkedLayers.push(event.currentTarget);
                    }
                    this.saveToLayerBtn.disabled = false;
                    domClass.replace(this.saveToLayerBtn, "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                } else {
                    domClass.add(this.saveBusinessPassedContainer, "esriCTHidePanel");
                    domClass.add(this.saveRouteLengthContainer, "esriCTHidePanel");
                    domClass.add(this.esriCTSaveBusinessRouteLength, "esriCTHidePanel");
                    domClass.remove(event.currentTarget, "esriCTSaveCheckbox");
                    if (array.indexOf(this.checkedLayers, event.currentTarget) !== -1) {
                        this.checkedLayers.splice(array.indexOf(this.checkedLayers, event.currentTarget), 1);
                    }
                    if (this.checkedLayers.length === 0) {
                        this.saveToLayerBtn.disabled = true;
                        domClass.replace(this.saveToLayerBtn, "esriCTButtonDisableColor", "esriCTButtonEnabledColor");
                    }
                }
            }));
        },

        /**
        * This function is used to bind the event for business Layer checkBox in "Save to Layer" panel
        * @params{object}checkBox: Checkbox for saving business layer
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _onBusinessLayerCheck: function (checkBox) {
            on(checkBox, "click", lang.hitch(this, function (event) {
                if (domClass.contains(event.target, "checked")) {
                    domClass.add(event.currentTarget, "esriCTSaveCheckbox");
                    if (array.indexOf(this.checkedLayers, event.currentTarget) === -1) {
                        this.checkedLayers.push(event.currentTarget);
                        this.saveToLayerBtn.disabled = false;
                        domClass.replace(this.saveToLayerBtn, "esriCTButtonEnabledColor", "esriCTButtonDisableColor");
                    }
                } else {
                    domClass.remove(event.currentTarget, "esriCTSaveCheckbox");
                    if (array.indexOf(this.checkedLayers, event.currentTarget) !== -1) {
                        this.checkedLayers.splice(array.indexOf(this.checkedLayers, event.currentTarget), 1);
                    }
                    if (this.checkedLayers.length === 0) {
                        this.saveToLayerBtn.disabled = true;
                        domClass.replace(this.saveToLayerBtn, "esriCTButtonDisableColor", "esriCTButtonEnabledColor");
                    }
                }
            }));
        },

        /**
        * This function is used to set visibility for "Save to Layer" panel
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _setDisplayForPanels: function () {
            var j;
            if (this.saveLayerClicked) {
                domStyle.set(this.resultContainer, "display", "none");
                domStyle.set(this.businessTitleContainer, "display", "none");
                domStyle.set(this.resultListContainer, "display", "none");
                domClass.remove(this.saveLayercontentContainer, "esriCTHidePanel");
                domClass.remove(this.saveToLayerContainer, "esriCTHidePanel");
                domConstruct.empty(this.saveLayerTitleContainer);
                domClass.remove(this.saveLayerTitleContainer, "esriCTHidePanel");
            } else if (this.isClearClicked) {
                domClass.add(this.saveLayercontentContainer, "esriCTHidePanel");
                domClass.add(this.saveLayerTitleContainer, "esriCTHidePanel");
            } else {
                for (j = 0; j < this.tabContainer.controlNodes.length; j++) {
                    if (!this.isResultExist) {
                        domStyle.set(this.tabContainer.controlNodes[j], "display", "block");
                    }
                }
                domStyle.set(this.resultContainer, "display", "block");
                domStyle.set(this.businessTitleContainer, "display", "block");
                domStyle.set(this.resultListContainer, "display", "block");
                domClass.add(this.saveLayercontentContainer, "esriCTHidePanel");
                domClass.add(this.saveToLayerContainer, "esriCTHidePanel");
            }
        },

        /**
        * This function is used to create dom elements for Business Passed and route length, when Route layer check box is checked
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _createRouteLayerCheck: function () {
            var routeLayerDiv, routeLayerContainer, checkQuery, businessPassTxtBoxContainer, routeLengthTxtBoxContainer;
            checkQuery = query(".clearInstance");
            if (checkQuery) {
                checkQuery.forEach(domConstruct.destroy);
            }
            routeLayerDiv = domConstruct.create("div", { "class": "clearInstance" }, this.routeLayerChkbox);
            routeLayerContainer = domConstruct.create("div", { "class": "clearInstance" }, routeLayerDiv);
            this.routeLayerChk = new CheckBox({ "class": "esriCTRouteChkBox clearInstance" }, routeLayerContainer);
            domConstruct.create("label", { "class": "esriCTRouteLayerLabel clearInstance", "innerHTML": this.nls.saveRouteLayerLabel }, routeLayerContainer);
            domAttr.set(this.routeLayerChk.domNode, "title", this.config.targetRouteLayer);
            domClass.add(this.esriCTSaveBusinessRouteLength, "esriCTHidePanel");
            domConstruct.create("div", { "class": "esriCTsaveBusinessPassed clearInstance", "innerHTML": this.nls.businessPassedLabel }, this.saveBusinessPassedlabel);
            businessPassTxtBoxContainer = domConstruct.create("div", { "class": "esriCTSaveRouteLayerTxtBox clearInstance" }, this.saveBusinessPassedTxtbox);
            this.businessPassTxtBox = new TextBox({ "name": "businessPassTxtBox", "value": this.businessPassedCountValue.innerHTML }, businessPassTxtBoxContainer);
            domAttr.set(this.businessPassTxtBox, "value", this.businessPassedCountValue.innerHTML);
            domConstruct.create("div", { "class": "esriCTsaveRouteLength clearInstance", "innerHTML": this.nls.routeLengthLabel }, this.saveRouteLengthLabel);
            routeLengthTxtBoxContainer = domConstruct.create("div", { "class": "esriCTSaveRouteLayerTxtBox clearInstance" }, this.saveRouteLengthTxtbox);
            this.routeLengthTxtBox = new TextBox({ "class": "esriCTSaveRouteLayerTxtBox clearInstance", "name": "businessPassTxtBox", "value": this.routeLengthCountValue.innerHTML.split(this.config.routeLengthLabelUnits)[0] }, routeLengthTxtBoxContainer);
            domAttr.set(this.routeLengthTxtBox, "value", this.routeLengthCountValue.innerHTML.split(this.config.routeLengthLabelUnits)[0]);
            this._onRouteLayerCheck(this.routeLayerChk.domNode);
        },

        /**
        * This function will save the results on the checked layers given in "Save to Layer" panel
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _onSaveBtnClick: function () {
            var businessLayer, routeLayer, isBusinessLayerSave, isRouteLayerSave, i, j;
            this.showLoadingIndicator();
            for (i = 0; i < this.checkedLayers.length; i++) {
                if (isBusinessLayerSave && isRouteLayerSave) {
                    break;
                }
                if (domAttr.get(this.checkedLayers[i], "title") === this.config.targetBusinessLayer) {
                    isBusinessLayerSave = true;
                } else if (domAttr.get(this.checkedLayers[i], "title") === this.config.targetRouteLayer) {
                    isRouteLayerSave = true;
                }
            }
            for (j = 0; j < this.map.itemInfo.itemData.operationalLayers.length; j++) {
                if (this.map.itemInfo.itemData.operationalLayers[j].title === this.config.targetBusinessLayer && isBusinessLayerSave) {
                    businessLayer = this.map.itemInfo.itemData.operationalLayers[j].layerObject;
                } else if (this.map.itemInfo.itemData.operationalLayers[j].title === this.config.targetRouteLayer && isRouteLayerSave) {
                    routeLayer = this.map.itemInfo.itemData.operationalLayers[j].layerObject;
                }
            }
            if (businessLayer) {
                this._addDataInBusinessLayer(businessLayer);
            }
            if (routeLayer) {
                this._addDataInRouteLayer(routeLayer);
            }
        },

        /**
        * This function will save the features on feature layer
        * @params{object}businessLayer: Selected business layer on map
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _addDataInBusinessLayer: function (businessLayer) {
            businessLayer.applyEdits(this.resultDisplayAttributes, null, null, lang.hitch(this, function (results) {
                if (this.checkedLayers.length < 2) {
                    this._showAlertMessage(this.nls.saveToLayerSuccess);
                    if (this.loading) {
                        this.loading.hide();
                    }

                }
                this.saveLayerClicked = false;
                this._setDisplayForPanels();
            }), lang.hitch(this, function (error) {
                this._showAlertMessage(error.message);
                if (this.loading) {
                    this.loading.hide();
                }
            }));
        },

        /**
        * This function will add the closest route to feature route layer on server and save it
        * @params{object}routeLayer: Selected route layer on map
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _addDataInRouteLayer: function (routeLayer) {
            this.routeGraphicLayer.graphics[0].attributes = {};
            if (this.config.saveRoutelengthField) {
                this.routeGraphicLayer.graphics[0].attributes[this.config.saveRoutelengthField] = (this.routeLengthTxtBox.value).toString();
            }
            if (this.config.saveBusinessCountField) {
                this.routeGraphicLayer.graphics[0].attributes[this.config.saveBusinessCountField] = (this.businessPassTxtBox.value).toString();
            }
            routeLayer.applyEdits(this.routeGraphicLayer.graphics, null, null, lang.hitch(this, function (results) {
                this._showAlertMessage(this.nls.saveToLayerSuccess);
                if (this.loading) {
                    this.loading.hide();
                }
                this.saveLayerClicked = false;
                this._setDisplayForPanels();
            }), lang.hitch(this, function (error) {
                this._showAlertMessage(error.message);
                if (this.loading) {
                    this.loading.hide();
                }
            }));
        },

        /**
        * This function will get the center of polyline geometry
        * @params{object}polyline: polyline geometry
        * @memberOf widgets/ServiceFeasibility/Widget
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
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _getPolygonCentroid: function (polygon) {
            var ring, centroid, i, polygonPoint, polylinePoint;
            ring = polygon.rings[Math.round(polygon.rings.length / 2) - 1];
            centroid = { x: 0, y: 0 };
            // Array object
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
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _createTimer: function () {
            var animatedSymbol, animatedRenderer, jsonObj, baseURL, imgURL;
            if (this.config && this.config.highlighterDetails && this.config.highlighterDetails.timeout) {
                this.timer = new Timing.Timer(this.config.highlighterDetails.timeout);
                this.highlightGraphicLayer = new GraphicsLayer();

                if (this.config.highlighterDetails.imageData.indexOf("default") > -1) {
                    imgURL = this.config.highlighterDetails.imageData.slice(this.config.highlighterDetails.imageData.indexOf("widgets"));
                    imgURL = imgURL.replace(/\/\//g, "/");
                } else {
                    imgURL = this.config.highlighterDetails.imageData;
                }

                baseURL = location.href.slice(0, location.href.lastIndexOf('/'));
                jsonObj = { "type": "esriPMS", "url": string.substitute(imgURL, { appPath: baseURL }), "imageData": "", "contentType": "image/png", "color": null, "width": this.config.highlighterDetails.width, "height": this.config.highlighterDetails.height, "angle": 0, "xoffset": 0, "yoffset": 0 };
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
        * @memberOf widgets/ServiceFeasibility/Widget
        **/
        _showAlertMessage: function (msg) {
            var alertMsg = new Message({ message: msg });
            alertMsg.message = msg;
        },

        /**
        *This function will return the symbol as per the provided JSON.
        *@param{object} json: The JSON object from which symbol will be returned.
        *@return{object} symbol:Symbol can be simplefillsymbol, simplemarkersymbol, simplelinesymbol or picturemarkersymbol.
        *@memberOf widgets/ServiceFeasibility/Widget
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
        *@memberOf widgets/ServiceFeasibility/Widget
        **/
        _getSymbolJson: function (symbolType) {
            var symbolData, i, symbolObjFlag = false,
                key;
            if (this.config && this.config.symbol && this.config.symbol.length && this.config.symbol.length > 0) {
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
            }
            return symbolData;
        }
    });
});
