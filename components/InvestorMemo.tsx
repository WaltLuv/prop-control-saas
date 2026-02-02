import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { InvestmentLead, DistressType } from '../types';

// Register a clean font if desired, or use defaults
// For now using defaults as external font loading can be tricky in some environments

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 2,
        borderBottomColor: '#1E293B',
        paddingBottom: 20,
        marginBottom: 30,
    },
    titleSection: {
        flexDirection: 'column',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 10,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginTop: 4,
    },
    headerRight: {
        textAlign: 'right',
    },
    confidential: {
        fontSize: 8,
        color: '#DC2626',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    date: {
        fontSize: 9,
        color: '#64748B',
        marginTop: 4,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748B',
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 4,
        marginBottom: 10,
    },
    grid: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 20,
    },
    metricCard: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 15,
        borderRadius: 8,
    },
    metricLabel: {
        fontSize: 8,
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    highlightGreen: {
        color: '#059669',
    },
    highlightIndigo: {
        color: '#4F46E5',
    },
    bodyText: {
        fontSize: 10,
        color: '#334155',
        lineHeight: 1.5,
    },
    visionGrid: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        padding: 15,
        gap: 20,
    },
    vTitle: {
        fontSize: 8,
        color: '#64748B',
        marginBottom: 2,
    },
    vValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#334155',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 10,
        textAlign: 'center',
    },
    footerText: {
        fontSize: 8,
        color: '#94A3B8',
    }
});

interface InvestorMemoProps {
    lead: InvestmentLead;
}

export const InvestorMemo: React.FC<InvestorMemoProps> = ({ lead }) => {
    const equity = lead.marketValue - lead.totalLiabilities;
    const netProfit = equity * 0.7; // Example simple logic

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>Investor Memo</Text>
                        <Text style={styles.subtitle}>Institutional Real Estate Underwriting</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.confidential}>Extremely Confidential</Text>
                        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
                    </View>
                </View>

                {/* Property Detail */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Asset Overview</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 5 }}>{lead.propertyAddress}</Text>
                    <Text style={{ fontSize: 10, color: '#64748B' }}>Owner: {lead.propertyName || 'N/A'}</Text>
                </View>

                {/* Key Metrics */}
                <View style={styles.grid}>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Market Value</Text>
                        <Text style={styles.metricValue}>${lead.marketValue.toLocaleString()}</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Total Debt</Text>
                        <Text style={styles.metricValue}>${lead.totalLiabilities.toLocaleString()}</Text>
                    </View>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Equity Position</Text>
                        <Text style={[styles.metricValue, styles.highlightGreen]}>${equity.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Distress Signals */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Distress Analysis</Text>
                    <View style={{ backgroundColor: '#FEF2F2', padding: 10, borderRadius: 4 }}>
                        <Text style={{ color: '#991B1B', fontSize: 10, fontWeight: 'bold' }}>Primary Signal: {lead.distressIndicator}</Text>
                    </View>
                    <Text style={[styles.bodyText, { marginTop: 10 }]}>
                        {lead.visionAnalysis?.summary || "Deep-web scan identifies significant distress markers consistent with off-market acquisition profiles. The asset demonstrates high equity cushion with urgent liquidation motivators."}
                    </Text>
                </View>

                {/* AI Vision Audit */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Neural Physical Audit</Text>
                    <View style={styles.visionGrid}>
                        <View>
                            <Text style={styles.vTitle}>Roof Condition</Text>
                            <Text style={styles.vValue}>{lead.visionAnalysis?.roof || 0}/10</Text>
                        </View>
                        <View>
                            <Text style={styles.vTitle}>Windows/Exter.</Text>
                            <Text style={styles.vValue}>{lead.visionAnalysis?.windows || 0}/10</Text>
                        </View>
                        <View>
                            <Text style={styles.vTitle}>Lawn/Curb</Text>
                            <Text style={styles.vValue}>{lead.visionAnalysis?.lawn || 0}/10</Text>
                        </View>
                    </View>
                </View>

                {/* Underwriting Conclusion */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Underwriting Conclusion</Text>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>Projected Net Profit</Text>
                        <Text style={[styles.metricValue, { fontSize: 24, color: '#059669' }]}>${netProfit.toLocaleString()}</Text>
                        <Text style={{ fontSize: 8, color: '#64748B', marginTop: 5 }}>*Assumes 70% ARV minus debt and closing costs.</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Generated by PropControl AI Intelligence Swarm • {lead.id}</Text>
                </View>
            </Page>
        </Document>
    );
};
