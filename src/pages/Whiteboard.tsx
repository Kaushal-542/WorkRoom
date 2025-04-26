import React, { useState, useRef, useEffect } from "react";
import { EuiButton } from "@elastic/eui";

const Whiteboard = () => {
  const [isErasing, setIsErasing] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [lineWidth, setLineWidth] = useState(2); // Pencil thickness
  const [eraserSize, setEraserSize] = useState(10); // Eraser thickness
  const [isTextMode, setIsTextMode] = useState(false); // Text mode toggle
  const [text, setText] = useState(""); // Text input state
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null); // Text position
  const [drawnText, setDrawnText] = useState<{ text: string; x: number; y: number }[]>([]); // Array to store drawn text

  const [color, setColor] = useState("#000000"); // New state for color!
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState(false); // State to toggle color palette

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null); // Ref for the text input field

  const getMousePosition = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (!contextRef.current || !canvasRef.current || isTextMode) return;
    const { x, y } = getMousePosition(e);
    setDrawing(true);
    contextRef.current.beginPath();
    contextRef.current.moveTo(
      x * (canvasRef.current.width / canvasRef.current.clientWidth),
      y * (canvasRef.current.height / canvasRef.current.clientHeight)
    );
  };

  const draw = (e: React.MouseEvent) => {
    if (!drawing || !contextRef.current || !canvasRef.current || isTextMode) return;
    const { x, y } = getMousePosition(e);

    // *Ensure correct line width is applied*
    contextRef.current.lineWidth = isErasing ? eraserSize : lineWidth;

    contextRef.current.lineTo(
      x * (canvasRef.current.width / canvasRef.current.clientWidth),
      y * (canvasRef.current.height / canvasRef.current.clientHeight)
    );
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    setDrawing(false);
    if (contextRef.current) contextRef.current.closePath();
  };

  const clearCanvas = () => {
    if (canvasRef.current && contextRef.current) {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setDrawnText([]); // Clear all drawn text as well
    }
  };

  const switchToPencil = () => {
    setIsErasing(false);
    setIsTextMode(false); // Disable text mode
    if (contextRef.current) {
      contextRef.current.globalCompositeOperation = "source-over";
      contextRef.current.strokeStyle = "black";
      contextRef.current.lineWidth = lineWidth; // Apply pencil size
    }

    if(canvasRef.current) { 
      canvasRef.current.style.cursor = "default";
    }
    if (inputRef.current) inputRef.current.style.display = "none"; // Hide text input field
  };

  // const switchToEraser = () => {
  //   setIsErasing(true);
  //   setIsTextMode(false); // Disable text mode
  //   if (contextRef.current) {
  //     contextRef.current.globalCompositeOperation = "destination-out";
  //     contextRef.current.lineWidth = eraserSize; // Apply eraser size
  //   }
  //   if (inputRef.current) inputRef.current.style.display = "none"; // Hide text input field
  // };

  const switchToEraser = () => {
    setIsErasing(true);
    setIsTextMode(false);
    if (contextRef.current) {
      contextRef.current.globalCompositeOperation = "destination-out";
      contextRef.current.lineWidth = eraserSize;
    }
    if (canvasRef.current) {
      const size = eraserSize; // You can set this to match your eraser size  
      const svgCursor = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
          <rect width="${size - 1}" height="${size - 1}" fill="none" stroke="black" stroke-width="1"/>
        </svg>`;
      const encoded = encodeURIComponent(svgCursor.trim());
      const dataUri = `data:image/svg+xml;base64,${btoa(svgCursor)}`;
      canvasRef.current.style.cursor = `url("${dataUri}") ${size / 2} ${size / 2}, auto`;
    }
    if (inputRef.current) inputRef.current.style.display = "none";
  };



  useEffect(() => {
    if (canvasRef.current) {
      contextRef.current = canvasRef.current.getContext("2d");
      if (contextRef.current) {
        contextRef.current.lineCap = "round";
        contextRef.current.strokeStyle = color;
        contextRef.current.lineWidth = lineWidth;
      }
    }
  }, [lineWidth, eraserSize, color]);



  

  useEffect(() => {
    if (isErasing && canvasRef.current) {
      const size = eraserSize; // Dynamically adjust size
      const svgCursor = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
          <rect width="${size - 1}" height="${size - 1}" fill="none" stroke="black" stroke-width="1"/>
        </svg>`;
  
      const encoded = encodeURIComponent(svgCursor.trim());
      const dataUri = `data:image/svg+xml,${encoded}`;
      canvasRef.current.style.cursor = `url("${dataUri}") ${size / 2} ${size / 2}, auto`;
  
      // Update line width to match eraser size
      if (contextRef.current) {
        contextRef.current.lineWidth = size;
      }
    }
  }, [eraserSize, isErasing]);



  const switchToText = () => {
    setIsTextMode(true); // Enable text mode
    if (inputRef.current) inputRef.current.style.display = "block"; // Show text input field
    setText(""); // Clear text input field
  };


  //handle Drop
  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
  
    if (!canvas || !ctx) return;
  
    const imageUrl = e.dataTransfer.getData("imageSrc");
    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Handle CORS issues if images are from external sources
      img.src = imageUrl;
  
      img.onload = () => {
        const rect = canvas.getBoundingClientRect();
        
        // Convert screen coordinates to canvas coordinates correctly
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
  
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
  
        ctx.drawImage(img, x, y, 100, 100); // Adjust size if needed
      };
    }
  };



  useEffect(() => {
    if (canvasRef.current) {
      contextRef.current = canvasRef.current.getContext("2d");
      if (contextRef.current) {
        contextRef.current.lineCap = "round";
        contextRef.current.strokeStyle = "black";
        contextRef.current.lineWidth = lineWidth;
      }
    }
  }, [lineWidth, eraserSize]); // Update dynamically

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isTextMode) return;
    const { x, y } = getMousePosition(e);
    setTextPosition({ x, y }); // Store the position where the user clicked
    if (inputRef.current) {
      inputRef.current.style.left = `${x}px`;
      inputRef.current.style.top =`${y}px`;
      inputRef.current.style.display = "block"; // Show the text input field
      inputRef.current.focus(); // Focus the input field
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleTextSubmit = () => {
    if (text && textPosition && contextRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
  
      // Calculate scaling ratios
      const scaleX = canvas.width / canvas.clientWidth;
      const scaleY = canvas.height / canvas.clientHeight;
  
      // Apply scaling to the text position
      const adjustedX = textPosition.x * scaleX;
      const adjustedY = textPosition.y * scaleY;
  
      // Draw the text on the canvas
      contextRef.current.font = "20px Arial";
      // contextRef.current.fillStyle = "black";
      contextRef.current.fillStyle = "color";
      contextRef.current.fillText(text, adjustedX, adjustedY);
  
      // Save the text and its adjusted position
      setDrawnText((prevText) => [
        ...prevText,
        { text, x: adjustedX, y: adjustedY },
      ]);
  
      setText(""); // Clear text input field
      if (inputRef.current) inputRef.current.style.display = "none"; // Hide input
    }
  };

  const toggleColorPalette = () => {
    setIsColorPaletteOpen((prev) => !prev); // Toggle color palette visibility
  };
  
  const handleColorSelect = (selectedColor: string) => {
    setColor(selectedColor);
    // setIsColorPaletteOpen(false); // Close palette after selecting a color
  };


  return (
    <div style={{ width: "100%", height: "100%", marginTop: "2rem", display: "flex", flexDirection: "column" }}>
      {/* Buttons */}
      <div style={{ marginBottom: "1rem", marginLeft: "1rem", display: "flex", gap: "1rem" }}>
        <EuiButton onClick={switchToPencil} iconType="pencil" aria-label="Pencil Tool">
          Pencil
        </EuiButton>
        <EuiButton onClick={switchToEraser} iconType="eraser" aria-label="Eraser Tool">
          Eraser
        </EuiButton>
        <EuiButton onClick={switchToText} iconType="editorComment" aria-label="Text Tool">
          Text
        </EuiButton>
        <EuiButton onClick={clearCanvas} iconType="trash" aria-label="Clear Board">
          Clear
        </EuiButton>
        <EuiButton iconType="color" onClick={toggleColorPalette}>Color Palette</EuiButton>
        
        {/* <EuiButton onClick={handleConvertSketch} iconType="document" aria-label="Convert Sketch">
          Convert to Diagram
        </EuiButton> */}
      </div>


      {/* Color palette dropdown */}
      {/* {isColorPaletteOpen && (
        <div style={{ marginLeft: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <div
            style={{ width: "30px", height: "30px", backgroundColor: "#000000", cursor: "pointer" }}
            onClick={() => handleColorSelect("#000000")}
          />
          <div
            style={{ width: "30px", height: "30px", backgroundColor: "#FF0000", cursor: "pointer" }}
            onClick={() => handleColorSelect("#FF0000")}
          />
          <div
            style={{ width: "30px", height: "30px", backgroundColor: "#00FF00", cursor: "pointer" }}
            onClick={() => handleColorSelect("#00FF00")}
          />
          <div
            style={{ width: "30px", height: "30px", backgroundColor: "#0000FF", cursor: "pointer" }}
            onClick={() => handleColorSelect("#0000FF")}
          />
          <div
            style={{ width: "30px", height: "30px", backgroundColor: "#FFFF00", cursor: "pointer" }}
            onClick={() => handleColorSelect("#FFFF00")}
          />
          <div
            style={{ width: "30px", height: "30px", backgroundColor: "#FFA500", cursor: "pointer" }}
            onClick={() => handleColorSelect("#FFA500")}
          />
        </div>
      )} */}

      {/* Color Palette Dropdown
      {isColorPaletteOpen && (
        <div style={{
          position: "absolute",
          marginLeft: "665px", // <-- Opens to right side of eraser resize
          backgroundColor: "white",
          border: "1px solid #ccc",
          padding: "10px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          zIndex: 10
        }}>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: "40px", height: "30px", border: "none", background: "none" }}
          />
        </div>
      )} */}

      {/* Color palette dropdown */}
      {isColorPaletteOpen && (
        <div style={{
          position: "absolute",
          top: "116px",
          left: "45%",  // Move it to right side
          transform: "translateY(-50%)",
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          backgroundColor: "white",
          padding: "10px",
          border: "1px solid #ccc",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          zIndex: 10
        }}>
          <div
            style={{ width: "30px", height: "30px", backgroundColor: "#000000", cursor: "pointer" }}
            onClick={() => handleColorSelect("#000000")}
          />
          <div
            style={{ width: "30px", height: "30px", backgroundColor: "#FF0000", cursor: "pointer" }}
            onClick={() => handleColorSelect("#FF0000")}
          />
          <div
            style={{ width: "30px", height: "30px", backgroundColor: "#00FF00", cursor: "pointer" }}
            onClick={() => handleColorSelect("#00FF00")}
          />
          <div
            style={{ width: "30px", height: "30px", backgroundColor: "#0000FF", cursor: "pointer" }}
            onClick={() => handleColorSelect("#0000FF")}
          />
          <div
            style={{ width: "30px", height: "30px", backgroundColor: "#FFFF00", cursor: "pointer" }}
            onClick={() => handleColorSelect("#FFFF00")}
          />
          <div
            style={{ width: "30px", height: "30px", backgroundColor: "#FFA500", cursor: "pointer" }}
            onClick={() => handleColorSelect("#FFA500")}
          />
        </div>
      )}

      {/* Sliders for adjusting pencil and eraser size */}
      <div style={{ marginBottom: "1rem", marginLeft: "1rem", display: "flex", gap: "2rem" }}>
        <div>
          <label>Pencil Size: {lineWidth}px</label>
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
          />
        </div>
        <div>
          <label>Eraser Size: {eraserSize}px</label>
          <input
            type="range"
            min="5"
            max="50"
            value={eraserSize}
            onChange={(e) => setEraserSize(Number(e.target.value))}
          />
        </div>

        {/* <div>
          <label>Color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: "40px", height: "30px", border: "none", background: "none" }}
          />
        </div> */}
      </div>

      {/* Whiteboard Canvas */}
      <div style={{ width: "100%", maxHeight: "500px", overflow: "hidden", position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onClick={handleCanvasClick} // Add click event to add text
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          style={{ width: "100%", height: "100%", border: "2px solid #ccc" }}
        />
        {/* Text input field */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          onBlur={handleTextSubmit} // Submit text when input loses focus
          style={{
            position: "absolute",
            display: "none", // Initially hidden
            fontSize: "20px",
            border: "1px solid black",
            padding: "5px",
            zIndex: 10,
            backgroundColor: "white",
          }}
        />
      </div>
    </div>
  );
};

export default Whiteboard;