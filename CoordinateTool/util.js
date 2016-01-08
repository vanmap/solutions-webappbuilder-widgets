/*global define*/
define([
    'dojo/_base/declare',
    'dojo/sniff'
], function (
    dojoDeclare,
    dojoSniff
) {
    'use strict';
    return dojoDeclare(null, {

        /**
         *
         **/
        isNumber: function (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }
    });
});
