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
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'esri/dijit/Directions',
    'esri/tasks/RouteParameters',
    'dijit/Menu',
    'dijit/MenuItem',
    'dijit/MenuSeparator',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/geometry/jsonUtils',
    'dojo/_base/Color',
    'dojo/query',
    'dojo/_base/lang',
    'esri/geometry/Point',
    'esri/graphic',
    'esri/layers/GraphicsLayer',
    'dojo/on',
    'dojo/mouse',
    'dojo/dom-style',
    'esri/tasks/locator',
    'dojo/_base/array',
    'jimu/dijit/TabContainer',
    'jimu/utils',
    'esri/toolbars/draw',
    'esri/dijit/LocateButton'
],
    function(declare, _WidgetsInTemplateMixin, BaseWidget, Directions, RouteParameters, Menu, MenuItem, MenuSeparator, SimpleMarkerSymbol, SimpleLineSymbol, geometryJsonUtils, Color, query, lang, Point, Graphic, GraphicsLayer, on, mouse, domStyle, Locator, array, TabContainer, utils, draw, LocateButton) {
        return declare([BaseWidget, _WidgetsInTemplateMixin], {
            baseClass: "jimu-widget-locator",
            name: "Directions",
            _dijitDirections: null,
            STOP_TYPE: {
                START: "start",
                STOP: "stop",
                END: "end"
            },
            stopType: null,
            ctxMenu: null,
            routeGraphicsLayer: null,
            evacAreaGraphicsLayer: null,
            locator: null,
            tabContainer: null,
            drawToolbar: null,

            postCreate: function() {
                this.inherited(arguments);

                this.tabContainer = new TabContainer({
                    tabs: [
                        {
                            title: "Directions",
                            content: this.tabRoute
                        },
                        {
                            title: "Evacuation Areas",
                            content: this.tabEvacAreas
                        }
                    ],
                    selected: "Directions"
                }, this.mainTab);
                this.tabContainer.startup();
                utils.setVerticalCenter(this.tabContainer.domNode);

                var routeParams = new RouteParameters();
                var routeOptions = this.config.routeOptions;
                if(routeOptions){
                    if(routeOptions.directionsLanguage){
                        routeParams.directionsLanguage = routeOptions.directionsLanguage;
                    }
                    routeParams.directionsLengthUnits = routeOptions.directionsLengthUnits;
                    routeParams.directionsOutputType = routeOptions.directionsOutputType;
                    if(routeOptions.impedanceAttribute){
                        routeParams.impedanceAttribute = routeOptions.impedanceAttribute;
                    }
                }

                this._dijitDirections = new Directions({
                    map: this.map,
                    geocoderOptions: this.config.geocoderOptions,
                    routeParams: routeParams,
                    routeTaskUrl: this.config.routeTaskUrl,
                    dragging:true
                }, this.directionController);
                this._dijitDirections.startup();

                this.own(on(this, mouse.enter, lang.hitch(this, function(evt){
                    this.removeContextMenu();
                })));
                this.own(on(this, mouse.leave, lang.hitch(this, function(evt){
                    this.reInitContextMenu();
                })));

                this.routeGraphicsLayer = new GraphicsLayer();
                this.map.addLayer(this.routeGraphicsLayer);
                this.evacAreaGraphicsLayer = new GraphicsLayer();
                this.map.addLayer(this.evacAreaGraphicsLayer);

                this.createContextMenu();

                this.locator = new Locator(this.config.locatorUrl);
                this.own(on(this.locator, 'location-to-address-complete', lang.hitch(this, this.geocodeLocationToAddressCompleteEvent)));

                this.drawToolbar = new Draw(this.map);
                this.own(on(this.drawToolbar, "draw-end", lang.hitch(this, this.addLocation)));
                this.own(on(this.drawPoint, "click", lang.hitch(this, this.bindDrawToolbar)));

                this.own(on(this.currentLocation, "click", lang.hitch(this, this.getCurrentLocation)));
            },

            onOpen: function () {
                console.log('onOpen');
                //this.reInitContextMenu();
                this.attachClearListener();
            },

            onClose: function () {
                console.log('onClose');
                this.removeContextMenu();
            },

            bindDrawToolbar: function (evt) {
                var tool = evt.target.id.toLowerCase();
                this.map.disableMapNavigation();
                this.evacAreaGraphicsLayer.clear();
                //this.addressLocationLayer.clear();
                this.drawToolbar.activate(tool);
            },

            getCurrentLocation: function(){
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(showPosition);
                } else {
                    alert("Geolocation is not supported by this browser");
                }
            },

            showPosition: function(position) {
                var lat = position.coords.latitude;
                var long = position.coords.longitude;
                var symbol = new SimpleMarkerSymbol(
                    SimpleMarkerSymbol.STYLE_CIRCLE,
                    20,
                    new SimpleLineSymbol(
                        SimpleLineSymbol.STYLE_SOLID,
                        new Color([192, 192, 192, 0.9]),
                        1
                    ), new Color([192, 192, 192, 0.5])
                );
                var graphic = new Graphic(new Point(long, lat), symbol);
                this.evacAreaGraphicsLayer.add(graphic);
            },

            addLocation: function() {
                this.drawToolbar.deactivate();
                this.map.enableMapNavigation();

                var symbol = new SimpleMarkerSymbol(
                    SimpleMarkerSymbol.STYLE_CIRCLE,
                    20,
                    new SimpleLineSymbol(
                        SimpleLineSymbol.STYLE_SOLID,
                        new Color([192, 192, 192, 0.9]),
                        1
                    ), new Color([192, 192, 192, 0.5])
                );
                var attr = {"TYPE":"EVAC AREA START POINT"};
                var graphic = new Graphic(evt.geometry, symbol, attr);
                this.evacAreaGraphicsLayer.add(graphic);
            },

            onClearBtnClicked: function() {
                this.evacAreaGraphicsLayer.clear();
            },

            removeContextMenu: function() {
                if (this.ctxMenu !== undefined) {
                    if (this.ctxMenu.domNode !== undefined){
                        domStyle.set(this.ctxMenu.domNode, 'display', 'none');
                        this.ctxMenu.destroy();
                        this.ctxMenu = null;
                    }
                }
            },

            geocodeCoordinates: function(coords) {
                this.locator.locationToAddress(coords, 100)
            },

            geocodeLocationToAddressCompleteEvent: function(evt) {
                if (evt.address.address) {
                    this.populateStopInputBox(this.stopType, this.printFullAddress(evt.address.address));
                }
            },

            printFullAddress: function(address) {
                var newAddress = [];
                if (address.Address !== undefined) {
                    newAddress.push(address.Address);
                }
                if (address.City !== undefined) {
                    newAddress.push(address.City);
                }
                if (address.Region !== undefined) {
                    newAddress.push(address.Region)
                }
                if (address.Postal !== undefined) {
                    newAddress.push(address.Postal);
                }
                if (address.CountryCode !== undefined) {
                    newAddress.push(address.CountryCode);
                }
                return newAddress.join(", ");
            },

            reInitContextMenu: function() {
                if (this.ctxMenu !== undefined){
                    this.createContextMenu();
                    if (this.ctxMenu.domNode !== undefined){
                        domStyle.set(this.ctxMenu.domNode, 'display', 'block');
                    }
                }
            },

            attachClearListener: function() {
                var nodeList = query('div .esriStopsClearDirections');
                if (nodeList.length > 0) {
                    this.own(on(nodeList[0], "click", lang.hitch(this, function(evt) {
                        this.clearStopInputBoxes();
                        this.routeGraphicsLayer.clear();
                    })));
                }
            },

            removeGraphic: function(stopType) {
                if (this.routeGraphicsLayer.graphics.length > 0) {
                    var filteredGraphics = dojo.filter(this.routeGraphicsLayer.graphics, function(graphic) {
                        if (graphic.attributes.TYPE === stopType)
                            return graphic;
                    });
                    dojo.forEach(filteredGraphics, lang.hitch(this, function(g) {
                        if (g !== undefined)
                            this.routeGraphicsLayer.remove(g);
                    }));
                    this.routeGraphicsLayer.redraw();
                }
            },

            createContextMenu: function() {
                this.ctxMenu = new Menu({
                    onOpen: lang.hitch(this, function(box) {
                        currentLocation = this.getMapPointFromMenuPosition(box);
                    })
                });

                this.ctxMenu.addChild(new MenuItem({
                    label: "Directions from here",
                    onClick: lang.hitch(this, function(evt) {
                        this.removeGraphic(this.STOP_TYPE.START);
                        var symbol = new SimpleMarkerSymbol(
                            SimpleMarkerSymbol.STYLE_CIRCLE,
                            20,
                            new SimpleLineSymbol(
                                SimpleLineSymbol.STYLE_SOLID,
                                new Color([47, 196, 10, 0.9]),
                                1
                            ), new Color([47, 196, 10, 0.5]));
                        var graphic = new Graphic(currentLocation, symbol, {"TYPE":"start"});
                        this.routeGraphicsLayer.add(graphic);
                        this.stopType = this.STOP_TYPE.START;
                        this.geocodeCoordinates(currentLocation);
                    })
                }));

                if (this.getStopsCount() > 3) {
                    this.ctxMenu.addChild(new MenuItem({
                        label: "Add new stop",
                        onClick: lang.hitch(this, function(evt) {
                            var symbol = new SimpleMarkerSymbol(
                                SimpleMarkerSymbol.STYLE_CIRCLE,
                                20,
                                new SimpleLineSymbol(
                                    SimpleLineSymbol.STYLE_SOLID,
                                    new Color([0, 0, 255, 0.9]),
                                    1
                                ), new Color([0, 0, 255, 0.5]));
                            var graphic = new Graphic(currentLocation, symbol, {"TYPE":"stop"});
                            this.routeGraphicsLayer.add(graphic);
                            this.stopType = this.STOP_TYPE.STOP;
                            this.geocodeCoordinates(currentLocation);
                        })
                    }));
                }

                this.ctxMenu.addChild(new MenuItem({
                    label: "Directions to here",
                    onClick: lang.hitch(this, function(evt) {
                        this.removeGraphic(this.STOP_TYPE.END);
                        var symbol = new SimpleMarkerSymbol(
                            SimpleMarkerSymbol.STYLE_CIRCLE,
                            20,
                            new SimpleLineSymbol(
                                SimpleLineSymbol.STYLE_SOLID,
                                new Color([255, 0, 0, 0.9]),
                                1
                            ), new Color([255, 0, 0, 0.5]));
                        var graphic = new Graphic(currentLocation, symbol, {"TYPE":"end"});
                        this.routeGraphicsLayer.add(graphic);
                        this.stopType = this.STOP_TYPE.END;
                        this.geocodeCoordinates(currentLocation);
                    })
                }));

                this.ctxMenu.startup();
                this.ctxMenu.bindDomNode(this.map.container);
            },

            getStopsCount: function() {
                var nodeList = query('input[role=textbox]');
                var count = 0;
                dojo.forEach(nodeList, function(node){
                    console.log(node.id);
                });
                return nodeList.length;
            },

            populateStopInputBox: function(stopType, address) {
                var nodeList = query('input[role=textbox]');
                if (stopType === this.STOP_TYPE.START) {
                    //nodeList[1].set("value", address);
                    this._dijitDirections.addStop(address, 0);
                } else if (stopType === this.STOP_TYPE.STOP) {
                    //nodeList[nodeList.length - 2].set("value", address);
                    this._dijitDirections.addStop(address, nodeList.length - 2);
                } else {
                    //nodeList[nodeList.length - 1].set("value", address);
                    this._dijitDirections.addStop(address, nodeList.length - 1);
                }

            },

            clearStopInputBoxes: function() {
                var nodeList = query('input[role=textbox]');
                for (var i=1; i<nodeList.length; i++) {
                    nodeList[i].value = "";
                }
            },

            getMapPointFromMenuPosition: function(box) {
                var x = box.x, y = box.y;
                switch( box.corner ) {
                    case "TR":
                        x += box.w;
                        break;
                    case "BL":
                        y += box.h;
                        break;
                    case "BR":
                        x += box.w;
                        y += box.h;
                        break;
                }

                var screenPoint = new Point(x - this.map.position.x, y - this.map.position.y);
                return this.map.toMap(screenPoint);
            }

        });
    });