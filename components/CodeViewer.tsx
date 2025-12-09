import React from 'react';

const ALGO_CODE = `
// 1. 点加运算
// 计算点 P(x1, y1) 和 Q(x2, y2) 相加的公式
const lambda = (P == Q) 
  ? (3*x1^2 + a) * (2*y1)^-1 mod p  // 倍点
  : (y2 - y1) * (x2 - x1)^-1 mod p; // 点加

x3 = lambda^2 - x1 - x2 mod p;
y3 = lambda * (x1 - x3) - y1 mod p;


// 2. 标量乘法 (Double-and-Add)
// 高效计算 k*P，时间复杂度 O(log k)
function multiply(k, P) {
  let R = Infinity;
  let N = P;
  // 将标量转换为二进制
  let bits = k.toString(2); 

  for (let i = bits.length - 1; i >= 0; i--) {
    if (bits[i] === '1') {
      R = add(R, N);
    }
    N = add(N, N); // 倍点
  }
  return R;
}

// 3. Koblitz 编码 (消息嵌入)
// 将整数 'm' 嵌入到曲线上的点
function embed(m) {
  const K = 20; // 填充因子
  for (let j = 0; j < K; j++) {
    let x = m * K + j;
    let rhs = x^3 + ax + b mod p;
    // 检查 rhs 是否为二次剩余 (存在平方根)
    let y = sqrt(rhs); 
    if (y exists) return Point(x, y);
  }
}
`;

export const CodeViewer: React.FC = () => {
  return (
    <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800">
      <h2 className="text-slate-100 font-bold mb-4">核心算法</h2>
      <pre className="font-mono text-sm text-blue-300 overflow-x-auto">
        {ALGO_CODE}
      </pre>
    </div>
  );
};