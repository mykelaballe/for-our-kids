/* Runs in <head> before anything is painted, so the page never flashes the wrong theme.
   The saved choice ("light" or "dark") becomes <html data-theme>. "system" sets nothing,
   and the CSS follows the device's own setting. Toggling lives in js/core.js. */
(function(){
  try{
    var s = JSON.parse(localStorage.getItem("playtime.v2") || "{}");
    var t = s.settings && s.settings.theme;
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  }catch(e){}
})();
