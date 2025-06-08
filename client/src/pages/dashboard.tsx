import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Eye, FileText, BarChart3, Cloud } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useWebSocket } from "@/hooks/useWebSocket";
import { StatsCards } from "@/components/stats-cards";
import { VariableTable } from "@/components/variable-table";
import { CreateVariableForm } from "@/components/create-variable-form";
import { ApiExplorer } from "@/components/api-explorer";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket(user?.id);

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

  const variables = variablesData?.data || [];
  const stats = statsData?.data || {
    totalVariables: 0,
    totalValues: 0,
    apiRequestsToday: 0,
    activeUsers: 1,
  };
  const apiKeys = apiKeysData?.data || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-resonite-500 to-resonite-600 rounded-lg flex items-center justify-center">
                  <Cloud className="text-white h-5 w-5" />
                </div>
                <span className="text-xl font-bold text-slate-800">Web Variables</span>
              </div>
              <div className="hidden md:flex space-x-6">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`pb-4 ${
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
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-slate-600">
                  {isConnected ? 'API Online' : 'API Offline'}
                </span>
              </div>
              <Button className="bg-resonite-600 text-white hover:bg-resonite-700">
                <Plus className="h-4 w-4 mr-2" />
                New Variable
              </Button>
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <span className="text-slate-600 text-sm font-medium">
                  {user?.firstName?.[0] || user?.email?.[0] || "U"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Dashboard Overview */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600 mt-1">Manage your Web Variables and API integrations</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200">
                  <span className="text-sm text-slate-600">API Base URL:</span>
                  <code className="text-sm font-mono text-resonite-600 ml-2">
                    {window.location.origin}/api/v1
                  </code>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Variables Management */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <VariableTable
                  variables={variables}
                  onEdit={(variable) => console.log("Edit", variable)}
                  onView={(variable) => console.log("View", variable)}
                  onDelete={(variable) => console.log("Delete", variable)}
                />
              </div>

              <div className="space-y-6">
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
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">API Key</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="password"
                          value={apiKeys[0]?.name || "No API key"}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono bg-slate-50"
                          readOnly
                        />
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      Generate New Key
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
              onEdit={(variable) => console.log("Edit", variable)}
              onView={(variable) => console.log("View", variable)}
              onDelete={(variable) => console.log("Delete", variable)}
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
      </div>
    </div>
  );
}
