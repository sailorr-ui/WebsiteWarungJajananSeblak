const midtransClient = require('midtrans-client');
const { db, admin } = require('../lib/firebaseAdmin');

// Peta status Midtrans -> status sederhana yang ditampilkan di panel admin
function mapStatus(transactionStatus, fraudStatus) {
    if (transactionStatus === 'capture') {
        return fraudStatus === 'accept' ? 'settlement' : 'pending';
    }
    if (transactionStatus === 'settlement') return 'settlement';
    if (transactionStatus === 'pending') return 'pending';
    if (transactionStatus === 'deny') return 'deny';
    if (transactionStatus === 'cancel') return 'cancel';
    if (transactionStatus === 'expire') return 'expire';
    if (transactionStatus === 'refund' || transactionStatus === 'partial_refund') return 'refund';
    return transactionStatus;
}

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

        const statusBaru = mapStatus(transactionStatus, fraudStatus);

        // Update status transaksi yang tersimpan di Firestore
        try {
            await db.collection('transaksi').doc(orderId).set({
                status: statusBaru,
                midtrans_transaction_status: transactionStatus,
                midtrans_fraud_status: fraudStatus || null,
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            console.log(`Status transaksi ${orderId} diupdate menjadi: ${statusBaru}`);
        } catch (fireErr) {
            console.error('Gagal update status transaksi ke Firestore:', fireErr);
        }

        res.status(200).json({ status: 'OK' });
    } catch (err) {
        console.error('Notification error:', err);
        res.status(500).json({ error: err.message });
    }
};
