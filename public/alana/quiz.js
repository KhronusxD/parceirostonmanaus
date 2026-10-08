
/* ====== CONFIGURAÇÃO DO ATENDENTE — trocar só este bloco por versão ====== */
const AT = {
  nome: "Alana",
  guia: "../img/alana.webp",
  whatsapp: "5592993155508",   // <<< WhatsApp deste atendente
  /* Vai como "*Origem:* #josias" no fim da mensagem. As duas páginas caem no MESMO
     número, então é só por aqui que se conta quantos vieram de cada link. Pesquisar
     "#josias" ou "#alana" no WhatsApp dá o total de cada um. */
  codigo: "ALANA",
  gyrehub: "0wc3vt",       // slug do formulário no GyreHub (vazio desliga)
  /* Horário de atendimento, SEMPRE em hora de Manaus (UTC-4, sem horário de verão).
     dias: 0=dom … 6=sáb. Fora da janela o aviso diz a que horas ele volta, em vez de
     prometer alguém do outro lado. sempre:true ignora o horário. */
  horario: {dias:[1,2,3,4,5,6], de:8, ate:18, sempre:false},
  pixel: "882829890919527"    // pixel "Parceiros Ton Manaus"
};
/* ======================================================================== */

/* ===== GyreHub — a página mantém a própria tela e só reporta pra lá ===== */
const GH = { base:"https://gyrehub.com.br/api/f", sessao:null, pronto:null,
             voando:new Set(), temLead:false, concluido:false, timer:null };

function ghPost(corpo){
  return fetch(GH.base + "/" + AT.gyrehub + "/ingest", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify(corpo), keepalive:true
  }).then(r=>r.json()).catch(()=>({}));
}
function gh(evento, extra){
  if (!AT.gyrehub) return Promise.resolve();
  if (evento === "inicio"){
    GH.pronto = ghPost(Object.assign({evento:"inicio"}, extra || {}))
      .then(d => { if (d && d.sessao) GH.sessao = d.sessao; });
    return GH.pronto;
  }
  if (GH.concluido) return Promise.resolve();
  const p = (GH.pronto || Promise.resolve())
    .then(() => GH.sessao ? ghPost(Object.assign({evento, sessao:GH.sessao}, extra || {})) : null)
    .catch(()=>{}).finally(()=> GH.voando.delete(p));
  GH.voando.add(p);
  return p;
}
function ghConcluir(){
  if (!AT.gyrehub || !GH.temLead || GH.concluido) return Promise.resolve();
  GH.concluido = true; clearTimeout(GH.timer);
  return Promise.all([...GH.voando])
    .then(()=> GH.sessao ? ghPost({evento:"conclusao", sessao:GH.sessao}) : null);
}
function ghFallback(ms){
  if (!AT.gyrehub || GH.concluido) return;
  clearTimeout(GH.timer); GH.timer = setTimeout(ghConcluir, ms);
}
/* text/plain de propósito: application/json obriga preflight e sendBeacon não faz preflight */
function ghBeacon(){
  if (!AT.gyrehub || !GH.sessao || !GH.temLead || GH.concluido) return;
  GH.concluido = true; clearTimeout(GH.timer);
  const corpo = JSON.stringify({evento:"conclusao", sessao:GH.sessao});
  if (navigator.sendBeacon)
    navigator.sendBeacon(GH.base + "/" + AT.gyrehub + "/ingest",
      new Blob([corpo], {type:"text/plain;charset=UTF-8"}));
  else ghPost({evento:"conclusao", sessao:GH.sessao});
}
addEventListener("pagehide", ghBeacon);
addEventListener("visibilitychange", ()=>{ if (document.visibilityState === "hidden") ghBeacon(); });

/* Quem separa Josias de Alana é o formulário: há um slug pra cada um. Não adianta
   mandar o atendente aqui — o GyreHub só guarda utm_*, fbclid, gclid e referrer,
   e descarta o resto sem avisar. */
function ghTracking(){
  const q = new URLSearchParams(location.search), t = {};
  ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid","gclid"]
    .forEach(k=>{ const v=q.get(k); if (v) t[k]=v; });
  if (document.referrer) t.referrer = document.referrer;
  return t;
}

/* ===== disponibilidade do atendente, na hora de Manaus =====
   O visitante pode estar em qualquer fuso; o que vale é o relógio de quem atende. */
function horaManaus(){
  const d = new Date();
  return new Date(d.getTime() + d.getTimezoneOffset()*60000 - 4*3600000);
}
function disponivel(){
  if (AT.horario.sempre) return true;
  const m = horaManaus();
  return AT.horario.dias.includes(m.getDay())
      && m.getHours() >= AT.horario.de && m.getHours() < AT.horario.ate;
}
function pintaStatus(){
  const on = disponivel();
  const txtLongo = on
    ? AT.nome + " está disponível agora"
    : AT.nome + " responde a partir das " + AT.horario.de + "h";
  const txtCurto = on ? "disponível" : "responde às " + AT.horario.de + "h";
  [["startStatus", txtLongo], ["resStatus", txtLongo]].forEach(([id, t])=>{
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = t; el.classList.toggle("fora", !on);
  });
  const h = document.getElementById("hudStatus");
  if (h){ h.textContent = txtCurto; h.classList.toggle("fora", !on); }
}

/* ===== pixel da Meta ===== */
function px(n, d){
  if (!window.fbq) return;
  const padrao = ["Lead","Contact","ViewContent","CompleteRegistration","InitiateCheckout"];
  fbq(padrao.includes(n) ? "track" : "trackCustom", n, d || {});
}

/* ===== som: bipes gerados na hora, sem arquivo ===== */
let ac = null, mudo = localStorage.getItem("ton_mudo") === "1";
function bip(freq, dur, tipo, vol){
  if (mudo) return;
  try{
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === "suspended") ac.resume();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo || "square"; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || .055, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur);
  }catch(e){}
}
const somTecla  = ()=> bip(660, .035, "square", .02);
const somEscolhe= ()=> { bip(520,.06); setTimeout(()=>bip(780,.09),55); };
const somVolta  = ()=> bip(300, .09, "triangle");
const somVitoria= ()=> { [523,659,784,1047].forEach((f,i)=> setTimeout(()=>bip(f,.14,"square",.05), i*95)); };
function mutar(){
  mudo = !mudo;
  localStorage.setItem("ton_mudo", mudo ? "1" : "0");
  document.getElementById("som").classList.toggle("mudo", mudo);
  if (!mudo) somEscolhe();
}

/* ===== conteúdo ===== */
const MODELOS = {
  t1:{nome:"TON T1", sub:"A menor e mais leve da linha. Conecta no seu celular por Bluetooth.",
      de:null, por:"R$ 16,80",
      bullets:["Cabe no bolso, vai pra qualquer lugar","Usa o seu celular pra conectar","Ideal pra delivery, feira e atendimento em movimento"],
      pra:"Delivery · Feira · Serviço em movimento"},
  t2:{nome:"TON T2", sub:"Autônoma: tem chip próprio e Wi-Fi, não depende do seu celular.",
      de:"R$ 49,88", por:"R$ 37,41",
      bullets:["Chip próprio e Wi-Fi, funciona sozinha","Comprovante por SMS ou e-mail","Ideal pra quem atende fora e não quer depender de sinal"],
      pra:"Consultório · Serviço em campo"},
  t3:{nome:"TON T3", sub:"A mais vendida. Tudo da T2 com impressora térmica e teclado.",
      de:"R$ 108,00", por:"R$ 81,00",
      bullets:["Imprime o comprovante na hora","Teclado pra digitar o valor rápido","Ideal pra balcão com fila e movimento"],
      pra:"Loja · Restaurante · Balcão"},
  t3s:{nome:"TON T3 SMART", sub:"Top de linha. Android embarcado, tela grande e impressora.",
      de:"R$ 191,88", por:"R$ 143,91",
      bullets:["Tela ampla e interface fluida","Android embarcado, opera rápido","Ideal pra fluxo alto e operação premium"],
      pra:"Loja premium · Fluxo alto"}
};

const PERGUNTAS = [
 {t:"ONDE VOCÊ VENDE?", fala:"Bora montar seu pedido! Primeiro me diz: onde o dinheiro entra?",
  o:[
   {x:"Na rua, em movimento", d:"Delivery, feira, aplicativo", p:{t1:3},
    r:"Quem vende andando não pode carregar peso. Já anotei aqui."},
   {x:"No balcão da minha loja", d:"Loja, restaurante, mercadinho", p:{t3:3},
    r:"Balcão com fila pede comprovante na hora. Tô de olho numa máquina aqui."},
   {x:"Vou até o cliente", d:"Consultório, serviço em campo", p:{t2:3},
    r:"Então você precisa de uma que ande sozinha, sem depender do seu celular."},
   {x:"Tenho loja e vendo online", d:"Movimento alto", p:{t3s:2, t3:1},
    r:"Movimento alto muda o modelo, viu. Guarda essa resposta."}]},

 {t:"JÁ TEM MAQUININHA?", fala:"Agora me conta como tá hoje. Sem vergonha.",
  o:[
   {x:"Não, vai ser a primeira", d:"Tô começando agora", p:{t1:1, t2:1},
    r:"Primeira máquina! Relaxa que eu te explico tudo sem enrolação."},
   {x:"Tenho, mas quero trocar", d:"Taxa alta ou máquina ruim", p:{t3:1, t3s:1},
    r:"Trocar é o pedido mais comum. Quase sempre é taxa. Eu te mostro a conta."},
   {x:"Tenho e quero mais uma", d:"Pra não perder venda na fila", p:{t1:2},
    r:"Segunda máquina é esperto: dois clientes pagando ao mesmo tempo."}]},

 {t:"QUANTO VOCÊ VENDE POR MÊS?", fala:"Essa aqui define sua taxa. Pode falar à vontade.",
  o:[
   {x:"Até R$ 5 mil", d:"", p:{t1:2},
    r:"Beleza. Dá pra começar leve e crescer depois."},
   {x:"R$ 5 mil a R$ 15 mil", d:"", p:{t2:2},
    r:"Esse volume já abre conversa de taxa. Anotado."},
   {x:"R$ 15 mil a R$ 50 mil", d:"", p:{t3:2},
    r:"Com esse volume eu consigo taxa melhor pra você."},
   {x:"Mais de R$ 50 mil", d:"", p:{t3s:3},
    r:"Volume alto! Esse eu levo pro gerente e volto com proposta especial."}]},

 {t:"O QUE NÃO PODE FALTAR?", fala:"Última técnica, prometo. Escolhe a mais importante.",
  o:[
   {x:"Caber no bolso", d:"Leve, pra levar pra todo lado", p:{t1:3},
    r:"Anotado: leve."},
   {x:"Funcionar sem o celular", d:"Chip próprio", p:{t2:3},
    r:"Anotado: independente."},
   {x:"Imprimir o comprovante", d:"Papel na mão do cliente", p:{t3:3},
    r:"Anotado: com impressora."},
   {x:"Tela grande e rápida", d:"Operação ágil", p:{t3s:3},
    r:"Anotado: tela grande."}]},

 {t:"QUANDO QUER COMEÇAR?", fala:"Pra eu saber se corro ou se te dou um tempo.",
  o:[
   {x:"Hoje mesmo", d:"Tô perdendo venda sem máquina", p:{},
    r:"Então vamos correr! Já separo a sua."},
   {x:"Essa semana", d:"", p:{},
    r:"Dá tempo de deixar tudo redondo. Fechado."},
   {x:"Esse mês", d:"", p:{},
    r:"Tranquilo, sem pressa."},
   {x:"Só pesquisando", d:"Quero entender as opções", p:{},
    r:"Sem problema! Eu te mostro tudo e você decide depois."}]}
];

const CARREGANDO = ["Lendo suas respostas","Comparando os 4 modelos",
                    "Checando a taxa pro seu volume","Montando seu pedido"];

/* ===== estado ===== */
let i = 0, pts = {}, respostas = [], modeloId = "", nome = "", zap = "", digitando = null;
const $ = id => document.getElementById(id);

function tela(id){
  document.querySelectorAll(".scr").forEach(s=>s.classList.remove("on"));
  $(id).classList.add("on");
  scrollTo({top:0, behavior:"smooth"});
}
function hud(on){
  $("hud").classList.toggle("off", !on);
  $("hudFace").src = AT.guia; $("hudNome").textContent = AT.nome.toUpperCase();
  pintaStatus();
}
function prog(p){ $("barFill").style.width = p + "%"; }

/* máquina de escrever; clicar pula pro fim */
function escreve(el, txt){
  clearInterval(digitando);
  const balao = el.closest(".balao");
  balao.classList.remove("pronto");
  el.textContent = ""; let k = 0;
  const fim = ()=>{ clearInterval(digitando); el.textContent = txt; balao.classList.add("pronto"); };
  digitando = setInterval(()=>{
    el.textContent = txt.slice(0, ++k);
    if (k % 2 === 0) somTecla();
    if (k >= txt.length) fim();
  }, 22);
  balao.onclick = fim;
}

function comecar(){
  bip(440,.07); setTimeout(()=>bip(660,.12),70);
  px("ViewContent",{content_name:"quiz_ton_start"});
  gh("inicio",{tracking:ghTracking()});
  i = 0; pts = {}; respostas = [];
  hud(true); render();
}

function render(){
  const q = PERGUNTAS[i];
  tela("s-quiz");
  $("hudFase").textContent = "FASE " + (i+1) + "/" + PERGUNTAS.length;
  prog(i / PERGUNTAS.length * 100);
  $("qFace").src = AT.guia;
  $("qTitulo").textContent = q.t;
  escreve($("qFala"), respostas[i] ? respostas[i].r : q.fala);
  $("btnVoltar").style.visibility = i ? "visible" : "hidden";

  const box = $("qOpcoes"); box.innerHTML = "";
  q.o.forEach((o, k)=>{
    const b = document.createElement("button");
    b.className = "op" + (respostas[i] === o ? " sel" : "");
    b.innerHTML = "<b>" + o.x + "</b>" + (o.d ? "<i>" + o.d + "</i>" : "");
    b.onclick = ()=> escolher(o, b);
    box.appendChild(b);
  });
}

function escolher(o, el){
  somEscolhe();
  document.querySelectorAll(".op").forEach(b=>b.classList.remove("sel"));
  el.classList.add("sel");
  respostas[i] = o;
  gh("resposta",{pergunta: PERGUNTAS[i].t, valor: o.x});
  escreve($("qFala"), o.r);
  prog((i+1) / PERGUNTAS.length * 100);
  setTimeout(()=>{
    i++;
    if (i < PERGUNTAS.length) render(); else captura();
  }, 1250);
}

function voltar(){
  if (!i) return;
  somVolta(); i--; render();
}

function captura(){
  tela("s-lead");
  $("hudFase").textContent = "QUASE LÁ";
  prog(92);
  $("lFace").src = AT.guia;
  escreve($("lFala"), "Já sei qual é a sua! Me diz seu nome e WhatsApp que eu te mostro.");
  px("CompleteRegistration",{content_name:"quiz_ton_perguntas_fim"});
}

function enviar(){
  nome = $("inNome").value.trim();
  zap  = $("inZap").value.replace(/\D/g, "");
  if (nome.length < 2){ $("inNome").focus(); return alert("Me diz seu nome 🙂"); }
  if (zap.length < 10){ $("inZap").focus(); return alert("Confere o WhatsApp, parece faltar número"); }
  somEscolhe();
  calcular();
  const m = MODELOS[modeloId];
  /* Tudo que importa sobe AGORA, não na tela de resultado: entre uma e outra há 3,3s
     de carregamento, e quem troca de app nesse meio fecha a sessão (o beacon dispara
     no visibilitychange) sem a marca nem o resumo. */
  gh("resposta",{pergunta:"Qual é o seu nome?", valor:nome});
  gh("resposta",{pergunta:"Qual seu WhatsApp?", valor:zap});
  gh("resposta",{pergunta:"Maquininha recomendada", valor:m.nome});
  gh("resposta",{pergunta:"Resumo do pedido",
     valor: m.nome + " · " + respostas.map(o=>o.x).join(" · ")});
  GH.temLead = true;
  ghFallback(60000);
  px("Lead",{content_name:"quiz_ton", modelo:m.nome});
  carregando();
}

function calcular(){
  pts = {};
  respostas.forEach(o => { for (const k in o.p) pts[k] = (pts[k] || 0) + o.p[k]; });
  modeloId = Object.keys(MODELOS).sort((a,b)=>(pts[b]||0)-(pts[a]||0))[0];
}

function carregando(){
  tela("s-load"); prog(96);
  $("ldFace").src = AT.guia;
  const ul = $("ldLista"); ul.innerHTML = "";
  CARREGANDO.forEach(t=>{ const li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
  const itens = [...ul.children];
  itens.forEach((li, k)=> setTimeout(()=>{
    li.classList.add("ok"); bip(520 + k*90, .07);
    $("ldBar").style.width = ((k+1)/itens.length*100) + "%";
  }, 520 + k*600));
  setTimeout(resultado, 520 + itens.length*600 + 420);
}

function resultado(){
  const m = MODELOS[modeloId];
  tela("s-res"); prog(100);
  $("hudFase").textContent = "PRONTO!";
  $("rFace").src = AT.guia;
  $("rNome").textContent = AT.nome.toUpperCase();
  escreve($("rFala"), nome.split(" ")[0] + ", essa aqui é a sua! Tenho em estoque aqui em Manaus. Me chama que eu já separo.");

  $("rModelo").textContent = m.nome;
  $("rSub").textContent = m.sub;
  $("rPor").textContent = m.por;
  $("rDe").textContent = m.de || "";
  $("rDe").parentElement.style.display = m.de ? "block" : "none";

  if (m.de){
    const de = parseFloat(m.de.replace(/[^\d,]/g,"").replace(",","."));
    const por = parseFloat(m.por.replace(/[^\d,]/g,"").replace(",","."));
    const eco = ((de - por) * 12).toFixed(2).replace(".", ",");
    $("rEco").textContent = "VOCÊ ECONOMIZA R$ " + eco + " EM 12x";
    $("rEco").style.display = "block";
  } else $("rEco").style.display = "none";

  $("rBullets").innerHTML = m.bullets.map(b => "<li>" + b + "</li>").join("");
  $("rResumo").innerHTML = PERGUNTAS.map((q, k) =>
    respostas[k] ? "<li>" + q.t.replace("?","").toLowerCase() + ": <b>" + respostas[k].x + "</b></li>" : "").join("");
  $("rRodape").textContent = "Atendimento com " + AT.nome + " · Parceiro Ton oficial";

  somVitoria(); confete();
  px("InitiateCheckout",{content_name:"quiz_ton_resultado", modelo:m.nome});
}

function confete(){
  const cores = ["#2BD44A","#A8E82B","#FFFFFF","#13833A"];
  for (let k = 0; k < 44; k++){
    const d = document.createElement("div");
    d.className = "px";
    d.style.left = Math.random()*100 + "vw";
    d.style.top = "-14px";
    d.style.background = cores[k % cores.length];
    document.body.appendChild(d);
    const dur = 1500 + Math.random()*1300;
    d.animate([{transform:"translateY(0) rotate(0)"},
               {transform:"translateY(" + (innerHeight+60) + "px) rotate(" + (Math.random()*540-270) + "deg)"}],
              {duration:dur, easing:"linear"}).onfinish = ()=> d.remove();
  }
}

function irWhats(){
  ghConcluir();
  const m = MODELOS[modeloId];
  const linhas = PERGUNTAS.map((q,k)=> respostas[k] ? "▪️ " + respostas[k].x : "").filter(Boolean);
  const txt = "Opa! Fiz o teste no site.\n\n"
    + "*PEDIDO*\n" + linhas.join("\n") + "\n\n"
    + "*Recomendado:* " + m.nome + " — a partir de " + m.por + "\n"
    + "*Nome:* " + nome + "\n"
    + "*Origem:* #" + AT.codigo.toLowerCase();
  px("Contact",{modelo:m.nome});
  location.href = "https://wa.me/" + AT.whatsapp + "?text=" + encodeURIComponent(txt);
}

function reiniciar(){
  somVolta(); i = 0; pts = {}; respostas = []; modeloId = "";
  hud(false); prog(0); tela("s-start");
}

/* ===== arranque ===== */
(function(){
  $("startFace").src = AT.guia;
  $("startFace").alt = "Atendente " + AT.nome;
  pintaStatus();
  setInterval(pintaStatus, 60000);   // a janela pode virar com a página aberta
  document.getElementById("som").classList.toggle("mudo", mudo);
  if (AT.pixel){
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', AT.pixel); fbq('track','PageView');
  }
})();
