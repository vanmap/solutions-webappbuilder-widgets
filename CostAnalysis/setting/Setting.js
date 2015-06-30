
define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',

    'jimu/BaseWidgetSetting',
    'jimu/dijit/SimpleTable',
    'jimu/dijit/LayerFieldChooser',    

    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/on',
    'dojo/_base/array',
    'dojo/dom-style',
    'dojo/dom-construct',
    'dojo/query',

    'dijit/form/Select',
    'dijit/form/ValidationTextBox',
    'dojo/data/ItemFileReadStore'

  ],
  function (
    declare,
    _WidgetsInTemplateMixin,

    BaseWidgetSetting,
    Table,
    LayerFieldChooser,   

    lang,
    html,
    on,
    array,
    domStyle,
    domConstruct,
    query,

    Select,
    ValidationTextBox,
    ItemFileReadStore

    ) {
      return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
          //these two properties is defined in the BaseWidget
          baseClass: 'jimu-widget-asset-cost-analysis-setting',
          selectLayer: null,
          tooltipDialog: null,
          featurelayers: [],
          indexLayer: -1,
          controlsAddedToWidgetFrame: false,

          startup: function () {
              this.inherited(arguments);

              this.featurelayers.length = 0;

              if (!this.config.editor) {
                  this.config.editor = {};
              }

              var fields = [{
                  name: 'edit',
                  title: this.nls.edit,
                  type: 'checkbox',
                  'class': 'editable'
              }, {
                  name: 'label',
                  title: this.nls.label,
                  type: 'text'
              }

            ];
              var args = {
                  fields: fields,
                  selectable: false
              };
              this.displayLayersTable = new Table(args);
              this.displayLayersTable.placeAt(this.tableLayerInfos);
              this.displayLayersTable.startup();

              //load lookup table, Project Group Costing table and Project Cost table
              this.selectLookupLayer();
              this.selectProjectGroupCostingInfoLayer();
              this.selectProjectLayer();

              this.own(on(this.lookupTableChooser, 'change', lang.hitch(this, this.lookupTableChooserChange)));

              this.own(on(this.projectLayerChooser, 'change', lang.hitch(this, this.projectLayerChooserChange)));

              this.own(on(this.lengthUnitChooser, 'change', lang.hitch(this, this.lengthUnitChooserChange)));

              this.setConfig(this.config);

              try {
                  var btnBar =
                      (this.domNode.parentNode.parentNode.parentNode.parentNode.lastChild.lastChild);

                  this.btnErrorMsg = domConstruct.toDom("<div class='settings-error hide'></div>");
                  domConstruct.place(this.btnErrorMsg, btnBar, "after");
                  html.addClass(this.settingsPageSaveError, 'hide');

                  this.controlsAddedToWidgetFrame = true;

              }
              catch (err) {
                  console.log(err.message);
              }
          },


          lookupTableChooserChange: function () {
              this.selectProjectGroupCostingInfoLayer();
          },

          projectLayerChooserChange: function () {
              this.displayLayersTable.clear();
              this.featurelayers.splice(0, this.featurelayers.length);
              this.initSelectLayer();
          },

          lengthUnitChooserChange: function (selected) {
              array.forEach(this.lengthUnitChooser.getOptions(),
          lang.hitch(this, function (opt) {
              if (opt.value === selected) {
                  this.cHullBufferDistanceUnit.innerHTML = opt.label;
                  return;
              }
          }));
          },

          setConfig: function (config) {
              this.config = config;
              this.displayLayersTable.clear();
              this.featurelayers.length = 0;

              //lookupTableName
              if (config.lookupTableName) {
                  this.lookupTableChooser.set('value', config.lookupTableName);
              }

              //projectGroupCostingInfoTableName
              if (config.projectGroupCostingInfoTableName) {
                  this.projectGroupCostingInfoChooser.set('value', config.projectGroupCostingInfoTableName);
              }

              //projectLayerName
              if (config.projectLayerName) {
                  this.projectLayerChooser.set('value', config.projectLayerName);
              }

              //LengthUnit
              if (config.lengthUnit) {
                  if (config.lengthUnit.value) {
                      this.lengthUnitChooser.set('value', config.lengthUnit.value);
                      this.cHullBufferDistanceUnit.innerHTML = config.lengthUnit.label;
                  }
              }

              //AreaAndLengthUnit
              if (config.areaAndLengthUnit) {
                  if (config.areaAndLengthUnit.value) {
                      this.areaAndLengthUnitChooser.set('value', config.areaAndLengthUnit.value);
                  }
              }

              //CurrencyUnit
              if (config.currencyUnit) {
                  this.currencyUnitInput.set('value', config.currencyUnit);
              }

              //ConvexHullBufferDistance
              if (config.cHullBufferDistance) {
                  this.cHullBufferDistanceInput.set('value', config.cHullBufferDistance);
              }

              //Layer Info
              if (config.editor.layerInfos) {
                  this.initSelectLayer();
              }


          },

          selectLookupLayer: function () {
              var lookupTable = this.map.itemInfo.itemData.tables;

              if (lookupTable !== undefined) {
                  dojo.addOnLoad(function () {

                      var data = { identifier: 'value', items: [], label: 'lookupTableName' };

                      for (var i = 0; i < lookupTable.length; ++i) {
                          data.items.push(dojo.mixin({ "lookupTableName": lookupTable[i].title }, { "value": lookupTable[i].title }));
                      }
                      var lookupStore = dojo.data.ItemFileReadStore({ data: data });
                      dijit.byId("lookupTableChooser").setStore(lookupStore);

                  });
              }

          },

          selectProjectGroupCostingInfoLayer: function () {
              var projectGroupCostingInfoTable = this.map.itemInfo.itemData.tables;

              var selectedLookupTable = dijit.byId('lookupTableChooser').getValue();

              if (projectGroupCostingInfoTable !== undefined) {

                  dojo.addOnLoad(function () {

                      var data = { identifier: 'value', items: [], label: 'projectGroupCostingInfoTableName' };

                      for (var i = 0; i < projectGroupCostingInfoTable.length; ++i) {
                          if (projectGroupCostingInfoTable[i].title != selectedLookupTable) {
                              data.items.push(dojo.mixin({ "projectGroupCostingInfoTableName": projectGroupCostingInfoTable[i].title }, { "value": projectGroupCostingInfoTable[i].title }));
                          }
                      }
                      var lookupStore = dojo.data.ItemFileReadStore({ data: data });
                      dijit.byId("projectGroupCostingInfoChooser").setStore(lookupStore);

                  });
              }

          },

          selectProjectLayer: function () {

              var projectFeatureLayer = [];

              var len = this.map.graphicsLayerIds.length;

              var edit = false;

              var editableLayers = array.map(this.config.editor.layerInfos, function (layerinfo) {
                  return layerinfo.featureLayer.url;
              });


              for (var i = len - 1; i >= 0; i--) {
                  var layer = this.map.getLayer(this.map.graphicsLayerIds[i]);
                  if (layer.type === "Feature Layer" && layer.url && layer.isEditable()) {

                      edit = true;
                      if (editableLayers.length > 0 && editableLayers.indexOf(layer.url) === -1) {
                          edit = false;
                      }
                      title = this.getOperationalLayerTitle(layer);

                      projectFeatureLayer.push({ name: title });

                  }
              }

              dojo.addOnLoad(function () {

                  var data = { identifier: 'value', items: [], label: 'projectLayerTableName' };

                  for (var i = 0; i < projectFeatureLayer.length; ++i) {

                      data.items.push(dojo.mixin({ "projectLayerTableName": projectFeatureLayer[i].name }, { "value": projectFeatureLayer[i].name }));

                  }
                  var lookupStore = dojo.data.ItemFileReadStore({ data: data });
                  dijit.byId("projectLayerChooser").setStore(lookupStore);

              });


          },


          initSelectLayer: function () {
              var count = 0, label = "";
              var len = this.map.graphicsLayerIds.length;
              var has = false;
              var edit = false;
              var selectedProjectLayer = dijit.byId('projectLayerChooser').getValue();

              var editableLayers = array.map(this.config.editor.layerInfos, function (layerinfo) {
                  return layerinfo.featureLayer.url;
              });

              for (var i = len - 1; i >= 0; i--) {
                  var layer = this.map.getLayer(this.map.graphicsLayerIds[i]);
                  if (layer.type === "Feature Layer" && layer.url && layer.isEditable()) {
                      has = true;
                      edit = true;
                      if (editableLayers.length > 0 && editableLayers.indexOf(layer.url) === -1) {
                          edit = false;
                      }

                      label = this.getOperationalLayerTitle(layer);
                      if (label != selectedProjectLayer) {
                          this.featurelayers.push({
                              label: label,
                              layer: layer,
                              edit: edit
                          });

                          this.displayLayersTable.addRow({
                              label: label,
                              edit: edit
                          });
                      }
                  }
              }
              if (!has) {
                  domStyle.set(this.tableLayerInfosError, "display", "");
                  this.tableLayerInfosError.innerHTML = this.nls.noLayers;
              } else {
                  domStyle.set(this.tableLayerInfosError, "display", "none");
              }
          },

          getOperationalLayerTitle: function (layer) {
              var title = "";
              if (this.appConfig.map && this.appConfig.map.operationallayers) {
                  var len = this.appConfig.map.operationallayers.length;
                  for (var i = 0; i < len; i++) {
                      if (this.appConfig.map.operationallayers[i].url.toLowerCase() ===
                layer.url.toLowerCase()) {
                          title = this.appConfig.map.operationallayers[i].label;
                          break;
                      }
                  }
              }
              if (!title) {
                  title = layer.name;
              }
              if (!title) {
                  title = layer.url;
              }
              return title;
          },

          isLayerInConfig: function (layer) {
              if (this.config.editor.layerInfos) {
                  var info = this.config.editor.layerInfos;
                  var len = info.length;
                  for (var i = 0; i < len; i++) {
                      if (info[i].featureLayer && info[i].featureLayer.url) {
                          if (info[i].featureLayer.url.toLowerCase() === layer.url.toLowerCase()) {
                              return true;
                          }
                      }
                  }
              }
              return false;
          },

          getConfig: function () {

              //lookupTableName
              if (this.config.lookupTableName === '') {
                  this.showOKError();
                  return false;
              }

              else {
                  this.config.lookupTableName = this.lookupTableChooser.value;
              }

              //projectGroupCostingInfoTableName
              if (this.config.projectGroupCostingInfoTableName === '') {
                  this.showOKError();
                  return false;
              }
              else {
                  this.config.projectGroupCostingInfoTableName = this.projectGroupCostingInfoChooser.value;
              }

              //projectLayerName
              if (this.config.projectLayerName === '') {
                  this.showOKError();
                  return false;
              }
              else {

                  this.config.projectLayerName = this.projectLayerChooser.value;
              }
              //Length
              if (!this.config.lengthUnit) {
                  this.config.lengthUnit = {};
              }

              this.config.lengthUnit.label = this.getLabelforValue(this.config.lengthUnit.value, this.lengthUnitChooser);
              this.config.lengthUnit.value = this.lengthUnitChooser.value;

              //Areal
              if (!this.config.areaAndLengthUnit) {
                  this.config.areaAndLengthUnit = {};
              }

              this.config.areaAndLengthUnit.label = this.getLabelforValue(this.config.areaAndLengthUnit.value, this.areaAndLengthUnitChooser);
              this.config.areaAndLengthUnit.value = this.areaAndLengthUnitChooser.value;

              //Currency
              if ((this.config.currencyUnit === undefined) || (this.config.currencyUnit === '')) {
                  this.showOKError();
                  return false;
              }
              else {
                  this.config.currencyUnit = this.currencyUnitInput.value.trim();
              }

              //Convex Hull Buffer Distance
              if ((this.config.cHullBufferDistance === undefined) || (this.config.cHullBufferDistance === '')) {
                  this.showOKError();
                  return false;
              }
              else {
                  this.config.cHullBufferDistance = this.cHullBufferDistanceInput.value ? this.cHullBufferDistanceInput.value : 0;
              }

              this.config.editor.toolbarVisible = this.toolbarVisible.checked;

              this.config.updateLayers = [];

              if (this.displayLayersTable !== null) {

                  array.forEach(this.displayLayersTable.getRows(), function (row) {
                      var rowData = this.displayLayersTable.getRowData(row);

                      this.config.updateLayers.push({
                          "name": rowData.label
                      });

                  }, this);
              }

              if (this.config.updateLayers) {
                  if (this.config.updateLayers.length === 0) {
                      this.showOKError();
                      return false;
                  }
              } else {
                  this.showOKError();
                  return false;
              }

              var data = this.displayLayersTable.getData();
              var len = this.featurelayers.length;
              this.config.editor.layerInfos = [];

              for (var i = 0; i < len; i++) {
                  if (data[i].edit) {
                      var json = {};
                      json.editable = this.featurelayers[i].edit;
                      json.featureLayer = {};
                      json.featureLayer.url = this.featurelayers[i].layer.url;
                      json.featureLayer.name = this.featurelayers[i].layer.name;

                      this.config.editor.layerInfos.push(json);
                  }

              }
              return this.config;
          },

          //return the label for the given value from a <select>
          getLabelforValue: function (value, from) {
              var options = from.options;
              var result;

              array.forEach(options, function (opt) {
                  if (opt.value === value) {
                      result = opt.label;
                  }
              });

              return result;
          },

          hideOkError: function () {
              if (this.controlsAddedToWidgetFrame) {

                  html.addClass(this.btnErrorMsg, 'hide');
              } else {
                  domStyle.set(this.settingsPageSaveError, 'display', 'none');
              }
          },

          showOKError: function () {
              if (this.controlsAddedToWidgetFrame) {
                  this.btnErrorMsg.innerHTML = this.nls.errorOnOk;
                  html.removeClass(this.btnErrorMsg, 'hide');
              }
          }
      });
  });