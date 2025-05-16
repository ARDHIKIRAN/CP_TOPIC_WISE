// Backend server
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = __dirname + '/data.json';

app.use(cors());
app.use(express.json());

function readData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/groups', (req, res) => {
  res.json(readData());
});

app.post('/api/groups/:group', (req, res) => {
  const data = readData();
  data[req.params.group] = req.body.notes || [];
  writeData(data);
  res.json({ success: true });
});

app.post('/api/groups/:oldName/rename', (req, res) => {
  const { newName } = req.body;
  const data = readData();
  if (!data[req.params.oldName]) return res.status(404).json({ error: 'Group not found' });
  if (data[newName]) return res.status(400).json({ error: 'New group name already exists' });
  data[newName] = data[req.params.oldName];
  delete data[req.params.oldName];
  writeData(data);
  res.json({ success: true });
});

app.delete('/api/groups/:group', (req, res) => {
  const data = readData();
  delete data[req.params.group];
  writeData(data);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
