const axios = require('axios');

async function testSignup() {
    try {
        const response = await axios.post('https://mtg-card-scanner-477210.oa.r.appspot.com/api/auth/signup', {
            email: `test_${Date.now()}@test.com`,
            password: 'password123',
            username: `user_${Date.now()}`
        }, {
            validateStatus: () => true // Don't throw on error
        });

        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Request failed:', error.message);
    }
}

testSignup();
