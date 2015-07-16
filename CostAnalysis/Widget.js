define([
    'dojo/_base/declare',
    'dojo/_base/kernel',
    'dojo/_base/lang',

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

    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',

    'esri/dijit/editing/Editor',
    'esri/dijit/AttributeInspector',

    'esri/geometry/Point',
    'esri/layers/FeatureLayer',

    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/SimpleFillSymbol',

    'esri/Color',
    'esri/graphic',

    "esri/tasks/QueryTask",
    'esri/tasks/query',
    'esri/tasks/GeometryService',
    'esri/tasks/BufferParameters',
    "esri/geometry/geometryEngine",


     "dijit/registry",
     "dojo/_base/connect",

     "dojox/grid/DataGrid",
	 "dojox/grid/cells",
	 "dojox/grid/cells/dijit",
	 "dojo/store/Memory",
	 "dojo/data/ObjectStore",
	 "dojo/date/locale",
	 "dojo/currency",
     "dijit/form/CurrencyTextBox",
     "dijit/form/NumberTextBox",

     "dijit/TooltipDialog",
     "dijit/Dialog",
     "dijit/popup",
     "dijit/form/TextBox",
     "dijit/form/Button",

     'jimu/LayerInfos/LayerInfoFactory',
     'jimu/LayerInfos/LayerInfos',

     'jimu/SpatialReference/utils',
     'jimu/SpatialReference/unitUtils',

     'jimu/utils'


],
  function (
   declare,
   dojo,
   lang,

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

   _WidgetsInTemplateMixin,
   BaseWidget,

   Editor,
   AttributeInspector,

   Point,
   FeatureLayer,

   SimpleMarkerSymbol,
   SimpleFillSymbol,

   Color,
   Graphic,

   QueryTask,
   Query,
   GeometryService,
   BufferParameters,
   geometryEngine,

   registry,
   connect,

   DataGrid,
   cells,
   cellsDijit,
   Memory,
   ObjectStore,
   locale,
   currency,
   CurrencyTextBox,
   NumberTextBox,

   TooltipDialog,
   Dialog,
   popup,
   TextBox,
   Button,

   LayerInfoFactory,
   LayerInfos,

   utils,
   unitUtils,
   jimuUtils

  ) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Cost Analysis',
      baseClass: 'jimu-widget-asset-cost-analysis',
      editor: null,
      layers: null,

      assetValue: null,

      featureStorage: {},
      featureStorageCount: 0,

      //operational layer infos
      operLayerInfos: null,

      projectCostLayer: null,
      arcgisGeomtryService: null,
      lookupTable: null,
      projectGroupCostingInfoTable: null,

      costEquationTooltipDialog: null,

      mapUnit: null,
      lengthUnit: null,
      areaLengthUnit: null,
      lengthUnitDescription: null,
      areaLengthUnitDescription: null,
      defaultCurrencyUnit: null,

      //variable for asset grid
      assetTypeTemplate: null,
      assetInitialCostIDTemplate: null,
      assetFeatureClassTemplate: null,
      featureGeomtryTypeTemplate: null,
      assetMeasurementTemplate: null,
      prjGrpCostingInfoID: null,

      projectTables: null,
      projectGroupCostingInfoTableFeatureLayer: null,

      hideEvent: null,
      showEvent: null,

      isOpenCheck: false,

      postCreate: function () {
        this.inherited(arguments);
        this.readConfiguration();
      },

      onOpen: function () {

        this.layers = [];

        this.disableWebMapPopup();

        this.getLayers();

        this.initEditor();

        if (!this.isOpenCheck) {

          assetValue = [];

          this.createAssetGridLayout();

          this.createAssetTooltipDialogBox();

          this.bindLayerEvents();
        }

        this.initGeometryService();

        this.bindEvents();

        this.getLayerInfo();

        this.disableMouseEvent();

      },

      //disable mouse event on label layer
      disableMouseEvent: function () {
        var ids = this.map.graphicsLayerIds;
        var len = ids.length;
        for (var i = 0; i < len; i++) {
          var layer = this.map.getLayer(ids[i]);
          if (layer.type != 'Feature Layer') {
            if (layer.featureLayers != undefined) {
              if (layer.featureLayers.length > 0) {
                layer.disableMouseEvents();
              }
            }

          }
        }

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

      bindEvents: function () {

        hideEvent = on(this.map.infoWindow, 'hide', lang.hitch(this, this._onHideInfoWindow));
        showEvent = on(this.map.infoWindow, 'show', lang.hitch(this, this._onShowInfoWindow));


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


      //Get Layer from webmap
      getLayers: function () {
        var layerInfos = this.config.editor.layerInfos;
        for (var i = 0; i < layerInfos.length; i++) {
          var featureLayer = layerInfos[i].featureLayer;
          var layer = this.getLayerFromMap(featureLayer.url);
          if (!layer) {
            if (!layerInfos[i].featureLayer.options) {
              layerInfos[i].featureLayer.options = {};
            }
            if (!layerInfos[i].featureLayer.options.outFields) {
              if (layerInfos[i].fieldInfos) {
                layerInfos[i].featureLayer.options.outFields = [];
                for (var j = 0; j < layerInfos[i].fieldInfos.length; j++) {
                  layerInfos[i].featureLayer.options.outFields.push(layerInfos[i].fieldInfos[j].fieldName);
                }
              } else {
                layerInfos[i].featureLayer.options.outFields = ["*"];
              }
            }
            layer = new FeatureLayer(featureLayer.url, featureLayer.options);
            this.map.addLayer(layer);
          }
          if (layer.visible) {
            layerInfos[i].featureLayer = layer;
            this.layers.push(layerInfos[i]);
          }
        }
      },

      getLayerFromMap: function (url) {
        var ids = this.map.graphicsLayerIds;
        var len = ids.length;
        for (var i = 0; i < len; i++) {
          var layer = this.map.getLayer(ids[i]);
          if (layer.url === url) {
            return layer;
          }
        }
        return null;
      },

      //Initialize Editor
      initEditor: function () {
        if (!this.editor) {
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

          if (!this.assetEditerDiv) {
            this.assetEditerDiv = html.create("div", {
              style: {
                width: "100%",
                height: "100%"
              }
            });
            html.place(this.assetEditerDiv, this.domNode);
          }

          this.editor = new Editor(params, this.assetEditerDiv);
          this.editor.startup();

          setTimeout(lang.hitch(this, this.resize), 100);
        }
      },

      // Initializes the Geometry Service
      // returns: nothing
      initGeometryService: function () {
        var arcgisGeometryServiceURL = null;
        if (esriConfig.defaults.geometryService) {
          arcgisGeometryServiceURL = esriConfig.defaults.geometryService.url;
        }

        if (!arcgisGeometryServiceURL) {
          var servicesObj = jimuUtils.getServices();
          arcgisGeometryServiceURL = servicesObj.geometryService;
        }

        this.arcgisGeomtryService = new GeometryService(arcgisGeometryServiceURL);
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
      lang.hitch(this, function (results) {
        this._togglePanelLoadingIcon();
      }));

    }));
      },

      // Event handler before edits are applied to a layer.
      // returns: nothing
      layerBeforeApplyEditsComplete: function (results) {
        //close tooltip dialog box 
        dijit.popup.close(costEquationTooltipDialog);
        this._togglePanelLoadingIcon();

        if (results.deletes && results.deletes.length > 0) {
          this.delAddedFeature(results.deletes, results.target, 'delete');
        }

        if (results.adds && results.adds.length > 0) {

          this.measureGeometry(results.adds, results.target);
        }

        if (results.updates && results.updates.length > 0) {
          this.delAddedFeature(results.updates, results.target, 'update');

        }
      },


      // Toggle the loading icon in the widget panel.
      // returns: nothing
      _togglePanelLoadingIcon: function () {
        var loading = dom.byId('panelLoadingIcon');

        if (html.hasClass(loading, 'hide')) {
          html.removeClass(loading, 'hide');
        } else {
          html.addClass(loading, 'hide');
        }
      },


      // Remove stored features drawn in this session.
      // returns nothing.
      delAddedFeature: function (deletes, target, operationType) {
        if (this.featureStorageCount === 0) {
          return;
        }

        array.forEach(deletes, lang.hitch(this, function (selectedFeature) {
          var features = this.featureStorage[selectedFeature.getLayer().id].addedFeatures;

          var selFeatInitialCostID = this.getFieldValue(selectedFeature.attributes, 'INITIALCOSTID');

          selFeatInitialCostID = selFeatInitialCostID.replace(/{/gi, '');
          selFeatInitialCostID = selFeatInitialCostID.replace(/}/gi, '');

          for (var i = 0; i < features.length; i++) {
            var f = features[i];

            var InitialCostID = this.getFieldValue(f.feature.attributes, 'INITIALCOSTID');

            InitialCostID = InitialCostID.replace(/{/gi, '');
            InitialCostID = InitialCostID.replace(/}/gi, '');

            if ((InitialCostID.toUpperCase() === selFeatInitialCostID.toUpperCase()) && (f.feature === selectedFeature)) {
              var type = f.feature.geometry.type;
              var measurement = 0;
              if (operationType === 'delete') {
                features.splice(i, 1);
                measurement = -1 * f.measurement;
                this.featureStorageCount--;
                //update feature count  
                if (type === 'point') {
                  var curr = parseInt(this.pointCount.innerHTML, 10);
                  this.pointCount.innerHTML = curr - 1;
                }
              }

              else {
                var geometryMeasure = 0;

                if (type === 'polyline') {
                  geometryMeasure = this.getGeometryLength(selectedFeature);
                  measurement = geometryMeasure - f.measurement;
                  features[i].measurement = geometryMeasure;
                }
                else if (type === 'polygon') {
                  geometryMeasure = this.getGeometryArea(selectedFeature);
                  measurement = geometryMeasure - f.measurement;
                  features[i].measurement = geometryMeasure;
                }

                features[i].feature = selectedFeature;

              }

              //update Asset Grid after deletion of asset
              this.updateAssetGrid(f.feature, measurement);

              this.updateTotals(f.feature, measurement);

              this.updateSaveClearSessionBtn();
              break;
            }
          }
        }));


      },

      getFieldValue: function (attributes, fieldName) {
        for (key in attributes) {
          if (attributes.hasOwnProperty(key)) {
            if (key.toUpperCase() === fieldName.toUpperCase()) {
              return attributes[key];
            }

          }

        }

      },

      // Calculate measurement of a the given features.
      // returns: nothing
      measureGeometry: function (features, target) {

        if (features.length === 0) {
          return;
        }

        //atmost 1 feature.
        var feature = features[0];

        if (feature.geometry.type === 'polyline') {
          this.measurePolylineGeometry(feature, target);

        } else if (feature.geometry.type === 'polygon') {
          this.measurePolygonGeometry(feature, target);

        } else { // Point                 
          this.afterCalcComplete(feature, target, 1);
        }
      },


      // Calculate length of a Polyline (feature)
      // returns: nothing
      measurePolylineGeometry: function (feature, target) {

        var length = this.getGeometryLength(feature);
        this.afterCalcComplete(feature, target, length);
      },

      // Calculate area of a Polygon (feature)
      // returns: nothing
      measurePolygonGeometry: function (feature, target) {

        var area = this.getGeometryArea(feature);
        this.afterCalcComplete(feature, target, area);
      },

      getGeometryLength: function (feature) {
        return geometryEngine.geodesicLength(feature.geometry, this.lengthUnit);
      },

      getGeometryArea: function (feature) {
        return geometryEngine.geodesicArea(feature.geometry, this.areaLengthUnit);
      },


      // Event handler for when Geometry Service calculation is complete.
      // returns: nothing
      afterCalcComplete: function (feature, target, measurement) {

        measurement = Math.abs(measurement.toFixed(2));

        this.updateTotals(feature, measurement);
        this.store(feature, target, measurement);
      },

      // Update the running totals displayed on the panel.
      // returns: nothing
      updateTotals: function (feature, measurement) {
        var type = feature.geometry.type;
        var where;

        if (type !== 'point') {
          if (type === 'polyline') {
            where = this.totalLength;
          } else {
            where = this.totalArea;
          }

          var newMeasurement = (parseFloat(where.innerHTML) + measurement);
          where.innerHTML = Math.abs(newMeasurement.toFixed(2));
        }

      },

      // Store the feature along with it's measurement and cost.
      // returns: nothing
      store: function (feature, target, measurement) {
        var add = {
          'feature': feature,
          'measurement': measurement
        };

        var type = feature.geometry.type;

        this.featureStorage[target.id].addedFeatures.push(add);
        this.featureStorageCount++;

        //update feature count  
        if (type === 'point') {
          var curr = parseInt(this.pointCount.innerHTML, 10);
          this.pointCount.innerHTML = curr + 1;
        }

        this.updateSaveClearSessionBtn();

        //populate Asset Grid after asset drawn by editor
        this.populateAssetGrid(feature, target, measurement);

        //popup CostEquation Tooltip dialog box on cell click in grid
        this.popupCostEquationTooltip();

      },

      //create asset grid layout for drawn asset
      createAssetGridLayout: function () {

        gridLayout = [{
          defaultCell: { width: 'auto', editable: true, type: cells._Widget, styles: 'text-align: left;' },
          cells: [
          { name: 'Asset Description', field: 'description', width: 'auto', editable: false, styles: 'text-align: left;' /* Can't edit Asset Type of */ },

          ]
        }];


        grid = new DataGrid({
          //store: gridStore,
          structure: gridLayout,
          escapeHTMLInData: false,
          canSort: function () { return false; },
          style: "height: 150px; margin-top: 10px; border: 1px solid #C4E3FD;"
          // "class": "grid"                 
        }, "grid");
        grid.startup();

        //grid resize on widget resizing
        //              dojo.connect(this, "resize", grid, function () {
        //                  grid.resize();
        //              });

        grid.connect(this, 'resize', function () {
          grid.resize();
        });
      },

      //populate Asset Grid after asset drawn by editor
      populateAssetGrid: function (feature, target, measurement) {

        //get projectGroupCostingInfoTable fields
        this.getprojectGroupCostingInfoTablefield();

        var initialCostIdFldName;
        for (key in feature.attributes) {
          if (feature.attributes.hasOwnProperty(key)) {
            if (key.toUpperCase() === 'INITIALCOSTID') {
              this.assetInitialCostIDTemplate = feature.attributes[key];
              initialCostIdFldName = key;
              break;
            }

          }

        }

        //get current Active Template Name
        var currentActiveTemplate = this.editor.templatePicker.getSelected();
        this.assetTypeTemplate = currentActiveTemplate.template.name;

        this.assetFeatureClassTemplate = target.name;
        this.featureGeomtryTypeTemplate = feature.geometry.type;
        this.assetMeasurementTemplate = measurement;

        //get data from CostingTable              
        var costingTable;
        for (var i = 0; i < this.projectTables.length; i++) {
          if (this.projectTables[i].title === this.lookupTable) {
            costingTable = this.projectTables[i];
            break;
          }
        }

        //get unique id to for each asset group
        this.prjGrpCostingInfoID = this.generateGUID();

        var qt = new QueryTask(costingTable.layerObject.url);

        qt.on("complete", lang.hitch(this, this.showResults));

        var query = new Query();

        query.where = initialCostIdFldName + " = " + "'" + this.assetInitialCostIDTemplate + "'";
        query.returnGeometry = false;
        query.outFields = ["*"];

        qt.execute(query);

      },

      showResults: function (featureSet) {

        var assetType = this.assetTypeTemplate;
        var assetInitialCostID = this.assetInitialCostIDTemplate;
        var assetFeatureClass = this.assetFeatureClassTemplate;
        var featureGeomtryType = this.featureGeomtryTypeTemplate;
        var assetMeasurement = this.assetMeasurementTemplate;

        var PROJECTGROUPCOSTINGINFOID = this.prjGrpCostingInfoID;

        var assetLengthUnit = this.lengthUnitDescription;
        var assetAreaLengthUnit = this.areaLengthUnitDescription;

        var lengthUnitValue = this.lengthUnit;
        var areaLengthUnitValue = this.areaLengthUnit;

        var assetUnitCost;
        var costEquation;

        var replaceUnitCostInCostEQT;
        var replaceQuantityinCostEQT;
        var solveCostEQT;
        var totalCostCalculated;

        //object store to store the value of store in memory
        var objectStore;

        //variable for row value                 
        var rowDataUnitCost;
        var rowDataTotalQuantity;
        var rowDataCostEQT;
        var rowDescription;

        var testVals = {};
        var totalQuantityinGrid = 0;
        var data;

        //get unit cost and cost equation from featureset 
        for (key in featureSet.featureSet.features[0].attributes) {
          if (featureSet.featureSet.features[0].attributes.hasOwnProperty(key)) {
            if (key.toUpperCase() === 'UNITCOST') {
              assetUnitCost = featureSet.featureSet.features[0].attributes[key];
            }

            if (key.toUpperCase() === 'COSTEQUATION') {
              costEquation = featureSet.featureSet.features[0].attributes[key];
            }

          }

        }

        if (assetValue.length === 0) {
          if (!testVals[assetInitialCostID]) {
            testVals[assetInitialCostID] = true;

            totalQuantityinGrid = assetMeasurement;

            //replace default UnitCost value in cost equation by Unitcost field
            replaceUnitCostInCostEQT = costEquation.replace(/{UNITCOST}/gi, assetUnitCost);

            replaceQuantityinCostEQT = replaceUnitCostInCostEQT.replace(/{QUANTITY}/gi, totalQuantityinGrid);

            solveCostEQT = eval(replaceQuantityinCostEQT);

            totalCostCalculated = solveCostEQT;

            if (featureGeomtryType === 'point') {
              rowDescription = assetMeasurement + " " + assetType + " " + assetFeatureClass + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostCalculated.toFixed(2));
            }

            else if (featureGeomtryType === 'polyline') {
              rowDescription = assetMeasurement.toFixed(2) + assetLengthUnit + assetType + " " + assetFeatureClass + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostCalculated.toFixed(2));
            }

            else {
              rowDescription = assetMeasurement.toFixed(2) + assetAreaLengthUnit + assetType + " " + assetFeatureClass + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostCalculated.toFixed(2));
            }

            assetValue.push({
              description: rowDescription, name: assetType, featureClassName: assetFeatureClass,
              geometryType: featureGeomtryType, lengthUnit: lengthUnitValue, areaLengthUnit: areaLengthUnitValue,
              currencyUnit: this.defaultCurrencyUnit, IntialCostID: assetInitialCostID, totalQuantity: totalQuantityinGrid,
              totalCost: totalCostCalculated, unitCost: assetUnitCost, costEQT: replaceQuantityinCostEQT, costEQTWithQuantity: replaceUnitCostInCostEQT,
              originalCostEquation: costEquation, prjGrpCostInfoID: PROJECTGROUPCOSTINGINFOID
            });

          }

          data = {
            identifier: 'name', //This field needs to have unique values
            label: 'name', //Name field for display. Not pertinent to a grid but may be used elsewhere.
            items: assetValue
          };

          objectStore = new Memory({ data: data });

          gridStore = new ObjectStore({ objectStore: objectStore });

          grid.setStore(gridStore);


        }
        else {
          var isTypeExists;
          var i;
          for (i = 0; i < assetValue.length; i++) {

            if ((assetValue[i].IntialCostID.toUpperCase() === assetInitialCostID.toUpperCase()) || (assetValue[i].IntialCostID.toUpperCase() === "{" + assetInitialCostID.toUpperCase() + "}")) {

              isTypeExists = true;
              totalQuantityinGrid = assetValue[i].totalQuantity;
              break;
            }
          }
          if (isTypeExists) {

            var item = grid.getItem(i);

            rowDataUnitCost = assetValue[i].unitCost;
            rowDataModifiedCostEquation = assetValue[i].costEQTWithQuantity;

            totalQuantityinGrid = eval(totalQuantityinGrid + assetMeasurement);

            //replace default UnitCost value in cost equation by Unitcost field
            replaceUnitCostInCostEQT = rowDataModifiedCostEquation.replace(/{UNITCOST}/gi, rowDataUnitCost);

            replaceQuantityinCostEQT = replaceUnitCostInCostEQT.replace(/{QUANTITY}/gi, totalQuantityinGrid);

            solveCostEQT = eval(replaceQuantityinCostEQT);

            totalCostCalculated = solveCostEQT;


            assetValue[i].totalQuantity = totalQuantityinGrid;
            assetValue[i].costEQT = replaceQuantityinCostEQT;
            assetValue[i].totalCost = totalCostCalculated;

            if (featureGeomtryType === 'point') {
              rowDescription = totalQuantityinGrid + " " + assetType + " " + assetFeatureClass + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostCalculated.toFixed(2));
            }

            else if (featureGeomtryType === 'polyline') {
              rowDescription = totalQuantityinGrid.toFixed(2) + assetLengthUnit + assetType + " " + assetFeatureClass + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostCalculated.toFixed(2));
            }

            else {
              rowDescription = totalQuantityinGrid.toFixed(2) + assetAreaLengthUnit + assetType + " " + assetFeatureClass + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostCalculated.toFixed(2));
            }

            assetValue[i].description = rowDescription;

            grid.update();


          }
          else {
            if (!testVals[assetInitialCostID]) {
              testVals[assetInitialCostID] = true;

              totalQuantityinGrid = assetMeasurement;

              //replace default UnitCost value in cost equation by Unitcost field
              replaceUnitCostInCostEQT = costEquation.replace(/{UNITCOST}/gi, assetUnitCost);

              replaceQuantityinCostEQT = replaceUnitCostInCostEQT.replace(/{QUANTITY}/gi, totalQuantityinGrid);

              solveCostEQT = eval(replaceQuantityinCostEQT);

              totalCostCalculated = solveCostEQT;


              if (featureGeomtryType === 'point') {
                rowDescription = totalQuantityinGrid + " " + assetType + " " + assetFeatureClass + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostCalculated.toFixed(2));
              }

              else if (featureGeomtryType === 'polyline') {
                rowDescription = totalQuantityinGrid.toFixed(2) + assetLengthUnit + assetType + " " + assetFeatureClass + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostCalculated.toFixed(2));
              }

              else {
                rowDescription = totalQuantityinGrid.toFixed(2) + assetAreaLengthUnit + assetType + " " + assetFeatureClass + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(totalCostCalculated.toFixed(2));
              }

              assetValue.push({
                description: rowDescription, name: assetType, featureClassName: assetFeatureClass,
                geometryType: featureGeomtryType, lengthUnit: lengthUnitValue, areaLengthUnit: areaLengthUnitValue,
                currencyUnit: this.defaultCurrencyUnit, IntialCostID: assetInitialCostID, totalQuantity: totalQuantityinGrid,
                totalCost: totalCostCalculated, unitCost: assetUnitCost, costEQT: replaceQuantityinCostEQT, costEQTWithQuantity: replaceUnitCostInCostEQT,
                originalCostEquation: costEquation, prjGrpCostInfoID: PROJECTGROUPCOSTINGINFOID
              });

            }

            data = {
              identifier: 'name', //This field needs to have unique values
              label: 'name', //Name field for display. Not pertinent to a grid but may be used elsewhere.
              items: assetValue
            };

            objectStore = new Memory({ data: data });

            gridStore = new ObjectStore({ objectStore: objectStore });

            grid.setStore(gridStore);

          }

        }

        //calculate actual project cost from grid
        this.projectCostCalculated();


      },

      projectCostCalculated: function () {

        var gridLength;
        var projectCalculatedCost = 0;

        grid.store.fetch({
          onComplete: function (items, request) // items is an array
          {
            gridLength = items.length; // number of items in grid
          }
        });

        for (var i = 0; i < gridLength; i++) {

          projectCalculatedCost = projectCalculatedCost + assetValue[i].totalCost;

        }

        if (projectCalculatedCost === 0) {

          this.totalAssetCost.innerHTML = "0.00";
          this.projectMultiplierNumber.value = "1.00";
          this.totalAdditionalCost.value = "0.00";
          this.grossProjectCost.innerHTML = "0.00";
        }

        else {

          this.totalAssetCost.innerHTML = this.formatNumber(projectCalculatedCost.toFixed(2));

          //calculate Gross Project Cost
          var actualPrjCost = parseFloat((dom.byId("totalAssetCost").innerHTML).replace(/\,/g, ''));
          var prjMultiplier = eval(projectMultiplierNumber.value);
          var addtionalPrjCost = eval(totalAdditionalCost.value);

          var costAfterProjectMultiplierAdded = eval(actualPrjCost * prjMultiplier);
          var costAfterAdditionalCostAdded = eval(costAfterProjectMultiplierAdded + addtionalPrjCost).toFixed(2);

          this.grossProjectCost.innerHTML = this.formatNumber(costAfterAdditionalCostAdded);

        }
      },

      //create Tooltip dialog box for cost equation
      createAssetTooltipDialogBox: function () {

        costEquationTooltipDialog = new TooltipDialog({
          id: 'costEquationTooltipDialog',
          style: "width: 300px;",
          content:
    '<label for="solvedCostEquation"><strong>Edit Cost Equation:</strong></label><br> <input id="solvedCostEQT" name="solvedCostEQT" data-dojo-attach-point="solvedCostEQT" size="32" style="margin:5px 0 5px 0;"><br>' +
    '<label for="originalCostEquation"><strong>Original Cost Equation:</strong></label> <br><input id="oriCostEQT" name="oriCostEQT" data-dojo-attach-point="oriCostEQT" readonly="true" size="32" style="margin-top:5px;color:#778899;"><br>' +
    '<button data-dojo-type="dijit/form/Button" id="saveCostEquation" style="margin-top:5px; margin-left:135px;">Save</button>' +
    '<button data-dojo-type="dijit/form/Button" id="cancelCostEquation" style="margin-top:5px; margin-left:5px;">Cancel</button>',


          onShow: lang.hitch(this, function () {

            on(dom.byId('saveCostEquation'), "click", lang.hitch(this, function (evt) {

              var selectedRowIndex = grid.selection.selectedIndex;

              var selectedRowQuantity = assetValue[selectedRowIndex].totalQuantity;
              var selectedRowGeometry = assetValue[selectedRowIndex].geometryType;
              var selectedRowAssetType = assetValue[selectedRowIndex].name;
              var selectedRowfeatureClassName = assetValue[selectedRowIndex].featureClassName;
              var checkLengthUnit = assetValue[selectedRowIndex].lengthUnit;
              var checkAreaLengthUnit = assetValue[selectedRowIndex].areaLengthUnit;
              var selectedRowCurrenyUnit = assetValue[selectedRowIndex].currencyUnit;

              var assetLengthUnit;
              var assetAreaLengthUnit;

              //check length unit
              if (checkLengthUnit === 9002) {
                assetLengthUnit = " ft. ";
              }
              else if (checkLengthUnit === 9001) {
                assetLengthUnit = " Mtr. ";
              }

              else if (checkLengthUnit === 9093) {
                assetLengthUnit = " mi. ";
              }
              else {
                assetLengthUnit = " km. ";
              }

              //check areaLength unit
              if (checkAreaLengthUnit === 109405) {
                assetAreaLengthUnit = " Sq. ft. ";
              }
              else if (checkAreaLengthUnit === 109404) {

                assetAreaLengthUnit = " Sq. Mtr. ";
              }

              else if (checkAreaLengthUnit === 109439) {

                assetAreaLengthUnit = " Sq. mi. ";
              }

              else {

                assetAreaLengthUnit = " Sq. km. ";
              }



              var selectedRowDescription;

              var editCostEquationWithQuantity = dom.byId('solvedCostEQT').value;

              var replaceEditCostEquation = editCostEquationWithQuantity.replace(/{QUANTITY}/gi, selectedRowQuantity);

              var evalCostEQT = eval(replaceEditCostEquation);

              assetValue[selectedRowIndex].costEQT = replaceEditCostEquation;
              assetValue[selectedRowIndex].totalCost = evalCostEQT;
              assetValue[selectedRowIndex].costEQTWithQuantity = evalCostEQT;


              if (selectedRowGeometry === 'point') {
                selectedRowDescription = selectedRowQuantity + " " + selectedRowAssetType + " " + selectedRowfeatureClassName + " : " + selectedRowCurrenyUnit + " " + this.formatNumber(evalCostEQT.toFixed(2));
              }

              else if (selectedRowGeometry === 'polyline') {
                selectedRowDescription = selectedRowQuantity.toFixed(2) + assetLengthUnit + selectedRowAssetType + " " + selectedRowfeatureClassName + " : " + selectedRowCurrenyUnit + " " + this.formatNumber(evalCostEQT.toFixed(2));
              }

              else {
                selectedRowDescription = selectedRowQuantity.toFixed(2) + assetAreaLengthUnit + selectedRowAssetType + " " + selectedRowfeatureClassName + " : " + selectedRowCurrenyUnit + " " + this.formatNumber(evalCostEQT.toFixed(2));
              }

              assetValue[selectedRowIndex].description = selectedRowDescription;
              assetValue[selectedRowIndex].costEQTWithQuantity = editCostEquationWithQuantity;

              grid.update();

              dojo.stopEvent(evt);
              dijit.popup.close(costEquationTooltipDialog);

              //calculate actual project cost from grid
              this.projectCostCalculated();

            }));

            on(dom.byId('cancelCostEquation'), "click", function (evt) {
              dojo.stopEvent(evt);
              dijit.popup.close(costEquationTooltipDialog);

            });
          }
          ),

          onMouseLeave: function () {
            dijit.popup.close(costEquationTooltipDialog);
          }
        });

      },

      //popup CostEquation Tooltip dialog box on cell click in grid
      popupCostEquationTooltip: function () {

        //on cell click event popup cost equation Tooltip dialog box
        grid.on("CellClick", function (event) {
          var rowNode = dojo.query(event.target).closest(".dojoxGridRow")[0];
          popup.open({
            popup: costEquationTooltipDialog,
            around: rowNode,

            onCancel: function () {
              popup.close(costEquationTooltipDialog);
            }

          });


          //get index of clicked row
          var rowIndex = event.rowIndex;

          var popupOriginalCostEquation = assetValue[rowIndex].originalCostEquation;
          var popupTotalQuantitty = assetValue[rowIndex].totalQuantity;
          var popupAssetUnitCost = assetValue[rowIndex].unitCost;
          var popupModifiedCostEQT = assetValue[rowIndex].costEQTWithQuantity;

          //replace default UnitCost value in cost equation by Unitcost field
          var replaceUnitCostInCostEQT = popupOriginalCostEquation.replace(/{UNITCOST}/gi, popupAssetUnitCost);

          //put original cost equation in Non Editable textbox
          dom.byId("oriCostEQT").value = replaceUnitCostInCostEQT;

          //put original cost equation in Editable textbox
          dom.byId("solvedCostEQT").value = popupModifiedCostEQT;

        });
      },

      //get Layer information from layerlist
      getLayerInfo: function () {

        if (this.map.itemId) {
          LayerInfos.getInstance(this.map, this.map.itemInfo)
  .then(lang.hitch(this, function (operLayerInfos) {
    this.operLayerInfos = operLayerInfos;

    this.projectTables = operLayerInfos.tableInfos;
  }));

        }
        else {
          var itemInfo = this._obtainMapLayers();
          LayerInfos.getInstance(this.map, itemInfo)
  .then(lang.hitch(this, function (operLayerInfos) {
    this.operLayerInfos = operLayerInfos;

    this.projectTables = operLayerInfos.tableInfos;

  }));


        }
      },

      updateAssetGrid: function (feature, measurement) {

        var assetInitialCostEQT = this.getFieldValue(feature.attributes, 'INITIALCOSTID');

        var assetLengthUnit = this.lengthUnitDescription;
        var assetAreaLengthUnit = this.areaLengthUnitDescription;


        var rowIndex
        var totalQuantityinGrid;

        //variable for the row value              
        var assetFeatureClass;
        var assetType
        var unitCostValue;
        var totalQuantityValue;
        var originalCostEQT;
        var replaceUnitCostInCostEQT;
        var replaceQuantityinCostEQT;
        var solveCostEQT;
        var recalculatedCost;

        for (var i = 0; i < assetValue.length; i++) {

          if ((assetValue[i].IntialCostID.toUpperCase() === assetInitialCostEQT.toUpperCase()) || ((assetValue[i].IntialCostID.toUpperCase() === "{" + assetInitialCostEQT.toUpperCase() + "}"))) {

            totalQuantityinGrid = assetValue[i].totalQuantity;
            rowIndex = i;
            break;
          }
        }


        //get the grid row of feature selected for deletion 

        var item = grid.getItem(rowIndex);

        totalQuantityValue = eval(totalQuantityinGrid + measurement);

        if ((totalQuantityValue === 0) || (totalQuantityValue === undefined) || (totalQuantityValue.toFixed(2) === '0.00') || (totalQuantityValue < 0)) {

          assetValue.splice(rowIndex, 1);
          gridStore.deleteItem(item);

        }

        else {
          assetType = assetValue[rowIndex].name;
          unitCostValue = assetValue[rowIndex].unitCost;
          modifiedCostEQT = assetValue[rowIndex].costEQTWithQuantity;
          assetFeatureClass = assetValue[rowIndex].featureClassName;


          //replace default UnitCost value in cost equation by Unitcost field
          replaceUnitCostInCostEQT = modifiedCostEQT.replace(/{UNITCOST}/gi, unitCostValue);

          replaceQuantityinCostEQT = replaceUnitCostInCostEQT.replace(/{QUANTITY}/gi, totalQuantityValue);

          solveCostEQT = eval(replaceQuantityinCostEQT);

          recalculatedCost = solveCostEQT;


          //set value in assetvalue array 
          assetValue[rowIndex].totalQuantity = totalQuantityValue;
          assetValue[rowIndex].costEQT = replaceQuantityinCostEQT;
          assetValue[rowIndex].totalCost = recalculatedCost;

          if (feature.geometry.type === 'point') {
            rowDescription = totalQuantityValue + " " + assetType + " " + assetFeatureClass + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(recalculatedCost.toFixed(2));
          }

          else if (feature.geometry.type === 'polyline') {
            rowDescription = totalQuantityValue.toFixed(2) + assetLengthUnit + assetType + " " + assetFeatureClass + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(recalculatedCost.toFixed(2));
          }

          else {
            rowDescription = totalQuantityValue.toFixed(2) + assetAreaLengthUnit + assetType + " " + assetFeatureClass + " : " + this.defaultCurrencyUnit + " " + this.formatNumber(recalculatedCost.toFixed(2));
          }

          assetValue[i].description = rowDescription;

          grid.update();
        }


        //calculate actual project cost from grid
        this.projectCostCalculated();


      },

      // Event handler for when Save button is clicked on the widget panel.
      // returns: nothing
      onSaveSessionClick: function (evt) {
        if (domClass.contains(evt.target, 'jimu-state-disabled')) {
          return;
        }

        var featurePoints = this.convertFeatureStoredToPoints();
        this.arcgisGeomtryService.convexHull(featurePoints,
                  lang.hitch(this, this.onConvexHullComplete),
                  this.geometricServiceOnError);



      },

      // Event handler for when Clear button is clicked on the widget panel.
      // returns: nothing
      onClearSessionClick: function (evt) {
        if (domClass.contains(evt.target, 'jimu-state-disabled')) {
          return;
        }

        for (var layerId in this.featureStorage) {
          if (this.featureStorage.hasOwnProperty(layerId)) {
            var layer = this.featureStorage[layerId].layer;
            var features = this.featureStorage[layerId].addedFeatures;

            features = array.map(features, function (feature) {
              return feature.feature;
            });

            layer.applyEdits(null, null, features, null, this.featureLayerEditsError);

          }
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
        var params = new BufferParameters();
        params.distances = [parseInt(this.config.cHullBufferDistance, 10)];
        params.unit = this.lengthUnit;
        params.geometries = [result];

        this.arcgisGeomtryService.buffer(params,
    lang.hitch(this, this.onBufferComplete),
    this.geometricServiceOnError
    );
      },


      // Event handler for when Buffer (Geometry Service) operation is complete.
      // returns: nothing
      onBufferComplete: function (buffers) {
        var buffer = buffers[0];

        var projectID = this.generateGUID();

        //get layer field
        var ids = this.map.graphicsLayerIds;
        var len = ids.length;
        var g;
        g = new Graphic(buffer, new SimpleFillSymbol());
        var jsonData = {};
        for (var j = 0; j < len; j++) {
          var layer = this.map.getLayer(ids[j]);
          if (layer.name === this.projectCostLayer.name) {
            for (var i = 0; i < layer.fields.length; i++) {
              if (layer.fields[i].name.toUpperCase() === 'PROJECTID') {
                jsonData[layer.fields[i].name] = projectID;
              }
              if (layer.fields[i].name.toUpperCase() === 'NUMBEROFPOINTS') {
                jsonData[layer.fields[i].name] = parseInt(this.pointCount.innerHTML);
              }

              if (layer.fields[i].name.toUpperCase() === 'TOTALLENGTH') {
                jsonData[layer.fields[i].name] = parseFloat(this.totalLength.innerHTML);
              }
              if (layer.fields[i].name.toUpperCase() === 'TOTALAREA') {
                jsonData[layer.fields[i].name] = parseFloat(this.totalArea.innerHTML)
              }
              if (layer.fields[i].name.toUpperCase() === 'TOTALASSETCOST') {
                jsonData[layer.fields[i].name] = parseFloat((this.totalAssetCost.innerHTML).replace(/\,/g, ''))
              }
              if (layer.fields[i].name.toUpperCase() === 'ADDITIONALCOST') {
                jsonData[layer.fields[i].name] = this.totalAdditionalCost.value
              }
              if (layer.fields[i].name.toUpperCase() === 'PROJECTCOSTMULTIPLIER') {
                jsonData[layer.fields[i].name] = this.projectMultiplierNumber.value
              }
              if (layer.fields[i].name.toUpperCase() === 'GROSSPROJECTCOST') {
                jsonData[layer.fields[i].name] = parseFloat((this.grossProjectCost.innerHTML).replace(/\,/g, ''))
              }
            }
            g.setAttributes(jsonData);
            break; // break statement for external for statement
          }
        }


        this.map.graphics.add(g);

        this.addProjectGroupCostingInfo();

        this.appendGUIDs(projectID);

        this.projectCostLayer.applyEdits([g], null, null,
                                lang.hitch(this, this.projetCostLayerEditsComplete),
                                this.featureLayerEditsError);
      },

      changeProjectMultiplier: function (evt) {

        if (!this.isNumber(this.projectMultiplierNumber.value)) {

          this.projectMultiplierNumber.value = "1.00";
          var actualPrjCost = parseFloat((this.totalAssetCost.innerHTML).replace(/\,/g, ''));
          var prjMultiplier = eval(this.projectMultiplierNumber.value);
          var addtionalPrjCost = eval(this.totalAdditionalCost.value);

          var costAfterProjectMultiplierAdded = eval(actualPrjCost * prjMultiplier);
          var costAfterAdditionalCostAdded = eval(costAfterProjectMultiplierAdded + addtionalPrjCost).toFixed(2);

          this.grossProjectCost.innerHTML = this.formatNumber(costAfterAdditionalCostAdded);
        }

        else {

          var actualPrjCost = parseFloat((this.totalAssetCost.innerHTML).replace(/\,/g, ''));
          var prjMultiplier = eval(this.projectMultiplierNumber.value);
          if (prjMultiplier === 0) {
            prjMultiplier = 1;
            this.projectMultiplierNumber.value = "1.00";
          }
          var addtionalPrjCost = eval(this.totalAdditionalCost.value);

          var costAfterProjectMultiplierAdded = eval(actualPrjCost * prjMultiplier);
          var costAfterAdditionalCostAdded = eval(costAfterProjectMultiplierAdded + addtionalPrjCost).toFixed(2);

          this.grossProjectCost.innerHTML = this.formatNumber(costAfterAdditionalCostAdded);
        }
      },

      changeAdditionalCost: function (evt) {

        if (!this.isNumber(this.totalAdditionalCost.value)) {
          this.totalAdditionalCost.value = "0.00";
          var actualPrjCost = parseFloat((this.totalAssetCost.innerHTML).replace(/\,/g, ''));
          var prjMultiplier = eval(this.projectMultiplierNumber.value);
          var addtionalPrjCost = eval(this.totalAdditionalCost.value);

          var costAfterProjectMultiplierAdded = eval(actualPrjCost * prjMultiplier);
          var costAfterAdditionalCostAdded = eval(costAfterProjectMultiplierAdded + addtionalPrjCost).toFixed(2);

          this.grossProjectCost.innerHTML = this.formatNumber(costAfterAdditionalCostAdded);
        }

        else {
          var actualPrjCost = parseFloat((this.totalAssetCost.innerHTML).replace(/\,/g, ''));
          var prjMultiplier = eval(this.projectMultiplierNumber.value);
          var addtionalPrjCost = eval(this.totalAdditionalCost.value);

          var costAfterProjectMultiplierAdded = eval(actualPrjCost * prjMultiplier);
          var costAfterAdditionalCostAdded = eval(costAfterProjectMultiplierAdded + addtionalPrjCost).toFixed(2);

          this.grossProjectCost.innerHTML = this.formatNumber(costAfterAdditionalCostAdded);
        }
      },

      isNumber: function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
      },

      formatNumber: function (num) {

        return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
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

        for (var layerId in this.featureStorage) {

          if (this.featureStorage.hasOwnProperty(layerId)) {

            var features = array.map(this.featureStorage[layerId].addedFeatures, function (feature) {

              for (i = 0; i < assetValue.length; i++) {
                var featureInitialCostID; // = this.getFieldValue(feature.feature.attributes, 'INITIALCOSTID');

                for (key in feature.feature.attributes) {
                  if (feature.feature.attributes.hasOwnProperty(key)) {
                    if (key.toUpperCase() === 'INITIALCOSTID') {
                      featureInitialCostID = feature.feature.attributes[key];
                    }

                  }

                }
                if ((assetValue[i].IntialCostID.toUpperCase() === featureInitialCostID.toUpperCase()) || (assetValue[i].IntialCostID.toUpperCase() === "{" + featureInitialCostID.toUpperCase() + "}")) {

                  for (key in feature.feature.attributes) {
                    if (feature.feature.attributes.hasOwnProperty(key)) {
                      if (key.toUpperCase() === 'PROJECTGROUPCOSTINGINFOID') {
                        feature.feature.attributes[key] = assetValue[i].prjGrpCostInfoID;
                      }
                      if (key.toUpperCase() === 'PROJECTID') {
                        feature.feature.attributes[key] = projectID;
                      }

                    }

                  }


                }

              }
              return feature.feature;

            });

            var layer = this.featureStorage[layerId].layer;
            layer.applyEdits(null, features, null, null, this.featureLayerEditsError);
          }
        }

      },

      //get projectGroupCostingInfoTable fields
      getprojectGroupCostingInfoTablefield: function () {

        if (this.projectTables !== null) {
          for (var i = 0; i < this.projectTables.length; i++) {

            if (this.projectTables[i].title === this.projectGroupCostingInfoTable) {
              this.projectGroupCostingInfoTableFeatureLayer = new esri.layers.FeatureLayer(this.projectTables[i].layerObject.url, {
                mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
                outFields: ["*"]
              });
              break;
            }

          }
        }
      },


      //add project Group costing information 
      addProjectGroupCostingInfo: function () {
        //get ProjectGroupCostingInfo Table
        var projectGroupCostingInfoTable;

        var projectGrpCostid, grpCostEqn;
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
            }
            break;
          }
        }

        for (rowIndex = 0; rowIndex < assetValue.length; rowIndex++) {

          var assetProjectGroupInfoID = assetValue[rowIndex].prjGrpCostInfoID;

          var item = grid.getItem(rowIndex);

          var finalGroupCostEquation = grid.getItem(rowIndex).costEQTWithQuantity;
          var gridRecord = { attributes: {} };

          gridRecord.attributes[projectGrpCostid] = assetProjectGroupInfoID;
          gridRecord.attributes[grpCostEqn] = finalGroupCostEquation;

          this.projectGroupCostingInfoTableFeatureLayer.applyEdits([gridRecord], null, null)

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

        //after project creation disable Save Button and Clear Session button
        html.addClass(this.clearSessionButton, 'jimu-state-disabled');
        html.addClass(this.saveButton, 'jimu-state-disabled');

        //remove all element from assetValue 
        assetValue.splice(0, assetValue.length);

        //remove all element from featureStorage              
        for (var element in this.featureStorage) {

          delete this.featureStorage[element];

        };

        this.bindLayerInFeatureStorage();

        //set null featureStorageCount
        this.featureStorageCount = null;

        grid.setStore(null);

        this.pointCount.innerHTML = "0";
        this.totalLength.innerHTML = "0.00";
        this.totalArea.innerHTML = "0.00";

        this.totalAssetCost.innerHTML = "0.00";
        this.projectMultiplierNumber.value = "1.00";
        this.totalAdditionalCost.value = "0.00";
        this.grossProjectCost.innerHTML = "0.00";

      },

      //bind layer in featuerstorage after project save
      bindLayerInFeatureStorage: function () {
        array.forEach(this.editor.settings.layers,
    lang.hitch(this, function (layer) {
      this.featureStorage[layer.id] = {
        'layer': layer,
        addedFeatures: []
      };

    }));
      },

      // Event handler for when an error occurs during a layer edit.
      // returns: nothing
      featureLayerEditsError: function (err) {
        console.log('featureLayerEditsError');
        this._togglePopupLoadingIcon();
        //this._hideInfoWindow();
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
        } else {
          html.removeClass(this.clearSessionButton, disabledState);
          if (this.projectCostLayer) {
            html.removeClass(this.saveButton, disabledState);
          }
        }
      },

      // Read configuration items.
      // returns: nothing
      readConfiguration: function () {

        //read map unit 
        //this._readMapUnit();

        //lookupTable
        this.lookupTable = this.config.lookupTableName;

        //projectGroupCostingInfoTable
        this.projectGroupCostingInfoTable = this.config.projectGroupCostingInfoTableName;

        //Project Layer
        this.projectCostLayer = this.getProjectLayerFromMap(this.config.projectLayerName);

        //Length Unit Configuration
        this._readLengthConfiguration();

        //Area and Length Unit Configuration
        this._readAreaLengthConfiguration();

        //currency Configuration
        this._readCurrencyConfigurataion();

      },

      //reading unit from feature webmap
      _readMapUnit: function () {
        utils.loadResource().then(lang.hitch(this, function () {

          var mapWkid = this.map.spatialReference.wkid;
          var wkid = utils.standardizeWkid(mapWkid);

          this.mapUnit = utils.getCSUnit(wkid);

          if (this.mapUnit === 'Meter') {

            this.lengthUnit = "UNIT_METER";
            this.areaLengthUnit = "UNIT_SQUARE_METERS";

            this.lengthUnitDiv.innerHTML = "(Mtr.) :";
            this.areaLengthUnitDiv.innerHTML = "(Sq. Mtr) :";

            this.lengthUnitDescription = " Mtr. ";
            this.areaLengthUnitDescription = " Sq. Mtr ";

          }
          else if (mapUnit === 'Feet') {
            this.lengthUnit = "UNIT_FOOT";
            this.areaLengthUnit = "UNIT_SQUARE_FEET";

            this.lengthUnitDiv.innerHTML = "(ft) :";
            this.areaLengthUnitDiv.innerHTML = "(Sq. ft) :";

            this.lengthUnitDescription = " ft ";
            this.areaLengthUnitDescription = " Sq. ft ";

          }

        }),
        lang.hitch(this, function (err) {
          console.error(err);
        }));
      },

      getProjectLayerFromMap: function (projectLayerName) {
        var ids = this.map.graphicsLayerIds;
        var len = ids.length;
        for (var i = 0; i < len; i++) {
          var layer = this.map.getLayer(ids[i]);
          if (layer.name === projectLayerName) {
            return layer;
          }
        }
        return null;
      },

      _readCurrencyConfigurataion: function () {
        this.defaultCurrencyUnit = this.nls.dollar;

        this.currencyGrossProjectCostUnitDiv.innerHTML = " (" + this.defaultCurrencyUnit + ") : ";
        this.currencyUnitAdditionalCostDiv.innerHTML = " (" + this.defaultCurrencyUnit + ") : ";
        this.currencyUnitTotalAssetCostDiv.innerHTML = " (" + this.defaultCurrencyUnit + ") : ";

        if (this.config.currencyUnit) {
          this.defaultCurrencyUnit = this.config.currencyUnit;
          this.currencyGrossProjectCostUnitDiv.innerHTML = " (" + this.config.currencyUnit + ") : ";
          this.currencyUnitAdditionalCostDiv.innerHTML = " (" + this.config.currencyUnit + ") : ";
          this.currencyUnitTotalAssetCostDiv.innerHTML = " (" + this.config.currencyUnit + ") : ";
        }


      },

      // Read configuration items for length measurements.
      // returns: nothing
      _readLengthConfiguration: function () {
        var defaultLengthUnit = {
          label: this.nls.foot,
          value: 'UNIT_FOOT'
        };

        this.lengthUnit = esri.tasks.GeometryService.UNIT_FOOT;

        this.lengthUnitDiv.innerHTML = "(" + defaultLengthUnit.label + ") :";


        this.lengthUnitDescription = " " + defaultLengthUnit.label + " ";

        if (this.config.lengthUnit.value === "UNIT_FOOT") {
          if (this.config.lengthUnit.label) {
            //                      this.lengthUnitDiv.innerHTML = "(" + this.config.lengthUnit.label + ") :";
            //                      this.lengthUnitDescription = " " + this.config.lengthUnit.label + " ";

            this.lengthUnitDiv.innerHTML = "(ft.) :";
            this.lengthUnitDescription = " ft. ";

          }
          if (this.config.lengthUnit.value) {
            this.lengthUnit = esri.tasks.GeometryService.UNIT_FOOT;
          }

        }

        else if (this.config.lengthUnit.value === "UNIT_METER") {
          if (this.config.lengthUnit.label) {
            //                      this.lengthUnitDiv.innerHTML = "(" + this.config.lengthUnit.label + ") :";
            //                      this.lengthUnitDescription = " " + this.config.lengthUnit.label + " ";

            this.lengthUnitDiv.innerHTML = "(Mtr.) :";
            this.lengthUnitDescription = " Mtr. ";
          }
          if (this.config.lengthUnit.value) {
            this.lengthUnit = esri.tasks.GeometryService.UNIT_METER;
          }
        }

        else if (this.config.lengthUnit.value === "UNIT_STATUTE_MILE") {
          if (this.config.lengthUnit.label) {
            //                      this.lengthUnitDiv.innerHTML = "(" + this.config.lengthUnit.label + ") :";
            //                      this.lengthUnitDescription = " " + this.config.lengthUnit.label + " ";

            this.lengthUnitDiv.innerHTML = "(mi.) :";
            this.lengthUnitDescription = " mi. ";
          }
          if (this.config.lengthUnit.value) {
            this.lengthUnit = esri.tasks.GeometryService.UNIT_STATUTE_MILE;
          }
        }

        else {
          if (this.config.lengthUnit.label) {
            //                      this.lengthUnitDiv.innerHTML = "(" + this.config.lengthUnit.label + ") :";
            //                      this.lengthUnitDescription = " " + this.config.lengthUnit.label + " ";

            this.lengthUnitDiv.innerHTML = "(km.) :";
            this.lengthUnitDescription = " km. ";
          }
          if (this.config.lengthUnit.value) {
            this.lengthUnit = esri.tasks.GeometryService.UNIT_KILOMETER;
          }
        }

      },

      // Read configuration items for areal measurements.
      // returns: nothing
      _readAreaLengthConfiguration: function () {
        var defaultAreaAndLengthUnit = {
          label: this.nls.squareFeet,
          value: 'UNIT_SQUARE_FEET'
        };

        this.areaLengthUnit = '109405';
        this.areaLengthUnitDiv.innerHTML = "(" + defaultAreaAndLengthUnit.label + ") :";

        this.areaLengthUnitDescription = " " + defaultAreaAndLengthUnit.label + " ";


        if (this.config.areaAndLengthUnit.value === "UNIT_SQUARE_FEET") {
          if (this.config.areaAndLengthUnit.label) {
            //this.areaLengthUnitDiv.innerHTML = "(" + this.config.areaAndLengthUnit.label + ") :";
            //this.areaLengthUnitDescription = " " + this.config.areaAndLengthUnit.label + " ";

            this.areaLengthUnitDiv.innerHTML = "(Sq. ft.) :";
            this.areaLengthUnitDescription = " Sq. ft. ";
          }
          if (this.config.areaAndLengthUnit.value) {
            this.areaLengthUnit = 109405;
          }

        }

        else if (this.config.areaAndLengthUnit.value === "UNIT_SQUARE_METERS") {
          if (this.config.areaAndLengthUnit.label) {
            //                      this.areaLengthUnitDiv.innerHTML = "(" + this.config.areaAndLengthUnit.label + ") :";
            //                      this.areaLengthUnitDescription = " " + this.config.areaAndLengthUnit.label + " ";

            this.areaLengthUnitDiv.innerHTML = "(Sq. Mtr.) :";
            this.areaLengthUnitDescription = " Sq. Mtr. ";
          }
          if (this.config.areaAndLengthUnit.value) {
            this.areaLengthUnit = 109404;
          }
        }

        else if (this.config.areaAndLengthUnit.value === "UNIT_SQUARE_MILES") {
          if (this.config.areaAndLengthUnit.label) {
            //                      this.areaLengthUnitDiv.innerHTML = "(" + this.config.areaAndLengthUnit.label + ") :";
            //                      this.areaLengthUnitDescription = " " + this.config.areaAndLengthUnit.label + " ";

            this.areaLengthUnitDiv.innerHTML = "(Sq. mi.) :";
            this.areaLengthUnitDescription = " Sq. mi. ";
          }
          if (this.config.areaAndLengthUnit.value) {
            this.areaLengthUnit = 109439;
          }
        }

        else {
          if (this.config.areaAndLengthUnit.label) {
            //                      this.areaLengthUnitDiv.innerHTML = "(" + this.config.areaAndLengthUnit.label + ") :";
            //                      this.areaLengthUnitDescription = " " + this.config.areaAndLengthUnit.label + " ";
            this.areaLengthUnitDiv.innerHTML = "(Sq. km.) :";
            this.areaLengthUnitDescription = " Sq. km. ";
          }
          if (this.config.areaAndLengthUnit.value) {
            this.areaLengthUnit = 109414;
          }

        }

      },

      onClose: function () {

        //clear selected feature from map
        this.clearSelectedFeaturesFromMap();
        //destroy editor
        if (this.editor) {
          this.editor.destroy();
        }

        this.editor = null;
        this.assetEditerDiv = html.create("div", {
          style: {
            width: "100%",
            height: "100%"
          }
        });
        domConstruct.create(this.assetEditerDiv, null, this.domNode, "first");


        this.enableWebMapPopup();

        this.layers = [];

        //close tooltip dialog box
        dijit.popup.close(costEquationTooltipDialog);


        //remove event on widget close
        if (hideEvent !== null) {
          hideEvent.remove();

        }

        if (showEvent !== null) {
          showEvent.remove();
        }

        //check the registered item on widget close
        this.isOpenCheck = true;

      },

      //clear selected features on widget close
      clearSelectedFeaturesFromMap: function () {
        var ids = this.map.graphicsLayerIds;
        var len = ids.length;
        for (var i = 0; i < len; i++) {
          var layer = this.map.getLayer(ids[i]);
          if (layer.type === 'Feature Layer') {
            if (layer.featureLayers === undefined) {
              var selectedFeatures = layer.getSelectedFeatures();
              if (selectedFeatures.length > 0) {
                layer.clearSelection();
              }
            }
          }

        }

      },

      destroy: function () {
        this.inherited(arguments);

        //destroy the costEquation Tooltip Dialog box
        costEquationTooltipDialog.destroy();
        dijit.byId('saveCostEquation').destroy(true);
        dijit.byId('cancelCostEquation').destroy(true);
      },


      resize: function () {
        var widgetBox = html.getMarginBox(this.domNode);
        var height = widgetBox.h;
        var width = widgetBox.w;
        if (this.editor) {
          if (this.editor.templatePicker) {
            this.editor.templatePicker.update();
          }

        }

        //query(".esriEditor", this.domNode).style('height', height + 'px');
        //              query(".templatePicker", this.domNode).style('height', height - 50 + 'px');
        //              query(".grid", this.domNode).style('height', height - 60 + 'px');
        //              query(".dojoxGridView", this.domNode).style('height', height - 60 + 'px');
        //              query(".dojoxGridScrollbox", this.domNode).style('height', height - 60 + 'px');

        query(".dojoxGridRowTable", this.domNode).style('width', width - 32 + 'px');
      }

    });
  });

