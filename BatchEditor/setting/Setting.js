///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/RadioButton',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/SimpleTable',
    'dojo/query',
    'dojo/dom-style',
    'dojo/_base/array',
    'dojo/on',
    'dojo/_base/lang',
    'dojo/json',
    'dijit/form/Select',
    'dojo/dom-construct',
    'jimu/dijit/SymbolChooser',
    'esri/symbols/jsonUtils'
],
  function (
    declare,
    _WidgetsInTemplateMixin,
    RadioButton,
    BaseWidgetSetting,
    SimpleTable,
    query,
    domStyle,
    array,
    on,
    lang,
    JSON,
    Select,
    domConstruct,
    SymbolChooser,
    symbolJsonUtils
        ) {
      return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
          //these two properties is defined in the BaseWidget
          baseClass: 'solutions-widget-batcheditor-setting',
          layersTable: null,
          commonFieldsTable: null,
          layerSelects: null,
          currentRow: null,
          toolOption: {
              Shape: { value: 0 },
              FeatureSpatial: { value: 1 },
              FeatureQuery: { value: 2 },
              Query: { value: 3 },
          },
          startup: function () {
              this.inherited(arguments);
              if (this.config === null) {
                  this.config = {};

              }
              if (this.config === undefined) {
                  this.config = {};

              }
              if (this.config === '') {
                  this.config = {};

              }
              this.setConfig(this.config);
              this.createFieldsTable();
          },

          getSelectedTool: function () {
              if (this.selectByShape.checked) {
                  return this.toolOption.Shape;
              }
              else if (this.selectByFeature.checked) {
                  return this.toolOption.FeatureSpatial;
              }
              else if (this.selectByFeatureQuery.checked) {
                  return this.toolOption.FeatureQuery;
              }
              else if (this.selectByQuery.checked) {
                  return this.toolOption.Query;
              }
          },
          page1ToPage2: function (evt) {

              if (this.selectByShape.checked === false && this.selectByFeature.checked === false &&
                  this.selectByFeatureQuery.checked === false && this.selectByQuery.checked === false) {
                  domStyle.set(this.settingsFirstPageError, 'display', '');

              } else {
                  this.savePageToConfig("1");
                  this.showPage2();

              }

          },
          page2ToPage1: function (evt) {
              this.savePageToConfig("2");
              this.showPage1();
          },
          page2ToPage3: function (evt) {
              var rows = this.layersTable.getRows();

              result = array.some(this.layersTable.getRows(), function (row) {
                  var rowData = this.layersTable.getRowData(row);
                  return rowData.update;
              }, this);
              if (!result) {
                  domStyle.set(this.settingsSecondPageError, 'display', '');

              } else {
                  this.savePageToConfig("2");
                  this.showPage3();
              }

          },
          page3ToPage2: function (evt) {
              this.savePageToConfig("3");
              this.showPage2();
          },
          savePageToConfig: function (page) {
              if (page === "1") {
                  if (this.selectByShape.checked === true) {
                      this.config.selectByShape = this.selectByShape.checked;
                  }
                  else {
                      this.config.selectByShape = false;
                  }

                  if (this.selectByFeature.checked === true) {
                      this.config.selectByFeature = this.selectByFeature.checked;

                  }
                  else {
                      this.config.selectByFeature = false;
                  }

                  if (this.selectByFeatureQuery.checked === true) {
                      this.config.selectByFeatureQuery = this.selectByFeatureQuery.checked;
                  }
                  else {
                      this.config.selectByFeatureQuery = false;
                  }

                  if (this.selectByQuery.checked === true) {
                      this.config.selectByQuery = this.selectByQuery.checked;
                  }
                  else {
                      this.config.selectByQuery = false;
                  }
              }
              else if (page === "2") {
                  this.config.updateLayers = [];
                  this.config.selectByLayer = {};
                  if (this.layersTable != null) {

                      array.forEach(this.layersTable.getRows(), function (row) {

                          var rowData = this.layersTable.getRowData(row);

                          if (rowData.update === true) {
                              var symbol = null;
                              if (rowData.selectionSymbol === "") {
                                  if (rowData.geometryType == "esriGeometryPolygon") {
                                      this.symbolSelector.showByType('fill');
                                  }
                                  else if (rowData.geometryType == "esriGeometryPoint") {
                                      this.symbolSelector.showByType('marker');
                                  }
                                  else if (rowData.geometryType == "esriGeometryPolyline") {
                                      this.symbolSelector.showByType('line');

                                  }
                                  var rowUpdate = { "selectionSymbol": JSON.stringify(this.symbolSelector.getSymbol() )};
                                  rowData.selectionSymbol = rowUpdate.selectionSymbol;
                                  this.layersTable.editRow(row, rowUpdate);


                              }
                              symbol = JSON.parse(rowData.selectionSymbol);//JSON.stringify(rowData.symbol);

                              this.config.updateLayers.push({
                                  "ID": rowData.ID,
                                  "name": rowData.label,
                                  "queryField": rowData.queryField,
                                  "selectionSymbol": symbol
                              });
                          }
                          if (rowData.selectByLayer === true) {
                              this.config.selectByLayer = {
                                  "ID": rowData.ID,
                                  "name": rowData.label,
                                  "queryField": rowData.queryField
                              };
                          }

                      }, this);


                  }
              }
              else if (page === "3") {
                  this.config.commonFields = [];

                  array.forEach(this.commonFieldsTable.getRows(), function (row) {

                      var rowData = this.commonFieldsTable.getRowData(row);

                      if (rowData.isEditable === true) {
                          this.config.commonFields.push({
                              "alias": rowData.label,
                              "name": rowData.fieldName,
                          });
                      }


                  }, this);
              }

          },
          showPage1: function (evt) {
              this.selectByShape.set('checked', this.config.selectByShape);
              this.selectByFeature.set('checked', this.config.selectByFeature);
              this.selectByFeatureQuery.set('checked', this.config.selectByFeatureQuery);
              this.selectByQuery.set('checked', this.config.selectByQuery);

              domStyle.set(this.firstPageDiv, 'display', '');
              domStyle.set(this.secondPageDiv, 'display', 'none');

              domStyle.set(this.settingsFirstPageError, 'display', 'none');
              this.hideOkError();
          },
          showPage2: function (evt) {
              var selectedTool = this.getSelectedTool();
              var selectByLayerVisible, queryFieldVisible;

              if (selectedTool === this.toolOption.Shape) {
                  selectByLayerVisible = false;
                  queryFieldVisible = false;
                  showOnlyEditable = true;
              }
              else if (selectedTool === this.toolOption.FeatureSpatial) {
                  selectByLayerVisible = true;
                  queryFieldVisible = false;
                  showOnlyEditable = false;
              }
              else if (selectedTool === this.toolOption.FeatureQuery) {
                  selectByLayerVisible = true;
                  queryFieldVisible = true;
                  showOnlyEditable = false;
              }
              else if (selectedTool === this.toolOption.Query) {
                  selectByLayerVisible = false;
                  queryFieldVisible = true;
                  showOnlyEditable = false;
              }
              this.createLayerTable(selectByLayerVisible, queryFieldVisible)
              this.layersTable.clear();
              this.loadLayerTable(showOnlyEditable, selectByLayerVisible, queryFieldVisible);

              domStyle.set(this.firstPageDiv, 'display', 'none');
              domStyle.set(this.secondPageDiv, 'display', '');
              domStyle.set(this.thirdPageDiv, 'display', 'none');

              domStyle.set(this.settingsSecondPageError, 'display', 'none');
              this.hideOkError();

          },
          showPage3: function (evt) {
              this.loadFieldsTable();
              domStyle.set(this.firstPageDiv, 'display', 'none');
              domStyle.set(this.secondPageDiv, 'display', 'none');
              domStyle.set(this.thirdPageDiv, 'display', '');
              this.hideOkError();
          },
          hideOkError: function () {
              domStyle.set(this.settingsFirstPageSaveError, 'display', 'none');
              domStyle.set(this.settingsSecondPageSaveError, 'display', 'none');
              domStyle.set(this.settingsThirdPageSaveError, 'display', 'none');
          },
          showOKError: function () {
              var display = domStyle.get(this.firstPageDiv, 'display');
              if (display != 'none') {
                  domStyle.set(this.settingsFirstPageSaveError, 'display', '');
                  return;
              }
              display = domStyle.get(this.secondPageDiv, 'display');
              if (display != 'none') {
                  domStyle.set(this.settingsSecondPageSaveError, 'display', '');
                  return;
              }
              display = domStyle.get(this.thirdPageDiv, 'display');
              if (display != 'none') {
                  domStyle.set(this.settingsThirdPageSaveError, 'display', '');
                  return;
              }
          },
          setConfig: function (config) {
              this.config = config;
              this.showPage1();
              //this.addQueryFields();

          },
          getConfig: function () {
              this.savePageToConfig("1");

              if (this.selectByShape.checked === false && this.selectByFeature.checked === false
                  && this.selectByFeatureQuery.checked === false && this.selectByQuery.checked === false) {
                  this.showOKError();
                  return false;
              }
             
              this.savePageToConfig("2");

              if (this.config.updateLayers) {
                  if (this.config.updateLayers.length === 0) {
                      this.showOKError();
                      return false;
                  }
              } else {
                  this.showOKError();
                  return false;
              }
              if (this.commonFieldsTable === null || this.commonFieldsTable === undefined) {
                  this.showOKError();
                  return false;
              }
              this.savePageToConfig("3");
              if (this.config) {
                  if (this.config.commonFields.length === 0) {
                      this.showOKError();
                      return false;
                  }
              } else {
                  this.showOKError();
                  return false;
              }
              return this.config;
          },
          addQueryFields: function () {
              this.layerSelects = [];

              array.forEach(this.layersTable.getRows(), function (row) {
                  var queryFldCell = query('.queryField.empty-text-td', row).shift();

                  var rowData = this.layersTable.getRowData(row);
                  var layer = this.map.getLayer(rowData.ID);
                  var fields = this.getVisibleFields(layer.infoTemplate.info.fieldInfos)

                  var s = new Select({
                      name: 'queryFldSelect',
                      options: fields
                  });

                  s.placeAt(queryFldCell);

                  this.layerSelects.push(s);

              }, this);
          },
          getEditableFields: function (fields) {
              return dojo.filter(fields, function (field) {
                  return field.isEditable === true;
              });

          },
          getVisibleFields: function (fields) {
              var result = [{ label: 'Do Not Query', value: 'Do Not Query' }];

              array.forEach(fields, function (field) {
                  if (field.visible === true) {
                      var opt = {
                          label: field.label,
                          value: field.fieldName
                      };
                      result.push(opt);
                  }
              });
              return result;

          },
          arrayObjectIndexOf: function (myArray, searchTerm, property) {
              for (var i = 0, len = myArray.length; i < len; i++) {
                  if (myArray[i][property] === searchTerm) return i;
              }
              return -1;
          },
          intersect_array: function (array1, array2) {
              // Return array of array1 items not found in array2
              var array1Uniques = array.filter(array1, function (item, i) {
                  if (this.arrayObjectIndexOf(array2, item.fieldName, "fieldName") >= 0) {
                      return true;
                  }
                  else {
                      return false;
                  }

              }, this);
              return array1Uniques;


          },
          loadFieldsTable: function () {
              this.commonFieldsTable.clear();
              var rows = this.layersTable.getRows();
              var commonFields = null;
              var firstLay = true;
              array.forEach(this.layersTable.getRows(), function (row) {
                  var rowData = this.layersTable.getRowData(row);
                  if (rowData.update === true) {

                      var layer = this.map.getLayer(rowData.ID);
                      var fields = this.getEditableFields(layer.infoTemplate.info.fieldInfos)
                      if (firstLay === true) {
                          commonFields = fields;
                          firstLay = false;
                      }
                      else {
                          commonFields = this.intersect_array(commonFields, fields);
                      }
                  }
              }, this);
              if (commonFields === null) {
                  domStyle.set(this.tableFieldInfosError, 'display', '');
                  domStyle.set(this.tableFieldInfos, 'display', 'none');
                  domStyle.set(this.tableFieldHeader, 'display', 'none');

                  this.tableFieldInfosError.innerHTML = this.nls.noCommonFields;
              }
              else if (commonFields.length === 0) {
                  domStyle.set(this.tableFieldInfosError, 'display', '');
                  domStyle.set(this.tableFieldInfos, 'display', 'none');
                  domStyle.set(this.tableFieldHeader, 'display', 'none');

                  this.tableFieldInfosError.innerHTML = this.nls.noCommonFields;
              }
              else {

                  var selectedFields = array.map(this.config.commonFields, function (commonField) {
                      return commonField.name;
                  });


                  var isEditable = false;
                  array.forEach(commonFields, function (field) {
                      if (selectedFields.indexOf(field.fieldName) > -1) {
                          isEditable = true;
                      }
                      else {
                          isEditable = false;
                      }
                      var row = this.commonFieldsTable.addRow({
                          fieldName: field.fieldName,
                          label: field.label,
                          isEditable: isEditable
                      });

                  }, this);



              }


          },
          createFieldsTable: function () {
              var commonFields = [{
                  name: 'isEditable',
                  title: this.nls.page3.fieldTable.colEdit,
                  type: 'checkbox',
                  'class': 'editable'
              }, {
                  name: 'fieldName',
                  title: this.nls.page3.fieldTable.colName,
                  type: 'text'
              }, {
                  name: 'label',
                  title: this.nls.page3.fieldTable.colAlias,
                  type: 'text',
                  editable: true
              }, {
                  name: 'actions',
                  title: this.nls.page3.fieldTable.colAction,
                  type: 'actions',
                  actions: ['up', 'down'],
                  'class': 'editable'
              }];
              var commonFieldArgs = {
                  fields: commonFields,
                  selectable: false
              };
              this.commonFieldsTable = new SimpleTable(commonFieldArgs);
              this.commonFieldsTable.placeAt(this.tableCommonFields);
              this.commonFieldsTable.startup();
          },

          loadLayerTable: function (showOnlyEditable, selectByLayerVisible, queryFieldVisible) {

              var label = '';
              var tableValid = false;
              var update = false;
              var symbol = null;
              array.forEach(this.map.itemInfo.itemData.operationalLayers, function (layer) {
                  if (layer.layerObject != null && layer.layerObject != undefined) {
                      if (layer.layerObject.type === 'Feature Layer' && layer.url) {
                          if ((showOnlyEditable && layer.layerObject.isEditable() === false)) {
                          } else {

                              label = layer.layerObject.name;
                              update = false;
                              selectByLayer = false;

                              var filteredArr = dojo.filter(this.config.updateLayers, function (layerInfo) {
                                  return layerInfo.name == label;
                              });
                              if (filteredArr.length > 0) {
                                  symbol = JSON.stringify(filteredArr[0].selectionSymbol)
                                  update = true;
                              }
                              if (symbol === undefined) {
                                  symbol = null;
                              }
                              if (this.config.selectByLayer) {
                                  if (this.config.selectByLayer.name === label) {
                                      selectByLayer = true;

                                  }
                              }
                              var row = this.layersTable.addRow({
                                  label: label,
                                  update: update,
                                  ID: layer.layerObject.id,
                                  selectByLayer: selectByLayer,
                                  geometryType: layer.layerObject.geometryType,
                                  selectionSymbol: symbol

                              });
                              tableValid = true;
                              if (layer.layerObject.isEditable() === false) {
                                  query('input[type="checkbox"]', row.tr).attr('disabled', 'disabled');
                              }
                          }
                      }
                  }
              }, this);

              if (!tableValid) {
                  domStyle.set(this.tableLayerInfosError, 'display', '');


              } else {
                  domStyle.set(this.tableLayerInfosError, 'display', 'none');
                  if (queryFieldVisible === true) {
                      this.addQueryFields();
                  }
              }
          },
          createLayerTable: function (selectByLayerVisible, queryFieldVisible) {
              var editFeaturesTableFields = [{
                  name: 'update',
                  title: this.nls.page2.layerTable.colUpdate,
                  type: 'checkbox',
                  'class': 'editable'
              }, {
                  name: 'label',
                  title: this.nls.page2.layerTable.colLabel,
                  type: 'text'
              }, {
                  name: 'selectByLayer',
                  title: this.nls.page2.layerTable.colSelectByLayer,
                  type: 'radio',
                  hidden: !selectByLayerVisible
              },
              {
                  name: 'queryField',
                  title: this.nls.page2.layerTable.colSelectByField,
                  type: 'empty',
                  hidden: !queryFieldVisible
              }, {
                  name: 'actions',
                  title: this.nls.page2.layerTable.colhighlightSymbol,
                  type: 'actions',
                  'class': 'symbolselector',
                  actions: ['edit']
              }, {
                  name: 'ID',
                  type: 'text',
                  hidden: true
              }, {
                  name: 'selectionSymbol',
                  type: 'text',
                  hidden: true
              }, {
                  name: 'geometryType',
                  type: 'text',
                  hidden: true
              }];
              var args = {
                  fields: editFeaturesTableFields,
                  selectable: false
              };
              domConstruct.empty(this.tableLayerInfos);
              this.layersTable = new SimpleTable(args);
              this.layersTable.placeAt(this.tableLayerInfos);
              this.layersTable.startup();
              this.own(on(this.layersTable, 'actions-edit', lang.hitch(this, this.showSymbolSelector)));

          },
          showSymbolSelector: function (tr) {
              var tds = query('.action-item-parent', tr);
              if (tds && tds.length) {

                  var data = this.layersTable.getRowData(tr);
                  if (data.selectionSymbol != "") {
                      var jsonSym = JSON.parse(data.selectionSymbol);
                      var sym = symbolJsonUtils.fromJson(jsonSym);
                      this.symbolSelector.showBySymbol(sym);
                  }
                  else {
                      if (data.geometryType == "esriGeometryPolygon") {

                          this.symbolSelector.showByType('fill');
                      }
                      else if (data.geometryType == "esriGeometryPoint") {
                          this.symbolSelector.showByType('marker');
                      }
                      else if (data.geometryType == "esriGeometryPolyline") {
                          this.symbolSelector.showByType('line');
                      }
                  }

                  this.currentRow = tr;
                  domStyle.set(this.secondPageDiv, 'display', 'none');
                  domStyle.set(this.symbolPage, 'display', '');
              }
          },
          saveSymbol: function () {
              var data = {};
              var sym = this.symbolSelector.getSymbol().toJson();
              data.selectionSymbol = JSON.stringify(sym);
              
              var result = this.layersTable.editRow(this.currentRow, data);
              domStyle.set(this.secondPageDiv, 'display', '');
              domStyle.set(this.symbolPage, 'display', 'none');

              this.currentRow = null;
          },
          cancelSymbol: function () {
              domStyle.set(this.secondPageDiv, 'display', '');
              domStyle.set(this.symbolPage, 'display', 'none');
              this.currentRow = null;

          },

      });
  });