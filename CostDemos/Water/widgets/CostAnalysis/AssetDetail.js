define([
    'dojo/_base/declare',
    'dojo/_base/kernel',
    'dojo/_base/lang',

    'dojo/i18n!esri/nls/jsapi',
    'dojo/_base/html',
    'dojo/keys',
    'dojo/on',
    'dojo/query',
    'dojo/dom',
    'dojo/dom-class',
    'dojo/dom-construct',

    'dojo/_base/array',
    'dojo/string'
],
    function (
        declare,
        dojo,
        lang,

        esriBundle,
        html,
        keys,
        on,
        query,
        dom,
        domClass,
        domConstruct,

        array,
        string

    ) {
        var AssetDetailInProject = declare(null, {
            id: null,
            feature: null,
            measure: 0,
            measureUnit: null,
            initialCostId: null,
            geographyId: null,
            geographyName: null,
            subGeoId: null,
            projectGroupCostingId: null,
            projectGroupCostingFeature: null,
            projectId: null,
            featureLayerName: null,
            featureLayerId: null,
            defaultCostEquation: null,
            modifiedCostEquation: null,
            initialAssetCost: null,
            modifiedAssetCost: null,
            unitCost: null,
            templateName: null,
            templateID: null,
            isNewFeature: true,
            constructor: function (options) {

                declare.safeMixin(this, options);
                this.id = options.id;
                this.feature = options.feature;
                this.measure = options.measure;
                this.measureUnit = options.measureUnit;
                this.initialCostId = options.initialCostId;
                this.geographyId = options.geographyId;
                this.subGeoId = options.subGeoId;
                this.projectGroupCostingId = options.projectGroupCostingId;
                this.projectGroupCostingFeature = options.projectGroupCostingFeature;
                this.projectId = options.projectId;
                this.featureLayerName = options.featureLayerName;
                this.featureLayerId = options.featureLayerId;
                this.defaultCostEquation = options.defaultCostEquation;
                this.modifiedCostEquation = options.modifiedCostEquation;
                this.initialAssetCost = null;
                this.modifiedAssetCost = null;
                this.unitCost = options.unitCost;
                this.templateName = options.templateName;
                this.templateID = options.templateID;
                this.isNewFeature = options.isNewFeature;
            },
        });
        return AssetDetailInProject;
    });