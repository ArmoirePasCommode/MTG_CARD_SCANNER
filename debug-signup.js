// using global fetch


async function testSignup() {
    console.log('Testing signup on PRODUCTION...');
    try {
        const response = await fetch('https://mtg-card-scanner-477210.oa.r.appspot.com/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: `test_${Date.now()}@test.com`,
                password: 'password123',
                username: `user_${Date.now()}`
            })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Raw Response:', text);
        try {
            const data = JSON.parse(text);
            console.log('Data:', JSON.stringify(data, null, 2));
        } catch (e) {
            console.log('Response is not JSON');
        }
    } catch (error) {
        console.error('Request failed:', error.message);
    }
}

testSignup();
