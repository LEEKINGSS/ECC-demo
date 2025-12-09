import React, { useState, useEffect } from 'react';
import { 
  CurveParams, 
  Point, 
  pointMultiply, 
  pointAdd, 
  embedMessageKoblitz, 
  unembedMessageKoblitz, 
  embedMessageDirect,
  mod,
  isInfinity
} from '../utils/ecc';
import { ArrowRight, Lock, Unlock, Key, MessageSquare, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  curve: CurveParams;
}

export const EncryptionDemo: React.FC<Props> = ({ curve }) => {
  // Key Generation State
  const [privKey, setPrivKey] = useState<bigint>(15n);
  const [pubKey, setPubKey] = useState<Point | null>(null);
  
  // Message State
  const [msgInput, setMsgInput] = useState<string>("12");
  const [embeddingMethod, setEmbeddingMethod] = useState<'koblitz' | 'direct'>('koblitz');
  const [embeddedPoint, setEmbeddedPoint] = useState<Point | null>(null);
  const [embeddingLogs, setEmbeddingLogs] = useState<string[]>([]);

  // Encryption State
  const [randomK, setRandomK] = useState<bigint>(7n);
  const [cipherC1, setCipherC1] = useState<Point | null>(null);
  const [cipherC2, setCipherC2] = useState<Point | null>(null);
  const [encryptLogs, setEncryptLogs] = useState<string[]>([]);

  // Decryption State
  const [decryptedPoint, setDecryptedPoint] = useState<Point | null>(null);
  const [decryptedMsg, setDecryptedMsg] = useState<string>("");
  const [decryptLogs, setDecryptLogs] = useState<string[]>([]);

  // Auto-generate keys on mount or curve change
  useEffect(() => {
    generateKeys();
  }, [curve, privKey]);

  const generateKeys = () => {
    try {
      const pub = pointMultiply(privKey, curve.G, curve);
      setPubKey(pub);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEmbed = () => {
    const logs: string[] = [];
    const msgVal = BigInt(msgInput);
    logs.push(`原始消息 (整数): ${msgVal}`);

    let point: Point;
    try {
      if (embeddingMethod === 'koblitz') {
        const K = 20n;
        logs.push(`方法: Koblitz (K=${K})`);
        logs.push(`尝试 x = m * K + j`);
        
        point = embedMessageKoblitz(msgVal, curve, K);
        logs.push(`找到有效点 Pm(${point.x}, ${point.y})`);
        logs.push(`验证: ${point.y}^2 = ${point.x}^3 + ${curve.a}*${point.x} + ${curve.b} (mod ${curve.p})`);
      } else {
        logs.push(`方法: 直接搜索 (x = m + 偏移量)`);
        const result = embedMessageDirect(msgVal, curve);
        point = result.point;
        logs.push(`在偏移量 ${result.offset} 处找到有效 x。 x = ${point.x}`);
        logs.push(`点 Pm(${point.x}, ${point.y})`);
      }
      setEmbeddedPoint(point);
      setEmbeddingLogs(logs);
      
      // Reset subsequent steps
      setCipherC1(null);
      setCipherC2(null);
      setDecryptedPoint(null);
      setDecryptedMsg("");
    } catch (e) {
      logs.push(`错误: ${(e as Error).message}`);
      setEmbeddingLogs(logs);
    }
  };

  const handleEncrypt = () => {
    if (!embeddedPoint || !pubKey) return;
    const logs: string[] = [];
    logs.push(`使用随机数 k = ${randomK}`);
    logs.push(`公钥 Q = (${pubKey.x}, ${pubKey.y})`);
    logs.push(`消息点 Pm = (${embeddedPoint.x}, ${embeddedPoint.y})`);

    // C1 = k * G
    logs.push(`计算 C1 = k * G...`);
    const c1 = pointMultiply(randomK, curve.G, curve);
    logs.push(`C1 = (${c1.x}, ${c1.y})`);

    // C2 = Pm + k * Q
    logs.push(`计算共享密钥 S = k * Q...`);
    const S = pointMultiply(randomK, pubKey, curve);
    logs.push(`S = (${S.x}, ${S.y})`);

    logs.push(`计算 C2 = Pm + S...`);
    const c2 = pointAdd(embeddedPoint, S, curve);
    logs.push(`C2 = (${c2.x}, ${c2.y})`);

    setCipherC1(c1);
    setCipherC2(c2);
    setEncryptLogs(logs);
  };

  const handleDecrypt = () => {
    if (!cipherC1 || !cipherC2) return;
    const logs: string[] = [];

    logs.push(`密文: C1(${cipherC1.x}, ${cipherC1.y}), C2(${cipherC2.x}, ${cipherC2.y})`);
    logs.push(`私钥 d = ${privKey}`);

    // M = C2 - d * C1  => M = C2 + (d * C1_inverse) NO, point subtraction is P + (-Q)
    // Actually: M = C2 - S, where S = d * C1
    
    logs.push(`计算 S = d * C1...`);
    const S = pointMultiply(privKey, cipherC1, curve);
    logs.push(`S = (${S.x}, ${S.y})`);

    // Inverse of S (x, -y)
    const negS: Point = { x: S.x, y: mod(-S.y!, curve.p), isInfinity: S.isInfinity };
    logs.push(`-S = (${negS.x}, ${negS.y})`);

    logs.push(`计算 Pm = C2 + (-S)...`);
    const M = pointAdd(cipherC2, negS, curve);
    logs.push(`恢复点 Pm = (${M.x}, ${M.y})`);
    setDecryptedPoint(M);

    // Un-embed
    if (embeddingMethod === 'koblitz') {
      const m = unembedMessageKoblitz(M, 20n);
      logs.push(`去嵌入 (Koblitz): m = floor(x / K) = floor(${M.x} / 20) = ${m}`);
      setDecryptedMsg(m.toString());
    } else {
      // Direct
      logs.push(`去嵌入 (直接): 直接使用 x 坐标作为近似值。`);
      logs.push(`注意: 如果使用了偏移量，没有元数据将无法恢复精确的原始整数。恢复基数: ${M.x}`);
      setDecryptedMsg(M.x?.toString() || "");
    }

    setDecryptLogs(logs);
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Key Generation */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-800">
          <Key className="w-5 h-5 text-indigo-600" /> 1. 密钥生成
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">私钥 (d)</label>
            <div className="flex gap-2">
                <input 
                type="number" 
                value={privKey.toString()} 
                onChange={(e) => setPrivKey(BigInt(e.target.value || 0))}
                className="w-full px-3 py-2 border rounded-md font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>
            <p className="text-xs text-slate-400 mt-1">小于曲线阶数 n 的随机整数。</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">公钥 (Q = d * G)</span>
            <div className="mt-2 font-mono text-slate-700">
                {pubKey ? `(${pubKey.x}, ${pubKey.y})` : '生成中...'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Message Embedding */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-800">
          <MessageSquare className="w-5 h-5 text-indigo-600" /> 2. 明文嵌入
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">消息 (整数)</label>
                <input 
                type="number" 
                value={msgInput} 
                onChange={(e) => setMsgInput(e.target.value)}
                className="w-full px-3 py-2 border rounded-md font-mono text-sm mb-4"
                placeholder="输入一个数字"
                />
                
                <label className="block text-sm font-medium text-slate-500 mb-1">嵌入方法</label>
                <select 
                    value={embeddingMethod}
                    onChange={(e) => setEmbeddingMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                >
                    <option value="koblitz">Koblitz 方法 (稳健)</option>
                    <option value="direct">直接搜索 (简单)</option>
                </select>

                <button 
                    onClick={handleEmbed}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full transition-colors font-medium"
                >
                    嵌入到点
                </button>
            </div>
            <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs overflow-y-auto max-h-48">
                {embeddingLogs.length === 0 ? <span className="text-slate-600">// 嵌入日志将显示在这里</span> : 
                 embeddingLogs.map((log, i) => <div key={i} className="mb-1 border-l-2 border-indigo-500 pl-2">{log}</div>)
                }
            </div>
        </div>
        
        {embeddedPoint && (
             <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800 flex items-center gap-2">
                <span className="font-bold">嵌入点 Pm:</span> 
                <span className="font-mono">({embeddedPoint.x?.toString()}, {embeddedPoint.y?.toString()})</span>
             </div>
        )}
      </div>

      {/* 3. Encryption */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 opacity-100 transition-opacity">
         <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-800">
          <Lock className="w-5 h-5 text-indigo-600" /> 3. 加密 (ElGamal)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
             <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">随机标量 (k)</label>
                <input 
                type="number" 
                value={randomK.toString()} 
                onChange={(e) => setRandomK(BigInt(e.target.value || 1))}
                className="w-full px-3 py-2 border rounded-md font-mono text-sm mb-4"
                />
                <button 
                    onClick={handleEncrypt}
                    disabled={!embeddedPoint}
                    className={`px-4 py-2 rounded-md w-full transition-colors font-medium ${!embeddedPoint ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                    加密
                </button>
             </div>
             <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs overflow-y-auto max-h-48">
                {encryptLogs.length === 0 ? <span className="text-slate-600">// 加密日志将显示在这里</span> : 
                 encryptLogs.map((log, i) => <div key={i} className="mb-1 border-l-2 border-orange-500 pl-2">{log}</div>)
                }
            </div>
        </div>
        {cipherC1 && cipherC2 && (
             <div className="p-3 bg-orange-50 border border-orange-200 rounded-md text-orange-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><span className="font-bold">C1 (k*G):</span> <span className="font-mono block">({cipherC1.x?.toString()}, {cipherC1.y?.toString()})</span></div>
                <div><span className="font-bold">C2 (Pm + k*Q):</span> <span className="font-mono block">({cipherC2.x?.toString()}, {cipherC2.y?.toString()})</span></div>
             </div>
        )}
      </div>

      {/* 4. Decryption */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
         <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-800">
          <Unlock className="w-5 h-5 text-indigo-600" /> 4. 解密
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
             <div>
                <p className="text-sm text-slate-600 mb-4">
                    使用私钥 <strong>d = {privKey.toString()}</strong> 进行解密。
                </p>
                <button 
                    onClick={handleDecrypt}
                    disabled={!cipherC1}
                    className={`px-4 py-2 rounded-md w-full transition-colors font-medium ${!cipherC1 ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                    解密并去嵌入
                </button>
             </div>
             <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-xs overflow-y-auto max-h-48">
                {decryptLogs.length === 0 ? <span className="text-slate-600">// 解密日志将显示在这里</span> : 
                 decryptLogs.map((log, i) => <div key={i} className="mb-1 border-l-2 border-green-500 pl-2">{log}</div>)
                }
            </div>
        </div>
        {decryptedMsg && (
             <div className="p-4 bg-green-100 border border-green-300 rounded-md text-green-900 text-center">
                <span className="text-sm font-semibold uppercase tracking-wider block mb-1">最终结果</span>
                <span className="text-2xl font-bold">{decryptedMsg}</span>
             </div>
        )}
      </div>

    </div>
  );
};