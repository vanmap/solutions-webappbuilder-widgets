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
    'jimu/BaseWidgetSetting',
    'jimu/dijit/SimpleTable',
    'jimu/dijit/TabContainer3',
    'jimu/LayerInfos/LayerInfos',
    'jimu/utils',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/on',
    "dojo/when",
    "dojo/query",
    'dojo/_base/array',
    "../locatorUtils",
    "./EditFields",
    "../js/utils",
    "./LocatorSourceSetting",
    'dijit/form/NumberSpinner',
    "jimu/dijit/CheckBox",
    'dojo/dom-construct',
    'dojo/dom'
],
  function (
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    SimpleTable,
    TabContainer3,
    LayerInfos,
    utils,
    lang,
    html,
    on,
    when,
    query,
    array,
    _utils,
    EditFields,
    editUtils,
    LocatorSourceSetting,
    NumberSpinner,
    CheckBox,
    domConstruct,
    dom) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-setting-critical-facilities',

      _jimuLayerInfos: null,
      _layersTable: null,
      _editableLayerInfos: null,
      _featureService: null,
      _arrayOfFields: null,
      _layerForFields: null,
      _latField: null,
      _longField: null,
      _layerInfos: [],

      startup: function () {
        this.inherited(arguments);

        if (!(this.config && this.config.sources)) {
          this.config.sources = [];
        }

        LayerInfos.getInstance(this.map, this.map.itemInfo)
          .then(lang.hitch(this, function (operLayerInfos) {
            this._featureService = operLayerInfos.getLayerInfoArray()[0].getUrl(); //this currently gets the first layer, need to change to get the selected layer
            this.layerForFields = operLayerInfos.getLayerInfoArray()[0];
            this._jimuLayerInfos = operLayerInfos;
            this._editableLayerInfos = this._getEditableLayerInfos();
            this._initUI();
            _utils.setMap(this.map);
            _utils.setLayerInfosObj(this._jimuLayerInfos);
            _utils.setAppConfig(this.appConfig);
            when(_utils.getConfigInfo(this.config)).then(lang.hitch(this, function (config) {
              if (!this.domNode) {
                return;
              }
              this.setConfig(config);
            }));
          }));
      },

      _initUI: function () {
        this._initTabs();
        this._initLayersTable();
        this._initLocationOptions();
      },

      _initTabs: function () {
        this._tabsContainer = new TabContainer3({
          tabs: [{
            title: this.nls.layerTab.layerTabLabel,
            content: this.layerTabNode
          }, {
            title: this.nls.geocodeTab.geocodeTabLabel,
            content: this.geocodeTabNode
          }]
        }, this.tabContainer);
        this.own(on(this._tabsContainer, "tabChanged", lang.hitch(this, function () {
          this._tabsContainer.containerNode.scrollTop = 0;
        })));
        this._tabsContainer.startup();
      },

      _initLayersTable: function () {
        this._layersTable = new SimpleTable({
          fields: [{
            name: 'rdoLayer',
            title: this.nls.rdoLayer,
            type: 'radio',
            width: '250px',
            'class': 'select'
          }, {
            name: 'txtLayerLabel',
            title: this.nls.txtLayerLabel,
            type: 'text'
          }, {
            name: 'actionFields',
            title: this.nls.actionsLabel,
            type: 'actions',
            actions: ['edit'],
            width: '250px'
          }],
          selectable: true
        });
        this._layersTable.placeAt(this.tableLayerInfos);
        this._layersTable.startup();

        this.own(on(this._layersTable, 'actions-edit',
          lang.hitch(this, this._onEditFieldsClick)));

        this.own(on(this._layersTable, 'row-select',
          lang.hitch(this, this._onRowSelected)));

        this._addLayerRows();
      },

      _onRowSelected: function (tr) {
        var radio = query('input', tr.firstChild)[0];
        var config = this._getRowConfig(tr);
        config._editFlag = radio.checked
        this._setRowConfig(tr, config);
      },

      _addLayerRows: function () {
        if (this._editableLayerInfos) {
          array.forEach(this._editableLayerInfos, lang.hitch(this, function (layerInfo) {
            var addRowResult = this._layersTable.addRow({
              txtLayerLabel: layerInfo.featureLayer.title,
              rdoLayer: layerInfo._editFlag
            });
            if (addRowResult && addRowResult.success) {
              this._setRowConfig(addRowResult.tr, layerInfo);
            } else {
              console.error("add row failed ", addRowResult);
            }
          }));
        } else {
          alert("Handle no editable layers here.");
        }
      },

      _onEditFieldsClick: function (tr) {
        var rowData = this._layersTable.getRowData(tr);
        if (rowData && rowData.rdoLayer) {
          var editFields = new EditFields({
            nls: this.nls,
            _layerInfo: this._getRowConfig(tr)
          });
          editFields.popupEditPage();
        }
      },

      _initLocationOptions: function () {
        this.sourceList = new SimpleTable({
          autoHeight: false,
          selectable: true,
          fields: [{
            name: "name",
            title: this.nls.name,
            width: "auto",
            type: "text",
            editable: false
          }, {
            name: "actions",
            title: "",
            width: "70px",
            type: "actions",
            actions: ["up", "down", "delete"]
          }]
        }, this.sourceList);
        html.setStyle(this.sourceList.domNode, 'height', '100%');
        this.sourceList.startup();
        this.own(on(this.sourceList, 'row-select', lang.hitch(this, this._onSourceItemSelected)));
        this.own(on(this.sourceList, 'row-delete', lang.hitch(this, this._onSourceItemRemoved)));

        this.showInfoWindowOnSelect = new CheckBox({
          checked: true,
          label: this.nls.showInfoWindowOnSelect
        }, this.showInfoWindowOnSelect);
      },

      _createNewLocatorSourceSettingFromMenuItem: function (setting, definition) {
        var locatorSetting = new LocatorSourceSetting({
          nls: this.nls,
          map: this.map
        });
        locatorSetting.setDefinition(definition);
        locatorSetting.setConfig({
          url: setting.url || "",
          name: setting.name || "",
          singleLineFieldName: setting.singleLineFieldName || "",
          placeholder: setting.placeholder || "",
          countryCode: setting.countryCode || "",
          zoomScale: setting.zoomScale || 50000,
          maxSuggestions: setting.maxSuggestions || 6,
          maxResults: setting.maxResults || 6,
          searchInCurrentMapExtent: !!setting.searchInCurrentMapExtent,
          type: "locator"
        });
        locatorSetting._openLocatorChooser();

        locatorSetting.own(
          on(locatorSetting, 'select-locator-url-ok', lang.hitch(this, function (item) {
            var addResult = this.sourceList.addRow({
              name: item.name || "New Geocoder"
            }, this.sourceList.getRows().length);
            if (addResult && addResult.success) {
              if (this._currentSourceSetting) {
                this._closeSourceSetting();
              }
              locatorSetting.setRelatedTr(addResult.tr);
              locatorSetting.placeAt(this.sourceSettingNode);
              this.sourceList.selectRow(addResult.tr);

              this._currentSourceSetting = locatorSetting;
            }
          }))
        );
        locatorSetting.own(
          on(locatorSetting, 'reselect-locator-url-ok', lang.hitch(this, function (item) {
            var tr = this._currentSourceSetting.getRelatedTr();
            this.sourceList.editRow(tr, {
              name: item.name
            });
          }))
        );
        locatorSetting.own(
          on(locatorSetting, 'select-locator-url-cancel', lang.hitch(this, function () {
            if (this._currentSourceSetting !== locatorSetting) {// locator doesn't display in UI
              locatorSetting.destroy();
              locatorSetting = null;
            }
          }))
        );
      },

      onFieldClick: function (click) {
        console.log("on Field click");

        var layersTableData = this._layersTable.getData();
        var selected = null;

        console.log("length +++++++++++ " + layersTableData.length);

        //this can tell you what feature service is selected via the radio button

        var label = null;
        array.forEach(layersTableData, function (layerInfo, index) {

          if (layersTableData[index].rdoLayer == true) {

            console.log("____+_+" + layersTableData[index].rdoLayer, layersTableData[index].txtLayerLabel);
            selected = index;
            label = layersTableData[index].txtLayerLabel;

          }
          //need to:
          //1) populate the drop down fields according to the feature service that is selected
          //2) set the config to reflect the feature service

        });

        var count = 0;
        var latNode = document.getElementById('selectLatitude');
        var longNode = document.getElementById('selectLongitude');

        latNode.innerHTML = "";
        longNode.innerHTML = "";

        // var info = this._jimuLayerInfos.getLayerInfoArray()[selected];


        this._jimuLayerInfos.traversalLayerInfosOfWebmap(function (layerInfo) {
          layerInfo.getLayerObject().then(function (lo) {

            if (label == layerInfo.title) {
              console.log("++++ " + layerInfo.id, layerInfo.title);

              if (lo.fields) {

                array.forEach(lo.fields, function (field) {
                  console.log("fields Names " + field.name);

                  var option = document.createElement('option');
                  option.text = field.name;
                  option.value = count;
                  latNode.add(option);

                  var longOption = document.createElement('option');
                  longOption.text = field.name;
                  longOption.value = count;
                  longNode.add(longOption);
                  count++;
                });

              }
            }
          })

        });


        console.log("fields button press " + this._jimuLayerInfos);
        this._featureService = this._jimuLayerInfos.getLayerInfoArray()[selected].getUrl();
        this.layerForFields = this._jimuLayerInfos.getLayerInfoArray()[selected];
        selected = null;
        console.log(this._featureService, this.layerForFields);

        this.getConfig();

        //this.setConfig();

      },

      setConfig: function (config) {
        this.config = config;
        var sources = config.sources;
        array.forEach(sources, lang.hitch(this, function (source, index) {
          var addResult = this.sourceList.addRow({
            name: source.name || ""
          });

          if (addResult && addResult.success) {
            this._setRowConfig(addResult.tr, source);

            if (index === 0) {
              var firstTr = addResult.tr;
              setTimeout(lang.hitch(this, function () {
                this.sourceList.selectRow(addResult.tr);
                firstTr = null;
              }), 100);
            }
          } else {
            console.error("add row failed ", addResult);
          }
        }));
      },

      _getEditableLayerInfos: function () {
        var editableLayerInfos = [];
        for (var i = this.map.graphicsLayerIds.length - 1; i >= 0; i--) {
          var layerObject = this.map.getLayer(this.map.graphicsLayerIds[i]);
          if (layerObject.type === "Feature Layer" &&
              layerObject.url &&
              layerObject.isEditable &&
              layerObject.isEditable()) {
            var layerInfo = this._getLayerInfoFromConfiguration(layerObject);
            if (!layerInfo) {
              layerInfo = this._getDefaultLayerInfo(layerObject);
            }
            editableLayerInfos.push(layerInfo);
          }
        }
        return editableLayerInfos;
      },

      _getLayerInfoFromConfiguration: function (layerObject) {
        var layerInfo = null;
        var layerInfos = this.config.layerInfos;
        if (layerInfos && layerInfos.length > 0) {
          for (var i = 0; i < layerInfos.length; i++) {
            if (layerInfos[i].featureLayer &&
               layerInfos[i].featureLayer.id === layerObject.id) {
              layerInfo = layerInfos[i];
              break;
            }
          }

          if (layerInfo) {
            // update fieldInfos.
            layerInfo.fieldInfos = this._getSimpleFieldInfos(layerObject, layerInfo);
            // set _editFlag to true
            layerInfo._editFlag = true;

          }
        }
        return layerInfo;
      },

      _getDefaultLayerInfo: function (layerObject) {
        var layerInfo = {
          'featureLayer': {
            'id': layerObject.id,
            'fields': layerObject.fields,
            'title': layerObject.name
          },
          'fieldInfos': this._getSimpleFieldInfos(layerObject),
          '_editFlag': this.config.layerInfos &&
                        this.config.layerInfos.length === 0 ? true : false
        };
        return layerInfo;
      },

      _getDefaultSimpleFieldInfos: function (layerObject) {
        var fieldInfos = [];
        for (var i = 0; i < layerObject.fields.length; i++) {
          if (layerObject.fields[i].editable ||
            layerObject.fields[i].name.toLowerCase() === "globalid" ||
            //layerObject.fields[i].name.toLowerCase() === "objectid" ||
            layerObject.fields[i].name === layerObject.objectIdField) {
            fieldInfos.push({
              fieldName: layerObject.fields[i].name,
              label: layerObject.fields[i].alias || layerObject.fields[i].name,
              isEditable: (layerObject.fields[i].name.toLowerCase() === "globalid" ||
                          //layerObject.fields[i].name.toLowerCase() === "objectid" ||
                          layerObject.fields[i].name === layerObject.objectIdField) &&
                          !layerObject.fields[i].editable ?
                          null :
                          true,
              visible: true
            });
          }
        }
        return fieldInfos;
      },

      _getWebmapSimpleFieldInfos: function (layerObject) {
        var webmapSimpleFieldInfos = [];
        var webmapFieldInfos =
          editUtils.getFieldInfosFromWebmap(layerObject.id, this._jimuLayerInfos);
        if (webmapFieldInfos) {
          array.forEach(webmapFieldInfos, function (webmapFieldInfo) {
            if (webmapFieldInfo.isEditableOnLayer !== undefined &&
              (webmapFieldInfo.isEditableOnLayer ||
              webmapFieldInfo.fieldName.toLowerCase() === "globalid" ||
              //webmapFieldInfo.fieldName.toLowerCase() === "objectid" ||
              webmapFieldInfo.fieldName === layerObject.objectIdField)) {
              webmapSimpleFieldInfos.push({
                fieldName: webmapFieldInfo.fieldName,
                label: webmapFieldInfo.label,
                isEditable: (webmapFieldInfo.fieldName.toLowerCase() === "globalid" ||
                            //webmapFieldInfo.fieldName.toLowerCase() === "objectid" ||
                            webmapFieldInfo.fieldName === layerObject.objectIdField) &&
                            !webmapFieldInfo.isEditable ?
                            null :
                            webmapFieldInfo.isEditable,
                visible: webmapFieldInfo.visible
              });
            }
          });
          if (webmapSimpleFieldInfos.length === 0) {
            webmapSimpleFieldInfos = null;
          }
        } else {
          webmapSimpleFieldInfos = null;
        }
        return webmapSimpleFieldInfos;
      },

      _getSimpleFieldInfos: function (layerObject, layerInfo) {
        var baseSimpleFieldInfos;
        var simpleFieldInfos = [];
        var defautlSimpleFieldInfos = this._getDefaultSimpleFieldInfos(layerObject);
        var webmapSimpleFieldInfos = this._getWebmapSimpleFieldInfos(layerObject);

        baseSimpleFieldInfos =
          webmapSimpleFieldInfos ? webmapSimpleFieldInfos : defautlSimpleFieldInfos;

        if (layerInfo && layerInfo.fieldInfos) {
          // Edit widget had been configured

          // keep order of config fieldInfos and add new fieldInfos at end.
          array.forEach(layerInfo.fieldInfos, function (configuredFieldInfo) {
            // Compatible with old version fieldInfo that does not defined
            // the visible attribute. Init visible according to webmap field infos.
            if (configuredFieldInfo.visible === undefined) {
              if (webmapSimpleFieldInfos) {
                for (var j = 0; j < webmapSimpleFieldInfos.length; j++) {
                  if (configuredFieldInfo.fieldName === webmapSimpleFieldInfos[j].fieldName) {
                    configuredFieldInfo.visible = webmapSimpleFieldInfos[j].visible ||
                                                  webmapSimpleFieldInfos[j].isEditable;
                  }
                }
                // if configuredFieldInfo.name is not matching any field of webmapSimpleFieldInfos,
                // this configured field will not display in field setting popup.
              } else {
                configuredFieldInfo.visible = true;
              }
            }

            // keep order.
            for (var i = 0; i < baseSimpleFieldInfos.length; i++) {
              if (configuredFieldInfo.fieldName === baseSimpleFieldInfos[i].fieldName) {
                simpleFieldInfos.push(configuredFieldInfo);
                baseSimpleFieldInfos[i]._exit = true;
                break;
              }
            }
          });
          // add new fieldInfos at end.
          array.forEach(baseSimpleFieldInfos, function (baseSimpleFieldInfo) {
            //      console.log("_getSimpleFieldInfos");
            if (!baseSimpleFieldInfo._exit) {
              simpleFieldInfos.push(baseSimpleFieldInfo);
            }
          });
        } else {
          simpleFieldInfos = baseSimpleFieldInfos;
        }
        return simpleFieldInfos;
      },

      getConfig: function () {
        if (this._currentSourceSetting) {
          this._closeSourceSetting();
        }
        var trs = this.sourceList.getRows();
        var sources = [];
        array.forEach(trs, lang.hitch(this, function (tr) {
          var source = this._getRowConfig(tr);
          delete source._definition;
          this._removeRowConfig(tr);
          sources.push(source);
        }));

        this.config.sources = sources;

        // get layerInfos config
        var checkedLayerInfos = [];
        trs = this._layersTable.getRows();
        array.forEach(trs, lang.hitch(this, function (tr) {
          var layerInfo = this._getRowConfig(tr);
          if (layerInfo._editFlag) {
            delete layerInfo._editFlag;
            checkedLayerInfos.push(layerInfo);
          }
        }));
        if (checkedLayerInfos.length === 0) {
          delete this.config.layerInfos;
        } else {
          this.config.layerInfos = checkedLayerInfos;
          this.config.selectedFeatureService = this._featureService;
        }
        return this.config;
      },

      _onAddClick: function (evt) {
        this._addNewLocator();
      },

      _addNewLocator: function () {
        this._createNewLocatorSourceSettingFromMenuItem({}, {});
      },

      _createNewLocatorSourceSettingFromMenuItem: function (setting, definition) {
        var locatorSetting = new LocatorSourceSetting({
          nls: this.nls,
          map: this.map
        });
        locatorSetting.setDefinition(definition);
        locatorSetting.setConfig({
          url: setting.url || "",
          name: setting.name || "",
          singleLineFieldName: setting.singleLineFieldName || "",
          placeholder: setting.placeholder || "",
          countryCode: setting.countryCode || "",
          zoomScale: setting.zoomScale || 50000,
          maxSuggestions: setting.maxSuggestions || 6,
          maxResults: setting.maxResults || 6,
          searchInCurrentMapExtent: !!setting.searchInCurrentMapExtent,
          type: "locator"
        });
        locatorSetting._openLocatorChooser();

        locatorSetting.own(
          on(locatorSetting, 'select-locator-url-ok', lang.hitch(this, function (item) {
            var addResult = this.sourceList.addRow({
              name: item.name || "New Geocoder"
            }, this.sourceList.getRows().length);
            if (addResult && addResult.success) {
              if (this._currentSourceSetting) {
                this._closeSourceSetting();
              }
              locatorSetting.setRelatedTr(addResult.tr);
              locatorSetting.placeAt(this.sourceSettingNode);
              this.sourceList.selectRow(addResult.tr);

              this._currentSourceSetting = locatorSetting;
            }
          }))
        );
        locatorSetting.own(
          on(locatorSetting, 'reselect-locator-url-ok', lang.hitch(this, function (item) {
            var tr = this._currentSourceSetting.getRelatedTr();
            this.sourceList.editRow(tr, {
              name: item.name
            });
          }))
        );
        locatorSetting.own(
          on(locatorSetting, 'select-locator-url-cancel', lang.hitch(this, function () {
            if (this._currentSourceSetting !== locatorSetting) {// locator doesn't display in UI
              locatorSetting.destroy();
              locatorSetting = null;
            }
          }))
        );
      },

      _createNewLocatorSourceSettingFromSourceList: function (setting, definition, relatedTr) {
        if (this._currentSourceSetting) {
          this._closeSourceSetting();
        }

        this._currentSourceSetting = new LocatorSourceSetting({
          nls: this.nls,
          map: this.map
        });
        this._currentSourceSetting.setDefinition(definition);
        this._currentSourceSetting.setConfig({
          url: setting.url || "",
          name: setting.name || "",
          singleLineFieldName: setting.singleLineFieldName || "",
          placeholder: setting.placeholder || "",
          countryCode: setting.countryCode || "",
          zoomScale: setting.zoomScale || 50000,
          maxSuggestions: setting.maxSuggestions || 6,
          maxResults: setting.maxResults || 6,
          searchInCurrentMapExtent: !!setting.searchInCurrentMapExtent,
          enableLocalSearch: !!setting.enableLocalSearch,
          localSearchMinScale: setting.localSearchMinScale,
          localSearchDistance: setting.localSearchDistance,
          type: "locator"
        });
        this._currentSourceSetting.setRelatedTr(relatedTr);
        this._currentSourceSetting.placeAt(this.sourceSettingNode);

        this._currentSourceSetting.own(
          on(this._currentSourceSetting,
            'reselect-locator-url-ok',
            lang.hitch(this, function (item) {
              var tr = this._currentSourceSetting.getRelatedTr();
              this.sourceList.editRow(tr, {
                name: item.name
              });
            }))
        );
      },

      _onSourceItemRemoved: function (tr) {
        if (!this._currentSourceSetting) {
          return;
        }

        var currentTr = this._currentSourceSetting.getRelatedTr();
        if (currentTr === tr) {
          this._currentSourceSetting.destroy();
          this._currentSourceSetting = null;
        }
      },

      _onSourceItemSelected: function (tr) {
        var config = this._getRowConfig(tr);
        var currentTr = this._currentSourceSetting && this._currentSourceSetting.tr;
        if (!config || tr === currentTr) {
          return;
        }

        // check fields
        if (this._currentSourceSetting && !this._currentSourceSetting.isValidConfig()) {
          this._currentSourceSetting.showValidationTip();
          this.sourceList.selectRow(currentTr);
          return;
        }

        this._createNewLocatorSourceSettingFromSourceList(config, config._definition || {}, tr);
      },

      _setRowConfig: function (tr, source) {
        query(tr).data('config', lang.clone(source));
      },

      _getRowConfig: function (tr) {
        return query(tr).data('config')[0];
      },

      _removeRowConfig: function (tr) {
        return query(tr).removeData('config');
      },

      _closeSourceSetting: function () {
        var tr = this._currentSourceSetting.getRelatedTr();
        var source = this._currentSourceSetting.getConfig();
        source._definition = this._currentSourceSetting.getDefinition();
        this._setRowConfig(tr, source);
        this.sourceList.editRow(tr, {
          name: source.name
        });
        this._currentSourceSetting.destroy();
      },

      _disableOk: function () {
        var s = query(".button-container")[0];
        var s2 = s.children[2];
        var s3 = s.children[3];
        domStyle.set(s2, "display", "none");
        domStyle.set(s3, "display", "inline-block");
      },

      _enableOk: function () {
        var s = query(".button-container")[0];
        var s2 = s.children[2];
        var s3 = s.children[3];
        domStyle.set(s2, "display", "inline-block");
        domStyle.set(s3, "display", "none");
      }
    });
  });
