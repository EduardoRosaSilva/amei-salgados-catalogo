# 🍕 Cardápio Digital & Central de Links - Amei Salgados

[![Netlify Status](https://api.netlify.com/api/v1/badges/SEU_ID_DO_NETLIFY/deploy-status)](https://app.netlify.com/sites/SEU_NOME_NO_NETLIFY/deploys)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> Uma aplicação serverless (Front-end puro) desenvolvida para digitalizar e otimizar o fluxo de pedidos de um negócio local do setor alimentício.

🔗 **[Acessar o Projeto em Produção](https://SEU-LINK-DO-NETLIFY.netlify.app/)**

---

## 🎯 O Problema e a Solução
A "Amei Salgados" precisava de uma forma ágil de receber pedidos via WhatsApp sem os gargalos de um atendimento manual prolongado, além de uma interface moderna para a bio do Instagram. 

A solução desenvolvida foi uma **arquitetura estática com gestão dinâmica de dados**. O cardápio é montado em tempo real consumindo os dados de uma planilha do Google Sheets (atuando como um Headless CMS/Database). Isso garante autonomia total ao cliente para alterar preços e disponibilidade de produtos sem a necessidade de intervenção técnica ou custos com hospedagem de servidores e banco de dados.

## ✨ Principais Funcionalidades

- **📡 Integração Real-Time:** Leitura assíncrona (`fetch` API) do Google Sheets via TSV, renderizando os produtos instantaneamente.
- **🛒 Carrinho de Compras Dinâmico:** Gestão de estado local para itens simples e complexos (ex: montagem de "Cento Misto" com validação de quantidade exata).
- **Checkout Inteligente via WhatsApp:** Geração de um payload formatado e redirecionamento automático para a API do WhatsApp com os dados estruturados do pedido, observações e cálculos totais.
- **⏰ Lógica de Funcionamento Automática:** Algoritmo que verifica dia e horário local, bloqueando agendamentos aos domingos e feriados cadastrados, e ajustando o fechamento do seletor de horários dinamicamente (dias úteis vs. finais de semana).
- **🛡️ UX e Proteção Front-end:** Sistema de modais interativos, bloqueio de ações de desenvolvedor no client-side (context menu e atalhos de console) para evitar manipulações acidentais na interface durante a experiência do usuário leigo.
- **📱 Design Responsivo e Modular:** UI construída com TailwindCSS garantindo fluidez desde dispositivos móveis até telas desktop. O código segue os princípios de *Separation of Concerns* (HTML, CSS e JS modularizados).

---

## 🛠️ Stack Tecnológica & Arquitetura

O projeto foi construído focando em alta performance e custo zero de infraestrutura para o cliente:
- **Core:** HTML5, CSS3, JavaScript (ES6+ Vanilla).
- **Estilização:** Tailwind CSS (via CDN para agilidade no deploy).
- **Database/CMS:** Google Sheets (Published as TSV).
- **Deploy & CI/CD:** Hospedado na CDN global do **Netlify**, com integração contínua diretamente deste repositório GitHub.



1. Clone o repositório:
   ```bash
   git clone [https://github.com/SEU-USUARIO/amei-salgados-app.git](https://github.com/SEU-USUARIO/amei-salgados-app.git)
