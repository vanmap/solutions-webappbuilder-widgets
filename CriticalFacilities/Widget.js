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
  './js/csvStore'
], function (declare, BaseWidget, lang, on, dom, array, CsvStore, query, html, domConstruct, domStyle, DeferredList, registry, Select, webMercatorUtils, Point, Color, esriConfig, SimpleMarkerSymbol, SimpleRenderer, FeatureLayer, esriRequest, layerInfos, hCsvStore) {
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

    postCreate: function () {
      this.inherited(arguments);
    },

    startup: function () {
      domStyle.set(this.schemaMapContainer, "display", "none");

      this._configLayerInfo = this.config.layerInfos[0];
      this._url = this._configLayerInfo.featureLayer.url;
      this._geocodeSources = this.config.sources;

      _fsFields = [];
      var p = this.getPanel();

      if (this._configLayerInfo) {
        array.forEach(this._configLayerInfo.fieldInfos, lang.hitch(this, function (field) {
          if (field && field.visible) {
            _fsFields.push({ "name": field.fieldName, "value": field.fieldName });
            this.addFieldRow(this.schemaMapTable, field.fieldName, []);
          }
        }));

        this.submitData.disabled = true;
        this.own(on(this.map.container, "dragenter", this.onDragEnter));
        this.own(on(this.map.container, "dragover", this.onDragOver));
        this.own(on(this.map.container, "drop", lang.hitch(this, this.onDrop)));

      } else {
        //TODO will need to handle this here if we allow config with no layer defined...really I think this should be 
        // prevented at the Settings level by not allowing the OK button when some required parts are missing
      }
    },

    //keyField is the field to map to....fields are the list of potential fields from the CSV
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
        'class': "field-select-node"
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
            this.myCsvStore.onHandleCsv().then(lang.hitch(this, function (d) {
              this._updateFieldControls(d);
              console.log(d);
              domStyle.set(this.schemaMapInstructions, "display", "none");
              domStyle.set(this.schemaMapContainer, "display", "block");
            }));
          }
        //}
      }
    },

    _updateFieldControls: function (fields) {
      var controlNodes = query('.field-node-tr', this.schemaMapTable);
      array.forEach(controlNodes, function (node) {
        //clear old options here also
        array.forEach(fields, function (f) {
          node.selectFields.addOption({ label: f, value: f });
        });
        //for (var i = 0; i < fields.length; i++) {
        //  node.selectFields.addOption({ label: fields[i], value: fields[i] });
        //}      
      });
    },

    onAddClick: function () {
      var arrayMappedFields = [[]];
      array.forEach(_fsFields, lang.hitch(this, function (setField) {
        if (setField != null && setField.value != "objectid" && setField.value != "objectid_1") {
          var fieldName = setField.value;
          var controlNodes = query('.field-node-tr', this.schemaMapTable);
          var mappedField = "";
          for (var i = 0; i < controlNodes.length; i++) {
            var node = controlNodes[i];
            if (node.keyField === fieldName) {
              mappedField = node.selectFields.value;
              break;
            }
          }
          arrayMappedFields.push([mappedField, fieldName]);
        }
      }));
      this.myCsvStore.correctFieldNames = _fsFields;
      this.myCsvStore.mappedArrayFields = arrayMappedFields;
      this.myCsvStore.onProcessForm();
    },

    onSubmitClick: function () {
      var featureLayer = this.myCsvStore.featureLayer;

      //only need to get the configured fields really
      var flayer = new esri.layers.FeatureLayer(this._url, {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
      });

      var features = featureLayer.graphics;
      var theExtent = null;

      for (var f = 0, fl = features.length; f < fl; f++) {
        var feature = features[f];
        var attribs = feature.attributes;

        feature.setInfoTemplate(flayer.infoTemplate);//??
        flayer.add(feature);

        //TODO handle errors
        flayer.applyEdits([feature], null, null);
      }
    }
  });
});