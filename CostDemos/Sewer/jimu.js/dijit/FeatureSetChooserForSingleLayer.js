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
  'dojo/on',
  'dojo/Evented',
  'dojo/_base/lang',
  'jimu/dijit/DrawBox',
  'jimu/dijit/_FeatureSetChooserCore'
],
function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, on, Evented, lang, DrawBox,
  _FeatureSetChooserCore) {

  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    baseClass: 'spatial-filter-features',
    templateString: "<div></div>",
    drawBox: null,

    //constructor options:
    map: null,
    featureLayer: null,
    updateSelection: false,

    //public methods:
    //enable
    //disable
    //deactivate
    //clearAllGraphics
    //isLoading
    //getFeatures, return a deferred object which resolves features

    //events:
    //user-clear
    //loading
    //unloading

    postCreate:function(){
      this.inherited(arguments);

      //init DrawBox
      this.drawBox = new DrawBox({
        map: this.map,
        showClear: true,
        keepOneGraphic: true,
        geoTypes: ['EXTENT']//['POLYGON']
      });
      this.drawBox.placeAt(this.domNode);
      this.own(on(this.drawBox, 'user-clear', lang.hitch(this, this._onDrawBoxUserClear)));

      //init featureSetChooserCore
      this.featureSetChooserCore = new _FeatureSetChooserCore({
        map: this.map,
        featureLayer: this.featureLayer,
        drawBox: this.drawBox,
        updateSelection: this.updateSelection
      });

      this.own(on(this.featureLayer, 'visibility-change', lang.hitch(this, function(){
        if(this.featureLayer.visible){
          this.drawBox.enable();
        }else{
          this.drawBox.disable();
        }
      })));
    },

    // reset: function(){
    //   this.drawBox.reset();
    //   this.clearAllGraphics();
    // },

    getFeatures: function(){
      return this.featureSetChooserCore.getFeatures();
    },

    syncGetFeatures: function(){
      return this.featureSetChooserCore.syncGetFeatures();
    },

    disable: function(){
      this.drawBox.disable();
    },

    enable: function(){
      this.drawBox.enable();
    },

    deactivate: function(){
      this.drawBox.deactivate();
    },

    clearAllGraphics: function(){
      this.featureSetChooserCore.clear(false);
    },

    isLoading: function(){
      return this.featureSetChooserCore.isLoading();
    },

    destroy: function(){
      if(this.featureSetChooserCore){
        this.featureSetChooserCore.destroy();
      }
      this.featureSetChooserCore = null;
      this.inherited(arguments);
    },

    _onDrawBoxUserClear: function(){
      this.clearAllGraphics();
      this.emit("user-clear");
    }

  });
});