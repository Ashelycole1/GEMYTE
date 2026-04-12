const fs = require('fs');

async function run() {
  const sql = fs.readFileSync('supabase_schema.sql', 'utf8');
  
  const res = await fetch('https://api.supabase.com/v1/projects/sbajqidzzrsygiskkyok/query', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sbp_8cbbb4799e486fb9b7eb15db0ebeae70efda15c9',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

run();
