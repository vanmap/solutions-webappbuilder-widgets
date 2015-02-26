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
    "jimu/dijit/Message"

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
    Message
) {
    return declare([BaseWidgetSetting, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        baseClass: 'jimu-widget-ServiceFeasbility-setting',
        operationalLayers: null,
        startup: function () {
            this.inherited(arguments);
            if (this.map.itemInfo.itemData.operationalLayers.length === 0) {
                this._errorMessage(this.nls.operationalLayersErrorMessage);
            }
            this.operationalLayers = this.map.itemInfo.itemData.operationalLayers;
            console.log(this.operationalLayers);
            this._initiliazeBusinessLayerSelect();
            this._initiliazeAccessPointLayersCheckboxes();
            this._initiliazeBufferUnitsSelect();
        },

        /**
          * This function will add option in Business Layer select tag
        **/
        _initiliazeBusinessLayerSelect: function () {
            var i, j, k;
            for (i = 0; i < this.operationalLayers.length; i++) {
                this.selectBusinessLayer.addOption({ label: this.operationalLayers[i].title, value: i });
            }
            for (k = 0; k < this.operationalLayers[0].layerObject.fields.length; k++) {
                this.selectbusinessList.addOption({ label: this.operationalLayers[0].layerObject.fields[k].name, value: this.operationalLayers[0].layerObject.fields[k].name });
            }
            this.selectBusinessLayer.on("change", lang.hitch(this, function () {
                this.selectbusinessList.options.length = 0;
                var currentValue = this.selectBusinessLayer.value;
                for (j = 0; j < this.operationalLayers[currentValue].layerObject.fields.length; j++) {
                    this.selectbusinessList.addOption({ label: this.operationalLayers[currentValue].layerObject.fields[j].name, value: this.operationalLayers[currentValue].layerObject.fields[j].name });
                }
            }));

        },

        /**
          * This function will create checkboxes for Access point layers
        **/
        _initiliazeAccessPointLayersCheckboxes: function () {
            var i, divAccessPointLayerContainer;
            for (i = 0; i < this.operationalLayers.length; i++) {
                divAccessPointLayerContainer = domConstruct.create("div");
                domConstruct.create("input", {
                    id: this.operationalLayers[i].id,
                    type: "checkbox",
                    checked: "true"
                }, divAccessPointLayerContainer);
                domConstruct.create("label", {
                    innerHTML: this.operationalLayers[i].title,
                    "for": this.operationalLayers[i].id
                }, divAccessPointLayerContainer);
                domConstruct.place(divAccessPointLayerContainer, this.divAccessPointLayer);
            }

        },

        /**
          * This function will create the buffer units select
        **/
        _initiliazeBufferUnitsSelect: function () {
            var i, ESRIBufferUnits;
            ESRIBufferUnits = this.nls.ESRIBufferUnits.split(",");
            for (i = 0; i < ESRIBufferUnits.length; i++) {
                this.selectBufferUnits.addOption({ label: ESRIBufferUnits[i], value: ESRIBufferUnits[i] });
            }
        },

        /**
       * This function creat error alert.
       * @param {string} err
       * @memberOf widgets/isolation-trace/settings/settings
       **/
        _errorMessage: function (err) {
            var errorMessage = new Message({ message: err });
            errorMessage.message = err;
        }

    });
});
