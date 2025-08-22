import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import { CACHE_POLICIES, IMAGE_QUALITY_PRESETS, imageOptimizer, PRIORITY_LEVELS } from '../utils/imageOptimization';

interface UseImageOptimizationOptions {
    enablePreloading?: boolean;
    enablePerformanceMonitoring?: boolean;
    defaultCachePolicy?: 'memory' | 'disk' | 'memory-disk';
    defaultPriority?: 'low' | 'normal' | 'high';
    preloadThreshold?: number;
    memoryThreshold?: number;
}

interface ImageLoadState {
    isLoading: boolean;
    isLoaded: boolean;
    hasError: boolean;
    loadTime?: number;
    cacheHit?: boolean;
    dimensions?: { width: number; height: number };
}

interface ImageOptimizationState {
    images: Map<string, ImageLoadState>;
    preloadedImages: Set<string>;
    cacheStats: {
        hits: number;
        misses: number;
        total: number;
        hitRate: number;
    };
    performanceMetrics: {
        averageLoadTime: number;
        totalImages: number;
        networkRequests: number;
    };
}

export const useImageOptimization = (options: UseImageOptimizationOptions = {}) => {
    const {
        enablePreloading = true,
        enablePerformanceMonitoring = true,
        defaultCachePolicy = CACHE_POLICIES.BALANCED,
        defaultPriority = PRIORITY_LEVELS.NORMAL,
        preloadThreshold = 3,
        memoryThreshold = 100 * 1024 * 1024, // 100MB
    } = options;

    const [state, setState] = useState<ImageOptimizationState>({
        images: new Map(),
        preloadedImages: new Set(),
        cacheStats: { hits: 0, misses: 0, total: 0, hitRate: 0 },
        performanceMetrics: { averageLoadTime: 0, totalImages: 0, networkRequests: 0 },
    });

    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const preloadQueue = useRef<Array<{ uri: string; priority: string }>>([]);
    const isPreloading = useRef(false);

    // Update cache statistics
    const updateCacheStats = useCallback(() => {
        const stats = imageOptimizer.getCacheStats();
        setState(prev => ({
            ...prev,
            cacheStats: stats,
        }));
    }, []);

    // Update performance metrics
    const updatePerformanceMetrics = useCallback(() => {
        const metrics = imageOptimizer.getPerformanceAnalytics();
        if (metrics) {
            setState(prev => ({
                ...prev,
                performanceMetrics: {
                    averageLoadTime: metrics.averageLoadTime,
                    totalImages: metrics.totalImages,
                    networkRequests: metrics.networkRequests,
                },
            }));
        }
    }, []);

    // Initialize image state
    const initializeImage = useCallback((imageId: string) => {
        setState(prev => {
            const newImages = new Map(prev.images);
            newImages.set(imageId, {
                isLoading: false,
                isLoaded: false,
                hasError: false,
            });
            return { ...prev, images: newImages };
        });
    }, []);

    // Update image state
    const updateImageState = useCallback((
        imageId: string,
        updates: Partial<ImageLoadState>
    ) => {
        setState(prev => {
            const newImages = new Map(prev.images);
            const currentState = newImages.get(imageId) || {
                isLoading: false,
                isLoaded: false,
                hasError: false,
            };

            newImages.set(imageId, { ...currentState, ...updates });
            return { ...prev, images: newImages };
        });
    }, []);

    // Load image with optimization
    const loadImage = useCallback(async (
        imageId: string,
        source: any,
        options: {
            cachePolicy?: 'memory' | 'disk' | 'memory-disk';
            priority?: 'low' | 'normal' | 'high';
            quality?: 'low' | 'medium' | 'high';
            onLoad?: () => void;
            onError?: (error: any) => void;
        } = {}
    ) => {
        const {
            cachePolicy = defaultCachePolicy,
            priority = defaultPriority,
            quality = 'medium',
            onLoad,
            onError,
        } = options;

        // Initialize image state if not exists
        if (!state.images.has(imageId)) {
            initializeImage(imageId);
        }

        const startTime = Date.now();
        updateImageState(imageId, { isLoading: true, hasError: false });

        try {
            // For expo-image, we can't directly check cache status
            // Assume not cached and update stats accordingly
            const isCached = false;
            imageOptimizer.updateCacheStats(false);
            updateCacheStats();

            // Get optimal dimensions based on quality
            const qualityPreset = IMAGE_QUALITY_PRESETS[quality.toUpperCase() as keyof typeof IMAGE_QUALITY_PRESETS];
            const optimalDimensions = imageOptimizer.calculateOptimalDimensions(
                screenWidth,
                screenHeight,
                1, // Default aspect ratio, will be updated when image loads
                quality
            );

            // Record performance metrics
            if (enablePerformanceMonitoring) {
                const loadTime = Date.now() - startTime;
                imageOptimizer.recordPerformanceMetrics(imageId, {
                    loadTime,
                    cacheHit: isCached,
                    memoryUsage: optimalDimensions.width * optimalDimensions.height * 4, // Approximate memory usage
                    networkRequest: !isCached,
                });
                updatePerformanceMetrics();
            }

            // Update image state
            updateImageState(imageId, {
                isLoading: false,
                isLoaded: true,
                loadTime: Date.now() - startTime,
                cacheHit: isCached,
                dimensions: optimalDimensions,
            });

            onLoad?.();
        } catch (error) {
            updateImageState(imageId, {
                isLoading: false,
                hasError: true,
            });
            onError?.(error);
        }
    }, [state.images, defaultCachePolicy, defaultPriority, enablePerformanceMonitoring, screenWidth, screenHeight, initializeImage, updateImageState, updateCacheStats, updatePerformanceMetrics]);

    // Preload images
    const preloadImages = useCallback(async (
        imageSources: Array<{ uri: string; priority?: string }>,
        onProgress?: (loaded: number, total: number) => void
    ) => {
        if (!enablePreloading || isPreloading.current) return;

        isPreloading.current = true;

        try {
            const result = await imageOptimizer.preloadImages(imageSources, onProgress);

            // Update preloaded images set
            setState(prev => {
                const newPreloadedImages = new Set(prev.preloadedImages);
                imageSources.forEach(source => newPreloadedImages.add(source.uri));
                return { ...prev, preloadedImages: newPreloadedImages };
            });

            return result;
        } finally {
            isPreloading.current = false;
        }
    }, [enablePreloading]);

    // Queue image for preloading
    const queuePreload = useCallback((uri: string, priority: string = 'low') => {
        preloadQueue.current.push({ uri, priority });

        // Process queue if not currently preloading
        if (!isPreloading.current && preloadQueue.current.length > 0) {
            const batch = preloadQueue.current.splice(0, preloadThreshold);
            preloadImages(batch);
        }
    }, [preloadThreshold, preloadImages]);

    // Get optimal cache policy for image
    const getOptimalCachePolicy = useCallback((
        imageSize: number,
        isFrequentlyUsed: boolean = false
    ) => {
        const deviceMemory = imageOptimizer.getDeviceMemoryCapacity();
        return imageOptimizer.getOptimalCachePolicy(imageSize, isFrequentlyUsed, deviceMemory);
    }, []);

    // Get optimal priority for image
    const getOptimalPriority = useCallback((
        isVisible: boolean,
        isAboveFold: boolean,
        isUserInteracting: boolean = false
    ) => {
        return imageOptimizer.getOptimalPriority(isVisible, isAboveFold, isUserInteracting);
    }, []);

    // Clear cache
    const clearCache = useCallback(async (policy: 'memory' | 'disk' | 'all' = 'all') => {
        await imageOptimizer.clearCache(policy);
        updateCacheStats();

        // Reset image states
        setState(prev => {
            const newImages = new Map();
            prev.images.forEach((imageState, imageId) => {
                newImages.set(imageId, {
                    ...imageState,
                    isLoaded: false,
                    isLoading: false,
                });
            });
            return { ...prev, images: newImages };
        });
    }, [updateCacheStats]);

    // Reset performance metrics
    const resetPerformanceMetrics = useCallback(() => {
        imageOptimizer.resetPerformanceMetrics();
        updatePerformanceMetrics();
    }, [updatePerformanceMetrics]);

    // Get image state
    const getImageState = useCallback((imageId: string): ImageLoadState | undefined => {
        return state.images.get(imageId);
    }, [state.images]);

    // Check if image is preloaded
    const isImagePreloaded = useCallback((uri: string): boolean => {
        return state.preloadedImages.has(uri);
    }, [state.preloadedImages]);

    // Memoized values
    const memoizedState = useMemo(() => state, [state]);
    const memoizedCacheStats = useMemo(() => state.cacheStats, [state.cacheStats]);
    const memoizedPerformanceMetrics = useMemo(() => state.performanceMetrics, [state.performanceMetrics]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            // Cleanup any pending preload operations
            preloadQueue.current = [];
            isPreloading.current = false;
        };
    }, []);

    return {
        // State
        images: memoizedState.images,
        preloadedImages: memoizedState.preloadedImages,
        cacheStats: memoizedCacheStats,
        performanceMetrics: memoizedPerformanceMetrics,

        // Actions
        loadImage,
        preloadImages,
        queuePreload,
        clearCache,
        resetPerformanceMetrics,

        // Utilities
        getImageState,
        isImagePreloaded,
        getOptimalCachePolicy,
        getOptimalPriority,

        // State updaters
        updateImageState,
        initializeImage,
    };
};

export default useImageOptimization;
