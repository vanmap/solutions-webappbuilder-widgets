define({
    root: {
        taskUrl: "Task URL",
        setTask: "Set",
        validate: "Set",
        inValidGPService: "Please Enter Valid Geoprocessing Service !!",
        invalidURL: "Task URL is invalid",
        configDataNull : "Config object is not set",
        GPFeatureRecordSetLayerERR : "Please enter GP Service with inputs of type GPFeatureRecordSetLayer only.",
        invalidInputParameters : "Number of input parameters is either less than or more than 3. Please Enter Valid Geoprocessing Service !!",
        // common
        inputName: "Name",
        inputRequired: "Required",
        inputLabel: "Label",
        inputTooltip: "Tooltip",
        symbol: "Symbol",
        others: "Other",
        // input details
        inputPanel: {
            inputTask: "Input",
            inputType: "Type",
            inputTypeFlag: "Flag",
            inputTypeBarriers: "Barriers",
            inputTypeSkip: "Skip"
        },
        // output details
        outputPanel: {
            outputTask: "Output",
            outputExport: "Export to CSV",
            outputLayer: "Save To Layer",
            outputLayerType: "Target Layer",
            outputDisplay: "Display Text",
            outputSummary: "Summary Text",
            skip: "Skippable",
            uniqueIDField: "Unique ID Field",
            outputminScale: "Min Scale",
            outputmaxScale: "Max Scale",
            panelText: "Panel Text"
        },
        //For Outage
        outagePanel: {
            outageTask: "Outage",
            outage: "Outage",
            outageParameter: "Outage ParamName",
            isvisible: "Visible",
            OutageFieldName: "Field Name",
            OutageParamName: "Parameter Name",
            inputVisiblity: "Visible"
        },
        // Others
        OthersHighlighter: {
            otherTask: "Others",
            pixel: "(Pixels)",
            miliseconds: "(miliseconds)",
            othersHighlightertext: "Highlighter Image Parameters",
            selectImage: "Image",
            height: "Image Height",
            width: "Image Width",
            timeout: "Timeout",
            imgPathHint1: "Hint:Set a relative path.",
            imgPathHint2: "Example:widgets/IsolationTrace/images/ani/blueglow.gif",
            imgPathHint3: "Example:widgets/IsolationTrace/images/ani/redglow.gif",
            example: "Example",
            example00: "widgets/IsolationTrace/images/ani/blueglow.gif",
            example01: "Description:Set a relative path.",
            example02: "",
            thumbnailHint: "(Click image to update)"
        },
        // validation messages
        validationErrorMessage: {
            webMapError: "Web map is not selected or layers are not available. Please select a valid webmap.",
		    inputTypeFlagGreaterThanError: "Input type flag cannot be more than one",
            inputTypeFlagLessThanError: "At least one input type flag required",
		    inputTypeBarrierErr: "Input type barrier cannot be more than one",
		    inputTypeSkipErr: "Input type skip cannot be more than one",
		    emptyOutputLabel: "Output Label value blank",
            outputLabelDataErr: "Output Label text cannot be blank",
		    outputPanelDataErr: "Output panel text cannot be blank",
		    outputSummaryDataErr: "Output Summary text cannot be blank",
		    outputDisplayDataErr: "Output Display text cannot be blank",
		    outputMinScaleDataErr: "Output MinScale text cannot be blank or negative value",
		    outputMaxScaleDataErr: "Output MaxScale text cannot be blank or negative value",
            outageFieldMappingErr: "Outage field mapping should have always unique pairs required",
            outputSummaryDataText: "Invalid summary text",
            outputDisplayDataText:  "Invalid display text format",
            otherHighlighterImage : "Please select Highlighter image"
        },
        // Hint Text
        hintText: {
           inputTypeHint: "Hint: Select the type/purpose of this input parameter",
           labelTextHint:"Hint: Provide display label for result panel of output parameter",
           skippableHint: "Hint: Enable/Disable Skip functionality for this output parameter",
           skippableFieldHint: "Hint: Select Unique ID Field for skip functionality",
           summaryTextHint: "Hint: This will be displayed in the summary panel for this output parameter. Optionally you can include following fields: {Count} {Skipcount}.",
           displayTextHint: "Hint: This will be displayed in the details panel for this output parameter. Optionally you can include following fields:",
           exportToCSVHint: "Hint: Enable/Disable Export to CSV functionality for this output parameter",
           saveToLayerHint: "Hint: Enable/Disable Save to Layer functionality for this output parameter",
           outputLayerType: "Hint: Select feature layer in which results for this output parameter would be saved",
           outageParamHint: "Hint: Select the output parameter which would act as Outage Area",
           visibilityHint: "Hint: Enable/Disable Visibility of Outage Area",
           fieldNameHint: "Hint: Select Field Name",
           paramNameHint: "Hint: Select Parameter Name",
           imgHeightHintText: "",
           imgWidthHintHintText: "",
           imgTimeoutHintText: "Hint: Specify timeout for highlighter image",
           TargetLayerHint: "Hint: For Target Layer"
        }
    }
});