const axios = require('axios');
require('dotenv').config();

// Duo authentication details from environment variables
const DUO_IKEY = process.env.DUO_IKEY;
const DUO_SKEY = process.env.DUO_SKEY;
const DUO_HOST = process.env.DUO_HOST;

// Function to initiate Duo authentication
async function initiateDuo(req, res) {
  try {
    const { userId } = req.body;  // userId passed in the request

    const duoAuthUrl = `https://${DUO_HOST}/frame/web/v1/launch`;  // Duo's API endpoint for launching authentication

    const params = {
      ikey: DUO_IKEY,
      skey: DUO_SKEY,
      user: userId,  // Send the userId to identify the user in Duo
      factor: 'push',  // Push factor for Duo authentication
      device: 'auto',  // Automatically select the device
    };

    const duoAuthResponse = await axios.post(duoAuthUrl, params);
    const duoAuthUrlResponse = duoAuthResponse.data.url;  // URL to be used for Duo widget

    res.status(200).json({ duo_url: duoAuthUrlResponse });

  } catch (error) {
    console.error('Error initiating Duo authentication:', error);
    res.status(500).json({ message: 'Error initiating Duo authentication', error });
  }
}

// Function to verify Duo authentication
async function verifyDuo(req, res) {
  try {
    const { duoToken } = req.body;  // duoToken will be passed in the request (token returned by Duo)

    const duoVerifyUrl = `https://${DUO_HOST}/frame/web/v1/verify`;

    const verifyParams = {
      ikey: DUO_IKEY,
      skey: DUO_SKEY,
      token: duoToken,  // The token returned by Duo after user interaction
    };

    const duoVerificationResponse = await axios.post(duoVerifyUrl, verifyParams);

    if (duoVerificationResponse.data.success) {
      res.status(200).json({ message: 'Duo authentication successful' });
    } else {
      res.status(400).json({ message: 'Duo authentication failed' });
    }

  } catch (error) {
    console.error('Error verifying Duo authentication:', error);
    res.status(500).json({ message: 'Error verifying Duo authentication', error });
  }
}

module.exports = {
  initiateDuo,
  verifyDuo
};
