const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { enhanceImageResolution } = require('./resolution.js');
const { enhanceTo200MP } = require('./200mp.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API for image enhancement
app.post('/enhance', async (req, res) => {
  try {
    const { imageData, width, height, enhancementType } = req.body;
    
    if (!imageData || !width || !height) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    let enhancedImage;
    if (enhancementType === '200mp') {
      enhancedImage = await enhanceTo200MP(imageData, width, height);
    } else {
      enhancedImage = await enhanceImageResolution(imageData, width, height, enhancementType);
    }
    
    res.json(enhancedImage);
  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(500).json({ error: 'Failed to enhance image' });
  }
});

// Socket.io for real-time processing
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('process-frame', async (data) => {
    try {
      const enhancedData = await enhanceImageResolution(
        data.imageData, 
        data.width, 
        data.height,
        data.enhancementType || 'standard'
      );
      
      socket.emit('enhanced-frame', enhancedData);
    } catch (error) {
      console.error('Frame processing error:', error);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});