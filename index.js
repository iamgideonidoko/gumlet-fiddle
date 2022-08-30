const express = require('express');
const app = express();
app.use(express.json({ limit: '10MB' }));
app.use(express.urlencoded({ extended: true }));
const secretToken = '5c6d5948-2c06-487c-bd3e-9ae23ded960b';
// only gumlet should be allowed access to this webhook
const auth = (req, res, next) => {
    const gumletSecretToken = req.header('x-gumlet-token');
    console.log('gumletSecretToken = ', gumletSecretToken);
    if (!secretToken || secretToken !== gumletSecretToken) {
        return res.status(401).json({
            message: 'Unathorized',
        })
    }
    next();
};
app.post('/gumlet-webhook', auth, (req, res) => {
    console.log('\x1b[34m%s\x1b[0m', 'Webhook was hit');
    console.log('\x1b[42m%s\x1b[0m', 'Asset ID: ', req.body?.asset_id, ' Asset Status: ', req.body?.status);
    res.status(200).json({
        message: 'success',
    });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('🚀 Listening on port ' + PORT));