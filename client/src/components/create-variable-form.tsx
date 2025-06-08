import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
      await onSubmit(data);
      reset();
      setPermissions({ read: true, write: true, list: false });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const getPlaceholderForType = (type: string) => {
    switch (type) {
      case 'string':
        return 'e.g., "Hello World"';
      case 'int':
        return 'e.g., 42';
      case 'float':
      case 'double':
        return 'e.g., 3.14';
      case 'bool':
        return 'true or false';
      case 'color':
        return 'e.g., [1;0;0;1;sRGB]';
      case 'datetime':
        return 'e.g., 2024-01-01T00:00:00Z';
      default:
        return 'Enter default value';
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
            <Select onValueChange={(value) => setValue("type", value as any)} defaultValue="string">
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
            <Input
              id="defaultValue"
              placeholder={getPlaceholderForType(selectedType)}
              {...register("defaultValue")}
            />
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
