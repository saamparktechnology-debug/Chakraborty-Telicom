import { SafeAreaView } from "react-native-safe-area-context";
import { useLogin } from "./hooks/useLogin";
import { ServerUrlModal } from "./components/ServerUrlModal";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginFeatureScreen() {
  const {
    mode,
    switchMode,
    handleLogin,
    handleRequestResetOtp,
    handleConfirmResetPassword,
    loading,
    error,
    successMessage,
    generatedOtpHint,
    setError,
  } = useLogin();

  const theme = useAuthStore((s) => s.theme);
  const toggleTheme = useAuthStore((s) => s.toggleTheme);
  const apiBaseUrl = useAuthStore((s) => s.apiBaseUrl);
  const isDark = theme === "dark";

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Reset Password fields
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [serverModalOpen, setServerModalOpen] = useState(false);

  const onResetSubmit = async () => {
    const ok = await handleConfirmResetPassword(
      phone,
      otp,
      newPassword,
      confirmPassword,
    );
    if (ok) {
      setPassword(newPassword);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const bgInput = isDark ? "#0F172A" : "#F8FAFC";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";
  const borderCol = isDark ? "#334155" : "#CBD5E1";

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }]}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar */}
          {/* <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => setServerModalOpen(true)}
              style={[
                styles.serverPill,
                {
                  backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                  borderColor: isDark ? "#334155" : "#E2E8F0",
                },
              ]}
            >
              <View style={styles.dot} />
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: isDark ? "#CBD5E1" : "#475569",
                  maxWidth: 210,
                }}
              >
                API: {apiBaseUrl}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "800",
                  color: "#E11D48",
                  marginLeft: 4,
                }}
              >
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleTheme}
              style={[
                styles.themeBtn,
                {
                  backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                  borderColor: isDark ? "#334155" : "#E2E8F0",
                },
              ]}
            >
              <Text
                style={{ fontSize: 12, fontWeight: "700", color: textPrimary }}
              >
                {isDark ? "☀️ Light" : "🌙 Dark"}
              </Text>
            </TouchableOpacity>
          </View> */}

          {/* Brand Header */}
          <View style={styles.brandBox}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>AMUL</Text>
            </View>
            <Text style={[styles.title, { color: textPrimary }]}>
              Amul Party Distribution
            </Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>
              Unified Field DSE, Retailer B2B Khata &amp; Household Milk
              Subscription App
            </Text>
          </View>

          {/* Auth Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                borderColor: isDark ? "#334155" : "#E2E8F0",
              },
            ]}
          >
            {mode === "LOGIN" && (
              <>
                <Text style={[styles.cardHeading, { color: textPrimary }]}>
                  Sign in to your account
                </Text>

                {error ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {successMessage ? (
                  <View style={styles.successBanner}>
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                ) : null}

                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: isDark ? "#CBD5E1" : "#334155" },
                    ]}
                  >
                    10-Digit Mobile Number
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={(t) => {
                      setError(null);
                      setPhone(t.replace(/[^0-9]/g, "").slice(0, 10));
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholder="Enter registered mobile number"
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.input,
                      {
                        backgroundColor: bgInput,
                        color: textPrimary,
                        borderColor: borderCol,
                      },
                    ]}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text
                      style={[
                        styles.label,
                        {
                          color: isDark ? "#CBD5E1" : "#334155",
                          marginBottom: 0,
                        },
                      ]}
                    >
                      Password
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: "#E11D48",
                        }}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    value={password}
                    onChangeText={(t) => {
                      setError(null);
                      setPassword(t);
                    }}
                    secureTextEntry={!showPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.input,
                      {
                        backgroundColor: bgInput,
                        color: textPrimary,
                        borderColor: borderCol,
                      },
                    ]}
                  />
                </View>

                <View style={styles.forgotRow}>
                  <TouchableOpacity
                    onPress={() => switchMode("FORGOT_REQUEST")}
                  >
                    <Text style={styles.forgotLinkText}>
                      Forgot Password? Reset via OTP
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => handleLogin(phone, password)}
                  disabled={loading}
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      Sign In &amp; Continue
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {mode === "FORGOT_REQUEST" && (
              <>
                <Text style={[styles.cardHeading, { color: textPrimary }]}>
                  Reset Forgotten Password
                </Text>
                <Text
                  style={{
                    fontSize: 12.5,
                    color: textSecondary,
                    marginBottom: 16,
                    lineHeight: 18,
                  }}
                >
                  Enter your registered 10-digit mobile number to generate a
                  6-digit verification OTP.
                </Text>

                {error ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: isDark ? "#CBD5E1" : "#334155" },
                    ]}
                  >
                    Registered 10-Digit Mobile Number
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={(t) => {
                      setError(null);
                      setPhone(t.replace(/[^0-9]/g, "").slice(0, 10));
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholder="e.g. 9999999991"
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.input,
                      {
                        backgroundColor: bgInput,
                        color: textPrimary,
                        borderColor: borderCol,
                      },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => handleRequestResetOtp(phone)}
                  disabled={loading}
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      Send 6-Digit Verification OTP
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => switchMode("LOGIN")}
                  style={styles.secondaryBtn}
                >
                  <Text
                    style={[styles.secondaryBtnText, { color: textSecondary }]}
                  >
                    &larr; Back to Sign In
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {mode === "RESET_CONFIRM" && (
              <>
                <Text style={[styles.cardHeading, { color: textPrimary }]}>
                  Verify OTP &amp; Set New Password
                </Text>

                {error ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {successMessage ? (
                  <View style={styles.successBanner}>
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                ) : null}

                {generatedOtpHint ? (
                  <View style={styles.otpHintBanner}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.otpHintTitle}>
                        DEV / SANDBOX 6-DIGIT OTP
                      </Text>
                      <Text style={styles.otpHintCode}>{generatedOtpHint}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setOtp(generatedOtpHint)}
                      style={styles.autoFillOtpBtn}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: "800",
                        }}
                      >
                        Auto-Fill OTP
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: isDark ? "#CBD5E1" : "#334155" },
                    ]}
                  >
                    6-Digit OTP Code
                  </Text>
                  <TextInput
                    value={otp}
                    onChangeText={(t) => {
                      setError(null);
                      setOtp(t.replace(/[^0-9]/g, "").slice(0, 6));
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.input,
                      {
                        backgroundColor: bgInput,
                        color: textPrimary,
                        borderColor: borderCol,
                        letterSpacing: 4,
                        fontWeight: "800",
                      },
                    ]}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: isDark ? "#CBD5E1" : "#334155" },
                    ]}
                  >
                    New Password (min 6 characters)
                  </Text>
                  <TextInput
                    value={newPassword}
                    onChangeText={(t) => {
                      setError(null);
                      setNewPassword(t);
                    }}
                    secureTextEntry={!showPassword}
                    placeholder="Enter new password"
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.input,
                      {
                        backgroundColor: bgInput,
                        color: textPrimary,
                        borderColor: borderCol,
                      },
                    ]}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: isDark ? "#CBD5E1" : "#334155" },
                    ]}
                  >
                    Confirm New Password
                  </Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setError(null);
                      setConfirmPassword(t);
                    }}
                    secureTextEntry={!showPassword}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.input,
                      {
                        backgroundColor: bgInput,
                        color: textPrimary,
                        borderColor: borderCol,
                      },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  onPress={onResetSubmit}
                  disabled={loading}
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      Verify OTP &amp; Save New Password
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => switchMode("LOGIN")}
                  style={styles.secondaryBtn}
                >
                  <Text
                    style={[styles.secondaryBtnText, { color: textSecondary }]}
                  >
                    &larr; Cancel &amp; Return to Sign In
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Role Routing Info */}
            <View
              style={[
                styles.roleInfoBox,
                {
                  backgroundColor: bgInput,
                  borderColor: isDark ? "#334155" : "#E2E8F0",
                },
              ]}
            >
              <Text
                style={[
                  styles.roleInfoTitle,
                  { color: isDark ? "#CBD5E1" : "#334155" },
                ]}
              >
                Automatic Role Routing
              </Text>
              <Text style={[styles.roleInfoDesc, { color: textSecondary }]}>
                • DSE Staff → Beat Indent, Instant Split Billing, Khata
                Collection &amp; Onboarding
              </Text>
              <Text style={[styles.roleInfoDesc, { color: textSecondary }]}>
                • Retailer → Live Khata Passbook, Amul B2B Price List &amp; PDF
                Invoices
              </Text>
              <Text style={[styles.roleInfoDesc, { color: textSecondary }]}>
                • Customer → Prepaid Wallet, &ldquo;Not Needed&rdquo; Skip
                Calendar &amp; Monthly Bills
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ServerUrlModal
        visible={serverModalOpen}
        onClose={() => setServerModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 100 : 60,
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  serverPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  themeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  brandBox: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoBadge: {
    backgroundColor: "#E11D48",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 12,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  card: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 12.5,
    fontWeight: "700",
  },
  successBanner: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  successText: {
    color: "#047857",
    fontSize: 12.5,
    fontWeight: "800",
  },
  otpHintBanner: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  otpHintTitle: {
    color: "#1E40AF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  otpHintCode: {
    color: "#1E3A8A",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 3,
    marginTop: 2,
  },
  autoFillOtpBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: "600",
  },
  forgotRow: {
    alignItems: "flex-end",
    marginBottom: 14,
  },
  forgotLinkText: {
    color: "#E11D48",
    fontSize: 12.5,
    fontWeight: "800",
  },
  submitBtn: {
    backgroundColor: "#E11D48",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  roleInfoBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  roleInfoTitle: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
  },
  roleInfoDesc: {
    fontSize: 11.5,
    lineHeight: 18,
  },
});
