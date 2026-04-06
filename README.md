# SafeDoc Frontend

Front-end do MVP do **SafeDoc AI**, uma plataforma para gestão de documentos obrigatórios e compliance operacional de franquias e empresas com múltiplas unidades.

## Status do projeto

Front-end validado e pronto para integração com o back-end.

## Observações importantes

- A análise com IA está **simulada no front-end**.
- O back-end ainda **não foi integrado**.
- Algumas ações funcionam com **dados mockados** para demonstração do MVP.

## Telas disponíveis

- Login
- Dashboard
- Unidades
- Detalhe da unidade
- Upload de documento
- Resultado da análise com IA
- Documentos obrigatórios

## Estrutura do projeto

```txt
safedoc-frontend/
├── README.md
├── index.html
├── assets/
│   ├── icons/
│   └── images/
├── css/
│   ├── reset.css
│   ├── global.css
│   ├── components.css
│   └── pages.css
├── js/
│   ├── main.js
│   └── mock.js
└── pages/
    ├── login.html
    ├── dashboard.html
    ├── unidades.html
    ├── unidade-detalhe.html
    ├── upload-documento.html
    ├── analise-ia.html
    └── documentos-obrigatorios.html
