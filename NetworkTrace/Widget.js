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
define(['dojo/_base/declare',
 "jimu/BaseWidget",
 "esri/map",
 "dojo/on",
 "dojo/_base/lang",
 "dojo/request/xhr",
 "esri/symbols/PictureMarkerSymbol",
 "esri/graphic",
 "esri/geometry/Point",
 "esri/symbols/SimpleMarkerSymbol",
 "esri/symbols/SimpleFillSymbol",
 "esri/symbols/SimpleLineSymbol",
 "esri/tasks/Geoprocessor",
 "dojo/_base/array",
 "esri/layers/GraphicsLayer",
 "esri/renderers/SimpleRenderer",
 "esri/toolbars/draw",
 "dojo/dom-class",
 "esri/tasks/FeatureSet",
 "dijit/TitlePane",
 "dijit/form/Button",
 "dojo/dom-construct",
 "dojo/dom",
 "dojox/timing",
 "dojo/query",
 "dijit/TooltipDialog",
 "dijit/popup",
 "dijit/form/CheckBox",
 "dijit/form/TextBox",
 "dojo/promise/all",
 "dojo/Deferred",
 "esri/InfoTemplate",
 "dijit/registry",
 "dijit/form/DateTextBox",
 "dijit/form/TimeTextBox",
 "dojo/dom-attr",
 "dojo/has",
 "jimu/WidgetManager",
 "dojo/_base/html",
 "jimu/PanelManager"
    ], function (declare, BaseWidget, map, on, lang, xhr, PictureMarkerSymbol, Graphic, Point, SimpleMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol, Geoprocessor, array, GraphicsLayer, SimpleRenderer, Draw, domClass, FeatureSet, TitlePane, Button, domConstruct, dom, Timing, query, TooltipDialog, popup, CheckBox, TextBox, all, Deferred, InfoTemplate, registry, DateTextBox, TimeTextBox, domAttr, has, WidgetManager, html, PanelManager) {
        return declare([BaseWidget], {
            baseClass: 'jimu-widget-IsolationTrace',
            viewPortSize: null,
            panelManager: null,
            wManager: null,
            flagBtnClicked: false,
            barrierBtnClicked: false,
            gp: null,
            gpInputDetails: null,
            toolbar: null,
            overExtent: null,
            resultsCnt: null,
            resultLayers: null,
            animatedLayer: null,

            /** 
            *This is a startup function of a isolation trace widget.
            **/
            startup: function () {
                this.inherited(arguments);
                on(this.map, "click", lang.hitch(this, this._onMapClick));
                //Access config.json file and get the data.
                xhr("widgets/IsolationTrace/config.json", {
                    handleAs: "json"
                }).then(lang.hitch(this, function (data) {
                    //Creating a dojo variable to store configuration data.
                    dojo.configData = data;
                    this.gp = new Geoprocessor(dojo.configData.geoprocessing.url);
                    on(this.gp, "error", lang.hitch(this, this._onSubmitJobError));
                    on(this.gp, "job-complete", lang.hitch(this, this._onSubmitJobComplete));
                    on(this.gp, "get-result-data-complete", lang.hitch(this, this._onGetResultDataComplete));
                    this.gp.setOutSpatialReference(this.map.spatialReference);
                    this._createResultPanels();
                    this._createGraphic();
                    this._createTimer();
                }), function (err) {
                    alert(err.responseText);
                });
                this.viewPortSize = dojo.window.getBox();
                this.panelManager = PanelManager.getInstance();
            },

            /**
            *This function will execute when user clicked on flag button.
            **/
            _onFlagButtonClick: function () {
                if (!this.flagBtnClicked) {
                    this.flagBtnClicked = true;
                    domClass.remove(this.btnFlag, "flagbutton");
                    domClass.add(this.btnFlag, "flagButtonselected");
                    //Checking the toolbar whether it is initialized or not 
                    if (this.toolbar === null) {
                        this.toolbar = new Draw(this.map);
                        this.toolbar.activate(Draw.POINT);
                    }
                    //Checking the width of the device.
                    if (this.viewPortSize.w < 768) {
                        this.panelManager.getPanelById(this.id + '_panel').onTitleClick();
                    }
                    //Checking whether barrier button was clicked or not.
                    if (this.barrierBtnClicked) {
                        this.barrierBtnClicked = false;
                        domClass.remove(this.btnBarrier, "barrierButtonselected");
                        domClass.add(this.btnBarrier, "barrierButton");
                    }
                } else {
                    this.flagBtnClicked = false;
                    domClass.remove(this.btnFlag, "flagButtonselected");
                    domClass.add(this.btnFlag, "flagbutton");
                    //Checking the toolbar whether it is initialized or not 
                    if (this.toolbar !== null) {
                        this.toolbar.deactivate();
                        this.toolbar = null;
                    }
                }
            },

            /**
            *This function will execute when user clicked on Barrier Button.
            **/
            _onBarrierButtonClick: function () {
                if (!this.barrierBtnClicked) {
                    this.barrierBtnClicked = true;
                    domClass.remove(this.btnBarrier, "barrierButton");
                    domClass.add(this.btnBarrier, "barrierButtonselected");
                    //Checking the toolbar whether it is initialized or not 
                    if (this.toolbar === null) {
                        this.toolbar = new Draw(this.map);
                        this.toolbar.activate(Draw.POINT);
                    }
                    //Checking the width of the device.
                    if (this.viewPortSize.w < 768) {
                        this.panelManager.getPanelById(this.id + '_panel').onTitleClick();
                    }
                    //Checking whether flag button was clicked or not.
                    if (this.flagBtnClicked) {
                        this.flagBtnClicked = false;
                        domClass.remove(this.btnFlag, "flagButtonselected");
                        domClass.add(this.btnFlag, "flagbutton");
                    }
                } else {
                    this.barrierBtnClicked = false;
                    domClass.remove(this.btnBarrier, "barrierButtonselected");
                    domClass.add(this.btnBarrier, "barrierButton");
                    //Checking the toolbar whether it is initialized or not 
                    if (this.toolbar !== null) {
                        this.toolbar.deactivate();
                        this.toolbar = null;
                    }
                }
            },

            /**
            *This function will enable or disable result panel.
            *@param{boolean} isShowResultPanel: Boolean to check whether result panel should display or not.
            **/
            _showResultPanel: function (isShowResultPanel) {
                this.resultPanel.style.display = isShowResultPanel ? "block" : "none";
            },

            /**
            *This function will enable loading icon
            *@param{boolean} isShowLoadingIcon: Boolean to check whether loading icon should display or not.
            **/
            _showLoadingIcon: function (isShowLoadingIcon) {
                if (isShowLoadingIcon) {
                    domClass.remove(this.loadingIcon, "runIconidle");
                    domClass.add(this.loadingIcon, "runIconProcessing");
                } else {
                    domClass.remove(this.loadingIcon, "runIconProcessing");
                    domClass.add(this.loadingIcon, "runIconidle");
                }
            },

            /**
            *This function will execute when user clicked on the 'Run Trace' button.
            **/
            _onTraceButtonClick: function () {
                this._GPExecute();
                this._showLoadingIcon(true);
                this._showResultPanel(false);
            },

            /**
            *This function will execute when user clicked on the map and it will add the graphic to the input graphic layer.
            *@param{object} evt: object containing information regarding the map point.
            **/
            _onMapClick: function (evt) {
                //This is will check whether Flag or Barrier has been selected or not, to place the pushpin on the map.
                if (this.flagBtnClicked || this.barrierBtnClicked) {
                    this.map.infoWindow.hide();
                    var addType = "Flag";
                    //Checking whether flag button is clicked or not.
                    if (this.flagBtnClicked) {
                        addType = "Flag";
                        domClass.remove(this.btnTrace, "jimu-state-disabled");
                        domClass.remove(this.btnClear, "jimu-state-disabled");
                        this.btnTrace.disabled = false;
                        this.btnClear.disabled = false;
                    }
                    //checking whether barrier button is clicked or not.
                    if (this.barrierBtnClicked) {
                        addType = "Barrier";
                        domClass.remove(this.btnClear, "jimu-state-disabled");
                        this.btnClear.disabled = false;
                    }
                    //Looping thorugh the Input Layers to add the Graphic.
                    array.some(this.gpInputDetails, function (layer) {
                        //Checking the Layer type
                        if (layer.type === addType) {
                            layer.add(new Graphic(evt.mapPoint, null, null, null));
                            return true;
                        }
                    });
                }
            },

            /**
            *This function will return the symbol as per the provided JSON.
            *@param{object} json: The JSON object from which symbol will be returned.
            *@return{object} symbol:Symbol can be simplefillsymbol, simplemarkersymbol, simplelinesymbol or picturemarkersymbol.
            **/
            _createGraphicFromJSON: function (json) {
                //checking the symbol type and then returning the symbol.
                var symbol, sms, pms;
                switch (json.type) {
                    case "simplefillsymbol":
                    case "esriSFS":
                        symbol = new SimpleFillSymbol(json);
                        break;
                    case "simplemarkersymbol":
                    case "esriSMS":
                        if (json.hasOwnProperty("path")) {
                            if (json.path !== null) {
                                sms = new SimpleMarkerSymbol(json);
                                sms.setPath(json.path);
                                sms.setSize(json.size);
                                sms.xoffset = json.xoffset;
                                sms.yoffset = json.yoffset;
                                symbol = sms;
                                break;
                            }
                        }
                        symbol = new SimpleMarkerSymbol(json);
                        break;
                    case "simplemlinesymbol":
                    case "esriSLS":
                        symbol = new SimpleLineSymbol(json);
                        break;
                    case "picturemarkersymbol":
                    case "esriPMS":
                        pms = new PictureMarkerSymbol(json);
                        pms.setUrl = json.url;
                        pms.setWidth = json.width;
                        pms.setHeight = json.height;
                        pms.setOffset(json.xoffset, json.yoffset);
                        symbol = pms;
                        break;
                }
                return symbol;
            },

            /**
            *This function will add the Input layers into the map.
            **/
            _createGraphic: function () {
                this.gpInputDetails = [];
                this.skipLayer = null;
                var inLayer, addSymbol, ren;
                //This will create the GraphicsLayer as per the GP Inputs.
                array.forEach(dojo.configData.geoprocessing.inputs, function (input) {
                    inLayer = new GraphicsLayer();
                    inLayer.id = input.paramName;
                    inLayer.type = input.type;
                    inLayer.paramName = input.paramName;
                    addSymbol = this._createGraphicFromJSON(input.symbol);
                    ren = new SimpleRenderer(addSymbol);
                    inLayer.setRenderer(ren);
                    this.gpInputDetails.push(inLayer);
                    //checking input type
                    if (input.type === "Skip") {
                        this.skipLayer = inLayer;
                    }
                }, this);
                this.map.addLayers(this.gpInputDetails);
            },

            /**
            *This Function will add the output layers to the map also initialize TitlePane into the Widget.
            **/
            _createResultPanels: function () {
                this.resultLayers = [];
                var sym, ren, layer, tp;
                array.forEach(dojo.configData.geoprocessing.outputs, function (output) {
                    sym = null;
                    ren = null;
                    layer = new GraphicsLayer();
                    layer.minScale = output.MinScale;
                    layer.maxScale = output.MaxScale;
                    //To check whether output layer is visible or not.
                    if (output.hasOwnProperty("visible")) {
                        if (output.visible !== null) {
                            if (output.visible.toUpperCase() === "FALSE") {
                                layer.setVisibility(false);
                            } else {
                                layer.setVisibility(true);
                            }
                        } else {
                            layer.setVisibility(true);
                        }
                    }
                    layer.id = output.paramName;
                    //To check whether output contains symbol or not.
                    if (output.symbol !== null) {
                        sym = this._createGraphicFromJSON(output.symbol);
                        ren = new SimpleRenderer(sym);
                        layer.setRenderer(ren);
                    }
                    this.map.addLayer(layer);
                    output.layer = layer;
                    //To check whether layer has saving option or not.
                    if (output.saveOptions.type.toUpperCase() === "LAYER") {
                        output.saveOptions.saveToLayer = this._findLayer(output.saveOptions.name);
                    }
                    //To check whether the name of panel is summary.
                    if (output.buttonText.toUpperCase() === "SUMMARY") {
                        tp = new TitlePane({
                            title: output.buttonText,
                            id: output.paramName + "CP",
                            open: true
                        });
                    } else {
                        tp = new TitlePane({
                            id: output.paramName + "CP",
                            open: false
                        });
                    }
                    this.titlePaneHolder.appendChild(tp.domNode);
                    tp.startup();
                    output.resultsPane = tp;
                    //To check whether output type is overview.
                    if (output.type.toUpperCase() !== "OVERVIEW") {
                        this.resultLayers.push(layer);
                    } else {
                        this.overviewInfo = output;
                    }
                }, this);
            },

            /**
            *This function will find the layer as per given layer name.
            *@param{array} layers: Array of layers.
            *@param{string} layerName: Name of the layer.
            *@return{object} Layer: This function will return the object of the Layer.
            **/
            _findLayer: function (layerName) {
                var layers, result;
                layers = this.map.itemInfo.itemData.operationalLayers;
                result = null;
                array.some(layers, function (layer) {
                    if (layer.layerObject.layerInfos !== undefined) {
                        array.forEach(layer.layerObject.layerInfos, function (subLyrs) {
                            if (layerName === subLyrs.name) {
                                if (layer.layers !== null) {
                                    array.forEach(layer.layers, function (popUp) {
                                        if (subLyrs.id === popUp.id) {
                                            layer.popupInfo = popUp.popupInfo;
                                        }
                                    }, this);
                                }
                                result = layer;
                                return true;
                            }
                        }, this);
                    } else {
                        if (layerName === layer.title) {
                            result = layer;
                            return true;
                        }
                    }
                });
                return result;
            },

            /**
            *This function will execute when User clicked on 'Clear' button.
            **/
            _onClearButtonClick: function () {
                this._showResultPanel(false);
                this._resetInputs();
                this._resetResults();
                if (this.toolbar !== null) {
                    this.toolbar.deactivate();
                    this.toolbar = null;
                }
                //This will check the Flag Status and as per that change the state of the button
                if (this.flagBtnClicked) {
                    this.flagBtnClicked = false;
                    domClass.remove(this.btnFlag, "flagButtonselected");
                    domClass.add(this.btnFlag, "flagbutton");
                }
                //This will check the Barrier Status and as per that change the state of the button
                if (this.barrierBtnClicked) {
                    this.barrierBtnClicked = false;
                    domClass.remove(this.btnBarrier, "barrierButtonselected");
                    domClass.add(this.btnBarrier, "barrierButton");
                }
                domClass.add(this.btnTrace, "jimu-state-disabled");
                domClass.add(this.btnClear, "jimu-state-disabled");
                this.btnTrace.disabled = true;
                this.btnClear.disabled = true;
            },

            /**
            *This function will start the asynchronous call as well as check and create the Parameter for the GP call.
            **/
            _GPExecute: function () {
                if (this.toolbar !== null) {
                    this.toolbar.deactivate();
                    this.toolbar = null;
                }
                domClass.add(this.btnTrace, "jimu-state-disabled");
                domClass.add(this.btnClear, "jimu-state-disabled");
                domAttr.set(this.btnFlag, "disabled", true);
                domAttr.set(this.btnBarrier, "disabled", true);
                this.btnFlag.disabled = true;
                this.btnBarrier.disabled = true;
                //This will reset the Flag Button
                if (this.flagBtnClicked) {
                    this.flagBtnClicked = false;
                    domClass.remove(this.btnFlag, "flagButtonselected");
                    domClass.add(this.btnFlag, "flagbutton");
                }
                //This will reset the barrier button
                if (this.barrierBtnClicked) {
                    this.barrierBtnClicked = false;
                    domClass.remove(this.btnBarrier, "barrierButtonselected");
                    domClass.add(this.btnBarrier, "barrierButton");
                }
                var params = {}, featureset, noFlags = false;
                array.forEach(this.gpInputDetails, function (layer) {
                    featureset = new FeatureSet();
                    featureset.features = layer.graphics;
                    if (layer.type === "Flag") {
                        if (layer.graphics === null) {
                            noFlags = true;
                        }
                        if (layer.graphics.length === 0) {
                            noFlags = true;
                        }
                    }
                    if (layer.graphics.length > 0) {
                        params[layer.paramName] = featureset;
                    }
                });
                if (noFlags) {
                    return false;
                }
                this.gp.submitJob(params);
            },

            /**
            *This function is a call back handler of GP Service submit job completion and this will initialize the GP get results data process.
            *@param{object} message: This is a object parameter which is coming from GP execution.
            **/
            _onSubmitJobComplete: function (message) {
                if (message.jobInfo.jobStatus === "esriJobFailed") {
                    alert(this.nls.GPExecutionFailed);
                    this._showLoadingIcon(false);
                    this._onClearButtonClick();
                    return;
                }
                try {
                    this._resetResults();
                    this.overExtent = null;
                    this.resultsCnt = 0;
                    array.forEach(dojo.configData.geoprocessing.outputs, function (output) {
                        if (this._verifyParams(message, output.paramName)) {
                            this.resultsCnt = this.resultsCnt + 1;
                            this._processGPResults(message, output.paramName);
                        }
                    }, this);
                } catch (ex) {
                    alert(ex.message);
                }
            },

            /**
            *This function will display the result panel with the results. This will execute when get result data is complete from GP.
            *@param{object} message: This is a object which is coming from GP execution.
            **/
            _onGetResultDataComplete: function (message) {
                this._showLoadingIcon(false);
                this._showResultPanel(true);
                array.some(dojo.configData.geoprocessing.outputs, function (output) {
                    if (message.result.paramName === output.paramName) {
                        if (output.type.toUpperCase() === "OVERVIEW") {
                            output.results = message.result.value;
                            this._populateOverview(output);
                        } else {
                            output.results = message.result.value;
                            this._populateResultsToggle(output);
                        }
                        return true;
                    }
                }, this);
                this.btnTrace.disabled = false;
                domClass.remove(this.btnTrace, "jimu-state-disabled");
                this.btnClear.disabled = false;
                domClass.remove(this.btnClear, "jimu-state-disabled");
                domAttr.set(this.btnFlag, "disabled", false);
                domAttr.set(this.btnBarrier, "disabled", false);
                this.btnFlag.disabled = false;
                this.btnBarrier.disabled = false;

            },

            /**
            *This function will verify the output parameter with the GP Results.
            *@param{object} message: object which is coming from the GP submit job.
            *@param{string} paramName: Parameter name from which the parameter should be match.
            *@return{boolean}: true or false.
            **/
            _verifyParams: function (message, paramName) {
                var key;
                if (message && message.jobInfo && message.jobInfo.results) {

                    for (key in message.jobInfo.results) {
                        if (message.jobInfo.results.hasOwnProperty(key)) {
                            if (paramName === key) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            },

            /**
            *This function will process the GP Results and set the map extent as per the results and display the layers on the map.
            *@param{object} message: object which is coming from the GP Submit Job.
            *@param{string} paramName: parameter name.
            */
            _processGPResults: function (message, paramName) {
                this.gp.getResultData(message.jobInfo.jobId, paramName).then(lang.hitch(this, function () {
                    this.resultsCnt = this.resultsCnt - 1;
                    if (this.resultsCnt === 0) {
                        var ext = this.overExtent;
                        if (ext) {
                            this.map.setExtent(ext.expand(1.5));
                        }
                        this._showAllResultLayers();
                    }
                }));
            },

            /**
            *This function will set the visibility of the result layers.
            **/
            _showAllResultLayers: function () {
                array.forEach(this.resultLayers, function (layer) {
                    layer.setVisibility(true);
                });
            },

            /**
            *This is a GP error call back function which will alert the user regarding the error while executing the GP service.
            *@param object err: 'err' contains information regarding the error.
            **/
            _onSubmitJobError: function (err) {
                alert(err);
            },

            /**
            *This function will add the outage area into the map.
            *@param{object} gpParam: object containing information regarding GP input parameter.
            **/
            _populateOverview: function (gpParam) {
                array.forEach(gpParam.results.features, function (feature) {
                    this.overExtent = this.overExtent === null ? feature.geometry.getExtent() : this.overExtent.union(feature.geometry.getExtent());
                    var selectedGraphic = new Graphic(feature.geometry, null, null, null);
                    if (gpParam.layer !== null) {
                        gpParam.layer.add(selectedGraphic);
                    }
                }, this);
            },

            /**
            *This function will add the results into the Title Pane with High Light and Skip buttons.
            *@param{object} selectedGPParam: object containing information regarding the output features.
            **/
            _populateResultsToggle: function (selectedGPParam) {
                var resultCount = {
                    "Count": 0,
                    "SkipCount": 0
                }, cp;
                cp = dijit.byId(selectedGPParam.paramName + "CP");
                cp.set("content", "");
                array.forEach(selectedGPParam.results.features, function (resultItem) {
                    var process, skipedLocation, selectedGraphic, div, id, bypassID, zoomToID, btnControlDiv, btnZoomDiv, btnZoom, btnBypass, btnBypassDiv;
                    process = true;
                    skipedLocation = null;
                    if (this.skipLayer !== null) {
                        if (this.skipLayer.graphics.length > 0) {
                            array.some(this.skipLayer.graphics, function (item) {
                                if (item.GPParam === selectedGPParam.paramName) {
                                    if (resultItem.attributes[selectedGPParam.bypassDetails.IDField] === item.attributes[selectedGPParam.bypassDetails.IDField]) {
                                        process = false;
                                        skipedLocation = item;
                                        return true;
                                    }
                                }
                            });
                        }
                        if (skipedLocation === null) {
                            skipedLocation = new Graphic(resultItem.geometry, null, resultItem.attributes, null);
                        }
                    }
                    selectedGraphic = new Graphic(resultItem.geometry, null, resultItem.attributes, null);
                    selectedGPParam.layer.add(selectedGraphic);
                    div = domConstruct.create("div", {
                        "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "div",
                        "class": "resultItem"
                    }, cp.containerNode);
                    if (skipedLocation !== null) {
                        skipedLocation.GPParam = selectedGPParam.paramName;
                    }
                    if (resultItem.attributes.OID !== null) {
                        id = resultItem.attributes.OID;
                    } else if (resultItem.attributes.OBJECTID !== null) {
                        id = resultItem.attributes.OBJECTID;
                    }
                    bypassID = selectedGPParam.paramName + ":" + id + "BypassBtn";
                    zoomToID = selectedGPParam.paramName + ":" + id + "ZoomToBtn";
                    resultItem.controlDetails = {
                        "bypassButtonID": bypassID,
                        "zoomToButtonID": zoomToID,
                        "skipGraphic": skipedLocation,
                        "bypassDetails": selectedGPParam.bypassDetails,
                        "selectionGraphic": selectedGraphic
                    };
                    btnControlDiv = domConstruct.create("div", {
                        "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "controls"
                    }, div);
                    btnZoomDiv = domConstruct.create("div", {
                        "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "BtnZoomDiv"
                    }, btnControlDiv);
                    btnZoom = new Button({
                        id: zoomToID,
                        baseClass: "",
                        iconClass: "resultItemButtonZoomIcon resultItemButton",
                        showLabel: false
                    }, btnZoomDiv);
                    btnZoom.startup();
                    btnZoom.on("click", lang.hitch(this, this._zoomToBtn(resultItem)));
                    btnBypass = null;
                    btnBypassDiv = null;
                    if (selectedGPParam.bypassDetails.skipable && process) {
                        resultCount.Count = resultCount.Count + 1;
                        btnBypassDiv = domConstruct.create("div", {
                            "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "BtnBypassDiv"
                        }, btnControlDiv);
                        btnBypass = new Button({
                            id: bypassID,
                            baseClass: "",
                            iconClass: "resultItemButtonSkipIcon resultItemButton",
                            showLabel: false
                        }, btnBypassDiv);
                        btnBypass.startup();
                        //btnBypass.on("click", lang.hitch(this, this._skipBtn(resultItem)));
                        resultItem.controlDetails.selectionGraphic.bypassed = false;
                        selectedGraphic.setInfoTemplate(this.template);
                    } else if (selectedGPParam.bypassDetails.skipable && process === false) {
                        resultCount.SkipCount = resultCount.SkipCount + 1;
                        btnBypassDiv = domConstruct.create("div", {
                            "id": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "BtnBypassDiv"
                        }, btnControlDiv);
                        btnBypass = new Button({
                            id: bypassID,
                            baseClass: "",
                            iconClass: "resultItemButtonSkipIconSelected resultItemButton",
                            showLabel: false
                        }, btnBypassDiv);
                        btnBypass.startup();
                        //btnBypass.on("click", lang.hitch(this, this._skipBtn(resultItem)));
                        resultItem.controlDetails.selectionGraphic.bypassed = true;
                    } else {
                        resultItem.controlDetails.selectionGraphic.bypassed = false;
                        resultCount.Count = resultCount.Count + 1;
                    }
                    domConstruct.create("label", {
                        "class": "resultItemLabel",
                        "for": selectedGPParam.paramName + ":" + resultItem.attributes.OID + "BtnZoomDiv",
                        "innerHTML": lang.replace(selectedGPParam.displayText, resultItem.attributes)
                    }, btnControlDiv);
                    resultItem.controlDetails.selectionGraphic.resultItem = resultItem;
                }, this);
                dojo.place("<div class='resultItemClass'>" + lang.replace(selectedGPParam.summaryText, resultCount) + "</div>", this.overviewInfo.resultsPane.containerNode);
                //checking whether the Title Pane is summary or not.
                if (selectedGPParam.buttonText !== "Summary") {
                    dijit.byId(selectedGPParam.paramName + "CP").set("title", selectedGPParam.buttonText + " (" + resultCount.Count + ")");
                }
            },

            /**
            *This function will zoom into the particular feature.
            *@param{object} resultItem:object containing information regarding feature which to be zoom.
            **/
            _zoomToBtn: function (resultItem) {
                return function (e) {
                    //This will check the viewport size of the device.
                    if (this.viewPortSize.w < 768) {
                        this.panelManager.getPanelById(this.id + '_panel').onTitleClick();
                    }
                    var geometry;
                    geometry = resultItem.controlDetails.selectionGraphic.geometry;
                    this.map.centerAt(geometry);
                    this._showHighlightedFeature(geometry);
                };
            },

            /**
            *This function will add the High Lighted Graphic to the Graphic layer.
            *@param{object} geometery: object containing information regarding the Feature which to be high light.
            **/
            _showHighlightedFeature: function (geometry) {
                this.animatedLayer.clear();
                this.timer.stop();
                var highightGraphic = new Graphic(geometry, null, null, null);
                this.animatedLayer.add(highightGraphic);
                this.timer.start();
            },

            /**
            *This function will create High Lighting Graphic Layer and decide the highlighting time for the Graphic.
            **/
            _createTimer: function () {
                var animatedSymbol, animatedRenderer;
                this.timer = new Timing.Timer(dojo.configData.highlighterDetails.timeout);
                this.animatedLayer = new GraphicsLayer();
                animatedSymbol = new PictureMarkerSymbol(dojo.configData.highlighterDetails.image, dojo.configData.highlighterDetails.width, dojo.configData.highlighterDetails.height);
                animatedRenderer = new SimpleRenderer(animatedSymbol);
                this.animatedLayer.id = "animatedLayer";
                this.animatedLayer.setRenderer(animatedRenderer);
                this.map.addLayer(this.animatedLayer);
                this.timer.onTick = lang.hitch(this, function () {
                    this.timer.stop();
                    this.animatedLayer.clear();
                });
            },

            /**
            *This function will clear the result layers.
            **/
            _resetResults: function () {
                this.map.graphics.clear();
                //Looping through the output layers and then clearing the layer.
                array.forEach(dojo.configData.geoprocessing.outputs, function (output) {
                    //checking whether layer is null or not.
                    if (output.layer !== null) {
                        output.layer.clear();
                    }
                    //checking whether result pane is null or not.
                    if (output.resultsPane !== null) {
                        output.resultsPane.set("content", "");
                    }
                }, this);
            },

            /**
            *This function will clear the input layers.
            **/
            _resetInputs: function () {
                //Looping through the Input layers and then clearing the layer.
                array.forEach(this.gpInputDetails, function (input) {
                    input.clear();
                }, this);
            }

        });
    });