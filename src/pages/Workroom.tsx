import React, { useState } from "react";
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiButton,
  EuiLoadingSpinner,
  EuiText,
} from "@elastic/eui";
import Whiteboard from "./Whiteboard"; // Import the Whiteboard component

export default function Workroom() {
  const [prompt, setPrompt] = useState(""); // Store user input
  const [imageUrls, setImageUrls] = useState<string[]>([]); // Store multiple images
  const [loading, setLoading] = useState(false); // Loading state

  

  const fetchImage = async (retryCount = 0): Promise<string> => {
    const randomSeed = Math.floor(Math.random() * 1000000); // Generate a random seed
  
    try {
      const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REACT_APP_HF_API_KEY}`, // Fixed the syntax
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { seed: randomSeed }, // Use a different seed for each image
        }),
      });
  
      if (response.status === 503) {
        // Model is still loading
        if (retryCount < 5) {
          await new Promise((resolve) => setTimeout(resolve, 20000)); // Wait 20s before retrying
          return fetchImage(retryCount + 1); // Retry
        } else {
          throw new Error("Model is still loading after multiple attempts.");
        }
      }
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error details:", errorData);  // Log full error response
        throw new Error(`API Error: ${errorData.error || "Unknown error"}`);
      }
  
      const imageBlob = await response.blob();
      return URL.createObjectURL(imageBlob);
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt) return alert("Please enter a prompt!");
    setLoading(true);
    setImageUrls([]); // Clear previous images

    try {
      const images = await Promise.all([fetchImage(), fetchImage()]); // Generate 2 unique images
      setImageUrls(images);
    } catch (error: any) {
        alert(`Failed to generate images: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left side with Whiteboard */}
      <div
        style={{
          flex: 1,
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <EuiText>
          <h1>Workroom</h1>
        </EuiText>

        {/* Whiteboard component */}
        <Whiteboard />
      </div>

      {/* Right side for Image Generation */}
      <div
        style={{
          width: "30%",
          padding: "2rem",
          textAlign: "center",
          overflowY: "auto",
          borderLeft: "2px solid #ccc",
        }}
      >
        <EuiFlexGroup direction="column" alignItems="center" justifyContent="center">
          <EuiFlexItem>
            <EuiText>
              <h2>AI Image</h2>
            </EuiText>
          </EuiFlexItem>

          <EuiFlexItem>
            <EuiText>
              <p>Enter a text prompt to generate unique images!</p>
            </EuiText>
          </EuiFlexItem>

          <EuiFlexItem style={{ width: "100%" }}>
            <EuiFieldText
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              fullWidth
              disabled={loading}
            />
          </EuiFlexItem>

          <EuiFlexItem>
            <EuiButton
              onClick={handleGenerateImage}
              fill
              isDisabled={loading}
              style={{ marginTop: "1rem" }}
            >
              Generate Images
            </EuiButton>
          </EuiFlexItem>

          {loading && (
            <EuiFlexItem>
              <EuiLoadingSpinner size="xl" />
              <p>Generating images...</p>
            </EuiFlexItem>
          )}

          {!loading && imageUrls.length > 0 && (
            <EuiFlexItem>
              <div
                style={{
                  marginTop: "2rem",
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "10px",
                }}
              >
                {imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={'Generated ${index + 1}'}

                    draggable="true" // enable dragging
                    onDragStart={(e) => {
                      e.dataTransfer.setData("imageSrc", url);
                    }}
                    style={{
                      maxWidth: "100%",
                      borderRadius: "8px",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    }}
                  />
                ))}
              </div>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </div>
    </div>
  );
}
