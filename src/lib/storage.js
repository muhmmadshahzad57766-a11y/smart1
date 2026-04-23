import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getCurrentUser = async () => {
  const userId = localStorage.getItem('current_user_id');
  if (!userId) return null;
  const { data: stData } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (!stData) return null;

  const { data: request } = await supabase.from('investment_requests').select('id').eq('user_id', userId).eq('status', 'pending').limit(1).maybeSingle();
  const settings = await getSettings();
  const dailyProfitPercent = settings.dailyProfitPercent || 2;

  return {
    ...stData,
    investedAmount: stData.invested_amount || 0,
    referralCode: stData.referral_code,
    referredBy: stData.referred_by,
    referralEarnings: stData.referral_earnings,
    referralCount: stData.referral_count,
    planId: stData.current_plan_id,
    planStartTime: stData.plan_start_time,
    balance: stData.balance || 0,
    dailyReward: (stData.invested_amount || 0) * (dailyProfitPercent / 100),
    hasPendingInvestment: !!request
  };
};

export const uploadScreenshot = async (file) => {
  if (!file) return null;
  const fileName = `${Date.now()}-${file.name}`;
  try {
    const { data, error } = await supabase.storage.from('screenshots').upload(fileName, file);
    if (error) {
      console.error("Supabase Storage Error:", error);
      alert("Upload Error: " + error.message + ". Make sure you created a bucket named 'screenshots' and set it to Public!");
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from('screenshots').getPublicUrl(fileName);
    return publicUrl;
  } catch (err) {
    console.error("Upload Catch:", err);
    return null;
  }
};

export const login = async (username, password) => {
  const { data, error } = await supabase.from('users').select('*').eq('username', username).eq('password', password).maybeSingle();
  if (error || !data) return null;
  localStorage.setItem('current_user_id', data.id);

  const { data: request } = await supabase.from('investment_requests').select('id').eq('user_id', data.id).eq('status', 'pending').limit(1).maybeSingle();
  const settings = await getSettings();
  const dailyProfitPercent = settings.dailyProfitPercent || 2;

  return {
    ...data,
    investedAmount: data.invested_amount || 0,
    referralCode: data.referral_code,
    referredBy: data.referred_by,
    referralEarnings: data.referral_earnings,
    referralCount: data.referral_count,
    planId: data.current_plan_id,
    planStartTime: data.plan_start_time,
    dailyReward: (data.invested_amount || 0) * (dailyProfitPercent / 100),
    hasPendingInvestment: !!request
  };
};

export const logout = () => {
  localStorage.removeItem('current_user_id');
};

export const signup = async (username, password) => {
  const { data: existing } = await supabase.from('users').select('id').eq('username', username).single();
  if (existing) return { error: 'Username already exists' };

  const referralCode = `REF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  let referredBy = null;
  const referrerCode = localStorage.getItem('signup_referral_code');
  if (referrerCode) {
    const { data: referrer } = await supabase.from('users').select('id, referral_count').eq('referral_code', referrerCode).single();
    if (referrer) {
      referredBy = referrer.id;
      await supabase.from('users').update({ referral_count: referrer.referral_count + 1 }).eq('id', referrer.id);
    }
  }

  const { data: newUser, error } = await supabase.from('users').insert([{
    username,
    password,
    role: 'user',
    referral_code: referralCode,
    referred_by: referredBy,
    plan_start_time: new Date().toISOString()
  }]).select().single();

  localStorage.removeItem('signup_referral_code');
  if (error) return { error: error.message };

  localStorage.setItem('current_user_id', newUser.id);

  return {
    ...newUser,
    investedAmount: newUser.invested_amount,
    referralCode: newUser.referral_code,
    referredBy: newUser.referred_by,
    referralEarnings: newUser.referral_earnings,
    referralCount: newUser.referral_count,
    planId: newUser.current_plan_id,
    planStartTime: newUser.plan_start_time,
    hasPendingInvestment: false
  };
};

export const updateUserData = async (userId, updates) => {
  const payload = { ...updates };
  // Translate camel to snake if needed
  if (updates.investedAmount !== undefined) { payload.invested_amount = updates.investedAmount; delete payload.investedAmount; }
  if (updates.referralEarnings !== undefined) { payload.referral_earnings = updates.referralEarnings; delete payload.referralEarnings; }

  const { data } = await supabase.from('users').update(payload).eq('id', userId).select().single();
  if (!data) return null;
  return {
    ...data,
    investedAmount: data.invested_amount,
    referralCode: data.referral_code,
    referredBy: data.referred_by,
    referralEarnings: data.referral_earnings,
    referralCount: data.referral_count,
    planId: data.current_plan_id,
    planStartTime: data.plan_start_time
  };
};

export const deleteUser = async (userId) => {
  await supabase.from('users').delete().eq('id', userId);
};

// Getting Settings
export const getSettings = async () => {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
  const defaults = {
    themeColor: '#4facfe',
    theme: 'dark',
    referralRewardPercent: 10,
    minWithdrawal: 500,
    siteName: 'InvestSmart',
    dailyProfitPercent: 2,
    aboutMessage: "Welcome to our investment portal. We provide secure and profitable investment opportunities.",
    adminWallets: []
  };

  if (error || !data) return defaults;

  let adminWallets = data.admin_wallets || [];
  let dailyProfitPercent = defaults.dailyProfitPercent;
  let aboutMessage = defaults.aboutMessage;

  // Handle hybrid storage in admin_wallets column
  if (adminWallets && !Array.isArray(adminWallets) && typeof adminWallets === 'object') {
    dailyProfitPercent = adminWallets.dailyProfitPercent || dailyProfitPercent;
    aboutMessage = adminWallets.aboutMessage || aboutMessage;
    adminWallets = adminWallets.wallets || [];
  }

  return {
    ...defaults,
    themeColor: data.theme_color || defaults.themeColor,
    theme: data.theme || defaults.theme,
    referralRewardPercent: data.referral_reward_percent || defaults.referralRewardPercent,
    minWithdrawal: data.min_withdrawal || defaults.minWithdrawal,
    siteName: data.site_name || defaults.siteName,
    dailyProfitPercent,
    aboutMessage,
    adminWallets: Array.isArray(adminWallets) ? adminWallets : []
  };
};

// Updating Settings
export const updateSettings = async (s) => {
  const walletsData = {
    wallets: s.adminWallets,
    dailyProfitPercent: s.dailyProfitPercent,
    aboutMessage: s.aboutMessage
  };

  const { data } = await supabase.from('settings').upsert({
    id: 1,
    theme_color: s.themeColor,
    theme: s.theme,
    referral_reward_percent: s.referralRewardPercent,
    min_withdrawal: s.minWithdrawal,
    site_name: s.siteName,
    admin_wallets: walletsData
  }).select().maybeSingle();

  return data;
};

export const getTheme = () => {
  return localStorage.getItem('app_theme') || 'dark';
};

export const setTheme = (theme) => {
  localStorage.setItem('app_theme', theme);
};

// We will implement calculateRewards, plans, and withdrawals to just fetch from the database directly.

export const fetchPlans = async () => {
  const { data } = await supabase.from('plans').select('*');
  return data?.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    dailyReward: p.daily_reward,
    createdAt: p.created_at
  })) || [];
};

export const addPlan = async (planData) => {
  const { data } = await supabase.from('plans').insert([{
    name: planData.name,
    price: planData.price,
    daily_reward: planData.dailyReward
  }]).select('*');
  // Return all plans like the old mock did
  return await fetchPlans();
};

export const deletePlan = async (planId) => {
  await supabase.from('plans').delete().eq('id', planId);
  return await fetchPlans();
};

export const updatePlan = async (id, updates) => {
  const payload = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.price !== undefined) payload.price = updates.price;
  if (updates.dailyReward !== undefined) payload.daily_reward = updates.dailyReward;

  const { data } = await supabase.from('plans').update(payload).eq('id', id).select().single();
  return data;
};

export const addInvestmentRequest = async (userId, requestData) => {
  const { data, error } = await supabase.from('investment_requests').insert([{
    user_id: userId,
    plan_id: requestData.planId,
    plan_name: requestData.planName,
    transaction_id: requestData.transactionId,
    method: requestData.method,
    sender_account_name: requestData.senderAccountName,
    sender_account_no: requestData.senderAccountNo,
    amount_sent: requestData.amountSent,
    screenshot: requestData.screenshot,
    status: 'pending'
  }]).select().single();

  if (error) {
    console.error("Insert Error:", error);
    alert("Database Error: " + error.message);
    return { error: error.message };
  }
  return data;
};

export const fetchInvestmentRequests = async () => {
  const { data } = await supabase.from('investment_requests').select(`*, users(username)`);
  return data?.map(r => ({
    id: r.id,
    userId: r.user_id,
    username: r.users?.username,
    planId: r.plan_id,
    planName: r.plan_name, // This might need to be stored in DB if not joining plans
    transactionId: r.transaction_id,
    method: r.method,
    senderAccountName: r.sender_account_name,
    senderAccountNo: r.sender_account_no,
    amountSent: r.amount_sent,
    screenshot: r.screenshot,
    status: r.status,
    timestamp: new Date(r.created_at).getTime()
  })) || [];
};

export const handleInvestmentRequest = async (requestId, status) => {
  const { data: request } = await supabase.from('investment_requests').update({ status }).eq('id', requestId).select().maybeSingle();

  if (status === 'approved' && request) {
    // Before approving a new investment, calculate rewards for the old one to avoid loss
    await calculateRewards(request.user_id);

    const { data: user } = await supabase.from('users').select('*').eq('id', request.user_id).maybeSingle();
    if (!user) return {};

    const settings = await getSettings();
    const amount = Number(request.amount_sent || 0);
    let investedAm = amount + (user.invested_amount || 0);

    // Reward calculation based on global percentage since there's no fixed plan
    const dailyPercent = Number(settings.dailyProfitPercent || 2);
    const firstApproveReward = (amount * dailyPercent) / 100;

    // Referral logic
    if (user.referred_by) {
      const rewardObj = (amount * (settings?.referralRewardPercent || 10)) / 100;
      const { data: referrer } = await supabase.from('users').select('*').eq('id', user.referred_by).maybeSingle();
      if (referrer) {
        await supabase.from('users').update({
          balance: Number(referrer.balance || 0) + rewardObj,
          referral_earnings: Number(referrer.referral_earnings || 0) + rewardObj
        }).eq('id', referrer.id);
      }
    }

    await supabase.from('users').update({
      plan_start_time: new Date().toISOString(),
      invested_amount: investedAm,
      balance: Number(user.balance || 0) + firstApproveReward
    }).eq('id', request.user_id);

    await supabase.from('rewards').insert([{
      user_id: request.user_id,
      amount: firstApproveReward,
      timestamp: new Date().toISOString()
    }]);
  }
  return {};
};

export const submitWithdrawal = async (userId, amount, method, accountNumber, accountTitle, accountName) => {
  const { data: user } = await supabase.from('users').select('balance, invested_amount').eq('id', userId).single();
  const balance = Number(user.balance || 0);
  const investedAmount = Number(user.invested_amount || 0);
  const total = balance + investedAmount;

  if (amount > total) throw new Error("Insufficient funds");

  const newBalance = Math.max(0, balance - amount);
  const remainingToDeduct = Math.max(0, amount - balance);
  const newInvestedAmount = Math.max(0, investedAmount - remainingToDeduct);

  const accountDetails = `${accountNumber} | Title: ${accountTitle} | Name: ${accountName}`;

  const { data } = await supabase.from('withdrawals').insert([{
    user_id: userId,
    amount,
    method,
    account_details: accountDetails,
    status: 'pending'
  }]).select().single();

  await supabase.from('users').update({
    balance: newBalance,
    invested_amount: newInvestedAmount
  }).eq('id', userId);

  return data;
};

export const fetchWithdrawals = async () => {
  const { data } = await supabase.from('withdrawals').select(`*, users(username)`);
  return data?.map(w => ({
    id: w.id,
    userId: w.user_id,
    username: w.users?.username,
    amount: w.amount,
    method: w.method,
    accountDetails: w.account_details,
    status: w.status,
    timestamp: new Date(w.created_at).getTime()
  })) || [];
};

export const fetchUserWithdrawals = async (userId) => {
  const { data } = await supabase.from('withdrawals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return data?.map(w => ({
    id: w.id,
    amount: w.amount,
    method: w.method,
    accountDetails: w.account_details,
    status: w.status,
    timestamp: new Date(w.created_at).getTime()
  })) || [];
};

export const handleWithdrawal = async (withdrawId, status) => {
  const { data: w } = await supabase.from('withdrawals').update({ status }).eq('id', withdrawId).select().single();
  if (status === 'rejected' && w) {
    // Refund
    const { data: user } = await supabase.from('users').select('balance').eq('id', w.user_id).single();
    await supabase.from('users').update({ balance: Number(user.balance || 0) + w.amount }).eq('id', w.user_id);
  }
};

export const calculateRewards = async (userId) => {
  // Check user
  const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
  if (!user) return null;

  // Percentage based reward calculation
  const settings = await getSettings();
  const dailyProfitPercent = settings.dailyProfitPercent || 2;

  const investedAmount = Number(user.invested_amount || 0);
  if (investedAmount <= 0) return null;

  const totalDailyReward = investedAmount * (dailyProfitPercent / 100);

  // Retrieve last reward timestamp. If none, use plan_start_time
  const { data: lastReward } = await supabase.from('rewards')
    .select('timestamp')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  const planStartTimeRaw = user.plan_start_time;
  if (!planStartTimeRaw || planStartTimeRaw.startsWith('1970')) return null;

  const lastRewardTime = lastReward ? new Date(lastReward.timestamp).getTime() : new Date(planStartTimeRaw).getTime();
  const now = Date.now();
  const msInDay = 24 * 60 * 60 * 1000;

  // Safety check for NaN or invalid dates
  if (isNaN(lastRewardTime)) return null;

  const daysPassed = Math.floor((now - lastRewardTime) / msInDay);
  if (daysPassed > 0) {
    const totalNewReward = daysPassed * totalDailyReward;

    // Add rewards to table
    const inserts = [];
    for (let i = 0; i < daysPassed; i++) {
      inserts.push({
        user_id: userId,
        amount: totalDailyReward,
        timestamp: new Date(lastRewardTime + msInDay * (i + 1)).toISOString()
      });
    }
    await supabase.from('rewards').insert(inserts);

    // Update user balance
    await supabase.from('users').update({
      balance: Number(user.balance || 0) + totalNewReward
    }).eq('id', userId);

    return await getCurrentUser();
  }
  return null;
};

// --- SUPPORT SYSTEM FUNCTIONS ---

export const fetchSupportMessages = async (userId) => {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  return data || [];
};

export const sendSupportMessage = async (userId, senderType, content) => {
  const { data, error } = await supabase
    .from('support_messages')
    .insert([{
      user_id: userId,
      sender_type: senderType, // 'user' or 'admin'
      content,
      is_read: false
    }]).select().single();
  return data;
};

export const fetchAllSupportConversations = async () => {
  const { data, error } = await supabase
    .from('support_messages')
    .select('user_id, users(username), created_at, content, sender_type, is_read')
    .order('created_at', { ascending: false });

  if (error) return [];

  // Group by user
  const groups = {};
  data.forEach(msg => {
    if (!groups[msg.user_id]) {
      groups[msg.user_id] = {
        userId: msg.user_id,
        username: msg.users?.username || 'Unknown',
        lastMessage: msg.content,
        lastTimestamp: msg.created_at,
        unreadCount: 0
      };
    }
    if (!msg.is_read && msg.sender_type === 'user') {
      groups[msg.user_id].unreadCount++;
    }
  });

  return Object.values(groups);
};

export const markSupportMessagesAsRead = async (userId, role) => {
  const senderTypeToMark = role === 'admin' ? 'user' : 'admin';
  await supabase
    .from('support_messages')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('sender_type', senderTypeToMark);
};

export const fetchAllUsers = async () => {
  const { data: users } = await supabase.from('users').select('*');
  const { data: approvedRequests } = await supabase.from('investment_requests').select('user_id, plan_id').eq('status', 'approved');
  const { data: plans } = await supabase.from('plans').select('id, daily_reward');

  const planMap = new Map(plans?.map(p => [p.id, p.daily_reward]) || []);

  // Group rewards by user
  const userRewardsMap = new Map();
  approvedRequests?.forEach(req => {
    const reward = Number(planMap.get(req.plan_id) || 0);
    userRewardsMap.set(req.user_id, (userRewardsMap.get(req.user_id) || 0) + reward);
  });

  return users?.map(u => ({
    ...u,
    investedAmount: u.invested_amount,
    referralCode: u.referral_code,
    referredBy: u.referred_by,
    referralEarnings: u.referral_earnings,
    referralCount: u.referral_count,
    planId: u.current_plan_id,
    dailyReward: userRewardsMap.get(u.id) || 0,
    createdAt: u.created_at
  })) || [];
};

export const fetchUserRewards = async (userId) => {
  const { data } = await supabase.from('rewards').select('*').eq('user_id', userId);
  return data || [];
};
