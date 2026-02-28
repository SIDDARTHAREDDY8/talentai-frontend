/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { authAPI, resumeAPI, interviewAPI, sessionsAPI, analyticsAPI, settingsAPI, token } from "./api";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg:"#07090f", surface:"#0e1119", card:"#131929", border:"#1a2236",
  accent:"#4f8ef7", green:"#22d3a0", amber:"#f5a623", red:"#f75f5f",
  purple:"#a78bfa", cyan:"#22d3ee", text:"#e8eaf2", muted:"#5a6380", dim:"#8892a4",
};

const PLANS = {
  free: { name:"Free",  price:0,  color:C.muted,  interviews:3,  features:["3 mock interviews/month","Resume analysis","Skill gap analysis","Basic analytics"] },
  pro:  { name:"Pro",   price:9,  color:C.accent, interviews:999, features:["Unlimited interviews","Voice interview mode","JD Matcher","AI Career Coach","Cover letter generator","Ideal answer reveal","Priority support"] },
  team: { name:"Team",  price:29, color:C.purple, interviews:999, features:["Everything in Pro","5 team members","Team analytics dashboard","Shared question banks","Admin controls","Dedicated support"] },
};

const ACHIEVEMENTS = [
  { id:"first_resume",    icon:"📄", title:"Resume Ready",      desc:"Analyzed your first resume",         check:d=>d.skills?.length>0 },
  { id:"first_interview", icon:"🎤", title:"First Interview",   desc:"Completed your first mock interview",check:d=>d.sessions?.length>=1 },
  { id:"perfect_score",   icon:"💯", title:"Perfect Score",     desc:"Scored 90+ on a question",           check:d=>d.sessions?.some(s=>s.scores?.some(q=>q.score>=90)) },
  { id:"five_sessions",   icon:"🏅", title:"Consistent",        desc:"Completed 5 interview sessions",     check:d=>d.sessions?.length>=5 },
  { id:"streak_3",        icon:"🔥", title:"On Fire",           desc:"3-day practice streak",              check:d=>(d.streak||0)>=3 },
  { id:"skill_master",    icon:"🧩", title:"Skill Master",      desc:"20+ skills in your profile",         check:d=>d.skills?.length>=20 },
  { id:"cover_letter",    icon:"✉️", title:"Application Ready", desc:"Generated a cover letter",           check:d=>d.coverLettersGenerated>0 },
  { id:"jd_match",        icon:"🔗", title:"Job Hunter",        desc:"Used JD Matcher",                    check:d=>d.jdMatchesRun>0 },
  { id:"high_coverage",   icon:"🎯", title:"Role Ready",        desc:"Achieved 80%+ skill coverage",       check:d=>(d.coverage||0)>=80 },
  { id:"pro_member",      icon:"⭐", title:"Pro Member",        desc:"Upgraded to Pro plan",               check:d=>d.plan==="pro"||d.plan==="team" },
];

const QUESTIONS = {
  "Software Engineer":[
    {id:1,q:"Explain the difference between a stack and a queue with real-world use cases.",ref:"Stack is LIFO — call stack, undo functionality. Queue is FIFO — print queue, task scheduling. Stack: push/pop O(1). Queue: enqueue/dequeue O(1). Real use: Stack for browser history; Queue for BFS, message queues like RabbitMQ."},
    {id:2,q:"What is the time complexity of quicksort in average and worst case? Why?",ref:"Average O(n log n) — roughly equal partitions each recursion. Worst O(n²) — pivot always smallest/largest causes unbalanced splits. Space O(log n) average. Randomized pivot or median-of-three avoids worst case."},
    {id:3,q:"Describe RESTful API design principles and HTTP methods.",ref:"REST: stateless, uniform interface, resource-based URLs. Methods: GET (retrieve, idempotent), POST (create), PUT (full update), PATCH (partial), DELETE (remove). Status codes: 200, 201, 400, 401, 404, 500. HATEOAS for discoverability."},
    {id:4,q:"What is the difference between SQL and NoSQL databases?",ref:"SQL: relational, ACID, structured schema, vertical scaling. NoSQL types: Document (MongoDB), Key-Value (Redis), Column (Cassandra), Graph (Neo4j). NoSQL: flexible schema, horizontal scaling, eventual consistency. SQL for strong consistency; NoSQL for scale and flexibility."},
    {id:5,q:"Explain the SOLID principles in software design.",ref:"S: Single Responsibility. O: Open/Closed. L: Liskov Substitution. I: Interface Segregation. D: Dependency Inversion. These reduce coupling and improve maintainability and testability."},
  ],
  "Data Scientist":[
    {id:1,q:"Explain the bias-variance tradeoff.",ref:"Bias: error from wrong assumptions (underfitting). Variance: sensitivity to training noise (overfitting). Balance via cross-validation, regularization (L1/L2), ensemble methods — bagging reduces variance, boosting reduces bias."},
    {id:2,q:"What is the difference between supervised and unsupervised learning?",ref:"Supervised: labeled data, input→output mapping. Examples: regression, classification. Unsupervised: unlabeled, finds hidden structure. Examples: K-means clustering, PCA dimensionality reduction."},
    {id:3,q:"How would you handle a highly imbalanced dataset?",ref:"SMOTE oversampling, undersampling majority, class_weight='balanced', threshold tuning, F1/AUC-PR evaluation. Choice depends on false positive vs false negative cost in the domain."},
    {id:4,q:"Explain how gradient boosting works.",ref:"Sequential ensemble of weak learners. Each tree fits residual errors of previous ensemble. Gradient descent in function space. Key params: learning rate, tree depth, n_estimators. XGBoost/LightGBM add regularization and efficient splitting."},
    {id:5,q:"What is cross-validation and why is it important?",ref:"Estimates model generalization. K-fold: split into k parts, train on k-1, test on 1, repeat k times, average. Stratified K-fold preserves class distribution. Prevents overfitting to single train/test split. Used for hyperparameter tuning and model selection."},
  ],
  "Data Engineer":[
    {id:1,q:"What is the difference between ETL and ELT?",ref:"ETL: transform before loading — suits sensitive data, legacy systems. ELT: load raw then transform in DWH using SQL — suits cloud DWH (Snowflake, BigQuery). ELT more flexible for exploration; ETL better governance."},
    {id:2,q:"Explain data partitioning and why it matters.",ref:"Divides data into chunks for parallelism and query efficiency. Range, hash, list, composite partitioning. Benefits: partition pruning avoids full scans, parallelism speeds processing. Critical for Spark shuffle performance and BigQuery cost."},
    {id:3,q:"What are the CAP theorem trade-offs?",ref:"Consistency, Availability, Partition Tolerance — only 2 of 3 achievable. CP: HBase, ZooKeeper. AP: Cassandra, DynamoDB. PACELC extends CAP to consider latency vs consistency even without partitions."},
  ],
  "ML Engineer":[
    {id:1,q:"What is MLOps and its key components?",ref:"DevOps for ML. Components: data versioning (DVC), experiment tracking (MLflow/W&B), model registry, CI/CD, model serving (REST/gRPC), monitoring (data drift, model drift), feature stores, automated retraining."},
    {id:2,q:"Explain training vs inference challenges.",ref:"Training: compute-intensive, offline, uses GPUs, reproducibility critical. Inference: latency-sensitive, needs optimization (quantization, ONNX, distillation), must scale with load. Key challenge: training-serving skew and cold start latency."},
    {id:3,q:"How do you detect and handle model drift in production?",ref:"Data drift: input distribution shifts. Concept drift: feature-target relationship changes. Detection: KS test, PSI, JS divergence, performance monitoring. Handling: automated retraining, champion-challenger A/B testing, canary releases, feedback loops."},
  ],
  "Frontend Developer":[
    {id:1,q:"Explain controlled vs uncontrolled components in React.",ref:"Controlled: React state is source of truth, value from props, onChange updates state. Uncontrolled: DOM manages state via refs. Controlled preferred for complex validation, conditional fields, synchronized inputs."},
    {id:2,q:"What is the Virtual DOM and how does React reconciliation work?",ref:"VDOM is lightweight JS object tree. On state change, React diffs new vs old VDOM (Fiber reconciliation), patches only changed real DOM nodes. Keys identify list items across renders. Batches updates for efficiency."},
    {id:3,q:"How would you optimize a slow React application?",ref:"Profile first with React DevTools. Solutions: React.memo, useMemo, useCallback, code splitting (lazy/Suspense), list virtualization (react-window), avoid anonymous functions in JSX, split Contexts, image optimization, debounce event handlers."},
  ],
};

const LS = {
  get:(k,d=null)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
  del:(k)=>{try{localStorage.removeItem(k);}catch{}},
};

const today = () => new Date().toISOString().split("T")[0];
const monthKey = () => { const d=new Date(); return `${d.getFullYear()}-${d.getMonth()}`; };

// ─────────────────────────────────────────────────────────────────────────────
// PDF / DOCX EXTRACTION (client-side file parsing — unchanged)
// ─────────────────────────────────────────────────────────────────────────────
let _pdfjs=null;
async function getPdfJs(){
  if(_pdfjs) return _pdfjs;
  await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";s.onload=res;s.onerror=rej;document.head.appendChild(s);});
  window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  _pdfjs=window.pdfjsLib; return _pdfjs;
}
async function extractPDF(file){const lib=await getPdfJs();const pdf=await lib.getDocument({data:await file.arrayBuffer()}).promise;let t="";for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i);const c=await p.getTextContent();t+=c.items.map(x=>x.str).join(" ")+"\n";}return t;}
async function extractDOCX(file){
  try{
    const m=await import("mammoth");
    const r=await m.extractRawText({arrayBuffer:await file.arrayBuffer()});
    return r.value;
  }catch(e){
    // fallback: try reading as text directly
    return new Promise((res,rej)=>{
      const reader=new FileReader();
      reader.onload=ev=>res(ev.target.result||"");
      reader.onerror=()=>rej(new Error("Could not read DOCX file. Try copying your resume text and using Paste Text instead."));
      reader.readAsText(file);
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
const Badge=({children,color=C.accent,sm})=>(
  <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:6,padding:sm?"1px 8px":"3px 10px",fontSize:sm?11:12,fontWeight:600,display:"inline-block",whiteSpace:"nowrap"}}>{children}</span>
);

const Card=({children,style={},onClick,hover})=>{
  const [h,setH]=useState(false);
  return <div onClick={onClick} onMouseEnter={()=>hover&&setH(true)} onMouseLeave={()=>setH(false)}
    style={{background:C.card,border:`1px solid ${h?C.accent:C.border}`,borderRadius:16,padding:24,transition:"border-color .2s",cursor:onClick?"pointer":"default",...style}}>{children}</div>;
};

const Btn=({children,onClick,variant="primary",disabled,full,sm,style={}})=>{
  const [h,setH]=useState(false);
  const v={primary:{bg:h?"#3a7ae8":C.accent,color:"#fff",border:"none"},secondary:{bg:h?C.border:"transparent",color:C.text,border:`1px solid ${C.border}`},ghost:{bg:"transparent",color:C.muted,border:"none"},danger:{bg:h?"#c44":C.red,color:"#fff",border:"none"},green:{bg:h?"#1aaf86":C.green,color:"#fff",border:"none"},purple:{bg:h?"#9070e8":C.purple,color:"#fff",border:"none"}}[variant]||{};
  return <button disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
    style={{...v,borderRadius:10,padding:sm?"7px 14px":"10px 22px",fontSize:sm?13:14,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.45:1,transition:"all .18s",width:full?"100%":"auto",...style}}>{children}</button>;
};

const Input=({label,type="text",value,onChange,placeholder,error,hint})=>(
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label&&<label style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:.5}}>{label}</label>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{background:C.surface,border:`1px solid ${error?C.red:C.border}`,borderRadius:10,padding:"11px 14px",color:C.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
    {hint&&!error&&<span style={{fontSize:11,color:C.muted}}>{hint}</span>}
    {error&&<span style={{fontSize:11,color:C.red}}>{error}</span>}
  </div>
);

const ProgressBar=({value,max=100,color=C.accent,h=8})=>(
  <div style={{background:C.border,borderRadius:99,height:h,overflow:"hidden"}}>
    <div style={{width:`${Math.min(100,(value/max)*100)}%`,height:"100%",background:color,borderRadius:99,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/>
  </div>
);

const ScoreRing=({score,size=72})=>{
  const color=score>=70?C.green:score>=40?C.amber:C.red;
  return <div style={{width:size,height:size,borderRadius:"50%",border:`3px solid ${color}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:color+"12"}}>
    <span style={{fontSize:size*.3,fontWeight:900,color,lineHeight:1}}>{score}</span>
    <span style={{fontSize:size*.13,color:C.muted}}>/ 100</span>
  </div>;
};

const Toggle=({value,onChange,label,desc})=>(
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0"}}>
    <div><div style={{fontSize:14,color:C.text,fontWeight:500}}>{label}</div>{desc&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>{desc}</div>}</div>
    <div onClick={onChange} style={{width:44,height:24,borderRadius:99,background:value?C.green:C.border,cursor:"pointer",transition:"background .2s",position:"relative",flexShrink:0}}>
      <div style={{position:"absolute",top:3,left:value?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
    </div>
  </div>
);

const Modal=({children,onClose,title,width=520})=>(
  <div style={{position:"fixed",inset:0,background:"#000a",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}} onClick={onClose}>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:32,width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <h2 style={{margin:0,color:C.text,fontSize:18,fontWeight:800}}>{title}</h2>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:20}}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Toast=({msg,type="success",onDone})=>{
  useEffect(()=>{const t=setTimeout(onDone,3000);return()=>clearTimeout(t);},[]);
  const color=type==="success"?C.green:type==="error"?C.red:C.amber;
  return <div style={{position:"fixed",bottom:24,right:24,background:C.card,border:`1px solid ${color}`,borderRadius:12,padding:"12px 20px",color:C.text,fontSize:14,fontWeight:600,zIndex:2000,maxWidth:320}}>
    {type==="success"?"✅":type==="error"?"❌":"⚠️"} {msg}
  </div>;
};

const Spinner=({text})=>(
  <div style={{textAlign:"center",padding:"40px 0"}}>
    <div style={{fontSize:32,marginBottom:10}}>⏳</div>
    <div style={{color:C.accent,fontWeight:600,fontSize:14}}>{text||"Loading…"}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function AuthScreen({onAuth}){
  const [mode,setMode]=useState("login");
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [pw,setPw]=useState("");
  const [err,setErr]=useState({}); const [loading,setLoading]=useState(false);

  const submit=async()=>{
    const e={};
    if(mode==="register"&&!name.trim()) e.name="Required";
    if(!email.includes("@")) e.email="Valid email required";
    if(pw.length<6) e.pw="Min 6 characters";
    if(Object.keys(e).length){setErr(e);return;}
    setLoading(true);
    try{
      const res = mode==="login"
        ? await authAPI.login(email,pw)
        : await authAPI.register(name,email,pw);
      onAuth(res);
    }catch(ex){
      setErr({general: ex.message});
    }
    setLoading(false);
  };

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans','Segoe UI',sans-serif",position:"relative",overflow:"hidden"}}>
      <div style={{position:"fixed",top:"15%",left:"30%",width:500,height:500,background:`radial-gradient(ellipse,${C.accent}15 0%,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:"10%",right:"20%",width:400,height:400,background:`radial-gradient(ellipse,${C.purple}12 0%,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:440,padding:24,position:"relative"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{width:60,height:60,borderRadius:16,background:`linear-gradient(135deg,${C.accent},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 14px"}}>🎯</div>
          <div style={{fontSize:30,fontWeight:900,color:C.text,letterSpacing:-1}}>TalentAI</div>
          <div style={{fontSize:13,color:C.muted,marginTop:4}}>AI-Powered Interview Preparation Platform</div>
          <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:10}}>
            <Badge color={C.accent}>AI Powered</Badge><Badge color={C.green}>NLP</Badge><Badge color={C.purple}>ML</Badge>
          </div>
        </div>
        <Card>
          <div style={{display:"flex",background:C.surface,borderRadius:10,padding:4,marginBottom:22}}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>{setMode(m);setErr({});}} style={{flex:1,padding:"9px 0",borderRadius:8,border:"none",background:mode===m?C.card:"transparent",color:mode===m?C.text:C.muted,fontWeight:mode===m?700:400,cursor:"pointer",fontSize:14,transition:"all .2s"}}>
                {m==="login"?"Sign In":"Create Account"}
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            {mode==="register"&&<Input label="FULL NAME" value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Smith" error={err.name}/>}
            <Input label="EMAIL" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" error={err.email}/>
            <Input label="PASSWORD" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" error={err.pw}/>
            {err.general&&<div style={{padding:"10px 14px",background:C.red+"18",border:`1px solid ${C.red}44`,borderRadius:8,color:C.red,fontSize:13}}>{err.general}</div>}
            <Btn full onClick={submit} disabled={loading} style={{marginTop:4}}>{loading?"Please wait…":mode==="login"?"Sign In →":"Create Free Account →"}</Btn>
          </div>
          {mode==="login"&&(
            <div style={{marginTop:14,padding:"10px 14px",background:C.surface,borderRadius:8,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:12,color:C.muted}}>Your data is securely stored in our cloud database and accessible from any device.</div>
            </div>
          )}
        </Card>
        <div style={{textAlign:"center",marginTop:18,fontSize:13,color:C.muted}}>
          {mode==="login"?"Don't have an account? ":"Already have an account? "}
          <span onClick={()=>{setMode(mode==="login"?"register":"login");setErr({});}} style={{color:C.accent,cursor:"pointer",fontWeight:600}}>
            {mode==="login"?"Sign up free":"Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING
// ─────────────────────────────────────────────────────────────────────────────
function Onboarding({user,onDone}){
  const [step,setStep]=useState(0);
  const [role,setRole]=useState("");
  const [goal,setGoal]=useState(3);
  const [saving,setSaving]=useState(false);

  const finish=async()=>{
    setSaving(true);
    try{
      await authAPI.onboard(role||null, goal);
      onDone({ recommendedRole: role, dailyGoal: goal, onboarded: true });
    }catch(e){
      console.error(e);
      // Still proceed even if onboard API call fails
      onDone({ recommendedRole: role, dailyGoal: goal, onboarded: true });
    }
    setSaving(false);
  };

  const steps=[
    {title:`Welcome, ${user.name.split(" ")[0]}! 🎉`,sub:"Let's set up your profile in 3 quick steps"},
    {title:"What role are you targeting?",sub:"We'll customize your questions and gap analysis"},
    {title:"Set your daily practice goal",sub:"Consistency is the key to interview success"},
  ];

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:520,padding:24}}>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:32}}>
          {steps.map((_,i)=><div key={i} style={{width:i===step?32:8,height:8,borderRadius:99,background:i<=step?C.accent:C.border,transition:"all .3s"}}/>)}
        </div>
        <Card style={{textAlign:"center",padding:40}}>
          <div style={{fontSize:48,marginBottom:16}}>{["🚀","🎯","🔥"][step]}</div>
          <h2 style={{color:C.text,margin:"0 0 8px",fontSize:22}}>{steps[step].title}</h2>
          <p style={{color:C.muted,margin:"0 0 28px",fontSize:14}}>{steps[step].sub}</p>
          {step===0&&(
            <div style={{display:"flex",flexDirection:"column",gap:12,textAlign:"left",marginBottom:24}}>
              {["AI-powered resume analysis with NLP skill extraction","Voice & text mock interviews with ML scoring","Job description fit matching","Skill gap analysis with personalized learning plans","AI career coaching and cover letter generation"].map(f=>(
                <div key={f} style={{display:"flex",gap:10,alignItems:"center"}}><span style={{color:C.green}}>✓</span><span style={{color:C.text,fontSize:14}}>{f}</span></div>
              ))}
            </div>
          )}
          {step===1&&(
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24,textAlign:"left"}}>
              {Object.keys(QUESTIONS).map(r=>(
                <div key={r} onClick={()=>setRole(r)} style={{padding:"12px 16px",borderRadius:10,border:`1px solid ${role===r?C.accent:C.border}`,background:role===r?C.accent+"15":C.surface,cursor:"pointer",color:C.text,fontWeight:role===r?700:400,fontSize:14,transition:"all .2s"}}>{r}</div>
              ))}
            </div>
          )}
          {step===2&&(
            <div style={{marginBottom:24}}>
              <div style={{fontSize:48,fontWeight:900,color:C.accent,marginBottom:8}}>{goal}</div>
              <div style={{color:C.muted,fontSize:14,marginBottom:20}}>questions per day</div>
              <input type="range" min={1} max={10} value={goal} onChange={e=>setGoal(Number(e.target.value))} style={{width:"100%",accentColor:C.accent}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginTop:6}}><span>1 (Casual)</span><span>10 (Intense)</span></div>
            </div>
          )}
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            {step>0&&<Btn variant="secondary" onClick={()=>setStep(s=>s-1)}>← Back</Btn>}
            <Btn onClick={step<2?()=>setStep(s=>s+1):finish} disabled={saving}>{step<2?"Continue →":saving?"Saving…":"Start Practicing 🚀"}</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICING MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PricingModal({onClose,userData,onPlanUpgrade}){
  const [selected,setSelected]=useState(userData.plan||"free");
  const [billing,setBilling]=useState("monthly");
  const [payStep,setPayStep]=useState("plans");
  const [paying,setPaying]=useState(false);
  const [cardNum,setCardNum]=useState(""); const [expiry,setExpiry]=useState(""); const [cvv,setCvv]=useState(""); const [cardName,setCardName]=useState("");
  const [cardErr,setCardErr]=useState({});

  const price=p=>billing==="annual"?Math.round(PLANS[p].price*.8*10)/10:PLANS[p].price;
  const formatCard=v=>v.replace(/\D/g,"").substring(0,16).replace(/(\d{4})/g,"$1 ").trim();
  const formatExpiry=v=>{const d=v.replace(/\D/g,"").substring(0,4);return d.length>=3?`${d.substring(0,2)}/${d.substring(2)}`:d;};

  const validateCard=()=>{
    const e={};
    if(cardName.trim().length<2) e.name="Required";
    if(cardNum.replace(/\s/g,"").length<16) e.card="Invalid card number";
    if(!expiry.includes("/")) e.expiry="Format: MM/YY";
    if(cvv.length<3) e.cvv="3-4 digits";
    setCardErr(e); return Object.keys(e).length===0;
  };

  const checkout=async()=>{
    if(!validateCard()) return;
    setPaying(true);
    try{
      await settingsAPI.update(null, selected);
      onPlanUpgrade(selected);
      setPayStep("success");
    }catch(e){ console.error(e); }
    setPaying(false);
  };

  if(payStep==="success") return(
    <Modal title="" onClose={onClose} width={440}>
      <div style={{textAlign:"center",padding:"20px 0"}}>
        <div style={{fontSize:60,marginBottom:16}}>🎉</div>
        <h2 style={{color:C.green,margin:"0 0 8px"}}>Payment Successful!</h2>
        <p style={{color:C.muted,marginBottom:24}}>Welcome to <strong style={{color:PLANS[selected].color}}>{PLANS[selected].name}</strong>. All premium features are now unlocked.</p>
        <Btn full onClick={onClose}>Start Using Premium Features →</Btn>
      </div>
    </Modal>
  );

  return(
    <Modal title={payStep==="checkout"?`Checkout — ${PLANS[selected].name} Plan`:"Choose Your Plan"} onClose={onClose} width={payStep==="checkout"?480:720}>
      {payStep==="plans"&&(
        <>
          <div style={{display:"flex",background:C.surface,borderRadius:10,padding:4,marginBottom:24,maxWidth:280}}>
            {["monthly","annual"].map(b=>(
              <button key={b} onClick={()=>setBilling(b)} style={{flex:1,padding:"7px 0",borderRadius:8,border:"none",background:billing===b?C.card:"transparent",color:billing===b?C.text:C.muted,cursor:"pointer",fontSize:13,fontWeight:billing===b?700:400}}>
                {b==="monthly"?"Monthly":"Annual (−20%)"}
              </button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:24}}>
            {Object.entries(PLANS).map(([key,plan])=>(
              <div key={key} onClick={()=>setSelected(key)} style={{border:`2px solid ${selected===key?plan.color:C.border}`,borderRadius:14,padding:20,cursor:"pointer",background:selected===key?plan.color+"10":"transparent",transition:"all .2s",position:"relative"}}>
                {key==="pro"&&<div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:C.accent,color:"#fff",fontSize:11,fontWeight:800,padding:"3px 12px",borderRadius:99}}>POPULAR</div>}
                <div style={{fontSize:13,fontWeight:700,color:plan.color,marginBottom:6}}>{plan.name}</div>
                <div style={{fontSize:28,fontWeight:900,color:C.text,marginBottom:2}}>{key==="free"?"Free":`$${price(key)}`}</div>
                {key!=="free"&&<div style={{fontSize:11,color:C.muted,marginBottom:12}}>per month{billing==="annual"?" billed annually":""}</div>}
                <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:key==="free"?14:0}}>
                  {plan.features.map(f=><div key={f} style={{display:"flex",gap:6,fontSize:12,color:C.dim}}><span style={{color:plan.color,flexShrink:0}}>✓</span>{f}</div>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
            <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
            {selected!=="free"
              ?<Btn onClick={()=>setPayStep("checkout")} style={{background:PLANS[selected].color,color:"#fff",border:"none"}}>Continue to Checkout →</Btn>
              :<Btn onClick={async()=>{await settingsAPI.update(null, "free");onPlanUpgrade("free");onClose();}}>Downgrade to Free</Btn>}
          </div>
        </>
      )}
      {payStep==="checkout"&&(
        <>
          <div style={{background:C.surface,borderRadius:12,padding:16,marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:700,color:C.text}}>{PLANS[selected].name} Plan</div><div style={{fontSize:12,color:C.muted}}>{billing==="annual"?"Billed annually":"Billed monthly"}</div></div>
              <div style={{fontSize:22,fontWeight:900,color:PLANS[selected].color}}>${price(selected)}<span style={{fontSize:13,color:C.muted}}>/mo</span></div>
            </div>
            {billing==="annual"&&<div style={{marginTop:10,padding:"7px 12px",background:C.green+"15",borderRadius:8,fontSize:12,color:C.green}}>🎉 You save ${Math.round(PLANS[selected].price*12*.2)} per year with annual billing</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
            <Input label="CARDHOLDER NAME" value={cardName} onChange={e=>setCardName(e.target.value)} placeholder="Jane Smith" error={cardErr.name}/>
            <Input label="CARD NUMBER" value={cardNum} onChange={e=>setCardNum(formatCard(e.target.value))} placeholder="1234 5678 9012 3456" error={cardErr.card}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Input label="EXPIRY" value={expiry} onChange={e=>setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" error={cardErr.expiry}/>
              <Input label="CVV" value={cvv} onChange={e=>setCvv(e.target.value.replace(/\D/g,"").substring(0,4))} placeholder="123" error={cardErr.cvv}/>
            </div>
          </div>
          <div style={{padding:"10px 14px",background:C.green+"10",border:`1px solid ${C.green}22`,borderRadius:8,fontSize:12,color:C.muted,marginBottom:16}}>
            🔒 Demo UI — no real charges. Card data is not stored or transmitted.
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn variant="secondary" onClick={()=>setPayStep("plans")}>← Back</Btn>
            <Btn full onClick={checkout} disabled={paying} style={{background:PLANS[selected].color,color:"#fff",border:"none"}}>
              {paying?`Processing…`:`Pay $${price(selected)} ${billing==="annual"?"/ mo (annual)":"/ month"}`}
            </Btn>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const NAV=[
  {id:"dashboard",  label:"Dashboard",       icon:"⬡"},
  {id:"resume",     label:"Resume Analysis", icon:"📄"},
  {id:"interview",  label:"Mock Interview",  icon:"🎤"},
  {id:"gaps",       label:"Skill Gaps",      icon:"🎯"},
  {id:"jdmatch",    label:"JD Matcher",      icon:"🔗"},
  {id:"coach",      label:"AI Career Coach", icon:"💬"},
  {id:"cover",      label:"Cover Letter",    icon:"✉️"},
  {id:"history",    label:"Session History", icon:"📋"},
  {id:"achievements",label:"Achievements",  icon:"🏆"},
  {id:"analytics",  label:"Analytics",       icon:"📊"},
  {id:"settings",   label:"Settings",        icon:"⚙️"},
];

function Sidebar({active,setActive,user,userData,onLogout,onUpgrade}){
  const plan=PLANS[userData.plan||"free"];
  return(
    <nav style={{width:220,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"18px 10px",position:"fixed",top:0,bottom:0,left:0,zIndex:100,overflowY:"auto"}}>
      <div style={{paddingLeft:8,marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:900,color:C.text,letterSpacing:-0.5}}>TalentAI</div>
        <div style={{fontSize:9,color:C.muted,letterSpacing:2}}>INTERVIEW PREP</div>
      </div>
      <div style={{background:C.card,borderRadius:12,padding:"10px 12px",marginBottom:12,display:"flex",gap:12,alignItems:"center"}}>
        <div style={{textAlign:"center"}}><div style={{fontSize:18}}>{(userData.streak||0)>=3?"🔥":"⭐"}</div><div style={{fontSize:11,color:C.amber,fontWeight:700}}>{userData.streak||0}d</div></div>
        <div style={{flex:1}}><div style={{fontSize:11,color:C.muted,marginBottom:4}}>Today: {userData.todayCount||0}/{userData.dailyGoal||3}</div><ProgressBar value={userData.todayCount||0} max={userData.dailyGoal||3} color={C.amber} h={5}/></div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:1}}>
        {NAV.map(n=>{
          const locked=userData.plan==="free"&&["coach","history"].includes(n.id);
          return(
            <button key={n.id} onClick={()=>setActive(n.id)}
              style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:9,border:"none",background:active===n.id?C.accent+"22":"transparent",color:active===n.id?C.accent:locked?C.muted+"80":C.muted,cursor:"pointer",fontSize:12.5,fontWeight:active===n.id?700:400,textAlign:"left",transition:"all .18s",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:9}}><span style={{fontSize:13}}>{n.icon}</span>{n.label}</div>
              {locked&&<span style={{fontSize:10}}>🔒</span>}
            </button>
          );
        })}
      </div>
      <div style={{marginTop:12,padding:"12px",background:C.card,borderRadius:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <Badge color={plan.color}>{plan.name} Plan</Badge>
          {userData.plan==="free"&&<button onClick={onUpgrade} style={{fontSize:11,background:"none",border:"none",color:C.accent,cursor:"pointer",fontWeight:700}}>Upgrade</button>}
        </div>
        {userData.plan==="free"&&<div style={{fontSize:11,color:C.muted,marginBottom:8}}>{userData.interviewsThisMonth||0}/3 interviews used<div style={{marginTop:4}}><ProgressBar value={userData.interviewsThisMonth||0} max={3} color={C.red} h={4}/></div></div>}
        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:C.accent+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.accent,flexShrink:0}}>{user.name[0].toUpperCase()}</div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:12,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
            <button onClick={onLogout} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:11,padding:0}}>Sign Out</button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({userData,setActive,user,onUpgrade}){
  const sessions=userData.sessions||[];
  const avg=sessions.length?Math.round(sessions.reduce((a,s)=>a+s.avgScore,0)/sessions.length):null;
  const unlocked=ACHIEVEMENTS.filter(a=>a.check(userData));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div><h1 style={{fontSize:26,fontWeight:900,color:C.text,margin:0}}>Welcome back, {user.name.split(" ")[0]} 👋</h1><p style={{color:C.muted,margin:"4px 0 0",fontSize:14}}>Your AI-powered interview command center</p></div>
        {userData.plan==="free"&&<div onClick={onUpgrade} style={{background:`linear-gradient(135deg,${C.accent},${C.purple})`,borderRadius:12,padding:"10px 18px",cursor:"pointer",textAlign:"center"}}><div style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>Unlock all features</div><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>Upgrade to Pro →</div></div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[{label:"Skills Found",value:userData.skills?.length||0,color:C.accent,icon:"🧩"},{label:"Sessions",value:sessions.length,color:C.green,icon:"✅"},{label:"Avg Score",value:avg!=null?`${avg}%`:"—",color:C.amber,icon:"⭐"},{label:"Day Streak",value:`${userData.streak||0}🔥`,color:C.red,icon:""}].map(s=>(
          <Card key={s.label} style={{padding:18}}><div style={{fontSize:22,marginBottom:6}}>{s.icon}</div><div style={{fontSize:28,fontWeight:900,color:s.color}}>{s.value}</div><div style={{fontSize:12,color:C.muted,marginTop:3}}>{s.label}</div></Card>
        ))}
      </div>
      <Card style={{padding:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div><div style={{fontWeight:700,color:C.text}}>Daily Goal</div><div style={{fontSize:12,color:C.muted}}>{userData.todayCount||0} of {userData.dailyGoal||3} questions today</div></div>
          <div style={{fontSize:22,fontWeight:900,color:(userData.todayCount||0)>=(userData.dailyGoal||3)?C.green:C.amber}}>{Math.round(((userData.todayCount||0)/(userData.dailyGoal||3))*100)}%</div>
        </div>
        <ProgressBar value={userData.todayCount||0} max={userData.dailyGoal||3} color={(userData.todayCount||0)>=(userData.dailyGoal||3)?C.green:C.amber} h={10}/>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        {[{id:"resume",icon:"📄",title:"Resume Analysis",desc:"NLP skill extraction + ATS scoring",color:C.accent},{id:"interview",icon:"🎤",title:"Mock Interview",desc:"ML-scored with ideal answer reveal",color:C.green},{id:"jdmatch",icon:"🔗",title:"JD Matcher",desc:"AI fit score against any job posting",color:C.amber},{id:"coach",icon:"💬",title:"AI Career Coach",desc:"Personalized career advice anytime",color:C.purple},{id:"cover",icon:"✉️",title:"Cover Letter",desc:"AI-generated tailored letter",color:C.red},{id:"gaps",icon:"🎯",title:"Skill Gap Analysis",desc:"Data mining against role requirements",color:C.cyan}].map(item=>(
          <Card key={item.id} hover onClick={()=>setActive(item.id)} style={{padding:18}}><div style={{fontSize:26,marginBottom:8}}>{item.icon}</div><div style={{fontWeight:700,color:C.text,fontSize:14,marginBottom:4}}>{item.title}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{item.desc}</div></Card>
        ))}
      </div>
      {unlocked.length>0&&(
        <Card><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 style={{margin:0,color:C.text}}>Achievements <Badge color={C.amber}>{unlocked.length}/{ACHIEVEMENTS.length}</Badge></h3><button onClick={()=>setActive("achievements")} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:13}}>See all →</button></div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{unlocked.slice(0,6).map(a=><div key={a.id} title={a.title} style={{width:44,height:44,borderRadius:12,background:C.amber+"20",border:`1px solid ${C.amber}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{a.icon}</div>)}</div>
        </Card>
      )}
      {sessions.length>0&&(
        <Card><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 style={{margin:0,color:C.text}}>Recent Sessions</h3><button onClick={()=>setActive("history")} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:13}}>View all →</button></div>
          {sessions.slice(-3).reverse().map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:C.surface,borderRadius:10,marginBottom:8}}>
              <div><div style={{fontWeight:600,color:C.text,fontSize:14}}>{s.role}</div><div style={{fontSize:11,color:C.muted}}>{s.date}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:70}}><ProgressBar value={s.avgScore} color={s.avgScore>=70?C.green:s.avgScore>=40?C.amber:C.red}/></div><span style={{fontWeight:700,color:s.avgScore>=70?C.green:s.avgScore>=40?C.amber:C.red,minWidth:36,textAlign:"right",fontSize:14}}>{s.avgScore}%</span></div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESUME SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function ResumeScreen({userData,onResumeAnalyzed}){
  const [tab,setTab]=useState("upload");
  const [text,setText]=useState("");
  const [fileName,setFileName]=useState(null);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const fileRef=useRef();

  const processFile=async(f)=>{
    setBusy(true);setFileName(f.name);
    try{
      const ext=f.name.split(".").pop().toLowerCase();
      if(!["pdf","docx","doc"].includes(ext)) throw new Error("PDF or DOCX only");
      const t=ext==="pdf"?await extractPDF(f):await extractDOCX(f);
      if(!t.trim()) throw new Error("No text found in file");
      setText(t);
    }catch(e){alert("Could not read file: "+e.message+"\n\nTip: Try the Paste Text tab and paste your resume text directly.");}
    setBusy(false);
  };

  const analyze=async()=>{
    setLoading(true);
    try{
      const res=await resumeAPI.analyze(text);
      setResult(res);
      onResumeAnalyzed(res, text);
    }catch(e){ alert("Analysis failed: "+e.message); }
    setLoading(false);
  };

  const TAB=(id,lbl,icon)=>(
    <button onClick={()=>setTab(id)} style={{padding:"8px 20px",borderRadius:9,border:`1px solid ${tab===id?C.accent:C.border}`,background:tab===id?C.accent+"18":"transparent",color:tab===id?C.accent:C.muted,cursor:"pointer",fontSize:13,fontWeight:tab===id?700:400,transition:"all .2s"}}>{icon} {lbl}</button>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <div><h2 style={{fontSize:24,fontWeight:900,color:C.text,margin:0}}>Resume Analysis</h2><p style={{color:C.muted,margin:"4px 0 0",fontSize:14}}>Upload PDF/DOCX or paste text — AI extracts skills, assesses your profile & ATS score</p></div>
      <div style={{display:"flex",gap:8}}>{TAB("upload","Upload File","📁")}{TAB("paste","Paste Text","📋")}</div>
      {tab==="upload"&&(
        <Card>
          <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)processFile(f);}} onClick={()=>fileRef.current?.click()}
            style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:"32px 20px",textAlign:"center",background:C.surface,cursor:"pointer"}}>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" style={{display:"none"}} onChange={e=>{if(e.target.files[0])processFile(e.target.files[0]);e.target.value="";}}/>
            {busy?<><div style={{fontSize:28,marginBottom:8}}>⏳</div><div style={{color:C.accent}}>Extracting text from {fileName}…</div></>
             :fileName&&text?<><div style={{fontSize:28,marginBottom:8}}>✅</div><div style={{color:C.green,fontWeight:700}}>{fileName}</div><div style={{fontSize:12,color:C.muted,marginTop:4}}>{text.length.toLocaleString()} chars · Click to replace</div></>
             :<><div style={{fontSize:36,marginBottom:10}}>📁</div><div style={{fontWeight:700,color:C.text,marginBottom:6}}>Drop resume here or click to browse</div><div style={{color:C.muted,fontSize:13}}>PDF · DOCX · DOC</div></>}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:14}}>
            <Btn onClick={analyze} disabled={loading||!text||busy}>{loading?"Analyzing…":"🔍 Analyze Resume"}</Btn>
          </div>
        </Card>
      )}
      {tab==="paste"&&(
        <Card>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Paste your full resume here…"
            style={{width:"100%",height:220,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:14,color:C.text,fontSize:14,lineHeight:1.6,resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
            <span style={{fontSize:12,color:C.muted}}>{text.length.toLocaleString()} chars</span>
            <Btn onClick={analyze} disabled={loading||text.trim().length<50}>{loading?"Analyzing…":"🔍 Analyze Resume"}</Btn>
          </div>
        </Card>
      )}
      {loading&&<Card style={{textAlign:"center",padding:28}}><div style={{fontSize:32,marginBottom:8}}>🤖</div><div style={{color:C.accent,fontWeight:600}}>Analyzing your resume…</div><div style={{color:C.muted,fontSize:13,marginTop:4}}>Running NLP extraction · Assessing profile · Scoring ATS compatibility</div></Card>}
      {result&&!loading&&(
        <>
          <Card><h3 style={{margin:"0 0 12px",color:C.text}}>Extracted Skills <Badge color={C.green}>{result.skillCount}</Badge></h3><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{result.skills?.map(s=><Badge key={s}>{s}</Badge>)}</div></Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Card>
              <h3 style={{margin:"0 0 12px",color:C.text}}>AI Assessment</h3>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}><Badge color={C.amber}>{result.level}</Badge><Badge color={C.accent}>{result.bestRole}</Badge></div>
              {result.summary&&<p style={{fontSize:13,color:C.dim,lineHeight:1.6,padding:"10px 12px",background:C.surface,borderRadius:8,marginBottom:12}}>{result.summary}</p>}
              {result.strengths?.map((s,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:8}}><span style={{color:C.green}}>✓</span><span style={{fontSize:13,color:C.text,lineHeight:1.5}}>{s}</span></div>)}
            </Card>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <Card style={{padding:18}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h3 style={{margin:0,color:C.text,fontSize:15}}>ATS Score</h3><ScoreRing score={result.atsScore||75} size={56}/></div>
                {result.atsIssues?.map((s,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:6}}><span style={{color:C.amber}}>⚠</span><span style={{fontSize:12,color:C.text}}>{s}</span></div>)}
              </Card>
              <Card>
                <h3 style={{margin:"0 0 12px",color:C.text}}>Improvements</h3>
                {result.improvements?.map((s,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:10}}><span style={{color:C.amber}}>→</span><span style={{fontSize:13,color:C.text,lineHeight:1.5}}>{s}</span></div>)}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK INTERVIEW
// ─────────────────────────────────────────────────────────────────────────────
function InterviewScreen({userData,onSessionSaved,onUpgrade}){
  const [role,setRole]=useState(userData.recommendedRole||"Software Engineer");
  const [phase,setPhase]=useState("setup");
  const [qIdx,setQIdx]=useState(0);
  const [answer,setAnswer]=useState("");
  const [scores,setScores]=useState([]);
  const [current,setCurrent]=useState(null);
  const [loading,setLoading]=useState(false);
  const [voiceMode,setVoiceMode]=useState(false);
  const [listening,setListening]=useState(false);
  const [timedMode,setTimedMode]=useState(false);
  const [timeLeft,setTimeLeft]=useState(120);
  const [timerActive,setTimerActive]=useState(false);
  const recognRef=useRef(); const timerRef=useRef();

  const canInterview=userData.plan!=="free"||(userData.interviewsThisMonth||0)<3;
  const questions=QUESTIONS[role]||[];
  const q=questions[qIdx];

  useEffect(()=>{
    if(timerActive&&timedMode){
      timerRef.current=setInterval(()=>{setTimeLeft(t=>{if(t<=1){clearInterval(timerRef.current);setTimerActive(false);return 0;}return t-1;});},1000);
    }return()=>clearInterval(timerRef.current);
  },[timerActive,timedMode]);

  useEffect(()=>{if(timeLeft===0&&phase==="question")submitAnswer();},[timeLeft]);

  const speak=t=>{if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.rate=0.95;window.speechSynthesis.speak(u);};
  useEffect(()=>{if(phase==="question"&&voiceMode)speak(q?.q);},[phase,qIdx]);

  const startListening=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
    const r=new SR();r.continuous=true;r.interimResults=true;
    r.onresult=e=>setAnswer(Array.from(e.results).map(x=>x[0].transcript).join(""));
    r.onend=()=>setListening(false);r.start();recognRef.current=r;setListening(true);
  };
  const stopListening=()=>{recognRef.current?.stop();setListening(false);};

  const startInterview=()=>{
    if(!canInterview){onUpgrade();return;}
    setPhase("question");
    if(timedMode){setTimeLeft(120);setTimerActive(true);}
  };

  const submitAnswer=async()=>{
    if(!answer.trim()) return;
    stopListening();clearInterval(timerRef.current);setTimerActive(false);setLoading(true);
    try{
      const res=await interviewAPI.evaluate(q.q, answer, q.ref, userData.apiKey||null);
      const entry={q:q.q,question:q.q,score:res.score,feedback:res.feedback,ideal:res.ideal,idealAnswer:res.ideal||'',missed:res.missed||'',userAnswer:answer};
      setScores(p=>[...p,entry]);setCurrent(entry);
      setPhase("result");
    }catch(e){ alert("Evaluation failed: "+e.message); }
    setLoading(false);
  };

  const next=async()=>{
    if(qIdx+1>=questions.length){
      // Use current entry to make sure last answer is included
      const all=[...scores];
      if(current && !all.find(s=>s.q===current.q)) all.push(current);
      const avg=all.length?Math.round(all.reduce((a,s)=>a+s.score,0)/all.length):0;
      try{
        const mapped=all.map(s=>({question:s.question||s.q||'',userAnswer:s.userAnswer||'',score:s.score||0,feedback:s.feedback||'',idealAnswer:s.idealAnswer||s.ideal||'',missed:s.missed||''}));
        const saved=await sessionsAPI.save(role,avg,mapped.length,mapped);
        onSessionSaved({id:saved?.id,role,avgScore:avg,questions:all.length,date:new Date().toLocaleDateString(),scores:all});
      }catch(e){ console.error("Save session error:",e.message); }
      setPhase("done");
    }else{
      setQIdx(i=>i+1);setAnswer("");setCurrent(null);setPhase("question");
      if(timedMode){setTimeLeft(120);setTimerActive(true);}
    }
  };

  if(phase==="setup") return(
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <div><h2 style={{fontSize:24,fontWeight:900,color:C.text,margin:0}}>Mock Interview</h2><p style={{color:C.muted,margin:"4px 0 0",fontSize:14}}>ML-scored · Voice support · Timed mode · Ideal answer reveal</p></div>
      {!canInterview&&<div style={{padding:"14px 18px",background:C.red+"15",border:`1px solid ${C.red}33`,borderRadius:10,color:C.red,fontSize:14}}>⚠️ You've used all 3 free interviews this month. <strong style={{cursor:"pointer",textDecoration:"underline"}} onClick={onUpgrade}>Upgrade to Pro</strong> for unlimited.</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card>
          <h3 style={{margin:"0 0 12px",color:C.text}}>Select Role</h3>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {Object.keys(QUESTIONS).map(r=>(
              <div key={r} onClick={()=>setRole(r)} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${role===r?C.accent:C.border}`,background:role===r?C.accent+"15":C.surface,cursor:"pointer",color:C.text,fontWeight:role===r?700:400,fontSize:14,transition:"all .2s",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                {r}{r===userData.recommendedRole&&<Badge color={C.green} sm>Rec.</Badge>}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 style={{margin:"0 0 14px",color:C.text}}>Options</h3>
          <div style={{borderBottom:`1px solid ${C.border}`,paddingBottom:12,marginBottom:12}}>
            <Toggle value={voiceMode} onChange={()=>setVoiceMode(v=>!v)} label="🎤 Voice Mode" desc="Speak your answers out loud"/>
            <Toggle value={timedMode} onChange={()=>setTimedMode(v=>!v)} label="⏱️ Timed Mode" desc="2 minutes per question"/>
          </div>
          <div style={{padding:"12px 0",marginBottom:16}}>
            <div style={{fontWeight:600,color:C.text,fontSize:14}}>📋 {questions.length} Questions</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>AI scored · Ideal answer revealed after each</div>
          </div>
          {userData.plan==="free"&&<div style={{fontSize:12,color:C.amber,marginBottom:14}}>⚡ Free plan: {3-(userData.interviewsThisMonth||0)} interviews remaining</div>}
          <Btn full onClick={startInterview} disabled={!canInterview}>Start Interview →</Btn>
        </Card>
      </div>
    </div>
  );

  if(phase==="done"){
    const avg=Math.round(scores.reduce((a,s)=>a+s.score,0)/scores.length);
    return(
      <div style={{display:"flex",flexDirection:"column",gap:18}}>
        <Card style={{textAlign:"center",padding:36}}><div style={{fontSize:48,marginBottom:12}}>{avg>=70?"🎉":"💪"}</div><h2 style={{color:C.text,margin:"0 0 4px"}}>Session Complete!</h2><div style={{fontSize:52,fontWeight:900,color:C.green}}>{avg}%</div><p style={{color:C.muted}}>Average · {role}</p><Btn onClick={()=>{setPhase("setup");setQIdx(0);setScores([]);setCurrent(null);setAnswer("");}}>New Session</Btn></Card>
        <Card><h3 style={{margin:"0 0 16px",color:C.text}}>Breakdown</h3>{scores.map((s,i)=>(
          <div key={i} style={{padding:"14px 0",borderBottom:i<scores.length-1?`1px solid ${C.border}`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,color:C.muted}}>Q{i+1}</span><span style={{fontWeight:800,color:s.score>=70?C.green:s.score>=40?C.amber:C.red}}>{s.score}/100</span></div>
            <p style={{margin:"0 0 6px",fontSize:14,color:C.text}}>{s.q}</p>
            <ProgressBar value={s.score} color={s.score>=70?C.green:s.score>=40?C.amber:C.red}/>
            {s.ideal&&<div style={{marginTop:8,padding:"8px 12px",background:C.green+"10",border:`1px solid ${C.green}22`,borderRadius:8}}><div style={{fontSize:11,fontWeight:700,color:C.green,marginBottom:4}}>IDEAL ANSWER</div><div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{s.ideal}</div></div>}
          </div>
        ))}</Card>
      </div>
    );
  }

  return(
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><h2 style={{fontSize:20,fontWeight:900,color:C.text,margin:0}}>{role}</h2><p style={{color:C.muted,margin:"3px 0 0",fontSize:13}}>Q{qIdx+1}/{questions.length}</p></div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {timedMode&&phase==="question"&&<div style={{fontSize:20,fontWeight:900,color:timeLeft<30?C.red:C.amber,fontFamily:"monospace"}}>{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,"0")}</div>}
          <div style={{display:"flex",gap:4}}>{questions.map((_,i)=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:i<qIdx?C.green:i===qIdx?C.accent:C.border}}/>)}</div>
        </div>
      </div>
      <Card><div style={{fontSize:11,fontWeight:700,color:C.accent,letterSpacing:1,marginBottom:10}}>QUESTION {qIdx+1}</div><p style={{fontSize:17,color:C.text,margin:0,lineHeight:1.65}}>{q?.q}</p>{voiceMode&&<button onClick={()=>speak(q?.q)} style={{marginTop:10,background:"none",border:`1px solid ${C.border}`,borderRadius:7,padding:"5px 12px",color:C.muted,cursor:"pointer",fontSize:12}}>🔊 Read aloud</button>}</Card>
      {phase==="question"&&(
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <label style={{fontSize:11,fontWeight:700,color:C.muted}}>YOUR ANSWER</label>
            {voiceMode&&<button onClick={listening?stopListening:startListening} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${listening?C.red:C.green}`,background:listening?C.red+"15":C.green+"15",color:listening?C.red:C.green,cursor:"pointer",fontSize:12,fontWeight:700}}>{listening?"⏹ Stop":"🎤 Speak"}</button>}
          </div>
          {listening&&<div style={{fontSize:12,color:C.red,fontWeight:600,marginBottom:6}}>● Recording…</div>}
          <textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder={voiceMode?"Click Speak or type…":"Type your answer…"}
            style={{width:"100%",height:160,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:14,color:C.text,fontSize:14,lineHeight:1.6,resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}><Btn onClick={submitAnswer} disabled={loading||!answer.trim()}>{loading?"Evaluating…":"Submit →"}</Btn></div>
        </Card>
      )}
      {phase==="result"&&current&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:12}}>
            <Card style={{padding:20,display:"flex",flexDirection:"column",alignItems:"center",minWidth:100}}><ScoreRing score={current.score}/><span style={{fontSize:11,color:C.muted,marginTop:6}}>Score</span></Card>
            <Card><div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:6}}>FEEDBACK</div><p style={{margin:"0 0 10px",fontSize:14,color:C.text,lineHeight:1.6}}>{current.feedback}</p>{current.missed&&<div style={{padding:"7px 12px",background:C.amber+"15",borderRadius:8,border:`1px solid ${C.amber}33`,fontSize:13}}><strong style={{color:C.amber}}>Key gap: </strong><span style={{color:C.text}}>{current.missed}</span></div>}</Card>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Card><div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8}}>YOUR ANSWER</div><p style={{fontSize:13,color:C.dim,lineHeight:1.6,margin:0}}>{current.userAnswer}</p></Card>
            <Card style={{borderColor:C.green+"44",background:C.green+"06"}}><div style={{fontSize:11,fontWeight:700,color:C.green,marginBottom:8}}>✦ IDEAL ANSWER</div><p style={{fontSize:13,color:C.text,lineHeight:1.6,margin:0}}>{current.ideal}</p></Card>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}><Btn onClick={next}>{qIdx+1>=questions.length?"View Results →":"Next →"}</Btn></div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JD MATCHER
// ─────────────────────────────────────────────────────────────────────────────
function JDMatcher({userData,onJDMatched}){
  const [jd,setJd]=useState(""); const [result,setResult]=useState(null); const [loading,setLoading]=useState(false);
  const match=async()=>{
    if(!userData.resumeText){alert("Analyze your resume first.");return;}
    setLoading(true);
    try{
      const res=await resumeAPI.jdMatch(jd, userData.apiKey||null);
      setResult(res); onJDMatched();
    }catch(e){alert(e.message);}
    setLoading(false);
  };
  const sc=s=>s>=75?C.green:s>=50?C.amber:C.red;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <div><h2 style={{fontSize:24,fontWeight:900,color:C.text,margin:0}}>JD Matcher</h2><p style={{color:C.muted,margin:"4px 0 0",fontSize:14}}>Paste any job posting — AI scores your fit, highlights matched and missing skills</p></div>
      {!userData.resumeText&&<div style={{padding:"12px 16px",background:C.amber+"15",border:`1px solid ${C.amber}33`,borderRadius:10,color:C.amber,fontSize:14}}>⚠️ Analyze your resume first.</div>}
      <Card><label style={{fontSize:11,fontWeight:700,color:C.muted,display:"block",marginBottom:8}}>JOB DESCRIPTION</label>
        <textarea value={jd} onChange={e=>setJd(e.target.value)} placeholder="Paste the full job description…"
          style={{width:"100%",height:200,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:14,color:C.text,fontSize:14,lineHeight:1.6,resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}><Btn onClick={match} disabled={loading||!jd.trim()||!userData.resumeText}>{loading?"Matching…":"🔗 Match My Resume"}</Btn></div>
      </Card>
      {loading&&<Card style={{textAlign:"center",padding:28}}><div style={{fontSize:32,marginBottom:8}}>🔍</div><div style={{color:C.accent,fontWeight:600}}>Comparing resume to job description…</div></Card>}
      {result&&!loading&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card style={{textAlign:"center",padding:30}}><div style={{fontSize:60,fontWeight:900,color:sc(result.matchScore)}}>{result.matchScore}%</div><Badge color={sc(result.matchScore)}>{result.verdict}</Badge><p style={{color:C.muted,marginTop:12,fontSize:14}}>{result.recommendation}</p></Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Card><h3 style={{margin:"0 0 12px",color:C.green}}>✓ Matched</h3><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{result.matchedKeywords?.map(k=><Badge key={k} color={C.green}>{k}</Badge>)}</div></Card>
            <Card><h3 style={{margin:"0 0 12px",color:C.red}}>✗ Missing</h3><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{result.missingKeywords?.map(k=><Badge key={k} color={C.red}>{k}</Badge>)}</div></Card>
            <Card><h3 style={{margin:"0 0 12px",color:C.text}}>Strengths</h3>{result.strengths?.map((s,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:7}}><span style={{color:C.green}}>✓</span><span style={{fontSize:13,color:C.text,lineHeight:1.5}}>{s}</span></div>)}</Card>
            <Card><h3 style={{margin:"0 0 12px",color:C.text}}>Concerns</h3>{result.gaps?.map((s,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:7}}><span style={{color:C.amber}}>→</span><span style={{fontSize:13,color:C.text,lineHeight:1.5}}>{s}</span></div>)}</Card>
          </div>
          {result.tailoredTip&&<Card style={{borderColor:C.purple+"44",background:C.purple+"08"}}><div style={{fontSize:11,fontWeight:700,color:C.purple,marginBottom:6}}>💡 TAILORED TIP</div><p style={{margin:0,fontSize:14,color:C.text,lineHeight:1.6}}>{result.tailoredTip}</p></Card>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CAREER COACH
// ─────────────────────────────────────────────────────────────────────────────
function CareerCoach({userData,onUpgrade}){
  const locked=userData.plan==="free";
  const [msgs,setMsgs]=useState([{role:"assistant",content:`Hi! I'm your AI Career Coach 👋\n\nI know your profile — ${userData.skills?.length||0} skills${userData.recommendedRole?`, targeting ${userData.recommendedRole}`:""}${userData.level?`, ${userData.level} level`:""}.\n\nAsk me anything about interviews, career strategy, salary negotiation, or what to study next!`}]);
  const [input,setInput]=useState(""); const [loading,setLoading]=useState(false); const bottomRef=useRef();
  const STARTERS=["How do I negotiate my salary?","What should I study to land my target role?","How do I answer 'Tell me about yourself'?","How do I stand out in a technical interview?","What projects should I add to my portfolio?"];
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  if(locked) return(
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <div><h2 style={{fontSize:24,fontWeight:900,color:C.text,margin:0}}>AI Career Coach</h2></div>
      <Card style={{textAlign:"center",padding:48}}><div style={{fontSize:48,marginBottom:14}}>💬</div><h3 style={{color:C.text,margin:"0 0 8px"}}>Pro Feature</h3><p style={{color:C.muted,marginBottom:20,fontSize:14}}>AI Career Coach is available on the Pro plan. Upgrade to get personalized career advice, interview strategy, and guidance tailored to your profile.</p><Btn onClick={onUpgrade}>Upgrade to Pro — $9/mo →</Btn></Card>
    </div>
  );

  const send=async(text)=>{
    const msg=text||input.trim(); if(!msg||loading) return;
    setInput("");
    const history=[...msgs,{role:"user",content:msg}]; setMsgs(history); setLoading(true);
    try{
      const res=await interviewAPI.coach(history.map(m=>({role:m.role,content:m.content})),userData.skills||[],userData.level,userData.recommendedRole,userData.apiKey||null);
      setMsgs([...history,{role:"assistant",content:res.reply}]);
    }catch(e){ setMsgs([...history,{role:"assistant",content:"Sorry, I couldn't respond right now. Please try again."}]); }
    setLoading(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20,height:"calc(100vh - 120px)"}}>
      <div><h2 style={{fontSize:24,fontWeight:900,color:C.text,margin:0}}>AI Career Coach</h2><p style={{color:C.muted,margin:"4px 0 0",fontSize:14}}>Your personal career advisor — profile-aware, always available</p></div>
      <Card style={{flex:1,display:"flex",flexDirection:"column",padding:0,overflow:"hidden",height:"calc(100vh - 200px)"}}>
        <div style={{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:12}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"80%",padding:"11px 16px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?C.accent:C.surface,color:C.text,fontSize:14,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.content}</div>
            </div>
          ))}
          {loading&&<div style={{display:"flex"}}><div style={{padding:"11px 16px",borderRadius:"14px 14px 14px 4px",background:C.surface,color:C.muted,fontSize:14}}>Thinking…</div></div>}
          <div ref={bottomRef}/>
        </div>
        {msgs.length<2&&<div style={{padding:"0 20px 14px",display:"flex",flexWrap:"wrap",gap:7}}>{STARTERS.map(s=><button key={s} onClick={()=>send(s)} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:C.card,color:C.muted,cursor:"pointer",fontSize:12}}>{s}</button>)}</div>}
        <div style={{padding:14,borderTop:`1px solid ${C.border}`,display:"flex",gap:10}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask anything about your career…" style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:14,fontFamily:"inherit",outline:"none"}}/>
          <Btn onClick={()=>send()} disabled={loading||!input.trim()}>Send</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COVER LETTER
// ─────────────────────────────────────────────────────────────────────────────
function CoverLetter({userData,onLetterGenerated}){
  const [jd,setJd]=useState(""); const [company,setCompany]=useState(""); const [tone,setTone]=useState("professional"); const [letter,setLetter]=useState(""); const [loading,setLoading]=useState(false);
  const generate=async()=>{
    if(!userData.resumeText){alert("Analyze resume first.");return;}setLoading(true);
    try{
      const res=await resumeAPI.coverLetter(jd,company,tone,userData.apiKey||null);
      setLetter(res.letter); onLetterGenerated();
    }catch(e){alert(e.message);}
    setLoading(false);
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <div><h2 style={{fontSize:24,fontWeight:900,color:C.text,margin:0}}>Cover Letter Generator</h2><p style={{color:C.muted,margin:"4px 0 0",fontSize:14}}>AI generates a tailored cover letter from your resume and the job description</p></div>
      {!userData.resumeText&&<div style={{padding:"12px 16px",background:C.amber+"15",border:`1px solid ${C.amber}33`,borderRadius:10,color:C.amber,fontSize:14}}>⚠️ Upload resume first.</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Input label="COMPANY NAME" value={company} onChange={e=>setCompany(e.target.value)} placeholder="e.g. Google, Stripe"/>
            <div><div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:7}}>TONE</div>
              <div style={{display:"flex",gap:8}}>{["professional","conversational","enthusiastic"].map(t=>(
                <button key={t} onClick={()=>setTone(t)} style={{flex:1,padding:"8px 0",borderRadius:8,border:`1px solid ${tone===t?C.accent:C.border}`,background:tone===t?C.accent+"15":"transparent",color:tone===t?C.accent:C.muted,cursor:"pointer",fontSize:12,fontWeight:tone===t?700:400,textTransform:"capitalize"}}>{t}</button>
              ))}</div>
            </div>
            <div><div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:7}}>JOB DESCRIPTION</div>
              <textarea value={jd} onChange={e=>setJd(e.target.value)} placeholder="Paste JD here…" style={{width:"100%",height:180,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:12,color:C.text,fontSize:13,lineHeight:1.6,resize:"vertical",fontFamily:"inherit",boxSizing:"border-box"}}/>
            </div>
            <Btn full onClick={generate} disabled={loading||!jd.trim()||!userData.resumeText}>{loading?"Writing…":"✉️ Generate Letter"}</Btn>
          </div>
        </Card>
        <Card style={{display:"flex",flexDirection:"column",padding:0,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:700,color:C.text,fontSize:14}}>Generated Letter</span>
            {letter&&<button onClick={()=>navigator.clipboard.writeText(letter)} style={{padding:"5px 10px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:12}}>📋 Copy</button>}
          </div>
          <div style={{flex:1,padding:18,overflowY:"auto",minHeight:300}}>
            {loading&&<div style={{textAlign:"center",padding:"40px 0"}}><div style={{fontSize:28,marginBottom:8}}>✍️</div><div style={{color:C.accent,fontWeight:600}}>Writing your cover letter…</div></div>}
            {!loading&&!letter&&<div style={{color:C.muted,fontSize:14,textAlign:"center",marginTop:60}}>Your letter will appear here</div>}
            {letter&&!loading&&<p style={{fontSize:14,color:C.text,lineHeight:1.8,margin:0,whiteSpace:"pre-wrap"}}>{letter}</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILL GAPS
// ─────────────────────────────────────────────────────────────────────────────
function GapsScreen({userData,onCoverageUpdate}){
  const ROLE_REQS={
    "Software Engineer":["Python","JavaScript","TypeScript","React","Node.js","SQL","Git","REST APIs","Data Structures","Algorithms","System Design","Docker"],
    "Data Scientist":["Python","Machine Learning","Statistics","Pandas","NumPy","SQL","TensorFlow","scikit-learn","Data Visualization","NLP","Deep Learning","R"],
    "Data Engineer":["Python","SQL","Apache Spark","Kafka","Airflow","AWS","ETL","Data Warehousing","Docker","Kubernetes","Hadoop","Scala"],
    "ML Engineer":["Python","TensorFlow","PyTorch","MLOps","Docker","Kubernetes","scikit-learn","REST APIs","SQL","AWS/GCP","Model Deployment","Git"],
    "Frontend Developer":["JavaScript","TypeScript","React","CSS","HTML","Vue.js","Webpack","Git","REST APIs","Testing","Accessibility","Performance Optimization"],
  };
  const [role,setRole]=useState(userData.recommendedRole||"Software Engineer");
  const [plan,setPlan]=useState(null); const [loading,setLoading]=useState(false); const [analyzing,setAnalyzing]=useState(false); const [gapResult,setGapResult]=useState(null);

  const req=ROLE_REQS[role]||[];
  const userLower=(userData.skills||[]).map(s=>s.toLowerCase());
  const present=req.filter(s=>userLower.includes(s.toLowerCase()));
  const missing=req.filter(s=>!userLower.includes(s.toLowerCase()));
  const cov=req.length?Math.round((present.length/req.length)*100):0;

  const runAnalysis=async()=>{
    setAnalyzing(true);
    try{
      const res=await interviewAPI.gaps(role,userData.skills||[],userData.apiKey||null);
      setGapResult(res); onCoverageUpdate(res.coverage,role);
    }catch(e){ onCoverageUpdate(cov,role); }
    setAnalyzing(false);
  };

  const getPlan=async()=>{
    setLoading(true);
    try{ const res=await interviewAPI.gaps(role,missing,userData.apiKey||null); setPlan(res); }
    catch(e){ console.error(e); }
    setLoading(false);
  };

  const coverage=gapResult?.coverage||cov;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <div><h2 style={{fontSize:24,fontWeight:900,color:C.text,margin:0}}>Skill Gap Analysis</h2><p style={{color:C.muted,margin:"4px 0 0",fontSize:14}}>Data mining against role requirements → personalized AI learning plan</p></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{Object.keys(ROLE_REQS).map(r=><button key={r} onClick={()=>{setRole(r);setPlan(null);setGapResult(null);}} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${role===r?C.accent:C.border}`,background:role===r?C.accent+"15":"transparent",color:role===r?C.accent:C.muted,cursor:"pointer",fontSize:13,fontWeight:role===r?700:400}}>{r}</button>)}</div>
      {!userData.skills?.length&&<div style={{padding:"12px 16px",background:C.amber+"15",border:`1px solid ${C.amber}33`,borderRadius:10,color:C.amber,fontSize:14}}>⚠️ No resume analyzed yet.</div>}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h3 style={{margin:0,color:C.text}}>Coverage — {role}</h3>
          <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:30,fontWeight:900,color:coverage>=70?C.green:coverage>=40?C.amber:C.red}}>{coverage}%</span><Btn sm onClick={runAnalysis} disabled={analyzing}>{analyzing?"Running…":"Run Analysis"}</Btn></div>
        </div>
        <ProgressBar value={coverage} color={coverage>=70?C.green:coverage>=40?C.amber:C.red} h={12}/>
        <div style={{display:"flex",gap:20,marginTop:10}}><span style={{fontSize:13,color:C.green}}>✓ {present.length} present</span><span style={{fontSize:13,color:C.red}}>✗ {missing.length} missing</span></div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Card><h3 style={{margin:"0 0 12px",color:C.green}}>✓ You Have</h3><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{present.length?present.map(s=><Badge key={s} color={C.green}>{s}</Badge>):<span style={{color:C.muted,fontSize:14}}>None matched</span>}</div></Card>
        <Card><h3 style={{margin:"0 0 12px",color:C.red}}>✗ To Develop</h3><div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>{missing.map(s=><Badge key={s} color={C.red}>{s}</Badge>)}</div>{missing.length>0&&<Btn onClick={getPlan} disabled={loading}>{loading?"Generating…":"🤖 Get AI Learning Plan"}</Btn>}</Card>
      </div>
      {plan&&(
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><h3 style={{margin:0,color:C.text}}>AI Learning Plan</h3><Badge color={C.amber}>{plan.timeline}</Badge></div>
          {plan.priority&&<div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8}}>PRIORITY ORDER</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{plan.priority.map((s,i)=><div key={s} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",background:C.accent+"15",borderRadius:8,border:`1px solid ${C.accent}22`}}><div style={{width:18,height:18,borderRadius:"50%",background:C.accent,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{i+1}</div><span style={{color:C.text,fontSize:13,fontWeight:600}}>{s}</span></div>)}</div></div>}
          {plan.weeklyPlan&&<div style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8}}>WEEKLY PLAN</div>{plan.weeklyPlan.map((w,i)=><div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.accent,fontWeight:700,fontSize:13,minWidth:56}}>Week {i+1}</span><span style={{fontSize:13,color:C.text}}>{w}</span></div>)}</div>}
          {plan.resources&&<div><div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:8}}>RESOURCES</div>{Object.entries(plan.resources).map(([s,t])=><div key={s} style={{display:"flex",gap:10,padding:"8px 12px",background:C.surface,borderRadius:8,marginBottom:6,alignItems:"flex-start"}}><Badge>{s}</Badge><span style={{fontSize:13,color:C.muted,flex:1}}>{t}</span></div>)}</div>}
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION HISTORY
// ─────────────────────────────────────────────────────────────────────────────
function SessionHistory({userData,onUpgrade}){
  const [selected,setSelected]=useState(null);
  const [detail,setDetail]=useState(null);
  const [loadingDetail,setLoadingDetail]=useState(false);

  const loadDetail=async(session,i)=>{
    setSelected(selected===i?null:i);
    setDetail(null);
    if(selected===i) return;
    setLoadingDetail(true);
    try{
      if(session.id){
        const d=await sessionsAPI.getOne(session.id);
        setDetail(d);
      } else {
        // Use in-memory scores if no DB id
        setDetail({scores: session.scores||[]});
      }
    }catch(e){ console.error(e); setDetail({scores:session.scores||[]}); }
    setLoadingDetail(false);
  };

  if(userData.plan==="free") return(
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <h2 style={{fontSize:24,fontWeight:900,color:C.text,margin:0}}>Session History</h2>
      <Card style={{textAlign:"center",padding:48}}><div style={{fontSize:48,marginBottom:14}}>📋</div><h3 style={{color:C.text,margin:"0 0 8px"}}>Pro Feature</h3><p style={{color:C.muted,marginBottom:20,fontSize:14}}>Full session history with question-level review is a Pro feature.</p><Btn onClick={onUpgrade}>Upgrade to Pro →</Btn></Card>
    </div>
  );
  const sessions=[...(userData.sessions||[])].reverse();
  return(
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <div><h2 style={{fontSize:24,fontWeight:900,color:C.text,margin:0}}>Session History</h2><p style={{color:C.muted,margin:"4px 0 0",fontSize:14}}>{sessions.length} sessions stored in database</p></div>
      {!sessions.length&&<Card style={{textAlign:"center",padding:48}}><div style={{fontSize:48,marginBottom:12}}>📭</div><p style={{color:C.muted}}>No sessions yet. Start a mock interview!</p></Card>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1.6fr",gap:16,alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {sessions.map((s,i)=>(
            <Card key={i} hover onClick={()=>loadDetail(s,i)} style={{padding:16,borderColor:selected===i?C.accent:C.border}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><div style={{fontWeight:700,color:C.text,fontSize:14}}>{s.role}</div><span style={{fontWeight:900,color:s.avgScore>=70?C.green:s.avgScore>=40?C.amber:C.red,fontSize:16}}>{s.avgScore}%</span></div>
              <ProgressBar value={s.avgScore} color={s.avgScore>=70?C.green:s.avgScore>=40?C.amber:C.red}/>
              <div style={{fontSize:11,color:C.muted,marginTop:6}}>{s.date} · {s.questions} questions</div>
            </Card>
          ))}
        </div>
        {selected!==null&&sessions[selected]&&(
          <Card>
            <h3 style={{margin:"0 0 16px",color:C.text}}>Session Detail — {sessions[selected].role}</h3>
            {loadingDetail&&<div style={{textAlign:"center",padding:24,color:C.muted}}>Loading questions…</div>}
            {!loadingDetail&&detail&&(!detail.scores||detail.scores.length===0)&&(
              <p style={{color:C.muted,fontSize:13}}>No question details available for this session.</p>
            )}
            {!loadingDetail&&detail?.scores?.map((q,i)=>(
              <div key={i} style={{padding:"12px 0",borderBottom:i<detail.scores.length-1?`1px solid ${C.border}`:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,color:C.muted}}>Q{i+1}</span><span style={{fontWeight:700,color:q.score>=70?C.green:q.score>=40?C.amber:C.red}}>{q.score}/100</span></div>
                <p style={{margin:"0 0 6px",fontSize:13,color:C.text,fontWeight:500}}>{q.question||q.q}</p>
                <ProgressBar value={q.score} color={q.score>=70?C.green:q.score>=40?C.amber:C.red}/>
                {q.feedback&&<p style={{margin:"6px 0 0",fontSize:12,color:C.dim,lineHeight:1.5}}>{q.feedback}</p>}
                {(q.idealAnswer||q.ideal)&&<div style={{marginTop:8,padding:"7px 10px",background:C.green+"10",border:`1px solid ${C.green}22`,borderRadius:7,fontSize:12,color:C.text}}><strong style={{color:C.green}}>Ideal: </strong>{q.idealAnswer||q.ideal}</div>}
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACHIEVEMENTS
// ─────────────────────────────────────────────────────────────────────────────
function Achievements({userData}){
  const unlocked=ACHIEVEMENTS.filter(a=>a.check(userData));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <div><h2 style={{fontSize:24,fontWeight:900,color:C.text,margin:0}}>Achievements</h2><p style={{color:C.muted,margin:"4px 0 0",fontSize:14}}>{unlocked.length} of {ACHIEVEMENTS.length} unlocked</p></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
        {ACHIEVEMENTS.map(a=>{
          const done=a.check(userData);
          return(
            <Card key={a.id} style={{opacity:done?1:.5,borderColor:done?C.amber+"55":C.border}}>
              <div style={{display:"flex",gap:14,alignItems:"center"}}>
                <div style={{width:52,height:52,borderRadius:14,background:done?C.amber+"20":C.surface,border:`1px solid ${done?C.amber+"44":C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{a.icon}</div>
                <div><div style={{fontWeight:700,color:done?C.text:C.muted,fontSize:14,marginBottom:2}}>{a.title}</div><div style={{fontSize:12,color:C.muted}}>{a.desc}</div>{done&&<div style={{fontSize:11,color:C.amber,marginTop:4,fontWeight:600}}>✓ Unlocked</div>}</div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS (fetches from backend)
// ─────────────────────────────────────────────────────────────────────────────
function Analytics({userData}){
  const [data,setData]=useState(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{
    analyticsAPI.get()
      .then(d=>{
        // If API returns sessions, use them; otherwise fall back to userData
        if(d && d.sessions && d.sessions.length>0){
          setData(d);
        } else if(userData.sessions && userData.sessions.length>0){
          const sessions=userData.sessions;
          const avg=Math.round(sessions.reduce((a,s)=>a+(s.avgScore||0),0)/sessions.length);
          setData({sessions,avgScore:avg,totalSessions:sessions.length,byRole:[],skills:userData.skills||[]});
        } else {
          setData(d);
        }
      })
      .catch(()=>{
        // Fallback to local userData
        if(userData.sessions?.length){
          const sessions=userData.sessions;
          const avg=Math.round(sessions.reduce((a,s)=>a+(s.avgScore||0),0)/sessions.length);
          setData({sessions,avgScore:avg,totalSessions:sessions.length,byRole:[],skills:userData.skills||[]});
        } else setData(null);
      })
      .finally(()=>setLoading(false));
  },[userData.sessions]);
  const sessions=userData.sessions||[];
  if(loading) return <Spinner text="Loading analytics…"/>;
  if(!sessions.length) return(<div style={{display:"flex",flexDirection:"column",gap:22}}><h2 style={{fontSize:24,fontWeight:900,color:C.text,margin:0}}>Analytics</h2><Card style={{textAlign:"center",padding:60}}><div style={{fontSize:48,marginBottom:12}}>📊</div><p style={{color:C.muted}}>Complete a mock interview to see your analytics.</p></Card></div>);
  const W=600,H=130;
  const pts=sessions.map((s,i)=>({x:sessions.length===1?W/2:(i/(sessions.length-1))*W,y:H-(s.avgScore/100)*(H-20)-10,s}));
  const pathD=pts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
  const fillD=pts.length>1?pathD+` L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`:"";
  const overview=data?.overview||{};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div><h2 style={{fontSize:24,fontWeight:900,color:C.text,margin:0}}>Analytics Dashboard</h2><p style={{color:C.muted,margin:"4px 0 0",fontSize:14}}>Performance trends from your cloud database</p></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[{l:"Sessions",v:overview.totalSessions||sessions.length,c:C.accent},{l:"Avg Score",v:`${overview.avgScore||0}%`,c:C.green},{l:"Best Score",v:`${overview.bestScore||0}%`,c:C.amber},{l:"Questions",v:overview.totalQuestions||0,c:C.purple}].map(s=><Card key={s.l} style={{padding:16}}><div style={{fontSize:26,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:12,color:C.muted,marginTop:3}}>{s.l}</div></Card>)}
      </div>
      <Card>
        <h3 style={{margin:"0 0 18px",color:C.text}}>Score Trend</h3>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{display:"block"}}>
          <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity=".35"/><stop offset="100%" stopColor={C.accent} stopOpacity="0"/></linearGradient></defs>
          {pts.length>1&&<path d={fillD} fill="url(#g)"/>}
          {pts.length>1&&<path d={pathD} stroke={C.accent} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
          {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="5" fill={C.accent} stroke={C.card} strokeWidth="2"/>)}
        </svg>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>{sessions.map((s,i)=><div key={i} style={{textAlign:"center",flex:1}}><div style={{fontSize:12,fontWeight:700,color:s.avgScore>=70?C.green:s.avgScore>=40?C.amber:C.red}}>{s.avgScore}%</div><div style={{fontSize:10,color:C.muted}}>S{i+1}</div></div>)}</div>
      </Card>
      {data?.byRole?.length>0&&(
        <Card><h3 style={{margin:"0 0 14px",color:C.text}}>Performance by Role</h3>{data.byRole.map(r=><div key={r.role} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,color:C.text}}>{r.role}</span><span style={{fontSize:13,fontWeight:700,color:r.avgScore>=70?C.green:r.avgScore>=40?C.amber:C.red}}>{r.avgScore}% <span style={{color:C.muted,fontWeight:400}}>({r.sessions})</span></span></div><ProgressBar value={r.avgScore} color={r.avgScore>=70?C.green:r.avgScore>=40?C.amber:C.red} h={8}/></div>)}</Card>
      )}
      {data?.weakQuestions?.length>0&&(
        <Card><h3 style={{margin:"0 0 14px",color:C.text}}>Areas to Improve</h3>{data.weakQuestions.map((q,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<data.weakQuestions.length-1?`1px solid ${C.border}`:"none"}}><span style={{fontSize:13,color:C.muted,flex:1,marginRight:16,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{q.question}</span><Badge color={C.red}>{q.score}%</Badge></div>)}</Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
function Settings({userData,user,onUpgrade,onGoalUpdate}){
  const [dailyGoal,setDailyGoal]=useState(userData.dailyGoal||3);
  const [saved,setSaved]=useState(false); const [saving,setSaving]=useState(false);

  const save=async()=>{
    setSaving(true);
    try{ await authAPI.updateProgress({daily_goal:dailyGoal}); onGoalUpdate(dailyGoal); setSaved(true); setTimeout(()=>setSaved(false),2000); }
    catch(e){alert(e.message);}
    setSaving(false);
  };

  const plan=PLANS[userData.plan||"free"];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <div><h2 style={{fontSize:24,fontWeight:900,color:C.text,margin:0}}>Settings</h2><p style={{color:C.muted,margin:"4px 0 0",fontSize:14}}>Manage your account and preferences</p></div>
      <Card>
        <h3 style={{margin:"0 0 16px",color:C.text}}>Profile</h3>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:C.accent+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:C.accent}}>{user.name[0].toUpperCase()}</div>
          <div><div style={{fontWeight:700,color:C.text,fontSize:16}}>{user.name}</div><div style={{fontSize:13,color:C.muted}}>{user.email}</div></div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderTop:`1px solid ${C.border}`}}>
          <div><div style={{fontWeight:600,color:C.text}}>Current Plan</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{plan.name} — {plan.price===0?"Free":`$${plan.price}/month`}</div></div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}><Badge color={plan.color}>{plan.name}</Badge>{userData.plan==="free"&&<Btn sm onClick={onUpgrade}>Upgrade →</Btn>}</div>
        </div>
        <div style={{padding:"10px 14px",background:C.green+"10",border:`1px solid ${C.green}22`,borderRadius:8,fontSize:13,color:C.muted,marginTop:8}}>
          ✅ Your data is securely stored in a cloud database and syncs across all your devices.
        </div>
      </Card>
      <Card>
        <h3 style={{margin:"0 0 14px",color:C.text}}>Daily Practice Goal</h3>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{color:C.muted,fontSize:14}}>Questions per day</span><span style={{fontSize:22,fontWeight:900,color:C.accent}}>{dailyGoal}</span></div>
        <input type="range" min={1} max={10} value={dailyGoal} onChange={e=>setDailyGoal(Number(e.target.value))} style={{width:"100%",accentColor:C.accent}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginTop:4}}><span>1 — Casual</span><span>10 — Intense</span></div>
      </Card>
      <Btn onClick={save} disabled={saving}>{saved?"✓ Saved!":saving?"Saving…":"Save Settings"}</Btn>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App(){
  const [user,setUser]=useState(null);
  const [userData,setUserData]=useState(null);
  const [active,setActive]=useState("dashboard");
  const [loading,setLoading]=useState(true);
  const [showPricing,setShowPricing]=useState(false);
  const [toast,setToast]=useState(null);

  // On mount: check if we have a saved token and fetch the user
  useEffect(()=>{
    const t=token.get();
    if(!t){ setLoading(false); return; }
    Promise.all([authAPI.me(), sessionsAPI.getAll()])
      .then(([profile,sessionData])=>{
        setUser({name:profile.name,email:profile.email});
        setUserData({...profile,sessions:sessionData.sessions||[],skills:[],resumeText:"",coverage:null,coverLettersGenerated:0,jdMatchesRun:0});
        // Also fetch resume skills if they exist
        return resumeAPI.get();
      })
      .then(resume=>{
        if(resume?.exists){
          setUserData(p=>({...p,skills:resume.skills||[],recommendedRole:resume.recommendedRole||p.recommendedRole,level:resume.level||p.level}));
        }
      })
      .catch(()=>{ token.clear(); setUser(null); setUserData(null); })
      .finally(()=>setLoading(false));
  },[]);

  // Achievement toast check
  useEffect(()=>{
    if(!userData||!user) return;
    const key=`tai_ach_${user.email}`;
    const prev=LS.get(key,[]);
    const now=ACHIEVEMENTS.filter(a=>a.check(userData)).map(a=>a.id);
    const newOnes=now.filter(id=>!prev.includes(id));
    if(newOnes.length){ const a=ACHIEVEMENTS.find(x=>x.id===newOnes[0]); if(a) setToast(`Achievement unlocked: ${a.icon} ${a.title}`); LS.set(key,now); }
  },[userData]);

  const handleAuth=(profile)=>{
    setUser({name:profile.name,email:profile.email});
    setUserData({...profile,sessions:[],skills:[],resumeText:"",coverage:null,coverLettersGenerated:0,jdMatchesRun:0});
    setActive("dashboard");
  };

  const handleLogout=()=>{ token.clear(); setUser(null); setUserData(null); };

  if(loading) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}><Spinner text="Loading TalentAI…"/></div>;
  if(!user||!userData) return <AuthScreen onAuth={handleAuth}/>;
  if(!userData.onboarded) return <Onboarding user={user} onDone={(extras)=>{ setUserData(p=>({...p,...extras,onboarded:true})); setActive("dashboard"); }}/>;

  const upgrade=()=>setShowPricing(true);

  const screens={
    dashboard:    <Dashboard userData={userData} setActive={setActive} user={user} onUpgrade={upgrade}/>,
    resume:       <ResumeScreen userData={userData} onResumeAnalyzed={(res,text)=>setUserData(p=>({...p,skills:res.skills,resumeText:text,recommendedRole:res.bestRole||p.recommendedRole,level:res.level||p.level}))}/>,
    interview:    <InterviewScreen userData={userData} onSessionSaved={s=>setUserData(p=>({...p,sessions:[...p.sessions,s],interviewsThisMonth:(p.interviewsThisMonth||0)+1}))} onUpgrade={upgrade}/>,
    gaps:         <GapsScreen userData={userData} onCoverageUpdate={(cov,role)=>setUserData(p=>({...p,coverage:cov,targetRole:role}))}/>,
    jdmatch:      <JDMatcher userData={userData} onJDMatched={()=>setUserData(p=>({...p,jdMatchesRun:(p.jdMatchesRun||0)+1}))}/>,
    coach:        <CareerCoach userData={userData} onUpgrade={upgrade}/>,
    cover:        <CoverLetter userData={userData} onLetterGenerated={()=>setUserData(p=>({...p,coverLettersGenerated:(p.coverLettersGenerated||0)+1}))}/>,
    history:      <SessionHistory userData={userData} onUpgrade={upgrade}/>,
    achievements: <Achievements userData={userData}/>,
    analytics:    <Analytics userData={userData}/>,
    settings:     <Settings userData={userData} user={user} onUpgrade={upgrade} onGoalUpdate={goal=>setUserData(p=>({...p,dailyGoal:goal}))}/>,
  };

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",fontFamily:"'DM Sans','Segoe UI',sans-serif",color:C.text}}>
      <Sidebar active={active} setActive={setActive} user={user} userData={userData} onLogout={handleLogout} onUpgrade={upgrade}/>
      <main style={{marginLeft:220,flex:1,padding:"28px 32px",maxWidth:"calc(100% - 220px)",boxSizing:"border-box"}}>
        {screens[active]}
      </main>
      {showPricing&&<PricingModal onClose={()=>setShowPricing(false)} userData={userData} onPlanUpgrade={plan=>setUserData(p=>({...p,plan}))}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
    </div>
  );
}
