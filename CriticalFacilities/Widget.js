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
  "dijit/registry",
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
  ], function (declare, BaseWidget, lang, on, dom, array, CsvStore, query, html, domConstruct, registry, webMercatorUtils, Point, Color, esriConfig, SimpleMarkerSymbol, SimpleRenderer, FeatureLayer, esriRequest, layerInfos, hCsvStore) {
  return declare([BaseWidget], {

    baseClass: 'jimu-widget-critical-facilities',

    arraySelectedFields: null,
    arrayFields: null,
    myCsvStore: null,
    correctArrayFields: null,
    arrayFieldsFromFeatureService: null,
    latFieldFromConfig: null,
    longFieldFromConfig: null,
    featureservice: null,
    _configEditor: null,
    arrayFieldsFromFeatureService: null,

    postCreate: function () {
      this.inherited(arguments);
    },

    startup: function () {

      this.featureservice = this.config.selectedFeatureService;
      this.latFieldFromConfig = this.config.latitudeField;
      this.longFieldFromConfig = this.config.longitudeField;

      this.configLayerInfo = this.config.layerInfos[0];
      this.geocodeSources = this.config.sources;

      arrayFieldsFromFeatureService = [];
      var p = this.getPanel();

      if (this.configLayerInfo) {
        array.forEach(this.configLayerInfo.fieldInfos, function (field) {
          if (field && field.visible) {
            arrayFieldsFromFeatureService.push({ "name": "array" + field.fieldName, "value": field.fieldName });
          }
        });

        array.forEach(arrayFieldsFromFeatureService, lang.hitch(this, function (i) {
          if (i.value != "objectid_1" && i.value != "objectid") {
            var fieldName = i.value;

            //TODO update these to domConstruct.create
            var node = domConstruct.toDom('<label id="label' + fieldName + '" data-dojo-attach-point="label' + fieldName + '" for="select' + fieldName + '">' + fieldName + '</label>');
            var selectNode = domConstruct.toDom('<select id="select' + fieldName + '" name="select' + fieldName + '" data-dojo-attach-point="field' + fieldName + '"></select>');

            this.fieldsetForm.appendChild(node);
            this.fieldsetForm.appendChild(selectNode);

            //TODO do this with css
            node.style.fontSize = "10pt";
            node.style.fontFamily = "Avenir, LT";
            node.style.lineHeight = "13px";
            node.style.margin = "3px";
          }
        }));

        console.log("number of fields " + arrayFieldsFromFeatureService.length);

        //TODO this should be dynamic and not calculated
        var height = (arrayFieldsFromFeatureService.length * 20) + 200;
        var widgetHeight = height + 80;
        var buttonHeight = (arrayFieldsFromFeatureService.length * 20) + 150;

        this.fieldsetForm.style.height = height + 'px';
        this.fieldsetForm.style.width = '300px';

        p.domNode.style.width = "400px";
        p.domNode.style.height = widgetHeight + 'px';

        //TODO css
        this.submitData.style.top = buttonHeight + 'px';
        this.addToMap.style.top = buttonHeight + 'px';

        //TODO CSS
        this.submitData.disabled = true;

        if (this.map) {
          this.own(on(this.map, "dragenter", this.onDragEnter));
          this.own(on(this.map, "dragover", this.onDragOver));
          this.own(on(this.map, "drop", this.onDrop));
        }
      } else {
        //TODO 

        //TODO css
        var height = 200;
        var widgetHeight = 80;
        var buttonHeight = 150;
        this.fieldsetForm.style.height = height + 'px';
        this.fieldsetForm.style.width = '300px';

        p.domNode.style.width = "350px";
        p.domNode.style.height = widgetHeight + 'px';

        //TODO css
        this.submitData.style.top = buttonHeight + 'px';
        this.addToMap.style.top = buttonHeight + 'px';

        this.addToMap.remove();
        this.submitData.remove();
        this.fieldsetForm.remove();
      }
    },

    onDragEnter: function (event) {
      console.log('onDragEnter');
      event.preventDefault();
    },

    onDragOver: function (event) {
      console.log('onDragOver');
      event.preventDefault();
    },

    onDrop: function (event) {
      console.log('onDrop');
      event.preventDefault();

      var dataTransfer = event.dataTransfer,
        files = dataTransfer.files,
        types = dataTransfer.types;

      if (files && files.length === 1) {
        console.log("[ FILES ]");
        var file = files[0]; // that's right I'm only reading one file
        console.log("type = ", file.type);
        if (file.name.indexOf(".csv") !== -1) {
          console.log("handle as Csv (file)");

          var myCsvStore = new hCsvStore({
            inFile: file,
            inArrayFields: arrayFieldsFromFeatureService,
            inMap: this.map
          });
          myCsvStore.latField = latFieldFromConfig;
          myCsvStore.longField = longFieldFromConfig;
          myCsvStore.arraySelectedFields = this.arraySelectedFields;
          myCsvStore.onHandleCsv();
        }
      }
    },

    bytesToString: function (b) {
      console.log("bytes to string");
      var s = [];
      array.forEach(b, function (c) {
        s.push(String.fromCharCode(c));
      });
      return s.join("");
    },

    onAddClick: function () {
      console.log('onAddClick');

      var arrayMappedFields = [[]];

      console.log("arrayFieldsFromFeatureService " + arrayFieldsFromFeatureService.length);

      array.forEach(arrayFieldsFromFeatureService, function (setField) {
        if (setField != null && setField.value != "objectid" && setField.value != "objectid_1") {
          var tempText = setField.value;
          console.log("tempText " + tempText);
          //TODO
          var queryResult = dojo.query('select#select' + tempText)[0][dojo.query('select#select' + tempText).val()].firstChild.data;
          arrayMappedFields.push([queryResult, tempText]);
          console.log("query result " + queryResult);
        }
      });

      array.forEach(arrayMappedFields, function (field) {
        console.log("fields from ++++++ " + field);
      });

      console.log("arrayMappedFields Length " + arrayMappedFields.length);

      arraySelectedFields = [];

      myCsvStore.correctFieldNames = arrayFieldsFromFeatureService;
      myCsvStore.mappedArrayFields = arrayMappedFields;
      myCsvStore.onProcessForm();
    },

    // submit to feature service
    onSubmitClick: function () {
      console.log('onSubmitClick');

      var featureLayer = myCsvStore.featureLayer;

      console.log("featureLayer size " + featureLayer.id);

      var flayer = new esri.layers.FeatureLayer(this.featureservice, {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
      });

      var features = featureLayer.graphics;
      var theExtent = null;

      for (var f = 0, fl = features.length; f < fl; f++) {
        var feature = features[f];
        var attribs = feature.attributes;

        feature.setInfoTemplate(flayer.infoTemplate);
        flayer.add(feature);

        //adds, updates, deletes, callback, errback
        flayer.applyEdits([feature], null, null);
      }
      console.log("finished " + flayer.graphics.length + " " + flayer.name);
    },

    onClearClick: function () {
      console.log('onClearClick');

      //get data from REST endpoint and compare the ID of each of the records against what is already there. Sort them into two arrays and invoke add/update 
      //via applyEdits below
      var flayer = new esri.layers.FeatureLayer(this.featureservice, {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        outFields: ['*']
      });

      var features = flayer.graphics;

      console.log("featureService " + flayer.graphics);

      var theExtent = null;
      var selectQuery = new Query();

      //  selectQuery.where = "'Facility' = '*'";
      selectQuery.where = "1=1";

      var selectFeatures = flayer.selectFeatures(selectQuery, flayer.SELECTION_NEW);

      console.log("selected Features " + selectedFeatures.id);

      flayer.applyEdits(null, null, [selectFeatures]);

      console.log("finished clearing features " + flayer.graphics.length + " " + flayer.name);
    }
  });
});