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
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./templates/SpatialFilterByFeatures.html',
  'dojo/on',
  'dojo/Evented',
  'dojo/Deferred',
  'dojo/_base/html',
  'dojo/_base/lang',
  'jimu/utils',
  'jimu/SelectionManager',
  'jimu/dijit/FeaturelayerChooserFromMap',
  'jimu/dijit/LayerChooserFromMapWithDropbox',
  'jimu/dijit/SearchDistance',
  'esri/graphic',
  'esri/symbols/jsonUtils',
  'esri/layers/GraphicsLayer',
  'esri/renderers/SimpleRenderer',
  'jimu/dijit/FeatureSetChooserForSingleLayer'
],
function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, on, Evented,
  Deferred, html, lang, jimuUtils, SelectionManager, FeaturelayerChooserFromMap,
  LayerChooserFromMapWithDropbox, SearchDistance, Graphic, symbolJsonUtils, GraphicsLayer, SimpleRenderer,
  FeatureSetChooserForSingleLayer) {

  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    baseClass: 'jimu-dijit-spatial-filter-features',
    templateString: template,
    _bufferLayer: null,//GraphicsLayer
    _defaultRelationship: 'SPATIAL_REL_INTERSECTS',
    drawBox: null,

    //constructor options:
    map: null,
    enableDistance: true,
    distance: 0,
    unit: '',
    showLoading: false,

    //public methods:
    //reset
    //getFeatures
    //getGeometryInfo
    //isLoading

    //events:
    //loading
    //unloading

    postMixInProperties:function(){
      this.inherited(arguments);
      this.nls = window.jimuNls.spatialFilterByFeatures;
    },

    postCreate:function(){
      this.inherited(arguments);

      html.setStyle(this.domNode, 'position', 'relative');

      //init renderer
      var bufferSymbol = symbolJsonUtils.fromJson({
        "style": "esriSFSSolid",
        "color": [79, 129, 189, 128],
        "type": "esriSFS",
        "outline": {
          "style": "esriSLSSolid",
          "color": [54, 93, 141, 255],
          "width": 1.5,
          "type": "esriSLS"
        }
      });
      var renderer = new SimpleRenderer(bufferSymbol);

      //init _bufferLayer
      this._bufferLayer = new GraphicsLayer();
      this._bufferLayer.setRenderer(renderer);
      this.map.addLayer(this._bufferLayer);

      //init FeaturelayerChooserFromMap
      var layerChooser = new FeaturelayerChooserFromMap({
        createMapResponse: this.map.webMapResponse,
        showLayerFromFeatureSet: true,
        onlyShowVisible: true,
        updateWhenLayerInfosIsShowInMapChanged: true
      });
      this.layerChooserFromMapWithDropbox = new LayerChooserFromMapWithDropbox({
        layerChooser: layerChooser
      });
      this.layerChooserFromMapWithDropbox.placeAt(this.layerSelectDiv);
      this.own(on(this.layerChooserFromMapWithDropbox,  'selection-change', lang.hitch(this, this._onLayerChanged)));

      //init DrawBox
      // this.drawBox = new DrawBox({
      //   map: this.map,
      //   showClear: true,
      //   keepOneGraphic: true,
      //   geoTypes: ['EXTENT']//['POLYGON']
      // });
      // this.drawBox.placeAt(this.drawBoxDiv);
      // this.own(on(this.drawBox, 'user-clear', lang.hitch(this, this._onUserClear)));
      // this.own(on(this.drawBox, 'draw-end', lang.hitch(this, this._onDrawEnd)));
      // this.drawBox.disable();

      //init radios
      jimuUtils.groupRadios([this.selectionRadio, this.drawRadio, this.allRadio]);
      jimuUtils.combineRadioCheckBoxWithLabel(this.selectionRadio, this.selectionLabel);
      jimuUtils.combineRadioCheckBoxWithLabel(this.drawRadio, this.drawLabel);
      jimuUtils.combineRadioCheckBoxWithLabel(this.allRadio, this.allLabel);

      //init SearchDistance
      this.searchDistance = new SearchDistance({
        tip: window.jimuNls.searchDistance.applySearchDistanceToFeatures,
        distance: this.distance,
        unit: this.unit
      });
      this.searchDistance.placeAt(this.searchDistanceDiv);
      if(this.enableDistance){
        this.own(on(this.searchDistance, 'change', lang.hitch(this, this._onSearchDistanceChange)));
      }else{
        html.setStyle(this.searchDistanceDiv, 'display', 'none');
      }

      this._onLayerChanged();
    },

    reset: function(){
      // this.drawBox.reset();
      this.searchDistance.reset();
      this.searchDistance.setDistance(this.distance);
      this.searchDistance.setUnit(this.unit);
      this.clearAllGraphics();
    },

    disable: function(hideLayers){
      // this.drawBox.disable();
      if(hideLayers){
        this._hideAllLayers();
      }
    },

    enable: function(){
      // this.drawBox.enable();
      this._showAllLayers();
    },

    deactivate: function(){
      if(this.featureSetChooserForSingleLayer){
        this.featureSetChooserForSingleLayer.deactivate();
      }
    },

    clearAllGraphics: function(){
      // this.drawBox.clear();
      this._clearBufferLayer();
      if(this.featureSetChooserForSingleLayer){
        this.featureSetChooserForSingleLayer.clearAllGraphics();
      }
    },

    /*
    return a Deferred object which resolves {status,geometry}
    geometry is the buffer geometry
    status 1 means geometry is not null
    status 0 means we don't select any features and geometry is null
    status -1 means user doesn't select a feature layer, geometry is null
    status -2 means search distance is invalid, geometry is null
    */
    getGeometryInfo: function(){
      var def = new Deferred();
      var result = {
        status: null,
        geometry: null
      };

      this._updateBuffer();

      var info = this._getSelectedLayerInfomation();
      var type = info.type;
      if(type === -1){
        result.status = -1;
        def.resolve(result);
        return def;
      }

      var searchData = this.searchDistance.getData();
      if(searchData.status < 0){
        result.status = -2;
        return def;
      }

      this.getFeatures().then(lang.hitch(this, function(){
        result.geometry = this._updateBuffer();
        if(result.geometry){
          result.status = 1;
        }else{
          result.status = 0;
        }
        def.resolve(result);
      }), lang.hitch(this, function(err){
        def.reject(err);
      }));
      return def;
    },

    //return a deferred object which resolves features
    getFeatures: function(){
      var def = new Deferred();
      var features = [];
      var info = this._getSelectedLayerInfomation();
      var type = info.type;
      if(type === 0){
        def.resolve(features);
      }else{
        if(this.selectionRadio.checked){
          features = info.layer.getSelectedFeatures();
          def.resolve(features);
        }else if (this.drawRadio.checked) {
          def = this.featureSetChooserForSingleLayer.getFeatures();
        } else if(this.allRadio.checked) {
          features = info.layer.graphics;
          def.resolve(features);
        }
      }
      return def;
    },

    _syncGetFeatures: function(){
      var features = [];
      var info = this._getSelectedLayerInfomation();
      var type = info.type;
      if (type !== 0) {
        if(this.selectionRadio.checked){
          features = info.layer.getSelectedFeatures();
        }else if (this.drawRadio.checked) {
          features = this.featureSetChooserForSingleLayer.syncGetFeatures();
        } else if(this.allRadio.checked) {
          features = info.layer.graphics;
        }
      }
      return features;
    },

    isLoading: function(){
      return this.featureSetChooserForSingleLayer && this.featureSetChooserForSingleLayer.isLoading();
    },

    _onLoading: function(){
      // this.drawBox.deactivate();
      if (this.showLoading) {
        this.loading.show();
      }
      this.emit('loading');
    },

    _onUnloading: function(){
      this.loading.hide();
      this.emit('unloading');
    },

    _showAllLayers: function(){
      if(this._bufferLayer){
        this._bufferLayer.show();
      }
    },

    _hideAllLayers: function(){
      if(this._bufferLayer){
        this._bufferLayer.hide();
      }
    },

    _onRadioChanged: function(){
      this._updateFeatureSetChooserForSingleLayer();
    },

    _updateFeatureSetChooserForSingleLayer: function(){
      if(this.drawRadio.checked){
        if(this.featureSetChooserForSingleLayer){
          this.featureSetChooserForSingleLayer.enable();
        }
      }else{
        if(this.featureSetChooserForSingleLayer){
          this.featureSetChooserForSingleLayer.disable();
        }
      }
    },

    /*-----------------------------layerChooserFromMapWithDropbox------------------------------------------*/

    _getSelectedLayerInfomation: function(){
      var type = 0;//0 means doesn't select any layer
      var layerItem = null;
      var layer = null;
      var items = this.layerChooserFromMapWithDropbox.getSelectedItems();
      if(items.length > 0){
        layerItem = items[0];
      }
      if(layerItem){
        var layerInfo = layerItem.layerInfo;
        layer = layerInfo.layerObject;
        if(layer.url){
          if(this.map.graphicsLayerIds.indexOf(layer.id) >= 0){
            //layer exist in map
            type = 1;
          }else{
            //layer exist in MapService
            type = 2;
          }
        }else{
          //feature collection
          type = 3;
        }
      }

      return {
        type: type,
        layerItem: layerItem,
        layer: layer
      };
    },

    _onLayerChanged: function(){
      this.clearAllGraphics();
      if(this.featureSetChooserForSingleLayer){
        this.featureSetChooserForSingleLayer.destroy();
      }
      this.featureSetChooserForSingleLayer = null;
      var info = this._getSelectedLayerInfomation();
      var type = info.type;
      if(type === 0){
        this.selectionRadio.disabled = true;
        this.drawRadio.disabled = true;
        this.allRadio.disabled = true;
      }else{
        this.featureSetChooserForSingleLayer = new FeatureSetChooserForSingleLayer({
          map: this.map,
          featureLayer: info.layer,
          updateSelection: false
        });
        this.own(on(this.featureSetChooserForSingleLayer, 'user-clear', lang.hitch(this, this._onUserClear)));
        this.own(on(this.featureSetChooserForSingleLayer, 'loading', lang.hitch(this, lang.hitch(this, function(){
          this._clearBufferLayer();
          this._onLoading();
        }))));
        this.own(on(this.featureSetChooserForSingleLayer, 'unloading', lang.hitch(this, lang.hitch(this, function(){
          this._onUnloading();
          this._updateBuffer();
        }))));
        this.featureSetChooserForSingleLayer.placeAt(this.drawOptionDiv);
        if(type === 1){
          //normal FeatureLayer
          this.selectionRadio.disabled = false;
          this.drawRadio.disabled = false;
          this.allRadio.disabled = true;
          this.selectionRadio.checked = true;
        }else if(type === 2){
          //virtual FeatureLayer under MapService
          this.selectionRadio.disabled = true;
          this.drawRadio.disabled = false;
          this.allRadio.disabled = true;
          this.drawRadio.checked = true;
        }else if(type === 3){
          //FeatureCollection
          this.selectionRadio.disabled = false;
          this.drawRadio.disabled = false;
          this.allRadio.disabled = false;
          this.selectionRadio.checked = true;
        }
      }
      this._updateFeatureSetChooserForSingleLayer();
      this._updateBuffer();
    },

    // _onDrawEnd: function(){
    //   this._clearBufferLayer();
    //   this._updateBuffer();
    // },

    _onSearchDistanceChange: function(){
      this._updateBuffer();
    },

    //geometry is the combined geometry of selected features
    _updateBuffer: function(){
      this._clearBufferLayer();

      var data = this.searchDistance.getData();
      var status = data.status;
      var distance = data.distance;
      var bufferUnit = data.bufferUnit;

      if(status < 0){
        //satatus < 0 means SearchDistance is enabled with valid distance number
        return null;
      }

      var features = this._syncGetFeatures();
      var combinedFeatureGeometry = jimuUtils.combineGeometriesByGraphics(features);

      if(status === 0){
        return combinedFeatureGeometry;
      }

      if(combinedFeatureGeometry){
        var bufferGeometry = SelectionManager.buffer(combinedFeatureGeometry, distance, bufferUnit);
        var bufferGraphic = new Graphic(bufferGeometry);
        this._bufferLayer.add(bufferGraphic);
        return bufferGeometry;
      }

      return null;

    },

    _onUserClear: function(){
      this.clearAllGraphics();
    },

    _clearBufferLayer: function(){
      if(this._bufferLayer){
        this._bufferLayer.clear();
      }
    },

    destroy: function(){
      if(this._bufferLayer){
        this.map.removeLayer(this._bufferLayer);
      }
      this._bufferLayer = null;
      this.inherited(arguments);
    }

  });
});