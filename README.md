# Loja Parceira Ton Manaus — LP

Landing page do Parceiro Autorizado Ton em Manaus, para geração de leads via Google Ads.

## Stack
- Astro 5 (SSG estático)
- Tailwind CSS 3
- WebGL shader (Aurora que segue o cursor)
- Deploy: Cloudflare Pages

## Como rodar

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # gera dist/ estático
npm run preview
```

## Estrutura

- `src/pages/index.astro` — página principal
- `src/components/` — Header, Hero, Models, Plans, WhyHere, Store, LeadForm, Faq, Footer, AuroraCanvas
- `src/layouts/Layout.astro` — SEO, meta, LocalBusiness schema, gtag
- `public/img/` — **fotos da loja (Ed vai subir)**: `hero-loja.jpg`, `fachada.jpg`, `balcao.jpg`, `atendimento.jpg`, e por modelo `t1.jpg`, `t2.jpg`, `t3.jpg`, `t3smart.jpg`, `tapton.jpg`

## Checklist pré-publicação

- [ ] Configurar `GTAG_ID` em `src/layouts/Layout.astro` (Google Ads AW-... ou GA4 G-...)
- [ ] Subir fotos em `public/img/` e trocar os placeholders `[ foto X ]` nos componentes
- [ ] Registrar domínio `parceirostonmanaus.com.br` no Registro.br
- [ ] Deploy Cloudflare Pages (via `git push`) e apontar DNS
- [ ] Criar/vincular Google Business Profile da loja física
- [ ] Configurar conversões no Google Ads (evento `lead_form_submit` e `whatsapp_click`)

## Regras de conteúdo (Renda Ton)

- Sempre identificar como "Parceiro Autorizado Ton" / "Parceiro Renda Ton"
- Disclaimer obrigatório no rodapé (já incluído)
- Nunca usar "Ton" em rádio/TV/outdoor sem autorização de `aprovarendaton@stone.com.br`
- Ver `PLANO.md` pra detalhes completos
