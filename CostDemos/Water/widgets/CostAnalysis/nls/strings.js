define({
    root: ({
        _widgetLabel: "Cost Analysis",

        /*Selection Method Panel*/
        projectName: "Project Name : ",
        projectDescription: "Project Description : ",
        createProject: "Create",
        loadSelectedProject: "Select Project : ",
        viewInMap: "View in Map",
        deleteProject: "Delete",
        loadProject: "Load",

        //Main Widget panel
        pressStr: "Press ",
        ctrlStr: " CTRL ",
        snapStr: " to enable snapping",

        clearAllSelection: "Clear All Selected Features",

        assetDescriptionTitle: "Asset  Description",
        assetSummaryTitle: "Asset Statistics",
        projectSummaryTitle: "Project Summary",

        calculatedTotalAssetCost: "Total Asset Cost",
        addProjectMultiplierAdditionalCost: "Add Project Multiplier and Additional Cost",
        additionalCost: "Additional Cost",
        projectMultiplier: "Project Multiplier :",
        calculatedGrossProjectCost: "Gross Project Cost",
        previous: "Back",
        clearSession: "Clear Session",

        save: "Save",
        dollar: "$",

        squareFeet: "Sq. ft.",
        foot: "ft.",

        selectEquation: "Select Cost Equation for Costing Geometry",
        selectOK: "OK",
        selectCancel: "Cancel",
        geography: "Geography : ",
        equationType: "Equation Type : ",
        selectEquationType: "Select Equation Type",

        moreThanOneGeography: "Asset is within more than one geographies. First geography will be used.",
        costEquationErrorMsg: "Cost Equation not found for Template. Please check Costing table record for particular template.",
        templateIdErrorMsg: "No template id found in feature.",


        //Project Multiplier and Additional Cost Panel
        costEscalationTip: "Add Cost Escalation Field",
        description: "Description",
        escalationType: "Type",
        value: "Value",
        actions: "Actions",
        multiplier: "*",
        additional: "+",
        calculatedTotalAssetCostAfterEscalation: "Total Asset Cost",
        calculatedGrossProjectCostAfterEscalation: "Gross Project Cost",
        okCostEsl: "OK",

        /*Load Orphan Asset Panel*/
        orphanAssetTip: "Load Orphan Asset",
        selectAssetByExtent: "Select Orphan Asset within Current Map Extent",
        selectAssetByDraw: "Select Orphan Asset on Map By Drawing",
        clearOrphanData: "Clear",
        loadOrphanData: "Load",
        cancelLoadOrphanData: "Cancel",

        //Detail Statistics Panel
        detailStaticsticsTip: "Detail Statistics",
        okStat: "OK",

        //Add New Statistics Panel
        addNewStaticsticsTip: "Add New Statistics",
        layerName: "Layer",
        statType: "Type",
        fieldName: "Field",
        statLabel: "Label",

        area: "Area",
        avg: "Average",
        count: "Count",
        length: "Length",
        max: "Maximum",
        min: "Minimum",
        sum: "Summation",

        okNewStat: "OK",

        //Details Asset Description Panel
        detailAssetDescriptionTip: "Details Asset Description",
        detailAssetDescriptionTreeGridLabel: "Costing Area",
        detailAssetDescriptionTreeGridGeographyName: "Default",
        okAssetDesc: "OK",

        //Edit Project Attribute Panel
        editProjectAttributeTip: "Edit Project Attributes",
        okPrjAttr: "OK",


        //Cost Equation Editor Panel
        costEquationEditorTip: "Cost Equation Editor",
        selectCostEquation: "Select Cost Equation",
        editCostEquation: "Edit Cost Equation",
        originalCostEquation: "Original Cost Equation",
        okCostEQT: "OK",
        cancelCostEQT: "Cancel",


        //Load Orphan Asset Confirm dialog
        loadOrphanAssetTitle: "Load Orphan Asset",
        loadOrphanAssetContent: "The map contains data that is contained in the project layers, but is not associated with a project, would you like to select and load this data for this project?",
        loadOrphanAssetYes: "Yes",
        loadOrphanAssetNo: "No",

        //Delete Project Confirm dialog
        deleteProjectTitle: "Delete Project",
        deleteProjectContent: "Do you want to Delete Project?",
        deleteProjectYes: "Yes",
        deleteProjectNo: "No",

        //Clear Current Session Confirm dialog
        clearSessionTitle: "Clear Current Session",
        clearSessionContent: "Do you want to Clear Current Session?",
        clearSessionYes: "Yes",
        clearSessionNo: "No",

        //Save Project Confirm dialog
        saveProjectTitle: "Save Project",
        saveProjectContent: "Do you want to save Project?",
        saveProjectYes: "Yes",
        saveProjectNo: "No",

        //Delete Asset from Detail Asset Treegrid Confirm dialog
        deleteAssetTitle: "Delete Asset",
        deleteAssetContent: "Do you want to Delete Selected Asset?",
        deleteAssetYes: "Yes",
        deleteAssetNo: "No",

        //Copy SelectedFeature to Selected Template
        copySelectedFeatureTitle: "Copy Feature to Selected Template",
        copySelectedFeatureContent: "Do you want to Copy Selected Feature to Selected Template?",
        copySelectedFeatureYes: "Yes",
        copySelectedFeatureNo: "No",

    })

});