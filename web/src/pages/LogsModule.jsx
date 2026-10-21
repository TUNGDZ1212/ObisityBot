import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function LogsModule() {
  const { guildId } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/guilds/${guildId}/logs`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [guildId]);

  const levelColors = {
    INFO: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    WARN: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    DANGER: 'bg-red-500/20 text-red-300 border-red-500/30'
  };

  if (loading) return <div className="p-4 text-white">Đang tải nhật ký...</div>;

  return (
    <div className="glass p-6 rounded-2xl text-white">
      <h2 className="text-xl font-bold mb-4">📋 Nhật Ký Hoạt Động (Audit Logs)</h2>
      {logs.length === 0 ? (
        <div className="opacity-60 text-sm">Chưa có nhật ký ghi nhận.</div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {logs.map((log) => (
            <div
              key={log._id}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${
                levelColors[log.level] || levelColors.INFO
              }`}
            >
              <div>
                <span className="font-bold text-sm uppercase px-2 py-0.5 rounded bg-black/40 mr-2">
                  {log.action}
                </span>
                <span className="text-sm">{log.details}</span>
                <div className="text-xs opacity-70 mt-1">
                  Người thực hiện: <b>{log.executor}</b> {log.target && `➔ Đối tượng: ${log.target}`}
                </div>
              </div>
              <span className="text-xs opacity-60 whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
