import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ApiExplorerProps {
  onSendRequest: (request: {
    method: string;
    endpoint: string;
    headers: Record<string, string>;
    body?: string;
  }) => Promise<{
    status: number;
    statusText: string;
    data: any;
    responseTime: number;
  }>;
}

export function ApiExplorer({ onSendRequest }: ApiExplorerProps) {
  const [method, setMethod] = useState("GET");
  const [endpoint, setEndpoint] = useState("/api/v1/variables/{name}");
  const [requestBody, setRequestBody] = useState('{\n  "value": "Hello World"\n}');
  const [contentType, setContentType] = useState("application/json");
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendRequest = async () => {
    setIsLoading(true);
    try {
      const result = await onSendRequest({
        method,
        endpoint,
        headers: { "Content-Type": contentType },
        body: method !== "GET" ? requestBody : undefined,
      });

      setResponse(result);
    } catch (error) {
      setResponse({
        status: 0,
        statusText: "Network Error",
        data: { error: error instanceof Error ? error.message : "Unknown error" },
        responseTime: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "POST":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "PUT":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case "DELETE":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-400";
    if (status >= 400 && status < 500) return "text-amber-400";
    if (status >= 500) return "text-red-400";
    return "text-slate-400";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">API Explorer</CardTitle>
        <p className="text-slate-600 dark:text-slate-400 text-xs lg:text-sm mt-1">Test API endpoints directly from the dashboard</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Request Builder */}
          <div>
            <h3 className="text-base lg:text-lg font-semibold text-slate-900 dark:text-white mb-3 lg:mb-4">Request Builder</h3>
            <div className="space-y-3 lg:space-y-4">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-full sm:w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="/api/v1/variables/{name}"
                  className="flex-1"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Example Endpoints</Label>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Test endpoints for accessing and managing variables. Use real variable names or create new ones.
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-3 text-xs">
                  <p className="font-medium mb-1">Available operations:</p>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    <li>• GET /api/v1/variables/{`{name}`} - Get variable value</li>
                    <li>• POST /api/v1/variables/{`{name}`} - Set variable value</li>
                    <li>• PUT /api/v1/variables/{`{name}`} - Update variable</li>
                    <li>• DELETE /api/v1/variables/{`{name}`} - Delete variable</li>
                    <li>• GET /api/v1/definitions - List all definitions</li>
                  </ul>
                  <p className="font-medium mt-2 mb-1">Authentication options:</p>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    <li>• Bearer token: Authorization header</li>
                    <li>• User ID: ?userId=Tacusin parameter</li>
                  </ul>
                </div>
              </div>

              {method !== "GET" && (
                <>
                  <div>
                    <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Content Type</Label>
                    <Select value={contentType} onValueChange={(value) => {
                      setContentType(value);
                      if (value === "application/json") {
                        setRequestBody('{\n  "value": "Hello World"\n}');
                      } else {
                        setRequestBody('Hello World');
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="application/json">JSON (application/json)</SelectItem>
                        <SelectItem value="text/plain">Plain Text (text/plain)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Request Body
                      <span className="text-xs text-slate-500 ml-2">
                        {contentType === "application/json" ? "JSON format" : "Raw text for Resonite"}
                      </span>
                    </Label>
                    <Textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder={contentType === "application/json" ? '{\n  "value": "Hello World"\n}' : 'Hello World'}
                      className="min-h-24 font-mono text-sm"
                    />
                    {contentType === "text/plain" && (
                      <p className="text-xs text-slate-500 mt-1">
                        For enums: Use numerical index (0, 1, 2...) which will be converted to enum names automatically
                      </p>
                    )}
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                      <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Quick Examples:</p>
                      <div className="space-y-1 text-blue-700 dark:text-blue-300">
                        {method === "POST" && contentType === "application/json" && (
                          <p>{"{"}"value": "Hello World"{"}"}</p>
                        )}
                        {method === "POST" && contentType === "text/plain" && (
                          <p>Hello World</p>
                        )}
                        {method === "PUT" && contentType === "application/json" && (
                          <p>{"{"}"value": "Updated Value", "defaultValue": "Default"{"}"}</p>
                        )}
                        {method === "PUT" && contentType === "text/plain" && (
                          <p>Updated Value</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Button
                onClick={handleSendRequest}
                disabled={isLoading}
                className={`w-full ${getMethodColor(method)} font-medium`}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Sending...
                  </>
                ) : (
                  `Send ${method} Request`
                )}
              </Button>
            </div>
          </div>

          {/* Response Viewer */}
          <div>
            <h3 className="text-base lg:text-lg font-semibold text-slate-900 dark:text-white mb-3 lg:mb-4">Response</h3>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 text-sm font-mono text-green-400 min-h-96">
              {response ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400">
                      Status: <span className={getStatusColor(response.status)}>
                        {response.status} {response.statusText}
                      </span>
                    </span>
                    <span className="text-slate-400">Time: {response.responseTime}ms</span>
                  </div>
                  <pre className="text-green-400 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  Send a request to see the response here
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}