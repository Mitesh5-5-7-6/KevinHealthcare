import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Image, ImageStyle } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface FastImageViewProps {
  source: any;
  style?: ImageStyle;
  resizeMode?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: any;
  fallback?: any;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onPress?: () => void;
  showLoadingIndicator?: boolean;
  showErrorFallback?: boolean;
  cachePolicy?: 'memory' | 'disk' | 'memory-disk';
  priority?: 'low' | 'normal' | 'high';
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  transition?: number;
  placeholderContentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  recyclingKey?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const FastImageView: React.FC<FastImageViewProps> = ({
  source,
  style,
  resizeMode = 'cover',
  placeholder,
  fallback,
  onLoad,
  onError,
  onPress,
  showLoadingIndicator = true,
  showErrorFallback = true,
  cachePolicy = 'memory-disk',
  priority = 'normal',
  contentFit,
  transition = 300,
  placeholderContentFit = 'cover',
  recyclingKey,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Memoize the image source to prevent unnecessary re-renders
  const memoizedSource = useMemo(() => {
    if (typeof source === 'string') {
      return { uri: source };
    }
    return source;
  }, [source]);

  // Memoize the placeholder source
  const memoizedPlaceholder = useMemo(() => {
    if (placeholder) {
      if (typeof placeholder === 'string') {
        return { uri: placeholder };
      }
      return placeholder;
    }
    return null;
  }, [placeholder]);

  // Memoize the fallback source
  const memoizedFallback = useMemo(() => {
    if (fallback) {
      if (typeof fallback === 'string') {
        return { uri: fallback };
      }
      return fallback;
    }
    return null;
  }, [fallback]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((error: any) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  }, [onError]);

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  // Determine which source to use
  const currentSource = hasError && memoizedFallback ? memoizedFallback : memoizedSource;

  // Determine content fit
  const finalContentFit = contentFit || resizeMode;

  const renderContent = () => {
    if (hasError && !memoizedFallback) {
      return (
        <View style={[styles.errorContainer, style]}>
          <Ionicons name="image-outline" size={32} color="#ccc" />
          <Text style={styles.errorText}>Failed to load image</Text>
        </View>
      );
    }

    return (
      <Image
        source={currentSource}
        style={[styles.image, style]}
        contentFit={finalContentFit}
        placeholder={memoizedPlaceholder}
        placeholderContentFit={placeholderContentFit}
        transition={transition}
        cachePolicy={cachePolicy}
        priority={priority}
        recyclingKey={recyclingKey}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  };

  const renderLoadingIndicator = () => {
    if (!showLoadingIndicator || !isLoading || imageLoaded) {
      return null;
    }

    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  };

  const renderPlaceholder = () => {
    if (!memoizedPlaceholder || imageLoaded || hasError) {
      return null;
    }

    return (
      <View style={[styles.placeholderContainer, style]}>
        <Image
          source={memoizedPlaceholder}
          style={styles.placeholderImage}
          contentFit={placeholderContentFit}
          transition={0}
        />
        <BlurView intensity={20} style={styles.placeholderBlur} />
      </View>
    );
  };

  const content = (
    <View style={styles.container}>
      {renderPlaceholder()}
      {renderContent()}
      {renderLoadingIndicator()}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  touchable: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 2,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    minHeight: 100,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default FastImageView;
