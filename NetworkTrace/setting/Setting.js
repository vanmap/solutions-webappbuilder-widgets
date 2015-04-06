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
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
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
    "jimu/dijit/LoadingIndicator",
    "dojox/fx/scroll",
    "dijit/registry",
    "dojo/dom-style",
    "./inputSetting",
    "./outputSetting",
    "./othersSetting",
    "./outageSetting"
], function (
    declare,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
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
    LoadingIndicator,
    scroll,
    registry,
    domStyle,
    InputSetting,
    OutputSetting,
    OthersSetting,
    OutageSetting
) {
    return declare([BaseWidgetSetting, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        baseClass: 'jimu-widget-IsolationTrace-setting',
        url: null,
        config: {},
        gpServiceTasks: null,
        inputParametersArray: [],
        outputParametersArray: [],
        validConfig: false,

        startup: function () {
            this.inherited(arguments);
        },

        postCreate: function () {
            var popupButton, j;
            // validating the fetching the request data
            setTimeout(lang.hitch(this, function () {
                if (this.config && this.config.geoprocessing && this.config.geoprocessing.url) {
                    this.txtURL.set('value', this.config.geoprocessing.url);
                    this._onInputValueChange();
                    this._onValidate();
                }
            }), 200);

            popupButton = query(".jimu-popup-btn");
            // if jimu-popup-btn found in config popup
            if (popupButton && popupButton.length > 0) {
                // loop to hidding all the buttons with this class name
                for (j = 0; j < popupButton.length; j++) {
                    domStyle.set(popupButton[j], "display", "none");
                }
            }

            // paste event on text url
            on(this.txtURL, "paste", lang.hitch(this, function () {
                this._onInputValueChange();
            }));
            // key up event setting on text url
            on(this.txtURL, "keyup", lang.hitch(this, function () {
                this._onInputValueChange();
            }));
            this._initLoading();
        },

        /**
        * function  enables or disables set button on textbox input.
        * @memberOf widgets/isolation-trace/settings/settings.js
        */
        _onInputValueChange: function () {
            var getUrl, validateURLNode, i, j, disabledValidateURLNode, popupButton;
            getUrl = this.txtURL.get('value');
            validateURLNode = dom.byId('validateUrl');
            disabledValidateURLNode = dom.byId('disableValidateUrl');
            popupButton = query(".jimu-popup-btn");

            // if input value is not null then disables otherwise enables.
            if (getUrl !== null && getUrl !== "") {
                // if validate URL node exist then only
                if (validateURLNode) {
                    domClass.remove(validateURLNode, "esriCTHidden");
                    domClass.add(disabledValidateURLNode, "esriCTHidden");
                    // popup ok and cancel button found
                    if (popupButton && popupButton.length > 0) {
                        // loop for traversing all the ok and cancel button in popup
                        for (i = 0; i < popupButton.length; i++) {
                            //  disable type ok and cancel button
                            if (domClass.contains(popupButton[i], "jimu-state-disabled")) {
                                domStyle.set(popupButton[i], "display", "block");
                            } else {
                                domStyle.set(popupButton[i], "display", "none");
                            }
                        }
                    }
                }
            } else {
                // if validate URL node exist then only
                if (validateURLNode) {
                    domClass.add(validateURLNode, "esriCTHidden");
                    domClass.remove(disabledValidateURLNode, "esriCTHidden");
                    // popup ok and cancel button found
                    if (popupButton && popupButton.length > 0) {
                        // loop for traversing all the ok and cancel button in popup
                        for (j = 0; j < popupButton.length; j++) {
                            domStyle.set(popupButton[j], "display", "none");
                        }
                    }
                    domConstruct.empty(this.taskData);
                    this._destroyWidget(this.inputProperty);
                    this._destroyWidget(this.outputAdditionalProperty);
                    domConstruct.empty(this.othersData);
                    domClass.add(this.taskDataContainer, "esriCTHidden");
                }
            }
        },

        /**
        * This function will execute when user clicked on the "Set Task."
        * @memberOf widgets/isolation-trace/settings/settings.js
        */
        _onValidate: function () {
            this.gpServiceTasks = [];
            var requestArgs, gpTaskParameters = [], isURLcorrect;
            this.loading.show();
            this._destroyWidget(this.inputProperty);
            this._destroyWidget(this.outputAdditionalProperty);
            isURLcorrect = this._urlValidator(this.txtURL.value);
            // if configuration is already set
            if (this.config && this.config.geoprocessing && this.config.geoprocessing.url) {
                // if previously set gp service is same as new requested then refresh the ta
                if (this.txtURL.value === this.config.geoprocessing.url) {
                    this._refreshConfigContainer();
                } else {
                    this.config = {};
                }
            }
            if (this.map && this.map.itemInfo && this.map.itemInfo.itemData && this.map.itemInfo.itemData.operationalLayers && (this.map.itemInfo.itemData.operationalLayers.length > 0)) {
                // if the task URL is valid
                if (isURLcorrect) {
                    this.url = this.txtURL.value;
                    requestArgs = {
                        url: this.url,
                        content: {
                            f: "json"
                        },
                        handleAs: "json",
                        callbackParamName: "callback",
                        timeout: 20000
                    };
                    esriRequest(requestArgs).then(lang.hitch(this, function (response) {
                        // if response returned from the queried request
                        if (response.hasOwnProperty("name")) {
                            // if name value exist in response object
                            if (response.name !== null) {
                                gpTaskParameters = response.parameters;
                                // if gpTaskParameters array is not null
                                if (gpTaskParameters) {
                                    this._validateGpTaskResponseParameters(gpTaskParameters);
                                }
                            }
                        } else {
                            this._refreshConfigContainer();
                            this.loading.hide();
                            this._errorMessage(this.nls.invalidURL);
                        }
                    }), lang.hitch(this, function (err) {
                        this._refreshConfigContainer();
                        this.loading.hide();
                        this._errorMessage(this.nls.invalidURL);
                    }));

                } else {
                    this._refreshConfigContainer();
                    this.loading.hide();
                    this._errorMessage(this.nls.inValidGPService);
                }
            } else {
                this.loading.hide();
                this._errorMessage(this.nls.validationErrorMessage.webMapError);
            }

        },

        /**
        * This function Validates the gp task response parameters
        * @param{object} gpTaskParameters gp service response object
        * @memberOf widgets/isolation-trace/settings/settings.js
        */
        _validateGpTaskResponseParameters: function (gpTaskParameters) {
            var i, j, recordSetValCheckFlag = true, inputParametersArr = [], inputGPParamFlag = true, errMsg, popupButton;
            // loop for checking gptask type is GPFeatureRecordSetLayer or not
            for (i = 0; i < gpTaskParameters.length; i++) {
                // if gp task is not GPFeatureRecordSetLayer then flag to false
                if (gpTaskParameters[i].dataType !== "GPFeatureRecordSetLayer") {
                    recordSetValCheckFlag = false;
                }
                // if gp task parameter type is of input type
                if (gpTaskParameters[i].direction === "esriGPParameterDirectionInput") {
                    inputParametersArr.push(gpTaskParameters[i]);
                }
            }
            // if number of input parameters is less than 1 or greater than 3 then set flag to false
            if (inputParametersArr.length < 1 || inputParametersArr.length > 3) {
                inputGPParamFlag = false;
            }
            // if all the gp task is having type "GPFeatureRecordSetLayer"
            if (recordSetValCheckFlag && inputGPParamFlag) {
                this.validConfig = true;
                popupButton = query(".jimu-popup-btn");
                // popup ok and cancel button found
                if (popupButton && popupButton.length > 0) {
                    // loop for traversing all the ok and cancel button in popup
                    for (j = 0; j < popupButton.length; j++) {
                        // not disable type ok and cancel button
                        if (domClass.contains(popupButton[j], "jimu-state-disabled")) {
                            domStyle.set(popupButton[j], "display", "none");
                        } else {
                            domStyle.set(popupButton[j], "display", "block");
                        }
                    }
                }
                this._showTaskDetails(gpTaskParameters);
                // if config is already exist
                if (this.config && this.config.geoprocessing && this.config.geoprocessing.url) {
                    this.setConfig();
                }
                this.loading.hide();
            } else {
                this._refreshConfigContainer();
                this.loading.hide();
                // if the gp task does not having type "GPFeatureRecordSetLayer"
                if (!recordSetValCheckFlag) {
                    errMsg = this.nls.GPFeatureRecordSetLayerERR;
                } else if (!inputGPParamFlag) {
                    // if number of input parameters is less than 1 or greater than 3 then show error message
                    errMsg = this.nls.invalidInputParameters;
                } else if (!recordSetValCheckFlag && !inputGPParamFlag) {
                    // if the gp task does not having type "GPFeatureRecordSetLayer" neither input parameters is less than 0 and greater than 3 then
                    errMsg = this.nls.inValidGPService;
                }
                this._errorMessage(errMsg);
            }
        },

        /**
        * This function used for refresh the task container every time new request executed
        * @memberOf widgets/isolation-trace/settings/settings.js
        */
        _refreshConfigContainer: function () {
            domConstruct.empty(this.taskData);
            domConstruct.empty(this.inputProperty);
            domConstruct.empty(this.outputAdditionalProperty);
            domConstruct.empty(this.othersData);
            domClass.add(this.taskDataContainer, "esriCTHidden");
        },

        /**
        * This function used for loading indicator
        * @memberOf widgets/isolation-trace/settings/settings.js
        */
        _initLoading: function () {
            this.loading = new LoadingIndicator({
                hidden: true
            });
            this.loading.placeAt(this.domNode);
            this.loading.startup();
        },

        /**
        * This function brings focus of tab content on top
        * @memberOf widgets/isolation-trace/settings/settings.js
        */
        _focusTop: function () {
            dojox.fx.smoothScroll({
                node: query('#taskDataContainerId :first-child')[0],
                win: dom.byId('taskDataContainerId')
            }).play();
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

        /**
        * This function is called to show task details.
        * @param{array} gpTaskParameters
        * @memberOf widgets/isolation-trace/settings/settings.js
        */
        _showTaskDetails: function (gpTaskParameters) {
            var i;
            domConstruct.empty(this.taskData);
            domClass.remove(this.taskDataContainer, "esriCTHidden");
            // if geo-processing input/output parameters exist
            if (gpTaskParameters) {
                this.inputParametersArray = [];
                this.outputParametersArray = [];
                // loop for creating input and output parameters array
                for (i = 0; i < gpTaskParameters.length; i++) {
                    if (gpTaskParameters[i].direction === "esriGPParameterDirectionInput") {
                        this.inputParametersArray.push(gpTaskParameters[i]);
                    } else if (gpTaskParameters[i].direction === "esriGPParameterDirectionOutput") {
                        this.outputParametersArray.push(gpTaskParameters[i]);
                    }
                }
            }

            // if output parameter array is not null
            if (this.outputParametersArray && this.outputParametersArray.length > 0) {
                this._sortOutputParam();
            }

            // output parameters array is greater than zero
            if (this.inputParametersArray && this.inputParametersArray.length > 0) {
                // creates the input task parameters panel
                this._createInputTaskParameters();
            }
            // output parameters array is greater than zero
            if (this.outputParametersArray && this.outputParametersArray.length > 0) {
                // creates the output task parameters panel
                this._createOutputTaskParameters();
                //Outage task.
                this._createOutageTaskParameters();
            }
            // creates the Others task parameters panel
            this._createOthersTaskParameters();
        },

        /**
        * This function is called Sort the output parameters in polygon, polyline and point type sequence respectively
        * @memberOf widgets/isolation-trace/settings/settings.js
        */
        _sortOutputParam: function () {
            var i, j;
            this.tempOutputParameters = [];
            if (this.config && this.config.geoprocessing && this.config.geoprocessing.outputs && this.config.geoprocessing.outputs.length > 0) {
                for (i = 0; i < this.outputParametersArray.length; i++) {
                    for (j = 0; j < this.config.geoprocessing.outputs.length; j++) {
                        if (this.outputParametersArray[i].name === this.config.geoprocessing.outputs[j].paramName) {
                            this.tempOutputParameters.push(this.config.geoprocessing.outputs[j]);
                        }
                    }
                }
                this.config.geoprocessing.outputs = [];
                this.config.geoprocessing.outputs = this.tempOutputParameters;
            }
        },

        /**
        * This function is called set the outage by pass variable which comes from output task.
        * @memberOf widgets/isolation-trace/settings/settings.js
        */
        _setOutageByPass: function () {
            var isChecked, outputParam, outageLayerName;
            // loop for outage setting bypass value from output parameters
            array.forEach(this.outputSettingArray, lang.hitch(this, function (widgetNode) {
                if (widgetNode) {
                    outputParam = widgetNode.getOutputForm();
                    // if save to layer is not null
                    if (outputParam.saveToLayer !== "") {
                        outageLayerName = widgetNode.outputLayerType.value;
                        this.outageSettingObj.outageLayerName = outputParam.saveToLayer;
                        isChecked = widgetNode.outputLayer.checked;
                        var displayName = domAttr.get(widgetNode.domNode, "displayName");
                        // if the affected area is found for the output parameters and save to layer is checked and the target layer value is not null
                        if (displayName && this.outageSettingObj.outageAreaDropDown && this.outageSettingObj.outageAreaDropDown.value === displayName && isChecked) {
                            this.outageSettingObj.outageAreaLayerSaveOption = isChecked;
                            this.outageSettingObj.showFieldMapDiv(outageLayerName);
                        }
                    }
                }
            }));
        },

        /**
        * This function creates input task parameters panel and data container
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _createInputTaskParameters: function () {
            var inputTP, inputTitlepaneDiv, j, inputContainer, param, inputSettingInstance, inputConfig;
            inputTitlepaneDiv = domConstruct.create("div", {
                "id": "esriCTInputHolder",
                "class": "esriCTInputTitlepaneHolder"
            }, this.taskData);
            inputContainer = domConstruct.create("div", {
                "class": "inputContainer"
            });
            // if input parameters array length is greater than zero
            if (this.inputParametersArray.length >= 0) {
                inputTP = new TitlePane({
                    title: this.nls.inputPanel.inputTask,
                    open: true,
                    content: inputContainer
                });
                this.inputSettingArray = [];
                // loop for populating input data in input fields and also creating additional input fields dynamically
                for (j = 0; j < this.inputParametersArray.length; j++) {
                    // if input parameterType is required field then reflect Required as a true otherwise false
                    if (this.inputParametersArray[j].parameterType === "esriGPParameterTypeRequired") {
                        this.inputParametersArray[j].isInputRequired = "True";
                    } else {
                        this.inputParametersArray[j].isInputRequired = "False";
                    }

                    inputConfig = null;
                    // if config object is not null
                    if (this.config && this.config.geoprocessing && this.config.geoprocessing.inputs[j]) {
                        inputConfig = this.config.geoprocessing.inputs[j];
                    }
                    param = {
                        "nls": this.nls,
                        "data": this.inputParametersArray[j],
                        "ObjId": "selectInput_" + j,
                        "inputConfig": inputConfig,
                        "parentContainer": inputContainer,
                        "id": "ParameterDiv_" + j + "_" + this.inputParametersArray[j].displayName
                    };
                    // selectInput id already wxist then destroy it
                    if (dijit.byId("selectInput_" + j)) {
                        dijit.byId("selectInput_" + j).destroy();
                    }
                    inputSettingInstance = new InputSetting(param, domConstruct.create("div", {}, this.inputProperty));
                    this.inputSettingArray.push(inputSettingInstance);
                    // if counter is at one for displaying first value selected by default
                    if (j === 0) {
                        domClass.add(inputSettingInstance.inputDataNode, "esriCTSelected");
                        domClass.remove(inputSettingInstance.domNode, "esriCTHidden");
                        domClass.remove(this.inputProperty, "esriCTHidden");
                        domClass.remove(this.esriCTInputOutputParameters, "esriCTHidden");
                        domClass.add(this.othersData, "esriCTHidden");
                        domClass.add(this.outageData, "esriCTHidden");
                        domClass.add(this.outputAdditionalProperty, "esriCTHidden");
                    }
                    this._inputTaskClicked(inputSettingInstance);
                    this._onInputTypeChange(inputSettingInstance);

                }
                // if title pane is created then append complete dom HTML
                if (inputTP) {
                    inputTitlepaneDiv.appendChild(inputTP.domNode);
                }
            }
        },

        _inputTaskClicked: function (inputSettingInstance) {
            var selectedItems, m;
            inputSettingInstance.inputFieldClicked = lang.hitch(this, function (widgetNode) {
                selectedItems = query(".esriCTSelected", this.taskData);
                // if selectedItems node is not null
                if (selectedItems) {
                    // loop for deselecting the all the left menu panel
                    for (m = 0; m < selectedItems.length; m++) {
                        domClass.remove(selectedItems[m], 'esriCTSelected');
                    }
                }
                // loop for selecting the clicked left menu and deselecting rest of the all
                array.forEach(this.inputSettingArray, function (node) {
                    domClass.add(node.domNode, "esriCTHidden");
                    domClass.remove(node.inputDataNode, "esriCTSelected");
                });
                domClass.remove(widgetNode.domNode, "esriCTHidden");
                domClass.add(widgetNode.inputDataNode, "esriCTSelected");
                domClass.remove(this.esriCTInputOutputParameters, "esriCTHidden");
                domClass.add(this.othersData, "esriCTHidden");
                domClass.add(this.outageData, "esriCTHidden");
                domClass.add(this.outputAdditionalProperty, "esriCTHidden");
                domClass.remove(this.inputProperty, "esriCTHidden");
                this._focusTop();
            });
        },

        _onInputTypeChange: function (inputSettingInstance) {
            var skipFlag = false;
            inputSettingInstance.inputTypeChange = lang.hitch(this, function (inputNode) {
                var k, key;
                // loop of all the input array, which checks if input type of parameter containing Skip or not
                for (k in this.inputSettingArray) {
                    if (this.inputSettingArray.hasOwnProperty(k)) {
                        skipFlag = false;
                        // if input type is "Skip" then only
                        if (this.inputSettingArray[k].inputTypeData && this.inputSettingArray[k].inputTypeData.value === "Skip") {
                            // loop to show and hide skippable checkbox for all output parameters except outage type
                            for (key in this.outputSettingArray) {
                                if (this.outputSettingArray.hasOwnProperty(key)) {
                                    if (this.outputSettingArray[key]) {
                                        // if the output parameters type is esriGeometryPoint then only
                                        if (this.outputSettingArray[key].data && this.outputSettingArray[key].data.defaultValue && this.outputSettingArray[key].data.defaultValue.geometryType === "esriGeometryPoint") {
                                            domClass.remove(this.outputSettingArray[key].skippableCheckboxBlock, "esriCTHidden");
                                        }
                                        // if the output parameter skippable value is already checked
                                        if (this.outputSettingArray[key].skippable.checked) {
                                            domClass.remove(this.outputSettingArray[key].skippableDropdownDiv, "esriCTHidden");
                                        } else {
                                            domClass.add(this.outputSettingArray[key].skippableDropdownDiv, "esriCTHidden");
                                        }
                                    }
                                }
                            }
                            skipFlag = true;
                        } else {
                            // loop to hide and hide skippable checkbox for all output parameters except outage type
                            for (key in this.outputSettingArray) {
                                if (this.outputSettingArray.hasOwnProperty(key)) {
                                    /*if (this.outputSettingArray[key].skippable.checked) {
                                    domClass.remove(this.outputSettingArray[key].skippable.checkNode, "checked");
                                    this.outputSettingArray[key].skippable.checked = false;
                                    }*/
                                    domClass.add(this.outputSettingArray[key].skippableCheckboxBlock, "esriCTHidden");
                                    domClass.add(this.outputSettingArray[key].skippableDropdownDiv, "esriCTHidden");
                                }
                            }
                        }
                        if (skipFlag) {
                            break;
                        }
                    }
                }
            });
        },

        /**
        * This function creates output task panel and data container
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _createOutputTaskParameters: function () {
            var k, outputTitlepaneDiv, outputContainer, outputTP, param, outputConfig, selectedItems, m;
            outputTitlepaneDiv = domConstruct.create("div", {
                "id": "esriCTOutputHolder",
                "class": "esriCTOutputTitlepaneHolder"
            }, this.taskData);
            outputContainer = domConstruct.create("div", {
                "class": "outputContainer"
            });
            // if output parameters array length is greater than zero
            if (this.outputParametersArray.length >= 0) {
                outputTP = new TitlePane({
                    title: this.nls.outputPanel.outputTask,
                    open: false,
                    content: outputContainer
                });
                this.outputSettingArray = [];
                // loop for populating output data in output fields and also creating additional output fields dynamically
                for (k = 0; k < this.outputParametersArray.length; k++) {
                    // if input parameterType is required field then reflect Required as a true otherwise false
                    if (this.outputParametersArray[k].parameterType === "esriGPParameterTypeRequired") {
                        this.outputParametersArray[k].isOutputRequired = "True";
                    } else {
                        this.outputParametersArray[k].isOutputRequired = "False";
                    }

                    outputConfig = null;
                    // if config object is not null
                    if (this.config && this.config.geoprocessing && this.config.geoprocessing.outputs[k]) {
                        outputConfig = this.config.geoprocessing.outputs[k];
                    }
                    param = {
                        "nls": this.nls,
                        "data": this.outputParametersArray[k],
                        "ObjId": "selectOutput_" + k,
                        "map": this.map,
                        "outputConfig": outputConfig,
                        "parentContainer": outputContainer,
                        "id": "ParameterDiv_" + k + "_" + this.outputParametersArray[k].name
                    };
                    if (dijit.byId("selectOutput_" + k)) {
                        dijit.byId("selectOutput_" + k).destroy();
                    }
                    this.outputSettingInstance = new OutputSetting(param, domConstruct.create("div", {}, this.outputAdditionalProperty));
                    domAttr.set(this.outputSettingInstance.domNode, "displayName", this.outputParametersArray[k].name);
                    this.outputSettingArray.push(this.outputSettingInstance);

                    this.outputSettingInstance.outputFieldClicked = lang.hitch(this, function (widgetNode) {
                        selectedItems = query(".esriCTSelected", this.taskData);
                        // loop for selecting the clicked outage and deselecting rest of the all
                        for (m = 0; m < selectedItems.length; m++) {
                            domClass.remove(selectedItems[m], 'esriCTSelected');
                        }
                        array.forEach(this.outputSettingArray, function (node) {
                            domClass.add(node.domNode, "esriCTHidden");
                            domClass.remove(node.outputDataNode, "esriCTSelected");
                        });
                        // loop of all the input array, which checks if input type of parameter containing Skip or not
                        array.forEach(this.inputSettingArray, function (inputNode) {
                            if (inputNode && inputNode.inputConfig && inputNode.inputConfig.type && inputNode.inputConfig.type === "Skip" && widgetNode && widgetNode.data && widgetNode.data.defaultValue && widgetNode.data.defaultValue.geometryType === "esriGeometryPoint") {
                                domClass.remove(widgetNode.skippableCheckboxBlock, "esriCTHidden");
                                // if the output parameter skippable value is already checked
                                if (widgetNode.skippable.checked) {
                                    domClass.remove(widgetNode.skippableDropdownDiv, "esriCTHidden");
                                } else {
                                    domClass.add(widgetNode.skippableDropdownDiv, "esriCTHidden");
                                }
                            }
                            /*else{
                            domClass.add(widgetNode.skippableCheckboxBlock, "esriCTHidden");
                            domClass.add(widgetNode.skippableDropdownDiv, "esriCTHidden");
                            }*/
                        });
                        domClass.remove(widgetNode.domNode, "esriCTHidden");
                        domClass.add(widgetNode.outputDataNode, "esriCTSelected");
                        domClass.remove(this.esriCTInputOutputParameters, "esriCTHidden");
                        domClass.add(this.othersData, "esriCTHidden");
                        domClass.add(this.outageData, "esriCTHidden");
                        domClass.add(this.inputProperty, "esriCTHidden");
                        domClass.remove(this.outputAdditionalProperty, "esriCTHidden");
                        this._focusTop();
                    });
                    // for handling the check and uncheck event of save to layer checkbox
                    this.outputSettingInstance.layerChangeHandler = lang.hitch(this, function (event) {
                        //outageLayerName = event.outputLayerType.value;
                        // if target layer name drop down is not null
                        /*if (outageLayerName) {
                        //this.outageSettingObj.showFieldMapDiv(outageLayerName);
                        } */
                        this._setOutageByPass();
                    });
                    // for handling the target layer name from dropdown on change event of save to layer
                    this.outputSettingInstance.layerChangeHandler = lang.hitch(this, function (evt) {
                        //outageLayerName = evt.outputLayerType.value;
                        // if target layer name drop down is not null
                        /*if (outageLayerName) {
                        this.outageSettingObj.showFieldMapDiv(outageLayerName);
                        }*/
                        this._setOutageByPass();
                    });
                    // if title pane is created then append complete Dom HTML
                    if (outputTP) {
                        outputTitlepaneDiv.appendChild(outputTP.domNode);
                    }
                }
            }
        },

        /**
        * This function creates outage task parameters panel and data container
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _createOutageTaskParameters: function () {
            var selectedItems, param, outageConfig, m;
            // if counter is at one for displaying first value selected by default
            outageConfig = null;
            // config value is not null
            if (this.config && this.config.geoprocessing && this.config.geoprocessing.outputs) {
                outageConfig = this.config.geoprocessing.outputs;
            }
            param = {
                "nls": this.nls,
                "map": this.map,
                "data": this.outputParametersArray,
                "outageConfig": outageConfig,
                "outageData": this.outageData
            };
            this.outageSettingObj = new OutageSetting(param, domConstruct.create("div", {}, this.taskData));
            this.outageSettingObj.outageFieldClicked = lang.hitch(this, function (widgetNode) {
                selectedItems = query(".esriCTSelected", this.taskData);
                // loop for selecting the clicked others and deselecting rest of the all
                for (m = 0; m < selectedItems.length; m++) {
                    domClass.remove(selectedItems[m], 'esriCTSelected');
                }
                domClass.add(widgetNode.outageDiv, "esriCTSelected");
                domClass.add(this.esriCTInputOutputParameters, "esriCTHidden");
                domClass.remove(this.taskDataContainer, "esriCTHidden");
                domClass.add(this.othersData, "esriCTHidden");
                domClass.remove(this.outageData, "esriCTHidden");
                //this._setOutageByPass();
            });
            this.outageSettingObj.outageParamChanged = lang.hitch(this, function (evt) {
                this._disableOutageOutputPanel();
            });
            this.outageSettingObj.displayOutageData(false);
            this._setOutageByPass();
            this._disableOutageOutputPanel();
        },

        _disableOutageOutputPanel: function () {
            var hideOutputDiv, i;
            // if outage panel created
            if (this.outageSettingObj) {
                // loop for  traversing all the output container and searches for outage area
                array.forEach(this.outputSettingArray, lang.hitch(this, function (widgetNode) {
                    // if dom node found
                    if (widgetNode && widgetNode.domNode) {
                        var displayName = domAttr.get(widgetNode.domNode, "displayName");
                        // if outage area drop down is not null and the this particular container belongs to the outage area
                        if (displayName && this.outageSettingObj.outageAreaDropDown && this.outageSettingObj.outageAreaDropDown.value === displayName) {
                            hideOutputDiv = query(".esriCTOutputOutageField", widgetNode.domNode);
                            if (hideOutputDiv && hideOutputDiv.length > 0) {
                                // loop for traversing all the div block with class name esriCTOutputOutageField
                                for (i = 0; i < hideOutputDiv.length; i++) {
                                    domClass.add(hideOutputDiv[i], 'esriCTHidden');
                                }
                            }
                        } else {
                            if (widgetNode.domNode) {
                                hideOutputDiv = query(".esriCTOutputOutageField", widgetNode.domNode);
                                //showOutputDiv = query(".esriCTHidden", hideOutputDiv);
                                if (hideOutputDiv && hideOutputDiv.length > 0) {
                                    // loop for traversing all the div block with class name esriCTOutputOutageField
                                    for (i = 0; i < hideOutputDiv.length; i++) {
                                        domClass.remove(hideOutputDiv[i], 'esriCTHidden');
                                    }
                                }
                            }
                        }
                    }
                }));
            }
        },

        /**
        * This function creates output task parameters panel and data container
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _createOthersTaskParameters: function () {
            var m, othersConfig, othersSettingInstance, OthersHolderDiv, selectedItems, param;
            OthersHolderDiv = domConstruct.create("div", {
                "id": "esriCTOtherHolder",
                "class": "esriCTOtherHolder",
                "innerHTML": this.nls.others
            }, this.taskData);
            on(OthersHolderDiv, "click", lang.hitch(this, function (evt) {
                selectedItems = query(".esriCTSelected", this.taskData);
                // loop for selecting the clicked others and deselecting rest of the all
                for (m = 0; m < selectedItems.length; m++) {
                    domClass.remove(selectedItems[m], 'esriCTSelected');
                }
                domClass.add(evt.target.id, "esriCTSelected");
                domClass.add(this.esriCTInputOutputParameters, "esriCTHidden");
                domClass.remove(this.taskDataContainer, "esriCTHidden");
                domClass.add(this.outageData, "esriCTHidden");
                domClass.remove(this.othersData, "esriCTHidden");
            }));
            this.othersSettingObj = [];
            domConstruct.empty(this.othersData);
            othersConfig = null;
            if (this.config && this.config.highlighterDetails) {
                othersConfig = this.config.highlighterDetails;
            }
            param = {
                "nls": this.nls,
                "folderUrl": this.folderUrl,
                "othersConfig": othersConfig
            };
            othersSettingInstance = new OthersSetting(param, domConstruct.create("div", {}, this.othersData));
            this.othersSettingObj.push(othersSettingInstance);
        },

        /**
        * This function creates skippables fields
        * @return {object} returns the url validator object
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _urlValidator: function (value) {
            var strReg, regexValue, regexValueForTest, regexValueForService, finalValue;
            // Checking for regex expression for url validation
            strReg = '^' + regexp.url({
                allowNamed: true,
                allLocal: false
            });
            // Checking for regex value
            regexValue = new RegExp(strReg, 'g');
            regexValueForTest = regexValue.test(value);
            regexValueForService = /\/rest\/services/gi;
            finalValue = regexValueForService.test(value);
            return regexValueForTest && finalValue;
        },



        /**
        * This function creates the Input Parameters in config
        * @return {object} returns the config ouject
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _getInputConfigParameters: function (config) {
            var inputParam = {};
            this.config.geoprocessing.inputs = [];
            this.config.geoprocessing.inputs.length = 0;
            // setting url in geoprocessing array
            this.config.geoprocessing.url = this.url;
            // if input param object created
            if (this.inputSettingArray) {
                array.forEach(this.inputSettingArray, lang.hitch(this, function (widgetNode) {
                    if (widgetNode) {
                        inputParam = widgetNode.getInputForm();
                        this.config.geoprocessing.inputs.push(inputParam);
                    }
                }));
            }
            // logging config geo processing data
            return this.config.geoprocessing;
        },

        /**
        * This function creates the output Parameters in config file
        * return {object} returns the config object
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _getOutputConfigParameters: function () {
            var outageLayerName, outputParam = {}, domDisplayName, cloneFieldMapArray, isOverViewMap, saveToLayerCheckBox, saveToLayerCheckBoxStatus, fieldMapArray = [], i, j, k, l, m;
            this.polygonOutputParameters = [];
            this.polylineOutputParameters = [];
            this.pointOutputParameters = [];
            if (this.config && this.config.geoprocessing && this.config.geoprocessing.outputs) {
                this.config.geoprocessing.outputs = [];

                // if input param object created
                if (this.outputSettingArray) {
                    array.forEach(this.outputSettingArray, lang.hitch(this, function (widgetNode) {
                        domDisplayName = "";
                        saveToLayerCheckBox = false;
                        isOverViewMap = false;
                        if (widgetNode) {

                            outputParam = widgetNode.getOutputForm();
                            //this.config.geoprocessing.outputs.push(outputParam);
                            //////////////////////////////
                            domDisplayName = domAttr.get(widgetNode.domNode, "displayName");
                            //  saveToLayerCheckBox = widgetNode.outputLayer.checked;
                            outageLayerName = outputParam.saveToLayer;
                            //this.outageSettingObj.showFieldMapDiv(outageLayerName);
                            saveToLayerCheckBoxStatus = widgetNode.outputLayer.checked ? outageLayerName : "";
                            //isChecked = widgetNode.outputLayer.checked;
                            // Checking for outage area drop down value with outage selected container selected value
                            if (this.outageSettingObj.outageAreaDropDown.value === domDisplayName) {
                                isOverViewMap = true;
                            }
                            // Checking for outage area drop down value and save to layer chedk box checked status
                            if (saveToLayerCheckBoxStatus && this.outageSettingObj.outageAreaDropDown.value === domDisplayName) {
                                saveToLayerCheckBox = true;
                            }
                            if (isOverViewMap) {
                                outputParam.type = "Overview";
                                outputParam.visible = this.outageSettingObj.visibleCheckBox.checked ? true : false;
                            } else {
                                outputParam.type = "Result";
                            }
                            // Checking for field map value is enabled if enabled then set field to map attribute and set visible to true
                            if (saveToLayerCheckBox) {
                                cloneFieldMapArray = "";
                                // Getting the field map array value from all drop down value
                                fieldMapArray = this.outageSettingObj.getOutageConfig();
                                // Cloning the feld map array for storing it in field to map value
                                cloneFieldMapArray = lang.clone(fieldMapArray);
                                // Creating field to map object and inserting value
                                outputParam.fieldMap = cloneFieldMapArray;
                            }
                            /////////////////////////////////////
                            // Pushing value in geoprocessing output parameter
                            this.config.geoprocessing.outputs.push(outputParam);
                        }
                    }));
                }
                // if config object is not null and output parameter length is greater than zero
                if (this.config && this.config.geoprocessing && this.config.geoprocessing.outputs && this.config.geoprocessing.outputs.length > 0) {
                    // loop for traverse output array and pushing all the output object in three different array's by there geometry
                    for (i = 0; i < this.config.geoprocessing.outputs.length; i++) {
                        // the output array parameter same as config output parameter
                        if (this.outputParametersArray[i].parameter === this.config.geoprocessing.outputs[i].param) {
                            // if the output type is esriGeometryPolygon or esriGeometryPolyline or esriGeometryPoint
                            if (this.outputParametersArray[i].defaultValue.geometryType === "esriGeometryPolygon") {
                                this.polygonOutputParameters.push(this.config.geoprocessing.outputs[i]);
                            } else if (this.outputParametersArray[i].defaultValue.geometryType === "esriGeometryPolyline") {
                                this.polylineOutputParameters.push(this.config.geoprocessing.outputs[i]);
                            } else if (this.outputParametersArray[i].defaultValue.geometryType === "esriGeometryPoint") {
                                this.pointOutputParameters.push(this.config.geoprocessing.outputs[i]);
                            }
                        }
                    }

                    this.config.geoprocessing.outputs = [];
                    this.tempPolygonOutputParameters = [];
                    // if polygon type parameter array is not null
                    if (this.polygonOutputParameters && this.polygonOutputParameters.length > 0) {
                        for (m = 0; m < this.polygonOutputParameters.length; m++) {
                            if (this.polygonOutputParameters[m].type === "Overview") {
                                this.tempPolygonOutputParameters.push(this.polygonOutputParameters[m]);
                            }
                        }
                        for (j = 0; j < this.polygonOutputParameters.length; j++) {
                            if (j === 0) {
                                this.config.geoprocessing.outputs.push(this.tempPolygonOutputParameters[j]);
                            } else {
                                this.config.geoprocessing.outputs.push(this.polygonOutputParameters[j]);
                            }
                        }
                    }
                    // if polyline type parameter array is not null
                    if (this.polylineOutputParameters && this.polylineOutputParameters.length > 0) {
                        for (k = 0; k < this.polylineOutputParameters.length; k++) {
                            this.config.geoprocessing.outputs.push(this.polylineOutputParameters[k]);
                        }
                    }
                    // if point type parameter array is not null
                    if (this.pointOutputParameters && this.pointOutputParameters.length > 0) {
                        for (l = 0; l < this.pointOutputParameters.length; l++) {
                            this.config.geoprocessing.outputs.push(this.pointOutputParameters[l]);
                        }
                    }
                }
                console.log(this.config.geoprocessing.outputs);
                // Returning geoprocessing data to config file
                return this.config.geoprocessing;
            }
        },

        /**
        * This function creates the other  parameters in config file
        * @return {object} returns highlighter details object
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _getOtherConfigParameters: function () {
            var othersParam;
            // if Others setting Obj is created
            if (this.othersSettingObj) {
                array.forEach(this.othersSettingObj, lang.hitch(this, function (widgetNode) {
                    //if widget obj found for Others config details for highlighter image
                    if (widgetNode) {
                        othersParam = widgetNode.getOthersForm();
                        this.config.highlighterDetails = othersParam;
                    }
                }));
            }
            return this.config.highlighterDetails;
        },

        /**
        * This function gets and create config data in config file.
        * @return {object} Object of config
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        getConfig: function () {
            var highlighterDetails = {}, inputArray = [], outputArray = [], geoprocessingObject = {}, validateInputTask = false, validateOutputTask = false, validateOutageTask = false, validateOthersTask = false;
            // Setting object for highlighted details
            highlighterDetails = { "imageData": "", "height": "", "width": "", "timeout": "" };
            // Setting geoprocessing object
            geoprocessingObject = { "url": "", "inputs": inputArray, "outputs": outputArray };
            // if the requested gp task is valid then only
            if (this.validConfig) {
                // Setting config object
                validateInputTask = this._validateInputTaskParameters();
                validateOutputTask = this._validateOutputTaskParameters();
                validateOutageTask = this._validateOutageTaskParameters();
                validateOthersTask = this._validateOthersTaskParameters();
                // validateInputTask is set to true, ie. validation error found then
                if (validateInputTask.returnFlag) {
                    this._errorMessage(validateInputTask.returnErr);
                    validateInputTask = false;
                } else if (validateOutputTask.returnFlag) {
                    this._errorMessage(validateOutputTask.returnErr);
                    validateInputTask = false;
                } else if (validateOutageTask.returnFlag) {
                    this._errorMessage(validateOutageTask.returnErr);
                    validateInputTask = false;
                } else if (validateOthersTask.returnFlag) {
                    this._errorMessage(validateOthersTask.returnErr);
                    validateInputTask = false;
                }
                if (validateInputTask) {
                    // Setting config object
                    this.config = { "highlighterDetails": highlighterDetails, "geoprocessing": geoprocessingObject };
                    // Get config for input parameters
                    this._getInputConfigParameters();
                    // Get config for Output parameters
                    this._getOutputConfigParameters();
                    // Get config for others parameter
                    this._getOtherConfigParameters();
                } else {
                    return false;
                }
            } else {
                this._errorMessage(this.nls.configDataNull);
                return false;
            }
            console.log(this.config);
            return this.config;
        },

        /**
        * This function validates the Other parameters
        * @param {return} flag value for validation
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _validateOthersTaskParameters: function () {
            var returnObj = { returnErr: "", returnFlag: false };
            // if Others setting Obj is created
            if (this.othersSettingObj) {
                array.forEach(this.othersSettingObj, lang.hitch(this, function (otherData) {
                    //if widget obj found for Others config details for highlighter image
                    if (otherData) {
                        othersParam = otherData.getOthersForm();
                        imageDataOBJ = otherData.imageDataObj;
                        //otherData.imageChooser.imageData;
                        if (imageDataOBJ === "" || imageDataOBJ === null) {
                            returnObj.returnErr = this.nls.validationErrorMessage.otherHighlighterImage;
                            returnObj.returnFlag = true;
                        }
                    }
                }));
            }
            return returnObj;
        },
        /**
        * This function validates the input parameters
        * @param {return} flag value for validation
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _validateInputTaskParameters: function () {
            var returnObj = { returnErr: "", returnFlag: false }, flagVal = 0, inputTypeData, barrierVal = 0, skipVal = 0;
            // if input parameters is created in Dom
            if (this.inputSettingArray) {
                flagVal = 0;
                barrierVal = 0;
                skipVal = 0;
                // loop for parsing all the input parameters for valid set of data
                array.forEach(this.inputSettingArray, lang.hitch(this, function (widgetNode) {
                    // if widgetNode found
                    if (widgetNode) {
                        inputTypeData = widgetNode.inputTypeData.value;
                        // if input type is flag then count the number of flag type input
                        if (inputTypeData === "Flag") {
                            flagVal++;
                        } else if (inputTypeData === "Barrier") {
                            // if input type is flag then count the number of Barrier type input
                            barrierVal++;
                        } else if (inputTypeData === "Skip") {
                            // if input type is flag then count the number of Skip type input
                            skipVal++;
                        }
                    }
                }));

            }
            // if flag type input is greater than 1 and less than 1
            if (flagVal > 1) {
                returnObj.returnErr = this.nls.validationErrorMessage.inputTypeFlagGreaterThanError;
                returnObj.returnFlag = true;
            } else if (flagVal < 1) {
                returnObj.returnErr = this.nls.validationErrorMessage.inputTypeFlagLessThanError;
                returnObj.returnFlag = true;
            } else if (barrierVal > 1) {
                // if barrier type input is greater than 1
                returnObj.returnErr = this.nls.validationErrorMessage.inputTypeBarrierErr;
                returnObj.returnFlag = true;
            } else if (skipVal > 1) {
                // if skip type input is greater than 1
                returnObj.returnErr = this.nls.validationErrorMessage.inputTypeSkipErr;
                returnObj.returnFlag = true;
            }
            return returnObj;
        },

        /**
        * This function validates the output parameters
        * @param {return} flag value for validation
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _validateOutputTaskParameters: function () {
            var returnObj = { returnErr: "", returnFlag: false }, key, displayName, skippableChecked, summaryTextVal, validSummary = false, validDisplayTextArr, displayTextVal, validDisplay;
            // if output parameters is created in Dom
            if (this.outputSettingArray) {
                // loop for parsing all the output parameters for valid set of data
                for (key in this.outputSettingArray) {
                    validDisplayTextArr = [];
                    if (this.outputSettingArray.hasOwnProperty(key)) {
                        displayName = domAttr.get(this.outputSettingArray[key].domNode, "displayName");
                        // if outage area drop down is not null and the this particular container belongs to the outage area
                        if ((this.outputSettingArray[key].outputLabelData.value === "" || this.outputSettingArray[key].outputLabelData.value === null) ||
                                (this.outputSettingArray[key].outputSummaryText.value === "" || this.outputSettingArray[key].outputSummaryText.value === null) ||
                                (this.outputSettingArray[key].outputDisplayText.value === "" || this.outputSettingArray[key].outputDisplayText.value === null) ||
                                (this.outputSettingArray[key].outputMinScaleData.value === "" || this.outputSettingArray[key].outputMinScaleData.value === null ||
                                isNaN(parseInt(this.outputSettingArray[key].outputMinScaleData.value, 10)) || (parseInt(this.outputSettingArray[key].outputMinScaleData.value, 10) < 0)) || (this.outputSettingArray[key].outputMaxScaleData.value === "" ||
                                this.outputSettingArray[key].outputMaxScaleData.value === null || isNaN(parseInt(this.outputSettingArray[key].outputMaxScaleData.value, 10)) || (parseInt(this.outputSettingArray[key].outputMaxScaleData.value, 10) < 0))) {
                            // label value is null
                            if ((this.outputSettingArray[key]) && (this.outputSettingArray[key].outputLabelData) && (this.outputSettingArray[key].outputLabelData.value === "" || this.outputSettingArray[key].outputLabelData.value === null) && (displayName && this.outageSettingObj.outageAreaDropDown && this.outageSettingObj.outageAreaDropDown.value !== displayName)) {
                                returnObj.returnErr = this.nls.validationErrorMessage.outputLabelDataErr + " in " + this.outputSettingArray[key].data.displayName;
                                returnObj.returnFlag = true;
                                //                            break;
                            } else if ((this.outputSettingArray[key]) && (this.outputSettingArray[key].outputSummaryText) && (this.outputSettingArray[key].outputSummaryText.value === "" || this.outputSettingArray[key].outputSummaryText.value === null) && (displayName && this.outageSettingObj.outageAreaDropDown && this.outageSettingObj.outageAreaDropDown.value !== displayName)) {
                                // Summary Text value is null
                                returnObj.returnErr = this.nls.validationErrorMessage.outputSummaryDataErr + " in " + this.outputSettingArray[key].data.displayName;
                                returnObj.returnFlag = true;
                                //                            break;
                            } else if ((this.outputSettingArray[key]) && (this.outputSettingArray[key].outputDisplayText) && (this.outputSettingArray[key].outputDisplayText.value === "" || this.outputSettingArray[key].outputDisplayText.value === null) && (displayName && this.outageSettingObj.outageAreaDropDown && this.outageSettingObj.outageAreaDropDown.value !== displayName)) {
                                // if Display text value is null
                                returnObj.returnErr = this.nls.validationErrorMessage.outputDisplayDataErr + " in " + this.outputSettingArray[key].data.displayName;
                                returnObj.returnFlag = true;
                                //                            break;
                            } else if ((this.outputSettingArray[key]) && (this.outputSettingArray[key].outputMinScaleData) && (this.outputSettingArray[key].outputMinScaleData.value === "" || this.outputSettingArray[key].outputMinScaleData.value === null || isNaN(parseInt(this.outputSettingArray[key].outputMinScaleData.value, 10)) || parseInt(this.outputSettingArray[key].outputMinScaleData.value, 10) < 0)) {
                                // if min scale is value is null or not an number
                                returnObj.returnErr = this.nls.validationErrorMessage.outputMinScaleDataErr + " in " + this.outputSettingArray[key].data.displayName;
                                returnObj.returnFlag = true;
                                //                            break;
                            } else if ((this.outputSettingArray[key]) && (this.outputSettingArray[key].outputMaxScaleData) && (this.outputSettingArray[key].outputMaxScaleData.value === "" || this.outputSettingArray[key].outputMaxScaleData.value === null || isNaN(parseInt(this.outputSettingArray[key].outputMaxScaleData.value, 10)) || parseInt(this.outputSettingArray[key].outputMaxScaleData.value, 10) < 0)) {
                                // if max scale is value is null or not an number
                                returnObj.returnErr = this.nls.validationErrorMessage.outputMaxScaleDataErr + " in " + this.outputSettingArray[key].data.displayName;
                                returnObj.returnFlag = true;
                                //                            break;
                            }

                        } else {
                            // if the summary text value is not null and not and outage area type output
                            if ((this.outputSettingArray[key].outputSummaryText) && (this.outputSettingArray[key].outputSummaryText.value !== "") && (displayName && this.outageSettingObj.outageAreaDropDown && this.outageSettingObj.outageAreaDropDown.value !== displayName)) {
                                skippableChecked = this.outputSettingArray[key].skippable.checked;
                                summaryTextVal = this.outputSettingArray[key].outputSummaryText.value;
                                validSummary = this._validateSummaryText(summaryTextVal, skippableChecked);

                            }
                            // if the display text value is not null and not and outage area type output
                            if (!validSummary && (this.outputSettingArray[key].outputDisplayText) && this.outputSettingArray[key].outputDisplayText.value !== "" && (displayName && this.outageSettingObj.outageAreaDropDown && this.outageSettingObj.outageAreaDropDown.value !== displayName)) {
                                // if valid set of display text is not null
                                if (this.outputSettingArray[key] && this.outputSettingArray[key].helpTextDataArray && this.outputSettingArray[key].helpTextDataArray.length > 0) {
                                    validDisplayTextArr = this.outputSettingArray[key].helpTextDataArray;
                                    displayTextVal = this.outputSettingArray[key].outputDisplayText.value;
                                    validDisplay = this._validateDisplayText(displayTextVal, validDisplayTextArr);
                                }
                            }
                            // if the summary text format is not valid
                            if (validSummary) {
                                returnObj.returnErr = this.nls.validationErrorMessage.outputSummaryDataText + " in " + this.outputSettingArray[key].data.displayName;
                                returnObj.returnFlag = validSummary;
                            } else if (validDisplay) {
                                // if the display text format is not valid
                                returnObj.returnErr = this.nls.validationErrorMessage.outputDisplayDataText + " in " + this.outputSettingArray[key].data.displayName;
                                returnObj.returnFlag = validDisplay;
                            }
                        }
                        if (returnObj.returnFlag) {
                            break;
                        }
                    }
                }
            }
            return returnObj;
        },


        /**
        * This function validates the Summary text of output parameters
        * @param {return} flag value for validation
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _validateSummaryText: function (summaryTextVal, skippableChecked) {
            var summaryString, i, j, summaryArray = [], validArray = [], validFlag = false, firstPlace, secondPlace, countString, skipCountString;
            countString = "Count";
            skipCountString = "SkipCount";
            summaryTextVal = summaryTextVal.trim();
            firstPlace = summaryTextVal.indexOf("{");
            secondPlace = summaryTextVal.indexOf("}");
            // summary text found with the braces
            if (firstPlace !== -1 && secondPlace !== -1) {
                summaryString = summaryTextVal.split("{");
            } else {
                summaryString = summaryTextVal;
            }
            // if spited array is not null
            if (summaryString && summaryString.length > 0) {
                // loop for spliting the array by "}" string
                for (i = 0; i < summaryString.length; i++) {
                    // if value in array is not null
                    if (summaryString[i] !== "" && (summaryString[i].indexOf("}") !== -1)) {
                        summaryArray[i] = summaryString[i].split("}");
                        validArray.push(summaryArray[i][0].toUpperCase());
                    }
                }
                // loop for traversing array and checking if summary text contains count and skip count string in defined manner
                for (j = 0; j < validArray.length; j++) {
                    if (skippableChecked) {
                        // if array index having  "Count" or "SkipCount" string
                        if ((validArray[j] === countString.toUpperCase() || validArray[j] === skipCountString.toUpperCase())) {
                            //if () {
                            validFlag = false;
                        } else {
                            validFlag = true;
                            break;
                        }
                    } else {
                        // if array index having  "Count" string
                        if (validArray[j] === countString.toUpperCase()) {
                            validFlag = false;
                        } else {
                            validFlag = true;
                            break;
                        }
                    }
                }
            } else {
                validFlag = true;
            }
            return validFlag;
        },

        /**
        * This function validates the Display text of output parameters
        * @param {return} flag value for validation
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _validateDisplayText: function (displayTextVal, validDisplayTextArr) {
            var displayString, i, j, validArray = [], validFlag = false, firstPlace, secondPlace, displayArray = [];
            displayTextVal = displayTextVal.trim();
            firstPlace = displayTextVal.indexOf("{");
            secondPlace = displayTextVal.indexOf("}");
            // display text found with the braces
            if (firstPlace !== -1 && secondPlace !== -1) {
                displayString = displayTextVal.split("{");
            } else {
                displayString = displayTextVal;
            }
            // if spited array is not null
            if (displayString && displayString.length > 0) {
                // loop for spliting the array by "}" string
                for (i = 0; i < displayString.length; i++) {
                    // if value in array is not null
                    if (displayString[i] !== "" && (displayString[i].indexOf("}") !== -1)) {
                        displayArray[i] = displayString[i].split("}");
                        validArray.push(displayArray[i][0].toUpperCase());
                    }
                }
                // loop for traversing array and checking if display text contains valid data or not
                for (j = 0; j < validArray.length; j++) {
                    // if array index having valid string
                    if (validDisplayTextArr.indexOf(validArray[j]) === -1) {
                        validFlag = true;
                        break;
                    } else {
                        validFlag = false;
                    }
                }
            } else {
                validFlag = true;
            }

            return validFlag;
        },
        /**
        * This function validates the Outage field mapping parameters
        * @param {return} flag value for validation
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _validateOutageTaskParameters: function () {
            var returnObj = { returnErr: "", returnFlag: false }, domDisplayName, outputParam, outageLayerName, i, fieldMapArr, fieldNameArr = [], paramNameArr = [], saveToLayerCheckBox, saveToLayerCheckBoxStatus;
            // if outage type parameters is created in the config outage object
            if (this.outageSettingObj) {
                // if output type parameters is created in the config output object
                if (this.outputSettingArray) {
                    saveToLayerCheckBox = false;
                    // loop for traversing the output Dom nodes for checking affected area and save to layer check boxes
                    array.forEach(this.outputSettingArray, lang.hitch(this, function (widgetNode) {
                        domDisplayName = "";
                        outputParam = widgetNode.getOutputForm();
                        domDisplayName = domAttr.get(widgetNode.domNode, "displayName");
                        outageLayerName = outputParam.saveToLayer;
                        saveToLayerCheckBoxStatus = widgetNode.outputLayer.checked ? outageLayerName : "";
                        if (widgetNode) {
                            domDisplayName = domAttr.get(widgetNode.domNode, "displayName");
                        }
                        // Checking for outage area drop down value and save to layer chedk box checked status
                        if (saveToLayerCheckBoxStatus && this.outageSettingObj.outageAreaDropDown.value === domDisplayName) {
                            saveToLayerCheckBox = true;
                        }
                    }));
                }
                if (saveToLayerCheckBox) {
                    fieldMapArr = this.outageSettingObj.getOutageConfig();
                }
                // if field mapping array is available for the outage area
                if (fieldMapArr && saveToLayerCheckBox) {
                    // loop for traversing the field mapping data
                    for (i = 0; i < fieldMapArr.length; i++) {
                        // if fieldNameArr length is greater than 0 and field value already not exist
                        if (fieldNameArr.length > 0 && fieldNameArr.indexOf(fieldMapArr[i].fieldName) !== -1) {
                            returnObj.returnErr = this.nls.validationErrorMessage.outageFieldMappingErr;
                            returnObj.returnFlag = true;
                            break;
                        }
                        fieldNameArr.push(fieldMapArr[i].fieldName);
                        // if paramNameArr length is greater than 0 and param value already not exist
                        if (paramNameArr.length > 0 && paramNameArr.indexOf(fieldMapArr[i].paramName) !== -1) {
                            returnObj.returnErr = this.nls.validationErrorMessage.outageFieldMappingErr;
                            returnObj.returnFlag = true;
                            break;
                        }
                        paramNameArr.push(fieldMapArr[i].paramName);
                    }
                }
            }
            return returnObj;
        },

        setConfig: function () {
            console.log(this.config);
        },

        /**
        * This function display error message in jimu alert box.
        * @param {string} err gives the error message
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _errorMessage: function (err) {
            var errorMessage = new Message({ message: err });
            errorMessage.message = err;
        }
    });
});
