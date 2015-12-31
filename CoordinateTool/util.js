/*global define*/
define([
    'dojo/_base/declare'
], function (
    dojoDeclare
) {
    return dojoDeclare(null, {
        
        /**
         *
         **/
        constructor: function (args) {
            
        },

        /**
         *
         **/
        isNumber: function (n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }
    });
});
