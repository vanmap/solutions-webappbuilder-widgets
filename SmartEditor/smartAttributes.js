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
  "dojo/Evented",
  "dojo",
  "dojo/_base/declare",
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/dom-class',
   'jimu/filterUtils'
], function (
  Evented,
  dojo,
  declare,
  lang,
  array,
  domClass,
  filterUtils
  ) {
  return declare([Evented], {
    OPERATORS: null,
    constructor: function () {
      this._filterUtils = new filterUtils();
      this.OPERATORS = lang.clone(this._filterUtils.OPERATORS);
    },

    processFilter: function (parts, logOp, feature) {
      var partResults = [];
      array.forEach(parts, function (part) {
        if (part.hasOwnProperty('parts')) {
          partResults.push( this.processFilter(part.parts, logOp, feature));
        }
        else {
          switch (part.valueObj.type) {
            case 'value':
              partResults.push(this.validatePart(part.operator,
                               feature.attributes[part.fieldObj.name],
                               part.valueObj.value,
                               part.caseSensitive));
              break;
            case 'field':

              partResults.push(this.validatePart(part.operator,
                                                 feature.attributes[part.fieldObj.name],
                                                 feature.attributes[part.valueObj.value],
                                                 part.caseSensitive));
              break;
            default:
              break;
          }
        }
      }, this);

      return this.ruleValid(partResults, logOp);
    },

    ruleValid: function (partResults,logOp) {
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

    validatePart: function (operator, field, value, caseSensitive) {
      if (operator === undefined || operator === null) {
        return false;
      }
      if (operator.lastIndexOf('string', 0) === 0) {
        if (caseSensitive === false) {
          if (field !== undefined && field !== null) {
            field = String(field).toUpperCase();
          }
          if (value !== undefined && value !== null) {
            value = String(value).toUpperCase();
          }

        }
      }
      switch (operator) {
        case this.OPERATORS.stringOperatorIs:

          if (field === value) {
            return true;
          }
          break;
        case this.OPERATORS.stringOperatorIsNot:
          if (field !== value) {
            return true;
          }
          break;
        case this.OPERATORS.stringOperatorStartsWith:
          if (field === null && value === null) {
            return true;
          }
          if (field === null && value !== null) {
            return false;
          }
          if (field !== null && value === null) {
            return false;
          }
          if (field.lastIndexOf(value, 0) === 0) {
            return true;
          }

          break;
        case this.OPERATORS.stringOperatorEndsWith:
          if (field === null && value === null) {
            return true;
          }
          if (field === null && value !== null) {
            return false;
          }
          if (field !== null && value === null) {
            return false;
          }
          return this._endsWith(field, value);
        case this.OPERATORS.stringOperatorContains:
          if (field === null && value === null) {
            return true;
          }
          if (field === null && value !== null) {
            return false;
          }
          if (field !== null && value === null) {
            return false;
          }
          if (field.IndexOf(value >= 0)){
            return true;
          }
          break;
        case this.OPERATORS.stringOperatorDoesNotContain:
          break;
        case this.OPERATORS.stringOperatorIsBlank:
          if (field === null || field === undefined) {
            return true;
          }
          break;
        case this.OPERATORS.stringOperatorIsNotBlank:
          if (field !== null && field !== undefined) {
            return true;
          }

          break;
        case this.OPERATORS.numberOperatorIs:
          if (field === value) {
            return true;
          }
          break;
        case this.OPERATORS.numberOperatorIsNot:
          if (field !== value) {
            return true;
          }
          break;
        case this.OPERATORS.numberOperatorIsAtLeast:
          break;
        case this.OPERATORS.numberOperatorIsLessThan:
          break;
        case this.OPERATORS.numberOperatorIsAtMost:
          break;
        case this.OPERATORS.numberOperatorIsGreaterThan:
          break;
        case this.OPERATORS.numberOperatorIsBetween:
          break;
        case this.OPERATORS.numberOperatorIsNotBetween:
          break;
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
          break;
        case this.OPERATORS.dateOperatorIsNotOn:
          break;
        case this.OPERATORS.dateOperatorIsBefore:
          break;
        case this.OPERATORS.dateOperatorIsAfter:
          break;
        case this.OPERATORS.dateOperatorIsBetween:
          break;
        case this.OPERATORS.dateOperatorIsNotBetween:
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
          break;
        case this.OPERATORS.dateOperatorWeeks:
          break;
        case this.OPERATORS.dateOperatorMonths:
          break;
        case this.OPERATORS.dateOperatorInTheLast:
          break;
        case this.OPERATORS.dateOperatorNotInTheLast:

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
      },this);
    },
    toggleFieldOnAttributeInspector: function (fieldName, actionType,
      attTable, gdbRequiredFields, notEditableFields) {
      if (attTable === null) {
        attTable = dojo.query("td.atiLabel", this.attrInspector.domNode);
      }

      if (attTable.length > 0) {
        var row = attTable.filter(lang.hitch(this, function (row) {
          return row.childNodes[0].data === fieldName;
        }));

        if (row !== null) {
          if (row.length > 0) {
            var valueCell = row[0].parentNode.childNodes[1].childNodes[0];
            var parent = row[0].parentNode;
            //var labelCell = row[0]; // defined but never used
            switch (actionType) {
              case 'Hide':
                domClass.add(parent, "hideField");
                break;
              case 'Disabled':
         
                domClass.add(valueCell, ["dijitValidationTextBox", "dijitTextBoxDisabled", "dijitComboBoxDisabled",
                                         "dijitValidationTextBoxDisabled", "dijitDisabled"]);
                
                this._processChildNodes(valueCell, true);
                break;
              case 'Required':
                if (row[0].childNodes.length === 1) {
                  var newA = document.createElement('a');
                  newA.setAttribute('class', "asteriskIndicator");
                  newA.innerHTML = " *";
                  row[0].appendChild(newA);


                }
                break;
              case 'Value':
                break;
              default:
                if (row[0].childNodes.length > 1) {
                  if (gdbRequiredFields.indexOf(fieldName) === -1) {
                    row[0].removeChild(row[0].childNodes[1]);
                  }
                }
                if (domClass.contains(parent, "hideField")) {
                  domClass.remove(parent, "hideField");
                }
                if (notEditableFields.indexOf(fieldName) === -1) {
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
            }

          }
        }

      }
    }

  });
});
