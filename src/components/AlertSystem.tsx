import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, Bell, Phone, Mail, CheckCircle, X, Clock } from 'lucide-react';

interface AlertItem {
  id: string;
  type: 'emergency' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface AlertSystemProps {
  emergencyAlerts: string[];
  cryingIntensity: number;
}

export function AlertSystem({ emergencyAlerts, cryingIntensity }: AlertSystemProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: '1',
      type: 'info',
      title: 'System Online',
      description: 'All monitoring systems are functioning normally',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      acknowledged: true,
      priority: 'low'
    }
  ]);

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    smsAlerts: true,
    pushNotifications: true,
    emergencyContacts: [
      { name: 'Dr. Sarah Johnson', phone: '+1 (555) 123-4567', email: 'dr.johnson@hospital.com' },
      { name: 'Nurse Station', phone: '+1 (555) 987-6543', email: 'nurses@hospital.com' },
      { name: 'Parents (Emergency)', phone: '+1 (555) 456-7890', email: 'parents@email.com' }
    ]
  });

  // Add new alerts from props
  useEffect(() => {
    emergencyAlerts.forEach(alertMessage => {
      const newAlert: AlertItem = {
        id: `alert-${Date.now()}-${Math.random()}`,
        type: 'emergency',
        title: 'Medical Alert',
        description: alertMessage,
        timestamp: new Date(),
        acknowledged: false,
        priority: 'high'
      };
      
      setAlerts(prev => [newAlert, ...prev]);
    });
  }, [emergencyAlerts]);

  // Add crying detection alerts
  useEffect(() => {
    if (cryingIntensity > 70) {
      const newAlert: AlertItem = {
        id: `crying-${Date.now()}`,
        type: 'warning',
        title: 'Crying Detected',
        description: `High intensity crying detected (${Math.round(cryingIntensity)}%)`,
        timestamp: new Date(),
        acknowledged: false,
        priority: 'medium'
      };
      
      setAlerts(prev => [newAlert, ...prev]);
    }
  }, [cryingIntensity]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertColor = (type: AlertItem['type']) => {
    switch (type) {
      case 'emergency': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'default';
    }
  };

  const getPriorityIcon = (priority: AlertItem['priority']) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Bell className="h-4 w-4 text-orange-500" />;
      case 'low': return <Bell className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

  const callEmergencyContact = (contact: any) => {
    console.log(`Calling ${contact.name} at ${contact.phone}`);
    // In a real app, this would initiate a phone call
  };

  const emailEmergencyContact = (contact: any) => {
    console.log(`Emailing ${contact.name} at ${contact.email}`);
    // In a real app, this would send an email
  };

  return (
    <div className="space-y-4">
      {/* Alert Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alert Center
            </span>
            <div className="flex gap-2">
              {unacknowledgedAlerts.length > 0 && (
                <Badge variant="destructive">
                  {unacknowledgedAlerts.length} active
                </Badge>
              )}
              <Badge variant="outline">
                {alerts.length} total
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">
                {alerts.filter(a => a.type === 'emergency' && !a.acknowledged).length}
              </div>
              <div className="text-sm text-muted-foreground">Emergency</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {alerts.filter(a => a.type === 'warning' && !a.acknowledged).length}
              </div>
              <div className="text-sm text-muted-foreground">Warning</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {alerts.filter(a => a.type === 'info' && !a.acknowledged).length}
              </div>
              <div className="text-sm text-muted-foreground">Info</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {unacknowledgedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unacknowledgedAlerts.map((alert) => (
                <Alert key={alert.id} className={`border-l-4 ${
                  alert.type === 'emergency' ? 'border-l-red-500' :
                  alert.type === 'warning' ? 'border-l-orange-500' :
                  'border-l-blue-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {getPriorityIcon(alert.priority)}
                      <div className="flex-1">
                        <div className="font-semibold">{alert.title}</div>
                        <AlertDescription className="mt-1">
                          {alert.description}
                        </AlertDescription>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {alert.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notificationSettings.emergencyContacts.map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-sm text-muted-foreground">{contact.phone}</div>
                  <div className="text-sm text-muted-foreground">{contact.email}</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => callEmergencyContact(contact)}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => emailEmergencyContact(contact)}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert History */}
      {acknowledgedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {acknowledgedAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{alert.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {alert.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}