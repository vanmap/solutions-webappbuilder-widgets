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
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/on',
    'dojo/Evented',
    'dijit/popup',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/LayerChooserFromMapWithDropbox.html'
  ],
  function(declare, lang, html, on, Evented, dojoPopup, _WidgetBase, _TemplatedMixin, template) {
    return declare([_WidgetBase, _TemplatedMixin, Evented], {
      templateString: template,
      baseClass: 'jimu-layer-chooser-from-map-withdropbox',
      declaredClass: 'jimu.dijit.LayerChooserFromMapWithDropbox',
      _selectedItem: null,
      _isLayerChooserShow: false,

      //options:
      layerChooser: null,//instance of LayerChooserFromMap

      //public methods:
      //getLayerChooser
      //getSelectedItem

      //events:
      //selection-change

      postCreate: function() {
        this.inherited(arguments);

        this.layerChooser.domNode.style.zIndex = 1;
        this.own(on(this.layerChooser, 'tree-click', lang.hitch(this, this._onTreeClick)));
        this.own(on(this.layerChooser, 'update', lang.hitch(this, this._onLayerChooserUpdate)));
      },

      destroy: function(){
        this._hideLayerChooser();
        if(this.layerChooser){
          this.layerChooser.destroy();
        }
        this.layerChooser = null;
        this.inherited(arguments);
      },

      getLayerChooser: function(){
        return this.layerChooser;
      },

      getSelectedItem: function(){
        return this._selectedItem;
      },

      getSelectedItems: function(){
        return [this._selectedItem];
      },

      _onDropDownClick: function() {
        if(this._isLayerChooserShow){
          this._hideLayerChooser();
        }else{
          this._showLayerChooser();
        }
      },

      _getSelectedItems: function(){
        var items = this.layerChooser.getSelectedItems();
        return items;
      },

      _showLayerChooser: function() {
        var width = this.domNode.clientWidth;
        if (width < 200) {
          width = 200;
        }
        this.layerChooser.domNode.style.width = width + "px";

        dojoPopup.open({
          parent: this,
          popup: this.layerChooser,
          around: this.domNode
        });

        var popupDom = this.layerChooser.domNode.parentNode;
        if (popupDom) {
          html.addClass(popupDom, 'jimu-layer-chooser-from-map-withdropbox-popup');
        }
        this._isLayerChooserShow = true;
      },

      _hideLayerChooser: function() {
        dojoPopup.close(this.layerChooser);
        this._isLayerChooserShow = false;
      },

      _onLayerChooserUpdate: function(){
        if(this._selectedItem && this.layerChooser.onlyShowVisible){
          var layerInfo = this._selectedItem.layerInfo;
          if(!layerInfo.isShowInMap()){
            this._selectedItem = null;
            this.emit('selection-change', [layerInfo.layerObject]);
          }
        }
      },

      _onTreeClick: function() {
        /*html.empty(this.layerNameNode);
        var selections = [];

        array.forEach(this.layerChooser.getSelectedItems(), function(item) {
          html.place('<span>' + item.layerInfo.title + '</span>', this.layerNameNode);
          selections.push(item.layerInfo.layerObject);
        }, this);

        var changed = false;

        if (!this.selectedLayers || this.selectedLayers.length !== selections.length) {
          this.selectedLayers = selections;
          changed = true;
        } else {
          //compare current selection and previous
          var currentIds = array.map(selections, function(item) {
            return item.id;
          });
          var previousIds = array.map(this.selectedLayers, function(item) {
            return item.id;
          });
          var isSame = array.every(currentIds, function(id) {
            return previousIds.indexOf(id) > -1;
          });
          if (!isSame) {
            this.selectedLayers = selections;
            changed = true;
          }
        }

        if (changed && this.selectedLayers.length > 0) {
          html.setStyle(this.layerChooseNode, 'display', 'none');
          this.emit('selection-change', this.selectedLayers);
        }*/

        var oldSelectedItem = this._selectedItem;
        var oldSelectedItemId = oldSelectedItem ? oldSelectedItem.layerInfo.id : -1;

        var selectedItems = this._getSelectedItems();
        var selectedItem = selectedItems.length > 0 ? selectedItems[0] : null;
        var selectedItemId = selectedItem ? selectedItem.layerInfo.id : -1;

        var isChanged = oldSelectedItemId !== selectedItemId;
        this._selectedItem = selectedItem;
        this._hideLayerChooser();
        this.layerNameNode.innerHTML = this._selectedItem ? this._selectedItem.layerInfo.title : "";

        if(isChanged){
          this.emit('selection-change', [selectedItem.layerInfo.layerObject]);
        }
      }
    });
  });