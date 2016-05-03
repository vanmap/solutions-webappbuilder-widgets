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
    'dojo',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/query',
    'dojo/i18n!esri/nls/jsapi',
    'dojo/dom-construct',
    'dojo/dom-class',
    'dojo/on',
    'dojo/json',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/LayerInfos/LayerInfos',
    "esri/dijit/editing/TemplatePicker",
    "esri/dijit/AttributeInspector",
    "esri/toolbars/draw",
    "esri/toolbars/edit",
    "esri/tasks/query",
    "esri/graphic",
    "esri/layers/FeatureLayer",
    "dojo/promise/all",
    "dojo/Deferred",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/Color",
    "esri/geometry/jsonUtils",
    "dijit/registry",
    "./utils",
     "./smartAttributes",
    "dijit/form/CheckBox",
    'dijit/form/DateTextBox',
    'dijit/form/NumberSpinner',
    'dijit/form/NumberTextBox',
    'dijit/form/FilteringSelect',
    'dijit/form/TextBox',
    'dijit/form/TimeTextBox',
    'dojo/store/Memory',
    'dojo/date/stamp',
    "jimu/dijit/Popup",
    "./AttachmentUploader",
    "esri/lang",
    "dojox/html/entities",
    'jimu/utils'
],
  function (
    dojo,
    declare,
    lang,
    array,
    html,
    query,
    esriBundle,
    domConstruct,
    domClass,
    on,
    JSON,
    _WidgetsInTemplateMixin,
    BaseWidget,
    LayerInfos,
    TemplatePicker,
    AttributeInspector,
    Draw,
    Edit,
    Query,
    Graphic,
    FeatureLayer,
    all,
    Deferred,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    SimpleFillSymbol,
    Color,
    geometryJsonUtil,
    registry,
    editUtils,
    smartAttributes,
    CheckBox,
    DateTextBox,
    NumberSpinner,
    NumberTextBox,
    FilteringSelect,
    TextBox,
    TimeTextBox,
    Memory,
    dojoStamp,
    Popup,
    AttachmentUploader,
    esriLang,
    entities,
    utils) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'SmartEditor',
      baseClass: 'jimu-widget-smartEditor',
      _defaultStartStr: "",
      _defaultAddPointStr: "",
      _jimuLayerInfos: null,
      _configEditor: null,
      _mapClick: null,

      settings: null,
      templatePicker: null,
      attrInspector: null,
      editToolbar: null,
      selectedTemplate: null,
      _isDirty: false,
      updateFeatures: [],
      currentFeature: null,
      currentLayerInfo: null,
      _attrInspIsCurrentlyDisplayed: false,
      _ignoreEditGeometryToggle: false,
      _editingEnabled: false,
      _usePresetValues: false,
      _creationDisabledOnAll: false,
      _configNotEditable: null,
      _gdbRequired: null,
      _editGeomSwitch: null,
      postCreate: function () {
        this.inherited(arguments);
        this._init();
        this._setTheme();
      },

      startup: function () {
        this.inherited(arguments);
        if (this.config.editor.editDescription === undefined || this.config.editor.editDescription === null) {
          this.config.editor.editDescription = '';
          this.templateTitle.innerHTML = this.config.editor.editDescription;

        }
        else {
          this.templateTitle.innerHTML = entities.decode(this.config.editor.editDescription);
        }
        this._orignls = esriBundle.widgets.attachmentEditor.NLS_attachments;
        //this.nls = lang.mixin(this.nls, window.jimuNls.common);
        LayerInfos.getInstance(this.map, this.map.itemInfo)
        .then(lang.hitch(this, function (operLayerInfos) {
          this._jimuLayerInfos = operLayerInfos;
          this._createEditor();
        }));
      },
      /*jshint unused:true */
      _setTheme: function () {
        //if (this.appConfig.theme.name === "BoxTheme" ||
        //    this.appConfig.theme.name === "DartTheme" ||
        //    this.appConfig.theme.name === "LaunchpadTheme") {
        if (this.appConfig.theme.name === "DartTheme") {
          utils.loadStyleLink('dartOverrideCSS', this.folderUrl + "/css/dartTheme.css", null);
        }
      },
      _mapClickHandler: function (create) {

        if (create === true && this._attrInspIsCurrentlyDisplayed === false) {
          this.map.setInfoWindowOnClick(false);
          this._mapClick = on(this.map, "click", lang.hitch(this, this._onMapClick));

        }
        else if (create === true && this._attrInspIsCurrentlyDisplayed === true) {
          this.map.setInfoWindowOnClick(true);
          if (this._mapClick) {

            this._mapClick.remove();
            this._mapClick = null;
          }
        }
        else {
          if (this._mapClick) {

            this._mapClick.remove();
            this._mapClick = null;
          }
          this.map.setInfoWindowOnClick(true);
        }
      },
      destroy: function () {
        this.inherited(arguments);

        if (this.attrInspector) {
          this.attrInspector.destroy();
        }
        this.attrInspector = null;

        if (this.templatePicker) {
          this.templatePicker.destroy();
        }
        this.templatePicker = null;
      },

      _init: function () {
        this._configEditor = lang.clone(this.config.editor);

      },

      onActive: function () {
        if (this.map) {
          this._mapClickHandler(true);
        }

      },

      onDeActive: function () {
        if (this.map) {
          this._mapClickHandler(false);
        }
      },

      onOpen: function () {
        this._update();
        if (this.map) {
          this._mapClickHandler(true);
        }
      },

      _activateEditToolbar: function (feature) {
        var layer = feature.getLayer();
        switch (layer.geometryType) {
          case "esriGeometryPoint":
            this.editToolbar.activate(Edit.MOVE, feature);
            break;
          case "esriGeometryPolyline":
          case "esriGeometryPolygon":
            /*jslint bitwise: true*/
            this.editToolbar.activate(Edit.EDIT_VERTICES |
                                 Edit.MOVE |
                                 Edit.ROTATE |
                                 Edit.SCALE, feature);
            /*jslint bitwise: false*/
            break;
        }
      },

      // this function also create a new attribute inspector for the local layer
      _addGraphicToLocalLayer: function (evt) {
        if (!this.templatePicker.getSelected()) { return; }
        var selectedTemp = this.templatePicker.getSelected();

        var myLayer;
        var newTempLayerInfos;
        var localLayerInfo = null;
        if (this._newAttrInspectorNeeded()) {
          // remove the previous local layer
          this._removeLocalLayers();

          // preparation for a new attributeInspector for the local layer
          myLayer = this._cloneLayer(this.templatePicker.getSelected().featureLayer);
          myLayer.setSelectionSymbol(this._getSelectionSymbol(myLayer.geometryType, true));

          localLayerInfo = this._getLayerInfoForLocalLayer(myLayer);

          newTempLayerInfos = this._converConfiguredLayerInfos([localLayerInfo]);

          this.attrInspector = this._createAttributeInspector(newTempLayerInfos);
        } else {

          myLayer = this.attrInspector.layerInfos[0].featureLayer;
          localLayerInfo = this._getLayerInfoForLocalLayer(myLayer);
          newTempLayerInfos = this.attrInspector.layerInfos;

        }
        var newAttributes = lang.clone(selectedTemp.template.prototype.attributes);
        if (this._usePresetValues) {
          this._modifyAttributesWithPresetValues(newAttributes, newTempLayerInfos[0]);
        }

        var newGraphic = new Graphic(evt.geometry, null, newAttributes);

        // store original attrs for later use
        newGraphic.preEditAttrs = JSON.parse(JSON.stringify(newGraphic.attributes));
        myLayer.applyEdits([newGraphic], null, null, lang.hitch(this, function (e) {
          this._isDirty = true;
          var query = new Query();
          query.objectIds = [e[0].objectId];
          myLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW);

          this.currentFeature = this.updateFeatures[0] = newGraphic;
          this.currentLayerInfo = this._getLayerInfoByID(this.currentFeature._layer.id);
          this._toggleDeleteButton(this.currentLayerInfo.allowDelete);
          this._toggleEditGeoSwitch(this.currentLayerInfo.disableGeometryUpdate);

          //this._createSmartAttributes();
          //
          this._enableAttrInspectorSaveButton(this._validateAttributes());
        }));

        this._showTemplate(false);
      },

      // cancel editing of the current feature
      _cancelEditingFeature: function (showTemplatePicker) {
        if (!this.currentFeature) { return; }

        if (showTemplatePicker) {

          this._showTemplate(true);
        } else { // show attr inspector

          // restore attributes & geometry
          if (this.currentFeature.preEditAttrs) {
            this.currentFeature.attributes = this.currentFeature.preEditAttrs;
          }
          if (this.currentFeature.origGeom) {
            this.currentFeature.geometry = geometryJsonUtil.fromJson(this.currentFeature.origGeom);
          }
          this.currentFeature.getLayer().refresh();
          this.attrInspector.refresh();

          //reset
          this._resetEditingVariables();

        }
      },

      _addDateFormat: function (fieldInfo) {
        if (fieldInfo && fieldInfo.format && fieldInfo.format !==
           null) {
          if (fieldInfo.format.dateFormat && fieldInfo.format.dateFormat !==
            null) {
            if (fieldInfo.format.dateFormat ===
              "shortDateShortTime" ||
              fieldInfo.format.dateFormat ===
              "shortDateLongTime" ||
              fieldInfo.format.dateFormat ===
              "shortDateShortTime24" ||
              fieldInfo.format.dateFormat ===
              "shortDateLEShortTime" ||
              fieldInfo.format.dateFormat ===
              "shortDateLEShortTime24") {
              fieldInfo.format.time = true;
            }
          }
        }
      },

      _processLayerFields: function (fields) {
        //Function required to add the Range details to a range domain so the layer can be cloned

        array.forEach(fields, function (field) {
          if (field.domain !== undefined && field.domain !== null) {
            if (field.domain.type !== undefined && field.domain.type !== null) {
              if (field.domain.type === 'range') {
                if (field.domain.hasOwnProperty('range') === false) {
                  field.domain.range = [field.domain.minValue, field.domain.maxValue];
                }
              }
            }

          }
        });

        return fields;
      },
      _iterateCollection: function (collection) {
        return function (f) {
          for (var i = 0; collection[i]; i++) {
            f(collection[i], i);
          }
        };
      },
      _cloneLayer: function (layer) {
        var cloneFeaturelayer;
        var fieldsproc = this._processLayerFields(layer.fields);
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
            "hasAttachments": layer.hasAttachments,
            "htmlPopupType": "esriServerHTMLPopupTypeAsHTMLText",
            "objectIdField": layer.objectIdField,
            "globalIdField": layer.globalIdField,
            "typeIdField": layer.typeIdField,
            "fields": fieldsproc,
            "types": layer.types,
            "templates": layer.templates,
            "capabilities": "Create,Delete,Query,Update,Uploads,Editing"
          }
        };

        var outFields = layer.fields.map(function (f) {
          return f.name;
        });

        cloneFeaturelayer = new FeatureLayer(featureCollection, {
          id: layer.id + "_lfl",
          outFields: outFields
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
      _endsWith: function (str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
      },
      _validateAttributes: function () {
        var rowsWithGDBRequiredFieldErrors = this._validateRequiredFields();
        var rowsWithSmartErrors = [];

        if (this._smartAttributes !== undefined) {
          if (this._smartAttributes !== null) {

            rowsWithSmartErrors = this._smartAttributes.toggleFields();
          }
        }
        return (editUtils.isObjectEmpty(rowsWithGDBRequiredFieldErrors) &&
          rowsWithSmartErrors.length === 0);

      },
      _toggleEditGeoSwitch: function (disable) {
        if (this._editGeomSwitch === undefined || this._editGeomSwitch === null) {
          return;
        }
        if (disable === false) {
          dojo.style(this._editGeomSwitch.domNode.parentNode, "display", "block");
          this._turnEditGeometryToggleOff();

        }
        else {
          dojo.style(this._editGeomSwitch.domNode.parentNode, "display", "none");
          this._turnEditGeometryToggleOff();

        }

      },

      _attributeInspectorChangeRecord: function (evt) {
        if (this._isDirty && this.currentFeature) {
          // do not show templatePicker after saving
          this._promptToResolvePendingEdit(false, evt);

        } else {

          this._postFeatureSave(evt);

        }
        if (this.editDescription.style.display === "block") {
          if (this.updateFeatures.length > 1) {
            dojo.style(this.editDescription, "padding-top", "20px");
          } else {
            dojo.style(this.editDescription, "padding-top", "0");
          }
        } else {
          if (this.updateFeatures.length > 1) {
            dojo.style(query(".attributeInspectorDiv")[0], "padding-top", "20px");
          } else {
            dojo.style(query(".attributeInspectorDiv")[0], "padding-top", "8px");
          }

        }
        //editDescription
      },
      //_sytleFields: function (attrInspector) {
      //query("td.atiLabel", attrInspector.domNode).style({
      //  "color": "#FFFF00"
      //});

      //},
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
        domConstruct.place(attrInspector.navMessage, attrInspector.nextFeatureButton.domNode, "before");

        this.editSwitchDiv = domConstruct.create("div");
        this.editSwitchDiv.appendChild(domConstruct.create("div", { "class": "spacer" }));
        // edit geometry toggle button
        this._editGeomSwitch = new CheckBox({
          id: "editGeometrySwitch",
          value: this.nls.editGeometry
        }, null);

        this.editSwitchDiv.appendChild(this._editGeomSwitch.domNode);

        domConstruct.place(lang.replace(
         "<label for='editGeometrySwitch'>{replace}</label></br></br>",
         { replace: this.nls.editGeometry }), this._editGeomSwitch.domNode, "after");

        domConstruct.place(this.editSwitchDiv, attrInspector.deleteBtn.domNode, "before");

        this.own(on(this._editGeomSwitch, 'Change', lang.hitch(this, this._editGeometry)));


        //add close/cancel/switch to template button
        var cancelButton = domConstruct.create("div", {
          innerHTML: this.nls.close,
          "class": "cancelButton jimu-btn"
        }, attrInspector.deleteBtn.domNode, "after");

        // save button
        var saveButton = domConstruct.create("div", {
          innerHTML: this.nls.save,
          "class": "saveButton jimu-btn jimu-state-disabled"
        }, cancelButton, "after");
        domConstruct.create("div", {
          "class": "processing-indicator"
        }, saveButton, "before");

        if (query(".jimu-widget-smartEditor .deleteButton").length < 1) {
          this._deleteButton = domConstruct.create("div", {
            innerHTML: this.nls.deleteText,
            "class": "deleteButton jimu-btn jimu-btn-vacation"
          }, saveButton, "after");
          // query(".jimu-widget-smartEditor .topButtonsRowDiv")[0], "first");

          on(this._deleteButton, "click", lang.hitch(this, function () {
            //if (this.currentFeature) {
            if (this.map.infoWindow.isShowing) {
              this.map.infoWindow.hide();
            }

            if (this._configEditor.displayPromptOnDelete) {
              this._promptToDelete();

            } else {
              this._deleteFeature();
            }
            //}
          }));
        }

        //wire up the button events
        this.own(on(cancelButton, "click", lang.hitch(this, function () {
          if (this.map.infoWindow.isShowing) {
            this.map.infoWindow.hide();
          }

          if (this._configEditor.displayPromptOnSave && this._isDirty) {
            this._promptToResolvePendingEdit(true, null);
          } else {
            this._cancelEditingFeature(true);
          }

          this._activateTemplateToolbar();
        })));

        this.own(on(saveButton, "click", lang.hitch(this, function () {
          if (!this._isDirty) {
            this._resetEditingVariables();
            return;
          }

          if (this.map.infoWindow.isShowing) {
            this.map.infoWindow.hide();
          }
          this._saveEdit(this.currentFeature);
        })));

        // edit geometry checkbox event

        // attribute inspector events
        this.own(on(attrInspector, "attribute-change", lang.hitch(this, function (evt) {
          if (this.currentFeature) {


            this.currentFeature.attributes[evt.fieldName] = evt.fieldValue;
            this._isDirty = true;

            this._enableAttrInspectorSaveButton(this._validateAttributes());
          }
        })));


        this.own(on(attrInspector, "next", lang.hitch(this, function (evt) {

          this._attributeInspectorChangeRecord(evt);
          if (query(".attwarning").length === 0) {
            var txt = domConstruct.create("div", { 'class': 'attwarning' });
            txt.innerHTML = this.nls.attachmentSaveDeleteWarning;
            this.attrInspector._attachmentEditor.domNode.appendChild(txt);
          }
        })));
        if (this._attachmentUploader && this._attachmentUploader !== null) {
          this._attachmentUploader.destroy();
        }
        if (layerInfos.length === 1) {
          if (layerInfos[0].featureLayer.hasOwnProperty('originalLayerId')) {
            var result = this._getLayerInfoByID(layerInfos[0].featureLayer.originalLayerId);
            if (result.featureLayer.hasAttachments === true) {
              this.attachNode = domConstruct.create("div");
              domConstruct.place(this.attachNode, attrInspector.attributeTable, "after");

              this._attachmentUploader = new AttachmentUploader({ 'class': 'atiAttachmentEditor' },
                this.attachNode);
              this._attachmentUploader.startup();
            }
          }
        }
        return attrInspector;
      },
      _toggleDeleteButton: function (show) {
        if (show === true) {
          this._deleteButton.style.display = "block";
        } else {
          this._deleteButton.style.display = "none";
        }


      },
      _activateTemplateToolbar: function () {

        if (this.templatePicker.getSelected()) {

          //domClass.add(this.selectedTemplate, "selectedItem");
          switch (this.templatePicker.getSelected().featureLayer.geometryType) {
            case "esriGeometryPoint":
              this.drawToolbar.activate(Draw.POINT);
              break;
            case "esriGeometryPolyline":
              this.drawToolbar.activate(Draw.POLYLINE);
              break;
            case "esriGeometryPolygon":
              this.drawToolbar.activate(Draw.POLYGON);
              break;
          }
        }

        else {

          this.drawToolbar.deactivate();
        }
      },

      _createEditor: function () {
        this.settings = this._getSettingsParam();

        var layers = this._getEditableLayers(this.settings.layerInfos, false);

        this._workBeforeCreate();

        this.editToolbar = new Edit(this.map);


        //create template picker
        this.templatePicker = new TemplatePicker({
          featureLayers: layers,
          'class': 'esriTemplatePicker',
          grouping: true,
          maxLabelLength: "25",
          showTooltip: false,
          columns: "auto",
          rows: "auto"
        }, this.templatePickerNode);
        this.templatePicker.startup();

        this.drawToolbar = new Draw(this.map);

        // wire up events
        this.own(on(this.templatePicker, "selection-change",
          lang.hitch(this, this._activateTemplateToolbar)));

        // edit events
        this.own(on(this.editToolbar,
          "graphic-move-stop, rotate-stop, scale-stop, vertex-move-stop, vertex-click",
          lang.hitch(this, function () {

            this._enableAttrInspectorSaveButton(this._validateAttributes());
            //this._enableAttrInspectorSaveButton(true);
            this._isDirty = true;
          })));

        // draw event
        this.own(on(this.drawToolbar, "draw-end", lang.hitch(this, function (evt) {
          this.drawToolbar.deactivate();
          this._isDirty = true; //?
          this._addGraphicToLocalLayer(evt);
        })));

        // set preset values table
        if (layers.length > 0 && this._hasPresetValueFields()) {
          this._initPresetFieldsTable();
          this._fillPresetValueTable();
          query(".presetFieldsTableDiv")[0].style.display = "block";
        } else {
          query(".presetFieldsTableDiv")[0].style.display = "none";
        }

        if (layers.length < 1) {
          this._creationDisabledOnAll = true;
        }

        this._showTemplate(true);
      },

      _createPresetFieldContentNode: function (fieldInfo) {
        var nodes = [];
        var node;

        if (fieldInfo.domain) {
          // domain.type = codedValue
          if (fieldInfo.domain.type === "codedValue") {
            var domainValues = fieldInfo.domain.codedValues;

            var options = [];
            array.forEach(domainValues, function (dv) {
              options.push({ name: dv.name, id: dv.code });
            });

            node = new FilteringSelect({
              "class": "ee-inputField",
              name: fieldInfo.fieldName,
              store: new Memory({ data: options }),
              searchAttr: "name"
            }, domConstruct.create("div"));

          } else { //domain.type = range
            node = new NumberSpinner({
              "class": "ee-inputField",
              name: fieldInfo.fieldName,
              smallDelta: 1,
              constraints: {
                min: fieldInfo.domain.minValue,
                max: fieldInfo.domain.maxValue,
                place: 0
              }
            }, domConstruct.create("div"));

          }

          nodes.push(node);

        } else {
          switch (fieldInfo.type) {
            case "esriFieldTypeDate":
              node = new DateTextBox({
                "class": "ee-inputField",

                name: fieldInfo.fieldName
              }, domConstruct.create("div"));
              //value: new Date(),
              nodes.push(node);

              if (fieldInfo.format) {
                if (fieldInfo.format.time && fieldInfo.format.time === true) {
                  var timeNode = new TimeTextBox({
                    "class": "ee-inputField",
                    "style": "margin-top:2px;"

                  }, domConstruct.create("div"));
                  nodes.push(timeNode);
                  //value: new Date()
                }
              }

              break;
            case "esriFieldTypeString":
              node = new TextBox({
                "class": "ee-inputField",
                name: fieldInfo.fieldName
              }, domConstruct.create("div"));

              nodes.push(node);

              break;
              // todo: check for more types
            case "esriFieldTypeSmallInteger":
            case "esriFieldTypeInteger":
            case "esriFieldTypeLong":
            case "esriFieldTypeDouble":
              node = new NumberTextBox({
                "class": "ee-inputField",
                name: fieldInfo.fieldName
              }, domConstruct.create("div"));

              nodes.push(node);

              break;
            default:
              node = new TextBox({
                "class": "ee-unsupportField",
                name: fieldInfo.fieldName,
                value: "N/A",
                readOnly: true
              }, domConstruct.create("div"));
              nodes.push(node);
              break;
          }
        }
        array.forEach(nodes, function (node) {
          this.own(on(node, 'change', lang.hitch(this, this._presetChange)));
        }, this);
        return nodes;
      },
      _presetChange: function () {
        this._toggleUsePresetValues(true);
      },
      _deleteFeature: function () {
        if (!this.currentFeature) { return; }

        this._resetEditingVariables();

        var layer = this.currentFeature.getLayer();
        if (layer.url === null) {
          layer.clear();
          this._showTemplate(true);

        } else {
          var processIndicators = query(".processing-indicator");
          var processIndicatorsPanel = query(".processing-indicator-panel");
          var saveBtn = query(".saveButton")[0];
          array.forEach(processIndicators, function (processIndicator) {
            if (!domClass.contains(processIndicator, "busy")) {
              domClass.add(processIndicator, "busy");
            }
          });
          array.forEach(processIndicatorsPanel, function (processIndicator) {
            if (!domClass.contains(processIndicator, "busy")) {
              domClass.add(processIndicator, "busy");
            }
          });
          if (!domClass.contains(saveBtn, "hide")) {
            domClass.add(saveBtn, "hide");
          }

          layer.applyEdits(null, null, [this.currentFeature], lang.hitch(this, function () {

            this.updateFeatures.splice(this.updateFeatures.indexOf(this.currentFeature), 1);

            if (this.updateFeatures && this.updateFeatures.length > 0) {
              this.attrInspector.refresh();
              this.attrInspector.first();
            } else {
              this._showTemplate(true);
            }
            array.forEach(processIndicators, function (processIndicator) {
              if (domClass.contains(processIndicator, "busy")) {
                domClass.remove(processIndicator, "busy");
              }
            });
            array.forEach(processIndicatorsPanel, function (processIndicator) {
              if (domClass.contains(processIndicator, "busy")) {
                domClass.remove(processIndicator, "busy");
              }
            });
            if (domClass.contains(saveBtn, "hide")) {
              domClass.remove(saveBtn, "hide");
            }
          }));
        }
      },

      _editGeometry: function () {
        if (this._ignoreEditGeometryToggle) { return; }

        var sw = registry.byId("editGeometrySwitch");

        if (sw && sw.checked) {
          this.map.setInfoWindowOnClick(false);

          if (this.map.infoWindow.isShowing) {
            this.map.infoWindow.hide();
          }

          if (this._editingEnabled === false) {
            this._editingEnabled = true;
            // store the original geometry for later use
            this.currentFeature.origGeom = this.currentFeature.geometry.toJson();
            this._activateEditToolbar(this.currentFeature);
          } else {
            this.editToolbar.deactivate();
            this._editingEnabled = false;
          }
        } else {
          this.map.setInfoWindowOnClick(true);
          this.editToolbar.deactivate();
          this._editingEnabled = false;
        }
      },

      _enableAttrInspectorSaveButton: function (enable) {
        var saveBtn = query(".saveButton")[0];
        if (!saveBtn) { return; }

        if (enable) {
          if (domClass.contains(saveBtn, "jimu-state-disabled")) {
            domClass.remove(saveBtn, "jimu-state-disabled");
          }
        } else {
          if (!domClass.contains(saveBtn, "jimu-state-disabled")) {
            domClass.add(saveBtn, "jimu-state-disabled");
          }
        }
      },

      _getLayerInfoByID: function (id) {

        if (id.indexOf("_lfl") > 0) {
          id = id.replace("_lfl", "");
        }
        var result = null;
        this.settings.layerInfos.some(function (lyrinfo) {
          return lyrinfo.featureLayer.id === id ? ((result = lyrinfo), true) : false;
        });
        return result;

      },

      _fillPresetValueTable: function () {
        var presetFieldInfos = [];

        array.forEach(this.settings.layerInfos, function (layerInfo) {
          // ignore preset values for layer with update features only
          if (!layerInfo.allowUpdateOnly) {
            array.forEach(layerInfo.fieldInfos, function (fieldInfo) {
              if (fieldInfo.canPresetValue) {
                var fieldExists = false;
                // concat aliases if needed
                var idx = fieldInfo.label.indexOf("<a ");
                var fieldLabel = idx < 0 ?
                  fieldInfo.label : fieldInfo.label.substring(0, idx);

                for (var i = 0; i < presetFieldInfos.length; i++) {
                  if (presetFieldInfos[i].fieldName === fieldInfo.fieldName) {
                    // found the same field name
                    fieldExists = true;
                    // concat fieldAlias if needed
                    if (!editUtils.checkIfFieldAliasAlreadyExists(
                      presetFieldInfos[i].label, fieldLabel)) {
                      presetFieldInfos[i].label = lang.replace("{alias},{anotherAlias}",
                      {
                        alias: presetFieldInfos[i].label,
                        anotherAlias: fieldLabel
                      });
                      break;
                    }
                    else {
                      presetFieldInfos[i].format = fieldInfo.format;
                    }
                  } //
                }

                // or add to the collection if new
                if (!fieldExists) {
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
          }
        });
        var presetValueTable = query("#eePresetValueBody")[0];
        // fill the table
        array.forEach(presetFieldInfos, lang.hitch(this, function (presetFieldInfo) {
          var row = domConstruct.create("tr");
          var label = domConstruct.create("td", { "class": "ee-atiLabel" });
          label.innerHTML = lang.replace('{fieldAlias}',
            {
              fieldAlias: presetFieldInfo.label
            });

          domConstruct.place(label, row);

          var valueColumnNode = domConstruct.create("td",
            { "class": "preset-value-editable" }, row);

          var presetValueNodes = this._createPresetFieldContentNode(presetFieldInfo);
          var dateWidget = null;
          var timeWidget = null;
          array.forEach(presetValueNodes, function (presetValueNode) {
            if (presetValueNode.declaredClass === "dijit.form.DateTextBox") {
              dateWidget = presetValueNode;
            }
            if (presetValueNode.declaredClass === "dijit.form.TimeTextBox") {
              timeWidget = presetValueNode;
            }
            domConstruct.place(presetValueNode.domNode, valueColumnNode, "last");
          }, this);
          if (dateWidget !== null) {
            this.own(on(label, 'click', lang.hitch(this, this._dateClick(dateWidget, timeWidget))));
          }
          presetValueTable.appendChild(row);
        }));
      },

      _dateClick: function (dateWidget, timeWidget) {
        return function () {
          if (dateWidget !== undefined && dateWidget !== null) {
            dateWidget.set('value', new Date());
          }
          if (timeWidget !== undefined && timeWidget !== null) {
            timeWidget.set('value', new Date());
          }
        };

      },
      _getEditableLayers: function (layerInfos, allLayers) {
        var layers = [];
        array.forEach(layerInfos, function (layerInfo) {
          if (!layerInfo.allowUpdateOnly || allLayers) { //
            var layerObject = this.map.getLayer(layerInfo.featureLayer.id);
            if (layerObject &&
               layerObject.visible &&
               layerObject.isEditable &&
               layerObject.isEditable()) {
              layers.push(layerObject);
            }
          }
        }, this);

        return layers;
      },

      _getLayerInfoForLocalLayer: function (localLayer) {

        var result = this._getLayerInfoByID(localLayer.originalLayerId);
        var layerInfo;

        if (result !== null) {//(layerObject.type === "Feature Layer" && layerObject.url) {
          // get the fieldInfos
          layerInfo = {};
          for (var k in result) {
            if (result.hasOwnProperty(k) && k !== 'featureLayer') {
              layerInfo[k] = lang.clone(result[k]);
            }
          }

          layerInfo.featureLayer = localLayer;

        }
        return layerInfo;
      },
      _getSelectionSymbol: function (geometryType, highlight) {
        if (!geometryType || geometryType === "") { return null; }

        var selectionSymbol;
        switch (geometryType) {
          case "esriGeometryPoint":
            if (highlight === true) {
              selectionSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,
                                20,
                                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                    new Color([0, 230, 169, 1]), 2),
                                new Color([0, 230, 169, 0.65]));
            } else {
              selectionSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,
                                20,
                                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                    new Color([92, 92, 92, 1]), 2),
                                 new Color([255, 255, 0, 0.65]));
            }
            break;
          case "esriGeometryPolyline":
            if (highlight === true) {
              selectionSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                    new Color([0, 255, 255, 0.65]), 2);
            } else {
              selectionSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                    new Color([0, 230, 169, 0.65]), 2);
            }
            break;
          case "esriGeometryPolygon":
            var line;
            if (highlight === true) {
              selectionSymbol = new SimpleFillSymbol().setColor(new Color([0, 230, 169, 0.65]));
              line = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
              new Color([192, 192, 192, 1]), 2);
            } else { // yellow with black outline
              selectionSymbol = new SimpleFillSymbol().setColor(new Color([255, 255, 0, 0.65]));
              line = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
              new Color([192, 192, 192, 1]), 2);
            }
            selectionSymbol.setOutline(line);
            break;
        }
        return selectionSymbol;
      },

      _hasPresetValueFields: function () {
        return this.settings.layerInfos.some(function (layerInfo) {
          if (layerInfo.allowUpdateOnly === false) {
            if (layerInfo.fieldInfos) {
              return layerInfo.fieldInfos.some(function (fi) {
                return fi.canPresetValue === true;
              });
            }
            else {
              return false;
            }
          }
          else {
            return false;
          }
        }, this);

      },

      _initPresetFieldsTable: function () {
        var presetValueTableNode = domConstruct.create("div", { "class": "ee-presetValueTableDiv templatePicker" },
          this.presetFieldsTableNode);

        var bodyDiv = domConstruct.create("div", { "class": "bodyDiv" }, presetValueTableNode);
        var bodyTable = domConstruct.create("table",
          { "class": "ee-presetValueBodyTable" }, bodyDiv);

        domConstruct.create("tbody", { "class": "ee-presetValueBody", "id": "eePresetValueBody" },
          bodyTable, "first");
      },

      _modifyAttributesWithPresetValues: function (attributes, newTempLayerInfos) {
        var presetValueTable = query("#eePresetValueBody")[0];
        var presetFieldInfos = array.filter(newTempLayerInfos.fieldInfos, function (fieldInfo) {
          return (fieldInfo.canPresetValue === true);

        });
        var presetFields = array.map(presetFieldInfos, function (presetFieldInfo) {
          return presetFieldInfo.fieldName;
        });
        if (presetValueTable) {
          var inputElements = query(".preset-value-editable .ee-inputField");
          array.forEach(inputElements, lang.hitch(this, function (ele) {
            // skip time text box as this level
            if (!domClass.contains(ele, "dijitTimeTextBox")) {
              // for some dijit controls, value is in the input of type hidden,
              // some not
              var element = query("input[type='hidden']", ele);
              if (!element || element.length === 0) {
                element = query("input", ele);
              }

              // if it's datetime then create a dateTime from string
              var dateTime;
              var isDateTime = domClass.contains(ele, "dijitDateTextBox");
              if (isDateTime) {
                // get the sibling time component node
                var timeElement = query(".dijitTimeTextBox", ele.parentNode)[0];
                // retrieve the value
                if (timeElement !== undefined && timeElement !== null) {
                  var timeStr = query("input[type='hidden']", timeElement)[0].value;
                  dateTime = dojoStamp.fromISOString(
                    element[0].value + timeStr);
                } else {
                  dateTime = dojoStamp.fromISOString(
                   element[0].value);

                }
              }

              // set the attribute value
              if (element[0].value) {
                for (var attribute in attributes) {
                  if (attributes.hasOwnProperty(attribute) &&
                    attribute === element[0].name &&
                    presetFields.indexOf(element[0].name) >= 0) {
                    if (isDateTime) {
                      attributes[attribute] = dateTime;
                    } else {
                      attributes[attribute] = element[0].value;
                    }
                    break;
                  }
                }
              }
            }
          }));
        }
      },

      // to add (*) to the label of required fields
      // also add field type and domain to use in the preset values
      _modifyFieldInfosForEE: function (layerInfo) {
        this._gdbRequired = [];
        this._configNotEditable = [];
        if (!layerInfo) { return; }
        //layerInfo = lang.clone(layerInfo);
        var layerObject = this.map.getLayer(layerInfo.featureLayer.id);
        array.forEach(array.filter(layerObject.fields, lang.hitch(this, function (field) {
          return field.nullable === false && field.editable === true;
        })), lang.hitch(this, function (f) {
          array.forEach(layerInfo.fieldInfos, function (finfo) {
            if (finfo.fieldName === f.name) {
              this._gdbRequired.push(finfo.label);
              finfo.label = finfo.label +
                '<a class="asteriskIndicator"> *</a>';

            }
          }, this);
        }));
        // add the type for layer use, by the way
        array.forEach(layerInfo.fieldInfos, function (finfo) {
          if (finfo.isEditable === false || finfo.isEditableSettingInWebmap === false) {
            this._configNotEditable.push(finfo.label);
          }

          this._addDateFormat(finfo);
          var field = null;

          var found = layerObject.fields.some(function (f) {
            return f.name === finfo.fieldName ? ((field = f), true) : false;

          });
          if (found && field !== null) {
            finfo.type = field.type;
            finfo.domain = field.domain;
          }
        }, this);
      },

      _newAttrInspectorNeeded: function () {
        var yes = false;

        if (!this.attrInspector || this.attrInspector.layerInfos.length > 1) {
          yes = true;
        } else { //this.attrInspector.layerInfos.length == 1

          var lflId = this.attrInspector.layerInfos[0].featureLayer.id;
          if (lflId.indexOf("_lfl") > 0) { // attrInspector associated with a local feature
            yes = lflId.indexOf(this.templatePicker.getSelected().featureLayer.id) < 0;
          } else {

            yes = true;
          }
        }

        if (yes && this.attrInspector) {
          this.attrInspector.destroy();
          this.attrInspector = null;
        }
        return yes;
      },

      _onMapClick: function (evt) {
        if (this._byPass === true) {
          this._byPass = false;
          return;
        }
        if (!this._attrInspIsCurrentlyDisplayed && evt.graphic &&
          this.templatePicker && !this.templatePicker.getSelected()) {
          this._processOnMapClick(evt);
        }
      },
      _attachmentsComplete: function (featureLayer, oid, deferred) {
        return function (results) {
          var errorMsg = "";
          array.forEach(results, function (result) {
            if (result) {
              if (result.state === "rejected") {
                if (result.error && esriLang.isDefined(result.error.code)) {
                  if (result.error.code === 400) {
                    // 400 is returned for unsupported attachment file types
                    errorMsg = errorMsg +
                      esriBundle.widgets.attachmentEditor.NLS_fileNotSupported + "<br/>";
                  } else {
                    errorMsg = errorMsg + result.error.message ||
                      (result.error.details &&
                      result.error.details.length &&
                      result.error.details[0]) + "<br/>";
                  }

                }
              }
            }
          }, this);
          if (errorMsg !== "") {
            var dialog = new Popup({
              titleLabel: this.nls.attachmentLoadingError,
              width: 400,
              maxHeight: 200,
              autoHeight: true,
              content: errorMsg,
              buttons: [{
                label: this.nls.close,
                classNames: ['jimu-btn'],
                onClick: lang.hitch(this, function () {
                  dialog.close();
                })
              }],
              onClose: lang.hitch(this, function () {

              })
            });
          }
          return this._completePost(featureLayer, oid, deferred);
        };

      },
      _completePost: function (featureLayer, oid, deferred) {
        this.attrInspector.destroy();
        this.attrInspector = null;

        this.attrInspector = this._createAttributeInspector([this.currentLayerInfo]);
        var query = new Query();
        query.objectIds = [oid];
        featureLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW);
        deferred.resolve("success");
      },
      // posts the currentFeature's changes
      _postChanges: function (feature) {
        var deferred = new Deferred();
        var ruleInfo;
        if (feature) {
          if (this._smartAttributes !== undefined && this._smartAttributes !== null) {
            for (var k in feature.attributes) {
              if (feature.attributes.hasOwnProperty(k) === true) {
                ruleInfo = this._smartAttributes.validateField(k);
                if (ruleInfo[1] === 'Hide') {
                  delete feature.attributes[k];
                }
              }
            }
          }
          if (feature.getLayer().originalLayerId) {

            // added feature
            var featureLayer = this.map.getLayer(feature.getLayer().originalLayerId);
            if (featureLayer) {
              // modify some attributes before calling applyEdits
              feature.attributes.OBJECTID = null;
              feature.symbol = null;

              featureLayer.applyEdits([feature], null, null, lang.hitch(this, function (e) {
                // since after save, keep att Inspect displayed
                // reselect the feature
                var defs = null;
                if (this._attachmentUploader) {
                  defs = this._attachmentUploader.postAttachments(featureLayer, e[0].objectId);
                }
                if (defs === undefined || defs === null || defs.length === 0) {
                  this._completePost(featureLayer, e[0].objectId, deferred);
                }
                else {
                  all(defs).then(lang.hitch(this,
                    this._attachmentsComplete(featureLayer, e[0].objectId, deferred)));

                }

              }));
            } // if featureLayer not nullf
          } else {
            // update existing feature
            // only get the updated attributes
            var newAttrs = editUtils.filterOnlyUpdatedAttributes(
              feature.attributes, feature.preEditAttrs);

            // Since the new requirement is that: after a save,
            // continue to show attributeInspector,
            // save the preEdit attributes
            feature.preEditAttrs = JSON.parse(JSON.stringify(feature.attributes));

            if (newAttrs && !editUtils.isObjectEmpty(newAttrs)) {
              // there are changes in attributes
              feature.attributes = newAttrs;
            } else {
              feature.attributes = []; // ?
            }
            //todo: for now, save the change anyway in case geometry also being edited

            // modify some important attributes before calling applyEdits
            feature.attributes.OBJECTID = feature.preEditAttrs.OBJECTID;
            feature.symbol = null;

            feature.getLayer().applyEdits(null, [feature], null,
              lang.hitch(this, function () {
                // sometimes a successfully update returns an empty array
                //if (e && e.length > 0 && e[0].success) {
                //feature.getLayer().clearSelection();

                feature.attributes = JSON.parse(JSON.stringify(feature.preEditAttrs));
                feature.getLayer().refresh();

                deferred.resolve("success");
                //}
              }), function () {
                // for now
                alert("Error when performing update ApplyEdits");
                deferred.resolve("failed");
              });
            //} else {
            //  // no attribute update
            //  //feature.getLayer().clearSelection();
            //}
          } // end of applying edit for update
        } else {
          deferred.resolve();
        }
        return deferred.promise;
      },

      _processOnMapClick: function (evt) {
        // viewing/editing existing features
        // The logic of adding new feature to local layer is handled
        // in the draw end event of the draw tool
        //if (!this.selectedTemplate) {
        if (true) {
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

          var layers = this.map.getLayersVisibleAtScale().filter(lang.hitch(this, function (lyr) {
            if (lyr.type && lyr.type === "Feature Layer" && lyr.url) {
              return this.settings.layerInfos.some(function (lyrinfo) {
                if (lyrinfo.layerId === lyr.id) {
                  return true;
                }
                else {
                  return false;
                }
              });
            }
            else {
              return false;
            }
          }));

          var updateFeatures = [];
          var deferreds = [];
          this.currentFeature = null;
          this.currentLayerInfo = null;
          array.forEach(layers, lang.hitch(this, function (layer) {
            // set selection symbol
            layer.setSelectionSymbol(this._getSelectionSymbol(layer.geometryType, false));

            var selectQuery = new Query();
            selectQuery.geometry = editUtils.pointToExtent(this.map, evt.mapPoint, 20);

            var deferred = layer.selectFeatures(selectQuery,
              FeatureLayer.SELECTION_NEW,
              function (features) {
                features.forEach(function (q) {
                  q.preEditAttrs = JSON.parse(JSON.stringify(q.attributes));
                });
                updateFeatures = updateFeatures.concat(features);
              });
            deferreds.push(deferred);
          }));

          all(deferreds).then(lang.hitch(this, function () {
            this.updateFeatures = updateFeatures;
            if (this.updateFeatures.length > 0) {
              this._showTemplate(false);
            }
            else {
              this._byPass = true;
              this.map.popupManager._showPopup(evt);
            }
          }));
        }
      },

      _postFeatureSave: function (evt) {

        if (this.updateFeatures && this.updateFeatures.length > 1) {
          array.forEach(this.updateFeatures, lang.hitch(this, function (feature) {
            feature.setSymbol(this._getSelectionSymbol(feature.getLayer().geometryType, false));
          }));
        }

        if (evt && evt.feature) {
          this.currentFeature = evt.feature;
          this.currentLayerInfo = this._getLayerInfoByID(this.currentFeature._layer.id);

          this._createSmartAttributes();
          this._swizzleAttrbuteTable();
          this._validateAttributes();
          this._enableAttrInspectorSaveButton(false);
          this._toggleDeleteButton(this.currentLayerInfo.allowDelete);
          this._toggleEditGeoSwitch(this.currentLayerInfo.disableGeometryUpdate);
          //this._sytleFields(this.attrInspector);
          this.currentFeature.setSymbol(
            this._getSelectionSymbol(evt.feature.getLayer().geometryType, true));
          if (this.currentLayerInfo.editDescription && this.currentLayerInfo.editDescription !== null) {
            this.editDescription.innerHTML = this.currentLayerInfo.editDescription;
            this.editDescription.style.display = "block";
          }
          else {
            this.editDescription.style.display = "none";
          }
        }

      },

      _promptToDelete: function () {

        var dialog = new Popup({
          titleLabel: this.nls.deletePromptTitle,
          width: 300,
          maxHeight: 200,
          autoHeight: true,
          content: this.nls.deletePrompt,
          buttons: [{
            label: this.nls.yes,
            classNames: ['jimu-btn'],
            onClick: lang.hitch(this, function () {
              this._deleteFeature();
              dialog.close();

            })
          }, {
            label: this.nls.no,
            classNames: ['jimu-btn'],

            onClick: lang.hitch(this, function () {

              dialog.close();

            })
          }

          ],
          onClose: lang.hitch(this, function () {

          })
        });
      },
      _promptToResolvePendingEdit: function (switchToTemplate, evt) {
        var disable = !this._validateAttributes();
        var dialog = new Popup({
          titleLabel: this.nls.savePromptTitle,
          width: 300,
          maxHeight: 200,
          autoHeight: true,
          content: this.nls.savePrompt,
          buttons: [{
            label: this.nls.yes,
            classNames: ['jimu-btn'],
            disable: disable,
            onClick: lang.hitch(this, function () {
              this._saveEdit(this.currentFeature, switchToTemplate).then(function () {
              });
              this._postFeatureSave(evt);
              dialog.close();

            })
          }, {
            label: this.nls.no,
            classNames: ['jimu-btn'],

            onClick: lang.hitch(this, function () {
              this._cancelEditingFeature(switchToTemplate);
              this._postFeatureSave(evt);
              dialog.close();

            })
          }, {
            label: this.nls.close,
            classNames: ['jimu-btn'],
            onClick: lang.hitch(this, function () {
              dialog.close();
            })
          }],
          onClose: lang.hitch(this, function () {

          })
        });

      },

      _removeLocalLayers: function () {
        var mymap = this.map;
        if (mymap) {
          var filteredID = mymap.graphicsLayerIds.filter(function (e) {
            return e.lastIndexOf("_lfl") > 0;
          });
          var mappedArr = array.map(filteredID, function (e) {
            return mymap.getLayer(e);
          });
          array.forEach(mappedArr, function (e) {
            mymap.removeLayer(e);
          });

          this.updateFeatures = [];
        }
      },

      _removeSpacesInLayerTemplates: function (layer) {
        if (!layer) { return; }

        var filteredFields = array.filter(layer.fields, lang.hitch(this, function (field) {
          return field.nullable === false && field.editable === true;
        }));
        array.forEach(filteredFields, lang.hitch(this, function (f) {
          // trim of space in the field value
          array.forEach(layer.templates, function (t) {
            if (t.prototype.attributes[f.name] === " ") {
              t.prototype.attributes[f.name] = t.prototype.attributes[f.name].trim();
            }
          });
        }));
      },

      _resetEditingVariables: function () {
        this._isDirty = false;
        this._editingEnabled = false;
        this.editToolbar.deactivate();

        //this._turnEditGeometryToggleOff();
      },

      // perform validation then post the changes or formatting the UI if errors
      // no confirm dialog involved
      _saveEdit: function (feature, switchToTemplate) {
        var deferred = new Deferred();
        // disable the save button even if the saving is done
        this._enableAttrInspectorSaveButton(false);
        if (this._validateAttributes()) {
          var processIndicators = query(".processing-indicator");
          var processIndicatorsPanel = query(".processing-indicator-panel");
          var saveBtn = query(".saveButton")[0];
          array.forEach(processIndicators, function (processIndicator) {
            if (!domClass.contains(processIndicator, "busy")) {
              domClass.add(processIndicator, "busy");
            }
          });
          array.forEach(processIndicatorsPanel, function (processIndicator) {
            if (!domClass.contains(processIndicator, "busy")) {
              domClass.add(processIndicator, "busy");
            }
          });
          if (!domClass.contains(saveBtn, "hide")) {
            domClass.add(saveBtn, "hide");
          }
          // call applyEdit
          this._postChanges(feature).then(lang.hitch(this, function () {

            // if currently only one selected feature
            if (this._configEditor.removeOnSave && this.updateFeatures.length === 1) {
              switchToTemplate = true;
            }

            if (switchToTemplate && switchToTemplate === true) {

              //feature.getLayer().clearSelection();
              this._showTemplate(true);

            } else {

              this._resetEditingVariables();
              this.map.setInfoWindowOnClick(true);

              if (this._configEditor.removeOnSave) {
                var layer = feature.getLayer();
                // perform a new query
                var query = new Query();
                query.objectIds = [feature.attributes.OBJECTID];
                layer.selectFeatures(query, FeatureLayer.SELECTION_SUBTRACT,
                  lang.hitch(this, function () {
                    this.updateFeatures.splice(this.updateFeatures.indexOf(feature), 1);
                    this.attrInspector.next();
                  }));
              } else {
                // reselect the feature
                feature.setSymbol(this._getSelectionSymbol(
                  feature.getLayer().geometryType, true));

              }
            }
            deferred.resolve("success");

            array.forEach(processIndicators, function (processIndicator) {
              if (domClass.contains(processIndicator, "busy")) {
                domClass.remove(processIndicator, "busy");
              }
            });
            array.forEach(processIndicatorsPanel, function (processIndicator) {
              if (domClass.contains(processIndicator, "busy")) {
                domClass.remove(processIndicator, "busy");
              }
            });
            if (domClass.contains(saveBtn, "hide")) {
              domClass.remove(saveBtn, "hide");
            }

          }));
        }
        //else
        //{
        //  this._formatErrorFields(errorObj);

        //  deferred.resolve("failed");
        //}
        return deferred.promise;
      },

      _showTemplate: function (showTemplate) {
        this._attrInspIsCurrentlyDisplayed = !showTemplate;
        if (showTemplate) {
          this._mapClickHandler(true);
          this._showTemplatePicker();

          // esriBundle.widgets.attachmentEditor.NLS_attachments = this._orignls;
        } else {
          //esriBundle.widgets.attachmentEditor.NLS_attachments = this._orignls + " " + this.nls.attachmentSaveDeleteWarning;
          this._mapClickHandler(false);
          //show attribute inspector
          query(".jimu-widget-smartEditor .templatePickerMainDiv")[0].style.display = "none";
          query(".jimu-widget-smartEditor .attributeInspectorMainDiv")[0].style.display = "block";


          this._mapClickHandler(false);
          if (this.attrInspector) {
            this._createSmartAttributes();
            this._swizzleAttrbuteTable();
            if (!this.currentFeature) {
              this.attrInspector.first();
            }
            this.attrInspector.refresh();
            //this._sytleFields(this.attrInspector);
            if (this.currentFeature.getLayer().originalLayerId) {
              this._enableAttrInspectorSaveButton(this._validateAttributes());
            } else {
              this._enableAttrInspectorSaveButton(false);
            }
            if (this.currentLayerInfo.editDescription && this.currentLayerInfo.editDescription !== null) {
              this.editDescription.innerHTML = this.currentLayerInfo.editDescription;
              this.editDescription.style.display = "block";
            }
            else {
              this.editDescription.style.display = "none";
            }
            this._toggleEditGeoSwitch(this.currentLayerInfo.disableGeometryUpdate);

          }

        }


      },
      _swizzleAttrbuteTable: function () {

        //var attTable = query("tr", this.attrInspector.domNode);
        //if (attTable === undefined || attTable === null) {
        //  return;
        //}
        //if (attTable.length > 0) {
        //  array.forEach(attTable, function (row) {
        //    row.innerHTML = row.innerHTML.replace('<td>', '<div>').replace('</td>', '</div>').replace('<td ', '<div ');

        //  }, this);
        //}


      },
      _createSmartAttributes: function () {
        if (this.currentFeature === undefined || this.currentFeature === null) {
          return;
        }
        var attTable = query("td.atiLabel", this.attrInspector.domNode);
        if (attTable === undefined || attTable === null) {
          return;
        }
        var fieldValidation = null;
        if (this.currentLayerInfo !== undefined && this.currentLayerInfo !== null) {
          if (this.currentLayerInfo.fieldValidations !== undefined &&
            this.currentLayerInfo.fieldValidations !== null) {
            fieldValidation = this.currentLayerInfo.fieldValidations;
          }
        }
        if (fieldValidation === null) {
          return;
        }

        var smartAttParams = {
          _attrInspector: this.attrInspector,
          _fieldValidation: fieldValidation,
          _feature: this.currentFeature,
          _fieldInfo: this.currentLayerInfo.fieldInfos
        };
        this._smartAttributes = new smartAttributes(smartAttParams);

      },
      _showTemplatePicker: function () {
        // hide the attr inspector and show the main template picker div
        query(".jimu-widget-smartEditor .attributeInspectorMainDiv")[0].style.display = "none";
        query(".jimu-widget-smartEditor .templatePickerMainDiv")[0].style.display = "block";

        if (this._creationDisabledOnAll) {
          dojo.style(this.templatePicker.domNode, "display", "none");


        } else {
          //
          dojo.style(this.templatePicker.domNode, "display", "block");

        }

        this.templatePicker.clearSelection();

        // reset
        this._resetEditingVariables();

        if (this.currentFeature && this.currentFeature.getLayer()) {
          this.currentFeature.getLayer().clearSelection().refresh();
          this.currentFeature.getLayer().clear();
        }

        array.forEach(this.updateFeatures, lang.hitch(this, function (feature) {
          feature.getLayer().clearSelection().refresh();
        }));

        this.currentFeature = null;
        this.currentLayerInfo = null;
        this.updateFeatures = [];


        this._activateTemplateToolbar();

      },

      _setPresetValue: function () {
        var sw = registry.byId("savePresetValueSwitch");
        this._usePresetValues = sw.checked;
      },
      _toggleUsePresetValues: function (checked) {
        var sw = registry.byId("savePresetValueSwitch");
        sw.set('checked',  checked === null ? !sw.checked : checked);
        this._usePresetValues = sw.checked;
      },
      _turnEditGeometryToggleOff: function () {

        if (this._editGeomSwitch && this._editGeomSwitch.checked) {
          this._ignoreEditGeometryToggle = true;
          this._editGeomSwitch.set("checked", false);
          this.map.setInfoWindowOnClick(true);
          setTimeout(lang.hitch(this, function () {
            this._ignoreEditGeometryToggle = false;
          }), 2);
        }
      },

      // todo: modify to feature as input parameter?
      _validateRequiredFields: function () {
        var errorObj = {};

        if (!this.currentFeature) { return errorObj; }

        var layer = this.currentFeature.getLayer();

        var filteredFields = array.filter(layer.fields, lang.hitch(this, function (field) {
          return field.nullable === false && field.editable === true;
        }));

        array.forEach(filteredFields, lang.hitch(this, function (f) {
          if (this.currentFeature.attributes[f.name] === "undefined") {
            errorObj[f.alias] = "undefined";
          }
          else if (this.currentFeature.attributes[f.name] === null) {
            errorObj[f.alias] = "null";
          }
          else {
            switch (f.type) {
              case "esriFieldTypeString":
                if (this.currentFeature.attributes[f.name] === "" ||
                    (this.currentFeature.attributes[f.name] &&
                    this.currentFeature.attributes[f.name].trim() === "")) {
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

      _worksAfterClose: function () {
        // restore the default string of mouse tooltip
        esriBundle.toolbars.draw.start = this._defaultStartStr;
        esriBundle.toolbars.draw.addPoint = this._defaultAddPointStr;

        // show lable layer.
        var labelLayer = this.map.getLayer("labels");
        if (labelLayer) {
          labelLayer.show();
        }
      },

      _workBeforeCreate: function () {

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
        if (labelLayer) {
          labelLayer.hide();
        }
        array.forEach(this.settings.layerInfos, function (layerInfo) {
          var jimuLayerInfo =
            this._jimuLayerInfos.getLayerInfoByTopLayerId(layerInfo.featureLayer.id);
          if (jimuLayerInfo) {
            layerInfo.featureLayer.name = jimuLayerInfo.title;
          }
        }, this);
      },

      _getDefaultFieldInfos: function (layerId) {
        // summary:
        //  filter webmap fieldInfos.
        // description:
        //   return null if fieldInfos has not been configured in webmap.
        var fieldInfos = editUtils.getFieldInfosFromWebmap(layerId, this._jimuLayerInfos);//
        if (fieldInfos) {
          fieldInfos = array.filter(fieldInfos, function (fieldInfo) {
            return fieldInfo.visible || fieldInfo.isEditable;
          });
        }
        return fieldInfos;
      },

      _getDefaultLayerInfos: function () {
        var defaultLayerInfos = [];
        var fieldInfos;
        for (var i = this.map.graphicsLayerIds.length - 1; i >= 0 ; i--) {
          var layerObject = this.map.getLayer(this.map.graphicsLayerIds[i]);
          if (layerObject.type === "Feature Layer" && layerObject.url) {
            var layerInfo = {
              featureLayer: {}
            };
            layerInfo.featureLayer.id = layerObject.id;
            layerInfo.disableGeometryUpdate = false;
            layerInfo.allowUpdateOnly = false; //
            fieldInfos = this._getDefaultFieldInfos(layerObject.id);
            if (fieldInfos && fieldInfos.length > 0) {
              layerInfo.fieldInfos = fieldInfos;
            }
            defaultLayerInfos.push(layerInfo);
          }
        }
        return defaultLayerInfos;
      },

      _converConfiguredLayerInfos: function (layerInfos) {
        array.forEach(layerInfos, function (layerInfo) {
          // convert layerInfos to compatible with old version
          if (!layerInfo.featureLayer.id && layerInfo.featureLayer.url) {
            var layerObject = getLayerObjectFromMapByUrl(this.map, layerInfo.featureLayer.url);
            if (layerObject) {
              layerInfo.featureLayer.id = layerObject.id;

            }
          }

          // convert fieldInfos
          var newFieldInfos = [];
          var webmapFieldInfos =
            editUtils.getFieldInfosFromWebmap(layerInfo.featureLayer.id, this._jimuLayerInfos);
          array.forEach(layerInfo.fieldInfos, function (fieldInfo) {
            if (/*fieldInfo.isEditable &&*/
              // only for compitible with old version of config.
              // 'globalid' and 'objectid' can not appear in new app's config.
               fieldInfo.fieldName !== "globalid" &&
               fieldInfo.fieldName !== "objectid") {
              var webmapFieldInfo = getFieldInfoFromWebmapFieldInfos(webmapFieldInfos, fieldInfo);
              if (webmapFieldInfo) {
                if (webmapFieldInfo.isEditable ||
                    webmapFieldInfo.isEditableSettingInWebmap ||
                    webmapFieldInfo.visible) {
                  newFieldInfos.push(webmapFieldInfo);
                }
              } else {
                newFieldInfos.push(fieldInfo);
              }
            }
          }, this);

          if (newFieldInfos.length !== 0) {
            layerInfo.fieldInfos = newFieldInfos;
          }
          //layerInfo = this._modifyFieldInfosForEE(layerInfo);
          //layerInfo.fieldInfo = this._processFieldInfos(layerInfo.fieldInfo);
        }, this);
        return layerInfos;

        function getFieldInfoFromWebmapFieldInfos(webmapFieldInfos, fieldInfo) {
          var resultFieldInfo = null;
          if (webmapFieldInfos) {
            for (var i = 0; i < webmapFieldInfos.length; i++) {
              if (fieldInfo.fieldName === webmapFieldInfos[i].fieldName) {
                webmapFieldInfos[i].label = fieldInfo.label === undefined ?
                  webmapFieldInfos[i].label : fieldInfo.label;
                webmapFieldInfos[i].isEditableSettingInWebmap = webmapFieldInfos[i].isEditable;
                webmapFieldInfos[i].isEditable = fieldInfo.isEditablelabel === undefined ?
                  webmapFieldInfos[i].isEditable : fieldInfo.isEditable;
                webmapFieldInfos[i].canPresetValue = fieldInfo.canPresetValue === undefined ?
                  false : fieldInfo.canPresetValue;
                resultFieldInfo = webmapFieldInfos[i];
                break;
              }
            }
          }
          return resultFieldInfo;
        }

        function getLayerObjectFromMapByUrl(map, layerUrl) {
          var resultLayerObject = null;
          for (var i = 0; i < map.graphicsLayerIds.length; i++) {
            var layerObject = map.getLayer(map.graphicsLayerIds[i]);
            if (layerObject.url.toLowerCase() === layerUrl.toLowerCase()) {
              resultLayerObject = layerObject;
              break;
            }
          }
          return resultLayerObject;
        }
      },

      _getLayerInfosParam: function () {
        // var retDef = new Deferred();
        // var defs = [];
        var layerInfos;
        var resultLayerInfosParam = [];
        if (!this._configEditor.layerInfos) {
          // configured in setting page and no layers checked.
          layerInfos = [];
        } else if (this._configEditor.layerInfos.length > 0) {
          // configured and has been checked.
          layerInfos = this._converConfiguredLayerInfos(this._configEditor.layerInfos);
        } else {
          // has not been configure.
          layerInfos = this._getDefaultLayerInfos();
        }

        //according to condition to filter
        array.forEach(layerInfos, function (layerInfo) {
          var layerObject = this.map.getLayer(layerInfo.featureLayer.id);
          if (layerObject &&
             layerObject.visible &&
             layerObject.isEditable &&
             layerObject.isEditable()) {

            // modify templates with space in string fields
            this._removeSpacesInLayerTemplates(layerObject);
            this._modifyFieldInfosForEE(layerInfo);
            layerInfo.featureLayer = layerObject;
            layerInfo.showDeleteButton = false;
            resultLayerInfosParam.push(layerInfo);
          }
        }, this);

        return resultLayerInfosParam;
      },

      _getSettingsParam: function () {
        var settings = {
          map: this.map
        };
        for (var attr in this._configEditor) {
          settings[attr] = this._configEditor[attr];
        }
        settings.layerInfos = this._getLayerInfosParam();

        return settings;
      },
      onClose: function () {
        this._worksAfterClose();

        //if (this._configEditor.clearSelectionOnClose) {
        //  if (this._isDirty) {
        //    this._promptToResolvePendingEdit(true).then(lang.hitch(this, function () {
        //      // set this variable for controlling the onMapClick (#494)
        //      this.map.setInfoWindowOnClick(true);
        //      this._attrInspIsCurrentlyDisplayed = true;
        //      this.templatePicker.clearSelection();
        //    }))

        //  } else {
        //    this._cancelEditingFeature(true);

        //    // set this variable for controlling the onMapClick
        //    this.map.setInfoWindowOnClick(true);
        //    this._attrInspIsCurrentlyDisplayed = true;
        //    this.templatePicker.clearSelection();
        //  }
        //} else
        //{
        this._mapClickHandler(false);
        //}

        // close method will call onDeActive automaticlly
        // so do not need to call onDeActive();
      },


      _update: function () {
        //if (this.templatePicker) {
        //comments out, this results in teh scroll bar disappearing, unsure why


        //var widgetBox = html.getMarginBox(this.domNode);
        //var height = widgetBox.h;
        //var width = widgetBox.w;


        //var cols = Math.floor(width / 60);
        //this.templatePicker.attr('columns', cols);
        //this.templatePicker.update();


        // }
      },

      resize: function () {
        this._update();
      },
      onNormalize: function () {
        setTimeout(lang.hitch(this, this._update), 100);
      },

      onMinimize: function () {
      },

      onMaximize: function () {
        setTimeout(lang.hitch(this, this._update), 100);
      }

    });
  });