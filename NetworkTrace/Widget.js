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
    "dojo/window",
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
    "dojo/date/locale",
    "dijit/form/DateTextBox",
    "dijit/form/TimeTextBox",
    "dojo/dom-attr",
    "dojo/has",
    "dojo/string",
    "jimu/WidgetManager",
    "dojo/_base/html",
    "jimu/PanelManager",
    "dojo/dom-style",
    "esri/symbols/jsonUtils",
    "jimu/dijit/Message",
    "dijit/form/Select",
    "jimu/dijit/CheckBox",
    "dijit/form/NumberTextBox"
    ], function (declare, BaseWidget, map, on, lang, xhr, dojoWindowClass, PictureMarkerSymbol, Graphic, Point, SimpleMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol,
    Geoprocessor, array, GraphicsLayer, SimpleRenderer, Draw, domClass, FeatureSet, TitlePane, Button, domConstruct, dom, Timing, query,
    TooltipDialog, popup, CheckBox, TextBox, all, Deferred, InfoTemplate, registry, dateLocale, DateTextBox, TimeTextBox, domAttr, has, string, WidgetManager,
    html, PanelManager, style, symbolJsonUtils, JimuMessage, Select, Checkbox, NumberTextBox) {
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
            computedPanelStyle: null,
            mainContainer: null,
            exportToLayerCheckBox: null,
            tooltipDialog: null,
            IsIE: null,
            IsChrome: null,
            IsSafari: null,
            IsOpera: null,
            errorLayerArray: [],
            /**
            *This is a startup function of a isolation trace widget.
            **/
            startup: function () {
                this.inherited(arguments);
                if (this._validateConfigParams()) {
                    this.IsOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
                    this.IsSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
                    this.IsChrome = !!window.chrome && !this.IsOpera;
                    this.IsIE = !!document.documentMode || false;
                    on(this.map, "click", lang.hitch(this, this._onMapClick));
                    this.gp = new Geoprocessor(this.config.geoprocessing.url);
                    on(this.gp, "error", lang.hitch(this, this._onSubmitJobError));
                    on(this.gp, "job-complete", lang.hitch(this, this._onSubmitJobComplete));
                    on(this.gp, "get-result-data-complete", lang.hitch(this, this._onGetResultDataComplete));
                    this.gp.setOutSpatialReference(this.map.spatialReference);
                    this._createResultPanels();
                    this._createGraphic();
                    this._createTimer();
                    this.viewPortSize = dojoWindowClass.getBox();
                    this.panelManager = PanelManager.getInstance();
                }
            },

            /**
            *This function will validate the widget configuration parameters.
            **/
            _validateConfigParams: function () {
                var isConfigParam;
                //checking whether this.config has primary objects or not.
                if (this.config.hasOwnProperty("highlighterDetails") && this.config.hasOwnProperty("geoprocessing")) {
                    //checking whether url, inputs and output are present or not.
                    if (this.config.geoprocessing.hasOwnProperty("url") && this.config.geoprocessing.hasOwnProperty("inputs") && this.config.geoprocessing.hasOwnProperty("outputs")) {
                        if (this.config.geoprocessing.inputs.length > 0 && this.config.geoprocessing.outputs.length > 0 && this.config.geoprocessing.url !== "") {
                            isConfigParam = true;
                        } else {
                            this._errorMessage(this.nls.configError);
                            isConfigParam = false;
                        }
                    } else {
                        this._errorMessage(this.nls.configError);
                        isConfigParam = false;
                    }
                } else {
                    this._errorMessage(this.nls.configError);
                    isConfigParam = false;
                }
                return isConfigParam;
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
                var saveToLayerArray, exportToCSVArray;
                saveToLayerArray = [];
                exportToCSVArray = [];
                this.resultPanel.style.display = isShowResultPanel ? "block" : "none";
                array.forEach(this.config.geoprocessing.outputs, function (output) {
                    if (output.exportToCSV) {
                        exportToCSVArray.push(output);
                    }
                    if (output.saveToLayer !== "") {
                        saveToLayerArray.push(output);
                    }
                });
                //checking export to csv and save to layer array length to display buttons.
                if (exportToCSVArray.length > 0) {
                    this.btnExportToLayer.style.display = "block";
                    this.btnExportToLayer.title = this.nls.ExportToCSVtooltip;
                } else {
                    this.btnExportToLayer.style.display = "none";
                }
                if (saveToLayerArray.length > 0) {
                    this.btnSaveToLayer.style.display = "block";
                    this.btnSaveToLayer.title = this.nls.saveToLayertoolTip;
                } else {
                    this.btnSaveToLayer.style.display = "none";
                }

            },
            /**
            *This function will enable or disable  panel.
            *@param{boolean} isShowTracePanel: Boolean to check whether result panel should display or not.
            **/
            _showTracePanel: function (isShowTracePanel) {
                this.tracePanel.style.display = isShowTracePanel ? "block" : "none";
            },
            /**
            *This function will enable or disable 'Save To Layer' and 'Export To CSV' buttons  panel.
            *@param{boolean} isShowButtons: Boolean to check whether result panel should display or not.
            **/
            _showButtons: function (isShowButtons) {
                this.divForButtons.style.display = isShowButtons ? "block" : "none";
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
                this.map.infoWindow.hide();
                this._GPExecute();
                this._showTracePanel(true);
                this._showLoadingIcon(true);
                this._showResultPanel(false);
            },
            /**
            *This function will execute when user clicked on the 'Save To Layer' button.
            **/
            _onSaveToLayerButtonClick: function () {
                this._showResultPanel(false);
                this._showTracePanel(false);
                this.SaveToLayerPanel.style.display = "block";
                this.exportToCSVPanel.style.display = "none";
                this._displayOutageAreaDetail();
                this._displaySaveLayerPanel();
            },
            /**
            *This Function will display Runtrace panel when click on back button .
            **/
            _onBackButtonClick: function () {
                if (this.CheckBoxOutageArea) {
                    this.CheckBoxOutageArea.checked = false;
                }
                domClass.add(this.outageAreaVisibiltyDiv, "esriCTHidden");
                this._showLoadingIcon(true);
                this._showResultPanel(true);
                this._showTracePanel(true);
                this._showLoadingIcon(false);
                this.SaveToLayerPanel.style.display = "none";
                this.exportToCSVPanel.style.display = "none";
            },

            /**
            *This Function will display Runtrace panel when click on back button .
            **/
            _onExportToLayerButtonClick: function () {
                this._showResultPanel(false);
                this._showTracePanel(false);
                this._showLoadingIcon(false);
                this.SaveToLayerPanel.style.display = "none";
                this.exportToCSVPanel.style.display = "block";
                this._displayExportToCSVPanel();
            },

            /**
            *This Function is used to save data of save to layer panel.
            **/
            _onSaveClick: function () {
                this._showLoadingIcon(true);
                var checkBox = query(".saveToLayerData", this.bottomDiv), selectedLayersArray = [], layerObj, arraynumberTextboxValue = [], numberTextbox, deferredArray = [], i, j, displayName;
                for (i = 0; i < checkBox.length; i++) {
                    if (domClass.contains(checkBox[i].firstChild, "checked")) {
                        displayName = domAttr.get(checkBox[i], "OBJID");
                        if (displayName !== null) {
                            selectedLayersArray.push(displayName);
                        }
                    }
                }
                array.forEach(this.config.geoprocessing.outputs, lang.hitch(this, function (output) {
                    if (output.type !== "Overview") {
                        numberTextbox = query(".esriCTTextbox_" + output.paramName);
                        if (numberTextbox.length > 0) {
                            arraynumberTextboxValue.push(numberTextbox[0].childNodes['1'].firstChild.value);
                        }
                    }
                }));
                array.forEach(this.config.geoprocessing.outputs, lang.hitch(this, function (output) {
                    if (array.indexOf(selectedLayersArray, output.paramName) > -1 && (output.type === "Overview" || output.type !== "Overview") && output.saveToLayer !== "" && output.results !== null && output.results.features !== null && output.results.features.length > 0) {
                        layerObj = this.map.getLayer(output.saveToLayer);
                        if (output.type === "Overview") {
                            for (j = 0; j < output.fieldMap.length; j++) {
                                output.results.features[0].attributes[output.fieldMap[j].fieldName] = arraynumberTextboxValue[j];
                            }
                        }
                        if (layerObj !== null) {
                            deferredArray.push(layerObj.applyEdits(output.results.features, null, null, null, this._applyEditsErrorCallback));
                        }
                    }
                }));
                all(deferredArray).then(lang.hitch(this, function (result) {
                    if (result.length === 0) {

                        this._errorMessage(this.nls.NoLayerForSaveToLayer);
                        this._showLoadingIcon(false);

                    } else {
                        if (this.errorLayerArray.length === 0) {
                            this._errorMessage(this.nls.saveToLayerSuccess);
                            this._onBackButtonClick();
                            this._showLoadingIcon(false);
                        } else {
                            this._errorMessage(this.nls.unableToSaveLayer);
                            this._onBackButtonClick();
                            this._showLoadingIcon(false);
                        }

                    }
                }));

            },

            _applyEditsErrorCallback: function (evt) {
                this.errorLayerArray.push(evt);
            },

            /**
            *This function will execute when User click on 'Export to CSV icon' .
            **/
            _displayExportToCSVPanel: function () {
                var labelText, saveButton, checkboxDiv, btnExportToLayerDiv, exportToLayerCheckBox;
                domConstruct.empty(this.exportToCSVBottomDiv);
                array.forEach(this.config.geoprocessing.outputs, function (output) {
                    if (output.exportToCSV) {
                        checkboxDiv = domConstruct.create("div", {
                            "class": "esriCTParamCheckBox"
                        });
                        exportToLayerCheckBox = new Checkbox({
                            "name": output.paramName,
                            "class": "esriCTChkExportToLayer"
                        }, domConstruct.create("div", {}, checkboxDiv));
                        exportToLayerCheckBox.title = output.paramName;
                        domAttr.set(exportToLayerCheckBox.domNode, "ObJID", output.paramName);
                        labelText = (output.type === "Overview") ? this.nls.outageAreaLabel : output.panelText;
                        domConstruct.create("label", {
                            "innerHTML": labelText,
                            "class": "esriCTChkLabel"
                        }, checkboxDiv);
                        domConstruct.place(checkboxDiv, this.exportToCSVBottomDiv);
                    }
                }, this);
                btnExportToLayerDiv = domConstruct.create("div", {
                    "class": "esriCTSaveButton"
                });
                //Save
                saveButton = domConstruct.create("button", {
                    "class": "jimu-btn",
                    "innerHTML": this.nls.btnSaveExportToLayer
                }, btnExportToLayerDiv);
                this.own(on(saveButton, "click", lang.hitch(this, function (evt) {
                    var checkBox, arrayValues, i, displayName, j;
                    checkBox = query(".esriCTChkExportToLayer", this.exportToCSVBottomDiv);
                    arrayValues = [];
                    for (i = 0; i < checkBox.length; i++) {
                        if (domClass.contains(checkBox[i].firstChild, "checked")) { //query(".checked", checkBox[i]).length > 0;
                            displayName = domAttr.get(checkBox[i], "ObJID");
                            if (displayName !== null) {
                                arrayValues.push(displayName);
                            }
                        }
                    }

                    if (arrayValues.length === 0) {
                        this._errorMessage(this.nls.noLayerSelectedForExportToCSV);
                    } else {

                        for (j = 0; j < arrayValues.length; j++) {
                            this._initializingExportToCSV(arrayValues[j]);
                        }
                    }

                })));

                domConstruct.place(btnExportToLayerDiv, this.exportToCSVBottomDiv);
            },

            _initializingExportToCSV: function (csvFileName) {
                var defs;
                defs = [];
                array.forEach(this.config.geoprocessing.outputs, lang.hitch(this, function (output) {
                    if (csvFileName === output.paramName) {
                        defs.push(this._createCSVContent(output.results, output.paramName).promise);
                    }
                }));
                all(defs).then(lang.hitch(this, function (results) {
                    if (results.length !== 0) {
                        var TempString;
                        array.forEach(results, function (result) {
                            TempString = (result.csvdata).split(",");
                            lang.hitch(this, this._exportToCSVComplete(result, TempString[0]));
                        }, this);
                        this._errorMessage(this.nls.exportToCSVSuccess);
                        this._onBackButtonClick();
                    } else {
                        this._errorMessage(this.nls.exportToCSVFailure);
                        this._onBackButtonClick();
                    }

                }), lang.hitch(this, function (error) {
                    this._errorMessage(error);
                    this._onBackButtonClick();
                }));

            },


            _exportToCSVComplete: function (csvdata, fileName) {
                var link, oWin, click_ev;
                if (this.IsIE) {
                    oWin = window.top.open("about:blank", "_blank");
                    oWin.document.write(csvdata.csvdata);
                    oWin.document.close();
                    oWin.document.execCommand('SaveAs', true, fileName);
                    oWin.close();
                } else {
                    link = domConstruct.create("a", {
                        href: 'data:attachment/csv;charset=utf-8,' + encodeURIComponent(csvdata.csvdata),
                        target: '_blank',
                        download: fileName + ".csv"
                    }, this.domNode);
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
            * This function is used to create CSV content data.
            **/
            _createCSVContent: function (results, title) {
                var deferred = new Deferred(), csvNewLineChar, csvContent, atts = [], dateFlds = [], idx = 0, dataLine;
                setTimeout(lang.hitch(this, function () {
                    csvNewLineChar = "\r\n";
                    csvContent = title + "," + csvNewLineChar;
                    if (results.features.length > 0) {
                        var key;
                        for (key in results.features[0].attributes) {
                            if (results.features[0].attributes.hasOwnProperty(key)) {
                                array.forEach(results.fields, lang.hitch(this, function (field) {
                                    if (field.name === key) {
                                        if (field.type === "esriFieldTypeDate") {
                                            dateFlds.push(idx);
                                        }
                                        idx += 1;

                                        atts.push(field.alias);
                                        return true;
                                    }
                                }));
                            }
                        }
                        csvContent += atts.join(",") + csvNewLineChar;
                        array.forEach(results.features, function (feature, index) {
                            atts = [];
                            idx = 0;
                            var k;
                            if (feature.attributes !== null) {
                                for (k in feature.attributes) {
                                    if (feature.attributes.hasOwnProperty(k)) {
                                        if (dateFlds.indexOf(idx) >= 0) {
                                            atts.push("\"" + this._formatDate(feature.attributes[k]) + "\"");
                                        } else {
                                            atts.push("\"" + feature.attributes[k] + "\"");
                                        }
                                    }
                                    idx = idx + 1;
                                }
                            }
                            dataLine = atts.join(",");
                            csvContent += dataLine + csvNewLineChar;
                        }, this);
                        csvContent += csvNewLineChar + csvNewLineChar;
                    } else {
                        array.forEach(results.fields, function (field, index) {

                            atts.push(field.alias);

                        }, this);
                        csvContent += atts.join(",") + csvNewLineChar;

                    }
                    deferred.resolve({
                        "csvdata": csvContent
                    });
                }, 1000));

                return deferred;
            },

            _formatDate: function (value) {
                var inputDate = new Date(value);
                return dateLocale.format(inputDate, {
                    selector: "date",
                    datePattern: "MM-d-y"
                });
            },

            /**
            *This function is used to display 'Save to Layer' panel.
            **/
            _displaySaveLayerPanel: function () {
                //var startDate, endDate, startTime, endTime, selectOutageType;
                var otherLayercheckBox, checkboxDiv, txtBoxLabelDiv, parameterTextBox, textBoxParamDiv, textBoxParamMainDiv, fieldMapItem;
                domConstruct.empty(this.outageCheckBoxDiv);
                domConstruct.empty(this.chkLayerDiv);
                domConstruct.empty(this.resultParametersCount);
                query(".clearInstance").forEach(domConstruct.destroy);
                array.forEach(this.config.geoprocessing.outputs, lang.hitch(this, function (output) {
                    if (output.saveToLayer !== "") {
                        if (output.type === "Overview") {
                            this.outageDetailDiv = domConstruct.create("div", {
                                "class": "clearInstance"
                            }, this.outageCheckBoxDiv);
                            this.outageAreaDiv = domConstruct.create("div", {
                                "class": "clearInstance"
                            }, this.outageDetailDiv);
                            this.CheckBoxOutageArea = new Checkbox({
                                "name": output.panelText,
                                "class": "clearInstance saveToLayerData"
                            }, this.outageAreaDiv);
                            this.CheckBoxOutageArea.title = this.nls.outageAreaValue;

                            domConstruct.create("label", {
                                "innerHTML": this.nls.outageAreaLabel,
                                "class": "esriCTLabelMargin"
                            }, this.outageAreaDiv);
                            this.own(on(this.CheckBoxOutageArea, "click", lang.hitch(this, this._displayOutageAreaDetail)));
                            domAttr.set(this.CheckBoxOutageArea.domNode, "OBJID", output.paramName);
                            //Start Date
                            this.startDateMainDiv = domConstruct.create("div", {
                                "class": "clearInstance"
                            }, this.StartDateDiv);
                            this.startDate = new dijit.form.DateTextBox({
                                "class": "esriCTOutageControl clearInstance",
                                "name": this.nls.lblOutageAreaStartDate
                            }, this.startDateMainDiv);
                            // 'End Start Date'
                            this.endDateMainDiv = domConstruct.create("div", {
                                "class": "clearInstance"
                            }, this.endDateDiv);
                            this.endDate = new dijit.form.DateTextBox({
                                "class": "esriCTOutageControl clearInstance",
                                "name": this.nls.lblOutageAreaEndDate
                            }, this.endDateMainDiv);
                            // 'Outage Start Time'
                            this.starTimeMainDiv = domConstruct.create("div", {
                                "class": "clearInstance"
                            }, this.startTimeDiv);
                            this.startTime = new TimeTextBox({
                                "class": "esriCTOutageControl clearInstance",
                                "name": this.nls.lblOutageAreaStartTime,
                                value: "T15:00:00",
                                constraints: {
                                    clickableIncrement: 'T00:15:00',
                                    visibleIncrement: 'T00:15:00',
                                    visibleRange: 'T01:00:00'
                                }
                            }, this.starTimeMainDiv);
                            //'Outage End Time'
                            this.endTimeMainDiv = domConstruct.create("div", {
                                "class": "clearInstance"
                            }, this.endTimeDiv);
                            this.endTime = new TimeTextBox({
                                "class": "esriCTOutageControl clearInstance",
                                "name": this.nls.lblOutageAreaEndTime,
                                value: "T15:00:00",
                                constraints: {
                                    clickableIncrement: 'T00:15:00',
                                    visibleIncrement: 'T00:15:00',
                                    visibleRange: 'T01:00:00'
                                }
                            }, this.endTimeMainDiv);
                            this.outageTypMainDiv = domConstruct.create("div", {
                                "class": "clearInstance",
                                style: "width: 47%"
                            }, this.outageAreaSelectDiv);
                            this.selectOutageType = new Select({
                                "name": this.nls.lblOutageAreaType,
                                "class": "clearInstance",
                                style: "width: 43%",
                                options: [{
                                    label: this.nls.outageTypePlanned,
                                    value: this.nls.outageTypePlanned,
                                    selected: true
                                }, {
                                    label: this.nls.outageTypeUnPlanned,
                                    value: this.nls.outageTypePlanned
                                }]
                            }, this.outageTypMainDiv);

                        } else {
                            array.forEach(this.config.geoprocessing.outputs[0].fieldMap, lang.hitch(this, function (item) {
                                if (item.paramName === output.paramName) {
                                    fieldMapItem = item;
                                }
                            }));
                            if (output.results.features.length > 0) {
                                if (fieldMapItem) {
                                    textBoxParamMainDiv = domConstruct.create("div", {
                                        "class": "esriCTChkGroup"
                                    }, this.resultParametersCount);
                                    txtBoxLabelDiv = domConstruct.create("div", {
                                        "class": "esriCTWidth"
                                    }, textBoxParamMainDiv);
                                    domConstruct.create("label", {
                                        "class": "resultParameter",
                                        innerHTML: this.nls.NoOf + output.paramName
                                    }, txtBoxLabelDiv);
                                    textBoxParamDiv = domConstruct.create("div", {}, textBoxParamMainDiv);
                                    parameterTextBox = new NumberTextBox({
                                        "class": "esriCTTextbox_" + output.paramName,
                                        "value": output.results.features.length
                                    }, textBoxParamDiv);
                                }
                                checkboxDiv = domConstruct.create("div", {
                                    "class": "esriCTParamCheckBox"
                                });

                                otherLayercheckBox = new Checkbox({
                                    "name": output.paramName,
                                    "class": "saveToLayerData"
                                }, domConstruct.create("div", {}, checkboxDiv));

                                domConstruct.create("label", {
                                    "class": "esriCTChkLabel",
                                    "innerHTML": output.panelText
                                }, checkboxDiv);
                                domConstruct.place(checkboxDiv, this.chkLayerDiv);
                                domAttr.set(otherLayercheckBox.domNode, "OBJID", output.paramName);
                            }
                        }
                    }

                }));
            },
            /**
            * This function destroy widget if created
            * @param{object} div
            * @memberOf widgets/isolation-trace/settings/settings.js
            */
            _destroyWidget: function (div) {
                var widgets = registry.findWidgets(div);
                domConstruct.empty(div);
                // Looping for each widget and destroying the widget
                array.forEach(widgets, function (w) {
                    w.destroyRecursive(true);
                });
            },
            //This function is used to display (Outage Date,time,Type) panel.
            _displayOutageAreaDetail: function () {
                if (this.CheckBoxOutageArea && this.CheckBoxOutageArea.checked) {
                    domClass.remove(this.outageAreaVisibiltyDiv, "esriCTHidden");
                } else {
                    domClass.add(this.outageAreaVisibiltyDiv, "esriCTHidden");
                }
            },
            /**
            *This function will execute when user clicked on the map and it will add the graphic to the input graphic layer.
            *@param{object} evt: object containing information regarding the map point.
            **/
            _onMapClick: function (evt) {
                var i, skipTemplate, addType;
                //This is will check whether Flag or Barrier has been selected or not, to place the pushpin on the map.
                if (this.flagBtnClicked || this.barrierBtnClicked) {
                    this.map.infoWindow.hide();
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
                if (evt.hasOwnProperty("graphic")) {
                    if (evt.graphic && evt.graphic.hasOwnProperty("GPParam")) {
                        if (evt.graphic.GPParam !== null) {
                            array.some(this.config.geoprocessing.outputs, function (output) {
                                if (evt.graphic.GPParam === output.paramName) {
                                    for (i = 0; i < output.layer.graphics.length; i++) {
                                        if (output.layer.graphics[i].geometry === evt.graphic.geometry) {
                                            skipTemplate = new InfoTemplate();
                                            skipTemplate.setTitle(this.nls.skipThisAsset);
                                            skipTemplate.setContent(this._createSkipButtonForPopup(output.layer.graphics[i]));
                                            evt.graphic.setInfoTemplate(skipTemplate);
                                        }
                                    }
                                }
                            }, this);
                        }
                    }
                }
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
            *This function will add the Input layers into the map.
            **/
            _createGraphic: function () {
                this.gpInputDetails = [];
                this.skipLayer = null;
                var inLayer, addSymbol, ren, barriersFlag;
                barriersFlag = query(".btnBarrierStyle", this.tracePanel)[0];
                //This will create the GraphicsLayer as per the GP Inputs.
                array.forEach(this.config.geoprocessing.inputs, function (input) {
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
                    if (input.type === "Barrier") {
                        domClass.remove(barriersFlag, "esriCTHidden");
                        if (input.toolTip !== "" || input.toolTip !== null) {
                            this.btnBarrier.title = input.toolTip;
                        }
                    }
                    if (input.type === "Flag") {
                        if (input.toolTip !== "" || input.toolTip !== null) {
                            this.btnFlag.title = input.toolTip;
                        }
                    }
                }, this);
                this.map.addLayers(this.gpInputDetails);
            },

            /**
            *This Function will add the output layers to the map also initialize TitlePane into the Widget.
            **/
            _createResultPanels: function () {
                this.resultLayers = [];
                var sym, ren, layer, tp, parentTp, otherTp = [],
                i;
                array.forEach(this.config.geoprocessing.outputs, function (output) {
                    sym = null;
                    ren = null;
                    layer = new GraphicsLayer();
                    if (isNaN(output.MinScale) && isNaN(output.MaxScale)) {
                        layer.minScale = Number(output.MinScale.replace(",", ""));
                        layer.maxScale = Number(output.MaxScale.replace(",", ""));
                    } else {
                        layer.minScale = output.MinScale;
                        layer.maxScale = output.MaxScale;
                    }

                    //To check whether output layer is visible or not.
                    if (output.hasOwnProperty("visible")) {
                        if (output.visible !== null) {
                            if (output.visible) {
                                layer.setVisibility(true);
                            } else {
                                layer.setVisibility(false);
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
                    if (output.type.toUpperCase() === "OVERVIEW") {
                        parentTp = new TitlePane({
                            title: this.nls.summaryPanel,
                            id: output.paramName + "CP",
                            open: true
                        });
                    } else {
                        tp = new TitlePane({
                            id: output.paramName + "CP",
                            open: false
                        });
                        if (output.toolTip !== "" && output.toolTip !== null) {
                            domAttr.set(tp.titleBarNode, "title", output.toolTip);
                        }
                        otherTp.push(tp);
                    }
                    if (parentTp !== undefined) {
                        this.titlePaneHolder.appendChild(parentTp.domNode);
                        output.resultsPaneParent = parentTp;
                        if (output.toolTip !== "" && output.toolTip !== null) {
                            domAttr.set(parentTp.titleBarNode, "title", this.nls.summaryPanel);
                        }
                        parentTp.startup();
                    }
                    if (tp !== undefined) {
                        output.resultsPane = tp;
                        tp.startup();
                    }
                    if (otherTp.length === this.config.geoprocessing.outputs.length - 1) {
                        for (i = 0; i < otherTp.length; i++) {
                            this.titlePaneHolder.appendChild(otherTp[i].domNode);
                        }
                    }
                    //To check whether output type is overview.
                    if (output.type.toUpperCase() !== "OVERVIEW") {
                        this.resultLayers.push(layer);
                    } else {
                        this.overviewInfo = output;
                    }
                }, this);
            },

            /**
            *This function will execute when User clicked on 'Clear' button.
            **/
            _onClearButtonClick: function () {
                //this.animatedLayer.clear();
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
                if (this.btnFlag.className.indexOf("traceControlDisabledDiv") > -1) {
                    domClass.remove(this.btnFlag, "traceControlDisabledDiv");
                }
                if (this.btnBarrier.className.indexOf("traceControlDisabledDiv") > -1) {
                    domClass.remove(this.btnBarrier, "traceControlDisabledDiv");
                }
                domClass.add(this.btnTrace, "jimu-state-disabled");
                domClass.add(this.btnClear, "jimu-state-disabled");
                this.btnTrace.disabled = true;
                this.btnClear.disabled = true;
                domClass.add(this.btnSaveToLayer, "jimu-state-disabled");
                domClass.add(this.btnExportToLayer, "jimu-state-disabled");
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
                this.btnTrace.disabled = true;
                this.btnClear.disabled = true;
                domClass.add(this.btnFlag, "traceControlDisabledDiv");
                domClass.add(this.btnBarrier, "traceControlDisabledDiv");
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
                var params = {},
                featureset,
                noFlags = false;
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
                    this._showLoadingIcon(false);
                    this._errorMessage(this.nls.GPExecutionFailed);
                    this._onClearButtonClick();
                    return;
                }
                try {
                    this._resetResults();
                    this.overExtent = null;
                    this.resultsCnt = 0;
                    array.forEach(this.config.geoprocessing.outputs, function (output) {
                        if (this._verifyParams(message, output.paramName)) {
                            this.resultsCnt = this.resultsCnt + 1;
                            this._processGPResults(message, output.paramName);
                        }
                    }, this);
                } catch (ex) {
                    this._showLoadingIcon(false);
                    this._errorMessage(ex.message);
                    this._onClearButtonClick();
                }
            },

            /**
            *This function will display the result panel with the results. This will execute when get result data is complete from GP.
            *@param{object} message: This is a object which is coming from GP execution.
            **/
            _onGetResultDataComplete: function (message) {
                this._showLoadingIcon(false);
                this._showResultPanel(true);
                array.some(this.config.geoprocessing.outputs, function (output) {
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
                this.btnFlag.disabled = false;
                this.btnBarrier.disabled = false;
                this.btnTrace.disabled = false;
                domClass.remove(this.btnTrace, "jimu-state-disabled");
                this.btnClear.disabled = false;
                domClass.remove(this.btnClear, "jimu-state-disabled");
                domClass.remove(this.btnFlag, "traceControlDisabledDiv");
                domClass.remove(this.btnBarrier, "traceControlDisabledDiv");
                domClass.remove(this.btnExportToLayer, "jimu-state-disabled");
                domClass.remove(this.btnSaveToLayer, "jimu-state-disabled");
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
                this._errorMessage(err.error);
                if (this._showLoadingIcon) {
                    this._showLoadingIcon(false);
                }
                this._onClearButtonClick();
            },

            /**
            *This function will add the outage area into the map.
            *@param{object} gpParam: object containing information regarding GP input parameter.
            **/
            _populateOverview: function (gpParam) {
                array.forEach(gpParam.results.features, function (feature) {
                    this.overExtent = this.overExtent === null ? feature.geometry.getExtent() : this.overExtent.union(feature.geometry.getExtent());
                    var selectedGraphic = new Graphic(feature.geometry, null, feature.attributes, null);
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
                },
                cp, skipBtnTitle = "", objectIDValue, bypassBtnClass, fieldKey;
                cp = dijit.byId(selectedGPParam.paramName + "CP");
                cp.set("content", "");
                if (this.config && this.config.geoprocessing && this.config.geoprocessing.inputs && this.config.geoprocessing.inputs.length > 0) {
                    array.forEach(this.config.geoprocessing.inputs, function (input) {
                        if (input.type === "Skip") {
                            if (input.toolTip !== "" || input.toolTip !== null) {
                                skipBtnTitle = input.toolTip;
                            }
                        }
                    });
                }
                fieldKey = selectedGPParam.bypassDetails.IDField || this._getResultItemObjectID(selectedGPParam);
                array.forEach(selectedGPParam.results.features, lang.hitch(this, function (resultItem) {
                    objectIDValue = fieldKey ? resultItem.attributes[fieldKey] : "";
                    var process, skipedLocation, selectedGraphic, div, btnControlDiv, btnZoomDiv, btnBypassDiv;
                    process = true;
                    skipedLocation = null;
                    if (selectedGPParam.bypassDetails.skipable && this.skipLayer !== null) {
                        if (this.skipLayer.graphics.length > 0) {
                            array.forEach(this.skipLayer.graphics, lang.hitch(this, function (item) {
                                if (item.GPParam === selectedGPParam.paramName) {
                                    if (objectIDValue === item.attributes[fieldKey]) {
                                        process = false;
                                        skipedLocation = item;
                                        skipedLocation.GPParam = selectedGPParam.paramName;
                                        return true;
                                    }
                                }
                            }));
                        }
                        if (skipedLocation === null) {
                            skipedLocation = new Graphic(resultItem.geometry, null, resultItem.attributes, null);
                            skipedLocation.GPParam = selectedGPParam.paramName;
                        }
                    }
                    this._formatDateAttributes(selectedGPParam, resultItem);
                    selectedGraphic = new Graphic(resultItem.geometry, null, resultItem.attributes, null);
                    selectedGPParam.layer.add(selectedGraphic);
                    div = domConstruct.create("div", {
                        "id": selectedGPParam.paramName + ":" + objectIDValue + "div",
                        "class": "resultItem"
                    }, cp.containerNode);
                    resultItem.controlDetails = {
                        "skipGraphic": skipedLocation,
                        "bypassDetails": selectedGPParam.bypassDetails,
                        "selectionGraphic": selectedGraphic
                    };
                    btnControlDiv = domConstruct.create("div", {
                        "id": selectedGPParam.paramName + ":" + objectIDValue + "controls",
                        "class": "resultItemSubDiv"
                    }, div);
                    btnZoomDiv = domConstruct.create("div", {
                        "class": "resultItemButtonZoomIcon resultItemButton",
                        "title": this.nls.highlightOnMapTooltip
                    }, btnControlDiv);
                    on(btnZoomDiv, "click", lang.hitch(this, this._zoomToBtn(resultItem)));
                    if (selectedGPParam.bypassDetails.skipable) {
                        btnBypassDiv = null;
                        bypassBtnClass = selectedGPParam.paramName + objectIDValue + "BtnByPass";
                        resultItem.controlDetails.bypassBtnClass = bypassBtnClass;
                        btnBypassDiv = domConstruct.create("div", {
                            "class": "resultItemButtonSkipIcon resultItemButton",
                            "title": skipBtnTitle
                        }, btnControlDiv);
                        domClass.add(btnBypassDiv, bypassBtnClass);
                        if (process) {
                            resultCount.Count = resultCount.Count + 1;
                            resultItem.controlDetails.selectionGraphic.bypassed = false;
                        } else {
                            domClass.add(btnBypassDiv, "resultItemButtonSkipIconSelected");
                            resultCount.SkipCount = resultCount.SkipCount + 1;
                            resultItem.controlDetails.selectionGraphic.bypassed = true;
                        }
                        on(btnBypassDiv, "click", lang.hitch(this, this._onSkipedButton(resultItem)));
                    } else {
                        resultItem.controlDetails.selectionGraphic.bypassed = false;
                        resultCount.Count = resultCount.Count + 1;
                    }
                    domConstruct.create("label", {
                        "class": "resultItemLabel",
                        "for": selectedGPParam.paramName + ":" + objectIDValue + "BtnZoomDiv",
                        "innerHTML": lang.replace(selectedGPParam.displayText, resultItem.attributes)
                    }, btnControlDiv);
                    resultItem.controlDetails.selectionGraphic.resultItem = resultItem;
                    this._setResultInfoTemplate(selectedGraphic, selectedGPParam, process, skipBtnTitle, resultItem);
                }));
                domConstruct.place("<div class='resultItemClass'>" + lang.replace(selectedGPParam.summaryText, resultCount) + "</div>", this.overviewInfo.resultsPaneParent.containerNode);
                //checking whether the Title Pane is summary or not.
                if (selectedGPParam.type === "Result") {
                    domAttr.set(cp, "title", selectedGPParam.panelText + " (" + resultCount.Count + ")");
                }
            },

            _formatDateAttributes: function (selectedGPParam, resultItem) {
                var i;
                if (selectedGPParam.results && selectedGPParam.results.fields) {
                    for (i = 0; i < selectedGPParam.results.fields.length; i++) {
                        if (selectedGPParam.results.fields[i].type === "esriFieldTypeDate") {
                            try {
                                resultItem.attributes[selectedGPParam.results.fields[i].name] = resultItem.attributes[selectedGPParam.results.fields[i].name] && resultItem.attributes[selectedGPParam.results.fields[i].name] > 0 ? this._formatResultDateAttribute(resultItem.attributes[selectedGPParam.results.fields[i].name]) : "";
                            } catch (ex) {
                                console.log(ex.message);
                            }
                        }
                    }

                }
            },

            _formatResultDateAttribute: function (value) {
                var inputDate = new Date(value);
                return dateLocale.format(inputDate, {
                    selector: "date"
                });
            },

            _getResultItemObjectID: function (item) {
                for (var key in item.results.fields) {
                    if (item.results.fields.hasOwnProperty(key)) {
                        if (item.results.fields[key].type === "esriFieldTypeOID") {
                            return item.results.fields[key].name;
                        }
                    }
                }
            },
            _setResultInfoTemplate: function (item, param, process, skipBtnTitle, resultItem) {
                var infoTemplateObj, headerText, infoContent, tableDiv, btnBypassDiv, attrRow, attrKey, attrValue, attrTable, attrTableBody, attrNameCol;
                infoTemplateObj = new InfoTemplate();
                infoTemplateObj.setTitle(param.panelText);
                headerText = resultItem.attributes[param.bypassDetails.IDField] ? param.panelText + " : " + resultItem.attributes[param.bypassDetails.IDField] : param.panelText;
                infoContent = domConstruct.create("div", {
                    "class": "attrMainSection"
                });
                domConstruct.create("div", { "class": "attrHeader", "innerHTML": headerText }, infoContent);
                domConstruct.create("div", {
                    "class": "attrSeparator"
                }, infoContent);
                tableDiv = domConstruct.create("div", null, infoContent);
                //create table: attrTable
                attrTable = domConstruct.create("table", {
                    "class": "attrResultInfoTable"
                }, tableDiv);
                attrTableBody = domConstruct.create("tbody", {}, attrTable);
                for (attrKey in item.attributes) {
                    if (item.attributes.hasOwnProperty(attrKey)) {
                        attrValue = item.attributes[attrKey];
                        //Create attribute info table row
                        attrRow = domConstruct.create("tr", {}, attrTableBody);

                        //Create attribute field name column
                        attrNameCol = domConstruct.create("td", {
                            "innerHTML": attrKey,
                            "class": "attrName"
                        }, attrRow);

                        //Create attribute value
                        domConstruct.create("td", {
                            "innerHTML": attrValue,
                            "class": "attrValue"
                        }, attrRow);
                    }
                }
                if (param.bypassDetails.skipable) {
                    attrRow = domConstruct.create("tr", {}, attrTableBody);
                    attrNameCol = domConstruct.create("td", {
                        "class": "attrName",
                        "colSpan": 2
                    }, attrRow);
                    btnBypassDiv = domConstruct.create("div", {
                        "class": "resultItemButtonSkipIcon resultItemButton",
                        "title": skipBtnTitle
                    }, attrNameCol);
                    if (resultItem.controlDetails.selectionGraphic.bypassed) {
                        domClass.add(btnBypassDiv, "resultItemButtonSkipIconSelected");
                    }
                    domClass.add(btnBypassDiv, resultItem.controlDetails.bypassBtnClass);
                    on(btnBypassDiv, "click", lang.hitch(this, this._onSkipedButton(resultItem)));
                }
                infoTemplateObj.setContent(infoContent);
                item.setInfoTemplate(infoTemplateObj);
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
                        this.map.infoWindow.hide();
                    }
                    var geometry;

                    if (resultItem.controlDetails.selectionGraphic.geometry.type == "polyline") {
                        geometry = this._getLineCenter(resultItem.controlDetails.selectionGraphic.geometry);
                    } else if (resultItem.controlDetails.selectionGraphic.geometry.type == "polygon") {
                        geometry = this._getPolygonCentroid(resultItem.controlDetails.selectionGraphic.geometry);
                    } else if (resultItem.controlDetails.selectionGraphic.geometry.type == "point") {
                        geometry = resultItem.controlDetails.selectionGraphic.geometry;
                    }
                    if (geometry) {
                        this.map.centerAt(geometry);
                        this._showHighlightedFeature(geometry);
                    }
                };
            },

            _getLineCenter: function (polyline) {
                var path = polyline.paths[Math.round(polyline.paths.length / 2) - 1];
                var pointIndex = Math.round((path.length - 1) / 2) - 1;
                var startPoint = path[pointIndex];
                var endPoint = path[pointIndex + 1];
                return new Point((startPoint[0] + endPoint[0]) / 2.0, (startPoint[1] + endPoint[1]) / 2.0, polyline.spatialReference);
            },

            _getPolygonCentroid: function (polygon) {
                var ring = polygon.rings[Math.round(polygon.rings.length / 2) - 1];
                var centroid = {
                    x: 0,
                    y: 0
                }; // Array object
                for (var i = 0; i < ring.length; i++) {
                    var point = ring[i];
                    centroid.x += point[0];
                    centroid.y += point[1];
                }
                centroid.x /= ring.length;
                centroid.y /= ring.length;
                return new Point(centroid.x, centroid.y, polygon.spatialReference);
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
                var animatedSymbol, animatedRenderer, jsonObj, baseURL;
                this.timer = new Timing.Timer(this.config.highlighterDetails.timeout);
                this.animatedLayer = new GraphicsLayer();
                baseURL = location.href.slice(0, location.href.lastIndexOf('/'));
                jsonObj = {
                    "type": "esriPMS",
                    "url": string.substitute(this.config.highlighterDetails.imageData, {
                        appPath: baseURL
                    }),
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
                array.forEach(this.config.geoprocessing.outputs, function (output) {
                    //checking whether layer is null or not.
                    if (output.layer !== null) {
                        output.layer.clear();
                    }
                    //checking whether result pane is null or not.
                    if (output.type.toUpperCase() === "OVERVIEW") {
                        var tp = dijit.byId(output.paramName + "CP");
                        tp.set("content", "");
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
            },

            /**
            *This function will assign the color to the trace buttons
            *param{string} color
            *param{domNode}DOM Node
            **/
            _changeDomNodeColor: function (color, domNode) {
                style.set(domNode, "backgroundColor", color);
            },

            /**
            *This function will execute when user cliked on skiped button.
            *param{object}resultItem: Object containing information regarding the feature which going to be skiped.
            **/
            _onSkipedButton: function (resultItem) {
                return function (e) {
                    var btnList = query("." + resultItem.controlDetails.bypassBtnClass);
                    if (this.skipLayer !== null) {
                        array.forEach(btnList, lang.hitch(this, function (btnNode) {
                            domClass.toggle(btnNode, "resultItemButtonSkipIconSelected");
                        }));
                        if (resultItem.controlDetails.selectionGraphic.bypassed) {
                            this.skipLayer.remove(resultItem.controlDetails.skipGraphic);
                            resultItem.controlDetails.selectionGraphic.bypassed = false;
                        } else {
                            this.skipLayer.add(resultItem.controlDetails.skipGraphic);
                            resultItem.controlDetails.selectionGraphic.bypassed = true;
                        }
                    }
                };
            },

            /**
            *This function will popup jimu popup with error message
            *param {string}err: string containing error message
            **/
            _errorMessage: function (err) {
                var errorMessage = new JimuMessage({
                    message: err
                });
                errorMessage.message = err;
            }
        });
    });