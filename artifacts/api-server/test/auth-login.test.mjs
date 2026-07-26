import assert from 'node:assert/strict';

const loginUrl = 'http://127.0.0.1:8080/api/auth/login';
const signupUrl = 'http://127.0.0.1:8080/api/auth/signup';

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

const wrong = await postJson(loginUrl, { username: 'demo', password: 'wrong', role: 'Investigator' });
assert.equal(wrong.status, 401, `Expected 401 for wrong credentials but got ${wrong.status}`);

const right = await postJson(loginUrl, { username: 'investigator', password: 'invest123', role: 'Investigator' });
assert.equal(right.status, 200, `Expected 200 for valid credentials but got ${right.status}`);

const signup = await postJson(signupUrl, { username: 'newuser', password: 'newpass123', role: 'Analyst' });
assert.equal(signup.status, 200, `Expected 200 for signup but got ${signup.status}`);

const duplicate = await postJson(signupUrl, { username: 'newuser', password: 'another', role: 'Analyst' });
assert.equal(duplicate.status, 409, `Expected 409 for duplicate signup but got ${duplicate.status}`);

console.log('Auth login and signup test passed');
