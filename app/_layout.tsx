import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect , useState , useRef , useCallback } from 'react';
import 'react-native-reanimated';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import { BlurView} from 'expo-blur';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ImageBackground, Pressable, Alert, View , Text , StyleSheet, Dimensions, Image, TouchableOpacity, Animated , Linking, ActivityIndicator, Modal} from 'react-native';

import Config from '../googleApiConfig';

import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Feather from '@expo/vector-icons/Feather';
import Octicons from '@expo/vector-icons/Octicons';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const markerAnim = useRef([] as Animated.Value[]).current;
  const [images, setImages] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [serviceType, setServiceType] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTwoVisible, setModalTwoVisible] = useState(false);
  const [modalThreeVisible, setModalThreeVisible] = useState(false);
  const [neareastPlace, setNearestPlace] = useState<any | null>(null);
  const [mapType, setMaptype] = useState<'standard' | 'hybrid' | 'satellite' | 'terrain'>('standard');
  const [markerIcon, setMarkerIcon] = useState(require('../assets/images/hospital.png'));

  const makeCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  }

  const changeMapType = (type: 'standard' | 'hybrid' | 'satellite' | 'terrain') => {
    setMaptype(type);
    setModalThreeVisible(false);
  };

  const handleMyLocationPress = useCallback(() => {
    console.log(location);
    if(location && mapRef.current) {     
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0002,
        longitudeDelta: 0.0021,
      }, 1200)
    }
  }, [location, mapRef]);

  const fetchPlaces = async (type: string, image: any, name: string, mode: string) => {
    if(mode === 'selection') {
      setModalVisible(!modalVisible);
    }
    if(!location) return;
    setServiceType(name);
    setLoading(true);
    setMarkerIcon(markerIcon);
    try {
      const response = await axios.get(Config.GOOGLE_NEARBY_SEARCH, {
        params: {
          location: `${location?.coords.latitude},${location?.coords.longitude}`,
          radius: 10000,
          type: type,
          key: Config.GOOGLE_API_KEY
        }
      });

      // changeMarkerIcon(require(`${image}`));
  
      console.log("Mode: ", markerIcon)
      await fetchNearestPlace(response.data.results);

      if(mode === 'selection' && response.data.results.length > 0) {
        setModalTwoVisible(true);
      }

      const updatedMarkers = response.data.results.map((place: any) => ({
        ...place,
        icon: image, // ✅ Assign a unique icon to each place
      }));
      
  
      console.log(image)
      setImages(image);
      setMarkers(updatedMarkers);
    } catch (error) {
      console.log("Error fetching places: ", error);
    } finally {
      setLoading(false);
    }
    // if(neareastPlace) {
    //   // response.data.results.forEach((place: any) => {
    //   //   console.log("Name: ", place.name)
        
    //   // })
      
    //   // Clear the previous animations
    //   // markerAnim.length = 0;

    //   // // Reinitialize marker animations
    //   // response.data.results.forEach(() => markerAnim.push(new Animated.Value(0)));
      
    //   // setTimeout(() =>  animatedMarker(), 100);
    //   // fetchNearestPlace();
     

    // }
  
  } 

  // useEffect(() => {
  //   if(markers.length > 0) {
  //     fetchNearestPlace();
  //   }
  // }, [markers]);

  const fetchNearestPlace = async (places : any) => {
    if(!location || places.length === 0 ) return;
    try {
      const distancePromises = places.map(async (place: any) => {
        const { lat, lng } = place.geometry.location;
  
        const { data } = await axios.get(Config.GOOGLE_DIRECTION, {
          params: {
            origin: `${location?.coords.latitude},${location?.coords.longitude}`,
            destination: `${lat},${lng}`,
            key: Config.GOOGLE_API_KEY,
          },
        });
  
        const route = data.routes[0];
        
        
        return {
          name: place.name,
          distance: route?.legs[0]?.distance.value, // Distance in meters
          distanceText: route?.legs[0]?.distance.text,
          duration: route?.legs[0]?.duration.text,
          location: place.geometry.location,
        };
      });
  
      const results = await Promise.all(distancePromises);
  
      // Get the place with the shortest distance
      const nearestPlace = results.reduce((prev, curr) => (prev.distance < curr.distance ? prev : curr));
  
      
  
      // Optionally move the map to this location
      mapRef.current?.animateToRegion({
        latitude: nearestPlace.location.lat,
        longitude: nearestPlace.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);

      setNearestPlace(nearestPlace);
      console.log("🚀 Nearest Place:", nearestPlace.name);
  
    } catch (error) {
      console.error("Error fetching distances:", error);
    }
  };

  // const animatedMarker = () => {
  //   Animated.stagger(150,
  //     markerAnim.map((anim) => 
  //       Animated.timing(anim, {
  //         toValue: 1,
  //         duration: 1000,
  //         useNativeDriver: true
  //       })
  //     )
  //   ).start();
  // };

  useEffect(() => {
    async function getCurrentLocation() {
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    }

    getCurrentLocation();
  }, []);

  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  


  return (
    <SafeAreaProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack> */}
      {loading && (
        <View style={styles.loadingContainer}>
          <BlurView intensity={120} tint='dark' style={styles.blurContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Searching Nearest {serviceType}...</Text>
          </BlurView>
        </View>
      )}

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            Alert.alert('Modal has been closed.');
            setModalVisible(!modalVisible);
          }}>
            <BlurView intensity={120} tint='dark' style={styles.blurContainer}>
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Select a service</Text>
                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => fetchPlaces('hospital', require('../assets/images/hospital.png') , 'Hospital', 'selection')}>
                  <View>
                    <FontAwesome5 name="hospital-user" size={18} color="white" />
                  </View>
                  <Text style={styles.textStyle}>
                    Hospital
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => fetchPlaces('police', require('../assets/images/police-station.png'), 'Police Station', 'selection')}>
                  <View>
                  <MaterialCommunityIcons name="police-badge" size={24} color="white" />
                  </View>
                  <Text style={styles.textStyle}>
                    Police Station
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => fetchPlaces('fire_station', require('../assets/images/fire-station.png'), 'Fire Station', 'selection')}>
                  <View>
                  <FontAwesome6 name="fire" size={24} color="white" />
                  </View>
                  <Text style={styles.textStyle}>
                    Fire Station
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.buttonCloseCancel]}
                  onPress={() => setModalVisible(!modalVisible)}>
                  {/* <View>
                  <FontAwesome6 name="fire" size={24} color="white" />
                  </View> */}
                  <Text style={styles.textStyle}>
                    Cancel
                  </Text>
                </Pressable>

                
              </View>
            </View>
          </BlurView>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalTwoVisible}
          onRequestClose={() => {
            Alert.alert('Modal has been closed.');
            setModalTwoVisible(!modalTwoVisible);
          }}>
            <BlurView intensity={120} tint='dark' style={styles.blurContainer}>
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Nearest Service Center</Text>
                
                <View>
                  {neareastPlace && (
                    <View style={{width: width * 0.8, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                      <Text style={styles.nearestDetails}>{neareastPlace.name}</Text>
                      <Text style={styles.nearestDetails}>{neareastPlace.distanceText}</Text>
                      <Text style={styles.nearestDetails}>{neareastPlace.duration}</Text>
                    </View>
                  )}
                </View>

                <Pressable
                  style={[styles.button, styles.buttonCloseCall]}
                  onPress={() => makeCall('911')}>
                  <View>
                  <Feather name="phone-call" size={24} color="white" />
                  </View>
                  <Text style={styles.textStyle}>
                    Call Now
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.button, styles.buttonCloseCancel]}
                  onPress={() => setModalTwoVisible(!modalTwoVisible)}>
                  {/* <View>
                  <FontAwesome6 name="fire" size={24} color="white" />
                  </View> */}
                  <Text style={styles.textStyle}>
                    Cancel
                  </Text>
                </Pressable>

                
              </View>
            </View>
          </BlurView>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalThreeVisible}
          onRequestClose={() => {
            Alert.alert('Modal has been closed.');
            setModalThreeVisible(!modalThreeVisible);
          }}>
            <BlurView intensity={120} tint='dark' style={styles.blurContainer}>
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Select a Layer</Text>
                
                <View>
                  {neareastPlace && (
                    <View style={{width: width * 0.8, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                      <Text style={styles.nearestDetails}>{neareastPlace.name}</Text>
                      <Text style={styles.nearestDetails}>{neareastPlace.distanceText}</Text>
                    </View>
                  )}
                </View>

               
               
                <ImageBackground
                  source={require('../assets/images/hybrid.jpg')}
                  resizeMode='cover'
                  style={styles.imageBackgroundLayer}
                >       
                <BlurView intensity={80} tint='dark'>   
                <Pressable
                  style={[styles.buttonLayer, styles.mapsLayerHybrid]}
                  onPress={() => changeMapType('hybrid')}>
                  <View>
                  <Entypo name="map" size={24} color="white" />
                  </View>
                  <Text style={styles.textStyle}>
                    Hybrid
                  </Text>
                </Pressable>
                </BlurView>
                </ImageBackground>

                <ImageBackground
                  source={require('../assets/images/normal.jpg')}
                  resizeMode='cover'
                  style={styles.imageBackgroundLayer}
                >       
                <BlurView intensity={80} tint='dark'>   
                <Pressable
                  style={[styles.buttonLayer, styles.mapsLayerHybrid]}
                  onPress={() => changeMapType('standard')}>
                  <View>
                  <Octicons name="screen-normal" size={24} color="white" />
                  </View>
                  <Text style={styles.textStyle}>
                    Normal
                  </Text>
                </Pressable>
                </BlurView>
                </ImageBackground>

                <ImageBackground
                  source={require('../assets/images/satellite.webp')}
                  resizeMode='cover'
                  style={styles.imageBackgroundLayer}
                >       
                <BlurView intensity={80} tint='dark'>   
                <Pressable
                  style={[styles.buttonLayer, styles.mapsLayerHybrid]}
                  onPress={() => changeMapType('satellite')}>
                  <View>
                  <MaterialIcons name="satellite-alt" size={24} color="white" />
                  </View>
                  <Text style={styles.textStyle}>
                    Satellite
                  </Text>
                </Pressable>
                </BlurView>
                </ImageBackground>

                <ImageBackground
                  source={require('../assets/images/terrain.png')}
                  resizeMode='cover'
                  style={styles.imageBackgroundLayer}
                >       
                <BlurView intensity={80} tint='dark'>   
                <Pressable
                  style={[styles.buttonLayer, styles.mapsLayerHybrid]}
                  onPress={() => changeMapType('terrain')}>
                  <View>
                  <MaterialIcons name="terrain" size={24} color="white" />
                  </View>
                  <Text style={styles.textStyle}>
                    Terrain
                  </Text>
                </Pressable>
                </BlurView>
                </ImageBackground>
                

                
              
                

                <Pressable
                  style={[styles.button, styles.buttonCloseCancel]}
                  onPress={() => setModalThreeVisible(!modalThreeVisible)}>
                  {/* <View>
                  <FontAwesome6 name="fire" size={24} color="white" />
                  </View> */}
                  <Text style={styles.textStyle}>
                    Cancel
                  </Text>
                </Pressable>

                
              </View>
            </View>
          </BlurView>
        </Modal>
          
      <View style={styles.container}>
   
        <View style={{width: width, position: 'absolute', zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: height * 0.1}}>
          <Image
          style={{width: 100, height: 100}}
          source={require('../assets/images/fart_logo.png')}
          />
          </View>
        <MapView 
        provider='google'
        style={styles.map}
        initialRegion={{
          latitude: location?.coords.latitude || 9.3164356,
          longitude: location?.coords.longitude || 123.3042132,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsBuildings={true}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsTraffic
        showsCompass
        showsPointsOfInterest
        loadingEnabled={true}
        ref={mapRef} 
        mapType={mapType}
        // camera={{
        //   center: { latitude: 37.7749, longitude: -122.4194 },
        //   pitch: 45, // Tilt for 3D effect
        //   heading: 0,
        //   altitude: 500,
        //   zoom: 15,
        // }}
        >
          {markers.map((place, index) => (

              
              <Marker 
                coordinate={{
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                }}
                key={index}
                title={place.name}
                description={place.vicinity}
                image={place.icon}
               
              >
                {/* <Animated.View 
                  style={{ transform: [{ scale: markerAnim[index] ? markerAnim[index] : new Animated.Value(1)}]}}>
                </Animated.View> */}
              </Marker>
              
          ))}
        </MapView>
        <View>
          
        </View>
        <View style={styles.cover}>
          <View>
            <TouchableOpacity style={styles.midButton} onPress={() => fetchPlaces('hospital', require('../assets/images/hospital.png') , 'Hospital', 'sideButton')}>
              <FontAwesome5 name="hospital-user" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.midButton} onPress={() => fetchPlaces('police', require('../assets/images/police-station.png'), 'Police Station', 'sideButton')}>
            <MaterialCommunityIcons name="police-badge" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.midButton} onPress={() => fetchPlaces('fire_station', require('../assets/images/fire-station.png'), 'Fire Station', 'sideButton')}>
            <FontAwesome6 name="fire" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.middleCover}>
            {/* <TouchableOpacity style={styles.midButtonCover}>
            <Feather name="search" size={24} color="white" />
            </TouchableOpacity> */}
            <TouchableOpacity style={styles.midButtonCover} onPress={() => setModalThreeVisible(true)}>
            <Feather name="layers" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.midButtonCover} onPress={handleMyLocationPress}>
            <FontAwesome6 name="location-crosshairs" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.lowerCover}>
            <TouchableOpacity style={styles.lowerCoverContainer} onPress={() => setModalVisible(true)}>
              <View style={styles.lowerButtonCover}>
              {/* <Feather name="phone-call" size={50} color="white" /> */}
              <Text style={{ color: 'white', fontSize: 53, fontWeight: '500' }}>SOS</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        
        
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },

  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99
  },
  
  container: {
    flex: 1,
    display: 'flex',
    height: height
  },

  map: {
    flex: 1,
  },

  cover: {
    // height: height * 0.27 ,
    backgroundColor: 'transparent',
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    width: width * 0.2,
    height: height * 0.3,
    marginTop: height * 0.3,
  }, 

  midButton: {
    backgroundColor: '#7878fa',
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 20,
    width: width * 0.2,
    borderTopEndRadius: 20,
    borderBottomEndRadius: 20,
    marginBottom: 10,
    elevation: 10,
  }, 

  middleCover: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    width: width * 1.8,
    // backgroundColor: 'red'
  },

  midButtonCover: {
    backgroundColor: '#7878fa',
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 20,
    width: width * 0.13,
    borderTopStartRadius: 20,
    borderBottomStartRadius: 20,
    marginBottom: 10,
    elevation: 10,
  }, 

  lowerCover: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 2,
    // backgroundColor: 'red',
    height: height * 0.3
  },

  lowerCoverContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
    padding: 80,
    marginLeft: width * 0.8,
    borderRadius: 110,
    elevation: 10,
  },

  lowerButtonCover: {
    position: 'absolute'
  },

  // TEMPORARY CSS FOR MODAL

  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: width * 0.9,
  },
  button: {
    borderRadius: 2,
    padding: 10,
    elevation: 2,
    width: width * 0.8,
    marginTop: 20,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // flexDirection: 'row',
  },
  buttonCloseCancel: {
    backgroundColor: '#e86056',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // flexDirection: 'row',
  },

  buttonCloseCall: {
    backgroundColor: '#37915e',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // flexDirection: 'row',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 22,
    color: 'red'
  },

  nearestDetails: {
    fontSize: 15,
  },

  buttonLayer: {
    borderRadius: 2,
    padding: 10,
    width: width * 0.8,
    marginTop: 20,
  },

  imageBackgroundLayer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  mapsLayerHybrid: {
    // backgroundColor: '#2196F3',

    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // flexDirection: 'row',
  },
});
