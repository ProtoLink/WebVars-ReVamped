import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Eye, FileText, BarChart3, Cloud, Database, User, Key, Shield, Bell, Palette, Copy, Trash2, RefreshCw } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useWebSocket } from "@/hooks/useWebSocket";
import { StatsCards } from "@/components/stats-cards";
import { VariableTable } from "@/components/variable-table";
import { CreateVariableForm } from "@/components/create-variable-form";
import { ApiExplorer } from "@/components/api-explorer";
import { VariableEditor } from "@/components/variable-editor";

// Navigation items
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, active: true },
  { id: "variables", label: "Variables", icon: Cloud },
  { id: "api-explorer", label: "API Explorer", icon: Settings },
  { id: "documentation", label: "Documentation", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedVariable, setSelectedVariable] = useState<any>(null);
  const [editorMode, setEditorMode] = useState<'edit' | 'view'>('view');
  const [showEditor, setShowEditor] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [variableToDelete, setVariableToDelete] = useState<any>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket((user as any)?.id);

  // Fetch API key for current user
  const { data: apiKeysData } = useQuery({
    queryKey: ["/api/v1/api-keys"],
    enabled: !!user,
  });

  // Fetch variable definitions
  const { data: variablesData, isLoading: variablesLoading } = useQuery({
    queryKey: ["/api/v1/definitions"],
    enabled: !!user,
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ["/api/v1/stats"],
    enabled: !!user,
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.event) {
        case "definition_created":
        case "definition_updated":
        case "definition_deleted":
          queryClient.invalidateQueries({ queryKey: ["/api/v1/definitions"] });
          break;
        case "variable_updated":
          toast({
            title: "Variable Updated",
            description: `Variable ${lastMessage.data.name} was updated`,
          });
          break;
      }
    }
  }, [lastMessage, queryClient, toast]);

  // Create variable mutation
  const createVariableMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/v1/definitions/${data.name}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/definitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/stats"] });
      toast({
        title: "Variable Created",
        description: "Variable definition created successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create variable",
        variant: "destructive",
      });
    },
  });

  // Demo data creation mutation
  const createDemoDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/demo/create", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/definitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/stats"] });
      toast({
        title: "Demo Data Created",
        description: "Sample Resonite variables have been added to your account",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create demo data",
        variant: "destructive",
      });
    },
  });

  // API key creation mutation
  const createApiKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/v1/api-keys", { name });
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/api-keys"] });
      setShowApiKeyDialog(false);
      setNewApiKeyName("");
      
      // Store the newly created key to show to user
      if (response.data && response.data.key) {
        setNewlyCreatedKey(response.data.key);
        setShowNewKeyDialog(true);
      }
      
      toast({
        title: "API Key Created",
        description: `New API key "${newApiKeyName}" has been generated successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      });
    },
  });

  // Variable deletion mutation
  const deleteVariableMutation = useMutation({
    mutationFn: async (variableId: number) => {
      return await apiRequest("DELETE", `/api/v1/definitions/${variableId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/definitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/stats"] });
      setShowDeleteDialog(false);
      setVariableToDelete(null);
      toast({
        title: "Variable Deleted",
        description: "Variable has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete variable",
        variant: "destructive",
      });
    },
  });

  // API key deletion mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      return await apiRequest("DELETE", `/api/v1/api-keys/${keyId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/api-keys"] });
      toast({
        title: "API Key Deleted",
        description: "API key has been revoked successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete API key",
        variant: "destructive",
      });
    },
  });

  // Handle API Explorer requests
  const handleApiRequest = async (request: any) => {
    const startTime = Date.now();
    try {
      const response = await fetch(request.endpoint, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        credentials: "include",
      });
      
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      return {
        status: response.status,
        statusText: response.statusText,
        data,
        responseTime,
      };
    } catch (error) {
      return {
        status: 0,
        statusText: "Error",
        data: { error: error instanceof Error ? error.message : "Unknown error" },
        responseTime: Date.now() - startTime,
      };
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const variables = (variablesData as any)?.data || [];
  const stats = (statsData as any)?.data || {
    totalVariables: 0,
    totalValues: 0,
    apiRequestsToday: 0,
    activeUsers: 1,
  };
  const apiKeys = (apiKeysData as any)?.data || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-resonite-500 to-resonite-600 rounded-lg flex items-center justify-center">
                  <Cloud className="text-white h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-slate-800">Web Variables</span>
              </div>
              <div className="hidden lg:flex space-x-6">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`pb-4 text-sm ${
                      activeTab === item.id
                        ? "text-resonite-600 font-medium border-b-2 border-resonite-500 -mb-px"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-xs sm:text-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-slate-600">
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
              <Button 
                size="sm"
                className="bg-resonite-600 text-white hover:bg-resonite-700 text-xs sm:text-sm px-2 sm:px-3"
                onClick={() => setActiveTab("variables")}
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">New Variable</span>
                <span className="sm:hidden">New</span>
              </Button>
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <span className="text-slate-600 text-xs sm:text-sm font-medium">
                  {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || "U"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex space-x-1 overflow-x-auto py-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm ${
                  activeTab === item.id
                    ? "bg-resonite-100 text-resonite-700 font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {activeTab === "dashboard" && (
          <div className="space-y-6 sm:space-y-8">
            {/* Dashboard Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600 mt-1 text-sm sm:text-base">Manage your Web Variables and API integrations</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 overflow-hidden">
                  <span className="text-xs sm:text-sm text-slate-600">API Base URL:</span>
                  <code className="text-xs sm:text-sm font-mono text-resonite-600 ml-2 block sm:inline">
                    {window.location.origin}/api/v1
                  </code>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Variables Management */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              <div className="xl:col-span-2">
                <VariableTable
                  variables={variables}
                  onEdit={(variable) => {
                    setSelectedVariable(variable);
                    setEditorMode('edit');
                    setShowEditor(true);
                  }}
                  onView={(variable) => {
                    setSelectedVariable(variable);
                    setEditorMode('view');
                    setShowEditor(true);
                  }}
                  onDelete={(variable) => {
                    setVariableToDelete(variable);
                    setShowDeleteDialog(true);
                  }}
                />
              </div>

              <div className="space-y-6">
                {variables.length === 0 && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Start</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">
                        Get started quickly with sample Resonite variables including player scores, game settings, and avatar preferences.
                      </p>
                      <Button 
                        onClick={() => createDemoDataMutation.mutate()}
                        disabled={createDemoDataMutation.isPending}
                        className="w-full"
                        variant="outline"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        {createDemoDataMutation.isPending ? "Creating..." : "Add Demo Variables"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <CreateVariableForm
                  onSubmit={async (data) => {
                    await createVariableMutation.mutateAsync(data);
                  }}
                  isLoading={createVariableMutation.isPending}
                />

                {/* API Integration Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-900">API Integration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {apiKeys.length > 0 ? (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Latest API Key</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="password"
                            value={`${apiKeys[0]?.name} (${apiKeys[0]?.keyHash?.substring(0, 8)}...)`}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono bg-slate-50"
                            readOnly
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(apiKeys[0]?.keyHash || '');
                              toast({
                                title: "Copied",
                                description: "API key copied to clipboard",
                              });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Created: {new Date(apiKeys[0]?.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Key className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 mb-3">No API keys found</p>
                        <p className="text-xs text-slate-500">Create an API key to access the REST API</p>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab("settings")}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Manage API Keys
                    </Button>
                  </CardContent>
                </Card>

                {/* Resonite Integration Card */}
                <Card className="bg-gradient-to-r from-resonite-50 to-blue-50 border-resonite-200">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-resonite-500 rounded-lg flex items-center justify-center mr-3">
                        <Cloud className="text-white h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Resonite Integration</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      Connect your Web Variables to Resonite using ProtoFlux nodes.
                    </p>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 border border-resonite-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900">GET Web Variable</span>
                          <Badge variant="secondary" className="text-xs">Node</Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">Read variable values from external sources</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-resonite-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900">SET Web Variable</span>
                          <Badge variant="secondary" className="text-xs">Node</Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">Update variable values from within Resonite</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === "api-explorer" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">API Explorer</h1>
              <p className="text-slate-600 mt-1">Test API endpoints directly from the dashboard</p>
            </div>
            <ApiExplorer onSendRequest={handleApiRequest} />
          </div>
        )}

        {activeTab === "variables" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Variables</h1>
              <p className="text-slate-600 mt-1">Manage all your variable definitions and values</p>
            </div>
            <VariableTable
              variables={variables}
              onEdit={(variable) => {
                setSelectedVariable(variable);
                setEditorMode('edit');
                setShowEditor(true);
              }}
              onView={(variable) => {
                setSelectedVariable(variable);
                setEditorMode('view');
                setShowEditor(true);
              }}
              onDelete={(variable) => {
                setVariableToDelete(variable);
                setShowDeleteDialog(true);
              }}
            />
          </div>
        )}

        {activeTab === "documentation" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Documentation</h1>
              <p className="text-slate-600 mt-1">Complete reference for Web Variables API</p>
            </div>
            <Card>
              <CardContent className="p-8">
                <div className="prose max-w-none">
                  <h2>Getting Started</h2>
                  <p>Web Variables provide a RESTful API for managing persistent variables that can be accessed both from external applications and within Resonite.</p>
                  
                  <h3>Authentication</h3>
                  <p>All API requests require authentication using an API key in the Authorization header:</p>
                  <pre className="bg-slate-900 text-green-400 p-4 rounded-lg">
                    {`Authorization: Bearer your-api-key`}
                  </pre>

                  <h3>Base URL</h3>
                  <p>All API endpoints are relative to:</p>
                  <pre className="bg-slate-900 text-green-400 p-4 rounded-lg">
                    {`${window.location.origin}/api/v1`}
                  </pre>

                  <h3>Supported Data Types</h3>
                  <p>Web Variables support all Resonite-compatible data types including:</p>
                  <ul>
                    <li><code>string</code> - Text values</li>
                    <li><code>int</code>, <code>float</code>, <code>double</code> - Numeric values</li>
                    <li><code>bool</code> - Boolean values</li>
                    <li><code>color</code> - Color values</li>
                    <li><code>datetime</code> - Date and time values</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
              <p className="text-slate-600 mt-1">Manage your account settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Settings */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profile Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={(user as any)?.firstName || ""}
                        placeholder="Enter your first name"
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={(user as any)?.lastName || ""}
                        placeholder="Enter your last name"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={(user as any)?.email || ""}
                      placeholder="Enter your email"
                      readOnly
                    />
                  </div>
                  <div className="text-sm text-slate-600">
                    Profile information is managed through Replit authentication.
                  </div>
                </CardContent>
              </Card>

              {/* API Key Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="h-5 w-5" />
                    <span>API Keys</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {apiKeys.length === 0 ? (
                      <div className="text-center py-4">
                        <Key className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600">No API keys found</p>
                      </div>
                    ) : (
                      apiKeys.map((key: any) => (
                        <div key={key.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{key.name}</div>
                            <div className="text-xs text-slate-500">
                              Created: {new Date(key.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(key.keyHash);
                                toast({
                                  title: "Copied",
                                  description: "API key copied to clipboard",
                                });
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteApiKeyMutation.mutate(key.id)}
                              disabled={deleteApiKeyMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Generate New Key
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New API Key</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="keyName">API Key Name</Label>
                          <Input
                            id="keyName"
                            placeholder="Enter a descriptive name for your API key"
                            value={newApiKeyName}
                            onChange={(e) => setNewApiKeyName(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowApiKeyDialog(false);
                              setNewApiKeyName("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              if (newApiKeyName.trim()) {
                                createApiKeyMutation.mutate(newApiKeyName.trim());
                              }
                            }}
                            disabled={createApiKeyMutation.isPending || !newApiKeyName.trim()}
                          >
                            {createApiKeyMutation.isPending ? "Creating..." : "Create Key"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                      <p className="text-xs text-slate-600">Add an extra layer of security</p>
                    </div>
                    <Switch disabled />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Session Management</Label>
                    <Button variant="outline" size="sm" className="w-full">
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Logout All Devices
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Variable Updates</Label>
                        <p className="text-xs text-slate-600">Get notified when variables change</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">API Usage Alerts</Label>
                        <p className="text-xs text-slate-600">Alerts for high API usage</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Security Alerts</Label>
                        <p className="text-xs text-slate-600">Important security notifications</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Appearance Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5" />
                    <span>Appearance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Theme</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="h-16">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-white border border-slate-300 rounded mx-auto mb-1"></div>
                          <span className="text-xs">Light</span>
                        </div>
                      </Button>
                      <Button variant="outline" size="sm" className="h-16">
                        <div className="text-center">
                          <div className="w-6 h-6 bg-slate-800 rounded mx-auto mb-1"></div>
                          <span className="text-xs">Dark</span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Variable Editor Modal */}
        <VariableEditor
          variable={selectedVariable}
          isOpen={showEditor}
          onClose={() => setShowEditor(false)}
          mode={editorMode}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Variable</DialogTitle>
              <DialogDescription>
                Confirm deletion of this variable from your account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to delete the variable "{variableToDelete?.name}"? This action cannot be undone.
              </p>
              <div className="flex space-x-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (variableToDelete) {
                      deleteVariableMutation.mutate(variableToDelete.id);
                    }
                  }}
                  disabled={deleteVariableMutation.isPending}
                >
                  {deleteVariableMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* New API Key Display Modal */}
        <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Key Created Successfully</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  ⚠️ Important: Copy this key now - it won't be shown again
                </p>
                <p className="text-xs text-yellow-700">
                  Store this key securely. You'll need it to authenticate API requests.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Your New API Key</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={newlyCreatedKey || ""}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newlyCreatedKey) {
                        navigator.clipboard.writeText(newlyCreatedKey);
                        toast({
                          title: "Copied",
                          description: "API key copied to clipboard",
                        });
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setShowNewKeyDialog(false);
                    setNewlyCreatedKey(null);
                  }}
                >
                  I've Saved My Key
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
