'use strict';
(function(root){
  const C=()=>root.OTTO_CONTENT_CATALOG||{};
  const isoDay=(d=new Date())=>d.toISOString().slice(0,10);
  const addDays=(n)=>{const d=new Date();d.setUTCDate(d.getUTCDate()+n);return isoDay(d);};
  function partMap(module){return C()[module]||{};}
  function allTasks(){
    const out=[];
    for(const module of ['Lesen','Hören','Schreiben','Sprechen']){
      const pm=partMap(module);
      for(const key of Object.keys(pm)){
        for(const task of pm[key]||[])out.push(task);
      }
    }
    return out;
  }
  function findTask(id){return allTasks().find(t=>t.task_id===id)||null;}
  function ensureState(state){
    if(!state.task_history)state.task_history={};
    if(!state.learningErrors)state.learningErrors=[];
    if(!state.dailySession||!Array.isArray(state.dailySession.plan))state.dailySession={started:false,date:null,plan:[],index:0,completed:[],finished:false};
    return state;
  }
  function moduleWeakness(result,module){
    let w=1;
    const p=result&&result.profiles&&result.profiles[module];
    if(!p||p.status==='NEED_CONFIRMATION')w+=3;
    for(const g of result&&result.gaps||[])if(g.module===module)w+=4;
    if((module==='Schreiben'||module==='Sprechen')&&(!p||!p.band))w+=2;
    return w;
  }
  function duration(module,minutes){const base={Schreiben:10,Lesen:8,'Hören':8,Sprechen:6}[module]||8;return minutes<=10?Math.min(base,10):base;}
  function candidateScore(state,result,task){
    const h=state.task_history[task.task_id];
    let score=moduleWeakness(result,task.module)*100;
    if(!h)score+=80;
    else{
      score-=Math.min(50,(h.attempt_count||0)*12);
      if(h.next_review&&h.next_review<=isoDay())score+=45;
      if(h.last_seen===isoDay())score-=200;
      if(h.score!=null&&h.score<0.7)score+=25;
    }
    const recent=state.dailySession&&state.dailySession.completed||[];
    if(recent.includes(task.task_id))score-=300;
    return score;
  }
  function buildPlan(state,result){
    ensureState(state);
    const minutes=Number(state.dailyMinutes)||25;
    const tasks=allTasks().slice().sort((a,b)=>candidateScore(state,result,b)-candidateScore(state,result,a));
    const max=minutes<=10?1:minutes<=25?3:5;
    const plan=[],used=new Set();let spent=0;
    const prefer=['Schreiben','Lesen','Hören','Sprechen'];
    const moduleOrder=prefer.slice().sort((a,b)=>{
      const as=tasks.filter(x=>x.module===a).reduce((m,x)=>Math.max(m,candidateScore(state,result,x)),-9999)+(a==='Schreiben'?2:0);
      const bs=tasks.filter(x=>x.module===b).reduce((m,x)=>Math.max(m,candidateScore(state,result,x)),-9999)+(b==='Schreiben'?2:0);
      return bs-as||prefer.indexOf(a)-prefer.indexOf(b);
    });
    for(const module of moduleOrder){
      const t=tasks.find(x=>x.module===module&&!used.has(x.task_id)&&candidateScore(state,result,x)>-100);
      if(!t)continue;const d=duration(module,minutes);
      if(plan.length&&spent+d>minutes+3)continue;
      plan.push({task_id:t.task_id,module:t.module,part:Number(t.teil),minutes:d});used.add(t.task_id);spent+=d;
      if(plan.length>=max)break;
    }
    for(const t of tasks){
      if(plan.length>=max||used.has(t.task_id))continue;
      const d=duration(t.module,minutes);if(plan.length&&spent+d>minutes+3)continue;
      plan.push({task_id:t.task_id,module:t.module,part:Number(t.teil),minutes:d});used.add(t.task_id);spent+=d;
    }
    state.dailySession={started:true,date:isoDay(),plan,index:0,completed:[],finished:false,started_at:new Date().toISOString()};
    return state.dailySession;
  }
  function currentSessionTask(state){
    ensureState(state);const p=state.dailySession.plan[state.dailySession.index];return p?findTask(p.task_id):null;
  }
  function recordCompletion(state,task,summary={}){
    ensureState(state);
    const old=state.task_history[task.task_id]||{};
    const score=Number.isFinite(summary.score)?summary.score:null;
    state.task_history[task.task_id]={task_id:task.task_id,module:task.module,part:Number(task.teil),completed_at:new Date().toISOString(),score,assistance_used:!!summary.assistance_used,last_seen:isoDay(),next_review:addDays(score!=null&&score<0.7?2:5),attempt_count:(old.attempt_count||0)+1};
    if(!state.dailySession.completed.includes(task.task_id))state.dailySession.completed.push(task.task_id);
    state.dailySession.index++;
    if(state.dailySession.index>=state.dailySession.plan.length){state.dailySession.finished=true;state.dailySession.finished_at=new Date().toISOString();}
    return state.dailySession;
  }
  function shouldResume(state){ensureState(state);return state.dailySession.started&&!state.dailySession.finished&&state.dailySession.plan.length>0;}
  function ottoContext(state,task){
    const l=state.lesson||{};
    return {module:task?.module||state.selectedModule||null,part:task?.teil||null,task_id:task?.task_id||null,instruction:task?.german_instruction||task?.instruction_de||null,user_answer:l.userText||null,attempted:!!l.submitted,learning_orientation:state.diagnostic?.result?.placement?.band||state.diagnostic?.result?.placement?.closerTo||null,assistance_used:!!l.assistance_used};
  }
  root.OTTO_FULL_LEARNING={version:'full-learning-runtime-v1',allTasks,findTask,ensureState,buildPlan,currentSessionTask,recordCompletion,shouldResume,ottoContext,isoDay};
})(window);
