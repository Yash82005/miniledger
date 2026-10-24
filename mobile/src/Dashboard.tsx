import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import {
  Loan,
  Summary,
  getLoans,
  getSummary,
  addLoan,
  repayLoan,
} from "./api";

type Props = {
  token: string;
  onLogout: () => void;
};

export default function Dashboard({ token, onLogout }: Props) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [friendName, setFriendName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [loanData, summaryData] = await Promise.all([
        getLoans(token),
        getSummary(token),
      ]);

      setLoans(loanData);
      setSummary(summaryData);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to load data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddLoan() {
    if (!friendName.trim() || !amount.trim() || !dueDate.trim()) {
      Alert.alert("Missing details", "Please fill in all fields");
      return;
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      Alert.alert("Invalid amount", "Enter an amount greater than zero");
      return;
    }

    const date = new Date(`${dueDate}T00:00:00Z`);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== dueDate
    ) {
      Alert.alert("Invalid date", "Enter a valid date as YYYY-MM-DD");
      return;
    }

    try {
      setSaving(true);

      await addLoan(token, friendName.trim(), Number(amount), dueDate);

      setFriendName("");
      setAmount("");
      setDueDate("");
      setShowForm(false);

      await loadData();

      Alert.alert("Success", "Loan added successfully");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Could not add loan"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRepay(loanId: number) {
    try {
      await repayLoan(token, loanId);
      await loadData();
      Alert.alert("Success", "Loan marked as repaid");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Could not update loan"
      );
    }
  }

  function formatAmount(value: string | number) {
    return `₹${Number(value).toLocaleString("en-IN")}`;
  }

  function formatDate(value: string) {
    // The API currently serializes PostgreSQL DATE as a UTC timestamp.
    // Format using UTC to avoid a timezone-dependent date shift.
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text>Loading your loans...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>MiniLedger</Text>
          <Text style={styles.subtitle}>Your lending dashboard</Text>
        </View>

        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.label}>Total Lent</Text>
        <Text style={styles.bigAmount}>
          {formatAmount(summary?.total_lent || "0")}
        </Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Repaid</Text>
            <Text style={styles.repaid}>
              {formatAmount(summary?.total_repaid || "0")}
            </Text>
          </View>

          <View>
            <Text style={styles.label}>Overdue</Text>
            <Text style={styles.overdue}>
              {formatAmount(summary?.overdue_amount || "0")}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowForm(!showForm)}
      >
        <Text style={styles.buttonText}>
          {showForm ? "Cancel" : "+ Add New Loan"}
        </Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Add Loan</Text>

          <TextInput
            style={styles.input}
            placeholder="Friend's name"
            value={friendName}
            onChangeText={setFriendName}
            maxLength={100}
          />

          <TextInput
            style={styles.input}
            placeholder="Amount (₹)"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          <TextInput
            style={styles.input}
            placeholder="Due date (YYYY-MM-DD)"
            value={dueDate}
            onChangeText={setDueDate}
          />

          <TouchableOpacity
            style={[styles.addButton, saving && styles.disabled]}
            onPress={handleAddLoan}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving ? "Saving..." : "Save Loan"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Your Loans ({loans.length})</Text>

      {loans.length === 0 ? (
        <Text style={styles.empty}>No loans yet. Add your first loan!</Text>
      ) : (
        loans.map((loan) => (
          <View
            key={loan.id}
            style={[
              styles.loanCard,
              loan.is_overdue && styles.overdueCard,
            ]}
          >
            <View style={styles.row}>
              <View style={styles.loanInfo}>
                <Text style={styles.friend}>{loan.friend_name}</Text>
                <Text style={styles.due}>
                  Due: {formatDate(loan.due_date)}
                </Text>
              </View>

              <View style={styles.right}>
                <Text style={styles.loanAmount}>
                  {formatAmount(loan.amount)}
                </Text>

                <Text
                  style={
                    loan.is_repaid
                      ? styles.paidTag
                      : loan.is_overdue
                        ? styles.overdueTag
                        : styles.pendingTag
                  }
                >
                  {loan.is_repaid
                    ? "REPAID"
                    : loan.is_overdue
                      ? "OVERDUE"
                      : "PENDING"}
                </Text>
              </View>
            </View>

            {!loan.is_repaid && (
              <TouchableOpacity
                style={styles.repayButton}
                onPress={() => handleRepay(loan.id)}
              >
                <Text style={styles.repayText}>Mark as Repaid</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB" },
  content: { padding: 20, paddingTop: 65, paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  title: { fontSize: 30, fontWeight: "800", color: "#172554" },
  subtitle: { color: "#64748B", marginTop: 5 },
  logout: { color: "#DC2626", fontWeight: "700" },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 18,
    marginBottom: 20,
    elevation: 3,
  },
  label: { color: "#64748B", fontSize: 14 },
  bigAmount: {
    fontSize: 34,
    fontWeight: "800",
    color: "#172554",
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 18,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  repaid: {
    color: "#15803D",
    fontSize: 19,
    fontWeight: "700",
    marginTop: 5,
  },
  overdue: {
    color: "#DC2626",
    fontSize: 19,
    fontWeight: "700",
    marginTop: 5,
  },
  addButton: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 22,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  form: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 13,
    marginBottom: 12,
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#172554",
    marginBottom: 15,
  },
  loanCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#CBD5E1",
  },
  overdueCard: { borderLeftColor: "#DC2626" },
  loanInfo: { flex: 1 },
  friend: { fontSize: 17, fontWeight: "700", color: "#172554" },
  due: { color: "#64748B", fontSize: 13, marginTop: 6 },
  right: { alignItems: "flex-end" },
  loanAmount: { fontSize: 17, fontWeight: "700", color: "#172554" },
  overdueTag: { color: "#DC2626", fontSize: 11, fontWeight: "800", marginTop: 6 },
  paidTag: { color: "#15803D", fontSize: 11, fontWeight: "800", marginTop: 6 },
  pendingTag: { color: "#D97706", fontSize: 11, fontWeight: "800", marginTop: 6 },
  repayButton: {
    backgroundColor: "#DCFCE7",
    padding: 11,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  repayText: { color: "#15803D", fontWeight: "700" },
  empty: { color: "#64748B", textAlign: "center", marginTop: 20 },
  disabled: { opacity: 0.6 },
});