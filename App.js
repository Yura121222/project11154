import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, Button } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";

const ZOOM_LEVEL = 15;
const ANIMATION_DURATION = 2000;

export default function App() {
  const mapRef = useRef(null);
  const [address, setAddress] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [marker, setMarker] = useState(null);
  const [error, setError] = useState("");

  const animateMapToCoordinates = (coordinates) => {
    if (!mapRef.current || !coordinates) {
      return;
    }

    mapRef.current.animateCamera(
      {
        center: coordinates,
        zoom: ZOOM_LEVEL,
      },
      {
        duration: ANIMATION_DURATION,
      }
    );
  };

  useEffect(() => {
    let isMounted = true;

    const loadUserLocation = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        if (isMounted) {
          setError("Permission to access location was denied");
        }
        return;
      }

      try {
        const position = await Location.getCurrentPositionAsync({});
        const currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        if (isMounted) {
          setUserLocation(currentLocation);
          animateMapToCoordinates(currentLocation);
        }
      } catch (e) {
        if (isMounted) {
          setError("Permission to access location was denied");
        }
      }
    };

    loadUserLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddMarker = async () => {
    if (!address.trim()) {
      setError("Address not found");
      return;
    }

    try {
      const geocodedAddresses = await Location.geocodeAsync(address);

      if (!geocodedAddresses || geocodedAddresses.length === 0) {
        setError("Address not found");
        return;
      }

      const newMarker = {
        latitude: geocodedAddresses[0].latitude,
        longitude: geocodedAddresses[0].longitude,
      };

      setMarker(newMarker);
      setError("");
      animateMapToCoordinates(newMarker);
    } catch (e) {
      setError("Address not found");
    }
  };

  const handleCenterMarker = () => {
    if (marker) {
      animateMapToCoordinates(marker);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation={Boolean(userLocation)}
        showsMyLocationButton={Boolean(userLocation)}
      >
        {userLocation && marker && (
          <Polyline coordinates={[userLocation, marker]} strokeWidth={3} />
        )}
        {marker && <Marker coordinate={marker} />}
      </MapView>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter the address"
          value={address}
          onChangeText={setAddress}
        />

        <View style={styles.buttonContainer}>
          <Button title="Add marker" onPress={handleAddMarker} />
          {marker && (
            <Button title="Center the marker" onPress={handleCenterMarker} />
          )}
        </View>
      </View>

      {error ? <Text>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#f5f5f5",
  },
  map: {
    flex: 1,
    width: "100%",
  },
  formContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  input: {
    width: "100%",
    height: 40,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
  },
});

