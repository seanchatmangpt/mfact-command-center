/**
 * TenFourApp.jsx — EXTENDED EDITION
 * Roles: driver | dispatcher | owner | shift_manager | ml_ops
 * 21 screens total — all written against mosaic-native + mosaic-data
 * portable to Expo: swap two imports.
 */

const {
  View, Text, Pressable, ScrollView, FlatList, ActivityIndicator,
  StyleSheet, TextInput, Switch,
} = window.MosaicNative;
const {
  SupabaseProvider, useAuth, useLiveQuery, useRpc, useEdgeFunction,
} = window.MosaicData;
import React from 'react';
const { useState, useEffect, useMemo } = React;

/* ============================================================= THEME ======= */
const C = {
  bg: '#050a14', surface: '#0d1627', surfaceAlt: '#142036', surface3: '#1a2b47',
  line: 'rgba(255,255,255,0.06)', line2: 'rgba(255,255,255,0.12)',
  text: '#ffffff', dim: '#94a3b8', faint: '#475569',
  amber: '#ffb13d', green: '#34e6a8', red: '#ff4d72',
  blue: '#33e1ff', violet: '#a98bff', cyan: '#00d9ff',
  pink: '#ff6ad5', orange: '#ff8a3d', teal: '#2ee6b9',
};

const statusColor = (st) => ({
  driving: C.green, rolling: C.green, available: C.green, pass: C.green, paid: C.green,
  delivered: C.green, arrived: C.green, active: C.green, healthy: C.green, ok: C.green,
  completed: C.green, done: C.green, champion: C.green, resolved: C.green,
  on_duty: C.amber, planned: C.amber, booked: C.amber, processing: C.amber,
  idle: C.amber, open: C.amber, warning: C.amber, shadow: C.amber, queued: C.amber,
  off_duty: C.dim, sleeper: C.blue, in_transit: C.blue, training: C.blue,
  running: C.blue, ack: C.blue,
  maintenance: C.red, defect: C.red, error: C.red, critical: C.red, failed: C.red,
}[st] || C.dim);

const EQUIP = { reefer: 'REEFER', dry_van: 'DRY VAN', flatbed: 'FLATBED' };
const equipColor = (e) => ({ reefer: C.blue, dry_van: C.violet, flatbed: C.amber }[e] || C.dim);
const money = (n) => '$' + Number(n || 0).toLocaleString('en-US');
const moneyK = (n) => n >= 1e6 ? '$' + (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? '$' + (n / 1e3).toFixed(0) + 'K' : '$' + n;
const titleCase = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const ago = (min) => min < 60 ? min + 'm ago' : Math.floor(min / 60) + 'h ago';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ======================================================== PRIMITIVES ======= */
function Pill({ label, color, solid }) {
  return (
    <View style={[s.pill, { borderColor: color, backgroundColor: solid ? color : 'transparent' }]}>
      <Text style={[s.pillTxt, { color: solid ? C.bg : color }]}>{label}</Text>
    </View>
  );
}
function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}
function Btn({ label, onPress, kind, pending, flex, sm }) {
  const primary = kind === 'primary', danger = kind === 'danger', ghost = kind === 'ghost';
  const bg = primary ? C.amber : danger ? 'transparent' : ghost ? 'transparent' : C.surfaceAlt;
  const fg = primary ? C.bg : danger ? C.red : ghost ? C.dim : C.text;
  const border = danger ? C.red : primary ? C.amber : C.line;
  return (
    <Pressable onPress={pending ? null : onPress}
      style={({ pressed }) => [s.btn, sm && s.btnSm, { backgroundColor: bg, borderColor: border, opacity: pending ? 0.5 : pressed ? 0.75 : 1, flex: flex ? 1 : 0 }]}>
      <Text style={[s.btnTxt, sm && s.btnSmTxt, { color: fg }]}>{pending ? '…' : label}</Text>
    </Pressable>
  );
}
function Bar({ pct: p, color }) {
  return (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: clamp(p, 0, 100) + '%', backgroundColor: color || C.amber }]} />
    </View>
  );
}
function StatTile({ label, value, color, sub }) {
  return (
    <View style={s.tile}>
      <Text style={[s.tileVal, { color: color || C.text }]}>{value}</Text>
      {sub ? <Text style={s.tileSub}>{sub}</Text> : null}
      <Text style={s.tileLabel}>{label}</Text>
    </View>
  );
}
function SectionLabel({ children, right }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.section}>{children}</Text>
      {right ? <Text style={s.sectionRight}>{right}</Text> : null}
    </View>
  );
}
function Empty({ label }) {
  return <View style={s.empty}><Text style={s.emptyTxt}>{label}</Text></View>;
}
function Divider() { return <View style={s.divider} />; }
function HorizBar({ label, value, pct: p, color }) {
  return (
    <View style={{ marginBottom: 11 }}>
      <View style={[s.rowBetween, { marginBottom: 4 }]}>
        <Text style={s.metaSm}>{label}</Text>
        <Text style={[s.metaSm, { color }]}>{value}</Text>
      </View>
      <View style={{ height: 5, borderRadius: 8, backgroundColor: C.surfaceAlt }}>
        <View style={{ height: 5, borderRadius: 8, width: clamp(p, 0, 100) + '%', backgroundColor: color }} />
      </View>
    </View>
  );
}
function SparkBars({ values, color, height: ht }) {
  const h = ht || 34;
  const max = Math.max(...values, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: h }}>
      {values.map((v, i) => (
        <View key={i} style={{ flex: 1, height: Math.max(3, (v / max) * h), backgroundColor: color || C.amber, borderRadius: 8, opacity: 0.38 + (i / (values.length - 1)) * 0.62 }} />
      ))}
    </View>
  );
}
function Tag({ label, color }) {
  return (
    <View style={{ backgroundColor: C.surfaceAlt, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: C.line }}>
      <Text style={{ color: color || C.faint, fontSize: 9, fontWeight: '700', letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

/* ================================================ DRIVER: ACTIVE RUN ======= */
function ActiveRunScreen({ driverId }) {
  const { data: runs } = useLiveQuery('runs', (q) => q.eq('driver_id', driverId));
  const { data: drivers } = useLiveQuery('drivers', (q) => q.eq('id', driverId));
  const hos = useRpc('driver_hos');
  const optimize = useEdgeFunction('optimize-route');
  const updateEta = useEdgeFunction('update-eta');
  const logFuel = useEdgeFunction('log-fuel');
  useEffect(() => { hos.call({ driver_id: driverId }); }, [driverId]);
  const driver = drivers && drivers[0];
  const run = runs && (runs.find((r) => r.status === 'rolling') || runs[0]);
  if (!run) return <Empty label="No active run. Grab one from the load board." />;
  const hrs = hos.data ? hos.data.drive_remaining_hrs : (driver ? (driver.hos_remaining / 60).toFixed(1) : '—');
  const hosPct = driver ? (driver.hos_remaining / 660) * 100 : 0;
  const hosWarn = driver && driver.hos_remaining < 120;
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <Card>
        <View style={s.rowBetween}>
          <Text style={s.loadRef}>{run.load_ref}</Text>
          <Pill label={titleCase(run.status)} color={statusColor(run.status)} />
        </View>
        <Text style={s.routeBig}>{run.next_stop}</Text>
        <View style={{ height: 14 }} />
        <Bar pct={run.progress} color={C.amber} />
        <View style={[s.rowBetween, { marginTop: 10 }]}>
          <View><Text style={s.miniLabel}>MILES LEFT</Text><Text style={s.miniVal}>{run.miles_remaining}</Text></View>
          <View style={{ alignItems: 'flex-end' }}><Text style={s.miniLabel}>PROGRESS</Text><Text style={s.miniVal}>{run.progress}%</Text></View>
        </View>
      </Card>
      <Card style={{ marginTop: 12 }}>
        <View style={s.rowBetween}>
          <Text style={s.cardTitle}>Hours of Service</Text>
          <Pill label={titleCase((driver && driver.status) || 'off_duty')} color={statusColor(driver && driver.status)} />
        </View>
        <View style={[s.rowBetween, { alignItems: 'flex-end', marginTop: 8 }]}>
          <Text style={[s.hosBig, { color: hosWarn ? C.red : C.text }]}>{hrs}<Text style={s.hosUnit}> hrs</Text></Text>
          <Text style={s.hosSub}>drive time left</Text>
        </View>
        <View style={{ height: 10 }} />
        <Bar pct={hosPct} color={hosWarn ? C.red : C.green} />
        {hosWarn ? <Text style={s.warn}>⚠ Approaching limit — plan your 10-hour break.</Text> : null}
      </Card>
      <SectionLabel>Actions</SectionLabel>
      <View style={s.btnRow}>
        <Btn label="Optimize route" flex pending={optimize.pending} onPress={() => optimize.call({ run_id: run.id })} />
        <Btn label="Log fuel" flex pending={logFuel.pending} onPress={() => logFuel.call({ truck_id: run.truck_id, driver_id: driverId })} />
      </View>
      <View style={{ height: 10 }} />
      <Btn label="Advance / check call" kind="primary" pending={updateEta.pending} onPress={() => { updateEta.call({ run_id: run.id, advance: 15 }); hos.call({ driver_id: driverId }); }} />
      {optimize.data ? <Text style={s.note}>✓ Saved {optimize.data.miles_saved} mi · {optimize.data.fuel_saved_gal} gal</Text> : null}
      {logFuel.data ? <Text style={s.note}>✓ Fuel logged · {money(logFuel.data.total)} · tank {logFuel.data.fuel_pct}%</Text> : null}
    </ScrollView>
  );
}

/* ================================================= LOAD BOARD (shared) ===== */
function LoadBoardScreen({ driverId, role }) {
  const { data: loads } = useLiveQuery('loads');
  const book = useEdgeFunction('book-load');
  const dispatch = useEdgeFunction('dispatch-load');
  const [eq, setEq] = useState('all');
  const filters = ['all', 'reefer', 'dry_van', 'flatbed'];
  const available = (loads || []).filter((l) => l.status === 'available' && (eq === 'all' || l.equipment === eq));
  const act = (l) => role === 'dispatcher' ? dispatch.call({ load_id: l.id, driver_id: driverId }) : book.call({ load_id: l.id, driver_id: driverId });
  return (
    <View style={s.screen}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {filters.map((f) => (
          <Pressable key={f} onPress={() => setEq(f)} style={[s.chip, { borderColor: eq === f ? C.amber : C.line, backgroundColor: eq === f ? 'rgba(255,182,39,0.12)' : 'transparent' }]}>
            <Text style={[s.chipTxt, { color: eq === f ? C.amber : C.dim }]}>{f === 'all' ? 'ALL' : EQUIP[f]}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <FlatList data={available} style={{ flex: 1 }} contentContainerStyle={s.screenPad}
        keyExtractor={(l) => l.id} ListEmptyComponent={<Empty label="No matching loads." />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item: l }) => (
          <Card>
            <View style={s.rowBetween}>
              <Text style={s.loadRefSm}>{l.ref}</Text>
              <Pill label={EQUIP[l.equipment]} color={equipColor(l.equipment)} />
            </View>
            <View style={[s.rowBetween, { marginTop: 8, alignItems: 'flex-start' }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.lane}>{l.origin}</Text>
                <Text style={s.laneArrow}>↓  {l.miles} mi</Text>
                <Text style={s.lane}>{l.dest}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.rate}>{money(l.rate)}</Text>
                <Text style={s.rpm}>${l.rpm.toFixed(2)}/mi</Text>
              </View>
            </View>
            <Divider />
            <View style={s.rowBetween}>
              <Text style={s.broker}>{l.commodity} · {l.broker}</Text>
              <Btn label={role === 'dispatcher' ? 'Dispatch' : 'Book'} kind="primary" pending={book.pending || dispatch.pending} onPress={() => act(l)} />
            </View>
          </Card>
        )} />
    </View>
  );
}

/* ============================================================ DRIVER: PAY == */
function PayScreen({ driverId }) {
  const { data: settlements } = useLiveQuery('settlements', (q) => q.eq('driver_id', driverId));
  const summary = useRpc('driver_pay_summary');
  useEffect(() => { summary.call({ driver_id: driverId }); }, [driverId]);
  const sum = summary.data;
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <Card>
        <Text style={s.cardTitle}>This period</Text>
        <Text style={s.payBig}>{sum ? money(sum.net) : '—'}</Text>
        <Text style={s.paySub}>net · {sum ? sum.miles.toLocaleString() : '—'} mi · {sum ? '$' + sum.rpm.toFixed(2) + '/mi' : '—'}</Text>
        <View style={s.tileRow}>
          <StatTile label="GROSS" value={sum ? money(sum.gross) : '—'} color={C.green} />
          <StatTile label="PERIODS" value={sum ? sum.periods : '—'} />
        </View>
      </Card>
      <SectionLabel>Settlements</SectionLabel>
      {(settlements || []).map((st) => (
        <Card key={st.id} style={{ marginBottom: 10 }}>
          <View style={s.rowBetween}>
            <Text style={s.cardTitle}>{st.period}</Text>
            <Pill label={titleCase(st.status)} color={statusColor(st.status)} />
          </View>
          <View style={[s.tileRow, { marginTop: 10 }]}>
            <StatTile label="MILES" value={st.miles.toLocaleString()} />
            <StatTile label="GROSS" value={money(st.gross)} />
            <StatTile label="NET" value={money(st.net)} color={C.amber} />
          </View>
        </Card>
      ))}
      {settlements && settlements.length === 0 ? <Empty label="No settlements yet." /> : null}
    </ScrollView>
  );
}

/* =========================================== DISPATCHER: FLEET HOME ======== */
function FleetScreen() {
  const health = useRpc('fleet_health');
  const { data: runs } = useLiveQuery('runs');
  const { data: trucks } = useLiveQuery('trucks');
  useEffect(() => { health.call(); }, []);
  const h = health.data;
  const active = (runs || []).filter((r) => r.status === 'rolling' || r.status === 'planned' || r.status === 'arrived');
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="ROLLING" value={h ? h.trucks_rolling : '—'} color={C.green} />
        <StatTile label="OPEN LOADS" value={h ? h.open_loads : '—'} color={C.amber} />
        <StatTile label="ON-TIME" value={h ? h.on_time_pct + '%' : '—'} color={C.blue} />
      </View>
      <View style={[s.tileRow, { marginTop: 10 }]}>
        <StatTile label="AVAILABLE" value={h ? h.trucks_available : '—'} />
        <StatTile label="IN SHOP" value={h ? h.trucks_maintenance : '—'} color={C.red} />
      </View>
      <SectionLabel right={active.length + ' active'}>Active runs</SectionLabel>
      {active.map((r) => (
        <Card key={r.id} style={{ marginBottom: 10 }}>
          <View style={s.rowBetween}>
            <Text style={s.loadRefSm}>{r.load_ref}</Text>
            <Pill label={titleCase(r.status)} color={statusColor(r.status)} />
          </View>
          <Text style={s.nextStop}>{r.next_stop}</Text>
          <View style={{ height: 8 }} />
          <Bar pct={r.progress} color={statusColor(r.status)} />
          <View style={[s.rowBetween, { marginTop: 8 }]}>
            <Text style={s.metaSm}>{r.driver_id} · {r.truck_id || 'unassigned'}</Text>
            <Text style={s.metaSm}>{r.miles_remaining} mi left</Text>
          </View>
        </Card>
      ))}
      {active.length === 0 ? <Empty label="No active runs." /> : null}
    </ScrollView>
  );
}

/* =========================================== DISPATCHER: DRIVERS =========== */
function DriversScreen() {
  const { data: drivers } = useLiveQuery('drivers');
  return (
    <FlatList data={drivers || []} style={s.screen} contentContainerStyle={s.screenPad}
      keyExtractor={(d) => d.id}
      ListEmptyComponent={<ActivityIndicator color={C.amber} style={{ marginTop: 40 }} />}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item: d }) => {
        const pct = (d.hos_remaining / 660) * 100;
        const warn = d.hos_remaining < 120;
        return (
          <Card>
            <View style={s.rowBetween}>
              <View style={s.rowCenter}>
                <View style={[s.avatar, { backgroundColor: statusColor(d.status) }]}>
                  <Text style={s.avatarTxt}>{d.name.split(' ').map((n) => n[0]).join('')}</Text>
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={s.driverName}>{d.name}</Text>
                  <Text style={s.metaSm}>{d.truck_id} · {d.home_terminal}</Text>
                </View>
              </View>
              <Pill label={titleCase(d.status)} color={statusColor(d.status)} />
            </View>
            <View style={[s.rowBetween, { marginTop: 12, marginBottom: 6 }]}>
              <Text style={s.miniLabel}>HOS · {(d.hos_remaining / 60).toFixed(1)}h</Text>
              <Text style={s.miniLabel}>★ {d.rating.toFixed(1)} · {d.loads_done} loads</Text>
            </View>
            <Bar pct={pct} color={warn ? C.red : C.green} />
          </Card>
        );
      }} />
  );
}

/* ================================================= DISPATCHER: AI AGENTS == */
function AgentsScreen() {
  const { data: agents } = useLiveQuery('agents');
  const act = useEdgeFunction('agent-act');
  return (
    <FlatList data={agents || []} style={s.screen} contentContainerStyle={s.screenPad}
      keyExtractor={(a) => String(a.id)}
      ListHeaderComponent={<Text style={s.agentsIntro}>Humans and AI share the same tools. These agents act over MCP / A2A.</Text>}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      renderItem={({ item: a }) => (
        <Card>
          <View style={s.rowBetween}>
            <View style={s.rowCenter}>
              <View style={[s.dot, { backgroundColor: a.status === 'active' ? C.green : C.faint }]} />
              <Text style={s.agentName}>{a.name}</Text>
            </View>
            <Pill label={a.protocol} color={a.protocol === 'MCP' ? C.green : C.amber} />
          </View>
          <Text style={s.agentRole}>{a.role} · {a.model}</Text>
          <View style={[s.rowBetween, { marginTop: 10 }]}>
            <Text style={s.metaSm}>{a.actions.toLocaleString()} actions</Text>
            <Btn label="Invoke" pending={act.pending} onPress={() => act.call({ agent_id: a.id })} />
          </View>
        </Card>
      )} />
  );
}

/* ============================================================= OWNER: P&L == */
function PLScreen() {
  const weekRev = [142, 168, 155, 201, 189, 215, 234];
  const weekNet = [22, 28, 24, 38, 34, 41, 46];
  const costItems = [
    { label: 'Driver Pay', value: 189400, share: 47.6, color: C.violet },
    { label: 'Fuel', value: 124600, share: 31.3, color: C.amber },
    { label: 'Maintenance', value: 34100, share: 8.6, color: C.orange },
    { label: 'Insurance', value: 28300, share: 7.1, color: C.blue },
    { label: 'Overhead', value: 21800, share: 5.4, color: C.pink },
  ];
  const topLanes = [
    { lane: 'Chicago → Dallas', rpm: 3.24, loads: 18, margin: 22.1 },
    { lane: 'LAX → Phoenix', rpm: 2.98, loads: 12, margin: 19.4 },
    { lane: 'Atlanta → Miami', rpm: 3.11, loads: 9, margin: 17.8 },
    { lane: 'Denver → SLC', rpm: 3.44, loads: 6, margin: 24.6 },
  ];
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <Card>
        <View style={s.rowBetween}>
          <Text style={s.cardTitle}>MTD Revenue</Text>
          <Pill label="Jun 2026" color={C.blue} />
        </View>
        <Text style={[s.payBig, { fontSize: 34, letterSpacing: -1.5 }]}>$847,200</Text>
        <View style={[s.rowBetween, { marginTop: 2 }]}>
          <Text style={s.paySub}>net $154,800 · margin 18.3%</Text>
          <Text style={{ color: C.green, fontSize: 12, fontWeight: '700' }}>↑ 12.4%</Text>
        </View>
        <View style={{ marginTop: 14 }}>
          <SparkBars values={weekRev} color={C.amber} height={38} />
          <View style={[s.rowBetween, { marginTop: 4 }]}>
            <Text style={s.miniLabel}>7-WEEK REVENUE ($K)</Text>
            <Text style={s.miniLabel}>last bar = this week</Text>
          </View>
        </View>
      </Card>
      <View style={[s.tileRow, { marginTop: 12 }]}>
        <StatTile label="YTD REV" value="$9.2M" color={C.green} />
        <StatTile label="YTD NET" value="$1.7M" color={C.amber} />
        <StatTile label="FLEET RPM" value="$3.12" color={C.blue} />
      </View>
      <View style={[s.tileRow, { marginTop: 10 }]}>
        <StatTile label="LOADS MTD" value="284" />
        <StatTile label="MI MTD" value="272K" />
        <StatTile label="CPM" value="$0.57" color={C.dim} />
      </View>
      <SectionLabel>Cost Breakdown — MTD</SectionLabel>
      <Card>
        {costItems.map((c) => (
          <HorizBar key={c.label} label={c.label} value={money(c.value)} pct={c.share} color={c.color} />
        ))}
        <Divider />
        <View style={s.rowBetween}>
          <Text style={[s.metaSm, { color: C.text, fontWeight: '700' }]}>Total Costs</Text>
          <Text style={[s.metaSm, { color: C.red, fontWeight: '700' }]}>$398,200</Text>
        </View>
      </Card>
      <View style={{ marginTop: 14 }}>
        <SparkBars values={weekNet} color={C.teal} height={28} />
        <Text style={[s.miniLabel, { marginTop: 4 }]}>NET MARGIN TREND ($K)</Text>
      </View>
      <SectionLabel>Top Lanes by Margin</SectionLabel>
      {topLanes.map((l) => (
        <Card key={l.lane} style={{ marginBottom: 10 }}>
          <Text style={s.loadRefSm}>{l.lane}</Text>
          <View style={[s.tileRow, { marginTop: 10 }]}>
            <StatTile label="RPM" value={'$' + l.rpm} color={C.amber} />
            <StatTile label="LOADS" value={l.loads} />
            <StatTile label="MARGIN" value={l.margin + '%'} color={C.green} />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

/* =========================================================== OWNER: ASSETS = */
function AssetsScreen() {
  const { data: trucks } = useLiveQuery('trucks');
  const maintain = useEdgeFunction('schedule-pm');
  const trailers = [
    { id: 'TRL-201', type: 'reefer', status: 'active', age_yr: 3.2, next_pm: 'Sep 14', loc: 'Chicago' },
    { id: 'TRL-202', type: 'dry_van', status: 'active', age_yr: 5.8, next_pm: 'Aug 02', loc: 'Dallas TX' },
    { id: 'TRL-203', type: 'flatbed', status: 'maintenance', age_yr: 8.1, next_pm: 'OVERDUE', loc: 'Shop — Joliet' },
    { id: 'TRL-204', type: 'reefer', status: 'active', age_yr: 1.4, next_pm: 'Nov 20', loc: 'En Route I-40' },
    { id: 'TRL-205', type: 'dry_van', status: 'idle', age_yr: 6.5, next_pm: 'Aug 18', loc: 'Yard — Memphis' },
    { id: 'TRL-206', type: 'dry_van', status: 'active', age_yr: 2.9, next_pm: 'Oct 05', loc: 'En Route I-90' },
  ];
  const pmDue = (trucks || []).filter((t) => t.status === 'maintenance').length + 1;
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="TRUCKS" value={(trucks || []).length || 12} />
        <StatTile label="TRAILERS" value="28" />
        <StatTile label="PM DUE" value={pmDue} color={pmDue > 2 ? C.red : C.amber} />
      </View>
      <View style={[s.tileRow, { marginTop: 10 }]}>
        <StatTile label="TRUCK UTIL" value="78%" color={C.green} />
        <StatTile label="TRAILER UTIL" value="91%" color={C.blue} />
        <StatTile label="AVG AGE" value="5.2yr" color={C.dim} />
      </View>
      <SectionLabel right={(trucks || []).length + ' units'}>Power Units</SectionLabel>
      {(trucks || []).map((t) => (
        <Card key={t.id} style={{ marginBottom: 10 }}>
          <View style={s.rowBetween}>
            <Text style={s.loadRefSm}>{t.id}</Text>
            <Pill label={titleCase(t.status)} color={statusColor(t.status)} />
          </View>
          <View style={[s.rowBetween, { marginTop: 6 }]}>
            <Text style={s.metaSm}>{t.make} {t.model} · {t.year}</Text>
            <Text style={s.metaSm}>{(t.odometer || 0).toLocaleString()} mi</Text>
          </View>
          <View style={{ marginTop: 10 }}>
            <View style={[s.rowBetween, { marginBottom: 4 }]}>
              <Text style={s.miniLabel}>ODOMETER UTIL</Text>
              <Text style={[s.miniLabel, { color: t.status === 'maintenance' ? C.red : C.faint }]}>
                {t.status === 'maintenance' ? '⚠ IN SHOP' : 'PM IN 8,200 MI'}
              </Text>
            </View>
            <Bar pct={clamp((t.odometer || 0) / 1500, 0, 100)} color={t.status === 'maintenance' ? C.red : C.blue} />
          </View>
          {t.status === 'maintenance' && (
            <View style={{ marginTop: 10 }}>
              <Btn label="Schedule PM" kind="primary" pending={maintain.pending} onPress={() => maintain.call({ truck_id: t.id })} />
            </View>
          )}
        </Card>
      ))}
      <SectionLabel right="28 trailers">Trailers</SectionLabel>
      {trailers.map((t) => (
        <Card key={t.id} style={{ marginBottom: 8 }}>
          <View style={s.rowBetween}>
            <View style={s.rowCenter}>
              <Pill label={EQUIP[t.type]} color={equipColor(t.type)} />
              <Text style={[s.loadRefSm, { marginLeft: 8 }]}>{t.id}</Text>
            </View>
            <Pill label={titleCase(t.status)} color={statusColor(t.status)} />
          </View>
          <View style={[s.rowBetween, { marginTop: 6 }]}>
            <Text style={s.metaSm}>{t.loc} · {t.age_yr}yr old</Text>
            <Text style={[s.metaSm, { color: t.next_pm === 'OVERDUE' ? C.red : C.faint }]}>PM: {t.next_pm}</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

/* ======================================================= OWNER: COMPLIANCE = */
function ComplianceScreen() {
  const refresh = useEdgeFunction('refresh-csa');
  const basics = [
    { name: 'Unsafe Driving', score: 32, threshold: 65, color: C.green },
    { name: 'HOS Compliance', score: 18, threshold: 65, color: C.green },
    { name: 'Vehicle Maint.', score: 41, threshold: 80, color: C.amber },
    { name: 'Controlled Subs.', score: 0, threshold: 50, color: C.green },
    { name: 'Driver Fitness', score: 9, threshold: 65, color: C.green },
    { name: 'Crash Indicator', score: 22, threshold: 65, color: C.green },
  ];
  const violations = [
    { date: 'Jun 12', driver: 'Marcus Hale', type: 'Form & Manner', severity: 'Warning', citation: '395.8(a)' },
    { date: 'May 28', driver: 'Jordan Kim', type: 'Tire Defect', severity: 'OOS', citation: '393.75(a)' },
    { date: 'May 11', driver: 'Priya Nair', type: 'Log Falsification', severity: 'Critical', citation: '395.8(e)' },
  ];
  const docs = [
    { name: 'MC Operating Authority', status: 'active', expires: 'N/A' },
    { name: 'USDOT Number', status: 'active', expires: 'N/A' },
    { name: 'IFTA License', status: 'active', expires: 'Dec 31, 2026' },
    { name: 'IRP Plates', status: 'active', expires: 'Feb 28, 2027' },
    { name: 'Cargo Insurance', status: 'active', expires: 'Aug 15, 2026' },
    { name: 'Liability Insurance', status: 'warning', expires: 'Jul 02, 2026' },
  ];
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <Card>
        <View style={s.rowBetween}>
          <View>
            <Text style={s.cardTitle}>CSA BASIC Scores</Text>
            <Text style={s.metaSm}>FMCSA SMS · last sync Jun 14</Text>
          </View>
          <Btn label="Sync" sm ghost onPress={() => refresh.call({})} pending={refresh.pending} />
        </View>
        <View style={{ marginTop: 14 }}>
          {basics.map((b) => {
            const ratio = b.score / b.threshold;
            const barColor = ratio > 0.75 ? C.red : ratio > 0.5 ? C.amber : b.color;
            return <HorizBar key={b.name} label={b.name} value={b.score + ' / ' + b.threshold} pct={ratio * 100} color={barColor} />;
          })}
        </View>
      </Card>
      <View style={[s.tileRow, { marginTop: 12 }]}>
        <StatTile label="INSPECTIONS YTD" value="47" color={C.blue} />
        <StatTile label="VIOLATIONS" value="3" color={C.amber} />
        <StatTile label="OOS EVENTS" value="1" color={C.red} />
      </View>
      <SectionLabel right={violations.length + ' YTD'}>Recent Violations</SectionLabel>
      {violations.map((v, i) => (
        <Card key={i} style={{ marginBottom: 10 }}>
          <View style={s.rowBetween}>
            <Text style={s.loadRefSm}>{v.citation}</Text>
            <Pill label={v.severity} color={v.severity === 'OOS' || v.severity === 'Critical' ? C.red : C.amber} />
          </View>
          <Text style={[s.metaSm, { marginTop: 6 }]}>{v.type}</Text>
          <View style={[s.rowBetween, { marginTop: 6 }]}>
            <Text style={s.metaSm}>{v.driver}</Text>
            <Text style={s.metaSm}>{v.date}</Text>
          </View>
        </Card>
      ))}
      <SectionLabel>Credentials & Docs</SectionLabel>
      {docs.map((d) => (
        <Card key={d.name} style={{ marginBottom: 8 }}>
          <View style={s.rowBetween}>
            <Text style={[s.metaSm, { color: C.text, flex: 1 }]}>{d.name}</Text>
            <Pill label={d.status === 'warning' ? 'EXPIRING' : 'ACTIVE'} color={d.status === 'warning' ? C.amber : C.green} />
          </View>
          {d.expires !== 'N/A' && <Text style={[s.metaSm, { marginTop: 4, color: d.status === 'warning' ? C.amber : C.faint }]}>Exp: {d.expires}</Text>}
        </Card>
      ))}
    </ScrollView>
  );
}

/* ======================================================= OWNER: CONTRACTS == */
function ContractsScreen() {
  const contracts = [
    { id: 'CTR-4421', shipper: 'Amazon Freight', lanes: 8, rpm_floor: 2.85, volume: '40 loads/wk', renewal: 'Dec 31', ytd_rev: 2840000, status: 'active' },
    { id: 'CTR-3890', shipper: 'Walmart Transport', lanes: 5, rpm_floor: 3.10, volume: '22 loads/wk', renewal: 'Mar 31', ytd_rev: 1920000, status: 'active' },
    { id: 'CTR-3102', shipper: 'Home Depot Supply', lanes: 3, rpm_floor: 3.24, volume: '12 loads/wk', renewal: 'Jan 15', ytd_rev: 980000, status: 'active' },
    { id: 'CTR-2988', shipper: 'C.H. Robinson Spot', lanes: 12, rpm_floor: 2.60, volume: 'Flexible', renewal: 'Jun 30', ytd_rev: 450000, status: 'warning' },
  ];
  const spotLanes = [
    { lane: 'Memphis → Kansas City', loads: 3, rate: 2890, rpm: 2.98, eq: 'dry_van' },
    { lane: 'Houston → Nashville', loads: 1, rate: 3420, rpm: 3.12, eq: 'reefer' },
    { lane: 'Denver → Salt Lake City', loads: 2, rate: 1640, rpm: 3.44, eq: 'flatbed' },
    { lane: 'Chicago → St. Louis', loads: 4, rate: 1180, rpm: 3.02, eq: 'dry_van' },
  ];
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="CONTRACTS" value="4" />
        <StatTile label="CONTRACT %" value="82%" color={C.blue} />
        <StatTile label="AVG RPM" value="$2.94" color={C.amber} />
      </View>
      <SectionLabel right="4 accounts">Contract Accounts</SectionLabel>
      {contracts.map((c) => (
        <Card key={c.id} style={{ marginBottom: 10 }}>
          <View style={s.rowBetween}>
            <Text style={s.loadRefSm}>{c.shipper}</Text>
            <Pill label={c.status === 'warning' ? 'RENEWING' : 'ACTIVE'} color={c.status === 'warning' ? C.amber : C.green} />
          </View>
          <View style={[s.tileRow, { marginTop: 10 }]}>
            <StatTile label="LANES" value={c.lanes} />
            <StatTile label="RPM FLOOR" value={'$' + c.rpm_floor} color={C.amber} />
            <StatTile label="YTD" value={moneyK(c.ytd_rev)} color={C.green} />
          </View>
          <Divider />
          <View style={s.rowBetween}>
            <Text style={s.metaSm}>{c.volume} · renews {c.renewal}</Text>
            <Btn label="Open" sm ghost onPress={() => {}} />
          </View>
        </Card>
      ))}
      <SectionLabel right={spotLanes.length + ' open'}>Spot Opportunities</SectionLabel>
      {spotLanes.map((l, i) => (
        <Card key={i} style={{ marginBottom: 8 }}>
          <View style={s.rowBetween}>
            <Text style={s.nextStop}>{l.lane}</Text>
            <Pill label={EQUIP[l.eq]} color={equipColor(l.eq)} />
          </View>
          <View style={[s.rowBetween, { marginTop: 8 }]}>
            <Text style={s.rate}>{money(l.rate)}</Text>
            <Text style={s.metaSm}>${l.rpm}/mi · {l.loads} avail</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

/* =========================================================== OWNER: FUEL == */
function FuelScreen() {
  const optimize = useEdgeFunction('fuel-optimize');
  const fuelPrices = [383, 381, 379, 384, 387, 386, 384];
  const defPrices = [71, 70, 72, 71, 73, 72, 73];
  const terminals = [
    { name: 'Chicago Hub', trucks: 5, avg_mpg: 6.9, cpm: 0.557, gallons_mtd: 18400 },
    { name: 'Dallas Hub', trucks: 4, avg_mpg: 7.1, cpm: 0.541, gallons_mtd: 14200 },
    { name: 'Atlanta Yard', trucks: 3, avg_mpg: 6.6, cpm: 0.582, gallons_mtd: 11100 },
  ];
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <Card>
        <View style={s.rowBetween}>
          <Text style={s.cardTitle}>Fuel Overview · MTD</Text>
        </View>
        <View style={[s.tileRow, { marginTop: 12 }]}>
          <StatTile label="AVG DIESEL" value="$3.84" color={C.amber} />
          <StatTile label="FLEET MPG" value="6.8" color={C.green} />
          <StatTile label="CPM" value="$0.57" color={C.dim} />
        </View>
        <View style={{ marginTop: 14 }}>
          <Text style={[s.miniLabel, { marginBottom: 6 }]}>DIESEL PRICE · 7-DAY (¢/gal)</Text>
          <SparkBars values={fuelPrices} color={C.orange} height={32} />
        </View>
        <View style={{ marginTop: 12 }}>
          <Text style={[s.miniLabel, { marginBottom: 6 }]}>DEF PRICE (¢/gal)</Text>
          <SparkBars values={defPrices} color={C.teal} height={20} />
        </View>
      </Card>
      <View style={[s.tileRow, { marginTop: 12 }]}>
        <StatTile label="GAL MTD" value="43.7K" />
        <StatTile label="FUEL COST" value="$124K" color={C.red} />
        <StatTile label="DEF GAL" value="2.1K" color={C.dim} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Btn label="Run fuel network optimization →" kind="primary" pending={optimize.pending} onPress={() => optimize.call({ fleet: 'all' })} />
      </View>
      {optimize.data && <Text style={s.note}>✓ ${optimize.data.savings || '2,140'} saved · {optimize.data.gallons_saved || 558} gal rerouted</Text>}
      <SectionLabel>By Terminal</SectionLabel>
      {terminals.map((t) => (
        <Card key={t.name} style={{ marginBottom: 10 }}>
          <View style={s.rowBetween}>
            <Text style={s.loadRefSm}>{t.name}</Text>
            <Text style={s.metaSm}>{t.trucks} trucks</Text>
          </View>
          <View style={[s.tileRow, { marginTop: 10 }]}>
            <StatTile label="MPG" value={t.avg_mpg} color={C.green} />
            <StatTile label="CPM" value={'$' + t.cpm} color={C.amber} />
            <StatTile label="GAL MTD" value={(t.gallons_mtd / 1000).toFixed(1) + 'K'} />
          </View>
        </Card>
      ))}
      <SectionLabel>Fuel Card Alerts</SectionLabel>
      <Card>
        <View style={s.rowBetween}>
          <Text style={s.metaSm}>T-119 · 148 gal · Abnormal fill</Text>
          <Pill label="REVIEW" color={C.amber} />
        </View>
        <Text style={[s.metaSm, { marginTop: 4, color: C.faint }]}>Jun 13 · Pilot — Oklahoma City · $567</Text>
        <View style={[s.btnRow, { marginTop: 10 }]}>
          <Btn label="Dismiss" flex ghost onPress={() => {}} />
          <Btn label="Flag fraud" flex kind="danger" onPress={() => {}} />
        </View>
      </Card>
    </ScrollView>
  );
}

/* ====================================================== SHIFT: BOARD ======= */
function ShiftBoardScreen() {
  const { data: drivers } = useLiveQuery('drivers');
  const health = useRpc('shift_health');
  useEffect(() => { health.call({ shift: '2nd' }); }, []);
  const h = health.data;
  const onShift = (drivers || []).filter((d) => d.status !== 'off_duty');
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <Card>
        <View style={s.rowBetween}>
          <View>
            <Text style={s.cardTitle}>2nd Shift · 15:00–23:00</Text>
            <Text style={s.metaSm}>Supervisor: River Mason · Joliet Hub</Text>
          </View>
          <Pill label="LIVE" color={C.green} solid />
        </View>
        <View style={[s.tileRow, { marginTop: 12 }]}>
          <StatTile label="CLOCKED IN" value="14" color={C.green} />
          <StatTile label="LOADS OUT" value="12" color={C.blue} />
          <StatTile label="DELIVERIES" value="7" color={C.amber} />
        </View>
        <View style={[s.tileRow, { marginTop: 10 }]}>
          <StatTile label="ON-TIME" value="91%" color={C.green} />
          <StatTile label="OPEN LOADS" value="8" color={C.orange} />
          <StatTile label="EXCEPTIONS" value="3" color={C.red} />
        </View>
        <View style={{ marginTop: 14 }}>
          <SparkBars values={[8, 10, 12, 11, 14, 13, 12]} color={C.violet} height={26} />
          <Text style={[s.miniLabel, { marginTop: 4 }]}>DELIVERIES PER HOUR (SHIFT)</Text>
        </View>
      </Card>
      <SectionLabel right={onShift.length + ' active'}>Driver Status Board</SectionLabel>
      {onShift.map((d) => {
        const pct = (d.hos_remaining / 660) * 100;
        return (
          <Card key={d.id} style={{ marginBottom: 8 }}>
            <View style={s.rowBetween}>
              <View style={s.rowCenter}>
                <View style={[s.avatar, { backgroundColor: statusColor(d.status), width: 32, height: 32, borderRadius: 8 }]}>
                  <Text style={[s.avatarTxt, { fontSize: 11 }]}>{d.name.split(' ').map((n) => n[0]).join('')}</Text>
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={[s.driverName, { fontSize: 14 }]}>{d.name}</Text>
                  <Text style={s.metaSm}>{d.truck_id} · {d.home_terminal}</Text>
                </View>
              </View>
              <Pill label={titleCase(d.status)} color={statusColor(d.status)} />
            </View>
            <View style={{ marginTop: 8 }}>
              <Bar pct={pct} color={pct < 20 ? C.red : C.green} />
              <Text style={[s.miniLabel, { marginTop: 3 }]}>HOS: {(d.hos_remaining / 60).toFixed(1)}h left</Text>
            </View>
          </Card>
        );
      })}
      {onShift.length === 0 && <ActivityIndicator color={C.violet} style={{ marginTop: 40 }} />}
    </ScrollView>
  );
}

/* ======================================================== SHIFT: YARD ====== */
function YardScreen() {
  const doorStatuses = ['empty','loading','sealed','empty','loaded','loading','empty','empty','sealed','loaded','loading','empty','empty','sealed','loaded','empty','loading','empty','loaded','empty'];
  const doors = doorStatuses.map((status, i) => ({ number: i + 1, status, trailer: i % 4 === 0 ? 'TRL-' + (200 + i * 2) : null }));
  const yardTractors = [
    { id: 'YT-01', status: 'active', operator: 'R. Santos', task: 'Spot TRL-214 → Door 7' },
    { id: 'YT-02', status: 'active', operator: 'L. Torres', task: 'Pull Door 12 to outbound' },
    { id: 'YT-03', status: 'available', operator: '—', task: '—' },
    { id: 'YT-04', status: 'available', operator: '—', task: '—' },
  ];
  const doorColor = (st) => ({ loading: C.amber, loaded: C.green, sealed: C.blue, empty: C.faint }[st] || C.faint);
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="LOADING" value={doors.filter((d) => d.status === 'loading').length} color={C.amber} />
        <StatTile label="SEALED" value={doors.filter((d) => d.status === 'sealed').length} color={C.blue} />
        <StatTile label="EMPTY" value={doors.filter((d) => d.status === 'empty').length} color={C.faint} />
      </View>
      <SectionLabel>Dock Door Map — 20 Doors</SectionLabel>
      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {doors.map((d) => (
            <Pressable key={d.number} onPress={() => {}} style={{ width: 46, height: 46, borderRadius: 8, backgroundColor: C.surfaceAlt, borderWidth: 2, borderColor: doorColor(d.status), alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: doorColor(d.status), fontSize: 13, fontWeight: '800' }}>{d.number}</Text>
              <Text style={{ color: C.faint, fontSize: 7, fontWeight: '700', letterSpacing: 0.3 }}>{d.status.slice(0, 4).toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[s.rowCenter, { marginTop: 12, gap: 14, flexWrap: 'wrap' }]}>
          {[['loading', C.amber], ['sealed', C.blue], ['loaded', C.green], ['empty', C.faint]].map(([st, co]) => (
            <View key={st} style={s.rowCenter}>
              <View style={{ width: 8, height: 8, borderRadius: 8, backgroundColor: co, marginRight: 4 }} />
              <Text style={s.miniLabel}>{st}</Text>
            </View>
          ))}
        </View>
      </Card>
      <SectionLabel right="4 units">Yard Tractors</SectionLabel>
      {yardTractors.map((yt) => (
        <Card key={yt.id} style={{ marginBottom: 8 }}>
          <View style={s.rowBetween}>
            <Text style={s.loadRefSm}>{yt.id}</Text>
            <Pill label={titleCase(yt.status)} color={statusColor(yt.status)} />
          </View>
          <Text style={[s.metaSm, { marginTop: 4 }]}>{yt.status === 'active' ? yt.operator + ' · ' + yt.task : 'Available for assignment'}</Text>
        </Card>
      ))}
      <SectionLabel>Hot Trailers</SectionLabel>
      <Card>
        <View style={s.rowBetween}>
          <Text style={s.metaSm}>TRL-201 REEFER · Priority move</Text>
          <Pill label="HOT" color={C.red} solid />
        </View>
        <Text style={[s.metaSm, { marginTop: 4, color: C.faint }]}>Need at Door 4 by 17:30 · Amazon pickup</Text>
        <View style={{ marginTop: 10 }}>
          <Btn label="Assign yard tractor →" kind="primary" onPress={() => {}} />
        </View>
      </Card>
    </ScrollView>
  );
}

/* ===================================================== SHIFT: EXCEPTIONS === */
function ExceptionsScreen() {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const ack = useEdgeFunction('exception-ack');
  const exceptions = [
    { id: 'EXC-001', type: 'Breakdown', driver: 'Marcus Hale', truck: 'T-117', severity: 'critical', msg: 'Engine coolant leak — shoulder I-80 near Joliet. Tow dispatched.', time: 12, status: 'open' },
    { id: 'EXC-002', type: 'HOS Violation', driver: 'Jordan Kim', truck: 'T-103', severity: 'high', msg: 'Driver exceeded 11-hour limit by 34 min. Manual exception filed.', time: 45, status: 'open' },
    { id: 'EXC-003', type: 'Late Pickup', driver: 'Priya Nair', truck: 'T-109', severity: 'high', msg: 'Shipper not ready. ETA pushed 2h. Customer notified.', time: 78, status: 'ack' },
    { id: 'EXC-004', type: 'Detention', driver: 'Sam Torres', truck: 'T-122', severity: 'medium', msg: 'At receiver 3h 12m. Detention billing started. $68/hr.', time: 120, status: 'ack' },
    { id: 'EXC-005', type: 'Route Deviation', driver: 'Alex Reyes', truck: 'T-118', severity: 'medium', msg: 'Driver off route 8.2 mi. Geofence alert triggered.', time: 180, status: 'resolved' },
    { id: 'EXC-006', type: 'Temp Excursion', driver: '—', truck: '—', severity: 'high', msg: 'Load LDR-2291: +4°F vs spec on arrival. Walmart DC filing claim.', time: 220, status: 'open' },
  ];
  const sevColor = { critical: C.red, high: C.orange, medium: C.amber, low: C.dim };
  const filtered = filter === 'all' ? exceptions : exceptions.filter((e) => e.severity === filter || e.status === filter);
  return (
    <View style={s.screen}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {['all', 'open', 'critical', 'high'].map((f) => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[s.chip, { borderColor: filter === f ? C.orange : C.line, backgroundColor: filter === f ? 'rgba(251,146,60,0.12)' : 'transparent' }]}>
            <Text style={[s.chipTxt, { color: filter === f ? C.orange : C.dim }]}>{f.toUpperCase()}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
        <View style={s.tileRow}>
          <StatTile label="CRITICAL" value={exceptions.filter((e) => e.severity === 'critical').length} color={C.red} />
          <StatTile label="HIGH" value={exceptions.filter((e) => e.severity === 'high').length} color={C.orange} />
          <StatTile label="OPEN" value={exceptions.filter((e) => e.status === 'open').length} color={C.amber} />
        </View>
        {filtered.map((e) => (
          <Card key={e.id} style={{ marginTop: 10, borderColor: e.severity === 'critical' ? C.red + '50' : C.line }}>
            <Pressable onPress={() => setExpanded(expanded === e.id ? null : e.id)}>
              <View style={s.rowBetween}>
                <View style={s.rowCenter}>
                  <View style={[s.dot, { backgroundColor: sevColor[e.severity] }]} />
                  <Text style={s.cardTitle}>{e.type}</Text>
                </View>
                <Pill label={e.status.toUpperCase()} color={e.status === 'resolved' ? C.green : e.status === 'ack' ? C.blue : C.red} />
              </View>
              <Text style={[s.metaSm, { marginTop: 6, lineHeight: 17 }]}>{e.msg}</Text>
              <View style={[s.rowBetween, { marginTop: 6 }]}>
                <Text style={s.metaSm}>{e.driver !== '—' ? e.driver + ' · ' + e.truck : 'System alert'}</Text>
                <Text style={s.metaSm}>{ago(e.time)}</Text>
              </View>
            </Pressable>
            {expanded === e.id && e.status === 'open' && (
              <View style={[s.btnRow, { marginTop: 10 }]}>
                <Btn label="Acknowledge" flex ghost onPress={() => ack.call({ id: e.id, action: 'ack' })} pending={ack.pending} />
                <Btn label="Escalate" flex kind="danger" onPress={() => ack.call({ id: e.id, action: 'escalate' })} pending={ack.pending} />
              </View>
            )}
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

/* ===================================================== SHIFT: SCHEDULE ===== */
function ScheduleScreen() {
  const [day, setDay] = useState(0);
  const days = ['Mon 6/16', 'Tue 6/17', 'Wed 6/18', 'Thu 6/19'];
  const shifts = [
    { shift: '1st · 07:00–15:00', drivers: ['Marcus Hale', 'Priya Nair', 'Sam Torres', 'Alex Reyes', 'Jordan Kim'], open: 0 },
    { shift: '2nd · 15:00–23:00', drivers: ['Dana Wei', 'Chris Beck', 'Pat Liu', 'Morgan Roy'], open: 2 },
    { shift: '3rd · 23:00–07:00', drivers: ['Taylor Cruz', 'Quinn Hall'], open: 3 },
  ];
  const callouts = [
    { driver: 'Riley Ford', shift: '2nd', reason: 'Sick call', time: '14:22' },
    { driver: 'Casey Lin', shift: '3rd', reason: 'Personal', time: '11:05' },
  ];
  const otDrivers = [
    { name: 'Marcus Hale', hrs: 38.5, color: C.green },
    { name: 'Dana Wei', hrs: 43.2, color: C.amber },
    { name: 'Priya Nair', hrs: 47.8, color: C.red },
  ];
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[s.filterBar, { marginHorizontal: -16, marginBottom: 16 }]} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {days.map((d, i) => (
          <Pressable key={d} onPress={() => setDay(i)} style={[s.chip, { borderColor: day === i ? C.violet : C.line, backgroundColor: day === i ? 'rgba(167,139,250,0.12)' : 'transparent' }]}>
            <Text style={[s.chipTxt, { color: day === i ? C.violet : C.dim }]}>{d}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={s.tileRow}>
        <StatTile label="SHIFTS" value="3" />
        <StatTile label="SCHEDULED" value="11" color={C.green} />
        <StatTile label="OPEN SLOTS" value="5" color={C.red} />
      </View>
      {callouts.length > 0 && (
        <>
          <SectionLabel>Call-outs Today</SectionLabel>
          {callouts.map((c) => (
            <Card key={c.driver} style={{ marginBottom: 8, borderColor: C.red + '40' }}>
              <View style={s.rowBetween}>
                <Text style={s.driverName}>{c.driver}</Text>
                <Pill label={c.shift + ' shift'} color={C.red} />
              </View>
              <View style={[s.rowBetween, { marginTop: 6 }]}>
                <Text style={s.metaSm}>{c.reason}</Text>
                <Text style={s.metaSm}>{c.time}</Text>
              </View>
              <View style={{ marginTop: 10 }}>
                <Btn label="Find replacement →" kind="primary" onPress={() => {}} />
              </View>
            </Card>
          ))}
        </>
      )}
      <SectionLabel>{days[day]} — All Shifts</SectionLabel>
      {shifts.map((sh) => (
        <Card key={sh.shift} style={{ marginBottom: 10 }}>
          <View style={s.rowBetween}>
            <Text style={s.cardTitle}>{sh.shift}</Text>
            {sh.open > 0 && <Pill label={sh.open + ' OPEN'} color={C.red} />}
          </View>
          <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {sh.drivers.map((d) => (
              <View key={d} style={{ backgroundColor: C.surfaceAlt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: C.text, fontSize: 11, fontWeight: '600' }}>{d}</Text>
              </View>
            ))}
            {Array.from({ length: sh.open }).map((_, i) => (
              <View key={'open-' + i} style={{ borderWidth: 1, borderColor: C.red, borderStyle: 'dashed', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: C.red, fontSize: 11, fontWeight: '600' }}>OPEN SLOT</Text>
              </View>
            ))}
          </View>
        </Card>
      ))}
      <SectionLabel>Overtime Watch</SectionLabel>
      <Card>
        {otDrivers.map((d, i) => (
          <View key={d.name} style={[s.rowBetween, { marginBottom: i < otDrivers.length - 1 ? 10 : 0 }]}>
            <Text style={s.metaSm}>{d.name}</Text>
            <View style={[s.rowCenter, { gap: 8 }]}>
              <Text style={[s.metaSm, { color: d.color }]}>{d.hrs}h WTD</Text>
              {d.hrs > 40 && <Pill label={d.hrs > 45 ? 'OT' : 'WATCH'} color={d.color} />}
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

/* ======================================================= SHIFT: COMMS ====== */
function CommsScreen() {
  const broadcast = useEdgeFunction('broadcast-message');
  const [msg, setMsg] = useState('');
  const messages = [
    { from: 'Marcus Hale', text: 'Arrived at shipper, waiting for lumper.', time: '14:42', type: 'in' },
    { from: 'System', text: 'ETA update: LDR-2291 now 16:45 (was 15:30).', time: '14:38', type: 'sys' },
    { from: 'Priya Nair', text: 'Can I take I-90? Construction on planned route.', time: '14:31', type: 'in' },
    { from: 'River Mason', text: 'Confirmed — proceed via I-90 ramp at exit 18.', time: '14:32', type: 'out' },
    { from: 'Jordan Kim', text: 'Fuel card declined at Pilot Loves Park.', time: '14:11', type: 'in' },
    { from: 'River Mason', text: 'Use backup card ending 4421. Ops will reconcile end of shift.', time: '14:14', type: 'out' },
    { from: 'System', text: 'Geofence departure: T-103 left Chicago Distribution Center.', time: '13:58', type: 'sys' },
  ];
  const macros = ['10-4 Confirmed', 'ETA updated', 'Call dispatch', 'Card approved', 'PM approved'];
  return (
    <View style={s.screen}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
        {messages.map((m, i) => (
          <View key={i} style={{ marginBottom: 10, alignItems: m.type === 'out' ? 'flex-end' : 'flex-start' }}>
            <View style={{ backgroundColor: m.type === 'sys' ? C.surfaceAlt : m.type === 'out' ? C.amber : C.surface3, borderRadius: 8, borderBottomLeftRadius: m.type === 'in' ? 3 : 12, borderBottomRightRadius: m.type === 'out' ? 3 : 12, padding: 10, maxWidth: '82%', borderWidth: 1, borderColor: m.type === 'sys' ? C.line : 'transparent' }}>
              {m.type !== 'out' && <Text style={{ color: m.type === 'sys' ? C.blue : C.dim, fontSize: 10, fontWeight: '700', marginBottom: 3 }}>{m.from}</Text>}
              <Text style={{ color: m.type === 'out' ? C.bg : C.text, fontSize: 13, fontWeight: '500', lineHeight: 18 }}>{m.text}</Text>
            </View>
            <Text style={{ color: C.faint, fontSize: 10, marginTop: 3, marginHorizontal: 4 }}>{m.time}</Text>
          </View>
        ))}
        <SectionLabel>Quick Macros</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
          {macros.map((m) => (
            <Pressable key={m} onPress={() => setMsg(m)} style={{ backgroundColor: C.surfaceAlt, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.line }}>
              <Text style={{ color: C.dim, fontSize: 11, fontWeight: '600' }}>{m}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: C.line, gap: 8 }}>
        <TextInput value={msg} onChangeText={setMsg} placeholder="Broadcast to all on shift…" placeholderTextColor={C.faint} style={{ backgroundColor: C.surfaceAlt, borderRadius: 8, padding: 12, color: C.text, fontSize: 13, borderWidth: 1, borderColor: C.line }} />
        <Btn label="Broadcast to shift" kind="primary" pending={broadcast.pending} onPress={() => { if (msg.trim()) { broadcast.call({ message: msg, shift: '2nd' }); setMsg(''); } }} />
      </View>
    </View>
  );
}

/* ================================================== ML OPS: MODEL PERF ===== */
function ModelsScreen() {
  const [selected, setSelected] = useState(0);
  const retrain = useEdgeFunction('model-retrain');
  const models = [
    { name: 'ETA Predictor', version: 'v3.2', status: 'active', framework: 'XGBoost', features: 84, accuracy: 94.1, mae: 12.4, p50: 18, p99: 87, rps: 42800, drift: 0.021, trained: '4 days ago', hist: [91.2, 92.0, 91.8, 93.4, 93.9, 94.1, 94.1], champion: true },
    { name: 'Route Optimizer', version: 'v2.1', status: 'active', framework: 'OR-Tools+NN', features: 127, accuracy: 88.7, mae: null, p50: 142, p99: 890, rps: 8200, drift: 0.044, trained: '12 days ago', hist: [84.1, 85.2, 86.3, 87.0, 88.1, 88.4, 88.7], champion: true },
    { name: 'Load Matcher', version: 'v1.8', status: 'active', framework: 'LightGBM', features: 61, accuracy: 91.3, mae: null, p50: 34, p99: 120, rps: 18400, drift: 0.088, trained: '21 days ago', hist: [88.0, 89.1, 89.8, 90.2, 90.9, 91.1, 91.3], champion: true },
    { name: 'Demand Forecast', version: 'v4.0', status: 'training', framework: 'Prophet+Transformer', features: 38, accuracy: 79.2, mae: 2.1, p50: 8, p99: 31, rps: 2100, drift: 0.012, trained: 'Training now', hist: [72.1, 74.3, 75.8, 76.9, 78.0, 79.0, 79.2], champion: false },
    { name: 'Rate Engine', version: 'v1.4', status: 'active', framework: 'CatBoost', features: 52, accuracy: 96.8, mae: 0.18, p50: 11, p99: 44, rps: 31000, drift: 0.005, trained: '2 days ago', hist: [94.2, 94.9, 95.3, 95.8, 96.1, 96.5, 96.8], champion: true },
  ];
  const m = models[selected];
  const driftWarn = m.drift > 0.05;
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[s.filterBar, { marginHorizontal: -16, marginBottom: 12 }]} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {models.map((mo, i) => (
          <Pressable key={i} onPress={() => setSelected(i)} style={[s.chip, { borderColor: selected === i ? C.violet : C.line, backgroundColor: selected === i ? 'rgba(167,139,250,0.12)' : 'transparent' }]}>
            <Text style={[s.chipTxt, { color: selected === i ? C.violet : C.dim }]}>{mo.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Card>
        <View style={s.rowBetween}>
          <View>
            <Text style={s.cardTitle}>{m.name} {m.version}</Text>
            <Text style={s.metaSm}>{m.framework} · {m.features} features</Text>
          </View>
          <Pill label={m.champion ? 'CHAMPION' : titleCase(m.status)} color={m.champion ? C.amber : statusColor(m.status)} />
        </View>
        <View style={[s.tileRow, { marginTop: 12 }]}>
          <StatTile label="ACCURACY" value={m.accuracy + '%'} color={m.accuracy > 90 ? C.green : C.amber} />
          <StatTile label="P50 ms" value={m.p50} color={C.blue} />
          <StatTile label="P99 ms" value={m.p99} />
        </View>
        <View style={{ marginTop: 14 }}>
          <View style={[s.rowBetween, { marginBottom: 6 }]}>
            <Text style={s.miniLabel}>ACCURACY · 7-DAY TREND</Text>
            <Text style={[s.miniLabel, { color: C.green }]}>+{(m.hist[6] - m.hist[0]).toFixed(1)}pp</Text>
          </View>
          <SparkBars values={m.hist} color={C.violet} height={36} />
        </View>
        <Divider />
        <View style={s.rowBetween}>
          <View>
            <Text style={s.miniLabel}>DATA DRIFT (PSI)</Text>
            <Text style={[s.miniVal, { fontSize: 18, color: driftWarn ? C.red : C.green }]}>{m.drift.toFixed(3)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.miniLabel}>REQ / DAY</Text>
            <Text style={[s.miniVal, { fontSize: 18 }]}>{(m.rps / 1000).toFixed(1)}K</Text>
          </View>
        </View>
        {driftWarn && <Text style={s.warn}>⚠ Drift threshold exceeded — retrain recommended</Text>}
        <Text style={[s.metaSm, { marginTop: 8, color: C.faint }]}>Last trained: {m.trained}</Text>
        <View style={{ marginTop: 10 }}>
          <Btn label="Trigger retrain" ghost pending={retrain.pending} onPress={() => retrain.call({ model: m.name, version: m.version })} />
        </View>
      </Card>
      <SectionLabel>Shadow Challenger</SectionLabel>
      <Card>
        <View style={s.rowBetween}>
          <Text style={s.metaSm}>{m.name} v{(parseFloat(m.version.slice(1)) + 0.1).toFixed(1)} — Candidate</Text>
          <Pill label="SHADOW" color={C.blue} />
        </View>
        <Text style={[s.metaSm, { marginTop: 6, color: C.faint }]}>5% traffic · 3-day test · acc {(m.accuracy + 0.4).toFixed(1)}%</Text>
        <View style={[s.btnRow, { marginTop: 10 }]}>
          <Btn label="Promote" flex kind="primary" onPress={() => {}} />
          <Btn label="Rollback" flex kind="danger" onPress={() => {}} />
        </View>
      </Card>
    </ScrollView>
  );
}

/* ==================================================== ML OPS: AUTOML ======= */
function AutoMLScreen() {
  const launch = useEdgeFunction('automl-launch');
  const jobs = [
    { id: 'JOB-4421', name: 'ETA v3.3 — Hyper Sweep', status: 'running', algo: 'XGBoost', trials: 247, trials_max: 500, best: 94.6, gpu_hrs: 18.4, started: '10:14', leaderboard: [94.6, 94.3, 94.1, 93.9, 93.7] },
    { id: 'JOB-4419', name: 'Load Matcher v2 — NAS', status: 'running', algo: 'Neural Arch Search', trials: 89, trials_max: 200, best: 92.8, gpu_hrs: 42.1, started: '05:23', leaderboard: [92.8, 92.4, 91.9, 91.7, 91.3] },
    { id: 'JOB-4415', name: 'Route Opt v3 — Ensemble', status: 'completed', algo: 'AutoEnsemble', trials: 400, trials_max: 400, best: 90.2, gpu_hrs: 96.0, started: 'Jun 15', leaderboard: [90.2, 89.8, 89.5, 89.1, 88.7] },
    { id: 'JOB-4410', name: 'Rate Engine v1.5 — Feature Sel.', status: 'completed', algo: 'CatBoost + Boruta', trials: 300, trials_max: 300, best: 97.1, gpu_hrs: 22.8, started: 'Jun 14', leaderboard: [97.1, 96.9, 96.8, 96.6, 96.3] },
  ];
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="RUNNING" value={jobs.filter((j) => j.status === 'running').length} color={C.blue} />
        <StatTile label="COMPLETED" value={jobs.filter((j) => j.status === 'completed').length} color={C.green} />
        <StatTile label="GPU-HRS" value="179" color={C.violet} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Btn label="Launch new AutoML job →" kind="primary" pending={launch.pending} onPress={() => launch.call({ type: 'sweep', model: 'eta' })} />
      </View>
      {launch.data && <Text style={s.note}>✓ {launch.data.job_id} queued · est. {launch.data.runtime}</Text>}
      <SectionLabel>Jobs</SectionLabel>
      {jobs.map((j) => {
        const prog = (j.trials / j.trials_max) * 100;
        return (
          <Card key={j.id} style={{ marginBottom: 12 }}>
            <View style={s.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{j.name}</Text>
                <Text style={s.metaSm}>{j.algo} · {j.id}</Text>
              </View>
              <Pill label={titleCase(j.status)} color={statusColor(j.status)} />
            </View>
            <View style={[s.tileRow, { marginTop: 10 }]}>
              <StatTile label="BEST" value={j.best + '%'} color={C.green} />
              <StatTile label="TRIALS" value={j.trials + '/' + j.trials_max} />
              <StatTile label="GPU-HRS" value={j.gpu_hrs} color={C.violet} />
            </View>
            <View style={{ marginTop: 12 }}>
              <View style={[s.rowBetween, { marginBottom: 4 }]}>
                <Text style={s.miniLabel}>PROGRESS</Text>
                <Text style={s.miniLabel}>{prog.toFixed(0)}%</Text>
              </View>
              <Bar pct={prog} color={j.status === 'completed' ? C.green : C.blue} />
            </View>
            <View style={{ marginTop: 12, gap: 5 }}>
              <Text style={s.miniLabel}>TOP 5 CONFIGS</Text>
              {j.leaderboard.map((score, i) => (
                <View key={i} style={[s.rowCenter, { gap: 8 }]}>
                  <Text style={[s.miniLabel, { width: 18, color: C.faint }]}>#{i + 1}</Text>
                  <View style={{ flex: 1, height: 4, borderRadius: 8, backgroundColor: C.surfaceAlt }}>
                    <View style={{ height: 4, borderRadius: 8, width: ((score - 88) / 10 * 100) + '%', backgroundColor: i === 0 ? C.green : C.dim + '80' }} />
                  </View>
                  <Text style={[s.miniLabel, { color: i === 0 ? C.green : C.faint, width: 38, textAlign: 'right' }]}>{score}%</Text>
                </View>
              ))}
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

/* ================================================= ML OPS: ORCHESTRATE ===== */
function OrchestrateScreen() {
  const orchestrate = useEdgeFunction('orchestrate');
  const act = useEdgeFunction('agent-act');
  const roster = [
    { id: 1, name: 'RouteBot', role: 'Route opt & rerouting', model: 'GPT-4o', protocol: 'MCP', status: 'active', acts_hr: 142, success: 98.2, p50: 320, tools: ['maps_api', 'weather', 'toll_data', 'hos_engine'] },
    { id: 2, name: 'DispatchAI', role: 'Load assignment & driver match', model: 'Claude 3.5 Sonnet', protocol: 'A2A', status: 'active', acts_hr: 88, success: 97.1, p50: 480, tools: ['load_board', 'driver_scores', 'rate_engine', 'book_load'] },
    { id: 3, name: 'FuelOptimizer', role: 'Fuel network & surcharges', model: 'Gemini 1.5 Pro', protocol: 'MCP', status: 'active', acts_hr: 24, success: 99.4, p50: 180, tools: ['fuel_prices', 'route_planner', 'card_auth'] },
    { id: 4, name: 'ComplianceWatcher', role: 'HOS, FMCSA, DOT compliance', model: 'Claude 3 Haiku', protocol: 'REST', status: 'active', acts_hr: 210, success: 99.9, p50: 42, tools: ['hos_engine', 'driver_logs', 'csa_api', 'alert_push'] },
    { id: 5, name: 'RateEngine', role: 'Dynamic rate quoting', model: 'GPT-4o-mini', protocol: 'A2A', status: 'idle', acts_hr: 31, success: 96.3, p50: 95, tools: ['market_rates', 'dat_api', 'truckerpath', 'contract_store'] },
    { id: 6, name: 'ETAForecaster', role: 'Real-time arrival prediction', model: 'XGBoost (local)', protocol: 'gRPC', status: 'active', acts_hr: 1840, success: 99.8, p50: 18, tools: ['gps_stream', 'traffic_api', 'weather', 'eta_model'] },
    { id: 7, name: 'DocumentParser', role: 'BOL, POD, invoice OCR', model: 'Claude 3.5 Sonnet', protocol: 'MCP', status: 'active', acts_hr: 64, success: 98.7, p50: 1100, tools: ['ocr_engine', 'doc_store', 'tms_api'] },
  ];
  const taskQueue = [
    { id: 'T-9012', agent: 'RouteBot', task: 'Reroute T-117 around I-80 closure', priority: 'critical', status: 'running' },
    { id: 'T-9011', agent: 'DispatchAI', task: 'Match LDR-2301 to available drivers', priority: 'high', status: 'running' },
    { id: 'T-9010', agent: 'ComplianceWatcher', task: 'Audit 6h HOS for all active drivers', priority: 'medium', status: 'queued' },
    { id: 'T-9009', agent: 'FuelOptimizer', task: 'Optimize fuel stops — 8 westbound runs', priority: 'low', status: 'queued' },
    { id: 'T-9008', agent: 'RateEngine', task: 'Re-quote spot lane CHI→DAL', priority: 'medium', status: 'done' },
  ];
  const protoColor = { MCP: C.green, A2A: C.amber, REST: C.blue, gRPC: C.violet };
  const priColor = { critical: C.red, high: C.orange, medium: C.amber, low: C.dim };
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="AGENTS" value={roster.filter((a) => a.status === 'active').length + ' / ' + roster.length} color={C.green} />
        <StatTile label="ACTS/HR" value={roster.reduce((t, a) => t + a.acts_hr, 0).toLocaleString()} color={C.amber} />
        <StatTile label="AVG SUCCESS" value="98.5%" color={C.blue} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Btn label="Full orchestration cycle →" kind="primary" pending={orchestrate.pending} onPress={() => orchestrate.call({ scope: 'all' })} />
      </View>
      {orchestrate.data && <Text style={s.note}>✓ Cycle complete · {orchestrate.data.actions_taken || 47} actions taken</Text>}
      <SectionLabel right={roster.length + ' agents'}>Agent Roster</SectionLabel>
      {roster.map((a) => (
        <Card key={a.id} style={{ marginBottom: 10 }}>
          <View style={s.rowBetween}>
            <View style={s.rowCenter}>
              <View style={[s.dot, { backgroundColor: a.status === 'active' ? C.green : C.faint }]} />
              <Text style={s.agentName}>{a.name}</Text>
            </View>
            <Pill label={a.protocol} color={protoColor[a.protocol] || C.dim} />
          </View>
          <Text style={s.agentRole}>{a.role}</Text>
          <Text style={[s.metaSm, { color: C.faint, marginTop: 1 }]}>{a.model}</Text>
          <View style={[s.tileRow, { marginTop: 10 }]}>
            <StatTile label="ACTS/HR" value={a.acts_hr.toLocaleString()} color={C.amber} />
            <StatTile label="SUCCESS" value={a.success + '%'} color={C.green} />
            <StatTile label="P50 ms" value={a.p50} color={C.blue} />
          </View>
          <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
            {a.tools.map((t) => <Tag key={t} label={t} />)}
          </View>
        </Card>
      ))}
      <SectionLabel right={taskQueue.length + ' tasks'}>Task Queue</SectionLabel>
      {taskQueue.map((t) => (
        <Card key={t.id} style={{ marginBottom: 8 }}>
          <View style={s.rowBetween}>
            <Text style={s.metaSm}>{t.id} · <Text style={{ color: C.cyan }}>{t.agent}</Text></Text>
            <Pill label={t.status.toUpperCase()} color={statusColor(t.status)} />
          </View>
          <Text style={[s.metaSm, { color: C.text, marginTop: 4 }]}>{t.task}</Text>
          <View style={[s.rowCenter, { marginTop: 6, gap: 6 }]}>
            <View style={[s.dot, { backgroundColor: priColor[t.priority], width: 8, height: 8 }]} />
            <Text style={[s.miniLabel, { color: priColor[t.priority] }]}>{t.priority.toUpperCase()} PRIORITY</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

/* ================================================= ML OPS: FEATURE STORE == */
function FeaturesScreen() {
  const refresh = useEdgeFunction('feature-refresh');
  const groups = [
    { name: 'driver_features', count: 28, freshness: '< 1 min', drift: 0.012, pipeline: 'kafka_realtime', last: '14:47:02' },
    { name: 'load_features', count: 41, freshness: '< 1 min', drift: 0.008, pipeline: 'kafka_realtime', last: '14:47:01' },
    { name: 'route_features', count: 67, freshness: '2 min', drift: 0.034, pipeline: 'flink_stream', last: '14:45:18' },
    { name: 'market_features', count: 19, freshness: '5 min', drift: 0.019, pipeline: 'dbt_batch', last: '14:42:00' },
    { name: 'weather_features', count: 14, freshness: '10 min', drift: 0.003, pipeline: 'external_api', last: '14:37:54' },
    { name: 'shipper_features', count: 32, freshness: '1 hr', drift: 0.091, pipeline: 'dbt_batch', last: '13:47:00' },
    { name: 'equipment_features', count: 22, freshness: '< 1 min', drift: 0.007, pipeline: 'kafka_realtime', last: '14:47:00' },
    { name: 'geo_features', count: 55, freshness: '15 min', drift: 0.024, pipeline: 'spark_streaming', last: '14:32:09' },
  ];
  const topFeatures = [
    { feature: 'driver.hos_remaining', imp: 0.142, model: 'ETA Predictor' },
    { feature: 'route.traffic_index', imp: 0.118, model: 'ETA Predictor' },
    { feature: 'load.weight_lbs', imp: 0.097, model: 'Load Matcher' },
    { feature: 'market.spot_rate_lane', imp: 0.088, model: 'Load Matcher' },
    { feature: 'driver.rating', imp: 0.074, model: 'Load Matcher' },
    { feature: 'weather.precip_prob', imp: 0.063, model: 'ETA Predictor' },
    { feature: 'route.toll_cost_est', imp: 0.058, model: 'Route Optimizer' },
    { feature: 'geo.cluster_density', imp: 0.051, model: 'Route Optimizer' },
  ];
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="GROUPS" value={groups.length} />
        <StatTile label="FEATURES" value={groups.reduce((t, g) => t + g.count, 0)} color={C.blue} />
        <StatTile label="PIPELINES" value="5" color={C.violet} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Btn label="Refresh all pipelines" ghost pending={refresh.pending} onPress={() => refresh.call({ scope: 'all' })} />
      </View>
      {refresh.data && <Text style={s.note}>✓ All pipelines triggered · ETA 45s</Text>}
      <SectionLabel>Feature Groups</SectionLabel>
      {groups.map((g) => {
        const driftWarn = g.drift > 0.07;
        return (
          <Card key={g.name} style={{ marginBottom: 8 }}>
            <View style={s.rowBetween}>
              <Text style={s.cardTitle}>{g.name}</Text>
              <Pill label={driftWarn ? 'DRIFT ⚠' : 'HEALTHY'} color={driftWarn ? C.amber : C.green} />
            </View>
            <View style={[s.rowBetween, { marginTop: 5 }]}>
              <Text style={s.metaSm}>{g.count} feats · {g.pipeline}</Text>
              <Text style={s.metaSm}>{g.freshness}</Text>
            </View>
            <View style={[s.rowCenter, { marginTop: 8, gap: 8 }]}>
              <View style={{ flex: 1, height: 5, borderRadius: 8, backgroundColor: C.surfaceAlt }}>
                <View style={{ height: 5, borderRadius: 8, width: clamp(g.drift * 600, 0, 100) + '%', backgroundColor: g.drift > 0.07 ? C.red : g.drift > 0.04 ? C.amber : C.green }} />
              </View>
              <Text style={[s.miniLabel, { color: driftWarn ? C.red : C.faint, width: 52 }]}>ψ={g.drift.toFixed(3)}</Text>
            </View>
          </Card>
        );
      })}
      <SectionLabel>Feature Importance Ranking</SectionLabel>
      <Card>
        {topFeatures.map((f, i) => (
          <View key={f.feature} style={{ marginBottom: i < topFeatures.length - 1 ? 12 : 0 }}>
            <View style={[s.rowBetween, { marginBottom: 3 }]}>
              <Text style={[s.metaSm, { flex: 1 }]}>{f.feature}</Text>
              <Text style={[s.miniLabel, { color: C.violet }]}>{f.imp.toFixed(3)}</Text>
            </View>
            <View style={{ height: 4, borderRadius: 8, backgroundColor: C.surfaceAlt }}>
              <View style={{ height: 4, borderRadius: 8, width: (f.imp / 0.15 * 100) + '%', backgroundColor: C.violet }} />
            </View>
            <Text style={[s.miniLabel, { marginTop: 2, color: C.faint }]}>{f.model}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

/* ================================================= ML OPS: ANOMALY DET. ==== */
function AnomalyScreen() {
  const ack = useEdgeFunction('anomaly-ack');
  const [expanded, setExpanded] = useState(null);
  const anomalies = [
    { id: 'ANO-8821', type: 'ETA Deviation', entity: 'Run LDR-2291', score: 0.94, sev: 'critical', delta: '+147 min vs model prediction', driver: 'Marcus Hale', time: 8, status: 'open', shap: [{ f: 'hos_remaining', v: -0.42 }, { f: 'traffic_index', v: -0.31 }, { f: 'weather.precip', v: -0.14 }] },
    { id: 'ANO-8820', type: 'Fuel Spike', entity: 'T-103', score: 0.87, sev: 'high', delta: '+38% consumption vs 30-day baseline', driver: 'Jordan Kim', time: 34, status: 'open', shap: [{ f: 'idle_time_hr', v: -0.58 }, { f: 'mpg_7day', v: -0.22 }, { f: 'load_weight', v: -0.09 }] },
    { id: 'ANO-8819', type: 'Route Deviation', entity: 'Run LDR-2287', score: 0.73, sev: 'medium', delta: '11.4 mi off planned route polygon', driver: 'Alex Reyes', time: 62, status: 'ack', shap: [{ f: 'geofence_exit', v: -0.66 }, { f: 'road_closure', v: 0.21 }] },
    { id: 'ANO-8818', type: 'HOS Pattern', entity: 'Driver D-1044', score: 0.69, sev: 'medium', delta: '3 consecutive max-duty cycles', driver: 'Priya Nair', time: 180, status: 'ack', shap: [{ f: 'duty_streak', v: -0.71 }, { f: 'rest_quality', v: -0.18 }] },
    { id: 'ANO-8817', type: 'Rate Anomaly', entity: 'Load LDR-2280', score: 0.62, sev: 'low', delta: '$0.41/mi below contract floor', driver: '—', time: 310, status: 'resolved', shap: [{ f: 'spot_rate', v: -0.49 }, { f: 'lane_rpm', v: -0.28 }] },
    { id: 'ANO-8816', type: 'Temp Excursion', entity: 'Run LDR-2275', score: 0.91, sev: 'high', delta: '+4.2°F over 22min — reefer alarm', driver: 'Sam Torres', time: 420, status: 'resolved', shap: [{ f: 'reefer_setpoint', v: -0.54 }, { f: 'door_open_time', v: -0.33 }] },
  ];
  const sevColor = { critical: C.red, high: C.orange, medium: C.amber, low: C.dim };
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="OPEN" value={anomalies.filter((a) => a.status === 'open').length} color={C.red} />
        <StatTile label="TODAY" value={anomalies.length} color={C.amber} />
        <StatTile label="MAX SCORE" value="0.94" color={C.red} />
      </View>
      <View style={{ marginTop: 14 }}>
        <Text style={s.miniLabel}>ANOMALY SCORE DISTRIBUTION (TODAY)</Text>
        <SparkBars values={[0.62, 0.69, 0.73, 0.87, 0.91, 0.94, 0.87]} color={C.red} height={28} />
      </View>
      <SectionLabel>Live Anomaly Feed</SectionLabel>
      {anomalies.map((a) => (
        <Card key={a.id} style={{ marginBottom: 10, borderColor: a.sev === 'critical' ? C.red + '50' : C.line }}>
          <Pressable onPress={() => setExpanded(expanded === a.id ? null : a.id)}>
            <View style={s.rowBetween}>
              <View style={s.rowCenter}>
                <View style={[s.dot, { backgroundColor: sevColor[a.sev], width: 10, height: 10 }]} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={s.cardTitle}>{a.type}</Text>
                  <Text style={s.metaSm}>{a.entity}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.tileVal, { fontSize: 20, color: sevColor[a.sev] }]}>{(a.score * 100).toFixed(0)}</Text>
                <Text style={s.miniLabel}>SCORE</Text>
              </View>
            </View>
            <Text style={[s.metaSm, { marginTop: 6, color: C.dim }]}>{a.delta}</Text>
            <View style={[s.rowBetween, { marginTop: 6 }]}>
              <Text style={s.metaSm}>{a.driver !== '—' ? a.driver : 'System'} · {ago(a.time)}</Text>
              <Pill label={a.status.toUpperCase()} color={a.status === 'resolved' ? C.green : a.status === 'ack' ? C.blue : C.red} />
            </View>
          </Pressable>
          {expanded === a.id && (
            <View style={{ marginTop: 12 }}>
              <Text style={s.miniLabel}>SHAP ATTRIBUTION</Text>
              {a.shap.map((sh, i) => (
                <View key={i} style={{ marginTop: 8 }}>
                  <View style={[s.rowBetween, { marginBottom: 3 }]}>
                    <Text style={s.metaSm}>{sh.f}</Text>
                    <Text style={[s.metaSm, { color: sh.v < 0 ? C.red : C.green }]}>{sh.v > 0 ? '+' : ''}{sh.v.toFixed(2)}</Text>
                  </View>
                  <View style={{ height: 4, borderRadius: 8, backgroundColor: C.surfaceAlt }}>
                    <View style={{ height: 4, borderRadius: 8, width: clamp(Math.abs(sh.v) / 0.7 * 100, 0, 100) + '%', backgroundColor: sh.v < 0 ? C.red : C.green }} />
                  </View>
                </View>
              ))}
              {a.status === 'open' && (
                <View style={[s.btnRow, { marginTop: 12 }]}>
                  <Btn label="Acknowledge" flex ghost pending={ack.pending} onPress={() => ack.call({ id: a.id, action: 'ack' })} />
                  <Btn label="Suppress 24h" flex kind="danger" pending={ack.pending} onPress={() => ack.call({ id: a.id, action: 'suppress' })} />
                </View>
              )}
            </View>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}

/* ======================================================= ML OPS: RL POLICY = */
function RLScreen() {
  const deploy = useEdgeFunction('rl-deploy');
  const policies = [
    { name: 'DispatchRL', version: 'v2.3', status: 'active', env: 'TenFourEnv-v4', episodes: 8470, best_r: 0.8821, mean_r: 0.8619, base_r: 0.7412, algo: 'PPO', action_space: 'discrete(48)', obs_space: 'Box(284,)', improvement: '+18.9%', hist: [0.74, 0.76, 0.79, 0.81, 0.84, 0.86, 0.88] },
    { name: 'FuelRouteRL', version: 'v1.1', status: 'training', env: 'FuelEnv-v2', episodes: 2140, best_r: 0.7330, mean_r: 0.7108, base_r: 0.6510, algo: 'SAC', action_space: 'continuous(8)', obs_space: 'Box(118,)', improvement: '+12.6%', hist: [0.65, 0.66, 0.68, 0.70, 0.71, 0.72, 0.73] },
    { name: 'YardRL', version: 'v0.4', status: 'training', env: 'YardEnv-v1', episodes: 480, best_r: 0.5810, mean_r: 0.5490, base_r: 0.4820, algo: 'DQN', action_space: 'discrete(20)', obs_space: 'Box(62,)', improvement: '+20.5%', hist: [0.48, 0.49, 0.51, 0.53, 0.56, 0.57, 0.58] },
  ];
  const actionDist = [
    { label: 'Assign load', pct: 34 },
    { label: 'Hold driver', pct: 22 },
    { label: 'Reroute', pct: 18 },
    { label: 'Swap truck', pct: 14 },
    { label: 'Call off-duty', pct: 8 },
    { label: 'Other', pct: 4 },
  ];
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="POLICIES" value={policies.length} />
        <StatTile label="EPISODES" value="11.1K" color={C.violet} />
        <StatTile label="ENV STEPS" value="5.2M" color={C.teal} />
      </View>
      <SectionLabel>Policies</SectionLabel>
      {policies.map((p) => (
        <Card key={p.name} style={{ marginBottom: 12 }}>
          <View style={s.rowBetween}>
            <View>
              <Text style={s.cardTitle}>{p.name} {p.version}</Text>
              <Text style={s.metaSm}>{p.algo} · {p.env}</Text>
            </View>
            <Pill label={titleCase(p.status)} color={statusColor(p.status)} />
          </View>
          <View style={[s.tileRow, { marginTop: 12 }]}>
            <StatTile label="BEST R" value={p.best_r.toFixed(3)} color={C.green} />
            <StatTile label="MEAN R" value={p.mean_r.toFixed(3)} color={C.blue} />
            <StatTile label="VS BASE" value={p.improvement} color={C.amber} />
          </View>
          <View style={{ marginTop: 14 }}>
            <View style={[s.rowBetween, { marginBottom: 6 }]}>
              <Text style={s.miniLabel}>REWARD CURVE · {p.episodes.toLocaleString()} eps</Text>
              <Text style={[s.miniLabel, { color: C.teal }]}>↑ converging</Text>
            </View>
            <SparkBars values={p.hist.map((v) => v * 100)} color={C.teal} height={34} />
            <View style={[s.rowBetween, { marginTop: 4 }]}>
              <Text style={s.miniLabel}>base: {p.base_r.toFixed(3)}</Text>
              <Text style={s.miniLabel}>best: {p.best_r.toFixed(3)}</Text>
            </View>
          </View>
          <Divider />
          <View style={s.rowBetween}>
            <View>
              <Text style={s.miniLabel}>ACTION SPACE</Text>
              <Text style={[s.miniVal, { fontSize: 12, marginTop: 2 }]}>{p.action_space}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.miniLabel}>OBS SPACE</Text>
              <Text style={[s.miniVal, { fontSize: 12, marginTop: 2 }]}>{p.obs_space}</Text>
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <Btn label={p.status === 'active' ? 'Force policy update' : 'Deploy to production →'} kind={p.status !== 'active' ? 'primary' : 'ghost'} pending={deploy.pending} onPress={() => deploy.call({ policy: p.name, version: p.version })} />
          </View>
        </Card>
      ))}
      <SectionLabel>Action Distribution · DispatchRL v2.3</SectionLabel>
      <Card>
        {actionDist.map((a) => <HorizBar key={a.label} label={a.label} value={a.pct + '%'} pct={a.pct} color={C.violet} />)}
      </Card>
      <SectionLabel>Recent Episodes</SectionLabel>
      <Card>
        {[
          { ep: 8470, r: 0.8821, steps: 1844, note: 'Optimal dispatch · 0 violations' },
          { ep: 8469, r: 0.8714, steps: 2012, note: '1 reroute · +4% fuel saved' },
          { ep: 8468, r: 0.8801, steps: 1778, note: 'Optimal dispatch · 0 violations' },
          { ep: 8467, r: 0.8589, steps: 2244, note: 'HOS constraint triggered · 2 adjustments' },
        ].map((e, i) => (
          <View key={e.ep} style={{ marginBottom: i < 3 ? 10 : 0 }}>
            <View style={s.rowBetween}>
              <Text style={s.metaSm}>Episode #{e.ep}</Text>
              <Text style={[s.metaSm, { color: C.green }]}>R = {e.r.toFixed(4)}</Text>
            </View>
            <Text style={[s.metaSm, { color: C.faint, marginTop: 2 }]}>{e.steps.toLocaleString()} steps · {e.note}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

/* ======================================================= OWNER: CASH FLOW == */
function CashFlowScreen() {
  const apRefresh = useEdgeFunction('ar-ap-refresh');
  const accounts = [
    { name: 'Chase Operating', balance: 284610, type: 'checking', change: +12400 },
    { name: 'Chase Payroll', balance: 94200, type: 'checking', change: -48000 },
    { name: 'OOIDA Reserve', balance: 510000, type: 'savings', change: 0 },
    { name: 'Fuel Card Float', balance: 28450, type: 'prepaid', change: -4200 },
  ];
  const arBuckets = [
    { label: 'Current (0-30d)', amount: 184200, pct: 58, color: C.green },
    { label: '31-60 days', amount: 72400, pct: 23, color: C.amber },
    { label: '61-90 days', amount: 38100, pct: 12, color: C.orange },
    { label: '90+ days', amount: 21800, pct: 7, color: C.red },
  ];
  const apDue = [
    { vendor: 'TravelCenters of America', amount: 18400, due: 'Jun 18', type: 'fuel' },
    { vendor: 'Great West Casualty', amount: 12800, due: 'Jun 20', type: 'insurance' },
    { vendor: 'Navistar Financial', amount: 8240, due: 'Jun 25', type: 'truck payment' },
    { vendor: 'Kenworth Chicago', amount: 4100, due: 'Jun 30', type: 'parts' },
    { vendor: 'Comdata', amount: 14000, due: 'Jul 01', type: 'fuel card' },
  ];
  const totalCash = accounts.reduce((t, a) => t + a.balance, 0);
  const totalAR = arBuckets.reduce((t, b) => t + b.amount, 0);
  const totalAP = apDue.reduce((t, a) => t + a.amount, 0);
  const runway = Math.floor(totalCash / (totalAP / 30));
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="TOTAL CASH" value={moneyK(totalCash)} color={C.green} />
        <StatTile label="AR BALANCE" value={moneyK(totalAR)} color={C.blue} />
        <StatTile label="AP DUE 30D" value={moneyK(totalAP)} color={C.amber} />
      </View>
      <View style={[s.tileRow, { marginTop: 10 }]}>
        <StatTile label="RUNWAY" value={runway + 'd'} color={runway < 45 ? C.red : C.green} />
        <StatTile label="DSO" value="38d" color={C.amber} />
        <StatTile label="QUICK RATIO" value="1.42" color={C.blue} />
      </View>
      <SectionLabel>Bank Accounts</SectionLabel>
      {accounts.map((a) => (
        <Card key={a.name} style={{ marginBottom: 8 }}>
          <View style={s.rowBetween}>
            <Text style={[s.cardTitle, { flex: 1 }]}>{a.name}</Text>
            <Tag label={a.type.toUpperCase()} />
          </View>
          <View style={[s.rowBetween, { marginTop: 8 }]}>
            <Text style={[s.payBig, { fontSize: 22, marginTop: 0 }]}>{money(a.balance)}</Text>
            <Text style={[s.metaSm, { color: a.change >= 0 ? C.green : C.red }]}>{a.change >= 0 ? '↑' : '↓'} {money(Math.abs(a.change))} 7d</Text>
          </View>
        </Card>
      ))}
      <SectionLabel right={moneyK(totalAR)}>AR Aging</SectionLabel>
      <Card>
        {arBuckets.map((b) => <HorizBar key={b.label} label={b.label} value={money(b.amount)} pct={b.pct} color={b.color} />)}
        <Divider />
        <View style={s.rowBetween}>
          <Text style={[s.metaSm, { color: C.red }]}>Overdue: {money(arBuckets[2].amount + arBuckets[3].amount)}</Text>
          <Btn label="Refresh" ghost sm pending={apRefresh.pending} onPress={() => apRefresh.call({})} />
        </View>
      </Card>
      <SectionLabel right={moneyK(totalAP)}>AP Due — Next 30 Days</SectionLabel>
      {apDue.map((ap) => (
        <Card key={ap.vendor} style={{ marginBottom: 8 }}>
          <View style={s.rowBetween}>
            <Text style={[s.metaSm, { color: C.text, flex: 1 }]}>{ap.vendor}</Text>
            <Text style={[s.metaSm, { color: C.red, fontWeight: '800' }]}>{money(ap.amount)}</Text>
          </View>
          <View style={[s.rowBetween, { marginTop: 4 }]}>
            <Text style={s.miniLabel}>{ap.type}</Text>
            <Text style={[s.miniLabel, { color: C.amber }]}>Due {ap.due}</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

/* ============================================================= OWNER: HR ==== */
function HRScreen() {
  const hire = useEdgeFunction('post-job');
  const drivers = [
    { name: 'Marcus Hale', tenure: 3.2, loads_ytd: 142, rpm: 3.18, safety: 98, retention: 'low_risk' },
    { name: 'Jordan Kim', tenure: 1.1, loads_ytd: 88, rpm: 2.94, safety: 91, retention: 'watch' },
    { name: 'Priya Nair', tenure: 4.8, loads_ytd: 201, rpm: 3.24, safety: 99, retention: 'low_risk' },
    { name: 'Sam Torres', tenure: 0.4, loads_ytd: 44, rpm: 2.82, safety: 84, retention: 'high_risk' },
    { name: 'Alex Reyes', tenure: 2.1, loads_ytd: 118, rpm: 3.11, safety: 95, retention: 'low_risk' },
    { name: 'Dana Wei', tenure: 0.7, loads_ytd: 62, rpm: 2.97, safety: 89, retention: 'watch' },
  ];
  const pipeline = [
    { name: 'Taylor Okonkwo', stage: 'Offer Out', exp_yr: 4, applied: 'Jun 12' },
    { name: 'Jamie Sutton', stage: 'Background', exp_yr: 8, applied: 'Jun 09' },
    { name: 'Morgan Bliss', stage: 'Drug Screen', exp_yr: 2, applied: 'Jun 14' },
    { name: 'Riley Park', stage: 'Road Test', exp_yr: 6, applied: 'Jun 11' },
  ];
  const stageColor = (st) => ({ 'Offer Out': C.green, 'Background': C.blue, 'Drug Screen': C.amber, 'Road Test': C.violet }[st] || C.dim);
  const retColor = (r) => ({ low_risk: C.green, watch: C.amber, high_risk: C.red }[r] || C.dim);
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="HEADCOUNT" value="14" />
        <StatTile label="RETENTION" value="82%" color={C.green} />
        <StatTile label="AVG TENURE" value="2.1yr" color={C.blue} />
      </View>
      <View style={[s.tileRow, { marginTop: 10 }]}>
        <StatTile label="OPEN SEATS" value="3" color={C.amber} />
        <StatTile label="PIPELINE" value={pipeline.length} color={C.violet} />
        <StatTile label="TURNOVER YTD" value="18%" color={C.orange} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Btn label="Post CDL-A opening →" kind="primary" pending={hire.pending} onPress={() => hire.call({ role: 'driver', class: 'A' })} />
      </View>
      {hire.data && <Text style={s.note}>✓ Posted to DAT, CDLjobs, Indeed · #{hire.data.job_id}</Text>}
      <SectionLabel right={pipeline.length + ' candidates'}>Hiring Pipeline</SectionLabel>
      {pipeline.map((c) => (
        <Card key={c.name} style={{ marginBottom: 8 }}>
          <View style={s.rowBetween}>
            <View>
              <Text style={s.driverName}>{c.name}</Text>
              <Text style={s.metaSm}>CDL-A · {c.exp_yr}yr exp · Applied {c.applied}</Text>
            </View>
            <Pill label={c.stage} color={stageColor(c.stage)} />
          </View>
        </Card>
      ))}
      <SectionLabel>Driver Scorecards</SectionLabel>
      {drivers.map((d) => (
        <Card key={d.name} style={{ marginBottom: 10 }}>
          <View style={s.rowBetween}>
            <View style={s.rowCenter}>
              <View style={[s.avatar, { backgroundColor: retColor(d.retention) }]}>
                <Text style={s.avatarTxt}>{d.name.split(' ').map((n) => n[0]).join('')}</Text>
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={s.driverName}>{d.name}</Text>
                <Text style={s.metaSm}>{d.tenure}yr · {d.loads_ytd} loads YTD</Text>
              </View>
            </View>
            <Pill label={d.retention.replace('_', ' ').toUpperCase()} color={retColor(d.retention)} />
          </View>
          <View style={[s.tileRow, { marginTop: 10 }]}>
            <StatTile label="RPM" value={'$' + d.rpm} color={C.amber} />
            <StatTile label="SAFETY" value={d.safety + '%'} color={d.safety > 95 ? C.green : d.safety > 88 ? C.amber : C.red} />
            <StatTile label="TENURE" value={d.tenure + 'yr'} />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

/* ======================================================= OWNER: INSURANCE === */
function InsuranceScreen() {
  const claimAct = useEdgeFunction('file-claim');
  const policies = [
    { name: 'Primary Liability', carrier: 'Great West Casualty', limit: '1M/2M CSL', premium_ann: 186000, expires: 'Aug 15, 2026' },
    { name: 'Cargo Insurance', carrier: 'Travelers Inland Marine', limit: '$250K/occurrence', premium_ann: 34200, expires: 'Aug 15, 2026' },
    { name: 'Physical Damage', carrier: 'Sentry Insurance', limit: 'ACV + trailer floater', premium_ann: 28800, expires: 'Aug 15, 2026' },
    { name: 'Gen. Liability', carrier: 'Zurich North America', limit: '$1M/$2M', premium_ann: 8400, expires: 'Dec 31, 2026' },
    { name: 'Bobtail / NTL', carrier: 'Old Republic', limit: '$1M', premium_ann: 4100, expires: 'Aug 15, 2026' },
  ];
  const claims = [
    { id: 'CLM-2241', type: 'Cargo Damage', status: 'open', filed: 'Jun 01', amount: 18400, reserve: 22000 },
    { id: 'CLM-2198', type: 'Rear-end collision', status: 'settled', filed: 'Mar 14', amount: 84000, reserve: 0 },
    { id: 'CLM-2140', type: 'Cargo Shortage', status: 'closed', filed: 'Jan 22', amount: 4200, reserve: 0 },
  ];
  const telematics = [
    { driver: 'Marcus Hale', hard_brake: 2, hard_accel: 1, speeding_min: 4, score: 96 },
    { driver: 'Jordan Kim', hard_brake: 8, hard_accel: 5, speeding_min: 18, score: 81 },
    { driver: 'Sam Torres', hard_brake: 14, hard_accel: 9, speeding_min: 34, score: 68 },
    { driver: 'Alex Reyes', hard_brake: 3, hard_accel: 2, speeding_min: 7, score: 94 },
  ];
  const totalPremium = policies.reduce((t, p) => t + p.premium_ann, 0);
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="ANN PREMIUM" value={moneyK(totalPremium)} color={C.red} />
        <StatTile label="OPEN CLAIMS" value={claims.filter((c) => c.status === 'open').length} color={C.orange} />
        <StatTile label="LOSS RATIO" value="42%" color={C.green} />
      </View>
      <View style={[s.tileRow, { marginTop: 10 }]}>
        <StatTile label="OPEN RESERVE" value={moneyK(claims.filter((c) => c.status === 'open').reduce((t, c) => t + c.reserve, 0))} color={C.amber} />
        <StatTile label="5YR TREND" value="-8%" color={C.green} />
        <StatTile label="FLEET SCORE" value="88" color={C.blue} />
      </View>
      <SectionLabel>Policies</SectionLabel>
      {policies.map((p) => (
        <Card key={p.name} style={{ marginBottom: 8 }}>
          <View style={s.rowBetween}>
            <Text style={[s.cardTitle, { flex: 1 }]}>{p.name}</Text>
            <Text style={[s.metaSm, { color: C.amber }]}>{moneyK(p.premium_ann)}/yr</Text>
          </View>
          <View style={[s.rowBetween, { marginTop: 4 }]}>
            <Text style={s.metaSm}>{p.carrier}</Text>
            <Text style={[s.miniLabel, { color: C.faint }]}>Exp {p.expires}</Text>
          </View>
          <Text style={[s.metaSm, { color: C.faint, marginTop: 2 }]}>{p.limit}</Text>
        </Card>
      ))}
      <SectionLabel right={claims.length + ' total'}>Claims History</SectionLabel>
      {claims.map((c) => (
        <Card key={c.id} style={{ marginBottom: 8 }}>
          <View style={s.rowBetween}>
            <Text style={s.loadRefSm}>{c.id}</Text>
            <Pill label={c.status.toUpperCase()} color={c.status === 'open' ? C.amber : c.status === 'settled' ? C.red : C.faint} />
          </View>
          <Text style={[s.metaSm, { marginTop: 4, color: C.text }]}>{c.type} · Filed {c.filed}</Text>
          <View style={[s.rowBetween, { marginTop: 4 }]}>
            <Text style={[s.metaSm, { color: c.status === 'open' ? C.orange : C.faint }]}>{money(c.amount)}</Text>
            {c.reserve > 0 && <Text style={[s.metaSm, { color: C.red }]}>Reserve: {money(c.reserve)}</Text>}
          </View>
        </Card>
      ))}
      <SectionLabel>Telematics Safety Scores</SectionLabel>
      <Card>
        {telematics.map((t, i) => (
          <View key={t.driver} style={{ marginBottom: i < telematics.length - 1 ? 14 : 0 }}>
            <View style={[s.rowBetween, { marginBottom: 5 }]}>
              <Text style={[s.metaSm, { color: C.text }]}>{t.driver}</Text>
              <Text style={[s.metaSm, { color: t.score > 90 ? C.green : t.score > 80 ? C.amber : C.red, fontWeight: '800' }]}>{t.score}</Text>
            </View>
            <Bar pct={t.score} color={t.score > 90 ? C.green : t.score > 80 ? C.amber : C.red} />
            <View style={[s.rowCenter, { marginTop: 5, gap: 12 }]}>
              <Text style={s.miniLabel}>Brake: {t.hard_brake}</Text>
              <Text style={s.miniLabel}>Accel: {t.hard_accel}</Text>
              <Text style={s.miniLabel}>Speed: {t.speeding_min}min</Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

/* ======================================================= SHIFT: SAFETY ====== */
function SafetyScreen() {
  const submitDvir = useEdgeFunction('submit-dvir');
  const dvirs = [
    { truck: 'T-117', driver: 'Marcus Hale', status: 'pass', defects: 0, time: '06:12', odometer: 489214 },
    { truck: 'T-103', driver: 'Jordan Kim', status: 'defect', defects: 2, time: '06:44', odometer: 512089, items: ['Left turn signal — inop', 'Wipers — streaking'] },
    { truck: 'T-109', driver: 'Priya Nair', status: 'pass', defects: 0, time: '07:01', odometer: 476331 },
    { truck: 'T-122', driver: 'Sam Torres', status: 'pass', defects: 0, time: '07:18', odometer: 391244 },
    { truck: 'T-118', driver: 'Alex Reyes', status: 'defect', defects: 1, time: '07:22', odometer: 428771, items: ['ABS warning light — on'] },
    { truck: 'T-104', driver: '—', status: 'pending', defects: 0, time: '—', odometer: null },
  ];
  const incidents = [
    { date: 'Jun 14', type: 'Near Miss', truck: 'T-103', description: 'Close following — I-88 construction zone', severity: 'low' },
    { date: 'Jun 12', type: 'Cargo Shift', truck: 'T-119', description: 'Load shifted on I-80 ramp; re-secured at TA', severity: 'medium' },
    { date: 'Jun 10', type: 'Breakdown', truck: 'T-117', description: 'Coolant leak; towed to KW Chicago', severity: 'high', open: true },
  ];
  const sevColor = (sv) => ({ high: C.red, medium: C.amber, low: C.dim }[sv] || C.dim);
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="DVIR PASS" value={dvirs.filter((d) => d.status === 'pass').length} color={C.green} />
        <StatTile label="DEFECTS" value={dvirs.filter((d) => d.status === 'defect').length} color={C.red} />
        <StatTile label="PENDING" value={dvirs.filter((d) => d.status === 'pending').length} color={C.amber} />
      </View>
      <View style={[s.tileRow, { marginTop: 10 }]}>
        <StatTile label="DAYS SAFE" value="142" color={C.green} />
        <StatTile label="DEFECT RATE" value="8.3%" color={C.amber} />
        <StatTile label="COACHING MTD" value="4" color={C.blue} />
      </View>
      <SectionLabel right={dvirs.length + ' units'}>Pre-Trip DVIRs — Today</SectionLabel>
      {dvirs.map((d) => (
        <Card key={d.truck} style={{ marginBottom: 8, borderColor: d.status === 'defect' ? C.red + '50' : C.line }}>
          <View style={s.rowBetween}>
            <Text style={s.loadRefSm}>{d.truck}</Text>
            <Pill label={d.status.toUpperCase()} color={d.status === 'pass' ? C.green : d.status === 'defect' ? C.red : C.amber} />
          </View>
          <View style={[s.rowBetween, { marginTop: 5 }]}>
            <Text style={s.metaSm}>{d.driver}</Text>
            <Text style={s.metaSm}>{d.time !== '—' ? d.time + ' · ' + (d.odometer || 0).toLocaleString() + ' mi' : '—'}</Text>
          </View>
          {d.items && (
            <View style={{ marginTop: 8 }}>
              {d.items.map((item, i) => (
                <View key={i} style={[s.rowCenter, { marginBottom: 3 }]}>
                  <View style={[s.dot, { backgroundColor: C.red, width: 6, height: 6 }]} />
                  <Text style={[s.metaSm, { color: C.red, marginLeft: 6 }]}>{item}</Text>
                </View>
              ))}
              <View style={{ marginTop: 8 }}>
                <Btn label="Flag for maintenance" kind="danger" sm onPress={() => submitDvir.call({ truck: d.truck })} pending={submitDvir.pending} />
              </View>
            </View>
          )}
        </Card>
      ))}
      <SectionLabel>Incident Log</SectionLabel>
      {incidents.map((inc, i) => (
        <Card key={i} style={{ marginBottom: 8 }}>
          <View style={s.rowBetween}>
            <Text style={s.cardTitle}>{inc.type}</Text>
            <Pill label={inc.severity.toUpperCase()} color={sevColor(inc.severity)} />
          </View>
          <Text style={[s.metaSm, { marginTop: 6, color: C.text, lineHeight: 17 }]}>{inc.description}</Text>
          <View style={[s.rowBetween, { marginTop: 6 }]}>
            <Text style={s.metaSm}>{inc.truck} · {inc.date}</Text>
            {inc.open && <Pill label="OPEN" color={C.orange} />}
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

/* ================================================= SHIFT: LOAD PLANNING ===== */
function LoadPlanningScreen() {
  const autoplan = useEdgeFunction('plan-loads');
  const unplanned = [
    { ref: 'LDR-2308', origin: 'Chicago, IL', dest: 'Kansas City, MO', miles: 512, weight: 41200, cube: 88, eq: 'dry_van', pickup: '18:00', rate: 1480 },
    { ref: 'LDR-2309', origin: 'Joliet, IL', dest: 'Nashville, TN', miles: 468, weight: 38400, cube: 76, eq: 'reefer', pickup: '19:30', rate: 1820 },
    { ref: 'LDR-2310', origin: 'Chicago, IL', dest: 'Detroit, MI', miles: 284, weight: 44800, cube: 95, eq: 'dry_van', pickup: '20:00', rate: 890 },
    { ref: 'LDR-2311', origin: 'Gary, IN', dest: 'Columbus, OH', miles: 338, weight: 29100, cube: 62, eq: 'flatbed', pickup: '21:00', rate: 1140 },
  ];
  const relays = [
    { load: 'LDR-2301', hand: 'Bolingbrook, IL', d1: 'Marcus Hale', d2: 'Dana Wei', savings: 180 },
    { load: 'LDR-2298', hand: 'Indianapolis, IN', d1: 'Jordan Kim', d2: 'Pat Liu', savings: 210 },
  ];
  const avail = [
    { name: 'Dana Wei', hos: 9.4, truck: 'T-105', eq: 'dry_van' },
    { name: 'Chris Beck', hos: 7.1, truck: 'T-112', eq: 'reefer' },
    { name: 'Pat Liu', hos: 6.8, truck: 'T-108', eq: 'dry_van' },
    { name: 'Morgan Roy', hos: 10.2, truck: 'T-116', eq: 'flatbed' },
  ];
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="UNPLANNED" value={unplanned.length} color={C.amber} />
        <StatTile label="AVAIL DRIVERS" value={avail.length} color={C.green} />
        <StatTile label="RELAY OPT." value={relays.length} color={C.violet} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Btn label="Auto-plan all loads →" kind="primary" pending={autoplan.pending} onPress={() => autoplan.call({ shift: '2nd' })} />
      </View>
      {autoplan.data && <Text style={s.note}>✓ {autoplan.data.assigned || 4} assigned · {autoplan.data.savings_mi || 84} mi saved</Text>}
      <SectionLabel right={avail.length + ' drivers'}>Available Drivers</SectionLabel>
      {avail.map((d) => (
        <Card key={d.name} style={{ marginBottom: 8 }}>
          <View style={s.rowBetween}>
            <View>
              <Text style={s.driverName}>{d.name}</Text>
              <Text style={s.metaSm}>{d.truck} · {d.eq.replace('_', ' ')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Pill label="AVAILABLE" color={C.green} />
              <Text style={[s.miniLabel, { marginTop: 5, color: d.hos < 7 ? C.amber : C.faint }]}>{d.hos}h HOS</Text>
            </View>
          </View>
        </Card>
      ))}
      <SectionLabel right={unplanned.length + ' loads'}>Unplanned Loads</SectionLabel>
      {unplanned.map((l) => (
        <Card key={l.ref} style={{ marginBottom: 10 }}>
          <View style={s.rowBetween}>
            <Text style={s.loadRefSm}>{l.ref}</Text>
            <Pill label={EQUIP[l.eq]} color={equipColor(l.eq)} />
          </View>
          <Text style={s.lane}>{l.origin}</Text>
          <Text style={s.laneArrow}>↓  {l.miles} mi</Text>
          <Text style={s.lane}>{l.dest}</Text>
          <View style={[s.tileRow, { marginTop: 10 }]}>
            <StatTile label="WEIGHT" value={(l.weight / 1000).toFixed(0) + 'K lbs'} />
            <StatTile label="CUBE" value={l.cube + '%'} color={l.cube > 90 ? C.amber : C.green} />
            <StatTile label="RATE" value={money(l.rate)} color={C.amber} />
          </View>
          <View style={[s.rowBetween, { marginTop: 8 }]}>
            <Text style={s.metaSm}>Pickup: {l.pickup}</Text>
            <Btn label="Assign →" sm kind="primary" onPress={() => {}} />
          </View>
        </Card>
      ))}
      <SectionLabel>Relay Opportunities</SectionLabel>
      {relays.map((r) => (
        <Card key={r.load} style={{ marginBottom: 8, borderColor: C.violet + '50' }}>
          <View style={s.rowBetween}>
            <Text style={s.loadRefSm}>{r.load}</Text>
            <Pill label="RELAY" color={C.violet} />
          </View>
          <Text style={[s.metaSm, { marginTop: 6 }]}>Hand at {r.hand}</Text>
          <Text style={[s.metaSm, { color: C.faint }]}>{r.d1}  ⇌  {r.d2}</Text>
          <Text style={[s.metaSm, { color: C.green, marginTop: 4 }]}>Save {money(r.savings)}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

/* ======================================================= ML OPS: INFERENCE == */
function InferenceScreen() {
  const scale = useEdgeFunction('inference-scale');
  const endpoints = [
    { name: 'eta-predictor-v3', model: 'ETA Predictor v3.2', status: 'healthy', replicas: 4, rps: 142, p50: 18, p99: 87, error_rate: 0.002, gpu: 'A10G ×4' },
    { name: 'load-matcher-v1', model: 'Load Matcher v1.8', status: 'healthy', replicas: 2, rps: 61, p50: 34, p99: 120, error_rate: 0.004, gpu: 'A10G ×2' },
    { name: 'rate-engine-v1', model: 'Rate Engine v1.4', status: 'healthy', replicas: 3, rps: 103, p50: 11, p99: 44, error_rate: 0.001, gpu: 'A100 ×3' },
    { name: 'route-opt-v2', model: 'Route Optimizer v2.1', status: 'degraded', replicas: 2, rps: 27, p50: 142, p99: 1240, error_rate: 0.018, gpu: 'A100 ×2' },
    { name: 'demand-forecast', model: 'Demand Forecast v4.0', status: 'healthy', replicas: 1, rps: 7, p50: 8, p99: 31, error_rate: 0, gpu: 'T4 ×1' },
    { name: 'dispatch-rl-v2', model: 'DispatchRL v2.3', status: 'healthy', replicas: 2, rps: 34, p50: 42, p99: 188, error_rate: 0.003, gpu: 'A10G ×2' },
  ];
  const routing = [
    { rule: 'High-lat fallback', trigger: 'p99 > 800ms → route-opt-lite', active: true },
    { rule: 'Shadow 5% to v3.3', trigger: '5% traffic → eta-predictor-v3.3-cand', active: true },
    { rule: 'Canary → rate v1.5', trigger: '10% traffic → rate-engine-v1.5', active: false },
  ];
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="ENDPOINTS" value={endpoints.length} />
        <StatTile label="DEGRADED" value={endpoints.filter((e) => e.status === 'degraded').length} color={C.red} />
        <StatTile label="TOTAL RPS" value={endpoints.reduce((t, e) => t + e.rps, 0)} color={C.blue} />
      </View>
      <View style={[s.tileRow, { marginTop: 10 }]}>
        <StatTile label="AVG P50 ms" value={Math.round(endpoints.reduce((t, e) => t + e.p50, 0) / endpoints.length)} color={C.green} />
        <StatTile label="GPU FLEET" value="14" color={C.violet} />
        <StatTile label="ERR RATE" value="0.5%" color={C.amber} />
      </View>
      <SectionLabel>Endpoints</SectionLabel>
      {endpoints.map((e) => {
        const warn = e.status === 'degraded' || e.error_rate > 0.01;
        return (
          <Card key={e.name} style={{ marginBottom: 10, borderColor: warn ? C.red + '50' : C.line }}>
            <View style={s.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { fontSize: 12, fontFamily: 'monospace' }]}>{e.name}</Text>
                <Text style={s.metaSm}>{e.model}</Text>
              </View>
              <Pill label={e.status.toUpperCase()} color={e.status === 'healthy' ? C.green : C.red} />
            </View>
            <View style={[s.tileRow, { marginTop: 10 }]}>
              <StatTile label="RPS" value={e.rps} color={C.blue} />
              <StatTile label="P50 ms" value={e.p50} color={C.green} />
              <StatTile label="P99 ms" value={e.p99} color={e.p99 > 500 ? C.red : C.dim} />
            </View>
            <View style={[s.rowBetween, { marginTop: 8 }]}>
              <Text style={s.metaSm}>{e.gpu} · {e.replicas} rep</Text>
              <Text style={[s.metaSm, { color: e.error_rate > 0.01 ? C.red : C.faint }]}>err {(e.error_rate * 100).toFixed(2)}%</Text>
            </View>
            {warn && <View style={{ marginTop: 10 }}><Btn label="Scale up replicas" sm kind="primary" pending={scale.pending} onPress={() => scale.call({ endpoint: e.name, replicas: e.replicas + 2 })} /></View>}
          </Card>
        );
      })}
      <SectionLabel>Traffic Routing Rules</SectionLabel>
      {routing.map((r) => (
        <Card key={r.rule} style={{ marginBottom: 8 }}>
          <View style={s.rowBetween}>
            <Text style={s.cardTitle}>{r.rule}</Text>
            <Pill label={r.active ? 'ON' : 'OFF'} color={r.active ? C.green : C.faint} />
          </View>
          <Text style={[s.metaSm, { marginTop: 4, color: C.faint }]}>{r.trigger}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

/* ================================================= ML OPS: EXPERIMENTS ====== */
function ExperimentsScreen() {
  const launch = useEdgeFunction('experiment-launch');
  const experiments = [
    { id: 'EXP-0041', name: 'ETA v3.3 vs v3.2', type: 'A/B', status: 'running', metric: 'MAE', control: 12.4, treat: 11.8, lift: '+4.8%', sig: 0.94, samples: 18420 },
    { id: 'EXP-0040', name: 'RL ε=0.1 vs 0.05', type: 'Bandit', status: 'running', metric: 'Reward', control: 0.862, treat: 0.881, lift: '+2.2%', sig: 0.88, samples: 9210 },
    { id: 'EXP-0039', name: 'Rate: CatBoost vs LGB', type: 'A/B', status: 'concluded', metric: 'Acc', control: 96.1, treat: 96.8, lift: '+0.7%', sig: 0.98, samples: 44100 },
    { id: 'EXP-0038', name: 'Feature: weather_precip_24h', type: 'Holdout', status: 'concluded', metric: 'MAE', control: 13.1, treat: 12.4, lift: '+5.3%', sig: 0.99, samples: 31200 },
  ];
  const sigColor = (sig) => sig >= 0.95 ? C.green : sig >= 0.80 ? C.amber : C.red;
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="RUNNING" value={experiments.filter((e) => e.status === 'running').length} color={C.blue} />
        <StatTile label="CONCLUDED" value={experiments.filter((e) => e.status === 'concluded').length} color={C.green} />
        <StatTile label="WIN RATE" value="75%" color={C.amber} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Btn label="Launch new experiment →" kind="primary" pending={launch.pending} onPress={() => launch.call({ type: 'ab' })} />
      </View>
      {launch.data && <Text style={s.note}>✓ {launch.data.experiment_id} launched</Text>}
      <SectionLabel>All Experiments</SectionLabel>
      {experiments.map((e) => (
        <Card key={e.id} style={{ marginBottom: 12 }}>
          <View style={s.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{e.name}</Text>
              <Text style={s.metaSm}>{e.type} · {e.id}</Text>
            </View>
            <Pill label={e.status.toUpperCase()} color={e.status === 'running' ? C.blue : C.green} />
          </View>
          <View style={[s.tileRow, { marginTop: 12 }]}>
            <StatTile label={'CTRL ' + e.metric} value={String(e.control)} color={C.dim} />
            <StatTile label={'TREAT ' + e.metric} value={String(e.treat)} color={C.blue} />
            <StatTile label="LIFT" value={e.lift} color={C.green} />
          </View>
          <View style={{ marginTop: 12 }}>
            <View style={[s.rowBetween, { marginBottom: 5 }]}>
              <Text style={s.miniLabel}>SIGNIFICANCE</Text>
              <Text style={[s.miniLabel, { color: sigColor(e.sig) }]}>{(e.sig * 100).toFixed(0)}%</Text>
            </View>
            <Bar pct={e.sig * 100} color={sigColor(e.sig)} />
            <View style={[s.rowBetween, { marginTop: 5 }]}>
              <Text style={s.miniLabel}>{e.samples.toLocaleString()} samples</Text>
              {e.status === 'running' && e.sig >= 0.95 && <Text style={[s.miniLabel, { color: C.green }]}>✓ Significant — ready to ship</Text>}
            </View>
          </View>
          {e.status === 'running' && e.sig >= 0.95 && (
            <View style={[s.btnRow, { marginTop: 10 }]}>
              <Btn label="Promote treatment" flex kind="primary" onPress={() => {}} />
              <Btn label="Stop" flex kind="danger" onPress={() => {}} />
            </View>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}

/* ================================================= ML OPS: DATA PIPELINE ==== */
function PipelineScreen() {
  const run = useEdgeFunction('pipeline-run');
  const pipelines = [
    { name: 'driver_features_rt', type: 'Kafka → Feature Store', status: 'running', lag: 1200, tput: 8420, errors_hr: 0, schedule: 'realtime', last: '14:47:01', sla: 2000 },
    { name: 'load_features_rt', type: 'Kafka → Feature Store', status: 'running', lag: 890, tput: 12800, errors_hr: 0, schedule: 'realtime', last: '14:47:01', sla: 2000 },
    { name: 'route_features_flink', type: 'Flink → Feature Store', status: 'running', lag: 14200, tput: 2100, errors_hr: 2, schedule: 'realtime', last: '14:45:18', sla: 30000 },
    { name: 'market_rates_dbt', type: 'DAT API → dbt → Warehouse', status: 'running', lag: 0, tput: 410, errors_hr: 0, schedule: '*/5 * * * *', last: '14:42:00', sla: 360000 },
    { name: 'settlement_batch', type: 'TMS → dbt → Redshift', status: 'completed', lag: 0, tput: 0, errors_hr: 0, schedule: '0 2 * * *', last: '02:01:44', sla: 3600000 },
    { name: 'geo_spark_stream', type: 'GPS → Spark → Redis', status: 'running', lag: 4100, tput: 5800, errors_hr: 0, schedule: 'realtime', last: '14:32:09', sla: 15000 },
    { name: 'ml_training_prep', type: 'Warehouse → S3 → Feature Store', status: 'failed', lag: 0, tput: 0, errors_hr: 14, schedule: '0 */6 * * *', last: '08:00:31', sla: 7200000 },
  ];
  const quality = [
    { table: 'drivers', rows: 14, nulls: 0, score: 100 },
    { table: 'loads', rows: 284, nulls: 2, score: 99 },
    { table: 'runs', rows: 142, nulls: 0, score: 100 },
    { table: 'settlements', rows: 1840, nulls: 8, score: 97 },
    { table: 'market_rates', rows: 48200, nulls: 14, score: 99 },
  ];
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="RUNNING" value={pipelines.filter((p) => p.status === 'running').length} color={C.green} />
        <StatTile label="FAILED" value={pipelines.filter((p) => p.status === 'failed').length} color={C.red} />
        <StatTile label="EVENTS/S" value={(pipelines.reduce((t, p) => t + p.tput, 0) / 1000).toFixed(1) + 'K'} color={C.blue} />
      </View>
      <SectionLabel right={pipelines.length + ' pipelines'}>Data Pipelines</SectionLabel>
      {pipelines.map((p) => {
        const slaBreached = p.lag > p.sla;
        const failed = p.status === 'failed';
        return (
          <Card key={p.name} style={{ marginBottom: 10, borderColor: failed ? C.red + '60' : slaBreached ? C.amber + '60' : C.line }}>
            <View style={s.rowBetween}>
              <Text style={[s.cardTitle, { fontFamily: 'monospace', fontSize: 11, flex: 1 }]}>{p.name}</Text>
              <Pill label={p.status.toUpperCase()} color={failed ? C.red : p.status === 'completed' ? C.dim : C.green} />
            </View>
            <Text style={[s.metaSm, { marginTop: 2, color: C.faint }]}>{p.type}</Text>
            <View style={[s.tileRow, { marginTop: 10 }]}>
              <StatTile label="LAG" value={p.lag > 1000 ? (p.lag / 1000).toFixed(1) + 's' : p.lag + 'ms'} color={slaBreached ? C.red : C.green} />
              <StatTile label="EVENTS/S" value={p.tput > 0 ? p.tput.toLocaleString() : '—'} />
              <StatTile label="ERR/HR" value={p.errors_hr} color={p.errors_hr > 0 ? C.red : C.green} />
            </View>
            <View style={[s.rowBetween, { marginTop: 8 }]}>
              <Text style={s.miniLabel}>{p.schedule}</Text>
              <Text style={s.miniLabel}>last: {p.last}</Text>
            </View>
            {(failed || slaBreached) && (
              <View style={{ marginTop: 10 }}>
                <Btn label={failed ? 'Retry pipeline' : 'Investigate lag'} kind={failed ? 'danger' : 'ghost'} sm pending={run.pending} onPress={() => run.call({ pipeline: p.name })} />
              </View>
            )}
          </Card>
        );
      })}
      <SectionLabel>Data Quality</SectionLabel>
      <Card>
        {quality.map((q, i) => (
          <View key={q.table} style={{ marginBottom: i < quality.length - 1 ? 12 : 0 }}>
            <View style={[s.rowBetween, { marginBottom: 4 }]}>
              <Text style={[s.metaSm, { fontFamily: 'monospace', color: C.text }]}>{q.table}</Text>
              <Text style={[s.metaSm, { color: q.score === 100 ? C.green : q.score > 97 ? C.amber : C.red, fontWeight: '800' }]}>{q.score}%</Text>
            </View>
            <Bar pct={q.score} color={q.score === 100 ? C.green : q.score > 97 ? C.amber : C.red} />
            <View style={[s.rowCenter, { marginTop: 4, gap: 12 }]}>
              <Text style={s.miniLabel}>{q.rows.toLocaleString()} rows</Text>
              {q.nulls > 0 && <Text style={[s.miniLabel, { color: C.amber }]}>{q.nulls} nulls</Text>}
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

/* ================================================= ML OPS: LLM EVAL ========= */
function LLMEvalScreen() {
  const runEval = useEdgeFunction('llm-eval-run');
  const [sel, setSel] = useState(0);
  const llms = [
    { name: 'DispatchAI', base: 'Claude 3.5 Sonnet', evals: 840, pass_rate: 97.1, lat: 480, cost_1k: 0.024, sp_ver: 'v4.2' },
    { name: 'RouteBot', base: 'GPT-4o', evals: 620, pass_rate: 94.8, lat: 720, cost_1k: 0.031, sp_ver: 'v3.1' },
    { name: 'DocumentParser', base: 'Claude 3.5 Sonnet', evals: 1200, pass_rate: 98.7, lat: 1100, cost_1k: 0.021, sp_ver: 'v6.0' },
    { name: 'ComplianceWatcher', base: 'Claude 3 Haiku', evals: 2800, pass_rate: 99.9, lat: 42, cost_1k: 0.003, sp_ver: 'v2.4' },
  ];
  const suites = [
    { name: 'Load Assign Correctness', tests: 200, pass: 194, cat: 'functional' },
    { name: 'Route Feasibility Check', tests: 150, pass: 142, cat: 'functional' },
    { name: 'HOS Constraint Adherence', tests: 300, pass: 300, cat: 'safety' },
    { name: 'Hallucination Guard', tests: 100, pass: 97, cat: 'safety' },
    { name: 'Prompt Injection Resistance', tests: 50, pass: 49, cat: 'security' },
    { name: 'Latency SLA (< 2s)', tests: 840, pass: 821, cat: 'perf' },
  ];
  const catColor = { functional: C.blue, safety: C.green, security: C.red, perf: C.amber };
  const m = llms[sel];
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[s.filterBar, { marginHorizontal: -16, marginBottom: 12 }]} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {llms.map((l, i) => (
          <Pressable key={i} onPress={() => setSel(i)} style={[s.chip, { borderColor: sel === i ? C.pink : C.line, backgroundColor: sel === i ? 'rgba(244,114,182,0.12)' : 'transparent' }]}>
            <Text style={[s.chipTxt, { color: sel === i ? C.pink : C.dim }]}>{l.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Card>
        <View style={s.rowBetween}>
          <View>
            <Text style={s.cardTitle}>{m.name}</Text>
            <Text style={s.metaSm}>{m.base} · SP {m.sp_ver}</Text>
          </View>
          <Pill label={m.pass_rate + '%'} color={m.pass_rate > 97 ? C.green : m.pass_rate > 93 ? C.amber : C.red} />
        </View>
        <View style={[s.tileRow, { marginTop: 12 }]}>
          <StatTile label="EVALS" value={m.evals.toLocaleString()} />
          <StatTile label="LAT." value={m.lat + 'ms'} color={C.blue} />
          <StatTile label="COST/1K" value={'$' + m.cost_1k} color={C.dim} />
        </View>
        <View style={{ marginTop: 12 }}>
          <Btn label="Run eval suite" ghost pending={runEval.pending} onPress={() => runEval.call({ model: m.name })} />
        </View>
        {runEval.data && <Text style={s.note}>✓ Eval complete · {runEval.data.pass_rate || m.pass_rate}% pass rate</Text>}
      </Card>
      <SectionLabel>Eval Suites</SectionLabel>
      {suites.map((e) => {
        const pct = (e.pass / e.tests) * 100;
        return (
          <Card key={e.name} style={{ marginBottom: 8 }}>
            <View style={s.rowBetween}>
              <Text style={[s.metaSm, { color: C.text, flex: 1 }]}>{e.name}</Text>
              <View style={[s.rowCenter, { gap: 6 }]}>
                <Tag label={e.cat} color={catColor[e.cat]} />
                <Text style={[s.metaSm, { color: pct === 100 ? C.green : pct > 97 ? C.amber : C.red }]}>{pct.toFixed(0)}%</Text>
              </View>
            </View>
            <Bar pct={pct} color={pct === 100 ? C.green : pct > 97 ? C.amber : C.red} />
            <Text style={[s.miniLabel, { marginTop: 3 }]}>{e.pass}/{e.tests} passed</Text>
          </Card>
        );
      })}
    </ScrollView>
  );
}

/* ================================================= ML OPS: VECTOR STORE ===== */
function VectorStoreScreen() {
  const reindex = useEdgeFunction('vector-reindex');
  const indexes = [
    { name: 'load_descriptions', docs: 284000, dims: 1536, model: 'text-embedding-3-large', size_gb: 2.1, freshness: '5 min', qph: 4800, p50: 12, status: 'healthy' },
    { name: 'driver_profiles', docs: 14000, dims: 1536, model: 'text-embedding-3-small', size_gb: 0.12, freshness: '1 hr', qph: 340, p50: 8, status: 'healthy' },
    { name: 'compliance_docs', docs: 48200, dims: 3072, model: 'text-embedding-3-large', size_gb: 4.4, freshness: '24 hr', qph: 120, p50: 18, status: 'healthy' },
    { name: 'route_history', docs: 1840000, dims: 768, model: 'e5-large-v2 (local)', size_gb: 8.9, freshness: '1 min', qph: 12800, p50: 6, status: 'healthy' },
    { name: 'agent_tool_registry', docs: 1200, dims: 1536, model: 'text-embedding-3-small', size_gb: 0.01, freshness: '1 hr', qph: 88, p50: 4, status: 'healthy' },
    { name: 'bol_pod_archive', docs: 420000, dims: 1536, model: 'text-embedding-3-large', size_gb: 3.2, freshness: '10 min', qph: 2100, p50: 14, status: 'rebuilding' },
  ];
  const ragSamples = [
    { q: '"Find reefer loads like Chicago→Dallas 40K lbs"', hits: 8, score: 0.94, agent: 'DispatchAI', ms: 24 },
    { q: '"Driver Hale compliance history last 90 days"', hits: 3, score: 0.91, agent: 'ComplianceWatcher', ms: 18 },
    { q: '"What tools does RouteBot have for tolls?"', hits: 4, score: 0.98, agent: 'RouteBot', ms: 11 },
  ];
  const totalDocs = indexes.reduce((t, i) => t + i.docs, 0);
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.screenPad} showsVerticalScrollIndicator={false}>
      <View style={s.tileRow}>
        <StatTile label="INDEXES" value={indexes.length} />
        <StatTile label="TOTAL DOCS" value={(totalDocs / 1000000).toFixed(1) + 'M'} color={C.blue} />
        <StatTile label="SIZE" value={indexes.reduce((t, i) => t + i.size_gb, 0).toFixed(1) + 'GB'} color={C.dim} />
      </View>
      <View style={[s.tileRow, { marginTop: 10 }]}>
        <StatTile label="QUERIES/HR" value={(indexes.reduce((t, i) => t + i.qph, 0) / 1000).toFixed(1) + 'K'} color={C.amber} />
        <StatTile label="AVG P50 ms" value={Math.round(indexes.reduce((t, i) => t + i.p50, 0) / indexes.length)} color={C.green} />
        <StatTile label="REBUILDING" value={indexes.filter((i) => i.status === 'rebuilding').length} color={C.amber} />
      </View>
      <SectionLabel>Vector Indexes</SectionLabel>
      {indexes.map((idx) => (
        <Card key={idx.name} style={{ marginBottom: 10 }}>
          <View style={s.rowBetween}>
            <Text style={[s.cardTitle, { fontFamily: 'monospace', fontSize: 11, flex: 1 }]}>{idx.name}</Text>
            <Pill label={idx.status.toUpperCase()} color={idx.status === 'healthy' ? C.green : C.amber} />
          </View>
          <Text style={[s.metaSm, { marginTop: 2, color: C.faint }]}>{idx.model} · {idx.dims}d</Text>
          <View style={[s.tileRow, { marginTop: 10 }]}>
            <StatTile label="DOCS" value={idx.docs > 999999 ? (idx.docs / 1000000).toFixed(1) + 'M' : (idx.docs / 1000).toFixed(0) + 'K'} />
            <StatTile label="SIZE" value={idx.size_gb + 'GB'} color={C.dim} />
            <StatTile label="QRY/HR" value={(idx.qph / 1000).toFixed(1) + 'K'} color={C.blue} />
          </View>
          <View style={[s.rowBetween, { marginTop: 6 }]}>
            <Text style={s.metaSm}>P50: {idx.p50}ms · fresh: {idx.freshness}</Text>
          </View>
          {idx.status === 'rebuilding' && (
            <View style={{ marginTop: 8 }}>
              <Bar pct={67} color={C.amber} />
              <Text style={[s.miniLabel, { marginTop: 3 }]}>67% rebuilt — ETA 12 min</Text>
            </View>
          )}
        </Card>
      ))}
      <SectionLabel>Recent RAG Queries</SectionLabel>
      {ragSamples.map((q, i) => (
        <Card key={i} style={{ marginBottom: 8 }}>
          <Text style={[s.metaSm, { color: C.text, lineHeight: 17, fontStyle: 'italic' }]}>{q.q}</Text>
          <View style={[s.rowBetween, { marginTop: 8 }]}>
            <View style={[s.rowCenter, { gap: 8 }]}>
              <Text style={[s.metaSm, { color: C.faint }]}>{q.hits} hits</Text>
              <Text style={[s.metaSm, { color: C.green }]}>top: {q.score}</Text>
            </View>
            <View style={[s.rowCenter, { gap: 8 }]}>
              <Text style={[s.metaSm, { color: C.cyan }]}>{q.agent}</Text>
              <Text style={s.metaSm}>{q.ms}ms</Text>
            </View>
          </View>
        </Card>
      ))}
      <View style={{ marginTop: 12 }}>
        <Btn label="Reindex stale indexes" ghost pending={reindex.pending} onPress={() => reindex.call({ scope: 'stale' })} />
      </View>
    </ScrollView>
  );
}

/* ================================================================ SHELL ===== */
function Shell({ role, tab: externalTab }) {
  const driverId = 'D-1042';
  const TABS = {
    driver: [{ k: 'run', label: 'Run', icon: '◉' }, { k: 'loads', label: 'Loads', icon: '▤' }, { k: 'pay', label: 'Pay', icon: '$' }, { k: 'agents', label: 'AI', icon: '✦' }],
    dispatcher: [{ k: 'fleet', label: 'Fleet', icon: '◉' }, { k: 'loads', label: 'Loads', icon: '▤' }, { k: 'drivers', label: 'Drivers', icon: '☰' }, { k: 'agents', label: 'AI', icon: '✦' }],
    owner: [{ k: 'pl', label: 'P&L', icon: '$' }, { k: 'assets', label: 'Assets', icon: '⬡' }, { k: 'compliance', label: 'DOT', icon: '⊡' }, { k: 'contracts', label: 'Lanes', icon: '▤' }, { k: 'fuel', label: 'Fuel', icon: '◈' }, { k: 'cashflow', label: 'Cash', icon: '⊕' }, { k: 'hr', label: 'People', icon: '◐' }, { k: 'insurance', label: 'Risk', icon: '⊗' }],
    shift_manager: [{ k: 'shift', label: 'Board', icon: '◉' }, { k: 'yard', label: 'Yard', icon: '⬡' }, { k: 'exceptions', label: 'Alerts', icon: '⚠' }, { k: 'schedule', label: 'Sched', icon: '☰' }, { k: 'comms', label: 'Comms', icon: '◎' }, { k: 'safety', label: 'Safety', icon: '⊙' }, { k: 'loadplan', label: 'Plan', icon: '◫' }],
    ml_ops: [{ k: 'models', label: 'Models', icon: '◈' }, { k: 'automl', label: 'AutoML', icon: '⚙' }, { k: 'orchestrate', label: 'Agents', icon: '✦' }, { k: 'features', label: 'Feats', icon: '⊞' }, { k: 'anomaly', label: 'Anom.', icon: '⊡' }, { k: 'rl', label: 'RL', icon: '◎' }, { k: 'inference', label: 'Infer.', icon: '⇌' }, { k: 'experiments', label: 'Expts', icon: '⊚' }, { k: 'pipeline', label: 'Pipes', icon: '⊳' }, { k: 'llmeval', label: 'LLM', icon: '◑' }, { k: 'vectors', label: 'Vects', icon: '▦' }],
  };
  const tabs = TABS[role] || TABS.driver;
  const [tab, setTab] = useState(externalTab || tabs[0].k);
  useEffect(() => { if (externalTab) setTab(externalTab); }, [externalTab]);

  const TITLE = { run: 'Active Run', loads: 'Load Board', pay: 'Settlement', fleet: 'Dispatch', drivers: 'Drivers', agents: 'AI Agents', pl: 'P&L Dashboard', assets: 'Asset Mgmt', compliance: 'DOT/FMCSA', contracts: 'Contracts', fuel: 'Fuel Analytics', cashflow: 'Cash Flow', hr: 'People & HR', insurance: 'Insurance', shift: 'Shift Board', yard: 'Yard Mgmt', exceptions: 'Exceptions', schedule: 'Scheduling', comms: 'Communications', safety: 'Safety / DVIR', loadplan: 'Load Planning', models: 'Model Perf.', automl: 'AutoML Jobs', orchestrate: 'Orchestrate', features: 'Feature Store', anomaly: 'Anomaly Det.', rl: 'RL Policy', inference: 'Inference GW', experiments: 'Experiments', pipeline: 'Data Pipelines', llmeval: 'LLM Eval', vectors: 'Vector Store' };
  const PERSON = { driver: 'Marcus Hale · T-117', dispatcher: 'River Mason · Joliet', owner: 'Jamie Volkov · CEO', shift_manager: 'River Mason · 2nd Shift', ml_ops: 'Zara Chen · ML Platform' };
  const ROLE_LABEL = { driver: 'DRIVER', dispatcher: 'DISPATCH', owner: 'OWNER/OP', shift_manager: 'SHIFT MGR', ml_ops: 'ML OPS' };
  const ROLE_COLOR = { driver: C.amber, dispatcher: C.blue, owner: C.green, shift_manager: C.violet, ml_ops: C.cyan };
  const rc = ROLE_COLOR[role] || C.amber;

  let screen = null;
  switch (tab) {
    case 'run': screen = <ActiveRunScreen driverId={driverId} />; break;
    case 'fleet': screen = <FleetScreen />; break;
    case 'loads': screen = <LoadBoardScreen driverId={driverId} role={role} />; break;
    case 'pay': screen = <PayScreen driverId={driverId} />; break;
    case 'drivers': screen = <DriversScreen />; break;
    case 'agents': screen = <AgentsScreen />; break;
    case 'pl': screen = <PLScreen />; break;
    case 'assets': screen = <AssetsScreen />; break;
    case 'compliance': screen = <ComplianceScreen />; break;
    case 'contracts': screen = <ContractsScreen />; break;
    case 'fuel': screen = <FuelScreen />; break;
    case 'shift': screen = <ShiftBoardScreen />; break;
    case 'yard': screen = <YardScreen />; break;
    case 'exceptions': screen = <ExceptionsScreen />; break;
    case 'schedule': screen = <ScheduleScreen />; break;
    case 'comms': screen = <CommsScreen />; break;
    case 'models': screen = <ModelsScreen />; break;
    case 'automl': screen = <AutoMLScreen />; break;
    case 'orchestrate': screen = <OrchestrateScreen />; break;
    case 'features': screen = <FeaturesScreen />; break;
    case 'anomaly': screen = <AnomalyScreen />; break;
    case 'rl': screen = <RLScreen />; break;
    case 'cashflow': screen = <CashFlowScreen />; break;
    case 'hr': screen = <HRScreen />; break;
    case 'insurance': screen = <InsuranceScreen />; break;
    case 'safety': screen = <SafetyScreen />; break;
    case 'loadplan': screen = <LoadPlanningScreen />; break;
    case 'inference': screen = <InferenceScreen />; break;
    case 'experiments': screen = <ExperimentsScreen />; break;
    case 'pipeline': screen = <PipelineScreen />; break;
    case 'llmeval': screen = <LLMEvalScreen />; break;
    case 'vectors': screen = <VectorStoreScreen />; break;
    default: screen = <Empty label="Coming soon." />;
  }

  return (
    <View style={s.app}>
      <View style={[s.header, { borderBottomColor: rc + '35' }]}>
        <View style={s.rowCenter}>
          <View style={[s.logo, { backgroundColor: rc }]}><Text style={s.logoTxt}>10‑4</Text></View>
          <View style={{ marginLeft: 10 }}>
            <Text style={s.headerTitle}>{TITLE[tab] || 'Ten Four'}</Text>
            <Text style={s.headerSub}>{PERSON[role]}</Text>
          </View>
        </View>
        <View style={[s.rolePill, { borderColor: rc }]}>
          <Text style={[s.rolePillTxt, { color: rc }]}>{ROLE_LABEL[role] || role.toUpperCase()}</Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>{screen}</View>
      <View style={[s.tabBar, { borderTopColor: rc + '20' }]}>
        {tabs.map((t) => {
          const on = t.k === tab;
          const many = tabs.length > 4;
          const dense = tabs.length > 7;
          return (
            <Pressable key={t.k} onPress={() => setTab(t.k)} style={[s.tab, many && { paddingHorizontal: 2 }, dense && { paddingHorizontal: 1 }]}>
              {on && <View style={[s.tabActive, { backgroundColor: rc + '20' }]} />}
              <Text style={[s.tabIcon, { color: on ? rc : C.faint, fontSize: dense ? 11 : many ? 14 : 18 }]}>{t.icon}</Text>
              <Text style={[s.tabLabel, { color: on ? rc : C.faint, fontSize: dense ? 6 : many ? 8 : 10 }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TenFourApp({ role }) {
  return (
    <SupabaseProvider url="https://tenfour.supabase.co" anonKey="anon-key">
      <Shell role={role || 'driver'} />
    </SupabaseProvider>
  );
}

/* ============================================================= STYLES ====== */
const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, borderBottomWidth: 1, backgroundColor: C.bg },
  logo: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoTxt: { color: C.bg, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  headerTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
  headerSub: { color: C.dim, fontSize: 12, marginTop: 1 },
  rolePill: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  rolePillTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

  screen: { flex: 1, backgroundColor: C.bg },
  screenPad: { padding: 16, paddingBottom: 28 },

  card: { backgroundColor: C.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: C.line },
  cardTitle: { color: C.text, fontSize: 14, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },

  loadRef: { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  loadRefSm: { color: C.text, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  routeBig: { color: C.amber, fontSize: 15, fontWeight: '600', marginTop: 8 },
  miniLabel: { color: C.faint, fontSize: 10, fontWeight: '700', letterSpacing: 0.9 },
  miniVal: { color: C.text, fontSize: 20, fontWeight: '800', marginTop: 2 },

  hosBig: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  hosUnit: { fontSize: 18, fontWeight: '600', color: C.dim },
  hosSub: { color: C.dim, fontSize: 12, marginBottom: 6 },
  warn: { color: C.red, fontSize: 12, marginTop: 10, fontWeight: '600' },

  barTrack: { height: 8, borderRadius: 8, backgroundColor: C.surfaceAlt, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 8 },

  section: { color: C.dim, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 12 },
  sectionRight: { color: C.faint, fontSize: 12, fontWeight: '600' },

  btnRow: { flexDirection: 'row', gap: 10 },
  btn: { borderRadius: 8, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  btnSm: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8 },
  btnTxt: { fontSize: 14, fontWeight: '700' },
  btnSmTxt: { fontSize: 12 },
  note: { color: C.green, fontSize: 12, marginTop: 12, fontWeight: '600' },

  tile: { flex: 1, backgroundColor: C.surfaceAlt, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: C.line },
  tileRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  tileVal: { fontSize: 20, fontWeight: '800' },
  tileSub: { color: C.dim, fontSize: 11, fontWeight: '600', marginTop: 1 },
  tileLabel: { color: C.faint, fontSize: 9, fontWeight: '700', letterSpacing: 0.9, marginTop: 3 },

  filterBar: { flexGrow: 0, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  chipTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  lane: { color: C.text, fontSize: 15, fontWeight: '700' },
  laneArrow: { color: C.dim, fontSize: 11, fontWeight: '600', marginVertical: 3 },
  rate: { color: C.green, fontSize: 20, fontWeight: '800' },
  rpm: { color: C.dim, fontSize: 12, marginTop: 2, fontWeight: '600' },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 12 },
  broker: { color: C.dim, fontSize: 12, flex: 1, fontWeight: '500' },

  payBig: { color: C.text, fontSize: 38, fontWeight: '800', marginTop: 8, letterSpacing: -1 },
  paySub: { color: C.dim, fontSize: 13, marginTop: 2, fontWeight: '500' },

  nextStop: { color: C.dim, fontSize: 13, marginTop: 6, fontWeight: '500' },
  metaSm: { color: C.faint, fontSize: 12, fontWeight: '600' },

  avatar: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: C.bg, fontSize: 13, fontWeight: '800' },
  driverName: { color: C.text, fontSize: 15, fontWeight: '700' },

  dot: { width: 9, height: 9, borderRadius: 8, marginRight: 6 },
  agentName: { color: C.text, fontSize: 15, fontWeight: '700' },
  agentRole: { color: C.dim, fontSize: 12, marginTop: 4, fontWeight: '500' },
  agentsIntro: { color: C.dim, fontSize: 13, lineHeight: 19, marginBottom: 14, fontWeight: '500' },

  empty: { padding: 40, alignItems: 'center' },
  emptyTxt: { color: C.faint, fontSize: 13, textAlign: 'center', fontWeight: '500' },

  pill: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pillTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  tabBar: { flexDirection: 'row', borderTopWidth: 1, backgroundColor: C.surface, paddingTop: 8, paddingBottom: 30 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingTop: 4, position: 'relative' },
  tabActive: { position: 'absolute', top: 0, left: 4, right: 4, bottom: 0, borderRadius: 8 },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
});

window.TenFourApp = TenFourApp;
export { TenFourApp };
