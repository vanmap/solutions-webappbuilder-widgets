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
    "dojo/_base/array",
    "dojo/text!./inputSetting.html",
    "dojo/text!./inputData.html",
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
    array,
    inputSetting,
    inputDataString,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: inputDataString,
        inputSettingString: inputSetting,
        startup: function () {
            this.inherited(arguments);
        },

        postCreate: function () {
            this._createInputPanel();
        },

        /**
        * This function creates left title pane menu and binds the respective click events.
        * @memberOf widgets/isolation-trace/settings/inputsetting
        */
        _createInputPanel: function () {
            var nlsTemp = string.substitute(this.inputSettingString, this);
            this.inputDataNode = domConstruct.toDom(nlsTemp).childNodes[0];
            on(this.inputDataNode, "click", lang.hitch(this, function (evt) {
                this.inputFieldClicked(this);
            }));
            this.parentContainer.appendChild(this.inputDataNode);
            this._createInputDataPanel();
        },

        /**
        * This function handles input left menu panel click event.
        * @memberOf widgets/isolation-trace/settings/inputsetting
        */
        inputFieldClicked: function (widgetNode) {
            return true;
        },

        /**
        * This function handles input Type change event
        * @memberOf widgets/isolation-trace/settings/inputsetting
        */
        inputTypeChange: function (inputNode) {
            return;
        },

        /**
        * This function creates input config parameters.
        * @memberOf widgets/isolation-trace/settings/inputsetting
        */
        getInputForm: function () {
            var inputParam = {
                "paramName": this.data.name,
                "toolTip": this.inputTooltipData.value,
                "type": this.inputTypeData.value,
                "symbol": this.symbolChooser.getSymbol().toJson()
            };
            return inputParam;
        },

        /**
        * This function is called to display input task details.
        * @memberOf widgets/isolation-trace/settings/inputsetting
        */
        _createInputDataPanel: function () {
            var i, objSymbol;
            this.inputTooltipData.id = "tooltipText_" + this.ObjId;
            // if input config object is not null
            if (this.inputConfig) {
                this.inputTooltipData.set("value", this.inputConfig.toolTip);
                // loop for setting the dropdown value as in available in config
                for (i = 0; i < this.inputTypeData.options.length; i++) {
                    // if dropdown value in config is equal to the input drop down then
                    if (this.inputTypeData.options[i].value === this.inputConfig.type) {
                        this.inputTypeData.set("value", this.inputTypeData.options[i].value);
                    }
                }
            } else {
                for (i = 0; i < this.inputTypeData.options.length; i++) {
                    if (this.data.name.indexOf(this.inputTypeData.options[i].value) > -1) {
                        this.inputTypeData.set("value", this.inputTypeData.options[i].value);
                    }
                }
            }
            on(this.inputTypeData, "Change", lang.hitch(this, function (evt) {
                this.inputTypeChange(this);
            }));
            //if symbol geometry exist
            if (this.data.defaultValue.geometryType) {
                this.data.featureSetMode = 'draw';

                objSymbol = {};
                // if symbols parameter available in input parameters then takes symbol details
                // otherwise using geometry type for fetching the symbol details
                if (this.inputConfig && this.inputConfig.symbol) {
                    objSymbol.symbol = jsonUtils.fromJson(this.inputConfig.symbol);
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
        }
    });
});
