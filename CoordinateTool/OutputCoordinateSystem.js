/*global define*/
define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting'
], function (
    dojoDeclare,
    dojoTemplatedMixin,
    jimuSettingWidget
) {
    return dojoDeclare([jimuSettingWidget, dojoTemplatedMixin], {

        /**
         *
         **/
        startup: function () {
            this.inherited(arguments);
        }
    });
});
