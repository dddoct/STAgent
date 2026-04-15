export default function ProgressBar({ current, total, passed, failed }) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">测试进度</span>
        <span className="text-gray-500">{current} / {total}</span>
      </div>

      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        >
          <div className="h-full flex">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${total > 0 ? (passed / total) * 100 : 0}%` }}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${total > 0 ? (failed / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>通过: {passed}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span>失败: {failed}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
          <span>待测: {total - current}</span>
        </div>
      </div>
    </div>
  );
}
