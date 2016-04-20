/*
Copyright ©2014 Esri. All rights reserved.

TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
Unpublished material - all rights reserved under the
Copyright Laws of the United States and applicable international
laws, treaties, and conventions.

For additional information, contact:
Attn: Contracts and Legal Department
Environmental Systems Research Institute, Inc.
380 New York Street
Redlands, California, 92373
USA

email: contracts@esri.com
*/

define([
  "dojo",
  "dojo/_base/declare",
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/dom-class',
   'dojo/query',
   'dijit/registry',
   'jimu/filterUtils',
   'dijit/_TemplatedMixin',
    'jimu/BaseWidgetSetting',
], function (
  dojo,
  declare,
  lang,
  array,
  domClass,
  query,
  registry,
  filterUtils,
  _TemplatedMixin,
  BaseWidgetSetting
  ) {
  return declare([BaseWidgetSetting, _TemplatedMixin], {
    _attrInspector: null,
    _fieldValidation: null,
    _feature: null,
    _fieldInfo: null,
    _gdbRequiredFields: null,
    _notEditableFields: null,
    _fieldNameToAlias: null,
    _fieldsWithRules: null,
    _attTable: null,
    _filterUtils: null,
    _mapLayer: null,
    OPERATORS: null,
    constructor: function () {
      this.inherited(arguments);
      lang.mixin(this, arguments[0]);
      this._mapLayer = this._feature.getLayer();
      this._processLayer();
      this._filterUtils = new filterUtils();
      this.OPERATORS = lang.clone(this._filterUtils.OPERATORS);
      this._attTable = query("td.atiLabel", this._attrInspector.domNode);
      if (this._attTable === undefined || this._attTable === null) {
        return;
      }
      this._bindEvents(this._attrInspector.domNode);
    },
    _processLayer: function () {
      this._gdbRequiredFields = [];
      this._notEditableFields = [];
      //this._fieldNameToAlias = {};
      this._fieldsWithRules = [];

      this._gdbRequired = this._mapLayer.fields.filter(function (field) {
        return field.nullable === false && field.editable === true;
      });

      this._fieldInfo.forEach(function (finfo) {
        if (finfo.isEditable === false || finfo.isEditableSettingInWebmap === false) {
          this._notEditableFields.push(finfo.label);

          //this._fieldNameToAlias[finfo.fieldName] = finfo.label; 
        }
        if (this._fieldValidation) {
          if (this._fieldValidation.hasOwnProperty(finfo.fieldName)) {
            this._fieldsWithRules.push(finfo.label);
          }

        }
      }, this);
    },
    toggleFields: function () {
      if (this._attTable === undefined || this._attTable == null) {
        return;
      }

      if (this._fieldValidation === undefined || this._fieldValidation === null) {
        return;
      }

      if (this._feature === undefined || this._feature === null) {
        return;
      }

      var actionType = null
      var hasRule = false;
      var fields = this._feature.getLayer().fields;

      var rowsWithError = [];
      var results;
      fields.forEach(lang.hitch(this, function (field) {
        actionType = null;
        // hasRule, actionType, fieldValid 
        results = this.validateField(field.name);
        actionType = results[1];
        if (results[2] === false) {
          rowsWithError.push({ 'fieldName': field.name })
        }

        if (results[0] == true) {
          this.toggleFieldOnAttributeInspector(field.alias, actionType, results[2]);
        }
      }));
      return rowsWithError;
    },
    validateField: function (fieldName) {
      // hasRule, actionType, fieldValid (only for required field action)

      var filter = null;
      if (this._fieldValidation.hasOwnProperty(fieldName)) {

        if (this._fieldValidation[fieldName].length === 0) {
          return [false, null, true];
        }
        else {
          for (var actionDetails in this._fieldValidation[fieldName]) {
            if (this._fieldValidation[fieldName].hasOwnProperty(actionDetails)) {
              filter = this._fieldValidation[fieldName][actionDetails].filter;
              if (filter !== undefined && filter !== null) {

                if (this.processFilter(filter, this._feature)) {
                  //if (fieldValidation[fieldName][actionDetails].action === 'Required') {
                  if (actionDetails === 'Required') {

                    if (this._feature.attributes.hasOwnProperty(fieldName) === false) {
                      return [true, actionDetails, false];

                    }
                    else if (this._feature.attributes[fieldName] === null || this._feature.attributes[fieldName] === '') {
                      return [true, actionDetails, false];
                    }
                    else {
                      return [true, actionDetails, true];
                    }
                  }
                  else {
                    return [true, actionDetails, null];
                  }


                }
              }
            }

          }
          return [true, null, null];
        }
      }
      else {
        return [false, null, null];
      }

    },
    _bindEvents: function (domNode) {

      if (this._attTable === undefined || this._attTable === null) {
        return;
      }

      if (this._attTable.length > 0) {
        this._attTable.forEach(function (row) {
          rowInfo = this._getRowInfo(row);
          if (this._fieldsWithRules.indexOf(rowInfo[3]) !== -1) {
            if (rowInfo[2].declaredClass === 'dijit.form.FilteringSelect') {
              dojo.connect(rowInfo[2], 'onChange', lang.hitch(this, this._smartComboValidate(rowInfo[3])));
            }
          }
        }, this);
      }



      //var widgetArr = dijit.findWidgets(domNode);
      //widgetArr.forEach(function (widget) {
      //  if (widget.declaredClass && widget.declaredClass === 'dijit.form.FilteringSelect') {
      //    //if (this._gdbRequiredFields.indexOf(widget.domNode.parentNode.parentNode.childNodes[0].innerHTML) === -1) {

      //    //change to query for the A element might be safer
      //    if (widget.domNode.parentNode.parentNode.childNodes[0].childNodes.length ===1 ) {
      //      dojo.connect(widget, 'onChange', lang.hitch(this, this._smartComboValidate(widget.domNode.parentNode.parentNode.childNodes[0].childNodes[0].innerHTML)));
      //    }
      //  }
      //},this);
      //var textboxArray = dojo.filter(dijit.registry._hash, function(widget) {
      //  return widget.declaredClass && widget.declaredClass == 'dijit.form.TextBox';
      //})
      //query("",attrInspector).length < 1) {
      //  dojo.connect(parentWidget, 'onChange', this._smartComboValidate);

    },
    processFilter: function (filter) {
      var partResults = [];
      array.forEach(filter.parts, function (part) {
        if (part.hasOwnProperty('parts')) {
          partResults.push(this.processFilter(part, this._feature));
        }
        else {
          var value1 = null;
          var value2 = null;

          if (part.valueObj.hasOwnProperty('value')) {
            value1 = part.valueObj.value;
          }
          if (part.valueObj.hasOwnProperty('value1')) {
            value1 = part.valueObj.value1;
          }
          if (part.valueObj.hasOwnProperty('value2')) {
            value2 = part.valueObj.value2;
          }

          switch (part.valueObj.type) {
            case 'value':
              partResults.push(this.validatePart(part.operator,
                               this._feature.attributes[part.fieldObj.name],
                               value1,
                               value2,
                               part.caseSensitive));
              break;
            case 'field':

              partResults.push(this.validatePart(part.operator,
                                                 this._feature.attributes[part.fieldObj.name],
                                                 value1,
                                                 value2,
                                                 part.caseSensitive));
              break;
            default:
              break;
          }
        }
      }, this);

      return this.ruleValid(partResults, filter.logicalOperator);
    },
    ruleValid: function (partResults, logOp) {
      var performAction = false;

      if (logOp === undefined || logOp === null) {
        logOp = 'OR';
      }
      array.some(partResults, function (result) {

        if (logOp === 'OR') {
          if (result === true) {
            performAction = true;
            return true;
          }
          else {
            performAction = false;
          }
        } else {
          if (result === false) {
            performAction = false;
            return true;
          } else {
            performAction = true;
          }
        }
      });
      return performAction;

    },
    _isNumeric: function (n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    },
    validatePart: function (operator, field, value1, value2, caseSensitive) {
      if (operator === undefined || operator === null) {
        return false;
      }
      if (operator.lastIndexOf('string', 0) === 0) {
        if (caseSensitive === false) {
          if (field !== undefined && field !== null) {
            field = String(field).toUpperCase();
          }
          if (value1 !== undefined && value1 !== null) {
            value1 = String(value1).toUpperCase();
          }
          if (value2 !== undefined && value2 !== null) {
            value2 = String(value2).toUpperCase();
          }

        }
      }
      else if (operator.lastIndexOf('date', 0) === 0) {
        if (value1 !== undefined && value1 !== null) {
          value1 = new Date(value1);
        }
        if (value2 !== undefined && value2 !== null) {
          value2 = new Date(value2);
        }
      }

      switch (operator) {
        case this.OPERATORS.stringOperatorIs:

          if (field === value1) {
            return true;
          }
          break;
        case this.OPERATORS.stringOperatorIsNot:
          if (field !== value1) {
            return true;
          }
          break;
        case this.OPERATORS.stringOperatorStartsWith:
          if (field === null && value1 === null) {
            return true;
          }
          if (field === null && value1 !== null) {
            return false;
          }
          if (field !== null && value1 === null) {
            return false;
          }
          if (field.lastIndexOf(value1, 0) === 0) {
            return true;
          }

          break;
        case this.OPERATORS.stringOperatorEndsWith:
          if (field === null && value1 === null) {
            return true;
          }
          if (field === null && value1 !== null) {
            return false;
          }
          if (field !== null && value1 === null) {
            return false;
          }
          return this._endsWith(field, value1);
        case this.OPERATORS.stringOperatorContains:
          if (field === null && value1 === null) {
            return true;
          }
          if (field === null && value1 !== null) {
            return false;
          }
          if (field !== null && value1 === null) {
            return false;
          }
          if (String(field).indexOf(value1 >= 0)) {
            return true;
          }
          break;
        case this.OPERATORS.stringOperatorDoesNotContain:
          if (field === null && value1 === null) {
            return false;
          }
          if (field === null && value1 !== null) {
            return true;
          }
          if (field !== null && value1 === null) {
            return true;
          }
          if (String(field).indexOf(value1 >= 0)) {
            return false;
          }

          break;
        case this.OPERATORS.stringOperatorIsBlank:
          return (field === null || field === undefined);
          break;
        case this.OPERATORS.stringOperatorIsNotBlank:
          return (field !== null && field !== undefined);

          break;
        case this.OPERATORS.numberOperatorIs:
          if (this._isNumeric(field)) {
            return String(field) === String(value1);
          }
          return false;
          break;
        case this.OPERATORS.numberOperatorIsNot:
          if (this._isNumeric(field)) {
            return (String(field) !== String(value1));
          }
          return false;
          break;
        case this.OPERATORS.numberOperatorIsAtLeast:
          if (this._isNumeric(field) && this._isNumeric(value1)) {
            return field >= value1;
          }
          return false;
          break;
        case this.OPERATORS.numberOperatorIsLessThan:
          if (this._isNumeric(field) && this._isNumeric(value1)) {
            return field < value1;
          }
          return false;
          break;
        case this.OPERATORS.numberOperatorIsAtMost:
          if (this._isNumeric(field) && this._isNumeric(value1)) {
            return field <= value1;
          }
          return false;
          break;
        case this.OPERATORS.numberOperatorIsGreaterThan:
          if (this._isNumeric(field) && this._isNumeric(value1)) {
            return field > value1;
          }
          return false;
          break;
        case this.OPERATORS.numberOperatorIsBetween:
          if (this._isNumeric(field) && this._isNumeric(value1) && this._isNumeric(value2)) {
            return field > value1 && field < value2;
          }
          return false;
          break;
        case this.OPERATORS.numberOperatorIsNotBetween:
          if (this._isNumeric(field) && this._isNumeric(value1) && this._isNumeric(value2)) {
            return field <= value1 || field >= value2;
          }
          return false;
        case this.OPERATORS.numberOperatorIsBlank:
          if (field === null || field === undefined) {
            return true;
          }
          break;
        case this.OPERATORS.numberOperatorIsNotBlank:
          if (field !== null && field !== undefined) {
            return true;
          }

          break;
        case this.OPERATORS.dateOperatorIsOn:
          if (field === undefined || field === null) {
            return false;
          }
          if (value1 === undefined || value1 === null) {
            return false;
          }

          var d = new Date(0);
          d.setUTCSeconds(field);
          return value1.toDateString() === field.toDateString();
          break;
        case this.OPERATORS.dateOperatorIsNotOn:
          if (field === undefined || field === null) {
            return false;
          }
          if (value1 === undefined || value1 === null) {
            return false;
          }

          var d = new Date(0);
          d.setUTCSeconds(field);
          return !(value1.toDateString() === field.toDateString());
          break;
        case this.OPERATORS.dateOperatorIsBefore:
          if (field === null || field === undefined) {
            return false;
          }
          if (value1 === undefined || value1 === null) {
            return false;
          }
          return field < (value1.getTime());
          break;
        case this.OPERATORS.dateOperatorIsAfter:
          if (field === null || field === undefined) {
            return false;
          }
          if (value1 === undefined || value1 === null) {
            return false;
          }
          return field > (value1.getTime());
          break;
        case this.OPERATORS.dateOperatorIsBetween:
          if (field === null || field === undefined) {
            return false;
          }
          if (value1 === undefined || value1 === null) {
            return false;
          }
          if (value2 === undefined || value2 === null) {
            return false;
          }
          return field > (value1.getTime()) && field < (value2.getTime());
          break;
        case this.OPERATORS.dateOperatorIsNotBetween:
          if (field === null || field === undefined) {
            return false;
          }
          if (value1 === undefined || value1 === null) {
            return false;
          }
          if (value2 === undefined || value2 === null) {
            return false;
          }
          return field <= (value1.getTime()) || field >= (value2.getTime());
          break;
        case this.OPERATORS.dateOperatorIsBlank:
          if (field === null || field === undefined) {
            return true;
          }

          break;
        case this.OPERATORS.dateOperatorIsNotBlank:
          if (field !== null && field !== undefined) {
            return true;
          }

          break;
        case this.OPERATORS.dateOperatorDays:
          //Not exposed in control, not implemented in app
          if (field === null || field === undefined) {
            //return true;
          }
          return false;
          break;
        case this.OPERATORS.dateOperatorWeeks:
          //Not exposed in control, not implemented in app
          if (field === null || field === undefined) {
            //return true;
          }
          return false;
          break;
        case this.OPERATORS.dateOperatorMonths:
          //Not exposed in control, not implemented in app
          if (field === null || field === undefined) {
            //return true;
          }
          return false;
          break;
        case this.OPERATORS.dateOperatorInTheLast:
          //Not exposed in control, not implemented in app
          if (field === null || field === undefined) {
            //return true;
          }
          return false;
          break;
        case this.OPERATORS.dateOperatorNotInTheLast:
          //Not exposed in control, not implemented in app
          if (field === null || field === undefined) {
            //return true;
          }
          return false;
          break;
        default:
          return false;
      }
      return false;
    },
    _processChildNodes: function (element, state) {
      element.disabled = state;
      if (state === true) {
        element.style.pointerEvents = 'none';
      }
      else {
        element.style.pointerEvents = 'auto';
      }
      array.forEach(element.childNodes, function (node) {
        node.disabled = state;
        if (state === true) {
          node.style.pointerEvents = 'none';
        }
        else {
          node.style.pointerEvents = 'auto';
        }

        if (node.childNodes.length > 0) {
          this._processChildNodes(node, state)
        }
      }, this);
    },
    _smartComboValidate: function (fieldAlias) {
      var field = fieldAlias;
      return function (fieldName) {
        this.toggleFields();
      }


    },
    _getRowInfo: function (row) {
      var valueCell = row.parentNode.childNodes[1].childNodes[0];
      var label = row.childNodes[0].data;
      var parent = row.parentNode;
      var widget = registry.getEnclosingWidget(valueCell);

      return [valueCell, parent, widget, label];
    },
    _removeRequireFieldMarkings: function (row, fieldName, valueCell,parent, widget) {
      if (this._gdbRequiredFields.indexOf(fieldName) === -1) {
        if (widget.declaredClass === 'dijit.form.TextBox') {
          if (domClass.contains(valueCell, "dijitTextBoxError")) {
            domClass.remove(valueCell, "dijitTextBoxError");
          }
          if (domClass.contains(valueCell, "dijitValidationTextBox")) {
            domClass.remove(valueCell, "dijitValidationTextBox");
          }
          if (domClass.contains(valueCell, "dijitValidationTextBoxError")) {
            domClass.remove(valueCell, "dijitValidationTextBoxError");
          }
          if (domClass.contains(valueCell, "dijitError")) {
            domClass.remove(valueCell, "dijitError");
          }
          var nl = query(".dijitValidationContainer", parent);
          nl.forEach(function (node) {
            node.parentNode.removeChild(node);
          });
        }
        else if (widget.declaredClass === 'dijit.form.FilteringSelect') {

          if (domClass.contains(valueCell, "dijitTextBoxError")) {
            domClass.remove(valueCell, "dijitTextBoxError");
          }
          if (domClass.contains(valueCell, "dijitComboBoxError")) {
            domClass.remove(valueCell, "dijitComboBoxError");
          }
          if (domClass.contains(valueCell, "dijitError")) {
            domClass.remove(valueCell, "dijitError");
          }
          if (domClass.contains(valueCell, "dijitValidationTextBoxError")) {
            domClass.remove(valueCell, "dijitValidationTextBoxError");
          }
        }

      }

    },
    _removeRedAst: function (row) {
      astNode = query("a.asteriskIndicator", row);

      if (astNode.length > 0) {
        astNode.forEach(function (node) {
          node.parentNode.removeChild(node);
        });
      }
    },
    _removeHideRule: function (parent) {
      if (domClass.contains(parent, "hideField")) {
        domClass.remove(parent, "hideField");
      }
    },
    _removeDisableRule: function (fieldName,valueCell) {
      if (this._notEditableFields.indexOf(fieldName) === -1) {
        if (domClass.contains(valueCell, "dijitTextBoxDisabled")) {
          domClass.remove(valueCell, "dijitTextBoxDisabled");
        }
        if (domClass.contains(valueCell, "dijitComboBoxDisabled")) {
          domClass.remove(valueCell, "dijitComboBoxDisabled");
        }
        if (domClass.contains(valueCell, "dijitValidationTextBoxDisabled")) {
          domClass.remove(valueCell, "dijitValidationTextBoxDisabled");
        }
        if (domClass.contains(valueCell, "dijitDisabled")) {
          domClass.remove(valueCell, "dijitDisabled");
        }
      }
      this._processChildNodes(valueCell, false);
    },
    toggleFieldOnAttributeInspector: function (fieldName, actionType, fieldHasValidValue) {
      if (this._gdbRequiredFields === undefined || this._gdbRequiredFields === null) {
        this._gdbRequiredFields = []
      }
      if (this._notEditableFields === undefined || this._notEditableFields === null) {
        this._notEditableFields = []
      }
      if (this._attTable === undefined || this._attTable === null) {
        return;
      }

      if (this._attTable.length > 0) {
        var row = this._attTable.filter(lang.hitch(this, function (row) {
          return row.childNodes[0].data === fieldName;
        }));

        if (row !== null) {
          if (row.length > 0) {
            rowInfo = this._getRowInfo(row[0]);

            var valueCell = rowInfo[0];
            var parent = rowInfo[1];
            var widget = rowInfo[2];
            switch (actionType) {
              case 'Hide':
                this._removeRequireFieldMarkings(row[0], fieldName,valueCell, parent, widget);
                this._removeRedAst(row[0]);
                this._removeDisableRule(fieldName,valueCell);
                //this._removeHideRule(parent);
                domClass.add(parent, "hideField");
                
                break;
              case 'Disabled':
                this._removeRequireFieldMarkings(row[0], fieldName,valueCell, parent, widget);
                this._removeRedAst(row[0]);
                //this._removeDisableRule(fieldName,valueCell);
                this._removeHideRule(parent);
                domClass.add(valueCell, ["dijitValidationTextBox", "dijitTextBoxDisabled", "dijitComboBoxDisabled",
                                         "dijitValidationTextBoxDisabled", "dijitDisabled"]);

                this._processChildNodes(valueCell, true);
                break;
              case 'Required':
                //this._removeRequireFieldMarkings(row[0], fieldName,valueCell, parent, widget);
                //this._removeRedAst(row[0]);
                this._removeDisableRule(fieldName,valueCell);
                this._removeHideRule(parent);
                if (fieldHasValidValue === true) {
                  this._removeRequireFieldMarkings(row[0], fieldName, valueCell,parent, widget);
                } else {
                  if (widget.declaredClass === 'dijit.form.TextBox') {

                    var nl = query(".dijitValidationContainer", parent);
                    if (nl.length === 0) {

                      var newDiv = document.createElement('div');
                      newDiv.setAttribute('class', "dijitReset dijitValidationContainer");
                      var newIn = document.createElement('input');
                      newIn.setAttribute('class', "dijitReset dijitInputField dijitValidationIcon dijitValidationInner");
                      newIn.setAttribute('value', "x");
                      newIn.setAttribute('type', 'text');
                      newIn.setAttribute('tabindex', '-1');
                      newIn.setAttribute('readonly', 'readonly');
                      newIn.setAttribute('role', 'presentation');
                      newDiv.appendChild(newIn);
                      valueCell.insertBefore(newDiv, valueCell.childNodes[0]);
                    }

                    domClass.add(valueCell, ["dijitTextBoxError", "dijitValidationTextBox", "dijitValidationTextBoxError", "dijitError"]);

                  } else if (widget.declaredClass === 'dijit.form.FilteringSelect') {

                    domClass.add(valueCell, ["dijitTextBoxError", "dijitComboBoxError", "dijitError", "dijitValidationTextBoxError"]);

                  }
                  else {

                    domClass.add(valueCell, ["dijitTextBoxError", "dijitError"]);

                  }
                }

                astNode = query("a.asteriskIndicator", row[0]);
                if (astNode.length === 0) {
                  var newA = document.createElement('a');
                  newA.setAttribute('class', "asteriskIndicator");
                  newA.innerHTML = " *";
                  row[0].appendChild(newA);
                }

                break;
              case 'Value':
                break;
              default:
                this._removeRequireFieldMarkings(row[0], fieldName,valueCell, parent, widget);
                this._removeRedAst(row[0]);
                this._removeDisableRule(fieldName,valueCell);
                this._removeHideRule(parent);
            }

          }
        }

      }
    }

  });
});
