/* Runs in <head> before first paint: sets the theme and flags animated mode, so nothing flashes. */
try{ if(!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) document.documentElement.classList.add('js-reveal'); }catch(e){}
(function(){
  try{
    var saved = localStorage.getItem('kumaon-theme');
    var theme = saved || ((window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }catch(e){
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
function toggleTheme(){
  var html = document.documentElement;
  var next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  try{ localStorage.setItem('kumaon-theme', next); }catch(e){}
}
