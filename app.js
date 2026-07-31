const STORAGE='aidossier-systems-v1';
const ACTIVE='aidossier-active-v1';
const $=id=>document.getElementById(id);
const uid=()=>crypto.randomUUID?.()||`sys-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const today=()=>new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'long',year:'numeric'}).format(new Date());

const defaults={
  id:uid(),name:'Customer Support Copilot',owner:'Product & Operations',vendor:'OpenAI / internal integration',purpose:'Помогает сотрудникам готовить ответы клиентам и классифицировать обращения.',role:'deployer',category:'chatbot',audience:'customers',data:'personal',region:'EU',answers:{interaction:true,generated:true,deepfake:false,publicInterest:false,decisions:false,employment:false,education:false,biometric:false,emotion:false,socialScoring:false,critical:false,credit:false,medical:false,lawEnforcement:false,humanReview:true,logging:false,vendorDocs:false,training:false,incident:false,notice:false},done:{}}

const obligations={
  inventory:{title:'Зафиксировать систему в AI‑реестре',desc:'Назначить владельца, цель, поставщика, версию и дату следующего пересмотра.',priority:'now'},
  literacy:{title:'Провести AI literacy‑инструктаж',desc:'Зафиксировать, кто использует систему, какие ограничения знает и когда прошёл обучение.',priority:'now'},
  notice:{title:'Разместить уведомление о взаимодействии с ИИ',desc:'Пользователь должен понимать, что взаимодействует с автоматизированной системой, когда это применимо.',priority:'now'},
  generated:{title:'Маркировать сгенерированный или изменённый контент',desc:'Подготовить видимую формулировку и процесс машинной маркировки там, где она требуется.',priority:'soon'},
  human:{title:'Описать человеческий контроль',desc:'Кто может проверить, остановить, исправить или отменить результат системы.',priority:'soon'},
  logs:{title:'Настроить журналирование',desc:'Хранить ключевые события, версии модели, промптов и ответственных лиц в разумном объёме.',priority:'soon'},
  vendor:{title:'Собрать пакет документов поставщика',desc:'Условия использования, DPA, описание модели, ограничения, безопасность и порядок обновлений.',priority:'soon'},
  incident:{title:'Утвердить процесс инцидентов',desc:'Канал сообщения, ответственные, сроки, журнал решений и критерии остановки системы.',priority:'soon'},
  dpia:{title:'Проверить необходимость DPIA и согласовать GDPR-контроли',desc:'Особенно при персональных, чувствительных данных или систематическом профилировании.',priority:'soon'},
  risk:{title:'Провести расширенную юридическую и техническую оценку',desc:'Система попадает в чувствительную область и требует экспертной проверки классификации и обязанностей.',priority:'now'},
  prohibit:{title:'Немедленно остановить внедрение до юридической проверки',desc:'Ответы указывают на потенциально запрещённую практику или исключение, которое нельзя подтверждать автоматически.',priority:'now'},
  review:{title:'Установить квартальный пересмотр',desc:'Проверять изменение цели, поставщика, модели, данных и реального поведения системы.',priority:'keep'}
};

let systems=load();
let activeId=localStorage.getItem(ACTIVE)||systems[0]?.id;
let active=systems.find(s=>s.id===activeId)||systems[0];
let activeTab='inventory';

function load(){try{const value=JSON.parse(localStorage.getItem(STORAGE)||'[]');return Array.isArray(value)&&value.length?value:[structuredClone(defaults)]}catch{return [structuredClone(defaults)]}}
function persist(){localStorage.setItem(STORAGE,JSON.stringify(systems));localStorage.setItem(ACTIVE,active.id)}
function classify(system=active){
  const a=system.answers;
  const prohibited=a.socialScoring||(a.emotion&&(a.employment||a.education))||a.lawEnforcement;
  const high=a.employment||a.education||a.biometric||a.credit||a.critical||a.medical;
  const transparency=a.interaction||a.generated||a.deepfake||a.publicInterest||a.emotion;
  if(prohibited)return {key:'prohibited',label:'Potentially prohibited',score:95};
  if(high)return {key:'high',label:'Potential high-risk',score:76};
  if(transparency)return {key:'transparency',label:'Transparency duties',score:48};
  return {key:'minimal',label:'Minimal / limited scope',score:20};
}
function tasks(system=active){
  const a=system.answers;const out=['inventory','literacy','review'];
  if(a.interaction)out.push('notice');
  if(a.generated||a.deepfake||a.publicInterest)out.push('generated');
  if(a.decisions||a.employment||a.education||a.credit||a.medical||a.biometric)out.push('human');
  if(!a.logging)out.push('logs');
  if(!a.vendorDocs)out.push('vendor');
  if(!a.incident)out.push('incident');
  if(system.data!=='none')out.push('dpia');
  const c=classify(system);if(c.key==='high')out.push('risk');if(c.key==='prohibited')out.push('prohibit');
  return [...new Set(out)];
}
function readiness(system=active){const list=tasks(system);const done=list.filter(k=>system.done?.[k]).length;return list.length?Math.round(done/list.length*100):100}
function update(field,value){active[field]=value;saveAndRender()}
function saveAndRender(){systems=systems.map(s=>s.id===active.id?active:s);persist();renderAll()}
function setAnswer(key,value){active.answers[key]=value;saveAndRender()}
function setDone(key,value){active.done[key]=value;saveAndRender()}

function renderAll(){renderSidebar();renderOverview();renderInventory();renderAssessment();renderChecklist();renderDocuments();renderNotices();renderTabs()}
function renderSidebar(){
  const list=$('systemList');list.innerHTML='';
  systems.forEach(s=>{const div=document.createElement('div');div.className=`system-card ${s.id===active.id?'active':''}`;div.innerHTML=`<h3>${esc(s.name||'Без названия')}</h3><div class="meta"><span>${esc(s.owner||'Нет владельца')}</span><span>${readiness(s)}%</span></div>`;div.onclick=()=>{active=s;activeId=s.id;persist();renderAll()};list.append(div)});
  $('emptySystems').style.display=systems.length?'none':'block';
}
function renderOverview(){
  const c=classify();const list=tasks();const done=list.filter(k=>active.done?.[k]).length;
  $('activeName').textContent=active.name||'Без названия';$('activePurpose').textContent=active.purpose||'Описание не заполнено';
  $('riskBadge').className=`risk-badge risk-${c.key}`;$('riskBadge').textContent=c.label;
  $('readinessValue').textContent=`${readiness()}%`;$('readinessBar').style.width=`${readiness()}%`;
  $('tasksValue').textContent=`${list.length-done}`;$('systemsValue').textContent=systems.length;
  $('riskValue').textContent=c.score;
}
function renderInventory(){
  const fields=['name','owner','vendor','purpose','role','category','audience','data','region'];
  fields.forEach(id=>{const el=$(id);if(el)el.value=active[id]??''});
}
const questions=[
  ['interaction','Люди напрямую взаимодействуют с системой или её интерфейсом?'],
  ['generated','Система генерирует или существенно изменяет текст, изображения, аудио или видео?'],
  ['deepfake','Система создаёт реалистичный синтетический контент или deepfake?'],
  ['publicInterest','Контент публикуется по вопросам общественного интереса без редакционного контроля?'],
  ['decisions','Результат влияет на решения, права, доступ или условия для человека?'],
  ['employment','Система используется в найме, оценке, управлении или увольнении работников?'],
  ['education','Система используется для допуска, оценки или распределения в образовании?'],
  ['biometric','Есть удалённая биометрическая идентификация или категоризация?'],
  ['emotion','Есть распознавание эмоций или намерений?'],
  ['socialScoring','Есть социальная оценка людей по поведению или характеристикам?'],
  ['credit','Система оценивает кредитоспособность или доступ к существенным услугам?'],
  ['critical','Система является компонентом критической инфраструктуры?'],
  ['medical','Система влияет на диагностику, лечение или медицинское устройство?'],
  ['lawEnforcement','Система используется правоохранительными органами для чувствительных решений?'],
  ['humanReview','Человек проверяет существенные решения до их применения?'],
  ['logging','Ведутся журналы версий, ключевых действий и инцидентов?'],
  ['vendorDocs','Собраны документы и ограничения поставщика модели/сервиса?'],
  ['training','Пользователи прошли документированное обучение по безопасному применению ИИ?'],
  ['incident','Есть процесс остановки и расследования AI-инцидентов?'],
  ['notice','Уже размещены необходимые уведомления пользователям?']
];
function renderAssessment(){const box=$('questionList');box.innerHTML='';questions.forEach(([key,text])=>{const row=document.createElement('div');row.className='question';row.innerHTML=`<span>${text}</span><div class="segmented"><button data-value="true">Да</button><button data-value="false">Нет</button></div>`;row.querySelectorAll('button').forEach(btn=>{const val=btn.dataset.value==='true';btn.classList.toggle('active',active.answers[key]===val);btn.onclick=()=>setAnswer(key,val)});box.append(row)})}
function renderChecklist(){const box=$('checklist');box.innerHTML='';tasks().forEach(key=>{const item=obligations[key];const row=document.createElement('label');row.className='check-item';row.innerHTML=`<input type="checkbox" ${active.done?.[key]?'checked':''}><div><h3>${item.title}</h3><p>${item.desc}</p></div><span class="priority ${item.priority}">${item.priority==='now'?'Сейчас':item.priority==='soon'?'Далее':'Поддерживать'}</span>`;row.querySelector('input').onchange=e=>setDone(key,e.target.checked);box.append(row)})}
function policyText(){const c=classify();return `
    <div class="doc-meta"><span>AIDossier</span><span>${today()}</span></div>
    <h1>Внутренняя политика использования ИИ</h1>
    <p><strong>Организация / система:</strong> ${esc(active.name)}. <strong>Владелец:</strong> ${esc(active.owner)}.</p>
    <h2>1. Назначение</h2><p>${esc(active.purpose)}</p>
    <h2>2. Область применения</h2><p>Политика применяется к сотрудникам и подрядчикам, которые используют ${esc(active.vendor)} в рамках указанной цели. Предварительная категория: ${c.label}. Категория требует подтверждения компетентным специалистом.</p>
    <h2>3. Разрешённое использование</h2><ul><li>Использовать систему только для утверждённой цели.</li><li>Проверять существенные результаты до принятия решений.</li><li>Не вводить данные сверх необходимого минимума.</li><li>Сообщать об ошибках, дискриминационных результатах и инцидентах.</li></ul>
    <h2>4. Запрещённое использование</h2><ul><li>Обход человеческого контроля.</li><li>Применение для новой чувствительной цели без повторной оценки.</li><li>Загрузка секретов, специальных категорий данных или чужих материалов без разрешения.</li><li>Сокрытие факта взаимодействия с ИИ, когда требуется прозрачность.</li></ul>
    <h2>5. Контроль и пересмотр</h2><p>Владелец системы проводит пересмотр не реже одного раза в квартал и при смене модели, поставщика, цели, категории данных или логики принятия решений.</p>
    <p><em>Шаблон предназначен для внутренней подготовки и не заменяет юридическое заключение.</em></p>`}
function renderDocuments(){$('policyDocument').innerHTML=policyText()}
function noticeTexts(){return {
  chat:`Вы взаимодействуете с системой искусственного интеллекта. Ответы могут содержать ошибки. Для вопросов, влияющих на ваши права или существенные интересы, запросите проверку сотрудником.`,
  content:`Этот материал был создан или существенно изменён с использованием системы искусственного интеллекта и проверен ответственным редактором.`,
  internal:`Система использует ИИ для поддержки работы сотрудников. Итоговые решения принимает уполномоченный человек. Не вводите конфиденциальные или чувствительные данные без разрешения.`
}}
function renderNotices(){const texts=noticeTexts();$('chatNotice').textContent=texts.chat;$('contentNotice').textContent=texts.content;$('internalNotice').textContent=texts.internal}
function renderTabs(){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id===`tab-${activeTab}`))}
function esc(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toast(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove('show'),2200)}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('Скопировано')}catch{toast('Копирование недоступно')}}
function download(name,type,data){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

$('newSystem').onclick=()=>{const s=structuredClone(defaults);s.id=uid();s.name='Новая AI-система';s.owner='';s.vendor='';s.purpose='';s.done={};systems.push(s);active=s;saveAndRender();toast('Система добавлена')};
$('deleteSystem').onclick=()=>{if(systems.length===1){toast('Нельзя удалить единственную систему');return}if(!confirm('Удалить выбранную систему?'))return;systems=systems.filter(s=>s.id!==active.id);active=systems[0];persist();renderAll()};
['name','owner','vendor','purpose','role','category','audience','data','region'].forEach(id=>$(id).addEventListener('input',e=>update(id,e.target.value)));
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{activeTab=b.dataset.tab;renderTabs()});
$('printPolicy').onclick=()=>{activeTab='policy';renderTabs();setTimeout(()=>window.print(),80)};
$('exportJson').onclick=()=>download('aidossier-register.json','application/json',JSON.stringify(systems,null,2));
$('exportCsv').onclick=()=>{const rows=[['System','Owner','Vendor','Role','Risk','Readiness','Purpose'],...systems.map(s=>[s.name,s.owner,s.vendor,s.role,classify(s).label,`${readiness(s)}%`,s.purpose])];download('aidossier-register.csv','text/csv;charset=utf-8','\uFEFF'+rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n'))};
$('copyPolicy').onclick=()=>copy($('policyDocument').innerText);
$('copyChat').onclick=()=>copy(noticeTexts().chat);$('copyContent').onclick=()=>copy(noticeTexts().content);$('copyInternal').onclick=()=>copy(noticeTexts().internal);
$('shareSystem').onclick=async()=>{const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(active)))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');const url=`${location.origin}${location.pathname}#s=${encoded}`;await copy(url)};

(function importShared(){if(!location.hash.startsWith('#s='))return;try{const raw=location.hash.slice(3).replaceAll('-','+').replaceAll('_','/');const padded=raw+'='.repeat((4-raw.length%4)%4);const obj=JSON.parse(decodeURIComponent(escape(atob(padded))));obj.id=uid();systems.push(obj);active=obj;history.replaceState(null,'',location.pathname);persist();toast('Карточка импортирована')}catch{}})();
renderAll();
