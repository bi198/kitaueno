const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Cấu hình kết nối MongoDB Atlas
const dbURI =
  'mongodb+srv://APPUSER:APPUSER@cluster0.mbb5nem.mongodb.net/Bills?retryWrites=true&w=majority&appName=Cluster0';

// Kết nối đến MongoDB Atlas
mongoose
  .connect(dbURI, {})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Sử dụng middleware cors

// Hàm lấy thời gian hiện tại theo giờ Nhật Bản và định dạng chuỗi
const getCurrentDateTimeJST = () => {
  const now = new Date();
  now.setHours(now.getHours() + 9); // Chuyển giờ UTC sang JST (UTC+9)
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (+9 Tokyo Japan)`;
};

// Định nghĩa schema và model cho collection Receipt
const receiptSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  value: Number,
  action: { type: String, enum: ['received', 'paid'], required: true },
  status: { type: String, enum: ['active', 'deactive'], default: 'active' },
  description: { type: String, default: '' },
  modifiedDate: { type: String, default: getCurrentDateTimeJST }, // Thêm trường ModifiedDate
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
    const newEntry = new Receipt({
      value,
      action,
      description,
      date,
      status,
      modifiedDate: getCurrentDateTimeJST(), // Cập nhật ModifiedDate khi thêm mới
    });
    await newEntry.save();
    console.log('Added new receipt to the Receipt collection');
    return newEntry;
  } catch (err) {
    console.error('Error:', err);
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

// API Endpoint để lấy toàn bộ dữ liệu từ collection Receipt với status active
app.get('/api/bill/receipt', async (req, res) => {
  try {
    const receipts = await Receipt.find({ status: 'active' });
    res.status(200).json(receipts);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching receipts' });
  }
});

// API Endpoint để lấy toàn bộ dữ liệu từ collection Receipt với status deactive
app.get('/api/bill/deleted_receipts', async (req, res) => {
  try {
    const receipts = await Receipt.find({ status: 'deactive' });
    res.status(200).json(receipts);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching receipts' });
  }
});
// API Endpoint để cập nhật status từ active thành deactive
app.put('/api/bill/receipt/deactivate/:id', async (req, res) => {
  const receiptId = req.params.id;
  try {
    const updatedReceipt = await Receipt.findByIdAndUpdate(
      receiptId,
      { status: 'deactive', modifiedDate: getCurrentDateTimeJST() }, // Cập nhật ModifiedDate khi trạng thái thay đổi
      { new: true }
    );
    if (!updatedReceipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.status(200).json(updatedReceipt);
  } catch (err) {
    res.status(500).json({ error: 'Error updating receipt status' });
  }
});

// API Endpoint để cập nhật status từ active thành reactive
app.put('/api/bill/receipt/reactivate/:id', async (req, res) => {
  const receiptId = req.params.id;
  try {
    const updatedReceipt = await Receipt.findByIdAndUpdate(
      receiptId,
      { status: 'active', modifiedDate: getCurrentDateTimeJST() }, // Cập nhật ModifiedDate khi trạng thái thay đổi
      { new: true }
    );
    if (!updatedReceipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.status(200).json(updatedReceipt);
  } catch (err) {
    res.status(500).json({ error: 'Error updating receipt status' });
  }
});
// Start server
const port = 3000;
app.listen(port, () =>
  console.log(`Server is running on http://localhost:${port}`)
);
