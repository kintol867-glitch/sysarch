// ============================================
// SUPABASE INTEGRATION MODULE
// ============================================

const SupabaseDB = {
  // Replace these with your Supabase credentials from supabase.com
  SUPABASE_URL: 'https://bspdslorhuuirukxrpmb.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_om35B9G_pR_hqfOfERm_dg_XOtiouE6',
  
  // Table names
  TABLE_NAME: 'students',
  
  // Sync settings
  SYNC_INTERVAL: 30000, // Sync every 30 seconds
  LAST_SYNC_KEY: 'supabase_last_sync',
  SYNC_ENABLED_KEY: 'supabase_sync_enabled',
  
  // Initialize Supabase client
  init: function() {
    if (!this.SUPABASE_URL.includes('YOUR_PROJECT') && !this.SUPABASE_ANON_KEY.includes('YOUR_ANON')) {
      this.syncEnabled = true;
      this.startAutoSync();
    } else {
      console.warn('⚠️ Supabase credentials not configured. Using localStorage only.');
      this.syncEnabled = false;
    }
  },
  
  // Fetch all students from Supabase
  fetchFromSupabase: async function() {
    if (!this.syncEnabled) return null;
    
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/${this.TABLE_NAME}?select=*`,
        {
          method: 'GET',
          headers: {
            'apikey': this.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Supabase error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching from Supabase:', error);
      return null;
    }
  },
  
  // Push a new student to Supabase
  pushToSupabase: async function(studentData) {
    if (!this.syncEnabled) return null;
    
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/${this.TABLE_NAME}`,
        {
          method: 'POST',
          headers: {
            'apikey': this.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(studentData)
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Supabase error: ${response.status}`);
      }
      
      console.log('✓ Pushed student to Supabase');
      return await response.json();
    } catch (error) {
      console.error('Error pushing to Supabase:', error);
      return null;
    }
  },
  
  // Hook into registration to push to Supabase
  hookRegistration: function() {
    const originalRegister = LocalDB.registerLocal;
    LocalDB.registerLocal = (userData) => {
      const result = originalRegister.call(LocalDB, userData);
      if (result.success && this.syncEnabled) {
        this.pushToSupabase(userData);
      }
      return result;
    };
  },
  
  // Update a student in Supabase
  updateInSupabase: async function(idNumber, updatedData) {
    if (!this.syncEnabled) return null;
    
    try {
      const response = await fetch(
        `${this.SUPABASE_URL}/rest/v1/${this.TABLE_NAME}?id_number=eq.${encodeURIComponent(idNumber)}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': this.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updatedData)
        }
      );
      
      if (!response.ok) {
        throw new Error(`Supabase error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating in Supabase:', error);
      return null;
    }
  },
  
  // Sync localStorage with Supabase
  syncToLocalStorage: async function() {
    const supabaseData = await this.fetchFromSupabase();
    
    if (supabaseData && Array.isArray(supabaseData)) {
      // Update localStorage with Supabase data
      localStorage.setItem(LocalDB.DB_NAME, JSON.stringify(supabaseData));
      localStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString());
      console.log('✓ Synced from Supabase to localStorage');
      return true;
    }
    
    return false;
  },
  
  // Start auto-sync
  startAutoSync: function() {
    // Initial sync
    this.syncToLocalStorage();
    
    // Hook into registration
    this.hookRegistration();
    
    // Periodic sync
    setInterval(() => {
      if (navigator.onLine) {
        this.syncToLocalStorage();
      }
    }, this.SYNC_INTERVAL);
    
    // Sync when online
    window.addEventListener('online', () => {
      console.log('🔄 Online! Syncing with Supabase...');
      this.syncToLocalStorage();
    });
  },
  
  // Get last sync time
  getLastSyncTime: function() {
    const lastSync = localStorage.getItem(this.LAST_SYNC_KEY);
    return lastSync ? new Date(lastSync) : null;
  }
};

// Initialize Supabase on page load
document.addEventListener('DOMContentLoaded', function() {
  SupabaseDB.init();
});
