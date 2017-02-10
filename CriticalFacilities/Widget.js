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
  'jimu/LayerInfos/LayerInfos',
  'jimu/dijit/RadioBtn',
  'jimu/PanelManager',
  'jimu/dijit/Message',
  'dojo/_base/lang',
  'dojo/on',
  'dojo/_base/array',
  'dojo/query',
  'dojo/dom-construct',
  'dojo/dom-class',
  'dojo/dom-style',
  'dijit/form/Select',
  'esri/geometry/webMercatorUtils',
  'esri/geometry/Point',
  'esri/Color',
  './js/csvStore'
], function (declare, BaseWidget, LayerInfos, RadioBtn, PanelManager, Message, lang, on, array, query, domConstruct, domClass, domStyle, Select, webMercatorUtils, Point, Color, CsvStore) {
  return declare([BaseWidget], {

    baseClass: 'jimu-widget-critical-facilities',

    arrayFields: null,
    myCsvStore: null,
    csvStores: [],
    correctArrayFields: null,
    _fsFields: null,
    _url: null,
    _geocodeSources: null,
    _configLayerInfo: null,
    _useAddr: true,
    _valid: false,
    addrType: "addr",

    //TODO need a way to update map results
    //TODO need a way for the user to process the results prior to submit

    //TODO need to handle geocode errors...for example they choose a field that is not addresses or they have bad addressed
    //TODO test web mercator points in CSV 
    //TODO test a larger CSV

    //TODO need to handle the chunking of geocode requests...done...need to verify that errors or null features returned
    // are being handled properly

    //TODO add to map needs to be disabled until one of the location mapping options have been chosen

    postCreate: function () {
      this.inherited(arguments);

      this.own(on(this.map.container, "dragenter", this.onDragEnter));
      this.own(on(this.map.container, "dragover", this.onDragOver));
      this.own(on(this.map.container, "drop", lang.hitch(this, this.onDrop)));

      this.own(on(this.useAddrNode, 'click', lang.hitch(this, this.onChooseType, 'addr')));
      this.own(on(this.useMultiAddrNode, 'click', lang.hitch(this, this.onChooseType, 'multi-addr')));
      this.own(on(this.useXYNode, 'click', lang.hitch(this, this.onChooseType, 'xy')));

      domStyle.set(this.addressBodyContainer, "display", "block");
      domStyle.set(this.xyBodyContainer, "display", "none");
      domStyle.set(this.addressMultiBodyContainer, "display", "none");
      domStyle.set(this.processingNode, 'display', 'none');

      this.panalManager = PanelManager.getInstance();
    },

    startup: function () {
      domStyle.set(this.mainContainer, "display", "none");
      domStyle.set(this.clearMapData, "display", "none");
      domStyle.set(this.submitData, "display", "none");
      domStyle.set(this.updateData, "display", "none");

      if (this.config.layerInfos && this.config.layerInfos.hasOwnProperty(0)) {
        this._valid = true;
        domStyle.set(this.loadWarning, "display", "none");
        this._configLayerInfo = this.config.layerInfos[0];
        this._url = this._configLayerInfo.featureLayer.url;
        this._geocodeSources = this.config.sources;

        this._fsFields = [];
        if (this._configLayerInfo) {
          array.forEach(this._configLayerInfo.fieldInfos, lang.hitch(this, function (field) {
            if (field && field.visible) {
              this._fsFields.push({ "name": field.fieldName, "value": field.type, isRecognizedValues: field.isRecognizedValues });
              this.addFieldRow(this.schemaMapTable, field.fieldName, field.label);
            }
          }));

          var multiAddrFields = [this.nls.address, this.nls.city, this.nls.state, this.nls.zip];
          array.forEach(multiAddrFields, lang.hitch(this, function (addr) {
            this.addFieldRow(this.addressMultiTable, addr, addr);
          }));

          this.addFieldRow(this.addressTable, this.nls.addressFieldLabel, this.nls.addressFieldLabel);
          this.addFieldRow(this.xyTable, this.nls.xyFieldsLabelX, this.nls.xyFieldsLabelX);
          this.addFieldRow(this.xyTable, this.nls.xyFieldsLabelY, this.nls.xyFieldsLabelY);
        }

        LayerInfos.getInstance(this.map, this.map.itemInfo).then(lang.hitch(this, function (operLayerInfos) {
          this.opLayers = operLayerInfos;
          this.editLayer = operLayerInfos.getLayerInfoById(this._configLayerInfo.featureLayer.id).layerObject;
        }));
      } else {
        domStyle.set(this.schemaMapInstructions, "display", "none");
        domStyle.set(this.loadWarning, "display", "block");
      }
    },

    addFieldRow: function (tableNode, keyField, label) {
      var tr = domConstruct.create('tr', {
        'class': 'field-node-tr'
      }, tableNode);

      domConstruct.create('td', {
        'class': 'field-label-node-td',
        innerHTML: label
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
      this.own(on(selectFields, 'change', lang.hitch(this, function (v, g) {
        this.validateValues();
      })));
      tr.selectFields = selectFields;
      tr.keyField = keyField;
    },

    validateValues: function(){
      var controlNodes = query('.field-node-tr', this._useAddr ? this.addrType === "addr" ? this.addressTable : this.addressMultiTable : this.xyTable);
      var hasAllVals = true;
      //array.forEach(controlNodes, lang.hitch(this, function (node) {
      //  var selectNode = query('.field-select-node', node)[0];
      //  hasAllVals = hasAllVals && !(selectNode.textContent === this.nls.noValue);
      //}));

      //TODO this x stuff is a temp workaround...not all fields are actually required for multi-field input
      //need to think through this more
      var x = 0;
      array.forEach(controlNodes, lang.hitch(this, function (node) {
        var selectNode = query('.field-select-node', node)[0];
        var hasVal = !(selectNode.textContent === this.nls.noValue);
        hasAllVals = hasAllVals && hasVal;
        x += hasVal ? 1 : 0;
      }));
      if (x > 1) {
        hasAllVals = true;
      }

      if (hasAllVals) {
        if (domClass.contains(this.addToMap, 'disabled')) {
          domClass.remove(this.addToMap, 'disabled');
        }
      } else {
        if (!domClass.contains(this.addToMap, 'disabled')) {
          domClass.add(this.addToMap, 'disabled');
        }
      }
    },

    onDragEnter: function (event) {
      event.preventDefault();
    },

    onDragOver: function (event) {
      event.preventDefault();
    },

    onDrop: function (event) {
      if (this._valid) {
        if (this.myCsvStore) {
          this.myCsvStore.clear();
        }
        event.preventDefault();

        var dataTransfer = event.dataTransfer,
          files = dataTransfer.files,
          types = dataTransfer.types;

        if (files && files.length > 0) {
          var file = files[0];//single file for the moment
          if (file.name.indexOf(".csv") !== -1) {
            this.myCsvStore = new CsvStore({
              file: file,
              arrayFields: this._fsFields,
              map: this.map,
              geocodeSources: this._geocodeSources,
              nls: this.nls
            });
            this.myCsvStore.onHandleCsv().then(lang.hitch(this, function (obj) {
              this._updateFieldControls(this.schemaMapTable, obj, true, true);
              this._updateFieldControls(this.xyTable, obj, true, false);
              this._updateFieldControls(this.addressTable, obj, false, false);
              this._updateFieldControls(this.addressMultiTable, obj, false, false);
              this.validateValues();
              domStyle.set(this.schemaMapInstructions, "display", "none");
              domStyle.set(this.mainContainer, "display", "block");
            }));
          }
          this.panalManager.openPanel(this.getPanel());
        }
      }
    },

    onChooseType: function (type) {
      this._useAddr = type === "addr" || type === "multi-addr" ? true : false;
      this.addrType = type;
      this.validateValues();
      domStyle.set(this.addressBodyContainer, "display", type === "addr" ? "block" : "none");
      domStyle.set(this.addressMultiBodyContainer, "display", type === "multi-addr" ? "block" : "none");
      domStyle.set(this.xyBodyContainer, "display", type === "xy" ? "block" : "none");
    },

    _updateFieldControls: function (table, obj, checkFieldTypes, checkArrayFields) {
      var fields = obj.fields;
      var fieldTypes = obj.fieldTypes;
      var arrayFields = obj.arrayFields;
      var controlNodes = query('.field-node-tr', table);
      var noValue = this.nls.noValue;
      var selectMatchField = false;
      
      array.forEach(controlNodes, function (node) {
        var matchFieldName = "";
        var options = node.selectFields.getOptions();
        array.forEach(options, function (option) {
          node.selectFields.removeOption(option);
        });

        node.selectFields.addOption({ label: noValue, value: noValue });

        var ints = ["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle"];
        var dbls = ["esriFieldTypeDouble"];
        var t = {};
        var keyFieldType;
        if (checkArrayFields) {
          array.forEach(arrayFields, function (f) {
            t[f.name] = ints.indexOf(f.value) > -1 ? "int" : dbls.indexOf(f.value) > -1 ? "float" : "other";
          });
          keyFieldType = t[node.keyField];
        }

        array.forEach(fields, function (f) {
          var add = false;
          if (checkArrayFields) {
            //Schema Map fields
            add = ((keyFieldType === "int" && fieldTypes[f].supportsInt) ||
              (keyFieldType === "float" && fieldTypes[f].supportsFloat) ||
              (keyFieldType === "other")) ? true : add;
          } else {
            //XY or Address
            if (checkFieldTypes) {
              //XY
              add = fieldTypes[f].supportsFloat || fieldTypes[f].supportsInt ? true : add;
            } else {
              //Address
              add = true;
            }
          }
          if (add) {
            node.selectFields.addOption({ label: f, value: f });
          }
        });

        //Select Matching Field Name if found
        var kf = noValue;
        for (var i = 0; i < arrayFields.length; i++) {
          var af = arrayFields[i];
          if (af.name === node.keyField) {
            for (var ii = 0; ii < af.isRecognizedValues.length; ii++) {
              var irv = af.isRecognizedValues[ii];
              if (fields.indexOf(irv) > -1) {
                kf = irv;
                break;
              }
            }
          }
        }

        node.selectFields.set('value', kf);
      });
    },

    onAddClick: function () {
      if (!domClass.contains(this.addToMap, 'disabled')) {
        domStyle.set(this.addToMap, "display", "none");

        var useMultiFields = false;
        var multiFields = [];
        var mappedFields = {};
        array.forEach(this._fsFields, lang.hitch(this, function (setField) {
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
        var controlNodes = query('.field-node-tr', this._useAddr ? this.addrType === "addr" ? this.addressTable : this.addressMultiTable : this.xyTable);
        array.forEach(controlNodes, lang.hitch(this, function (node) {
          switch (node.keyField) {
            case this.nls.addressFieldLabel:
              this.myCsvStore.addrFieldName = node.selectFields.value;
              multiFields.push({ keyField: node.keyField, value: node.selectFields.value });
              break;
            case this.nls.xyFieldsLabelX:
              this.myCsvStore.xFieldName = node.selectFields.value;
              break;
            case this.nls.xyFieldsLabelY:
              this.myCsvStore.yFieldName = node.selectFields.value;
              break;
            default:
              useMultiFields = true;
              multiFields.push({ keyField: node.keyField, value: node.selectFields.value });
              break;
          }
        }));
        domStyle.set(this.processingNode, 'display', 'block');
        this.myCsvStore.useMultiFields = useMultiFields;
        this.myCsvStore.multiFields = multiFields;
        this.myCsvStore.useAddr = this._useAddr;
        this.myCsvStore.mappedArrayFields = mappedFields;
        this.myCsvStore.onProcessForm().then(lang.hitch(this, function () {
          domStyle.set(this.processingNode, 'display', 'none');
          domStyle.set(this.clearMapData, "display", "block");
          domStyle.set(this.submitData, "display", "block");
          domStyle.set(this.updateData, "display", "block");
        }), lang.hitch(this, function (err) {
          domStyle.set(this.processingNode, 'display', 'none');
          domStyle.set(this.addToMap, "display", "block");
        }));
      }
    },

    onUpdateClick: function () {
      var fl = this.myCsvStore.featureLayer;
      var unMatchedFL = this.myCsvStore.unMatchedFeatureLayer;

      //TODO
      alert('Update local map features based on changes to field mapping');
    },

    toggleContainer: function (e) {
      var container = this[e.currentTarget.dataset.clickParams];
      var removeClass = domClass.contains(container, 'content-show') ? 'content-show' : 'content-hide';
      domClass.remove(container, removeClass);
      domClass.add(container, removeClass === 'content-show' ? 'content-hide' : 'content-show');

      var accordian = container.previousElementSibling;
      if (domClass.contains(accordian, 'bottom-radius')) {
        domStyle.set(accordian, 'border-radius', removeClass === 'content-hide' ? '0 0 0 0' : '0 0 4px 4px');
      }

      domClass.remove(accordian.children[1], removeClass === 'content-hide' ? 'image-down' : 'image-up');
      domClass.add(accordian.children[1], removeClass === 'content-hide' ? 'image-up' : 'image-down');
    },

    onClearClick: function () {
      domStyle.set(this.clearMapData, "display", "none");
      domStyle.set(this.submitData, "display", "none");
      domStyle.set(this.updateData, "display", "none");
      domStyle.set(this.addToMap, "display", "block");

      domStyle.set(this.mainContainer, "display", "none");
      domStyle.set(this.schemaMapInstructions, "display", "block");

      domStyle.set(this.processingNode, 'display', 'none');

      this.myCsvStore.clear();
    },

    onSubmitClick: function () {
      var featureLayer = this.myCsvStore.featureLayer;
      var oidField = this.myCsvStore.objectIdField;
      var flayer = this.editLayer;
      var features = [];
      array.forEach(featureLayer.graphics, function (feature) {
        if (feature.attributes.hasOwnProperty(oidField)) {
          delete feature.attributes[oidField];
        }
        if (feature.attributes.hasOwnProperty("_graphicsLayer")) {
          delete feature._graphicsLayer;
        }
        if (feature.attributes.hasOwnProperty("_layer")) {
          delete feature._layer;
        }
        features.push(feature);
      });
      flayer.applyEdits(features, null, null, function (e) {
        console.log(e);
      }, function (err) {
        console.log(err);
        new Message({
          message: this.nls.saveError
        });
      });
    }
  });
});