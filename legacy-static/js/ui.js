/* Small UI behaviours: theme toggle, founder photo lightbox. */
(function(){
  var toggle = document.querySelector('.theme-toggle');
  if(toggle) toggle.addEventListener('click', toggleTheme);   /* toggleTheme() lives in js/theme.js */

  var box = document.getElementById('founder-lightbox');
  var photo = document.querySelector('.founder-photo');
  if(box && photo){
    photo.addEventListener('click', function(){ box.classList.add('is-open'); });
    box.addEventListener('click', function(){ box.classList.remove('is-open'); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') box.classList.remove('is-open'); });
  }
})();
