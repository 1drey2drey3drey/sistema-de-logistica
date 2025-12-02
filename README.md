# Sistema de Otimização Logística Baseado em Modelo Matemático

## Estrutura de Pastas

```
├── backend
│   ├── app.py                # Aplicação Flask
│   ├── requirements.txt      # Dependências Python
│   ├── data                  # CSVs processados (gerados)
│   └── logs
│       └── otimizacao.log    # Logs do sistema
│
├── datasets
│   ├── cem.csv
│   ├── duzentos.csv
│   └── chamados_exemplo.csv  # CSV de exemplo para testes
│
├── frontend
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── public
│   │   └── index.html
│   └── src
│       ├── App.tsx
│       ├── App.css
│       ├── index.tsx
│       └── index.css
│
└── tests
    └── script_teste.py       # Testes automatizados
```

---

## Descrição do Projeto

Este projeto desenvolve um **sistema full stack de otimização logística** para alocação de chamados de manutenção urbana entre bases operacionais. O problema é modelado como uma **função não-linear de custo total**, considerando custos fixos e sobrecargas quadráticas. O sistema calcula automaticamente a alocação ótima usando **Cálculo Diferencial**, com validação em **Python (Flask, SymPy, pandas)** e interface em **React**.

**Autores:** Andrey Lourival e Andrey de Matos
**Instituição:** CESUPA
**Disciplina:** Cálculo Diferencial e Integral
**Data:** Dezembro de 2024

---

## Requisitos do Sistema

### Backend

* Python 3.11+
* Flask 3.0+
* pandas 2.0+
* NumPy 1.24+
* SymPy 1.12+
* scikit-learn 1.3+

### Frontend

* Node.js 18+
* React 18.2+
* TypeScript 5.0+
* Tailwind CSS
* Recharts 3.5+

---

## Instalação e Configuração

### Backend

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## Uso

### Upload e Processamento de CSV

Acesse `http://localhost:3000`. Faça upload de CSV com campos: `base`, `distancia`, `tempo`. O sistema retorna:

* Alocação ótima (`x_otimo`)
* Custo total
* Economia percentual

### Endpoints API REST

* `GET /` → Documentação
* `POST /otimizar` → Recebe CSV e retorna otimização
* `GET /prova` → Prova simbólica com SymPy
* `GET /exemplo` → CSV de exemplo
* `GET /health` → Status do servidor

### Reproduzindo Experimentos com SymPy

```python
from sympy import symbols, diff, solve

x = symbols('x')
C1, K, alpha, beta, N = 4.53, 5.875, 0.005, 0.003, 100
f = C1*x + alpha*x**2 + K*(N-x) + beta*(N-x)**2
f_prime = diff(f, x)
x_opt = solve(f_prime, x)
print(x_opt)

f_double_prime = diff(f_prime, x)
print(f_double_prime)  # Deve ser > 0 para confirmar mínimo global
```

### Importação e Exportação de Dados

**Importar CSV para otimização:**

```python
import pandas as pd
df = pd.read_csv('datasets/chamados_exemplo.csv')
```

**Exportar resultados para CSV:**

```python
resultado = {
    "N": 100,
    "C1": 4.53,
    "K": 5.875,
    "x_otimo": 100,
    "custo_otimo": 503.0,
    "economia_percentual": 18.5
}
pd.DataFrame([resultado]).to_csv('backend/data/resultado_otimizacao.csv', index=False)
```

### Testes Automatizados

```bash
cd tests
python script_teste.py
```

Testes incluem:

* Prova simbólica
* Processamento de dados simulados
* Análise de sensibilidade
* Exportação de resultados

---

## Limitações

* Modelo simplificado do VRP
* Uso de médias em vez de dados detalhados
* Sobrecarga quadrática como aproximação
* Restrições reais de capacidade não implementadas
* Calibração empírica de α e β

## Trabalhos Futuros

* Extensão para VRP completo e estocástico
* Modelagem em múltiplos períodos
* Integração com sistemas municipais
* Interface web avançada
* Estimativas paramétricas e análise de robustez

## Referências

* LAPORTE, G. The vehicle routing problem: An overview of exact and approximate algorithms. European Journal of Operational Research, v. 59, n. 3, p. 345-358, 1992.
* NOCEDAL, J.; WRIGHT, S. J. Numerical Optimization. 2nd ed. New York: Springer, 2006.
* OLIVEIRA, L. K. et al. Otimização das rotas para veículos de manutenção do sistema de iluminação pública na cidade de Passo Fundo (RS). Redalyc, 2018. Disponível em: [https://www.redalyc.org](https://www.redalyc.org). Acesso em: 01 dez. 2024.
* STEWART, J. Cálculo - Volume 1. 8ª ed. São Paulo: Cengage Learning, 2015.
* TOTH, P.; VIGO, D. Vehicle Routing: Problems, Methods, and Applications. 2nd ed. Philadelphia: SIAM, 2014.
