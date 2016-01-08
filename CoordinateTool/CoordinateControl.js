/*global define*/
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/string',
    'dojo/topic',
    'dojo/number',
    'dojo/keys',
    'dojo/dom',
    'dojo/mouse',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/TextBox',
    'dijit/form/Select',
    'dijit/registry',
    'dijit/WidgetSet',
    'dijit/Tooltip',
    'dojo/text!./CoordinateControl.html',
    'esri/geometry/webMercatorUtils',
    'esri/graphic',
    'esri/geometry/Point',
    'esri/SpatialReference',
    'esri/tasks/GeometryService',
    './util',
    'libs/usng/usng',
    './libs/gars',
    'jimu/dijit/Message'
], function (
    dojoDeclare,
    dojoLang,
    dojoOn,
    dojoDomAttr,
    dojoDomClass,
    dojoDomStyle,
    dojoString,
    dojoTopic,
    dojoNumber,
    dojoKeys,
    dojoDom,
    dojoMouse,
    dijitWidgetBase,
    dijitTemplatedMixin,
    dijitWidgetsInTemplate,
    dijitTextBox,
    dijitSelect,
    dijitRegistry,
    dijitWidgetSet,
    dijitTooltip,
    coordCntrl,
    esriWMUtils,
    EsriGraphic,
    EsriPoint,
    EsriSpatialReference,
    EsriGeometryService,
    Util,
    usng,
    gars,
    JimuMessage
) {
    'use strict';
    return dojoDeclare([dijitWidgetBase, dijitTemplatedMixin, dijitWidgetsInTemplate], {
        templateString: coordCntrl,
        baseClass: 'jimu-widget-cc',
        input: true,
        /**** type: 'dd', Available Types: DD, DDM, DMS, GARS, MGRS, USNG, UTM ****/

        /**
         *
         **/
        constructor: function (args) {
            dojoDeclare.safeMixin(this, args);
            this.uid = args.id || dijit.registry.getUniqueId('cc');
        },

        /**
         *
         **/
        parentStateDidChange: function (state) {
            if (state === 'opened') {
                this.mapclickhandler.resume();
            } else {
                this.mapclickhandler.pause();
            }
        },

        /**
         *
         **/
        postCreate: function () {
            //this.inherited(arguments);
            this.uid = this.id;

            this.util = new Util({});

            var geomsrvcurl = this.parent_widget.config.geometry_service.url ||
                    'http://sampleserver6.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer/fromGeoCoordinateString';

            this.geomsrvc = new EsriGeometryService(geomsrvcurl);

            this.typeSelect.set('value', this.type);

            // setup event notification and handlers
            dojoTopic.subscribe("CRDWIDGETSTATEDIDCHANGE", dojoLang.hitch(this, this.parentStateDidChange));
            dojoTopic.subscribe("INPUTPOINTDIDCHANGE", dojoLang.hitch(this, this.mapWasClicked));

            this.own(dojoOn(this.expandButton, 'click', dojoLang.hitch(this, this.expandButtonWasClicked)));
            this.own(dojoOn(this.addNewCoordinateNotationBtn, 'click', dojoLang.hitch(this, this.newCoordnateBtnWasClicked)));
            this.own(dojoOn(this.zoomButton, 'click', dojoLang.hitch(this, this.zoomButtonWasClicked)));

            this.cpbtn.addEventListener('click', dojoLang.hitch(this, this.cpBtnWasClicked));
            //this.own(dojoOn(this.cpbtn, 'click', dojoLang.hitch(this, this.cpBtnWasClicked)));

            this.mapclickhandler = dojoOn.pausable(this.parent_widget.map, 'click', dojoLang.hitch(this, this.mapWasClicked));

            this.own(this.typeSelect.on('change', dojoLang.hitch(this, this.typeSelectDidChange)));

            // hide any actions we don't want to see on the input coords
            if (this.input) {

                this.setHidden(this.expandButton);
                this.setHidden(this.removeControlBtn);
                this.own(dojoOn(this.coordtext, 'keyup', dojoLang.hitch(this, this.coordTextInputKeyWasPressed)));
                this.own(this.geomsrvc.on('error', dojoLang.hitch(this, this.geomSrvcDidFail)));

                dojoDomClass.add(this.cpbtn, 'inputCopyBtn');
                dojoDomAttr.set(this.cpbtn, 'title', 'Copy all output coordinates');

                // add a default graphic during input widget initialization
                var cPt = this.parent_widget.map.extent.getCenter();
                this.parent_widget.coordGLayer.add(new EsriGraphic(cPt));
                this.currentClickPoint = this.getDDPoint(cPt);
            } else {
                dojoDomClass.add(this.cpbtn, 'outputCopyBtn');
                this.setHidden(this.addNewCoordinateNotationBtn);
                this.setHidden(this.zoomButton);
                this.coordtext.readOnly = true;
            }

            // set an initial coord
            if (this.currentClickPoint) {
                this.getFormattedCoordinates(this.currentClickPoint);
            }
        },
      
        /**
         *
         **/
        cpBtnWasClicked: function (evt) {
            evt.preventDefault();
            var s = undefined;
            var tv;
            if (this.input) {

                var fw = dijitRegistry.filter(function (w) {
                    return w.baseClass === 'jimu-widget-cc' && !w.input;
                });

                var w = fw.map(function (w) {
                    return w.coordtext.value;
                }).join('\r\n');

                tv = this.coordtext.value;

                this.coordtext.value = w;

                this.coordtext.select();
                
                try {
                    s = document.execCommand('copy');

                } catch (err) {
                    s = false;
                }
                
                this.coordtext.value = tv;
                

            } else {

                this.coordtext.select();
                try {
                    s = document.execCommand('copy');
                } catch (err) {
                    s = false;
                }
            }

            var t = s ? "Copy Succesful" : "Unable to Copy\n use ctrl+c as an alternative";
            this.showToolTip(this.cpbtn.id, t);
        },

        showToolTip: function (onId, withText) {

            var n = dojoDom.byId(onId);
            dijitTooltip.show(withText, n);
            /*dijitTooltip.defaultPosition = 'below';
            dojoOn.once(n, dojoMouse.leave, function () {
                dijitTooltip.hide(n);
            })*/
            setTimeout(function () {
                dijitTooltip.hide(n);
            }, 1000);
        },
        /**
         *
         **/
        geomSrvcDidComplete: function (r) {
            if (r[0].length <= 0) {
                new JimuMessage({message: "unable to parse coordinates"});
                return;
            }

            var newpt = new EsriPoint(r[0][0], r[0][1], new EsriSpatialReference({wkid: 4326}));
            this.currentClickPoint = newpt;

            if (this.input) {
                dojoTopic.publish("INPUTPOINTDIDCHANGE", {mapPoint: this.currentClickPoint});
            }
        },

        /**
         *
         **/
        geomSrvcDidFail: function () {
            new JimuMessage({message: "Unable to parse input coordinates"});
        },

        /**
         *
         **/
        coordTextInputKeyWasPressed: function (evt) {
            if (evt.keyCode === dojoKeys.ENTER) {
                this.processCoordTextInput(evt.currentTarget.value);
            }
        },

        /**
         *
         **/
        processCoordTextInput: function (withStr) {
            var params = {
                sr: 4326,
                conversionType: this.type,
                strings: [withStr]
            };

            this.geomsrvc.fromGeoCoordinateString(params, dojoLang.hitch(this, this.geomSrvcDidComplete));
        },

        /**
         *
         **/
        zoomButtonWasClicked: function () {
            if (this.input) {
                this.parent_widget.map.centerAndZoom(this.currentClickPoint, 19);
            }
        },

        /**
         *
         **/
        typeSelectDidChange: function () {
            this.type = this.typeSelect.get('value');

            if (this.currentClickPoint) {
                this.getFormattedCoordinates(this.currentClickPoint);
            }
        },

        /**
         *
         **/
        newCoordnateBtnWasClicked: function () {
            dojoTopic.publish("ADDNEWNOTATION");
        },

        /**
         *
         **/
        setHidden: function (cntrl) {
            dojoDomStyle.set(cntrl, 'display', 'None');
        },

        /**
         *
         **/
        remove: function () {
            this.destroy();
        },

        /**
         *
         **/
        mapWasClicked: function (evt) {

            if (this.input) {
                this.parent_widget.coordGLayer.clear();
                this.parent_widget.coordGLayer.add(new EsriGraphic(evt.mapPoint));
            }

            this.currentClickPoint = this.getDDPoint(evt.mapPoint);

            this.getFormattedCoordinates(this.currentClickPoint);
        },

        /**
         *
         **/
        getDDPoint: function (fromPoint) {
            if (fromPoint.spatialReference.wkid === 102100) {
                return esriWMUtils.webMercatorToGeographic(fromPoint);
            }
            return fromPoint;
        },

        /**
         *
         **/
        expandButtonWasClicked: function () {
            dojoDomClass.toggle(this.coordcontrols, 'expanded');

            // if this.coordcontrols is expanded then disable all it's children
            if (dojoDomClass.contains(this.coordcontrols, 'expanded')) {
                console.log("hello");
            }
        },

        /**
         *
         **/
        getFormattedCoordinates: function () {
            var frmt;
            var latdeg;
            var latmin;
            var latdirstr;
            var londeg;
            var lonmin;
            var londirstr;
            var utmcrds = [];
            var utmzone = '';

            switch (this.type) {
            case 'DDM':
                // Math.trunc not fully supported on older browsers
                latdeg = Math.floor(Math.abs(this.currentClickPoint.y));
                latmin = dojoNumber.format((Math.abs(this.currentClickPoint.y) - latdeg) * 60, {
                    places: 2
                });

                londeg = Math.floor(Math.abs(this.currentClickPoint.x));
                lonmin = dojoNumber.format((Math.abs(this.currentClickPoint.x) - londeg) * 60, {
                    places: 2
                });

                latdirstr = "N";
                if (this.currentClickPoint.y < 0) {
                    latdirstr = "S";
                }

                londirstr = "E";
                if (this.currentClickPoint.x < 0) {
                    londirstr = "W";
                }

                frmt = dojoString.substitute('${latd}° ${latm}${latdir} ${lond}° ${lonm}${londir}', {
                    latd: latdeg,
                    latm: latmin,
                    latdir: latdirstr,
                    lond: londeg,
                    lonm: lonmin,
                    londir: londirstr
                });
                break;
            case 'DD':
                frmt = dojoString.substitute('${xcrd} ${ycrd}', {
                    xcrd: dojoNumber.format(this.currentClickPoint.y, {
                        places: 4
                    }),
                    ycrd: dojoNumber.format(this.currentClickPoint.x, {
                        places: 4
                    })
                });
                break;
            case 'DMS':
                frmt = dojoString.substitute("${d1} ${d2}", {
                    d1: this.degToDMS(this.currentClickPoint.y, 'LAT'),
                    d2: this.degToDMS(this.currentClickPoint.x, 'LON')
                });
                break;
            case 'USNG':
                frmt = usng.LLtoUSNG(this.currentClickPoint.y, this.currentClickPoint.x, 5);
                break;
            case 'MGRS':
                frmt = usng.LLtoMGRS(this.currentClickPoint.y, this.currentClickPoint.x, 5);
                break;
            case 'GARS':
                frmt = gars.LLtoGARS(this.currentClickPoint.y, this.currentClickPoint.x);
                break;
            case 'UTM':
                usng.LLtoUTM(this.currentClickPoint.y, this.currentClickPoint.x, utmcrds, utmzone);
                frmt = dojoString.substitute("${z}${zd} ${utm1} ${utm2}", {
                    z: utmcrds[2],
                    zd: usng.UTMLetterDesignator(this.currentClickPoint.y),
                    utm1: dojoNumber.format(utmcrds[0], {
                        places: 2,
                        pattern: '##000000.####'
                    }),
                    utm2: dojoNumber.format(utmcrds[1], {
                        places: 2,
                        pattern: '##000000.####'
                    })
                });
                break;
            }

            if (this.coordtext) {
                dojoDomAttr.set(this.coordtext, 'value', frmt);
            }
        },

        /**
         * Helper function to prettify decimal degrees into DMS (degrees-minutes-seconds).
         *
         * @param {number} decDeg The decimal degree number
         * @param {string} decDir LAT or LON
         *
         * @return {string} Human-readable representation of decDeg.
         **/
        degToDMS: function (decDeg, decDir) {
            /** @type {number} */
            var d = Math.abs(decDeg);

            /** @type {number} */
            var deg = Math.floor(d);
            d = d - deg;

            /** @type {number} */
            var min = Math.floor(d * 60);

            /** @type {number} */
            var sec = Math.floor((d - min / 60) * 60 * 60);

            if (sec === 60) { // can happen due to rounding above
                min = min + 1;
                sec = 0;
            }
            if (min === 60) { // can happen due to rounding above
                deg = deg + 1;
                min = 0;
            }

            /** @type {string} */
            //var min_string = min < 10 ? "0" + min : min;
            var min_string = min;
            if (min < 10) {
                min_string = "0" + min;
            }

            /** @type {string} */
            //var sec_string = sec < 10 ? "0" + sec : sec;
            var sec_string = sec;
            if (sec < 10) {
                sec_string = "0" + sec;
            }

            /** @type {string} */
            //var dir = (decDir === 'LAT') ? (decDeg < 0 ? "S" : "N") : (decDeg < 0 ? "W" : "E");

            var dir;
            if (decDir === 'LAT') {
                dir = "N";
                if (decDeg < 0) {
                    dir = "S";
                }
            } else {
                dir = "E";
                if (decDeg < 0) {
                    dir = "N";
                }
            }
            /*return (decDir === 'LAT') ? deg + "&deg;" + min_string + "&prime;" + sec_string + "&Prime;" + dir :
                deg + "&deg;" + min_string + "&prime;" + sec_string + "&Prime;" + dir;*/

            return dojoString.substitute("${d}° ${m}' ${s}''${dr}", {
                d: deg,
                m: min_string,
                s: sec_string,
                dr: dir
            });
        }
    });
});
