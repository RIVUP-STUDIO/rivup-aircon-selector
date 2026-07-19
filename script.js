const capacityTable = [
  { tatami: 6, kw: 2.2 },
  { tatami: 8, kw: 2.5 },
  { tatami: 10, kw: 2.8 },
  { tatami: 12, kw: 3.6 },
  { tatami: 14, kw: 4.0 },
  { tatami: 18, kw: 5.6 },
  { tatami: 20, kw: 6.3 },
  { tatami: 23, kw: 7.1 },
  { tatami: 26, kw: 8.0 },
  { tatami: 29, kw: 9.0 }
];

const questions = [
  {
    key:"size", title:"お部屋の広さは？", help:"LDKの場合はキッチンを含む広さを選んでください。",
    options:[6,8,10,12,14,16,18,20,23,26].map(v=>({label:`${v}畳`, value:v}))
  },
  {
    key:"structure", title:"建物の構造は？", help:"わからない場合は「木造」を選ぶと安全側の判定になります。",
    options:[
      {label:"木造", sub:"戸建て・木造アパートなど", value:"wood", factor:1.12},
      {label:"軽量鉄骨", sub:"ハウスメーカー住宅など", value:"steel", factor:1.06},
      {label:"鉄筋コンクリート", sub:"RCマンションなど", value:"rc", factor:0.98}
    ]
  },
  {
    key:"insulation", title:"建物の断熱性能は？", help:"窓が複層ガラスか、築年数などを参考に選んでください。",
    options:[
      {label:"高断熱", sub:"新しい高性能住宅・複層窓", value:"high", factor:0.88},
      {label:"標準", sub:"一般的な住宅", value:"normal", factor:1},
      {label:"断熱が弱い", sub:"築古・単板ガラス・隙間風あり", value:"low", factor:1.16},
      {label:"わからない", value:"unknown", factor:1.06}
    ]
  },
  {
    key:"floor", title:"お部屋の位置は？", help:"屋根からの熱を受ける最上階は負荷が増えやすくなります。",
    options:[
      {label:"1階", value:"first", factor:1},
      {label:"中間階", value:"middle", factor:0.97},
      {label:"最上階・2階建ての2階", value:"top", factor:1.10}
    ]
  },
  {
    key:"sun", title:"日当たり・方角は？", help:"西日は夕方の冷房負荷を大きくしやすい条件です。",
    options:[
      {label:"北向き・日当たり弱め", value:"north", factor:0.96},
      {label:"東向き", value:"east", factor:1},
      {label:"南向き", value:"south", factor:1.05},
      {label:"西向き・西日が強い", value:"west", factor:1.12}
    ]
  },
  {
    key:"window", title:"窓の大きさは？", help:"掃き出し窓や窓の枚数が多い場合は「大きい」を選びます。",
    options:[
      {label:"小さい・少ない", value:"small", factor:0.96},
      {label:"普通", value:"normal", factor:1},
      {label:"大きい・多い", value:"large", factor:1.12}
    ]
  },
  {
    key:"usage", title:"お部屋の使い方は？", help:"キッチンや人・家電の発熱も能力選定に影響します。",
    options:[
      {label:"寝室・子供部屋", value:"bedroom", factor:0.98},
      {label:"リビング", value:"living", factor:1.05},
      {label:"LDK・キッチン一体", value:"ldk", factor:1.15},
      {label:"書斎・事務所", value:"office", factor:1.08}
    ]
  },
  {
    key:"special", title:"当てはまる条件は？", help:"最も影響が大きいものを1つ選んでください。",
    options:[
      {label:"特になし", value:"none", factor:1},
      {label:"吹き抜けがある", value:"atrium", factor:1.25},
      {label:"リビング階段がある", value:"stairs", factor:1.12},
      {label:"暖房をかなり重視する", value:"heating", factor:1.12},
      {label:"人やパソコンが多い", value:"heat", factor:1.12}
    ]
  }
];

let step = 0;
let answers = {};

const $ = id => document.getElementById(id);
const startScreen = $("startScreen");
const quizScreen = $("quizScreen");
const resultScreen = $("resultScreen");

$("startBtn").addEventListener("click",()=>{
  startScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");
  renderQuestion();
});

$("backBtn").addEventListener("click",()=>{
  if(step===0){
    quizScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
    return;
  }
  step--;
  renderQuestion();
});

$("restartBtn").addEventListener("click",()=>{
  answers={}; step=0;
  resultScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");
  renderQuestion();
  window.scrollTo({top:0,behavior:"smooth"});
});

function renderQuestion(){
  const q=questions[step];
  $("stepText").textContent=`${step+1} / ${questions.length}`;
  $("progressBar").style.width=`${((step+1)/questions.length)*100}%`;
  $("questionArea").innerHTML=`
    <div class="question">
      <h2>${q.title}</h2>
      <p class="help">${q.help}</p>
      <div class="options">
        ${q.options.map((o,i)=>`
          <button class="option ${answers[q.key]?.value===o.value?'selected':''}" data-index="${i}">
            <span>${o.label}${o.sub?`<small>${o.sub}</small>`:""}</span><span class="arrow">›</span>
          </button>`).join("")}
      </div>
    </div>`;
  document.querySelectorAll(".option").forEach(btn=>{
    btn.addEventListener("click",()=>{
      answers[q.key]=q.options[Number(btn.dataset.index)];
      if(step<questions.length-1){
        step++; renderQuestion();
      }else{
        showResult();
      }
    });
  });
}

function baseCapacityForTatami(tatami){
  const item=capacityTable.find(x=>tatami<=x.tatami) || capacityTable.at(-1);
  return item;
}
function selectCapacity(targetKw){
  return capacityTable.find(x=>x.kw>=targetKw) || capacityTable.at(-1);
}
function factorOf(key){
  return answers[key]?.factor || 1;
}

function showResult(){
  const base=baseCapacityForTatami(answers.size.value);
  const factors=["structure","insulation","floor","sun","window","usage","special"];
  const combined=factors.reduce((p,k)=>p*factorOf(k),1);
  const adjusted=base.kw*combined;
  const selected=selectCapacity(adjusted);
  const idx=capacityTable.findIndex(x=>x.kw===selected.kw);
  const lower=capacityTable[Math.max(0,idx-1)];
  const upper=capacityTable[Math.min(capacityTable.length-1,idx+1)];

  const reasons=[];
  const reasonMap={
    wood:"木造のため、鉄筋住宅より熱が出入りしやすい前提で補正しました。",
    steel:"軽量鉄骨住宅として、標準より少し余裕を持たせました。",
    rc:"鉄筋コンクリートの中間的な気密性を考慮しました。",
    high:"高断熱住宅として、必要能力を少し抑えて判定しました。",
    low:"断熱が弱い条件のため、能力に余裕を持たせました。",
    unknown:"断熱性能が不明なため、安全側に少し補正しました。",
    top:"最上階は屋根からの熱を受けやすいため補正しました。",
    west:"西日による夕方の冷房負荷を考慮しました。",
    south:"南向きの日射を考慮しました。",
    large:"大きな窓・多い窓からの熱の出入りを考慮しました。",
    ldk:"キッチンの熱源を含むLDKとして補正しました。",
    living:"在室人数が増えやすいリビングとして補正しました。",
    office:"パソコンなどの発熱を考慮しました。",
    atrium:"吹き抜けによる空調容積の増加を大きめに補正しました。",
    stairs:"リビング階段からの空気移動を考慮しました。",
    heating:"暖房重視のため、能力に余裕を持たせました。",
    heat:"人や機器からの発熱を考慮しました。"
  };
  Object.values(answers).forEach(a=>{ if(reasonMap[a.value]) reasons.push(reasonMap[a.value]); });
  if(!reasons.length) reasons.push("標準的な室内条件として判定しました。");
  reasons.unshift(`${answers.size.value}畳を基準に、${base.kw.toFixed(1)}kWクラスから計算しました。`);

  let confidence="中";
  const uncertain=answers.insulation.value==="unknown";
  const special=["atrium","stairs"].includes(answers.special.value);
  if(!uncertain && !special && combined>=0.92 && combined<=1.22) confidence="高";
  if(uncertain || special || selected.kw>=7.1) confidence="低";

  let caution="診断結果は簡易的な目安です。配管条件、室外機置場、専用回路、電圧、天井高を現地で確認してください。";
  if(special) caution="吹き抜け・リビング階段は間取りによる差が大きいため、熱負荷の現地確認が必要です。";
  if(selected.kw>=5.6) caution+=" 5.6kW以上は200V機種が中心になるため、分電盤と専用回路の確認が重要です。";

  $("resultKw").textContent=selected.kw.toFixed(1);
  $("resultClass").textContent=`主に${selected.tatami}畳用がおすすめ`;
  $("resultSummary").textContent=`お部屋の条件を補正した結果、${selected.kw.toFixed(1)}kWクラスが安全側の目安です。機種や暖房性能によっては前後のクラスも比較してください。`;
  $("confidenceText").textContent=confidence;
  $("reasonList").innerHTML=reasons.map(r=>`<li>${r}</li>`).join("");
  $("baseKw").textContent=`${base.kw.toFixed(1)} kW`;
  $("adjustedKw").textContent=`約${adjusted.toFixed(2)} kW`;
  $("rangeKw").textContent=`${lower.kw.toFixed(1)}〜${upper.kw.toFixed(1)} kW`;
  $("powerGuide").textContent=selected.kw>=4.0 ? "200Vの可能性あり" : "100Vが中心";
  $("cautionText").textContent=caution;

  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});

  const copyText = buildCopyText(selected, adjusted, confidence);
  $("copyBtn").onclick=async()=>{
    try{
      await navigator.clipboard.writeText(copyText);
      $("copyBtn").textContent="コピーしました ✓";
      setTimeout(()=>$("copyBtn").textContent="診断内容をコピー",1800);
    }catch{
      alert(copyText);
    }
  };
  $("lineBtn").href = "https://line.me/R/ti/p/@666fndgb";
  

}

function buildCopyText(selected, adjusted, confidence){
  const labels = {};
  questions.forEach(q=>labels[q.key]=answers[q.key]?.label || "");
  return `【RIVUP エアコン簡易診断】
推奨：${selected.kw.toFixed(1)}kWクラス（主に${selected.tatami}畳用）
補正後目安：約${adjusted.toFixed(2)}kW
確信度：${confidence}

部屋：${labels.size}
構造：${labels.structure}
断熱：${labels.insulation}
位置：${labels.floor}
方角：${labels.sun}
窓：${labels.window}
用途：${labels.usage}
追加条件：${labels.special}

この条件で設置相談を希望します。`;
}
