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
            outputminScale: "Min Scale",
            outputmaxScale: "Max Scale"
        },
        //For Outage
        outagePanel: {
            bufferDistance:"Buffer Distance",
            esriUnits:"Unit",
			outageFieldTagName:"Save Summary Options",
            outage: "Overview",
            isvisible: "Visible",
            OutageFieldName: "Field Name",
            OutageParamName: "Parameter Name",
            fieldMappingHint_1: "Select a field to store a summary of the output parameters and select the output parameter.",
            fieldMappingHint_2: "Currently only the count of items is supported.",
            esriMeters:"Meters",
            esriMiles:"Miles",
            esriFeets:"Feet",
            esriKilometers:"Kilometers"
        },
        // Others
        OthersHighlighter: {
            pixel: "(Pixels)",
            miliseconds: "(miliseconds)",
            displayTextForButtonLegend: "Display Text for Run button",
            displayTextforButtonDefaultValue:"Run",
            displayTextForButton: "Display Text",
            othersHighlightertext: "Highlighter Image Parameters",
            selectImage: "Image",
            height: "Image Height",
            width: "Image Width",
            timeout: "Timeout"
        },
        // validation messages
        validationErrorMessage: {
            webMapError: "Web map is not selected or layers are not available. Please select a valid webmap.",
		    inputTypeFlagGreaterThanError: "Input type flag cannot be more than one",
            inputTypeFlagLessThanError: "At least one input type flag required",
		    inputTypeBarrierErr: "Input type barrier cannot be more than one",
		    inputTypeSkipErr: "Input type skip cannot be more than one",
            outputLabelDataErr: "Output Label text cannot be blank",
		    outputSummaryDataErr: "Output Summary text cannot be blank",
		    outputDisplayDataErr: "Output Display text cannot be blank",
		    outputMinScaleDataErr: "Output MinScale text cannot be blank or negative value",
		    outputMaxScaleDataErr: "Output MaxScale text cannot be blank or negative value",
            outageFieldMappingErr: "Field mapping in Overview should have always unique pairs required",
            outputSummaryDataText: "Invalid summary text",
            outputDisplayDataText:  "Invalid display text format",
            otherHighlighterImage: "Please select Highlighter image",
            otherHighlighterImageHeight:"Image height should not be less than 0 or blank",
            otherHighlighterImageWidth:"Image width should not be less than 0 or blank",
            otherHighlighterImageTimeout:"Image timeout should not be less than 0 or blank",
            saveToLayerTargetLayers: "Target layer should be unique or cannot be blank",
            displayTextForButtonError: "Display Text for Run button can not be blank.",
            BufferDisatanceOverview :"Buffer distance should not be blank or 0 or less than 0",
        },
        // Hint Text
        hintText: {
           inputTypeHint: "Hint: Select the type/purpose of this input parameter",
           labelTextHint:"Hint: Provide display label for result panel of output parameter",
           skippableHint: "Hint: Enable/Disable Skip functionality for this output parameter",
           summaryTextHint: "Hint: This will be displayed in the summary panel for this output parameter. Optionally you can include following fields: {Count} {Skipcount}.",
           displayTextHint: "Hint: This will be displayed in the details panel for this output parameter. Optionally you can include following fields:",
           exportToCSVHint: "Hint: Enable/Disable Export to CSV functionality for this output parameter",
           saveToLayerHint: "Hint: Enable/Disable Save to Layer functionality for this output parameter",
           outputLayerType: "Hint: Select feature layer in which results for this output parameter would be saved",
           visibilityHint: "Hint: Enable/Disable Visibility of Outage Area",
           fieldNameHint: "Hint: Select Field Name",
           paramNameHint: "Hint: Select Parameter Name",
           imgTimeoutHintText: "Hint: Specify timeout for highlighter image"
        }
    }
});