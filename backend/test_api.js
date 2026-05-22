async function runTests() {
  const BASE_URL = 'http://localhost:5002/api/auth';
  const testUser = {
    email: `testuser_${Date.now()}@selorah.com`,
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    dob: '1990-01-01'
  };

  let userId = null;

  console.log('--- STARTING BACKEND API TESTS ---');

  try {
    // 1. Test Signup
    console.log(`\n1. Testing Signup for ${testUser.email}...`);
    const signupRes = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const signupData = await signupRes.json();
    
    if (!signupRes.ok) throw new Error(signupData.error || 'Signup failed');
    console.log('✅ Signup Successful!');
    userId = signupData.user.id;
    console.log(`   User ID: ${userId}`);

    // 2. Test Login
    console.log(`\n2. Testing Login for ${testUser.email}...`);
    const loginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    const loginData = await loginRes.json();
    
    if (!loginRes.ok) throw new Error(loginData.error || 'Login failed');
    console.log('✅ Login Successful!');

    // 3. Test Onboarding
    console.log(`\n3. Testing Onboarding...`);
    const onboardingRes = await fetch(`${BASE_URL}/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        role: 'patient',
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        dob: testUser.dob,
        address: '123 Test St',
        whatsapp: '+2348000000000',
        bloodType: 'O+',
        height: '180cm',
        weight: '75kg',
        allergies: 'None'
      })
    });
    const onboardingData = await onboardingRes.json();
    
    if (!onboardingRes.ok) throw new Error(onboardingData.error || 'Onboarding failed');
    console.log('✅ Onboarding Successful!');
    console.log(`   Generated UID: ${onboardingData.uid}`);

    console.log('\n🎉 ALL BACKEND API TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  }
}

runTests();
