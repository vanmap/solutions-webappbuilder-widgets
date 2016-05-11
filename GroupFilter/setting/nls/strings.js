define({
  root : ( {
    configText : "Define Your Filter Groups Below",
    labels : {
      groupName : "Filter set name:",
      groupDesc : "Description:",
      groupOperator : "Preset Operator:",
      groupDefault : "Preset Value:"
    },
    buttons : {
      addNewGroup : "Add a New Group",
      addLayer : "Add Layer"
    },
    inputs : {
      groupName : "Give your group a name",
      groupDesc : "Description for your group",
      groupDefault : "Enter a predefined value",
      simpleMode : "Start in simple view",
      optionsMode : "Hide widget options",
      optionOR : "OR",
      optionAND : "AND",
      optionEQUAL : "EQUALS",
      optionNOTEQUAL : "NOT EQUAL",
      optionGREATERTHAN : "GREATER THAN",
      optionGREATERTHANEQUAL : "GREATER THAN OR EQUAL",
      optionLESSTHAN : "LESS THAN",
      optionLESSTHANEQUAL : "LESS THAN OR EQUAL",
      optionSTART : "BEGINS WITH",
      optionEND : "ENDS WITH",
      optionLIKE : "CONTAINS",
      optionNOTLIKE : "DOES NOT CONTAIN",
      optionNONE : "NONE"
    },
    tables : {
      layer : "Layers",
      field : "Fields",
      value : "Use Value",
      action : "Delete"
    },
    popup : {
      label : "Pick a Value"
    },
    errors : {
      noGroups : "You need at least one group.",
      noGroupName : "One or more Group Names are missing.",
      noDuplicates : "One or more Group Names are duplicated.",
      noRows : "You need at least one row in the table.",
      noLayers : "You have no layers in your map."
    },
    picker : {
      description: "Use this form to find a preset value for this group.",
      layer: "Select a layer",
      field: "Select a field",
      value: "Select a value"
    }
  })
});
