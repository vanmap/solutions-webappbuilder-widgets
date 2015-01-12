/// <reference path="../basemapgallery/widget.html" />
///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
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
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/on',
    'dojo/dom-construct',
    'dojo/_base/array',
    'dojo/dom-style',
    'jimu/BaseWidget',
    'jimu/dijit/DrawBox',
    'jimu/dijit/SimpleTable',
    'esri/graphic'],
function (declare,
          _WidgetsInTemplateMixin,
          lang,
          html,
          on,
          domConstruct,
          array,
          domStyle,
          BaseWidget,
          DrawBox,
          SimpleTable,
          Graphic
          ) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
        baseClass: 'solutions-widget-batcheditor',
        layersTable: null,
        startup: function () {
            this.inherited(arguments);

        },
        postCreate: function () {
            this.inherited(arguments);

            this.drawBox.setMap(this.map);

            if (this.config.drawSymbol) {
                this.drawBox.setPolygonSymbol(symbolJsonUtils.fromJson(this.config.drawSymbol));
            }
            this._bindEvents();
            this.createLayerTable();
            this.loadLayerTable();

        },
        _bindEvents: function () {

            // DrawBox events

            this.own(on(this.drawBox, 'DrawEnd', lang.hitch(this, this._onDrawEnd)));

        },

        // Event handler for when a drawing is finished.
        // returns: nothing
        _onDrawEnd: function (graphic) {
            if (graphic._graphicsLayer.graphics.length > 1) {
                this._clearGraphics();
                this._clearSelected();
                this.drawBox.drawLayer.add(graphic);
            }

            this.mouseClickPos = graphic._extent.getCenter();
            this._togglePanelLoadingIcon();
            this._selectInExtent(graphic);
        },
        // Clear the drawn graphics.
        // returns: nothing
        _clearGraphics: function () {
            this.drawBox.drawLayer.clear();
        },
        _togglePanelLoadingIcon: function () {
            var loading = dojo.byId('panelLoadingIcon');

            if (html.hasClass(loading, 'hide')) {
                html.removeClass(loading, 'hide');
            } else {
                html.addClass(loading, 'hide');
            }
        },
        loadLayerTable: function () {

            var selectedLayers = array.map(this.config.updateLayers, function (updateLayer) {
                return updateLayer.name;
            });



            var label = '';
            var tableValid = false;
            array.forEach(this.map.itemInfo.itemData.operationalLayers, function (layer) {
                if (layer.layerObject != null && layer.layerObject != undefined) {
                    if (layer.layerObject.type === 'Feature Layer' && layer.url) {
                        if (selectedLayers.indexOf(layer.layerObject.name) > -1 && layer.layerObject.isEditable() === true) {

                            label = layer.layerObject.name;
                            update = false;
                            selectByLayer = false;
                            if (selectedLayers.indexOf(label) > -1) {
                                update = true;
                            }

                            var row = this.layersTable.addRow({
                                label: label,
                                ID: layer.layerObject.id,
                                numSelected: 0
                            });
                            tableValid = true;

                        }
                    }
                }
            }, this);

            if (!tableValid) {
                domStyle.set(this.tableLayerInfosError, 'display', '');
            } else {
                domStyle.set(this.tableLayerInfosError, 'display', 'none');
            }
        },
        createLayerTable: function (selectByLayerVisible, queryFieldVisible) {
            var layerTableFields = [
                {
                    name: 'numSelected',
                    title: this.nls.layerTable.numSelected,
                    type: 'text',
                    'class': 'selectioncount'
                }, {
                    name: 'label',
                    title: this.nls.layerTable.colLabel,
                    type: 'text'
                }, {
                    name: 'ID',
                    type: 'text',
                    hidden: true
                }];
            var args = {
                fields: layerTableFields,
                selectable: false
            };
            domConstruct.empty(this.tableLayerInfos);
            this.layersTable = new SimpleTable(args);
            this.layersTable.placeAt(this.tableLayerInfos);
            this.layersTable.startup();
        },
        disableWebMapPopup: function () {
            if (this.map && this.map.webMapResponse) {
                var handler = this.map.webMapResponse.clickEventHandle;
                if (handler) {
                    handler.remove();
                    this.map.webMapResponse.clickEventHandle = null;
                }
            }
        },
        enableWebMapPopup: function () {
            if (this.map && this.map.webMapResponse) {
                var handler = this.map.webMapResponse.clickEventHandle;
                var listener = this.map.webMapResponse.clickEventListener;
                if (listener && !handler) {
                    this.map.webMapResponse.clickEventHandle = on(this.map,
                                                                'click',
                                                                lang.hitch(this.map, listener));
                }
            }
        },

























        // onOpen: function(){
        //   console.log('onOpen');
        // },

        // onClose: function(){
        //   console.log('onClose');
        // },

        // onMinimize: function(){
        //   console.log('onMinimize');
        // },

        // onMaximize: function(){
        //   console.log('onMaximize');
        // },

        // onSignIn: function(credential){
        //   /* jshint unused:false*/
        //   console.log('onSignIn');
        // },

        // onSignOut: function(){
        //   console.log('onSignOut');
        // }

        // onPositionChange: function(){
        //   console.log('onPositionChange');
        // },

        // resize: function(){
        //   console.log('resize');
        // }

        //methods to communication between widgets:

    });
});