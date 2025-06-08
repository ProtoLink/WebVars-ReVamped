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
import { getEnumValues } from "@shared/resonite-enums";

// Helper function to render smart input components based on data type
const renderSmartInput = (type: string, value: string, onChange: (value: string) => void, disabled: boolean, enumType?: string) => {
  // Handle enum type with specific enum values
  if (type === 'enum' && enumType) {
    const enumValues = getEnumValues(enumType as any);
    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${enumType} value`} />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {enumValues.map((enumValue) => (
            <SelectItem key={enumValue} value={enumValue}>
              {enumValue}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  switch (type) {
    case 'bool':
      return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Select boolean value" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );

    case 'color':
    case 'colorX':
      return (
        <div className="flex space-x-2">
          <Input
            type="color"
            value={value.startsWith('#') ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="w-16 h-10"
            disabled={disabled}
          />
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#RRGGBB or rgba(r,g,b,a)"
            className="flex-1"
            disabled={disabled}
          />
        </div>
      );

    case 'datetime':
      return (
        <Input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );

    case 'uri':
      return (
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com"
          disabled={disabled}
        />
      );

    case 'float':
    case 'double':
    case 'decimal':
    case 'half':
      return (
        <Input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.0"
          disabled={disabled}
        />
      );

    case 'int':
    case 'uint':
    case 'long':
    case 'ulong':
    case 'short':
    case 'ushort':
    case 'byte':
    case 'sbyte':
      return (
        <Input
          type="number"
          step="1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          disabled={disabled}
        />
      );

    case 'float2':
    case 'double2':
    case 'int2':
    case 'uint2':
    case 'long2':
    case 'ulong2':
    case 'bool2':
      const parts2 = value.split(',');
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type={type.includes('bool') ? 'text' : 'number'}
            step={type.includes('float') || type.includes('double') ? 'any' : '1'}
            placeholder="X"
            value={parts2[0] || ''}
            onChange={(e) => {
              const newParts = [...parts2];
              newParts[0] = e.target.value;
              onChange(newParts.join(','));
            }}
            disabled={disabled}
          />
          <Input
            type={type.includes('bool') ? 'text' : 'number'}
            step={type.includes('float') || type.includes('double') ? 'any' : '1'}
            placeholder="Y"
            value={parts2[1] || ''}
            onChange={(e) => {
              const newParts = [...parts2];
              newParts[1] = e.target.value;
              onChange(newParts.join(','));
            }}
            disabled={disabled}
          />
        </div>
      );

    case 'float3':
    case 'double3':
    case 'int3':
    case 'uint3':
    case 'long3':
    case 'ulong3':
    case 'bool3':
      const parts3 = value.split(',');
      return (
        <div className="grid grid-cols-3 gap-2">
          {['X', 'Y', 'Z'].map((label, index) => (
            <Input
              key={label}
              type={type.includes('bool') ? 'text' : 'number'}
              step={type.includes('float') || type.includes('double') ? 'any' : '1'}
              placeholder={label}
              value={parts3[index] || ''}
              onChange={(e) => {
                const newParts = [...parts3];
                newParts[index] = e.target.value;
                onChange(newParts.join(','));
              }}
              disabled={disabled}
            />
          ))}
        </div>
      );

    case 'float4':
    case 'double4':
    case 'int4':
    case 'uint4':
    case 'long4':
    case 'ulong4':
    case 'bool4':
    case 'floatQ':
    case 'doubleQ':
      const parts4 = value.split(',');
      return (
        <div className="grid grid-cols-2 gap-2">
          {['X', 'Y', 'Z', 'W'].map((label, index) => (
            <Input
              key={label}
              type={type.includes('bool') ? 'text' : 'number'}
              step={type.includes('float') || type.includes('double') ? 'any' : '1'}
              placeholder={label}
              value={parts4[index] || ''}
              onChange={(e) => {
                const newParts = [...parts4];
                newParts[index] = e.target.value;
                onChange(newParts.join(','));
              }}
              disabled={disabled}
            />
          ))}
        </div>
      );

    case 'char':
      return (
        <Input
          type="text"
          maxLength={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Single character"
          disabled={disabled}
        />
      );

    case 'timespan':
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="00:00:00 or Days.Hours:Minutes:Seconds"
          disabled={disabled}
        />
      );

    case 'refID':
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Reference ID"
          disabled={disabled}
        />
      );

    default:
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value..."
          disabled={disabled}
        />
      );
  }
};

interface VariableDefinition {
  id: number;
  name: string;
  type: string;
  enumType?: string | null;
  defaultValue: string | null;
  ownerId: string;
  ownerType: string;
  readPermission: string;
  writePermission: string;
  listPermission: string;
  readOnly: boolean;
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
  const [value, setValue] = useState('');
  const [isLoadingValue, setIsLoadingValue] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
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
      return await apiRequest("POST", `/api/v1/variables/${variable?.name}`, { 
        value: newValue 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/definitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/stats"] });
      toast({
        title: "Your Value Updated",
        description: `Your personal value for "${variable?.name}" has been saved`,
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



  const renderValueInput = () => {
    if (!variable) return null;

    return (
      <div className="space-y-2">
        <Label>Your Value</Label>
        {renderSmartInput(
          variable.type,
          value,
          setValue,
          mode === 'view',
          variable.enumType || undefined
        )}
        {variable.type === 'enum' && variable.enumType && (
          <p className="text-xs text-muted-foreground">
            Enum Type: {variable.enumType}
          </p>
        )}
      </div>
    );
  };

  // Load user-specific value when variable changes
  React.useEffect(() => {
    if (variable && isOpen) {
      setIsLoadingValue(true);
      // Fetch the current user's value for this variable with format=json
      fetch(`/api/v1/variables/${variable.name}?format=json`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            // Always use the actual current value, whether it's user-specific or default
            setValue(data.data.value || '');
          } else {
            // Only fall back to default if API call fails completely
            setValue(variable.defaultValue || '');
          }
        })
        .catch(() => {
          // Fallback to default value on error
          setValue(variable.defaultValue || '');
        })
        .finally(() => {
          setIsLoadingValue(false);
        });
    }
  }, [variable, isOpen]);

  if (!variable) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Set Your Value' : 'Your Value'} for {variable.name}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? `Set your personal value for the ${variable.type} variable "${variable.name}". This won't affect other users' values.`
              : `View your current personal value for the ${variable.type} variable "${variable.name}".`
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
              <div>Default: <span className="font-mono text-xs bg-slate-100 px-1 rounded">{variable.defaultValue || 'null'}</span></div>
            </div>
          </div>

          {isLoadingValue ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-slate-600">Loading your value...</div>
            </div>
          ) : (
            renderValueInput()
          )}

          <div className="flex space-x-2 pt-4">
            {mode === 'edit' && (
              <Button
                onClick={() => updateMutation.mutate(value)}
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? 'Updating...' : 'Update'}
              </Button>
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