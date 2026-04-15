import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Trash2, Download } from 'lucide-react';

export default function LogViewer({ logs, maxHeight = 400 }) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState('all');
  const containerRef = useRef(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const levelColors = {
    info: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    debug: 'text-gray-500',
  };

  const levelBgColors = {
    info: 'bg-blue-50',
    success: 'bg-green-50',
    warning: 'bg-yellow-50',
    error: 'bg-red-50',
    debug: 'bg-gray-50',
  };

  const exportLogs = () => {
    const content = logs.map(log =>
      `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stagent-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">实时日志</span>
          <span className="text-xs text-gray-500">({filteredLogs.length} 条)</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-2 py-1 text-xs border rounded"
          >
            <option value="all">全部</option>
            <option value="info">信息</option>
            <option value="success">成功</option>
            <option value="warning">警告</option>
            <option value="error">错误</option>
          </select>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className="p-1.5 hover:bg-gray-200 rounded"
            title={autoScroll ? '暂停自动滚动' : '开启自动滚动'}
          >
            {autoScroll ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <button
            onClick={() => {
              const event = new CustomEvent('clearLogs');
              window.dispatchEvent(event);
            }}
            className="p-1.5 hover:bg-gray-200 rounded"
            title="清空日志"
          >
            <Trash2 size={14} />
          </button>

          <button
            onClick={exportLogs}
            className="p-1.5 hover:bg-gray-200 rounded"
            title="导出日志"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="overflow-auto font-mono text-xs"
        style={{ maxHeight }}
      >
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            暂无日志
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredLogs.map((log, index) => (
              <div
                key={log.id || index}
                className={`px-3 py-1.5 rounded ${levelBgColors[log.level] || 'bg-gray-50'}`}
              >
                <span className="text-gray-400 mr-2">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`font-medium ${levelColors[log.level] || 'text-gray-600'}`}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="ml-2 text-gray-800 whitespace-pre-wrap">
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
