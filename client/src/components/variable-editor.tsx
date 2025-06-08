import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VariableDefinition {
  id: number;
  name: string;
  type: string;
  defaultValue: string | null;
  ownerId: string;
  ownerType: string;
  readPermission: string;
  writePermission: string;
  listPermission: string;
  createdAt: string;
  updatedAt: string;
}

interface VariableEditorProps {
  variable: VariableDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  mode: 'edit' | 'view';
}

export function VariableEditor({ variable, isOpen, onClose, mode }: VariableEditorProps) {
  const [value, setValue] = useState(variable?.defaultValue || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parse different data types
  const parseValue = (val: string, type: string) => {
    try {
      switch (type) {
        case 'color':
          // Color format: #RRGGBB or rgba(r,g,b,a)
          return val.startsWith('#') ? val : `#${val}`;
        case 'float3':
          // Float3 format: "x,y,z" or "{x:1,y:2,z:3}"
          if (val.includes(',')) {
            const parts = val.split(',').map(p => parseFloat(p.trim()));
            return { x: parts[0] || 0, y: parts[1] || 0, z: parts[2] || 0 };
          }
          return JSON.parse(val);
        case 'float2':
          if (val.includes(',')) {
            const parts = val.split(',').map(p => parseFloat(p.trim()));
            return { x: parts[0] || 0, y: parts[1] || 0 };
          }
          return JSON.parse(val);
        case 'bool':
          return val.toLowerCase() === 'true';
        default:
          return val;
      }
    } catch {
      return val;
    }
  };

  const formatValue = (val: any, type: string) => {
    switch (type) {
      case 'float3':
        if (typeof val === 'object' && val.x !== undefined) {
          return `${val.x},${val.y},${val.z}`;
        }
        return val;
      case 'float2':
        if (typeof val === 'object' && val.x !== undefined) {
          return `${val.x},${val.y}`;
        }
        return val;
      default:
        return String(val);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (newValue: string) => {
      return await apiRequest("PUT", `/api/v1/definitions/${variable?.id}`, { 
        defaultValue: newValue 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/definitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/stats"] });
      toast({
        title: "Variable Updated",
        description: `${variable?.name} has been updated successfully`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update variable",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/v1/definitions/${variable?.id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/definitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/stats"] });
      toast({
        title: "Variable Deleted",
        description: `${variable?.name} has been deleted successfully`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete variable",
        variant: "destructive",
      });
    },
  });

  const renderValueInput = () => {
    if (!variable) return null;

    const parsedValue = parseValue(value, variable.type);

    switch (variable.type) {
      case 'color':
        return (
          <div className="space-y-2">
            <Label>Color Value</Label>
            <div className="flex space-x-2">
              <Input
                type="color"
                value={typeof parsedValue === 'string' ? parsedValue : '#000000'}
                onChange={(e) => setValue(e.target.value)}
                className="w-16 h-10"
                disabled={mode === 'view'}
              />
              <Input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="#FF0000 or rgba(255,0,0,1)"
                className="flex-1"
                disabled={mode === 'view'}
              />
            </div>
          </div>
        );

      case 'float3':
        const float3Val = typeof parsedValue === 'object' ? parsedValue : { x: 0, y: 0, z: 0 };
        return (
          <div className="space-y-2">
            <Label>Vector3 (X, Y, Z)</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={float3Val.x}
                  onChange={(e) => {
                    const newVal = { ...float3Val, x: parseFloat(e.target.value) || 0 };
                    setValue(formatValue(newVal, 'float3'));
                  }}
                  disabled={mode === 'view'}
                />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={float3Val.y}
                  onChange={(e) => {
                    const newVal = { ...float3Val, y: parseFloat(e.target.value) || 0 };
                    setValue(formatValue(newVal, 'float3'));
                  }}
                  disabled={mode === 'view'}
                />
              </div>
              <div>
                <Label className="text-xs">Z</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={float3Val.z}
                  onChange={(e) => {
                    const newVal = { ...float3Val, z: parseFloat(e.target.value) || 0 };
                    setValue(formatValue(newVal, 'float3'));
                  }}
                  disabled={mode === 'view'}
                />
              </div>
            </div>
          </div>
        );

      case 'float2':
        const float2Val = typeof parsedValue === 'object' ? parsedValue : { x: 0, y: 0 };
        return (
          <div className="space-y-2">
            <Label>Vector2 (X, Y)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={float2Val.x}
                  onChange={(e) => {
                    const newVal = { ...float2Val, x: parseFloat(e.target.value) || 0 };
                    setValue(formatValue(newVal, 'float2'));
                  }}
                  disabled={mode === 'view'}
                />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={float2Val.y}
                  onChange={(e) => {
                    const newVal = { ...float2Val, y: parseFloat(e.target.value) || 0 };
                    setValue(formatValue(newVal, 'float2'));
                  }}
                  disabled={mode === 'view'}
                />
              </div>
            </div>
          </div>
        );

      case 'bool':
        return (
          <div className="space-y-2">
            <Label>Boolean Value</Label>
            <div className="flex items-center space-x-2">
              <Switch
                checked={parsedValue === true || value === 'true'}
                onCheckedChange={(checked) => setValue(checked.toString())}
                disabled={mode === 'view'}
              />
              <span className="text-sm text-slate-600">
                {parsedValue === true || value === 'true' ? 'True' : 'False'}
              </span>
            </div>
          </div>
        );

      case 'int':
        return (
          <div className="space-y-2">
            <Label>Integer Value</Label>
            <Input
              type="number"
              step="1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={mode === 'view'}
            />
          </div>
        );

      case 'float':
        return (
          <div className="space-y-2">
            <Label>Float Value</Label>
            <Input
              type="number"
              step="0.001"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={mode === 'view'}
            />
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label>String Value</Label>
            <Input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={mode === 'view'}
            />
          </div>
        );
    }
  };

  React.useEffect(() => {
    if (variable) {
      setValue(variable.defaultValue || '');
    }
  }, [variable]);

  if (!variable) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit' : 'View'} Variable: {variable.name}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? `Modify the value and settings for the ${variable.type} variable "${variable.name}".`
              : `View the current value and settings for the ${variable.type} variable "${variable.name}".`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Variable Information</Label>
            <div className="text-sm text-slate-600 space-y-1">
              <div>Type: <span className="font-mono">{variable.type}</span></div>
              <div>Owner: {variable.ownerType}</div>
              <div>Permissions: R:{variable.readPermission} W:{variable.writePermission}</div>
            </div>
          </div>

          {renderValueInput()}

          <div className="flex space-x-2 pt-4">
            {mode === 'edit' && (
              <>
                <Button
                  onClick={() => updateMutation.mutate(value)}
                  disabled={updateMutation.isPending}
                  className="flex-1"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={onClose}>
              {mode === 'edit' ? 'Cancel' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}