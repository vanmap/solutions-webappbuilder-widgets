define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/Evented',
  'dojo/dom',
  'dojo/dom-construct',
  'dojo/_base/lang',
  'dojo/Deferred',
  'dojo/text!./templates/MapBook.html',
  'dojo/_base/array',
  'jimu/utils',
  'jimu/LayerInfos/LayerInfos',
  'esri/tasks/query',
  'dijit/registry',
  'dijit/form/CheckBox',
  'dijit/form/Form',
  'dijit/form/Select'
],
function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented, dom, domConstruct, lang, Deferred, mapBookTemplate, array, utils, LayerInfos, Query, registry, CheckBox) {
return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
  templateString: mapBookTemplate,
  baseClass: "gis_mapBookDijit",
  declareClass: "gis_mapBookDijit",
  map: null,
  nls: null,
  config : null,
  layerList: [],
  selectedLayer: null,
  printFeatureSet: null,
  finalPrintSet: [],

  postCreate: function() {
    this.inherited(arguments);

    this._getMapLayers();
  },

  _getMapLayers: function() {
    LayerInfos.getInstance(this.map, this.map.itemInfo)
      .then(lang.hitch(this, function(operLayerInfos) {
        if(operLayerInfos._layerInfos && operLayerInfos._layerInfos.length > 0) {
          array.forEach(operLayerInfos._layerInfos, lang.hitch(this, function(layer) {
            this.layerList.push(layer);
          }));
        }
        this._populateLayerControl({layerList: this.layerList});
      }));
  },

  _populateLayerControl: function(pLayerObj) {
    domConstruct.empty(this.mapBookDijit);
    array.forEach(pLayerObj.layerList, lang.hitch(this, function(layer) {
      this.mapBookDijit.addOption({label: layer.title, value: layer.id});
    }));
    this._queryFeatures();
  },

  _createNewPageRow: function(pParam) {
    var table = dom.byId("mapBook_Pages");
    var row = table.insertRow(-1);
    var cell_checkbox = row.insertCell(0);
    var cell_FeatureRow = row.insertCell(1);

    this._createPrintCheckbox(cell_checkbox,pParam);
    cell_FeatureRow.innerHTML = pParam.label;

  },

  _removeAllRows: function() {
    var table = dom.byId("mapBook_Pages");
    if(table.rows.length > 0) {
        domConstruct.destroy(table.rows[0]);
        this._removeAllRows();
    }
  },

  _createPrintCheckbox: function(pCell, pParam) {
    var checkBox = new CheckBox({
        name: "chk" + pParam.ObjectID,
        value: pParam.ObjectID,
        checked: true
    }).placeAt(pCell);
    checkBox.startup();
  },

  _queryFeatures: function() {
    var selectVal = this.mapBookDijit.value;
    var lyrToQuery = null;
    array.forEach(this.layerList, lang.hitch(this, function(layer) {
      if(selectVal === layer.id) {
        lyrToQuery = layer.layerObject;
      }
    }));

    if(lyrToQuery !== null) {
      var query = new Query();
        query.returnGeometry = true;
        query.outFields = ["*"];
        query.where = "1=1";
      lyrToQuery.queryFeatures(query, lang.hitch(this, function (featureSet) {
        if (featureSet) {
          this._removeAllRows();
          this.printFeatureSet = null;
          this.printFeatureSet = featureSet;
          array.forEach(featureSet.features, lang.hitch(this, function(feature) {
            //console.log(feature);
            this._createNewPageRow({ObjectID: feature.attributes[featureSet.objectIdFieldName], label: feature.attributes[lyrToQuery.displayField]});
          }));
        } else {
          //no records
        }
      }));
    }
  },

  finalSheetsToPrint: function() {
    this.finalPrintSet = [];
    var rows = dom.byId("mapBook_Pages").rows;
    array.forEach(rows, lang.hitch(this, function(row, i){
      if(i >= 0) {
        var cell_ID = registry.byNode(row.cells[0].childNodes[0]);
        array.forEach(this.printFeatureSet.features, lang.hitch(this, function(feature) {
          if((cell_ID.checked) && (cell_ID.value === feature.attributes[this.printFeatureSet.objectIdFieldName])) {
            this.finalPrintSet.push(feature);
          }
        }));
      }
    }));
  }


});
});