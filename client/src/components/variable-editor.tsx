import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VariableDefinition {
  id: number;
  name: string;
  defaultValue: string | null;
  ownerId: string;
  ownerType: string;
  readPermission: string;
  writePermission: string;
  listPermission: string;
  isReadOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VariableEditorProps {
  variable: VariableDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  mode: "edit" | "view";
  userId?: string;
}

export function VariableEditor({ variable, isOpen, onClose, mode, userId }: VariableEditorProps) {
  const [value, setValue] = useState("");
  const [isLoadingValue, setIsLoadingValue] = useState(false);
  const [localVariable, setLocalVariable] = useState(variable);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    setLocalVariable(variable);
  }, [variable]);

  const updateMutation = useMutation({
    mutationFn: async (newValue: string) => {
      if (localVariable?.isReadOnly) {
        return await apiRequest("PATCH", `/api/v1/definitions/${localVariable.id}/value`, {
          value: newValue,
        });
      }

      return await apiRequest("POST", `/api/v1/variables/${localVariable?.name}`, {
        value: newValue,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/definitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/variable-values"] });
      toast({
        title: "Your Value Updated",
        description: `Your personal value for "${localVariable?.name}" has been saved`,
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

  const toggleReadOnlyMutation = useMutation({
    mutationFn: async (isReadOnly: boolean) => {
      if (localVariable) {
        setLocalVariable({ ...localVariable, isReadOnly });
      }

      const response = await fetch(`/api/v1/definitions/${localVariable?.id}/readonly`, {
        method: "PATCH",
        body: JSON.stringify({ isReadOnly }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to update read-only status");
      return response.json();
    },
    onSuccess: (_data, isReadOnly) => {
      queryClient.setQueryData(["/api/v1/definitions"], (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((item: any) =>
            item.id === localVariable?.id ? { ...item, isReadOnly } : item,
          ),
        };
      });

      queryClient.invalidateQueries({ queryKey: ["/api/v1/definitions"] });
      toast({
        title: "Read-Only Status Updated",
        description: `Variable is now ${isReadOnly ? "read-only" : "editable"}`,
      });
    },
    onError: (error, isReadOnly) => {
      if (localVariable) {
        setLocalVariable({ ...localVariable, isReadOnly: !isReadOnly });
      }
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update read-only status",
        variant: "destructive",
      });
    },
  });

  React.useEffect(() => {
    if (!variable || !isOpen) return;

    setIsLoadingValue(true);
    fetch(`/api/v1/variables/${variable.name}?format=json`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.data) {
          setValue(data.data.value ?? "");
        } else {
          setValue(variable.defaultValue ?? "");
        }
      })
      .catch(() => {
        setValue(variable.defaultValue ?? "");
      })
      .finally(() => {
        setIsLoadingValue(false);
      });
  }, [variable, isOpen]);

  if (!localVariable) return null;

  const updateAnyoneAccess = (allowAnyone: boolean) => {
    const newPermissions = allowAnyone
      ? { readPermission: "anyone", writePermission: "anyone" }
      : { readPermission: "variable_owner", writePermission: "variable_owner" };

    setLocalVariable((current) => current ? { ...current, ...newPermissions } : current);

    fetch(`/api/v1/definitions/${localVariable.name}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(newPermissions),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to update permissions");
        queryClient.invalidateQueries({ queryKey: ["/api/v1/definitions"] });
        toast({
          title: "Permissions Updated",
          description: `Variable ${allowAnyone ? "now allows" : "no longer allows"} anonymous access`,
        });
      })
      .catch(() => {
        const revertedPermissions = allowAnyone
          ? { readPermission: "variable_owner", writePermission: "variable_owner" }
          : { readPermission: "anyone", writePermission: "anyone" };
        setLocalVariable((current) => current ? { ...current, ...revertedPermissions } : current);
        toast({
          title: "Update Failed",
          description: "Failed to update permissions",
          variant: "destructive",
        });
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Set Your Value" : "Your Value"} for {localVariable.name}
            {localVariable.isReadOnly && (
              <span className="ml-2 text-sm font-normal text-blue-600">(Read-Only)</span>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? localVariable.isReadOnly
                ? `Set the value for this read-only variable "${localVariable.name}". Only you can modify this through the web dashboard.`
                : `Set your personal text value for "${localVariable.name}". This won't affect other users' values.`
              : `View your current personal text value for "${localVariable.name}".`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Variable Information</Label>
            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <div>Owner: {localVariable.ownerType}</div>
              <div>Permissions: R:{localVariable.readPermission} W:{localVariable.writePermission}</div>
              {localVariable.isReadOnly && (
                <div className="font-medium text-blue-600">Status: Read-Only (API modifications blocked)</div>
              )}
              <div>
                Default:{" "}
                <span className="rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-800">
                  {localVariable.defaultValue ?? "null"}
                </span>
              </div>
            </div>
          </div>

          {localVariable.ownerId === userId && mode === "edit" && (
            <div className="space-y-4">
              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Anyone Access</Label>
                  <div className="text-sm text-muted-foreground">
                    Allow anonymous users to read and write this variable without authentication
                  </div>
                </div>
                <Switch
                  checked={localVariable.readPermission === "anyone" && localVariable.writePermission === "anyone"}
                  onCheckedChange={updateAnyoneAccess}
                />
              </div>

              <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Read-Only Variable</Label>
                  <div className="text-sm text-muted-foreground">
                    When enabled, only you can modify this variable via the web dashboard. API modifications will be blocked.
                  </div>
                </div>
                <Switch
                  checked={localVariable.isReadOnly}
                  onCheckedChange={(isReadOnly) => toggleReadOnlyMutation.mutate(isReadOnly)}
                  disabled={toggleReadOnlyMutation.isPending}
                />
              </div>
            </div>
          )}

          {isLoadingValue ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-slate-600 dark:text-slate-400">Loading your value...</div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="variable-value">Your Value</Label>
              <Input
                id="variable-value"
                type="text"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Enter a text value"
                disabled={mode === "view"}
              />
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            {mode === "edit" && (
              <Button
                onClick={() => updateMutation.mutate(value)}
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? "Updating..." : "Update"}
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              {mode === "edit" ? "Cancel" : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}