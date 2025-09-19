//app/(tabs)/degree.tsx
import { AnimatedTabView } from "@/components/ui/AnimatedTabView";
import { degreeData } from "@/constants/degreeData"; // <-- import the data
import { useRouter } from "expo-router";
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DegreeScreen() {
    const router = useRouter();
    const numColumns = 3;
    const screenWidth = Dimensions.get("window").width;
    const cardSize = (screenWidth - 16 * (numColumns + 2.5)) / numColumns; // Adjust for padding and gaps

    return (
        <AnimatedTabView>
            <View style={styles.container}>
                <FlatList
                    data={degreeData}
                    keyExtractor={(item) => item.degree_name}
                    numColumns={numColumns}
                    contentContainerStyle={styles.list}
                    columnWrapperStyle={{ gap: 16 }}
                    ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() =>
                                router.push({
                                    pathname: `/degree/${item.degree_name}`,
                                    params: { data: JSON.stringify(item.product) },
                                })
                            }
                            style={[styles.card, { width: cardSize, height: cardSize }]}
                        >
                            <Text style={styles.text}>{item.degree_name}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </AnimatedTabView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
    },
    list: {
        paddingBottom: 32,
    },
    card: {
        backgroundColor: "#FFDAB9",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    text: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
});
