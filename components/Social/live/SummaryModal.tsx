import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SummaryModalProps {
  visible: boolean;
  dark: boolean;
  duration: string;
  onProceed: () => void;
  onClose: () => void;
}

export default function SummaryModal({ 
  visible, 
  dark, 
  duration, 
  onProceed, 
  onClose 
}: SummaryModalProps) {
  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      style={styles.modal}
      transparent={true}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: dark ? '#181818' : '#FFFFFF' }]}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="videocam" size={32} color="#FFFFFF" />
          </View>
          
          <Text style={[styles.title, { color: dark ? '#FFFFFF' : '#000000' }]}>
            You are about to go live, view your summary
          </Text>
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: dark ? '#FFFFFF' : '#000000' }]}>
                Duration
              </Text>
              <Text style={[styles.summaryValue, { color: dark ? '#AAAAAA' : '#666666' }]}>
                1hr
              </Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: dark ? '#333333' : '#EEEEEE' }]} />
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: dark ? '#FFFFFF' : '#000000' }]}>
                Cost
              </Text>
              <Text style={[styles.summaryValue, { color: dark ? '#AAAAAA' : '#666666' }]}>
                30GP/min
              </Text>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.proceedButton} onPress={onProceed}>
              <Text style={styles.proceedButtonText}>Proceed</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: dark ? '#333333' : '#EEEEEE' }]} 
              onPress={onClose}
            >
              <Text style={[styles.closeButtonText, { color: dark ? '#FFFFFF' : '#666666' }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* <LinearGradient
          colors={['#8B0000', '#4B0082']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.costBanner}
        >
          <Text style={styles.costBannerText}>
            Live streaming will incure a cost of
          </Text>
          <Text style={styles.costBannerAmount}>100 GC/Hour</Text>
        </LinearGradient> */}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex:1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    marginVertical: 20,
  },
  overlay: {
    width: '100%',
    flex:1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width:"100%",
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00AA00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  summaryContainer: {
    width: '100%',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
  },
  divider: {
    height: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  proceedButton: {
    flex: 1,
    backgroundColor: '#FF0000',
    borderRadius: 15,
    paddingVertical: 8,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    flex: 1,
    borderRadius: 15,
    paddingVertical: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  costBanner: {
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  costBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 5,
  },
  costBannerAmount: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});