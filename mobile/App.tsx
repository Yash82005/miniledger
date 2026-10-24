import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import { sendOtp, verifyOtp } from "./src/api";
import Dashboard from "./src/Dashboard";

export default function App() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");

  async function handleSendOtp() {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert("Invalid phone", "Enter a valid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);

      await sendOtp(phone);

      setOtpSent(true);

      Alert.alert(
        "OTP Sent",
        "Check your backend PowerShell terminal for the OTP."
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!/^\d{6}$/.test(otp)) {
      Alert.alert("Invalid OTP", "Enter the 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      const result = await verifyOtp(phone, otp);

      setToken(result.token);

      Alert.alert("Success", "Login successful!");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Verification failed"
      );
    } finally {
      setLoading(false);
    }
  }

  if (token) {
  return <Dashboard token={token} onLogout={() => setToken("")} />;
}

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MiniLedger</Text>

      <Text style={styles.subtitle}>
        Track money lent to friends
      </Text>

      <View style={styles.card}>
        <Text style={styles.heading}>Phone Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter 10-digit phone number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={10}
          editable={!otpSent}
        />

        {otpSent && (
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit OTP"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={6}
          />
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={otpSent ? handleVerifyOtp : handleSendOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {otpSent ? "Verify OTP" : "Send OTP"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        Demo authentication using a mock OTP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    padding: 24,
    paddingTop: 90,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#172554",
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 8,
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    elevation: 3,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#172554",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  success: {
    fontSize: 22,
    fontWeight: "700",
    color: "#15803D",
    marginTop: 30,
  },
  note: {
    textAlign: "center",
    color: "#94A3B8",
    marginTop: 25,
  },
});