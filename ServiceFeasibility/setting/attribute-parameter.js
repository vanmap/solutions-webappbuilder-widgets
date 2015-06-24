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
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/on",
    "dojo/_base/lang",
    "esri/request",
    "dojox/validate/regexp",
    "dojo/dom-construct",
    "dojo/query",
    "jimu/dijit/Message",
    "jimu/dijit/CheckBox",
    "dijit/form/Select",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dijit/form/ValidationTextBox"
], function (
    declare,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    on,
    lang,
    esriRequest,
    regexp,
    domConstruct,
    query,
    Message,
    CheckBox,
    Select,
    domAttr,
    domClass,
    ValidationTextBox
) {
    return declare(null, {
        _clickedRows: [], // store rows that are clicked.
        _initialLoad: false, // keeps tracks whether widget is initially loaded or not

        /**
        * This function is called when widget is constructed
        * @param {object} parameters passed to the widget
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        constructor: function (options) {
            lang.mixin(this, options);
        },

        /**
        * This function is used to display attribute parameter values
        * @param {object} response of layer
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        displayAttributeParamaterValues: function (response) {
            var i, j, k, attributeParameterValues, showMinAndMaxRange, minAndMaxValue, minAndMaxValueObj, dropDownObj, isAttributeConfigured, parameterObj, defaultToValueDropDownOption;
            this._clickedRows.length = 0;
            domConstruct.empty(query(".esriCTAttrParamContainer")[0]);
            for (i = 0; i < response.attributeParameterValues.length; i++) {
                for (j = 0; j < response.networkDataset.networkAttributes.length; j++) {
                    if (response.networkDataset.networkAttributes[j].name === response.attributeParameterValues[i].attributeName) {
                        isAttributeConfigured = false;
                        if (this.config && this.config.attributeName) {
                            for (k = 0; k < this.config.attributeName.length; k++) {
                                if ((this.config.attributeName[k].name === response.attributeParameterValues[i].attributeName) && (this.config.attributeName[k].displayLabel === response.attributeParameterValues[i].parameterName)) {
                                    defaultToValueDropDownOption = null;
                                    isAttributeConfigured = true;
                                    showMinAndMaxRange = false;
                                    attributeParameterValues = { "attributeName": this.config.attributeName[k].name, "parameterName": this.config.attributeName[k].displayLabel };
                                    minAndMaxValue = this.config.attributeName[k].value.split(",");
                                    if (minAndMaxValue.length > 1) {
                                        showMinAndMaxRange = true;
                                        minAndMaxValueObj = { "minValue": minAndMaxValue[0], "maxValue": minAndMaxValue[1] };
                                    } else {
                                        defaultToValueDropDownOption = this.config.attributeName[k].value;
                                    }
                                    dropDownObj = { "allowUserInput": this.config.attributeName[k].allowUserInput };
                                    parameterObj = { "attributeParameterValues": attributeParameterValues, "rowIndex": i, "showMinAndMaxRange": showMinAndMaxRange, "minAndMaxValueObj": minAndMaxValueObj, "dropDownObj": dropDownObj, "checkBoxState": true, "defaultToValueDropDownOption": defaultToValueDropDownOption, "dataType": response.networkDataset.networkAttributes[j].dataType };
                                    this._addParameter(parameterObj);
                                    break;
                                }
                            }
                        }
                        if (!isAttributeConfigured) {
                            parameterObj = { "attributeParameterValues": response.attributeParameterValues[i], "rowIndex": i, "showMinAndMaxRange": false, "minAndMaxValueObj": null, "dropDownObj": null, "checkBoxState": false, "defaultToValueDropDownOption": null, "dataType": response.networkDataset.networkAttributes[j].dataType };
                            this._addParameter(parameterObj);
                        }
                    }
                }
            }
            this._initialLoad = false;
        },

        /**
        * This function is used to add attribute parameter value having min & max range
        * @param {object} data of parameters
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        _addParameter: function (parameterObj) {
            var esriCTAttrParamRow, attributeParameterCheckBoxColumn, attributeParameterNameColumn, attributeParameterDropDownColumn, esriCTAttrParamContainer, checkBox;
            esriCTAttrParamRow = domConstruct.create("div", { "class": "esriCTAttrParamRow" });
            attributeParameterCheckBoxColumn = domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamCheckBox" }, esriCTAttrParamRow);
            checkBox = new CheckBox({ checked: parameterObj.checkBoxState }, attributeParameterCheckBoxColumn);
            domAttr.set(checkBox.domNode, "rowID", parameterObj.rowIndex);
            domAttr.set(checkBox.domNode, "dataType", parameterObj.dataType);
            this._onCheckBoxChange(checkBox.domNode);
            if (this._initialLoad && parameterObj.checkBoxState) {
                this._clickedRows.push(checkBox.domNode);
            }
            attributeParameterNameColumn = domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamName", "innerHTML": parameterObj.attributeParameterValues.attributeName }, esriCTAttrParamRow);
            domAttr.set(attributeParameterNameColumn, "displayLabel", parameterObj.attributeParameterValues.parameterName);
            attributeParameterDropDownColumn = domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamDropDown" }, esriCTAttrParamRow);
            this._createDefaultToValueDropDown(attributeParameterDropDownColumn, parameterObj);
            if (parameterObj.showMinAndMaxRange) {
                esriCTAttrParamRow = this._addParameterForAllowToUserOption(esriCTAttrParamRow, parameterObj);
            } else {
                esriCTAttrParamRow = this._addParameterForDefaultToValueOption(esriCTAttrParamRow, parameterObj);
            }
            esriCTAttrParamContainer = query(".esriCTAttrParamContainer");
            esriCTAttrParamContainer[0].appendChild(esriCTAttrParamRow);
        },

        /**
        * This function is used to create default to value drop down
        * @param {object} column in which drop down needs to be added
        * @param {object} data of parameters
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        _createDefaultToValueDropDown: function (attributeParameterDropDownColumn, parameterObj) {
            var select;
            select = new Select({}, attributeParameterDropDownColumn);
            select.startup();
            if ((parameterObj.showMinAndMaxRange) || (parameterObj.dropDownObj && parameterObj.dropDownObj.allowUserInput === "true")) {
                select.addOption({ value: this.nls.allowToUserInput, label: this.nls.allowToUserInput, selected: true });
                select.addOption({ value: this.nls.defaultToValue, label: this.nls.defaultToValue });
            } else {
                select.addOption({ value: this.nls.defaultToValue, label: this.nls.defaultToValue, selected: true });
                select.addOption({ value: this.nls.allowToUserInput, label: this.nls.allowToUserInput });
            }
            this._onDropDownChange(select);
            if (!parameterObj.checkBoxState) {
                domClass.add(select.domNode, "esriCTAttrParamHidden");
            }
        },

        /**
        * This function is used to add parameters for allow to user option
        * @param {object} row in which parameter control needs to be added
        * @param {object} data of parameters
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        _addParameterForAllowToUserOption: function (esriCTAttrParamRow, parameterObj) {
            var attributeParameterMinValueTextInputColumn, attributeParameterValueDropDownColumn, valueDropDown, attributeParameterMaxValueTextInputColumn;
            if (parameterObj.checkBoxState && (parameterObj.dataType === "esriNADTDouble" || parameterObj.dataType === "esriNADTInteger")) {
                domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamMinLabel esriCTAttrParamEllipsis", "innerHTML": this.nls.minText }, esriCTAttrParamRow);
            } else {
                domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamMinLabel esriCTAttrParamHidden esriCTAttrParamEllipsis", "innerHTML": this.nls.minText }, esriCTAttrParamRow);
            }
            domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamValueLabel esriCTAttrParamHiddenColumn esriCTAttrParamEllipsis", "innerHTML": this.nls.valueText }, esriCTAttrParamRow);
            if (parameterObj.checkBoxState && (parameterObj.dataType === "esriNADTDouble" || parameterObj.dataType === "esriNADTInteger")) {
                attributeParameterMinValueTextInputColumn = domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamMinValue" }, esriCTAttrParamRow);
            } else {
                attributeParameterMinValueTextInputColumn = domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamMinValue esriCTAttrParamHidden" }, esriCTAttrParamRow);
            }
            attributeParameterValueDropDownColumn = domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamValueDropDown esriCTAttrParamHiddenColumn" }, esriCTAttrParamRow);
            valueDropDown = new Select({}, attributeParameterValueDropDownColumn);
            valueDropDown.startup();
            this._addValuesInDropDown(valueDropDown);
            domClass.add(valueDropDown.domNode, "esriCTAttrParamHiddenColumn");
            this._toogleMinTextBox(attributeParameterMinValueTextInputColumn, parameterObj);
            if (parameterObj.checkBoxState && (parameterObj.dataType === "esriNADTDouble" || parameterObj.dataType === "esriNADTInteger")) {
                domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamMaxLabel esriCTAttrParamEllipsis", "innerHTML": this.nls.maxText }, esriCTAttrParamRow);
                attributeParameterMaxValueTextInputColumn = domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamMaxValue" }, esriCTAttrParamRow);
            } else {
                domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamMaxLabel esriCTAttrParamHidden esriCTAttrParamEllipsis", "innerHTML": this.nls.maxText }, esriCTAttrParamRow);
                attributeParameterMaxValueTextInputColumn = domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamMaxValue esriCTAttrParamHidden" }, esriCTAttrParamRow);
            }
            this._toogleMaxTextBox(attributeParameterMaxValueTextInputColumn, parameterObj);
            return esriCTAttrParamRow;
        },

        /**
        * This function is used to hide/show min value text box
        * @param {object} column in which min text-box needs to be added
        * @param {object} data of parameters
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        _toogleMinTextBox: function (attributeParameterMinValueTextInputColumn, parameterObj) {
            var input;
            if (parameterObj.minAndMaxValueObj) {
                input = new ValidationTextBox({ "trim": true }, attributeParameterMinValueTextInputColumn);
                if (parameterObj.checkBoxState && (parameterObj.dataType === "esriNADTDouble" || parameterObj.dataType === "esriNADTInteger")) {
                    domClass.add(input.domNode, "esriCTAttrParamMinTextBox");
                } else {
                    domClass.add(input.domNode, "esriCTAttrParamMinTextBox esriCTAttrParamHidden");
                }
                input.textbox.value = parameterObj.minAndMaxValueObj.minValue;
            } else {
                input = new ValidationTextBox({ "trim": true }, attributeParameterMinValueTextInputColumn);
                if (parameterObj.checkBoxState && (parameterObj.dataType === "esriNADTDouble" || parameterObj.dataType === "esriNADTInteger")) {
                    domClass.add(input.domNode, "esriCTAttrParamMinTextBox");
                } else {
                    domClass.add(input.domNode, "esriCTAttrParamMinTextBox esriCTAttrParamHidden");
                }
            }
        },

        /**
        * This function is used to hide/show max value text box
        * @param {object} column in which max text-box needs to be added
        * @param {object} data of parameters
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        _toogleMaxTextBox: function (attributeParameterMaxValueTextInputColumn, parameterObj) {
            var input;
            if (parameterObj.minAndMaxValueObj) {
                input = new ValidationTextBox({ "trim": true }, attributeParameterMaxValueTextInputColumn);
                if (parameterObj.checkBoxState && (parameterObj.dataType === "esriNADTDouble" || parameterObj.dataType === "esriNADTInteger")) {
                    domClass.add(input.domNode, "esriCTAttrParamMaxTextBox");
                } else {
                    domClass.add(input.domNode, "esriCTAttrParamMaxTextBox esriCTAttrParamHidden");
                }
                input.textbox.value = parameterObj.minAndMaxValueObj.maxValue;
            } else {
                input = new ValidationTextBox({ "trim": true }, attributeParameterMaxValueTextInputColumn);
                if (parameterObj.checkBoxState && (parameterObj.dataType === "esriNADTDouble" || parameterObj.dataType === "esriNADTInteger")) {
                    domClass.add(input.domNode, "esriCTAttrParamMaxTextBox");
                } else {
                    domClass.add(input.domNode, "esriCTAttrParamMaxTextBox esriCTAttrParamHidden");
                }
            }
        },

        /**
        * This function is used to add options in drop down
        * @param {object} drop down in which value needs to be added
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        _addValuesInDropDown: function (valueDropDown) {
            var defaultDataDictionaryValue, i;
            defaultDataDictionaryValue = query(".esriCTAttributeTextArea")[0].value.split(",");
            for (i = 0; i < defaultDataDictionaryValue.length; i++) {
                if (i === 0) {
                    valueDropDown.addOption({ value: defaultDataDictionaryValue[i], label: defaultDataDictionaryValue[i], selected: true });
                } else {
                    valueDropDown.addOption({ value: defaultDataDictionaryValue[i], label: defaultDataDictionaryValue[i] });
                }
            }
        },

        /**
        * This function is used to get updated value in the dropdown.
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        _retainValueInDropDown: function (parameterObj, valueDropDown) {
            var defaultDataDictionaryValue, defaultDataDictionaryValueArr, i;
            defaultDataDictionaryValue = query(".esriCTAttributeTextArea")[0].value.split(",");
            defaultDataDictionaryValueArr = [];
            for (i = 0; i < defaultDataDictionaryValue.length; i++) {
                if (defaultDataDictionaryValue[i] === parameterObj.defaultToValueDropDownOption) {
                    defaultDataDictionaryValueArr.unshift({ value: defaultDataDictionaryValue[i], label: defaultDataDictionaryValue[i], selected: true });
                } else {
                    defaultDataDictionaryValueArr.push({ value: defaultDataDictionaryValue[i], label: defaultDataDictionaryValue[i] });
                }
            }
            valueDropDown.addOption(defaultDataDictionaryValueArr);
        },

        /**
        * This function is used to add parameters for default to value option
        * @param {object} row in which parameter control needs to be added
        * @param {object} data of parameters
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        _addParameterForDefaultToValueOption: function (esriCTAttrParamRow, parameterObj) {
            var attributeParameterMinValueTextInputColumn, attributeParameterValueDropDownColumn, valueDropDown, input, attributeParameterMaxValueTextInputColumn;
            domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamMinLabel esriCTAttrParamHiddenColumn esriCTAttrParamEllipsis", "innerHTML": this.nls.minText }, esriCTAttrParamRow);
            if (parameterObj.checkBoxState) {
                domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamValueLabel esriCTAttrParamEllipsis", "innerHTML": this.nls.valueText }, esriCTAttrParamRow);
            } else {
                domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamValueLabel esriCTAttrParamHidden esriCTAttrParamEllipsis", "innerHTML": this.nls.valueText }, esriCTAttrParamRow);
            }
            attributeParameterMinValueTextInputColumn = domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamMinValue esriCTAttrParamHiddenColumn" }, esriCTAttrParamRow);
            if (parameterObj.checkBoxState) {
                attributeParameterValueDropDownColumn = domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamValueDropDown" }, esriCTAttrParamRow);
            } else {
                attributeParameterValueDropDownColumn = domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamValueDropDown esriCTAttrParamHidden" }, esriCTAttrParamRow);
            }
            valueDropDown = new Select({}, attributeParameterValueDropDownColumn);
            valueDropDown.startup();
            if (parameterObj.defaultToValueDropDownOption) {
                this._retainValueInDropDown(parameterObj, valueDropDown);
            } else {
                this._addValuesInDropDown(valueDropDown);
            }
            if (parameterObj.checkBoxState) {
                domClass.remove(valueDropDown.domNode, "esriCTAttrParamHidden");
            } else {
                domClass.add(valueDropDown.domNode, "esriCTAttrParamHidden");
            }
            input = new ValidationTextBox({ "trim": true }, attributeParameterMinValueTextInputColumn);
            domClass.add(input.domNode, "esriCTAttrParamMinTextBox esriCTAttrParamHiddenColumn");
            domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamMaxLabel esriCTAttrParamHidden esriCTAttrParamEllipsis ", "innerHTML": this.nls.maxText }, esriCTAttrParamRow);
            attributeParameterMaxValueTextInputColumn = domConstruct.create("div", { "class": "esriCTAttrParamColumn esriCTAttrParamMaxValue esriCTAttrParamHidden" }, esriCTAttrParamRow);
            input = new ValidationTextBox({ "trim": true }, attributeParameterMaxValueTextInputColumn);
            domClass.add(input.domNode, "esriCTAttrParamMaxTextBox esriCTAttrParamHidden");
            return esriCTAttrParamRow;
        },

        /**
        * This function is used to display controls on change of
        * @param {object} dropdown whose click & change event needs to be attached
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        _onDropDownChange: function (select) {
            var columns, dataType;
            on(select, 'mouseUp', lang.hitch(this, function (evt) {
                columns = evt.currentTarget.parentElement.childNodes;
            }));
            on(select, 'click', lang.hitch(this, function (evt) {
                columns = evt.currentTarget.parentElement.childNodes;
            }));
            on(select, 'change', lang.hitch(this, function (evt) {
                dataType = domAttr.get(columns[0], "dataType");
                if ((evt === this.nls.allowToUserInput) && (dataType === "esriNADTDouble" || dataType === "esriNADTInteger")) {
                    domClass.remove(columns[3], "esriCTAttrParamHidden esriCTAttrParamHiddenColumn");
                    domClass.add(columns[4], "esriCTAttrParamHiddenColumn");
                    domClass.remove(columns[5], "esriCTAttrParamHidden esriCTAttrParamHiddenColumn");
                    domClass.add(columns[6], "esriCTAttrParamHiddenColumn");
                    domClass.remove(columns[7], "esriCTAttrParamHidden");
                    domClass.remove(columns[8], "esriCTAttrParamHidden");
                } else if ((evt === this.nls.allowToUserInput) && dataType !== "esriNADTDouble" && dataType !== "esriNADTInteger") {
                    domClass.remove(columns[3], "esriCTAttrParamHiddenColumn");
                    domClass.add(columns[3], "esriCTAttrParamHidden");
                    domClass.add(columns[4], "esriCTAttrParamHiddenColumn");
                    domClass.remove(columns[5], "esriCTAttrParamHiddenColumn");
                    domClass.add(columns[5], "esriCTAttrParamHidden");
                    domClass.add(columns[6], "esriCTAttrParamHiddenColumn");
                } else {
                    domClass.replace(columns[3], "esriCTAttrParamHiddenColumn", "esriCTAttrParamHidden");
                    domClass.remove(columns[4], "esriCTAttrParamHiddenColumn");
                    domClass.replace(columns[5], "esriCTAttrParamHiddenColumn", "esriCTAttrParamHidden");
                    domClass.remove(columns[6], "esriCTAttrParamHiddenColumn");
                    domClass.add(columns[7], "esriCTAttrParamHidden");
                    domClass.add(columns[8], "esriCTAttrParamHidden");
                }
            }));
        },

        /**
        * This function is used to store checked values in an array
        * @param {object} checkBox whose click event needs to be attached
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        _onCheckBoxChange: function (checkBox) {
            on(checkBox, 'click', lang.hitch(this, function (evt) {
                if (!domClass.contains(evt.target, "jimu-checkbox")) {
                    this._filterCheckedRows(evt.currentTarget);
                }
            }));
        },

        /**
        * This function is used to add/remove checked/unchecked row in the array
        * @param {object} checkBox that is checked/unchecked
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        _filterCheckedRows: function (checkBox) {
            var i, isRowFound, columns, existingColumns;
            isRowFound = false;
            existingColumns = checkBox.parentElement.childNodes;
            if (this._clickedRows.length === 0) {
                this._clickedRows.push(checkBox);
                this._showExistingColumns(existingColumns, true);
            } else {
                for (i = 0; i < this._clickedRows.length; i++) {
                    columns = this._clickedRows[i].parentElement.childNodes;
                    if (domAttr.get(columns[0], "rowID") === domAttr.get(checkBox, "rowID")) {
                        isRowFound = true;
                        this._clickedRows.splice(i, 1);
                        this._showExistingColumns(existingColumns, false);
                        break;
                    }
                }
                if (!isRowFound) {
                    this._clickedRows.push(checkBox);
                    this._showExistingColumns(existingColumns, true);
                }
            }
        },

        /**
        * This function is used to show existing columns on click of check box
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        _showExistingColumns: function (existingColumns, showColumn) {
            var dataType;
            if (showColumn) {
                if ((existingColumns[2].textContent === this.nls.defaultToValue) || (existingColumns[2].outerText === this.nls.defaultToValue)) {
                    domClass.remove(existingColumns[2], "esriCTAttrParamHidden");
                    domClass.remove(existingColumns[4], "esriCTAttrParamHidden");
                    domClass.remove(existingColumns[6], "esriCTAttrParamHidden");
                } else {
                    dataType = domAttr.get(existingColumns[0], "dataType");
                    domClass.remove(existingColumns[2], "esriCTAttrParamHidden");
                    if (dataType === "esriNADTDouble" || dataType === "esriNADTInteger") {
                        domClass.remove(existingColumns[3], "esriCTAttrParamHidden");
                        domClass.remove(existingColumns[5], "esriCTAttrParamHidden");
                        domClass.remove(existingColumns[7], "esriCTAttrParamHidden");
                        domClass.remove(existingColumns[8], "esriCTAttrParamHidden");
                    }
                }
            } else {
                if ((existingColumns[2].textContent === this.nls.defaultToValue) || (existingColumns[2].outerText === this.nls.defaultToValue)) {
                    domClass.add(existingColumns[2], "esriCTAttrParamHidden");
                    domClass.add(existingColumns[4], "esriCTAttrParamHidden");
                    domClass.add(existingColumns[6], "esriCTAttrParamHidden");
                } else {
                    domClass.add(existingColumns[2], "esriCTAttrParamHidden");
                    domClass.add(existingColumns[3], "esriCTAttrParamHidden");
                    domClass.add(existingColumns[5], "esriCTAttrParamHidden");
                    domClass.add(existingColumns[7], "esriCTAttrParamHidden");
                    domClass.add(existingColumns[8], "esriCTAttrParamHidden");
                }
            }
        },

        /**
        * This function is used to get configration of checked values
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        getAttributeParameterConfiguration: function () {
            var attributeNameJsonArr, i, attributeName, columns;
            attributeNameJsonArr = [];
            for (i = 0; i < this._clickedRows.length; i++) {
                columns = this._clickedRows[i].parentElement.childNodes;
                attributeName = { "name": columns[1].textContent || columns[1].outerText, "displayLabel": domAttr.get(columns[1], "displayLabel"), "allowUserInput": this._getAllowUserInput(columns[2].textContent || columns[2].outerText).toString(), "value": this._getMinAndMaxValue(columns) };
                attributeNameJsonArr.push(attributeName);
            }
            return attributeNameJsonArr;
        },

        /**
        *
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        validateMinMax: function () {
            var i, columns, minValue, maxValue, returnObj, dataType, minMaxValue;
            returnObj = { returnErr: "", hasError: false };
            for (i = 0; i < this._clickedRows.length; i++) {
                columns = this._clickedRows[i].parentElement.childNodes;
                dataType = domAttr.get(columns[0], "dataType");
                maxValue = columns[8].childNodes[1].childNodes[0].value;
                minValue = columns[5].childNodes[1].childNodes[0].value;
                minMaxValue = columns[1].textContent || columns[1].outerText;
                if (((columns[2].textContent === this.nls.allowToUserInput) || (columns[2].outerText === this.nls.allowToUserInput)) && (dataType === "esriNADTDouble" || dataType === "esriNADTInteger")) {
                    if (minValue === "" || minValue === null) {
                        returnObj.returnErr = minMaxValue + ":" + this.nls.validationErrorMessage.minNullValueErr;
                        returnObj.hasError = true;
                    } else if (isNaN(parseInt(minValue, 10))) {
                        returnObj.returnErr = minMaxValue + ":" + this.nls.validationErrorMessage.minValueNumberOnlyErr;
                        returnObj.hasError = true;
                    } else if (!this.ValidateInput(minValue)) {
                        returnObj.returnErr = minMaxValue + ":" + this.nls.validationErrorMessage.minValueCharErr;
                        returnObj.hasError = true;
                    } else if (maxValue === "" || maxValue === null) {
                        returnObj.returnErr = minMaxValue + ":" + this.nls.validationErrorMessage.MaxNullValueErr;
                        returnObj.hasError = true;
                    } else if (isNaN(parseInt(maxValue, 10))) {
                        returnObj.returnErr = minMaxValue + ":" + this.nls.validationErrorMessage.MaxValueNumberOnlyErr;
                        returnObj.hasError = true;
                    } else if (!this.ValidateInput(maxValue)) {
                        returnObj.returnErr = minMaxValue + ":" + this.nls.validationErrorMessage.MaxValueCharErr;
                        returnObj.hasError = true;
                    } else if (parseInt(minValue, 10) >= parseInt(maxValue, 10)) {
                        returnObj.returnErr = minMaxValue + ":" + this.nls.validationErrorMessage.minValueErr;
                        returnObj.hasError = true;
                    }
                }
            }
            return returnObj;
        },

        /**
        * This function is used to allow digits only
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        ValidateInput: function (input) {
            var regex;
            regex = /^[+\-]?\d*(?:\.\d{1,2})?$/; // allow only numbers [0-9]
            return regex.test(input);
        },

        /**
        * This function is used to determine whether allow user input is selected or not
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        _getAllowUserInput: function (selectedOption) {
            if (selectedOption === this.nls.allowToUserInput) {
                return true;
            }
            return false;
        },

        /**
        * This function is used to get minimum & maximum value of parameters
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        _getMinAndMaxValue: function (columns) {
            var value;
            if (columns[2].textContent === this.nls.defaultToValue || columns[2].outerText === this.nls.defaultToValue) {
                value = columns[6].textContent || columns[6].outerText;
            } else {
                value = columns[5].childNodes[1].childNodes[0].value + "," + columns[8].childNodes[1].childNodes[0].value;
            }
            return value;
        },

        /**
        * This function create error alert.
        * @param {string} err
        * @memberOf widgets/isolation-trace/settings/settings
        **/
        _errorMessage: function (err) {
            var errorMessage = new Message({ message: err });
            errorMessage.message = err;
        },

        /**
        * This function is used to add parameters from config file
        * @memberOf widgets/ServiceFeasibility/settings/attribute-parameter
        **/
        addConfigParameters: function () {
            if (this.config && this.config.attributeName && this.closestFacilityURL) {
                this._initialLoad = true;
            }
        }
    });
});