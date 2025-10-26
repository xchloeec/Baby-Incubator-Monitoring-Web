import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Stethoscope, 
  Heart, 
  ShieldCheck, 
  Users,
  Baby,
  Lock
} from 'lucide-react';

interface RoleSelectorProps {
  onRoleSelect: (role: 'hospital' | 'parent') => void;
}

export function RoleSelector({ onRoleSelect }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<'hospital' | 'parent' | null>(null);

  const handleRoleSelect = (role: 'hospital' | 'parent') => {
    setSelectedRole(role);
    setTimeout(() => onRoleSelect(role), 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Baby className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                NeoGuard Monitoring System
              </h1>
              <p className="text-gray-600 mt-1">
                Advanced Neonatal Incubator Care & Monitoring Platform
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            System Online - All Sensors Active
          </Badge>
        </div>

        {/* Role Selection */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Select Your Access Level
          </h2>
          <p className="text-gray-600">
            Choose the appropriate interface for your role
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Hospital Staff Interface */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
              selectedRole === 'hospital' 
                ? 'border-blue-500 bg-blue-50 scale-105' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => handleRoleSelect('hospital')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto p-4 bg-blue-600 rounded-full w-fit mb-4">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-blue-900">
                Hospital Staff Interface
              </CardTitle>
              <div className="flex justify-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Full Access
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Medical Controls
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>Complete sensor monitoring & controls</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>Emergency alert management</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>Incubator position & environment controls</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>Medical data analytics & reporting</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>Staff communication tools</span>
                </div>
              </div>
              
              <Button 
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
                disabled={selectedRole === 'hospital'}
              >
                {selectedRole === 'hospital' ? 'Accessing...' : 'Access Hospital Interface'}
              </Button>
            </CardContent>
          </Card>

          {/* Parent Interface */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
              selectedRole === 'parent' 
                ? 'border-pink-500 bg-pink-50 scale-105' 
                : 'border-gray-200 hover:border-pink-300'
            }`}
            onClick={() => handleRoleSelect('parent')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto p-4 bg-pink-600 rounded-full w-fit mb-4">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-pink-900">
                Parent Interface
              </CardTitle>
              <div className="flex justify-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                  Monitoring
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Connection
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Heart className="h-4 w-4 text-pink-600" />
                  <span>Live video feed & photo gallery</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Heart className="h-4 w-4 text-pink-600" />
                  <span>Baby vital signs monitoring</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Heart className="h-4 w-4 text-pink-600" />
                  <span>Two-way audio communication</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Heart className="h-4 w-4 text-pink-600" />
                  <span>Growth milestone tracking</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Heart className="h-4 w-4 text-pink-600" />
                  <span>Comfort & bonding features</span>
                </div>
              </div>
              
              <Button 
                className="w-full mt-6 bg-pink-600 hover:bg-pink-700"
                disabled={selectedRole === 'parent'}
              >
                {selectedRole === 'parent' ? 'Accessing...' : 'Access Parent Interface'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="h-4 w-4" />
            <span>Secure HIPAA-compliant platform</span>
          </div>
          <p>Patient: Baby Emma Johnson • Room 204A • Incubator Unit #3</p>
        </div>
      </div>
    </div>
  );
}