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

      case 'float3':
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
