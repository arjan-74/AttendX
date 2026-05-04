import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Modal,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';

export { ErrorBoundary } from 'expo-router';

const API = 'https://attendx-backend-lyx7.onrender.com';

const C = {
  bg: '#0a0a0f', surface: '#13131a', surface2: '#1c1c27',
  accent: '#6c63ff', green: '#00e5a0', red: '#ff6b6b',
  yellow: '#ffd166', text: '#f0eeff', muted: '#7a7a9a',
  border: 'rgba(255,255,255,0.07)',
};

const Btn = ({ label, onPress, color = C.accent, loading, small }: any) => (
  <TouchableOpacity style={[s.btn, { backgroundColor: color }, small && { padding: 10, marginBottom: 8 }]} onPress={onPress} disabled={loading}>
    {loading ? <ActivityIndicator color="#fff" /> : <Text style={[s.btnText, small && { fontSize: 13 }]}>{label}</Text>}
  </TouchableOpacity>
);

const Input = ({ placeholder, value, onChangeText, secure, autoCapitalize, keyboardType }: any) => (
  <TextInput
    style={s.input} placeholder={placeholder} placeholderTextColor={C.muted}
    value={value} onChangeText={onChangeText} secureTextEntry={secure}
    autoCapitalize={autoCapitalize || 'none'} keyboardType={keyboardType || 'default'}
  />
);

const Card = ({ children, style }: any) => <View style={[s.card, style]}>{children}</View>;

// ─── LOGIN ────────────────────────────────────
function LoginScreen({ onLogin }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const login = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin(data.token, data.user);
    } catch (e: any) { Alert.alert('Login Failed', e.message); }
    setLoading(false);
  };

  const forgotPassword = async () => {
    if (!forgotEmail) return Alert.alert('Error', 'Please enter your email');
    setForgotLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Alert.alert('✅ Email Sent', 'A temporary password has been sent to your email.', [
        { text: 'OK', onPress: () => setShowForgot(false) }
      ]);
      setForgotEmail('');
    } catch (e: any) { Alert.alert('Error', e.message); }
    setForgotLoading(false);
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.loginBox}>
      <Text style={s.logo}>AttendX</Text>
      <Text style={s.tagline}>SMART ATTENDANCE SYSTEM</Text>
      <Text style={s.sectionLabel}>EMAIL</Text>
      <Input placeholder="you@university.edu" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Text style={s.sectionLabel}>PASSWORD</Text>
      <Input placeholder="••••••••" value={password} onChangeText={setPassword} secure />
      <Btn label="Sign In →" onPress={login} loading={loading} />
      <TouchableOpacity onPress={() => setShowForgot(true)} style={{ alignItems: 'center', marginTop: 8 }}>
        <Text style={{ color: C.accent, fontSize: 14 }}>Forgot Password?</Text>
      </TouchableOpacity>
      <Modal visible={showForgot} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.pageTitle}>Forgot Password</Text>
            <Text style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>
              Enter your registered email. We'll send you a temporary password.
            </Text>
            <Text style={s.sectionLabel}>EMAIL</Text>
            <Input placeholder="you@university.edu" value={forgotEmail} onChangeText={setForgotEmail} keyboardType="email-address" />
            <Btn label="Send Temporary Password" onPress={forgotPassword} loading={forgotLoading} />
            <Btn label="Cancel" color={C.surface2} onPress={() => { setShowForgot(false); setForgotEmail(''); }} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─── DASHBOARD ────────────────────────────────
function DashboardScreen({ token, user, onNavigate, onLogout }: any) {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/classes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setClasses(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const roleColor = user.role === 'student' ? C.accent : user.role === 'faculty' ? C.green : C.yellow;

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 20 }}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Hello, {user.name.split(' ')[0]} 👋</Text>
          <Text style={s.subText}>Welcome back</Text>
        </View>
        <View style={[s.badge, { borderColor: roleColor }]}>
          <Text style={[s.badgeText, { color: roleColor }]}>{user.role.toUpperCase()}</Text>
        </View>
      </View>
      <View style={s.statsRow}>
        {[
          { val: classes.length, label: 'Classes', color: C.accent },
          { val: '84%', label: 'Avg Att.', color: C.green },
          { val: '3', label: 'Today', color: C.yellow },
        ].map((item, i) => (
          <View key={i} style={[s.statCard, { borderTopColor: item.color }]}>
            <Text style={[s.statVal, { color: item.color }]}>{item.val}</Text>
            <Text style={s.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
      {user.role === 'student' && (
        <Btn label="⬛ Generate QR Code" onPress={() => onNavigate('qr', { classes })} />
      )}
      {user.role === 'student' && (
        <Btn label="📊 My Attendance" color={C.yellow} onPress={() => onNavigate('history', {})} />
      )}
      {(user.role === 'faculty' || user.role === 'admin') && (
        <Btn label="📷 Scan QR / Manual" color={C.green} onPress={() => onNavigate('scanner', { classes })} />
      )}
      {user.role === 'admin' && (
        <Btn label="⚙️ Admin Panel" color={C.yellow} onPress={() => onNavigate('admin', {})} />
      )}
      <Text style={[s.sectionLabel, { marginTop: 20 }]}>MY CLASSES</Text>
      {loading
        ? <ActivityIndicator color={C.accent} style={{ marginTop: 20 }} />
        : classes.length === 0
          ? <Card><Text style={{ color: C.muted, textAlign: 'center' }}>No classes found</Text></Card>
          : classes.map(cls => (
            <Card key={cls.id} style={{ marginBottom: 10 }}>
              <Text style={s.className}>{cls.name}</Text>
              <Text style={s.classSub}>{cls.id} · {cls.room} · {cls.time}</Text>
            </Card>
          ))
      }
      <Btn label="Sign Out" color={C.surface2} onPress={onLogout} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── QR GENERATE ──────────────────────────────
function QRScreen({ token, classes, onBack }: any) {
  const [selected, setSelected] = useState<any>(null);
  const [qrData, setQrData] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!selected) return Alert.alert('Select a class first');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/qr/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ classId: selected.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQrData(data);
      setCountdown(60);
      const iv = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(iv); setQrData(null); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setLoading(false);
  };

  const tc = countdown > 30 ? C.green : countdown > 15 ? C.yellow : C.red;

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 16 }}>
        <Text style={{ color: C.accent, fontSize: 15 }}>← Back</Text>
      </TouchableOpacity>
      <Text style={s.pageTitle}>My QR Code</Text>
      <Text style={s.sectionLabel}>SELECT CLASS</Text>
      {classes.map((cls: any) => (
        <TouchableOpacity key={cls.id}
          style={[s.classItem, selected?.id === cls.id && { borderColor: C.accent, backgroundColor: C.accent + '15' }]}
          onPress={() => setSelected(cls)}>
          <Text style={s.className}>{cls.name}</Text>
          <Text style={s.classSub}>{cls.time}</Text>
        </TouchableOpacity>
      ))}
      <Btn label="⬛ Generate QR Code" onPress={generate} loading={loading} />
      {qrData && (
        <Card style={{ alignItems: 'center', padding: 28, marginTop: 20 }}>
          <Text style={s.sectionLabel}>SHOW THIS TO YOUR FACULTY</Text>
          <View style={s.qrWrapper}>
            <Image source={{ uri: qrData.qrImage }} style={{ width: 200, height: 200 }} />
          </View>
          <View style={[s.timerCircle, { borderColor: tc, marginTop: 20 }]}>
            <Text style={[s.timerNum, { color: tc }]}>{countdown}</Text>
            <Text style={{ color: tc, fontSize: 11, letterSpacing: 2 }}>SEC</Text>
          </View>
          <Text style={{ color: C.muted, fontSize: 11, marginTop: 12 }}>Class: {selected?.name}</Text>
          <Btn label="↺ Refresh QR" color={C.surface2} onPress={generate} />
        </Card>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── HISTORY ──────────────────────────────────
function HistoryScreen({ token, user, onBack }: any) {
  const [records, setRecords] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/attendance/student/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/classes`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([att, cls]) => {
      setRecords(Array.isArray(att) ? att : []);
      setClasses(Array.isArray(cls) ? cls : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || id;
  const pct = classes.length > 0 ? Math.round((records.length / (classes.length * 10)) * 100) : 0;
  const pctColor = pct >= 75 ? C.green : pct >= 50 ? C.yellow : C.red;

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 16 }}>
        <Text style={{ color: C.accent, fontSize: 15 }}>← Back</Text>
      </TouchableOpacity>
      <Text style={s.pageTitle}>My Attendance</Text>
      <Card style={{ alignItems: 'center', padding: 24, marginBottom: 20 }}>
        <Text style={s.sectionLabel}>OVERALL ATTENDANCE</Text>
        <Text style={{ fontSize: 64, fontWeight: '900', color: pctColor }}>{pct}%</Text>
        <Text style={{ color: C.muted, fontSize: 13 }}>{records.length} classes attended</Text>
      </Card>
      <Text style={s.sectionLabel}>BY CLASS</Text>
      {classes.map(cls => {
        const attended = records.filter(r => r.classId === cls.id).length;
        const classPct = Math.round((attended / 10) * 100);
        const clrColor = classPct >= 75 ? C.green : classPct >= 50 ? C.yellow : C.red;
        return (
          <Card key={cls.id} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={s.className}>{cls.name}</Text>
                <Text style={s.classSub}>{attended} attended</Text>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: clrColor }}>{classPct}%</Text>
            </View>
            <View style={{ height: 4, backgroundColor: C.surface2, borderRadius: 2, marginTop: 10 }}>
              <View style={{ height: 4, backgroundColor: clrColor, borderRadius: 2, width: `${classPct}%` }} />
            </View>
          </Card>
        );
      })}
      <Text style={[s.sectionLabel, { marginTop: 20 }]}>RECENT RECORDS</Text>
      {loading ? <ActivityIndicator color={C.accent} />
        : records.length === 0
          ? <Card><Text style={{ color: C.muted, textAlign: 'center' }}>No attendance records yet</Text></Card>
          : records.slice(-10).reverse().map((r, i) => (
            <Card key={i} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Text style={s.className}>{getClassName(r.classId)}</Text>
                  <Text style={s.classSub}>{new Date(r.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <Text style={{ color: C.green, fontWeight: '700' }}>✓ Present</Text>
              </View>
            </Card>
          ))
      }
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── SCANNER + MANUAL ─────────────────────────
function ScannerScreen({ token, onBack }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastScanned, setLastScanned] = useState('');
  const [tab, setTab] = useState<'scanner' | 'manual'>('scanner');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [marked, setMarked] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/classes`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([cls, usr]) => {
      setClasses(Array.isArray(cls) ? cls : []);
      setStudents(Array.isArray(usr) ? usr.filter((u: any) => u.role === 'student') : []);
    }).catch(() => {});
  }, []);

  const filtered = students.filter(st =>
    st.name.toLowerCase().includes(search.toLowerCase()) ||
    st.email.toLowerCase().includes(search.toLowerCase())
  );

  const markAttendance = async (student: any) => {
    if (!selectedClass) return Alert.alert('Select a class first');
    if (marked.includes(student.id)) return Alert.alert('Already marked', `${student.name} is already marked present`);
    try {
      const res = await fetch(`${API}/api/attendance/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId: student.id, classId: selectedClass.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMarked(prev => [...prev, student.id]);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleBarCodeScanned = async ({ data }: any) => {
    if (processing || data === lastScanned) return;
    setProcessing(true);
    setLastScanned(data);
    try {
      let parsedToken = data;
      try { const parsed = JSON.parse(data); parsedToken = parsed.token || data; } catch { parsedToken = data; }
      const res = await fetch(`${API}/api/qr/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ token: parsedToken })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setScanned(prev => [...prev, result]);
      setTimeout(() => { setProcessing(false); setLastScanned(''); }, 2000);
    } catch (e: any) {
      Alert.alert('❌ Failed', e.message, [
        { text: 'Try Again', onPress: () => { setProcessing(false); setLastScanned(''); } }
      ]);
    }
  };

  if (!permission) return <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator color={C.accent} /></View>;

  if (!permission.granted) return (
    <View style={[s.screen, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>📷</Text>
      <Text style={[s.pageTitle, { textAlign: 'center' }]}>Camera Access Needed</Text>
      <Btn label="Grant Camera Permission" onPress={requestPermission} />
      <Btn label="← Back" color={C.surface2} onPress={onBack} />
    </View>
  );

  if (scanning) return (
    <View style={s.screen}>
      <CameraView style={{ flex: 1 }} facing="back" onBarcodeScanned={handleBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} />
      <View style={s.scanOverlay}>
        <View style={s.scanFrame}>
          <View style={[s.scanCorner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[s.scanCorner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
          <View style={[s.scanCorner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[s.scanCorner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
        </View>
        {processing
          ? <Text style={[s.scanHint, { backgroundColor: 'rgba(0,229,160,0.8)' }]}>✅ Marked! Ready for next...</Text>
          : <Text style={s.scanHint}>Point at student's QR code</Text>
        }
      </View>
      <View style={s.scannedCount}><Text style={{ color: '#fff', fontWeight: '700' }}>✓ {scanned.length} marked</Text></View>
      <TouchableOpacity style={s.cancelBtn} onPress={() => setScanning(false)}>
        <Text style={{ color: C.text, fontWeight: '700', fontSize: 16 }}>✕ Stop Scanning</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.screen}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 }}>
        <TouchableOpacity onPress={onBack} style={{ marginBottom: 12 }}>
          <Text style={{ color: C.green, fontSize: 15 }}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {([['scanner', '📷 QR Scanner'], ['manual', '✏️ Manual']] as const).map(([t, label]) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              style={[s.tabBtn, tab === t && { backgroundColor: C.green }]}>
              <Text style={{ color: tab === t ? '#000' : C.muted, fontWeight: '700', fontSize: 13 }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === 'scanner' && (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10 }}>
          <Card style={{ alignItems: 'center', paddingVertical: 32, marginBottom: 16 }}>
            <Text style={{ fontSize: 56, marginBottom: 10 }}>📷</Text>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 6 }}>Ready to Scan</Text>
            <Text style={{ color: C.muted, fontSize: 13, textAlign: 'center' }}>Auto-advances to next student{'\n'}after each successful scan</Text>
          </Card>
          <Btn label="📷 Start Scanning" color={C.green} onPress={() => { setProcessing(false); setLastScanned(''); setScanning(true); }} />
          {scanned.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { marginTop: 20 }]}>MARKED TODAY ({scanned.length})</Text>
              {scanned.map((r, i) => (
                <Card key={i} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={s.avatar}><Text style={s.avatarText}>{r.student.name[0]}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.className}>{r.student.name}</Text>
                      <Text style={s.classSub}>{r.classId} · ✓ Present</Text>
                    </View>
                    <Text style={{ color: C.green, fontSize: 20 }}>✓</Text>
                  </View>
                </Card>
              ))}
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {tab === 'manual' && (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10 }}>
          <Text style={s.sectionLabel}>SELECT CLASS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {classes.map((cls: any) => (
              <TouchableOpacity key={cls.id}
                style={[s.chipBtn, selectedClass?.id === cls.id && { backgroundColor: C.green }]}
                onPress={() => setSelectedClass(cls)}>
                <Text style={{ color: selectedClass?.id === cls.id ? '#000' : C.muted, fontSize: 12, fontWeight: '600' }}>{cls.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedClass && (
            <Text style={[s.sectionLabel, { color: C.green, marginBottom: 12 }]}>
              CLASS: {selectedClass.name.toUpperCase()} · {marked.length} MARKED
            </Text>
          )}
          <Text style={s.sectionLabel}>SEARCH STUDENT</Text>
          <Input placeholder="Search by name or email..." value={search} onChangeText={setSearch} />
          {filtered.map(student => (
            <Card key={student.id} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={s.avatar}><Text style={s.avatarText}>{student.name[0]}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.className}>{student.name}</Text>
                  <Text style={s.classSub}>{student.email}</Text>
                </View>
                <TouchableOpacity
                  style={[s.markBtn, marked.includes(student.id) && { backgroundColor: C.green }]}
                  onPress={() => markAttendance(student)}>
                  <Text style={{ color: marked.includes(student.id) ? '#000' : '#fff', fontWeight: '700', fontSize: 12 }}>
                    {marked.includes(student.id) ? '✓ Done' : 'Mark'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── ADMIN PANEL ──────────────────────────────
function AdminScreen({ token, onBack }: any) {
  const [tab, setTab] = useState<'users' | 'classes'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [newClassName, setNewClassName] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newTime, setNewTime] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const [u, c] = await Promise.all([
      fetch(`${API}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/classes`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]);
    setUsers(Array.isArray(u) ? u : []);
    setClasses(Array.isArray(c) ? c : []);
  };

  useEffect(() => { loadData(); }, []);

  const addUser = async () => {
    if (!newName || !newEmail || !newPassword) return Alert.alert('Fill all fields');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Alert.alert('✅ User created!', `Login credentials sent to ${newEmail}`);
      setShowAddUser(false); setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('student');
      loadData();
    } catch (e: any) { Alert.alert('Error', e.message); }
    setLoading(false);
  };

  const deleteUser = (user: any) => {
    Alert.alert('Delete User', `Remove ${user.name}?`, [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await fetch(`${API}/api/admin/users/${user.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        loadData();
      }}
    ]);
  };

  const addClass = async () => {
    if (!newClassName || !newRoom || !newTime) return Alert.alert('Fill all fields');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newClassName, room: newRoom, time: newTime })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      Alert.alert('✅ Class created!');
      setShowAddClass(false); setNewClassName(''); setNewRoom(''); setNewTime('');
      loadData();
    } catch (e: any) { Alert.alert('Error', e.message); }
    setLoading(false);
  };

  const deleteClass = (cls: any) => {
    Alert.alert('Delete Class', `Remove ${cls.name}?`, [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await fetch(`${API}/api/admin/classes/${cls.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        loadData();
      }}
    ]);
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 16 }}>
        <Text style={{ color: C.yellow, fontSize: 15 }}>← Back</Text>
      </TouchableOpacity>
      <Text style={s.pageTitle}>Admin Panel</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {(['users', 'classes'] as const).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)}
            style={[s.tabBtn, tab === t && { backgroundColor: C.yellow }]}>
            <Text style={{ color: tab === t ? '#000' : C.muted, fontWeight: '700', fontSize: 13 }}>
              {t === 'users' ? '👥 Users' : '📚 Classes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'users' && (
        <>
          <Btn label="+ Add User" color={C.green} onPress={() => setShowAddUser(true)} />
          {users.map(u => (
            <Card key={u.id || u.email} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={s.avatar}><Text style={s.avatarText}>{u.name[0]}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.className}>{u.name}</Text>
                  <Text style={s.classSub}>{u.email} · {u.role}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteUser(u)} style={s.deleteBtn}>
                  <Text style={{ color: C.red, fontWeight: '700', fontSize: 12 }}>✕</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </>
      )}
      {tab === 'classes' && (
        <>
          <Btn label="+ Add Class" color={C.green} onPress={() => setShowAddClass(true)} />
          {classes.map(cls => (
            <Card key={cls.id} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.className}>{cls.name}</Text>
                  <Text style={s.classSub}>{cls.room} · {cls.time}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteClass(cls)} style={s.deleteBtn}>
                  <Text style={{ color: C.red, fontWeight: '700', fontSize: 12 }}>✕</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </>
      )}
      <Modal visible={showAddUser} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.pageTitle}>Add User</Text>
            <Text style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Login credentials will be emailed automatically.</Text>
            <Input placeholder="Full Name" value={newName} onChangeText={setNewName} autoCapitalize="words" />
            <Input placeholder="Email" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" />
            <Input placeholder="Password" value={newPassword} onChangeText={setNewPassword} secure />
            <Text style={s.sectionLabel}>ROLE</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {['student', 'faculty', 'admin'].map(r => (
                <TouchableOpacity key={r} onPress={() => setNewRole(r)}
                  style={[s.chipBtn, newRole === r && { backgroundColor: C.accent }]}>
                  <Text style={{ color: newRole === r ? '#fff' : C.muted, fontSize: 12 }}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Btn label="Create & Send Email" onPress={addUser} loading={loading} />
            <Btn label="Cancel" color={C.surface2} onPress={() => setShowAddUser(false)} />
          </View>
        </View>
      </Modal>
      <Modal visible={showAddClass} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.pageTitle}>Add Class</Text>
            <Input placeholder="Class Name (e.g. Mathematics)" value={newClassName} onChangeText={setNewClassName} autoCapitalize="words" />
            <Input placeholder="Room (e.g. Room 101)" value={newRoom} onChangeText={setNewRoom} autoCapitalize="words" />
            <Input placeholder="Schedule (e.g. Mon/Wed 10:00 AM)" value={newTime} onChangeText={setNewTime} />
            <Btn label="Create Class" onPress={addClass} loading={loading} />
            <Btn label="Cancel" color={C.surface2} onPress={() => setShowAddClass(false)} />
          </View>
        </View>
      </Modal>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── ROOT ─────────────────────────────────────
export default function RootLayout() {
  const [screen, setScreen] = useState('login');
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [navParams, setNavParams] = useState<any>({});

  const handleLogin = (t: string, u: any) => { setToken(t); setUser(u); setScreen('dashboard'); };
  const handleNavigate = (sc: string, p: any) => { setNavParams(p); setScreen(sc); };
  const handleLogout = () => { setUser(null); setToken(''); setScreen('login'); };

  if (screen === 'login') return <LoginScreen onLogin={handleLogin} />;
  if (screen === 'dashboard') return <DashboardScreen token={token} user={user} onNavigate={handleNavigate} onLogout={handleLogout} />;
  if (screen === 'qr') return <QRScreen token={token} classes={navParams.classes || []} onBack={() => setScreen('dashboard')} />;
  if (screen === 'history') return <HistoryScreen token={token} user={user} onBack={() => setScreen('dashboard')} />;
  if (screen === 'scanner') return <ScannerScreen token={token} onBack={() => setScreen('dashboard')} />;
  if (screen === 'admin') return <AdminScreen token={token} onBack={() => setScreen('dashboard')} />;
  return <LoginScreen onLogin={handleLogin} />;
}

// ─── STYLES ───────────────────────────────────
const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg },
  loginBox:     { padding: 28, paddingTop: 100 },
  logo:         { fontSize: 42, fontWeight: '900', color: C.accent, letterSpacing: -1, textAlign: 'center' },
  tagline:      { fontSize: 11, color: C.muted, letterSpacing: 3, textAlign: 'center', marginBottom: 48 },
  sectionLabel: { fontSize: 10, color: C.muted, letterSpacing: 2, marginBottom: 8, marginTop: 4 },
  input:        { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 14, color: C.text, marginBottom: 16, fontSize: 14 },
  btn:          { backgroundColor: C.accent, borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 12 },
  btnText:      { color: '#fff', fontWeight: '700', fontSize: 15 },
  card:         { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 12 },
  badge:        { borderWidth: 1, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText:    { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting:     { fontSize: 24, fontWeight: '800', color: C.text },
  subText:      { fontSize: 13, color: C.muted, marginTop: 2 },
  statsRow:     { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:     { flex: 1, backgroundColor: C.surface, borderRadius: 12, padding: 14, alignItems: 'center', borderTopWidth: 2 },
  statVal:      { fontSize: 24, fontWeight: '800' },
  statLabel:    { fontSize: 11, color: C.muted, marginTop: 2 },
  className:    { color: C.text, fontWeight: '600', fontSize: 14, marginBottom: 3 },
  classSub:     { color: C.muted, fontSize: 12 },
  classItem:    { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  timerCircle:  { width: 130, height: 130, borderRadius: 65, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  timerNum:     { fontSize: 48, fontWeight: '900' },
  qrWrapper:    { backgroundColor: 'white', padding: 16, borderRadius: 16, marginTop: 12 },
  pageTitle:    { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 16 },
  avatar:       { width: 36, height: 36, borderRadius: 18, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  scanOverlay:  { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  scanFrame:    { width: 240, height: 240, position: 'relative' },
  scanCorner:   { position: 'absolute', width: 32, height: 32, borderColor: C.green },
  scanHint:     { color: C.text, marginTop: 24, fontSize: 14, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  cancelBtn:    { position: 'absolute', bottom: 48, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30 },
  scannedCount: { position: 'absolute', top: 48, right: 16, backgroundColor: C.green, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipBtn:      { backgroundColor: C.surface2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  tabBtn:       { flex: 1, backgroundColor: C.surface2, borderRadius: 10, padding: 12, alignItems: 'center' },
  markBtn:      { backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  deleteBtn:    { backgroundColor: C.surface2, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 48 },
  demoRow:      { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  demoLabel:    { color: C.text, fontWeight: '600', fontSize: 13 },
  demoEmail:    { color: C.muted, fontSize: 12, marginTop: 2 },
});