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
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/LayerInfos/LayerInfos',
    'esri/dijit/editing/Editor',
    "esri/dijit/editing/TemplatePicker",

    "esri/dijit/AttributeInspector", // Cam added block
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

    "dijit/form/Button",
    "./utils"
  ],
  function(declare, lang, array, html, query, esriBundle, on, _WidgetsInTemplateMixin,
    BaseWidget, LayerInfos, Editor, TemplatePicker,
    AttributeInspector, Draw, Edit, Query, Graphic, FeatureLayer, ConfirmDialog, Deferred,
    SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, event,
    Button, editUtils) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Edit',
      baseClass: 'jimu-widget-EnhancedEditor', // Cam
      _defaultStartStr: "",
      _defaultAddPointStr: "",
      resetInfoWindow: {},
      _sharedInfoBetweenEdits: {
        editCount: 0,
        resetInfoWindow: null
      },
      _jimuLayerInfos: null,
      _configEditor: null,

      // Cam
      settings: null,
      templatePicker: null,
      attrInspector: null,
      selectedTemplate: null,
      isDirty: false,
      currentLayer: null,
      updateFeature: null,

      startup: function() {
        this.inherited(arguments);
      },

      _init: function() {
        this._configEditor = lang.clone(this.config.editor);
      },

      onOpen: function() {
        this._init();
        LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function(operLayerInfos) {
            this._jimuLayerInfos = operLayerInfos;
            setTimeout(lang.hitch(this, function() {
              this.widgetManager.activateWidget(this);
              this._createEditor();
            }), 1);
          }));
      },

      onActive: function(){
        //this.disableWebMapPopup();
      },

      onDeActive: function(){
        //this.enableWebMapPopup();
      },

      // Cam
      // this function also create a new attribute inspector for the local layer
      _addGraphicToLocalLayer: function (evt) {
        if (!this.selectedTemplate) { return; }

        // assign the select layer to the member variable?

        var newAttributes = lang.mixin({}, this.selectedTemplate.template.prototype.attributes);
        var newGraphic = new Graphic(evt.geometry, null, newAttributes);
        // store original graphic for latter use
        newGraphic.original = new Graphic(newGraphic.toJson());

        // preparation for a new attributeInspector for the local layer
        var myLayer = this._cloneLayer(this.selectedTemplate.featureLayer);
        this._setSelectionSymbol(myLayer);

        var tempLayerInfos = this._getDefaultLayerInfosForLocalLayer(myLayer.originalLayerId);
        var newTempLayerInfos = this._converConfiguredLayerInfos(tempLayerInfos);
        newTempLayerInfos[0].featureLayer = myLayer;
        //newTempLayerInfos[0].showAttachments = false;

        // create a new attrinspector
        if (this.attrInspector) {
          this.attrInspector.destroy();
          this.attrInspector = null;
        }
        this.attrInspector = this._createAttributeInspector(newTempLayerInfos);

        myLayer.applyEdits([newGraphic], null, null, lang.hitch(this, function (e) {
          this.isDirty = true;
          var query = new Query();
          query.objectIds = [e[0].objectId];
          myLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW);
          this.updateFeature = newGraphic;
        }));
        this._showTemplate(false);
      },

      // Cam
      _cancelEditingFeature: function(){
        var layer = this.updateFeature.getLayer();
        if (layer.originalLayerId) {
          // the feature being edit is a new feature
          this.map.removeLayer(layer);
        }
        this.updateFeature = null;
        this.selectedTemplate = null;
        this.isDirty = false;
      },

      // Cam
      _cloneLayer: function (layer) {
        var cloneFeaturelayer;

        var featureCollection = {
          layerDefinition: {
            "id": 0,
            "name": layer.name,
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


      // Cam
      _createAttributeInspector: function (layerInfos) {
        var attrInspector = new AttributeInspector({
          layerInfos: layerInfos
        }, html.create("div", {
          style: {
            width: "100%",
            height: "100%"
          }
        }));
        html.place(attrInspector.domNode,
                  query(".jimu-widget-EnhancedEditor .templatePicker")[0],
                  "after");
        attrInspector.startup();


        var delButton = query(".atiButtons .atiDeleteButton", attrInspector.domNode)[0];

        //add additional buttons
        var validateButton = new Button({ label: this.nls.submit, "class": "validateButton" },
          html.create("div"));

        html.place(validateButton.domNode, delButton, "after");

        var resetButton = new Button({ label: this.nls.reset, "class": "resetButton" },
          html.create("div"));
        html.place(resetButton.domNode, validateButton.domNode, "after");

        var templateButton = new Button({ label: this.nls.cancel, "class": "templateButton" },
          html.create("div"));
        html.place(templateButton.domNode, resetButton.domNode, "after");

        //remove default delete button
        delButton.remove();

        //wire up the events
        resetButton.on("click", lang.hitch(this, function () {
          // Todo: attributes updated but not showed up on UI
          if (this.updateFeature) {

            var objId = this.updateFeature.attributes["OBJECTID"];
            var atts = JSON.parse(JSON.stringify(this.updateFeature.original.attributes));

            this.updateFeature.attributes = atts;
            this.updateFeature.attributes["OBJECTID"] = objId;

            this.updateFeature.getLayer().refresh(); //?
            //this.isDirty = false;
            attrInspector.refresh();
          }
        }));

        validateButton.on("click", lang.hitch(this, function () {
          // validate the fieldInfos
          var errorObj = this._validateRequiredFields();
          if (this._isObjectEmpty(errorObj)) {
            // apply
            this._postChanges().then(lang.hitch(this, function () {
              this._showTemplate(true);
              this.isDirty = false;
            }));
          } else {
            this._formatErrorFields(errorObj);
          }
        }));

        templateButton.on("click", lang.hitch(this, function () {
          if (this.isDirty) {
            this._resolvePendingEdit(true);
          } else {
            this._showTemplate(true);
          }
          if (this.templatePicker) {
            this.templatePicker.clearSelection();
          }
        }));

        attrInspector.on("attribute-change", lang.hitch(this, function (evt) {
          if (this.updateFeature) {
            this.updateFeature.attributes[evt.fieldName] = evt.fieldValue;
            this.isDirty = true;
          }
        }));

        return attrInspector;
      },

      // Cam
      _createEditor: function () {
        this.settings = this._getSettingsParam();

        var layers = this._getEditableLayers(this.settings.layerInfos);

        //var options = {};
        //options.allowAddVerticies = true;
        //options.allowDeleteVertices = true;

        var editToolbar = new Edit(this.map); //, options);
        //editToolbar.on("deactivate", lang.hitch(this, function (evt) {
        //  this.currentLayer.applyEdits(null, [evt.graphic], null);
        //}));

        array.forEach(layers, lang.hitch(this, function (layer) {
          var editingEnabled = false;
          // set selection symbol
          this._setSelectionSymbol(layer);

          //layer.on("dbl-click", lang.hitch(this, function (evt) {
          //  event.stop(evt);
          //  if (editingEnabled) {
          //    this.currentLayer = layer; // or layer?
          //    editingEnabled = false;
          //    editToolbar.deactivate();
          //    layer.clearSelection();
          //  } else {
          //    editingEnabled = true;
          //    editToolbar.activate(Edit.EDIT_VERTICES, evt.graphic);
          //    //var query = new Query();
          //    //query.objectIds = [evt.graphic.attributes[layer.objectIdField]];
          //    //layer.selectFeatures(query);
          //  }
          //}));

          layer.on("click", lang.hitch(this, function (evt) {
            this.map.setInfoWindowOnClick(false);
            event.stop(evt); //?
            // clear previously selected feature
            if (this.currentLayer) {
              this.currentLayer.clearSelection();
            }

            this.currentLayer = layer;
            editToolbar.deactivate();
            editingEnabled = false;

            if (evt.ctrlKey === true || evt.metaKey === true) {
              //delete feature if ctrl key is depressed
              layer.applyEdits(null, null, [evt.graphic]);
            } else {

              if (!this.templatePicker) { return; } // should never happen

              // resove any pending changes
              if (this.isDirty) {
                this._resolvePendingEdit(false).then(lang.hitch(this, function (e) {
                  this._processOnLayerClick(evt, layer);
                }));
              } else {
                this._processOnLayerClick(evt, layer);
              }
            }
          }));
        })); // end of array.forEach

        //create template picker
        this.templatePicker = new TemplatePicker({
          featureLayers: layers,
          rows: "auto",
          columns: 2,
          grouping: true,
          style: "height: auto, overflow: auto;"
        }, html.create("div")); 
        html.place(this.templatePicker.domNode, this.domNode, "last");

        this.templatePicker.startup();

        var drawToolbar = new Draw(this.map);

        // wire up events
        this.templatePicker.on("selection-change", lang.hitch(this, function () {
          this.selectedTemplate = this.templatePicker.getSelected();
          if (this.selectedTemplate) {
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


        //// create editor toolbar
        //this._createEditorToolbar(this.settings.layerInfos);
        //query("#editorDiv")[0].style.display = "none";
      },

      _createEditorToolbar: function (linfos) {
        var settings = {
          map: this.map,
          createOptions: {
            polygonDrawTools: [
              //Editor.CREATE_TOOL_ARROW,
              Editor.CREATE_TOOL_AUTOCOMPLETE,
              Editor.CREATE_TOOL_CIRCLE,
              Editor.CREATE_TOOL_ELLIPSE,
              Editor.CREATE_TOOL_RECTANGLE,
              Editor.CREATE_TOOL_TRIANGLE,
              Editor.CREATE_TOOL_POLYGON,
              Editor.CREATE_TOOL_FREEHAND_POLYGON
            ],
            polylineDrawTools: [
              Editor.CREATE_TOOL_POLYLINE,
              Editor.CREATE_TOOL_FREEHAND_POLYLINE
            ]
          },
          toolbarVisible: true,
          toolbarOptions: {
            reshapeVisible: true
          },
          layerInfos: linfos,
          templatePicker: null
        };

        var params = { settings: settings };
        var myEditor = new Editor(params, "editorDiv");
        myEditor.startup();
      },

      // Cam
      _filterOnlyUpdatedAttributes: function (attributes, origAttributes) {
        if (!attributes || attributes.length < 1 ||
            !origAttributes || origAttributes.length < 1) {
          return null;
        }

        var updatedAttrs = {};
        for (var prop in attributes) {
          if (attributes.hasOwnProperty(prop) &&
            attributes[prop] !== origAttributes[prop]) {
            updatedAttrs[prop] = attributes[prop];
          }
        }

        return updatedAttrs;
      },

      _findErrorElement: function (prop) {
        var list = this.attrInspector.attributeTable.getElementsByTagName("tr");
        for (var i = 0; i < list.length; i++) {
          //if (list[i].firstChild.innerText.toUpperCase() === prop.toUpperCase()) {
          if (list[i].firstChild.innerText === prop) {
            list[i].lastChild.getElementsByClassName("dijitValidationTextBox")[0]
              .style.borderColor = "red";
            //list[i].lastChild.style.borderColor = "red";
            return;
          }
        }
      },

      // Cam
      _formatErrorFields: function (errObject) {
        for (var prop in errObject) {
          if (errObject.hasOwnProperty(prop)) {
            // loop throug each row in the attrInspector 
            this._findErrorElement(prop);
          }
        }
      },


      // Cam
      _getDefaultLayerInfosForLocalLayer: function (layerId) {
        var defaultLayerInfos = [];
        var fieldInfos;

        var layerObject = this.map.getLayer(layerId);
        if (layerObject.type === "Feature Layer" && layerObject.url) {
          var layerInfo = {
            featureLayer: {}
          };
          layerInfo.featureLayer.id = layerObject.id;
          layerInfo.disableGeometryUpdate = false;
          fieldInfos = this._getDefaultFieldInfos(layerObject.id);
          if (fieldInfos && fieldInfos.length > 0) {
            layerInfo.fieldInfos = fieldInfos;
          }
          defaultLayerInfos.push(layerInfo);
        }

        return defaultLayerInfos;
      },

      // Cam
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

      // Cam
      _isObjectEmpty: function (obj) {
        if (obj) {
          for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
              return false;
            }
          }
          return true;
        }
        return true; //return true if obj is null
      },

      // Cam
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
            var newAttrs = this._filterOnlyUpdatedAttributes(
              this.updateFeature.attributes, this.updateFeature.original.attributes);

            if (newAttrs && !this._isObjectEmpty(newAttrs)) {
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

      // Cam
      _processOnLayerClick: function (evt, layer) {
        // The logic of adding new feature to local layer is handled
        // in the draw end event of the draw tool

        // viewing/editing existing features
        if (!this.selectedTemplate) {

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

          this.map.infoWindow.hide();

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

      // Cam
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

      // Cam - switchToTemplate=true if it's triggered by the cancel button on the attribute window 
      _resolvePendingEdit: function (switchToTemplate) {
        var deferred = new Deferred();
        var confirmDialog = new ConfirmDialog({
          title: "Save feature",
          content: "Would you like to save the current feature?",
          style: "width: 400px",
          onExecute: lang.hitch(this, function () {
            ////needed?
            //this.templatePicker.clearSelection();
            // call validate
            var valid = this._validateRequiredFields();
            if (valid) {
              // call applyEdit
              this._postChanges().then(lang.hitch(this, function () {
                if (switchToTemplate) {
                  this._showTemplate(true);
                }
                this.isDirty = false;

                deferred.resolve("success");
              }));
            } else {
              // for now
              alert("Not all required fields contain valid values.");
              deferred.resolve("failed");
            }
          }),
          onCancel: lang.hitch(this, function () { // not saving
            this._cancelEditingFeature();

            if (switchToTemplate) {
              this._showTemplate(true);
            }
            deferred.resolve();
          })
        });
        confirmDialog.show();
        //needed?
        this.templatePicker.clearSelection();
        return deferred.promise;
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

      // Cam
      _showTemplate: function (showTemplate) {
        if (showTemplate) {
          if (this.currentLayer) {
            this.currentLayer.clearSelection();
          }
          this.attrInspector.domNode.style.display = "none";
          //query(".jimu-widget-EnhancedEditor .esriEditor")[0].style.display = "block";
          //query("#editorDiv")[0].style.display = "none";
          this.templatePicker.domNode.style.display = "block";
          //this.templatePicker.domNode.previousElementSibling.style.display = "block";
          this.templatePicker.update();
        } else {
          this.templatePicker.domNode.style.display = "none";
          //this.templatePicker.domNode.previousElementSibling.style.display = "none";
          //query(".jimu-widget-EnhancedEditor .esriEditor")[0].style.display = "none";
          this.attrInspector.domNode.style.display = "block";
          //query("#editorDiv")[0].style.display = "block";
        }
        this.attrInspector.refresh();
      },

      _validateRequiredFields: function(){
        var errorObj = {};
        if (!this.updateFeature) { return errorObj; }//false; }

        //var errorFields = [];
        var layer = this.updateFeature.getLayer();

        layer.fields.filter(lang.hitch(this, function (field) {
          return field.nullable === false && field.editable === true;
        })).forEach(lang.hitch(this, function (f) {
          if (this.updateFeature.attributes[f.name] === "undefined") {
            errorObj[f.alias] = "undefined";
          } else {
            switch (f.type) {
              case "esriFieldTypeString":
                if (this.updateFeature.attributes[f.name].trim() === "") {
                  errorObj[f.alias] = "Empty string";
                }
                break;
              case "esriFieldTypeDate":
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
        array.forEach(layerInfos, function(layerInfo) {
          var layerObject = this.map.getLayer(layerInfo.featureLayer.id);
          if(layerObject &&
             layerObject.visible &&
             layerObject.isEditable &&
             layerObject.isEditable()) {
            layerInfo.featureLayer = layerObject;
            resultLayerInfosParam.push(layerInfo);
          }
        }, this);
        return resultLayerInfosParam;
      },

      // Cam
      _getSettingsParam: function() {
        var settings = {
          map: this.map,
          createOptions: {
            polygonDrawTools: [
              //Editor.CREATE_TOOL_ARROW,
              Editor.CREATE_TOOL_AUTOCOMPLETE,
              Editor.CREATE_TOOL_CIRCLE,
              Editor.CREATE_TOOL_ELLIPSE,
              Editor.CREATE_TOOL_RECTANGLE,
              Editor.CREATE_TOOL_TRIANGLE,
              Editor.CREATE_TOOL_POLYGON,
              Editor.CREATE_TOOL_FREEHAND_POLYGON
            ],
            polylineDrawTools: [
              Editor.CREATE_TOOL_POLYLINE,
              Editor.CREATE_TOOL_FREEHAND_POLYLINE
            ]
          }
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
        if (this.attrInspector) {
          this.attrInspector.destroy();
        }
        this.attrInspector = null;
        if (this.templatePicker) {
          this.templatePicker.destroy();
        }
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