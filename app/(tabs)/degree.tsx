// //app/(tabs)/degree.tsx
// import { AnimatedTabView } from '@/components/ui/AnimatedTabView';
// import { useNavigation } from '@react-navigation/native';
// import { useRouter } from 'expo-router';
// import {
//   Dimensions,
//   FlatList,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// const degrees = ['BDS', 'DERMA', 'GYNAC', 'MD', 'ORTHO', 'PED'];

// export default function DegreeScreen() {
//   const navigation = useNavigation();
//   const router = useRouter();
//   const numColumns = 2;
//   const screenWidth = Dimensions.get('window').width;
//   const cardSize = (screenWidth - 48) / numColumns;

//   return (
//     <AnimatedTabView>
//       <View style={styles.container}>
//         <FlatList
//           data={degrees}
//           keyExtractor={(item) => item}
//           numColumns={numColumns}
//           contentContainerStyle={styles.list}
//           columnWrapperStyle={{ gap: 16 }}
//           ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
//           renderItem={({ item }) => (
//             <TouchableOpacity
//               onPress={() => router.push(`/degree/${item}`)}
//               style={[styles.card, { width: cardSize, height: cardSize }]}
//             >
//               <Text style={styles.text}>{item}</Text>
//             </TouchableOpacity>
//           )}
//         />
//       </View>
//     </AnimatedTabView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     padding: 16,
//   },
//   list: {
//     paddingBottom: 32,
//   },
//   card: {
//     backgroundColor: '#FFDAB9',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 10,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOpacity: 0.1,
//     shadowOffset: { width: 0, height: 2 },
//     shadowRadius: 4,
//   },
//   text: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//   },
// });

import { AnimatedTabView } from "@/components/ui/AnimatedTabView";
import { degreeData } from "@/constants/degreeData"; // <-- import the data
import { useRouter } from "expo-router";
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DegreeScreen() {
    const router = useRouter();
    const numColumns = 2;
    const screenWidth = Dimensions.get("window").width;
    const cardSize = (screenWidth - 48) / numColumns;

    return (
        <AnimatedTabView>
            <View style={styles.container}>
                <FlatList
                    data={degreeData}
                    keyExtractor={(item) => item.degree_name}
                    numColumns={numColumns}
                    contentContainerStyle={styles.list}
                    columnWrapperStyle={{gap: 16}}
                    ItemSeparatorComponent={() => <View style={{height: 16}} />}
                    renderItem={({item}) => (
                            <TouchableOpacity
                                onPress={() =>
                                    router.push({
                                        pathname: `/degree/${item.degree_name}`,
                                        params: {data: JSON.stringify(item.product)},
                                    })
                                }
                                style={[styles.card, {width: cardSize, height: cardSize}]}
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
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 4,
    },
    text: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
});
