
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local manually
const envPath = 'c:/Users/Administrator/Desktop/tempp/.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        let value = parts.slice(1).join('=').trim();
        // Remove quotes
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        env[key] = value;
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    const { data, error } = await supabase.from('investment_requests').select('*').limit(1);
    if (error) {
        console.error("Error fetching investment_requests:", error);
    } else if (data && data.length > 0) {
        console.log("Investment Request Sample Row:", JSON.stringify(data[0], null, 2));
        console.log("Available Columns:", Object.keys(data[0] || {}));
    } else {
        console.log("No investment requests found.");
    }
}

checkSchema();
