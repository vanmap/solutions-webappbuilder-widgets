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
    'dijit/form/Select',
    'dojo/dom-construct'

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
    Select,
    domConstruct) {
      return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
          //these two properties is defined in the BaseWidget
          baseClass: 'solution-widget-batcheditor-setting',
          layersTable: null,
          commonFieldsTable: null,
          layerSelects: null,
          toolOption: {
              Shape: { value: 0 },
              FeatureSpatial: { value: 1 },
              FeatureQuery: { value: 2 },
              Query: { value: 3 },
          },
          startup: function () {
              this.inherited(arguments);
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
              },this    );
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
                  this.config.selectByShape = this.selectByShape.checked;
                  this.config.selectByFeature = this.selectByFeature.checked;
                  this.config.selectByFeatureQuery = this.selectByFeatureQuery.checked;
                  this.config.selectByQuery = this.selectByQuery.checked;
              }
              else if (page === "2") {

                  if (this.layersTable != null) {
                      this.config.updateLayers = [];
                      this.config.selectByLayer = {};
                      array.forEach(this.layersTable.getRows(), function (row) {

                          var rowData = this.layersTable.getRowData(row);

                          if (rowData.update === true) {
                              this.config.updateLayers.push({
                                  "ID": rowData.ID,
                                  "name": rowData.label,
                                  "queryField": rowData.queryField
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
              if (display != 'none')
              {
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
              this.config.UpdateLayers = [];

              this.config.selectByShape = this.selectByShape.checked;
              this.config.selectByFeature = this.selectByFeature.checked;
              this.config.selectByFeatureQuery = this.selectByFeatureQuery.checked;
              this.config.selectByQuery = this.selectByQuery.checked;
              if (this.selectByShape.checked === false && this.selectByFeature.checked === false
                  && this.selectByFeatureQuery.checked === false && this.selectByQuery.checked === false)
              {
                  this.showOKError();
                  return false;
              }
              if (this.layersTable === null || this.layersTable === undefined) {
                  this.showOKError();
                  return false;
              }
              
              this.config.UpdateLayers = []
              array.forEach(this.layersTable.getRows(), function (row) {

                  var rowData = this.layersTable.getRowData(row);

                  if (rowData.update === true) {
                      this.config.UpdateLayers.push({
                          "ID": rowData.ID,
                          "name": rowData.label,
                          "queryField": rowData.queryField
                      });
                  }
                  if (rowData.selectByLayer === true) {
                      this.config.SelectByLayer = {
                          "ID": rowData.ID,
                          "name": rowData.label,
                          "queryField": rowData.queryField
                      };
                  }

              }, this);
              if (this.config.UpdateLayers.length === 0)
              {
                  this.showOKError();
                  return false;
              }

              if (this.commonFieldsTable === null || this.commonFieldsTable === undefined) {
                  this.showOKError();
                  return false;
              }
              var rows = this.commonFieldsTable.getRows();

              if (rows === null) {
                  this.showOKError();
                  return false;
              }

              if (rows.length === 0) {
                  this.showOKError();
                  return false;
              }
              this.config.CommonFields = [];

              array.forEach(rows, function (row) {

                  var rowData = this.commonFieldsTable.getRowData(row);

                  if (rowData.isEditable === true) {
                      this.config.CommonFields.push({
                          "alias": rowData.label,
                          "name": rowData.fieldName,
                      });
                  }
                  

              }, this);
              if (this.config.CommonFields.length === 0) {
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
                  array.forEach(commonFields, function (field) {
                      var row = this.commonFieldsTable.addRow({
                          fieldName: field.fieldName,
                          label: field.label
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

              var selectedLayers = array.map(this.config.updateLayers, function (updateLayer) {
                  return updateLayer.name;
              });



              var label = '';
              array.forEach(this.map.itemInfo.itemData.operationalLayers, function (layer) {
                  if (layer.layerObject != null && layer.layerObject != undefined) {
                      if (layer.layerObject.type === 'Feature Layer' && layer.url) {
                          if ((showOnlyEditable && layer.layerObject.isEditable === false)) {
                          } else {

                              label = layer.layerObject.name;
                              update = false;
                              selectByLayer = false;
                              if (selectedLayers.indexOf(label) > -1) {
                                  update = true;
                              }
                              if (this.config.selectByLayer.name === label) {
                                  selectByLayer = true;

                              }

                              var row = this.layersTable.addRow({
                                  label: label,
                                  update: update,
                                  ID: layer.layerObject.id,
                                  selectByLayer: selectByLayer

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
                  if (queryFieldVisible === true) {
                      this.addQueryFields();
                  }

              } else {
                  domStyle.set(this.tableLayerInfosError, 'display', 'none');
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
                  name: 'ID',
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
          },

      });
  });