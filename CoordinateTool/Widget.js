/*global define*/
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/topic',
    'dojo/_base/array',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'esri/tasks/GeometryService',
    './CoordinateControl'
], function (
    dojoDeclare,
    dojoLang,
    dojoTopic,
    dojoArray,
    dojoWidgetsInTemplateMixin,
    jimuBaseWidget,
    EsriGeometryService,
    CoordinateControl
) {
    var clazz = dojoDeclare([jimuBaseWidget, dojoWidgetsInTemplateMixin], {

        baseClass: 'jimu-widget-cw',
        name: 'CW',
        coordinateControls: [],

        /**
         *
         **/
        postCreate: function () {
            //this.inherited(arguments);

            this.geomService = new EsriGeometryService(this.appConfig.geometryService);

            //dojoTopic.subscribe("INPUTPOINTDIDCHANGE", dojoLang.hitch(this, this.getCoordValues));
            dojoTopic.subscribe("REMOVECONTROL", dojoLang.hitch(this, this.removeControl));
            dojoTopic.subscribe("ADDNEWNOTATION", dojoLang.hitch(this, this.addOutputSrBtn));

            this.coordTypes = ['DD', 'DDM', 'DMS', 'GARS', 'MGRS', 'USNG', 'UTM'];
            dojoArray.forEach(this.coordTypes, function (itm) {
                this.addOutputSrBtn(itm);
            }, this);
        },

        /**
         *
         **/
        removeControl: function () {
            console.log("Remove Control");
        },

        /**
         *
         **/
        addOutputSrBtn: function (withType) {

            if (!withType) {
                withType = 'DD';
            }

            var cc = new CoordinateControl({
                map: this.map,
                input: false,
                type: withType,
                currentpoint: this.currentpoint
            });
            cc.placeAt(this.outputtablecontainer);
            cc.startup();

        },

        /**
         *
         **/
        getCoordValues: function (evt) {
            console.log("Get CoordValues");

            var params = {
                sr: evt.spatialReference,
                coordinates: [[evt.x, evt.y]],
                conversionType: 'MGRS',
                conversionMode: 'mgrsDefault',
                numOfDigits: null,
                rounding: false,
                addSpaces: false
            };

            this.geomService.toGeoCoordinateString(
                params,
                dojoLang.hitch(this, this.geoCoordStrDidComplete),
                dojoLang.hitch(this, this.geoCoordStringDidFail)
            );
        },

        /**
         *
         **/
        geoCoordStrDidComplete: function (r) {
            console.log(r);
        },

        /**
         *
         **/
        geoCoordStringDidFail: function (r) {
            console.log(r);
        },

        /**
         *
         **/
        startup: function () {
            //this.inherited(arguments);

            var v = new CoordinateControl({
                map: this.map,
                input: true,
                type: 'DD'
            });
            v.placeAt(this.inputcoordcontainer);
            v.startup();

            //this.own(this.map.on('click', lang.hitch(this, this.mapWasClicked)));
        },

        /**
         * map click event handler
         *
        mapWasClicked: function (evt) {
            var fstr = dojoString.substitute("${xcoord} ${ycoord}", {
                xcoord: evt.mapPoint.x,
                ycoord: evt.mapPoint.y
            });

            dojoDomAttr.set(this.inputcoordinates, 'value', fstr);
        },**/

        /**
         *
        onOpen: function () {

        },**/

        /**
         *
         **/
        disableWebMapPopup: function () {
            this.map.setInfoWindowOnClick(false);
        },

        /**
         *
         **/
        enableWebMapPopup: function () {
            this.map.setInfoWindowOnClick(true);
        }
    });

    return clazz;
});
