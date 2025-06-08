import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cloud, ArrowRight, Database, Zap, Shield, Globe } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-resonite-500 to-resonite-600 rounded-lg flex items-center justify-center">
                <Cloud className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-slate-800">Web Variables</span>
            </div>
            <Button onClick={() => window.location.href = '/api/login'}>
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Resonite Cloud Variables,
            <span className="text-resonite-600"> Now on the Web</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Extend your Resonite worlds with persistent variables accessible via REST API. 
            Perfect for cross-platform integration, external applications, and real-time synchronization.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              className="bg-resonite-600 hover:bg-resonite-700"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg">
              View Documentation
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Persistent Storage</h3>
              <p className="text-slate-600 text-sm">
                Variables persist across sessions and worlds, just like Resonite Cloud Variables
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Real-time Sync</h3>
              <p className="text-slate-600 text-sm">
                WebSocket support for instant updates across all connected applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Permission Control</h3>
              <p className="text-slate-600 text-sm">
                Granular permissions system matching Resonite's security model
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Globe className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">REST API</h3>
              <p className="text-slate-600 text-sm">
                Full REST API for easy integration with external applications and services
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Integration Examples */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Use Cases & Integration
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-resonite-100 rounded-lg flex items-center justify-center mr-4">
                    <Cloud className="h-6 w-6 text-resonite-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Resonite Integration</h3>
                </div>
                <p className="text-slate-600 mb-4">
                  Use ProtoFlux nodes to read and write Web Variables directly from your Resonite worlds.
                </p>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                  <div className="text-green-400">GET Web Variable</div>
                  <div className="text-slate-400 text-xs mt-1">
                    Inputs: Variable Name, API Key<br/>
                    Outputs: Value, Success, Error
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <Database className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">External Applications</h3>
                </div>
                <p className="text-slate-600 mb-4">
                  Access your variables from web apps, mobile apps, Discord bots, and more.
                </p>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                  <div className="text-green-400">curl -H "Authorization: Bearer key" \</div>
                  <div className="text-green-400">  https://api.webvariables.com/v1/variables/score</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <Card className="bg-gradient-to-r from-resonite-50 to-blue-50 border-resonite-200">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Ready to extend your Resonite worlds?
              </h2>
              <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                Start using Web Variables today and unlock new possibilities for your Resonite creations.
                Free tier includes up to 256 variable definitions and basic rate limiting.
              </p>
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/api/login'}
                className="bg-resonite-600 hover:bg-resonite-700"
              >
                Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
