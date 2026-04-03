const DB_NAME = 'investment_app_db';

const INITIAL_DATA = {
  users: [
    {
      id: 'admin-1',
      username: 'admin',
      password: 'admin',
      role: 'admin',
      balance: 0,
      investedAmount: 0,
      plan: null,
      rewards: [],
      withdrawals: [],
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30 // 30 days ago
    }
  ],
  plans: [
    { id: 'plan-1', name: 'Lite', price: 3000, dailyReward: 150 },
    { id: 'plan-2', name: 'Pro', price: 4000, dailyReward: 250 },
    { id: 'plan-3', name: 'Elite', price: 5000, dailyReward: 400 }
  ],
  withdrawalRequests: [],
  investmentRequests: [],
  settings: {
    themeColor: '#4facfe',
    theme: 'dark',
    referralRewardPercent: 10,
    adminWallets: {
      easypaisa: { name: 'Admin', number: '03001234567' },
      jazzcash: { name: 'Admin', number: '03101234567' }
    }
  }
};

export const getDB = () => {
  const data = localStorage.getItem(DB_NAME);
  if (!data) {
    localStorage.setItem(DB_NAME, JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }
  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch (e) {
    parsed = null;
  }

  if (!parsed || typeof parsed !== 'object') {
    localStorage.setItem(DB_NAME, JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }

  let changed = false;

  // Ensure settings exist for legacy data
  if (!parsed.settings) {
    parsed.settings = INITIAL_DATA.settings;
    changed = true;
  }
  
  // Ensure users array exists
  if (!Array.isArray(parsed.users)) {
    parsed.users = INITIAL_DATA.users;
    changed = true;
  }

  // Ensure all users have necessary fields
  parsed.users.forEach(u => {
    let userChanged = false;
    if (!u.referralCode) {
      u.referralCode = `REF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      userChanged = true;
    }
    if (u.balance === undefined || u.balance === null) { u.balance = 0; userChanged = true; }
    if (u.investedAmount === undefined || u.investedAmount === null) { u.investedAmount = 0; userChanged = true; }
    if (!Array.isArray(u.rewards)) { u.rewards = []; userChanged = true; }
    if (!Array.isArray(u.withdrawals)) { u.withdrawals = []; userChanged = true; }
    if (u.referralEarnings === undefined || u.referralEarnings === null) { u.referralEarnings = 0; userChanged = true; }
    if (u.referralCount === undefined || u.referralCount === null) { u.referralCount = 0; userChanged = true; }
    if (!u.createdAt) { u.createdAt = Date.now(); userChanged = true; }
    if (!u.id) { u.id = Date.now().toString() + Math.random(); userChanged = true; }
    
    if (userChanged) changed = true;
  });

  // Ensure new fields exist for legacy data
  if (!parsed.investmentRequests) { parsed.investmentRequests = []; changed = true; }
  if (!parsed.settings.adminWallets) { 
    parsed.settings.adminWallets = INITIAL_DATA.settings.adminWallets; 
    changed = true; 
  }

  if (changed) {
    localStorage.setItem(DB_NAME, JSON.stringify(parsed));
  }
  return parsed;
};

export const saveDB = (data) => {
  localStorage.setItem(DB_NAME, JSON.stringify(data));
};

export const getCurrentUser = () => {
  const userId = localStorage.getItem('current_user_id');
  if (!userId) return null;
  const db = getDB();
  return db.users.find(u => u.id === userId);
};

export const login = (username, password) => {
  const db = getDB();
  const user = db.users.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem('current_user_id', user.id);
    return user;
  }
  return null;
};

export const logout = () => {
  localStorage.removeItem('current_user_id');
};

export const signup = (username, password) => {
  const db = getDB();
  if (db.users.find(u => u.username === username)) return { error: 'Username already exists' };
  
  const referralCode = `REF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const newUser = {
    id: Date.now().toString(),
    username,
    password,
    role: 'user',
    balance: 0,
    investedAmount: 0,
    plan: null,
    rewards: [],
    withdrawals: [],
    referralCode,
    referredBy: null,
    referralEarnings: 0,
    referralCount: 0,
    createdAt: Date.now()
  };

  // Check if referred by someone
  const referrerCode = localStorage.getItem('signup_referral_code');
  if (referrerCode) {
    const referrer = db.users.find(u => u.referralCode === referrerCode);
    if (referrer) {
      newUser.referredBy = referrer.id;
      referrer.referralCount = (referrer.referralCount || 0) + 1;
    }
  }
  
  db.users.push(newUser);
  saveDB(db);
  localStorage.removeItem('signup_referral_code'); // Clean up after use
  return newUser;
};

export const updateUserData = (userId, updates) => {
  const db = getDB();
  const index = db.users.findIndex(u => u.id === userId);
  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...updates };
    saveDB(db);
    return db.users[index];
  }
  return null;
};

export const calculateRewards = (userId) => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  if (!user || !user.plan) return;

  const now = Date.now();
  const lastRewardTime = user.rewards.length > 0 
    ? user.rewards[user.rewards.length - 1].timestamp 
    : user.plan.startTime;

  const msInDay = 24 * 60 * 60 * 1000;
  const timeDiff = now - lastRewardTime;
  
  // For demo/simulated experience, let's treat 1 minute as "1 day" if we want real-time feel,
  // or just actual days. Let's stick to true daily but maybe add a "simulated" button.
  // Actually, user said "daily base pr", so I'll check days passed.
  const daysPassed = Math.floor(timeDiff / msInDay);
  
  if (daysPassed > 0) {
    const totalNewReward = daysPassed * user.plan.dailyReward;
    user.balance += totalNewReward;
    for (let i = 0; i < daysPassed; i++) {
      user.rewards.push({
        amount: user.plan.dailyReward,
        timestamp: lastRewardTime + msInDay * (i + 1)
      });
    }
    saveDB(db);
    return user;
  }
  return null;
};

export const getSettings = () => {
  const db = getDB();
  return db.settings;
};

export const updateSettings = (newSettings) => {
  const db = getDB();
  db.settings = { ...db.settings, ...newSettings };
  saveDB(db);
  return db.settings;
};

export const getTheme = () => {
  const db = getDB();
  return db.settings?.theme || 'dark';
};

export const setTheme = (theme) => {
  updateSettings({ theme });
};

export const rewardReferrer = (userId, investAmount) => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  if (user && user.referredBy) {
    const referrer = db.users.find(u => u.id === user.referredBy);
    if (referrer) {
      const reward = (investAmount * db.settings.referralRewardPercent) / 100;
      referrer.balance += reward;
      referrer.referralEarnings += reward;
      saveDB(db);
      return reward;
    }
  }
  return 0;
};

// --- Plan Management ---
export const addPlan = (planData) => {
  const db = getDB();
  const newPlan = {
    id: 'plan-' + Date.now(),
    ...planData
  };
  db.plans.push(newPlan);
  saveDB(db);
  return db.plans;
};

export const updatePlan = (planId, updates) => {
  const db = getDB();
  const index = db.plans.findIndex(p => p.id === planId);
  if (index !== -1) {
    db.plans[index] = { ...db.plans[index], ...updates };
    saveDB(db);
    return db.plans;
  }
  return null;
};

export const deletePlan = (planId) => {
  const db = getDB();
  db.plans = db.plans.filter(p => p.id !== planId);
  saveDB(db);
  return db.plans;
};

// --- Investment Requests ---
export const addInvestmentRequest = (userId, requestData) => {
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;

  const newRequest = {
    id: 'inv-' + Date.now(),
    userId,
    username: user.username,
    status: 'pending',
    timestamp: Date.now(),
    ...requestData
  };

  db.investmentRequests.push(newRequest);
  saveDB(db);
  return newRequest;
};

export const handleInvestmentRequest = (requestId, status) => {
  const db = getDB();
  const requestIndex = db.investmentRequests.findIndex(r => r.id === requestId);
  if (requestIndex === -1) return null;

  const request = db.investmentRequests[requestIndex];
  request.status = status;

  if (status === 'approved') {
    const userIndex = db.users.findIndex(u => u.id === request.userId);
    if (userIndex !== -1) {
      const user = db.users[userIndex];
      const plan = db.plans.find(p => p.id === request.planId);
      
      if (plan) {
        user.plan = { ...plan, startTime: Date.now() };
        user.investedAmount = (user.investedAmount || 0) + plan.price;
        
        // Reward referrer
        rewardReferrer(user.id, plan.price);
      }
    }
  }

  saveDB(db);
  return db;
};
