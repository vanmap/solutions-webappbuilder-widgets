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
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/mouse",
    "dojo/query",

    "dijit/_WidgetsInTemplateMixin",
    "dijit/Tooltip",

    "jimu/BaseWidget",
    "jimu/dijit/TabContainer",
    "jimu/utils",
    "jimu/MapManager",

    "esri/dijit/editing/Editor",
    "esri/layers/FeatureLayer"
],
    function(declare, lang, array, on, domConstruct, domGeom, domStyle, mouse, query,
             _WidgetsInTemplateMixin, Tooltip,
             BaseWidget, TabContainer, utils, MapManager,
             Editor, FeatureLayer) {
        return declare([BaseWidget, _WidgetsInTemplateMixin], {
            name: "multiEditor",
            baseClass: "jimu-widget-multi-editor",
            editor: null,
            layers: null,
            tabContainer: null,
            resetInfoWindow: {},
            _sharedInfoBetweenEdits: {
                editCount: 0,
                resetInfoWindow: null
            },

            /**
             * Create tab container and tabs. Add tooltips for tabs.
             */
            postCreate: function () {
                this.inherited(arguments);

                var tabs = [];
                array.forEach(this.config.editor.layerInfos, function (layerInfo) {
                    tabs.push({
                        title: layerInfo.tabName,
                        content: domConstruct.create("div")
                    })
                }, this);

                this.tabContainer = new TabContainer({
                    tabs: tabs
                }, this.mainContent);
                this.tabContainer.startup();
                utils.setVerticalCenter(this.tabContainer.domNode);
                this.tabContainer.on("tabChanged", lang.hitch(this, this.onTabChanged));

                query(".jimu-vcenter-text", this.tabContainer.domNode).forEach(function (node) {
                    this.own(on(node, mouse.enter, function () {
                        Tooltip.show(node.label, node);
                    }))
                    this.own(on(node, mouse.leave, function () {
                        Tooltip.hide(node);
                    }))
                }, this);
            },

            /**
             * Get layers and initialize the editor
             */
            onOpen: function () {
                this.layers = [];
                this._disableWebMapPopup();
                this._getLayers();
                this._initEditor(0, this.tabContainer.tabs[0].content);
            },

            /**
             * Clean up
             */
            onClose: function() {

                if (this.editor) {
                    this.editor.destroy();
                }
                this.enableWebMapPopup();
                this.layers = [];
                this.editor = null;
                this.editDiv = html.create("div", {
                    style: {
                        width: "100%",
                        height: "100%"
                    }
                });
                domConstruct.place(this.editDiv, this.domNode);
            },

            /**
             * Resize the editor template when widget is maximized
             */
            onMaximize: function () {
                setTimeout(lang.hitch(this, this._resize), 100);
            },

            /**
             * Init editor based on selected tab
             * @param selectedTab
             */
            onTabChanged: function (selectedTab) {
                for (var i = 0; i < this.tabContainer.tabs.length; i++) {
                    if (this.tabContainer.tabs[i].title === selectedTab) {
                        this._initEditor(i, this.tabContainer.tabs[i].content);
                        break;
                    }
                }
            },

            /**
             * Remove web map popup
             * @private
             */
            _disableWebMapPopup: function(){
                var mapManager = MapManager.getInstance();

                mapManager.disableWebMapPopup();
                // change to map's default infowindow(popup)
                var mapInfoWindow = mapManager.getMapInfoWindow();
                if (mapManager.isMobileInfoWindow) {
                    this.map.setInfoWindow(mapInfoWindow.bigScreen);
                    mapManager.isMobileInfoWindow = false;
                }

                // instead of Mapmanager.resetInfoWindow by self resetInfoWindow
                if (this._sharedInfoBetweenEdits.resetInfoWindow === null) {
                    this._sharedInfoBetweenEdits.resetInfoWindow = mapManager.resetInfoWindow;
                    this.own(on(this.map.infoWindow, "show", lang.hitch(this, function() {
                        if (window.appInfo.isRunInMobile) {
                            this.map.infoWindow.maximize();
                        }
                    })));
                }
                mapManager.resetInfoWindow = lang.hitch(this, function() {});

                this._sharedInfoBetweenEdits.editCount++;
            },

            /**
             * Enables web map popup
             * @private
             */
            _enableWebMapPopup:function(){
                var mapManager = MapManager.getInstance();

                // recover restInfoWindow when close widget.
                this._sharedInfoBetweenEdits.editCount--;
                if (this._sharedInfoBetweenEdits.editCount === 0 &&
                    this._sharedInfoBetweenEdits.resetInfoWindow) {
                    // edit will change infoWindow's size, so resize it.
                    mapManager.getMapInfoWindow().bigScreen.resize(270, 316);
                    mapManager.resetInfoWindow =
                        lang.hitch(mapManager, this._sharedInfoBetweenEdits.resetInfoWindow);
                    this._sharedInfoBetweenEdits.resetInfoWindow = null;
                    mapManager.resetInfoWindow();
                    mapManager.enableWebMapPopup();
                }
            },

            /**
             * Retrieve specific layer from map
             * @param url
             * @returns {*}
             * @private
             */
            _getLayerFromMap: function(url) {
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

            /**
             * Retrieves all layers from map and store them in a list
             * @private
             */
            _getLayers: function(){
                var layerInfos;

                if(!this.config.editor.layerInfos) {
                    // configured in setting page and no layers checked.
                    layerInfos = [];
                } else if(this.config.editor.layerInfos.length > 0)  {
                    // configured and has layer checked.
                    layerInfos = this.config.editor.layerInfos;
                } else {
                    // does not configure.
                    layerInfos = this._getDefaultLayerInfos();
                }

                for (var i = 0; i < layerInfos.length; i++) {
                    var featureLayer = layerInfos[i].featureLayer;
                    var layer = this._getLayerFromMap(featureLayer.url);
                    if (!layer) {
                        if (!layerInfos[i].featureLayer.options) {
                            layerInfos[i].featureLayer.options = {};
                        }
                        if (!layerInfos[i].featureLayer.options.outFields) {
                            if (layerInfos[i].fieldInfos) {
                                layerInfos[i].featureLayer.options.outFields = [];
                                for (var j = 0; j < layerInfos[i].fieldInfos.length; j++) {
                                    layerInfos[i].featureLayer.options
                                        .outFields.push(layerInfos[i].fieldInfos[j].fieldName);
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

            /**
             * Gets layerInfos for all layers
             * @returns {Array}
             * @private
             */
            _getDefaultLayerInfos: function() {
                var defaultLayerInfos = [];
                for(var i = 0; i < this.map.graphicsLayerIds.length; i++) {
                    var layer = this.map.getLayer(this.map.graphicsLayerIds[i]);
                    if (layer.type === "Feature Layer" && layer.url && layer.isEditable()) {
                        var layerInfo = {
                            featureLayer: {}
                        };
                        layerInfo.featureLayer.url = layer.url;
                        layerInfo.disableGeometryUpdate = false;
                        layerInfo.fieldInfos = this._getDefaultFieldInfos(layer);
                        if (!layerInfo.fieldInfos || !layerInfo.fieldInfos.length) {
                            delete layerInfo.fieldInfos;
                        }
                        defaultLayerInfos.push(layerInfo);
                    }
                }
                return defaultLayerInfos;
            },

            /**
             * Gets the field infos for a particular layer
             * @param layer
             * @private
             */
            _getDefaultFieldInfos: function(layer) {
                var fields = [];
                var count = layer.fields.length;
                for (var m = 0; m < count; m++) {
                    if (!layer.fields[m].alias) {
                        layer.fields[m].alias = layer.fields[m].name;
                    }
                    fields.push({
                        fieldName: layer.fields[m].name,
                        label: layer.fields[m].alias,
                        isEditable: true
                    });
                }
            },

            /**
             * Create, init and start the editor based on
             * selected tab
             * @param layerIdx
             * @param parentNode
             * @private
             */
            _initEditor: function(layerIdx, parentNode) {
                if (this.editor) {
                    this.editor.destroy();
                    this.editor = null;
                    var editDiv = domConstruct.create("div", {
                        style: {
                            width: "100%",
                            height: "100%"
                        }
                    });
                    domConstruct.place(editDiv, parentNode);
                }

                var json = this.config.editor;
                var settings = {};
                for (var attr in json) {
                    settings[attr] = json[attr];
                }
                settings.layerInfos = [this.layers[layerIdx]];
                settings.map = this.map;

                var params = {
                    settings: settings
                };

                if(!editDiv){
                    editDiv = domConstruct.create("div", {
                        style: {
                            width: "100%",
                            height: "100%"
                        }
                    });
                    domConstruct.place(editDiv, parentNode);
                }
                var height = domStyle.get(editDiv, "height");

                var styleNode = domConstruct.toDom("<style>.jimu-widget-mission-editor .grid{height: " + (height - 100) + "px;}</style>");
                domConstruct.place(styleNode, document.body);

                this.editor = new Editor(params, editDiv);
                this.editor.startup();

                setTimeout(lang.hitch(this, this._resize), 100);
            },

            /**
             * Resizes the editor template picker accordingly
             * @private
             */
            _resize: function () {
                var computedStyle = domStyle.getComputedStyle(this.domNode);
                var widgetBox = domGeom.getMarginBox(this.domNode, computedStyle);
                var height = widgetBox.h;
                var width = widgetBox.w;

                if(this.editor){
                    this.editor.templatePicker.update();
                }
            }
        });
    });