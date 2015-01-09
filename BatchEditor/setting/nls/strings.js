define({
    root: {
        page1:{
            selectToolHeader: "Select a method to select records to batch update.",
            selectToolDesc:"This tool support 4 different methods for generating a selected set of records to update.  Select one of the method and click next.  If you require more than one of these methods, please create another configuration of the widget.",
            selectByShape: "Select by Area",
            selectBySpatQuery: "Select by Feature",
            selectByAttQuery: "Select by Feature & Related Features",
            selectByQuery: "Select by Query",
            toolNotSelected:"Please select a selection method"
        },
        page2:{
            layersToolHeader: "Select the layers to update and the selection tools options, if any.",
            layersToolDesc: "The select method you picked on page one will be used to select and update a set of layers listed below.  If you check more than one layer, only the common editable fields will be available to update.  Depending on your choice of selection tool, additional option will be required.",
            layerTable: {
                colUpdate: "Update",
                colLabel: "Layer",
                colSelectByLayer: "Select By Layer",       
                colSelectByField: "Query field"
            },
            noEditableLayers: "No Editable Layers"
        },
        page3: {
            commonFieldsHeader: "Select the fields to batch update.",
            commonFieldsDesc: "Only the common editable fields will be shown below.  Please select the fields you wish to update.  If the same field from different layers has a different domain, only one domain will be shown and used.",
            noCommonFields: "No Common Fields",
            fieldTable: {
                colEdit: "Editable",
                colName: "Name",
                colAlias: "Alias",
                colAction: "Action"
            },
        },
        next: "Next",
        back: "Back",


       
        updateLayersHeader: "Select the layers to update",
        fields: "Fields",
        actions: "Actions",
        edit: "Editable",
        editpageName: "Name",
        editpageAlias: "Alias",
        editpageVisible: "Visible",
        editpageEditable: "Editable",
        selectBatchFields: "Select Fields to batch update",
        commonFieldList: "Select fields to batch update",
       
       
    }
});
