///////////////////////////////////////////////////////////////////////////
// Copyright 2016 Esri. All Rights Reserved.
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
define(['dojo/_base/declare',
  'jimu/BaseWidget',
  'dojo/_base/lang',
  'dojo/on',
  'dojo/dom',
  'dojo/_base/array',
  "dojox/data/CsvStore",
  "dojo/query",
  "dojo/html",
  "dojo/dom-construct",
  'dojo/dom-style',
  'dojo/dom-class',
  'dojo/DeferredList',
  "dijit/registry",
  'dijit/form/Select',
  "esri/geometry/webMercatorUtils",
  "esri/geometry/Point",
  "esri/Color",
  "esri/config",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/renderers/SimpleRenderer",
  "esri/layers/FeatureLayer",
  "esri/request",
  'jimu/LayerInfos/LayerInfos',
  './js/csvStore',
  'jimu/dijit/RadioBtn'
], function (declare, BaseWidget, lang, on, dom, array, CsvStore, query, html, domConstruct, domStyle, domClass, DeferredList, registry, Select, webMercatorUtils, Point, Color, esriConfig, SimpleMarkerSymbol, SimpleRenderer, FeatureLayer, esriRequest, layerInfos, hCsvStore, RadioBtn) {
  return declare([BaseWidget], {

    baseClass: 'jimu-widget-critical-facilities',

    arraySelectedFields: null,
    arrayFields: null,
    myCsvStore: null,
    csvStores: [],
    correctArrayFields: null,
    _fsFields: null,
    _url: null,
    _geocodeSources: null,
    _configLayerInfo: null,
    _useAddr: true,

    //TODO need a way to clear and Update temp map results

    //TODO need a way to handle field validation between to/from fields

    //TODO edits need to be applied to the layer instance in the map
    //TODO need to handle geocode errors...for example they choose a field that is not addresses or they have bad addressed
    //TODO need a way for the user to process the results prior to submit
    //TODO widget should open onDrop if it is closed
    //TODO control button visibility and or enabled state depending upon where we are in the workflow
    //TODO if no schema map fields then that section should not draw

    //TODO add 2 fields...change layer in settings and add 1 field...the old fields were not cleared

    postCreate: function () {
      this.inherited(arguments);

      this.own(on(this.map.container, "dragenter", this.onDragEnter));
      this.own(on(this.map.container, "dragover", this.onDragOver));
      this.own(on(this.map.container, "drop", lang.hitch(this, this.onDrop)));

      this.own(on(this.useAddrNode, 'click', lang.hitch(this, this.onChooseType, 'addr')));
      this.own(on(this.useXYNode, 'click', lang.hitch(this, this.onChooseType, 'xy')));

      domStyle.set(this.addressBodyContainer, "display", "block");
      domStyle.set(this.xyBodyContainer, "display", "none");
    },

    startup: function () {
      domStyle.set(this.mainContainer, "display", "none");

      this._configLayerInfo = this.config.layerInfos[0];
      this._url = this._configLayerInfo.featureLayer.url;
      this._geocodeSources = this.config.sources;

      _fsFields = [];
      var p = this.getPanel();

      if (this._configLayerInfo) {
        array.forEach(this._configLayerInfo.fieldInfos, lang.hitch(this, function (field) {
          if (field && field.visible) {
            _fsFields.push({ "name": field.fieldName, "value": field.type });
            this.addFieldRow(this.schemaMapTable, field.fieldName);
          }
        }));

        this.addFieldRow(this.addressTable, this.nls.addressFieldLabel);
        this.addFieldRow(this.xyTable, this.nls.xyFieldsLabelX);
        this.addFieldRow(this.xyTable, this.nls.xyFieldsLabelY);

        this.submitData.disabled = true;


      } else {
        //TODO will need to handle this here if we allow config with no layer defined...really I think this should be 
        // prevented at the Settings level by not allowing the OK button when some required parts are missing
      }

      layerInfos.getInstance(this.map, this.map.itemInfo).then(lang.hitch(this, function (operLayerInfos) {
        this.opLayers = operLayerInfos;
        this.editLayer = operLayerInfos.getLayerInfoById(this._configLayerInfo.featureLayer.id).layerObject;
      }));
    },

    addFieldRow: function (tableNode, keyField) {
      var tr = domConstruct.create('tr', {
        'class': 'field-node-tr'
      }, tableNode);

      domConstruct.create('td', {
        'class': 'field-label-node-td',
        innerHTML: keyField
      }, tr);

      var c = domConstruct.create('td', {
        'class': 'field-control-node-td'
      }, tr);

      var selectFields = new Select({
        'class': "field-select-node",
        'maxheight': "-1" 
      });
      selectFields.placeAt(c);
      selectFields.startup();

      tr.selectFields = selectFields;
      tr.keyField = keyField;
    },

    onDragEnter: function (event) {
      event.preventDefault();
    },

    onDragOver: function (event) {
      event.preventDefault();
    },

    onDrop: function (event) {
      event.preventDefault();

      var dataTransfer = event.dataTransfer,
        files = dataTransfer.files,
        types = dataTransfer.types;

      if (files && files.length > 0) {
        //TODO think through and update to handle multiple files
        //for (var i = 0; i < files.length; i++) {
        //var file = files[i];

          var file = files[0];//single file for the moment
          if (file.name.indexOf(".csv") !== -1) {
            this.myCsvStore = new hCsvStore({
              inFile: file,
              inArrayFields: _fsFields,
              inMap: this.map,
              arraySelectedFields: this.arraySelectedFields,
              geocodeSources: this._geocodeSources
            });
            this.myCsvStore.onHandleCsv().then(lang.hitch(this, function (obj) {
              this._updateFieldControls(this.schemaMapTable, obj, true, true);
              this._updateFieldControls(this.xyTable, obj, true, false);
              this._updateFieldControls(this.addressTable, obj, false, false);

              domStyle.set(this.schemaMapInstructions, "display", "none");
              domStyle.set(this.mainContainer, "display", "block");
            }));
          }
        //}
      }
    },

    onChooseType: function (type, node) {
      this._useAddr = type === "addr" ? true : false;
      domStyle.set(this.addressBodyContainer, "display", type === "addr" ? "block" : "none");
      domStyle.set(this.xyBodyContainer, "display", type === "xy" ? "block" : "none");
    },

    _updateFieldControls: function (table, obj, checkFieldTypes, checkArrayFields) {
      var fields = obj.fields;
      var fieldTypes = obj.fieldTypes;
      var arrayFields = obj.arrayFields;
      var controlNodes = query('.field-node-tr', table);
      array.forEach(controlNodes, function (node) {
        var options = node.selectFields.getOptions();
        array.forEach(options, function (option) {
          node.selectFields.removeOption(option);
        });

        var ftInt = ["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle"];
        var ftFloat = ["esriFieldTypeDouble"];
        var test = {};
        var keyFieldType;
        if (checkArrayFields) {
          array.forEach(arrayFields, function (f) {
            var type;
            if (ftInt.indexOf(f.value) > -1) {
              type = "int";
            } else if (ftFloat.indexOf(f.value) > -1) {
              type = "float";
            } else {
              type = "other";
            }
            test[f.name] = type;
          });
          keyFieldType = test[node.keyField];
        }

        array.forEach(fields, function (f) {
          var add = false;
          if (checkArrayFields) {
            //Schema Map fields         
            if (keyFieldType === "int" && fieldTypes[f].supportsInt) {
              add = true;
            } else if (keyFieldType === "float" && fieldTypes[f].supportsFloat) {
              add = true;
            } else if (keyFieldType === "other") {
              add = true;
            }
          } else {
            //XY or Address
            if (checkFieldTypes) {
              //XY
              if (fieldTypes[f].supportsFloat || fieldTypes[f].supportsInt) {
                add = true;
              }
            } else {
              //Address
              add = true;
            }
          }
          if (add) {
            node.selectFields.addOption({ label: f, value: f });
          }
        });
      });
    },

    onAddClick: function () {
      var mappedFields = {};
      array.forEach(_fsFields, lang.hitch(this, function (setField) {
        if (setField) {
          var fieldName = setField.name;
          var controlNodes = query('.field-node-tr', this.schemaMapTable);
          var mappedField = "";
          for (var i = 0; i < controlNodes.length; i++) {
            var node = controlNodes[i];
            if (node.keyField === fieldName) {
              mappedField = node.selectFields.value;
              break;
            }
          }
          mappedFields[fieldName] = mappedField;
        }
      }));     
      var controlNodes = query('.field-node-tr', this._useAddr ? this.addressTable : this.xyTable);
      array.forEach(controlNodes, lang.hitch(this, function (node) {
        switch (node.keyField) {
          case this.nls.addressFieldLabel:
            this.myCsvStore.addrFieldName = node.selectFields.value;
            break;
          case this.nls.xyFieldsLabelX:
            this.myCsvStore.xFieldName = node.selectFields.value;
            break;
          case this.nls.xyFieldsLabelY:
            this.myCsvStore.yFieldName = node.selectFields.value;
            break;
        }
      }));
      this.myCsvStore.useAddr = this._useAddr;
      this.myCsvStore.correctFieldNames = _fsFields;
      this.myCsvStore.mappedArrayFields = mappedFields;
      this.myCsvStore.onProcessForm();
    },

    onSubmitClick: function () {
      var featureLayer = this.myCsvStore.featureLayer;
      var flayer = this.editLayer;
      var features = [];
      array.forEach(featureLayer.graphics, function (feature) {
        if (feature.attributes.hasOwnProperty("ObjectID")) {
          delete feature.attributes.ObjectID;
        }
        if (feature.attributes.hasOwnProperty("_graphicsLayer")) {
          delete feature._graphicsLayer;
        }
        if (feature.attributes.hasOwnProperty("_layer")) {
          delete feature._layer;
        }
        features.push(feature);
      });
      //TODO handle errors
      flayer.applyEdits(features, null, null, function (e) {
        console.log(e);
      }, function (ee) {
        console.log(ee);
      });
    }
  });
});