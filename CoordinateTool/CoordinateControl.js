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
    'dojo/html',
    'dojo/query',
    'dojo/NodeList-traverse',
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/TextBox',
    'dojo/text!./CoordinateControl.html',
    'esri/geometry/webMercatorUtils',
    './util',
    'libs/usng/usng',
    './libs/gars'
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
    dojoHtml,
    dojoQuery,
    dojoNodeListTraverse,
    dijitWidgetBase,
    dijitTemplatedMixin,
    dijitWidgetsInTemplate,
    dijitTextBox,
    coordCntrl,
    esriWMUtils,
    Util,
    usng,
    gars
) {
    return dojoDeclare([dijitWidgetBase, dijitTemplatedMixin, dijitWidgetsInTemplate], {
        templateString: coordCntrl,
        input: true,
        /**** type: 'dd', Available Types: DD, DDM, DMS, GARS, MGRS, USNG, UTM ****/

        /**
         *
         **/
        constructor: function (args) {
            dojoDeclare.safeMixin(this, args);
        },

        /**
         *
         **/
        postCreate: function () {
            this.inherited(arguments);

            this.util = new Util({});
            this.typeSelect.set('value', this.type);
            this.own(dojoOn(this.expandButton, 'click', dojoLang.hitch(this, this.expandButtonWasClicked)));
            this.own(this.map.on('click', dojoLang.hitch(this, this.mapWasClicked)));
            this.own(dojoOn(this.addNewCoordinateNotationBtn, 'click', dojoLang.hitch(this, this.newCoordnateBtnWasClicked)));
            this.own(this.typeSelect.on('change', dojoLang.hitch(this, this.typeSelectDidChange)));

            if (this.input) {
                this.setHidden(this.expandButton);
                this.setHidden(this.removeControlBtn);
            }

            if (!this.input) {
                this.setHidden(this.addNewCoordinateNotationBtn);
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

            /**/
            switch (evt.mapPoint.spatialReference.wkid) {
            case 102100:
                this.currentClickPoint = esriWMUtils.webMercatorToGeographic(evt.mapPoint);
                break;

            default:
                this.currentClickPoint = evt.mapPoint;
                break;
            }

            this.getFormattedCoordinates(this.currentClickPoint);

            if (this.input) {
                dojoTopic.publish("INPUTPOINTDIDCHANGE", this.currentClickPoint);
            }
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
        getFormattedCoordinates: function (latlonpoint) {
            var frmt;

            switch (this.type) {
            case 'DDM':
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
                frmt = usng.LLtoUSNG(this.currentClickPoint.y, this.currentClickPoint.x, 4);
                break;
            case 'MGRS':
                frmt = usng.LLtoMGRS(this.currentClickPoint.y, this.currentClickPoint.x, 4);
                break;
            case 'GARS':
                frmt = gars.LLtoGARS(this.currentClickPoint.y, this.currentClickPoint.x);
                break;
            case 'UTM':
                var utmcrds = [];
                var utmzone = '';
                usng.LLtoUTM(this.currentClickPoint.y, this.currentClickPoint.x, utmcrds, utmzone);
                frmt = dojoString.substitute("${z}${zd} ${utm1}m ${utm2}m", {
                    z: utmcrds[2],
                    zd: usng.UTMLetterDesignator(this.currentClickPoint.y),
                    utm1: dojoNumber.format(utmcrds[0], {
                        places: 0,
                        pattern: '000000'
                    }),
                    utm2: dojoNumber.format(utmcrds[1], {
                        places: 0,
                        pattern: '000000'
                    })
                });
                break;
            }

            //dojoHtml.set(this.coordtext, frmt);
            //this.coordtext.set("innerHTML", frmt);
            //this.coordtext.set('value', frmt);
            dojoDomAttr.set(this.coordtext, 'value', frmt);
            //this.coordtext.innerHTML = frmt;
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
                  min++;
                  sec = 0;
            }
            if (min === 60) { // can happen due to rounding above
                  deg++;
                  min = 0;
            }

            /** @type {string} */
            var min_string = min < 10 ? "0" + min : min;

            /** @type {string} */
            var sec_string = sec < 10 ? "0" + sec : sec;

            /** @type {string} */
            var dir = (decDir === 'LAT') ? (decDeg < 0 ? "S" : "N") : (decDeg < 0 ? "W" : "E");

            /*return (decDir === 'LAT') ? deg + "&deg;" + min_string + "&prime;" + sec_string + "&Prime;" + dir :
                deg + "&deg;" + min_string + "&prime;" + sec_string + "&Prime;" + dir;*/

            return (decDir === 'LAT') ? deg + "° " + min_string + "' " + sec_string + "''" + dir :
                deg + "° " + min_string + "' " + sec_string + "''" + dir;
        }
    });
});
