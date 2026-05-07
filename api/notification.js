const midtransClient = require('midtrans-client');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiClient = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY,
            clientKey: process.env.MIDTRANS_CLIENT_KEY
        });

        const statusResponse = await apiClient.transaction.notification(req.body);

        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        console.log(`Notifikasi masuk - Order ID: ${orderId}`);
        console.log(`Status transaksi: ${transactionStatus}`);
        console.log(`Fraud status: ${fraudStatus}`);

        if (transactionStatus === 'capture') {
            if (fraudStatus === 'accept') {
                console.log(`Order ${orderId} pembayaran berhasil`);
            }
        } else if (transactionStatus === 'settlement') {
            console.log(`Order ${orderId} settlement berhasil`);
        } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
            console.log(`Order ${orderId} dibatalkan/ditolak/kadaluarsa`);
        } else if (transactionStatus === 'pending') {
            console.log(`Order ${orderId} menunggu pembayaran`);
        }

        res.status(200).json({ status: 'OK' });

    } catch (err) {
        console.error('Notification error:', err);
        res.status(500).json({ error: err.message });
    }
};
