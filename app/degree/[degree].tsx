// app/degree/[degree].tsx
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import 'react-native-gesture-handler';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export default function DegreeDetailScreen() {
    const { degree, data } = useLocalSearchParams();
    const products = data ? JSON.parse(data as string) : [];
    const [selectedProductIndex, setSelectedProductIndex] = useState(0);
    const selectedProduct = products[selectedProductIndex] || null;

    const screenWidth = Dimensions.get("window").width;
    const isMobile = screenWidth < 768;

    // Animation values for swipe
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    const handleSwipe = (direction: 'left' | 'right') => {
        if (products.length <= 1) return;

        let newIndex = selectedProductIndex;

        if (direction === 'left' && selectedProductIndex < products.length - 1) {
            newIndex = selectedProductIndex + 1;
        } else if (direction === 'right' && selectedProductIndex > 0) {
            newIndex = selectedProductIndex - 1;
        } else {
            // Reset animation if at boundaries
            Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
            return;
        }

        // Animate transition
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(translateX, {
                toValue: direction === 'left' ? -50 : 50,
                duration: 150,
                useNativeDriver: true,
            })
        ]).start(() => {
            setSelectedProductIndex(newIndex);

            // Reset and fade back in
            translateX.setValue(direction === 'left' ? 50 : -50);
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();
        });
    };

    const onGestureEvent = (event: any) => {
        const { translationX } = event.nativeEvent;
        translateX.setValue(translationX * 0.3); // Dampen the movement
    };

    const panGesture = Gesture.Pan()
        .activeOffsetX([-20, 20]) // ignore tiny movements
        .hitSlop({ left: 30, right: 30 }) // don’t trigger if swipe starts at the edge
        .onUpdate((event) => {
            const { translationX } = event;
            translateX.setValue(translationX * 0.3);
        })
        .onEnd((event) => {
            const { translationX, velocityX } = event;

            if (Math.abs(translationX) > 80 || Math.abs(velocityX) > 800) {
                if (translationX > 0) {
                    handleSwipe("right");
                } else {
                    handleSwipe("left");
                }
            } else {
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            }
        });

    // const onHandlerStateChange = (event: any) => {
    //     if (event.nativeEvent.state === State.END) {
    //         const { translationX, velocityX } = event.nativeEvent;

    //         // Determine swipe direction and threshold
    //         if (Math.abs(translationX) > 50 || Math.abs(velocityX) > 500) {
    //             if (translationX > 0) {
    //                 handleSwipe('right'); // Swipe right = previous
    //             } else {
    //                 handleSwipe('left');  // Swipe left = next
    //             }
    //         } else {
    //             // Return to original position
    //             Animated.spring(translateX, {
    //                 toValue: 0,
    //                 useNativeDriver: true,
    //             }).start();
    //         }
    //     }
    // };

    const renderProductItem = ({ item, index }: { item: any; index: number }) => (
        <TouchableOpacity
            style={[
                styles.sidebarItem,
                selectedProductIndex === index && styles.sidebarItemActive,
                isMobile && styles.sidebarItemHorizontal,
            ]}
            onPress={() => setSelectedProductIndex(index)}
        >
            <Text style={[
                styles.sidebarItemText,
                selectedProductIndex === index && styles.sidebarItemTextActive
            ]}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#2C5530" />

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{degree} Products</Text>
                </View>

                <View style={[styles.mainContent, isMobile && { flexDirection: "column" }]}>
                    {/* Product List */}
                    <View style={[styles.sidebar, isMobile && { width: "100%", borderRightWidth: 0 }]}>
                        <FlatList
                            horizontal={isMobile}
                            data={products}
                            keyExtractor={(item, index) => `${item.name}-${index}`}
                            renderItem={renderProductItem}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.sidebarList}
                        />
                    </View>

                    {/* Product Details */}
                    <View style={styles.contentArea}>
                        {selectedProduct ? (
                            <ScrollView style={styles.productDetail} showsVerticalScrollIndicator={false}>
                                <View style={styles.productTitleSection}>
                                    <Text style={styles.productTitle}>{selectedProduct.name}</Text>
                                    {products.length > 1 && (
                                        <Text style={styles.productCounter}>
                                            {selectedProductIndex + 1} of {products.length}
                                        </Text>
                                    )}
                                </View>

                                <GestureDetector gesture={panGesture}>
                                    <Animated.View
                                        style={[
                                            styles.productImageSection,
                                            {
                                                transform: [{ translateX }],
                                                opacity,
                                            }
                                        ]}
                                    >
                                        <Image
                                            source={selectedProduct.image}
                                            style={[
                                                styles.productImage,
                                                {
                                                    width: isMobile ? screenWidth * 0.9 : screenWidth * 0.5,
                                                    height: isMobile ? screenWidth * 0.9 : screenWidth * 0.5,
                                                },
                                            ]}
                                            resizeMode="contain"
                                        />

                                        {/* Swipe indicators */}
                                        {/* {products.length > 1 && (
                                            <>
                                                {selectedProductIndex > 0 && (
                                                    <TouchableOpacity
                                                        style={[styles.swipeButton, styles.swipeButtonLeft]}
                                                        onPress={() => handleSwipe('right')}
                                                    >
                                                        <Ionicons name="chevron-back" size={24} color="#2C5530" />
                                                    </TouchableOpacity>
                                                )}

                                                {selectedProductIndex < products.length - 1 && (
                                                    <TouchableOpacity
                                                        style={[styles.swipeButton, styles.swipeButtonRight]}
                                                        onPress={() => handleSwipe('left')}
                                                    >
                                                        <Ionicons name="chevron-forward" size={24} color="#2C5530" />
                                                    </TouchableOpacity>
                                                )}
                                            </>
                                        )} */}
                                    </Animated.View>
                                </GestureDetector>

                                {/* Swipe instruction text */}
                                {/* {products.length > 1 && (
                                    <View style={styles.swipeHint}>
                                        <Text style={styles.swipeHintText}>
                                            Swipe left/right or use arrows to navigate
                                        </Text>
                                    </View>
                                )} */}
                            </ScrollView>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="medical" size={48} color="#ccc" />
                                <Text style={styles.emptyText}>Select a product</Text>
                            </View>
                        )}
                    </View>
                </View>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f9fa" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2C5530",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
    },
    mainContent: { flex: 1, flexDirection: "row" },
    sidebar: {
        backgroundColor: "#FFDAB9",
        borderRightWidth: 1,
        borderRightColor: "#ddd",
    },
    sidebarList: { padding: 8 },
    sidebarItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: "#E0E0E0",
        alignItems: "center",
        justifyContent: "center",
    },
    sidebarItemHorizontal: {
        borderBottomWidth: 0,
        borderRightWidth: 0.5,
        borderRightColor: "#E0E0E0",
    },
    sidebarItemActive: { backgroundColor: "#F4B968" },
    sidebarItemText: { fontSize: 14, color: "#333", textAlign: "center" },
    sidebarItemTextActive: { fontWeight: "bold", color: "#2C5530" },
    contentArea: { flex: 1, backgroundColor: "white" },
    productDetail: { flex: 1 },
    productTitleSection: {
        padding: 16,
        backgroundColor: "white",
        alignItems: "center"
    },
    productTitle: { fontSize: 20, fontWeight: "bold", color: "#2C5530" },
    productCounter: {
        fontSize: 14,
        color: "#666",
        marginTop: 4,
        fontWeight: "500"
    },
    productImageSection: {
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        position: 'relative',
    },
    productImage: { borderRadius: 8 },
    swipeButton: {
        position: 'absolute',
        top: '50%',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    swipeButtonLeft: {
        left: 20,
        marginTop: -20,
    },
    swipeButtonRight: {
        right: 20,
        marginTop: -20,
    },
    swipeHint: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    swipeHintText: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
    emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyText: { fontSize: 16, fontWeight: "600", color: "#666", marginTop: 16 },
});