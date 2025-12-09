import React, { useState } from 'react';
import { CurveParams, Point, pointAdd, pointMultiply } from '../utils/ecc';
import { Plus, X, Calculator } from 'lucide-react';

interface Props {
  curve: CurveParams;
}

export const PointPlayground: React.FC<Props> = ({ curve }) => {
  const [scalar, setScalar] = useState<string>("2");
  const [logs, setLogs] = useState<string[]>([]);
  
  // Base point input state
  const [px, setPx] = useState<string>(curve.G.x?.toString() || "");
  const [py, setPy] = useState<string>(curve.G.y?.toString() || "");
  const [resultPoint, setResultPoint] = useState<Point | null>(null);

  // Q point for addition
  const [qx, setQx] = useState<string>(curve.G.x?.toString() || "");
  const [qy, setQy] = useState<string>(curve.G.y?.toString() || "");

  const logCapture = (s: string) => {
    setLogs(prev => [...prev, s]);
  };

  const handleScalarMult = () => {
    setLogs([]);
    setResultPoint(null);
    try {
      const P: Point = { x: BigInt(px), y: BigInt(py), isInfinity: false };
      const k = BigInt(scalar);
      const R = pointMultiply(k, P, curve, logCapture);
      setResultPoint(R);
    } catch (e) {
      logCapture(`错误: ${(e as Error).message}`);
    }
  };

  const handlePointAdd = () => {
    setLogs([]);
    setResultPoint(null);
    try {
      const P: Point = { x: BigInt(px), y: BigInt(py), isInfinity: false };
      const Q: Point = { x: BigInt(qx), y: BigInt(qy), isInfinity: false };
      const R = pointAdd(P, Q, curve, logCapture);
      setResultPoint(R);
    } catch (e) {
      logCapture(`错误: ${(e as Error).message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-8">
        
        {/* Scalar Mult Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <X className="w-5 h-5 text-indigo-500" /> 标量乘法 (k * P)
           </h3>
           <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="text-xs font-semibold text-slate-500">P.x</label>
                    <input type="number" value={px} onChange={e => setPx(e.target.value)} className="w-full border rounded p-2 text-sm font-mono"/>
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-slate-500">P.y</label>
                    <input type="number" value={py} onChange={e => setPy(e.target.value)} className="w-full border rounded p-2 text-sm font-mono"/>
                 </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">标量 k</label>
                <input type="number" value={scalar} onChange={e => setScalar(e.target.value)} className="w-full border rounded p-2 text-sm font-mono"/>
              </div>
              <button onClick={handleScalarMult} className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition">
                计算 k * P
              </button>
           </div>
        </div>

        {/* Point Add Section */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-500" /> 点加运算 (P + Q)
           </h3>
           <div className="space-y-4">
             <p className="text-xs text-slate-400">使用上方的 P 点。</p>
              <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="text-xs font-semibold text-slate-500">Q.x</label>
                    <input type="number" value={qx} onChange={e => setQx(e.target.value)} className="w-full border rounded p-2 text-sm font-mono"/>
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-slate-500">Q.y</label>
                    <input type="number" value={qy} onChange={e => setQy(e.target.value)} className="w-full border rounded p-2 text-sm font-mono"/>
                 </div>
              </div>
              <button onClick={handlePointAdd} className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition">
                计算 P + Q
              </button>
           </div>
        </div>

      </div>

      {/* Output Console */}
      <div className="bg-slate-900 rounded-xl p-4 flex flex-col h-[500px]">
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700">
            <span className="text-slate-400 text-xs font-mono uppercase">计算日志</span>
            {resultPoint && (
                <span className="text-green-400 font-mono text-sm">
                    结果: {resultPoint.isInfinity ? '无穷远点' : `(${resultPoint.x}, ${resultPoint.y})`}
                </span>
            )}
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
            {logs.length === 0 ? <span className="text-slate-600 italic">准备计算...</span> : logs.map((l, i) => (
                <div key={i} className="break-words border-l-2 border-slate-700 pl-2">{l}</div>
            ))}
        </div>
      </div>
    </div>
  );
};