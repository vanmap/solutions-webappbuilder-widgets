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
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/query',
    'dojo/i18n!esri/nls/jsapi',
    'dojo/on',
    'dojo/dom-construct',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/LayerInfos/LayerInfos',
    "esri/dijit/editing/TemplatePicker",

    //"dijit/ProgressBar", 
    //'jimu/dijit/SimpleTable', 
    "esri/dijit/AttributeInspector", 
    "esri/toolbars/draw",
    "esri/toolbars/edit",
    "esri/tasks/query",
    "esri/graphic",
    "esri/layers/FeatureLayer",
    "dijit/ConfirmDialog",
    "dojo/Deferred",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/Color",
    "dojo/_base/event",

    "./utils"
  ],
  function(declare, lang, array, html, query, esriBundle, on, domConstruct, _WidgetsInTemplateMixin,
    BaseWidget, LayerInfos, TemplatePicker, /*ProgressBar, Table,*/
    AttributeInspector, Draw, Edit, Query, Graphic, FeatureLayer, ConfirmDialog, Deferred,
    SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, event,
    editUtils) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Edit',
      baseClass: 'jimu-widget-enhancedEditor', 
      _defaultStartStr: "",
      _defaultAddPointStr: "",
      resetInfoWindow: {},
      _sharedInfoBetweenEdits: {
        editCount: 0,
        resetInfoWindow: null
      },
      _jimuLayerInfos: null,
      _configEditor: null,

      //_presetFieldInfos: null, // may be used if want to write out
      _presetFieldsTable: null,
      _layerEventHandlers: null,
      settings: null,
      templatePicker: null,
      attrInspector: null,
      selectedTemplate: null,
      //isDirty: false,
      currentLayer: null,
      updateFeature: null,
      attrInspIsCurrentlyDisplayed: false, 

      postCreate: function () {
        this.inherited(arguments);

        this._init();
        LayerInfos.getInstance(this.map, this.map.itemInfo)
        .then(lang.hitch(this, function (operLayerInfos) {
          this._jimuLayerInfos = operLayerInfos;
          setTimeout(lang.hitch(this, function () {
            this.widgetManager.activateWidget(this);
            this._createEditor();
          }), 50);
        }));
      },

      startup: function() {
        this.inherited(arguments);
      },

      destroy: function () {
        this.inherited(arguments);
        this._disconnectLayerEventHandler();

        if (this.attrInspector) {
          this.attrInspector.destroy();
        }
        this.attrInspector = null;

        if (this.templatePicker) {
          this.templatePicker.destroy();
        }
        this.templatePicker = null;

        if (this._presetFieldsTable)
        {
          this._presetFieldsTable.destroy();
        }
        this._presetFieldsTable = null;
      },

      _init: function () {
        this._layerEventHandlers = [];
        //this._presetFieldInfos = [];
        //this._initPresetFieldsTable();
        this._configEditor = lang.clone(this.config.editor);
      },

      onOpen: function() {
        //this._init();
        //LayerInfos.getInstance(this.map, this.map.itemInfo)
        //  .then(lang.hitch(this, function(operLayerInfos) {
        //    this._jimuLayerInfos = operLayerInfos;
        //    setTimeout(lang.hitch(this, function() {
        //      this.widgetManager.activateWidget(this);
        //      this._createEditor();
        //    }), 1);
        //  }));
      },

      onActive: function () {
        if (this.map) {
          this.map.setInfoWindowOnClick(false);
        }
      },

      onDeActive: function () {
        if (this.map) {
          this.map.setInfoWindowOnClick(true);
          //// resove any pending changes
          //if (this.isDirty) {
          //  this._resolvePendingEdit(false).then(lang.hitch(this, function (e) {
          //    this.map.setInfoWindowOnClick(true);
          //    this._disconnectLayerEventHandler();
          //  }));
          //} else {
          //  this.map.setInfoWindowOnClick(true);
          //  this._disconnectLayerEventHandler();
          //}
        }
      },

      // this function also create a new attribute inspector for the local layer
      _addGraphicToLocalLayer: function (evt) {
        if (!this.selectedTemplate) { return; }

        // assign the select layer to the member variable?

        var newAttributes = lang.mixin({}, this.selectedTemplate.template.prototype.attributes);
        var newGraphic = new Graphic(evt.geometry, null, newAttributes);
        // store original graphic for latter use
        newGraphic.original = new Graphic(newGraphic.toJson());

        var myLayer;
        if (this._newAttrInspectorNeeded()) {
          // remove the previous local layer
          this._removeLocalLayers();

          // preparation for a new attributeInspector for the local layer
          myLayer = this._cloneLayer(this.selectedTemplate.featureLayer);
          this._setSelectionSymbol(myLayer);

          var localLayerInfo = this._getLayerInfoForLocalLayer(myLayer);
          var newTempLayerInfos = this._converConfiguredLayerInfos([localLayerInfo]);

          this.attrInspector = this._createAttributeInspector(newTempLayerInfos);
        } else {
          myLayer = this.attrInspector.layerInfos[0].featureLayer;
        }

        myLayer.applyEdits([newGraphic], null, null, lang.hitch(this, function (e) {
          //this.isDirty = true;
          var query = new Query();
          query.objectIds = [e[0].objectId];
          myLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW);
          this.updateFeature = newGraphic;
        }));
        this._showTemplate(false);
      },

      _cancelEditingFeature: function () {
        this.map.infoWindow.hide();

        var layer = this.updateFeature.getLayer();
        if (layer.originalLayerId) {
          layer.clear();
        }
        layer.refresh();
        this.updateFeature = null;
        this.selectedTemplate = null;
        //this.isDirty = false;
      },

      _cloneLayer: function (layer) {
        var cloneFeaturelayer;

        var featureCollection = {
          layerDefinition: {
            "id": 0,
            "name": layer.name + this.nls.editorCache,
            "type": "Feature Layer",
            "displayField": layer.displayField,
            "description": "",
            "copyrightText": "",
            "relationships": [],
            "geometryType": layer.geometryType,
            "minScale": 0,
            "maxScale": 0,
            "extent": layer.fullExtent,
            "drawingInfo": {
              "renderer": layer.renderer,
              "transparency": 0,
              "labelingInfo": null
            },
            "hasAttachments": true,
            "htmlPopupType": "esriServerHTMLPopupTypeAsHTMLText",
            "objectIdField": layer.objectIdField,
            "globalIdField": layer.globalIdField,
            "typeIdField": layer.typeIdField,
            "fields": layer.fields,
            "types": layer.types,
            "templates": layer.templates,
            "capabilities": "Query,Editing"
          }
        };

        cloneFeaturelayer = new FeatureLayer(featureCollection, {
          id: layer.id + "_lfl",
          outFields: layer.fields.map(function (f) {
            return f.name;
          })
        });
        cloneFeaturelayer.visible = true;
        cloneFeaturelayer.renderer = layer.renderer;
        cloneFeaturelayer.originalLayerId = layer.id;

        // only keep one local layer
        var existingLayer = this.map.getLayer(layer.id + "_lfl");
        if (existingLayer) {
          this.map.removeLayer(existingLayer);
        }
        this.map.addLayer(cloneFeaturelayer);

        return cloneFeaturelayer;
      },

      _createAttributeInspector: function (layerInfos) {
        var attrInspector = new AttributeInspector({
          layerInfos: layerInfos
        }, html.create("div", {
          style: {
            width: "100%",
            height: "100%"
          }
        }));
        attrInspector.placeAt(this.attributeInspectorNode);
        attrInspector.startup();

        var delButton = query(".atiButtons .atiDeleteButton", attrInspector.domNode)[0];

        //add additional buttons
        var cancelButton = domConstruct.create("div", {
          innerHTML: this.nls.cancel,
          "class": "cancelButton jimu-btn"
        }, delButton, "after");

        var resetButton = domConstruct.create("div", {
          innerHTML: this.nls.reset,
          "class": "resetButton jimu-btn"
        }, cancelButton, "after");

        var validateButton = domConstruct.create("div", {
          innerHTML: this.nls.submit,
          "class": "validateButton jimu-btn"
        }, resetButton, "after");

        //remove default delete button
        delButton.remove();

        // create delete button using the config setting
        if (this._configEditor.showDeleteButton) {
          if (query(".jimu-widget-enhancedEditor .deleteButton").length < 1) {
            var deleteButton = domConstruct.create("div", {
              innerHTML: this.nls.del,
              "class": "deleteButton jimu-btn"
            }, query(".jimu-widget-enhancedEditor .topButtonsRowDiv")[0], "first");

            on(deleteButton, "click", lang.hitch(this, function () {
              if (this.updateFeature) {
                if (this._configEditor.displayPromptOnDelete) {
                  var confirmDialog = new ConfirmDialog({
                    title: "Delete feature",
                    content: "Are you sure you want to delete the selected feature?",
                    style: "width: 400px",
                    onExecute: lang.hitch(this, function () {
                      this._deleteFeature();
                    })
                  });
                  confirmDialog.show();
                } else {
                  this._deleteFeature();
                }
              }
            }));
          }
        }

        //wire up the events
        on(validateButton, "click", lang.hitch(this, function () {
          //if (!this.isDirty) { return; }

          // validate the fieldInfos
          var errorObj = this._validateRequiredFields();
          if (editUtils.isObjectEmpty(errorObj)) {
            // apply
            this._postChanges().then(lang.hitch(this, function () {
              this._showTemplate(true);
              //this.isDirty = false;
            }));
          } else {
            this._formatErrorFields(errorObj);
          }
        }));

        on(resetButton, "click", lang.hitch(this, function () {
          if (this.updateFeature) {
            var objId = this.updateFeature.attributes["OBJECTID"];
            var atts = JSON.parse(JSON.stringify(this.updateFeature.original.attributes));

            this.updateFeature.attributes = atts;
            this.updateFeature.attributes["OBJECTID"] = objId;

            this.updateFeature.getLayer().refresh(); //?
            attrInspector.refresh();

            //this.isDirty = false;
          }
        }));

        on(cancelButton, "click", lang.hitch(this, function () {
          if (this._configEditor.displayPromptOnSave) {
            this._promptToResolvePendingEdit(true);
          } else {
            this._cancelEditingFeature();
            this._showTemplate(true);
          }
          if (this.templatePicker) {
            this.templatePicker.clearSelection();
          }
        }));

        // attribute inspector events
        attrInspector.on("attribute-change", lang.hitch(this, function (evt) {
          if (this.updateFeature) {
            this.updateFeature.attributes[evt.fieldName] = evt.fieldValue;
            //this.isDirty = true;
          }
        }));

        return attrInspector;
      },

      _createEditor: function () {
        this.settings = this._getSettingsParam();

        var layers = this._getEditableLayers(this.settings.layerInfos);

        var editToolbar = new Edit(this.map); 

        array.forEach(layers, lang.hitch(this, function (layer) {
          // set selection symbol
          this._setSelectionSymbol(layer);

          var layerEvent = layer.on("click", lang.hitch(this, function (evt) {
            if (this.attrInspIsCurrentlyDisplayed) { 
              this.map.setInfoWindowOnClick(true);
            }else{
              this.map.setInfoWindowOnClick(false);
              event.stop(evt); //?
              // clear previously selected feature
              if (this.currentLayer) {
                this.currentLayer.clearSelection();
              }

              this.currentLayer = layer;
              editToolbar.deactivate();

              this._processOnLayerClick(evt, layer);
            } 
          }));

          this._layerEventHandlers.push(layerEvent);

        })); // end of array.forEach

        //create template picker
        this.templatePicker = new TemplatePicker({
          featureLayers: layers,
          rows: "auto",
          columns: 2,
          grouping: true,
          style: "height: auto, overflow: auto;"
        }, html.create("div")); 
        this.templatePicker.placeAt(this.templatePickerNode);
        this.templatePicker.startup();

        var drawToolbar = new Draw(this.map);

        // wire up events
        this.templatePicker.on("selection-change", lang.hitch(this, function () {
          if (this.templatePicker.getSelected()) {
            this.selectedTemplate = this.templatePicker.getSelected();

            if (this.map) {
              this.map.setInfoWindowOnClick(false);
            }

            switch (this.selectedTemplate.featureLayer.geometryType) {
              case "esriGeometryPoint":
                drawToolbar.activate(Draw.POINT);
                break;
              case "esriGeometryPolyline":
                drawToolbar.activate(Draw.POLYLINE);
                break;
              case "esriGeometryPolygon":
                drawToolbar.activate(Draw.POLYGON);
                break;
            }
          }
        }));

        drawToolbar.on("draw-end", lang.hitch(this, function (evt) {
          drawToolbar.deactivate();
          editToolbar.deactivate();
          this._addGraphicToLocalLayer(evt);
        }));

        // set preset values table
        if (this._hasPresetValueFields()) {
          this._initPresetFieldsTable();
          this._fillPresetValueTable();
          query(".presetFieldsTableDiv")[0].style.display = "block";
        } else {
          query(".presetFieldsTableDiv")[0].style.display = "none";
        }
      },

      _deleteFeature: function(){
        if(!this.updateFeature) { return; }

        var layer = this.updateFeature.getLayer();
        if (layer.url === null) {
          layer.clear();
        } else {
          this.progressBar.domNode.style.display =  "block";
          layer.applyEdits(null, null, [this.updateFeature], lang.hitch(this, function (e) {
            this.progressBar.domNode.style.display = "none";
            this._showTemplate(true);
            this.updateFeature = null;
          }));
        }
        //this.isDirty = false;
      },

      _disconnectLayerEventHandler: function () {
        if (!this._layerEventHandlers) { return; }

        array.forEach(this._layerEventHandlers, function (layerEventHandler) {
          if (layerEventHandler && layerEventHandler.remove) {
            layerEventHandler.remove();
          }
        });
        this._layerEventHandlers = [];
      },

      _hasPresetValueFields: function () {
        for (var i = 0; i < this.settings.layerInfos.length; i++) {
          var found = this.settings.layerInfos[i].fieldInfos.some(function (fi) {
            return fi.canPresetValue === true;
          });
          if (found) {
            return true;
          }
        }
        return false;
      },

      _fillPresetValueTable: function () {
        var presetFieldInfos = [];
        array.forEach(this.settings.layerInfos, function (layerInfo) {
          array.forEach(layerInfo.fieldInfos, function (fieldInfo) {
            if (fieldInfo.canPresetValue) {

              // concat aliases if needed
              var exist = false;
              var idx = fieldInfo.label.indexOf("<a ");
              var fieldLabel = idx < 0 ?
                fieldInfo.label : fieldInfo.label.substring(0, idx);

              for (var i = 0; i < presetFieldInfos.length; i++) {
                if (presetFieldInfos[i].fieldName === fieldInfo.fieldName) {
                  // concat fieldAlias if same fieldName
                  if (!editUtils.checkIfFieldAliasAlreadyExists(presetFieldInfos[i].label, fieldLabel)){
                    presetFieldInfos[i].label = lang.replace("{alias},{anotherAlias}",
                    {
                      alias: presetFieldInfos[i].label,
                      anotherAlias: fieldLabel
                    });

                    exist = true;
                    break;
                  }
                }
              }
              // or add to the collection if new
              if (!exist) {
                presetFieldInfos.push({
                  fieldName: fieldInfo.fieldName,
                  label: fieldLabel,
                  presetValue: fieldInfo.presetValue,
                  type: fieldInfo.type,
                  domain: fieldInfo.domain
                });
              }
            }
          }, this);
        });

        // fill the table
        array.forEach(presetFieldInfos, lang.hitch(this, function (presetFieldInfo) {
          var row = domConstruct.create("tr",
            { "class": "ee-presetValue-table-row" });

          var aliasColumnNode = domConstruct.create("td",
            { "class": "ee-presetValue-table-cell field-alias-label" }, row);

          domConstruct.place(lang.replace(
            "<div class='alias-text-div' title='{fieldAlias}'>{fieldAlias}</div>",
            { fieldAlias: presetFieldInfo.label }), aliasColumnNode);

          var presetValueNode = editUtils.createPresetFieldContentNode(presetFieldInfo);

          var valueColumnNode = domConstruct.create("td",
            { "class": "ee-presetValue-table-cell preset-value-editable" }, row);

          domConstruct.place(presetValueNode, valueColumnNode, "first");

          query("#eePresetValueBody")[0].appendChild(row);
        }));
      },

      _formatErrorFields: function (errObject) {
        var list = this.attrInspector.attributeTable.getElementsByTagName("tr");
        var firstErrorFieldIndex = -1;
        for (var prop in errObject) {
          if (errObject.hasOwnProperty(prop)) {
            // loop throug each row in the attrInspector 
            for (var i = 0; i < list.length; i++) {
              //if (list[i].firstChild.innerText.toUpperCase() === prop.toUpperCase()) {
              if (list[i].firstChild.innerText.indexOf(prop) === 0) {
                list[i].lastChild.getElementsByClassName("dijitReset dijitInputInner")[0].focus();
                // store for later use
                if (firstErrorFieldIndex === -1) {
                  firstErrorFieldIndex = i;
                }
                break;
              }
            }
          }
        }

        if (Object.keys(errObject).length > 1) {
          list[firstErrorFieldIndex].lastChild
            .getElementsByClassName("dijitReset dijitInputInner")[0].focus();
        } else {
          //query(".jimu-widget-enhancedEditor .esriAttributeInspector .validateButton")[0].focus();
          list[0].lastChild.getElementsByClassName("dijitReset dijitInputInner")[0].focus();
        }
      },

      _getEditableLayers: function (layerInfos) {
        var layers = [];
        array.forEach(layerInfos, function (layerInfo) {
          var layerObject = this.map.getLayer(layerInfo.featureLayer.id);
          if (layerObject &&
             layerObject.visible &&
             layerObject.isEditable &&
             layerObject.isEditable()) {
            layers.push(layerObject);
          }
        }, this);
        return layers;
      },

      _getLayerInfoForLocalLayer: function (localLayer) {
        var layerInfo;
        var fieldInfos;
        var layerObject = this.map.getLayer(localLayer.originalLayerId);
        if (layerObject.type === "Feature Layer" && layerObject.url) {
          // get the fieldInfos
          layerInfo = {
            featureLayer: localLayer,
            disableGeometryUpdate: false
          };

          fieldInfos = this._getDefaultFieldInfos(layerObject.id);
          if (fieldInfos && fieldInfos.length > 0) {
            layerInfo.fieldInfos = fieldInfos;
          }

          // modify field infos
          this._modifyFieldInfosForEE(layerInfo);
        }
        return layerInfo;
      },

      _initPresetFieldsTable: function () {
        var presetValueTableNode = domConstruct.create("div", { "class": "ee-presetValueTableDiv" },
          this.presetFieldsTableNode);

        var headerDiv = domConstruct.create("div", { "class": "headerDiv" }, presetValueTableNode);
        var bodyDiv = domConstruct.create("div", { "class": "bodyDiv" }, presetValueTableNode);

        var headerTable = domConstruct.create("table",
          { "class": "ee-presetValueHeaderTable" }, headerDiv, "first");

        var header = domConstruct.create("thead", { "class": "ee-presetValueHeader" },
          headerTable, "first");

        var headerRow = domConstruct.place("<tr></tr>", header);

        domConstruct.place(lang.replace(
          "<th title='Field Alias' class='ee-presetValue-header-field'>{replace}</th>",
          { replace: this.nls.presetFieldAlias }), headerRow);

        domConstruct.place(lang.replace(
          "<th title='Preset Value' class='ee-presetValue-header-field'>{replace}</th>", 
          { replace: this.nls.presetValue }), headerRow);

        var bodyTable = domConstruct.create("table",
          { "class": "ee-presetValueBodyTable" }, bodyDiv);

        domConstruct.create("tbody", { "class": "ee-presetValueBody", "id": "eePresetValueBody" },
          bodyTable, "first");
      },

      // to add (*) to the label of required fields
      // also add field type and domain to use in the preset values
      _modifyFieldInfosForEE: function (layerInfo) {
        if (!layerInfo) { return; }

        var layerObject = this.map.getLayer(layerInfo.featureLayer.id);
        layerObject.fields.filter(lang.hitch(this, function (field) {
          return field.nullable === false && field.editable === true;
        })).forEach(lang.hitch(this, function (f) {
          layerInfo.fieldInfos.forEach(function (finfo) {
            if (finfo.fieldName === f.name) {
              finfo.label = finfo.label +
                '<a class="asteriskIndicator"> *</a>';
            }
          });
        }));

        // add the type for layer use, by the way
        layerInfo.fieldInfos.forEach(function (finfo) {
          var field = layerObject.fields.find(function (f) {
            return f.name === finfo.fieldName;
          });
          finfo.type = field.type;
          finfo.domain = field.domain;
        });
      },

      _newAttrInspectorNeeded: function () {
        var yes = false;
        if (!this.attrInspector || this.attrInspector.layerInfos.length > 1) {
          yes = true;
        }else{ //this.attrInspector.layerInfos.length == 1
          var lflId = this.attrInspector.layerInfos[0].featureLayer.id;
          if (lflId.indexOf("_lfl") > 0){ // attrInspector associated with a local feature
            yes = lflId.indexOf(this.selectedTemplate.featureLayer.id) < 0;
          }else{
            yes = true;
          }
        }

        if (yes && this.attrInspector) {
          this.attrInspector.destroy();
          this.attrInspector = null;
        }
        return yes;
      },

      _postChanges: function () {
        var deferred = new Deferred();

        if (this.updateFeature) {
          if (this.updateFeature.getLayer().originalLayerId) {
            // add a feature
            var featureLayer = this.map.getLayer(this.updateFeature.getLayer().originalLayerId);
            if (featureLayer) {
              // modify some attributes before calling applyEdits
              this.updateFeature.attributes["OBJECTID"] = null;
              this.updateFeature.symbol = null;
              featureLayer.applyEdits([this.updateFeature]);
              featureLayer.clearSelection();

              this.updateFeature.getLayer().clear();
              this.updateFeature = null;
              this.selectedTemplate = null;

              deferred.resolve("success");
            } // if featureLayer not null
          } else {
            // update existing feature
            // only get the updated attributes
            var newAttrs = editUtils.filterOnlyUpdatedAttributes(
              this.updateFeature.attributes, this.updateFeature.original.attributes);

            if (newAttrs && !editUtils.isObjectEmpty(newAttrs)) {
              this.updateFeature.attributes = newAttrs;

              // modify some important attributes before calling applyEdits
              this.updateFeature.attributes["OBJECTID"] =
                this.updateFeature.original.attributes["OBJECTID"];
              this.updateFeature.original = null;

              this.updateFeature.getLayer().applyEdits(null, [this.updateFeature], null,
                lang.hitch(this, function (e) {
                // sometimes a successfully update returns an empty array
                //if (e && e.length > 0 && e[0].success) {
                this.updateFeature.getLayer().refresh();
                deferred.resolve("success");
                //}
              }), function (e) {
                // for now
                alert("Error when performing update ApplyEdits");
                deferred.resolve("failed");
              });
            }
          } // no attribute update
        }
        deferred.resolve();

        return deferred.promise;
      },

      _processOnLayerClick: function (evt, layer) {
        // The logic of adding new feature to local layer is handled
        // in the draw end event of the draw tool

        // viewing/editing existing features
        if (!this.selectedTemplate) {
          this.map.infoWindow.hide();
          // recreate the attr inspector if needed
          if (!this.attrInspector) {
            this.attrInspector = this._createAttributeInspector(this.settings.layerInfos);
          } else {
            // if previously the atts inspector is created for an add activity, recreate it
            if (this.attrInspector.layerInfos.length === 1 &&
                this.attrInspector.layerInfos[0].featureLayer.id.lastIndexOf("_lfl") > 0) {
              this.attrInspector.destroy();
              this.attrInspector = null;
              this.attrInspector = this._createAttributeInspector(this.settings.layerInfos);
            }
          }

          var selectQuery = new Query();
          selectQuery.objectIds = [evt.graphic.attributes["OBJECTID"]];
          layer.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW,
            lang.hitch(this, function (features) {
              if (features && features.length > 0) {
                // store the feature to be edited
                this.updateFeature = features[0];
                this.updateFeature.original = new Graphic(this.updateFeature.toJson());
                // show attribute inspector
                this._showTemplate(false);
              }
            }));
        }
      },

      _promptToResolvePendingEdit: function (switchToTemplate) {
        var deferred = new Deferred();
        var confirmDialog = new ConfirmDialog({
          title: "Save feature",
          content: "Would you like to save the current feature?",
          style: "width: 400px",
          onExecute: lang.hitch(this, function () {
            ////needed?
            //this.templatePicker.clearSelection();
            this._saveEdit(switchToTemplate).then(function () { deferred.resolve(); });
          }),
          onCancel: lang.hitch(this, function () { // not saving
            this._cancelEditingFeature();

            this._showTemplate(switchToTemplate);
            deferred.resolve();
          })
        });
        confirmDialog.show();
        //needed?
        this.templatePicker.clearSelection();

        return deferred.promise;
      },

      _removeLocalLayers: function () {
        var mymap = this.map;
        if (mymap) {
          mymap.graphicsLayerIds.filter(function (e) {
            return e.lastIndexOf("_lfl") > 0;
          }).map(function (e) {
            return mymap.getLayer(e);
          }).forEach(function (e) {
            mymap.removeLayer(e);
          });

          this.currentLayer = null;
          this.updateFeature = null;
        }
      },

      _removeSpacesInLayerTemplates: function (layer) {
        if (!layer) { return; }

        layer.fields.filter(lang.hitch(this, function (field) {
          return field.nullable === false && field.editable === true;
        })).forEach(lang.hitch(this, function (f) {
          // trim of space in the field value
          layer.templates.forEach(function (t) {
            if (t.prototype.attributes[f.name] === " ") {
              t.prototype.attributes[f.name] = t.prototype.attributes[f.name].trim();
            }
          });
        }));
      },

      _saveEdit: function (switchToTemplate) {
        var deferred = new Deferred();
        var errorObj = this._validateRequiredFields();

        if (editUtils.isObjectEmpty(errorObj)) {
          // call applyEdit
          this._postChanges().then(lang.hitch(this, function () {
            if (switchToTemplate) {
              this._showTemplate(true);
            }
            //this.isDirty = false;
            deferred.resolve("success");
          }));
        } else {
          this._formatErrorFields(errorObj);
          deferred.resolve("failed");
        }
        return deferred.promise;
      },

      _savePresetFieldInfos: function () {
        var presetValueTable = query("#eePresetValueBody")[0];
        if (presetValueTable) {
          var inputElements = presetValueTable.getElementsByClassName("ee-presetValue-input");
          array.forEach(inputElements, lang.hitch(this, function (element) {
            if (element.value) {
              //// store to memeber variable
              //this._presetFieldInfos.push({
              //  "fieldName": fieldData.fieldName,
              //  "label": fieldData.label,
              //  "presetValue": fieldData.presetValue
              //});

              // store to the settings
              array.forEach(this.settings.layerInfos, function (layerInfo) {
                for (var i = 0; i < layerInfo.featureLayer.templates.length; i++) {
                  if (layerInfo.featureLayer.templates[i].prototype.attributes.hasOwnProperty(element.name)) {
                    layerInfo.featureLayer.templates[i].prototype.attributes[element.name] = element.value;
                  }
                }
              });
            }
          }));
        }
      },

      _setSelectionSymbol: function (layer) {
        if (!layer) { return; }

        var selectionSymbol;
        switch (layer.geometryType) {
          case "esriGeometryPoint":
            selectionSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,
                              20,
                              new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                  new Color([255, 0, 0]), 1),
                              new Color([0, 255, 0, 0.15]));
            break;
          case "esriGeometryPolyline":
            selectionSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                  new Color([255, 0, 0]), 1);
            break;
          case "esriGeometryPolygon":
            selectionSymbol = new SimpleFillSymbol().setColor(new Color([255, 255, 0, 0.5]));
            break;
        }
        layer.setSelectionSymbol(selectionSymbol);
      },

      _showTemplate: function (showTemplate) {
        if (showTemplate) {
          if (this.currentLayer) {
            this.currentLayer.clearSelection();
          }
          query(".jimu-widget-enhancedEditor .attributeInspectorMainDiv")[0].style.display = "none";
          query(".jimu-widget-enhancedEditor .templatePickerMainDiv")[0].style.display = "block";
          this.templatePicker.update();
        } else {
          query(".jimu-widget-enhancedEditor .templatePickerMainDiv")[0].style.display = "none";
          query(".jimu-widget-enhancedEditor .attributeInspectorMainDiv")[0].style.display = "block";
        }
        this.attrInspector.refresh();
        this.attrInspIsCurrentlyDisplayed = !showTemplate;
      },

      _validateRequiredFields: function(){
        var errorObj = {};

        if (!this.updateFeature) { return errorObj; }

        var layer = this.updateFeature.getLayer();

        layer.fields.filter(lang.hitch(this, function (field) {
          return field.nullable === false && field.editable === true;
        })).forEach(lang.hitch(this, function (f) {
          if (this.updateFeature.attributes[f.name] === "undefined") {
            errorObj[f.alias] = "undefined";
          } else {
            switch (f.type) {
              case "esriFieldTypeString":
                if (this.updateFeature.attributes[f.name] === "" ||
                    (this.updateFeature.attributes[f.name] &&
                    this.updateFeature.attributes[f.name].trim() === "")) {
                  errorObj[f.alias] = "Empty string";
                }
                break;
              default:
                break;
            }
          }
        }));
        return errorObj;
      },

      _getDefaultFieldInfos: function(layerId) {
        // summary:
        //  filter webmap fieldInfos.
        // description:
        //   return null if fieldInfos has not been configured in webmap.
        var fieldInfos = editUtils.getFieldInfosFromWebmap(layerId, this._jimuLayerInfos);
        if(fieldInfos) {
          fieldInfos = array.filter(fieldInfos, function(fieldInfo) {
            return fieldInfo.visible || fieldInfo.isEditable;
          });
        }
        return fieldInfos;
      },

      _getDefaultLayerInfos: function() {
        var defaultLayerInfos = [];
        var fieldInfos;
        for(var i = this.map.graphicsLayerIds.length - 1; i >= 0 ; i--) {
          var layerObject = this.map.getLayer(this.map.graphicsLayerIds[i]);
          if (layerObject.type === "Feature Layer" && layerObject.url) {
            var layerInfo = {
              featureLayer: {}
            };
            layerInfo.featureLayer.id = layerObject.id;
            layerInfo.disableGeometryUpdate = false;
            fieldInfos = this._getDefaultFieldInfos(layerObject.id);
            if(fieldInfos && fieldInfos.length > 0) {
              layerInfo.fieldInfos = fieldInfos;
            }
            defaultLayerInfos.push(layerInfo);
          }
        }
        return defaultLayerInfos;
      },

      _converConfiguredLayerInfos: function(layerInfos) {
        array.forEach(layerInfos, function(layerInfo) {
          // convert layerInfos to compatible with old version
          if(!layerInfo.featureLayer.id && layerInfo.featureLayer.url) {
            var layerObject = getLayerObjectFromMapByUrl(this.map, layerInfo.featureLayer.url);
            if(layerObject) {
              layerInfo.featureLayer.id = layerObject.id;
            }
          }

          // convert fieldInfos
          var newFieldInfos = [];
          var webmapFieldInfos =
            editUtils.getFieldInfosFromWebmap(layerInfo.featureLayer.id, this._jimuLayerInfos);
          array.forEach(layerInfo.fieldInfos, function(fieldInfo) {
            if(/*fieldInfo.isEditable &&*/
              // only for compitible with old version of config.
              // 'globalid' and 'objectid' can not appear in new app's config.
               fieldInfo.fieldName !== "globalid" &&
               fieldInfo.fieldName !== "objectid") {
              var webmapFieldInfo = getFieldInfoFromWebmapFieldInfos(webmapFieldInfos, fieldInfo);
              if(webmapFieldInfo) {
                if( webmapFieldInfo.isEditable ||
                    webmapFieldInfo.isEditableSettingInWebmap ||
                    webmapFieldInfo.visible) {
                  newFieldInfos.push(webmapFieldInfo);
                }
              } else {
                newFieldInfos.push(fieldInfo);
              }
            }
          }, this);

          if(newFieldInfos.length !== 0) {
            layerInfo.fieldInfos = newFieldInfos;
          }
        }, this);
        return layerInfos;

        function getFieldInfoFromWebmapFieldInfos(webmapFieldInfos, fieldInfo) {
          var resultFieldInfo = null;
          if(webmapFieldInfos) {
            for(var i = 0; i < webmapFieldInfos.length; i++) {
              if(fieldInfo.fieldName === webmapFieldInfos[i].fieldName) {
                webmapFieldInfos[i].label = fieldInfo.label;
                webmapFieldInfos[i].isEditableSettingInWebmap = webmapFieldInfos[i].isEditable;
                webmapFieldInfos[i].isEditable = fieldInfo.isEditable;
                webmapFieldInfos[i].canPresetValue = fieldInfo.canPresetValue;
                resultFieldInfo = webmapFieldInfos[i];
                // resultFieldInfo.label = fieldInfo.label;
                // resultFieldInfo.isEditableSettingInWebmap = webmapFieldInfos[i].isEditable;
                // resultFieldInfo.isEditable = fieldInfo.isEditable;
                break;
              }
            }
          }
          return resultFieldInfo;
        }

        function getLayerObjectFromMapByUrl(map, layerUrl) {
          var resultLayerObject = null;
          for(var i = 0; i < map.graphicsLayerIds.length; i++) {
            var layerObject = map.getLayer(map.graphicsLayerIds[i]);
            if(layerObject.url.toLowerCase() === layerUrl.toLowerCase()) {
              resultLayerObject = layerObject;
              break;
            }
          }
          return resultLayerObject;
        }
      },

      _getLayerInfosParam: function() {
        // var retDef = new Deferred();
        // var defs = [];
        var layerInfos;
        var resultLayerInfosParam = [];
        if(!this._configEditor.layerInfos) {
          // configured in setting page and no layers checked.
          layerInfos = [];
        } else if(this._configEditor.layerInfos.length > 0)  {
          // configured and has been checked.
          layerInfos = this._converConfiguredLayerInfos(this._configEditor.layerInfos);
        } else {
          // has not been configure.
          layerInfos = this._getDefaultLayerInfos();
        }

        //according to condition to filter
        array.forEach(layerInfos, function (layerInfo) {
          var layerObject = this.map.getLayer(layerInfo.featureLayer.id);
          if(layerObject &&
             layerObject.visible &&
             layerObject.isEditable &&
             layerObject.isEditable()) {

            // modify templates with space in string fields
            this._removeSpacesInLayerTemplates(layerObject);

            // modify field infos
            this._modifyFieldInfosForEE(layerInfo);

            layerInfo.featureLayer = layerObject;
            resultLayerInfosParam.push(layerInfo);
          }
        }, this);

        return resultLayerInfosParam;
      },

      _getSettingsParam: function() {
        var settings = {
          map: this.map
        };
        for (var attr in this._configEditor) {
          settings[attr] = this._configEditor[attr];
        }
        settings.layerInfos = this._getLayerInfosParam();

        return settings;
      },

      resize: function() {
      },

      onClose: function() {
        //if (this.attrInspector) {
        //  this.attrInspector.destroy();
        //}
        //this.attrInspector = null;

        //if (this.templatePicker) {
        //  this.templatePicker.destroy();
        //}
        ////this.templatePicker = null;

        //if (this._presetFieldsTable)
        //{
        //  this._presetFieldsTable.destroy();
        //}
        ////this._presetFieldsTable = null;

        // close method will call onDeActive automaticlly
        // so do not need to call onDeActive();
        this._worksAfterClose();
      },

      _worksAfterClose: function() {
        esriBundle.toolbars.draw.start = this._defaultStartStr;
        esriBundle.toolbars.draw.addPoint = this._defaultAddPointStr;

        // show lable layer.
        var labelLayer = this.map.getLayer("labels");
        if(labelLayer) {
          labelLayer.show();
        }
      },

      onNormalize: function(){
        setTimeout(lang.hitch(this, this._update), 100);
      },

      onMinimize: function(){
      },

      onMaximize: function(){
        setTimeout(lang.hitch(this, this._update), 100);
      }
    });
  });