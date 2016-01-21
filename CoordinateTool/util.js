/*global define*/
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/sniff'
], function (
    dojoDeclare,
    dojoArray,
    dojoSniff
) {
    'use strict';
    return dojoDeclare(null, {

        /**
         *
         **/
        isNumber: function (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },

        /**
         *
         **/
        getCoordinateType: function(fromInput) {
                //regexr.com
                var strs = [{
                        name: 'DD',
                        pattern: /^[-+]?\d+.\d+[,\s]+[-+]?\d+.\d*/
                    }, {
                        name: 'DDM',
                        pattern: /^\d*°\s\d*.\d*[N,n,S,s]*\s\d*°\s\d*.\d*[W,w,E,e]*/
                    }, {
                        name: 'DMS',
                        pattern: /^\d*°\s\d*'\s\d*"[N,n,S,s]?\s\d*°\s\d*'\s\d*"[N,n,S,s]?/
                    }, {
                        name: 'GARS',
                        pattern: /\d{3}[a-zA-Z]{2}\d?\d?/
                    }, {
                        name: 'MGRS',
                        pattern: /^\d{1,2}[C-HJ-NP-X][-,;:\s]*[A-HJ-NP-Z]{1}[A-HJ-NP-Z]{1}[-,;:\s]*\d{0,10}/
                    }, {
                        name: 'USNG',
                        pattern: /\d{2}[S,s,N,n]*\s[A-Za-z]*\s\d*/
                    }, {
                        name: 'UTM',
                        pattern: /\d{1,3}[S,s,N,n]*\s\d*[m,M]*\s\d*[m,M]*/
                    }
                ];
                
                var fndType = undefined;

                var matchedtype = dojoArray.filter(strs, function (itm) {
                    return itm.pattern.test(this.v);
                }, {t:this, v:fromInput});

                if (matchedtype.length === 1) {
                    return matchedtype[0].name;
                } else if (matchedtype.length > 0) {
                    return matchedtype;
                } else {
                    return null;
                }
        }
    });
});
