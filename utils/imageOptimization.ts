import { Image } from 'expo-image';
import { Dimensions, Platform } from 'react-native';

// Device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Image quality presets
export const IMAGE_QUALITY_PRESETS = {
    THUMBNAIL: {
        width: 150,
        height: 150,
        quality: 0.7,
        format: 'webp' as const,
    },
    MEDIUM: {
        width: 400,
        height: 400,
        quality: 0.8,
        format: 'webp' as const,
    },
    HIGH: {
        width: 800,
        height: 800,
        quality: 0.9,
        format: 'webp' as const,
    },
    FULL: {
        width: screenWidth,
        height: screenHeight,
        quality: 1.0,
        format: 'webp' as const,
    },
} as const;

// Cache policies
export const CACHE_POLICIES = {
    AGGRESSIVE: 'memory-disk' as const,
    BALANCED: 'disk' as const,
    CONSERVATIVE: 'memory' as const,
} as const;

// Priority levels
export const PRIORITY_LEVELS = {
    CRITICAL: 'high' as const,
    NORMAL: 'normal' as const,
    BACKGROUND: 'low' as const,
} as const;

// Image loading strategies
export const LOADING_STRATEGIES = {
    EAGER: 'eager' as const,
    LAZY: 'lazy' as const,
    PROGRESSIVE: 'progressive' as const,
} as const;

// Performance monitoring
export interface ImagePerformanceMetrics {
    loadTime: number;
    cacheHit: boolean;
    memoryUsage: number;
    networkRequest: boolean;
}

export class ImageOptimizer {
    private static instance: ImageOptimizer;
    private performanceMetrics: Map<string, ImagePerformanceMetrics> = new Map();
    private cacheStats = {
        hits: 0,
        misses: 0,
        total: 0,
    };

    static getInstance(): ImageOptimizer {
        if (!ImageOptimizer.instance) {
            ImageOptimizer.instance = new ImageOptimizer();
        }
        return ImageOptimizer.instance;
    }

    // Calculate optimal image dimensions based on container and device
    calculateOptimalDimensions(
        containerWidth: number,
        containerHeight: number,
        imageAspectRatio: number,
        quality: 'low' | 'medium' | 'high' = 'medium'
    ) {
        const qualityMultiplier = {
            low: 0.5,
            medium: 0.75,
            high: 1.0,
        }[quality];

        let targetWidth = containerWidth * qualityMultiplier;
        let targetHeight = containerHeight * qualityMultiplier;

        // Maintain aspect ratio
        if (imageAspectRatio > 1) {
            // Landscape image
            targetHeight = targetWidth / imageAspectRatio;
        } else {
            // Portrait image
            targetWidth = targetHeight * imageAspectRatio;
        }

        // Ensure minimum dimensions
        const minDimension = 50;
        targetWidth = Math.max(targetWidth, minDimension);
        targetHeight = Math.max(targetHeight, minDimension);

        // Round to nearest multiple of 8 for better compression
        targetWidth = Math.round(targetWidth / 8) * 8;
        targetHeight = Math.round(targetHeight / 8) * 8;

        return { width: targetWidth, height: targetHeight };
    }

    // Get optimal cache policy based on image size and usage
    getOptimalCachePolicy(
        imageSize: number,
        isFrequentlyUsed: boolean = false,
        deviceMemory: 'low' | 'medium' | 'high' = 'medium'
    ) {
        if (isFrequentlyUsed) {
            return CACHE_POLICIES.AGGRESSIVE;
        }

        if (imageSize > 1024 * 1024) { // > 1MB
            return deviceMemory === 'low' ? CACHE_POLICIES.CONSERVATIVE : CACHE_POLICIES.BALANCED;
        }

        return CACHE_POLICIES.BALANCED;
    }

    // Get optimal priority based on visibility and importance
    getOptimalPriority(
        isVisible: boolean,
        isAboveFold: boolean,
        isUserInteracting: boolean = false
    ) {
        if (isUserInteracting) return PRIORITY_LEVELS.CRITICAL;
        if (isAboveFold) return PRIORITY_LEVELS.NORMAL;
        if (isVisible) return PRIORITY_LEVELS.NORMAL;
        return PRIORITY_LEVELS.BACKGROUND;
    }

    // Preload images for better performance
    async preloadImages(
        imageSources: Array<{ uri: string; priority?: string }>,
        onProgress?: (loaded: number, total: number) => void
    ) {
        const total = imageSources.length;
        let loaded = 0;

        const preloadPromises = imageSources.map(async (source, index) => {
            try {
                await Image.prefetch(source.uri);
                loaded++;
                onProgress?.(loaded, total);
            } catch (error) {
                console.warn(`Failed to preload image ${index}:`, error);
            }
        });

        await Promise.all(preloadPromises);
        return { loaded, total };
    }

    // Clear image cache
    async clearCache(policy: 'memory' | 'disk' | 'all' = 'all') {
        try {
            if (policy === 'all' || policy === 'memory') {
                await Image.clearMemoryCache();
            }
            if (policy === 'all' || policy === 'disk') {
                await Image.clearDiskCache();
            }
            this.resetCacheStats();
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }

    // Get cache statistics
    getCacheStats() {
        return {
            ...this.cacheStats,
            hitRate: this.cacheStats.total > 0 ? this.cacheStats.hits / this.cacheStats.total : 0,
        };
    }

    // Record performance metrics
    recordPerformanceMetrics(
        imageId: string,
        metrics: Partial<ImagePerformanceMetrics>
    ) {
        const existing = this.performanceMetrics.get(imageId) || {
            loadTime: 0,
            cacheHit: false,
            memoryUsage: 0,
            networkRequest: false,
        };

        this.performanceMetrics.set(imageId, { ...existing, ...metrics });
    }

    // Get performance analytics
    getPerformanceAnalytics() {
        const metrics = Array.from(this.performanceMetrics.values());

        if (metrics.length === 0) return null;

        const avgLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length;
        const cacheHitRate = metrics.filter(m => m.cacheHit).length / metrics.length;
        const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;

        return {
            totalImages: metrics.length,
            averageLoadTime: avgLoadTime,
            cacheHitRate,
            averageMemoryUsage: avgMemoryUsage,
            networkRequests: metrics.filter(m => m.networkRequest).length,
        };
    }

    // Reset performance metrics
    resetPerformanceMetrics() {
        this.performanceMetrics.clear();
    }

    // Reset cache statistics
    private resetCacheStats() {
        this.cacheStats = { hits: 0, misses: 0, total: 0 };
    }

    // Update cache statistics
    updateCacheStats(hit: boolean) {
        this.cacheStats.total++;
        if (hit) {
            this.cacheStats.hits++;
        } else {
            this.cacheStats.misses++;
        }
    }
}

// Utility functions
export const imageUtils = {
    // Check if image is cached
    isImageCached: async (uri: string): Promise<boolean> => {
        try {
            // For expo-image, we can't directly check cache status
            // Return false to indicate we need to load the image
            return false;
        } catch {
            return false;
        }
    },

    // Get image dimensions
    getImageDimensions: async (uri: string): Promise<{ width: number; height: number } | null> => {
        try {
            // For expo-image, we can't get dimensions without loading
            // Return null and let the component handle it
            return null;
        } catch {
            return null;
        }
    },

    // Format file size
    formatFileSize: (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Check device memory capacity
    getDeviceMemoryCapacity: (): 'low' | 'medium' | 'high' => {
        if (Platform.OS === 'web') return 'medium';

        // For React Native, we can make educated guesses based on device
        if (Platform.OS === 'ios') {
            // iOS devices generally have good memory management
            return 'high';
        }

        if (Platform.OS === 'android') {
            // Android devices vary significantly
            return 'medium';
        }

        return 'medium';
    },

    // Generate placeholder color based on image hash
    generatePlaceholderColor: (imageUri: string): string => {
        let hash = 0;
        for (let i = 0; i < imageUri.length; i++) {
            const char = imageUri.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        const hue = Math.abs(hash) % 360;
        const saturation = 20 + (Math.abs(hash) % 30);
        const lightness = 85 + (Math.abs(hash) % 10);

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    },
};

// Export singleton instance
export const imageOptimizer = ImageOptimizer.getInstance();
