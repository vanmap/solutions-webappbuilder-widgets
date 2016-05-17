define([
	'dojo/_base/declare',
	'dojo/_base/kernel',
	'dojo/_base/lang',
	'dojo/_base/connect',
    'dojo/_base/Deferred',
	'dojo/i18n!esri/nls/jsapi',
	'dojo/_base/html',
	'dojo/keys',
	'dojo/on',
	'dojo/query',
	'dojo/dom',
	'dojo/dom-class',
	'dojo/dom-construct',

	'dojo/_base/array',
	'dojo/string',
    'dojo/promise/all',

	'dijit/_WidgetsInTemplateMixin',

	'jimu/BaseWidget',
	'jimu/dijit/ViewStack',
	'jimu/utils',
	'jimu/dijit/SimpleTable',
    'jimu/dijit/DrawBox',
    'jimu/portalUtils',
    'jimu/dijit/Popup',
    'jimu/dijit/Message',

	'esri/dijit/editing/Editor',
	'esri/dijit/AttributeInspector',

	'esri/geometry/Point',
	'esri/layers/FeatureLayer',

	'esri/symbols/SimpleMarkerSymbol',
	'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',

	'esri/Color',
	'esri/graphic',

	'esri/tasks/QueryTask',
	'esri/tasks/query',
	'esri/tasks/GeometryService',
	'esri/tasks/BufferParameters',
	'esri/geometry/geometryEngine',
    'esri/geometry/Polygon',

	'dojox/grid/DataGrid',
	'dojox/grid/cells',
	'dojox/grid/cells/dijit',
    'dojox/grid/TreeGrid',
    'dojo/ready',
	'dojo/store/Memory',
	'dojo/data/ObjectStore',
    'dojo/data/ItemFileWriteStore',
	'dojo/date/locale',
	'dojo/currency',

    'dijit/registry',
    'dijit/form/TextBox',
	'dijit/form/CurrencyTextBox',
	'dijit/form/NumberTextBox',
	'dijit/form/ValidationTextBox',
    'dijit/form/DateTextBox',
	'dijit/form/Select',
    'dijit/form/FilteringSelect',
	'dijit/TooltipDialog',
	'dijit/Dialog',
    'dijit/ConfirmDialog',
	'dijit/popup',
	'dijit/form/Button',
    'dijit/ToolbarSeparator',
	'dijit/TitlePane',
    'dijit/tree/ForestStoreModel',

    './Common',
    './AssetDetail',
    './EquationType',
],
    function (
        declare,
        dojo,
        lang,
        connect,
        Deferred,
        esriBundle,
        html,
        keys,
        on,
        query,
        dom,
        domClass,
        domConstruct,

        array,
        string,
        all,

        _WidgetsInTemplateMixin,

        BaseWidget,
        ViewStack,
        utils,
        SimpleTable,
        DrawBox,
        portalUtils,
        Popup,
        Message,

        Editor,
        AttributeInspector,

        Point,
        FeatureLayer,

        SimpleMarkerSymbol,
        SimpleFillSymbol,
        SimpleLineSymbol,

        Color,
        Graphic,

        QueryTask,
        Query,
        GeometryService,
        BufferParameters,
        geometryEngine,
        Polygon,

        DataGrid,
        cells,
        cellsDijit,
        TreeGrid,
        ready,
        Memory,
        ObjectStore,
        ItemFileWriteStore,
        locale,
        currency,

        registry,
        TextBox,
        CurrencyTextBox,
        NumberTextBox,
        ValidationTextBox,
        DateTextBox,
        Select,
        FilteringSelect,
        TooltipDialog,
        Dialog,
        ConfirmDialog,
        popup,
        Button,
        ToolbarSeparator,
        TitlePane,
        ForestStoreModel,

        Common,
        AssetDetailInProject,
        EquationType
    ) {
        var SELECTIONMETHOD_VIEW = 0,
            MAINWIDGET_VIEW = 1,
            PROJECTMULTIPLIERADDITIONALCOST_VIEW = 2,
            LOADORPHANASSET_VIEW = 3,
            DETAILSTATISTICS_VIEW = 4,
            DETAILSASSETDESCRIPTION_VIEW = 5,
            EDITPROJECTATTRIBUTE_VIEW = 6,
            EDITCOSTEQUATION_VIEW = 7,
            ADDNEWSTATISTICS_VIEW = 8;

        return declare([BaseWidget, _WidgetsInTemplateMixin], {
            name: 'Cost Analysis',
            baseClass: 'jimu-widget-cost-analysis',

            editor: null,
            layers: null,

            currentStack: 0,

            assetValue: null,

            featureStorage: {},
            featureStorageCount: 0,

            //popup variable
            equationType: null,
            popup: null,
            setEquationTypeArray: [],
            lastUsedEquationType: null,

            //operational layer infos
            operLayerInfos: null,

            arcgisGeomtryService: null,

            //read config variables
            lookupTable: null,
            projectGroupCostingInfoTable: null,
            projectMultiplierAdditionalCostTableName: null,
            costingGeometryLayer: null,

            projectCostLayer: null,
            projectLayerConfigFields: null,
            projectIdFldName: null,
            projectNameFldName: null,
            projectDescriptionFldName: null,
            projectTotalCostFldName: null,
            projectGrossCostFldName: null,

            mapUnit: null,
            lengthUnit: null,
            areaLengthUnit: null,
            lengthUnitDescription: null,
            areaLengthUnitDescription: null,
            defaultCurrencyUnit: null,

            projectAreaType: null,
            roundCostType: null,
            convexHullBufferDistance: null,
            statisticsFields: null,
            mapFeatureLayers: [],

            //variable for asset grid
            assetTypeTemplate: null,
            assetInitialCostIDTemplate: null,
            assetFeatureClassTemplate: null,
            featureGeomtryTypeTemplate: null,
            assetMeasurementTemplate: null,
            prjGrpCostingInfoID: null,

            projectTables: null,
            projectGroupCostingInfoTableFeatureLayer: null,
            projectMultiplierAdditionalCostFeatureLayer: null,
            hideEvent: null,
            showEvent: null,

            isOpenCheck: false,
            isUpdateFromSavebtn: false,
            costEscalationType: null,

            projectGeometry: null,
            queryFeatures: null,
            isLoadProject: null,
            isLoadOrphanData: null,
            isLoadOrphanDataForPopUp: false,
            orphanAssetArray: [],
            orphanAssetArrayLength: 0,
            orphanAssetCounter: 0,

            projectDetail: null,

            geometryforOrphanData: null,

            editorSelection: null,

            grid: null,
            detailAssetDescriptionTreeGrid: null,

            layerCounter: 0,
            grpqueryStringArray: [],
            splittedFeatures: [],
            splitedFeatureLayerName: '',

            //geographicResults: null,

            geographyFeaturesOfAsset: [],

            orphanFeatureCount: 0,
            isMessagePopup: false,

            //statistics element textbox
            statElementTextbox: null,

            //add new statistics variable
            statLayerFields: null,
            newStatisticsFields: null,

            //edit project attrib element textbox
            editProjectAttribElementTextbox: null,
            editProjectAttribElementSelectBox: null,

            treeGridOpenState: null,
            attrInspector: null,

            selectionSymbolPoint: null,
            selectionSymbolLine: null,
            selectionSymbolPolygon: null,

            isProjectDeleted: false,

            postCreate: function () {

                this.inherited(arguments);

                //read configuration from setting
                this.readConfiguration();

                //create view stack for flip the page
                this.viewStack = new ViewStack({
                    viewType: 'dom',
                    views: [this.selectionMethodPanel, this.mainWidgetPanel, this.projectMultiplierAdditionalCostPanel, this.loadOrphanAssetPanel, this.detailStaticsticsPanel, this.detailAssetDescriptionPanel, this.editProjectAttributePanel, this.editCostEquationPanel, this.addNewStatisticsPanel]
                });

                html.place(this.viewStack.domNode, this.widgetContent);

                this._switchView(SELECTIONMETHOD_VIEW);

                //toggle TitlePan on click
                this.own(on(dijit.byId('createProjectTp'), 'click', lang.hitch(this, function () {
                    if (dijit.byId('createProjectTp').open) {
                        dijit.byId('loadProjectTp').set('open', false);
                    }
                })));

                this.own(on(dijit.byId('loadProjectTp'), 'click', lang.hitch(this, function () {
                    if (dijit.byId('loadProjectTp').open) {
                        dijit.byId('createProjectTp').set('open', false);
                    }
                })));

                this.own(on(this.selectEditCostEquationType, 'change', lang.hitch(this, this.costEquationChooserChange)));

                //check user role
                this.checkUserRole();

                //incorporate changed theme css
                this._setTheme();

                this.getLayerInfo();

                //get projectGroupCostingInfoTable fields
                this.getprojectGroupCostingInfoTablefield();

                //get ProjectMultiplierAdditionalCostTable fields
                this.getProjectMultiplierAdditionalCostTablefield();

                //load Asset Draw Box
                this._initAssetDrawBox();

                //multiplier and addition for Cost Escalation Field
                this.costEscalationType = [{
                    value: '*',
                    label: this.nls.multiplier
                }, {
                    value: '+',
                    label: this.nls.additional
                }];
            },

            //disable delete project button when user is not admin
            //return nothing
            checkUserRole: function () {
                var portal = portalUtils.getPortal(this.appConfig.portalUrl);
                portal.loadSelfInfo().then(lang.hitch(this, function (portalSelf) {
                    if ((portalSelf.user.role === 'org_admin') || (portalSelf.user.role === 'account_admin') || (portalSelf.user.role === 'org_publisher') || (portalSelf.user.role === 'account_publisher')) {
                        html.removeClass(this.deleteProjectButton, 'jimu-state-disabled');
                    } else {
                        html.addClass(this.deleteProjectButton, 'jimu-state-disabled');
                    }
                }), lang.hitch(this, function (err) {
                    console.error(err);
                }));
            },

            //set theme
            _setTheme: function () {
                if (this.appConfig.theme.name === "BillboardTheme") {
                    utils.loadStyleLink('billBoardOverrideCSS', this.folderUrl + "css/BillboardTheme/style.css", null);
                } else if (this.appConfig.theme.name === "BoxTheme") {
                    utils.loadStyleLink('boxOverrideCSS', this.folderUrl + "css/BoxTheme/style.css", null);
                } else if (this.appConfig.theme.name === "DartTheme") {
                    utils.loadStyleLink('dartOverrideCSS', this.folderUrl + "css/DartTheme/style.css", null);
                } else if (this.appConfig.theme.name === "JewelryBoxTheme") {
                    utils.loadStyleLink('JewelryBoxOverrideCSS', this.folderUrl + "css/JewelryBoxTheme/style.css", null);
                } else if (this.appConfig.theme.name === "LaunchpadTheme") {
                    utils.loadStyleLink('launchpadOverrideCSS', this.folderUrl + "css/LaunchpadTheme/style.css", null);
                } else if (this.appConfig.theme.name === "TabTheme") {
                    utils.loadStyleLink('tabOverrideCSS', this.folderUrl + "css/TabTheme/style.css", null);
                } else if (this.appConfig.theme.name === "FoldableTheme") {
                    utils.loadStyleLink('foldableOverrideCSS', this.folderUrl + "css/style.css", null);
                }
            },

            //get flat tables from map
            getLayerInfo: function () {
                this.projectTables = this.map.itemInfo.itemData.tables;
            },

            //get projectGroupCostingInfoTable fields
            getprojectGroupCostingInfoTablefield: function () {
                if (this.projectTables !== null) {
                    for (var i = 0; i < this.projectTables.length; i++) {
                        if (this.projectTables[i].title === this.projectGroupCostingInfoTable) {
                            this.projectGroupCostingInfoTableFeatureLayer = new FeatureLayer(this.projectTables[i].url, {
                                mode: FeatureLayer.MODE_SNAPSHOT,
                                outFields: ["*"]
                            });
                            break;
                        }
                    }
                }
            },

            //get projectMultiplierAdditionalCostTable fields
            getProjectMultiplierAdditionalCostTablefield: function () {
                if (this.projectTables !== null) {
                    for (var i = 0; i < this.projectTables.length; i++) {
                        if (this.projectTables[i].title === this.projectMultiplierAdditionalCostTableName) {
                            this.projectMultiplierAdditionalCostFeatureLayer = new FeatureLayer(this.projectTables[i].url, {
                                mode: FeatureLayer.MODE_SNAPSHOT,
                                outFields: ["*"]
                            });
                            break;
                        }
                    }
                }
            },

            onOpen: function () {
                switch (this.currentStack) {
                case SELECTIONMETHOD_VIEW:
                    this._getProjectsList();
                    break;
                case MAINWIDGET_VIEW:
                    this._openMainWidget();
                    break;
                case ADDNEWSTATISTICS_VIEW:
                    setTimeout(lang.hitch(this, this.resize), 100);
                    break;
                default:

                }
            },

            // Open main Widget
            _openMainWidget: function () {

                this.layers = [];

                this.disableWebMapPopup();

                this.layers = Common.getLayers(this.map, this.config.editor.layerInfos);

                this.initEditor();

                if (!this.isOpenCheck) {

                    this.assetValue = [];

                    this.bindLayerInFeatureStorage();

                    if (!this.grid) {

                        this.bindLayerEvents();

                        //get layer selection symbol
                        this._getLayerSelectionSymbol();

                        //set layer selection symbol
                        this._setLayerSelectionSymbol();

                        //create asset grid layout
                        this.createAssetGridLayout();
                    }

                    if (!this.detailAssetDescriptionTreeGrid) {
                        this.createDetailAssetDescriptionTreeGridLayout();
                        on(this.detailAssetDescriptionTreeGrid, 'CellClick', lang.hitch(this, this._switchToEditCostEquation));
                    }

                    //this.bindLayerEvents();

                    if (this.isLoadProject) {
                        this._getAssetGeometries();
                    } else {

                        this._hideProjectRelatedFeatures();
                    }
                }

                var selectionTool = dijit.byId(this.editor.drawingToolbar.containerNode.firstChild.id);
                on(selectionTool, 'click', lang.hitch(this, this._clearSelectedTemplate));

                var templatePicker = dijit.byId(this.editor.templatePicker.id);
                on(templatePicker, 'selection-change', lang.hitch(this, this._loadSelectedFeature));

                var drawTool = this.editor.drawingToolbar.drawToolbar;
                on(drawTool, 'draw-complete', lang.hitch(this, this.getSelectedFeatureFromAlltheLayer));

                //add seperator for clear all selection button
                this.editor.drawingToolbar.addChild(new ToolbarSeparator({}));

                //add clear all selection button
                this.editor.drawingToolbar.addChild(new Button({
                    iconClass: "clearAllSelectionBtn",
                    showLabel: false,
                    label: this.nls.clearAllSelection,
                    onClick: lang.hitch(this, this._clearSelect)
                }));

                //this._bindClearSelectionOnClickEvent();

                this.initGeometryService();

                this.bindEvents();

                this.disableMouseEvent();
            },

            /*_bindClearSelectionOnClickEvent: function () {

                var childNode = this.editor.drawingToolbar.containerNode.firstChild;
                for (var i = 1; i < this.editor.drawingToolbar.containerNode.childNodes.length; i++) {
                    var btnText = childNode.textContent;
                    if (btnText.indexOf("Clear selection") > -1) {
                        var clearSelection = childNode;
                        on(clearSelection, 'click', lang.hitch(this, this._clearSelect));
                        break;
                    } else {
                        childNode = childNode.nextElementSibling;
                    }
                }

            },*/

            _getLayerSelectionSymbol: function () {

                for (var i = 0; i < this.layers.length; i++) {
                    if (this.layers[i].featureLayer.geometryType === "esriGeometryPoint") {
                        if (this.selectionSymbolPoint !== null) {
                            this.selectionSymbolPoint = this.layers[i].featureLayer.getSelectionSymbol();
                        }
                    } else if (this.layers[i].featureLayer.geometryType === "esriGeometryPolyline") {
                        if (this.selectionSymbolLine !== null) {
                            this.selectionSymbolLine = this.layers[i].featureLayer.getSelectionSymbol();
                        }
                    } else if (this.layers[i].featureLayer.geometryType === "esriGeometryPolygon") {
                        if (this.selectionSymbolPolygon !== null) {
                            this.selectionSymbolPolygon = this.layers[i].featureLayer.getSelectionSymbol();
                        }
                    }
                }
                if (this.selectionSymbolPoint === null || this.selectionSymbolPoint === undefined) {

                    this.selectionSymbolPoint = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 10,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255]), 3));
                }
                if (this.selectionSymbolLine === null || this.selectionSymbolLine === undefined) {

                    this.selectionSymbolLine = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255]), 2);
                }
                if (this.selectionSymbolPolygon === null || this.selectionSymbolPolygon === undefined) {
                    //define a selection symbol
                    this.selectionSymbolPolygon = new SimpleFillSymbol().setColor(new Color([0, 255, 255]));
                    this.selectionSymbolPolygon.setOutline(new SimpleLineSymbol("solid", new Color([0, 0, 0]), 1));
                }
            },

            _setLayerSelectionSymbol: function () {
                for (var i = 0; i < this.layers.length; i++) {

                    if (this.layers[i].featureLayer.geometryType === "esriGeometryPoint") {
                        if (this.selectionSymbolPoint !== null) {

                            this.layers[i].featureLayer.setSelectionSymbol(this.selectionSymbolPoint);
                        }
                    } else if (this.layers[i].featureLayer.geometryType === "esriGeometryPolyline") {
                        if (this.selectionSymbolLine !== null) {

                            this.layers[i].featureLayer.setSelectionSymbol(this.selectionSymbolLine);
                        }
                    } else if (this.layers[i].featureLayer.geometryType === "esriGeometryPolygon") {
                        if (this.selectionSymbolPolygon !== null) {

                            this.layers[i].featureLayer.setSelectionSymbol(this.selectionSymbolPolygon);
                        }
                    }
                }
                if (this.selectionSymbolPoint === null || this.selectionSymbolPoint === undefined) {

                    this.selectionSymbolPoint = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 10,
                        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255]), 3));
                }
                if (this.selectionSymbolLine === null || this.selectionSymbolLine === undefined) {

                    this.selectionSymbolLine = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255]), 2);
                }
                if (this.selectionSymbolPolygon === null || this.selectionSymbolPolygon === undefined) {
                    //define a selection symbol
                    this.selectionSymbolPolygon = new SimpleFillSymbol().setColor(new Color([0, 255, 255]));
                    this.selectionSymbolPolygon.setOutline(new SimpleLineSymbol("solid", new Color([0, 0, 0]), 1));
                }

            },

            getSelectedFeatureFromAlltheLayer: function (evt) {

                var selectedTemplate = this.editor.templatePicker.getSelected();
                if (selectedTemplate === null) {
                    var selectQuery = new Query();
                    selectQuery.geometry = evt.geometry;
                    selectQuery.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
                    var ids = this.map.graphicsLayerIds;
                    var len = ids.length;

                    for (k = 0; k < this.mapFeatureLayers.length; k++) {
                        var mapLayer = Common.getLayerbyTitleFromMap(this.map, this.mapFeatureLayers[k].featureLayer.title)
                        if (this.mapFeatureLayers[k].select) {
                            if (mapLayer.getSelectionSymbol() === null || mapLayer.getSelectionSymbol() === undefined) {
                                if (mapLayer.geometryType === "esriGeometryPoint") {
                                    mapLayer.setSelectionSymbol(this.selectionSymbolPoint);
                                }
                                if (mapLayer.geometryType === "esriGeometryPolyline") {
                                    layer.setSelectionSymbol(this.selectionSymbolLine);
                                }
                                if (mapLayer.geometryType === "esriGeometryPolygon") {
                                    mapLayer.setSelectionSymbol(this.selectionSymbolPolygon);
                                }
                            }

                            if (this.editor.drawingToolbar.containerNode.childNodes[0].textContent.indexOf("New selection") === 0) {
                                mapLayer.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW);
                            } else if (this.editor.drawingToolbar.containerNode.childNodes[0].textContent.indexOf("Add to selection") === 0) {
                                mapLayer.selectFeatures(selectQuery, FeatureLayer.SELECTION_ADD);
                            } else if (this.editor.drawingToolbar.containerNode.childNodes[0].textContent.indexOf("Subtract from selection") === 0) {
                                mapLayer.selectFeatures(selectQuery, FeatureLayer.SELECTION_SUBTRACT);
                            }
                        }
                    }
                }
            },

            _loadSelectedFeature: function () {
                var selectedTemplate = this.editor.templatePicker.getSelected();
                if (selectedTemplate !== null) {
                    var selectedFeaturesCollection = this._getSelectedFeatures(selectedTemplate);
                    if (selectedFeaturesCollection.length > 0) {
                        this._openDialogBox(selectedTemplate, selectedFeaturesCollection);
                    }
                }
            },

            _openDialogBox: function (selectedTemplate, selectedFeaturesCollection) {

                var CopySelectFeatDialog = new ConfirmDialog({
                    title: this.nls.copySelectedFeatureTitle,
                    content: "",
                    style: "width: 300px"
                });

                CopySelectFeatDialog.set('content', this.nls.copySelectedFeatureContent);

                CopySelectFeatDialog.set('buttonOk', this.nls.copySelectedFeatureYes);
                CopySelectFeatDialog.set('buttonCancel', this.nls.copySelectedFeatureNo);

                CopySelectFeatDialog.on('execute', lang.hitch(this, this._onCopySelectFeaturesClick, selectedTemplate, selectedFeaturesCollection));

                CopySelectFeatDialog.on('cancel', lang.hitch(this, function (evt) {
                    return;
                }));

                CopySelectFeatDialog.show();
            },

            // copy selected feature to selected template
            _onCopySelectFeaturesClick: function (selectedTemplate, selectedFeaturesCollection) {

                for (var i = 0; i < selectedFeaturesCollection.length; i++) {
                    var g = new Graphic(selectedFeaturesCollection[i].geometry, new SimpleFillSymbol());
                    var jsonData = {};
                    var attributes = selectedTemplate.template.prototype.attributes;
                    for (var key in attributes) {
                        jsonData[key] = attributes[key];
                    }
                    g.setAttributes(jsonData);
                    selectedTemplate.featureLayer.applyEdits([g], null, null, null, this._featureLayerEditsError);
                }
            },

            // get selected features from layer which selectable property is true in settings
            _getSelectedFeatures: function (selectedTemplate) {

                var selectedFeaturesCollection = [];

                var ids = this.map.graphicsLayerIds;
                var len = ids.length;
                for (var i = 0; i < len; i++) {
                    var layer = this.map.getLayer(ids[i]);
                    if (layer.url !== null && layer.id !== this.costingGeometryLayer.id && layer.id !== this.projectCostLayer.id) {
                        var selectedFeatures = layer.getSelectedFeatures();
                        if (selectedFeatures.length > 0) {
                            if (layer.geometryType === selectedTemplate.featureLayer.geometryType) {
                                for (var k = 0; k < selectedFeatures.length; k++) {
                                    selectedFeaturesCollection.push(selectedFeatures[k]);
                                }
                            }
                        }
                    }
                }
                return selectedFeaturesCollection;
            },


            // Hide features of already saved Project
            _hideProjectRelatedFeatures: function () {
                for (var i = 0; i < this.layers.length; i++) {
                    if (this.layers[i].featureLayer.id != this.projectCostLayer.id) {
                        projectidField = Common.getFieldNameFromLayer(this.layers[i].featureLayer, 'PROJECTID');
                        var definitionExpression = projectidField + " is null";
                        this.layers[i].featureLayer.setDefinitionExpression(definitionExpression);
                    }
                }
            },

            _unhideProjectRelatedFeatures: function () {
                this.layers = Common.getLayers(this.map, this.config.editor.layerInfos);
                for (var i = 0; i < this.layers.length; i++) {
                    if (this.layers[i].featureLayer.id != this.projectCostLayer.id) {
                        var definitionExpression = "";
                        this.layers[i].featureLayer.setDefinitionExpression(definitionExpression);
                    }
                }
            },

            _switchView: function (idx) {
                this.currentStack = idx;
                this.viewStack.switchView(idx);
            },

            _switchToMainWidgetForCreateProject: function () {
                this._switchView(MAINWIDGET_VIEW);

                this.isLoadOrphanData = false;
                this.isLoadProject = false;

                //this._initialiseProjectDetail();

                this._resetAssetDrawBox();

                this.onOpen();
            },

            _getOrphanAssetsCount: function (count) {

                if (count > 0) {
                    this.layerCounter = 0;

                    this.shelter.hide();

                    this.loadOrphanAssetShowDialog();
                } else {
                    var query = new Query();
                    query.geometry = this.map.extent;
                    query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
                    if (this.layerCounter < this.layers.length) {
                        var featureLyr = this.layers[this.layerCounter].featureLayer;
                        this.layerCounter++;
                        var initialCostIdFldName = Common.getFieldNameFromLayer(featureLyr, "INITIALCOSTID");
                        var projectFldName = Common.getFieldNameFromLayer(featureLyr, "PROJECTID");
                        query.where = initialCostIdFldName + " IS NOT NULL And " + projectFldName + " is null";
                        featureLyr.queryCount(query, lang.hitch(this, this._getOrphanAssetsCount), lang.hitch(this, this._queryErrorOrphanCount));
                    } else {
                        this.layerCounter = 0;
                        this.shelter.hide();
                        this._switchToMainWidgetForCreateProject();
                    }
                }
            },

            checkOrphanAssetsCount: function () {
                if (this.projectNameText.value === "") {
                    return;
                }

                this.shelter.show();

                this._initialiseProjectDetail();
                this.layers = [];
                this.layers = Common.getLayers(this.map, this.config.editor.layerInfos);
                this._getOrphanAssetsCount(0);
            },


            _switchToMainWidgetForLoadProject: function () {
                if (this.loadProjectInfoChooser.item === undefined || this.loadProjectInfoChooser.item === null) {
                    return;
                }

                //clear highlighted project from project cost layer
                this.projectCostLayer.clearSelection();

                //switch to Main Widet Panel
                this._switchView(MAINWIDGET_VIEW);
                this.isLoadProject = true;

                this.shelter.show();

                //this.loadProjectInfoChooser.store.data[0].feature;
                this._initialiseProjectDetail();

                var projectItem = this.loadProjectInfoChooser.item;
                //projectDetail = {
                //    projectId: Common.getFieldvalue(projectItem.feature.attributes, this.projectIdFldName),
                //    projectName: Common.getFieldvalue(projectItem.feature.attributes, this.projectNameFldName),
                //    projectDesc: Common.getFieldvalue(projectItem.feature.attributes, this.projectDescriptionFldName),
                //    totalCost: Common.getFieldvalue(projectItem.feature.attributes, this.projectTotalCostFldName),
                //    grossCost: Common.getFieldvalue(projectItem.feature.attributes, this.projectGrossCostFldName),
                //    projectFeature: projectItem.feature,
                //    geographyFeatures: [],
                //    projectAddlnCostMultiplierDetails: [],
                //    projectAddlnCostMultiplierfeatures: []
                //    //projectfieldAttrib: []
                //};

                projectDetail.projectId = Common.getFieldvalue(projectItem.feature.attributes, this.projectIdFldName);
                projectDetail.projectName = Common.getFieldvalue(projectItem.feature.attributes, this.projectNameFldName);
                projectDetail.projectDesc = Common.getFieldvalue(projectItem.feature.attributes, this.projectDescriptionFldName);
                projectDetail.totalCost = Common.getFieldvalue(projectItem.feature.attributes, this.projectTotalCostFldName);
                projectDetail.grossCost = Common.getFieldvalue(projectItem.feature.attributes, this.projectGrossCostFldName);
                projectDetail.projectFeature = projectItem.feature;
                projectDetail.geographyFeatures = [];
                projectDetail.projectAddlnCostMultiplierDetails = [];
                projectDetail.projectAddlnCostMultiplierfeatures = [];


                array.forEach(projectDetail.projectfieldAttrib, lang.hitch(this, function (fieldInfo) {
                    if (fieldInfo.fieldName === this.projectNameFldName) {
                        fieldInfo.fieldReadOnly = true;
                        fieldInfo.fieldValue = Common.getFieldvalue(projectItem.feature.attributes, fieldInfo.fieldName);
                    } else {
                        fieldInfo.fieldValue = Common.getFieldvalue(projectItem.feature.attributes, fieldInfo.fieldName);
                    }
                }));

                // Get Geography related to the project

                var projectGeom = lang.clone(projectDetail.projectFeature.geometry);
                this._getGeography(projectGeom);
            },

            _switchToSelectionMethod: function () {

                if (!this.isLoadProject) {
                    if (domClass.contains(this.previousButton, "jimu-state-disabled")) {
                        return;
                    }
                }

                this._switchView(SELECTIONMETHOD_VIEW);
                this._unhideProjectRelatedFeatures();
                this.onClose();
                //reset Main Widget panel
                this.resetMainWidgetPanel();
            },

            _switchToProjectMultiplierAdditionalCost: function () {
                this._switchView(PROJECTMULTIPLIERADDITIONALCOST_VIEW);
                if (this.isLoadProject) {
                    if (this.costEscalationTable.tableInBodySection.rows.length === 0) {
                        array.forEach(projectDetail.projectAddlnCostMultiplierDetails, lang.hitch(this, function (rowDetail) {
                            this._createCostEscaltionTableOnProjectLoad(rowDetail);
                        }));
                    }
                }
                this.onClose();
            },

            _switchToMainWidgetAfterEditProjectAttrib: function () {

                //get edit project attrib element values
                this._storeEditProjectAtrrib();
                var i = 0;
                //check validation error in edit project attrib Element Textboxes
                for (i = 0; i < this.editProjectAttribElementTextbox.length; i++) {
                    if (this.editProjectAttribElementTextbox[i].state === "Error") {
                        return;
                    }
                }

                //destroy edit project attrib Element Textboxes
                for (i = 0; i < this.editProjectAttribElementTextbox.length; i++) {
                    this.editProjectAttribElementTextbox[i].destroy();
                }
                //destroy edit project attrib Element Textboxes
                for (i = 0; i < this.editProjectAttribElementSelectBox.length; i++) {
                    this.editProjectAttribElementSelectBox[i].destroy();
                }

                this._switchView(MAINWIDGET_VIEW);
                this.onOpen();
            },

            _switchToMainWidget: function () {

                this._switchView(MAINWIDGET_VIEW);
                this.onOpen();
            },

            _switchToLoadOrphanAsset: function () {

                this._switchView(LOADORPHANASSET_VIEW);
                this.onClose();
            },

            _switchToDetailStatistics: function () {

                if (this.assetValue.length === 0) {
                    this._switchView(MAINWIDGET_VIEW);
                    this.onOpen();
                    return;
                }

                //add more statistics to config statistics
                this._addMoreStatisticsToConfigStatistics();

                this._switchView(DETAILSTATISTICS_VIEW);
                this.onClose();

                //create dynamically label for statistics
                this._createStatisticsElement();
            },

            _switchToAddNewStatistics: function () {
                this._switchView(ADDNEWSTATISTICS_VIEW);
                this.onClose();
                setTimeout(lang.hitch(this, this.resize), 100);
            },

            //            _switchToMainWidgetAfterAddingNewStatistics: function () {
            //
            //                //add more statistics to config statistics
            //                this._addMoreStatisticsToConfigStatistics();
            //
            //                this._switchView(MAINWIDGET_VIEW);
            //                this.onOpen();
            //            },

            _switchToMainWidgetAfterViewStat: function () {

                //destroy stat Element Textboxs
                for (i = 0; i < this.statElementTextbox.length; i++) {
                    this.statElementTextbox[i].destroy();
                }

                this._switchView(MAINWIDGET_VIEW);
                this.onOpen();
            },

            _switchToDetailsAssetDescription: function () {
                //if asset grid is empty. do not switch to DetailsAssetDescription page
                if (this.assetValue.length === 0) {
                    return;
                }

                this._switchView(DETAILSASSETDESCRIPTION_VIEW);
                this.onClose();
                this.map.setExtent(this.map.extent);
                this.populateDetailAssetDescriptionTreeGrid();
            },

            _switchToEditProjectAttribute: function () {
                this._switchView(EDITPROJECTATTRIBUTE_VIEW);
                this.onClose();

                //create dynamically content for project layer
                this._createProjectAttributeElement();
            },

            _switchToEditCostEquation: function () {
                var selectedItem = this.detailAssetDescriptionTreeGrid.selection.getSelected();

                //save state of asset Tree grid
                this.treeGridOpenState = this.detailAssetDescriptionTreeGrid.layout.cells[0].openStates;

                if (selectedItem[0].children === undefined || selectedItem[0].geographyID !== undefined) {
                    return;
                }

                this._switchView(EDITCOSTEQUATION_VIEW);

                this.getCostQuation(selectedItem);
            },

            //disable webmap popup
            disableWebMapPopup: function () {
                if (this.map && this.map.webMapResponse) {
                    var handler = this.map.webMapResponse.clickEventHandle;
                    if (handler) {
                        this.mapClickEventHandle = handler;
                        handler.remove();
                        this.map.webMapResponse.clickEventHandle = null;
                    }
                }

                if (this.map.infoWindow.isShowing) {
                    this.map.infoWindow.hide();
                }
            },

            //enable Webmap popup
            enableWebMapPopup: function () {
                if (this.map && this.map.webMapResponse) {
                    var handler = this.map.webMapResponse.clickEventHandle;
                    var listener = this.map.webMapResponse.clickEventListener;
                    if (listener && !handler) {
                        this.map.webMapResponse.clickEventHandle = on(this.map, 'click', lang.hitch(this.map, listener));
                    }
                }
            },

            //Initialize Editor
            initEditor: function () {
                if (!this.editor) {
                    this._defaultStartStr = esriBundle.toolbars.draw.start;
                    esriBundle.toolbars.draw.start = esriBundle.toolbars.draw.start +
                        "<br/>" + "(" + this.nls.pressStr + "<b>" +
                        this.nls.ctrlStr + "</b> " + this.nls.snapStr + ")";
                    this._defaultAddPointStr = esriBundle.toolbars.draw.addPoint;
                    esriBundle.toolbars.draw.addPoint = esriBundle.toolbars.draw.addPoint +
                        "<br/>" + "(" + this.nls.pressStr + "<b>" +
                        this.nls.ctrlStr + "</b> " + this.nls.snapStr + ")";

                    var json = this.config.editor;
                    var settings = {};
                    for (var attr in json) {
                        settings[attr] = json[attr];
                    }

                    settings.layerInfos = this.layers;
                    settings.map = this.map;

                    var params = {
                        settings: settings
                    };

                    this.assetEditerDiv = html.create("div", {
                        style: {
                            width: "100%",
                            height: "100%"
                        }
                    });
                    //html.place(this.assetEditerDiv, this.domNode);
                    domConstruct.create(this.assetEditerDiv, null, this.domNode, "first");

                    this.editor = new Editor(params, this.assetEditerDiv);
                    this.editor.startup();


                    this.editorSelection = lang.hitch(this.editor.templatePicker, this.editor.templatePicker.clearSelection);

                    this.editor.templatePicker.clearSelection = lang.hitch(this, function () {});

                    setTimeout(lang.hitch(this, this.resize), 100);
                }
            },

            _clearSelectedTemplate: function () {
                this.editorSelection();
                //this._clearSelect();
            },

            //create asset grid layout for drawn asset
            createAssetGridLayout: function () {
                var gridLayout = [{
                    defaultCell: {
                        width: 'auto',
                        editable: true,
                        type: cells._Widget,
                        styles: 'text-align: left;'
                    },
                    cells: [
                        {
                            name: 'Asset Description',
                            field: 'description',
                            width: 'auto',
                            editable: false,
                            styles: 'text-align: left;' /* Can't edit Asset Type of */
                        },
                    ]
                }];

                this.grid = new DataGrid({
                    //store: gridStore,
                    structure: gridLayout,
                    escapeHTMLInData: false,
                    canSort: function () {
                        return false;
                    },
                    style: "height: 150px; margin-top:5px; margin-left:10px;"
                        // "class": "grid"
                }, dom.byId("assetGrid"));
                this.grid.startup();


                this.grid.connect(this, 'resize', function () {
                    this.resize();
                    this.height = '150px';
                });
            },

            //create detail Asset Description TreeGrid Layout for drawn asset
            createDetailAssetDescriptionTreeGridLayout: function () {

                this.detailAssetDescriptionTreeGrid = new TreeGrid({
                    //title: "Detail Asset Description",
                    id: "detailAssetgrid",
                    //structure: detailAssetDescriptionTreeGridLayout,
                    //treeModel: treeModel,
                    defaultOpen: false,
                    expandoCell: 0,
                    queryOptions: {
                        deep: true
                    },
                    //rowSelector: true,
                    //openAtLevels: [true, true, 4],
                    autoRender: true,
                    columnReordering: true,
                    sortChildItems: true,
                    canSort: function () {
                        return false;
                    },
                    autoHeight: true,
                    //style: "height: auto; width: 100%;",
                }, dom.byId("detailAssetgrid"));

                this.detailAssetDescriptionTreeGrid.startup();

                this.detailAssetDescriptionTreeGrid.connect(this, 'resize', function () {
                    this.resize();
                });

            },

            //Detail Asset Description TreeGrid
            populateDetailAssetDescriptionTreeGrid: function () {

                var geographyCollection = [];

                //get Geography Name and ID
                array.forEach(this.assetValue, lang.hitch(this, function (assetGroup) {
                    array.forEach(assetGroup.assetDetails, lang.hitch(this, function (asset) {
                        var geographyList = {
                            ID: asset.id,
                            type: 'geography',
                            geographyID: asset.geographyId,
                            geographyName: asset.geographyName,
                            rowDescription: (asset.geographyName === null ? this.nls.detailAssetDescriptionTreeGridGeographyName : asset.geographyName),
                            templates: [],
                            children: []
                        };

                        geographyCollection.push(geographyList);
                    }));

                }));

                var geographyNames = {};

                //remove duplicate geography
                var filterGeographyCollection = geographyCollection.filter(function (geographyCollection) {

                    if (geographyCollection.geographyID in geographyNames) {
                        return false;
                    } else {
                        geographyNames[geographyCollection.geographyID] = true;
                        return true;
                    }
                });

                //push unique asset Template in Geography collection
                array.forEach(filterGeographyCollection, lang.hitch(this, function (geography) {
                    var isTemplateExists;
                    array.forEach(this.assetValue, lang.hitch(this, function (assetGroup) {
                        array.forEach(assetGroup.assetDetails, lang.hitch(this, function (asset) {
                            var templateCollection = {};
                            if (geography.geographyID === asset.geographyId) {
                                if (geography.templates.length === 0) {
                                    templateCollection = {
                                        templateName: asset.templateName,
                                        layerID: asset.featureLayerId
                                    };

                                    geography.templates.push(templateCollection);
                                    isTemplateExists = true;
                                } else {
                                    for (i = 0; i < geography.templates.length; i++) {
                                        if ((geography.templates[i].templateName === asset.templateName) && (geography.templates[i].layerID === asset.featureLayerId)) {
                                            isTemplateExists = true;
                                            break;
                                        } else {
                                            isTemplateExists = false;
                                        }
                                    }
                                }

                                if (!isTemplateExists) {
                                    templateCollection = {
                                        templateName: asset.templateName,
                                        layerID: asset.featureLayerId
                                    };
                                    geography.templates.push(templateCollection);
                                }
                            }

                        }));
                    }));

                }));


                //push row description in children of filter Geography Collection
                array.forEach(filterGeographyCollection, lang.hitch(this, function (geography) {
                    array.forEach(this.assetValue, lang.hitch(this, function (assetGroup) {
                        array.forEach(assetGroup.assetDetails, lang.hitch(this, function (asset) {
                            if (geography.geographyID === asset.geographyId) {
                                var isTemplateExists;
                                var rowdescription;
                                var reMeasure;
                                var reCalculateTotalCost;
                                for (var i = 0; i < geography.templates.length; i++) {
                                    if ((geography.templates[i].templateName === asset.templateName) && (geography.templates[i].layerID === asset.featureLayerId)) {

                                        var measureUnit;
                                        if (asset.feature.geometry.type === 'point') {
                                            measureUnit = "";
                                        } else if (asset.feature.geometry.type === 'polyline') {
                                            measureUnit = this.lengthUnitDescription;
                                        } else {
                                            measureUnit = this.areaLengthUnitDescription;
                                        }

                                        var totalCostCalculated = this._computeCost(asset.modifiedCostEquation, asset.unitCost, asset.measure);
                                        var geographyWiseAssetCollection = {};

                                        if (geography.children.length === 0) {
                                            rowdescription = parseFloat(asset.measure.toFixed(2)) + " " + measureUnit + " " + asset.templateName + " " + asset.featureLayerName + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostCalculated.toFixed(2));

                                            geographyWiseAssetCollection = {
                                                ID: geography.geographyName + "_" + ((asset.templateName).replace(/ /g, "_")).replace(/"/g, "") + "_" + ((asset.featureLayerId).replace(/ /g, "_")).replace(/"/g, ""),
                                                rowDescription: rowdescription,
                                                measure: asset.measure,
                                                template: asset.templateName,
                                                layer: asset.featureLayerName,
                                                currency: this.defaultCurrencyUnit,
                                                cost: totalCostCalculated.toFixed(2),
                                                type: geography.geographyName,
                                                children: []

                                            };

                                            geography.children.push(geographyWiseAssetCollection);
                                            isTemplateExists = false;
                                        } else {
                                            var index;
                                            for (var j = 0; j < geography.children.length; j++) {
                                                if ((geography.children[j].template === asset.templateName) && (geography.children[j].layer === asset.featureLayerName)) {
                                                    index = j;
                                                    isTemplateExists = true;
                                                    break;
                                                }
                                            }

                                            if (isTemplateExists) {

                                                reMeasure = parseFloat(geography.children[index].measure) + parseFloat(asset.measure);
                                                reCalculateTotalCost = parseFloat(geography.children[index].cost) + parseFloat(totalCostCalculated.toFixed(2));


                                                rowdescription = parseFloat(reMeasure.toFixed(2)) + " " + measureUnit + " " + asset.templateName + " " + asset.featureLayerName + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(reCalculateTotalCost.toFixed(2));

                                                geography.children[index].rowDescription = rowdescription;
                                                geography.children[index].measure = reMeasure;
                                                geography.children[index].cost = reCalculateTotalCost;
                                            } else {

                                                rowdescription = parseFloat(asset.measure.toFixed(2)) + " " + measureUnit + " " + asset.templateName + " " + asset.featureLayerName + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostCalculated.toFixed(2));

                                                geographyWiseAssetCollection = {
                                                    ID: geography.geographyName + "_" + ((asset.templateName).replace(/ /g, "_")).replace(/"/g, "") + "_" + ((asset.featureLayerId).replace(/ /g, "_")).replace(/"/g, ""),
                                                    rowDescription: rowdescription,
                                                    measure: asset.measure,
                                                    template: asset.templateName,
                                                    layer: asset.featureLayerName,
                                                    currency: this.defaultCurrencyUnit,
                                                    cost: totalCostCalculated.toFixed(2),
                                                    type: geography.geographyName,
                                                    children: []
                                                };

                                                geography.children.push(geographyWiseAssetCollection);
                                            }

                                        }
                                    }
                                }

                            }

                        }));
                    }));
                }));

                //create children of children of filterGeographyCollection
                array.forEach(filterGeographyCollection, lang.hitch(this, function (geography) {
                    for (i = 0; i < geography.children.length; i++) {
                        array.forEach(this.assetValue, lang.hitch(this, function (assetGroup) {
                            array.forEach(assetGroup.assetDetails, lang.hitch(this, function (asset) {
                                if ((geography.children[i].template === asset.templateName) && (geography.children[i].layer === asset.featureLayerName) && (geography.geographyID === asset.geographyId)) {

                                    var measureUnit;
                                    var rowWiseAssetDescription;
                                    if (asset.feature.geometry.type === 'point') {
                                        measureUnit = "";
                                    } else if (asset.feature.geometry.type === 'polyline') {
                                        measureUnit = this.lengthUnitDescription;
                                    } else {
                                        measureUnit = this.areaLengthUnitDescription;
                                    }

                                    var totalCostCalculated = this._computeCost(asset.modifiedCostEquation, asset.unitCost, asset.measure);

                                    rowWiseAssetDescription = parseFloat(asset.measure.toFixed(2)) + " " + measureUnit + " " + asset.templateName + " " + asset.featureLayerName + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostCalculated.toFixed(2));

                                    var geographyWiseRowDescriptionChildrenCollection = {
                                        ID: geography.geographyName + "_" + ((asset.templateName).replace(/ /g, "_")).replace(/"/g, "") + "_" + ((asset.featureLayerName).replace(/ /g, "_")).replace(/"/g, ""),
                                        rowDescription: rowWiseAssetDescription,
                                        type: asset.templateName,
                                        asset: asset
                                    };
                                    geography.children[i].children.push(geographyWiseRowDescriptionChildrenCollection);
                                }
                            }));
                        }));
                    }

                }));

                //console.log(filterGeographyCollection);

                var Level1 = [];
                //create Level1
                array.forEach(filterGeographyCollection, function (item) {
                    var itemCollection = {
                        ID: item.ID.toString(),
                        geographyID: item.geographyID,
                        geographyName: item.geographyName,
                        rowDescription: item.rowDescription,
                        type: item.type,
                        asset: '',
                        children: []
                    };

                    for (i = 0; i < item.children.length; i++) {
                        var childRef = {
                            _reference: item.children[i].ID
                        };
                        itemCollection.children.push(childRef);
                    }
                    Level1.push(itemCollection);

                });

                //create Level2
                array.forEach(filterGeographyCollection, function (item) {

                    for (i = 0; i < item.children.length; i++) {
                        var Level2 = {
                            ID: item.children[i].ID,
                            type: item.children[i].type,
                            rowDescription: item.children[i].rowDescription,
                            asset: '',
                            children: []
                        };

                        for (j = 0; j < item.children[i].children.length; j++) {
                            var childRef = {
                                _reference: item.children[i].children[j].ID + "_" + j
                            };

                            Level2.children.push(childRef);
                        }
                        Level1.push(Level2);
                    }

                });

                //create Level3
                array.forEach(filterGeographyCollection, function (item) {

                    for (i = 0; i < item.children.length; i++) {

                        for (j = 0; j < item.children[i].children.length; j++) {
                            var Level3 = {
                                ID: item.children[i].children[j].ID + "_" + j,
                                type: item.children[i].children[j].type,
                                rowDescription: item.children[i].children[j].rowDescription,
                                asset: item.children[i].children[j].asset
                            };

                            Level1.push(Level3);
                        }

                    }

                });

                //console.log(Level1);

                var detailAssetDescriptionTreeGridLayout = [{
                    cells: [
                            [
                                  //{
                                  //    field: "ID", name: "ID", width: "auto", styles: 'text-align: left;',
                                  //}
                                  //,
                            {
                                field: "rowDescription",
                                name: this.nls.detailAssetDescriptionTreeGridLabel,
                                width: "auto",
                                styles: 'text-align: left;',
                                children: [{
                                    field: "ID",
                                    name: "ID",
                                    styles: 'margin-left: 10px;'
                                }]
                            },
                            ]
                    ]
                }];

                var formattedAssetData = {
                    identifier: 'ID',
                    label: 'rowDescription',
                    items: Level1
                };

                var store = new ItemFileWriteStore({
                    data: formattedAssetData
                });

                var treeModel = new ForestStoreModel({
                    store: store,
                    query: {
                        "type": "geography"
                    },
                    rootId: "root",
                    rootLabel: "Geographies",
                    childrenAttrs: ["children"]
                });

                //set tree model in tree grid
                this.detailAssetDescriptionTreeGrid.setModel(treeModel);
                //set structure in tree grid
                this.detailAssetDescriptionTreeGrid.setStructure(detailAssetDescriptionTreeGridLayout);

                if ((this.treeGridOpenState !== undefined) && (this.treeGridOpenState !== null) && (this.detailAssetDescriptionTreeGrid.layout.cells[0].openStates !== undefined)) {


                    this.detailAssetDescriptionTreeGrid.layout.cells[0].openStates = this.treeGridOpenState;
                    this.detailAssetDescriptionTreeGrid.update();

                }
            },

            //get Cost Equation from AssetValue to fill cost equation editor textbox
            getCostQuation: function (selectedItem) {

                for (i = 0; i < this.assetValue.length; i++) {
                    for (j = 0; j < this.assetValue[i].assetDetails.length; j++) {
                        if (selectedItem[0].ID[0] === this.assetValue[i].assetDetails[j].geographyName + "_" + ((this.assetValue[i].assetDetails[j].templateName).replace(/ /g, "_")).replace(/"/g, "") + "_" + ((this.assetValue[i].assetDetails[j].featureLayerId).replace(/ /g, "_")).replace(/"/g, "")) {
                            this.reviseCostEquation.set("value", this.assetValue[i].assetDetails[j].modifiedCostEquation);
                            this.initialCostEquation.set("value", this.assetValue[i].assetDetails[j].defaultCostEquation);
                            this.shelter.show();
                            var initialCostIdFldName = Common.getActualFieldName(this.assetValue[i].assetDetails[j].feature.attributes, 'INITIALCOSTID');

                            var geographyIdFldName = Common.getFieldNameFromLayer(this.costingGeometryLayer, "COSTGEOMID");

                            var geographyId = this.assetValue[i].assetDetails[j].geographyId;

                            var initialCostTemplate = this.assetValue[i].assetDetails[j].initialCostId;
                            //get data from CostingTable
                            var costingTable = Common.getFlatTables(this.projectTables, this.lookupTable);

                            var queryTask = new QueryTask(costingTable.url);
                            queryTask.on('complete', lang.hitch(this, this._fillCostEquation));
                            queryTask.on('error', this._queryError);

                            var query = new Query();
                            query.where = initialCostIdFldName + " = " + "'" + initialCostTemplate + "'" + " AND " + geographyIdFldName + " = " + "'" + geographyId + "'";
                            query.returnGeometry = false;
                            query.outFields = ["*"];
                            queryTask.execute(query);

                            break;
                        }
                    }
                }
            },

            _fillCostEquation: function (results) {

                this.shelter.hide();

                if (results.featureSet.features.length === 0) {
                    dijit.byId("selectEditCostEquationType").disabled = true;
                    return;
                }

                ready(function () {
                    var data = {
                        identifier: 'value',
                        items: [],
                        label: 'costEquationTypeName'
                    };

                    for (var i = 0; i < results.featureSet.features.length; i++) {

                        data.items.push(lang.mixin({
                            "costEquationTypeName": Common.getFieldvalue(results.featureSet.features[i].attributes, "EQUATIONTYPE")
                        }, {
                            "value": Common.getFieldvalue(results.featureSet.features[i].attributes, "EQUATIONTYPE")
                        }, {
                            "feature": results.featureSet.features[i]
                        }));
                    }

                    var equationTypeStore = new Memory({
                        data: data,
                        idProperty: "value"
                    });

                    dijit.byId("selectEditCostEquationType").set("labelAttr", "value");
                    dijit.byId("selectEditCostEquationType").setStore(equationTypeStore);

                });
            },

            costEquationChooserChange: function () {
                var equationType = this.selectEditCostEquationType.value;

                var storeItem = this.selectEditCostEquationType.store.data;

                for (var i = 0; i < storeItem.length; i++) {
                    if (equationType === Common.getFieldvalue(storeItem[i].feature.attributes, "EQUATIONTYPE")) {
                        var costEquation = Common.getFieldvalue(storeItem[i].feature.attributes, "COSTEQUATION");
                        dijit.byId("reviseCostEquation").set("value", costEquation);
                    }
                }
            },

            //edit cost equation in Cost Equation Editor Panel
            _editCostEquation: function () {
                var selectedItem = this.detailAssetDescriptionTreeGrid.selection.getSelected();
                var isTemplateMatch = false;
                for (i = 0; i < this.assetValue.length; i++) {
                    var assetValueTotalCost = 0;
                    var assetValueTotalQuantity = 0;
                    for (j = 0; j < this.assetValue[i].assetDetails.length; j++) {
                        if (selectedItem[0].ID[0] === this.assetValue[i].assetDetails[j].geographyName + "_" + ((this.assetValue[i].assetDetails[j].templateName).replace(/ /g, "_")).replace(/"/g, "") + "_" + ((this.assetValue[i].assetDetails[j].featureLayerId).replace(/ /g, "_")).replace(/"/g, "")) {
                            this.assetValue[i].assetDetails[j].modifiedCostEquation = this.reviseCostEquation.value;

                            var totalCostCalculated = this._computeCost(this.assetValue[i].assetDetails[j].modifiedCostEquation, this.assetValue[i].assetDetails[j].unitCost, this.assetValue[i].assetDetails[j].measure);

                            this.assetValue[i].assetDetails[j].modifiedAssetCost = totalCostCalculated.toFixed(2);

                            assetValueTotalCost = assetValueTotalCost + totalCostCalculated;

                            isTemplateMatch = true;
                        }
                    }
                    if (isTemplateMatch) {
                        var measureUnit;
                        if (this.assetValue[i].assetDetails[0].feature.geometry.type === 'point') {
                            measureUnit = "";
                        } else if (this.assetValue[i].assetDetails[0].feature.geometry.type === 'polyline') {
                            measureUnit = this.lengthUnitDescription;
                        } else {
                            measureUnit = this.areaLengthUnitDescription;
                        }
                        var rowdescription = this.assetValue[i].totalQuantity + " " + measureUnit + " " + this.assetValue[i].assetDetails[0].templateName + " " + this.assetValue[i].assetDetails[0].featureLayerName + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(assetValueTotalCost.toFixed(2));

                        this.assetValue[i].description = rowdescription;
                        this.assetValue[i].totalCost = parseFloat(assetValueTotalCost.toFixed(2));
                        isTemplateMatch = false;
                    }
                }

                //update grid
                this.grid.update();
                //recalculate Total cost and Gross cost
                this.projectCostCalculated();
                //switch to Details Asset Description page
                this._switchView(DETAILSASSETDESCRIPTION_VIEW);
                //repopulate details asset description tree grid
                this.populateDetailAssetDescriptionTreeGrid();
            },

            // Zoom to selected asset in aseet description grid
            _zoomToSelectedAsset: function () {

                var selectedItem = this.detailAssetDescriptionTreeGrid.selection.getSelected();
                if (selectedItem.length === 0) {
                    return;
                }

                if (selectedItem[0].children === undefined) {
                    for (i = 0; i < this.assetValue.length; i++) {
                        for (j = 0; j < this.assetValue[i].assetDetails.length; j++) {
                            if (selectedItem[0].asset[0].id === this.assetValue[i].assetDetails[j].id) {
                                if (this.assetValue[i].assetDetails[j].feature.geometry.type === "point") {
                                    var assetLocation = [this.assetValue[i].assetDetails[j].feature.geometry.getLongitude(), this.assetValue[i].assetDetails[j].feature.geometry.getLatitude()];

                                    var mapZoomFactor = this.map.getMaxZoom();
                                    this.map.centerAndZoom(assetLocation, mapZoomFactor - 1);

                                } else if (this.assetValue[i].assetDetails[j].feature.geometry.type === "polyline") {
                                    this.map.setExtent(this.assetValue[i].assetDetails[j].feature.geometry.getExtent(), true);
                                } else {
                                    this.map.setExtent(this.assetValue[i].assetDetails[j].feature.geometry.getExtent(), true);
                                }

                                return;
                            }

                        }
                    }
                }
            },

            // highlight selected asset in aseet description grid
            _selectAsset: function () {
                this._clearSelect();
                var selectedItem = this.detailAssetDescriptionTreeGrid.selection.getSelected();
                if (selectedItem.length === 0) {
                    return;
                }

                if (selectedItem[0].children === undefined) {
                    for (i = 0; i < this.assetValue.length; i++) {
                        for (j = 0; j < this.assetValue[i].assetDetails.length; j++) {
                            if (selectedItem[0].asset[0].id === this.assetValue[i].assetDetails[j].id) {
                                var selectableFeatureLayer = Common.getLayerbyTitleFromMap(this.map, this.assetValue[i].assetDetails[j].featureLayerName);

                                var selectQuery = new Query();
                                var objectIdFld = selectableFeatureLayer.objectIdField;

                                if (objectIdFld !== null && objectIdFld !== undefined) {
                                    var objectId = Common.getFieldvalue(this.assetValue[i].assetDetails[j].feature.attributes, objectIdFld);
                                    selectQuery.where = objectIdFld + " = " + objectId;
                                } else {

                                    selectQuery.geometry = this.assetValue[i].assetDetails[j].feature.geometry;
                                    selectQuery.spatialRelationship = selectQuery.SPATIAL_REL_INTERSECTS;
                                }

                                selectableFeatureLayer.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW);

                                return;
                            }
                        }
                    }
                }
            },

            _clearSelect: function () {

                Common.clearSelectedFeaturesFromMap(this.map);
            },

            // pan to selected asset in aseet description grid
            _panToSelectedAsset: function () {
                var selectedItem = this.detailAssetDescriptionTreeGrid.selection.getSelected();
                if (selectedItem.length === 0) {
                    return;
                }
                if (selectedItem[0].children === undefined) {
                    for (i = 0; i < this.assetValue.length; i++) {
                        for (j = 0; j < this.assetValue[i].assetDetails.length; j++) {
                            if (selectedItem[0].asset[0].id === this.assetValue[i].assetDetails[j].id) {
                                var centerPt = null;
                                if (this.assetValue[i].assetDetails[j].feature.geometry.type === "point") {
                                    var assetLocation = [this.assetValue[i].assetDetails[j].feature.geometry.getLongitude(), this.assetValue[i].assetDetails[j].feature.geometry.getLatitude()];
                                    centerPt = assetLocation;

                                } else {
                                    var extent = this.assetValue[i].assetDetails[j].feature.geometry.getExtent();
                                    centerPt = extent.getCenter();
                                }
                                this.map.centerAt(centerPt);

                                return;
                            }

                        }
                    }
                }
            },

            // delete selected asset in aseet description grid
            _deleteSelectedAsset: function () {
                var selectedItem = this.detailAssetDescriptionTreeGrid.selection.getSelected();
                if (selectedItem.length === 0) {
                    return;
                }
                if (selectedItem[0].children === undefined) {
                    for (i = 0; i < this.assetValue.length; i++) {
                        for (j = 0; j < this.assetValue[i].assetDetails.length; j++) {
                            if (selectedItem[0].asset[0].id === this.assetValue[i].assetDetails[j].id) {
                                var featureLyr = Common.getLayerbyTitleFromMap(this.map, this.assetValue[i].assetDetails[j].featureLayerName);

                                featureLyr.applyEdits(null, null, [this.assetValue[i].assetDetails[j].feature], null, this._featureLayerEditsError);

                                //save state of asset Tree grid
                                this.treeGridOpenState = this.detailAssetDescriptionTreeGrid.layout.cells[0].openStates;

                                //repopulate details asset description tree grid
                                this.populateDetailAssetDescriptionTreeGrid();
                                this.shelter.hide();
                                return;
                            }
                        }
                    }
                }
            },

            // Bind layer events and creates object to store features drawn.
            // returns: nothing
            bindLayerEvents: function () {
                array.forEach(this.editor.settings.layers,
                    lang.hitch(this, function (layer) {
                        this.featureStorage[layer.id] = {
                            'layer': layer,
                            addedFeatures: []
                        };

                        on(layer, 'before-apply-edits',
                            lang.hitch(this, this.layerBeforeApplyEditsComplete));

                        on(layer, 'edits-complete',
                            lang.hitch(this, this._layerEditCompletes));

                    }));
            },

            _layerEditCompletes: function () {
                this.map.setExtent(this.map.extent);
            },

            // Initializes the Geometry Service
            // returns: nothing
            initGeometryService: function () {
                var arcgisGeometryServiceURL = null;
                if (esriConfig.defaults.geometryService) {
                    arcgisGeometryServiceURL = esriConfig.defaults.geometryService.url;
                }

                if (!arcgisGeometryServiceURL) {
                    var servicesObj = utils.getServices();
                    arcgisGeometryServiceURL = servicesObj.geometryService;
                }

                this.arcgisGeomtryService = new GeometryService(arcgisGeometryServiceURL);
            },

            bindEvents: function () {
                this.hideEvent = on(this.map.infoWindow, 'hide', lang.hitch(this, this._onHideInfoWindow));
                this.showEvent = on(this.map.infoWindow, 'show', lang.hitch(this, this._onShowInfoWindow));
            },

            // Event handler for map info window show.
            // returns: nothing
            _onShowInfoWindow: function (evt) {
                if (this.map.infoWindow.isShowing) {
                    this.map.infoWindow.hide();
                }
            },

            // Event handler for map info window hide.
            // returns: onClearClick
            _onHideInfoWindow: function () {
                this.enableWebMapPopup();
            },

            //disable mouse event on label layer
            disableMouseEvent: function () {
                var ids = this.map.graphicsLayerIds;
                var len = ids.length;
                for (var i = 0; i < len; i++) {
                    var layer = this.map.getLayer(ids[i]);
                    if (layer.type != 'Feature Layer') {
                        if (layer.featureLayers !== undefined) {
                            if (layer.featureLayers.length > 0) {
                                layer.disableMouseEvents();
                            }
                        }
                    }
                }
            },

            //Load Orphan Asset Page
            _initAssetDrawBox: function () {
                if (!this.drawBox) {
                    this.drawBox = new DrawBox({
                        types: ['polygon'],
                        map: this.map,
                        //showClear: true,
                        keepOneGraphic: true
                    });

                    this.drawBox.placeAt(this.drawBoxSelectAssetDiv);
                    this.drawBox.startup();

                    on(this.drawBox, 'DrawEnd', lang.hitch(this, this._onDrawEnd));
                }
            },

            _onDrawEnd: function (graphic, geotype, commontype) {
                geometryforOrphanData = graphic.geometry;
                this.isLoadOrphanData = true;
                //if (!this.isLoadProject)
                //    this._initialiseProjectDetail();
                this._getGeography(geometryforOrphanData);
            },

            //load orphan asset by map extent
            _selectByMapExtent: function () {
                geometryforOrphanData = this.map.extent;
                this.isLoadOrphanData = true;
                //if (!this.isLoadProject)
                //    this._initialiseProjectDetail();
                this._getGeography(geometryforOrphanData);
            },

            //destroy draw box on Main Widget Panel Load
            _resetAssetDrawBox: function () {
                this.drawBox.deactivate();
                this.drawBox.clear();
            },

            //clear draw graphics on clear click button
            _clearDrawGraphics: function () {
                this.drawBox.clear();
            },

            //initialize project detail
            _initialiseProjectDetail: function () {

                projectDetail = {
                    projectId: '',
                    projectName: this.projectNameText.value,
                    projectDesc: this.projectDescriptionText.value,
                    totalCost: 0,
                    grossCost: 0,
                    projectFeature: null,
                    geographyFeatures: [],
                    projectAddlnCostMultiplierDetails: [],
                    projectAddlnCostMultiplierfeatures: [],
                    projectfieldAttrib: []
                };
                array.forEach(this.projectCostLayer.fields, lang.hitch(this, function (field) {
                    if (field.name !== this.projectCostLayer.objectIdField) {
                        if ((field.type !== 'esriFieldTypeGUID') && (field.type !== 'esriFieldTypeGlobalID')) {
                            var fieldInfo = {
                                fieldName: field.name.toUpperCase(),
                                fieldAlias: field.alias.toUpperCase(),
                                fieldType: field.type,
                                fieldValue: this._getprojectEditAttribValue(field)[0],
                                fieldReadOnly: this._getprojectEditAttribValue(field)[1],
                                fieldNullable: field.nullable,
                                fieldDomain: field.domain
                            };

                            projectDetail.projectfieldAttrib.push(fieldInfo);
                        }

                    }
                }));
            },

            // load assets which are not associated with any project
            _loadOrphanAssets: function () {
                if (geometryforOrphanData === null) {
                    return;
                }

                this.shelter.show();

                this._switchView(MAINWIDGET_VIEW);
                this.onOpen();
                this.isLoadOrphanData = true;

                var deferredqueryArray = [];
                var promises;
                var query = new Query();
                query.geometry = geometryforOrphanData;

                query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
                query.returnGeometry = true;
                query.outFields = ["*"];

                for (var i = 0; i < this.layers.length; i++) {
                    var featureLyr = this.layers[i].featureLayer;
                    if (featureLyr.id != this.projectCostLayer.id) {
                        var initialCostIdFldName = Common.getFieldNameFromLayer(featureLyr, "INITIALCOSTID");
                        var projectFldName = Common.getFieldNameFromLayer(featureLyr, "PROJECTID");
                        var templateIdFldName = Common.getFieldNameFromLayer(featureLyr, "TEMPLATEID");

                        query.where = initialCostIdFldName + " IS NOT NULL AND " + templateIdFldName + " IS NOT NULL AND " + projectFldName + " IS NULL";
                        var qt = new QueryTask(featureLyr.url);
                        deferredqueryArray.push(qt.execute(query));
                    }
                }

                all(deferredqueryArray).then(lang.hitch(this, this._loadProject), this._queryErrorOnPromise);
                this.drawBox.clear();
                geometryforOrphanData = null;
                //this.onOpen();
            },

            // get all asset geometries
            _getAssetGeometries: function () {

                var deferredqueryArray = [];
                var promises;
                var projectidField = '';

                var query = new Query();

                // Get fieldname from the layer
                //query.where = this.projectIdFldName + " = '" + projectDetail.projectId + "'";

                query.returnGeometry = true;
                query.outFields = ["*"];

                for (var i = 0; i < this.layers.length; i++) {
                    if (this.layers[i].featureLayer.id != this.projectCostLayer.id) {
                        if (projectidField === '') {
                            projectidField = Common.getFieldNameFromLayer(this.layers[i].featureLayer, 'PROJECTID');
                            query.where = projectidField + " = '" + projectDetail.projectId + "'";
                        }
                        var definitionExpression = projectidField + " = '" + projectDetail.projectId + "' OR " + projectidField + " is null";

                        this.layers[i].featureLayer.setDefinitionExpression(definitionExpression);

                        var qt = new QueryTask(this.layers[i].featureLayer.url);
                        deferredqueryArray.push(qt.execute(query));
                    }
                }

                all(deferredqueryArray).then(lang.hitch(this, this._loadProject), this._queryErrorOnPromise);
            },

            // to load project
            _loadProject: function (results) {

                //queryFeatures = results;
                this.orphanAssetCounter = 0;
                var deferredqueryArray = [];
                var costpromises;

                var assetsArray = [];
                var isNewFeat = false;
                var i = 0;

                if (this.isLoadOrphanData) {
                    isNewFeat = true;
                    this.updateSaveClearSessionBtn();
                }

                for (i = 0; i < results.length; i++) {
                    var result = results[i];
                    var target = this.map.getLayer(this.layers[i].featureLayer.id);
                    target.name = ((this.layers[i].featureLayer.title === null || this.layers[i].featureLayer.title === undefined) ? target.name : this.layers[i].featureLayer.title);

                    for (var j = 0; j < result.features.length; j++) {


                        var assetInitialCostID = Common.getFieldvalue(result.features[j].attributes, 'INITIALCOSTID');

                        var prjGrpCostId = Common.getFieldvalue(result.features[j].attributes, 'PROJECTGROUPCOSTINGINFOID');

                        var geographyFeature = this._getRelatedGeographyGeometry(result.features[j].geometry, projectDetail.geographyFeatures);
                        var geographyId = null;
                        var geographyName = null;
                        if (geographyFeature !== null) {
                            geographyId = Common.getFieldvalue(geographyFeature.attributes, 'COSTGEOMID');
                            geographyName = Common.getFieldvalue(geographyFeature.attributes, 'NAME');
                        }

                        var templateName = this._getTemplateName(target, result.features[j]);
                        var templateIDFldName = Common.getActualFieldName(result.features[j].attributes, 'TEMPLATEID');
                        var templateId = result.features[j].attributes[templateIDFldName];
                        var measure = 1;
                        var unit = '';
                        if (result.features[j].geometry.type === 'polyline') {

                            var length = this.getGeometryLength(result.features[j]);
                            measure = Math.abs(length.toFixed(2));
                            unit = this.lengthUnit;

                        } else if (result.features[j].geometry.type === 'polygon') {
                            var area = this.getGeometryArea(result.features[j]);
                            measure = Math.abs(area.toFixed(2));
                            unit = this.areaLengthUnit;
                        }
                        var projectGeometry = null;
                        if (!this.isLoadOrphanData) {
                            projectGeometry = projectDetail.projectFeature.geometry;
                        }
                        //var id = parseInt(assetsArray.length + 1);
                        var id = this.generateGUID();

                        var params = {
                            id: id,
                            feature: result.features[j],
                            measure: measure,
                            measureUnit: unit,
                            initialCostId: assetInitialCostID,
                            unitCost: null,
                            geographyId: geographyId,
                            geographyName: geographyName,
                            geographyGeom: geographyFeature === null ? null : geographyFeature.geometry,
                            subGeoId: '',
                            projectGroupCostingId: prjGrpCostId,
                            projectId: projectDetail.projectId,
                            featureLayerName: target.name,
                            featureLayerId: target.id,
                            //featureLayer: target,
                            //projectGeom: projectGeometry,
                            defaultCostEquation: null,
                            modifiedCostEquation: null,
                            templateName: templateName,
                            templateID: templateId,
                            isNewFeature: isNewFeat,
                        };

                        if (this.isLoadOrphanData) {
                            var isDuplicateFeature = false;
                            if (this.assetValue !== null) {

                                for (var assetCounter = 0; assetCounter < this.assetValue.length; assetCounter++) {
                                    for (var k = 0; k < this.assetValue[assetCounter].assetDetails.length; k++) {
                                        if (params.featureLayerName == this.assetValue[assetCounter].assetDetails[k].featureLayerName) {
                                            var objectIdFld = target.objectIdField;
                                            if (this._checkEqualFeature(params.feature, this.assetValue[assetCounter].assetDetails[k].feature, objectIdFld)) {
                                                isDuplicateFeature = true;
                                            }
                                        }
                                    }
                                }
                            }
                            if (!isDuplicateFeature) {
                                var orphanAssetDetails = new AssetDetailInProject(params);
                                assetsArray.push(orphanAssetDetails);
                                isDuplicateFeature = false;
                            }
                        } else {
                            var newAssetDetails = new AssetDetailInProject(params);
                            assetsArray.push(newAssetDetails);
                        }
                    }
                }

                if (!this.isLoadOrphanData) {
                    var deferredGrpqueryArray = [];
                    var grppromises;
                    var prjGrpCostInfotable = Common.getFlatTables(this.projectTables, this.projectGroupCostingInfoTable);
                    var grpquery = new Query();
                    grpquery.returnGeometry = false;
                    grpquery.outFields = ["*"];
                    var grpqueryString = '';
                    var counter = 1;
                    for (i = 0; i < assetsArray.length; i++) {

                        var prjgrpcostfldName = Common.getActualFieldName(assetsArray[i].feature.attributes, 'PROJECTGROUPCOSTINGINFOID');
                        var prjgrpcostfldValue = assetsArray[i].projectGroupCostingId;

                        if (grpqueryString.indexOf(prjgrpcostfldName + " = '" + prjgrpcostfldValue + "'") == -1) {
                            grpqueryString = (grpqueryString === '' ? '' : grpqueryString + ' OR ') + prjgrpcostfldName + " = '" + prjgrpcostfldValue + "'";
                        }
                        counter++;
                        // we break this query for 50 features at a time
                        if (counter === 50 || i === assetsArray.length - 1) {
                            // query for getting modified cost equation for particular feature
                            grpquery.where = grpqueryString;
                            var qtgrp = new QueryTask(prjGrpCostInfotable.url);
                            deferredGrpqueryArray.push(qtgrp.execute(grpquery));
                            grpqueryString = '';
                            counter = 1;
                        }

                    }
                    //for getting modified cost equation for particular feature
                    all(deferredGrpqueryArray).then(lang.hitch(this, this._getPrjGrpCostInfo, assetsArray), this._queryErrorOnPromise);

                } else {

                    this.orphanAssetArray = assetsArray; //lang.clone(assetsArray);
                    this.orphanAssetArrayLength = this.orphanAssetArray.length;
                    if (this.orphanAssetArrayLength > 0) {
                        this.isLoadOrphanDataForPopUp = true;
                        this._getEquationTypeForOrphanAsset(this.orphanAssetArray[this.orphanAssetCounter]);

                    } else {
                        this.shelter.hide();
                    }
                }
            },

            _getEquationTypeForOrphanAsset: function (param) {

                this.isLoadOrphanDataForPopUp = true;
                this.orphanAssetCounter++;
                var j = 0;
                for (var k = 0; k < projectDetail.geographyFeatures.length; k++) {
                    if (geometryEngine.within(param.feature.geometry, projectDetail.geographyFeatures[k].geometry)) {
                        j++;
                    }
                }
                if (j > 1) {
                    if (!this.isMessagePopup) {
                        new Message({
                            message: this.nls.moreThanOneGeography
                        });
                        this.isMessagePopup = true;
                    }
                    console.log(this.nls.moreThanOneGeography);
                }

                this._getGeographyRelated2Feature(param, null);
            },

            //open confirmation dialog box for orphan data
            loadOrphanAssetShowDialog: function () {

                this.isLoadProject = false;
                var loadOrphanAssetDialog = new ConfirmDialog({
                    title: this.nls.loadOrphanAssetTitle,
                    content: "",
                    style: "width: 300px"
                });

                loadOrphanAssetDialog.set('content', this.nls.loadOrphanAssetContent);

                loadOrphanAssetDialog.set('buttonOk', this.nls.loadOrphanAssetYes);
                loadOrphanAssetDialog.set('buttonCancel', this.nls.loadOrphanAssetNo);

                loadOrphanAssetDialog.on('execute', lang.hitch(this, function (evt) {

                    this._switchToLoadOrphanAsset();
                    this.isOpenCheck = false;
                }));

                loadOrphanAssetDialog.on('cancel', lang.hitch(this, function (evt) {
                    this._switchToMainWidgetForCreateProject();
                }));

                loadOrphanAssetDialog.show();
            },

            //open confirmation dialog box for delete project
            deleteProjectConfirmDialog: function (evt) {

                if (this.loadProjectInfoChooser.item === undefined || this.loadProjectInfoChooser.item === null) {
                    return;
                }

                if (domClass.contains(evt.target, "jimu-state-disabled")) {
                    return;
                }

                var deleteProjectDialog = new ConfirmDialog({
                    title: this.nls.deleteProjectTitle,
                    content: "",
                    style: "width: 300px"
                });

                deleteProjectDialog.set('content', this.nls.deleteProjectContent);

                deleteProjectDialog.set('buttonOk', this.nls.deleteProjectYes);
                deleteProjectDialog.set('buttonCancel', this.nls.deleteProjectNo);

                deleteProjectDialog.on('execute', lang.hitch(this, function (evt) {
                    this.deleteProject();
                }));

                deleteProjectDialog.on('cancel', lang.hitch(this, function (evt) {
                    return;
                }));

                deleteProjectDialog.show();
            },

            //open confirmation dialog box for clear  session
            clearSessionConfirmDialog: function (evt) {
                if (domClass.contains(evt.target, "jimu-state-disabled")) {
                    return;
                }

                var clearSessionDialog = new ConfirmDialog({
                    title: this.nls.clearSessionTitle,
                    content: "",
                    style: "width: 300px"
                });

                clearSessionDialog.set('content', this.nls.clearSessionContent);

                clearSessionDialog.set('buttonOk', this.nls.clearSessionYes);
                clearSessionDialog.set('buttonCancel', this.nls.clearSessionNo);

                clearSessionDialog.on('execute', lang.hitch(this, function (evt) {
                    this.onClearSessionClick();
                }));

                clearSessionDialog.on('cancel', lang.hitch(this, function (evt) {
                    return;
                }));

                clearSessionDialog.show();
            },

            //open confirmation dialog box for project save
            projectSaveConfirmDialog: function (evt) {

                if (domClass.contains(evt.target, "jimu-state-disabled")) {
                    return;
                }

                var projectSaveDialog = new ConfirmDialog({
                    title: this.nls.saveProjectTitle,
                    content: "",
                    style: "width: 300px"
                });

                projectSaveDialog.set('content', this.nls.saveProjectContent);

                projectSaveDialog.set('buttonOk', this.nls.saveProjectYes);
                projectSaveDialog.set('buttonCancel', this.nls.saveProjectNo);

                projectSaveDialog.on('execute', lang.hitch(this, function (evt) {
                    this.onSaveSessionClick();
                }));

                projectSaveDialog.on('cancel', lang.hitch(this, function (evt) {
                    return;
                }));

                projectSaveDialog.show();
            },

            //open confirmation dialog box for delete asset in Detail Asset Treegrid
            deleteAssetConfirmDialog: function (evt) {
                var selectedItem = this.detailAssetDescriptionTreeGrid.selection.getSelected();
                if (selectedItem.length === 0) {
                    return;
                }
                if (selectedItem[0].children === undefined) {

                    var deleteAssetDialog = new ConfirmDialog({
                        title: this.nls.deleteAssetTitle,
                        content: "",
                        style: "width: 300px"
                    });

                    deleteAssetDialog.set('content', this.nls.deleteAssetContent);

                    deleteAssetDialog.set('buttonOk', this.nls.deleteAssetYes);
                    deleteAssetDialog.set('buttonCancel', this.nls.deleteAssetNo);

                    deleteAssetDialog.on('execute', lang.hitch(this, function (evt) {
                        this._deleteSelectedAsset();
                    }));

                    deleteAssetDialog.on('cancel', lang.hitch(this, function (evt) {
                        return;
                    }));

                    deleteAssetDialog.show();
                }
            },

            //create dynamically label for statistics
            _createStatisticsElement: function () {

                this.statElementTextbox = [];
                var statDiv = dom.byId("statisticsTable");

                if (statDiv.children.length > 0) {
                    statDiv.removeChild(statDiv.firstElementChild);
                }

                var table = document.createElement('table');
                table.setAttribute('class', 'detail-statistics-table input-table');
                //table.setAttribute('class', 'jimu-table');

                var tableBody = document.createElement('tbody');
                table.appendChild(tableBody);

                //var count = 0;
                var statValues = [];

                if (this.statisticsFields === null) {
                    return;
                }

                //create stat label from config statistics
                array.forEach(this.statisticsFields.fields, lang.hitch(this, function (stat) {

                    //create label for statistics label
                    var trLabel = document.createElement('tr');
                    tableBody.appendChild(trLabel);
                    tdLabel = document.createElement('td');

                    var label1 = document.createElement("Label");
                    label1.for = "text" + stat.label;
                    if (stat.label !== "") {
                        label1.innerHTML = stat.label + " : ";
                    } else {
                        label1.innerHTML = stat.layer + " : ";
                    }

                    tdLabel.appendChild(label1);
                    trLabel.appendChild(tdLabel);

                    //create ready only textbox
                    var trTextBox = document.createElement('tr');
                    tableBody.appendChild(trTextBox);
                    tdTextBox = document.createElement('td');

                    trTextBox.appendChild(tdTextBox);

                    statValues.push(this._calculateStatistics(stat));
                }));

                //create stat label from added more statistics
                if (this.newStatisticsFields !== null) {
                    array.forEach(this.newStatisticsFields.fields, lang.hitch(this, function (newStat) {
                        //create label for statistics label
                        var trLabel = document.createElement('tr');
                        tableBody.appendChild(trLabel);
                        tdLabel = document.createElement('td');

                        var label1 = document.createElement("Label");
                        label1.for = "text" + newStat.label;

                        if (newStat.label !== "") {
                            label1.innerHTML = newStat.label + " : ";
                        } else {
                            label1.innerHTML = newStat.layer + " : ";
                        }

                        tdLabel.appendChild(label1);
                        trLabel.appendChild(tdLabel);

                        //create ready only textbox
                        var trTextBox = document.createElement('tr');
                        tableBody.appendChild(trTextBox);
                        tdTextBox = document.createElement('td');

                        trTextBox.appendChild(tdTextBox);

                        statValues.push(this._calculateStatistics(newStat));
                    }));
                }

                statDiv.appendChild(table);

                var index = 0;
                for (i = 0; i < statDiv.childNodes[1].childNodes[0].children.length; i++) {
                    if (statDiv.childNodes[1].childNodes[0].childNodes[i].childNodes[0].childNodes[0] === undefined) {
                        this.statElementTextbox[index] = new TextBox({
                            id: "statTextBox" + index,
                            name: "statTextBox" + " " + index,
                            readonly: true,
                            value: statValues[index],
                            //style: "display:inline-block; width:100%; min-width:315px; background-color:#C0C0C0; color:#C0C0C0;",
                            class: "statValueDisable",
                        }, statDiv.childNodes[1].childNodes[0].childNodes[i].childNodes[0]);

                        index = index + 1;
                    }
                }
            },

            _calculateStatistics: function (statElement) {
                var statElementFeatureLayer = statElement.layer;
                var statElementField = statElement.field;
                var statElementType = statElement.type;
                var statElementLabel = statElement.label;

                var fieldValue = [];
                var statValue = 0;
                var count = 0;

                array.forEach(this.assetValue, lang.hitch(this, function (assetGroup) {
                    array.forEach(assetGroup.assetDetails, lang.hitch(this, function (asset) {

                        if (statElementFeatureLayer === asset.featureLayerName) {
                            if (statElementType === 'AREA') {
                                //fieldValue.push(geometryEngine.geodesicArea(asset.feature.geometry, this.areaLengthUnit));
                                fieldValue.push(this.getGeometryArea(asset.feature, this.areaLengthUnit));
                            } else if (statElementType === 'LENGTH') {
                                //fieldValue.push(geometryEngine.geodesicLength(asset.feature.geometry, this.lengthUnit));
                                fieldValue.push(this.getGeometryLength(asset.feature, this.lengthUnit));

                            } else if (statElementType === 'COUNT') {
                                count = count + 1;

                            } else {
                                fieldValue.push(Number(asset.feature.attributes[statElementField]));
                            }
                        }
                    }));
                }));


                if (statElementType === 'AREA') {
                    for (i = 0; i < fieldValue.length; i++) {
                        statValue = parseFloat((statValue + fieldValue[i]).toFixed(2));
                    }
                } else if (statElementType === 'AVG') {
                    for (i = 0; i < fieldValue.length; i++) {
                        statValue = statValue + fieldValue[i];
                    }
                    if (fieldValue.length !== 0) {
                        statValue = parseFloat((statValue / fieldValue.length).toFixed(2));
                    } else {
                        statValue = 0;
                    }

                } else if (statElementType === 'COUNT') {
                    statValue = count;
                } else if (statElementType === 'LENGTH') {
                    for (i = 0; i < fieldValue.length; i++) {
                        statValue = parseFloat((statValue + fieldValue[i]).toFixed(2));
                    }
                } else if (statElementType === 'MAX') {
                    statValue = Math.max.apply(Math, fieldValue);

                } else if (statElementType === 'MIN') {
                    statValue = Math.min.apply(Math, fieldValue);
                } else if (statElementType === 'SUM') {
                    for (i = 0; i < fieldValue.length; i++) {
                        statValue = parseFloat((statValue + fieldValue[i]).toFixed(2));
                    }

                }

                return statValue;
            },

            //Add New Statistics Row
            addNewStatisticsRow: function () {
                this._addStatisticsRow();
                setTimeout(lang.hitch(this, this.resize), 100);
            },

            //Delete Statistics Row
            deleteStatisticsRow: function () {
                var selectedRow = this.moreStatisticsTable.getSelectedRow();
                if ((selectedRow !== undefined) || (selectedRow !== null)) {
                    this.moreStatisticsTable.deleteRow(selectedRow);
                }
            },

            //Up Statistics Row
            upStatisticsRow: function () {
                var selectedRow = this.moreStatisticsTable.getSelectedRow();

                if ((selectedRow === undefined) || (selectedRow === null) || (selectedRow.rowIndex === 0)) {
                    return;
                }

                var previousTr = selectedRow.previousSibling;
                this.moreStatisticsTable.tableInBodySection.childNodes[1].removeChild(selectedRow);
                this.moreStatisticsTable.tableInBodySection.childNodes[1].insertBefore(selectedRow, previousTr);
            },

            //Down Statistics Row
            downStatisticsRow: function () {

                var selectedRow = this.moreStatisticsTable.getSelectedRow();

                if ((selectedRow === undefined) || (selectedRow === null) || (selectedRow.rowIndex === this.moreStatisticsTable.tableInBodySection.rows.length - 1)) {
                    return;
                }

                var nextTr = selectedRow.nextSibling;
                this.moreStatisticsTable.tableInBodySection.childNodes[1].removeChild(nextTr);
                this.moreStatisticsTable.tableInBodySection.childNodes[1].insertBefore(nextTr, selectedRow);
            },

            _addStatisticsRow: function () {
                var result = this.moreStatisticsTable.addRow({});
                if (result.success && result.tr) {
                    var tr = result.tr;
                    tr.selectTypes = [];
                    this._addStatLayerNames(tr);
                    this._addStatTypes(tr);
                    this._addStatFields(tr);
                    this._addStatLabel(tr);
                }
            },

            _addStatLayerNames: function (tr) {

                var editableLayers = Common.getLayers(this.map, this.config.editor.layerInfos);

                var statLayer = [];

                array.forEach(editableLayers, function (layer) {
                    statLayer.push({
                        label: layer.featureLayer.name,
                        value: layer.featureLayer.name
                    });
                });

                var layerOptions = lang.clone(statLayer);
                var td = query('.simple-table-cell', tr)[0];
                if (td) {
                    html.setStyle(td, "verticalAlign", "middle");
                    var layerNames = new Select({
                        style: {
                            width: "100%",
                            height: "22px"
                        },
                        class: "smallSelect",
                        options: layerOptions
                    });
                    layerNames.placeAt(td);
                    layerNames.startup();
                    tr.selectTypes[0] = layerNames;

                    tr.selectTypes[0].on('change', lang.hitch(this, function (evt) {

                        setTimeout(lang.hitch(this, this.resize), 100);

                        //populate statistics type according to geometry
                        var editableLayers = Common.getLayers(this.map, this.config.editor.layerInfos);
                        array.forEach(editableLayers, lang.hitch(this, function (layer) {
                            if (layer.featureLayer.name === tr.selectTypes[0].value) {
                                if (layer.featureLayer.geometryType === "esriGeometryPoint") {
                                    tr.selectTypes[1].destroy();
                                    this._addStatTypes(tr);
                                } else if (layer.featureLayer.geometryType === "esriGeometryPolyline") {
                                    tr.selectTypes[1].destroy();
                                    this._addStatTypes(tr);
                                } else {
                                    tr.selectTypes[1].destroy();
                                    this._addStatTypes(tr);
                                }
                            }

                        }));

                        //populate field Name
                        if (tr.selectTypes[1].value === 'AREA' || tr.selectTypes[1].value === 'COUNT' || tr.selectTypes[1].value === 'LENGTH') {
                            this.statLayerFields = [];
                            tr.selectTypes[2].destroy();
                            this._addStatFields(tr);
                        } else {

                            this.populateStatLayerFields(evt);
                            tr.selectTypes[2].destroy();
                            this._addStatFields(tr);
                        }
                    }));
                }
            },

            _addStatTypes: function (tr) {

                //Statistics Type for Point Geometry
                var statisticsTypesPointGeometry = [{
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

                //Statistics Type for Polyline Geometry
                var statisticsTypesPolylineGeometry = [{
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

                //Statistics Type for Polygon Geometry
                var statisticsTypesPolygonGeometry = [{
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

                var statTypeOptions;
                var editableLayers = Common.getLayers(this.map, this.config.editor.layerInfos);

                array.forEach(editableLayers, lang.hitch(this, function (layer) {
                    if (layer.featureLayer.name === tr.selectTypes[0].value) {
                        if (layer.featureLayer.geometryType === "esriGeometryPoint") {
                            statTypeOptions = lang.clone(statisticsTypesPointGeometry);
                        } else if (layer.featureLayer.geometryType === "esriGeometryPolyline") {
                            statTypeOptions = lang.clone(statisticsTypesPolylineGeometry);
                        } else {
                            statTypeOptions = lang.clone(statisticsTypesPolygonGeometry);
                        }
                    }

                }));

                //var statTypeOptions = lang.clone(statisticsTypes);
                var td = query('.simple-table-cell', tr)[1];
                if (td) {
                    html.setStyle(td, "verticalAlign", "middle");
                    var statTypes = new Select({
                        style: {
                            width: "100%",
                            height: "22px"
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
                        this.populateStatLayerFields(tr.selectTypes[0].value);
                    }

                    tr.selectTypes[1].on('change', lang.hitch(this, function (evt) {

                        setTimeout(lang.hitch(this, this.resize), 100);
                        if (tr.selectTypes[1].value === 'AREA' || tr.selectTypes[1].value === 'COUNT' || tr.selectTypes[1].value === 'LENGTH') {
                            this.statLayerFields = [];
                            tr.selectTypes[2].destroy();
                            this._addStatFields(tr);
                        } else {
                            this.populateStatLayerFields(tr.selectTypes[0].value);
                            tr.selectTypes[2].destroy();
                            this._addStatFields(tr);
                        }
                    }));
                }
            },

            _addStatFields: function (tr) {
                var fieldsOptions = lang.clone(this.statLayerFields);
                var td = query('.simple-table-cell', tr)[2];
                if (td) {
                    html.setStyle(td, "verticalAlign", "middle");
                    var fields = new Select({
                        style: {
                            width: "100%",
                            height: "22px"
                        },
                        class: "smallSelect",
                        options: fieldsOptions
                    });
                    fields.placeAt(td);
                    fields.startup();
                    tr.selectTypes[2] = fields;

                    if (tr.selectTypes[1].value === 'AREA' || tr.selectTypes[1].value === 'COUNT' || tr.selectTypes[1].value === 'LENGTH') {
                        tr.selectTypes[2].disabled = true;

                    }

                    tr.selectTypes[2].on('change', lang.hitch(this, function (evt) {
                        setTimeout(lang.hitch(this, this.resize), 100);
                    }));
                }
            },

            _addStatLabel: function (tr) {
                var td = query('.simple-table-cell', tr)[3];
                html.setStyle(td, "verticalAlign", "middle");
                var statLabelTextBox = new ValidationTextBox({
                    style: {
                        width: "100%",
                        height: "25px"
                    }
                });
                statLabelTextBox.placeAt(td);
                statLabelTextBox.startup();
                tr.labelText = statLabelTextBox;
            },

            populateStatLayerFields: function (layerName) {

                var editableLayers = Common.getLayers(this.map, this.config.editor.layerInfos);

                var selectedStatFeatureLayer;

                for (i = 0; i < editableLayers.length; i++) {
                    if (layerName === editableLayers[i].featureLayer.name) {
                        selectedStatFeatureLayer = editableLayers[i];
                        break;
                    }
                }

                var fieldInfos = selectedStatFeatureLayer.fieldInfos;
                this.statLayerFields = [];

                array.forEach(fieldInfos, lang.hitch(this, function (fieldInfo) {
                    if (fieldInfo.field.type === "esriFieldTypeInteger" || fieldInfo.field.type === "esriFieldTypeDouble") {
                        this.statLayerFields.push({
                            label: fieldInfo.field.alias,
                            value: fieldInfo.field.name
                        });
                    }

                }));
            },

            //add more statistics to config statistics
            _addMoreStatisticsToConfigStatistics: function () {
                this.newStatisticsFields = {};

                var newStatisticsTrs = this.moreStatisticsTable.getRows();
                var flds = [];

                array.forEach(newStatisticsTrs, lang.hitch(this, function (statTr) {
                    var selectLayers = statTr.selectTypes[0];
                    var selectTypes = statTr.selectTypes[1];
                    var selectFields = statTr.selectTypes[2];
                    var statLabels = statTr.labelText;
                    var field = {
                        layer: selectLayers.value,
                        type: selectTypes.value,
                        field: selectFields.value,
                        label: statLabels.value
                    };
                    flds.push(field);
                }));

                lang.mixin(this.newStatisticsFields, {
                    fields: flds
                });
            },

            resizeNewStatSelect: function () {

                var selectDropDownBoxes = query(".smallSelect", this.moreStatisticsTable.domNode);
                var statSelectBoxButtonText = query(".dijitButtonText", this.moreStatisticsTable.domNode);
                if (selectDropDownBoxes.length !== 0) {
                    var selectDropDownBoxWidth = html.getMarginBox(selectDropDownBoxes[0]).w;


                    var statSelectBoxes = query(".dijitSelectLabel", this.moreStatisticsTable.domNode);
                    for (var i = 0; i < statSelectBoxes.length; i++) {
                        var newWidth = (selectDropDownBoxWidth * 0.62).toFixed(0);
                        statSelectBoxes[i].style.width = newWidth + "px";
                        statSelectBoxButtonText[i].style.width = "61px";

                    }
                }
            },


            //create dynamically content for project layer
            _createProjectAttributeElement: function () {

                this.editProjectAttribElementTextbox = [];
                this.editProjectAttribElementSelectBox = [];

                var projectAttribEditDiv = dom.byId("projectAttributeEditTable");

                if (projectAttribEditDiv.children.length > 0) {
                    projectAttribEditDiv.removeChild(projectAttribEditDiv.firstElementChild);
                }

                var table = document.createElement('table');
                table.setAttribute('class', 'project-attrib-edit-table input-table');

                var tableBody = document.createElement('tbody');
                table.appendChild(tableBody);

                //create edit project attrib label from config statistics
                array.forEach(projectDetail.projectfieldAttrib, lang.hitch(this, function (attrib) {

                    if (attrib.fieldName.toUpperCase() !== this.projectIdFldName.toUpperCase()) {

                        //create label for statistics label
                        var trLabel = document.createElement('tr');
                        tableBody.appendChild(trLabel);
                        tdLabel = document.createElement('td');

                        var label1 = document.createElement("Label");
                        label1.for = "text" + attrib.fieldName;
                        label1.innerHTML = attrib.fieldAlias + " : ";
                        tdLabel.appendChild(label1);
                        trLabel.appendChild(tdLabel);

                        //create ready only textbox
                        var trTextBox = document.createElement('tr');
                        tableBody.appendChild(trTextBox);
                        tdTextBox = document.createElement('td');

                        trTextBox.appendChild(tdTextBox);

                    }
                }));

                projectAttribEditDiv.appendChild(table);

                var index = 0;
                var txtboxCounter = 0;
                var selectBoxCounter = 0;
                for (i = 0; i < projectAttribEditDiv.childNodes[1].childNodes[0].children.length; i++) {

                    if (projectAttribEditDiv.childNodes[1].childNodes[0].childNodes[i].childNodes[0].childNodes[0] === undefined) {
                        if (projectDetail.projectfieldAttrib[index].fieldName.toUpperCase() === this.projectIdFldName.toUpperCase()) {
                            index = index + 1;
                        }
                        if (projectDetail.projectfieldAttrib[index].fieldDomain !== null && projectDetail.projectfieldAttrib[index].fieldDomain !== undefined) {
                            this.editProjectAttribElementSelectBox[selectBoxCounter] = new Select({

                                id: "editProjectAttribElementSelectBox" + selectBoxCounter,
                                name: "editProjectAttribElementSelectBox" + " " + selectBoxCounter,
                                style: {
                                    width: "100%",
                                    height: "30px"
                                },

                            }, projectAttribEditDiv.childNodes[1].childNodes[0].childNodes[i].childNodes[0]);

                            var data = {
                                identifier: 'value',
                                items: [],
                                label: 'name'
                            };
                            for (var dataCounter = 0; dataCounter < projectDetail.projectfieldAttrib[index].fieldDomain.codedValues.length; dataCounter++) {
                                data.items.push(lang.mixin({
                                    "value": projectDetail.projectfieldAttrib[index].fieldDomain.codedValues[dataCounter].code
                                }, {
                                    "name": projectDetail.projectfieldAttrib[index].fieldDomain.codedValues[dataCounter].name
                                }));
                            }
                            var domainStore = new Memory({
                                data: data,
                                idProperty: "value"
                            });
                            this.editProjectAttribElementSelectBox[selectBoxCounter].set("labelAttr", "name");
                            this.editProjectAttribElementSelectBox[selectBoxCounter].setStore(domainStore);

                            if (projectDetail.projectfieldAttrib[index].fieldValue !== undefined) {
                                this.editProjectAttribElementSelectBox[selectBoxCounter].set("value", projectDetail.projectfieldAttrib[index].fieldValue);
                            }

                            index = index + 1;
                            selectBoxCounter++;
                        } else {
                            if ((projectDetail.projectfieldAttrib[index].fieldType === 'esriFieldTypeSmallInteger') || (projectDetail.projectfieldAttrib[index].fieldType === 'esriFieldTypeDouble')) {
                                if (projectDetail.projectfieldAttrib[index].fieldReadOnly) {
                                    this.editProjectAttribElementTextbox[txtboxCounter] = new NumberTextBox({
                                        id: "editProjectAttribTextBox" + txtboxCounter,
                                        name: "editProjectAttribTextBox" + " " + txtboxCounter,
                                        readonly: true,
                                        value: (projectDetail.projectfieldAttrib[index].fieldValue === undefined ? 0 : projectDetail.projectfieldAttrib[index].fieldValue),
                                        class: "projectAttribInputDisable",
                                    }, projectAttribEditDiv.childNodes[1].childNodes[0].childNodes[i].childNodes[0]);

                                    index = index + 1;
                                    txtboxCounter++;
                                } else {
                                    this.editProjectAttribElementTextbox[txtboxCounter] = new NumberTextBox({
                                        id: "editProjectAttribTextBox" + txtboxCounter,
                                        name: "editProjectAttribTextBox" + " " + txtboxCounter,
                                        value: (projectDetail.projectfieldAttrib[index].fieldValue === undefined ? 0 : projectDetail.projectfieldAttrib[index].fieldValue),
                                        class: "projectAttribInput",
                                    }, projectAttribEditDiv.childNodes[1].childNodes[0].childNodes[i].childNodes[0]);

                                    index = index + 1;
                                    txtboxCounter++;
                                }

                            } else if (projectDetail.projectfieldAttrib[index].fieldType === 'esriFieldTypeDate') {

                                this.editProjectAttribElementTextbox[txtboxCounter] = new DateTextBox({
                                    id: "editProjectAttribTextBox" + txtboxCounter,
                                    name: "editProjectAttribTextBox" + " " + txtboxCounter,
                                    //readonly: true,

                                    value: (projectDetail.projectfieldAttrib[index].fieldValue === undefined ? new Date() : new Date(projectDetail.projectfieldAttrib[index].fieldValue)),
                                    class: "projectAttribInput",
                                }, projectAttribEditDiv.childNodes[1].childNodes[0].childNodes[i].childNodes[0]);

                                index = index + 1;
                                txtboxCounter++;

                            } else {
                                //field type is esriFieldTypeString
                                if (projectDetail.projectfieldAttrib[index].fieldReadOnly) {

                                    this.editProjectAttribElementTextbox[txtboxCounter] = new TextBox({
                                        id: "editProjectAttribTextBox" + txtboxCounter,
                                        name: "editProjectAttribTextBox" + " " + txtboxCounter,
                                        readonly: true,
                                        value: (projectDetail.projectfieldAttrib[index].fieldValue === undefined ? '' : projectDetail.projectfieldAttrib[index].fieldValue),
                                        class: "projectAttribInputDisable",
                                    }, projectAttribEditDiv.childNodes[1].childNodes[0].childNodes[i].childNodes[0]);

                                    index = index + 1;
                                    txtboxCounter++;
                                } else {
                                    this.editProjectAttribElementTextbox[txtboxCounter] = new TextBox({
                                        id: "editProjectAttribTextBox" + txtboxCounter,
                                        name: "editProjectAttribTextBox" + " " + txtboxCounter,
                                        value: (projectDetail.projectfieldAttrib[index].fieldValue === undefined ? '' : projectDetail.projectfieldAttrib[index].fieldValue),
                                        class: "projectAttribInput",
                                    }, projectAttribEditDiv.childNodes[1].childNodes[0].childNodes[i].childNodes[0]);

                                    index = index + 1;
                                    txtboxCounter++;
                                }
                            }
                        }
                    }
                }
            },

            getShortDate: function (date) {
                var newDate = "";
                var day = date.getDay();
                if (day.length < 2)
                    day = "0" + day;
                var month = date.getMonth() + 1;
                if (month.length < 2)
                    month = "0" + month;
                var year = date.getYear().toString();
                year = year.substring(1, year.length);
                newDate = day + "-" + month + "-" + year;
                return newDate;

            },

            //get editable project layer field value
            _getprojectEditAttribValue: function (projectAttribField) {

                var attribValue;
                var attribReadOnly;


                for (var i = 0; i < this.projectLayerConfigFields.fields.length; i++) {
                    if (this.projectLayerConfigFields.fields[i].fieldDescription.toUpperCase() === 'NAME') {
                        if (projectAttribField.name.toUpperCase() === this.projectLayerConfigFields.fields[i].layerFieldName.toUpperCase()) {
                            attribValue = this.projectNameText.value;
                            attribReadOnly = false;
                            return [attribValue, attribReadOnly];
                        }
                    }
                    if (this.projectLayerConfigFields.fields[i].fieldDescription.toUpperCase() === 'DESCRIPTION') {
                        if (projectAttribField.name.toUpperCase() === this.projectLayerConfigFields.fields[i].layerFieldName.toUpperCase()) {
                            attribValue = this.projectDescriptionText.value;
                            attribReadOnly = false;
                            return [attribValue, attribReadOnly];
                        }
                    }
                    if (this.projectLayerConfigFields.fields[i].fieldDescription.toUpperCase() === 'TOTAL COST') {
                        if (projectAttribField.name.toUpperCase() === this.projectLayerConfigFields.fields[i].layerFieldName.toUpperCase()) {
                            attribValue = parseFloat((this.totalAssetCost.innerHTML).replace(/\,/g, ''));
                            attribReadOnly = true;
                            return [attribValue, attribReadOnly];

                        }
                    }
                    if (this.projectLayerConfigFields.fields[i].fieldDescription.toUpperCase() === 'GROSS COST') {
                        if (projectAttribField.name.toUpperCase() === this.projectLayerConfigFields.fields[i].layerFieldName.toUpperCase()) {
                            attribValue = parseFloat((this.grossProjectCost.innerHTML).replace(/\,/g, ''));
                            attribReadOnly = true;
                            return [attribValue, attribReadOnly];

                        }
                    }
                }
                if ((projectAttribField.type === 'esriFieldTypeSmallInteger') || (projectAttribField.type === 'esriFieldTypeDouble')) {
                    attribValue = parseFloat('0');
                } else if (projectAttribField.type === 'esriFieldTypeDate') {
                    attribValue = new Date();
                } else {
                    attribValue = '';
                }
                attribReadOnly = projectAttribField.fieldReadOnly;
                return [attribValue, attribReadOnly];
            },

            //store project field attribute on click OK button
            _storeEditProjectAtrrib: function () {
                var length = this.editProjectAttribElementTextbox.length + this.editProjectAttribElementSelectBox.length;
                var txtbxCounter = 0;
                var selectbxCounter = 0;

                for (i = 0; i < length; i++) {
                    if (projectDetail.projectfieldAttrib[i].fieldName === this.projectIdFldName) {
                        projectDetail.projectfieldAttrib[i].fieldValue = '';

                    } else if (projectDetail.projectfieldAttrib[i].fieldName === this.projectNameFldName) {
                        projectDetail.projectName = this.editProjectAttribElementTextbox[txtbxCounter].value;
                        txtbxCounter++;
                    } else if (projectDetail.projectfieldAttrib[i].fieldName === this.projectDescriptionFldName) {
                        projectDetail.projectDesc = this.editProjectAttribElementTextbox[txtbxCounter].value;
                        projectDetail.projectfieldAttrib[i].fieldValue = this.editProjectAttribElementTextbox[txtbxCounter].value;
                        txtbxCounter++;
                    } else if (projectDetail.projectfieldAttrib[i].fieldDomain !== null && projectDetail.projectfieldAttrib[i].fieldDomain !== undefined) {

                        if ((projectDetail.projectfieldAttrib[i].fieldType === 'esriFieldTypeSmallInteger') || (projectDetail.projectfieldAttrib[i].fieldType === 'esriFieldTypeDouble')) {
                            projectDetail.projectfieldAttrib[i].fieldValue = parseFloat(this.editProjectAttribElementSelectBox[selectbxCounter].value);
                        } else {
                            projectDetail.projectfieldAttrib[i].fieldValue = this.editProjectAttribElementSelectBox[selectbxCounter].value;
                        }
                        selectbxCounter++;
                    } else {
                        if ((projectDetail.projectfieldAttrib[i].fieldType === 'esriFieldTypeSmallInteger') || (projectDetail.projectfieldAttrib[i].fieldType === 'esriFieldTypeDouble')) {

                            projectDetail.projectfieldAttrib[i].fieldValue = parseFloat(this.editProjectAttribElementTextbox[txtbxCounter].value);
                        } else if (projectDetail.projectfieldAttrib[i].fieldType === 'esriFieldTypeDate') {

                            projectDetail.projectfieldAttrib[i].fieldValue = this.editProjectAttribElementTextbox[txtbxCounter].value;
                        } else {
                            projectDetail.projectfieldAttrib[i].fieldValue = this.editProjectAttribElementTextbox[txtbxCounter].value;
                        }
                        txtbxCounter++;
                    }
                }
            },

            _getGeography: function (geometry) {

                var query = new Query();
                query.geometry = geometry;
                query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
                query.returnGeometry = true;
                query.outFields = ["*"];

                var qt = new QueryTask(this.costingGeometryLayer.url);
                qt.execute(query, lang.hitch(this,
                    this._getGeographyRelated2Project), this._queryError);
            },

            // query results for Geographies related to the project
            _getGeographyRelated2Project: function (results) {

                var geographyfeatures = [];
                var i = 0;
                var isEqual = false;
                for (i = 0; i < results.features.length; i++) {
                    //geographyfeatures.push(results.features[i]);
                    if (!this._checkEqualGeography(projectDetail.geographyFeatures, results.features[i])) {
                        projectDetail.geographyFeatures.push(results.features[i]);
                    }
                    if (!this._checkEqualGeography(this.geographyFeaturesOfAsset, results.features[i])) {
                        this.geographyFeaturesOfAsset.push(results.features[i]);
                    }
                }

                if (!this.isLoadOrphanData) {

                    var query = this._getQueryObj();
                    var qt = new QueryTask(this.projectMultiplierAdditionalCostFeatureLayer.url);
                    qt.execute(query, lang.hitch(this, this._getProjectAdditionDetails), this._queryError);
                }
            },

            _checkEqualGeography: function (geometries, sourceGeom) {
                var isEqual = false;
                var geographyId = Common.getFieldvalue(sourceGeom.attributes, 'COSTGEOMID');
                for (var i = 0; i < geometries.length; i++) {
                    var geoId = Common.getFieldvalue(geometries[i].attributes, 'COSTGEOMID');
                    if (geoId === geographyId) {
                        isEqual = true;
                        break;
                    }

                }
                return isEqual;
            },

            // get query object for getting all the records 
            //from projectMultiplierAdditionalCost FeatureLayer

            _getQueryObj: function () {
                var projId = '';
                for (var fieldCounter = 0; fieldCounter < this.projectMultiplierAdditionalCostFeatureLayer.fields.length; fieldCounter++) {
                    if (this.projectMultiplierAdditionalCostFeatureLayer.fields[fieldCounter].name.toUpperCase() === 'PROJECTID') {
                        projId = this.projectMultiplierAdditionalCostFeatureLayer.fields[fieldCounter].name;
                        break;
                    }
                }
                var query = new Query();

                query.where = projId + " = '" + projectDetail.projectId + "'";
                query.returnGeometry = false;
                query.outFields = ["*"];

                return query;
            },

            _getProjectAdditionDetails: function (results) {

                var projectAddlnCostMultiplierDetailsArray = [];
                for (var i = 0; i < results.features.length; i++) {

                    var projectAddlnCostMultiplierDetails = {
                        description: '',
                        value: '',
                        type: '',
                        index: ''

                    };
                    var description = Common.getFieldvalue(results.features[i].attributes, 'DESCRIPTION');
                    var value = Common.getFieldvalue(results.features[i].attributes, 'Value');

                    var type = Common.getFieldvalue(results.features[i].attributes, 'TYPE');
                    var index = Common.getFieldvalue(results.features[i].attributes, 'ESCALATIONINDEX');

                    projectAddlnCostMultiplierDetails.description = description;
                    projectAddlnCostMultiplierDetails.value = value;
                    projectAddlnCostMultiplierDetails.type = type;
                    projectAddlnCostMultiplierDetails.index = index;

                    projectAddlnCostMultiplierDetailsArray.push(projectAddlnCostMultiplierDetails);
                }

                projectDetail.projectAddlnCostMultiplierDetails = projectAddlnCostMultiplierDetailsArray;
                this._sortProjectAddlnCostMultiplierDetails();
                projectDetail.projectAddlnCostMultiplierfeatures = results.features;
                this.onOpen();
            },

            // to get template Name for individual feature
            _getTemplateName: function (featureLayer, feature) {
                var templateIdFldName = Common.getFieldNameFromLayer(featureLayer, 'TEMPLATEID');
                var featureTemplate = feature.attributes[templateIdFldName];
                if (featureTemplate === null || featureTemplate === undefined) {
                    return null;
                }
                var i = 0;
                if (featureLayer.templates.length > 0) {
                    for (i = 0; i < featureLayer.templates.length; i++) {
                        if (featureTemplate === featureLayer.templates[i].prototype.attributes[templateIdFldName]) {
                            this.assetTypeTemplate = featureLayer.templates[i].name; //prototype.attributes[templateIdFldName];
                            return this.assetTypeTemplate;
                        }
                    }
                } else {
                    for (i = 0; i < featureLayer.types.length; i++) { //target.types[0].templates[0].prototype.attributes
                        if (featureTemplate === featureLayer.types[i].templates[0].prototype.attributes[templateIdFldName]) {
                            this.assetTypeTemplate = featureLayer.types[i].templates[0].name;
                            return this.assetTypeTemplate;
                        }
                    }
                }
                return null;
            },

            _getUnitCostQuery: function (assetsArray) {

                var costqueryString = '';
                var counter = 1;
                var costingTable = Common.getFlatTables(this.projectTables, this.lookupTable);
                var deferredqueryArray = [];
                var query = new Query();
                query.returnGeometry = false;
                query.outFields = ["*"];

                for (var i = 0; i < assetsArray.length; i++) {

                    var initialCostIdFldName = Common.getActualFieldName(assetsArray[i].feature.attributes, 'INITIALCOSTID');
                    var intialCostValue = assetsArray[i].initialCostId;
                    var geographyIdFldName = Common.getFieldNameFromLayer(this.costingGeometryLayer, 'COSTGEOMID');
                    var geographyid = assetsArray[i].geographyId;

                    var geographyWhereClause = "";
                    if (geographyid === null || geographyid === undefined) {
                        geographyWhereClause = geographyIdFldName + " IS NULL ";
                    } else {
                        geographyWhereClause = geographyIdFldName + " = '" + geographyid + "'";
                    }
                    var subGeomFld = 'EQUATIONTYPE'; //Common.getFieldNameFromLayer(this.costingGeometryLayer, 'EQUATIONTYPE');
                    var subGeomId = assetsArray[i].subGeoId;

                    var subGeomWhereClause = "";

                    if (subGeomId === null || subGeomId === undefined) {
                        subGeomWhereClause = subGeomFld + " IS NULL ";
                    } else {
                        subGeomWhereClause = subGeomFld + " = '" + subGeomId + "'";
                    }
                    if (this.isLoadOrphanData) {

                        if (costqueryString.indexOf(initialCostIdFldName + " = '" + intialCostValue + "' AND " + geographyWhereClause) == -1) {
                            costqueryString = (costqueryString === '' ? '' : costqueryString + ' OR ') + initialCostIdFldName + " = '" + intialCostValue + "' AND " + geographyWhereClause;
                        }
                    } else {
                        if (costqueryString.indexOf(initialCostIdFldName + " = '" + intialCostValue + "' AND " + geographyWhereClause + " AND " + subGeomWhereClause) == -1) {
                            costqueryString = (costqueryString === '' ? '' : costqueryString + ' OR ') + initialCostIdFldName + " = '" + intialCostValue + "' AND " + geographyWhereClause + " AND " + subGeomWhereClause;
                        }
                    }

                    counter++;
                    // we break this query for 50 features at a time
                    if (counter === 50 || i == assetsArray.length - 1) {
                        // query for getting unit cost and initial cost equation for particular feature
                        query.where = costqueryString;
                        var qt = new QueryTask(costingTable.url);
                        deferredqueryArray.push(qt.execute(query));
                        costqueryString = '';
                        counter = 1;
                    }

                }
                // for getting unit cost and initial cost equation for particular feature
                all(deferredqueryArray).then(lang.hitch(this, this._getUnitCost, assetsArray), this._queryErrorOnPromise);
            },

            // to get unit cost and default equation from CostingTable for individual feature
            _getUnitCost: function (assetsArray, results) {

                var initialCostValue = '';
                var geographyid = '';
                var unitCost = null;
                var initialCostEquation = '';
                var subGeomId = '';

                for (var i = 0; i < results.length; i++) {
                    for (var j = 0; j < results[i].features.length; j++) {
                        initialCostValue = Common.getFieldvalue(results[i].features[j].attributes, 'INITIALCOSTID');
                        unitCost = Common.getFieldvalue(results[i].features[j].attributes, 'UNITCOST');
                        initialCostEquation = Common.getFieldvalue(results[i].features[j].attributes, 'COSTEQUATION');
                        geographyid = Common.getFieldvalue(results[i].features[j].attributes, 'COSTGEOMID');
                        subGeomId = Common.getFieldvalue(results[i].features[j].attributes, 'EQUATIONTYPE');

                        for (var k = 0; k < assetsArray.length; k++) {
                            if (!this.isLoadOrphanData) {
                                if (assetsArray[k].initialCostId == initialCostValue && assetsArray[k].geographyId === geographyid && assetsArray[k].subGeoId === subGeomId) {
                                    assetsArray[k].unitCost = unitCost;
                                    assetsArray[k].defaultCostEquation = initialCostEquation;
                                    assetsArray[k].initialAssetCost = this._computeCost(initialCostEquation, unitCost, assetsArray[k].measure);
                                    assetsArray[k].modifiedAssetCost = this._computeCost(assetsArray[k].modifiedCostEquation, unitCost, assetsArray[k].measure);
                                }
                            } else {
                                if (assetsArray[k].initialCostId == initialCostValue && assetsArray[k].geographyId === geographyid) {
                                    assetsArray[k].unitCost = unitCost;
                                    assetsArray[k].defaultCostEquation = initialCostEquation;
                                    assetsArray[k].initialAssetCost = this._computeCost(initialCostEquation, unitCost, assetsArray[k].measure);
                                    assetsArray[k].modifiedCostEquation = initialCostEquation;
                                    assetsArray[k].modifiedAssetCost = this._computeCost(initialCostEquation, unitCost, assetsArray[k].measure);
                                    assetsArray[k].subGeoId = subGeomId;

                                }
                            }
                        }
                    }
                }

                this._computeAssetDescription(assetsArray);
            },


            // Compute cost for asset according to cost equation
            _computeCost: function (equation, unitCost, totalQuantity) {

                if ((unitCost !== undefined && unitCost !== null) && (equation !== undefined && equation !== null) && (totalQuantity !== undefined && totalQuantity !== null)) {

                    //replace default UnitCost value in cost equation by Unitcost field
                    replaceUnitCostInCostEQT = equation.replace(/{UNITCOST}/gi, unitCost);

                    replaceQuantityInCostEQT = replaceUnitCostInCostEQT.replace(/{QUANTITY}/gi, totalQuantity);

                    replaceCountInCostEQT = replaceQuantityInCostEQT.replace(/{COUNT}/gi, 1);

                    solveCostEQT = eval(replaceCountInCostEQT);

                    return solveCostEQT;
                }
                //                new Message({
                //                    message: this.nls.costEquationErrorMsg
                //                });
                console.log(this.nls.costEquationErrorMsg);
                return 0.0;

            },

            // to get modified costing equation from PROJECTGROUPCOSTINGINFO Table for individual feature 
            _getPrjGrpCostInfo: function (assetsArray, results) {

                var prjgrpcostfldValue = '';
                var modifiedEquation = '';
                var subGeomid = '';
                for (var i = 0; i < results.length; i++) {
                    for (var j = 0; j < results[i].features.length; j++) {
                        prjgrpcostfldValue = Common.getFieldvalue(results[i].features[j].attributes, 'PROJECTGROUPCOSTINGINFOID');
                        modifiedEquation = Common.getFieldvalue(results[i].features[j].attributes, 'GROUPCOSTEQUATION');
                        subGeomid = Common.getFieldvalue(results[i].features[j].attributes, 'EQUATIONTYPE');
                        for (var k = 0; k < assetsArray.length; k++) {
                            if (assetsArray[k].projectGroupCostingId === prjgrpcostfldValue) {
                                assetsArray[k].projectGroupCostingFeature = results[i].features[j];
                                assetsArray[k].modifiedCostEquation = modifiedEquation;
                                assetsArray[k].modifiedAssetCost = assetsArray[k].unitCost === null ? 0 : this._computeCost(modifiedEquation, assetsArray[k].unitCost, assetsArray[k].measure);
                                assetsArray[k].subGeoId = subGeomid;
                                //break;
                            }
                        }
                    }
                }

                this._getUnitCostQuery(assetsArray);
                //this.onOpen();
            },

            //fill asset description grid
            _computeAssetDescription: function (assetsArray) {

                for (var i = 0; i < assetsArray.length; i++) {
                    if (assetsArray[i].feature.geometry.type === 'polyline') {
                        var length = this.getGeometryLength(assetsArray[i].feature);
                        measurement = Math.abs(length.toFixed(2));
                        assetsArray[i].measure = measurement;

                    } else if (assetsArray[i].feature.geometry.type === 'polygon') {
                        var area = this.getGeometryArea(assetsArray[i].feature);
                        measurement = Math.abs(area.toFixed(2));
                        assetsArray[i].measure = measurement;
                    } else { // Point
                        //this.afterCalcComplete(feature, target, 1);
                        assetsArray[i].measure = 1;
                    }

                    this.featureStorage[assetsArray[i].featureLayerId].addedFeatures.push(assetsArray[i]);
                    this.featureStorageCount++;
                    if (!this.isLoadProject && this.geographyFeaturesOfAsset.length > 1 && assetsArray[i].feature.geometry.type !== 'point') {

                        this._getSplittedFeature(assetsArray[i]);

                    }

                    if (this.isLoadOrphanData) {
                        this.updateSaveClearSessionBtn();
                    }

                    this._fillAssetDescriptionGrid(assetsArray[i], assetsArray[i].measure);
                }


                // if feature splits between two geography create two new feature and delte old feature
                if (this.splittedFeatures.length > 0) {
                    for (var i = 0; i < this.splittedFeatures.length; i++) {
                        for (var j = 0; j < AssetdetailsArray.length; j++) {
                            if (this.splittedFeatures[i].GraphicObjects.length > 0 && this.splittedFeatures[i].Assetdetails.id === AssetdetailsArray[j].id) {
                                var splitedFeatureLayer = Common.getLayerbyTitleFromMap(this.map, this.splittedFeatures[i].Assetdetails.featureLayerName);
                                var features = this.splittedFeatures[i].GraphicObjects;
                                var assetDetails = this.splittedFeatures[i].Assetdetails;
                                this.splittedFeatures = [];
                                splitedFeatureLayer.applyEdits(null, null, [assetDetails.feature], null, this._featureLayerEditsError);
                                splitedFeatureLayer.applyEdits(features, null, null, lang.hitch(this, this.splitFeatureCompletes, splitedFeatureLayer), this._featureLayerEditsError);
                            }
                        }
                    }
                }
                this.shelter.hide();

            },

            splitFeatureCompletes: function (layer, results) {
                var objIdfld = layer.objectIdField;

                var whereClause = objIdfld + " in (";
                for (var i = 0; i < results.length; i++) {
                    whereClause = whereClause + results[i].objectId;
                    if (i == results.length - 1) {
                        whereClause = whereClause + ")";
                    } else {

                        whereClause = whereClause + ",";
                    }

                }
                var query = new Query();
                query.where = whereClause;
                layer.queryFeatures(query, lang.hitch(this, this.queryNewFeatures, layer));

            },

            queryNewFeatures: function (layer, results) {
                var features = [];
                for (var i = 0; i < results.features.length; i++) {
                    features.push(results.features[i]);
                }
                this._addfeature2FeatureArray(features, layer);
            },


            _fillAssetDescriptionGrid: function (assetDetailInProject, measurement) {

                var assetTemplateName = assetDetailInProject.templateName; //this.assetInitialCostIDTemplate;
                var featureGeomtryType = assetDetailInProject.feature.geometry.type; // this.featureGeomtryTypeTemplate;

                var PROJECTGROUPCOSTINGINFOID = this.generateGUID(); //this.prjGrpCostingInfoID;

                var totalCostCalculated;

                //object store to store the value of store in memory
                var objectStore;

                //variable for row value
                var rowDescription;

                var testVals = {};
                var assetDtls = [];
                var totalQuantityinGrid = 0;
                var totalCostinGrid = 0;
                var data;
                var isTypeExists;
                var totalAssetCountInGridRow = 0;
                var i = 0;
                var isNewGrp = false;
                if (this.assetValue.length === 0) {
                    isTypeExists = false;
                    if (!this.isLoadProject)
                        assetDetailInProject.projectGroupCostingId = PROJECTGROUPCOSTINGINFOID;

                } else {

                    for (i = 0; i < this.assetValue.length; i++) {
                        //for (j = 0; j < this.assetValue[i].assetDetails.length; j++) {
                        if (this.assetValue[i].assetDetails[0].templateName.toUpperCase() === assetTemplateName.toUpperCase() && this.assetValue[i].assetDetails[0].featureLayerId === assetDetailInProject.featureLayerId) {

                            isTypeExists = true;
                            totalQuantityinGrid = this.assetValue[i].totalQuantity;
                            totalCostinGrid = this.assetValue[i].totalCost;
                            isNewGrp = this.assetValue[i].isNewGroup;
                            totalAssetCountInGridRow = this.assetValue[i].totalFeatureCount;
                            for (j = 0; j < this.assetValue[i].assetDetails.length; j++) {

                                assetDetailInProject.projectGroupCostingId = this.assetValue[i].assetDetails[0].projectGroupCostingId;
                                if (this.assetValue[i].assetDetails[j].geographyId === assetDetailInProject.geographyId) {
                                    assetDetailInProject.modifiedCostEquation = this.assetValue[i].assetDetails[j].modifiedCostEquation;
                                }
                            }

                            break;
                        }
                    }
                }

                if (isTypeExists) {
                    //if (!testVals[assetInitialCostID]) {
                    //    testVals[assetInitialCostID] = true;

                    totalQuantityinGrid = eval(totalQuantityinGrid + assetDetailInProject.measure);
                    if (assetDetailInProject.modifiedCostEquation === null && assetDetailInProject.modifiedCostEquation === undefined && assetDetailInProject.modifiedCostEquation === '') {
                        assetDetailInProject.modifiedCostEquation = assetDetailInProject.defaultCostEquation;
                    }
                    totalCostCalculated = this._computeCost(assetDetailInProject.modifiedCostEquation, assetDetailInProject.unitCost, assetDetailInProject.measure);
                    assetDetailInProject.modifiedAssetCost = totalCostCalculated;
                    totalCostinGrid = totalCostinGrid + totalCostCalculated;
                    totalAssetCountInGridRow = totalAssetCountInGridRow + 1;

                    if (featureGeomtryType === 'point') {
                        rowDescription = totalQuantityinGrid + " " + assetDetailInProject.templateName + " " + assetDetailInProject.featureLayerName + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostinGrid.toFixed(2));
                    } else if (featureGeomtryType === 'polyline') {
                        rowDescription = totalQuantityinGrid.toFixed(2) + " " + this.lengthUnitDescription + assetDetailInProject.templateName + " " + assetDetailInProject.featureLayerName + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostinGrid.toFixed(2));
                    } else {
                        rowDescription = totalQuantityinGrid.toFixed(2) + " " + this.areaLengthUnitDescription + assetDetailInProject.templateName + " " + assetDetailInProject.featureLayerName + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostinGrid.toFixed(2));
                    }

                    assetDtls = this.assetValue[i].assetDetails;
                    assetDtls.push(assetDetailInProject);
                    this.assetValue[i].description = rowDescription;
                    this.assetValue[i].assetDetails = assetDtls;
                    this.assetValue[i].totalQuantity = totalQuantityinGrid;
                    this.assetValue[i].totalCost = totalCostinGrid;
                    this.assetValue[i].totalFeatureCount = totalAssetCountInGridRow;
                    //this.assetValue[i].layerid = assetDtls.featureLayer.id;
                    this.grid.update();

                    //}
                } else {

                    //if (!testVals[assetInitialCostID]) {
                    //    testVals[assetInitialCostID] = true;

                    totalQuantityinGrid = assetDetailInProject.measure;
                    totalCostCalculated = assetDetailInProject.modifiedAssetCost;

                    if (featureGeomtryType === 'point') {
                        rowDescription = assetDetailInProject.measure + " " + assetDetailInProject.templateName + " " + assetDetailInProject.featureLayerName + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostCalculated.toFixed(2));
                    } else if (featureGeomtryType === 'polyline') {
                        rowDescription = assetDetailInProject.measure.toFixed(2) + " " + this.lengthUnitDescription + assetDetailInProject.templateName + " " + assetDetailInProject.featureLayerName + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostCalculated.toFixed(2));
                    } else {
                        rowDescription = assetDetailInProject.measure.toFixed(2) + " " + this.areaLengthUnitDescription + assetDetailInProject.templateName + " " + assetDetailInProject.featureLayerName + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostCalculated.toFixed(2));
                    }
                    assetDtls = [];
                    assetDetailInProject.projectGroupCostingId = PROJECTGROUPCOSTINGINFOID;

                    if (assetDetailInProject.isNewFeature)
                        isNewGrp = true;
                    assetDtls.push(assetDetailInProject);
                    this.assetValue.push({
                        description: rowDescription,
                        assetDetails: assetDtls,
                        totalQuantity: totalQuantityinGrid,
                        totalCost: assetDetailInProject.modifiedAssetCost,
                        prjGrpCostInfoID: PROJECTGROUPCOSTINGINFOID,
                        layerid: assetDetailInProject.featureLayerId,
                        isNewGroup: isNewGrp,
                        totalFeatureCount: 1
                    });
                    //}
                    data = {
                        identifier: 'name', //This field needs to have unique values
                        label: 'name', //Name field for display. Not pertinent to a grid but may be used elsewhere.
                        items: this.assetValue
                    };

                    objectStore = new Memory({
                        data: data
                    });

                    gridStore = new ObjectStore({
                        objectStore: objectStore
                    });

                    this.grid.setStore(gridStore);
                }

                //calculate actual project cost from grid
                this.projectCostCalculated();
                if (this.isLoadOrphanData) {
                    this.isLoadOrphanData = false;
                }
            },

            // check feature within geography
            _getRelatedGeographyGeometry: function (sourceGeom, geographyFeatures) {

                //                for (var i = 0; i < geographyFeatures.length; i++) {
                //                    if (geometryEngine.within(sourceGeom, geographyFeatures[i].geometry)) {
                //                        return geographyFeatures[i];
                //                    }
                //                }
                //var geographies = [];
                for (var i = 0; i < geographyFeatures.length; i++) {
                    if (geometryEngine.within(sourceGeom, geographyFeatures[i].geometry)) {
                        return geographyFeatures[i];
                    }
                }

                for (var i = 0; i < geographyFeatures.length; i++) {
                    if (geographyFeatures.length === 1) {
                        if (!geometryEngine.crosses(sourceGeom, geographyFeatures[i].geometry)) {
                            if (geometryEngine.touches(sourceGeom, geographyFeatures[i].geometry)) {
                                return null;
                            }
                            //geographies.push(geographyFeatures[i]);
                            //return geographies;

                        } else {
                            return geographyFeatures[i];
                        }

                    } else {
                        if (geometryEngine.crosses(sourceGeom, geographyFeatures[i].geometry)) {
                            return geographyFeatures[i];
                        }
                    }
                }
                return null;
            },

            // get all the project in the selection panel load Project and Delete Project section
            _getProjectsList: function () {
                this.shelter.show();

                var query = new Query();
                // where clause to get all the records of the project
                query.where = "1=1";
                query.returnGeometry = true;
                query.outFields = ["*"];

                var qt = new QueryTask(this.projectCostLayer.url);
                qt.execute(query,
                    lang.hitch(this, this.getProjectFeatures), this._queryError);
            },

            // get project features
            getProjectFeatures: function (results) {
                var selectProject = [];

                //reset projectInfoChooser filtering select
                this.loadProjectInfoChooser.reset();

                for (var i = 0; i < results.features.length; i++) {
                    if (Common.getFieldvalue(results.features[i].attributes, this.projectIdFldName) !== null) {
                        selectProject.push({
                            id: Common.getFieldvalue(results.features[i].attributes, this.projectIdFldName),
                            name: Common.getFieldvalue(results.features[i].attributes, this.projectNameFldName),
                            feature: results.features[i]
                        });
                    }
                }

                ready(function () {
                    var data = {
                        identifier: 'id',
                        items: [],
                        label: 'name'
                    };
                    for (var i = 0; i < selectProject.length; i++) {
                        data.items.push(lang.mixin({
                            "name": selectProject[i].name
                        }, {
                            "id": selectProject[i].id
                        }, {
                            "feature": selectProject[i].feature
                        }));
                    }

                    var projectNameStore = new Memory({
                        data: data
                    });

                    dijit.byId('loadProjectInfoChooser').attr('store', projectNameStore);

                });

                this.isProjectDeleted = false;
                this.shelter.hide();
            },

            // view selected project in map
            viewProjectinMap: function () {
                if (this.loadProjectInfoChooser.item === undefined || this.loadProjectInfoChooser.item === null) {
                    return;
                }

                //on progess bar
                this.shelter.show();

                var projectItem = this.loadProjectInfoChooser.item;

                //define a selection symbol
                var highlightSymbol = new SimpleFillSymbol().setColor(new Color([0, 255, 255]));
                highlightSymbol.setOutline(new SimpleLineSymbol("solid", new Color([0, 0, 0]), 3));
                this.projectCostLayer.setSelectionSymbol(highlightSymbol);

                var query = new Query();
                query.returnGeometry = true;
                query.where = this.projectIdFldName + " = " + "'" + Common.getFieldvalue(projectItem.feature.attributes, this.projectIdFldName) + "'";

                this.projectCostLayer.clearSelection();

                this.projectCostLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, lang.hitch(this, function (features) {
                    //zoom to the selected feature
                    var projectExtent = features[0].geometry.getExtent();
                    this.map.setExtent(projectExtent);

                    //close progess bar on zoom and select complete
                    this.shelter.hide();

                }));
            },

            // delete selected project
            deleteProject: function () {
                if (this.loadProjectInfoChooser.item === undefined || this.loadProjectInfoChooser.item === null) {
                    return;
                }

                this.isProjectDeleted = true;

                this.shelter.show();
                //disable viewProjectInMap Button, deleteProject Button and loadProject Button
                html.addClass(this.viewProjectInMapButton, 'jimu-state-disabled');
                html.addClass(this.deleteProjectButton, 'jimu-state-disabled');
                html.addClass(this.loadProjectButton, 'jimu-state-disabled');

                this.layerCounter = 0;
                this.layers = Common.getLayers(this.map, this.config.editor.layerInfos);
                var projectItem = this.loadProjectInfoChooser.item;
                projectDetail = {
                    projectId: Common.getFieldvalue(projectItem.feature.attributes, this.projectIdFldName),
                    projectName: Common.getFieldvalue(projectItem.feature.attributes, this.projectNameFldName),
                    projectDesc: Common.getFieldvalue(projectItem.feature.attributes, this.projectDescriptionFldName),
                    totalCost: Common.getFieldvalue(projectItem.feature.attributes, this.projectTotalCostFldName),
                    grossCost: Common.getFieldvalue(projectItem.feature.attributes, this.projectGrossCostFldName),
                    projectFeature: projectItem.feature,
                    geographyFeatures: [],
                    projectAddlnCostMultiplierDetails: [],
                    projectAddlnCostMultiplierfeatures: []
                };

                var query = this._getQueryObj();
                var qt = new QueryTask(this.projectMultiplierAdditionalCostFeatureLayer.url);
                qt.execute(query,
                    lang.hitch(this, this._getProjectAdditionDetailsForDelete), this._queryError);
                this._deleteFeatures(null, null);
            },

            _deleteFeatures: function (featureLayer, results) {

                if (featureLayer !== null && results.features.length > 0) {

                    var prjgrpcostfldName = Common.getActualFieldName(results.features[0].attributes, 'PROJECTGROUPCOSTINGINFOID');
                    var isExist = false;
                    for (var featCounter = 0; featCounter < results.features.length; featCounter++) {

                        var prjgrpcostfldValue = results.features[featCounter].attributes[prjgrpcostfldName];
                        var querystr = prjgrpcostfldName + " = '" + prjgrpcostfldValue + "'";

                        for (var i = 0; i < this.grpqueryStringArray.length; i++) {
                            if (this.grpqueryStringArray[i] === querystr) {
                                isExist = true;
                            }
                        }
                        if (!isExist) {
                            this.grpqueryStringArray.push(querystr);
                            isExist = false;
                        }
                    }
                    featureLayer.applyEdits(null, null, results.features, null, this._featureLayerEditsError);
                }



                if (this.layerCounter < this.layers.length) {
                    var projectidField = Common.getFieldNameFromLayer(this.layers[this.layerCounter].featureLayer, 'PROJECTID');
                    var query = new Query();
                    query.returnGeometry = false;
                    query.outFields = ["*"];
                    query.where = projectidField + " = '" + projectDetail.projectId + "'";
                    var qt = new QueryTask(this.layers[this.layerCounter].featureLayer.url);
                    qt.execute(query,
                        lang.hitch(this, this._deleteFeatures, this.layers[this.layerCounter].featureLayer), this._queryError);

                    this.layerCounter++;
                } else {
                    this.layerCounter = 0;
                    //clear highlighted project from project cost layer
                    this.projectCostLayer.clearSelection();
                    this.projectCostLayer.applyEdits(null, null, [projectDetail.projectFeature], null, this._featureLayerEditsError);
                    this._getProjectgrpcostingInfoFeatures();
                    // delete prj grp info table item
                }
            },

            _getProjectgrpcostingInfoFeatures: function () {
                try {
                    var deferredGrpqueryArray = [];
                    var grppromises;
                    var prjGrpCostInfotable = Common.getFlatTables(this.projectTables, this.projectGroupCostingInfoTable);

                    var grpqueryString = '';
                    var counter = 1;
                    for (i = 0; i < this.grpqueryStringArray.length; i++) {

                        grpqueryString = (grpqueryString === '' ? '' : grpqueryString + ' OR ') + this.grpqueryStringArray[i];
                        counter++;
                        // we break this query for 50 features at a time
                        if (counter === 50 || i == this.grpqueryStringArray.length - 1) {
                            // query for getting modified cost equation for particular feature
                            var grpquery = new Query();
                            grpquery.outFields = ["*"];
                            grpquery.where = grpqueryString;

                            var qtgrp = new QueryTask(prjGrpCostInfotable.url);
                            deferredGrpqueryArray.push(qtgrp.execute(grpquery));
                            grpqueryString = '';
                            counter = 1;
                        }
                    }

                    //for getting modified cost equation for particular feature
                    all(deferredGrpqueryArray).then(lang.hitch(this, this._deletePrjGrpCostInfo), this._queryErrorOnPromise);
                } catch (err) {
                    console.log(err);
                }
            },

            // delete all records of projectgroupinfodetail table
            _deletePrjGrpCostInfo: function (results) {
                try {

                    if (results !== null && results.length > 0) {
                        for (var i = 0; i < results.length; i++) {
                            this.projectGroupCostingInfoTableFeatureLayer.applyEdits(null, null, results[i].features, null, this._featureLayerEditsError);
                        }
                    }
                    this._getProjectsList();
                } catch (err) {
                    console.log(err);
                } finally {
                    this.shelter.hide();
                    //enable viewProjectInMap Button, deleteProject Button and loadProject Button
                    html.removeClass(this.viewProjectInMapButton, 'jimu-state-disabled');
                    html.removeClass(this.deleteProjectButton, 'jimu-state-disabled');
                    html.removeClass(this.loadProjectButton, 'jimu-state-disabled');
                }
            },

            //delete all the additional cost details for a project
            _getProjectAdditionDetailsForDelete: function (results) {

                try {

                    if (results.length > 0) {
                        this.projectMultiplierAdditionalCostFeatureLayer.applyEdits(null, null, results.features, null, this._featureLayerEditsError);
                    }
                } catch (err) {
                    console.log(err);
                }

            },

            //Cost Escalation Page
            _addCostEscalationFieldRow: function () {
                var result = this.costEscalationTable.addRow({});
                if (result.success && result.tr) {
                    var tr = result.tr;
                    tr.labelText = [];
                    this._costEscalationDescriptions(tr);
                    this._costEscalationTypes(tr);
                    this._costEscalationValues(tr);
                }
            },

            _costEscalationDescriptions: function (tr) {
                var td = query('.simple-table-cell', tr)[0];
                html.setStyle(td, "verticalAlign", "middle");
                var descriptionTextBox = new ValidationTextBox({
                    style: {
                        width: "100%",
                        height: "25px"
                    }
                });
                descriptionTextBox.placeAt(td);
                descriptionTextBox.startup();
                tr.labelText[0] = descriptionTextBox;

                var rowCount = this.costEscalationTable.tableInBodySection.rows.length;
                tr.labelText[0].set("value", "Label" + parseInt(rowCount));
            },

            _costEscalationTypes: function (tr) {
                var typeOptions = lang.clone(this.costEscalationType);
                var td = query('.simple-table-cell', tr)[1];
                if (td) {
                    html.setStyle(td, "verticalAlign", "middle");
                    var types = new Select({
                        style: {
                            width: "100%",
                            height: "22px"
                        },
                        options: typeOptions
                    });
                    types.placeAt(td);
                    types.startup();
                    tr.selectTypes = types;
                    tr.selectTypes.on('change', lang.hitch(this, function (evt) {
                        this._calculateEscalatedProjectCost();
                    }));
                }
            },

            _costEscalationValues: function (tr) {
                var td = query('.simple-table-cell', tr)[2];
                html.setStyle(td, "verticalAlign", "middle");
                var valueTextBox = new ValidationTextBox({
                    style: {
                        width: "100%",
                        height: "25px"
                    }
                });

                valueTextBox.placeAt(td);
                valueTextBox.startup();
                valueTextBox.on('change', lang.hitch(this, this._calculateEscalatedProjectCost));
                tr.labelText[1] = valueTextBox;

                if (tr.selectTypes.value === '*') {
                    tr.labelText[1].set("value", '1.0');
                } else {
                    tr.labelText[1].set("value", '0.0');
                }
            },

            _createCostEscaltionTableOnProjectLoad: function (rowDetail) {
                var result = this.costEscalationTable.addRow({});
                if (result.success && result.tr) {
                    var tr = result.tr;
                    tr.labelText = [];
                    this._costEscalationDescriptions(tr);
                    this._costEscalationTypes(tr);
                    this._costEscalationValues(tr);

                    tr.labelText[0].set("value", rowDetail.description);
                    tr.labelText[1].set("value", rowDetail.value);
                    tr.selectTypes.set("value", rowDetail.type);
                }
            },

            //calculate escalated project cost
            _calculateEscalatedProjectCost: function () {
                var grossProjectCost = parseFloat((this.totalAssetCost.innerHTML).replace(/\,/g, ''));

                projectDetail.totalCost = grossProjectCost;
                var costEscalationValue;
                for (var i = 0; i < this.costEscalationTable.tableInBodySection.rows.length; i++) {
                    var tr = this.costEscalationTable.tableInBodySection.rows[i];

                    if (tr.selectTypes.value === '*') {
                        costEscalationValue = parseFloat(tr.labelText[1].textbox.value);
                        if ((!this.isNumber(tr.labelText[1].textbox.value)) || (costEscalationValue === 0)) {
                            tr.labelText[1].set("value", '1.0');
                        } else {
                            grossProjectCost = parseFloat(grossProjectCost * costEscalationValue);
                        }
                    } else {
                        costEscalationValue = parseFloat(tr.labelText[1].textbox.value);
                        if (!this.isNumber(tr.labelText[1].textbox.value)) {
                            tr.labelText[1].set("value", '0.0');
                        } else {
                            grossProjectCost = parseFloat(grossProjectCost + costEscalationValue);
                        }
                    }
                }

                var tempGrossprjcost = this._roundProjectCostValue(grossProjectCost);
                var formattedgrossprjcost = this.formatNumber(tempGrossprjcost);
                this.grossProjectCostAfterEscalation.innerHTML = formattedgrossprjcost;
                this.grossProjectCost.innerHTML = formattedgrossprjcost;

                projectDetail.grossCost = tempGrossprjcost;

                array.forEach(projectDetail.projectfieldAttrib, lang.hitch(this, function (fieldAttrib) {
                    if (fieldAttrib.fieldName.toUpperCase() === this.projectGrossCostFldName.toUpperCase())
                        fieldAttrib.fieldValue = parseFloat(tempGrossprjcost);
                }));
                var projectCostEscalationDetails = [];
                var costEscalationRows = this.costEscalationTable.getRows();

                array.forEach(costEscalationRows, lang.hitch(this, function (tr) {
                    var projectCostEscalation = {
                        description: tr.labelText[0].textbox.value,
                        value: tr.labelText[1].textbox.value,
                        type: tr.selectTypes.value,
                        index: tr.rowIndex
                    };
                    projectCostEscalationDetails.push(projectCostEscalation);
                }));

                projectDetail.projectAddlnCostMultiplierDetails = projectCostEscalationDetails;
            },

            isNumber: function (n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            },

            formatNumber: function (num) {
                return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
            },

            //add Cost Escalation Row
            addCostEscalationRow: function () {
                this._addCostEscalationFieldRow();
            },

            //delete Cost Escalation Row
            deleteCostEscalationRow: function () {
                var selectedRow = this.costEscalationTable.getSelectedRow();
                if ((selectedRow !== undefined) || (selectedRow === null)) {
                    this.costEscalationTable.deleteRow(selectedRow);
                }
                this._calculateEscalatedProjectCost();
            },

            //Up Cost Escalation Row
            upCostEscalationRow: function () {

                var selectedRow = this.costEscalationTable.getSelectedRow();

                if ((selectedRow === undefined) || (selectedRow === null) || (selectedRow.rowIndex === 0)) {
                    return;
                }

                var previousTr = selectedRow.previousSibling;
                this.costEscalationTable.tableInBodySection.childNodes[1].removeChild(selectedRow);
                this.costEscalationTable.tableInBodySection.childNodes[1].insertBefore(selectedRow, previousTr);
                this._calculateEscalatedProjectCost();
            },

            //Down Cost Escalation Row
            downCostEscalationRow: function () {

                var selectedRow = this.costEscalationTable.getSelectedRow();

                if ((selectedRow === undefined) || (selectedRow === null) || (selectedRow.rowIndex === this.costEscalationTable.tableInBodySection.rows.length - 1)) {
                    return;
                }

                var nextTr = selectedRow.nextSibling;
                this.costEscalationTable.tableInBodySection.childNodes[1].removeChild(nextTr);
                this.costEscalationTable.tableInBodySection.childNodes[1].insertBefore(nextTr, selectedRow);
                this._calculateEscalatedProjectCost();
            },


            // Event handler before edits are applied to a layer.
            // returns: nothing
            layerBeforeApplyEditsComplete: function (results) {

                this.shelter.show();

                if (results.deletes && results.deletes.length > 0) {
                    this.delAddedFeature(results.deletes, results.target, 'delete');
                }

                if (results.adds && results.adds.length > 0) {
                    if (results.adds.length === 1) {
                        this._addfeature2FeatureArray(results.adds, results.target);
                    }
                }

                if (results.updates && results.updates.length > 0) {
                    this.delAddedFeature(results.updates, results.target, 'update');
                }
            },

            //create pop up for selects cost geometry's availabale equation
            selectCostGeometryEquation: function (params, geographyId, features) {

                var id = null;
                var geographyName = null;
                for (var i = 0; i < this.geographyFeaturesOfAsset.length; i++) {
                    id = Common.getFieldvalue(this.geographyFeaturesOfAsset[i].attributes, 'COSTGEOMID');
                    if (id === geographyId) {
                        geographyName = Common.getFieldvalue(this.geographyFeaturesOfAsset[i].attributes, 'NAME');
                        break;
                    }

                }
                //var geographyId = Common.getFieldvalue(this.geographyFeaturesOfAsset[0].attributes, 'COSTGEOMID');
                //var geographyName = Common.getFieldvalue(this.geographyFeaturesOfAsset[0].attributes, 'NAME');

                this.equationType = new EquationType({
                    id: params.id,
                    eqtGeographyID: geographyId,
                    eqtGeography: geographyName,
                    geographyEquationTypes: features,
                    nls: lang.clone(this.nls),
                });

                this.popup = new Popup({
                    titleLabel: this.nls.selectEquation,
                    autoHeight: true,
                    content: this.equationType,
                    container: 'main-page',
                    width: 400,
                    buttons: [{
                        label: this.nls.selectOK,
                        key: keys.ENTER,
                        onClick: lang.hitch(this, '_onEquationTypeOk', params)
                    }, {
                        label: this.nls.selectCancel,
                        key: keys.ESCAPE,
                        onClick: lang.hitch(this, '_onEquationTypeCancel', params)
                    }],
                    onClose: lang.hitch(this, '_onEquationTypeClose', params)
                });

                this.equationType.startup();
            },

            _onEquationTypeOk: function (params) {
                var equationtype = this.equationType.selectCostEquationType.value;
                //this.setEquationType = this.equationType.selectCostEquationType.value;
                this._addGeographyIdAndTemplateID(this.equationType.eqtGeographyID, params.templateID, equationtype);
                this._unitCostQuery(params);
                this.popup.close();

            },
            _onEquationTypeCancel: function (params) {

                if (!this.isLoadOrphanDataForPopUp) {
                    var featureLyr = Common.getLayerbyTitleFromMap(this.map, params.featureLayerName);
                    featureLyr.applyEdits(null, null, [params.feature], null, this._featureLayerEditsError);
                }
                this.isLoadOrphanDataForPopUp = false;
                this.popup.close();
            },

            _onEquationTypeClose: function (params) {

                this.equationType = null;
                this.popup = null;
                if (this.isLoadOrphanDataForPopUp) {
                    if (this.orphanAssetCounter < this.orphanAssetArrayLength)
                        this._getEquationTypeForOrphanAsset(this.orphanAssetArray[this.orphanAssetCounter]);

                }
                if (this.orphanAssetCounter >= this.orphanAssetArrayLength)
                    this.isLoadOrphanDataForPopUp = false;
            },

            _addGeographyIdAndTemplateID: function (geographyID, templateID, equationtype) {

                var isExist = false;
                var i = 0;
                for (i = 0; i < this.setEquationTypeArray.length; i++) {
                    if (this.setEquationTypeArray[i].setGeographyID === geographyID && this.setEquationTypeArray[i].setGeometryTemplateId === templateID) {
                        isExist = true;
                        break;
                    }
                }

                if (!isExist) {
                    var equationtypeJason = {
                        setEquationType: equationtype,
                        setGeographyID: geographyID,
                        setGeometryTemplateId: templateID
                    };
                    this.setEquationTypeArray.push(equationtypeJason);
                }
                this.lastUsedEquationType = equationtype;
            },

            //Add new feature to feature array.
            _addfeature2FeatureArray: function (features, featureLayer) {

                if (features.length === 0) {
                    return;
                }

                for (var i = 0; i < features.length; i++) {
                    var feature = features[i];

                    var projectId = null;
                    var projectGeom = null;

                    if (this.isLoadProject) {
                        projectId = projectDetail.projectId;
                        projectGeom = projectDetail.projectFeature.geometry;
                    }

                    this.assetTypeTemplate = this._getTemplateName(featureLayer, feature);
                    if (this.assetTypeTemplate === null || this.assetTypeTemplate === undefined) {
                        new Message({
                            message: this.nls.templateIdErrorMsg
                        });
                        console.log(this.nls.templateIdErrorMsg);
                        this.shelter.hide();
                        return;
                    }

                    var initialCostIdFldName = Common.getActualFieldName(feature.attributes, 'INITIALCOSTID');
                    this.assetInitialCostIDTemplate = feature.attributes[initialCostIdFldName];
                    var templateIDFldName = Common.getActualFieldName(feature.attributes, 'TEMPLATEID');
                    var templateId = feature.attributes[templateIDFldName];
                    var measure = 1;
                    var unit = '';

                    if (feature.geometry.type === 'polyline') {
                        var length = this.getGeometryLength(feature);
                        measure = Math.abs(length.toFixed(2));
                        unit = this.lengthUnit;

                    } else if (feature.geometry.type === 'polygon') {
                        var area = this.getGeometryArea(feature);
                        measure = Math.abs(area.toFixed(2));
                        unit = this.areaLengthUnit;
                    }
                    //var id = parseInt(this.featureStorageCount + 1);
                    var id = this.generateGUID();
                    var params = {
                        id: id,
                        feature: feature,
                        measure: measure,
                        measureUnit: unit,
                        initialCostId: this.assetInitialCostIDTemplate,
                        unitCost: null,
                        geographyId: null,
                        geographyGeom: null,
                        projectGroupCostingId: null,
                        projectGroupCostingFeature: null,
                        projectId: projectId,
                        featureLayerName: featureLayer.name,
                        featureLayerId: featureLayer.id,
                        //featureLayer: featureLayer,
                        //projectGeom: projectGeom,
                        defaultCostEquation: null,
                        modifiedCostEquation: null,
                        templateName: this.assetTypeTemplate,
                        templateID: templateId,
                        isNewFeature: true
                    };

                    // get related Geography
                    this._getGeographyQueryObj(feature.geometry, params);
                }

            },

            // query to get geography features
            _getGeographyQueryObj: function (geometry, params) {

                var geom = lang.clone(geometry);

                var query = new Query();
                query.geometry = geom;
                query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
                query.returnGeometry = true;
                query.outFields = ["*"];

                var qt = new QueryTask(this.costingGeometryLayer.url);
                qt.on('complete', lang.hitch(this, this._getGeographyRelated2Feature, params));
                qt.on('error', this._queryError);
                qt.execute(query);

            },

            // store geography query results in an array
            _getGeographyResults: function (results) {

                //this.geographicResults = results;
                if (this.geographyFeaturesOfAsset === undefined)
                    this.geographyFeaturesOfAsset = [];
                for (var i = 0; i < results.featureSet.features.length; i++) {
                    if (!this._checkEqualGeography(this.geographyFeaturesOfAsset, results.featureSet.features[i])) {
                        this.geographyFeaturesOfAsset.push(results.featureSet.features[i]);
                    }
                }
            },


            // get geography related to feature geometry
            _getGeographyRelated2Feature: function (params, results) {

                if (results !== null) {
                    if (results.featureSet.features.length !== 0) {
                        this._getGeographyResults(results);
                        var j = 0;
                        for (var i = 0; i < results.featureSet.features.length; i++) {
                            if (geometryEngine.within(params.feature.geometry, results.featureSet.features[i].geometry)) {
                                j++;
                            }
                        }
                        if (j > 1) {
                            if (!this.isMessagePopup) {
                                new Message({
                                    message: this.nls.moreThanOneGeography
                                });
                                this.isMessagePopup = true;
                            }
                            console.log(this.nls.moreThanOneGeography);
                        }
                    } else {
                        if (!this._checkPopupValuesExist('', params.templateID)) {
                            this._getEquationTypeWithoutGeography(params);
                            //this._unitCostQuery(params);
                            return;
                        } else {

                            this._unitCostQuery(params);
                            this.isLoadOrphanDataForPopUp = false;
                            if (this.orphanAssetCounter < this.orphanAssetArrayLength)
                                this._getEquationTypeForOrphanAsset(this.orphanAssetArray[this.orphanAssetCounter]);

                            return;
                        }

                    }
                }


                //create pop up for selects cost geometry's availabale equation
                if (this.geographyFeaturesOfAsset.length > 0) {

                    var geographyFeat = this._getGeographyContainedFeature(params);

                    if (geographyFeat !== null) {

                        var geographyId = Common.getFieldvalue(geographyFeat[0].attributes, 'COSTGEOMID');
                        if (!this._checkPopupValuesExist(geographyId, params.templateID)) {
                            this._getGeographyEquationType(params, geographyFeat[0]);
                        } else {

                            this._unitCostQuery(params);
                            this.isLoadOrphanDataForPopUp = false;
                            if (this.orphanAssetCounter < this.orphanAssetArrayLength)
                                this._getEquationTypeForOrphanAsset(this.orphanAssetArray[this.orphanAssetCounter]);
                        }

                    } else {
                        this._unitCostQuery(params);
                        this.isLoadOrphanDataForPopUp = false;
                        if (this.orphanAssetCounter < this.orphanAssetArrayLength)
                            this._getEquationTypeForOrphanAsset(this.orphanAssetArray[this.orphanAssetCounter]);
                    }

                } else {
                    this._unitCostQuery(params);
                    this.isLoadOrphanDataForPopUp = false;
                    if (this.orphanAssetCounter < this.orphanAssetArrayLength)
                        this._getEquationTypeForOrphanAsset(this.orphanAssetArray[this.orphanAssetCounter]);
                }
            },

            _checkPopupValuesExist: function (geographyId, templateID) {
                var i = 0;
                var isExists = false;
                for (i = 0; i < this.setEquationTypeArray.length; i++) {
                    if (this.setEquationTypeArray[i].setGeographyID === geographyId && this.setEquationTypeArray[i].setGeometryTemplateId === templateID) {
                        isExists = true;
                        this.lastUsedEquationType = this.setEquationTypeArray[i].setEquationType;
                        break;
                    }
                }
                return isExists;
            },

            //create query for gettting equation type against the geography
            _getGeographyEquationType: function (params, geographyFeature) {

                var initialCostIdFldName = Common.getActualFieldName(params.feature.attributes, 'INITIALCOSTID');
                this.assetInitialCostIDTemplate = params.feature.attributes[initialCostIdFldName];

                var geographyIdFldName = "";
                var geographyId = "";
                var whereClause = "";
                if (geographyFeature !== null) {
                    geographyIdFldName = Common.getActualFieldName(geographyFeature.attributes, 'COSTGEOMID');
                    geographyId = Common.getFieldvalue(geographyFeature.attributes, 'COSTGEOMID');
                    whereClause = initialCostIdFldName + " = " + "'" + this.assetInitialCostIDTemplate + "'" + " AND " + geographyIdFldName + " = " + "'" + geographyId + "'";
                } else {
                    geographyIdFldName = Common.getFieldNameFromLayer(this.costingGeometryLayer, 'COSTGEOMID');
                    whereClause = initialCostIdFldName + " = " + "'" + this.assetInitialCostIDTemplate + "'" + " AND " + geographyIdFldName + " is null ";
                }

                //get data from CostingTable
                var costingTable = Common.getFlatTables(this.projectTables, this.lookupTable);

                var queryTask = new QueryTask(costingTable.url);
                queryTask.on('complete', lang.hitch(this, this.showEquationTypes, params, geographyId));
                queryTask.on('error', this._queryError);

                var query = new Query();
                query.where = whereClause;
                query.returnGeometry = false;
                query.outFields = ["*"];
                queryTask.execute(query);

            },

            //create query for gettting equation type against the null geography
            _getEquationTypeWithoutGeography: function (params) {

                var initialCostIdFldName = Common.getActualFieldName(params.feature.attributes, 'INITIALCOSTID');
                this.assetInitialCostIDTemplate = params.feature.attributes[initialCostIdFldName];

                var geographyIdFldName = "";

                var whereClause = "";

                geographyIdFldName = Common.getFieldNameFromLayer(this.costingGeometryLayer, 'COSTGEOMID');
                whereClause = initialCostIdFldName + " = " + "'" + this.assetInitialCostIDTemplate + "'" + " AND " + geographyIdFldName + " is null ";


                //get data from CostingTable
                var costingTable = Common.getFlatTables(this.projectTables, this.lookupTable);

                var queryTask = new QueryTask(costingTable.url);
                queryTask.on('complete', lang.hitch(this, this.showEquationTypes, params, ''));
                queryTask.on('error', this._queryError);

                var query = new Query();
                query.where = whereClause;
                query.returnGeometry = false;
                query.outFields = ["*"];
                queryTask.execute(query);

            },

            _getGeographyContainedFeature: function (params) {
                var geographies = [];
                for (var i = 0; i < this.geographyFeaturesOfAsset.length; i++) {
                    if (geometryEngine.within(params.feature.geometry, this.geographyFeaturesOfAsset[i].geometry)) {
                        geographies.push(this.geographyFeaturesOfAsset[i]);
                        return geographies;
                    }

                }

                for (var i = 0; i < this.geographyFeaturesOfAsset.length; i++) {
                    if (this.geographyFeaturesOfAsset.length === 1) {
                        if (!geometryEngine.crosses(params.feature.geometry, this.geographyFeaturesOfAsset[i].geometry)) {
                            if (geometryEngine.touches(params.feature.geometry, this.geographyFeaturesOfAsset[i].geometry)) {
                                return null;
                            }
                            //geographies.push(this.geographyFeaturesOfAsset[i]);
                            //return geographies;

                        } else {
                            geographies.push(this.geographyFeaturesOfAsset[i]);
                            return geographies;
                        }

                    } else {
                        if (geometryEngine.crosses(params.feature.geometry, this.geographyFeaturesOfAsset[i].geometry)) {
                            geographies.push(this.geographyFeaturesOfAsset[i]);
                        }

                    }

                }
                //else //if (this.geographyFeaturesOfAsset.length === 1) {
                //            if (!geometryEngine.crosses(params.feature.geometry, this.geographyFeaturesOfAsset[i].geometry)) {
                //                if (geometryEngine.touches(params.feature.geometry, this.geographyFeaturesOfAsset[i].geometry)) {
                //                    return null;
                //                }
                //                //geographies.push(this.geographyFeaturesOfAsset[i]);
                //                //return geographies;

                //            }
                //                //}
                //            else {
                //                if (geometryEngine.crosses(params.feature.geometry, this.geographyFeaturesOfAsset[i].geometry)) {
                //                    geographies.push(this.geographyFeaturesOfAsset[i]);
                //                }
                //            }
                //    }
                return geographies;
            },

            //equation type result
            showEquationTypes: function (params, geographyId, results) {
                var isLastUsedFound = false;
                /*  if (geographyId === "") {
                      if (results.featureSet.features.length >= 1) {

                          params.modifiedCostEquation = Common.getFieldvalue(results.featureSet.features[0].attributes, "COSTEQUATION");
                          params.unitCost = Common.getFieldvalue(results.featureSet.features[0].attributes, "UNITCOST");
                          this._unitCostQuery(params);
                          this.isLoadOrphanDataForPopUp = false;
                          if (this.orphanAssetCounter < this.orphanAssetArrayLength)
                              this._getEquationTypeForOrphanAsset(this.orphanAssetArray[this.orphanAssetCounter]);
                          return;
                      } else {

                          new Message({
                              message: this.nls.costEquationErrorMsg
                          });
                          console.log(this.nls.costEquationErrorMsg + " : " + params.templateID + ".");
                          this.shelter.hide();
                          return;
                      }

                  }*/
                if (results.featureSet.features.length > 1) {
                    var equationTypes = [];
                    for (var i = 0; i < results.featureSet.features.length; i++) {
                        for (var j = 0; j < this.setEquationTypeArray.length; j++) {
                            var equType = Common.getFieldvalue(results.featureSet.features[i].attributes, "EQUATIONTYPE");
                            if (this.setEquationTypeArray[j].setEquationType === equType) {
                                if (equType === this.lastUsedEquationType) {
                                    isLastUsedFound = true;
                                }
                                equationTypes.push(equType);
                            }
                        }
                    }
                    if (equationTypes.length > 0) {
                        if (equationTypes.length > 1) {

                            if (!isLastUsedFound)
                            //create pop up for selects cost geometry's availabale equation
                                this.selectCostGeometryEquation(params, geographyId, results.featureSet.features);
                            else {

                                this._addElementInEquationTypeArray(this.lastUsedEquationType, geographyId, params.templateID);
                                this._unitCostQuery(params);
                                this.isLoadOrphanDataForPopUp = false;
                                if (this.orphanAssetCounter < this.orphanAssetArrayLength)
                                    this._getEquationTypeForOrphanAsset(this.orphanAssetArray[this.orphanAssetCounter]);
                            }
                        } else {
                            this._addElementInEquationTypeArray(equationTypes[0], geographyId, params.templateID);

                            this.lastUsedEquationType = equationTypes[0];
                            this._unitCostQuery(params);
                            this.isLoadOrphanDataForPopUp = false;
                            if (this.orphanAssetCounter < this.orphanAssetArrayLength)
                                this._getEquationTypeForOrphanAsset(this.orphanAssetArray[this.orphanAssetCounter]);
                        }
                    } else {
                        //create pop up for selects cost geometry's availabale equation
                        this.selectCostGeometryEquation(params, geographyId, results.featureSet.features);
                    }
                } else if (results.featureSet.features.length === 1) {

                    var equationType = Common.getFieldvalue(results.featureSet.features[0].attributes, "EQUATIONTYPE");

                    if (equationType !== this.lastUsedEquationType) {
                        this._addElementInEquationTypeArray(equationType, geographyId, params.templateID);
                    }
                    this.lastUsedEquationType = equationType;
                    this._unitCostQuery(params);
                    this.isLoadOrphanDataForPopUp = false;
                    if (this.orphanAssetCounter < this.orphanAssetArrayLength)
                        this._getEquationTypeForOrphanAsset(this.orphanAssetArray[this.orphanAssetCounter]);
                } else {

                    this._getGeographyEquationType(params, null);
                }
            },

            _addElementInEquationTypeArray: function (equationType, geographyID, templateId) {
                var isalreadyExists = false;
                for (var i = 0; i < this.setEquationTypeArray.length; i++) {
                    if (equationType === this.setEquationTypeArray[i].setEquationType &&
                        geographyID === this.setEquationTypeArray[i].setGeographyID &&
                        templateId === this.setEquationTypeArray[i].setGeometryTemplateId) {
                        isalreadyExists = true;
                        break;

                    }
                }
                if (!isalreadyExists) {
                    var equationtypeJason = {
                        setEquationType: equationType,
                        setGeographyID: geographyID,
                        setGeometryTemplateId: templateId
                    };
                    this.setEquationTypeArray.push(equationtypeJason);
                }
            },

            _unitCostQuery: function (params) {
                var AssetdetailsArray = [];
                var assetdetails;

                var initialCostIdFldName = Common.getActualFieldName(params.feature.attributes, 'INITIALCOSTID');
                this.assetInitialCostIDTemplate = params.feature.attributes[initialCostIdFldName];
                //var isCrossGeo = false;
                var newGraphicObj;
                var splitgeoms = [];
                var geometry = null;
                var splitNewObj = {};

                var geographyFeat = this._getGeographyContainedFeature(params);

                if (geographyFeat !== null && geographyFeat.length === 1) {
                    var geographyId = Common.getFieldvalue(geographyFeat[0].attributes, 'COSTGEOMID');
                    var geographyName = Common.getFieldvalue(geographyFeat[0].attributes, 'NAME');
                    params.geographyId = geographyId;
                    params.geographyName = geographyName;
                    assetdetails = new AssetDetailInProject(params);
                    AssetdetailsArray.push(assetdetails);
                } else {
                    params.geographyId = null;
                    params.geographyName = null;
                    assetdetails = new AssetDetailInProject(params);
                    AssetdetailsArray.push(assetdetails);
                }

                //get data from CostingTable
                var costingTable = Common.getFlatTables(this.projectTables, this.lookupTable);

                var qt = new QueryTask(costingTable.url);

                var query = new Query();
                query.where = initialCostIdFldName + " = " + "'" + this.assetInitialCostIDTemplate + "'";
                query.returnGeometry = false;
                query.outFields = ["*"];

                var deferred = qt.execute(query,
                    lang.hitch(this, this._getUnitCostNewFeature, AssetdetailsArray), this._queryError);

            },


            // get geometry split by poly gon
            _getSplitedGeom: function (geom, cutter) {
                var splitgeoms = geometryEngine.cut(geom, cutter);
                return splitgeoms;
            },

            _getEquationType: function (geographyId, templateID, initialCostID, unitCostResults) {

                geographyId = this._isNullCheck(geographyId);

                for (var i = 0; i < this.setEquationTypeArray.length; i++) {
                    if (this.setEquationTypeArray[i].setGeographyID === geographyId && this.setEquationTypeArray[i].setGeometryTemplateId === templateID) {
                        return this.setEquationTypeArray[i].setEquationType;
                    }
                }
                for (var i = 0; i < unitCostResults.features.length; i++) {

                    var geoid = Common.getFieldvalue(unitCostResults.features[i].attributes, 'COSTGEOMID');

                    geoid = this._isNullCheck(geoid);

                    var intialCostValue = Common.getFieldvalue(unitCostResults.features[i].attributes, 'INITIALCOSTID');
                    if (initialCostID === intialCostValue && geographyId === geoid) {

                        var equationType = Common.getFieldvalue(unitCostResults.features[i].attributes, 'EQUATIONTYPE');
                        return equationType;
                    }
                }
                return null;
            },

            _isNullCheck: function (value) {
                if (value === null) {
                    value = '';
                    return value;
                }
                return value;
            },

            // get unit cost according to feature template for new feature
            _getUnitCostNewFeature: function (AssetdetailsArray, results) {

                for (var i = 0; i < AssetdetailsArray.length; i++) {
                    for (var j = 0; j < results.features.length; j++) {
                        var intialCostValue = Common.getFieldvalue(results.features[j].attributes, 'INITIALCOSTID');
                        var unitCost = Common.getFieldvalue(results.features[j].attributes, 'UNITCOST');
                        var initialCostEquation = Common.getFieldvalue(results.features[j].attributes, 'COSTEQUATION');
                        var geographyid = Common.getFieldvalue(results.features[j].attributes, 'COSTGEOMID');
                        var sumGeoId = Common.getFieldvalue(results.features[j].attributes, 'EQUATIONTYPE');

                        var equationType = this._getEquationType(geographyid, AssetdetailsArray[i].templateID, intialCostValue, results);

                        if ((AssetdetailsArray[i].initialCostId == intialCostValue && AssetdetailsArray[i].geographyId === geographyid) && (equationType === sumGeoId)) {
                            AssetdetailsArray[i].unitCost = unitCost;
                            AssetdetailsArray[i].defaultCostEquation = initialCostEquation;
                            AssetdetailsArray[i].modifiedCostEquation = initialCostEquation;
                            AssetdetailsArray[i].subGeoId = sumGeoId;
                            break;
                        }
                    }

                    AssetdetailsArray[i].initialAssetCost = this._computeCost(AssetdetailsArray[i].defaultCostEquation, AssetdetailsArray[i].unitCost, AssetdetailsArray[i].measure);
                    AssetdetailsArray[i].modifiedAssetCost = this._computeCost(AssetdetailsArray[i].modifiedCostEquation, AssetdetailsArray[i].unitCost, AssetdetailsArray[i].measure);

                    this.featureStorage[AssetdetailsArray[i].featureLayerId].addedFeatures.push(AssetdetailsArray[i]);
                    this.featureStorageCount++;



                    if (AssetdetailsArray[i].feature.geometry.type !== 'point') {
                        this._getSplittedFeature(AssetdetailsArray[i]);
                    }
                    this._fillAssetDescriptionGrid(AssetdetailsArray[i], AssetdetailsArray[i].measure);

                }

                // if feature splits between two geography create two new feature and delte old feature
                if (this.splittedFeatures.length > 0) {
                    for (var i = 0; i < this.splittedFeatures.length; i++) {
                        for (var j = 0; j < AssetdetailsArray.length; j++) {
                            if (this.splittedFeatures[i].GraphicObjects.length > 0 && this.splittedFeatures[i].Assetdetails.id === AssetdetailsArray[j].id) {
                                var splitedFeatureLayer = Common.getLayerbyTitleFromMap(this.map, this.splittedFeatures[i].Assetdetails.featureLayerName);
                                var features = this.splittedFeatures[i].GraphicObjects;
                                var assetDetails = this.splittedFeatures[i].Assetdetails;
                                this.splittedFeatures = [];
                                splitedFeatureLayer.applyEdits(null, null, [assetDetails.feature], null, lang.hitch(this, this._featureLayerEditsError));
                                splitedFeatureLayer.applyEdits(features, null, null, lang.hitch(this, this.splitFeatureCompletes, splitedFeatureLayer), this._featureLayerEditsError);
                            }
                        }
                    }
                }
                this.updateSaveClearSessionBtn();
                this.shelter.hide();
            },

            _getSplittedFeature: function (assetDetailsItem) {

                var newGraphicObj;
                var splitgeoms = [];
                var geometry = null;
                var splitNewObj = {};
                splitNewObj.GraphicObjects = [];

                var isWithinInGeography = false;
                for (var i = 0; i < this.geographyFeaturesOfAsset.length; i++) {
                    if (geometryEngine.within(assetDetailsItem.feature.geometry, this.geographyFeaturesOfAsset[i].geometry)) {
                        isWithinInGeography = true;
                        assetDetailsItem.geographyId = Common.getFieldvalue(this.geographyFeaturesOfAsset[i].attributes, 'COSTGEOMID');
                        assetDetailsItem.geographyName = Common.getFieldvalue(this.geographyFeaturesOfAsset[i].attributes, 'NAME');
                        this.splittedFeatures = [];
                        break;
                    } else if (this.geographyFeaturesOfAsset.length === 1) {
                        if (!geometryEngine.crosses(assetDetailsItem.feature.geometry, this.geographyFeaturesOfAsset[i].geometry)) {
                            isWithinInGeography = true;
                            assetDetailsItem.geographyId = Common.getFieldvalue(this.geographyFeaturesOfAsset[i].attributes, 'COSTGEOMID');
                            assetDetailsItem.geographyName = Common.getFieldvalue(this.geographyFeaturesOfAsset[i].attributes, 'NAME');
                            if (geometryEngine.touches(assetDetailsItem.feature.geometry, this.geographyFeaturesOfAsset[i].geometry)) {
                                assetDetailsItem.geographyId = null;
                                assetDetailsItem.geographyName = null;
                            }
                            this.splittedFeatures = [];
                            break;
                        }
                    }
                }

                if (!isWithinInGeography) {

                    var interSectingGeographies = this._getIntersectingGeography(assetDetailsItem.feature.geometry);
                    if (assetDetailsItem.feature.geometry.type === 'polyline') {
                        for (var i = 0; i < interSectingGeographies.length; i++) {
                            if (i === 0) {
                                geometry = assetDetailsItem.feature.geometry;

                            } else {
                                geometry = splitgeoms[1];
                            }
                            if (geometryEngine.crosses(geometry, interSectingGeographies[i].geometry)) {

                                splitgeoms = this._getSplitedGeom(geometry, interSectingGeographies[i].geometry);

                                newGraphicObj = new Graphic(splitgeoms[0], null, assetDetailsItem.feature.attributes);
                                if (this.splittedFeatures.length === 0)
                                    this.splittedFeatures.push(splitNewObj);
                                this.splittedFeatures[this.splittedFeatures.length - 1].Assetdetails = assetDetailsItem;
                                this.splittedFeatures[this.splittedFeatures.length - 1].GraphicObjects.push(newGraphicObj);
                                if (this.geographyFeaturesOfAsset.length === 1) {
                                    newGraphicObj = new Graphic(splitgeoms[1], null, assetDetailsItem.feature.attributes);
                                    this.splittedFeatures[this.splittedFeatures.length - 1].Assetdetails = assetDetailsItem;
                                    this.splittedFeatures[this.splittedFeatures.length - 1].GraphicObjects.push(newGraphicObj);
                                }

                            } else {

                                newGraphicObj = new Graphic(geometry, null, assetDetailsItem.feature.attributes);
                                if (this.splittedFeatures.length === 0)
                                    this.splittedFeatures.push(splitNewObj);
                                this.splittedFeatures[this.splittedFeatures.length - 1].Assetdetails = assetDetailsItem;
                                this.splittedFeatures[this.splittedFeatures.length - 1].GraphicObjects.push(newGraphicObj);

                            }

                        }

                    } else {

                        for (var i = 0; i < interSectingGeographies.length; i++) {

                            if (geometryEngine.overlaps(assetDetailsItem.feature.geometry, interSectingGeographies[i].geometry)) {

                                var geom = geometryEngine.intersect(assetDetailsItem.feature.geometry, interSectingGeographies[i].geometry);
                                if (geom.length > 0) {
                                    for (var j = 0; j < geom.length; j++) {
                                        newGraphicObj = new Graphic(geom[j], null, assetDetailsItem.feature.attributes);
                                        if (this.splittedFeatures.length === 0)
                                            this.splittedFeatures.push(splitNewObj);
                                        this.splittedFeatures[this.splittedFeatures.length - 1].Assetdetails = assetDetailsItem;
                                        this.splittedFeatures[this.splittedFeatures.length - 1].GraphicObjects.push(newGraphicObj);
                                    }
                                } else {

                                    newGraphicObj = new Graphic(geom, null, assetDetailsItem.feature.attributes);
                                    if (this.splittedFeatures.length === 0)
                                        this.splittedFeatures.push(splitNewObj);
                                    this.splittedFeatures[this.splittedFeatures.length - 1].Assetdetails = assetDetailsItem;
                                    this.splittedFeatures[this.splittedFeatures.length - 1].GraphicObjects.push(newGraphicObj);
                                }
                            }
                        }
                    }
                }
            },


            _getIntersectingGeography: function (geometry) {
                var interSectingGeographies = [];

                for (var i = 0; i < this.geographyFeaturesOfAsset.length; i++) {
                    if (geometryEngine.intersects(geometry, this.geographyFeaturesOfAsset[i].geometry)) {
                        interSectingGeographies.push(this.geographyFeaturesOfAsset[i]);
                    }
                }
                return interSectingGeographies;
            },



            // Remove stored features drawn in this session.
            // returns nothing.
            delAddedFeature: function (deletes, target, operationType) {
                if (this.featureStorageCount === 0 || this.isUpdateFromSavebtn) {
                    if (!this.isProjectDeleted) {
                        this.shelter.hide();
                    }

                    return;
                }
                var targetLayer = target;
                array.forEach(deletes, lang.hitch(this, function (selectedFeature) {

                    var selectedLayer = selectedFeature.getLayer();
                    if (selectedLayer === undefined || selectedLayer === null) {
                        selectedLayer = targetLayer;
                    }
                    var objectIdFld = selectedLayer.objectIdField;
                    var features = this.featureStorage[selectedLayer.id].addedFeatures;

                    var selFeatInitialCostID = Common.getFieldvalue(selectedFeature.attributes, 'INITIALCOSTID');

                    for (var i = 0; i < features.length; i++) {
                        var f = features[i];

                        var InitialCostID = Common.getFieldvalue(f.feature.attributes, 'INITIALCOSTID');

                        var geographyID = '';
                        var equalFeature = this._checkEqualFeature(f.feature, selectedFeature, objectIdFld);
                        if (equalFeature) {
                            var type = f.feature.geometry.type;
                            var measurement = 0;
                            if (operationType === 'delete') {
                                features.splice(i, 1);
                                measurement = -1 * f.measure;
                                this.featureStorageCount--;
                                var totalCost = 0;

                            } else {
                                var geometryMeasure = 0;

                                if (type === 'polyline') {
                                    geometryMeasure = this.getGeometryLength(selectedFeature);
                                } else if (type === 'polygon') {
                                    geometryMeasure = this.getGeometryArea(selectedFeature);

                                }

                                measurement = geometryMeasure - f.measure;
                                //f.measurement = geometryMeasure;
                                f.measure = geometryMeasure;
                                f.feature = selectedFeature;
                                //f.AssetDetails.feature = selectedFeature;
                                geographyID = f.geographyId;
                            }

                            //update Asset Grid after deletion of asset
                            this.updateAssetGrid(f, measurement, geographyID, operationType);

                            //this.updateTotals(f.feature, measurement);

                            this.updateSaveClearSessionBtn();
                            break;
                        }
                    }


                }));
                this.shelter.hide();
            },

            _checkEqualFeature: function (feature1, feature2, objectidFld) {
                var isEqual = false;
                var feat1objectid = Common.getFieldvalue(feature1.attributes, objectidFld);
                var feat2objectid = Common.getFieldvalue(feature2.attributes, objectidFld);
                if (feat1objectid === feat2objectid)
                    isEqual = true;
                return isEqual;
            },

            // get length for feature  geometry
            getGeometryLength: function (feature) {
                try {
                    return geometryEngine.geodesicLength(feature.geometry, this.lengthUnit);
                } catch (err) {
                    return geometryEngine.planarLength(feature.geometry, this.lengthUnit);
                }
            },

            // get Area for feature  geometry
            getGeometryArea: function (feature) {
                try {
                    return geometryEngine.geodesicArea(feature.geometry, this.areaLengthUnit);
                } catch (err) {
                    return geometryEngine.planarArea(feature.geometry, this.areaLengthUnit);
                }
            },

            projectCostCalculated: function () {

                var gridLength;
                var projectCalculatedCost = 0;

                this.grid.store.fetch({
                    onComplete: function (items, request) // items is an array
                        {
                            gridLength = items.length; // number of items in grid
                        }
                });

                var i = 0;
                for (i = 0; i < gridLength; i++) {
                    projectCalculatedCost = eval(projectCalculatedCost + this.assetValue[i].totalCost);
                }

                projectDetail.totalCost = projectCalculatedCost;

                if (projectCalculatedCost === 0) {
                    projectDetail.grossCost = projectCalculatedCost;

                    this.totalAssetCost.innerHTML = "0.00";
                    this.totalAssetCostAfterEscalation.innerHTML = "0.00";
                    this.grossProjectCost.innerHTML = "0.00";
                    this.grossProjectCostAfterEscalation.innerHTML = "0.00";

                } else {

                    var tempTotalCost = this._roundProjectCostValue(projectCalculatedCost);
                    projectDetail.totalCost = tempTotalCost;
                    var formattedTotalAssetCost = this.formatNumber(tempTotalCost);
                    this.totalAssetCost.innerHTML = formattedTotalAssetCost;
                    this.totalAssetCostAfterEscalation.innerHTML = formattedTotalAssetCost;
                    //calculate Gross Project Cost
                    var actualPrjCost = tempTotalCost;

                    //to do:  Calculate Gross Cost
                    for (i = 0; i < projectDetail.projectAddlnCostMultiplierDetails.length; i++) {
                        var tr = projectDetail.projectAddlnCostMultiplierDetails[i];
                        if (tr.type === '*') {
                            actualPrjCost = eval(actualPrjCost * tr.value);
                        } else {
                            actualPrjCost = eval(actualPrjCost + tr.value);
                        }
                    }


                    actualPrjCost = this._roundProjectCostValue(actualPrjCost);
                    projectDetail.grossCost = actualPrjCost;
                    var formattedActualPrjCost = this.formatNumber(actualPrjCost);
                    this.grossProjectCost.innerHTML = formattedActualPrjCost;
                    this.grossProjectCostAfterEscalation.innerHTML = formattedActualPrjCost;

                }
                array.forEach(projectDetail.projectfieldAttrib, lang.hitch(this, function (fieldAttrib) {
                    if (fieldAttrib.fieldName.toUpperCase() === this.projectGrossCostFldName.toUpperCase()) {
                        fieldAttrib.fieldValue = parseFloat(projectDetail.grossCost);
                    }
                    if (fieldAttrib.fieldName.toUpperCase() === this.projectTotalCostFldName.toUpperCase()) {
                        fieldAttrib.fieldValue = parseFloat(projectDetail.totalCost);
                    }
                }));
            },


            // sort additional project cost and cost factor on index field
            _sortProjectAddlnCostMultiplierDetails: function () {

                var projectAddlnCostMultiplierDetails = lang.clone(projectDetail.projectAddlnCostMultiplierDetails);

                var projectAddlnCostMultiplierDetails_temp = [];

                for (var i = 1; i < projectAddlnCostMultiplierDetails.length; i++) {
                    for (var j = 0; j < projectAddlnCostMultiplierDetails.length - 1; j++) {
                        if (projectAddlnCostMultiplierDetails[j].index > projectAddlnCostMultiplierDetails[j + 1].index) {
                            projectAddlnCostMultiplierDetails_temp = projectAddlnCostMultiplierDetails[j];
                            projectAddlnCostMultiplierDetails[j] = projectAddlnCostMultiplierDetails[j + 1];
                            projectAddlnCostMultiplierDetails[j + 1] = projectAddlnCostMultiplierDetails_temp;
                        }
                    }
                }

                projectDetail.projectAddlnCostMultiplierDetails = lang.clone(projectAddlnCostMultiplierDetails);
            },


            updateAssetGrid: function (featureStorageItem, measurement, geographyID, operationType) {

                var assetInitialCostEQT = Common.getFieldvalue(featureStorageItem.feature.attributes, 'INITIALCOSTID');

                var assetLengthUnit = this.lengthUnitDescription;
                var assetAreaLengthUnit = this.areaLengthUnitDescription;

                var totalQuantityinGrid;

                //variable for the row value
                var assetFeatureClass;
                var assetType;
                //var unitCostValue;
                var totalQuantityValue;
                var totalCost;

                var j = 0;
                var rowIndex = 0;
                for (var i = 0; i < this.assetValue.length; i++) {
                    for (j = 0; j < this.assetValue[i].assetDetails.length; j++) {
                        if (this.assetValue[i].assetDetails[j].id === featureStorageItem.id) {
                            totalQuantityinGrid = this.assetValue[i].totalQuantity;
                            totalCost = this.assetValue[i].totalCost;
                            var InitialdiffCost = this._computeCost(this.assetValue[i].assetDetails[j].defaultCostEquation, this.assetValue[i].assetDetails[j].unitCost, measurement);
                            var modifiedDiffCost = this._computeCost(this.assetValue[i].assetDetails[j].modifiedCostEquation, this.assetValue[i].assetDetails[j].unitCost, measurement);

                            this.assetValue[i].assetDetails[j].modifiedAssetCost = this.assetValue[i].assetDetails[j].modifiedAssetCost + modifiedDiffCost;
                            this.assetValue[i].assetDetails[j].initialAssetCost = this.assetValue[i].assetDetails[j].initialAssetCost + InitialdiffCost;
                            this.assetValue[i].assetDetails[j].measure = eval(this.assetValue[i].assetDetails[j].measure + measurement);

                            totalCost = eval(totalCost + modifiedDiffCost);
                            this.assetValue[i].totalQuantity = eval(totalQuantityinGrid + measurement);
                            if (operationType === 'delete') {
                                this.assetValue[i].assetDetails.splice(j, 1);
                            }
                            this.assetValue[i].totalCost = totalCost;
                            rowIndex = i;
                            break;
                        }
                    }

                }

                //get the grid row of feature selected for deletion
                var item = this.grid.getItem(rowIndex);

                totalQuantityValue = eval(totalQuantityinGrid + measurement);


                if ((totalQuantityValue === 0) || (totalQuantityValue === undefined) || (totalQuantityValue.toFixed(2) === '0.00') || (totalQuantityValue < 0)) {

                    this.assetValue.splice(rowIndex, 1);
                    gridStore.deleteItem(item);

                } else {

                    assetType = this.assetValue[rowIndex].assetDetails[0].templateName;

                    assetFeatureClass = this.assetValue[rowIndex].assetDetails[0].featureLayerName;

                    if (featureStorageItem.feature.geometry.type === 'point') {
                        rowDescription = totalQuantityValue + " " + assetType + " " + assetFeatureClass + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCost.toFixed(2));
                    } else if (featureStorageItem.feature.geometry.type === 'polyline') {
                        rowDescription = totalQuantityValue.toFixed(2) + assetLengthUnit + assetType + " " + assetFeatureClass + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCost.toFixed(2));
                    } else {
                        rowDescription = totalQuantityValue.toFixed(2) + assetAreaLengthUnit + assetType + " " + assetFeatureClass + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCost.toFixed(2));
                    }

                    this.assetValue[rowIndex].description = rowDescription;

                    this.grid.update();
                }

                //calculate actual project cost from grid
                this.projectCostCalculated();
            },

            // Event handler for when Save button is clicked on the widget panel.
            // returns: nothing
            onSaveSessionClick: function (evt) {
                this.shelter.show();

                this.isUpdateFromSavebtn = true;
                var featurePoints = this.convertFeatureStoredToPoints();

                if (this.projectAreaType.value == "CONVEX_HULL") {
                    this.arcgisGeomtryService.convexHull(featurePoints,
                        lang.hitch(this, this.onConvexHullComplete),
                        this.geometricServiceOnError);
                } else {
                    this.createBufferOnAssets();
                }
            },

            // Event handler for when Clear button is clicked on the widget panel.
            // returns: nothing
            onClearSessionClick: function (evt) {

                this.shelter.show();
                var features = [];

                for (var layerId in this.featureStorage) {

                    if (this.featureStorage.hasOwnProperty(layerId)) {
                        var tempAssetDetail = this.featureStorage[layerId].addedFeatures;
                        for (var i = 0; i < tempAssetDetail.length; i++) {

                            if (tempAssetDetail[i].isNewFeature) {
                                features.push(tempAssetDetail[i].feature);

                            }
                        }

                        if (features.length > 0) {
                            var layer = this.featureStorage[layerId].layer;
                            layer.applyEdits(null, null, features, null, this._featureLayerEditsError);
                        }
                    }
                }
                this.shelter.hide();
                this._switchToSelectionMethod();
            },

            createBufferOnAssets: function () {

                //var params = new BufferParameters();
                var featuresGeom = [];
                var bufferDist = parseInt(this.convexHullBufferDistance, 10);
                //params.distances = [bufferDist];
                //params.unit = this.lengthUnit;
                //var mergeGeometry
                for (var i = 0; i < this.assetValue.length; i++) {
                    for (var j = 0; j < this.assetValue[i].assetDetails.length; j++) {
                        if (this.assetValue[i].assetDetails[j].isNewFeature) {
                            var geometry = this.assetValue[i].assetDetails[j].feature.geometry;
                            if (geometry.type === 'polygon') {
                                geometry = geometryEngine.simplify(geometry);
                            }
                            featuresGeom.push(geometry);
                        }
                    }
                }
                //params.geometries = featuresGeom;
                //params.unionResults = true;
                //this.arcgisGeomtryService.buffer(params, lang.hitch(this, this.onBufferComplete), this.geometricServiceOnError);

                var polygon = geometryEngine.buffer(featuresGeom, [bufferDist], this.lengthUnit, true);

                if (this.isLoadProject) {
                    var projectpolygon = geometryEngine.union([polygon[0], projectDetail.projectFeature.geometry]);
                    this._updateProject(projectpolygon);
                } else {
                    this._saveProject(polygon[0]);
                }
            },


            // Takes all features in storage and converts them into points.
            // returns a list of points that make up all the features.
            convertFeatureStoredToPoints: function () {
                var result = [];

                for (var layerId in this.featureStorage) {
                    if (this.featureStorage.hasOwnProperty(layerId)) {
                        var features = this.featureStorage[layerId].addedFeatures;
                        array.forEach(features, function (f) {
                            // get points of only those features which are new
                            var feature = f.feature;
                            var type = feature.geometry.type;
                            var geometry = feature.geometry;
                            if (type === 'point') {
                                result.push(geometry);

                            } else { //polyline - polygon
                                var pieces;
                                if (type === 'polyline') {
                                    pieces = geometry.paths;
                                } else {
                                    pieces = geometry.rings;
                                }

                                array.forEach(pieces, function (piece) {
                                    array.forEach(piece, function (point) {
                                        result.push(new Point(point[0], point[1], geometry.spatialReference));
                                    });
                                });
                            }
                        });
                    }
                }

                return result;
            },

            // Event handler for when Convex Hull (Geometry Service) operation is complete.
            // returns nothing
            onConvexHullComplete: function (result) {
                if (this.isLoadProject) {
                    this._updateProject(result);
                } else {
                    this._saveProject(result);
                }
            },

            _updateProject: function (result) {

                var ids = this.map.graphicsLayerIds;
                var len = ids.length;
                var g;

                projectID = projectDetail.projectId;
                projectDetail.projectFeature.geometry = result;
                var i = 0;
                //var jsonData = {};
                //for (i = 0; i < this.projectCostLayer.fields.length; i++) {
                //    if (this.projectCostLayer.fields[i].name !== this.projectCostLayer.objectIdField) {
                //        if (this.projectCostLayer.fields[i].name.toUpperCase() === this.projectIdFldName.toUpperCase()) {
                //            //jsonData[this.projectCostLayer.fields[i].name] = projectID;
                //            //projectDetail.projectFeature.attributes[this.projectCostLayer.fields[i].name] = projectID;
                //            break;
                //        }
                //    }

                //}

                for (i = 0; i < projectDetail.projectfieldAttrib.length; i++) {
                    if (projectDetail.projectfieldAttrib[i].fieldName.toUpperCase() !== this.projectIdFldName.toUpperCase()) {
                        projectDetail.projectFeature.attributes[projectDetail.projectfieldAttrib[i].fieldName] = projectDetail.projectfieldAttrib[i].fieldValue;
                    }
                }

                this.addProjectGroupCostingInfo();

                this.appendGUIDs(projectID);

                this.addProjeMultipleAdditionTable(projectID);

                this.projectCostLayer.applyEdits(null, [projectDetail.projectFeature], null,
                    lang.hitch(this, this.projetCostLayerEditsComplete),
                    this._featureLayerEditsError);

                isUpdateFromSavebtn = false;

            },

            _saveProject: function (result) {

                projectID = this.generateGUID();
                //get layer field
                var ids = this.map.graphicsLayerIds;
                var len = ids.length;
                var g;

                g = new Graphic(result, new SimpleFillSymbol());
                var jsonData = {};

                for (i = 0; i < this.projectCostLayer.fields.length; i++) {
                    if (this.projectCostLayer.fields[i].name !== this.projectCostLayer.objectIdField) {
                        if (this.projectCostLayer.fields[i].name.toUpperCase() === this.projectIdFldName.toUpperCase()) {
                            jsonData[this.projectCostLayer.fields[i].name] = projectID;
                            break;
                        }
                    }
                }

                array.forEach(projectDetail.projectfieldAttrib, lang.hitch(this, function (fieldAttrib) {
                    if (fieldAttrib.fieldName.toUpperCase() !== this.projectIdFldName.toUpperCase()) {
                        jsonData[fieldAttrib.fieldName] = fieldAttrib.fieldValue;
                    }
                }));

                g.setAttributes(jsonData);

                this.addProjectGroupCostingInfo();

                this.appendGUIDs(projectID);

                this.addProjeMultipleAdditionTable(projectID);

                this.map.graphics.add(g);

                this.projectCostLayer.applyEdits([g], null, null,
                    lang.hitch(this, this.projetCostLayerEditsComplete),
                    this._featureLayerEditsError);
                isUpdateFromSavebtn = false;

            },

            //Add additional cost and cost factor in
            addProjeMultipleAdditionTable: function (projectID) {

                var prjIdFld;
                var description;
                var type;
                var value;
                var index;
                for (var i = 0; i < this.projectTables.length; i++) {

                    if (this.projectTables[i].title === this.projectMultiplierAdditionalCostTableName) {

                        for (var fieldCounter = 0; fieldCounter < this.projectMultiplierAdditionalCostFeatureLayer.fields.length; fieldCounter++) {
                            if (this.projectMultiplierAdditionalCostFeatureLayer.fields[fieldCounter].name.toUpperCase() === 'PROJECTID') {
                                prjIdFld = this.projectMultiplierAdditionalCostFeatureLayer.fields[fieldCounter].name;
                                continue;
                            }
                            if (this.projectMultiplierAdditionalCostFeatureLayer.fields[fieldCounter].name.toUpperCase() === 'DESCRIPTION') {
                                description = this.projectMultiplierAdditionalCostFeatureLayer.fields[fieldCounter].name;
                                continue;
                            }
                            if (this.projectMultiplierAdditionalCostFeatureLayer.fields[fieldCounter].name.toUpperCase() === 'VALUE') {
                                value = this.projectMultiplierAdditionalCostFeatureLayer.fields[fieldCounter].name;
                                continue;
                            }
                            if (this.projectMultiplierAdditionalCostFeatureLayer.fields[fieldCounter].name.toUpperCase() === 'TYPE') {
                                type = this.projectMultiplierAdditionalCostFeatureLayer.fields[fieldCounter].name;
                                continue;
                            }
                            if (this.projectMultiplierAdditionalCostFeatureLayer.fields[fieldCounter].name.toUpperCase() === 'ESCALATIONINDEX') {
                                index = this.projectMultiplierAdditionalCostFeatureLayer.fields[fieldCounter].name;
                            }

                        }
                        break;
                    }
                }
                if (this.isLoadProject) {
                    this.projectMultiplierAdditionalCostFeatureLayer.applyEdits(null, null, projectDetail.projectAddlnCostMultiplierfeatures, null, this._featureLayerEditsError);
                }

                var gridItems = array.map(projectDetail.projectAddlnCostMultiplierDetails, lang.hitch(this, function (projectAddlnCostMultiplierDetail) {

                    var gridRecord = {
                        attributes: {}
                    };
                    gridRecord.attributes[prjIdFld] = projectID;
                    gridRecord.attributes[description] = projectAddlnCostMultiplierDetail.description;
                    gridRecord.attributes[value] = projectAddlnCostMultiplierDetail.value;
                    gridRecord.attributes[type] = projectAddlnCostMultiplierDetail.type;
                    gridRecord.attributes[index] = projectAddlnCostMultiplierDetail.index;

                    return gridRecord;
                }));

                if (gridItems.length > 0) {
                    this.projectMultiplierAdditionalCostFeatureLayer.applyEdits(gridItems, null, null, null, this._featureLayerEditsError);
                }
            },

            // Event handler for when Buffer (Geometry Service) operation is complete.
            // returns: nothing
            onBufferComplete: function (buffers) {

                var buffer = buffers[0];
                var projectID = null;
                if (!this.isLoadProject) {
                    projectID = projectDetail.projectId;
                } else {

                    projectID = this.generateGUID();
                }

                //get layer field
                var ids = this.map.graphicsLayerIds;
                var len = ids.length;
                var g;
                g = new Graphic(buffer, new SimpleFillSymbol());
                var jsonData = {};

                if (this.isLoadProject) {
                    this._updateProject(result);
                } else {
                    this._saveProject(result);
                }
            },


            // Generates an universal unique id.
            generateGUID: function () {
                var d = new Date().getTime();
                var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = (d + Math.random() * 16) % 16 | 0;
                    d = Math.floor(d / 16);
                    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
                return uuid;
            },

            // Generate and append Project ID and PROJECTGROUPCOSTINGINFOID to all features drawn in current session.
            appendGUIDs: function (projectID) {
                var features = [];

                for (var layerId in this.featureStorage) {

                    if (this.featureStorage.hasOwnProperty(layerId)) {

                        features = array.map(this.featureStorage[layerId].addedFeatures, function (assetdetail) {

                            var prjgrpInfofldName = Common.getActualFieldName(assetdetail.feature.attributes, 'PROJECTGROUPCOSTINGINFOID');
                            var projectId = Common.getActualFieldName(assetdetail.feature.attributes, 'PROJECTID');
                            assetdetail.feature.attributes[prjgrpInfofldName] = assetdetail.projectGroupCostingId;
                            assetdetail.feature.attributes[projectId] = projectID;

                            return assetdetail.feature;
                        });

                        if (features.length > 0) {

                            var layer = this.featureStorage[layerId].layer;
                            layer.applyEdits(null, features, null, null, this._featureLayerEditsError);
                        }
                    }
                }
            },

            //add project Group costing information 
            addProjectGroupCostingInfo: function () {
                //get ProjectGroupCostingInfo Table
                var projectGroupCostingInfoTable;

                var projectGrpCostid, grpCostEqn, equType;
                for (var i = 0; i < this.projectTables.length; i++) {

                    if (this.projectTables[i].title === this.projectGroupCostingInfoTable) {
                        projectGroupCostingInfoTable = this.projectTables[i];

                        for (var fieldCounter = 0; fieldCounter < this.projectGroupCostingInfoTableFeatureLayer.fields.length; fieldCounter++) {
                            if (this.projectGroupCostingInfoTableFeatureLayer.fields[fieldCounter].name.toUpperCase() === 'PROJECTGROUPCOSTINGINFOID') {
                                projectGrpCostid = this.projectGroupCostingInfoTableFeatureLayer.fields[fieldCounter].name;
                                continue;
                            }
                            if (this.projectGroupCostingInfoTableFeatureLayer.fields[fieldCounter].name.toUpperCase() === 'GROUPCOSTEQUATION') {
                                grpCostEqn = this.projectGroupCostingInfoTableFeatureLayer.fields[fieldCounter].name;
                            }
                            if (this.projectGroupCostingInfoTableFeatureLayer.fields[fieldCounter].name.toUpperCase() === 'EQUATIONTYPE') {
                                equType = this.projectGroupCostingInfoTableFeatureLayer.fields[fieldCounter].name;
                            }
                        }
                        break;
                    }
                }

                for (rowIndex = 0; rowIndex < this.assetValue.length; rowIndex++) {

                    var assetProjectGroupInfoID = this.assetValue[rowIndex].prjGrpCostInfoID;

                    var item = this.grid.getItem(rowIndex);

                    var finalGroupCostEquation = this.assetValue[rowIndex].assetDetails[0].modifiedCostEquation;

                    var gridRecord = {
                        attributes: {}
                    };

                    if (this.assetValue[rowIndex].isNewGroup) {
                        gridRecord.attributes[projectGrpCostid] = assetProjectGroupInfoID;
                        gridRecord.attributes[grpCostEqn] = finalGroupCostEquation;
                        gridRecord.attributes[equType] = this.assetValue[rowIndex].assetDetails[0].subGeoId;
                        this.projectGroupCostingInfoTableFeatureLayer.applyEdits([gridRecord], null, null, null, this._featureLayerEditsError);
                    } else {
                        var projectGroupCostingInfofeature = this.assetValue[rowIndex].assetDetails[0].projectGroupCostingFeature;

                        projectGroupCostingInfofeature.attributes[projectGrpCostid] = assetProjectGroupInfoID;
                        projectGroupCostingInfofeature.attributes[grpCostEqn] = finalGroupCostEquation;
                        projectGroupCostingInfofeature.attributes[equType] = this.assetValue[rowIndex].assetDetails[0].subGeoId;

                        this.projectGroupCostingInfoTableFeatureLayer.applyEdits(null, [projectGroupCostingInfofeature], null, null, this._featureLayerEditsError);

                    }
                }
            },

            // Event handler for when Geometry Service has an error.
            // returns: nothing
            geometricServiceOnError: function (err) {
                console.log('GeometryService ERROR: ' + err);
            },

            // Event handler for when edits are complete on the project layer.
            // returns: nothing
            projetCostLayerEditsComplete: function (adds, deletes, updates) {

                //after project creation disable Save Button and Clear Session button and enable Previous Button
                html.addClass(this.clearSessionButton, 'jimu-state-disabled');
                html.addClass(this.saveButton, 'jimu-state-disabled');
                html.removeClass(this.previousButton, 'jimu-state-disabled');

                //remove all element from assetValue
                if (this.assetValue !== null) {
                    this.assetValue.splice(0, this.assetValue.length);
                }

                //remove all element from featureStorage
                for (var element in this.featureStorage) {
                    delete this.featureStorage[element];
                }

                this.bindLayerInFeatureStorage();

                //set null featureStorageCount
                this.featureStorageCount = 0;

                this.grid.setStore(null);

                this.totalAssetCost.innerHTML = "0.00";
                this.grossProjectCost.innerHTML = "0.00";
                this.grossProjectCostAfterEscalation.innerHTML = "0.00";
                this.totalAssetCostAfterEscalation.innerHTML = "0.00";

                //clear cost esclation rows in table
                var costEscalationRows = this.costEscalationTable.getRows();
                array.forEach(costEscalationRows, lang.hitch(this, function (tr) {
                    this.costEscalationTable.deleteRow(tr);
                }));

                // Add newly created project to project list

                var loadProjectInfoitems = this.loadProjectInfoChooser.store.data;

                var loadProjectInfoitem = {
                    id: projectDetail.projectId,
                    name: projectDetail.projectName,
                    feature: projectDetail.projectFeature
                };
                this.loadProjectInfoChooser.store.data.push(loadProjectInfoitem);
                //Intialize Project Details
                this._initialiseProjectDetail();

                this.projectNameText.set("value", '');
                this.projectDescriptionText.set("value", '');

                this._getProjectsList();
                this.isUpdateFromSavebtn = false;
                this.shelter.hide();
                this._switchToSelectionMethod();

            },


            //bind layer in featuerstorage after project save
            bindLayerInFeatureStorage: function () {
                if (this.editor !== null) {
                    array.forEach(this.editor.settings.layers,
                        lang.hitch(this, function (layer) {
                            this.featureStorage[layer.id] = {
                                'layer': layer,
                                addedFeatures: []
                            };

                        }));
                }
            },

            // Toggles the visibility of the loading icon in the map pop up.
            // returns: nothing
            _togglePopupLoadingIcon: function () {
                var loading = dom.byId('popupLoadingIcon');
                html.removeClass(loading, 'hide');
            },

            // Hide the Info Window.
            // returns: nothing
            _hideInfoWindow: function () {
                if (this.map.infoWindow.isShowing) {
                    this.map.infoWindow.hide();
                }
            },

            // Toggles the Clear Session and Save button on the panel.
            // return: nothing
            updateSaveClearSessionBtn: function () {
                var disabledState = 'jimu-state-disabled';

                if (this.featureStorageCount === 0) {
                    html.addClass(this.clearSessionButton, disabledState);
                    html.addClass(this.saveButton, disabledState);
                    html.removeClass(this.previousButton, disabledState);
                } else {
                    html.removeClass(this.clearSessionButton, disabledState);
                    if (this.projectCostLayer) {
                        html.removeClass(this.saveButton, disabledState);
                    }
                    html.addClass(this.previousButton, disabledState);
                }
            },

            _roundProjectCostValue: function (cost) {
                var temp_cost = 0;
                cost = parseFloat(cost);
                switch (this.roundCostType.value) {
                case "NEAREST_WHOLE_NUMBER":
                    temp_cost = cost.toFixed();
                    break;
                case "NEAREST_TEN":
                    temp_cost = eval(cost.toFixed()) / 10;
                    temp_cost = eval(temp_cost.toFixed()) * 10;
                    break;
                case "NEAREST_HUNDRED":
                    temp_cost = eval(cost.toFixed()) / 100;
                    temp_cost = eval(temp_cost.toFixed()) * 100;
                    break;
                case "NEAREST_THOUSANDS":
                    temp_cost = eval(cost.toFixed()) / 1000;
                    temp_cost = eval(temp_cost.toFixed()) * 1000;
                    break;
                case "NEAREST_TEN_THOUSANDS":
                    temp_cost = eval(cost.toFixed()) / 10000;
                    temp_cost = eval(temp_cost.toFixed()) * 10000;
                    break;
                default:
                    temp_cost = cost.toFixed(2);
                }
                return temp_cost;

            },

            // Event handler for when an error occurs during a layer edit.
            // returns: nothing
            _featureLayerEditsError: function (err) {
                this.shelter.hide();
                //console.log('Apply Edits Failed, error code: ' + err.code);
                console.log('Apply Edits Failed, error message: ' + err.message);
                console.log('Apply Edits Failed, error details: ' + err.details[0]);
            },

            // Event handler for when an error occurs during a query execute.
            // returns: nothing
            _queryError: function (err) {
                this.shelter.hide();

                //console.log('error on queryTask, error code: ' + err.code);
                console.log('error on queryTask, error message: ' + err.message);
                console.log('error on queryTask, error details: ' + err.details[0]);
                console.log('please check the requirements and configuration');
            },

            // Event handler for when an error occurs during a query count execute on feature layer.
            // returns: nothing
            _queryErrorOrphanCount: function (err) {

                //console.log('error on queryTask, error code: ' + err.code);
                console.log('error on queryTask, error message: ' + err.message);
                console.log('error on queryTask, error details: ' + err.details[0]);
                console.log('please check the requirements and configuration');

                if (this.layerCounter < this.layers.length) {
                    this._getOrphanAssetsCount(0);
                }
                this.shelter.hide();
            },

            // Event handler for when an error occurs during a query execute on promise.
            // returns: nothing
            _queryErrorOnPromise: function (err) {
                this.shelter.hide();

                //console.log('error on queryTask on promise, error code: ' + err.code);
                console.log('error on queryTask on promise, error message: ' + err.message);
                console.log('error on queryTask on promise, error details: ' + err.details[0]);
                console.log('please check the requirements and configuration');
            },

            // Read configuration
            // returns: nothing
            readConfiguration: function () {

                //lookupTable
                this.lookupTable = this.config.lookupTableName;

                //projectGroupCostingInfoTable
                this.projectGroupCostingInfoTable = this.config.projectGroupCostingInfoTableName;

                // project multiplier additional cost table
                this.projectMultiplierAdditionalCostTableName = this.config.projectMultiplierAdditionalCostTableName;

                // Geography layer
                this.costingGeometryLayer = Common.getLayerbyTitleFromMap(this.map, this.config.costingGeometryLayerName);

                //Project Layer
                this.projectCostLayer = Common.getLayerbyTitleFromMap(this.map, this.config.projectCostLayerName);

                //read Project Layer Fields
                this._readProjectLayerConfigFields();

                //Length Unit Configuration
                this._readLengthConfiguration();

                //Area and Length Unit Configuration
                this._readAreaLengthConfiguration();

                //currency Configuration
                this._readCurrencyConfigurataion();

                // round cost settings
                this.roundCostType = this.config.roundCostType;

                // project area type
                this.projectAreaType = this.config.projectAreaType;

                //Convex Hull Buffer Distance Configuration
                this.convexHullBufferDistance = this.config.cHullBufferDistance;

                //statistics configuration
                this.statisticsFields = this.config.statisticsLayer;
                this.mapFeatureLayers = this.config.mapFeatureLayers;
            },

            //read Project Layer Fields
            _readProjectLayerConfigFields: function () {
                // project layer config fields
                this.projectLayerConfigFields = this.config.projectLayerConfigFields;

                for (var i = 0; i < this.projectLayerConfigFields.fields.length; i++) {
                    if (this.projectLayerConfigFields.fields[i].fieldDescription.toUpperCase() === 'ID') {
                        this.projectIdFldName = this.projectLayerConfigFields.fields[i].layerFieldName;
                    }
                    if (this.projectLayerConfigFields.fields[i].fieldDescription.toUpperCase() === 'NAME') {
                        this.projectNameFldName = this.projectLayerConfigFields.fields[i].layerFieldName;
                    }
                    if (this.projectLayerConfigFields.fields[i].fieldDescription.toUpperCase() === 'DESCRIPTION') {
                        this.projectDescriptionFldName = this.projectLayerConfigFields.fields[i].layerFieldName;
                    }
                    if (this.projectLayerConfigFields.fields[i].fieldDescription.toUpperCase() === 'TOTAL COST') {
                        this.projectTotalCostFldName = this.projectLayerConfigFields.fields[i].layerFieldName;
                    }
                    if (this.projectLayerConfigFields.fields[i].fieldDescription.toUpperCase() === 'GROSS COST') {
                        this.projectGrossCostFldName = this.projectLayerConfigFields.fields[i].layerFieldName;
                    }
                }
            },

            // Read configuration for currency.
            // returns: nothing
            _readCurrencyConfigurataion: function () {
                this.defaultCurrencyUnit = this.nls.dollar;

                this.currencyGrossProjectCostUnitDiv.innerHTML = " (" + this.defaultCurrencyUnit + ") : ";
                this.currencyUnitTotalAssetCostDiv.innerHTML = " (" + this.defaultCurrencyUnit + ") : ";

                if (this.config.currencyUnit) {
                    this.defaultCurrencyUnit = this.config.currencyUnit;
                    this.currencyGrossProjectCostUnitDiv.innerHTML = " (" + this.config.currencyUnit + ") : ";
                    this.currencyUnitTotalAssetCostDiv.innerHTML = " (" + this.config.currencyUnit + ") : ";
                }
            },

            // Read configuration for length measurements.
            // returns: nothing
            _readLengthConfiguration: function () {
                var defaultLengthUnit = {
                    label: this.nls.foot,
                    value: 'UNIT_FOOT'
                };

                this.lengthUnit = GeometryService.UNIT_FOOT;

                this.lengthUnitDescription = " " + defaultLengthUnit.label + " ";

                if (this.config.lengthUnit.value === "UNIT_FOOT") {
                    if (this.config.lengthUnit.label) {
                        this.lengthUnitDescription = " ft. ";
                    }
                    if (this.config.lengthUnit.value) {
                        this.lengthUnit = GeometryService.UNIT_FOOT;
                    }

                } else if (this.config.lengthUnit.value === "UNIT_METER") {
                    if (this.config.lengthUnit.label) {
                        this.lengthUnitDescription = " Mtr. ";
                    }
                    if (this.config.lengthUnit.value) {
                        this.lengthUnit = GeometryService.UNIT_METER;
                    }
                } else if (this.config.lengthUnit.value === "UNIT_STATUTE_MILE") {
                    if (this.config.lengthUnit.label) {
                        this.lengthUnitDescription = " mi. ";
                    }
                    if (this.config.lengthUnit.value) {
                        this.lengthUnit = GeometryService.UNIT_STATUTE_MILE;
                    }
                } else {
                    if (this.config.lengthUnit.label) {
                        this.lengthUnitDescription = " km. ";
                    }
                    if (this.config.lengthUnit.value) {
                        this.lengthUnit = GeometryService.UNIT_KILOMETER;
                    }
                }
            },

            // Read configuration for area and length measurements.
            // returns: nothing
            _readAreaLengthConfiguration: function () {
                var defaultAreaAndLengthUnit = {
                    label: this.nls.squareFeet,
                    value: 'UNIT_SQUARE_FEET'
                };

                this.areaLengthUnit = '109405';

                this.areaLengthUnitDescription = " " + defaultAreaAndLengthUnit.label + " ";

                if (this.config.areaAndLengthUnit.value === "UNIT_SQUARE_FEET") {
                    if (this.config.areaAndLengthUnit.label) {
                        this.areaLengthUnitDescription = " Sq. ft. ";
                    }
                    if (this.config.areaAndLengthUnit.value) {
                        this.areaLengthUnit = 109405;
                    }

                } else if (this.config.areaAndLengthUnit.value === "UNIT_SQUARE_METERS") {
                    if (this.config.areaAndLengthUnit.label) {
                        this.areaLengthUnitDescription = " Sq. Mtr. ";
                    }
                    if (this.config.areaAndLengthUnit.value) {
                        this.areaLengthUnit = 109404;
                    }
                } else if (this.config.areaAndLengthUnit.value === "UNIT_SQUARE_MILES") {
                    if (this.config.areaAndLengthUnit.label) {
                        this.areaLengthUnitDescription = " Sq. mi. ";
                    }
                    if (this.config.areaAndLengthUnit.value) {
                        this.areaLengthUnit = 109439;
                    }
                } else {
                    if (this.config.areaAndLengthUnit.label) {
                        this.areaLengthUnitDescription = " Sq. km. ";
                    }
                    if (this.config.areaAndLengthUnit.value) {
                        this.areaLengthUnit = 109414;
                    }
                }
            },

            onClose: function () {
                //clear selected feature from map
                Common.clearSelectedFeaturesFromMap(this.map);

                //destroy editor
                if (this.editor) {
                    this.editor.destroy();
                }

                this.editor = null;
                esriBundle.toolbars.draw.start = this._defaultStartStr;
                esriBundle.toolbars.draw.addPoint = this._defaultAddPointStr;

                this.enableWebMapPopup();

                this.layers = [];

                //remove event on widget close
                if (this.hideEvent !== null) {
                    this.hideEvent.remove();
                }

                if (this.showEvent !== null) {
                    this.showEvent.remove();
                }

                //check the registered item on widget close
                this.isOpenCheck = true;

            },

            //reset Main Widget panel
            resetMainWidgetPanel: function () {

                //after project creation disable Save Button and Clear Session button and enable Previous Button
                html.addClass(this.clearSessionButton, 'jimu-state-disabled');
                html.addClass(this.saveButton, 'jimu-state-disabled');
                html.removeClass(this.previousButton, 'jimu-state-disabled');

                //remove all element from assetValue
                if (this.assetValue !== null) {
                    this.assetValue.splice(0, this.assetValue.length);
                }

                //remove all element from featureStorage
                for (var element in this.featureStorage) {
                    delete this.featureStorage[element];
                }

                //set null featureStorageCount
                this.featureStorageCount = 0;

                if (this.grid) {
                    this.grid.setStore(null);

                }
                if (this.detailAssetDescriptionTreeGrid) {
                    this.detailAssetDescriptionTreeGrid.setStore(null);
                }

                this.totalAssetCost.innerHTML = "0.00";
                this.grossProjectCost.innerHTML = "0.00";
                this.grossProjectCostAfterEscalation.innerHTML = "0.00";
                this.totalAssetCostAfterEscalation.innerHTML = "0.00";

                //clear cost esclation rows in table
                var costEscalationRows = this.costEscalationTable.getRows();
                array.forEach(costEscalationRows, lang.hitch(this, function (tr) {
                    this.costEscalationTable.deleteRow(tr);
                }));

                //clear More Statistics Table's rows
                var moreStatisticsRows = this.moreStatisticsTable.getRows();
                array.forEach(moreStatisticsRows, lang.hitch(this, function (tr) {
                    this.moreStatisticsTable.deleteRow(tr);
                }));

                this.projectNameText.set("value", '');
                this.projectDescriptionText.set("value", '');

                //Intialize Project Details
                this._initialiseProjectDetail();
                this.isOpenCheck = false;
            },

            destroy: function () {
                this.inherited(arguments);
            },

            onMaximize: function () {
                setTimeout(lang.hitch(this, this.resize), 100);
            },

            //resize the widget component
            resize: function () {
                var widgetBox = html.getMarginBox(this.domNode);
                var height = widgetBox.h;
                var width = widgetBox.w;
                if (this.editor) {
                    if (this.editor.templatePicker) {
                        this.editor.templatePicker.update();
                    }
                }

                query(".dojoxGridRowTable", this.domNode).style('width', width - 32 + 'px');

                if ((this.isOnScreen) && (this.placeholderIndex !== undefined)) {
                    this.resizeNewStatSelect();
                }
            }

        });
    });