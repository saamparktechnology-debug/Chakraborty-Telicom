import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/useAuthStore";
import { mobileApiRequest, getErrorMessage } from "../lib/api";

interface AppHeaderProps {
  roleBadge?: string;
  subtitle?: string;
}

export function AppHeader({ roleBadge, subtitle }: AppHeaderProps) {
  const router = useRouter();
  const { user, theme, toggleTheme, clearSession } = useAuthStore();
  const isDark = theme === "dark";

  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await mobileApiRequest("/auth/logout", { method: "POST" });
    } catch {
      // ignore network error on logout
    } finally {
      await clearSession();
      router.replace("/(auth)/login");
    }
  };

  const openChangePassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPwdError(null);
    setPwdSuccess(null);
    setPwdModalVisible(true);
  };

  const handleSaveNewPassword = async () => {
    if (!currentPassword) {
      setPwdError("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("New password and confirm password do not match.");
      return;
    }

    setSavingPwd(true);
    setPwdError(null);
    setPwdSuccess(null);
    try {
      await mobileApiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPwdSuccess("Password updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setPwdModalVisible(false);
      }, 1200);
    } catch (err) {
      setPwdError(getErrorMessage(err));
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.leftBox}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>AP</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.roleTag}>
              {roleBadge || (user?.role ? `${user.role} PORTAL` : "AMUL PARTY")}
            </Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.shopName || user?.name || "Amul Party User"}
            </Text>
            {subtitle ? (
              <Text style={styles.subText} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.actionsBox}>
          <TouchableOpacity
            onPress={openChangePassword}
            style={styles.iconBtn}
            accessibilityLabel="Change Password"
          >
            <Text style={styles.iconBtnText}>🔑</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>
              {theme === "dark" ? "☀️" : "🌙"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* In-App Change Password Modal */}
      <Modal
        visible={pwdModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPwdModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                borderColor: isDark ? "#334155" : "#E2E8F0",
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: isDark ? "#F8FAFC" : "#0F172A" },
              ]}
            >
              🔑 Change Account Password
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? "#94A3B8" : "#64748B",
                marginBottom: 12,
              }}
            >
              Signed in as {user?.name} ({user?.phone})
            </Text>

            {pwdError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{pwdError}</Text>
              </View>
            ) : null}

            {pwdSuccess ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{pwdSuccess}</Text>
              </View>
            ) : null}

            <Text
              style={[
                styles.inputLabel,
                { color: isDark ? "#CBD5E1" : "#334155" },
              ]}
            >
              Current Password
            </Text>
            <TextInput
              value={currentPassword}
              onChangeText={(t) => {
                setPwdError(null);
                setCurrentPassword(t);
              }}
              secureTextEntry
              placeholder="Enter current password"
              placeholderTextColor="#94A3B8"
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                  color: isDark ? "#F8FAFC" : "#0F172A",
                  borderColor: isDark ? "#334155" : "#CBD5E1",
                },
              ]}
            />

            <Text
              style={[
                styles.inputLabel,
                { color: isDark ? "#CBD5E1" : "#334155" },
              ]}
            >
              New Password (min 6 chars)
            </Text>
            <TextInput
              value={newPassword}
              onChangeText={(t) => {
                setPwdError(null);
                setNewPassword(t);
              }}
              secureTextEntry
              placeholder="Enter new password"
              placeholderTextColor="#94A3B8"
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                  color: isDark ? "#F8FAFC" : "#0F172A",
                  borderColor: isDark ? "#334155" : "#CBD5E1",
                },
              ]}
            />

            <Text
              style={[
                styles.inputLabel,
                { color: isDark ? "#CBD5E1" : "#334155" },
              ]}
            >
              Confirm New Password
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={(t) => {
                setPwdError(null);
                setConfirmPassword(t);
              }}
              secureTextEntry
              placeholder="Confirm new password"
              placeholderTextColor="#94A3B8"
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                  color: isDark ? "#F8FAFC" : "#0F172A",
                  borderColor: isDark ? "#334155" : "#CBD5E1",
                },
              ]}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setPwdModalVisible(false)}
                style={styles.cancelBtn}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    color: isDark ? "#94A3B8" : "#64748B",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveNewPassword}
                disabled={savingPwd}
                style={[styles.saveBtn, savingPwd && { opacity: 0.7 }]}
              >
                {savingPwd ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontWeight: "800",
                      fontSize: 13,
                    }}
                  >
                    Update Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#1e1b4b",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#312e81",
  },
  leftBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14,
  },
  roleTag: {
    color: "#fda4af",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  userName: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "700",
  },
  subText: {
    color: "#cbd5e1",
    fontSize: 11,
  },
  actionsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    backgroundColor: "#312e81",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4338ca",
  },
  iconBtnText: {
    fontSize: 13,
    color: "#ffffff",
  },
  logoutBtn: {
    backgroundColor: "#e11d48",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  logoutBtnText: {
    color: "#ffffff",
    fontSize: 11.5,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "700",
  },
  successBox: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  successText: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "800",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtn: {
    backgroundColor: "#E11D48",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 130,
    alignItems: "center",
  },
});
