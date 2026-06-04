import { useState, useEffect } from "react";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzAaZDCHTWN_4D6-5ciS4lgy4oy9bqGEG2BIRv2Rq7vQce1jMrU0lf7VwxIcrFo-oW3/exec";

const BANNERS_FALLBACK = [
  { url: "", alt: "Mãe e bebê", placeholder: true, emoji: "🤰", label: "Sua foto aqui" },
  { url: "", alt: "Família feliz", placeholder: true, emoji: "👶", label: "Sua foto aqui" },
  { url: "", alt: "Mulher grávida", placeholder: true, emoji: "💛", label: "Sua foto aqui" },
];

const MESES = ["1º mês","2º mês","3º mês","4º mês","5º mês","6º mês","7º mês","8º mês","9º mês"];

const formatCPF = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatPhone = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const formatDate = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

const validarCPF = (cpf) => {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(d[i]) * (10 - i);
  let r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(d[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(d[i]) * (11 - i);
  r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(d[10]);
};

const DDDS_VALIDOS = new Set([
  11,12,13,14,15,16,17,18,19,21,22,24,27,28,
  31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,
  51,53,54,55,61,62,63,64,65,66,67,68,69,
  71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,
  91,92,93,94,95,96,97,98,99,
]);

const validarWhatsApp = (tel) => {
  const d = tel.replace(/\D/g, "");
  if (d.length !== 11) return false;
  const ddd = parseInt(d.slice(0, 2));
  if (!DDDS_VALIDOS.has(ddd)) return false;
  if (d[2] !== "9") return false;
  return true;
};

const buildWhatsAppLink = (data, tipo) => {
  const numero = "5596991219866";
  let msg = "";
  if (tipo === "gravida") {
    msg = `Olá! Vim pelo formulário de triagem.\n\n*Nome:* ${data.nome}\n*CPF:* ${data.cpf}\n*Situação:* Grávida\n*Mês de gestação:* ${data.mesGestacao}\n*WhatsApp:* ${data.contato}\n\nGostaria de saber mais sobre meu direito ao salário-maternidade.`;
  } else {
    msg = `Olá! Vim pelo formulário de triagem.\n\n*Nome:* ${data.nome}\n*CPF:* ${data.cpf}\n*Situação:* Já deu à luz\n*Data do parto:* ${data.dataParto}\n*Trabalhou com carteira assinada:* ${data.trabalhouCLT}\n*WhatsApp:* ${data.contato}\n\nGostaria de saber mais sobre meu direito ao salário-maternidade.`;
  }
  return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
};

const fbq = (...args) => {
  if (typeof window !== "undefined" && window.fbq) window.fbq(...args);
};

const sendToSheets = async (payload) => {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "addLead", ...payload }),
    });
  } catch (_) {}
};
function BannerCarousel({ banners }) {
  const [idx, setIdx] = useState(0);
  const list = banners.length > 0 ? banners : BANNERS_FALLBACK;

  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 4000);
    return () => clearInterval(t);
  }, [list.length]);

  return (
    <div style={S.bannerWrap}>
      {list.map((b, i) => (
        <div key={i} style={{ ...S.bannerSlide, opacity: i === idx ? 1 : 0, zIndex: i === idx ? 1 : 0 }}>
          {b.placeholder || !b.url ? (
            <div style={S.bannerPlaceholder}>
              <span style={S.bannerEmoji}>{b.emoji || "🤰"}</span>
              <span style={S.bannerPlaceholderLabel}>{b.label || "Adicione sua foto"}</span>
            </div>
          ) : (
            <img src={b.url} alt={b.alt} style={S.bannerImg} />
          )}
          <div style={S.bannerOverlay} />
        </div>
      ))}
      {list.length > 1 && (
        <div style={S.bannerDots}>
          {list.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{ ...S.dot, ...(i === idx ? S.dotActive : {}) }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Triagem() {
  const [step, setStep] = useState("inicio");
  const [banners, setBanners] = useState([]);
  const [data, setData] = useState({
    nome: "", cpf: "", tipo: "", mesGestacao: "",
    dataParto: "", trabalhouCLT: "", contato: "",
  });
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const r = await fetch(`${GOOGLE_SCRIPT_URL}?action=getBanners`, { headers: { "Content-Type": "text/plain" } });
        const json = await r.json();
        if (json.banners && json.banners.length > 0) setBanners(json.banners);
      } catch (_) {}
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    fbq("track", "ViewContent", { content_name: "Triagem Salário-Maternidade" });
  }, []);

  const goStep = (s) => {
    setFadeIn(false);
    setTimeout(() => { setStep(s); setFadeIn(true); }, 180);
  };

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const handleVerResultado = async () => {
    const payload = {
      nome: data.nome, cpf: data.cpf, tipo: data.tipo,
      mesGestacao: data.mesGestacao || "",
      dataParto: data.dataParto || "",
      trabalhouCLT: data.trabalhouCLT || "",
      contato: data.contato,
      data: new Date().toLocaleString("pt-BR"),
    };
    await sendToSheets(payload);
    fbq("track", "Lead", {
      content_name: "Triagem Salário-Maternidade",
      content_category: data.tipo === "gravida" ? "Grávida" : "Pós-parto",
    });
    goStep("resultado");
  };
  const telas = {
    inicio: (
      <div style={S.card}>
        <BannerCarousel banners={banners} />
        <div style={S.cardBody}>
          <div style={S.tagline}>Atendimento especializado em</div>
          <h1 style={S.title}>Salário-Maternidade</h1>
          <p style={S.subtitle}>Descubra em minutos se você tem direito ao benefício. Nossa triagem é gratuita e sem compromisso.</p>
          <div style={S.divider} />
          <div style={S.features}>
            {[
              { icon: "✨", text: "Rápido e gratuito" },
              { icon: "🔒", text: "Seus dados são seguros" },
              { icon: "💬", text: "Atendimento pelo WhatsApp" },
            ].map((f) => (
              <div key={f.text} style={S.feature}>
                <span style={S.featureIcon}>{f.icon}</span>
                <span style={S.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
          <button style={S.btnPrimary} onClick={() => { fbq("track", "InitiateCheckout", { content_name: "Triagem Salário-Maternidade" }); goStep("nome"); }}>
            Iniciar triagem gratuita
          </button>
        </div>
      </div>
    ),
    nome: (
      <div style={S.card}>
        <div style={S.stepHeader}>
          <StepPill current={1} total={4} />
          <h2 style={S.stepTitle}>Como podemos te chamar?</h2>
          <p style={S.stepSub}>Vamos começar pelo seu nome completo.</p>
        </div>
        <div style={S.cardBody}>
          <label style={S.label}>Nome completo</label>
          <input style={S.input} placeholder="Digite seu nome" value={data.nome} onChange={(e) => set("nome", e.target.value)} />
          <label style={S.label}>CPF</label>
          <input
            style={{ ...S.input, ...(data.cpf.length === 14 ? validarCPF(data.cpf) ? S.inputValid : S.inputError : {}) }}
            placeholder="000.000.000-00" value={data.cpf} inputMode="numeric"
            onChange={(e) => set("cpf", formatCPF(e.target.value))}
          />
          {data.cpf.length === 14 && !validarCPF(data.cpf) && <p style={S.errorMsg}>CPF inválido. Verifique os números e tente novamente.</p>}
          {data.cpf.length === 14 && validarCPF(data.cpf) && <p style={S.successMsg}>CPF válido!</p>}
          <button
            style={data.nome.trim() && validarCPF(data.cpf) ? S.btnPrimary : S.btnDisabled}
            disabled={!data.nome.trim() || !validarCPF(data.cpf)}
            onClick={() => goStep("tipo")}
          >Continuar</button>
        </div>
      </div>
    ),
    tipo: (
      <div style={S.card}>
        <div style={S.stepHeader}>
          <StepPill current={2} total={4} />
          <h2 style={S.stepTitle}>Qual é a sua situação?</h2>
          <p style={S.stepSub}>Isso define qual benefício pode se aplicar a você.</p>
        </div>
        <div style={S.cardBody}>
          {[
            { val: "gravida", icon: "🤰", label: "Estou grávida", desc: "Ainda não dei à luz" },
            { val: "pos", icon: "👶", label: "Já dei à luz", desc: "Parto recente ou passado" },
          ].map((op) => (
            <button key={op.val} style={{ ...S.optionBtn, ...(data.tipo === op.val ? S.optionBtnActive : {}) }}
              onClick={() => { set("tipo", op.val); goStep(op.val === "gravida" ? "gestacao" : "parto"); }}>
              <span style={S.optionIcon}>{op.icon}</span>
              <span style={S.optionText}><strong>{op.label}</strong><span style={S.optionDesc}>{op.desc}</span></span>
            </button>
          ))}
          <BackBtn onClick={() => goStep("nome")} />
        </div>
      </div>
    ),    gestacao: (
      <div style={S.card}>
        <div style={S.stepHeader}>
          <StepPill current={3} total={4} />
          <h2 style={S.stepTitle}>Em qual mês de gestação você está?</h2>
          <p style={S.stepSub}>Isso nos ajuda a calcular o prazo do seu benefício.</p>
        </div>
        <div style={S.cardBody}>
          <div style={S.mesGrid}>
            {MESES.map((m) => (
              <button key={m} style={{ ...S.mesBtn, ...(data.mesGestacao === m ? S.mesBtnActive : {}) }}
                onClick={() => { set("mesGestacao", m); goStep("contato"); }}>
                {m}
              </button>
            ))}
          </div>
          <BackBtn onClick={() => goStep("tipo")} />
        </div>
      </div>
    ),
    parto: (
      <div style={S.card}>
        <div style={S.stepHeader}>
          <StepPill current={3} total={4} />
          <h2 style={S.stepTitle}>Algumas informações sobre o parto</h2>
          <p style={S.stepSub}>Essas informações são necessárias para a análise.</p>
        </div>
        <div style={S.cardBody}>
          <label style={S.label}>Data do nascimento do bebê</label>
          <input style={S.input} placeholder="DD/MM/AAAA" inputMode="numeric" value={data.dataParto} onChange={(e) => set("dataParto", formatDate(e.target.value))} />
          <label style={S.label}>Você já trabalhou com carteira assinada?</label>
          <div style={S.radioGroup}>
            {["Sim", "Não"].map((op) => (
              <button key={op} style={{ ...S.radioBtn, ...(data.trabalhouCLT === op ? S.radioBtnActive : {}) }} onClick={() => set("trabalhouCLT", op)}>{op}</button>
            ))}
          </div>
          <button style={data.dataParto.length >= 10 && data.trabalhouCLT ? S.btnPrimary : S.btnDisabled}
            disabled={!data.dataParto || data.dataParto.length < 10 || !data.trabalhouCLT}
            onClick={() => goStep("contato")}>Continuar</button>
          <BackBtn onClick={() => goStep("tipo")} />
        </div>
      </div>
    ),
    contato: (
      <div style={S.card}>
        <div style={S.stepHeader}>
          <StepPill current={4} total={4} />
          <h2 style={S.stepTitle}>Qual é o seu WhatsApp?</h2>
          <p style={S.stepSub}>Enviaremos o resultado da sua triagem por lá.</p>
        </div>
        <div style={S.cardBody}>
          <label style={S.label}>Número do WhatsApp</label>
          <input
            style={{ ...S.input, ...(data.contato.length === 15 ? validarWhatsApp(data.contato) ? S.inputValid : S.inputError : {}) }}
            placeholder="(96) 99999-9999" inputMode="tel" value={data.contato}
            onChange={(e) => set("contato", formatPhone(e.target.value))}
          />
          {data.contato.length === 15 && !validarWhatsApp(data.contato) && <p style={S.errorMsg}>Número inválido. Informe um celular brasileiro com DDD (ex: 96 99999-9999).</p>}
          {data.contato.length === 15 && validarWhatsApp(data.contato) && <p style={S.successMsg}>Número válido!</p>}
          <button style={validarWhatsApp(data.contato) ? S.btnPrimary : S.btnDisabled} disabled={!validarWhatsApp(data.contato)} onClick={handleVerResultado}>Ver resultado</button>
          <BackBtn onClick={() => goStep(data.tipo === "gravida" ? "gestacao" : "parto")} />
        </div>
      </div>
    ),
    resultado: (
      <div style={S.card}>
        <BannerCarousel banners={banners} />
        <div style={S.cardBody}>
          <div style={S.resultIcon}>🎉</div>
          <h2 style={S.resultTitle}>Triagem concluída!</h2>
          <p style={S.resultSub}>Ótimo, {data.nome.split(" ")[0]}! Suas informações foram recebidas. Nossa equipe vai analisar seu caso e entrar em contato em breve.</p>
          <div style={S.resultBox}><p style={S.resultBoxText}>Clique abaixo para falar diretamente com nossa equipe e agilizar seu atendimento:</p></div>
          <a href={buildWhatsAppLink(data, data.tipo)} target="_blank" rel="noopener noreferrer" style={S.btnWhatsApp}>
            <span>💬</span> Falar com nossa equipe agora
          </a>
          <button style={S.btnGhost} onClick={() => { setData({ nome:"",cpf:"",tipo:"",mesGestacao:"",dataParto:"",trabalhouCLT:"",contato:"" }); goStep("inicio"); }}>
            Nova triagem
          </button>
        </div>
      </div>
    ),
  };

  return (
    <div style={S.root}>
      <div style={S.bg} />
      <div style={{ ...S.pageWrap, opacity: fadeIn ? 1 : 0, transition: "opacity 0.18s ease" }}>
        {telas[step]}
      </div>
    </div>
  );
}
function StepPill({ current, total }) {
  return (
    <div style={S.stepPillWrap}>
      <div style={S.stepPill}>Passo {current} de {total}</div>
      <div style={S.progressBar}>
        <div style={{ ...S.progressFill, width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

function BackBtn({ onClick }) {
  return <button style={S.backBtn} onClick={onClick}>← Voltar</button>;
}

const C = {
  terracota: "#C1694F", terra2: "#A0522D", terra3: "#E8886A",
  bege: "#F5EFE6", bege2: "#EDE0CF", bege3: "#FAF6F0",
  dourado: "#C9A84C", dourado2: "#E8C96A",
  text: "#3D2B1F", textMuted: "#7A5C4A",
  white: "#FFFFFF", green: "#25D366", greenDark: "#1da851",
};

const S = {
  root: { minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "0", fontFamily: "'Georgia', 'Times New Roman', serif", position: "relative", background: "#F5EFE6" },
  bg: { position: "fixed", inset: 0, zIndex: 0, background: `radial-gradient(ellipse at 20% 10%, ${C.terra3}22 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, ${C.dourado}18 0%, transparent 50%), linear-gradient(160deg, ${C.bege} 0%, ${C.bege2} 100%)` },
  pageWrap: { width: "100%", maxWidth: 480, minHeight: "100vh", position: "relative", zIndex: 1, display: "flex", flexDirection: "column" },
  card: { flex: 1, background: C.white, boxShadow: "0 4px 40px rgba(61,43,31,0.10)", display: "flex", flexDirection: "column", minHeight: "100vh" },
  cardBody: { padding: "28px 24px 40px", display: "flex", flexDirection: "column", gap: 14, flex: 1 },
  bannerWrap: { position: "relative", width: "100%", height: 220, overflow: "hidden", background: C.bege2, flexShrink: 0 },
  bannerSlide: { position: "absolute", inset: 0, transition: "opacity 0.7s ease" },
  bannerImg: { width: "100%", height: "100%", objectFit: "cover" },
  bannerOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(61,43,31,0.3) 100%)" },
  bannerPlaceholder: { width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${C.bege2} 0%, ${C.terra3}33 100%)`, gap: 8, border: `2px dashed ${C.terra3}66` },
  bannerEmoji: { fontSize: 52 },
  bannerPlaceholderLabel: { fontSize: 13, color: C.textMuted, fontStyle: "italic", letterSpacing: "0.05em" },
  bannerDots: { position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, zIndex: 2 },
  dot: { width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", padding: 0, transition: "background 0.3s" },
  dotActive: { background: C.white },
  tagline: { fontSize: 11, fontFamily: "sans-serif", letterSpacing: "0.15em", textTransform: "uppercase", color: C.terracota, fontWeight: 600 },
  title: { fontSize: 30, fontWeight: 700, color: C.text, margin: "4px 0 0", lineHeight: 1.2, letterSpacing: "-0.01em" },
  subtitle: { fontSize: 15, color: C.textMuted, lineHeight: 1.6, margin: 0, fontFamily: "sans-serif" },
  divider: { height: 1, background: `linear-gradient(to right, ${C.dourado}60, transparent)`, margin: "4px 0" },
  features: { display: "flex", flexDirection: "column", gap: 10 },
  feature: { display: "flex", alignItems: "center", gap: 10 },
  featureIcon: { fontSize: 18, flexShrink: 0 },
  featureText: { fontSize: 14, color: C.textMuted, fontFamily: "sans-serif" },
  stepHeader: { background: `linear-gradient(135deg, ${C.terra3}22 0%, ${C.dourado}11 100%)`, padding: "24px 24px 20px", borderBottom: `1px solid ${C.bege2}` },
  stepPillWrap: { marginBottom: 14 },
  stepPill: { display: "inline-block", background: C.terracota, color: C.white, fontSize: 11, fontFamily: "sans-serif", fontWeight: 700, letterSpacing: "0.08em", padding: "3px 12px", borderRadius: 20, textTransform: "uppercase", marginBottom: 10 },
  progressBar: { height: 4, borderRadius: 4, background: C.bege2, overflow: "hidden" },
  progressFill: { height: "100%", background: `linear-gradient(to right, ${C.terracota}, ${C.dourado})`, borderRadius: 4, transition: "width 0.4s ease" },
  stepTitle: { fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px" },
  stepSub: { fontSize: 14, color: C.textMuted, fontFamily: "sans-serif", margin: 0, lineHeight: 1.5 },
  label: { fontSize: 13, fontWeight: 600, color: C.text, fontFamily: "sans-serif", marginBottom: -6 },
  input: { width: "100%", padding: "13px 14px", fontSize: 15, fontFamily: "sans-serif", border: `1.5px solid ${C.bege2}`, borderRadius: 10, outline: "none", color: C.text, background: C.bege3, boxSizing: "border-box", transition: "border-color 0.2s" },
  inputValid: { borderColor: "#4caf7d", background: "#f0faf5" },
  inputError: { borderColor: "#e05252", background: "#fff5f5" },
  errorMsg: { fontSize: 12, color: "#c0392b", fontFamily: "sans-serif", margin: "-6px 0 0", lineHeight: 1.4 },
  successMsg: { fontSize: 12, color: "#27ae60", fontFamily: "sans-serif", margin: "-6px 0 0", fontWeight: 600 },
  optionBtn: { display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: C.bege3, border: `1.5px solid ${C.bege2}`, borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "all 0.2s", width: "100%" },
  optionBtnActive: { background: `${C.terra3}22`, borderColor: C.terracota },
  optionIcon: { fontSize: 28, flexShrink: 0 },
  optionText: { display: "flex", flexDirection: "column", gap: 2, fontFamily: "sans-serif" },
  optionDesc: { fontSize: 12, color: C.textMuted },
  mesGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  mesBtn: { padding: "12px 6px", background: C.bege3, border: `1.5px solid ${C.bege2}`, borderRadius: 10, cursor: "pointer", fontSize: 13, fontFamily: "sans-serif", color: C.text, transition: "all 0.2s", fontWeight: 500 },
  mesBtnActive: { background: `${C.terra3}22`, borderColor: C.terracota, color: C.terracota, fontWeight: 700 },
  radioGroup: { display: "flex", gap: 10 },
  radioBtn: { flex: 1, padding: "12px", background: C.bege3, border: `1.5px solid ${C.bege2}`, borderRadius: 10, cursor: "pointer", fontSize: 15, fontFamily: "sans-serif", color: C.text, transition: "all 0.2s" },
  radioBtnActive: { background: `${C.terra3}22`, borderColor: C.terracota, color: C.terracota, fontWeight: 700 },
  btnPrimary: { width: "100%", padding: "15px", background: `linear-gradient(135deg, ${C.terracota} 0%, ${C.terra2} 100%)`, color: C.white, border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, fontFamily: "sans-serif", cursor: "pointer", letterSpacing: "0.02em", boxShadow: `0 4px 16px ${C.terracota}44`, transition: "transform 0.15s, box-shadow 0.15s", marginTop: 4 },
  btnDisabled: { width: "100%", padding: "15px", background: C.bege2, color: C.textMuted, border: "none", borderRadius: 12, fontSize: 16, fontFamily: "sans-serif", cursor: "not-allowed", marginTop: 4 },
  btnWhatsApp: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: "16px", background: "#25D366", color: C.white, border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, fontFamily: "sans-serif", cursor: "pointer", textDecoration: "none", boxShadow: "0 4px 16px #25D36655", boxSizing: "border-box" },
  btnGhost: { width: "100%", padding: "13px", background: "transparent", color: C.textMuted, border: `1.5px solid ${C.bege2}`, borderRadius: 12, fontSize: 14, fontFamily: "sans-serif", cursor: "pointer", boxSizing: "border-box" },
  backBtn: { background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14, fontFamily: "sans-serif", padding: "4px 0", alignSelf: "flex-start", marginTop: 4 },
  resultIcon: { fontSize: 52, textAlign: "center" },
  resultTitle: { fontSize: 24, fontWeight: 700, color: C.text, textAlign: "center", margin: 0 },
  resultSub: { fontSize: 15, color: C.textMuted, lineHeight: 1.6, textAlign: "center", fontFamily: "sans-serif", margin: 0 },
  resultBox: { background: `linear-gradient(135deg, ${C.bege2}, ${C.terra3}22)`, borderRadius: 12, padding: "16px", border: `1px solid ${C.terra3}44` },
  resultBoxText: { fontSize: 14, color: C.text, lineHeight: 1.6, margin: 0, fontFamily: "sans-serif", textAlign: "center" },
};
