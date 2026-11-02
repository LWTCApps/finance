/* LWTC Financial Aid Administration: shared helpers (sign-in, permissions, navigation, API calls). */
(function(){
  var A=window.ADM={me:null};
  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
  A.el=el;
  A.$=function(s,r){return (r||document).querySelector(s)};
  A.$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  A.can=function(k){return !!A.me&&A.me.permissions.indexOf(k)>-1};
  A.api=function(path,opts){
    opts=opts||{};opts.credentials='same-origin';
    if(opts.body&&typeof opts.body!=='string'){opts.body=JSON.stringify(opts.body);opts.headers=Object.assign({'Content-Type':'application/json'},opts.headers||{});opts.method=opts.method||'POST'}
    return fetch(path,opts).then(function(r){
      return r.json().catch(function(){return {}}).then(function(j){
        if(r.status===401){throw {auth:true}}
        if(!r.ok||j.ok===false){j.status=r.status;throw j}
        return j;
      });
    });
  };
  var toastT;
  A.toast=function(msg,bad){
    var t=A.$('.toast');if(t)t.remove();t=el('div','toast'+(bad?' bad':''),msg);t.setAttribute('role','status');document.body.appendChild(t);
    clearTimeout(toastT);toastT=setTimeout(function(){t.remove()},bad?7000:3500);
  };
  A.errText=function(e){
    if(!e)return 'Something went wrong.';
    if(e.auth)return 'Your sign-in expired. Reload the page to sign in again.';
    if(e.error==='forbidden')return 'You don\u2019t have permission to do that'+(e.permission?' ('+e.permission+')':'')+'.';
    if(e.error==='self_lockout')return 'That would remove your own ability to manage access. Ask another administrator to make this change.';
    if(e.error==='stale')return 'Someone published a newer version while you were editing. Reload the page and re-apply your changes.';
    if(e.error==='too_large')return 'That is too large.';
    return 'That didn\u2019t work ('+(e.error||'error')+'). Try again.';
  };
  var NAV=[['Home','../','admin'],['Forms','../forms/','forms'],['Users & access','../users/','users'],['Site content','../site/','content'],['Notifications','../notifications/','notifications'],['Activity log','../activity/','audit'],['Schedule','../../staff/schedule/','schedule'],['Staff console','../../staff/','console']];
  /** init({page, need, root}) -> Promise(me). Builds the header and navigation, and handles sign-in and permission problems. */
  A.init=function(o){
    o=o||{};var root=o.root||'../';
    return fetch('/api/admin/me',{credentials:'same-origin'}).then(function(r){return r.json().catch(function(){return {}}).then(function(j){return {r:r,j:j}})}).then(function(x){
      var main=A.$('main');
      if(x.r.status===401){main.textContent='';main.appendChild(el('div','banner bad','Your sign-in expired. Reload this page to sign in again.'));throw {auth:true}}
      if(x.r.status===403||!x.j.ok){
        main.textContent='';var h=el('h1',null,'No access');main.appendChild(h);
        main.appendChild(el('p','sub','You are signed in, but you don\u2019t have permission to use the Financial Aid administration site. If you should, ask a Financial Aid administrator to give you a role.'));
        var a=el('a','btn alt','Go to the staff console');a.href=root+'../staff/';main.appendChild(a);throw {forbidden:true};
      }
      A.me=x.j;
      var who=A.$('.who');if(who)who.textContent='Signed in as '+A.me.email+(A.me.roles&&A.me.roles.length?' \u00b7 '+A.me.roles.join(', '):'');
      var nav=A.$('nav.main');if(nav){
        nav.textContent='';
        NAV.forEach(function(n){
          var key=n[2],show=key==='admin'?true:!!A.me.menus[key];if(!show)return;
          var a=el('a',null,n[0]);a.href=root+n[1].replace(/^\.\.\//,'');if(key===o.page)a.setAttribute('aria-current','page');nav.appendChild(a);
        });
      }
      if(o.need&&!A.can(o.need)){
        main.textContent='';main.appendChild(el('h1',null,'No access to this area'));main.appendChild(el('p','sub','Your role doesn\u2019t include this part of the administration site ('+o.need+'). Ask an administrator if you need it.'));
        var b=el('a','btn alt','Back to the administration home');b.href=root;main.appendChild(b);throw {forbidden:true};
      }
      return A.me;
    });
  };
  A.dialog=function(title,body,buttons){
    var d=el('dialog');var h=el('div','dh',title),b=el('div','db'),f=el('div','df');b.appendChild(body);
    buttons.forEach(function(x){var btn=el('button','btn'+(x.alt?' alt':'')+(x.danger?' danger':''),x.label);btn.type='button';btn.addEventListener('click',function(){var r=x.onClick?x.onClick(d):undefined;if(r!==false&&!x.keep)d.close()});f.appendChild(btn)});
    d.appendChild(h);d.appendChild(b);d.appendChild(f);document.body.appendChild(d);d.addEventListener('close',function(){d.remove()});d.showModal();return d;
  };
  A.fmt=function(iso){if(!iso)return '';var d=new Date(iso);return isNaN(d)?String(iso):d.toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'})};
  A.field=function(label,ctrl,hint,id){var w=el('div','fld');var l=el('label',null,label);if(id){ctrl.id=id;l.htmlFor=id}w.appendChild(l);w.appendChild(ctrl);if(hint)w.appendChild(el('p','hint',hint));return w};
})();
