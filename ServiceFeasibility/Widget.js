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
define([
    "dojo/_base/declare",
    "jimu/BaseWidget",
    "jimu/dijit/TabContainer",
    "dijit/layout/ContentPane",
    "dijit/layout/TabContainer",
    'jimu/dijit/LoadingIndicator',
    "dojo/request/xhr",
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
    "dijit/form/NumberTextBox"
],

    function (declare, BaseWidget, JimuTabContainer, ContentPane, TabContainer, LoadingIndicator, xhr, lang, map, on, domConstruct, HorizontalSlider, TextBox, dom, esriRequest,
        Draw, domClass, query, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, Graphic, GraphicsLayer, Query, FeatureSet, GeometryService, BufferParameters, ClosestFacilityParameters,
        ClosestFacilityTask, Geometry, array, topic, Message, QueryTask, domAttr, domStyle, PanelManager, Select, SpatialReference, NumberTextBox) {
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
            businessesLayerDefaultExpression: null,

            startup: function () {
                //Accessing config.json file and creating dojo global variable.
                xhr("widgets/ServiceFeasibility/config.json", {
                    handleAs: "json"
                }).then(lang.hitch(this, function (data) {
                    this.configData = data;
                    this._initializingNetworkAnalysisServiceData();
                    this._initializingJimuTabContainer();
                    this._initializingFindNearestOptions();
                    this._accessGeometryService();
                }), function (err) {
                    this._showAlertMessage(err.message);
                });
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

                this.bufferGraphicLayer = new GraphicsLayer();
                this.bufferGraphicLayer.id = this.bufferGraphicLayerId;
                this.map.addLayer(this.bufferGraphicLayer);

                this.routeGraphicLayer = new GraphicsLayer();
                this.routeGraphicLayer.id = this.routeGraphicLayerId;
                this.map.addLayer(this.routeGraphicLayer);

                this.defaultMapExtent = this.map.extent;
                this.loading = new LoadingIndicator({
                    hidden: true
                });
                this.viewWindowSize = dojo.window.getBox();
                this.panelManager = PanelManager.getInstance();
                dom.byId(this.panelManager.panels[0].titleNode);

                on(dom.byId("btnFindButton"), "click", lang.hitch(this, function (evt) {
                    dom.byId("btnFindButton").disabled = true;
                    domClass.remove(dom.byId("btnFindButton"), "buttonEnabledColorChange");
                    domClass.replace(this.imgSelectLocationDojo, "imgSelectLocation", "imgSelectLocationSelected");
                    this.selectLocationToolbar.deactivate();
                    domClass.replace(this.pointImageContainer, "imgPoint", "imgPointSelected");
                    domClass.replace(this.polylineImageContainer, "imgPolyline", "imgPolylineSelected");
                    domClass.replace(this.polygonImageContainer, "imgPolygon", "imgPolygonSelected");
                    this.toolbar.deactivate();
                    dom.byId("btnClearButton").disabled = true;
                    domClass.remove(dom.byId("btnClearButton"), "buttonEnabledColorChange");
                    this.showLoadingIndicator();
                    this._checkParameterValues();
                    this._createBufferGeometry([this.locationPointGeometry], [this.configData.facilitySearchDistance], this.configData.bufferEsriUnits, this.configData.bufferWKID);
                }));
            },
            /**
            Accessing config.json file and creating a global variable for the same
            **/
            _accessGeometryService: function () {
                xhr("config.json", {
                    handleAs: "json"
                }).then(lang.hitch(this, function (data) {
                    this.outsideConfigData = data;
                    // checking whether geometry service url exists in config file
                    if (this.outsideConfigData.hasOwnProperty("geometryService")) {
                        if (this.outsideConfigData.geometryService === null || this.outsideConfigData.geometryService === "") {
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
                    url: this.configData.closestFacilityURL,
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
                var findNearestOptions, arrayFindNearestOptions, i;
                findNearestOptions = this.configData.accessPointsLayersName;
                arrayFindNearestOptions = findNearestOptions.split(",");
                //Looping through the Nearest Options to create options in a select.
                for (i = 0; i < arrayFindNearestOptions.length; i++) {
                    domConstruct.create("option", { value: arrayFindNearestOptions[i], innerHTML: arrayFindNearestOptions[i] }, this.selectFindNearest);
                }
                this._setLayerForDropdown(this.selectFindNearest.value);

                on(this.selectFindNearest, "change", lang.hitch(this, function (change) {
                    this.businessInfluenceValue.length = 0;
                    this._setLayerForDropdown(change.target.value);
                }));
            },

            /**
            * This function will initialize business influence values.
            **/
            _initializingAttributeParameterValues: function () {
                var attributeParameterValues = this.configData.attributeName, tempArray, i, m, j;
                this.arrayIntegerValues = [];
                this.arrayOtherValues = [];
                tempArray = [];
                this.businessInfluenceValue = [];
                this.textboxValues = [];
                tempArray = this.networkAnalysisJsonArray.networkDataset.networkAttributes;
                for (i = 0; i < attributeParameterValues.length; i++) {
                    if (attributeParameterValues[i].allowUserInput === "true") {
                        for (m = 0; m < tempArray.length; m++) {
                            if (tempArray[m].name === attributeParameterValues[i].name) {
                                if (tempArray[m].dataType === "esriNADTDouble" || tempArray[m].dataType === "esriNADTInteger") {
                                    this._createRangeSlider(attributeParameterValues[i]);
                                } else {
                                    this._createDropDown(attributeParameterValues[i]);
                                }
                            }
                        }
                    } else {
                        for (j = 0; j < tempArray.length; j++) {
                            if (tempArray[j].name === attributeParameterValues[i].name) {
                                if (tempArray[j].dataType === "esriNADTDouble" || tempArray[j].dataType === "esriNADTInteger") {
                                    this.arrayIntegerValues.push(attributeParameterValues[i].value);
                                } else {
                                    this.arrayOtherValues.push(attributeParameterValues[i].value);
                                }
                            }
                        }

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
                    "class": "txtboxParamValue",
                    required: true,
                    intermediateChanges: true,
                    constraints: { min: minValue, max: maxValue }
                });
                slider = new HorizontalSlider({
                    name: "slider",
                    id: attributeParameterValue.name + "Slider",
                    value: minValue,
                    minimum: minValue,
                    maximum: maxValue,
                    discreteValues: maxValue + 1
                });
                //slider.startup();

                on(dijit.byId(attributeParameterValue.name + "Slider"), "change", lang.hitch(this, function (value) {
                    dom.byId(attributeParameterValue.name).value = value;
                }));
                textbox.on("change", lang.hitch(this, function () {
                    if (parseFloat(textbox.value) <= maxValue) {
                        dijit.byId(attributeParameterValue.name + "Slider").attr("value", textbox.value);
                    }
                }));
                businessContainer = domConstruct.create("div", { "class": "businessInfluenceContainerDiv" });
                domConstruct.create("div", { "class": "businessInfluenceValue", innerHTML: "2. " + attributeParameterValue.displayLabel }, businessContainer);
                influenceInput = domConstruct.create("div", { "class": "businessInfluenceInput" }, businessContainer);
                influenceInput.appendChild(textbox.domNode);
                buisnessInfluenceSlider = domConstruct.create("div", { "class": "businessInfluenceSlider" }, businessContainer);
                buisnessInfluenceSlider.appendChild(slider.domNode);
                this.divBuisnessInfluence.appendChild(businessContainer);
            },

            /**
            * This function will create the Drop Down for business influence value.
            * param{object}attributeParameterValues: object of attributeParameterValue coming from config.json
            **/
            _createDropDown: function (attributeParameterValues) {
                var selectValue, selectOptionArray, selectContainer, selectDropdownList, k, selectOptionArr = [], optionArray;
                selectContainer = domConstruct.create("div", { "class": "businessDropdownContainer" }, this.divBuisnessInfluence);
                domConstruct.create("div", { "class": "businessDropdownLabel", innerHTML: attributeParameterValues.displayLabel }, selectContainer);
                selectDropdownList = domConstruct.create("div", { "class": "businessDropdownValue" }, selectContainer);
                optionArray = this.configData.businessValues;
                selectOptionArray = optionArray.split(",");
                // looping to push all the values with label in an array to create options for business influence dropdown
                for (k = 0; k < selectOptionArray.length; k++) {
                    if (selectOptionArray.hasOwnProperty(k)) {
                        selectOptionArr.push({ "label": selectOptionArray[k], "value": selectOptionArray[k] });
                    }
                }
                selectValue = new Select({
                    options: selectOptionArr,
                    id: attributeParameterValues.name
                }, selectDropdownList);
                domClass.add(selectValue, "dropDownBusinessValues");

            },
            /**
            * This function checks the parameter value for businesss influence.
            **/
            _checkParameterValues: function () {
                var j, txtboxCount, dropDownCount;
                this.businessInfluenceValue.length = 0;
                txtboxCount = dojo.query(".txtboxParamValue");
                dropDownCount = dojo.query(".dropDownBusinessValues");
                // pushing all the business influence values in array
                for (j = 0; j < this.configData.attributeName.length; j++) {
                    if (this.configData.attributeName[j].allowUserInput === "true") {
                        //checking the length of textbox for business influence && datatype of textbox value
                        if (txtboxCount.length > 0 && (this.networkAnalysisJsonArray.networkDataset.networkAttributes[j].dataType === "esriNADTDouble" || this.networkAnalysisJsonArray.networkDataset.networkAttributes[j].dataType === "esriNADTInteger")) {
                            this.arrayIntegerValues.push(parseFloat(dom.byId(this.configData.attributeName[j].name).value));
                            this.businessInfluenceValue.push(this.arrayIntegerValues.pop());
                        } else if (dropDownCount.length > 0) {
                            this.arrayOtherValues.push(dom.byId(this.configData.attributeName[j].name).innerText);
                            this.businessInfluenceValue.push(this.arrayOtherValues.pop());
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
                    domClass.replace(this.pointImageContainer, "imgPointSelected", "imgPoint");
                    this.toolbar.activate(Draw.POINT);
                    if (this.polylineBarrierClicked) {
                        this.polylineBarrierClicked = false;
                        domClass.replace(this.polylineImageContainer, "imgPolyline", "imgPolylineSelected");
                    } else if (this.polygonBarrierClicked) {
                        this.polygonBarrierClicked = false;
                        domClass.replace(this.polygonImageContainer, "imgPolygon", "imgPolygonSelected");

                    } else if (this.selectLocationClicked) {
                        this.selectLocationClicked = false;
                        if (this.selectLocationToolbar._geometryType === "point") {
                            this.selectLocationToolbar.deactivate();
                        }
                        domClass.replace(this.imgSelectLocationDojo, "imgSelectLocation", "imgSelectLocationSelected");
                    }
                    if (this.toolbar._geometryType === "polyline" || this.toolbar._geometryType === "polygon") {
                        this.toolbar.deactivate();
                    }
                } else {
                    this.pointBarrierClicked = false;
                    domClass.replace(this.pointImageContainer, "imgPoint", "imgPointSelected");
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
                    domClass.replace(this.polylineImageContainer, "imgPolylineSelected", "imgPolyline");
                    this.toolbar.activate(Draw.POLYLINE);
                    if (this.pointBarrierClicked) {
                        this.pointBarrierClicked = false;
                        if (this.toolbar._geometryType === "point") {
                            this.toolbar.deactivate();
                        }
                        domClass.replace(this.pointImageContainer, "imgPoint", "imgPointSelected");
                    } else if (this.polygonBarrierClicked) {
                        this.polygonBarrierClicked = false;
                        if (this.toolbar._geometryType === "polygon") {
                            this.toolbar.deactivate();
                        }
                        domClass.replace(this.polygonImageContainer, "imgPolygon", "imgPolygonSelected");
                    } else if (this.selectLocationClicked) {
                        this.selectLocationClicked = false;
                        if (this.selectLocationToolbar._geometryType === "point") {
                            this.selectLocationToolbar.deactivate();
                        }
                        domClass.replace(this.imgSelectLocationDojo, "imgSelectLocation", "imgSelectLocationSelected");
                    }

                } else {
                    this.polylineBarrierClicked = false;
                    domClass.replace(this.polylineImageContainer, "imgPolyline", "imgPolylineSelected");
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
                    domClass.remove(this.polygonImageContainer, "imgPolygon");
                    domClass.add(this.polygonImageContainer, "imgPolygonSelected");
                    this.toolbar.activate(Draw.POLYGON);
                    if (this.pointBarrierClicked) {
                        this.pointBarrierClicked = false;
                        if (this.toolbar._geometryType === "point") {
                            this.toolbar.deactivate();
                        }
                        domClass.replace(this.pointImageContainer, "imgPoint", "imgPointSelected");
                    } else if (this.polylineBarrierClicked) {
                        this.polylineBarrierClicked = false;
                        if (this.toolbar._geometryType === "polyline") {
                            this.toolbar.deactivate();
                        }
                        domClass.replace(this.polylineImageContainer, "imgPolyline", "imgPolylineSelected");
                    } else if (this.selectLocationClicked) {
                        this.selectLocationClicked = false;
                        if (this.selectLocationToolbar._geometryType === "point") {
                            this.selectLocationToolbar.deactivate();
                        }
                        domClass.replace(this.imgSelectLocationDojo, "imgSelectLocation", "imgSelectLocationSelected");
                    }

                } else {
                    this.polygonBarrierClicked = false;
                    domClass.replace(this.polygonImageContainer, "imgPolygon", "imgPolygonSelected");
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
                    domClass.replace(this.imgSelectLocationDojo, "imgSelectLocationSelected", "imgSelectLocation");
                    this.selectLocationToolbar.activate(Draw.POINT);
                    if (this.pointBarrierClicked) {
                        if (this.toolbar._geometryType === "point") {
                            this.toolbar.deactivate();
                        }
                        this.pointBarrierClicked = false;
                        domClass.replace(this.pointImageContainer, "imgPoint", "imgPointSelected");
                    } else if (this.polylineBarrierClicked) {
                        this.polylineBarrierClicked = false;
                        domClass.replace(this.polylineImageContainer, "imgPolyline", "imgPolylineSelected");
                    } else if (this.polygonBarrierClicked) {
                        this.polygonBarrierClicked = false;
                        domClass.replace(this.polygonImageContainer, "imgPolygon", "imgPolygonSelected");
                    }
                    if (this.toolbar._geometryType === "polyline" || this.toolbar._geometryType === "polygon") {
                        this.toolbar.deactivate();
                    }

                } else {
                    this.selectLocationClicked = false;
                    domClass.replace(this.imgSelectLocationDojo, "imgSelectLocation", "imgSelectLocationSelected");
                    if (this.selectLocationToolbar._geometryType === "point") {
                        this.selectLocationToolbar.deactivate();
                    }

                }
            },
            /**
            * This function will add barriers to the map.
            * param{object}evt: object which is coming from draw-end event.
            **/

            _addBarrierGraphic: function (evt) {
                var pointBarrierSymbol, polylineBarrierSymbol, polygonBarrierSymbol, symbol, graphic, btnClear;
                if (this.infoPopupEnabled === false) {
                    this.map.infoWindow.hide();
                }
                if (!this.barrierExists) {
                    this.barrierExists = true;
                    this.pointBarriersArray = [];
                    this.polylineBarriersArray = [];
                    this.polygonBarriersArray = [];
                }

                pointBarrierSymbol = new SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 10,
                                 new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                                 new esri.Color([255, 0, 0]), 1),
                                 new esri.Color([0, 255, 0, 0.25]));
                polylineBarrierSymbol = new SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH,
                                    new esri.Color([255, 0, 0]), 3);
                polygonBarrierSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                                   new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0]), 2),
                                   new Color([0, 0, 255, 0.5]));


                switch (evt.geometry.type) {
                case "point":
                    symbol = pointBarrierSymbol;
                    this.pointBarriersArray.push(evt.geometry);
                    break;
                case "polyline":
                    symbol = polylineBarrierSymbol;
                    this.polylineBarriersArray.push(evt.geometry);
                    break;
                case "polygon":
                    symbol = polygonBarrierSymbol;
                    this.polygonBarriersArray.push(evt.geometry);
                    break;
                }

                graphic = new Graphic(evt.geometry, symbol);
                this.map.graphics.add(graphic);
                btnClear = dom.byId("btnClearButton");
                if (btnClear.disabled) {
                    btnClear.disabled = false;
                    domClass.add(btnClear, "buttonEnabledColorChange");
                }
            },


            /**
            * This function will add the select location to the map.
            * param{object}evt: object which is coming from draw-end event.
            **/
            _addSelectLocationGraphic: function (evt) {
                var selectLocationSymbol, graphic, btnFind, btnClear;

                if (!this.outsideConfigData.geometryService || (this.outsideConfigData.geometryService === null || this.outsideConfigData.geometryService === "")) {
                    dom.byId("btnFindButton").disabled = true;
                    domClass.remove(dom.byId("btnClearButton"), "buttonEnabledColorChange");
                } else {
                    if (this.infoPopupEnabled === false) {
                        this.map.infoWindow.hide();
                    }
                    this.selectLocationGraphicLayer.clear();
                    this.selectLocationArray = [];
                    selectLocationSymbol = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.STYLE_PATH).setPath("M16,3.5c-4.142,0-7.5,3.358-7.5,7.5c0,4.143,7.5,18.121,7.5,18.121S23.5,15.143,23.5,11C23.5,6.858,20.143,3.5,16,3.5z M16,14.584c-1.979,0-3.584-1.604-3.584-3.584S14.021,7.416,16,7.416S19.584,9.021,19.584,11S17.979,14.584,16,14.584z").setSize(28).setColor(new dojo.Color([255, 0, 0]));
                    this.selectLocationArray.push(evt.geometry);
                    graphic = new Graphic(evt.geometry, selectLocationSymbol);
                    this.selectLocationGraphicLayer.add(graphic);
                    this.map.addLayer(this.selectLocationGraphicLayer);
                    btnFind = dom.byId("btnFindButton");
                    btnClear = dom.byId("btnClearButton");
                    if (btnFind.disabled) {
                        btnFind.disabled = false;
                        domClass.add(btnFind, "buttonEnabledColorChange");
                    }
                    if (btnClear.disabled) {
                        btnClear.disabled = false;
                        domClass.add(btnClear, "buttonEnabledColorChange");
                    }
                    this.locationPointGeometry = graphic.geometry;
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
                this.businessLayer.layerObject.hide();
                domStyle.set(this.resultContainer, "display", "none");
                dom.byId("btnClearButton").disabled = true;
                dom.byId("btnFindButton").disabled = true;
                domClass.remove(dom.byId("btnFindButton"), "buttonEnabledColorChange");
                domClass.remove(dom.byId("btnClearButton"), "buttonEnabledColorChange");
                this.locationPointGeometry = null;
                this.toolbar.deactivate();
                this.selectLocationToolbar.deactivate();
                //disable the point barrier control if selected
                if (this.pointBarriersArray && this.pointBarriersArray.length > 0) {
                    domClass.replace(this.pointImageContainer, "imgPoint", "imgPointSelected");
                }
                //disable the polyline barrier control if selected
                if (this.polylineBarriersArray && this.polylineBarriersArray.length > 0) {
                    domClass.replace(this.polylineImageContainer, "imgPolyline", "imgPolylineSelected");
                }
                //disable the polygon barrier control if selected
                if (this.polygonBarriersArray && this.polygonBarriersArray.length > 0) {
                    domClass.replace(this.polygonImageContainer, "imgPolygon", "imgPolygonSelected");
                }
                //disable the select location control if selected
                if (this.selectLocationArray && this.selectLocationArray.length > 0) {
                    domClass.replace(this.imgSelectLocationDojo, "imgSelectLocation", "imgSelectLocationSelected");
                }
                this.selectFindNearest.selectedIndex = 0;
                resettxtbox = dojo.query(".txtboxParamValue");
                resetDropdown = dojo.query(".dropDownBusinessValues");
                for (j = 0; j < this.configData.attributeName.length; j++) {
                    if (resettxtbox.length > 0 && (this.networkAnalysisJsonArray.networkDataset.networkAttributes[j].dataType === "esriNADTDouble" || this.networkAnalysisJsonArray.networkDataset.networkAttributes[j].dataType === "esriNADTInteger")) {
                        if (this.configData.attributeName[j].name === this.networkAnalysisJsonArray.networkDataset.networkAttributes[j].name) {
                            dom.byId(this.configData.attributeName[j].name).value = dom.byId(this.configData.attributeName[j].name).defaultValue;
                            dijit.byId(this.configData.attributeName[j].name + "Slider").attr("value", dom.byId(this.configData.attributeName[j].name).value);
                        }
                    } else if (resetDropdown.length > 0 && this.configData.attributeName[j].name === this.networkAnalysisJsonArray.networkDataset.networkAttributes[j].name) {
                        dijit.byId(this.configData.attributeName[j].name).reset();
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
                var bufferParams, geometryService, buffersymbol, bufferResultGeometry;
                geometryService = new GeometryService(this.outsideConfigData.geometryService);
                bufferParams = new BufferParameters();
                bufferParams.distances = distance;
                bufferParams.bufferSpatialReference = new SpatialReference(parseInt(this.configData.bufferWKID, 10));
                bufferParams.outSpatialReference = new SpatialReference(parseInt(this.configData.bufferWKID, 10));
                bufferParams.unit = GeometryService[unit];
                bufferParams.geometries = geometry;
                try {
                    geometryService.buffer(bufferParams, lang.hitch(this, function (response) {
                        if (bufferParams.geometries[0].type && bufferParams.geometries[0].type === "point") {
                            this._onBufferGeometryComplete(response);
                        } else {
                            buffersymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0, 0.65]), 4), new dojo.Color([255, 255, 255, 0]));
                            array.forEach(response, lang.hitch(this, function (resultGeometry) {
                                this.bufferGraphic = new Graphic(resultGeometry, buffersymbol);
                                if (this.bufferGraphicLayer.graphics.length > 0) {
                                    this.map.getLayer("bufferGraphicLayer").clear();
                                }
                                this.bufferGraphicLayer.add(this.bufferGraphic);
                                bufferResultGeometry = resultGeometry;
                            }), lang.hitch(this, function (err) {
                                this._onClearButtonClicked();
                                this._showAlertMessage(err.message);
                            }));
                            this.map.setExtent(bufferResultGeometry.getExtent(), true);
                            this.loading.hide();
                            this._queryForBusinessData(bufferResultGeometry);
                        }
                    }), lang.hitch(this, function (error) {
                        this._onBufferGeometryError(error);
                        this._onClearButtonClicked();
                    }));
                } catch (err) {
                    this._showAlertMessage(err.message);
                    this._onClearButtonClicked();
                }
            },

            /**
            * This function will execute when buffer geometry is complete.
            * param{object} geometry: object containing information of buffer geometry.
            **/
            _onBufferGeometryComplete: function (geometries) {
                var storedGeometry = [];
                storedGeometry = geometries[0];
                this._queryForFeatures(storedGeometry);
            },

            /**
            * This function will execute if any error occured while creating buffer geometries.
            * param {object} error: object containing information regarding error.
            **/
            _onBufferGeometryError: function (error) {
                this._onClearButtonClicked();
                this._showAlertMessage(error.message);
            },

            /** 
            * This function will query for features lies within the given buffer
            * param{object}geometry:object containing information of buffer geometry.
            **/
            _queryForFeatures: function (geometry) {
                var queryFeature, url, queryTask, queryDeferred;
                queryFeature = new Query();
                queryFeature.geometry = geometry;
                queryFeature.returnGeometry = true;
                queryFeature.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                queryFeature.outFields = ["*"];
                url = this.layer;
                queryTask = new esri.tasks.QueryTask(url);
                queryDeferred = queryTask.execute(queryFeature);
                queryDeferred.then(lang.hitch(this, function (results) {
                    if (results !== null && results.features.length > 0) {
                        this._getResultantRoutes(results);
                    } else {
                        this.loading.hide();
                        this._onClearButtonClicked();
                        this._showAlertMessage(this.nls.featureNotExist);
                    }
                }), lang.hitch(this, function (error) {
                    this._onClearButtonClicked();
                    this._showAlertMessage(error.message);
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
                facilityParams.defaultCutoff = this.configData.defaultCutoff;
                facilityParams.useHierarchy = false;
                facilityParams.returnIncidents = true;
                facilityParams.returnRoutes = true;
                facilityParams.returnFacilities = true;
                facilityParams.returnDirections = false;
                facilityParams.defaultTargetFacilityCount = 1;
                facilityParams.impedenceAttribute = this.configData.impedanceAttribute;

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
                for (i = 0; i < this.configData.attributeName.length; i++) {
                    attributeParameterValues.push({
                        attributeName: this.configData.attributeName[i].name,
                        parameterName: this.configData.parameterName,
                        value: this.businessInfluenceValue[i].toString()
                    });
                }
                facilityParams.attributeParameterValues = attributeParameterValues;
                incidents = new FeatureSet();
                pointLocation = new Graphic(this.locationPointGeometry);
                features.push(pointLocation);
                incidents.features = features;
                facilityParams.incidents = incidents;
                facilities = new FeatureSet();
                locationGraphics = [];
                dojo.forEach(results.features, function (pointLocation, index) {
                    locationGraphics.push(new Graphic(pointLocation.geometry));
                });
                facilities.features = locationGraphics;
                facilityParams.facilities = facilities;

                facilityParams.outSpatialReference = this.map.spatialReference;

                closestFacilityTask = new ClosestFacilityTask(this.configData.closestFacilityURL);

                // Return solve for closest facility task  
                return closestFacilityTask.solve(facilityParams, lang.hitch(this, function (solveResults) {
                    this._showFinalRoute(solveResults.routes[0]);

                }), lang.hitch(this, function (error) {
                    this._onClearButtonClicked();
                    this._showAlertMessage(this.nls.routeSolveError);
                    this.loading.hide();
                }));
            },
            /**
            * This function will draw the closest route path and show
            * @params{object}routes: object containing the information of closest route
            **/
            _showFinalRoute: function (routes) {
                var lineSymbol, finalRoute, pathLine;
                // Set the route length count in result panel
                this.routeLengthCountValue.innerHTML = routes.attributes.Shape_Length.toFixed(0) + " " + this.configData.routeLengthLabelUnits;

                lineSymbol = new SimpleLineSymbol("solid", new dojo.Color([0, 0, 255, 0.5]), 4);
                pathLine = new Geometry.Polyline(this.map.spatialReference);
                pathLine.addPath(routes.geometry.paths[0]);
                finalRoute = new Graphic(pathLine, lineSymbol);
                if (this.routeGraphicLayer.graphics.length > 0) {
                    this.map.getLayer("routeGraphicLayer").clear();
                }
                this.routeGraphicLayer.add(finalRoute);
                // Call function to draw buffer around the closest route
                this._createBufferGeometry([routes.geometry], [this.configData.bufferDistance], this.configData.bufferEsriUnits, this.configData.bufferWKID);
            },
            /**
            * This function will show the loading indicator
            **/
            showLoadingIndicator: function () {
                domClass.add(this.loading, "runLoadingIndicator");
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
                    if (this.map.itemInfo.itemData.operationalLayers[j].title === this.configData.businessesLayerName) {
                        this.businessLayer = this.map.itemInfo.itemData.operationalLayers[j];
                    }
                }
            },
            /**
            * This function will query for business features lies inside the the buffer of closest route and show them on map
            * @params{object}resultGeometry: object containing information of buffer geometry
            **/
            _queryForBusinessData: function (resultGeometry) {
                var businessQuery, businessFeatures, queryLayerTask;
                businessQuery = new Query();
                businessQuery.geometry = resultGeometry;
                businessQuery.spatialRelationship = Query.SPATIAL_REL_CONTAINS;
                queryLayerTask = new QueryTask(this.businessLayer.url);
                queryLayerTask.executeForIds(businessQuery, lang.hitch(this, function (queryResult) {
                    if (queryResult.length >= 0 && queryResult !== null) {
                        this.businessPassedCountValue.innerHTML = queryResult.length;
                        this.isResultExist = true;
                        this._switchToResultPanel();
                        businessFeatures = queryResult;
                        this.businessLayer.layerObject.setDefinitionExpression("OBJECTID IN (" + businessFeatures.toString() + ")");
                        this.businessLayer.layerObject.show();
                        this.businessLayer.layerObject.refresh();
                        dom.byId("btnClearButton").disabled = false;
                        domClass.add(dom.byId("btnClearButton"), "buttonEnabledColorChange");
                        this.selectLocationClicked = false;
                    } else {
                        this.loading.hide();
                        this._onClearButtonClicked();
                        this._showAlertMessage(this.nls.businessFeatureError);
                    }
                }), lang.hitch(this, function (err) {
                    this._onClearButtonClicked();
                    this._showAlertMessage(err.message);
                }));

            },
            /**
            * This function change the panel to show results
            **/
            _switchToResultPanel: function () {
                var j;
                for (j = 0; j < this.tabContainer.controlNodes.length; j++) {
                    if (this.isResultExist) {
                        if (this.tabContainer.controlNodes[j].innerHTML === this.nls.resultsContainerHeading) {
                            domClass.remove(this.tabContainer.controlNodes[j], "jimu-tab>.control>.tab.jimu-state-selected+.tab");
                            domClass.replace(this.tabContainer.controlNodes[j], "tab jimu-vcenter-text jimu-state-selected", "tab jimu-vcenter-text");
                            domStyle.set(this.tabContainer.tabs[j].content, "display", "block");
                            domStyle.set(this.tabResults, "display", "block");
                            domStyle.set(this.resultContainer, "display", "block");
                        } else if (this.tabContainer.controlNodes[j].innerHTML === this.nls.searchContainerHeading) {
                            domClass.replace(this.tabContainer.controlNodes[j], "tab jimu-vcenter-text", "tab jimu-vcenter-text jimu-state-selected");
                            domStyle.set(this.tabContainer.tabs[j].content, "display", "none");
                            domStyle.set(this.tabSearch, "display", "none");
                        }
                    } else if (this.tabContainer.controlNodes[j].innerHTML === this.nls.resultsContainerHeading) {
                        domStyle.set(this.resultContainer, "display", "none");
                        domClass.add(this.tabContainer.controlNodes[j], "changeForResultContainer");

                    }


                }
            },

            /**
            * This function will show all the alert and error messages
            * @params{object}msg: object contains the message content
            **/
            _showAlertMessage: function (msg) {
                var alertMsg = new Message({ message: msg });
                alertMsg.message = msg;

            }
        });
    });