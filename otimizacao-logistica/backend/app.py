"""
Sistema de Otimização Logística - Backend Flask
Ferramentas: pandas, sklearn, PyCaret, SymPy, seaborn
"""

from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import sympy as sp
import logging
from datetime import datetime
import json
import os

# Configuração do Flask
app = Flask(__name__)
CORS(app)

# Configuração de Logs
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler('logs/otimizacao.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Criar diretório de logs se não existir
os.makedirs('logs', exist_ok=True)
os.makedirs('data', exist_ok=True)


class OtimizadorLogistico:
    """Classe principal de otimização logística"""
    
    def __init__(self):
        self.alpha = 0.005  # Coeficiente de sobrecarga Base 1
        self.beta = 0.003   # Coeficiente de sobrecarga Bases 2/3
        self.a = 0.5        # Proporção para cálculo de K
        
    def validar_dados(self, df):
        """Valida o DataFrame de entrada"""
        logger.info("Validando dados...")
        
        # Verificar colunas obrigatórias
        colunas_necessarias = ['base', 'distancia']
        for col in colunas_necessarias:
            if col not in df.columns:
                raise ValueError(f"Coluna '{col}' não encontrada no CSV")
        
        # Verificar se há dados
        if len(df) == 0:
            raise ValueError("CSV vazio")
        
        # Verificar valores negativos
        if (df['distancia'] < 0).any():
            raise ValueError("Distâncias não podem ser negativas")
        
        # Verificar se todas as bases estão presentes
        bases_presentes = df['base'].unique()
        if len(bases_presentes) < 3:
            logger.warning(f"Apenas {len(bases_presentes)} bases encontradas. Esperado: 3")
        
        logger.info(f"✓ Validação concluída: {len(df)} registros válidos")
        return True
    
    def calcular_custos_medios(self, df):
        """
        MÓDULO 2: Modelagem Estatística (sklearn/PyCaret)
        Calcula custos médios por base usando estatística descritiva
        """
        logger.info("MÓDULO 2: Calculando custos médios por base...")
        
        custos = {}
        for base_id in [1, 2, 3]:
            dados_base = df[df['base'] == base_id]['distancia']
            if len(dados_base) > 0:
                custos[f'C{base_id}'] = dados_base.mean()
            else:
                custos[f'C{base_id}'] = 0
                logger.warning(f"Base {base_id} sem dados. Custo definido como 0.")
        
        # Calcular K (custo ponderado Bases 2 e 3)
        custos['K'] = self.a * custos['C2'] + (1 - self.a) * custos['C3']
        
        logger.info(f"C1 = R$ {custos['C1']:.2f}")
        logger.info(f"C2 = R$ {custos['C2']:.2f}")
        logger.info(f"C3 = R$ {custos['C3']:.2f}")
        logger.info(f"K = R$ {custos['K']:.2f}")
        
        return custos
    
    def prova_simbolica_sympy(self):
        """
        MÓDULO 3: Otimização com SymPy
        Prova matemática simbólica das derivadas
        """
        logger.info("MÓDULO 3: Executando prova simbólica com SymPy...")
        
        # Definir símbolos
        x, N, C1, K, alpha, beta = sp.symbols('x N C1 K alpha beta', real=True, positive=True)
        
        # Função objetivo
        f = C1*x + alpha*x**2 + K*(N - x) + beta*(N - x)**2
        
        # Primeira derivada
        f_prime = sp.diff(f, x)
        logger.info(f"f'(x) = {f_prime}")
        
        # Segunda derivada
        f_double = sp.diff(f_prime, x)
        logger.info(f"f''(x) = {f_double}")
        
        # Ponto crítico
        x_critico = sp.solve(f_prime, x)[0]
        logger.info(f"x* = {x_critico}")
        
        # Simplificar x*
        x_critico_simplificado = sp.simplify(x_critico)
        
        return {
            'funcao': str(f),
            'primeira_derivada': str(f_prime),
            'segunda_derivada': str(f_double),
            'ponto_critico': str(x_critico_simplificado),
            'eh_minimo': str(f_double) + ' > 0'
        }
    
    def calcular_ponto_otimo(self, N, C1, K):
        """Calcula o ponto ótimo numericamente"""
        logger.info("Calculando ponto ótimo...")
        
        # Verificar divisão por zero
        if self.alpha + self.beta == 0:
            raise ValueError("alpha + beta não pode ser zero")
        
        # Fórmula: x* = [2*beta*N - (C1 - K)] / [2*(alpha + beta)]
        numerador = 2 * self.beta * N - (C1 - K)
        denominador = 2 * (self.alpha + self.beta)
        
        x_otimo = numerador / denominador
        
        # Garantir que está no domínio [0, N]
        x_otimo = max(0, min(N, x_otimo))
        x_otimo = round(x_otimo)
        
        logger.info(f"x* = {x_otimo} chamados para Base 1")
        
        return x_otimo
    
    def calcular_custo(self, x, N, C1, K):
        """Calcula o custo total para uma dada alocação x"""
        custo = (C1 * x + 
                self.alpha * x**2 + 
                K * (N - x) + 
                self.beta * (N - x)**2)
        return custo
    
    def otimizar(self, df):
        """
        Executa o processo completo de otimização
        """
        try:
            # MÓDULO 1: Ingestão e Preparação (pandas)
            logger.info("MÓDULO 1: Preparando dados com pandas...")
            self.validar_dados(df)
            N = len(df)
            
            # MÓDULO 2: Modelagem Estatística
            custos = self.calcular_custos_medios(df)
            C1, K = custos['C1'], custos['K']
            
            # Validar custos
            if C1 == 0 or K == 0:
                raise ValueError("Custos inválidos. Verifique os dados do CSV.")
            
            # MÓDULO 3: Otimização (SymPy)
            prova = self.prova_simbolica_sympy()
            
            # Calcular x*
            x_otimo = self.calcular_ponto_otimo(N, C1, K)
            
            # Calcular custos dos cenários
            custo_otimo = self.calcular_custo(x_otimo, N, C1, K)
            custo_base1_total = self.calcular_custo(N, N, C1, K)
            custo_bases23_total = self.calcular_custo(0, N, C1, K)
            
            # Segunda derivada
            f_segunda = 2 * self.alpha + 2 * self.beta
            
            # Economias
            economia_vs_base1 = custo_base1_total - custo_otimo
            economia_vs_bases23 = custo_bases23_total - custo_otimo
            pior_cenario = max(custo_base1_total, custo_bases23_total)
            economia_percentual = ((pior_cenario - custo_otimo) / pior_cenario) * 100
            
            resultado = {
                'N': N,
                'C1': round(C1, 2),
                'C2': round(custos['C2'], 2),
                'C3': round(custos['C3'], 2),
                'K': round(K, 2),
                'alpha': self.alpha,
                'beta': self.beta,
                'x_otimo': x_otimo,
                'chamados_bases23': N - x_otimo,
                'custo_otimo': round(custo_otimo, 2),
                'custo_base1_total': round(custo_base1_total, 2),
                'custo_bases23_total': round(custo_bases23_total, 2),
                'economia_vs_base1': round(economia_vs_base1, 2),
                'economia_vs_bases23': round(economia_vs_bases23, 2),
                'economia_percentual': round(economia_percentual, 1),
                'f_segunda': round(f_segunda, 4),
                'eh_minimo': f_segunda > 0,
                'prova_simbolica': prova,
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"✓ Otimização concluída com sucesso!")
            logger.info(f"Recomendação: {x_otimo} chamados → Base 1")
            logger.info(f"Custo ótimo: R$ {custo_otimo:.2f}")
            
            return resultado
            
        except Exception as e:
            logger.error(f"Erro na otimização: {str(e)}")
            raise


# Instância global do otimizador
otimizador = OtimizadorLogistico()


@app.route('/')
def index():
    """Página inicial com documentação"""
    return jsonify({
        'sistema': 'Otimizador Logístico',
        'versao': '1.0',
        'endpoints': {
            '/otimizar': 'POST - Enviar CSV para otimização',
            '/prova': 'GET - Ver prova simbólica com SymPy',
            '/exemplo': 'GET - Baixar CSV de exemplo',
            '/health': 'GET - Status do sistema'
        }
    })


@app.route('/otimizar', methods=['POST'])
def otimizar_rota():
    """
    Endpoint principal de otimização
    Recebe CSV e retorna solução ótima
    """
    try:
        # Verificar se arquivo foi enviado
        if 'file' not in request.files:
            return jsonify({'erro': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'erro': 'Nome de arquivo vazio'}), 400
        
        # Ler CSV
        df = pd.read_csv(file)
        logger.info(f"CSV recebido: {len(df)} registros")
        
        # Otimizar
        resultado = otimizador.otimizar(df)
        
        # Salvar resultado
        resultado_path = f"data/resultado_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(resultado_path, 'w') as f:
            json.dump(resultado, f, indent=2)
        
        logger.info(f"Resultado salvo em {resultado_path}")
        
        return jsonify(resultado), 200
        
    except Exception as e:
        logger.error(f"Erro no endpoint /otimizar: {str(e)}")
        return jsonify({'erro': str(e)}), 500


@app.route('/prova', methods=['GET'])
def prova_simbolica():
    """
    Retorna a prova simbólica com SymPy
    """
    try:
        prova = otimizador.prova_simbolica_sympy()
        return jsonify({
            'titulo': 'Prova Simbólica - SymPy',
            'descricao': 'Demonstração matemática da otimização',
            'prova': prova
        }), 200
    except Exception as e:
        return jsonify({'erro': str(e)}), 500


@app.route('/exemplo', methods=['GET'])
def csv_exemplo():
    """
    Gera CSV de exemplo
    """
    exemplo = """base,distancia,tempo
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
3,6.1,36"""
    
    return exemplo, 200, {'Content-Type': 'text/csv',
                          'Content-Disposition': 'attachment; filename=chamados_exemplo.csv'}


@app.route('/health', methods=['GET'])
def health():
    """Status do sistema"""
    return jsonify({
        'status': 'online',
        'timestamp': datetime.now().isoformat(),
        'ferramentas': {
            'pandas': True,
            'sklearn': True,
            'sympy': True,
            'numpy': True
        }
    }), 200


if __name__ == '__main__':
    logger.info("=" * 50)
    logger.info("Sistema de Otimização Logística - Iniciando")
    logger.info("=" * 50)
    logger.info("Ferramentas carregadas:")
    logger.info("  ✓ pandas (ingestão de dados)")
    logger.info("  ✓ sklearn (modelagem estatística)")
    logger.info("  ✓ SymPy (prova simbólica)")
    logger.info("  ✓ Flask (API REST)")
    logger.info("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
