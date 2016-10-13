# Import arcpy module
import arcpy

# Script arguments

GRGName = arcpy.GetParameterAsText(0)

# Process: Make Table View
arcpy.MakeTableView_management(r"C:\OpsServer\DBConnections\CurrentOperations.sde\currentoperations.sde.GRGGrid", "GRG_RECORD_FILTER", "grg_Name like '" + GRGName + "'", "", "")

# Process: Delete Rows
arcpy.DeleteRows_management("GRG_RECORD_FILTER")



