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
  const { data: settingsData } = await supabase.from('settings').select('value').eq('id', 1).maybeSingle();
  const dailyProfitPercent = settingsData?.value?.dailyProfitPercent || 2;

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
  const { data: settingsData } = await supabase.from('settings').select('value').eq('id', 1).maybeSingle();
  const dailyProfitPercent = settingsData?.value?.dailyProfitPercent || 2;

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
  const val = data.value || {};

  // Ensure adminWallets is an array
  let adminWallets = val.adminWallets;
  if (adminWallets && !Array.isArray(adminWallets)) {
    // Convert object {easypaisa: [], ...} to array [{id: 'easypaisa', title: 'Easypaisa', accounts: []}, ...]
    adminWallets = Object.entries(adminWallets).map(([id, accounts]) => ({
      id,
      title: id.charAt(0).toUpperCase() + id.slice(1),
      accounts: Array.isArray(accounts) ? accounts : []
    }));
  }

  return { ...defaults, ...val, adminWallets: adminWallets || [] };
};

export const updateSettings = async (newSettings) => {
  const { data: current } = await supabase.from('settings').select('value').eq('id', 1).maybeSingle();
  const updatedValue = { ...(current?.value || {}), ...newSettings };
  const { data } = await supabase.from('settings').upsert({ id: 1, value: updatedValue }).select().maybeSingle();
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
  const { data: request } = await supabase.from('investment_requests').update({ status }).eq('id', requestId).select().single();

  if (status === 'approved' && request) {
    // Before approving a new plan, calculate rewards for the old one to avoid loss
    await calculateRewards(request.user_id);

    const { data: plan } = await supabase.from('plans').select('*').eq('id', request.plan_id).single();
    if (plan) {
      // Reward referrer logic
      const { data: user } = await supabase.from('users').select('*').eq('id', request.user_id).single();
      let investedAm = plan.price + (user.invested_amount || 0);

      if (user.referred_by) {
        const { data: settings } = await supabase.from('settings').select('referral_reward_percent').eq('id', 1).single();
        const rewardObj = (plan.price * (settings?.referral_reward_percent || 10)) / 100;
        const { data: referrer } = await supabase.from('users').select('*').eq('id', user.referred_by).single();
        await supabase.from('users').update({
          balance: Number(referrer.balance || 0) + rewardObj,
          referral_earnings: Number(referrer.referral_earnings || 0) + rewardObj
        }).eq('id', referrer.id);
      }

      const firstApproveReward = Number(plan.daily_reward || 0);

      await supabase.from('users').update({
        current_plan_id: plan.id,
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
  }
  return {};
};

export const submitWithdrawal = async (userId, amount, method, accountDetails) => {
  const { data } = await supabase.from('withdrawals').insert([{
    user_id: userId,
    amount,
    method,
    account_details: accountDetails,
    status: 'pending'
  }]).select().single();

  // Need to deduct amount from user immediately as pending
  const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
  await supabase.from('users').update({ balance: Number(user.balance || 0) - amount }).eq('id', userId);

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
  const { data: settingsData } = await supabase.from('settings').select('value').eq('id', 1).maybeSingle();
  const dailyProfitPercent = settingsData?.value?.dailyProfitPercent || 2;

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
