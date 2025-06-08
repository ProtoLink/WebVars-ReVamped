import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SUPPORTED_DATA_TYPES } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Variable name is required").regex(/^[a-zA-Z0-9._-]+$/, "Invalid variable name format"),
  type: z.enum(SUPPORTED_DATA_TYPES),
  defaultValue: z.string().optional(),
  readPermission: z.string().default("variable_owner"),
  writePermission: z.string().default("variable_owner"),
  listPermission: z.string().default("definition_owner"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateVariableFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
}

export function CreateVariableForm({ onSubmit, isLoading }: CreateVariableFormProps) {
  const [permissions, setPermissions] = useState({
    read: true,
    write: true,
    list: false,
  });
  const [defaultValue, setDefaultValue] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "string",
      readPermission: "variable_owner",
      writePermission: "variable_owner",
      listPermission: "definition_owner",
    },
  });

  const selectedType = watch("type");

  const handleFormSubmit = async (data: FormData) => {
    try {
      // Set the current default value to the form data
      setValue("defaultValue", defaultValue);
      const formData = { ...data, defaultValue };
      await onSubmit(formData);
      reset();
      setDefaultValue("");
      setPermissions({ read: true, write: true, list: false });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  // Reset default value when type changes
  const handleTypeChange = (newType: string) => {
    setValue("type", newType as any);
    setDefaultValue("");
  };

  const renderDefaultValueInput = () => {
    switch (selectedType) {
      case 'color':
        return (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                type="color"
                value={defaultValue.startsWith('#') ? defaultValue : '#000000'}
                onChange={(e) => setDefaultValue(e.target.value)}
                className="w-16 h-10"
              />
              <Input
                type="text"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                placeholder="#FF0000 or rgba(255,0,0,1)"
                className="flex-1"
              />
            </div>
          </div>
        );

      case 'float2':
      case 'double2':
        const float2Val = (() => {
          try {
            if (defaultValue.includes(',')) {
              const parts = defaultValue.split(',').map(p => parseFloat(p.trim()));
              return { x: parts[0] || 0, y: parts[1] || 0 };
            }
            return JSON.parse(defaultValue || '{"x":0,"y":0}');
          } catch {
            return { x: 0, y: 0 };
          }
        })();
        
        return (
          <div className="space-y-2">
            <Label className="text-sm">Vector2 (X, Y)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={float2Val.x}
                  onChange={(e) => {
                    const newVal = { ...float2Val, x: parseFloat(e.target.value) || 0 };
                    setDefaultValue(`${newVal.x},${newVal.y}`);
                  }}
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
                    setDefaultValue(`${newVal.x},${newVal.y}`);
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'float3':
      case 'double3':
        const float3Val = (() => {
          try {
            if (defaultValue.includes(',')) {
              const parts = defaultValue.split(',').map(p => parseFloat(p.trim()));
              return { x: parts[0] || 0, y: parts[1] || 0, z: parts[2] || 0 };
            }
            return JSON.parse(defaultValue || '{"x":0,"y":0,"z":0}');
          } catch {
            return { x: 0, y: 0, z: 0 };
          }
        })();
        
        return (
          <div className="space-y-2">
            <Label className="text-sm">Vector3 (X, Y, Z)</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={float3Val.x}
                  onChange={(e) => {
                    const newVal = { ...float3Val, x: parseFloat(e.target.value) || 0 };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z}`);
                  }}
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
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z}`);
                  }}
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
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z}`);
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'float4':
      case 'double4':
        const float4Val = (() => {
          try {
            if (defaultValue.includes(',')) {
              const parts = defaultValue.split(',').map(p => parseFloat(p.trim()));
              return { x: parts[0] || 0, y: parts[1] || 0, z: parts[2] || 0, w: parts[3] || 0 };
            }
            return JSON.parse(defaultValue || '{"x":0,"y":0,"z":0,"w":0}');
          } catch {
            return { x: 0, y: 0, z: 0, w: 0 };
          }
        })();
        
        return (
          <div className="space-y-2">
            <Label className="text-sm">Vector4 (X, Y, Z, W)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={float4Val.x}
                  onChange={(e) => {
                    const newVal = { ...float4Val, x: parseFloat(e.target.value) || 0 };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z},${newVal.w}`);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={float4Val.y}
                  onChange={(e) => {
                    const newVal = { ...float4Val, y: parseFloat(e.target.value) || 0 };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z},${newVal.w}`);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Z</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={float4Val.z}
                  onChange={(e) => {
                    const newVal = { ...float4Val, z: parseFloat(e.target.value) || 0 };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z},${newVal.w}`);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">W</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={float4Val.w}
                  onChange={(e) => {
                    const newVal = { ...float4Val, w: parseFloat(e.target.value) || 0 };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z},${newVal.w}`);
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'float2x2':
      case 'double2x2':
        const matrix2x2Val = (() => {
          try {
            if (defaultValue.includes(',')) {
              const parts = defaultValue.split(',').map(p => parseFloat(p.trim()));
              return [
                [parts[0] || 0, parts[1] || 0],
                [parts[2] || 0, parts[3] || 0]
              ];
            }
            return JSON.parse(defaultValue || '[[1,0],[0,1]]');
          } catch {
            return [[1, 0], [0, 1]]; // Identity matrix
          }
        })();
        
        return (
          <div className="space-y-2">
            <Label className="text-sm">2x2 Matrix</Label>
            <div className="space-y-2">
              {matrix2x2Val.map((row, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  {row.map((val, j) => (
                    <Input
                      key={`${i}-${j}`}
                      type="number"
                      step="0.001"
                      value={val}
                      onChange={(e) => {
                        const newMatrix = [...matrix2x2Val];
                        newMatrix[i][j] = parseFloat(e.target.value) || 0;
                        setDefaultValue(newMatrix.flat().join(','));
                      }}
                      className="text-center"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );

      case 'float3x3':
      case 'double3x3':
        const matrix3x3Val = (() => {
          try {
            if (defaultValue.includes(',')) {
              const parts = defaultValue.split(',').map(p => parseFloat(p.trim()));
              return [
                [parts[0] || 0, parts[1] || 0, parts[2] || 0],
                [parts[3] || 0, parts[4] || 0, parts[5] || 0],
                [parts[6] || 0, parts[7] || 0, parts[8] || 0]
              ];
            }
            return JSON.parse(defaultValue || '[[1,0,0],[0,1,0],[0,0,1]]');
          } catch {
            return [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; // Identity matrix
          }
        })();
        
        return (
          <div className="space-y-2">
            <Label className="text-sm">3x3 Matrix</Label>
            <div className="space-y-2">
              {matrix3x3Val.map((row, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  {row.map((val, j) => (
                    <Input
                      key={`${i}-${j}`}
                      type="number"
                      step="0.001"
                      value={val}
                      onChange={(e) => {
                        const newMatrix = [...matrix3x3Val];
                        newMatrix[i][j] = parseFloat(e.target.value) || 0;
                        setDefaultValue(newMatrix.flat().join(','));
                      }}
                      className="text-center text-sm"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );

      case 'float4x4':
      case 'double4x4':
        const matrix4x4Val = (() => {
          try {
            if (defaultValue.includes(',')) {
              const parts = defaultValue.split(',').map(p => parseFloat(p.trim()));
              const matrix = [];
              for (let i = 0; i < 4; i++) {
                matrix.push([
                  parts[i * 4] || 0,
                  parts[i * 4 + 1] || 0,
                  parts[i * 4 + 2] || 0,
                  parts[i * 4 + 3] || 0
                ]);
              }
              return matrix;
            }
            return JSON.parse(defaultValue || '[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]');
          } catch {
            return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]; // Identity matrix
          }
        })();
        
        return (
          <div className="space-y-2">
            <Label className="text-sm">4x4 Matrix</Label>
            <div className="space-y-1">
              {matrix4x4Val.map((row, i) => (
                <div key={i} className="grid grid-cols-4 gap-1">
                  {row.map((val, j) => (
                    <Input
                      key={`${i}-${j}`}
                      type="number"
                      step="0.001"
                      value={val}
                      onChange={(e) => {
                        const newMatrix = [...matrix4x4Val];
                        newMatrix[i][j] = parseFloat(e.target.value) || 0;
                        setDefaultValue(newMatrix.flat().join(','));
                      }}
                      className="text-center text-xs h-8"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        );

      case 'bool':
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Switch
                checked={defaultValue === 'true'}
                onCheckedChange={(checked) => setDefaultValue(checked.toString())}
              />
              <span className="text-sm text-slate-600">
                {defaultValue === 'true' ? 'True' : 'False'}
              </span>
            </div>
          </div>
        );

      case 'int2':
        const int2Val = (() => {
          try {
            if (defaultValue.includes(',')) {
              const parts = defaultValue.split(',').map(p => parseInt(p.trim()));
              return { x: parts[0] || 0, y: parts[1] || 0 };
            }
            return JSON.parse(defaultValue || '{"x":0,"y":0}');
          } catch {
            return { x: 0, y: 0 };
          }
        })();
        
        return (
          <div className="space-y-2">
            <Label className="text-sm">Int2 (X, Y)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input
                  type="number"
                  step="1"
                  value={int2Val.x}
                  onChange={(e) => {
                    const newVal = { ...int2Val, x: parseInt(e.target.value) || 0 };
                    setDefaultValue(`${newVal.x},${newVal.y}`);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input
                  type="number"
                  step="1"
                  value={int2Val.y}
                  onChange={(e) => {
                    const newVal = { ...int2Val, y: parseInt(e.target.value) || 0 };
                    setDefaultValue(`${newVal.x},${newVal.y}`);
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'int3':
        const int3Val = (() => {
          try {
            if (defaultValue.includes(',')) {
              const parts = defaultValue.split(',').map(p => parseInt(p.trim()));
              return { x: parts[0] || 0, y: parts[1] || 0, z: parts[2] || 0 };
            }
            return JSON.parse(defaultValue || '{"x":0,"y":0,"z":0}');
          } catch {
            return { x: 0, y: 0, z: 0 };
          }
        })();
        
        return (
          <div className="space-y-2">
            <Label className="text-sm">Int3 (X, Y, Z)</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input
                  type="number"
                  step="1"
                  value={int3Val.x}
                  onChange={(e) => {
                    const newVal = { ...int3Val, x: parseInt(e.target.value) || 0 };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z}`);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input
                  type="number"
                  step="1"
                  value={int3Val.y}
                  onChange={(e) => {
                    const newVal = { ...int3Val, y: parseInt(e.target.value) || 0 };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z}`);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Z</Label>
                <Input
                  type="number"
                  step="1"
                  value={int3Val.z}
                  onChange={(e) => {
                    const newVal = { ...int3Val, z: parseInt(e.target.value) || 0 };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z}`);
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'int4':
        const int4Val = (() => {
          try {
            if (defaultValue.includes(',')) {
              const parts = defaultValue.split(',').map(p => parseInt(p.trim()));
              return { x: parts[0] || 0, y: parts[1] || 0, z: parts[2] || 0, w: parts[3] || 0 };
            }
            return JSON.parse(defaultValue || '{"x":0,"y":0,"z":0,"w":0}');
          } catch {
            return { x: 0, y: 0, z: 0, w: 0 };
          }
        })();
        
        return (
          <div className="space-y-2">
            <Label className="text-sm">Int4 (X, Y, Z, W)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input
                  type="number"
                  step="1"
                  value={int4Val.x}
                  onChange={(e) => {
                    const newVal = { ...int4Val, x: parseInt(e.target.value) || 0 };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z},${newVal.w}`);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input
                  type="number"
                  step="1"
                  value={int4Val.y}
                  onChange={(e) => {
                    const newVal = { ...int4Val, y: parseInt(e.target.value) || 0 };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z},${newVal.w}`);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Z</Label>
                <Input
                  type="number"
                  step="1"
                  value={int4Val.z}
                  onChange={(e) => {
                    const newVal = { ...int4Val, z: parseInt(e.target.value) || 0 };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z},${newVal.w}`);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">W</Label>
                <Input
                  type="number"
                  step="1"
                  value={int4Val.w}
                  onChange={(e) => {
                    const newVal = { ...int4Val, w: parseInt(e.target.value) || 0 };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z},${newVal.w}`);
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'bool2':
        const bool2Val = (() => {
          try {
            if (defaultValue.includes(',')) {
              const parts = defaultValue.split(',').map(p => p.trim() === 'true');
              return { x: parts[0] || false, y: parts[1] || false };
            }
            return JSON.parse(defaultValue || '{"x":false,"y":false}');
          } catch {
            return { x: false, y: false };
          }
        })();
        
        return (
          <div className="space-y-2">
            <Label className="text-sm">Bool2 (X, Y)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Label className="text-xs">X</Label>
                <Switch
                  checked={bool2Val.x}
                  onCheckedChange={(checked) => {
                    const newVal = { ...bool2Val, x: checked };
                    setDefaultValue(`${newVal.x},${newVal.y}`);
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-xs">Y</Label>
                <Switch
                  checked={bool2Val.y}
                  onCheckedChange={(checked) => {
                    const newVal = { ...bool2Val, y: checked };
                    setDefaultValue(`${newVal.x},${newVal.y}`);
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'bool3':
        const bool3Val = (() => {
          try {
            if (defaultValue.includes(',')) {
              const parts = defaultValue.split(',').map(p => p.trim() === 'true');
              return { x: parts[0] || false, y: parts[1] || false, z: parts[2] || false };
            }
            return JSON.parse(defaultValue || '{"x":false,"y":false,"z":false}');
          } catch {
            return { x: false, y: false, z: false };
          }
        })();
        
        return (
          <div className="space-y-2">
            <Label className="text-sm">Bool3 (X, Y, Z)</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center space-x-2">
                <Label className="text-xs">X</Label>
                <Switch
                  checked={bool3Val.x}
                  onCheckedChange={(checked) => {
                    const newVal = { ...bool3Val, x: checked };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z}`);
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-xs">Y</Label>
                <Switch
                  checked={bool3Val.y}
                  onCheckedChange={(checked) => {
                    const newVal = { ...bool3Val, y: checked };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z}`);
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-xs">Z</Label>
                <Switch
                  checked={bool3Val.z}
                  onCheckedChange={(checked) => {
                    const newVal = { ...bool3Val, z: checked };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z}`);
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'bool4':
        const bool4Val = (() => {
          try {
            if (defaultValue.includes(',')) {
              const parts = defaultValue.split(',').map(p => p.trim() === 'true');
              return { x: parts[0] || false, y: parts[1] || false, z: parts[2] || false, w: parts[3] || false };
            }
            return JSON.parse(defaultValue || '{"x":false,"y":false,"z":false,"w":false}');
          } catch {
            return { x: false, y: false, z: false, w: false };
          }
        })();
        
        return (
          <div className="space-y-2">
            <Label className="text-sm">Bool4 (X, Y, Z, W)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Label className="text-xs">X</Label>
                <Switch
                  checked={bool4Val.x}
                  onCheckedChange={(checked) => {
                    const newVal = { ...bool4Val, x: checked };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z},${newVal.w}`);
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-xs">Y</Label>
                <Switch
                  checked={bool4Val.y}
                  onCheckedChange={(checked) => {
                    const newVal = { ...bool4Val, y: checked };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z},${newVal.w}`);
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-xs">Z</Label>
                <Switch
                  checked={bool4Val.z}
                  onCheckedChange={(checked) => {
                    const newVal = { ...bool4Val, z: checked };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z},${newVal.w}`);
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label className="text-xs">W</Label>
                <Switch
                  checked={bool4Val.w}
                  onCheckedChange={(checked) => {
                    const newVal = { ...bool4Val, w: checked };
                    setDefaultValue(`${newVal.x},${newVal.y},${newVal.z},${newVal.w}`);
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'int':
        return (
          <Input
            type="number"
            step="1"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder="e.g., 42"
          />
        );

      case 'float':
      case 'double':
        return (
          <Input
            type="number"
            step="0.001"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder="e.g., 3.14"
          />
        );

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder={selectedType === 'string' ? 'e.g., "Hello World"' : 'Enter default value'}
          />
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Create Variable</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Variable Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., MyApp.userScore"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1">
              Data Type
            </Label>
            <Select onValueChange={handleTypeChange} defaultValue="string">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_DATA_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="defaultValue" className="block text-sm font-medium text-slate-700 mb-1">
              Default Value
            </Label>
            {renderDefaultValueInput()}
          </div>

          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-1">Permissions</Label>
            <div className="space-y-2">
              <div className="flex items-center">
                <Checkbox
                  id="read"
                  checked={permissions.read}
                  onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, read: !!checked }))}
                />
                <Label htmlFor="read" className="ml-2 text-sm text-slate-700">Read</Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="write"
                  checked={permissions.write}
                  onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, write: !!checked }))}
                />
                <Label htmlFor="write" className="ml-2 text-sm text-slate-700">Write</Label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="list"
                  checked={permissions.list}
                  onCheckedChange={(checked) => setPermissions(prev => ({ ...prev, list: !!checked }))}
                />
                <Label htmlFor="list" className="ml-2 text-sm text-slate-700">List</Label>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-resonite-600 text-white hover:bg-resonite-700"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Variable"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
