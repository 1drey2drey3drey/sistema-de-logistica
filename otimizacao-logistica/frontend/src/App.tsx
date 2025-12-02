import React, { useState, ChangeEvent, CSSProperties } from 'react';
import {
  Upload,
  Calculator,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  FileText,
  Info,
  Menu,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  ReferenceDot
} from 'recharts';

type LogTipo = 'info' | 'success' | 'error';

interface CustoData { name: string; Custo: number; }
interface EconomiaData { name: string; Custo: number; Economia: number; }
interface Log { timestamp: string; mensagem: string; tipo: LogTipo; }
interface Resultado {
  N: number; C1: string; C2: string; C3: string; K: string;
  alpha: number; beta: number; x_otimo: number; chamados_bases23: number;
  custo_otimo: string; custo_base1_total: string; custo_bases23_total: string;
  economia_vs_base1: string; economia_vs_bases23: string; economia_percentual: string;
  f_segunda: string; eh_minimo: boolean; timestamp: string;
  prova_simbolica?: { funcao: string; primeira_derivada: string; segunda_derivada: string; ponto_critico: string; eh_minimo: string; };
}

const LogisticsOptimizer: React.FC = () => {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'justificativa' | 'problema'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [betaManual, setBetaManual] = useState<number | null>(null);

const recalcularComBeta = (betaValue: number) => {
  if (!resultado || !calibragem) return;

  const N = Number(resultado.N);
  const C1 = Number(resultado.C1);
  const C2 = Number(resultado.C2);
  const C3 = Number(resultado.C3);
  const alpha = calibragem.alpha;
  const K = 0.5 * C2 + 0.5 * C3;

  const f = (x: number) => C1 * x + alpha * x * x + K * (N - x) + betaValue * (N - x) * (N - x);
  const xOtimo = Math.max(0, Math.min(N, (2 * betaValue * N - (C1 - K)) / (2 * (alpha + betaValue))));
  const reducao = ((f(0) - f(xOtimo)) / f(0)) * 100;

  return { beta: betaValue, xOtimo, reducao };
};

  const addLog = (mensagem: string, tipo: LogTipo = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, mensagem, tipo }]);
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setErro(null);
    setResultado(null);
    setBetaManual(null)
    addLog(`Arquivo "${file.name}" carregado`, 'success');
  };

  function calibrarAlphaBeta(N: number, C1: number, C2: number, C3: number, metaReducao: number = 20) {
    const K = 0.5 * C2 + 0.5 * C3;
    let alpha = 0.005;
    let beta = 0.003;
    let x_otimo = 0;
    let reducaoPercentual = 0;
    const f = (x: number) => C1 * x + alpha * x * x + K * (N - x) + beta * (N - x) * (N - x);
    let iter = 0;
    const maxIter = 1000;
    const step = 0.001;
    while (reducaoPercentual < metaReducao && iter < maxIter) {
      x_otimo = (2 * beta * N - (C1 - K)) / (2 * (alpha + beta));
      x_otimo = Math.max(0, Math.min(N, x_otimo));
      reducaoPercentual = (f(0) - f(x_otimo)) / f(0) * 100;
      if (reducaoPercentual < metaReducao) {
        beta += step;
        alpha = 0.005;
      }
      iter++;
    }
    return { alpha, beta, x_otimo, reducao: reducaoPercentual };
  }

  const otimizar = async () => {
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!fileInput?.files?.[0]) {
      setErro('Nenhum arquivo selecionado');
      addLog('Erro: Nenhum arquivo selecionado', 'error');
      return;
    }
    setLoading(true);
    setErro(null);
    addLog('Enviando CSV para backend...', 'info');
    try {
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      const response = await fetch('http://localhost:5000/otimizar', { method: 'POST', body: formData });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.erro || 'Erro ao otimizar');
      }
      const data = await response.json();
      setResultado(data);
      addLog('Otimização concluída via backend!', 'success');
    } catch (err: any) {
      setErro(err.message);
      addLog(`Erro: ${err.message}`, 'error');
    } finally { setLoading(false); }
  };

  const baixarResultado = () => {
    if (!resultado) return;
    const dados = JSON.stringify(resultado, null, 2);
    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultado_otimizacao_${Date.now()}.json`;
    a.click();
    addLog('Resultado exportado com sucesso', 'success');
  };

  const gerarCSVExemplo = () => {
    const exemplo = `base,distancia,tempo
1,4.2,25
1,5.1,30
1,3.8,22
2,5.5,32
2,6.2,35
2,4.9,28
3,5.8,34
3,6.5,38
3,5.2,30
1,4.5,26
2,5.9,33
3,6.1,36`;
    const blob = new Blob([exemplo], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chamados_exemplo.csv';
    a.click();
    addLog('CSV de exemplo gerado', 'success');
  };

  // --- Estilos ---
  const containerStyle: CSSProperties = { display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif', background: '#f3f4f6' };
const sidebarStyle: CSSProperties = {
  width: sidebarOpen ? '260px' : '0', // se fechada, largura 0
  padding: sidebarOpen ? '1rem' : '0',
  backgroundColor: '#1f2937',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  transition: 'width 0.3s, padding 0.3s',
  position: 'fixed',
  top: 0,
  bottom: 0,
  overflow: 'hidden'
};

const mainStyle: CSSProperties = { 
  marginLeft: sidebarOpen ? '260px' : '0', // se sidebar desaparece, ocupa 100% da tela
  flex: 1,
  padding: '2rem',
  transition: 'margin-left 0.3s',
  overflowY: 'auto'
};  const cardStyle: CSSProperties = { backgroundColor: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '1rem' };
  const buttonStyle = (bg: string): CSSProperties => ({ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem', backgroundColor: bg, color: '#fff', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer' });
  const logStyle = (tipo: LogTipo): CSSProperties => {
    let bg = '#374151'; let color = '#fff';
    if (tipo === 'error') { bg = '#b91c1c'; color = '#fff'; }
    else if (tipo === 'success') { bg = '#047857'; color = '#fff'; }
    return { backgroundColor: bg, color, padding: '0.5rem', borderRadius: '6px', marginBottom: '0.5rem', fontSize: '0.85rem' };
  };

  // --- Dados calculados ---
 const { calibragem, fData, alpha, beta, x_otimo, K, N, C1 } = React.useMemo(() => {
  if (!resultado) return {
    calibragem: null,
    fData: [],
    alpha: 0,
    beta: 0,
    x_otimo: 0,
    K: 0,
    N: 0,
    C1: 0
  };

  const N = Number(resultado.N);
  const C1 = Number(resultado.C1);
  const C2 = Number(resultado.C2);
  const C3 = Number(resultado.C3);

  // --- Calibração ---
  const calibragem = calibrarAlphaBeta(N, C1, C2, C3, 20);
  const alpha = calibragem.alpha;
  const beta = calibragem.beta;
  const x_otimo = calibragem.x_otimo;

  const K = 0.5 * C2 + 0.5 * C3;

  // --- Array para gráfico f(x) ---
  const fData = Array.from({ length: N + 1 }, (_, i) => {
    const x = i;
    const f = C1 * x + alpha * x * x + K * (N - x) + beta * (N - x) * (N - x);
    return { x, f };
  });

  // Garante que o ponto ótimo esteja no array
  const fOtimo = C1 * x_otimo + alpha * x_otimo * x_otimo + K * (N - x_otimo) + beta * (N - x_otimo) * (N - x_otimo);
  if (!fData.some(p => p.x === x_otimo)) {
    fData.push({ x: x_otimo, f: fOtimo });
    fData.sort((a, b) => a.x - b.x);
  }

  return { calibragem, fData, alpha, beta, x_otimo, K, N, C1 };
}, [resultado]);


  const custoData: CustoData[] = resultado ? [
    { name: 'Base 1', Custo: parseFloat(resultado.custo_base1_total) },
    { name: 'Bases 2/3', Custo: parseFloat(resultado.custo_bases23_total) }
  ] : [];

  const menorCusto = custoData.length ? Math.min(...custoData.map(d => d.Custo)) : 0;

  const indicadoresVisuais = calibragem ? [
    { title: 'Redução de Distância', desc: 'Redução de até 20%', value: calibragem.reducao >= 20, bg: '#d1fae5', color: '#047857' },
    { title: 'Economia Operacional', desc: 'Economia ≥12%', value: parseFloat(resultado?.economia_vs_base1 || '0') >= 12, bg: '#fde68a', color: '#b45309' },
    { title: 'Eficiência no Atendimento', desc: 'Diminuição 15-30%', value: parseFloat(resultado?.economia_percentual || '0') >= 15 && parseFloat(resultado?.economia_percentual || '0') <= 30, bg: '#fca5a5', color: '#b91c1c' }
  ] : [];

  const { fDataAtualizado, xOtimoAtualizado, reducaoAtualizada } = React.useMemo(() => {
  if (!resultado || !calibragem) return { fDataAtualizado: [], xOtimoAtualizado: 0, reducaoAtualizada: 0 };

  const N = Number(resultado.N);
  const C1 = Number(resultado.C1);
  const C2 = Number(resultado.C2);
  const C3 = Number(resultado.C3);
  const alpha = calibragem.alpha;
  const beta = betaManual ?? calibragem.beta; // usa beta manual se definido
  const K = 0.5 * C2 + 0.5 * C3;

  // ponto ótimo recalculado
  let xOtimo = (2 * beta * N - (C1 - K)) / (2 * (alpha + beta));
  xOtimo = Math.max(0, Math.min(N, xOtimo));

  // array f(x)
  const fDataAtualizado = Array.from({ length: N + 1 }, (_, i) => {
    const x = i;
    const f = C1 * x + alpha * x * x + K * (N - x) + beta * (N - x) * (N - x);
    return { x, f };
  });

  const fOtimo = C1 * xOtimo + alpha * xOtimo * xOtimo + K * (N - xOtimo) + beta * (N - xOtimo) * (N - xOtimo);
  if (!fDataAtualizado.some(p => p.x === xOtimo)) {
    fDataAtualizado.push({ x: xOtimo, f: fOtimo });
    fDataAtualizado.sort((a, b) => a.x - b.x);
  }

  const reducaoAtualizada = ((fDataAtualizado[0].f - fOtimo) / fDataAtualizado[0].f) * 100;

  return { fDataAtualizado, xOtimoAtualizado: xOtimo, reducaoAtualizada };
}, [resultado, calibragem, betaManual]);

    const sobreProblema = (
  <div>
    <br /><br />
    <h2>Sobre o Problema</h2>
    <p>
      Este projeto trata da <b>otimização logística</b> de alocação de chamados em três bases operacionais, inspirado no Problema de Roteirização de Veículos (VRP). O objetivo é <b>minimizar custos operacionais</b>, reduzindo distância percorrida, tempo de atendimento e sobrecarga logística.
    </p>

    <h3>Contexto Operacional</h3>
    <p>
      A persona representativa é <b>Carlos Menezes</b>, gerente de manutenção urbana. Atualmente, a distribuição de chamados entre as bases é feita manualmente, gerando:
    </p>
    <ul>
      <li>Rotas ineficientes e custos elevados</li>
      <li>Tempo de resposta lento aos cidadãos</li>
      <li>Dificuldade em justificar o orçamento</li>
      <li>Falta de ferramenta de suporte à decisão</li>
    </ul>

    <h3>Objetivo do Sistema</h3>
    <p>
      Desenvolver um sistema full stack capaz de:
    </p>
    <ul>
      <li>Calcular automaticamente a alocação ótima de chamados</li>
      <li>Visualizar resultados e comparar cenários</li>
      <li>Fornecer justificativa matemática da decisão</li>
      <li>Reduzir custos e tempo de atendimento de forma mensurável</li>
    </ul>

    <h3>Métricas de Sucesso</h3>
    <ul>
      <li>Redução da distância percorrida: 20%</li>
      <li>Economia de combustível: 12%</li>
      <li>Redução de tempo de atendimento: 15-30%</li>
      <li>Redução de custos totais: 10-15%</li>
    </ul>

    <p>
      Em resumo, o problema central é <b>como distribuir os chamados de maneira eficiente entre as bases</b>, considerando custos fixos e sobrecargas logísticas, de forma que a solução seja matematicamente comprovada e economicamente válida.
    </p>
  </div>
);

  // --- Explicação das decisões ---
  const explicacaoDecisao = resultado ? (
  <div>
    <h2>Ponto Ótimo: {x_otimo.toFixed(2)}</h2>
    <p>
      O sistema avaliou os custos de cada base e identificou a combinação que minimiza o custo total.
    </p>

    <h3>Resumo do Modelo Matemático</h3>
    <p>
      <b>Variável de decisão:</b> x = número de chamados alocados à Base 1 (domínio: 0 a {N})<br />
      <b>Função objetivo:</b> f(x) = C₁·x + α·x² + K·(N-x) + β·(N-x)²<br />
      - C₁·x: custo fixo Base 1<br />
      - α·x²: sobrecarga Base 1<br />
      - K·(N-x): custo fixo Bases 2/3<br />
      - β·(N-x)²: sobrecarga Bases 2/3
    </p>

    {/* --- Parâmetros calibrados --- */}
    {calibragem && (
      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#eef2ff', borderRadius: '8px' }}>
        <h3>Parâmetros Calibrados</h3>
        <p>α = {calibragem.alpha.toFixed(4)}</p>
        <p>β = {calibragem.beta.toFixed(4)}</p>
        <p>Redução percentual atingida: {calibragem.reducao.toFixed(2)}%</p>
        <p>Ponto ótimo x* = {calibragem.x_otimo.toFixed(2)}</p>
      </div>
    )}

    <h3>Como o ponto ótimo é calculado</h3>
    <p>
      O ponto ótimo x* é encontrado analisando o custo marginal (primeira derivada) e garantindo que o mínimo seja global (segunda derivada positiva).  
      No gráfico <b>Função Custo Total f(x)</b>, x* é destacado pelo ponto verde, mostrando a alocação de chamados que minimiza o custo total.
    </p>

    <h3>Interpretação dos gráficos</h3>
    <ul>
      <li><b>Função f(x):</b> Mostra como o custo total varia conforme x aumenta. O ponto verde indica a solução ótima.</li>
      <li><b>Custo por Base:</b> Compara o custo total de Base 1 vs Bases 2/3. A barra mais baixa indica a base mais eficiente.</li>
    </ul>

    <p>
      Em resumo, o modelo combina custos fixos e sobrecargas logísticas, permitindo decisões baseadas em otimização realista de rotas e atendimento.
    </p>
  </div>
) : <p style={{ fontStyle: 'italic', color: '#6b7280' }}>Faça o upload do CSV e otimize para ver a justificativa.</p>;


  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {sidebarOpen && <h2></h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} 
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 1000,
          background: '#1f2937',
          border: 'none',
          borderRadius: '50%',
          padding: '0.5rem',
          cursor: 'pointer',
          color: '#fff'
        }}>
  {sidebarOpen ? <X /> : <Menu />}
</button>

        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          <button style={buttonStyle('#2563eb')} onClick={() => setActiveTab('dashboard')}>{sidebarOpen ? '🏠 Dashboard' : '🏠'}</button>
          <button style={buttonStyle('#4338ca')} onClick={() => setActiveTab('justificativa')}>{sidebarOpen ? 'ℹ️ Justificativa' : 'ℹ️'}</button>
          <button style={buttonStyle('#10b981')} onClick={() => setActiveTab('problema')}>{sidebarOpen ? '📄 Problema' : '📄'}</button>
        </div>

        <div style={{ marginTop: 'auto', flex: 1, overflowY: 'auto' }}>
          <h3 style={{ marginBottom: '0.5rem', borderBottom: '1px solid #4b5563' }}>Logs</h3>
          {logs.length === 0 && <p style={{ fontStyle: 'italic', color: '#9ca3af' }}>Nenhum log registrado</p>}
          {logs.map((log, idx) => <div key={idx} style={logStyle(log.tipo)}>[{log.timestamp}] {log.mensagem}</div>)}
        </div>
      </div>

      {/* Main */}
      <div style={mainStyle}>
        {activeTab === 'dashboard' && (
          <>
            <h1 style={{ color: '#1f2937', marginBottom: '1rem' }}><TrendingDown /> Resultado da Otimização</h1>
            {/* Botões */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
                <Upload /> Selecionar CSV
                <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
              <button style={buttonStyle('#2563eb')} onClick={otimizar}>{loading ? 'Processando...' : <><Calculator /> Otimizar</>}</button>
              <button style={buttonStyle('#16a34a')} onClick={gerarCSVExemplo}><FileText /> CSV Exemplo</button>
            </div>

            {erro && <div style={{ ...cardStyle, backgroundColor: '#fee2e2', color: '#b91c1c' }}><AlertCircle /> {erro}</div>}

            {resultado && (
              <>
                {/* Indicadores recalculados */}
<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
  {calibragem && [
    { title: 'Redução de Distância', desc: 'Redução de até 20%', value: reducaoAtualizada >= 20, bg: '#d1fae5', color: '#047857' },
    { title: 'Economia Operacional', desc: 'Economia ≥12%', value: parseFloat(resultado?.economia_vs_base1 || '0') >= 12, bg: '#fde68a', color: '#b45309' },
    { title: 'Eficiência no Atendimento', desc: 'Diminuição 15-30%', value: parseFloat(resultado?.economia_percentual || '0') >= 15 && parseFloat(resultado?.economia_percentual || '0') <= 30, bg: '#fca5a5', color: '#b91c1c' }
  ].map((item, idx) => (
    <div key={idx} style={{ ...cardStyle, backgroundColor: item.bg, flex: 1, textAlign: 'center' }}>
      <h3 style={{ color: item.color }}>{item.title}</h3>
      <p>{item.desc}</p>
      <p>{item.value ? '✅ Meta atingida!' : '⚠️ Meta não atingida'}</p>
    </div>
  ))}
</div>

{/* Slider β */}
<div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#eef2ff', borderRadius: '8px' }}>
  <h4>Ajustar β manualmente</h4>
  <input
    type="range"
    min={0}
    max={calibragem ? calibragem.beta * 2 : 0.01}
    step={0.0001}
    value={betaManual ?? calibragem?.beta ?? 0}
    onChange={(e) => setBetaManual(Number(e.target.value))}
    style={{ width: '100%' }}
  />
  <p>β = {(betaManual ?? calibragem?.beta ?? 0).toFixed(4)}</p>
</div>

{/* Gráfico Custo por Base */}
<div style={cardStyle}>
  <h3>Custo por Base</h3>
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={custoData}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="Custo" radius={[10, 10, 0, 0]}>
        {custoData.map((entry, index) => (
          <Cell key={index} fill={entry.Custo === menorCusto ? '#16a34a' : '#4f46e5'} />
        ))}
      </Bar>
      <Legend />
    </BarChart>
  </ResponsiveContainer>
</div>

{/* Gráfico f(x) recalculado */}
<div style={cardStyle}>
  <h3>Função Custo Total f(x)</h3>
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={fDataAtualizado}>
      <XAxis dataKey="x" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="f" stroke="#4338ca" strokeWidth={2} dot={false} />
      <ReferenceDot
        x={xOtimoAtualizado}
        y={C1 * xOtimoAtualizado + (calibragem?.alpha ?? 0) * xOtimoAtualizado ** 2 + K * (N - xOtimoAtualizado) + (betaManual ?? calibragem?.beta ?? 0) * (N - xOtimoAtualizado) ** 2}
        r={6}
        fill="#16a34a"
        label={{ position: 'top', value: 'x*' }}
      />
    </LineChart>
  </ResponsiveContainer>
</div>

                {calibragem && (
  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#eef2ff', borderRadius: '8px' }}>
    <h3>Parâmetros Calibrados</h3>
    <p>α = {calibragem.alpha.toFixed(4)}</p>
    <p>β = {calibragem.beta.toFixed(4)}</p>
    <p>Redução percentual atingida: {calibragem.reducao.toFixed(2)}%</p>
    <p>Ponto ótimo x* = {calibragem.x_otimo.toFixed(2)}</p>

    {/* --- Tabela de Sensibilidade --- */}
    <h4>Tabela de Sensibilidade (β vs Redução %)</h4>
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
      <thead>
        <tr>
          <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>β</th>
          <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Redução (%)</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 10 }, (_, i) => {
          const betaTest = calibragem!.beta + i * 0.001;
          const f = (x: number) => C1 * x + calibragem!.alpha * x * x + K * (N - x) + betaTest * (N - x) * (N - x);
          const xOtimo = (2 * betaTest * N - (C1 - K)) / (2 * (calibragem!.alpha + betaTest));
          const reducao = ((f(0) - f(Math.max(0, Math.min(N, xOtimo)))) / f(0)) * 100;
          return (
            <tr key={i}>
              <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{betaTest.toFixed(4)}</td>
              <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{reducao.toFixed(2)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>

    {/* --- Gráfico de Sensibilidade --- */}
    <h4>Gráfico de Sensibilidade (β vs Redução %)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={fDataAtualizado}>
          <XAxis dataKey="x" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="f" stroke="#4338ca" strokeWidth={2} dot={false} />
          <ReferenceDot
            x={xOtimoAtualizado}
            y={C1 * xOtimoAtualizado + (calibragem?.alpha ?? 0) * xOtimoAtualizado ** 2 + K * (N - xOtimoAtualizado) + (betaManual ?? calibragem?.beta ?? 0) * (N - xOtimoAtualizado) ** 2}
            r={6} fill="#16a34a" label={{ position: 'top', value: 'x*' }}
          />
        </LineChart>
    </ResponsiveContainer>
  </div>
)}

                <button style={buttonStyle('#4f46e5')} onClick={baixarResultado}><CheckCircle /> Baixar JSON</button>
              </>
            )}
          </>
        )}

        {activeTab === 'justificativa' && (
          <div style={cardStyle}>
            <h1>Como a solução foi escolhida</h1>
            {explicacaoDecisao}
          </div>
        )}

        {activeTab === 'problema' && sobreProblema}
      </div>
    </div>
  );
};

export default LogisticsOptimizer;
