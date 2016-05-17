define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',

    'jimu/BaseWidgetSetting',

    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/dom',
    'dojo/on',
    'dojo/_base/array',
    'dojo/dom-style',
    'dojo/dom-construct',
    'dojo/query',

    'dojo/ready',
    'dijit/registry',
    'dojo/store/Memory',
    'dijit/form/Select',
    'dijit/form/ValidationTextBox',
    'dijit/form/TextBox',

    'jimu/dijit/TabContainer3',
    'jimu/dijit/CheckBox',
    'jimu/dijit/SimpleTable',
    'jimu/portalUtils',
    'jimu/dijit/Message'
],
    function (
        declare,
        _WidgetsInTemplateMixin,

        BaseWidgetSetting,

        lang,
        html,
        dom,
        on,
        array,
        domStyle,
        domConstruct,
        query,

        ready,
        registry,
        Memory,
        Select,
        ValidationTextBox,
        TextBox,

        TabContainer3,
        CheckBox,
        Table,
        portalUtils,
        Message
    ) {
        return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
            //these two properties is defined in the BaseWidget
            baseClass: 'jimu-widget-cost-analysis-setting',

            flatTables: null,
            operLayers: null,

            selectLayer: null,
            tooltipDialog: null,

            projectLayerFields: null,
            featurelayers: [],
            indexLayer: -1,

            statFeatureLayer: [],
            statLayerFields: null,

            configStatisticsFields: null,


            controlsAddedToWidgetFrame: false,

            postCreate: function () {
                this.inherited(arguments);

                //Tab Iniliazation
                this._initializeTab();

                //Load Flat Tables
                this.loadFlatTables();

                //Load  Operational Layers
                this.loadOperationalLayers();

                //Create Project Layer Field Config Table
                this._addprojectLayerFieldConfigTableRow();


                //Statistics Type
                this.statisticsTypesPointGeometry = [{
                    value: 'AVG',
                    label: this.nls.avg
                }, {
                    value: 'COUNT',
                    label: this.nls.count
                }, {
                    value: 'MAX',
                    label: this.nls.max
                }, {
                    value: 'MIN',
                    label: this.nls.min
                }, {
                    value: 'SUM',
                    label: this.nls.sum
                }];

                this.statisticsTypesPolylineGeometry = [{
                    value: 'AVG',
                    label: this.nls.avg
                }, {
                    value: 'COUNT',
                    label: this.nls.count
                }, {
                    value: 'LENGTH',
                    label: this.nls.length
                }, {
                    value: 'MAX',
                    label: this.nls.max
                }, {
                    value: 'MIN',
                    label: this.nls.min
                }, {
                    value: 'SUM',
                    label: this.nls.sum
                }];

                this.statisticsTypesPolygonGeometry = [{
                    value: 'AREA',
                    label: this.nls.area
                }, {
                    value: 'AVG',
                    label: this.nls.avg
                }, {
                    value: 'COUNT',
                    label: this.nls.count
                }, {
                    value: 'LENGTH',
                    label: this.nls.length
                }, {
                    value: 'MAX',
                    label: this.nls.max
                }, {
                    value: 'MIN',
                    label: this.nls.min
                }, {
                    value: 'SUM',
                    label: this.nls.sum
                }];

                //Add Statistics Type
                this.own(on(this.btnAddStatistics, 'click', lang.hitch(this, this._addStatisticsFieldRow)));

                //delete Statistics Row
                this.own(on(this.statisticsSettingTable, 'row-delete', lang.hitch(this, function (tr) {
                    if (tr.select) {
                        tr.select.destroy();
                        delete tr.select;
                    }
                })));

                this.own(on(this.lookupTableChooser, 'change', lang.hitch(this, this.lookupTableChooserChange)));

                this.own(on(this.projectGroupCostingInfoChooser, 'change', lang.hitch(this, this.projectGroupCostingInfoChooserChange)));

                this.own(on(this.lengthUnitChooser, 'change', lang.hitch(this, this.lengthUnitChooserChange)));

                this.own(on(this.projectAreaChooser, 'change', lang.hitch(this, this.changeProjectAreaChooser)));

                //check user role
                this.checkUserRole();
            },

            //initialize general, editable layer and statistics tabs
            _initializeTab: function () {
                var generalSettingsTab = {
                    title: this.nls.generalSettings,
                    content: this.generalSettingsTabNode
                };

                var editableLayerSettingTab = {
                    title: this.nls.editableLayerSetting,
                    content: this.editableLayerSettingTabNode
                };

                var statisticsSettingTab = {
                    title: this.nls.statisticsSetting,
                    content: this.statisticsSettingTabNode
                };

                var tabs = [generalSettingsTab, editableLayerSettingTab, statisticsSettingTab];

                this.tab = new TabContainer3({
                    tabs: tabs
                });

                this.tab.placeAt(this.settingTabDiv);

                this.own(on(this.tab, 'tabChanged', lang.hitch(this, function (tabTitle) {
                    if (tabTitle === this.nls.statisticsSetting) {
                        //get layers name in statisticsSettingTable
                        this.getLayerInStatisticsSettingTable();

                        //delete statistics on uncheck layer in editable layer settings
                        this.deleteStatiscticsForNonEditableLayer();

                        //set statistics settings on edit setting flickering
                        this._setStatisticsSettingTableOnEditSettingFlicker();
                    }
                })));
            },


            //load Flat Tables
            loadFlatTables: function () {
                var tables = this.map.itemInfo.itemData.tables;
                this.flatTables = [];

                /*  if (tables && tables.length === 0) {
                        new Message({
                            message: this.nls.missingLayerInWebMap
                        });
                        return;
                    }*/

                array.forEach(tables, lang.hitch(this, function (table) {
                    this.flatTables.push({
                        label: table.title,
                        value: table.title,
                    });
                }));

            },

            //Load  Operational Layers
            loadOperationalLayers: function () {
                var layers = this.map.itemInfo.itemData.operationalLayers;
                this.operLayers = [];

                if (layers && layers.length === 0) {
                    new Message({
                        message: this.nls.missingLayerInWebMap
                    });
                    return;
                }

                array.forEach(layers, lang.hitch(this, function (layer) {
                    if (layer !== undefined && layer !== null) {
                        if (layer.layerObject !== undefined && layer.layerObject !== null) {
                            if (layer.layerObject.geometryType === "esriGeometryPolygon") {
                                this.operLayers.push({
                                    label: layer.title,
                                    value: layer.title,
                                });
                            }
                        }
                    }
                }));
            },

            _addprojectLayerFieldConfigTableRow: function () {
                var result;
                for (i = 0; i < 5; i++) {
                    result = this.projectLayerFieldConfigTable.addRow({});
                    if (result.success && result.tr) {
                        var tr = result.tr;

                        this._configField(tr);
                        this._layerField(tr);
                    }
                }
            },

            _configField: function (tr) {
                var td = query('.simple-table-cell', tr)[0];
                html.setStyle(td, "verticalAlign", "middle");
                var configFieldTextBox = new TextBox({
                    style: {
                        width: "100%",
                        height: "30px"
                    }
                });

                configFieldTextBox.placeAt(td);
                configFieldTextBox.startup();
                if (tr.rowIndex === 0) {
                    configFieldTextBox.textbox.value = 'ID';
                }
                if (tr.rowIndex === 1) {
                    configFieldTextBox.textbox.value = 'Name';
                }
                if (tr.rowIndex === 2) {
                    configFieldTextBox.textbox.value = 'Description';
                }
                if (tr.rowIndex === 3) {
                    configFieldTextBox.textbox.value = 'Total Cost';
                }
                if (tr.rowIndex === 4) {
                    configFieldTextBox.textbox.value = 'Gross Cost';
                }

                configFieldTextBox.textbox.disabled = 'true';
                tr.labelText = configFieldTextBox;
            },

            _layerField: function (tr) {
                // var typeOptions = lang.clone(this.projectLayerFields);
                var td = query('.simple-table-cell', tr)[1];
                if (td) {
                    html.setStyle(td, "verticalAlign", "middle");
                    var types = new Select({
                        style: {
                            width: "100%",
                            height: "30px"
                        },
                        //options: typeOptions
                    });
                    types.placeAt(td);
                    types.startup();
                    tr.selectTypes = types;
                }
            },

            _showHideProjectLayerFieldConfigTable: function () {

                if (this.configureFields.checked) {
                    dom.byId(fieldConfig).style.display = '';
                } else {
                    dom.byId(fieldConfig).style.display = 'none';
                }
            },

            //disable delete project button when user is not admin
            //return nothing
            checkUserRole: function () {
                var portal = portalUtils.getPortal(this.appConfig.portalUrl);

                portal.loadSelfInfo().then(lang.hitch(this, function (portalSelf) {
                    if ((portalSelf.user.role === 'org_admin') || (portalSelf.user.role === 'account_admin') || (portalSelf.user.role === 'org_publisher') || (portalSelf.user.role === 'account_publisher')) {
                        dijit.byId('roundCostChooser').set('disabled', false);
                    } else {
                        dijit.byId('roundCostChooser').set('disabled', true);
                    }

                }), lang.hitch(this, function (err) {
                    console.error(err);
                }));

            },

            startup: function () {
                this.inherited(arguments);

                this.featurelayers.length = 0;

                if (!this.config.editor) {
                    this.config.editor = {};
                }

                this.toolbarVisible.set('checked', this.config.editor.toolbarVisible);

                var fields = [{
                    name: 'edit',
                    title: this.nls.edit,
                    type: 'checkbox',
                    'class': 'editable'
                }, {
                    name: 'label',
                    title: this.nls.label,
                    type: 'text'
                }, {
                    name: 'select',
                    title: this.nls.select,
                    type: 'checkbox',
                    'class': 'editable'
                }];

                var args = {
                    fields: fields,
                    selectable: false
                };
                this.displayLayersTable = new Table(args);
                this.displayLayersTable.placeAt(this.tableLayerInfos);
                this.displayLayersTable.startup();

                /*load lookup table, Project Group Costing table, Project Multiplier Additional Table,
                Costing Geometry Table and Project Cost table*/
                this.selectLookupLayer();
                this.selectProjectGroupCostingInfoLayer();
                this.selectProjectMultiplierAdditionalCostLayer();
                this.selectCostingGeometryLayer();
                this.selectProjectLayer();

                this.own(on(this.costingGeometryLayerChooser, 'change', lang.hitch(this, this.costingGeometryLayerChooserChange)));

                this.own(on(this.projectLayerChooser, 'change', lang.hitch(this, this.projectLayerChooserChange)));

                //get layers name in statisticsSettingTable
                this.getLayerInStatisticsSettingTable();

                this._setStatisticsSettingTable();

                this.setConfig(this.config);

                //add Error Button
                try {
                    var btnBar =
                        (this.domNode.parentNode.parentNode.parentNode.parentNode.lastChild.lastChild);

                    this.btnErrorMsg = domConstruct.toDom("<div class='settings-error hide'></div>");
                    domConstruct.place(this.btnErrorMsg, btnBar, "after");
                    html.addClass(this.settingsPageSaveError, 'hide');

                    this.controlsAddedToWidgetFrame = true;

                } catch (err) {
                    console.log(err.message);
                }
            },

            //Get Lookup Table
            selectLookupLayer: function () {
                var lookupTable = this.flatTables;

                if (lookupTable !== undefined) {
                    ready(function () {

                        var data = {
                            identifier: 'value',
                            items: [],
                            label: 'lookupTableName'
                        };

                        for (var i = 0; i < lookupTable.length; i++) {
                            data.items.push(lang.mixin({
                                "lookupTableName": lookupTable[i].value
                            }, {
                                "value": lookupTable[i].value
                            }));
                        }

                        var lookupStore = new Memory({
                            data: data,
                            idProperty: "value"
                        });

                        dijit.byId("lookupTableChooser").set("labelAttr", "value");
                        dijit.byId("lookupTableChooser").set("store", lookupStore);
                    });
                }
            },

            //Get ProjectGroupCostingInfo Table
            selectProjectGroupCostingInfoLayer: function () {

                if (!this.config.projectGroupCostingInfoTableName) {
                    return;
                }

                var projectGroupCostingInfoTable = this.flatTables;

                var selectedLookupTable = dijit.byId('lookupTableChooser').getValue();

                if (projectGroupCostingInfoTable !== undefined) {

                    ready(function () {

                        var data = {
                            identifier: 'value',
                            items: [],
                            label: 'projectGroupCostingInfoTableName'
                        };

                        for (var i = 0; i < projectGroupCostingInfoTable.length; i++) {
                            if (projectGroupCostingInfoTable[i].value !== selectedLookupTable) {
                                data.items.push(lang.mixin({
                                    "projectGroupCostingInfoTableName": projectGroupCostingInfoTable[i].value
                                }, {
                                    "value": projectGroupCostingInfoTable[i].value
                                }));
                            }
                        }

                        var projectGroupCostingInfoStore = new Memory({
                            data: data,
                            idProperty: "value"
                        });

                        dijit.byId("projectGroupCostingInfoChooser").set("labelAttr", "value");
                        dijit.byId("projectGroupCostingInfoChooser").set("store", projectGroupCostingInfoStore);

                    });
                }

                dijit.byId("projectGroupCostingInfoChooser").set("value", this.config.projectGroupCostingInfoTableName);
            },

            //Get projectMultiplierAdditionalCost Table
            selectProjectMultiplierAdditionalCostLayer: function () {

                if (!this.config.projectMultiplierAdditionalCostTableName) {
                    return;
                }

                var projectMultiplierAdditionalCostTable = this.flatTables;

                var selectedLookupTable = dijit.byId('lookupTableChooser').getValue();
                var selectprojectGroupCostingInfoTable = dijit.byId('projectGroupCostingInfoChooser').getValue();

                if (projectMultiplierAdditionalCostTable !== undefined) {

                    ready(function () {

                        var data = {
                            identifier: 'value',
                            items: [],
                            label: 'projectMultiplierAdditionalCostTableName'
                        };

                        for (var i = 0; i < projectMultiplierAdditionalCostTable.length; i++) {
                            if (projectMultiplierAdditionalCostTable[i].value !== selectedLookupTable) {
                                if (projectMultiplierAdditionalCostTable[i].value !== selectprojectGroupCostingInfoTable) {
                                    data.items.push(lang.mixin({
                                        "projectMultiplierAdditionalCostTableName": projectMultiplierAdditionalCostTable[i].value
                                    }, {
                                        "value": projectMultiplierAdditionalCostTable[i].value
                                    }));
                                }
                            }
                        }

                        var projectMultiplierAdditionalCostStore = new Memory({
                            data: data,
                            idProperty: "value"
                        });

                        dijit.byId("projectMultiplierAdditionalCostTableChooser").set("labelAttr", "value");
                        dijit.byId("projectMultiplierAdditionalCostTableChooser").set("store", projectMultiplierAdditionalCostStore);
                    });
                }

                dijit.byId("projectMultiplierAdditionalCostTableChooser").set("value", this.config.projectMultiplierAdditionalCostTableName);

            },

            //Get Costing Geometry Table
            selectCostingGeometryLayer: function () {

                var costingGeometryLayer = this.operLayers;

                ready(function () {

                    var data = {
                        identifier: 'value',
                        items: [],
                        label: 'costingGeometryLayerTableName'
                    };

                    for (var i = 0; i < costingGeometryLayer.length; i++) {
                        data.items.push(lang.mixin({
                            "costingGeometryLayerTableName": costingGeometryLayer[i].value
                        }, {
                            "value": costingGeometryLayer[i].value
                        }));

                    }

                    var costingGeometryStore = new Memory({
                        data: data,
                        idProperty: "value"
                    });

                    dijit.byId("costingGeometryLayerChooser").set("labelAttr", "value");
                    dijit.byId("costingGeometryLayerChooser").set("store", costingGeometryStore);
                });
            },

            //Get Project Cost Table
            selectProjectLayer: function () {

                if (!this.config.projectCostLayerName) {
                    return;
                }

                var projectFeatureLayer = this.operLayers;

                var selectedCostingGeometryFeatureLayer = dijit.byId('costingGeometryLayerChooser').getValue();

                ready(function () {

                    var data = {
                        identifier: 'value',
                        items: [],
                        label: 'projectLayerTableName'
                    };

                    for (var i = 0; i < projectFeatureLayer.length; i++) {
                        if (projectFeatureLayer[i].value !== selectedCostingGeometryFeatureLayer) {
                            data.items.push(lang.mixin({
                                "projectLayerTableName": projectFeatureLayer[i].value
                            }, {
                                "value": projectFeatureLayer[i].value
                            }));
                        }
                    }

                    var projectCostStore = new Memory({
                        data: data,
                        idProperty: "value"
                    });

                    dijit.byId("projectLayerChooser").set("labelAttr", "value");
                    dijit.byId("projectLayerChooser").set("store", projectCostStore);

                });
                if (this.config.projectCostLayerName !== dijit.byId("projectLayerChooser").value) {
                    dijit.byId("projectLayerChooser").attr("value", this.config.projectCostLayerName);
                }
            },

            //Get Project Cost Table Fields
            getProjectLayerFields: function () {

                var selectedProjectCostFeatureLayer = dijit.byId('projectLayerChooser').getValue();
                var pFeatureLayer = {};
                var opLayers = this.map.itemInfo.itemData.operationalLayers;


                array.some(opLayers, lang.hitch(this, function (opLayer) {
                    if (opLayer !== undefined && opLayer !== null) {
                        if (opLayer.layerObject !== undefined && opLayer.layerObject !== null) {
                            if (selectedProjectCostFeatureLayer === opLayer.title) {
                                pFeatureLayer = opLayer.layerObject;
                                return true;
                            }
                        }
                    }
                }));

                var fields = pFeatureLayer.fields;
                this.projectLayerFields = [];

                array.forEach(fields, lang.hitch(this, function (field) {
                    if (field.name !== pFeatureLayer.objectIdField) {
                        this.projectLayerFields.push({
                            label: field.alias,
                            value: field.name
                        });
                    }
                }));

                for (i = 0; i < this.projectLayerFieldConfigTable.tableInBodySection.rows.length; i++) {

                    this.projectLayerFieldConfigTable.tableInBodySection.rows[i].selectTypes.destroy();
                    this._layerField(this.projectLayerFieldConfigTable.tableInBodySection.rows[i]);
                    var fieldsOptions = [];
                    array.forEach(this.projectLayerFields, lang.hitch(this, function (prjfield) {
                        fieldsOptions.push({
                            label: prjfield.label,
                            value: prjfield.value
                        });
                    }));

                    this.projectLayerFieldConfigTable.tableInBodySection.rows[i].selectTypes.options = fieldsOptions;
                }

                this._setProjectLayerFieldConfigTable();
            },

            _setProjectLayerFieldConfigTable: function () {
                if (Object.keys(this.config.projectLayerConfigFields).length === 0) {
                    return;
                }

                var trs = this.projectLayerFieldConfigTable.getRows();

                trs[0].selectTypes.set("label", this.config.projectLayerConfigFields.fields[0].layerFieldAlias);
                trs[0].selectTypes.set("value", this.config.projectLayerConfigFields.fields[0].layerFieldName);

                trs[1].selectTypes.set("label", this.config.projectLayerConfigFields.fields[1].layerFieldAlias);
                trs[1].selectTypes.set("value", this.config.projectLayerConfigFields.fields[1].layerFieldName);

                trs[2].selectTypes.set("label", this.config.projectLayerConfigFields.fields[2].layerFieldAlias);
                trs[2].selectTypes.set("value", this.config.projectLayerConfigFields.fields[2].layerFieldName);

                trs[3].selectTypes.set("label", this.config.projectLayerConfigFields.fields[3].layerFieldAlias);
                trs[3].selectTypes.set("value", this.config.projectLayerConfigFields.fields[3].layerFieldName);

                trs[4].selectTypes.set("label", this.config.projectLayerConfigFields.fields[4].layerFieldAlias);
                trs[4].selectTypes.set("value", this.config.projectLayerConfigFields.fields[4].layerFieldName);
            },


            lookupTableChooserChange: function () {
                this.selectProjectGroupCostingInfoLayer();
            },

            projectGroupCostingInfoChooserChange: function () {
                this.selectProjectMultiplierAdditionalCostLayer();
            },

            costingGeometryLayerChooserChange: function () {
                this.selectProjectLayer();
            },

            projectLayerChooserChange: function () {
                this.getProjectLayerFields();
                this.displayLayersTable.clear();
                this.featurelayers.splice(0, this.featurelayers.length);
                this.initSelectLayer();
            },

            changeProjectAreaChooser: function () {
                if (this.projectAreaChooser.value === 'CONVEX_HULL') {
                    this.cHullBufferDistanceInput.set('value', '');
                    this.cHullBufferDistanceInput.set('disabled', true);

                } else {
                    this.cHullBufferDistanceInput.set('value', this.config.cHullBufferDistance);
                    this.cHullBufferDistanceInput.set('disabled', false);
                }
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

            //Add Statistics Type Field Row
            _addStatisticsFieldRow: function () {
                var result = this.statisticsSettingTable.addRow({});
                if (result.success && result.tr) {
                    var tr = result.tr;
                    tr.selectTypes = [];
                    this._addStatisticsLayerNames(tr);
                    this._addStatisticsTypes(tr);
                    //this.populateLayerFields(this.statFeatureLayer[0].value);
                    this._addStatisticsFields(tr);
                    this._addStatisticsLabel(tr);
                }
            },

            _addStatisticsLayerNames: function (tr) {
                var layerOptions = lang.clone(this.statFeatureLayer);
                var td = query('.simple-table-cell', tr)[0];
                if (td) {
                    html.setStyle(td, "verticalAlign", "middle");
                    var layerNames = new Select({
                        style: {
                            width: "100%",
                            height: "30px"
                        },
                        class: "smallSelect",
                        options: layerOptions
                    });
                    layerNames.placeAt(td);
                    layerNames.startup();
                    tr.selectTypes[0] = layerNames;

                    tr.selectTypes[0].on('change', lang.hitch(this, function (evt) {
                        //populate statistics type according to geometry
                        var statLayers = this.map.itemInfo.itemData.operationalLayers;
                        array.forEach(statLayers, lang.hitch(this, function (statLayer) {
                            if (statLayer !== undefined && statLayer !== null) {
                                if (statLayer.layerObject !== undefined && statLayer.layerObject !== null) {
                                    if (statLayer.title === tr.selectTypes[0].value) {
                                        if (statLayer.layerObject.geometryType === "esriGeometryPoint") {
                                            tr.selectTypes[1].destroy();
                                            this._addStatisticsTypes(tr);
                                        } else if (statLayer.layerObject.geometryType === "esriGeometryPolyline") {
                                            tr.selectTypes[1].destroy();
                                            this._addStatisticsTypes(tr);
                                        } else {
                                            tr.selectTypes[1].destroy();
                                            this._addStatisticsTypes(tr);
                                        }
                                    }
                                }
                            }
                        }));

                        //populate field Name
                        if (tr.selectTypes[1].value === 'AREA' || tr.selectTypes[1].value === 'COUNT' || tr.selectTypes[1].value === 'LENGTH') {
                            this.statLayerFields = [];
                            tr.selectTypes[2].destroy();
                            this._addStatisticsFields(tr);
                        } else {
                            this.populateLayerFields(evt);
                            tr.selectTypes[2].destroy();
                            this._addStatisticsFields(tr);
                        }

                    }));
                }
            },

            _addStatisticsTypes: function (tr) {

                var statTypeOptions;

                var statLayers = this.map.itemInfo.itemData.operationalLayers;
                array.forEach(statLayers, lang.hitch(this, function (statLayer) {
                    if (statLayer !== undefined && statLayer !== null) {
                        if (statLayer.layerObject !== undefined && statLayer.layerObject !== null) {

                            if (statLayer.title === tr.selectTypes[0].value) {
                                if (statLayer.layerObject.geometryType === "esriGeometryPoint") {
                                    statTypeOptions = lang.clone(this.statisticsTypesPointGeometry);
                                } else if (statLayer.layerObject.geometryType === "esriGeometryPolyline") {
                                    statTypeOptions = lang.clone(this.statisticsTypesPolylineGeometry);
                                } else {
                                    statTypeOptions = lang.clone(this.statisticsTypesPolygonGeometry);
                                }
                            }
                        }
                    }
                }));

                //var statTypeOptions = lang.clone(this.statisticsTypes);
                var td = query('.simple-table-cell', tr)[1];
                if (td) {
                    html.setStyle(td, "verticalAlign", "middle");
                    var statTypes = new Select({
                        style: {
                            width: "100%",
                            height: "30px"
                        },
                        class: "smallSelect",
                        options: statTypeOptions
                    });
                    statTypes.placeAt(td);
                    statTypes.startup();
                    tr.selectTypes[1] = statTypes;

                    if (tr.selectTypes[1].value === 'AREA' || tr.selectTypes[1].value === 'COUNT' || tr.selectTypes[1].value === 'LENGTH') {
                        this.statLayerFields = [];

                    } else {
                        this.populateLayerFields(tr.selectTypes[0].value);
                    }

                    tr.selectTypes[1].on('change', lang.hitch(this, function (evt) {
                        if (tr.selectTypes[1].value === 'AREA' || tr.selectTypes[1].value === 'COUNT' || tr.selectTypes[1].value === 'LENGTH') {
                            this.statLayerFields = [];
                            tr.selectTypes[2].destroy();
                            this._addStatisticsFields(tr);
                        } else {
                            this.populateLayerFields(tr.selectTypes[0].value);
                            tr.selectTypes[2].destroy();
                            this._addStatisticsFields(tr);
                        }
                    }));
                }
            },

            _addStatisticsFields: function (tr) {
                var fieldsOptions = lang.clone(this.statLayerFields);
                var td = query('.simple-table-cell', tr)[2];
                if (td) {
                    html.setStyle(td, "verticalAlign", "middle");
                    var fields = new Select({
                        style: {
                            width: "100%",
                            height: "30px"
                        },
                        class: "smallSelect",
                        options: fieldsOptions
                    });
                    fields.placeAt(td);
                    fields.startup();
                    tr.selectTypes[2] = fields;

                    if (tr.selectTypes[1].value === 'AREA' || tr.selectTypes[1].value === 'COUNT' || tr.selectTypes[1].value === 'LENGTH') {
                        tr.selectTypes[2].disabled = true;
                    } else {
                        tr.selectTypes[2].disabled = false;
                    }
                }
            },

            _addStatisticsLabel: function (tr) {
                var td = query('.simple-table-cell', tr)[3];
                html.setStyle(td, "verticalAlign", "middle");
                var statLabelTextBox = new ValidationTextBox({
                    style: {
                        width: "100%",
                        height: "30px"
                    }
                });
                statLabelTextBox.placeAt(td);
                statLabelTextBox.startup();
                tr.labelText = statLabelTextBox;
            },

            getLayerInStatisticsSettingTable: function () {

                var costingGeometryFeatureLayerName;
                var projectCostFeatureLayerName;

                if (this.config.costingGeometryLayerName) {
                    costingGeometryFeatureLayerName = this.config.costingGeometryLayerName;
                } else {
                    costingGeometryFeatureLayerName = dijit.byId('costingGeometryLayerChooser').getValue();
                }

                if (this.config.projectCostLayerName) {
                    projectCostFeatureLayerName = this.config.projectCostLayerName;
                } else {
                    projectCostFeatureLayerName = dijit.byId('projectLayerChooser').getValue();
                }

                var statLayers = this.map.itemInfo.itemData.operationalLayers;
                var editableLayers = (this.displayLayersTable.getData().length === 0 ? this.config.editor.layerInfos : this.displayLayersTable.getData());

                this.statFeatureLayer = [];

                /*  if (statLayers && statLayers.length === 0) {
      new Message({
          message: this.nls.missingLayerInWebMap
      });
      return;
  }*/

                array.forEach(statLayers, lang.hitch(this, function (statLayer) {
                    if (statLayer !== undefined && statLayer !== null) {
                        if (statLayer.layerObject !== undefined && statLayer.layerObject !== null) {
                            if (costingGeometryFeatureLayerName !== statLayer.title) {
                                if (projectCostFeatureLayerName !== statLayer.title) {
                                    if (statLayer.layerObject.isEditable && statLayer.layerObject.isEditable()) {
                                        array.forEach(editableLayers, lang.hitch(this, function (editableLayer) {
                                            //displayLayersTable  length is 0
                                            if (editableLayer.editable) {
                                                if (editableLayer.featureLayer.title === statLayer.title) {
                                                    this.statFeatureLayer.push({
                                                        label: statLayer.title,
                                                        value: statLayer.title
                                                    });
                                                }
                                            }
                                            //displayLayersTable length is not 0
                                            if (editableLayer.edit) {
                                                if (editableLayer.label === statLayer.title) {
                                                    this.statFeatureLayer.push({
                                                        label: statLayer.title,
                                                        value: statLayer.title
                                                    });
                                                }
                                            }
                                        }));
                                    }
                                }
                            }
                        }
                    }
                }));

                if (this.statFeatureLayer !== undefined && this.statFeatureLayer !== null) {
                    if (this.statFeatureLayer.length > 0) {
                        var statLayerNames = this.statFeatureLayer[0].value;
                        this.populateLayerFields(statLayerNames);
                    }
                }
            },

            populateLayerFields: function (layerName) {
                var statLayers = this.map.itemInfo.itemData.operationalLayers;
                var selectedFeatureLayer = {};

                /* if (statLayers && statLayers.length === 0) {
     new Message({
         message: this.nls.missingLayerInWebMap
     });
     return;
 }*/

                array.some(statLayers, lang.hitch(this, function (statLayer) {
                    if (statLayer !== undefined && statLayer !== null) {
                        if (statLayer.layerObject !== undefined && statLayer.layerObject !== null) {
                            if (layerName === statLayer.title) {
                                this.selectedFeatureLayer = statLayer.layerObject;
                                return true;
                            }
                        }
                    }
                }));

                var fields = this.selectedFeatureLayer.fields;
                this.statLayerFields = [];

                array.forEach(fields, lang.hitch(this, function (field) {
                    if (field.name !== this.selectedFeatureLayer.objectIdField) {
                        if (field.type === "esriFieldTypeInteger" || field.type === "esriFieldTypeDouble") {
                            this.statLayerFields.push({
                                label: field.alias,
                                value: field.name
                            });
                        }
                    }
                }));

            },

            //set statistics setting
            _setStatisticsSettingTable: function () {
                if (!this.config.statisticsLayer) {
                    return;
                }

                array.forEach(this.config.statisticsLayer.fields, lang.hitch(this, function (field) {
                    this._populateStatisticsSettingTableRow(field);
                }));
            },

            _populateStatisticsSettingTableRow: function (fieldInfo) {
                var result = this.statisticsSettingTable.addRow({});
                if (result.success && result.tr) {
                    var tr = result.tr;
                    tr.selectTypes = [];

                    this._addStatisticsLayerNames(tr);
                    tr.selectTypes[0].set("value", fieldInfo.layer, false);

                    this._addStatisticsTypes(tr);
                    tr.selectTypes[1].set("value", fieldInfo.type, false);

                    this.populateLayerFields(tr.selectTypes[0].value);
                    if (fieldInfo.field === "") {
                        this.statLayerFields = [];
                    }

                    this._addStatisticsFields(tr);
                    tr.selectTypes[2].set("value", fieldInfo.field, true);

                    this._addStatisticsLabel(tr);
                    tr.labelText.set("value", fieldInfo.label);
                }
            },

            //delete statistics on uncheck layer in editable layer settings
            deleteStatiscticsForNonEditableLayer: function () {
                var statisticsRows = this.statisticsSettingTable.getRows();
                var editableLayers = this.displayLayersTable.getData();
                array.forEach(statisticsRows, lang.hitch(this, function (tr) {
                    array.forEach(editableLayers, lang.hitch(this, function (editableLayer) {
                        if ((!editableLayer.edit) && (editableLayer.label === tr.selectTypes[0].value)) {
                            this.statisticsSettingTable.deleteRow(tr);
                        }
                    }));
                }));
            },

            //set statistics settings on edit setting flickering
            _setStatisticsSettingTableOnEditSettingFlicker: function () {

                var statisticsTrs = this.statisticsSettingTable.getRows();

                var statisticsLayer = [];

                array.forEach(statisticsTrs, lang.hitch(this, function (statTr) {
                    var selectLayers = statTr.selectTypes[0];
                    var selectTypes = statTr.selectTypes[1];
                    var selectFields = statTr.selectTypes[2];
                    var statLabels = statTr.labelText;

                    var field = {};

                    field = {
                        layerName: selectLayers.value,
                        type: selectTypes.value,
                        field: selectFields.value,
                        label: statLabels.value
                    };
                    statisticsLayer.push(field);

                    this.statisticsSettingTable.deleteRow(statTr);
                }));

                array.forEach(statisticsLayer, lang.hitch(this, function (layer) {

                    var result = this.statisticsSettingTable.addRow({});
                    if (result.success && result.tr) {
                        var tr = result.tr;
                        tr.selectTypes = [];

                        this._addStatisticsLayerNames(tr);
                        tr.selectTypes[0].set("value", layer.layerName, false);

                        this._addStatisticsTypes(tr);
                        tr.selectTypes[1].set("value", layer.type, false);

                        this.populateLayerFields(tr.selectTypes[0].value);
                        if (layer.field === "") {
                            this.statLayerFields = [];
                        }

                        this._addStatisticsFields(tr);
                        tr.selectTypes[2].set("value", layer.field, true);

                        this._addStatisticsLabel(tr);
                        tr.labelText.set("value", layer.label);
                    }
                }));


            },

            setConfig: function (config) {
                this.config = config;

                //lookupTableName
                if (config.lookupTableName) {
                    this.lookupTableChooser.set('value', config.lookupTableName);
                    this.lookupTableChooserChange();
                }

                //projectGroupCostingInfoTableName
                if (config.projectGroupCostingInfoTableName) {
                    this.projectGroupCostingInfoChooser.set('value', config.projectGroupCostingInfoTableName);
                    this.projectGroupCostingInfoChooserChange();
                }

                //ProjectMultiplierAdditionalCostTableName
                if (config.projectMultiplierAdditionalCostTableName) {
                    this.projectMultiplierAdditionalCostTableChooser.set('value', config.projectMultiplierAdditionalCostTableName);
                }

                //costingGeometryLayerName
                if (config.costingGeometryLayerName) {
                    this.costingGeometryLayerChooser.set('value', config.costingGeometryLayerName);
                    this.costingGeometryLayerChooserChange();
                }

                //projectCostLayerName
                if (config.projectCostLayerName) {
                    this.projectLayerChooser.set('value', config.projectCostLayerName);
                    this.projectLayerChooserChange();
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

                //Round Cost Type
                if (config.roundCostType) {
                    if (config.roundCostType.value) {
                        this.roundCostChooser.set('value', config.roundCostType.value);
                    }
                }

                //Project Area Type
                if (config.projectAreaType) {
                    if (config.projectAreaType.value) {
                        this.projectAreaChooser.set('value', config.projectAreaType.value);
                    }
                }

                //ConvexHullBufferDistance
                if (config.cHullBufferDistance) {
                    this.cHullBufferDistanceInput.set('value', config.cHullBufferDistance);
                }

                //Layer Info
                this.displayLayersTable.clear();
                this.featurelayers.length = 0;
                if (!config.editor.layerInfos) {
                    config.editor.layerInfos = [];
                }
                if (!this.config.mapFeatureLayers) {
                    this.config.mapFeatureLayers = [];
                }
                if (config.editor.layerInfos) {
                    this.initSelectLayer();
                }
            },

            initSelectLayer: function () {
                var count = 0;
                var label = "";
                var len = this.map.graphicsLayerIds.length;
                var has = false;
                var edit = false;
                var select = false;

                var selectedCostingGeometryFeatureLayer = dijit.byId('costingGeometryLayerChooser').getValue();
                var selectedProjectLayer = dijit.byId('projectLayerChooser').getValue();

                var editableLayers = array.map(this.config.editor.layerInfos, function (layerinfo) {
                    return layerinfo.featureLayer.url;
                });

                for (var i = len - 1; i >= 0; i--) {
                    var layer = this.map.getLayer(this.map.graphicsLayerIds[i]);
                    if (layer.type === "Feature Layer" && layer.url) {
                        if (layer.isEditable()) {
                            edit = true;
                        } else {
                            edit = false;
                        }
                        has = true;

                        label = this.getOperationalLayerTitle(layer);

                        if (this.projectLayerChooser.store !== null) {
                            array.forEach(this.projectLayerChooser.store.data, lang.hitch(this, function (projectLayer) {
                                if (projectLayer.value !== selectedProjectLayer) {
                                    if (label === projectLayer.value) {
                                        editableLayers.push(layer.url);
                                    }
                                }
                            }));
                        }
                        select = this._isSelectable(label);
                        if (editableLayers.length > 0 && editableLayers.indexOf(layer.url) === -1) {
                            edit = false;
                        }


                        if (label !== selectedProjectLayer) {
                            if (label !== selectedCostingGeometryFeatureLayer) {
                                if (this.config.mapFeatureLayers !== null && this.config.mapFeatureLayers !== undefined) {
                                    for (var k = 0; k < this.config.mapFeatureLayers.length; k++) {
                                        if (label === this.config.mapFeatureLayers[k].featureLayer.title) {
                                            select = this.config.mapFeatureLayers[k].select;
                                            break;
                                        }
                                    }
                                }

                                this.featurelayers.push({
                                    label: label,
                                    layer: layer,
                                    edit: edit,
                                    select: select
                                });

                                var row = this.displayLayersTable.addRow({
                                    label: label,
                                    edit: edit,
                                    select: select
                                });

                                if (!layer.isEditable()) {
                                    var cbxDom = query('.jimu-checkbox', row.tr)[0];
                                    var cbxDijit = registry.byNode(cbxDom);
                                    cbxDijit.setStatus(false);
                                }
                            }
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

            //check layer is selectable or not
            _isSelectable: function (layerTitle) {
                for (var i = 0; i < this.config.editor.layerInfos.length; i++) {
                    if (this.config.editor.layerInfos[i].featureLayer.title === layerTitle) {
                        return this.config.editor.layerInfos[i].selectable;
                    }
                }
                return true;
            },

            getOperationalLayerTitle: function (layer) {
                var title = "";
                if (this.map && this.map.itemInfo.itemData.operationalLayers) {
                    var len = this.map.itemInfo.itemData.operationalLayers.length;
                    for (var i = 0; i < len; i++) {
                        if (this.map.itemInfo.itemData.operationalLayers[i].url.toLowerCase() === layer.url.toLowerCase()) {
                            title = this.map.itemInfo.itemData.operationalLayers[i].title;
                            break;
                        }
                    }
                }
                if (!title) {
                    title = layer.name;
                }
                return title;
            },


            getConfig: function () {

                //lookupTableName
                if (this.config.lookupTableName === '') {
                    this.showOKError();
                    return false;
                } else {
                    this.config.lookupTableName = this.lookupTableChooser.value;
                }

                //projectGroupCostingInfoTableName
                if (this.config.projectGroupCostingInfoTableName === '') {
                    this.showOKError();
                    return false;
                } else {
                    this.config.projectGroupCostingInfoTableName = this.projectGroupCostingInfoChooser.value;
                }

                //projectMultiplierAdditionalCostTableName
                if (this.config.projectMultiplierAdditionalCostTableName === '') {
                    this.showOKError();
                    return false;
                } else {
                    this.config.projectMultiplierAdditionalCostTableName = this.projectMultiplierAdditionalCostTableChooser.value;
                }

                //costingGeometryLayer
                if (this.config.costingGeometryLayerName === '') {
                    this.showOKError();
                    return false;
                } else {

                    this.config.costingGeometryLayerName = this.costingGeometryLayerChooser.value;
                }

                //projectLayerName
                if (this.config.projectCostLayerName === '') {
                    this.showOKError();
                    return false;
                } else {

                    this.config.projectCostLayerName = this.projectLayerChooser.value;
                }
                //length
                if (!this.config.lengthUnit) {
                    this.config.lengthUnit = {};
                }

                this.config.lengthUnit.label = this.getLabelforValue(this.config.lengthUnit.value, this.lengthUnitChooser);
                this.config.lengthUnit.value = this.lengthUnitChooser.value;

                //area and length
                if (!this.config.areaAndLengthUnit) {
                    this.config.areaAndLengthUnit = {};
                }

                this.config.areaAndLengthUnit.label = this.getLabelforValue(this.config.areaAndLengthUnit.value, this.areaAndLengthUnitChooser);
                this.config.areaAndLengthUnit.value = this.areaAndLengthUnitChooser.value;

                //currency
                if ((this.config.currencyUnit === undefined) || (this.config.currencyUnit === '')) {
                    this.showOKError();
                    return false;
                } else {
                    this.config.currencyUnit = this.currencyUnitInput.value.trim();
                }

                //Round Cost Type
                if (!this.config.roundCostType) {
                    this.config.roundCostType = {};
                }

                this.config.roundCostType.label = this.getLabelforValue(this.config.roundCostType.value, this.roundCostChooser);
                this.config.roundCostType.value = this.roundCostChooser.value;

                //Project Area Type
                if (!this.config.projectAreaType) {
                    this.config.projectAreaType = {};
                }

                this.config.projectAreaType.label = this.getLabelforValue(this.config.projectAreaType.value, this.projectAreaChooser);
                this.config.projectAreaType.value = this.projectAreaChooser.value;

                //Convex Hull Buffer Distance
                if ((this.config.cHullBufferDistance === undefined) || (this.config.cHullBufferDistance === '')) {
                    this.showOKError();
                    return false;
                } else {
                    this.config.cHullBufferDistance = this.cHullBufferDistanceInput.value ? this.cHullBufferDistanceInput.value : 0;
                }

                //get config from editableLayerSettingTab
                this.config.editor.toolbarVisible = this.toolbarVisible.checked;

                var updateLayers = [];

                if (this.displayLayersTable !== null) {

                    array.forEach(this.displayLayersTable.getRows(), function (row) {
                        var rowData = this.displayLayersTable.getRowData(row);

                        updateLayers.push({
                            "name": rowData.label
                        });

                    }, this);
                }

                if (updateLayers) {
                    if (updateLayers.length === 0) {
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

                this.config.mapFeatureLayers = [];

                for (var i = 0; i < len; i++) {
                    var json = {};
                    if (data[i].edit) {

                        json.editable = data[i].edit;
                        json.selectable = data[i].select;
                        json.featureLayer = {};
                        json.featureLayer.url = this.featurelayers[i].layer.url;
                        json.featureLayer.title = this.featurelayers[i].label;
                        json.featureLayer.id = this.featurelayers[i].layer.id;

                        this.config.editor.layerInfos.push(json);
                    } else {
                        json.select = data[i].select;

                        json.featureLayer = {};
                        json.featureLayer.url = this.featurelayers[i].layer.url;
                        json.featureLayer.title = this.featurelayers[i].label;
                        json.featureLayer.id = this.featurelayers[i].layer.id;

                        this.config.mapFeatureLayers.push(json);
                    }
                }

                //get config from statisticsSettingTab
                var statisticsLayer = {};
                var statisticsTrs = this.statisticsSettingTable.getRows();
                var flds = [];

                array.forEach(statisticsTrs, lang.hitch(this, function (statTr) {
                    var selectLayers = statTr.selectTypes[0];
                    var selectTypes = statTr.selectTypes[1];
                    var selectFields = statTr.selectTypes[2];
                    var statLabels = statTr.labelText;

                    var editableLayers = this.displayLayersTable.getData();
                    var field = {};

                    array.forEach(editableLayers, lang.hitch(this, function (editableLayer) {
                        if ((editableLayer.edit) && (editableLayer.label === selectLayers.value)) {
                            field = {
                                layer: selectLayers.value,
                                type: selectTypes.value,
                                field: selectFields.value,
                                label: statLabels.value
                            };
                            flds.push(field);
                        }
                    }));

                }));

                lang.mixin(statisticsLayer, {
                    fields: flds
                });
                this.config.statisticsLayer = statisticsLayer;


                //get Project Layer Config Fields
                var projectLayerConfigFields = {};
                var projectLayerConfigFieldsTrs = this.projectLayerFieldConfigTable.getRows();
                var ConfigFields = [];

                array.forEach(projectLayerConfigFieldsTrs, lang.hitch(this, function (plcfTr) {
                    var selectConfigFields = plcfTr.textContent;
                    var field = {
                        fieldDescription: plcfTr.labelText.textbox.value,
                        layerFieldAlias: selectConfigFields,
                        layerFieldName: plcfTr.selectTypes.value
                    };
                    ConfigFields.push(field);
                }));

                lang.mixin(projectLayerConfigFields, {
                    fields: ConfigFields
                });
                this.config.projectLayerConfigFields = projectLayerConfigFields;

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

            //hide error message
            hideOkError: function () {
                if (this.controlsAddedToWidgetFrame) {
                    html.addClass(this.btnErrorMsg, 'hide');
                } else {
                    domStyle.set(this.settingsPageSaveError, 'display', 'none');
                }
            },

            //show error message
            showOKError: function () {
                if (this.controlsAddedToWidgetFrame) {
                    this.btnErrorMsg.innerHTML = this.nls.errorOnOk;
                    html.removeClass(this.btnErrorMsg, 'hide');
                }
            }
        });
    });