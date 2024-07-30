const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Thêm thư viện cors
const moment = require('moment'); // Thêm thư viện moment để định dạng ngày giờ

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
function getCurrentTimePlus9Hours() {
  // Lấy thời gian hiện tại
  const now = new Date();

  // Cộng thêm 9 tiếng
  now.setHours(now.getHours() + 9);
  console.log(now.toDateString());
  console.log(now);
  // Trả về thời gian sau khi đã cộng thêm 9 tiếng
  return now;
}
// Định nghĩa schema và model cho collection Receipt
const receiptSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  value: Number,
  action: { type: String, enum: ['received', 'paid'], required: true },
  status: { type: String, enum: ['active', 'deactive'], default: 'active' },
  description: { type: String, default: '' },
  modifiedDate: { type: String, default: getCurrentTimePlus9Hours() }, // Thêm trường ModifiedDate
});

const Receipt = mongoose.model('Receipt', receiptSchema);
// Tạo đối tượng Date với thời gian hiện tại

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
      modifiedDate: getCurrentTimePlus9Hours(), // Cập nhật ModifiedDate khi thêm mới
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
    const newReceipt = await addNewReceipt(
      value,
      action,
      description,
      getCurrentTimePlus9Hours()
    );
    res.status(201).json(formatReceipt(newReceipt));
  } catch (err) {
    res.status(500).json({ error: 'Error adding receipt' });
  }
});

// API Endpoint để lấy toàn bộ dữ liệu từ collection Receipt với status active
app.get('/api/bill/receipt', async (req, res) => {
  try {
    const receipts = await Receipt.find({ status: 'active' });
    res.status(200).json(receipts.map(formatReceipt));
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
      { status: 'deactive', modifiedDate: getCurrentTimePlus9Hours() }, // Cập nhật ModifiedDate khi trạng thái thay đổi
      { new: true }
    );
    if (!updatedReceipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.status(200).json(formatReceipt(updatedReceipt));
  } catch (err) {
    res.status(500).json({ error: 'Error updating receipt status' });
  }
});

// Start server
const port = 3000;
app.listen(port, () =>
  console.log(`Server is running on http://localhost:${port}`)
);
