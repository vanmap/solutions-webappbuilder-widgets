define({
    root: ({
        _widgetLabel: "Batch Editor",
        widgetIntroSelectByArea: "Use one of the tools below to create a selected set of features to update.  If the row is <font class='maxRecordInIntro'>highlighted</font>, the maximum number of records has been exceeded.",
        widgetIntroSelectByFeature: "Use the tool below to select a feature from <font class='layerInIntro'>${0}</font> layer.  This feature will be used select and update all intersecting features.  If the row is <font class='maxRecordInIntro'>highlighted</font>, the maximum number of records has been exceeded.",
        widgetIntroselectByFeatureQuery: "Use the tool below to select a feature from ${0}.  This features ${1} attribute will be used query the layers below and update the resulting features.  If the row is displayed in color, the maximum number of records has been exceeded.",
        widgetIntroselectByQuery: "Use one of the tools below to create a selected set of features to update.  If the row is displayed in color, the maximum number of records has been exceeded.",
        layerTable: {
            colLabel: "Layer Name",
            numSelected: "Count"
        },
        noConfiguredLayers: "No editable layers configured",
        editorPopupTitle: "Batch Editor",
        editorPopupSaveBtn: "Save",
        editorPopupMultipleValues: "",
        clear: "Clear",
        featuresUpdated: "${0} feature(s) updated",
        featuresSelected: "${0} feature(s) selected",

        maxRecordCount: "Max Record Count Exceeded",
        errorInUpdatingEdits: "ERROR: updating ${0} features",

      
        drawBox: {
            point: "Point",
            line: "Line",
            polyline: "Polyline",
            freehandPolyline: "Freehand Polyline",
            extent: "Extent",
            polygon: "Polygon",
            freehandPolygon: "Freehand Polygon",
            clear: "Clear"
        },
    })
});
