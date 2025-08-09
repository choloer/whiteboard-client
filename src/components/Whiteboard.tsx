'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface DrawingData {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  width: number;
}

const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(2);

  useEffect(() => {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    // Load existing drawings
    newSocket.on('load-drawings', (drawings: DrawingData[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawings.forEach((drawing) => {
        drawLine(ctx, drawing);
      });
    });

    // Listen for drawing events from other users
    newSocket.on('drawing', (data: DrawingData) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawLine(ctx, data);
    });

    // Listen for clear board event
    newSocket.on('clear-board', () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const drawLine = (ctx: CanvasRenderingContext2D, data: DrawingData) => {
    ctx.beginPath();
    ctx.moveTo(data.prevX, data.prevY);
    ctx.lineTo(data.x, data.y);
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.width;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !socket) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const prevX = x - e.movementX;
    const prevY = y - e.movementY;

    const drawingData: DrawingData = {
      x,
      y,
      prevX,
      prevY,
      color,
      width: brushWidth,
    };

    // Draw locally
    drawLine(ctx, drawingData);

    // Send to other users
    socket.emit('drawing', drawingData);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas || !socket) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear-board');
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="color" className="text-sm font-medium">
            Color:
          </label>
          <input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 border-none cursor-pointer"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="width" className="text-sm font-medium">
            Width:
          </label>
          <input
            id="width"
            type="range"
            min="1"
            max="20"
            value={brushWidth}
            onChange={(e) => setBrushWidth(parseInt(e.target.value))}
            className="cursor-pointer"
          />
          <span className="text-sm">{brushWidth}px</span>
        </div>
        
        <button
          onClick={clearBoard}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Clear Board
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="border border-gray-300 cursor-crosshair bg-white shadow-lg"
      />
    </div>
  );
};

export default Whiteboard;