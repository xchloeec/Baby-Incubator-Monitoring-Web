import { useState, useEffect, useRef } from 'react';
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

interface EmergencyContact {
  name: string;
  phone: string; // human readable
  email: string;
}

interface AlertSystemProps {
  emergencyAlerts: string[];
  cryingIntensity: number;
}

const genId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const fromNow = (d: Date) => {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
};

// 规范化电话号码为 tel: 可用格式（去空格，若以 +61 0 开头则去掉 0）
const telHref = (phoneDisplay: string) => {
  const digits = phoneDisplay.replace(/\s+/g, '');
  // 常见澳洲格式：+61 0xxx... 实际应为 +61 去掉前导 0
  if (/^\+610/.test(digits)) {
    return `tel:${digits.replace(/^\+610/, '+61')}`;
  }
  return `tel:${digits}`;
};

// 🔗 Alertzy Push helper — calls your backend route
const ALERTZY_ENDPOINT = "/api/alertzy";
const lastPushRef = new Map<string, number>();
const PUSH_COOLDOWN_MS = 60_000; // 1 minute

function sendAlertzyPush(title: string, message: string, priority = 1, group?: string) {
  try {
    const key = `${title}|${message}|${group || ""}`;
    const now = Date.now();
    if ((lastPushRef.get(key) || 0) > now - PUSH_COOLDOWN_MS) return; // prevent spam
    lastPushRef.set(key, now);

    fetch(ALERTZY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, priority, group })
    }).catch((e) => console.warn("Alertzy push error:", e));
  } catch (e) {
    console.warn("Alertzy push threw:", e);
  }
}

// 🚨 AlertSystem component

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

  // 你的联系方式已加入第一位（显示友好格式，拨号会自动规范化）
  const [notificationSettings] = useState({
    emailAlerts: true,
    smsAlerts: true,
    pushNotifications: true,
    emergencyContacts: [
      { name: 'Dr. Gokul', phone: '+61 0469 778 709', email: 'gthirunavukkarasu@swin.edu.au' },
      { name: 'Nurse Station', phone: '+60 115 110 8321', email: '104388247@student.swin.edu.au' },
      { name: 'Parents (Emergency)', phone: '+60 109 799 091', email: '104384850@student.swin.edu.au' }
    ] as EmergencyContact[]
  });

  // --- 只处理“新增”的 emergencyAlerts，避免重复追加 ---
  const seenEmergency = useRef<Set<string>>(new Set());
  // Keep track of which alerts we've already pushed to Alertzy
  const pushedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!Array.isArray(emergencyAlerts) || emergencyAlerts.length === 0) return;

    const toAdd = emergencyAlerts.filter(msg => {
      const key = `EMG:${msg}`;
      if (seenEmergency.current.has(key)) return false;
      seenEmergency.current.add(key);
      return true;
    });

    if (toAdd.length === 0) return;

    const newAlerts: AlertItem[] = toAdd.map(msg => ({
      id: genId(),
      type: 'emergency',
      title: 'Medical Alert',
      description: msg,
      timestamp: new Date(),
      acknowledged: false,
      priority: 'high'
    }));

    setAlerts(prev => {
      const next = [...newAlerts, ...prev].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
      return next.slice(0, 200); // 限制最多 200 条
    });

    sendAlertzyPush(newAlerts[0].title, newAlerts[0].description, 2, "NICU-1");
    pushedIds.current.add(newAlerts[0].id);


  }, [emergencyAlerts]);

  // --- 哭声强度冷却（60s 内只报一次） ---
  const lastCryingAlertAt = useRef<number>(0);
  const CRYING_COOLDOWN_MS = 60_000;

  useEffect(() => {
    const now = Date.now();
    if (cryingIntensity > 70 && now - lastCryingAlertAt.current > CRYING_COOLDOWN_MS) {
      lastCryingAlertAt.current = now;
      const newAlert: AlertItem = {
        id: genId(),
        type: 'warning',
        title: 'Crying Detected',
        description: `High intensity crying detected (${Math.round(cryingIntensity)}%)`,
        timestamp: new Date(),
        acknowledged: false,
        priority: 'medium'
      };
      setAlerts(prev => {
        const next = [newAlert, ...prev].sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );
        return next.slice(0, 200);
      });

      sendAlertzyPush(newAlert.title, newAlert.description, 2, "NICU-1");
      pushedIds.current.add(newAlert.id);

    }
  }, [cryingIntensity]);

  // Push for any newly-added, unacknowledged alert that hasn't been pushed yet.
  // This covers "manual" popups created elsewhere in the UI.
  useEffect(() => {
    for (const a of alerts) {
      if (!a.acknowledged && !pushedIds.current.has(a.id)) {
        const prio = a.type === 'emergency' ? 2 : a.type === 'warning' ? 2 : 1;
        sendAlertzyPush(a.title, a.description, prio, "NICU-1");
        pushedIds.current.add(a.id);
      }
    }
  }, [alerts]);

  async function sendAlertzyPush(title: string, message: string, priority = 1, group?: string) {
    try {
      const key = `${title}|${message}|${group || ""}`;
      const now = Date.now();
      if ((lastPushRef.get(key) || 0) > now - PUSH_COOLDOWN_MS) {
        console.log("⏱️ Skipped Alertzy (cooldown):", key);
        return;
      }
      lastPushRef.set(key, now);

      const r = await fetch(ALERTZY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, priority, group })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || (data && data.ok === false)) {
        console.warn("❌ Alertzy push failed:", { status: r.status, data });
      } else {
        console.log("📲 Alertzy push sent:", { title, priority, group });
      }
    } catch (e) {
      console.warn("Alertzy push error:", e);
    }
  }



  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // 批量操作
  const acknowledgeAll = () => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
  };
  const clearActive = () => {
    setAlerts(prev => prev.filter(a => a.acknowledged));
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

  // 选择一个“最高优先级”的活动告警（用于邮件主题/正文）
  const pickTopActiveAlert = (): AlertItem | undefined => {
    const bySeverity = (a: AlertItem) =>
      a.type === 'emergency' ? 3 : a.type === 'warning' ? 2 : 1;
    return [...unacknowledgedAlerts].sort((a, b) => {
      const s = bySeverity(b) - bySeverity(a);
      if (s !== 0) return s;
      return b.timestamp.getTime() - a.timestamp.getTime();
    })[0];
  };

  // 点击拨打前确认
  const handleCall = (contact: EmergencyContact) => {
    const href = telHref(contact.phone);
    const ok = window.confirm(`Call ${contact.name} at ${contact.phone}?`);
    if (ok) {
      window.location.href = href;
    }
  };

  // 点击邮件前确认（自动带主题与正文）
  const handleEmail = (contact: EmergencyContact) => {
    const top = pickTopActiveAlert();
    const typeLabel = top?.type?.toUpperCase?.() ?? 'INFO';
    const title = top?.title ?? 'Baby Incubator Alert';
    const desc = top?.description ?? 'No further description.';
    const time = new Date().toLocaleString();

    const subject = `[${typeLabel}] Baby Incubator Emergency Alert - ${title}`;
    const body =
`Hello ${contact.name},

An alert was triggered from the Baby Incubator system.

Type: ${typeLabel}
Title: ${title}
Time: ${time}
Details: ${desc}

Please respond if necessary.`;

    const mailto = `mailto:${encodeURIComponent(contact.email)}`
      + `?subject=${encodeURIComponent(subject)}`
      + `&body=${encodeURIComponent(body)}`;

    const ok = window.confirm(`Email ${contact.name} at ${contact.email}?\n\nSubject:\n${subject}`);
    if (ok) {
      window.location.href = mailto;
    }
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
            <div className="flex items-center gap-2">
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
          <CardTitle className="flex items-center justify-between text-red-600">
            <span>Active Alerts</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={acknowledgeAll}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Acknowledge All
              </Button>
              <Button variant="ghost" size="sm" onClick={clearActive}>
                <X className="h-4 w-4 mr-1" />
                Clear Active
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {unacknowledgedAlerts.map((alert) => (
              <Alert
                key={alert.id}
                className={`border-l-4 ${
                  alert.type === 'emergency'
                    ? 'border-l-red-500'
                    : alert.type === 'warning'
                    ? 'border-l-orange-500'
                    : 'border-l-blue-500'
                }`}
              >
                {/* === GRID: [icon] [content expands] [actions don't shrink] === */}
                <div className="grid grid-cols-[auto,1fr,auto] gap-3 items-start w-full">
                  {/* icon */}
                  <div className="pt-0.5">{getPriorityIcon(alert.priority)}</div>

                  {/* content (always gets remaining width) */}
                  <div className="min-w-0">
                    <div className="font-semibold break-words">{alert.title}</div>
                    <AlertDescription className="mt-1 whitespace-pre-wrap break-words">
                      {alert.description}
                    </AlertDescription>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground flex-wrap">
                      <Clock className="h-3 w-3" />
                      <span title={alert.timestamp.toLocaleString()}>
                        {fromNow(alert.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* actions (never shrink) */}
                  <div className="flex gap-2 shrink-0">
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
                  <Button variant="outline" size="sm" onClick={() => handleCall(contact)}>
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEmail(contact)}>
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
                  <Badge variant="outline" className="text-xs capitalize">
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
