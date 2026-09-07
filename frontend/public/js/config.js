// web/static/js/config.js

(function() {
  const windowConfig = window.getAroleConfig || {};
  
  window.APP_CONFIG = {
    SUPABASE_REST_URL: windowConfig.SUPABASE_REST_URL || "https://tgmhtlqcjgcjedlnthfk.supabase.co/rest/v1",
    SUPABASE_ANON_KEY: windowConfig.SUPABASE_ANON_KEY || "sb_publishable_ubfak-i16iK-jZCTpZIxTQ_9o10ZqDn"
  };
})();
