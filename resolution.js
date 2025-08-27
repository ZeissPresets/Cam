const { createCanvas, ImageData } = require('canvas');
const sharp = require('sharp');
const Jimp = require('jimp');

// Enhancement models and configurations
const ENHANCEMENT_MODELS = {
    STANDARD: 'Standard Enhancement',
    SUPER_RES: 'Super Resolution',
    NIGHT_VISION: 'Night Vision Enhancement',
    PORTRAIT: 'Portrait Enhancement',
    HYBRID: 'Hybrid AI Model'
};

// Main enhancement function
async function enhanceImageResolution(imageData, enhancementType = 'standard', sharpness = 100, brightness = 100, contrast = 100) {
    const startTime = Date.now();
    const width = imageData.width;
    const height = imageData.height;
    
    let enhancedData;
    let modelName;
    
    try {
        switch (enhancementType) {
            case 'super':
                enhancedData = await applySuperResolution(imageData, sharpness, contrast);
                modelName = ENHANCEMENT_MODELS.SUPER_RES;
                break;
            case 'night':
                enhancedData = await applyNightVision(imageData, brightness);
                modelName = ENHANCEMENT_MODELS.NIGHT_VISION;
                break;
            case 'portrait':
                enhancedData = await applyPortraitEnhancement(imageData, sharpness);
                modelName = ENHANCEMENT_MODELS.PORTRAIT;
                break;
            case 'standard':
            default:
                enhancedData = await applyStandardEnhancement(imageData, sharpness, brightness, contrast);
                modelName = ENHANCEMENT_MODELS.STANDARD;
        }
        
        const processingTime = Date.now() - startTime;
        
        return {
            imageData: Array.from(enhancedData.data),
            width: enhancedData.width,
            height: enhancedData.height,
            modelName,
            processingTime
        };
    } catch (error) {
        console.error('Enhancement error:', error);
        throw new Error('Failed to enhance image');
    }
}

// Standard enhancement
async function applyStandardEnhancement(imageData, sharpness, brightness, contrast) {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    
    // Apply brightness and contrast
    applyBrightnessContrast(data, brightness, contrast);
    
    // Apply sharpening
    if (sharpness > 100) {
        applyUnsharpMask(data, width, height, (sharpness - 100) / 100);
    }
    
    // Apply noise reduction
    applyBilateralFilter(data, width, height, 3);
    
    return new ImageData(data, width, height);
}

// Super Resolution enhancement
async function applySuperResolution(imageData, sharpness, contrast) {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    
    // First, apply standard enhancement
    applyBrightnessContrast(data, 100, contrast);
    
    // Apply advanced sharpening for super resolution effect
    if (sharpness > 100) {
        applySuperResolutionSharpening(data, width, height, (sharpness - 100) / 100);
    }
    
    // Edge enhancement
    applyEdgeEnhancement(data, width, height);
    
    // Detail enhancement
    enhanceFineDetails(data, width, height);
    
    return new ImageData(data, width, height);
}

// Night Vision enhancement
async function applyNightVision(imageData, brightness) {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    
    // Convert to grayscale for night vision effect
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;         // R
        data[i + 1] = avg;     // G
        data[i + 2] = avg;     // B
    }
    
    // Apply brightness boost
    applyBrightness(data, brightness * 1.5);
    
    // Apply green tint for classic night vision look
    applyGreenTint(data);
    
    // Reduce noise for night vision
    applyNoiseReduction(data, width, height, 5);
    
    return new ImageData(data, width, height);
}

// Portrait Enhancement
async function applyPortraitEnhancement(imageData, sharpness) {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    
    // Skin smoothing
    applySkinSmoothing(data, width, height);
    
    // Eye enhancement
    enhanceEyes(data, width, height);
    
    // Apply subtle sharpening
    if (sharpness > 100) {
        applySelectiveSharpening(data, width, height, (sharpness - 100) / 200);
    }
    
    // Warm color tone adjustment
    adjustSkinTones(data);
    
    return new ImageData(data, width, height);
}

// Utility functions for image processing
function applyBrightnessContrast(data, brightness, contrast) {
    const factor = contrast / 100;
    
    for (let i = 0; i < data.length; i += 4) {
        // Apply brightness
        data[i] = clamp(data[i] * (brightness / 100));         // R
        data[i + 1] = clamp(data[i + 1] * (brightness / 100)); // G
        data[i + 2] = clamp(data[i + 2] * (brightness / 100)); // B
        
        // Apply contrast
        data[i] = clamp((data[i] - 128) * factor + 128);         // R
        data[i + 1] = clamp((data[i + 1] - 128) * factor + 128); // G
        data[i + 2] = clamp((data[i + 2] - 128) * factor + 128); // B
    }
}

function applyBrightness(data, brightness) {
    for (let i = 0; i < data.length; i += 4) {
        data[i] = clamp(data[i] * (brightness / 100));         // R
        data[i + 1] = clamp(data[i + 1] * (brightness / 100)); // G
        data[i + 2] = clamp(data[i + 2] * (brightness / 100)); // B
    }
}

function applyUnsharpMask(data, width, height, strength) {
    // Create a blurred version
    const blurred = new Uint8ClampedArray(data);
    applyGaussianBlur(blurred, width, height, 1);
    
    // Subtract blurred from original and add back with strength
    for (let i = 0; i < data.length; i++) {
        data[i] = clamp(data[i] + (data[i] - blurred[i]) * strength);
    }
}

function applySuperResolutionSharpening(data, width, height, strength) {
    // Enhanced sharpening for super resolution effect
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;
            
            // High-pass filter for edge enhancement
            const r = (
                5 * data[i] - data[i - 4] - data[i + 4] - data[i - width * 4] - data[i + width * 4]
            );
            const g = (
                5 * data[i + 1] - data[i - 3] - data[i + 5] - data[i - width * 4 + 1] - data[i + width * 4 + 1]
            );
            const b = (
                5 * data[i + 2] - data[i - 2] - data[i + 6] - data[i - width * 4 + 2] - data[i + width * 4 + 2]
            );
            
            // Apply with strength
            data[i] = clamp(data[i] + r * strength * 0.2);
            data[i + 1] = clamp(data[i + 1] + g * strength * 0.2);
            data[i + 2] = clamp(data[i + 2] + b * strength * 0.2);
        }
    }
}

function applyEdgeEnhancement(data, width, height) {
    // Sobel edge detection and enhancement
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;
            
            // Sobel operators for edge detection
            const gx = (
                -1 * data[i - width * 4 - 4] + 1 * data[i - width * 4 + 4] +
                -2 * data[i - 4] + 2 * data[i + 4] +
                -1 * data[i + width * 4 - 4] + 1 * data[i + width * 4 + 4]
            );
            
            const gy = (
                -1 * data[i - width * 4 - 4] - 2 * data[i - width * 4] - 1 * data[i - width * 4 + 4] +
                1 * data[i + width * 4 - 4] + 2 * data[i + width * 4] + 1 * data[i + width * 4 + 4]
            );
            
            const magnitude = Math.min(255, Math.sqrt(gx * gx + gy * gy) * 0.5);
            
            // Enhance edges
            data[i] = clamp(data[i] + magnitude * 0.5);
            data[i + 1] = clamp(data[i + 1] + magnitude * 0.5);
            data[i + 2] = clamp(data[i + 2] + magnitude * 0.5);
        }
    }
}

function enhanceFineDetails(data, width, height) {
    // Local contrast enhancement for fine details
    for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
            const i = (y * width + x) * 4;
            
            // Calculate local average
            let rAvg = 0, gAvg = 0, bAvg = 0;
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const di = i + (dy * width + dx) * 4;
                    rAvg += data[di];
                    gAvg += data[di + 1];
                    bAvg += data[di + 2];
                }
            }
            rAvg /= 25; gAvg /= 25; bAvg /= 25;
            
            // Enhance details based on local contrast
            data[i] = clamp(data[i] + (data[i] - rAvg) * 0.3);
            data[i + 1] = clamp(data[i + 1] + (data[i + 1] - gAvg) * 0.3);
            data[i + 2] = clamp(data[i + 2] + (data[i + 2] - bAvg) * 0.3);
        }
    }
}

function applyGreenTint(data) {
    // Apply green tint for night vision effect
    for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.2;       // Reduce red
        data[i + 1] = data[i + 1] * 1.2; // Boost green
        data[i + 2] = data[i + 2] * 0.3; // Reduce blue
    }
}

function applyNoiseReduction(data, width, height, strength) {
    // Simple noise reduction using median filter
    const temp = new Uint8ClampedArray(data);
    const radius = Math.floor(strength / 2);
    
    for (let y = radius; y < height - radius; y++) {
        for (let x = radius; x < width - radius; x++) {
            const i = (y * width + x) * 4;
            
            const rValues = [], gValues = [], bValues = [];
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const di = i + (dy * width + dx) * 4;
                    rValues.push(temp[di]);
                    gValues.push(temp[di + 1]);
                    bValues.push(temp[di + 2]);
                }
            }
            
            // Get median values
            data[i] = median(rValues);
            data[i + 1] = median(gValues);
            data[i + 2] = median(bValues);
        }
    }
}

function applySkinSmoothing(data, width, height) {
    // Simple skin smoothing using bilateral filter
    for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
            const i = (y * width + x) * 4;
            
            // Check if pixel is likely skin tone
            if (isSkinTone(data[i], data[i + 1], data[i + 2])) {
                // Apply gentle blur to skin areas
                let rSum = 0, gSum = 0, bSum = 0, count = 0;
                
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const di = i + (dy * width + dx) * 4;
                        
                        // Weight by color similarity (simple bilateral filter)
                        const colorDiff = (
                            Math.abs(data[di] - data[i]) +
                            Math.abs(data[di + 1] - data[i + 1]) +
                            Math.abs(data[di + 2] - data[i + 2])
                        );
                        
                        const weight = 1 / (1 + colorDiff * 0.1);
                        
                        rSum += data[di] * weight;
                        gSum += data[di + 1] * weight;
                        bSum += data[di + 2] * weight;
                        count += weight;
                    }
                }
                
                data[i] = rSum / count;
                data[i + 1] = gSum / count;
                data[i + 2] = bSum / count;
            }
        }
    }
}

function enhanceEyes(data, width, height) {
    // Simple eye enhancement by detecting and brightening eye areas
    // This is a simplified version - real implementation would use face detection
    for (let y = 2; y < height - 2; y++) {
        for (let x = 2; x < width - 2; x++) {
            const i = (y * width + x) * 4;
            
            // Very basic eye detection (looking for dark circular areas)
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const surroundingBrightness = (
                data[i - width * 4] + data[i - width * 4 + 1] + data[i - width * 4 + 2] +
                data[i + width * 4] + data[i + width * 4 + 1] + data[i + width * 4 + 2] +
                data[i - 4] + data[i - 4 + 1] + data[i - 4 + 2] +
                data[i + 4] + data[i + 4 + 1] + data[i + 4 + 2]
            ) / 12;
            
            // If this pixel is significantly darker than surroundings, it might be an eye
            if (brightness < surroundingBrightness * 0.7) {
                // Brighten and sharpen the area
                data[i] = clamp(data[i] * 1.3);
                data[i + 1] = clamp(data[i + 1] * 1.3);
                data[i + 2] = clamp(data[i + 2] * 1.3);
                
                // Add a slight blue tint to make eyes pop
                data[i + 2] = clamp(data[i + 2] * 1.1);
            }
        }
    }
}

function adjustSkinTones(data) {
    // Warm up skin tones by adjusting color balance
    for (let i = 0; i < data.length; i += 4) {
        if (isSkinTone(data[i], data[i + 1], data[i + 2])) {
            // Increase red and yellow, decrease blue
            data[i] = clamp(data[i] * 1.05);       // More red
            data[i + 1] = clamp(data[i + 1] * 1.02); // Slightly more green
            data[i + 2] = clamp(data[i + 2] * 0.95); // Less blue
        }
    }
}

function applySelectiveSharpening(data, width, height, strength) {
    // Sharpen only edges and details, not smooth areas
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;
            
            // Calculate edge strength
            const edgeStrength = (
                Math.abs(data[i] - data[i + 4]) +
                Math.abs(data[i + 1] - data[i + 5]) +
                Math.abs(data[i + 2] - data[i + 6]) +
                Math.abs(data[i] - data[i + width * 4]) +
                Math.abs(data[i + 1] - data[i + width * 4 + 1]) +
                Math.abs(data[i + 2] - data[i + width * 4 + 2])
            ) / 6;
            
            // Only sharpen if edge strength is above threshold
            if (edgeStrength > 10) {
                const sharpenAmount = strength * (edgeStrength / 100);
                
                // Simple sharpening kernel
                data[i] = clamp(data[i] * (1 + sharpenAmount));
                data[i + 1] = clamp(data[i + 1] * (1 + sharpenAmount));
                data[i + 2] = clamp(data[i + 2] * (1 + sharpenAmount));
            }
        }
    }
}

function applyGaussianBlur(data, width, height, radius) {
    // Simple Gaussian blur implementation
    const temp = new Uint8ClampedArray(data);
    const kernel = generateGaussianKernel(radius);
    
    // Horizontal pass
    for (let y = 0; y < height; y++) {
        for (let x = radius; x < width - radius; x++) {
            const i = (y * width + x) * 4;
            
            let r = 0, g = 0, b = 0;
            for (let k = -radius; k <= radius; k++) {
                const ki = i + k * 4;
                const weight = kernel[k + radius];
                
                r += temp[ki] * weight;
                g += temp[ki + 1] * weight;
                b += temp[ki + 2] * weight;
            }
            
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }
    }
    
    // Vertical pass
    for (let y = radius; y < height - radius; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            
            let r = 0, g = 0, b = 0;
            for (let k = -radius; k <= radius; k++) {
                const ki = i + k * width * 4;
                const weight = kernel[k + radius];
                
                r += data[ki] * weight;
                g += data[ki + 1] * weight;
                b += data[ki + 2] * weight;
            }
            
            data[i] = clamp(r);
            data[i + 1] = clamp(g);
            data[i + 2] = clamp(b);
        }
    }
}

function applyBilateralFilter(data, width, height, radius) {
    // Simple bilateral filter for noise reduction while preserving edges
    const temp = new Uint8ClampedArray(data);
    
    for (let y = radius; y < height - radius; y++) {
        for (let x = radius; x < width - radius; x++) {
            const i = (y * width + x) * 4;
            
            let r = 0, g = 0, b = 0, totalWeight = 0;
            
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const di = i + (dy * width + dx) * 4;
                    
                    // Spatial weight (Gaussian)
                    const spatialDist = Math.sqrt(dx * dx + dy * dy);
                    const spatialWeight = Math.exp(-spatialDist * spatialDist / (2 * radius * radius));
                    
                    // Color similarity weight
                    const colorDist = (
                        Math.abs(temp[di] - temp[i]) +
                        Math.abs(temp[di + 1] - temp[i + 1]) +
                        Math.abs(temp[di + 2] - temp[i + 2])
                    ) / 3;
                    const colorWeight = Math.exp(-colorDist * colorDist / (50 * 50));
                    
                    const weight = spatialWeight * colorWeight;
                    
                    r += temp[di] * weight;
                    g += temp[di + 1] * weight;
                    b += temp[di + 2] * weight;
                    totalWeight += weight;
                }
            }
            
            data[i] = clamp(r / totalWeight);
            data[i + 1] = clamp(g / totalWeight);
            data[i + 2] = clamp(b / totalWeight);
        }
    }
}

// Helper functions
function generateGaussianKernel(radius) {
    const kernel = [];
    const sigma = radius / 3;
    let sum = 0;
    
    for (let i = -radius; i <= radius; i++) {
        const weight = Math.exp(-(i * i) / (2 * sigma * sigma));
        kernel.push(weight);
        sum += weight;
    }
    
    // Normalize the kernel
    return kernel.map(w => w / sum);
}

function isSkinTone(r, g, b) {
    // Simple skin tone detection
    const avg = (r + g + b) / 3;
    const rRatio = r / avg;
    const gRatio = g / avg;
    const bRatio = b / avg;
    
    return (
        rRatio > 1.1 && 
        gRatio > 0.8 && gRatio < 1.2 && 
        bRatio < 0.9 &&
        r > 60 && r < 240 &&
        g > 40 && g < 220 &&
        b > 20 && b < 200
    );
}

function median(values) {
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

function clamp(value, min = 0, max = 255) {
    return Math.min(max, Math.max(min, Math.round(value)));
}

module.exports = { enhanceImageResolution, ENHANCEMENT_MODELS };