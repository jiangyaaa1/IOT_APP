import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  FileCode,
  FolderTree,
  Download,
  Sparkles,
  ShieldCheck,
  Layers,
  Terminal
} from 'lucide-react';
import { CODE_TEMPLATES, FrameworkCodeTemplate, CodeFile } from '../data/codeTemplates';

export const CodeExplorer: React.FC = () => {
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>('flutter');
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(3); // Default to main.dart
  const [copied, setCopied] = useState<boolean>(false);

  const currentFramework: FrameworkCodeTemplate =
    CODE_TEMPLATES.find((f) => f.id === selectedFrameworkId) || CODE_TEMPLATES[0];

  // Safeguard if file index out of bounds
  const currentFile: CodeFile =
    currentFramework.files[selectedFileIndex] || currentFramework.files[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.filename.split('/').pop() || 'code.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Framework Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Code2 className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-100">
                跨平台移动端 MQTT 实战源码工程仓库
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              包含完整的权限清单配置 (`AndroidManifest.xml` / `Info.plist`)、依赖文件与单文件可直接运行的完整 UI 及通信逻辑。
            </p>
          </div>

          {/* Framework Switcher Buttons */}
          <div className="flex flex-wrap gap-2">
            {CODE_TEMPLATES.map((fw) => (
              <button
                key={fw.id}
                onClick={() => {
                  setSelectedFrameworkId(fw.id);
                  setSelectedFileIndex(fw.files.length - 1); // Select main entry file
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                  selectedFrameworkId === fw.id
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/30 border border-cyan-400/40'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
                }`}
              >
                <span>{fw.name.split('-')[0].trim()}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950/60 font-mono">
                  {fw.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Framework Why Recommendation Callout */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="font-bold text-cyan-300 font-mono flex items-center space-x-2">
              <span>⭐️ 专家选型评估理由:</span>
              <span className="px-2 py-0.2 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px]">
                依赖库: {currentFramework.libraryName}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {currentFramework.recommendationReason}
            </p>
          </div>
          <div className="shrink-0 text-slate-400 text-[11px] font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            适用场景: {currentFramework.bestFitFor}
          </div>
        </div>
      </div>

      {/* Code Editor & File Explorer Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: File Explorer List (3 cols) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3 flex flex-col">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
            <FolderTree className="w-4 h-4 text-cyan-400" />
            <span>工程文件列表</span>
          </div>

          <div className="space-y-1.5 flex-1">
            {currentFramework.files.map((file, idx) => {
              const isSelected = selectedFileIndex === idx;
              return (
                <button
                  key={file.filename}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-mono transition flex items-start space-x-2 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <FileCode className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{file.filename}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {file.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>零外部插件纯净模板</span>
            </div>
            <p>
              代码包含完整的错误处理、重连机制、生命周期挂载以及详细中文注释，可直接粘贴进工程编译运行。
            </p>
          </div>
        </div>

        {/* Right Side: Code Viewer & Actions (9 cols) */}
        <div className="lg:col-span-9 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
          {/* Header Bar */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-300">
                {currentFile.filename}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {currentFile.language.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadFile}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center space-x-1 transition cursor-pointer"
                title="下载该文件"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">导出文件</span>
              </button>

              <button
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>已复制源码</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>一键复制代码</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Description banner */}
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 text-xs text-slate-400 font-mono flex items-center space-x-2">
            <span className="text-cyan-400 font-bold">📄 说明:</span>
            <span>{currentFile.description}</span>
          </div>

          {/* Syntax Code Container */}
          <div className="p-4 overflow-x-auto max-h-[580px] scrollbar-thin scrollbar-thumb-slate-800 font-mono text-xs leading-relaxed text-slate-300 select-all">
            <pre className="tab-4">
              <code>{currentFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
