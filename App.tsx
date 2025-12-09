import React, { useState } from 'react';
import { TOY_CURVE, DEMO_CURVE, CurveParams } from './utils/ecc';
import { EncryptionDemo } from './components/EncryptionDemo';
import { PointPlayground } from './components/PointPlayground';
import { CodeViewer } from './components/CodeViewer';
import { Settings, Shield, Activity, Code } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'demo' | 'playground' | 'code'>('demo');
  const [useToyCurve, setUseToyCurve] = useState<boolean>(false);

  const curve: CurveParams = useToyCurve ? TOY_CURVE : DEMO_CURVE;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              ECC 演示平台
            </h1>
          </div>
          
          {/* Curve Selector */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
             <button 
                onClick={() => setUseToyCurve(false)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${!useToyCurve ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
             >
                演示曲线 (p=1021)
             </button>
             <button 
                onClick={() => setUseToyCurve(true)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${useToyCurve ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
             >
                教学曲线 (p=11)
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Curve Info Card */}
        <div className="mb-8 bg-indigo-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" /> 当前曲线参数
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 font-mono text-sm">
                <div>
                    <span className="block text-indigo-300 text-xs">方程</span>
                    <span className="text-lg">y² = x³ + {curve.a.toString()}x + {curve.b.toString()}</span>
                </div>
                <div>
                    <span className="block text-indigo-300 text-xs">模数 (p)</span>
                    <span className="text-lg">{curve.p.toString()}</span>
                </div>
                 <div>
                    <span className="block text-indigo-300 text-xs">基点 (G)</span>
                    <span className="text-lg">({curve.G.x?.toString()}, {curve.G.y?.toString()})</span>
                </div>
                <div>
                    <span className="block text-indigo-300 text-xs">阶数 (n)</span>
                    <span className="text-lg">{curve.n.toString()}</span>
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-8">
            <button 
                onClick={() => setActiveTab('demo')}
                className={`pb-4 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition ${activeTab === 'demo' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Shield className="w-4 h-4" /> 加密流程
            </button>
            <button 
                onClick={() => setActiveTab('playground')}
                className={`pb-4 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition ${activeTab === 'playground' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Activity className="w-4 h-4" /> 点运算
            </button>
            <button 
                onClick={() => setActiveTab('code')}
                className={`pb-4 px-4 font-medium text-sm flex items-center gap-2 border-b-2 transition ${activeTab === 'code' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Code className="w-4 h-4" /> 算法展示
            </button>
        </div>

        {/* Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'demo' && <EncryptionDemo curve={curve} />}
            {activeTab === 'playground' && <PointPlayground curve={curve} />}
            {activeTab === 'code' && <CodeViewer />}
        </div>

      </main>
    </div>
  );
}