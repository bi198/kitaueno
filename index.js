const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Thêm thư viện cors

// Cấu hình kết nối MongoDB Atlas
const dbURI =
  'mongodb+srv://APPUSER:APPUSER@cluster0.mbb5nem.mongodb.net/Bills?retryWrites=true&w=majority&appName=Cluster0';

// Kết nối đến MongoDB Atlas
mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Sử dụng middleware cors

// Định nghĩa schema và model cho collection Receipt
const receiptSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  value: Number,
  action: { type: String, enum: ['received', 'paid'], required: true },
  status: { type: String, enum: ['active', 'deactive'], default: 'active' },
  description: { type: String, default: '' },
});

const Receipt = mongoose.model('Receipt', receiptSchema);

// Hàm thêm một số mới vào collection Receipt
const addNewReceipt = async (
  value,
  action,
  description,
  date,
  status = 'active'
) => {
  try {
    const newEntry = new Receipt({ value, action, description, date, status });
    await newEntry.save();
    console.log('Added new receipt to the Receipt collection');
    return newEntry;
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
};

// Hàm tính tổng các giá trị của receipt
const calculateTotal = async () => {
  try {
    const receipts = await Receipt.find({ status: 'active' });
    const total = receipts.reduce((sum, receipt) => {
      return (
        sum + (receipt.action === 'received' ? receipt.value : -receipt.value)
      );
    }, 0);
    return total;
  } catch (err) {
    console.error('Error calculating total:', err);
    throw err;
  }
};

// API Endpoint để thêm receipt
app.post('/add-receipt', async (req, res) => {
  const { value, action, description, date } = req.body;
  try {
    const newReceipt = await addNewReceipt(value, action, description, date);
    res.status(201).json(newReceipt);
  } catch (err) {
    res.status(500).json({ error: 'Error adding receipt' });
  }
});

// API Endpoint để lấy toàn bộ dữ liệu từ collection Receipt
app.get('/api/bill/receipt', async (req, res) => {
  try {
    const receipts = await Receipt.find().sort({ date: -1 });
    res.status(200).json(receipts);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching receipts' });
  }
});

// API Endpoint để lấy tổng giá trị của receipt
app.get('/api/bill/total', async (req, res) => {
  try {
    const total = await calculateTotal();
    res.status(200).json({ total });
  } catch (err) {
    res.status(500).json({ error: 'Error calculating total' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
