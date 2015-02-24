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
    "jimu/dijit/LoadingIndicator",
    "dojox/fx/scroll"

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
    LoadingIndicator,
    scroll
) {
    return declare([BaseWidgetSetting, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        baseClass: 'jimu-widget-IsolationTrace-setting',
        url: null,
        config: {},
        gpServiceTasks: null,
        inputParametersArray: [],
        outputParametersArray: [],
        paramNameValue: [],
        symbolChooserArray: [],
        selectedInputArray: [],
        saveToLayerArray: [],
        exportCSVArray: [],
        paramNameArray: [],
        fieldNameArray: [],
        skippableCheckArray: [],
        symbolChooserArrayForOutPut: [],
        skippableFieldSelectArray: [],
        outageArea: {},
        startup: function () {
            this.inherited(arguments);
        },
        postCreate: function () {
            // validating the fetching the request data
            setTimeout(lang.hitch(this, function () {
                if (this.config && this.config.geoprocessing && this.config.geoprocessing.url) {
                    this.txtURL.set('value', this.config.geoprocessing.url);
                    this._onInputValueChange();
                    this._onValidate();
                }
            }), 200);

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
            var getUrl, validateURLNode;
            getUrl = this.txtURL.get('value');
            validateURLNode = dom.byId('validateUrl');
            // if input value is not null then disables otherwise enables.
            if (getUrl !== null && getUrl !== "") {
                if (validateURLNode) {
                    domClass.remove(validateURLNode, "jimu-state-disabled");
                }
            } else {
                if (validateURLNode) {
                    domClass.add(validateURLNode, "jimu-state-disabled");
                    domConstruct.empty(this.taskData);
                    this._destroyWidget(this.inputProperty);
                    this._destroyWidget(this.outputAdditionalProperty);
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
            var requestArgs, gpTaskParameters = [],
                isURLcorrect;
            this.loading.show();
            this._destroyWidget(this.inputProperty);
            this._destroyWidget(this.outputAdditionalProperty);
            isURLcorrect = this._urlValidator(this.txtURL.value);
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
                                this._showTaskDetails(gpTaskParameters);
                                if (this.config && this.config.geoprocessing && this.config.geoprocessing.url) {
                                    this.setConfig();
                                }
                                this.loading.hide();
                            }
                        }
                    } else {
                        domConstruct.empty(this.taskData);
                        domConstruct.empty(this.inputProperty);
                        domConstruct.empty(this.outputAdditionalProperty);
                        domClass.add(this.taskDataContainer, "esriCTHidden");
                        this.loading.hide();
                        this._errorMessage(this.nls.invalidURL);
                    }
                }), lang.hitch(this, function (err) {
                    domConstruct.empty(this.taskData);
                    domConstruct.empty(this.inputProperty);
                    domConstruct.empty(this.outputAdditionalProperty);
                    domClass.add(this.taskDataContainer, "esriCTHidden");
                    this.loading.hide();
                    this._errorMessage(this.nls.invalidURL);
                }));

            } else {
                domConstruct.empty(this.taskData);
                domConstruct.empty(this.inputProperty);
                domConstruct.empty(this.outputAdditionalProperty);
                domClass.add(this.taskDataContainer, "esriCTHidden");
                domConstruct.empty(this.GpTasks);
                this.loading.hide();
                this._errorMessage(this.nls.inValidGPService);
            }
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
                node: dojo.query('#taskDataContainerId :first-child')[0],
                win: dojo.byId('taskDataContainerId')
            }).play();
        },

        /**
        * This function destroy widget if created
        * @param{object} div
        * @memberOf widgets/isolation-trace/settings/settings.js
        */
        _destroyWidget: function (div) {
            var widgets = dijit.findWidgets(div);
            domConstruct.empty(div);
            // Looping for each widget and destroying the widget
            dojo.forEach(widgets, function (w) {
                w.destroyRecursive(true);
            });
        },

        /**
        * This function is called to show task details.
        * @param{array} gpTaskParameters
        * @memberOf widgets/isolation-trace/settings/settings.js
        */
        _showTaskDetails: function (gpTaskParameters) {
            var inputTP, inputHolderDiv, i, j, k, m, outputField, outputHolderDiv, outputContainer,
                outputTP, inputField, inputContainer, OthersHolderDiv, OutageHolderDiv, selectedItems;
            domConstruct.empty(this.taskData);
            domClass.remove(this.taskDataContainer, "esriCTHidden");
            // if geo-processing input/output parameters exist
            if (gpTaskParameters) {
                this.inputParametersArray = [];
                this.outputParametersArray = [];
                // loop for creating input and output parameters array
                for (i = 0; i < gpTaskParameters.length; i++) {
                    // if parameters type is input
                    if (gpTaskParameters[i].direction === "esriGPParameterDirectionInput") {
                        this.inputParametersArray.push(gpTaskParameters[i]);
                    } else if (gpTaskParameters[i].direction === "esriGPParameterDirectionOutput") {
                        this.outputParametersArray.push(gpTaskParameters[i]);
                    }
                }
            }
            inputHolderDiv = domConstruct.create("div", {
                "id": "esriCTInputHolder",
                "class": "esriCTInputHolder"
            }, this.taskData);
            inputContainer = domConstruct.create("div", {
                "class": "inputContainer"
            });
            // if input parameters array length is greater than zero
            if (this.inputParametersArray.length >= 0) {
                inputTP = new TitlePane({
                    title: this.nls.inputTask,
                    open: true,
                    content: inputContainer
                });
                // loop for populating input data in input fields and also creating additional input fields dynamically
                for (j = 0; j < this.inputParametersArray.length; j++) {
                    // if counter is at one for displaying first value selected by default
                    if (j === 0) {
                        inputField = domConstruct.create("div", {
                            "class": "esriCTInputField esriCTSelected",
                            "id": "selectInput_" + j
                        }, inputContainer);
                        this._displayInputData(this.inputParametersArray[j].name);
                    } else {
                        inputField = domConstruct.create("div", {
                            "class": "esriCTInputField",
                            "id": "selectInput_" + j
                        }, inputContainer);
                    }

                    domConstruct.create("div", {
                        "class": "inputValue",
                        "innerHTML": this.nls.inputName + ": " + this.inputParametersArray[j].name
                    }, inputField);
                    domConstruct.create("div", {
                        "class": "inputValue",
                        "innerHTML": this.nls.inputType + ": " + this.inputParametersArray[j].dataType
                    }, inputField);
                    // if input parameterType is required field then reflect Required as a true otherwise false
                    if (this.inputParametersArray[j].parameterType === "esriGPParameterTypeRequired") {
                        domConstruct.create("div", {
                            "class": "inputValue",
                            "innerHTML": this.nls.inputRequired + ": True"
                        }, inputField);
                    } else {
                        domConstruct.create("div", {
                            "class": "inputValue",
                            "innerHTML": this.nls.inputRequired + ": False"
                        }, inputField);
                    }
                    this._bindInputClickEvent(inputField, inputContainer);
                }
                // if title pane is created then append complete dom HTML
                if (inputTP) {
                    inputHolderDiv.appendChild(inputTP.domNode);
                }
            }
            outputHolderDiv = domConstruct.create("div", {
                "id": "esriCTOutputHolder",
                "class": "esriCTOutputHolder"
            }, this.taskData);
            outputContainer = domConstruct.create("div", {
                "class": "outputContainer"
            });
            // if output parameters array length is greater than zero
            if (this.outputParametersArray.length >= 0) {
                outputTP = new TitlePane({
                    title: this.nls.outputTask,
                    open: false,
                    content: outputContainer
                });
                // loop for populating output data in output fields and also creating additional output fields dynamically
                for (k = 0; k < this.outputParametersArray.length; k++) {

                    outputField = domConstruct.create("div", {
                        "class": "esriCTOutputField",
                        "id": "selectOutput_" + k
                    }, outputContainer);
                    domConstruct.create("div", {
                        "class": "outputValue",
                        "innerHTML": this.nls.inputName + ": " + this.outputParametersArray[k].name
                    }, outputField);
                    domConstruct.create("div", {
                        "class": "outputValue",
                        "innerHTML": this.nls.inputType + ": " + this.outputParametersArray[k].dataType
                    }, outputField);
                    // if output parameterType is required field then reflect Required as a true otherwise false
                    if (this.outputParametersArray[k].parameterType === "esriGPParameterTypeRequired") {
                        domConstruct.create("div", {
                            "class": "outputValue",
                            "innerHTML": this.nls.inputRequired + ": True"
                        }, outputField);
                    } else {
                        domConstruct.create("div", {
                            "class": "outputValue",
                            "innerHTML": this.nls.inputRequired + ": False"
                        }, outputField);
                    }
                    domAttr.set(outputField, "displayName", this.outputParametersArray[k].name);
                    this._bindOutputClickEvent(outputField, outputContainer);
                    // for calling display output method for the very first time
                    // populating the all output task details
                    if (k === 0) {
                        this._displayOutputData();
                    }

                    // if title pane is created then append complete Dom HTML
                    if (outputTP) {
                        outputHolderDiv.appendChild(outputTP.domNode);
                    }
                }
            }
            //Outage task.
            OutageHolderDiv = domConstruct.create("div", {
                "id": "outageHolder",
                "class": "esriCTSelectedOutageHolder",
                "innerHTML": this.nls.outage
            }, this.taskData);
            on(OutageHolderDiv, "click", lang.hitch(this, function (evt) {
                selectedItems = query(".esriCTSelected", this.taskData);
                // loop for selecting the clicked outage and deselecting rest of the all
                for (m = 0; m < selectedItems.length; m++) {
                    domClass.remove(selectedItems[m], 'esriCTSelected');
                }
                domClass.add(evt.target.id, "esriCTSelected");
                domClass.add(this.esriCTInputOutputParameters, "esriCTHidden");
                domClass.remove(this.taskDataContainer, "esriCTHidden");
                domClass.add(this.othersData, "esriCTHidden");
                domClass.remove(this.outageData, "esriCTHidden");
                domClass.add(this.othersData, "esriCTHidden");
                // Window.scrollIntoView(this.outageData);

                this._displayOutageData();
            }));
            this._displayOutageData();
            //Others task.
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
                // Window.scrollIntoView(this.othersData);
                domClass.add(evt.target.id, "esriCTSelected");
                domClass.add(this.esriCTInputOutputParameters, "esriCTHidden");
                domClass.remove(this.taskDataContainer, "esriCTHidden");
                domClass.add(this.outageData, "esriCTHidden");
                domClass.remove(this.othersData, "esriCTHidden");
            }));
            this._displayOthersData();
        },

        /**
        * This function binds the click event to display input fields on input parameters click .
        * @param{string} inputField, inputContainer
        * @memberOf widgets/isolation-trace/settings/settings
        */
        _bindInputClickEvent: function (inputField, inputContainer) {
            var m, selectedItems;
            on(inputField, "click", lang.hitch(this, function (evt) {
                this._focusTop();
                selectedItems = query(".esriCTSelected", this.taskData);
                // Loop for deselect all the selected input parameters if already selected
                for (m = 0; m < selectedItems.length; m++) {
                    domClass.remove(selectedItems[m], 'esriCTSelected');
                }
                domClass.add(evt.currentTarget, "esriCTSelected");
                this._showCurrentInput(evt.currentTarget);
                //this._displayInputData(evt.currentTarget.id);
                domClass.remove(this.esriCTInputOutputParameters, "esriCTHidden");
                domClass.add(this.othersData, "esriCTHidden");
                domClass.add(this.outageData, "esriCTHidden");
                domClass.remove(this.inputProperty, "esriCTHidden");
                domClass.add(this.outputAdditionalProperty, "esriCTHidden");
            }));
        },


        /**
        * This function binds the click event to display input fields on input parameters click .
        * @param{string} currentTarget is div of selected item
        * @memberOf widgets/isolation-trace/settings/settings
        */
        _showCurrentInput: function (currentTarget) {
            var i;
            // loop for displaying Selected input task and hiding rest of the all
            for (i = 0; i < this.inputProperty.childNodes.length; i++) {
                // selected input and the task div is same then show it
                if ((currentTarget.id).replace("selectInput", "ParameterDiv") === this.inputProperty.childNodes[i].id) {
                    domClass.remove(this.inputProperty.childNodes[i], 'esriCTHidden');
                    this.currentInputDiv = this.inputProperty.childNodes[i];
                } else {
                    domClass.add(this.inputProperty.childNodes[i], 'esriCTHidden');
                }
            }
        },

        /**
        * This function binds the click event to display output fields on output parameters click .
        * @param{string} outputField, outputContainer
        * @memberOf widgets/isolation-trace/settings/settings
        */
        _bindOutputClickEvent: function (outputField, outputContainer) {
            var m, selectedItems;
            on(outputField, "click", lang.hitch(this, function (evt) {
                var displayName = domAttr.get(outputField, "displayName");
                this._focusTop();
                selectedItems = query(".esriCTSelected", this.taskData);
                // loop for selecting the clicked output and deselecting rest of the all
                for (m = 0; m < selectedItems.length; m++) {
                    domClass.remove(selectedItems[m], 'esriCTSelected');
                }
                domClass.add(evt.currentTarget, "esriCTSelected");
                this._showCurrentOutput(evt.currentTarget, displayName);
                domClass.remove(this.esriCTInputOutputParameters, "esriCTHidden");
                domClass.add(this.othersData, "esriCTHidden");
                domClass.add(this.outageData, "esriCTHidden");
                domClass.add(this.inputProperty, "esriCTHidden");
                domClass.remove(this.outputAdditionalProperty, "esriCTHidden");
            }));
        },

        /**
        * This function is called to display currently selected output task details.
        * @param{string} currentTarget
        * @memberOf widgets/isolation-trace/settings/settings
        */
        _showCurrentOutput: function (currentTarget, displayName) {
            var i;
            // loop for displaying Selected output task and hiding rest of the all
            for (i = 0; i < this.outputAdditionalProperty.childNodes.length; i++) {
                // selected output and the task div is same then show it
                if ((currentTarget.id).replace("selectOutput", "outputdetail") === this.outputAdditionalProperty.childNodes[i].id) {
                    domAttr.set(this.outputAdditionalProperty.childNodes[i], "displayName", displayName);
                    domClass.remove(this.outputAdditionalProperty.childNodes[i], 'esriCTHidden');
                } else {
                    domClass.add(this.outputAdditionalProperty.childNodes[i], 'esriCTHidden');
                }
            }
        },

        /**
        * This function is called to display input task details.
        * @param{string} inputTaskId
        * @memberOf widgets/isolation-trace/settings/settings
        */
        _displayInputData: function (inputTaskId) {
            var i, container, objSymbol, symbolChooserObject = {}, selectionArray, selectedValueInConfig,
                selectedOption = false, selectedValueId, selectedValueIdval, m, n, inputParameterDiv, inputLableDiv,
                lableTextDiv, inputTooltipDiv, inputTooltipTextDiv, inputTypeDiv, typeSelect, typeSelectObject, inputSymbolDiv;
            this.symbolChooserArray = [];
            this.selectedInputArray = [];
            this.symbolChooserArray.length = 0;
            // if input parameter array exist
            if (this.inputParametersArray && (this.inputParametersArray.length > 0)) {
                // loop for populating input parameters fields and and their respective values
                for (i = 0; i < this.inputParametersArray.length; i++) {
                    domClass.remove(this.taskDataContainer, "esriCTHidden");
                    if (i === 0) {
                        inputParameterDiv = domConstruct.create("div", {
                            "id": "ParameterDiv_" + i,
                            "class": "ParameterDiv"
                        }, this.inputProperty);

                    } else {
                        inputParameterDiv = domConstruct.create("div", {
                            "id": "ParameterDiv_" + i,
                            "class": "esriCTHidden"
                        }, this.inputProperty);

                    }
                    /* Create label for passing Param name to config. this field is kept hidden on UI end */
                    inputLableDiv = domConstruct.create("div", {
                        "class": "field inputLabel esriCTHidden",
                        "title": this.nls.inputLabel
                    }, inputParameterDiv);
                    domConstruct.create("label", {
                        "innerHTML": this.nls.inputLabel
                    }, inputLableDiv);
                    lableTextDiv = new ValidationTextBox({
                        "class": "common-input",
                        required: true,
                        invalidMessage: "Enter alphabets only.",
                        value: this.inputParametersArray[i].name
                    }, domConstruct.create("input", {
                        "id": "lableText_" + i
                    }, inputLableDiv));
                    lableTextDiv.title = this.nls.inputLabel;
                    /* Create lable end */
                    /* Create Tooltip */
                    inputTooltipDiv = domConstruct.create("div", {
                        "class": "field esriCTHidden",
                        "title": this.nls.inputTooltip
                    }, inputParameterDiv);
                    domConstruct.create("label", {
                        "innerHTML": this.nls.inputTooltip
                    }, inputTooltipDiv);
                    inputTooltipTextDiv = new ValidationTextBox({
                        "class": "common-input",
                        required: true,
                        invalidMessage: "Enter alphabets only."
                    }, domConstruct.create("input", {
                        "id": "tooltipText_" + i
                    }, inputTooltipDiv));
                    inputTooltipTextDiv.title = this.nls.inputTooltip;
                    /* Create tooltip  end */
                    /* Create type selection  */
                    inputTypeDiv = domConstruct.create("div", {
                        "class": "field",
                        "title": this.nls.inputType
                    }, inputParameterDiv);
                    domConstruct.create("label", {
                        "innerHTML": this.nls.inputType
                    }, inputTypeDiv);
                    typeSelect = new Select({
                        style: {
                            width: "80%",
                            height: "30px"
                        },
                        "id": "selectType_" + i
                    });
                    selectionArray = [];
                    // Creation of object for select
                    selectionArray = [{ "id": "Flag", "value": this.nls.inputTypeFlag }, { "id": "Barrier", "value": this.nls.inputTypeBarriers }, { "id": "Skip", "value": this.nls.inputTypeSkip}];
                    // Getting value from config file
                    selectedValueInConfig = this.config && this.config.geoprocessing && this.config.geoprocessing.inputs[i]
                            && this.config.geoprocessing.inputs[i].type ? this.config.geoprocessing.inputs[i].type : "";
                    selectedOption = false;
                    // Looping through select array to get id and value
                    for (m = 0; m < selectionArray.length; m++) {
                        // Checking for id with the value got from config file
                        if (selectionArray[m].id === selectedValueInConfig) {
                            selectedValueId = selectionArray[m].id;
                            selectedValueIdval = selectionArray[m].value;
                            break;
                        }
                    }
                    // Looping for select to add value in option
                    for (n = 0; n < selectionArray.length; n++) {
                        typeSelect.addOption({
                            value: selectionArray[n].id,
                            label: selectionArray[n].value,
                            selected: selectedOption
                        });
                    }
                    // Checking for select value to set selected value in select
                    if (selectedValueIdval) {
                        typeSelect.set({
                            value: selectedValueId,
                            label: selectedValueIdval
                        });
                    }
                    typeSelect.placeAt(inputTypeDiv);
                    typeSelect.startup();
                    //selectedInputObject = {};
                    typeSelectObject = { "id": "selectType_" + i };
                    this.selectedInputArray.push(typeSelectObject);
                    //if symbol geometry exist
                    if (this.inputParametersArray[i].defaultValue.geometryType) {
                        this.inputParametersArray[i].featureSetMode = 'draw';
                        inputSymbolDiv = domConstruct.create("div", {
                            "class": "field",
                            "title": this.nls.symbol
                        }, inputParameterDiv);
                        domConstruct.create("label", {
                            "innerHTML": this.nls.symbol
                        }, inputSymbolDiv);
                        objSymbol = {};
                        // if symbols parameter available in input parameters then takes symbol details
                        // otherwise using geometry type for fetching the symbol details
                        if (this.config && this.config.geoprocessing && this.config.geoprocessing.inputs.length > i && this.config.geoprocessing.inputs[i].symbol) {
                            objSymbol.symbol = jsonUtils.fromJson(this.config.geoprocessing.inputs[i].symbol);
                        } else {
                            if (this.inputParametersArray[i].symbol) {
                                objSymbol.symbol = jsonUtils.fromJson(this.inputParametersArray[i].symbol);
                            } else {
                                objSymbol.type = utils.getSymbolTypeByGeometryType(this.inputParametersArray[i].defaultValue.geometryType);
                            }
                        }
                        container = domConstruct.create("div", {}, inputParameterDiv);
                        this.symbolChooser = new SymbolChooser(objSymbol, container);
                        symbolChooserObject = { "id": "symbolContainer_" + i, "div": this.symbolChooser };
                        this.symbolChooserArray.push(symbolChooserObject);
                        this.symbolChooser.startup();
                    }
                }
            }

            domClass.remove(this.esriCTInputOutputParameters, "esriCTHidden");
            domClass.add(this.othersData, "esriCTHidden");
            domClass.add(this.outageData, "esriCTHidden");
            domClass.add(this.outputAdditionalProperty, "esriCTHidden");
            domClass.remove(this.inputProperty, "esriCTHidden");
        },

        /**
        * This function is called to display output task details.
        * @memberOf widgets/isolation-trace/settings/settings
        */
        _displayOutputData: function () {
            var i;
            this.symbolChooserArrayForOutPut = [];
            this.symbolChooserArrayForOutPut.length = 0;
            // loop for populating output parameters fields and and their respective values
            this.saveToLayerArray = [];
            this.exportCSVArray = [];
            this.skippableCheckArray = [];
            this.skippableFieldSelectArray = [];
            for (i = 0; i < this.outputParametersArray.length; i++) {
                this._createAdditionalOutputParamDiv(i, this.outputParametersArray[i].displayName);
                this.outputParametersArray[i].featureSetMode = 'draw';
            }
        },

        /**
        * This function is called to display Other task details.
        * @memberOf widgets/isolation-trace/settings/settings
        */
        _displayOthersData: function () {
            var divForImgUrl, divForImgPathExample, divForImgHeight, divForImgWidth,
                legendDiv, othersDataDiv, divForImgTimeOut, txtImageUrl, spinnerImgHeight, spinnerImgWidth, spinnerImgTimeout, fieldsetDiv;
            // if others data is not already populated
            if (this.othersData.innerHTML === "" || this.othersData.innerHTML === null) {
                domConstruct.empty(this.othersData);
                // field set div creation
                fieldsetDiv = domConstruct.create("fieldset", { "class": "esriCTFieldset" }, this.othersData);
                legendDiv = domConstruct.create("legend", { "class": "esriCTlegend" }, fieldsetDiv);
                legendDiv.innerHTML = this.nls.othersHighlightertext;
                othersDataDiv = domConstruct.create("div", { "class": "esriCTOthersData" }, fieldsetDiv);
                divForImgUrl = domConstruct.create("div", {
                    "class": "esriCTImagePath field"
                }, othersDataDiv);
                domConstruct.create("label", {
                    "class": "esriCTImg esriCTLayoutLeft",
                    "innerHTML": this.nls.selectImage
                }, divForImgUrl);

                txtImageUrl = new ValidationTextBox({
                    "class": "common-input",
                    id: "txtImageUrl",
                    required: true
                }, domConstruct.create("input", {
                    "id": "txtImageUrlInput"
                }, divForImgUrl));

                txtImageUrl.title = this.nls.outputSummary;
                divForImgPathExample = domConstruct.create("div", {
                    "class": "esriCTImagePath field"
                }, othersDataDiv);
                domConstruct.create("label", {
                    "class": "esriCTImg esriCTLayoutLeft esriCTHeight"
                }, divForImgPathExample);
                domConstruct.create("div", {
                    "class": "esriCTExample",
                    "innerHTML": this.nls.imgPathHint1
                }, divForImgPathExample);
                domConstruct.create("div", {
                    "class": "esriCTExample",
                    "innerHTML": this.nls.imgPathHint2
                }, divForImgPathExample);
                domConstruct.create("div", {
                    "class": "esriCTExample",
                    "innerHTML": this.nls.imgPathHint3
                }, divForImgPathExample);

                divForImgHeight = domConstruct.create("div", {
                    "class": "esriCTImagePath  field"
                }, othersDataDiv);
                domConstruct.create("label", {
                    "class": "esriCTImg esriCTLayoutLeft",
                    "innerHTML": this.nls.height
                }, divForImgHeight);
                spinnerImgHeight = new NumberSpinner({
                    "class": "common-inputspin",
                    id: "spinnerImgHeight",
                    value: 100,
                    smallDelta: 1,
                    constraints: {
                        min: 1,
                        places: 0,
                        pattern: '#'
                    }
                }, domConstruct.create("div", {
                    "class": "esriCTLayoutLeft"
                }, divForImgHeight));

                spinnerImgHeight.title = this.nls.height;
                domConstruct.create("label", {
                    "class": "esriCTImg esriCTLayoutLeft esriCTunitsForOther",
                    "innerHTML": this.nls.pixel
                }, divForImgHeight);
                divForImgWidth = domConstruct.create("div", {
                    "class": "esriCTImagePath  field"
                }, othersDataDiv);
                domConstruct.create("label", {
                    "class": "esriCTImg esriCTLayoutLeft",
                    "innerHTML": this.nls.width
                }, divForImgWidth);
                spinnerImgWidth = new NumberSpinner({
                    "class": "common-inputspin",
                    id: "spinnerImgWidth",
                    value: 100,
                    smallDelta: 1,
                    constraints: {
                        min: 1,
                        places: 0,
                        pattern: '#'
                    }
                }, domConstruct.create("div", {
                    "class": "esriCTLayoutLeft"
                }, divForImgWidth));
                spinnerImgWidth.title = this.nls.width;
                domConstruct.create("label", {
                    "class": "esriCTImg esriCTLayoutLeft esriCTunitsForOther",
                    "innerHTML": this.nls.pixel
                }, divForImgWidth);
                divForImgTimeOut = domConstruct.create("div", {
                    "class": "esriCTImagePath  field"
                }, othersDataDiv);
                domConstruct.create("label", {
                    "class": "esriCTImg esriCTLayoutLeft",
                    "innerHTML": this.nls.timeout
                }, divForImgTimeOut);
                spinnerImgTimeout = new NumberSpinner({
                    "class": "common-inputspin",
                    id: "spinnerImgTimeout",
                    value: 1000,
                    smallDelta: 1000,
                    constraints: {
                        min: 1,
                        places: 0,
                        pattern: '#'
                    }
                }, domConstruct.create("div", {
                    "class": "esriCTLayoutLeft"
                }, divForImgTimeOut));
                spinnerImgTimeout.title = this.nls.timeout;
                domConstruct.create("label", {
                    "class": "esriCTImg esriCTLayoutLeft esriCTunitsForOther",
                    "innerHTML": this.nls.miliseconds
                }, divForImgTimeOut);
            }
        },

        /**
        * This function is called to display outage task details.
        * @memberOf widgets/isolation-trace/settings/settings
        */
        _displayOutageData: function () {
            var divOutageParam, visibleCheckBoxDiv, outageAreaDropDownValue = [], i, j, showFildMap = false,
                k, isChecked, outageLayerName, displayName, self, checkBoxStatus, e, visibleConfigData;
            // this.paramNameValue.length = 0;
            if (this.outageArea && this.outageArea.saveToLayer) {
                outageLayerName = this.outageArea.saveToLayer;
            }
            // Checking for outage Data inner html
            if (this.outageData.innerHTML === "" || this.outageData.innerHTML === null) {
                // looping for output parameter array for fetching data which have "esriGeometryPolygon" geometrytype
                this.paramNameValue.length = 0;
                for (k = 0; k < this.outputParametersArray.length; k++) {
                    // Checking for output Parameters Array, default value and gemetry type
                    if (this.outputParametersArray[k] && this.outputParametersArray[k].defaultValue && this.outputParametersArray[k].defaultValue.geometryType) {
                        //Push parameter name into array  whose geometry type is "esriGeometryPolygon"
                        if (this.outputParametersArray[k].defaultValue.geometryType === "esriGeometryPolygon") {
                            outageAreaDropDownValue.push(this.outputParametersArray[k].name);
                        } else {
                            // Checking for "GPFeatureRecordSetLayer" data type for showing param name in drop down
                            if (this.outputParametersArray[k].dataType === "GPFeatureRecordSetLayer") {
                                this.paramNameValue.push(this.outputParametersArray[k].name);
                            }
                        }
                    }
                }
                divOutageParam = domConstruct.create("div", { "class": "esriCTImagePath field" }, this.outageData);
                domConstruct.create("label", { "class": "esriCTImg esriCTLayoutLeft", "innerHTML": this.nls.outageParameter }, divOutageParam);
                // Creation of select of outage area
                this.outageAreaDropDown = new Select({ id: "outageAreaDropDownID", "class": "esriCTOutageAreaParamValue" }, domConstruct.create("input", { "id": "selectParameter" }, divOutageParam));
                // Looping for getting outage area value
                for (i = 0; i < outageAreaDropDownValue.length; i++) {
                    this.outageAreaDropDown.addOption({
                        value: outageAreaDropDownValue[i],
                        label: outageAreaDropDownValue[i],
                        selected: false
                    });
                }
                // Creating div for check box
                visibleCheckBoxDiv = domConstruct.create("div", {
                    "class": "field"
                }, this.outageData);
                // Creating label for visibility checkbox
                domConstruct.create("label", {
                    "class": "esriCTImg esriCTLayoutLeft",
                    "innerHTML": this.nls.isvisible
                }, visibleCheckBoxDiv);
                checkBoxStatus = false;
                // Checking for output in geoprocessing
                if (this.config && this.config.geoprocessing && this.config.geoprocessing.outputs) {
                    // looping for geoprocessing outputs
                    for (e = 0; e < this.config.geoprocessing.outputs.length; e++) {
                        // If geoprocessing outputs type is overview then change the config value in check box
                        if (this.config.geoprocessing.outputs[e].type === "Overview") {
                            visibleConfigData = this.config && this.config.geoprocessing && this.config.geoprocessing.outputs[e] && this.config.geoprocessing.outputs[e].visible ? this.config.geoprocessing.outputs[e].visible : "";
                            checkBoxStatus = visibleConfigData === "" ? false : true;
                        }
                    }
                }
                // Creating for check box for visibility option
                this.visibleCheckBox = new CheckBox({
                    id: "visibleCheckBoxID",
                    checked: checkBoxStatus
                }, domConstruct.create("div", {
                    "id": "isVisible"
                }, visibleCheckBoxDiv));
                this.visibleCheckBox.title = this.nls.isvisible;
            }
            if (this.outputAdditionalProperty) {
                // Looping for all dives child nodes and fetching data
                for (i = 0; i < this.outputAdditionalProperty.childNodes.length; i++) {
                    displayName = domAttr.get(this.outputAdditionalProperty.childNodes[i], "displayName");
                    for (j = 0; j < this.saveToLayerArray.length; j++) {
                        // Checking for id of symbol color container with symbol container id
                        if (this.saveToLayerArray[j].id === "saveToLayer_" + i) {
                            isChecked = this.saveToLayerArray[j].div.checked;
                            break;
                        }
                    }
                    if (displayName && this.outageAreaDropDown.value === displayName && isChecked) {
                        showFildMap = true;
                    }
                }
            }
            if (showFildMap) {
                this._showFieldMapDiv(outageLayerName);
            } else {
                if (this.divParamvalue) {
                    domConstruct.empty(this.divParamvalue);
                }
            }
            self = this;
            this.outageAreaDropDown.on('change', function (evt) {
                if (this.outputAdditionalProperty) {
                    // Looping for all dives child nodes and fetching data
                    for (i = 0; i < this.outputAdditionalProperty.childNodes.length; i++) {
                        for (j = 0; j < this.saveToLayerArray.length; j++) {
                            // Checking for id of symbol color container with symbol container id
                            if (this.saveToLayerArray[j].id === "saveToLayer_" + i) {
                                isChecked = this.saveToLayerArray[j].div.checked;
                                break;
                            }
                        }
                        if (evt && this.outageAreaDropDown.value === evt && isChecked) {
                            showFildMap = true;
                        }
                    }
                }
                if (showFildMap) {
                    self._showFieldMapDiv(outageLayerName);
                } else {
                    if (this.divParamvalue) {
                        domConstruct.empty(this.divParamvalue);
                    }
                }
            });
        },

        /**
        * This function shows the field mapping
        * @param {object} outageLayerName
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _showFieldMapDiv: function (outageLayerName) {
            var layer, keyValue, i, j, t, k, outageAreaParamValue, outPutArrayLength, outageAreaFieldNameDropDown, self, fieldMap, e, index, arrayIndex;
            // Calling find layer function to get layer from selected layer name
            layer = this.findLayer(this.map.itemInfo.itemData.operationalLayers, outageLayerName);
            // Checking for layer
            this.paramNameArray = [];
            this.fieldNameArray = [];
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
                if (this.config && this.config.geoprocessing && this.config.geoprocessing.outputs) {
                    // looping for geoprocessing outputs
                    for (e = 0; e < this.config.geoprocessing.outputs.length; e++) {
                        // If geoprocessing outputs type is overview then change the config value in check box
                        if (this.config.geoprocessing.outputs[e].type === "Overview" && this.config.geoprocessing.outputs[e].fieldMap.length > 0) {
                            if (this.outageAreaDropDown.value === this.config.geoprocessing.outputs[e].paramName) {
                                fieldMap = this.config.geoprocessing.outputs[e].fieldMap;
                            }
                        }
                    }
                }
                self = this;
                outPutArrayLength = this.outputParametersArray.length - 1;
                array.forEach(this.outputParametersArray, lang.hitch(this, function (outPutArray, indexNumber) {
                    // Checking for array to execute not for the last index
                    if (outPutArrayLength !== indexNumber) {
                        domConstruct.create("label", { "class": "esriCTFieldName ", "innerHTML": this.nls.OutageFieldName }, this.divParamvalue);
                        // Creation of select of outage area
                        outageAreaFieldNameDropDown = new Select({ "class": "esriCTOutageAreaFieldName" }, domConstruct.create("input", {}, this.divParamvalue));
                        // Setting the index attribute in outage area field name drop down
                        domAttr.set(outageAreaFieldNameDropDown, "index", indexNumber);
                        outageAreaFieldNameDropDown.title = this.nls.OutageFieldName;
                        domConstruct.create("label", { "class": "esriCTParamValue", "innerHTML": this.nls.OutageParamName }, this.divParamvalue);
                        // Creation of select of outage area
                        outageAreaParamValue = new Select({ "class": "esriCTOutageAreaParamValue" }, domConstruct.create("input", {}, this.divParamvalue));
                        domAttr.set(outageAreaParamValue, "index", indexNumber);
                        outageAreaParamValue.title = this.nls.OutageFieldName;
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
        * @memberOf widgets/isolation-trace/settings/settings
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
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _createFinalObject: function () {
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
        * @memberOf widgets/isolation-trace/settings/settings
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
        },

        /**
        * This function is called to change the skippable status.
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _onSkipChange: function (evt) {
            var SkipChangeDiv;
            // if evt object and parent exist then toggle hide/show of skippable field dropdown
            if (evt && evt.currentTarget && evt.currentTarget.offsetParent && evt.currentTarget.offsetParent.parentNode) {
                SkipChangeDiv = query(".skippableDropdownDiv", evt.currentTarget.offsetParent.parentNode);
                domClass.toggle(SkipChangeDiv[0], "esriCTHidden");
            }
        },

        /**
        * This function is called to change the save layer status.
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _onLayerChange: function (evt) {
            var targetLayerDiv;
            // if evt object and parent exist then toggle hide/show of target layer dropdown
            if (evt && evt.currentTarget && evt.currentTarget.offsetParent && evt.currentTarget.offsetParent.parentNode) {
                targetLayerDiv = query(".outputTargetLayer", evt.currentTarget.offsetParent.parentNode);
                domClass.toggle(targetLayerDiv[0], "esriCTHidden");
            }
        },


        /**
        * This function creates all additional fields in Output parameter section.
        * @param{string} index of div
        * @param{string} value of tool tip
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _createAdditionalOutputParamDiv: function (val, tooltipValue) {
            var j, n, summaryTextDiv, summaryText, minScale, maxScale, select, exportCSV, saveToLayer, operationalLayer = [], labelTextDiv, labelText, saveToLayerObject,
                skippableFieldSelectArr = [], outputData, tooltipText, tooltipTextDiv, skippableDiv, skippableCheckDiv, skippableFieldDiv, panelFieldDiv, displayName,
                panelTextDiv, outputSymbolDiv, objSymbol, container, displayTextDiv, displayText, skippableCheckObject, exportCSVObject, symbolChooserObject, inputLabelText, skippableConfigData, skippableFieldSelect, displayTextConfigData, minScaleConfigData, maxScaleConfigData, exportCSVConfigData, selectedValueIdval, summaryTextConfigData, saveToLayerConfigData;
            // display first block of output parameters by default and hide rest of the all
            if (val === 0) {
                outputData = domConstruct.create("div", { "id": "outputdetail_" + val }, this.outputAdditionalProperty);
            } else {
                outputData = domConstruct.create("div", { "id": "outputdetail_" + val, "class": "esriCTHidden" }, this.outputAdditionalProperty);
            }
            // Div creation for Label
            labelTextDiv = domConstruct.create("div", { "class": "field esriCTHidden", "title": this.nls.inputLabel }, outputData);
            domConstruct.create("label", { "innerHTML": this.nls.inputLabel }, labelTextDiv);
            labelText = new ValidationTextBox({ "class": "common-input", required: true, value: this.outputParametersArray[val].name }, domConstruct.create("input", { "id": "paramNameText_" + val }, labelTextDiv));
            labelText.title = this.nls.inputLabel;
            // End of div creation for Label
            inputLabelText = this.config && this.config.geoprocessing && this.config.geoprocessing.outputs[val]
                           && this.config.geoprocessing.outputs[val].panelText ? this.config.geoprocessing.outputs[val].panelText : "";
            // panel text
            panelFieldDiv = domConstruct.create("div", { "class": "field", "title": this.nls.inputLabel }, outputData);
            domConstruct.create("label", { "innerHTML": this.nls.inputLabel }, panelFieldDiv);
            panelTextDiv = new ValidationTextBox({ "class": "common-input", required: true, value: inputLabelText }, domConstruct.create("input", { "id": "panelText_" + val }, panelFieldDiv));
            panelTextDiv.title = this.nls.inputLabel;
            // panel text end

            // Div creation for ToolTip text
            tooltipTextDiv = domConstruct.create("div", { "class": "field esriCTHidden", "title": this.nls.inputTooltip }, outputData);
            domConstruct.create("label", { "innerHTML": this.nls.inputTooltip }, tooltipTextDiv);
            tooltipText = new ValidationTextBox({ "class": "common-input", required: true }, domConstruct.create("input", { "id": "outputTooltipText_" + val, "value": tooltipValue }, tooltipTextDiv));
            tooltipText.title = this.nls.inputTooltip;
            //End of Div creation for ToolTip text

            // skippabble div and check box creation
            skippableDiv = domConstruct.create("div", { "class": "field", "title": this.nls.skip }, outputData);
            skippableConfigData = this.config && this.config.geoprocessing && this.config.geoprocessing.outputs.length > 0 && this.config.geoprocessing.outputs[val].bypassDetails && this.config.geoprocessing.outputs[val].bypassDetails.skipable ? this.config.geoprocessing.outputs[val].bypassDetails.skipable : false;
            skippableCheckDiv = new CheckBox({ checked: skippableConfigData }, domConstruct.create("div", { "id": "skippable_" + val }, skippableDiv));
            skippableCheckObject = {};
            skippableCheckObject = { "id": "skippable_" + val, "div": skippableCheckDiv };
            this.skippableCheckArray.push(skippableCheckObject);
            skippableCheckDiv.title = this.nls.skip;
            domConstruct.create("label", { "class": "esriCTFloatLeftCommon", "innerHTML": this.nls.skip }, skippableDiv);
            // skippabble end
            // skippable dropdown cration
            skippableFieldDiv = domConstruct.create("div", { "class": "field skippableDropdownDiv esriCTHidden", "title": this.nls.skippableField }, outputData);
            domConstruct.create("label", { "innerHTML": this.nls.skippableField }, skippableFieldDiv);
            this.skippableFieldSelect = new Select({ style: { width: "70%", height: "30px"} });
            this.skippableFieldSelect.placeAt(skippableFieldDiv);
            // Creation and storing skippable field select for get config function
            skippableFieldSelect = {};
            skippableFieldSelect = { "id": "skipableSelect_" + val, "div": this.skippableFieldSelect };
            this.skippableFieldSelectArray.push(skippableFieldSelect);
            this.skippableFieldSelect.startup();
            skippableFieldSelectArr = this.outputParametersArray[val].defaultValue.fields;
            // if skippable dropdown is created then populates the web map list in dropdown options
            if (this.skippableFieldSelect && skippableFieldSelectArr && skippableFieldSelectArr.length > 0) {
                // Loop for populating the options in dropdown list
                for (j = 0; j < skippableFieldSelectArr.length; j++) {
                    this.skippableFieldSelect.addOption({
                        value: skippableFieldSelectArr[j].name,
                        label: skippableFieldSelectArr[j].name,
                        selected: false
                    });
                }
            }
            // Checkign for skippable config data for fetching data
            if (skippableConfigData) {
                domClass.remove(skippableFieldDiv, "esriCTHidden");
                skippableConfigData = this.config && this.config.geoprocessing && this.config.geoprocessing.outputs.length > 0 && this.config.geoprocessing.outputs[val].bypassDetails && this.config.geoprocessing.outputs[val].bypassDetails.IDField ? this.config.geoprocessing.outputs[val].bypassDetails.IDField : "";
                if (skippableConfigData !== "") {
                    this.skippableFieldSelect.set({
                        value: skippableConfigData,
                        label: skippableConfigData
                    });
                }
            }
            // skippable dropdown end
            this.own(on(skippableCheckDiv, "click", lang.hitch(this, this._onSkipChange)));
            summaryTextConfigData = this.config && this.config.geoprocessing && this.config.geoprocessing.outputs[val]
                           && this.config.geoprocessing.outputs[val].summaryText ? this.config.geoprocessing.outputs[val].summaryText : "";
            // Div creation summary Text Div
            summaryTextDiv = domConstruct.create("div", { "class": "field", "title": this.nls.outputSummary }, outputData);
            domConstruct.create("label", { "innerHTML": this.nls.outputSummary }, summaryTextDiv);
            summaryText = new ValidationTextBox({ "class": "common-input", required: true, value: summaryTextConfigData }, domConstruct.create("input", { "id": "summaryText_" + val }, summaryTextDiv));
            summaryText.title = this.nls.outputSummary;
            // End of Div creation summary Text Div
            // Div creation display Text Div
            displayTextConfigData = this.config && this.config.geoprocessing && this.config.geoprocessing.outputs[val]
                           && this.config.geoprocessing.outputs[val].displayText ? this.config.geoprocessing.outputs[val].displayText : "";
            displayTextDiv = domConstruct.create("div", { "class": "field", "title": this.nls.outputDisplay }, outputData);
            domConstruct.create("label", { "innerHTML": this.nls.outputDisplay }, displayTextDiv);
            displayText = new ValidationTextBox({ "class": "common-input", required: true, value: displayTextConfigData }, domConstruct.create("input", { "id": "displayText_" + val }, displayTextDiv));
            displayText.title = this.nls.outputDisplay;
            // End of Div creation display Text Div
            // stars of summary text box creation
            summaryTextDiv = domConstruct.create("div", { "class": "field", "title": this.nls.outputminScale }, outputData);
            domConstruct.create("label", { "innerHTML": this.nls.outputminScale }, summaryTextDiv);
            minScaleConfigData = this.config && this.config.geoprocessing && this.config.geoprocessing.outputs[val]
                           && this.config.geoprocessing.outputs[val].MinScale ? this.config.geoprocessing.outputs[val].MinScale : 0;
            minScale = new NumberTextBox({ "class": "common-input", value: minScaleConfigData }, domConstruct.create("input", { "id": "minScale_" + val }, summaryTextDiv));
            minScale.title = this.nls.outputminScale;
            summaryTextDiv = domConstruct.create("div", { "class": "field", "title": this.nls.outputminScale }, outputData);
            domConstruct.create("label", { "innerHTML": this.nls.outputmaxScale }, summaryTextDiv);
            // Max scale number text box creation
            maxScaleConfigData = this.config && this.config.geoprocessing && this.config.geoprocessing.outputs[val]
                           && this.config.geoprocessing.outputs[val].MaxScale ? this.config.geoprocessing.outputs[val].MaxScale : 0;

            maxScale = new NumberTextBox({ "class": "common-input", value: maxScaleConfigData }, domConstruct.create("input", { "id": "maxScale_" + val }, summaryTextDiv));
            maxScale.title = this.nls.outputmaxScale;
            summaryTextDiv = domConstruct.create("div", { "class": "field", "title": this.nls.outputExport }, outputData);
            // Export to csv creation
            exportCSVConfigData = this.config && this.config.geoprocessing && this.config.geoprocessing.outputs.length > 0 && this.config.geoprocessing.outputs[val] ? this.config.geoprocessing.outputs[val].exportToCSV : true;
            exportCSV = new CheckBox({ checked: exportCSVConfigData }, domConstruct.create("div", { "id": "exportCSV_" + val }, summaryTextDiv));
            exportCSV.title = this.nls.outputExport;
            exportCSVObject = { "id": "exportCSV_" + val, "div": exportCSV };
            this.exportCSVArray.push(exportCSVObject);
            domConstruct.create("label", { "class": "esriCTFloatLeftCommon", "innerHTML": this.nls.outputExport }, summaryTextDiv);
            summaryTextDiv = domConstruct.create("div", { "class": "field", "title": this.nls.outputLayer }, outputData);
            // Save to layer check box and div creation
            saveToLayerConfigData = this.config && this.config.geoprocessing && this.config.geoprocessing.outputs.length > 0 && this.config.geoprocessing.outputs[val].saveToLayer !== "" ? true : false;
            saveToLayer = new CheckBox({ checked: saveToLayerConfigData }, domConstruct.create("div", { "id": "saveToLayer_" + val }, summaryTextDiv));
            this.outageArea.isChecked = saveToLayer.checked;
            saveToLayer.title = this.nls.outputLayer;
            domConstruct.create("label", { "class": "esriCTFloatLeftCommon", "innerHTML": this.nls.outputLayer }, summaryTextDiv);
            // if map object available and web map list available on operationalLayer Object
            if (this.map && this.map.itemInfo && this.map.itemInfo.itemData && this.map.itemInfo.itemData.operationalLayers) {
                summaryTextDiv = domConstruct.create("div", { "class": "field outputTargetLayer esriCTHidden", "id": "outputTargetLayer_" + val, "title": this.nls.outputLayer }, outputData);
                domConstruct.create("label", { "innerHTML": this.nls.outputLayerType }, summaryTextDiv);
                select = new Select({ style: { width: "70%", height: "30px" }, "id": "selectLayer_" + val });
                select.placeAt(summaryTextDiv);
                select.startup();
                operationalLayer = this.map.itemInfo.itemData.operationalLayers;
                // loop's populates Dropdown values
                for (n = 0; n < operationalLayer.length; n++) {
                    if (n === 0) {
                        this.outageArea.saveToLayer = operationalLayer[n].id;
                        domAttr.set(saveToLayer, "value", operationalLayer[n].id);
                    }
                    select.addOption({
                        value: operationalLayer[n].id,
                        label: operationalLayer[n].title,
                        selected: false
                    });
                }
            }
            if (saveToLayer.checked) {
                domClass.remove(summaryTextDiv, "esriCTHidden");
                selectedValueIdval = this.config && this.config.geoprocessing && this.config.geoprocessing.outputs.length > 0 && this.config.geoprocessing.outputs[val].saveToLayer !== "" ? this.config.geoprocessing.outputs[val].saveToLayer : false;
                if (selectedValueIdval) {
                    select.set({
                        value: selectedValueIdval,
                        label: selectedValueIdval
                    });
                }
            }
            //if symbol geometry exist
            if (this.outputParametersArray[val].defaultValue.geometryType) {
                outputSymbolDiv = domConstruct.create("div", { "class": "field", "title": this.nls.symbol }, outputData);
                domConstruct.create("label", { "innerHTML": this.nls.symbol }, outputSymbolDiv);
                objSymbol = {};
                // if symbols parameter available in output parameters then takes symbol details
                // otherwise using geometry type for fetching the symbol details
                if (this.config && this.config.geoprocessing && this.config.geoprocessing.outputs.length > val && this.config.geoprocessing.outputs[val].symbol) {
                    objSymbol.symbol = jsonUtils.fromJson(this.config.geoprocessing.outputs[val].symbol);
                } else {
                    if (this.outputParametersArray[val].symbol) {
                        objSymbol.symbol = jsonUtils.fromJson(this.outputParametersArray[val].symbol);
                    } else {
                        objSymbol.type = utils.getSymbolTypeByGeometryType(this.outputParametersArray[val].defaultValue.geometryType);
                    }
                }

                container = domConstruct.create("div", {}, outputData);
                this.symbolChooser = new SymbolChooser(objSymbol, container);
                symbolChooserObject = { "id": "symbolContainer_" + val, "div": this.symbolChooser };
                this.symbolChooserArrayForOutPut.push(symbolChooserObject);
                this.symbolChooser.startup();
            }

            this.own(on(saveToLayer, "click", lang.hitch(this, this._onLayerChange)));
            select.on('change', lang.hitch(this, function (evt) {
                this.outageArea.saveToLayer = evt;
                domAttr.set(saveToLayer, "value", evt);
                this.outageArea.isChecked = saveToLayer.checked;
            }));
            displayName = domAttr.get(this.outputAdditionalProperty.childNodes[val], "displayName");
            saveToLayerObject = { "id": "saveToLayer_" + val, "div": saveToLayer, "displayName": displayName };
            this.saveToLayerArray.push(saveToLayerObject);
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
        * This function sets the Input Parameters in config
        * @return {object} returns the config object
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _setOtherParameterValue: function () {
            //  Checking for config object and highlighter details and setting value
            if (this.config && this.config.highlighterDetails && this.config.highlighterDetails.image) {
                domAttr.set(dom.byId("txtImageUrl"), "value", this.config.highlighterDetails.image);
                domAttr.set(dom.byId("spinnerImgHeight"), "value", this.config.highlighterDetails.height);
                domAttr.set(dom.byId("spinnerImgWidth"), "value", this.config.highlighterDetails.width);
                domAttr.set(dom.byId("spinnerImgTimeout"), "value", this.config.highlighterDetails.timeout);
            }
        },

        /**
        * This function creates the Input Parameters in config
        * @return {object} returns the config ouject
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _createInputParameters: function (config) {
            var i, j, inputParam = {}, selectedInputValue = "", symbolContainer;
            this.config.geoprocessing.inputs = [];
            this.config.geoprocessing.inputs.length = 0;
            // setting url in geoprocessing array
            this.config.geoprocessing.url = this.url;
            // Checking for input final div for child nodes
            if (this.inputProperty) {
                // Looping for all dives child nodes and fetching data
                for (i = 0; i < this.inputProperty.childNodes.length; i++) {
                    // Looping for symbol chooser array for fetching symbol container div
                    for (j = 0; j < this.symbolChooserArray.length; j++) {
                        // Checking for id of symbol color container with symbol container id
                        if (this.symbolChooserArray[j].id === "symbolContainer_" + i) {
                            symbolContainer = this.symbolChooserArray[j].div;
                            break;
                        }
                    }
                    // Looping for select drop down array for fetching div value
                    for (j = 0; j < this.selectedInputArray.length; j++) {
                        // Checking for id of select drop down id
                        if (this.selectedInputArray[j].id === "selectType_" + i) {
                            selectedInputValue = dijit.byId(this.selectedInputArray[j].id).get('value');
                            break;
                        }
                    }
                    // Checking for symbol container
                    if (symbolContainer) {
                        // Creating final object for input parameter
                        inputParam = { "paramName": dom.byId("lableText_" + i).value, "type": selectedInputValue, "symbol": symbolContainer.getSymbol().toJson() };
                        // Pushing value in geoprocessing input
                        this.config.geoprocessing.inputs.push(inputParam);
                    }
                }
            }
            // logging config geo processing data
            return this.config.geoprocessing;
        },

        /**
        * This function creates the output Parameters in config file
        * return {object} returns the config object
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _createsOutputParameterValue: function () {
            var i, j, outputParam = {}, domDisplayName, cloneFieldMapArray, bypassDetails, skippableFieldSelectValue, skippableCheck, symbolContainer, isOverViewMap, exportCSVCheckBoxStatus, saveToLayerCheckBox, saveToLayerCheckBoxStatus, selectedInputValue = "", fieldMapArray = [], saveToLayerName;
            if (this.config && this.config.geoprocessing && this.config.geoprocessing.outputs) {
                this.config.geoprocessing.outputs = [];
                this.config.geoprocessing.outputs.length = 0;
                // Checking for div child nodes
                if (this.outputAdditionalProperty) {
                    // Looping for all dives child nodes and fetching data
                    for (i = 0; i < this.outputAdditionalProperty.childNodes.length; i++) {
                        // Clearing length of array
                        for (j = 0; j < this.exportCSVArray.length; j++) {
                            // Checking for id of symbol color container with symbol container id
                            if (this.exportCSVArray[j].id === "exportCSV_" + i) {
                                exportCSVCheckBoxStatus = this.exportCSVArray[j].div.checked ? true : false;
                                break;
                            }
                        }
                        // Looping for symbol chooser Array for getting symbol chooser object
                        for (j = 0; j < this.symbolChooserArrayForOutPut.length; j++) {
                            // Checking for id of symbol color container with symbol container id
                            if (this.symbolChooserArrayForOutPut[j].id === "symbolContainer_" + i) {
                                symbolContainer = this.symbolChooserArrayForOutPut[j].div;
                                break;
                            }
                        }
                        // Looping for skippabale check array for getting  skippable check box status
                        for (j = 0; j < this.skippableCheckArray.length; j++) {
                            // Checking for id of symbol color container with symbol container id
                            if (this.skippableCheckArray[j].id === "skippable_" + i) {
                                skippableCheck = this.skippableCheckArray[j].div.checked;
                                break;
                            }
                        }

                        isOverViewMap = false;
                        // Looping for save to layer array for getting save to layer check box status
                        for (j = 0; j < this.saveToLayerArray.length; j++) {
                            saveToLayerCheckBox = false;
                            domDisplayName = "";
                            // Checking for id of symbol color container with symbol container id
                            if (this.saveToLayerArray[j].id === "saveToLayer_" + i) {
                                saveToLayerName = domAttr.get(this.saveToLayerArray[j].div, "value");
                                saveToLayerCheckBoxStatus = this.saveToLayerArray[j].div.checked ? saveToLayerName : "";
                                // Getting the outage select container selected value
                                domDisplayName = domAttr.get(this.outputAdditionalProperty.childNodes[i], "displayName");
                                // Checking for outage area drop down value with outage selected container selected value
                                if (this.outageAreaDropDown.value === domDisplayName) {
                                    isOverViewMap = true;
                                }
                                // Checking for outage area drop down value and save to layer chedk box checked status
                                if (saveToLayerCheckBoxStatus && this.outageAreaDropDown.value === domDisplayName) {
                                    saveToLayerCheckBox = true;
                                }
                                break;
                            }
                        }
                        // Looping for select drop down array for fetching div value
                        for (j = 0; j < this.skippableFieldSelectArray.length; j++) {
                            // Checking for id of select drop down id
                            if (this.skippableFieldSelectArray[j].id === "skipableSelect_" + i) {
                                skippableFieldSelectValue = this.skippableFieldSelectArray[j].div.value;
                                break;
                            }
                        }
                        // Clearing all array used for befor use
                        fieldMapArray.length = 0;
                        // Setting value for type attribute in output config
                        selectedInputValue = "Result";
                        // Checking for symbol container exsistence
                        if (symbolContainer) {
                            // Creating bypas details object
                            bypassDetails = { "skipable": skippableCheck ? true : false, "IDField": skippableCheck ? skippableFieldSelectValue : "" };
                            // Creating ouput final object with all the values
                            outputParam = { "paramName": dom.byId("paramNameText_" + i).value, "type": selectedInputValue, "panelText": dom.byId("panelText_" + i).value, "summaryText": dom.byId("summaryText_" + i).value, "displayText": dom.byId("displayText_" + i).value, "MinScale": dom.byId("minScale_" + i).value, "MaxScale": dom.byId("maxScale_" + i).value, "symbol": symbolContainer.getSymbol().toJson(), "exportToCSV": exportCSVCheckBoxStatus, "saveToLayer": saveToLayerCheckBoxStatus, "bypassDetails": bypassDetails };
                            // Checking if the output value is of polygon type gemetory then set the output type to "Overview"
                            if (isOverViewMap) {
                                outputParam.type = "Overview";
                                outputParam.visible = this.visibleCheckBox.checked ? true : false;
                            }
                            // Checking for field map value is enabled if enabled then set field to map attribute and set visible to true
                            if (saveToLayerCheckBox) {
                                cloneFieldMapArray = "";
                                // Getting the field map array value from all drop down value
                                fieldMapArray = this._createFinalObject();
                                // Cloning the feld map array for storing it in field to map value
                                cloneFieldMapArray = dojo.clone(fieldMapArray);
                                // Creating field to map object and inserting value
                                outputParam.fieldMap = cloneFieldMapArray;
                            }
                            // Pushing value in geoprocessing output parameter
                            this.config.geoprocessing.outputs.push(outputParam);
                        }
                    }
                }
                // Returning geoprocessing data to config file
                return this.config.geoprocessing;
            }
        },

        /**
        * This function creates the other  parameters in config file
        * @return {object} returns highlighter details object
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _createsOtherParameterValue: function () {
            // Setting value in highlighter details object
            this.config.highlighterDetails.image = dom.byId("txtImageUrl") ? dom.byId("txtImageUrl").value : "";
            this.config.highlighterDetails.height = dom.byId("spinnerImgHeight") ? dom.byId("spinnerImgHeight").value : "";
            this.config.highlighterDetails.width = dom.byId("spinnerImgWidth") ? dom.byId("spinnerImgWidth").value : "";
            this.config.highlighterDetails.timeout = dom.byId("spinnerImgTimeout") ? dom.byId("spinnerImgTimeout").value : "";
            return this.config.highlighterDetails;
        },

        /**
        * This function sets config data in dom nodes
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        setConfig: function () {
            // Set config for other parameters value
            this._setOtherParameterValue();
        },

        /**
        * This function gets and create config data in config file.
        * @return {object} Object of config
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        getConfig: function () {
            var highlighterDetails = {}, inputArray = [], outputArray = [], geoprocessingObject = {};
            // Setting object for highlighted details
            highlighterDetails = { "image": "", "height": "", "width": "", "timeout": "" };
            // Setting geoprocessing object
            geoprocessingObject = { "url": "", "inputs": inputArray, "outputs": outputArray };
            // Setting config object
            this.config = { "highlighterDetails": highlighterDetails, "geoprocessing": geoprocessingObject };
            // Get config for input parameters
            this._createInputParameters();
            // Get config for Output parameters
            this._createsOutputParameterValue();
            // Get config for others parameters
            this._createsOtherParameterValue();
            return this.config;
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
