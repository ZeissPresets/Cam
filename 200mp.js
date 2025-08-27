const { createCanvas, ImageData } = require('canvas');

// Simulate 200MP enhancement by combining multiple techniques
async function enhanceTo200MP(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = new Uint8ClampedArray(imageData.data);
    
    // Step 1: Apply super resolution techniques
    await applyMultiFrameSuperResolution(data, width, height);
    
    // Step 2: Enhance details and textures
    enhanceUltraDetails(data, width, height);
    
    // Step 3: Apply advanced sharpening
    apply200MPSharpening(data, width, height);
    
    // Step 4: Optimize colors for high resolution
    optimizeColorsForHighRes(data, width, height);
    
    // Step 5: Reduce noise while preserving details
    applyAdvancedNoiseReduction(data, width, height);
    
    return new ImageData(data, width, height);
}

// Simulate multi-frame super resolution
async function applyMultiFrameSuperResolution(data, width, height) {
    // This would normally combine multiple frames for super resolution
    // For single image, we use advanced upscaling techniques
    
    // Create a high frequency detail map
    const detailMap = new Float32Array(width * height * 4);
    
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;
            
            // Calculate high-frequency details
            const detail = (
                Math.abs(data[i] - data[i - 4]) +
                Math.abs(data[i] - data[i + 4]) +
                Math.abs(data[i] - data[i - width * 4]) +
                Math.abs(data[i] - data[i + width * 4])
            ) / 4;
            
            detailMap[i] = detail;
            detailMap[i + 1] = detail;
            detailMap[i + 2] = detail;
        }
    }
    
    // Enhance details based on the detail map
    for (let i = 0; i < data.length; i += 4) {
        const detailStrength = detailMap[i] / 50; // Normalize detail strength
        
        // Enhance details more in areas with high frequency
        data[i] = clamp(data[i] + data[i] * detailStrength * 0.2);
        data[i + 1] = clamp(data[i + 1] + data[i + 1] * detailStrength * 0.2);
        data[i + 2] = clamp(data[i + 2] + data[i + 2] * detailStrength * 0.2);
    }
}

// Enhance ultra fine details
function enhanceUltraDetails(data, width, height) {
    // Micro-contrast enhancement for fine details
    for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
            const i = (y * width + x) * 4;
            
            // Calculate micro-contrast in 5x5 area
            let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
            
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const di = i + (dy * width + dx) * 4;
                    
                    minR = Math.min(minR, data[di]);
                    maxR = Math.max(maxR, data[di]);
                    minG = Math.min(minG, data[di + 1]);
                    maxG = Math.max(maxG, data[di + 1]);
                    minB = Math.min(minB, data[di + 2]);
                    maxB = Math.max(maxB, data[di + 2]);
                }
            }
            
            const contrastR = maxR - minR;
            const contrastG = maxG - minG;
            const contrastB = maxB - minB;
            
            // Enhance areas with high micro-contrast (details)
            if (contrastR > 10 || contrastG > 10 || contrastB > 10) {
                const enhanceFactor = 1 + (contrastR + contrastG + contrastB) / 100 * 0.3;
                
                data[i] = clamp(data[i] * enhanceFactor);
                data[i + 1] = clamp(data[i + 1] * enhanceFactor);
                data[i + 2] = clamp(data[i + 2] * enhanceFactor);
            }
        }
    }
}

// Specialized sharpening for 200MP effect
function apply200MPSharpening(data, width, height) {
    // Advanced sharpening that preserves natural look
    for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
            const i = (y * width + x) * 4;
            
            // Use a larger kernel for more natural sharpening
            const kernel = [
                -0.003, -0.013, -0.022, -0.013, -0.003,
                -0.013, -0.059, -0.097, -0.059, -0.013,
                -0.022, -0.097,  1.800, -0.097, -0.022,
                -0.013, -0.059, -0.097, -0.059, -0.013,
                -0.003, -0.013, -0.022, -0.013, -0.003
            ];
            
            let r = 0, g = 0, b = 0;
            let kernelIndex = 0;
            
            for (let ky = -2; ky <= 2; ky++) {
                for (let kx = -2; kx <= 2; kx++) {
                    const di = i + (ky * width + kx) * 4;
                    const weight = kernel[kernelIndex++];
                    
                    r += data[di] * weight;
                    g += data[di + 1] * weight;
                    b += data[di + 2] * weight;
                }
            }
            
            // Apply sharpening with subtlety
            data[i] = clamp(data[i] * 0.8 + r * 0.2);
            data[i + 1] = clamp(data[i + 1] * 0.8 + g * 0.2);
            data[i + 2] = clamp(data[i + 2] * 0.8 + b * 0.2);
        }
    }
}

// Color optimization for high resolution
function optimizeColorsForHighRes(data, width, height) {
    // Enhance color differentiation for high resolution
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const avg = (r + g + b) / 3;
        
        // Increase color saturation slightly
        data[i] = clamp(avg + (r - avg) * 1.1);
        data[i + 1] = clamp(avg + (g - avg) * 1.1);
        data[i + 2] = clamp(avg + (b - avg) * 1.1);
        
        // Improve color differentiation
        if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(b - r) < 20) {
            // For neutral colors, slightly enhance differences
            data[i] = clamp(r * 1.02);
            data[i + 2] = clamp(b * 0.98);
        }
    }
}

// Advanced noise reduction that preserves details
function applyAdvancedNoiseReduction(data, width, height) {
    // Noise reduction that adapts to image content
    for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
            const i = (y * width + x) * 4;
            
            // Calculate local variance to detect noisy areas
            let sumR = 0, sumG = 0, sumB = 0;
            let sumSqR = 0, sumSqG = 0, sumSqB = 0;
            let count = 0;
            
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const di = i + (dy * width + dx) * 4;
                    
                    sumR += data[di];
                    sumG += data[di + 1];
                    sumB += data[di + 2];
                    
                    sumSqR += data[di] * data[di];
                    sumSqG += data[di + 1] * data[di + 1];
                    sumSqB += data[di + 2] * data[di + 2];
                    
                    count++;
                }
            }
            
            const varR = (sumSqR - sumR * sumR / count) / count;
            const varG = (sumSqG - sumG * sumG / count) / count;
            const varB = (sumSqB - sumB * sumB / count) / count;
            
            // Apply stronger noise reduction in areas with high variance (noise)
            if (varR > 50 || varG > 50 || varB > 50) {
                const avgR = sumR / count;
                const avgG = sumG / count;
                const avgB = sumB / count;
                
                // Blend towards local average based on variance
                const blendFactor = 0.7;
                data[i] = clamp(data[i] * (1 - blendFactor) + avgR * blendFactor);
                data[i + 1] = clamp(data[i + 1] * (1 - blendFactor) + avgG * blendFactor);
                data[i + 2] = clamp(data[i + 2] * (1 - blendFactor) + avgB * blendFactor);
            }
        }
    }
}

function clamp(value, min = 0, max = 255) {
    return Math.min(max, Math.max(min, Math.round(value)));
}

module.exports = { enhanceTo200MP };