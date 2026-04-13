import React, { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../services/api';
import useStore from '../../store/useStore';

export default function FearHistoryChart() {
  const [fallbackData, setFallbackData] = useState([]);
  const user = useStore(s => s.user);
  const fearHistory = useStore(s => s.fearHistory);

  const storeData = useMemo(() => {
    if (!Array.isArray(fearHistory)) return [];
    return fearHistory.map((item) => ({
      name: new Date(item.timestamp).toLocaleDateString(),
      score: Number(item.score || 0),
      classification: Number(item.score || 0) >= 67 ? 'HIGH' : Number(item.score || 0) >= 34 ? 'MEDIUM' : 'LOW',
      action: item.action || 'UPDATE',
    }));
  }, [fearHistory]);

  useEffect(() => {
    if (!user?._id || storeData.length > 0) return;
    api.getFearHistory(user._id).then(res => {
      if (Array.isArray(res)) {
        setFallbackData(res.map((item) => ({
          name: new Date(item.timestamp).toLocaleDateString(),
          score: Number(item.score || 0),
          classification: Number(item.score || 0) >= 67 ? 'HIGH' : Number(item.score || 0) >= 34 ? 'MEDIUM' : 'LOW',
          action: item.action || 'UPDATE',
        })));
      }
    }).catch(() => setFallbackData([]));
  }, [user?._id, storeData.length]);

  const data = storeData.length > 0 ? storeData : fallbackData;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '12px', border: '1px solid var(--border-default)', borderRadius: '10px', boxShadow: 'var(--shadow-lg)' }}>
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{data.name}</p>
          <p style={{ margin: '4px 0', color: payload[0].color }}>Score: {data.score} ({data.classification})</p>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Action: {data.action}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '300px', padding: '24px', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-default)' }}>
       <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Fear Score Progression</h3>
       <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.45}/>
              <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-muted)" />
          <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-muted)" />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="score" stroke="var(--accent-purple)" fillOpacity={1} fill="url(#colorScore)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
