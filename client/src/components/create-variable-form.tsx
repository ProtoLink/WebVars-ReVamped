import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SUPPORTED_DATA_TYPES, PERMISSION_TYPES, RESONITE_ENUMS } from "@shared/schema";
import { RESONITE_ENUM_VALUES, getEnumCategories, getEnumValues } from "@shared/resonite-enums";

// Helper function to render smart input components based on data type
const renderSmartInput = (type: string, value: string, onChange: (value: string) => void, placeholder?: string, enumType?: string) => {
  // Handle enum type with specific enum values
  if (type === 'enum' && enumType) {
    const enumValues = getEnumValues(enumType as any);
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || `Select ${enumType} value`} />
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
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder || "Select boolean value"} />
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
          />
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "#RRGGBB or rgba(r,g,b,a)"}
            className="flex-1"
          />
        </div>
      );

    case 'datetime':
      return (
        <Input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      );

    case 'uri':
      return (
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "https://example.com"}
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
          placeholder={placeholder || "0.0"}
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
          placeholder={placeholder || "0"}
        />
      );

    case 'float2':
    case 'double2':
    case 'int2':
    case 'uint2':
    case 'long2':
    case 'ulong2':
    case 'bool2':
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type={type.includes('bool') ? 'text' : 'number'}
            step={type.includes('float') || type.includes('double') ? 'any' : '1'}
            placeholder="X"
            onChange={(e) => {
              const parts = value.split(',');
              parts[0] = e.target.value;
              onChange(parts.join(','));
            }}
          />
          <Input
            type={type.includes('bool') ? 'text' : 'number'}
            step={type.includes('float') || type.includes('double') ? 'any' : '1'}
            placeholder="Y"
            onChange={(e) => {
              const parts = value.split(',');
              parts[1] = e.target.value;
              onChange(parts.join(','));
            }}
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
      return (
        <div className="grid grid-cols-3 gap-2">
          <Input
            type={type.includes('bool') ? 'text' : 'number'}
            step={type.includes('float') || type.includes('double') ? 'any' : '1'}
            placeholder="X"
            onChange={(e) => {
              const parts = value.split(',');
              parts[0] = e.target.value;
              onChange(parts.join(','));
            }}
          />
          <Input
            type={type.includes('bool') ? 'text' : 'number'}
            step={type.includes('float') || type.includes('double') ? 'any' : '1'}
            placeholder="Y"
            onChange={(e) => {
              const parts = value.split(',');
              parts[1] = e.target.value;
              onChange(parts.join(','));
            }}
          />
          <Input
            type={type.includes('bool') ? 'text' : 'number'}
            step={type.includes('float') || type.includes('double') ? 'any' : '1'}
            placeholder="Z"
            onChange={(e) => {
              const parts = value.split(',');
              parts[2] = e.target.value;
              onChange(parts.join(','));
            }}
          />
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
      const labels = type.includes('Q') ? ['X', 'Y', 'Z', 'W'] : ['X', 'Y', 'Z', 'W'];
      return (
        <div className="grid grid-cols-2 gap-2">
          {labels.map((label, index) => (
            <Input
              key={label}
              type={type.includes('bool') ? 'text' : 'number'}
              step={type.includes('float') || type.includes('double') ? 'any' : '1'}
              placeholder={label}
              onChange={(e) => {
                const parts = value.split(',');
                parts[index] = e.target.value;
                onChange(parts.join(','));
              }}
            />
          ))}
        </div>
      );

    case 'float2x2':
    case 'double2x2':
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Row 1</Label>
            <div className="grid grid-cols-2 gap-1">
              <Input type="number" step="any" placeholder="M11" />
              <Input type="number" step="any" placeholder="M12" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Row 2</Label>
            <div className="grid grid-cols-2 gap-1">
              <Input type="number" step="any" placeholder="M21" />
              <Input type="number" step="any" placeholder="M22" />
            </div>
          </div>
        </div>
      );

    case 'float3x3':
    case 'double3x3':
      return (
        <div className="space-y-2">
          {[1, 2, 3].map(row => (
            <div key={row} className="grid grid-cols-3 gap-1">
              {[1, 2, 3].map(col => (
                <Input
                  key={`${row}${col}`}
                  type="number"
                  step="any"
                  placeholder={`M${row}${col}`}
                  className="text-xs"
                />
              ))}
            </div>
          ))}
        </div>
      );

    case 'float4x4':
    case 'double4x4':
      return (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(row => (
            <div key={row} className="grid grid-cols-4 gap-1">
              {[1, 2, 3, 4].map(col => (
                <Input
                  key={`${row}${col}`}
                  type="number"
                  step="any"
                  placeholder={`M${row}${col}`}
                  className="text-xs"
                />
              ))}
            </div>
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
          placeholder={placeholder || "Single character"}
        />
      );

    case 'timespan':
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "00:00:00 or Days.Hours:Minutes:Seconds"}
        />
      );

    case 'refID':
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Reference ID"}
        />
      );

    default:
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Enter value..."}
        />
      );
  }
};

const formSchema = z.object({
  name: z.string().min(1, "Variable name is required").regex(/^[a-zA-Z0-9._-]+$/, "Invalid variable name format"),
  defaultValue: z.string().optional(),
  scope: z.enum(["private", "global"]),
  type: z.string().min(1, "Variable type is required"),
  enumType: z.string().optional(), // For enum types
});

type FormData = z.infer<typeof formSchema>;

interface CreateVariableFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function CreateVariableForm({ onSubmit, isLoading }: CreateVariableFormProps) {
  const [selectedType, setSelectedType] = useState<string>("string");
  const [selectedEnumType, setSelectedEnumType] = useState<string>("");
  const [selectedEnumValue, setSelectedEnumValue] = useState<string>("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      defaultValue: "",
      scope: "private",
      type: "string",
      enumType: "",
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    try {
      // Set permissions based on scope to match demo data patterns
      const isGlobal = data.scope === "global";
      const formData = {
        ...data,
        ownerType: "user",
        readPermission: isGlobal ? "anyone" : "variable_owner",
        writePermission: isGlobal ? "variable_owner" : "variable_owner",
        listPermission: isGlobal ? "anyone" : "definition_owner",
      };
      await onSubmit(formData);
      form.reset();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variable Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., MyApp.userScore" 
                  {...field} 
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variable Type</FormLabel>
              <Select 
                value={field.value} 
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedType(value);
                  if (value !== 'enum') {
                    setSelectedEnumType('');
                    form.setValue('enumType', '');
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select variable type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-80">
                  <div className="p-2 text-xs font-semibold text-muted-foreground">Basic Types</div>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="bool">Bool</SelectItem>
                  <SelectItem value="char">Char</SelectItem>
                  
                  <div className="p-2 text-xs font-semibold text-muted-foreground">Integer Types</div>
                  <SelectItem value="byte">Byte</SelectItem>
                  <SelectItem value="sbyte">SByte</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="ushort">UShort</SelectItem>
                  <SelectItem value="int">Int</SelectItem>
                  <SelectItem value="uint">UInt</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="ulong">ULong</SelectItem>
                  
                  <div className="p-2 text-xs font-semibold text-muted-foreground">Float Types</div>
                  <SelectItem value="half">Half</SelectItem>
                  <SelectItem value="float">Float</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                  <SelectItem value="decimal">Decimal</SelectItem>
                  
                  <div className="p-2 text-xs font-semibold text-muted-foreground">Vector Types</div>
                  <SelectItem value="bool2">Bool2</SelectItem>
                  <SelectItem value="bool3">Bool3</SelectItem>
                  <SelectItem value="bool4">Bool4</SelectItem>
                  <SelectItem value="int2">Int2</SelectItem>
                  <SelectItem value="int3">Int3</SelectItem>
                  <SelectItem value="int4">Int4</SelectItem>
                  <SelectItem value="uint2">UInt2</SelectItem>
                  <SelectItem value="uint3">UInt3</SelectItem>
                  <SelectItem value="uint4">UInt4</SelectItem>
                  <SelectItem value="long2">Long2</SelectItem>
                  <SelectItem value="long3">Long3</SelectItem>
                  <SelectItem value="long4">Long4</SelectItem>
                  <SelectItem value="ulong2">ULong2</SelectItem>
                  <SelectItem value="ulong3">ULong3</SelectItem>
                  <SelectItem value="ulong4">ULong4</SelectItem>
                  <SelectItem value="float2">Float2</SelectItem>
                  <SelectItem value="float3">Float3</SelectItem>
                  <SelectItem value="float4">Float4</SelectItem>
                  <SelectItem value="double2">Double2</SelectItem>
                  <SelectItem value="double3">Double3</SelectItem>
                  <SelectItem value="double4">Double4</SelectItem>
                  
                  <div className="p-2 text-xs font-semibold text-muted-foreground">Matrix Types</div>
                  <SelectItem value="float2x2">Float2x2</SelectItem>
                  <SelectItem value="float3x3">Float3x3</SelectItem>
                  <SelectItem value="float4x4">Float4x4</SelectItem>
                  <SelectItem value="double2x2">Double2x2</SelectItem>
                  <SelectItem value="double3x3">Double3x3</SelectItem>
                  <SelectItem value="double4x4">Double4x4</SelectItem>
                  
                  <div className="p-2 text-xs font-semibold text-muted-foreground">Quaternion Types</div>
                  <SelectItem value="floatQ">FloatQ</SelectItem>
                  <SelectItem value="doubleQ">DoubleQ</SelectItem>
                  
                  <div className="p-2 text-xs font-semibold text-muted-foreground">Color Types</div>
                  <SelectItem value="color">Color</SelectItem>
                  <SelectItem value="colorX">ColorX</SelectItem>
                  
                  <div className="p-2 text-xs font-semibold text-muted-foreground">Time Types</div>
                  <SelectItem value="datetime">DateTime</SelectItem>
                  <SelectItem value="timespan">TimeSpan</SelectItem>
                  
                  <div className="p-2 text-xs font-semibold text-muted-foreground">Other Types</div>
                  <SelectItem value="uri">Uri</SelectItem>
                  <SelectItem value="refID">RefID</SelectItem>
                  
                  <div className="p-2 text-xs font-semibold text-muted-foreground">Enums</div>
                  <SelectItem value="enum">Enum</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedType === 'enum' && (
          <>
            <FormField
              control={form.control}
              name="enumType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enum Category</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedEnumType(value);
                      setSelectedEnumValue('');
                      form.setValue('defaultValue', '');
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select enum category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-80">
                      {getEnumCategories().map((enumType) => (
                        <SelectItem key={enumType} value={enumType}>
                          {enumType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedEnumType && (
              <div className="space-y-2">
                <Label>Available Enum Values</Label>
                <Select 
                  value={selectedEnumValue} 
                  onValueChange={(value) => {
                    setSelectedEnumValue(value);
                    form.setValue('defaultValue', value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specific enum value (optional)" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {getEnumValues(selectedEnumType as any).map((enumValue) => (
                      <SelectItem key={enumValue} value={enumValue}>
                        {enumValue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {getEnumValues(selectedEnumType as any).length} values available in {selectedEnumType}
                </p>
              </div>
            )}
          </>
        )}

        <FormField
          control={form.control}
          name="scope"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Variable Scope</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private" className="text-sm font-normal">
                      Private - Only you can access this variable
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="global" id="global" />
                    <Label htmlFor="global" className="text-sm font-normal">
                      Global - Anyone can read and write this variable
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Value (Optional)</FormLabel>
              <FormControl>
                <div className="w-full">
                  {renderSmartInput(
                    selectedType,
                    field.value || '',
                    field.onChange,
                    selectedType === 'enum' && selectedEnumType 
                      ? `Select ${selectedEnumType} enum value` 
                      : `Enter ${selectedType} value`,
                    selectedEnumType || undefined
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Creating..." : "Create Variable"}
        </Button>
      </form>
    </Form>
  );
}