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
    'jimu/MapManager',
    'jimu/LayerInfos/LayerInfos',
    'jimu/dijit/FilterEditor',
    'esri/dijit/editing/Editor',
    'esri/dijit/Popup',
    "esri/dijit/editing/TemplatePicker",

    "esri/dijit/AttributeInspector", // Cam added block
    "esri/graphic",
    "esri/layers/FeatureLayer",
    "dijit/ConfirmDialog",
    "dojo/Deferred",

    "dijit/form/Button",
    "./utils"
  ],
  function(declare, lang, array, html, query, esriBundle, on, _WidgetsInTemplateMixin,
    BaseWidget, MapManager, LayerInfos, FilterEditor, Editor, Popup, TemplatePicker,
    AttributeInspector, Graphic, FeatureLayer, ConfirmDialog, Deferred,
    Button, editUtils) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Edit',
      baseClass: 'jimu-widget-EnhancedEditor', // Cam
      editor: null,
      _defaultStartStr: "",
      _defaultAddPointStr: "",
      resetInfoWindow: {},
      _sharedInfoBetweenEdits: {
        editCount: 0,
        resetInfoWindow: null
      },
      _jimuLayerInfos: null,
      editPopup: null,
      _configEditor: null,

      // Cam
      templatePicker: null,
      attrInspector: null,
      isDirty: false,
      currentLocalFeatureLayer: null,
      localFeatureLayers: [],

      startup: function() {
        this.inherited(arguments);
        this.editPopup = new Popup(null, html.create("div",
                                                    {"class":"jimu-widget-edit-infoWindow"},
                                                    null,
                                                    this.map.root));
        // Cam
        if (this.config.editor.useEnhancedEditFeatures) {
          on(this.map, "click", lang.hitch(this, this._onMapClick));
        }
      },

      _init: function() {
        this._editorMapClickHandlers = [];
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
        this.disableWebMapPopup();
      },

      onDeActive: function(){
        this.enableWebMapPopup();
        // Cam
        if (this.config.editor.useEnhancedEditFeatures) {
          this._removeLocalLayers();
        }
      },

      disableWebMapPopup: function() {
        var mapManager = MapManager.getInstance();
        mapManager.disableWebMapPopup();
        // hide map's infoWindow
        this.map.infoWindow.hide();
        // instead of map's infowindow by editPopup
        this.map.setInfoWindow(this.editPopup);
        this._enableMapClickHandler();

        // instead of Mapmanager.resetInfoWindow by self resetInfoWindow
        if (this._sharedInfoBetweenEdits.resetInfoWindow === null) {
          this._sharedInfoBetweenEdits.resetInfoWindow = mapManager.resetInfoWindow;
          this.own(on(this.map.infoWindow, "show", lang.hitch(this, function() {
            if (window.appInfo.isRunInMobile) {
              this.map.infoWindow.maximize();
            }
          })));
        }
        mapManager.resetInfoWindow = lang.hitch(this, function() {});

        //this._sharedInfoBetweenEdits.editCount++;
      },

      enableWebMapPopup: function() {
        var mapManager = MapManager.getInstance();
        var mapInfoWindow = mapManager.getMapInfoWindow();
        // recover restInfoWindow when close widget.
        //this._sharedInfoBetweenEdits.editCount--;
        if (this._sharedInfoBetweenEdits.resetInfoWindow) {
          //this._sharedInfoBetweenEdits.editCount === 0 &&

          this.map.setInfoWindow(mapInfoWindow.bigScreen);
          mapManager.isMobileInfoWindow = false;

          mapManager.resetInfoWindow =
            lang.hitch(mapManager, this._sharedInfoBetweenEdits.resetInfoWindow);
          this._sharedInfoBetweenEdits.resetInfoWindow = null;
          mapManager.resetInfoWindow();
          this._disableMapClickHandler();
          // hide popup and delete selection
          this.editPopup.hide();
          if (typeof this.editor._clearSelection === "function") {
            this.editor._clearSelection();
          }
          // recall enableWebMap
          mapManager.enableWebMapPopup();
        }
      },

      // Cam 
      _onMapClick: function (evt) {
        this.map.setInfoWindowOnClick(false);

        if (!this.templatePicker) { return;} // should never happen
        
        // resove any pending changes
        if (this.isDirty) {
          this._resolvePendingEdit(false).then(lang.hitch(this, function (e) {
            this._processOnMapClick(evt);
          }));
        }else
        {
          this._processOnMapClick(evt);
        }
      },

      // Cam
      _processOnMapClick: function(evt){
        // user adds a new feature
        this._clearLocalGraphic();

        var selectedTemplate = this.templatePicker.getSelected();
        if (selectedTemplate) {
          // add the selected feature to the equivalent local feature layer
          var graphic = new Graphic(evt.mapPoint,
                        null,
                        selectedTemplate.template.prototype.attributes);
          graphic.setSymbol(selectedTemplate.featureLayer.renderer.getSymbol(graphic));
          this._addGraphicToLocalFeatuerLayer(graphic,
                                              selectedTemplate.featureLayer.id,
                                              false);
          // since add, set isDirty to true
          this.isDirty = true;
        } else {
          var graphic = new Graphic(evt.graphic.geometry,
                        evt.graphic.symbol,
                        evt.graphic.attributes);
          this._addGraphicToLocalFeatuerLayer(graphic, evt.graphic.getLayer().id, true);
        }
      }, 

      // Cam
      _addGraphicToLocalFeatuerLayer: function(graphic, layer_id, update){
        // if it's an update then store its origial graphic
        if (update) {
          graphic.original = new Graphic(graphic.toJson());
        }

        var layerId = layer_id.lastIndexOf("_lfl") < 1 ? layer_id + "_lfl" : layer_id;
        
        // add the feature to its corresponding local layer
        this.currentLocalFeatureLayer = this.map.getLayer(layerId);
        if (this.currentLocalFeatureLayer) {
          this.currentLocalFeatureLayer.applyEdits([graphic], null, null,
            lang.hitch(this, function (e) {
            if (e && e.length > 0 && e[0].success) {
              this.currentLocalFeatureLayer.refresh();
              this._showTemplate(false);
              // ?
              this.templatePicker.clearSelection();
            }
          }), lang.hitch(this, function (e) {
            // for now
            alert("Error when adding feature to local layer.");
          }));
        }
      },

      // Cam
      _clearLocalGraphic: function () {
        if (this.currentLocalFeatureLayer) {
          this.currentLocalFeatureLayer.clear();
        }
      },

      // Cam
      _cloneLayer: function (layer) {
        var cloneFeaturelayer;
        var json = layer.renderer.toJson(); //
        var renderer = null; //
        switch (json.type) {
          case "simpleRenderer":
            renderer = new SimpleRenderer(json);
        }

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
        cloneFeaturelayer.renderer =  layer.renderer;
        //cloneFeaturelayer.originalLayer = layer;
        cloneFeaturelayer.originalLayerId = layer.id;

        this.map.addLayer(cloneFeaturelayer);

        return cloneFeaturelayer;
      },

      // Cam
      _createAttributeInspector: function () {
        // there could be another inspector so need to query for the right one
        if (query(".jimu-widget-EnhancedEditor .esriAttributeInspector").length > 0)
        {
          return;
        }

        var linfos = this.editor.settings.layerInfos;

        this.attrInspector = new AttributeInspector({
          layerInfos: linfos
        }, html.create("div", {
          style: {
            width: "100%",
            height: "100%"
          }
        }));
        html.place(this.attrInspector.domNode,
                  query(".jimu-widget-EnhancedEditor .templatePicker")[0],
                  "after");
        this.attrInspector.startup();

        var delButton = query(".jimu-widget-EnhancedEditor .atiButtons .atiDeleteButton")[0];

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

        //wire up the events
        resetButton.on("click", lang.hitch(this, function () {
          // Todo: attributes updated but not showed up on UI
          if (this.currentLocalFeatureLayer && this.currentLocalFeatureLayer.graphics.length > 0 &&
            this.currentLocalFeatureLayer.graphics[0].original) {

            var objId = this.currentLocalFeatureLayer.graphics[0].attributes["OBJECTID"];
            var atts = JSON.parse(JSON.stringify(this.currentLocalFeatureLayer.graphics[0].original.attributes));

            this.currentLocalFeatureLayer.graphics[0].attributes = atts;
            this.currentLocalFeatureLayer.graphics[0].attributes["OBJECTID"] = objId;

            this.currentLocalFeatureLayer.refresh(); //?
            this.isDirty = false;
            this.attrInspector.refresh();
          }
        }));

        validateButton.on("click", lang.hitch(this, function () {
          // validate the fieldInfos
          var ready = this._validateRequiredFields();
          if (ready) {
            // apply
            this._postChanges().then(lang.hitch(this, function () {
              this.currentLocalFeatureLayer.refresh(); // 
              this._showTemplate(true);
              this.isDirty = false;
              this._clearLocalGraphic();
            }));
          } else {
            alert("Not all required fields contain values.");
          }
        }));

        templateButton.on("click", lang.hitch(this, function () {
          if (this.isDirty) {
            this._resolvePendingEdit(true);
          } else {
            this._showTemplate(true);
            this._clearLocalGraphic();
          }
          if (this.templatePicker) {
            this.templatePicker.clearSelection();
          }
        }));

        this.attrInspector.on("attribute-change", lang.hitch(this, function (evt) {
          if (this.currentLocalFeatureLayer && this.currentLocalFeatureLayer.graphics.length > 0) {
            this.currentLocalFeatureLayer.graphics[0].attributes[evt.fieldName] = evt.fieldValue;
            this.isDirty = true;
          }
        }));

        this.attrInspector.on("delete", lang.hitch(this, function (evt) {
          var feature = evt.feature;
          //retrieve server info from the local feature
          feature.attributes["OBJECTID"] = feature.original.attributes["OBJECTID"];
          var layer = this.map.getLayer(feature.getLayer().originalLayerId);

          layer.applyEdits(null, null, [feature], lang.hitch(this, function (e) {
            layer.refresh();
            this._showTemplate(true);
            this.isDirty = false;
            this._clearLocalGraphic();
          }));

        }));
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
            attributes[prop] != origAttributes[prop]) {
            updatedAttrs[prop] = attributes[prop];
          }
        }

        return updatedAttrs;
      },

      // Cam      
      _performAdditionalStepsForEnhancedEditor: function () {
        if (this.editor && this.editor.templatePicker) {
          this.localFeatureLayers = [];
          // swap the layerInfos and featurelayers          
          array.forEach(this.editor.settings.layerInfos, function (layerInfo) {
            // clone the layer
            var localLayer = this._cloneLayer(layerInfo.featureLayer);
            layerInfo.featureLayer = localLayer;
            this.localFeatureLayers.push(localLayer);
          }, this);

          this.editor.templatePicker.featureLayers = this.localFeatureLayers;
          this.editor.templatePicker.update();

          this._createAttributeInspector();

          // set the template picker
          this.templatePicker = this.editor.templatePicker;

          // wire template picker events
          this.templatePicker.on("selection-change", lang.hitch(this, function () {
            var selected = this.templatePicker.getSelected();
            if (selected) {
              if (this.map) {
                this.map.setInfoWindowOnClick(false);
              }
            }
          }));
        }
      },

      // Cam
      _performEnhancedEditorCleanup: function(){
        if (this.attrInspector) {
          this.attrInspector.destroy();
          this.attrInspector = null;
        }
        
      },

      // Cam
      _postChanges: function () {
        var deferred = new Deferred();
        if (this.currentLocalFeatureLayer && this.currentLocalFeatureLayer.graphics.length > 0) {
          //get its corresponding feature layer
          var featureLayer = this.map.getLayer(this.currentLocalFeatureLayer.originalLayerId);

          var graphic = new Graphic(this.currentLocalFeatureLayer.graphics[0].geometry, null,
            this.currentLocalFeatureLayer.graphics[0].attributes);
          
          // determine if it's an add or edit operation
          if (this.currentLocalFeatureLayer.graphics[0].original) { // update

            var newAttrs = this._filterOnlyUpdatedAttributes(graphic.attributes,
              this.currentLocalFeatureLayer.graphics[0].original.attributes);
            if (newAttrs) {
              graphic.attributes = newAttrs;
            }

            graphic.attributes[this.currentLocalFeatureLayer.objectIdField] =
              this.currentLocalFeatureLayer.graphics[0].original.attributes["OBJECTID"];

            featureLayer.applyEdits(null, [graphic], null, function (e) {
              //if (e && e.length > 0 && e[0].success) {
                featureLayer.refresh();
                deferred.resolve("success");
              //}
            }, function (e) {
              // for now
              alert("Error when performing update ApplyEdits");
              deferred.resolve("failed");
            });
          } else { // add
            //graphic.attributes[this.currentLocalFeatureLayer.objectIdField] = null;
            //featureLayer.applyEdits([graphic], null, null, function (e) {
            this.currentLocalFeatureLayer.graphics[0].attributes["OBJECTID"] = null;
            featureLayer.applyEdits([this.currentLocalFeatureLayer.graphics[0]]);
            deferred.resolve("success");

            //featureLayer.applyEdits([this.currentLocalFeatureLayer.graphics[0]], null, null, function (e) {
            //  if (e && e.length > 0 && e[0].success) {
            //    featureLayer.refresh();
            //    deferred.resolve("success");
            //  }
            //}, function (e) {
            //  // for now
            //  alert("Error when performing applyEdits");
            //  deferred.resolve("failed");
            //});
          }

        } else {
          deferred.resolve();
        }

        return deferred.promise;
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

          this.currentLocalFeatureLayer = null;
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
            //needed?
            this.templatePicker.clearSelection();
            // call validate
            var valid = this._validateRequiredFields();
            if (valid) {
              // call applyEdit
              this._postChanges().then(lang.hitch(this, function () {
                if (switchToTemplate) {
                  this._showTemplate(true);
                }
                this.isDirty = false;
                this._clearLocalGraphic();

                deferred.resolve("success");
              }));
            } else {
              // for now
              alert("Not all required fields contain valid values.");
              deferred.resolve("failed");
            }
          }),
          onCancel: lang.hitch(this, function () { // not saving
            this.isDirty = false;
            this._clearLocalGraphic();

            if (switchToTemplate) {
              this._showTemplate(true);
            }
            deferred.resolve();
          })
        });
        confirmDialog.show();
        return deferred.promise;
      },

      // Cam
      _showTemplate: function (showTemplate) {
        if (showTemplate) {
          this.attrInspector.domNode.style.display = "none";
          query(".jimu-widget-EnhancedEditor .esriEditor")[0].style.display = "block";
          this.templatePicker.domNode.style.display = "block";
          this.templatePicker.update();
        } else {
          this.templatePicker.domNode.style.display = "none";
          query(".jimu-widget-EnhancedEditor .esriEditor")[0].style.display = "none";
          this.attrInspector.domNode.style.display = "block";
          this.attrInspector.refresh();
        }
      },

      // Cam
      _validateRequiredFields: function(){
        if (!this.currentLocalFeatureLayer) { return false; }

        var errorFields = [];
        this.currentLocalFeatureLayer.fields.filter(lang.hitch(this, function (field) {
          return field.nullable === false && field.editable === true;
        })).forEach(lang.hitch(this, function (f) {
          var graphic = this.currentLocalFeatureLayer.graphics[0];
          if (!graphic.attributes[f.name]) {
            errorFields.push({"field": f.name, "issue": "undefined"});
          } else {
            switch (f.type) {
              case "esriFieldTypeString":
                if (graphic.attributes[f.name].trim() === "") {
                  errorFields.push({ "field": f.name, "issue": "Empty string" });
                }
                break;
              case "esriFieldTypeDate":
              default:
                break;
            }
          }
        }));
        return errorFields.length > 0 ? false : true;
      },

      _enableMapClickHandler: function() {
        if (this.editor && typeof this.editor._enableMapClickHandler === "function") {
          this._editorMapClickHandlers.push(this.editor._mapClickHandler);
          this.editor._enableMapClickHandler();
          this._editorMapClickHandlers.push(this.editor._mapClickHandler);
        }
      },

      _disableMapClickHandler: function() {
        if (this.editor && typeof this.editor._disableMapClickHandler === "function") {
          this.editor._disableMapClickHandler();
          array.forEach(this._editorMapClickHandlers, function(editorMapClickHandler) {
            if(editorMapClickHandler && editorMapClickHandler.remove) {
              editorMapClickHandler.remove();
            }
          });
          this._editorMapClickHandlers = [];
        }
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

      _getTemplatePicker: function(layerInfos) {
        var layerObjects = [];

        array.forEach(layerInfos, function(layerInfo) {
          if(layerInfo.featureLayer &&
            layerInfo.featureLayer.getEditCapabilities &&
            layerInfo.featureLayer.getEditCapabilities().canCreate) {
            layerObjects.push(layerInfo.featureLayer);
          }
        }, this);

        var templatePicker = new TemplatePicker({
          featureLayers: layerObjects,
          grouping: true,
          rows: "auto",
          columns: "auto",
          style: this._configEditor.toolbarVisible ? "" : "bottom: 0px"
        }, html.create("div", {}, this.domNode));
        templatePicker.startup();
        return templatePicker;
      },

      _getSettingsParam: function() {
        var settings = {
          map: this.map,
          createOptions: {
            polygonDrawTools: [
              Editor.CREATE_TOOL_ARROW,
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
        if (!this._configEditor.useFilterEdit) {
          settings.templatePicker = this._getTemplatePicker(settings.layerInfos);
        }

        return settings;
      },

      _createEditor: function() {
        var params = {
          settings: this._getSettingsParam()
        };
        this._worksBeforeCreate(params.settings);
        if (this._configEditor.useFilterEdit) {
          this.editor = new FilterEditor(params, html.create("div", {}, this.domNode));
        }
        else {
          this.editor = new Editor(params, html.create("div", {}, this.domNode));
        }
        this.editor.startup();
        this._worksAfterCreate();
      },

      _addButtonToInspector: function() {
        if (this.editor.attributeInspector) {
          if (query(" atiButton closeButton",
            this.editor.attributeInspector.deleteBtn.domNode).length === 0) {
            var closeButton = new Button({
              label: esriBundle.common.close,
              "class": " atiButton closeButton"
            }, html.create("div"));

            html.place(closeButton.domNode,
                       this.editor.attributeInspector.deleteBtn.domNode,
                       "after");
            this.own(on(closeButton, 'click', lang.hitch(this, function() {
              this.editPopup.hide();
            })));
          }
        }
      },

     _update: function() {
        if(this.editor && this.editor.templatePicker){
          this.editor.templatePicker.update();
        }

        if (this._configEditor.useFilterEdit) {
          var widgetBox = html.getMarginBox(this.domNode);
          var height = widgetBox.h;
          var width = widgetBox.w;
          if (this.editor.templatePicker) {
            var cols = Math.floor(width / 60);
            this.editor.templatePicker.attr('columns', cols);
            this.editor.templatePicker.update();
          }
          query(".templatePicker", this.domNode).style('height', height - 140 + 'px');
          query(".jimu-widget-FilterEditor", this.domNode).style('height', height - 60 + 'px');

          if (!this._configEditor.useEnhancedEditFeatures) {
            this._addButtonToInspector();
          }
        }
      },

      resize: function() {
        this._update();
      },

      onClose: function() {
        if (this.editor) {
          this.editor.destroy();
        }
        this.editor = null;
        // close method will call onDeActive automaticlly
        // so do not need to call onDeActive();
        this._worksAfterClose();
      },

      _worksBeforeCreate: function(settings) {
        // change string of mouse tooltip
        var additionStr = "<br/>" + "(" + this.nls.pressStr + "<b>" +
          this.nls.ctrlStr + "</b> " + this.nls.snapStr + ")";
        this._defaultStartStr = esriBundle.toolbars.draw.start;
        this._defaultAddPointStr = esriBundle.toolbars.draw.addPoint;
        esriBundle.toolbars.draw.start =
          esriBundle.toolbars.draw.start + additionStr;
        esriBundle.toolbars.draw.addPoint =
          esriBundle.toolbars.draw.addPoint + additionStr;

        // hide label layer.
        var labelLayer = this.map.getLayer("labels");
        if(labelLayer) {
          labelLayer.hide();
        }

        // change layer name
        array.forEach(settings.layerInfos, function(layerInfo) {
          var jimuLayerInfo =
            this._jimuLayerInfos.getLayerInfoByTopLayerId(layerInfo.featureLayer.id);
          if(jimuLayerInfo) {
            layerInfo.featureLayer.name = jimuLayerInfo.title;
          }
        }, this);
      },

      _worksAfterCreate: function() {
        // add close button to atiInspector
        this._addButtonToInspector();
        // resize editPopup
        this.editPopup.resize(500, 251);
        // update templatePicker for responsive.
        if (this.editor.templatePicker) {
          this.editor.templatePicker.update();
        }
        //just for BoxTheme
        setTimeout(lang.hitch(this, this._update), 9000);
        // // reset default selectionSymbol that change by Editor dijit.
        // array.forEach(this.editor.settings.layerInfos, function(layerInfo) {
        //   layerInfo.featureLayer.setSelectionSymbol();
        // }, this);

        // Cam
        if (this._configEditor.useEnhancedEditFeatures) {
          setTimeout(lang.hitch(this, this._performAdditionalStepsForEnhancedEditor), 1000);
        }
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