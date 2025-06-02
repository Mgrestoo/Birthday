const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serves your static files like index.html

// Replace with your actual Safaricom Daraja credentials
const consumerKey = 'zuPGpXajgjvGyF9ocAVA1MU1MHyx4VUfXTTS50rmXG752NWY';
const consumerSecret = 'DjHpwLTG4Tz52ONbaIIGIV4Vj7PrGBTsZKusI5Hul1kHwWIt8OLe0QMePOHsj9AF';
const shortCode = '174379'; // e.g., '174379' for sandbox
const passKey = 'bfb279f9aa9bdbcf158e97dd71a467cd2c2c6a41b7b7e1e3b7e1e1e1e1e1e1e1';
const callbackUrl = 'https://yourdomain.com/callback'; // For testing, use 'https://webhook.site/' to get a test URL

// Get access token
async function getAccessToken() {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        headers: { Authorization: `Basic ${auth}` }
    });
    return response.data.access_token;
}

// STK Push endpoint
app.post('/api/stkpush', async (req, res) => {
    const { phone, amount } = req.body;
    const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
    const password = Buffer.from(shortCode + passKey + timestamp).toString('base64');
    try {
        const token = await getAccessToken();
        const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            {
                BusinessShortCode: shortCode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: amount,
                PartyA: phone,
                PartyB: shortCode,
                PhoneNumber: phone,
                CallBackURL: callbackUrl,
                AccountReference: "BirthdayGift",
                TransactionDesc: "Gift for birthday"
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        res.json({ message: "Check your phone to complete payment!" });
    } catch (err) {
        res.status(500).json({ message: "Payment failed. Ensure you use a valid phone number and try again." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));