///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',

    'dijit/_WidgetsInTemplateMixin',

    'jimu/BaseWidgetSetting',
    'jimu/dijit/SymbolChooser',

    'dojo/on',
    'dojo/fx',

    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/html',

    'dijit/form/Select'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    SymbolChooser,
    on,
    coreFx,
    array, lang, html) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-batch-editor-setting',
      currentSymbol: null,
      currentSpatialRel: null,
      currentHighlightSymbol: null,
      currentDrawSymbol: null,

      startup: function() {
        this.inherited(arguments);
        if (!this.config.layers) {
          this.config.layers = {};
        }

        if (!this.config.highlightSymbol) {
          this.config.highlightSymbol = {};
        }

        this.addLayerOptions();

        this.bindEvents();
        //this.bindAnimations();

        this.setConfig(this.config);
      },

      bindAnimations: function () {
        this.own(on(this.selectFromLayerSelect, 'change', function () {
            coreFx.wipeIn({
                node: this.settingContent
            }).play();
        }));
      },

      bindEvents: function () {
        this.own(this.selectFromLayerSelect.on('change', lang.hitch(this, this.onSelectFromChange)));

        this.own(this.selectWithLayerSelect.on('change', lang.hitch(this, this.onSelectWithChange)));

        //spatial relationship chooser
        this.own(this.spatialRelationshipChooser.on('change', lang.hitch(this, this.onSpatialRelationshipChange)));

        //highlight symbol choosers
        this.own(this.pointHighlightChooser.on('change', lang.hitch(this, this.onHighlightSymbolChange)));

        this.own(this.lineHighlightChooser.on('change', lang.hitch(this, this.onHighlightSymbolChange)));

        this.own(this.fillHighlightChooser.on('change', lang.hitch(this, this.onHighlightSymbolChange)));

        //draw symbol chooser
        this.own(this.fillDrawChooser.on('change', lang.hitch(this, this.onDrawSymbolChange)));
      },

      onSpatialRelationshipChange: function (evt) {
        this.currentSpatialRel = evt;
      },

      onHighlightSymbolChange: function (evt) {
        this.currentHighlightSymbol = evt;
      },

      onDrawSymbolChange: function (evt) {
        this.currentDrawSymbol = evt;
      },

      onSelectFromChange: function(evt) {

        var map = this.map;

        html.addClass(this.pointHighlightSection, 'hide');
        html.addClass(this.lineHighlightSection, 'hide');
        html.addClass(this.fillHighlightSection, 'hide');

        if (evt) {
          html.removeClass(this.settingHighlight, 'hide');

          var layerIds = array.filter(map.graphicsLayerIds, function (layerId) {
              return map.getLayer(layerId).name === evt;
            });

          if (layerIds.length > 0) {
            var layer = map.getLayer(layerIds[0]);

            switch (layer.geometryType) {
              case 'esriGeometryPoint':
                html.removeClass(this.pointHighlightSection, 'hide');
                this.currentHighlightSymbol = this.pointHighlightChooser.getSymbol();
                break;

              case 'esriGeometryLine':
              case 'esriGeometryPolyline':
                html.removeClass(this.lineHighlightSection, 'hide');
                this.currentHighlightSymbol = this.lineHighlightChooser.getSymbol();
                break;

              case 'esriGeometryPolygon':
                html.removeClass(this.fillHighlightSection, 'hide');
                this.currentHighlightSymbol = this.fillHighlightChooser.getSymbol();
                break;
            }
          }
        } else {
          html.addClass(this.settingHighlight, 'hide');
        }
      },

      addLayerOptions: function () {
        var map = this.map;
        var settings = this;

        array.forEach(map.graphicsLayerIds, function (layerId) {
          var layer = map.getLayer(layerId);
          var maxRecordCount = layer.maxRecordCount;
          var option;

          if (layer.url !== null) { //ignore helper layer.
            option = {'label': layer.name + ' (' + maxRecordCount + ')',
                      'value': layer.name};

            if (layer.geometryType === 'esriGeometryPolygon') {
              settings.selectWithLayerSelect.addOption(option);
            }

            settings.selectFromLayerSelect.addOption(option);
          }
        });
      },

      setConfig: function (config) {
        this.config = config;

        if (config.layers.selectFrom) {
          this.selectFromLayerSelect.set('value', config.layers.selectFrom.name);
        }

        if (config.layers.selectWith) {
          this.selectWithLayerSelect.set('value', config.layers.selectWith.name);
        }

        if (config.spatialRel) {
          this.spatialRelationshipChooser.set('value', config.spatialRel);
        }
      },

      getConfig: function () {
        this.config.layers.selectFrom.name = this.selectFromLayerSelect.getValue();

        this.config.layers.selectWith.name = this.selectWithLayerSelect.getValue();

        this.config.spatialRel = this.spatialRelationshipChooser.getValue();

        if (this.currentHighlightSymbol) {
          this.config.highlightSymbol = this.currentHighlightSymbol.toJson();
        }

        if (this.currentDrawSymbol) {
          this.config.drawSymbol = this.currentDrawSymbol.toJson();
        }

        return this.config;
      }

    });
  });
