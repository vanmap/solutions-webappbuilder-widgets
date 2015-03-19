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
    "dojo/dom-attr",
    "dojo/string",
    "jimu/dijit/SymbolChooser",
    "jimu/utils",
    "esri/symbols/jsonUtils",
    "dojo/text!./outputSetting.html",
    "dojo/text!./outputData.html",
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
    domAttr,
    string,
    SymbolChooser,
    utils,
    jsonUtils,
    outputSetting,
    outputDataString,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: outputDataString,
        outputSettingString: outputSetting,
        startup: function () {
            this.inherited(arguments);
        },
        postCreate: function () {
            this._createOutputPanel();
        },

        /**
        * This function creates left title pane menu and binds the respective click events.
        * @memberOf widgets/isolation-trace/settings/outputSetting
        */
        _createOutputPanel: function () {
            var nlsTemp = string.substitute(this.outputSettingString, this);
            this.outputDataNode = domConstruct.toDom(nlsTemp).childNodes[0];

            on(this.outputDataNode, "click", lang.hitch(this, function (evt) {
                this.outputFieldClicked(this);
            }));
            this.parentContainer.appendChild(this.outputDataNode);
            this._createOutputDataPanel();
        },

        /**
        * This function handles output left menu panel click event.
        * @memberOf widgets/isolation-trace/settings/outputSetting
        */
        outputFieldClicked: function (widgetNode) {
            return;
        },

        /**
        * This function creates output config parameters.
        * @memberOf widgets/isolation-trace/settings/outputSetting
        */
        getOutputForm: function () {
            var isOverViewMap, selectedInputValue, bypassDetails, outputParam;

            // Creating bypas details object
            bypassDetails = { "skipable": this.skippable.checked ? true : false, "IDField": this.skippable.checked ? this.inputTypeData.value : "" };

            isOverViewMap = false;
            selectedInputValue = "Result";

            // Creating ouput final object with all the values
            outputParam = {
                "paramName": this.data.name,
                "type": selectedInputValue,
                "panelText": this.outputLabelData.value,
                "toolTip": this.outputTooltipData.value,
                "summaryText": this.outputSummaryText.value,
                "displayText": this.outputDisplayText.value,
                "MinScale": this.outputMinScaleData.value,
                "MaxScale": this.outputMaxScaleData.value,
                "exportToCSV": this.outputExport.checked,
                "saveToLayer": this.outputLayer.checked ? this.outputLayerType.value : "",
                "symbol": this.symbolChooser.getSymbol().toJson()
            };
            // if bypassDetails created for the outage area
            if (bypassDetails) {
                outputParam.bypassDetails = bypassDetails;
            }
            // Checking if the output value is of polygon type gemetory then set the output type to "Overview"
            if (isOverViewMap) {
                outputParam.type = "Overview";
                outputParam.visible = this.visibleCheckBox.checked ? true : false;
            }
            return outputParam;
        },

        /**
        * This function is called to display input task details.
        * @memberOf widgets/isolation-trace/settings/outputSetting
        */
        _createOutputDataPanel: function () {
            var i, j, n, objSymbol, skippableFieldSelectArr, operationalLayer = [], helpTextData;
            this.outageArea = {};
            /*if (this.data && this.data.defaultValue && this.data.defaultValue.geometryType && this.data.defaultValue.geometryType === "esriGeometryPoint") {
            domClass.remove(this.skippableCheckboxBlock, "esriCTHidden");
            }*/
            this.outputLabelData.id = "outputLabelData_" + this.ObjId;
            
            skippableFieldSelectArr = this.data.defaultValue.fields;
            this.inputTypeData.startup();
            // if skippable dropdown is created then populates the web map list in dropdown options
            if (this.inputTypeData && skippableFieldSelectArr && skippableFieldSelectArr.length > 0) {

                helpTextData = "";
                //this.outputSummaryHelpText.innerHTML = "";
                this.helpTextDataArray = [];
                helpTextData += "(";
                // Loop for populating the options in dropdown list
                for (j = 0; j < skippableFieldSelectArr.length; j++) {
                    this.inputTypeData.addOption({
                        value: skippableFieldSelectArr[j].name,
                        label: skippableFieldSelectArr[j].name,
                        selected: false
                    });
                    this.helpTextDataArray[j] = skippableFieldSelectArr[j].name;
                    helpTextData += "{" + skippableFieldSelectArr[j].name;
                    // if loop index is second last then 
                    if (j !== (skippableFieldSelectArr.length - 1)) {
                        helpTextData += "}, ";
                    } else {
                        helpTextData += "}";
                    }
                }
                helpTextData += ")";

                this.outputDisplayHelpText.innerHTML = helpTextData;
            }
            this.outputTooltipData.id = "tooltipText_" + this.ObjId;
            this.outputSummaryText.id = "summaryText_" + this.ObjId;
            this.outputDisplayText.id = "displayText_" + this.ObjId;
            this.outputMinScaleData.id = "minScale_" + this.ObjId;
            this.outputMaxScaleData.id = "maxScale_" + this.ObjId;
            this.outputExport.id = "exportCSV_" + this.ObjId;
            this.outputLayer.id = "saveToLayer_" + this.ObjId;

            // save to Layer type Dropdown
            if (this.map && this.map.itemInfo && this.map.itemInfo.itemData && this.map.itemInfo.itemData.operationalLayers) {
                this.outputLayerType.startup();
                operationalLayer = this.map.itemInfo.itemData.operationalLayers;
                // loop's populates Dropdown values
                for (n = 0; n < operationalLayer.length; n++) {
                    // if layer type is feature Layer then
                    if (operationalLayer[n].layerType && operationalLayer[n].layerType === "ArcGISFeatureLayer") {
                        // for first index of loop set default value
                        if (n === 0) {
                            this.outageArea.saveToLayer = operationalLayer[n].id;
                            domAttr.set(this.outputLayer, "value", operationalLayer[n].id);
                        }
                        this.outputLayerType.addOption({
                            value: operationalLayer[n].id,
                            label: operationalLayer[n].title,
                            selected: false
                        });
                    }
                }
            }
            // if output config object is not null
            if (this.outputConfig) {
                this.outputLabelData.set("value", this.outputConfig.panelText);
                // if output config object is not null and bypass deatils available for outage area field mapping
                if (this.outputConfig && this.outputConfig.bypassDetails && this.outputConfig.bypassDetails.skipable) {
                    this.skippable.checked = this.outputConfig.bypassDetails.skipable;
                    domClass.add(this.skippable.checkNode, "checked");
                    domClass.remove(this.skippableDropdownDiv, "esriCTHidden");
                    // loop for setting the dropdown value as in available in config
                    for (i = 0; i < this.inputTypeData.options.length; i++) {
                        if (this.inputTypeData.options[i].value === this.outputConfig.bypassDetails.IDField) {
                            this.inputTypeData.set("value", this.inputTypeData.options[i].value);
                        }
                    }
                }

                this.outputTooltipData.set("value", this.outputConfig.toolTip);
                this.outputSummaryText.set("value", this.outputConfig.summaryText);
                this.outputDisplayText.set("value", this.outputConfig.displayText);
                this.outputMinScaleData.set("value", ((this.outputConfig && this.outputConfig.MinScale) ? this.outputConfig.MinScale : 0));
                this.outputMaxScaleData.set("value", ((this.outputConfig && this.outputConfig.MaxScale) ? this.outputConfig.MaxScale : 0));
                // if exportToCSV is not null 
                if (this.outputConfig.exportToCSV) {
                    this.outputExport.checked = this.outputConfig.exportToCSV;
                    domClass.add(this.outputExport.checkNode, "checked");
                }
                // loop for setting selected target Layer
                for (i = 0; i < this.outputLayerType.options.length; i++) {
                    // if layers in dropdown is same as already exist in config file
                    if (this.outputLayerType.options[i].value === this.outputConfig.saveToLayer) {
                        this.outputLayerType.set("value", this.outputLayerType.options[i].value);
                    }
                }
                // condition  to check whether save to layer set or not in configuration
                if (this.outputConfig.saveToLayer) {
                    this.outputLayer.checked = this.outputConfig.saveToLayer;
                    domClass.add(this.outputLayer.checkNode, "checked");
                    domClass.remove(this.selectOutputLayerType, "esriCTHidden");
                }
            }

            //if symbol geometry exist
            if (this.data.defaultValue.geometryType) {
                this.data.featureSetMode = 'draw';

                objSymbol = {};
                // if symbols parameter available in input parameters then takes symbol details
                // otherwise using geometry type for fetching the symbol details
                if (this.outputConfig && this.outputConfig.symbol) {
                    objSymbol.symbol = jsonUtils.fromJson(this.outputConfig.symbol);
                } else {
                    // if symbols parameter available in input parameters then takes symbol details
                    // otherwise using geometry type for fetching the symbol details
                    if (this.data.symbol) {
                        objSymbol.symbol = jsonUtils.fromJson(this.data.symbol);
                    } else {
                        objSymbol.type = utils.getSymbolTypeByGeometryType(this.data.defaultValue.geometryType);
                    }
                }
                this.symbolChooser = new SymbolChooser(objSymbol, domConstruct.create("div", {}, this.symbolData));
                this.symbolChooser.startup();
            }
            // skippable dropdown end


            this.outageArea.isChecked = this.outputLayer.checked;
            this.own(on(this.skippable, "click", lang.hitch(this, this._onSkipChange)));
            this.own(on(this.outputLayer, "click", lang.hitch(this, this._onLayerChange)));
            on(this.outputLayer, "click", lang.hitch(this, function (evt) {
                this.layerChangeHandler(this);
            }));
            on(this.outputLayerType, "change", lang.hitch(this, function (evt) {
                this.layerChangeHandler(this);
            }));
            this.outputLayerType.on('change', lang.hitch(this, function (evt) {
                this.outageArea.saveToLayer = evt;
                domAttr.set(this.outputLayer, "value", evt);
                this.outageArea.isChecked = this.outputLayer.checked;
            }));
        },

        /**
        * This function handles the on change and click events on skippable checkbox and dropdown.
        * @memberOf widgets/isolation-trace/settings/outputSetting
        */
        layerChangeHandler: function () {
            return;
        },

        /**
        * This function is called to change the skippable status.
        * @memberOf widgets/isolation-trace/settings/outputSetting
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
        * @memberOf widgets/isolation-trace/settings/outputSetting
        **/
        _onLayerChange: function (evt) {
            var targetLayerDiv;
            this.outageArea.isChecked = this.outputLayer.checked;
            // if evt object and parent exist then toggle hide/show of target layer dropdown
            if (evt && evt.currentTarget && evt.currentTarget.offsetParent && evt.currentTarget.offsetParent.parentNode) {
                targetLayerDiv = query(".outputTargetLayer", evt.currentTarget.offsetParent.parentNode);
                domClass.toggle(targetLayerDiv[0], "esriCTHidden");
            }
        }
    });
});
