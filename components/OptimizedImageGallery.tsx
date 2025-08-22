import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Text,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import FastImageView from './FastImageView';

interface ImageItem {
  id: string;
  source: any;
  title?: string;
  description?: string;
}

interface OptimizedImageGalleryProps {
  images: ImageItem[];
  initialIndex?: number;
  onImagePress?: (image: ImageItem, index: number) => void;
  onClose?: () => void;
  showThumbnails?: boolean;
  showImageCounter?: boolean;
  showCloseButton?: boolean;
  backgroundColor?: string;
  imageBackgroundColor?: string;
  placeholderColor?: string;
  loadingColor?: string;
  errorColor?: string;
  thumbnailSize?: number;
  thumbnailSpacing?: number;
  enableZoom?: boolean;
  enableSwipe?: boolean;
  swipeThreshold?: number;
  swipeVelocityThreshold?: number;
  transitionDuration?: number;
  cachePolicy?: 'memory' | 'disk' | 'memory-disk';
  priority?: 'low' | 'normal' | 'high';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const OptimizedImageGallery: React.FC<OptimizedImageGalleryProps> = ({
  images,
  initialIndex = 0,
  onImagePress,
  onClose,
  showThumbnails = true,
  showImageCounter = true,
  showCloseButton = true,
  backgroundColor = '#000',
  imageBackgroundColor = '#000',
  placeholderColor = '#333',
  loadingColor = '#007AFF',
  errorColor = '#FF3B30',
  thumbnailSize = 60,
  thumbnailSpacing = 8,
  enableZoom = true,
  enableSwipe = true,
  swipeThreshold = 80,
  swipeVelocityThreshold = 800,
  transitionDuration = 300,
  cachePolicy = 'memory-disk',
  priority = 'high',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Memoize the current image
  const currentImage = useMemo(() => images[currentIndex], [images, currentIndex]);

  // Memoize the thumbnail data
  const thumbnailData = useMemo(() => 
    images.map((image, index) => ({
      ...image,
      index,
      isActive: index === currentIndex,
    })), [images, currentIndex]
  );

  const handleImagePress = useCallback(() => {
    if (onImagePress) {
      onImagePress(currentImage, currentIndex);
    }
  }, [onImagePress, currentImage, currentIndex]);

  const handleClose = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: transitionDuration,
      useNativeDriver: true,
    }).start(() => {
      onClose?.();
    });
  }, [fadeAnim, transitionDuration, onClose]);

  const handleThumbnailPress = useCallback((index: number) => {
    setCurrentIndex(index);
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  }, []);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (!enableSwipe) return;

    let newIndex = currentIndex;
    if (direction === 'left' && currentIndex < images.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'right' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      flatListRef.current?.scrollToIndex({
        index: newIndex,
        animated: true,
      });
    }
  }, [currentIndex, images.length, enableSwipe]);

  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  }, [currentIndex]);

  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }), []);

  const renderImageItem = useCallback(({ item, index }: { item: ImageItem; index: number }) => (
    <View style={styles.imageContainer}>
      <FastImageView
        source={item.source}
        style={styles.fullImage}
        contentFit="contain"
        cachePolicy={cachePolicy}
        priority={priority}
        placeholder={require('../assets/images/placeholder.png')}
        fallback={require('../assets/images/error.png')}
        onPress={handleImagePress}
        showLoadingIndicator={true}
        showErrorFallback={true}
        accessibilityLabel={item.title || `Image ${index + 1}`}
        accessibilityHint="Double tap to zoom or view details"
      />
      {item.title && (
        <View style={styles.imageInfo}>
          <Text style={styles.imageTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.imageDescription}>{item.description}</Text>
          )}
        </View>
      )}
    </View>
  ), [handleImagePress, cachePolicy, priority]);

  const renderThumbnail = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.thumbnailContainer,
        { width: thumbnailSize, height: thumbnailSize },
        item.isActive && styles.activeThumbnail,
      ]}
      onPress={() => handleThumbnailPress(item.index)}
      activeOpacity={0.7}
    >
      <FastImageView
        source={item.source}
        style={styles.thumbnail}
        contentFit="cover"
        cachePolicy={cachePolicy}
        priority="low"
        transition={200}
        accessibilityLabel={`Thumbnail ${item.index + 1}`}
        accessibilityHint="Tap to view this image"
      />
      {item.isActive && (
        <View style={styles.activeIndicator}>
          <Ionicons name="checkmark-circle" size={16} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  ), [handleThumbnailPress, thumbnailSize, cachePolicy]);

  const renderHeader = () => (
    <View style={styles.header}>
      {showCloseButton && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <BlurView intensity={80} style={styles.closeButtonBlur}>
            <Ionicons name="close" size={24} color="#fff" />
          </BlurView>
        </TouchableOpacity>
      )}
      
      {showImageCounter && (
        <View style={styles.counterContainer}>
          <BlurView intensity={80} style={styles.counterBlur}>
            <Text style={styles.counterText}>
              {currentIndex + 1} of {images.length}
            </Text>
          </BlurView>
        </View>
      )}
    </View>
  );

  const renderThumbnails = () => {
    if (!showThumbnails || images.length <= 1) return null;

    return (
      <View style={styles.thumbnailsContainer}>
        <FlatList
          data={thumbnailData}
          renderItem={renderThumbnail}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailsList}
          ItemSeparatorComponent={() => <View style={{ width: thumbnailSpacing }} />}
        />
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      
      {renderHeader()}
      
      <View style={styles.mainContent}>
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderImageItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialScrollIndex={initialIndex}
          getItemLayout={(data, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
        />
      </View>
      
      {renderThumbnails()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  closeButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  counterContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  counterBlur: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  counterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
  },
  imageContainer: {
    width: screenWidth,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  imageInfo: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  imageTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  imageDescription: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  thumbnailsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  thumbnailsList: {
    alignItems: 'center',
  },
  thumbnailContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#007AFF',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OptimizedImageGallery;
